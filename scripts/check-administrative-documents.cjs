// Démarrer dev:check avec NEXT_PUBLIC_DEMO_MODE=true avant ce test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.KONZA_TEST_PLAYWRIGHT || 'playwright');

const origin = process.env.KONZA_TEST_ORIGIN || 'http://localhost:3100';
const output = process.env.KONZA_TEST_DOCUMENT_OUTPUT;
const types = ['LEAVE', 'ABSENCE', 'EXIT_PERMISSION', 'LOAN', 'ADVANCE'];
const { skins } = require('../docs/modeles-documents/skins.json').documentsAdministratifs;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.KONZA_CHROMIUM });
  try {
    const page = await browser.newPage({ viewport: { width: 1510, height: 1350 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept());
    assert.equal((await page.goto(origin + '/parametres/documents/administratifs', {
      timeout: 120_000, waitUntil: 'domcontentloaded',
    }))?.status(), 200);
    const typeControl = page.getByLabel('Type de document');
    const card = id => page.locator(`[data-model-id="${id}"]`);
    const preview = page.getByRole('dialog');
    await card('A_CLASSIQUE').waitFor({ timeout: 90_000 });
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}').companyId), 'demo-company');
    const scripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src).filter(url => url.includes('/_next/')));
    for (const url of scripts) assert.ok((await page.request.get(url)).ok(), url);
    if (output) fs.mkdirSync(output, { recursive: true });

    for (const type of types) {
      await typeControl.selectOption(type);
      assert.equal(await page.getByRole('button', { name: /^Voir le modèle/ }).count(), 6);
      const thumbnails = await page.locator('[data-model-id] img').evaluateAll(images => images.map(image => image.src));
      assert.equal(thumbnails.length, 6);
      for (const url of thumbnails) assert.ok((await page.request.get(url)).ok(), url);
      for (const [design, skin] of Object.entries(skins)) {
        await card(design).click();
        const sheet = preview.locator(`[data-admin-type="${type}"][data-heading="${skin.variants.header}"]`);
        await sheet.waitFor();
        await page.evaluate(() => document.fonts.ready);
        const geometry = await sheet.evaluate(el => ({
          width: el.offsetWidth, height: el.offsetHeight,
          overflow: [...el.querySelectorAll('div, section, th, td, dt, dd')]
            .filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent),
        }));
        assert.ok(Math.abs(geometry.width - 794) < 1, `${type} ${design} width`);
        assert.ok(Math.abs(geometry.height - 1123) <= 1, `${type} ${design} height ${geometry.height}`);
        assert.deepEqual(geometry.overflow, [], `${type} ${design}`);
        await preview.getByRole('button', { name: 'Fermer' }).click();
      }
    }

    await card('D_CARTOUCHE').click();
    await preview.getByRole('button', { name: 'Utiliser ce modèle' }).click();
    await preview.getByText('« Cartouche » est actif pour ce type de demande.').waitFor();
    await preview.getByRole('button', { name: 'Fermer' }).click();
    await typeControl.selectOption('LEAVE');
    await page.getByText('Modèle actif · Modèle d’origine').waitFor();
    await typeControl.selectOption('ADVANCE');
    await page.getByText('Modèle actif · Cartouche').waitFor();
    await card('D_CARTOUCHE').click();
    await preview.getByRole('link', { name: 'Personnaliser' }).click();

    await page.getByLabel('Nom du modèle').fill('Avance personnalisée');
    await page.getByLabel('Fond', { exact: true }).fill('#f2ebde');
    const structure = page.getByRole('complementary', { name: 'Structure de la demande' });
    await structure.getByRole('button', { name: 'En-tête et titre', exact: true }).click();
    await page.getByLabel('Zone précise').selectOption('document.title');
    await page.getByLabel('Trait sous la zone sélectionnée').selectOption('dashed');
    await page.getByLabel('Mot ou texte à souligner').fill('AVANCE');
    assert.equal(await page.locator('[data-admin-type] h1 span').textContent(), 'AVANCE');
    await structure.getByRole('button', { name: 'Ajouter un séparateur' }).click();
    await page.getByLabel('Style du séparateur').selectOption('thick');
    await page.getByRole('button', { name: 'Monter Séparateur' }).click();
    const rule = page.locator('[data-admin-type] section hr');
    assert.ok(await rule.evaluate(el => getComputedStyle(el).borderTopWidth !== '0px'));
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    await page.getByText('Modèle enregistré et actif pour ce type de demande.').waitFor();

    await page.evaluate(() => {
      const prototype = HTMLIFrameElement.prototype;
      const get = Object.getOwnPropertyDescriptor(prototype, 'contentWindow').get;
      Object.defineProperty(prototype, 'contentWindow', { configurable: true, get() {
        const frame = get.call(this);
        if (frame && this.style.left === '-9999px') {
          frame.focus = () => {};
          frame.print = () => { window.printedAdministrative = this.contentDocument.documentElement.outerHTML; };
        }
        return frame;
      } });
    });
    await page.getByRole('button', { name: 'Imprimer l’aperçu' }).click();
    await page.waitForFunction(() => window.printedAdministrative);
    const html = await page.evaluate(() => window.printedAdministrative);
    assert.ok(html.includes('AVANCE') && html.includes('text-decoration-style: dashed') && html.includes('@page { size: A4 portrait; margin: 0; }'));
    if (output) {
      const pdf = await browser.newPage();
      await pdf.route('**/document-print-probe', route => route.fulfill({ contentType: 'text/html', body: html }));
      await pdf.goto(`${origin}/document-print-probe`);
      await pdf.evaluate(() => document.fonts.ready);
      await pdf.pdf({ path: path.join(output, 'administratif-vectoriel.pdf'), preferCSSPageSize: true, printBackground: true });
      await pdf.close();
    }
    await page.getByRole('link', { name: 'Retour aux demandes' }).click();
    await page.getByText('Modèle actif · Avance personnalisée').waitFor();
    await page.getByRole('button', { name: 'Réinitialiser le modèle' }).click();
    await page.getByText('Le modèle d’origine est rétabli pour ce type de demande.').waitFor();
    await page.getByRole('link', { name: 'Partir d’une page blanche' }).click();
    await page.waitForFunction(() => document.querySelector('input[aria-label="Nom du modèle"]')?.value === 'Mon modèle');
    assert.equal(await page.locator('[data-admin-type] .note:visible').count(), 0);
    assert.equal(await page.locator('[data-admin-type] h2').count(), 0);

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(origin + '/parametres/documents/administratifs?type=EXIT_PERMISSION');
    await mobile.getByRole('button', { name: 'Voir le modèle Ticket historique' }).waitFor();
    assert.equal(await mobile.locator('[data-model-id]').count(), 6);
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.close();
    assert.deepEqual(errors, []);
    console.log('Six choix par type, 20 aperçus A4, édition, séparateurs, isolation et impression vérifiés.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
