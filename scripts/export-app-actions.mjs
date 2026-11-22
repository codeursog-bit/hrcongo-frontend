#!/usr/bin/env node
/**
 * Exporte l'inventaire des écrans et de leurs actions (titres, boutons, liens, champs, onglets)
 * pour Sofia, à partir du code source des pages. Aucun texte n'est écrit à la main : relancer ce
 * script après chaque évolution de l'interface, puis copier le JSON dans le back
 * (src/assistant/data/app-actions.json).
 *
 *   node scripts/export-app-actions.mjs > app-actions.json
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES = path.join(ROOT, 'app', '(dashboard)');
const SKIP_ROUTE = /^\/(cabinet|portefeuille|offline|forbidden|success|pricing|rh-blog|avis|suggestions)(\/|$)/;
const SKIP_IMPORT = /(^|\/)components\/(ui|design-system|providers|layout)(\/|$)|\/services\/|\/hooks\//;
const MAX_DEPTH = 3, MAX_FILES = 30;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name === 'page.tsx' ? [p] : [];
  });
const exists = (p) => ['.tsx', '.ts', '/index.tsx'].map((x) => p + x).find((f) => fs.existsSync(f));
function resolveImport(from, spec) {
  if (spec.startsWith('@/')) return exists(path.join(ROOT, spec.slice(2)));
  if (spec.startsWith('.')) return exists(path.resolve(path.dirname(from), spec));
  return null;
}
const clean = (s) =>
  s.replace(/<[^>]*>/g, ' ').replace(/\s*\*$/, '').replace(/\{[^}]*\}/g, ' ').replace(/&nbsp;|&apos;|&#39;/g, ' ').replace(/\s+/g, ' ').trim();
const NOISE = new Set(['Autres pages du module','Navigation du module','Progression du parcours','Rubriques des paramètres','Fermer le message','Fermer','Enregistrer les modifications','Retour']);
const ok = (s) => !NOISE.has(s) && s.length >= 2 && s.length <= 60 && /\p{L}{2}/u.test(s) && !/[=;(){}]/.test(s);

function extract(src, out) {
  const add = (k, v) => { v = clean(v); if (ok(v)) out[k].add(v); };
  for (const m of src.matchAll(/<h[12][^>]*>([\s\S]{1,120}?)<\/h[12]>/g)) add('titles', m[1]);
  for (const m of src.matchAll(/\btitle="([^"{}]{2,80})"/g)) add('titles', m[1]);
  for (const m of src.matchAll(/\btitle='([^'{}]{2,80})'/g)) add('titles', m[1]);
  for (const m of src.matchAll(/<(Button|button|Link|a|IconButton|ActionButton)\b[^>]*>([\s\S]{1,160}?)<\/\1>/g)) add('buttons', m[2]);
  for (const m of src.matchAll(/\baria-label="([^"{}]{2,60})"/g)) add('buttons', m[1]);
  for (const m of src.matchAll(/\baria-label='([^'{}]{2,60})'/g)) add('buttons', m[1]);
  for (const m of src.matchAll(/<(?:label|Label|Input|Field|FancySelect|ModuleSelect|Select|Textarea)\b[^>]*?\blabel=["']([^"'{}]{2,70})["']/g)) add('fields', m[1]);
  for (const m of src.matchAll(/<label[^>]*>([\s\S]{1,80}?)<\/label>/g)) add('fields', m[1]);
  for (const m of src.matchAll(/\blabel:\s*"([^"{}]{2,50})"/g)) add('tabs', m[1]);
  for (const m of src.matchAll(/\blabel:\s*'([^'{}]{2,50})'/g)) add('tabs', m[1]);
}

const result = [];
for (const file of walk(PAGES).sort()) {
  const route = '/' + path.relative(PAGES, path.dirname(file)).split(path.sep).join('/');
  const url = route === '/.' ? '/' : route;
  if (SKIP_ROUTE.test(url)) continue;
  const out = { titles: new Set(), buttons: new Set(), fields: new Set(), tabs: new Set() };
  const seen = new Set(), queue = [[file, 0]];
  while (queue.length && seen.size < MAX_FILES) {
    const [f, d] = queue.shift();
    if (seen.has(f)) continue;
    seen.add(f);
    const src = fs.readFileSync(f, 'utf8');
    extract(src, out);
    if (d >= MAX_DEPTH) continue;
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const r = resolveImport(f, m[1]);
      if (r && !SKIP_IMPORT.test(r.split(path.sep).join('/')) && !seen.has(r)) queue.push([r, d + 1]);
    }
  }
  result.push({
    path: url.replace(/\[([^\]]+)\]/g, ':$1'),
    titles: [...out.titles].slice(0, 6),
    buttons: [...out.buttons].slice(0, 30),
    fields: [...out.fields].slice(0, 30),
    tabs: [...out.tabs].slice(0, 20),
  });
}
process.stdout.write(JSON.stringify(result, null, 1));