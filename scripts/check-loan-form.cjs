const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),file=path.join(root,'app/(dashboard)/loans/nouveau/page.tsx'),source=fs.readFileSync(file,'utf8');
const old=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:app/(dashboard)/loans/nouveau/page.tsx'],{cwd:root,encoding:'utf8'});
const namesToKeep=['FINANCE_ROLES','filteredEmployees','targetEmployee','existingDebt','hasKnownEmployee','projectedTotal','durationMonths','monthlyRepayment','endDate','requestDateObj','requestDateValid','canSubmit','handleSubmit','previewData','standardPreviewData','standardAdvancePreviewData'];
function inspect(text){const sf=ts.createSourceFile('page.tsx',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),o={calls:[],vars:{},documents:[],helpers:{}};function visit(n){
  if(ts.isCallExpression(n)&&/^(api\.(get|post)|useImageUpload)$/.test(n.expression.getText(sf)))o.calls.push(n.getText(sf));
  if(ts.isVariableDeclaration(n)&&namesToKeep.includes(n.name.getText(sf)))o.vars[n.name.getText(sf)]=n.initializer.getText(sf).replace(/\s*toast\([^;]+;/g,'');
  if(ts.isFunctionDeclaration(n)&&n.name?.text==='nextMonthDefault')o.helpers[n.name.text]=n.body.getText(sf);
  if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='DocumentPreviewModal')o.documents.push(n.getText(sf));ts.forEachChild(n,visit);
}visit(sf);return o;}
assert.deepEqual(inspect(source),inspect(old),'API, calculs, validations, permissions ou aperçu protégés modifiés');
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const names=[...source.matchAll(/const \[([^,\]]+),[^\]]+\] = useState/g)].map(m=>m[1]);
let stateIndex=0,overrides={},changes={},formProps,posted=[],fail=false;
Module._load=function(name,parent,...args){if(parent?.filename===file){
  if(name==='react')return {...React,useState(initial){const key=names[stateIndex++];return [key in overrides?overrides[key]:initial,v=>{changes[key]=v;}];},useEffect(){}};
  if(name==='next/navigation')return {useRouter:()=>({push(){}})};
  if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
  if(name==='@/hooks/useImageUpload')return {useImageUpload:()=>({uploadedUrl:'https://example.test/piece.pdf',uploading:false,handleFileSelect(){}})};
  if(name==='@/components/FinanceSubNav')return {__esModule:true,default:()=>null};
  if(name==='@/components/LoanRequestPrintable')return {__esModule:true,default:()=>null};
  if(name==='@/components/documents/RequestDocuments')return {LoanRequestDocument:()=>null,AdvanceRequestDocument:()=>null};
  if(name==='@/components/design-system/feedback')return {...load.call(this,name,parent,...args),useToast:()=>()=>{}};
  if(name==='@/services/api')return {api:{async post(url,body){posted.push({url,body});if(fail)throw Error('Envoi indisponible');return {id:'test'};}}};
  if(name==='@/components/requests'){const actual=load.call(this,name,parent,...args);return {...actual,RequestForm:p=>{formProps=p;return React.createElement(actual.RequestForm,p);}};}
}return load.call(this,name,parent,...args);};
const Page=require(file).default;
const employee={id:'demo-laure',firstName:'Laure',lastName:'Djouma'};
const valid={userRole:'EMPLOYEE',employee,type:'ARGENT',amount:'30000',durationMonthsInput:'3',startDate:'2026-12-01',reason:'Réparation du logement',deductMonth:12,deductYear:2026};
function render(extra={}){stateIndex=0;changes={};formProps=null;overrides={...valid,...extra};return renderToStaticMarkup(React.createElement(Page));}
let html=render();for(const label of ['Quoi','Combien / Quand','Détails','Récapitulatif','Quel est votre besoin ?'])assert.ok(html.includes(label),label);assert.ok(html.includes('novalidate=""'));assert.ok(!html.includes('Pour un employé'));
render({reason:'a'});assert.equal(formProps.nextDisabled,true);
render({userRole:'ADMIN',onBehalf:true,selectedEmployeeId:''});assert.equal(formProps.nextDisabled,true);
html=render({step:1});assert.ok(html.includes('Montant demandé (FCFA)'));assert.ok(html.includes('10 000')||html.includes('10 000'));assert.ok(!html.includes('Invalid Date'));
html=render({step:1,startDate:''});assert.ok(!html.includes('Invalid Date'));
html=render({step:1,type:'AVANCE'});assert.ok(html.includes('Mois de déduction'));assert.ok(!html.includes('Durée (en mois)'));
html=render({step:2,company:{documentTemplate:'STANDARD'}});assert.ok(html.includes('Nature du prêt'));assert.ok(html.includes('Joindre un document')||html.includes('Pièce jointe'));
html=render({step:2,type:'AVANCE'});assert.ok(!html.includes('type="file"'));
html=render({step:3,error:'Serveur indisponible'});assert.ok(html.includes('Envoyer la demande'));assert.ok(html.includes('role="alert"'));
render({step:3,amount:'0'});assert.equal(formProps.submitDisabled,true);
html=render({isDone:true});assert.ok(html.includes('Votre administration va la traiter.'));assert.ok(html.includes('Faire une autre demande'));
html=render({isDone:true,userRole:'ADMIN',onBehalf:true});assert.ok(!html.includes('va la traiter.'));
async function main(){
  render({step:3});await formProps.onSubmit();assert.equal(posted[0].url,'/loans');assert.equal(posted[0].body.monthlyRepayment,10000);assert.equal(posted[0].body.endDate,'2027-03-01');assert.equal(changes.isDone,true);
  render({step:3,type:'AVANCE'});await formProps.onSubmit();assert.equal(posted[1].url,'/loans/advances');assert.equal(posted[1].body.deductMonth,12);assert.ok(!('monthlyRepayment' in posted[1].body));
  render({step:3,userRole:'ADMIN',onBehalf:true,selectedEmployeeId:'demo-sandrine',employeesList:[{id:'demo-sandrine',firstName:'Sandrine'}],recoverViaPayroll:false,company:{documentTemplate:'STANDARD'},nature:'SOCIAL'});await formProps.onSubmit();assert.equal(posted[2].body.employeeId,'demo-sandrine');assert.equal(posted[2].body.recoverViaPayroll,false);assert.equal(posted[2].body.attachmentUrl,'https://example.test/piece.pdf');
  fail=true;render({step:3});await formProps.onSubmit();assert.equal(changes.error,'Envoi indisponible');assert.ok(!changes.isDone);fail=false;
  const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
  const request=(url,method='GET',body={},role='EMPLOYEE')=>demoResponse(new URL('https://demo.test'+url),method,body,store,role);
  const payload={type:'ARGENT',amount:30000,monthlyRepayment:10000,startDate:'2026-12-01',endDate:'2027-03-01',reason:'Besoin personnel'};
  const result=await request('/loans','POST',payload).json();assert.equal(result.status,'PENDING');assert.ok((await request('/loans/me').json()).find(l=>l.id===result.id));
  assert.equal(request('/loans','POST',{...payload,employeeId:'demo-sandrine'}).status,403);
  assert.equal(request('/loans','POST',{...payload,employeeId:'other-company'},'ADMIN').status,404);
  assert.equal(request('/loans','POST',{...payload,amount:0}).status,400);
  const direct=await request('/loans','POST',{...payload,employeeId:'demo-sandrine'},'ADMIN').json();assert.equal(direct.status,'ACTIVE');assert.ok(!(await request('/loans/me').json()).find(l=>l.id===direct.id));
  const advance=await request('/loans/advances','POST',{amount:20000,reason:'Besoin ponctuel',deductMonth:12,deductYear:2026}).json();assert.equal(advance.status,'PENDING');assert.equal((await request('/dashboard/pending-requests-count').json()).advances,2);
  console.log('Nouvelle demande : API, payloads, calculs, droits et aperçu conservés ; quatre étapes, validations, erreurs, succès et créations démo vérifiés.');
}main().catch(e=>{console.error(e);process.exitCode=1;});
