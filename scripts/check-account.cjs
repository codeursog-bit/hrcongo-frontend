const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), Module = require('node:module'), ts = require('typescript');
const root = path.resolve(__dirname, '..'), file = path.join(root, 'app/(dashboard)/mon-profil/page.tsx');
function inspect(text) {
  const sf = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), api = [], blocks = {};
  function visit(n) {
    if (ts.isCallExpression(n) && /^api\.(get|patch|post)$/.test(n.expression.getText(sf))) api.push(n.getText(sf));
    if (ts.isFunctionDeclaration(n) && ['formStateFromEmployee'].includes(n.name?.text)) blocks[n.name.text] = n.body.getText(sf);
    if (ts.isVariableDeclaration(n) && ['EMPTY_FORM','seniority','calculateAge','canEdit','ROLES_WITH_EMPLOYEE_PROFILE','loadProfile','handleSaveProfile','handlePasswordChange','cancelEditing','startEditing'].includes(n.name.getText(sf))) blocks[n.name.getText(sf)] = n.initializer.getText(sf).replace(/\s*toast\([^;]+;/g,'');
    ts.forEachChild(n, visit);
  }
  visit(sf); return JSON.parse(JSON.stringify({api,blocks}).replace(/\\r\\n/g,'\\n'));
}
const old = cp.execFileSync('git', ['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:app/(dashboard)/mon-profil/page.tsx'], {cwd:root,encoding:'utf8'});
assert.deepEqual(inspect(fs.readFileSync(file,'utf8')),inspect(old), 'Profile API, validation, payload, helpers or permissions changed');
const resolve = Module._resolveFilename, load = Module._load;
Module._resolveFilename = function(name,parent,...args) {return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for (const ext of ['.ts','.tsx']) require.extensions[ext] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'), {renderToStaticMarkup}=require('react-dom/server');
let overrides={}, stateIndex=0;
const names=['authUser','employee','isLoading','hasEmployee','isEditing','form','isSaving','saveError','saveSuccess','showPwdModal','pwdForm','pwdError','pwdSuccess','pwdLoading','showCurrent','showNext','showConfirmPwd'];
Module._load=function(name,parent,...args) {
  if (parent?.filename===file) {
    if(name==='react') return {...React,useState(initial){const key=names[stateIndex++];return [key in overrides?overrides[key]:initial,()=>{}];},useEffect(){}};
    if(name==='next/navigation')return {useRouter:()=>({back(){},push(){}})};
    if(name==='@/hooks/useImageUpload')return {useImageUpload:()=>({preview:null,uploadedUrl:null,uploading:false})};
    if(name==='@/components/design-system/feedback')return {...load.call(this,name,parent,...args),useToast:()=>()=>{}};
    if(name==='@/components/PushNotificationBanner')return {PushToggleButton:()=>React.createElement('button',{type:'button'},'Activer les notifications')};
    if(name==='@/components/layout/ThemeControl')return {ThemeControl:()=>React.createElement('span',null,'Clair / Sombre / Auto')};
  }
  return load.call(this,name,parent,...args);
};
const Page=require(file).default;
const authUser={id:'test',firstName:'Laure',lastName:'Djouma',email:'laure@example.test',role:'EMPLOYEE'};
const employee={firstName:'Laure',lastName:'Djouma',selfServiceEnabled:false,status:'ACTIVE',department:{name:'Administration'}};
function render(extra={}) {stateIndex=0;overrides={authUser,employee,isLoading:false,...extra};return renderToStaticMarkup(React.createElement(Page));}
const html=render();
for(const word of ['Mon compte','Coordonnées','Identité &amp; Famille','Préférences','Mes accès','Sécurité du compte','Notifications','/ma-signature','/ma-paie','/parametres/securite'])assert.ok(html.includes(word),word);
assert.match(html,/disabled=""[^>]*>[^<]*<svg[^]*?Modifier mes informations/);
assert.ok(render({employee:null,hasEmployee:false}).includes('Aucune fiche employé associée'));
assert.ok(!render({employee:null,hasEmployee:false}).includes('Employé actif'));
assert.ok(render({isLoading:true}).includes('Chargement de votre compte'));
assert.ok(render({saveError:'Échec de sauvegarde'}).includes('role="alert"'));
assert.ok(render({saveSuccess:true}).includes('Profil mis à jour avec succès'));
const form={phone:'',email:'',address:'',city:'',nationality:'',gender:'FEMALE',maritalStatus:'SINGLE',numberOfChildren:0,bloodType:'',pathology:'',fatherName:'',motherName:'',educationLevel:'',emergencyContactName:'',emergencyContactRelation:'',emergencyContactPhone:'',hasDrivingLicense:false,drivingLicenseNumber:'',foreignLanguages:'',uniformSize:'',shoeSize:'',photoUrl:''};
const edit=render({employee:{...employee,selfServiceEnabled:true},isEditing:true,form});
assert.ok(edit.includes('Enregistrer'));assert.ok(!edit.includes('value="SINGLE"'),'Family status must stay read-only');assert.ok(edit.includes('Choisir une photo de profil'));assert.ok(!edit.includes('undefined'));
async function demo() {
  const {demoResponse,createDemoStore}=require('../lib/demo/transport.ts'), store=createDemoStore();const url=new URL('https://example.test/employees/me');
  const patch=(body)=>demoResponse(url,'PATCH',body,store,'EMPLOYEE');
  assert.equal(patch({maritalStatus:'MARRIED'}).status,400);
  const result=await patch({phone:'+242 06 111 22 33'}).json();assert.equal(result.phone,'+242 06 111 22 33');
  assert.equal((await demoResponse(url,'GET',{},store,'EMPLOYEE').json()).phone,result.phone);
  store.employees[0].selfServiceEnabled=false;assert.equal(patch({phone:'123'}).status,403);
  assert.equal(demoResponse(new URL('https://example.test/auth/change-password'),'POST',{},store,'EMPLOYEE').status,501);
  console.log('Mon compte : API, validations, calculs et droits inchangés ; rendu, états, champs familiaux en lecture seule et démo mutable vérifiés.');
}
demo().catch(e=>{console.error(e);process.exitCode=1;});
