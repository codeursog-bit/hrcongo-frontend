// Exécuter sur dev:check avec NEXT_PUBLIC_DEMO_MODE=true, Chromium et FFmpeg installés.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { execFileSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.env.KONZA_TEST_PLAYWRIGHT || 'playwright');

const output = path.resolve(process.env.KONZA_TOUR_OUTPUT || 'public/aide/modeles-documents');
const origin = new URL(process.env.KONZA_TEST_ORIGIN || 'http://localhost:3100');
const route = new URL('/documents/editeur/PAYSLIP?preset=A_BLEU', origin);
const dimensions = { width: 1280, height: 720 };
const ffmpeg = (args, cwd) => execFileSync(process.env.KONZA_FFMPEG || 'ffmpeg',
  ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit', cwd });

function timestamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const minutes = Math.floor(ms / 60_000);
  return `00:${String(minutes).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

async function capture(browser, scratch, steps) {
  // Charger les scripts avant d’activer la capture, sans utiliser de compte réel.
  const warmup = await browser.newPage({ viewport: dimensions });
  const warmResponse = await warmup.goto(route.href, { timeout: 120_000 });
  assert.ok(warmResponse?.ok());
  await warmup.getByRole('button', { name: 'Aide sur l’éditeur' }).waitFor({ timeout: 90_000 });
  const isDemo = await warmup.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').companyId === 'demo-company');
  await warmup.close();
  assert.ok(isDemo, 'La capture exige le mode démo.');

  const context = await browser.newContext({ viewport: dimensions, recordVideo: { dir: scratch, size: dimensions } });
  await context.addInitScript(() => {
    const quiet = fetch => async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      if (url.pathname.endsWith('/dashboard/pending-requests-count')) {
        return Response.json({ total: 0, leaves: 0, absences: 0, permissions: 0 });
      }
      return fetch.call(window, input, init);
    };
    let fetch = quiet(window.fetch);
    Object.defineProperty(window, 'fetch', { configurable: true, get: () => fetch, set: next => { fetch = quiet(next); } });
  });
  const started = performance.now();
  const page = await context.newPage();
  const video = page.video();
  const elapsed = () => (performance.now() - started) / 1000;
  const moments = new Map();
  try {
    await page.goto(route.href, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.getByRole('button', { name: 'Aide sur l’éditeur' }).click();
    const guide = page.getByRole('complementary', { name: 'Guide du bulletin' });
    await guide.getByRole('button', { name: 'Regarder' }).click();
    for (const step of steps) {
      await guide.locator(`[data-guide-step="${step.id}"]`).waitFor({ timeout: 15_000 });
      moments.set(step.id, elapsed());
    }
    await guide.locator('[data-guide-step="complete"]').waitFor({ timeout: 15_000 });
    moments.set('complete', elapsed());
    await page.waitForTimeout(750);
  } finally {
    await context.close();
  }
  return { moments, video: await video.path() };
}

async function encode(chapter, steps, capture, scratch) {
  const clips = chapter.steps.map(id => {
    const index = steps.findIndex(step => step.id === id);
    const start = capture.moments.get(id);
    const end = capture.moments.get(steps[index + 1]?.id ?? 'complete');
    assert.ok(end - start > 0.5, `Étape ${id} trop courte.`);
    return { id, start, duration: end - start, text: steps[index].caption };
  });
  const seconds = clips.reduce((sum, clip) => sum + clip.duration, 0);
  const rate = Math.max(1, 24 / seconds);
  const captions = ['WEBVTT', ''];
  const files = [];
  let cursor = 0;
  for (const { id, start, duration, text } of clips) {
    const name = `${id}.mp4`;
    ffmpeg(['-ss', String(start), '-i', capture.video, '-an', '-vf', `setpts=${rate}*PTS,fps=24`,
      '-t', String(duration * rate), '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      '-preset', 'fast', '-b:v', '650k', '-maxrate', '780k', '-bufsize', '700k', name], scratch);
    files.push(`file '${name}'`);
    captions.push(`${timestamp(cursor)} --> ${timestamp(cursor + duration * rate)}`, text, '');
    cursor += duration * rate;
  }
  assert.ok(cursor >= 20 && cursor <= 60, `Durée hors limites pour ${chapter.id}.`);
  await fs.writeFile(path.join(scratch, 'concat.txt'), files.join('\n') + '\n');
  const mp4 = path.join(scratch, `${chapter.id}.mp4`);
  ffmpeg(['-f', 'concat', '-safe', '1', '-i', 'concat.txt', '-c', 'copy', '-movflags', '+faststart', mp4], scratch);
  assert.ok((await fs.stat(mp4)).size <= 3_000_000, `La vidéo ${chapter.id} dépasse 3 Mo.`);
  ffmpeg(['-ss', '1', '-i', mp4, '-frames:v', '1', '-vf', 'scale=640:-1', '-q:v', '3', `${chapter.id}.jpg`], scratch);
  await fs.writeFile(path.join(scratch, `${chapter.id}.vtt`), captions.join('\n'));
}

(async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(origin.hostname), 'Utilisez le serveur local de démonstration.');
  const source = await fs.readFile(path.join(__dirname, '../lib/document-engine/tour-steps.ts'), 'utf8');
  const exports = {};
  new Function('exports', ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText)(exports);
  const { tourSteps, tourChapters } = exports;
  assert.deepEqual(tourChapters.flatMap(chapter => chapter.steps).sort(), tourSteps.map(step => step.id).sort());
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'konza-tour-'));
  const browser = await chromium.launch({ executablePath: process.env.KONZA_CHROMIUM });
  try {
    const trace = await capture(browser, scratch, tourSteps);
    for (const chapter of tourChapters) await encode(chapter, tourSteps, trace, scratch);
    await fs.mkdir(output, { recursive: true });
    for (const chapter of tourChapters) {
      for (const ext of ['mp4', 'vtt', 'jpg']) {
        const filename = `${chapter.id}.${ext}`;
        await fs.copyFile(path.join(scratch, filename), path.join(output, filename));
      }
    }
    console.log(`${tourChapters.length} chapitres MP4 sous-titrés générés.`);
  } finally {
    await browser.close();
    await fs.rm(scratch, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
