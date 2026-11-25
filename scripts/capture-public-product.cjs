// Captures marketing réelles : exige un serveur local en mode démo, sans écrire de données métier.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.KONZA_TEST_PLAYWRIGHT || 'playwright');
const sharp = require('sharp');
const origin = process.env.KONZA_TEST_ORIGIN || 'http://localhost:3100';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Serveur local requis.');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.KONZA_CHROME ? { executablePath: process.env.KONZA_CHROME } : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1120 },
      deviceScaleFactor: 2,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    const output = path.resolve(__dirname, '../public/images/produit');
    await fs.mkdir(output, { recursive: true });
    for (const [name, route] of [
      ['dashboard', '/dashboard'],
      ['employes', '/employes'],
      ['paie', '/paie'],
      ['bulletin', '/paie/demo-payroll-0'],
    ]) {
      assert.equal((await page.goto(origin + route, { timeout: 120000 })).status(), 200);
      await page.waitForFunction(
        () => JSON.parse(localStorage.getItem('user') || '{}').companyId === 'demo-company',
      );
      await page.waitForTimeout(1200);
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      // Fermer les rappels avec leur commande normale, sans modifier les écrans capturés.
      for (const button of await page.getByRole('button', { name: /^Fermer :/ }).all())
        if (await button.isVisible()) await button.click();
      await page.addStyleTag({ content: 'nextjs-portal {display:none!important}' });
      await page.waitForTimeout(300);
      const image =
        name === 'bulletin'
          ? await page.locator('[data-bulletin-root="true"]').first().screenshot()
          : await page.screenshot();
      await sharp(image)
        .webp({ quality: 88 })
        .toFile(path.join(output, name + '.webp'));
      console.log('Capture démo :', name);
    }
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
