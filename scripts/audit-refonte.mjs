// scripts/audit-refonte.mjs
// Mesure ce qui reste à aligner sur la refonte (lecture seule, aucun fichier de code modifié).
// Usage, depuis la racine du front :
//   node scripts/audit-refonte.mjs            → résumé dans la console
//   node scripts/audit-refonte.mjs --write    → écrit docs/refonte/AUDIT.md
//   node scripts/audit-refonte.mjs --top=60   → plus de lignes par classement
// Ignore : phase 2 (admin, cabinet), documents imprimables / exports officiels, démos et types.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIRS = ['app', 'components', 'hooks', 'lib'];
const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const TOP = Number((args.find((a) => a.startsWith('--top=')) || '--top=30').split('=')[1]) || 30;

// Le fichier legacy-feedback contient exclusivement les rendus antérieurs admin/cabinet.
const PHASE2 = /^app\/admin\/|^app\/\(dashboard\)\/cabinet\/|^components\/(admin|cabinet)\/|CabinetSidebar|^components\/providers\/legacy-feedback\.tsx$/;
const DOCUMENTS = /Printable|Bulletin(Display|Renderer)|CanvasRenderer|FactureRenderer|components\/documents\/|-print\.ts|bulletin-templates|document-template|payroll-journal-pdf|FicheEmployePdf|ExportDialog|lib\/demo\/|lib\/data\/.*demo|\/types\//;
const PUBLIC = /^app\/(page\.tsx|docs|blog|tarifs|contact|qui-sommes-nous|outils|simulateur|cgu|privacy|auth|register|entreprises|jobs|kiosk|ecran|verify|affiliate|inscription-portefeuille|companies|not-found|error)/;

const PALETTE = /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow)-(?:emerald|slate|gray|zinc|neutral|stone|amber|indigo|blue|red|green|violet|purple|sky|teal|orange|yellow|rose|pink|cyan|lime|fuchsia)-\d{2,3}\b/g;
const HEX = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Fa-f])/g;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}]\uFE0F?/gu;
const PATTERNS = {
  'dégradés': /bg-gradient-to-|linear-gradient\(|radial-gradient\(/g,
  'pulse / ping': /animate-(?:pulse|ping|bounce)/g,
  'flou / verre': /\bblur-(?:sm|md|lg|xl|2xl|3xl)|backdrop-blur/g,
  'ombres colorées': /shadow-\[0_[^\]]*(?:#|rgba)/g,
  'texte dégradé': /bg-clip-text/g,
};

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
const count = (re, s) => (s.match(re) || []).length;

const rows = [];
for (const d of DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (PHASE2.test(rel) || DOCUMENTS.test(rel)) continue;
    const s = strip(fs.readFileSync(file, 'utf8'));
    const r = { f: rel, palette: count(PALETTE, s), hex: count(HEX, s), emojis: count(EMOJI, s) };
    for (const [k, re] of Object.entries(PATTERNS)) r[k] = count(re, s);
    rows.push(r);
  }
}

const zone = (f) => PUBLIC.test(f) ? 'pages publiques' : f.startsWith('app/pme') ? 'espace PME' : f.includes('portefeuille') ? 'portefeuille' : f.startsWith('app/(dashboard)') ? 'dashboard' : 'composants, hooks, lib';
const keys = ['palette', 'hex', 'emojis', ...Object.keys(PATTERNS)];
const zones = {};
for (const r of rows) {
  const z = (zones[zone(r.f)] ||= { fichiers: 0 });
  z.fichiers++;
  for (const k of keys) z[k] = (z[k] || 0) + r[k];
}
const total = Object.fromEntries(keys.map((k) => [k, rows.reduce((s, r) => s + r[k], 0)]));
const top = (k) => rows.filter((r) => r[k] > 0).sort((a, b) => b[k] - a[k]).slice(0, TOP);

const md = [];
md.push('# AUDIT DE LA REFONTE (généré)', '');
md.push(`Généré le ${new Date().toISOString().slice(0, 10)} par \`scripts/audit-refonte.mjs\` (lecture seule). Exclus : phase 2 (admin, cabinet), documents imprimables et exports, démos, types. ${rows.length} fichiers analysés.`, '');
md.push('## Totaux', '', '| Mesure | Total | Objectif |', '|---|---|---|');
const goals = { palette: 'tendre vers 0 (tokens)', hex: 'seulement des constantes de marque ou de graphiques', emojis: '0 comme icône (réactions et contenus utilisateur autorisés)', 'dégradés': '0', 'pulse / ping': '0', 'flou / verre': '0', 'ombres colorées': '0', 'texte dégradé': '0' };
for (const k of keys) md.push(`| ${k} | ${total[k]} | ${goals[k] || ''} |`);
md.push('', '## Par zone', '', `| Zone | Fichiers | ${keys.join(' | ')} |`, `|---|---|${keys.map(() => '---').join('|')}|`);
for (const [z, v] of Object.entries(zones)) md.push(`| ${z} | ${v.fichiers} | ${keys.map((k) => v[k] || 0).join(' | ')} |`);
const lists = [['palette', 'Classes de palette Tailwind à convertir en tokens'], ['emojis', 'Emojis à remplacer par des icônes en trait fin'], ['hex', 'Couleurs hexadécimales en dur (dont graphiques)'], ['dégradés', 'Dégradés à supprimer'], ['pulse / ping', 'Animations pulse / ping à supprimer'], ['flou / verre', 'Flou et effets de verre à supprimer']];
for (const [k, title] of lists) {
  md.push('', `## ${title} (top ${TOP})`, '', '| Nombre | Fichier |', '|---|---|');
  for (const r of top(k)) md.push(`| ${r[k]} | \`${r.f}\` |`);
}
const out = md.join('\n') + '\n';
if (WRITE) {
  const target = path.join(ROOT, 'docs', 'refonte', 'AUDIT.md');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, out);
  console.log('Écrit :', path.relative(ROOT, target));
} else {
  console.log(out);
}
console.log('Totaux :', JSON.stringify(total));
