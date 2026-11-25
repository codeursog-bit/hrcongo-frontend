// Démarrer dev:check avec NEXT_PUBLIC_DEMO_MODE=true avant ce test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.env.KONZA_TEST_PLAYWRIGHT || 'playwright');

const origin = process.env.KONZA_TEST_ORIGIN || 'http://localhost:3100';
const route = '/documents/editeur/PAYSLIP?preset=D_BORDEAUX';
const script = fs.readFileSync(path.join(__dirname, '../lib/document-engine/tour-steps.ts'), 'utf8');
const source = { exports: {} };
new Function('exports', ts.transpileModule(script, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText)(source.exports);
const { tourSteps } = source.exports;

const guide = page => page.getByRole('complementary', { name: 'Guide du bulletin' });
const scope = (page, mode) => page.locator(`[data-guide-scope="${mode}"]`);
const target = (page, mode, key) => scope(page, mode).locator(`[data-tour="${key}"]:visible`).first();
const verifyStep = (page, step) => page.locator(`[data-guide-step="${step}"]`).waitFor();

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.guideTest = { actions: [], requests: [], steps: [] };
    const stepObserver = new MutationObserver(() => {
      const step = document.querySelector('[data-guide-step]')?.dataset.guideStep;
      if (step && window.guideTest.steps.at(-1) !== step) window.guideTest.steps.push(step);
    });
    stepObserver.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-guide-step'] });
    document.addEventListener('document-guide-signal', event => {
      window.guideTest.actions.push({
        mode: event.target.closest('[data-guide-scope]')?.dataset.guideScope,
        signal: event.detail,
      });
    });
    const wrap = fetch => async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
      if (/\/document-layouts\/|\/payrolls(?:\/|$)/.test(url.pathname)) window.guideTest.requests.push({ method, path: url.pathname });
      return fetch.call(window, input, init);
    };
    let current = wrap(window.fetch);
    Object.defineProperty(window, 'fetch', { configurable: true, get: () => current, set: fetch => { current = wrap(fetch); } });
  });
  const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  assert.equal(response?.status(), 200);
  await target(page, 'live', 'start').waitFor({ timeout: 90_000 });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').companyId), 'demo-company',
    'Lancez ce test avec NEXT_PUBLIC_DEMO_MODE=true.');
  const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src).filter(url => url.includes('/_next/')));
  for (const script of scripts) assert.ok((await page.request.get(script)).ok(), script);
  return page;
}

function countSignals(stats, mode, required) {
  for (const signal of required) assert.ok(stats.actions.some(action => action.mode === mode && action.signal === signal),
    `Signal absent en mode ${mode} : ${signal}`);
}

async function watch(browser) {
  const page = await open(browser);
  const name = scope(page, 'live').getByLabel('Nom du modèle');
  await name.fill('Brouillon à conserver');
  await page.waitForFunction(() => Object.keys(localStorage).some(key => key.startsWith('konza:document-draft:')
    && localStorage.getItem(key).includes('Brouillon à conserver')));
  await page.getByRole('button', { name: 'Aide sur l’éditeur' }).click();
  await guide(page).getByRole('button', { name: 'Regarder' }).click();
  await guide(page).getByRole('button', { name: 'Pause' }).click();
  await guide(page).getByRole('button', { name: 'À vous' }).click();
  assert.equal(await name.inputValue(), 'Brouillon à conserver');
  await guide(page).getByRole('button', { name: 'Regarder' }).click();
  await guide(page).getByRole('button', { name: 'Pause' }).click();
  await guide(page).getByRole('button', { name: 'Suivant' }).click();
  await verifyStep(page, tourSteps[1].id);
  await guide(page).getByRole('button', { name: 'Précédent' }).click();
  await verifyStep(page, tourSteps[0].id);
  await guide(page).getByLabel('Vitesse').selectOption('2');
  const prior = await guide(page).boundingBox();
  await guide(page).getByRole('button', { name: 'Déplacer le guide' }).press('ArrowUp');
  assert.ok((await guide(page).boundingBox()).y < prior.y);
  await guide(page).getByRole('button', { name: 'Réduire le guide' }).click();
  await guide(page).getByRole('button', { name: 'Agrandir le guide' }).click();
  await scope(page, 'watch').locator('main').waitFor();
  await page.evaluate(() => { window.guideTest.steps = [document.querySelector('[data-guide-step]').dataset.guideStep]; });
  await guide(page).getByRole('button', { name: 'Lecture' }).click();
  const cursor = page.locator('[data-guide-cursor]');
  await cursor.waitFor();
  assert.equal(await cursor.evaluate(element => getComputedStyle(element).transitionDuration), '0s');
  await verifyStep(page, 'complete');
  assert.equal(await scope(page, 'watch').count(), 0);
  assert.equal(await name.inputValue(), 'Brouillon à conserver');
  const stats = await page.evaluate(() => window.guideTest);
  assert.deepEqual(stats.steps, [...tourSteps.map(step => step.id), 'complete']);
  countSignals(stats, 'watch', tourSteps.flatMap(step => step.waitFor));
  assert.ok(!stats.requests.some(({ method, path }) => method !== 'GET' || path.includes('/payrolls')));
  assert.ok(await page.evaluate(() => Object.keys(localStorage).some(key => key.startsWith('konza:document-tour:')
    && localStorage.getItem(key) === '1')));
  await page.close();
}

async function practice(browser) {
  const page = await open(browser);
  const live = key => target(page, 'live', key);
  const actions = {
    start: async () => { await live('start').click(); await live('preset-B_VERT').click(); },
    select: async () => { await live('select-fieldGroup').click(); },
    move: async () => { await live('select-fieldGroup').focus(); await page.keyboard.press('ArrowUp'); },
    rename: async () => {
      await live('document-title').dblclick();
      await live('label-input').fill('BULLETIN DE RECETTE');
      await live('label-input').press('Enter');
    },
    style: async () => {
      await live('title-color').fill('#72395d');
      await verifyStep(page, 'style');
      await live('title-font').selectOption('caladea');
    },
    table: async () => { await live('table-fill').click(); },
    logo: async () => {
      const image = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 60; canvas.height = 20;
        const context = canvas.getContext('2d');
        context.fillStyle = '#157456'; context.fillRect(0, 0, 60, 20);
        return canvas.toDataURL('image/png').split(',')[1];
      });
      await live('logo-import').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
    },
    preview: async () => { await live('real-data').click(); await live('preview-payroll').selectOption({ index: 1 }); },
    save: async () => { await live('save').click(); },
  };
  await page.getByRole('button', { name: 'Aide sur l’éditeur' }).click();
  for (const step of tourSteps) {
    await verifyStep(page, step.id);
    await live(step.target).waitFor();
    await actions[step.id]();
  }
  await verifyStep(page, 'complete');
  const stats = await page.evaluate(() => window.guideTest);
  countSignals(stats, 'live', tourSteps.flatMap(step => step.waitFor));
  assert.ok(stats.requests.some(({ method, path }) => method === 'PUT' && path.endsWith('/document-layouts/PAYSLIP')));
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.KONZA_CHROMIUM });
  try {
    assert.equal(tourSteps.length, 9);
    assert.ok(tourSteps.every(step => step.caption.split(/\s+/).length <= 20));
    await watch(browser);
    await practice(browser);
    console.log('Les neuf étapes passent en démonstration et en pratique, avec mouvements réduits.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
