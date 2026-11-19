const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const storage=new Map();global.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};global.window=new EventTarget();
const {appearanceDemo,companyAppearanceKey,userAppearanceKey}=require('../lib/data/appearance.demo.ts');
const {DEFAULT_COLORS,LIGHT_AMBIANCES,DARK_AMBIANCES,appearanceTokens,contrast,validateColors}=require('../lib/appearance.ts');
const {appearanceBootstrap}=require('../lib/appearance-bootstrap.ts');
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),hex=v=>'#'+v.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('');
function resolved(tokens,key){const value=tokens[key];if(value.startsWith('#'))return value;const m=value.match(/var\(--brand\) ([\d.]+)%, (black|white|var\(--text\))/);assert.ok(m,value);const b=m[2]==='black'?[0,0,0]:m[2]==='white'?[255,255,255]:rgb(tokens['--text']);return hex(rgb(tokens['--brand']).map((v,i)=>v*Number(m[1])/100+b[i]*(1-Number(m[1])/100)));}
assert.equal(contrast('#FFFFFF','#000000'),21);assert.throws(()=>validateColors({...DEFAULT_COLORS,accent:'url(x)'}));
for(const accent of ['#F7874B','#000000','#FFFFFF','#808080','#FF00FF','#0000FF','#00FF00','#E66F68','#248B93'])for(const ambianceLight of Object.keys(LIGHT_AMBIANCES))for(const ambianceDark of Object.keys(DARK_AMBIANCES))for(const dark of [false,true]){
  const t=appearanceTokens({accent,ambianceLight,ambianceDark},dark);
  assert.ok(contrast(t['--text'],t['--surface'])>=4.5);assert.ok(contrast(t['--text-secondary'],t['--surface'])>=4.5);
  assert.ok(contrast(resolved(t,'--action'),t['--on-brand'])>=4.5,'button contrast');assert.ok(contrast(t['--brand'],t['--on-brand-surface'])>=4.5,'hero contrast');assert.ok(contrast(resolved(t,'--focus'),t['--surface'])>=3,'focus contrast');
  for(const key of ['--green','--danger','--mustard','--success-text','--status-neutral-bg'])assert.ok(!(key in t),'semantic colour overridden');
}
async function main(){
  const actor={id:'u1',companyId:'c1',role:'ADMIN'},admin=appearanceDemo(actor),employee=appearanceDemo({...actor,role:'EMPLOYEE'}),other=appearanceDemo({...actor,companyId:'c2',role:'EMPLOYEE'});
  assert.equal((await employee.get()).effective.source,'DEFAULT');await assert.rejects(()=>employee.saveUser({mode:'dark',colors:{...DEFAULT_COLORS,accent:'#248B93'}}),/entreprise/);
  await assert.rejects(()=>employee.saveCompany({colors:null,allowEmployeeCustomization:true}),/admin/);
  const companyColors={...DEFAULT_COLORS,accent:'#507FB9'},personal={...DEFAULT_COLORS,accent:'#976F9B'};
  await admin.saveCompany({colors:companyColors,allowEmployeeCustomization:true});assert.equal((await employee.get()).effective.source,'COMPANY');
  await employee.saveUser({mode:'dark',colors:personal});assert.equal((await employee.get()).effective.source,'USER');assert.equal((await employee.get()).effective.mode,'dark');
  await admin.saveCompany({colors:companyColors,allowEmployeeCustomization:false});assert.equal((await employee.get()).effective.source,'COMPANY');assert.deepEqual((await employee.get()).user.colors,personal);
  assert.equal((await other.get()).effective.source,'DEFAULT');assert.deepEqual((await other.get()).user.colors,personal);
  await admin.saveCompany({colors:companyColors,allowEmployeeCustomization:true});assert.equal((await employee.get()).effective.source,'USER');
  await employee.saveUser({mode:'auto',colors:null});assert.equal((await employee.get()).effective.source,'COMPANY');
  localStorage.setItem('user',JSON.stringify({id:'u1',companyId:'c1'}));
  const cache={userId:'u1',companyId:'c1',companyRaw:localStorage.getItem(companyAppearanceKey('c1')),userRaw:localStorage.getItem(userAppearanceKey('u1')),light:appearanceTokens(companyColors,false),dark:appearanceTokens(companyColors,true)};
  localStorage.setItem('konza:appearance:cache:demo:u1:c1',JSON.stringify(cache));
  function boot(pathname,dark=false){const values={},classes=new Set([dark?'dark':'light']);const element={dataset:{},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:(...c)=>c.forEach(x=>classes.delete(x))},style:{setProperty:(k,v)=>{values[k]=v;}}};vm.runInNewContext(appearanceBootstrap(true),{localStorage,location:{pathname},document:{documentElement:element},window:{matchMedia:()=>({matches:dark})}});return values;}
  assert.equal(boot('/dashboard')['--brand'],companyColors.accent);assert.equal(boot('/pme/c1/dashboard')['--brand'],companyColors.accent);assert.deepEqual(boot('/pme/c2/dashboard'),{});
  for(const route of ['/admin/x','/cabinet/c/dashboard','/portefeuille/dashboard','/auth/login','/kiosk','/design-system'])assert.deepEqual(boot(route),{},route);
  await admin.saveCompany({colors:null,allowEmployeeCustomization:false});assert.deepEqual(boot('/dashboard'),{},'stale policy cache applied');
  const requests=[];global.fetch=async(url,config)=>{requests.push([new URL(url).pathname,config.credentials]);return Response.json(await employee.get());};
  assert.equal((await require('../lib/data/appearance.api.ts').appearanceApi.get()).effective.source,'DEFAULT');
  assert.deepEqual(requests,[['/appearance/me','include']]);
  const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let context,companyScope=false;
  const componentFile=path.join(root,'components/appearance/AppearancePage.tsx');
  Module._load=function(name,parent,...args){if(parent?.filename===componentFile){if(name==='next/navigation')return {usePathname:()=>'/apparence',useSearchParams:()=>new URLSearchParams(companyScope?'scope=company':'')};if(name==='@/components/providers/AppearanceProvider')return {useAppearance:()=>context};if(name==='@/components/layout/ThemeControl')return {ThemeControl:()=>React.createElement('span',null,'Clair Sombre Auto')};if(name==='@/components/design-system/feedback')return {useToast:()=>()=>{}};}return load.call(this,name,parent,...args);};
  const Page=require(componentFile).default;context={available:true,loading:false,error:'',actor:{...actor,role:'EMPLOYEE'},snapshot:await employee.get(),refresh(){}};
  let html=renderToStaticMarkup(React.createElement(Page));assert.ok(html.includes('Les couleurs sont définies par votre entreprise'));assert.ok(!html.includes('Code couleur'));assert.ok(html.includes('Clair Sombre Auto'));
  companyScope=true;context={...context,actor,snapshot:await admin.get()};html=renderToStaticMarkup(React.createElement(Page));assert.ok(html.includes('Autoriser les employés'));assert.ok(html.includes('Code couleur'));assert.ok(html.includes('Aperçu avant enregistrement'));
  context={...context,available:false,snapshot:null};html=renderToStaticMarkup(React.createElement(Page));assert.ok(html.includes('bientôt disponible'));
  console.log('Apparence : contrats, priorité entreprise/utilisateur, verrouillage/réactivation, isolation, contrastes, cache avant hydratation, legacy et écrans vérifiés.');
}main().catch(e=>{console.error(e);process.exitCode=1;});
