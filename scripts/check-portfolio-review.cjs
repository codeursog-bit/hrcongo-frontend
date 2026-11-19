const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { extract } = require('./check-presences-review.cjs');
process.chdir(path.resolve(__dirname, '..'));
const target = 'docs/refonte/controle-portefeuille/mesures.json';
const hash = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
function invariants(file, source) {
  // Display alias only; the original dataKey and its values remain unchanged.
  if (file === 'app/(dashboard)/portefeuille/rapports/page.tsx') source = source.replace('name="Co\u00fbt employeur"', '');
  const result = extract(file, source);
  result.variables = result.variables
    .filter(value => file !== 'app/(dashboard)/portefeuille/mes-entreprises/page.tsx' || !/^(AVATAR_GRADIENTS|gradient)\s*=/.test(value))
    .map(value => value.replace(/["'](<style>|<appearance>)["']/g, "'$1'"));
  return result;
}
if (process.argv.includes('--record')) {
  const baseline = JSON.parse(fs.readFileSync('scripts/.portfolio-review-before.json', 'utf8'));
  const files = {};
  for (const [file, source] of Object.entries(baseline)) {
    const before = invariants(file, source);
    const after = invariants(file, fs.readFileSync(file, 'utf8'));
    files[file] = {};
    for (const key of Object.keys(before)) {
      assert.deepEqual(after[key], before[key], file + ': ' + key);
      files[file][key] = hash(before[key]);
    }
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify({ date: '2026-11-19', files }, null, 2) + '\n');
} else {
  const baseline = JSON.parse(fs.readFileSync(target, 'utf8'));
  for (const [file, checks] of Object.entries(baseline.files)) {
    const current = invariants(file, fs.readFileSync(file, 'utf8'));
    for (const [key, expected] of Object.entries(checks)) assert.equal(hash(current[key]), expected, file + ': ' + key);
  }
}
console.log('Portefeuille : API, effets, etats, calculs, contraintes et documents conserves.');
