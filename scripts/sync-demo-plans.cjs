// Reprendre les fonctionnalités réelles sans copier ni inventer de tarifs.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../../backend/src/subscriptions');
const cache = new Map();
function load(file) {
  if(cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),exports);
  return exports;
}
const {PLANS}=load(path.join(root,'config/plans.config.ts'));
const {catalogLimits}=load(path.join(root,'entitlements.config.ts'));
const plans=Object.fromEntries(['FREE','STARTER','BASIC','PRO','ENTERPRISE'].map(key=>{
  const plan=PLANS[key];
  return [key,{name:plan.name,description:plan.description,currency:plan.currency,popular:!!plan.popular,
    limits:catalogLimits(key),priceMonthly:null,priceYearly:null,isPriceConfigured:false}];
}));
fs.writeFileSync(path.resolve(__dirname,'../lib/demo/subscription-plans.json'),JSON.stringify(plans,null,2)+'\n');
console.log('Catalogue démo synchronisé : fonctionnalités serveur, aucun tarif copié.');
