const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const failures = [];
let count = 0;
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (!text.includes('use client')) continue;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    let expressionSeen = false;
    for (const statement of source.statements) {
      const directive = ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression);
      if (directive && statement.expression.text === 'use client') {
        count++;
        if (expressionSeen) failures.push(path.relative(root, file));
      }
      if (!directive) expressionSeen = true;
    }
  }
}
for (const directory of ['app', 'components', 'hooks', 'lib', 'services', 'src']) scan(path.join(root, directory));
if (failures.length) {
  console.error('La directive "use client" doit précéder les imports :\n' + failures.join('\n'));
  process.exitCode = 1;
} else console.log(`${count} fichiers clients vérifiés : directives correctement placées.`);
