const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), postcss = require('postcss');
const root = path.resolve(__dirname, '..');
const globals = postcss.parse(fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8'));
function tokens(selector) { const values = {}; globals.walkRules(rule => { if (rule.selector === selector) rule.walkDecls(decl => { values[decl.prop] = decl.value; }); }); return values; }
for (const selector of [':root', '.dark']) {
  const values = tokens(selector);
  for (const token of ['--brand-strong', '--brand-soft', '--on-brand', '--action', '--focus']) {
    assert.ok(values[token]?.includes('color-mix(') && values[token].includes('var(--brand)'), `${selector} ${token} must derive locally from brand`);
  }
}
const light = tokens(':root'), dark = tokens('.dark');
for (const [key, value] of Object.entries({ '--green':'#2FBF8F', '--mustard':'#E8B23A', '--danger':'#E5484D', '--success-text':'#157657', '--warning-text':'#86600A', '--danger-text':'#B52B32' })) assert.equal(light[key], value);
for (const [key, value] of Object.entries({ '--success-text':'#69DAB1', '--warning-text':'#EDC96C', '--danger-text':'#FF969B' })) assert.equal(dark[key], value);
for (const file of ['components/design-system/charts.tsx','components/design-system/primitives.tsx']) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/#[\da-f]{6}/i.test(text), `${file}: hardcoded brand`);
}
const css = fs.readFileSync(path.join(root,'components/design-system/design-system.css'),'utf8');
postcss.parse(css);
assert.ok(css.includes('background:var(--action); color:var(--on-brand)'));
assert.ok(css.includes('outline:2px solid var(--focus)'));
// Verify readable button companions for the two shipped defaults, not arbitrary future choices.
const mix=(a,b,p)=>a.map((v,i)=>v*p+b[i]*(1-p));
const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
for (const brand of [[247,135,75],[255,154,98]]) {
  const background=luminance(mix(brand,[0,0,0],.65)),foreground=luminance(mix(brand,[255,255,255],.03));
  assert.ok((foreground+.05)/(background+.05)>=4.5, 'Default button contrast below 4.5:1');
}
console.log('Préparation apparence : variantes et focus dérivés, composants/graphiques sur tokens, statuts fixes, contraste des boutons par défaut vérifié.');
