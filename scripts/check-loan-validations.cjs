const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),file=path.join(root,'app/(dashboard)/loans/validations/page.tsx'),source=fs.readFileSync(file,'utf8');
const old=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:app/(dashboard)/loans/validations/page.tsx'],{cwd:root,encoding:'utf8'});
function inspect(text){const sf=ts.createSourceFile('source.tsx',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out={api:[],vars:{},jsx:[]};function visit(n){
  if(ts.isCallExpression(n)&&/^(api\.(get|post)|fetch|decide|useApprovalDecision|useDocSignatures)$/.test(n.expression.getText(sf)))out.api.push(n.getText(sf));
  if(ts.isVariableDeclaration(n)&&['DRH_ROLES','allRequests','bucket','kpis','departments','byDept','byType','handleDecision','quickDecide','awaitingOpinions','reference','printData','standardLoanData','standardAdvanceData','handleDownloadOrcaXlsx','handlePrintOrcaPdf'].includes(n.name.getText(sf)))out.vars[n.name.getText(sf)]=n.initializer.getText(sf).replace(/\s*toast\([^;]+;/g,'').replace(/\s+/g,' ');
  if(ts.isJsxSelfClosingElement(n)&&['ApprovalPanel','LoanRequestDocument','AdvanceRequestDocument','LoanRequestPrintable'].includes(n.tagName.getText(sf)))out.jsx.push(n.getText(sf));
  if(ts.isJsxElement(n)&&(n.openingElement.tagName.getText(sf)==='DocumentPreviewModal'||n.openingElement.getText(sf).includes('fixed -left-[9999px]')))out.jsx.push(n.getText(sf));
  ts.forEachChild(n,visit);
}visit(sf);return out;}
assert.deepEqual(inspect(source),inspect(old),'API, permissions, décisions, calculs ou documents protégés modifiés');
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const names=[...source.matchAll(/const \[([^,\]]+),[^\]]+\] = useState/g)].map(m=>m[1]);
let stateIndex=0,overrides={},changes={},buttons=[],outcome='DONE',decisionCalls=[],toasts=[];
const {loans,advances}=require('../lib/demo/loans.ts');
Module._load=function(name,parent,...args){if(parent?.filename===file){
  if(name==='react')return {...React,useState(initial){const key=names[stateIndex++];return [key in overrides?overrides[key]:initial,v=>{changes[key]=v;}];},useEffect(){}};
  if(name==='@/services/api')return {api:{async get(endpoint){return endpoint==='/loans'?loans:endpoint==='/loans/advances'?advances:{company:{}};}}};
  if(name==='@/hooks/useApprovalDecision')return {useApprovalDecision:()=>({dialog:null,async decide(kind,id,body){decisionCalls.push({kind,id,body});return {outcome};}})};
  if(name==='@/hooks/useDocSignatures')return {useDocSignatures:()=>[]};
  if(name==='@/components/FinanceSubNav')return {__esModule:true,default:()=>null};
  if(name==='@/components/approvals/ApprovalPanel')return {__esModule:true,default:()=>React.createElement('p',null,'Circuit existant')};
  if(name==='@/components/LoanRequestPrintable')return {__esModule:true,default:()=>null};
  if(name==='@/components/documents/RequestDocuments')return {LoanRequestDocument:()=>null,AdvanceRequestDocument:()=>null};
  if(name==='@/lib/loan-print')return {printLoanDocument(){}};
  if(name==='@/components/design-system/feedback')return {...load.call(this,name,parent,...args),useToast:()=> (...args)=>toasts.push(args)};
  if(name==='@/components/design-system/primitives'){const actual=load.call(this,name,parent,...args);return {...actual,Button:p=>{buttons.push(p);return React.createElement(actual.Button,p);}};}
}return load.call(this,name,parent,...args);};
const Page=require(file).default;
function render(extra={}){stateIndex=0;changes={};buttons=[];toasts=[];overrides={loans,advances,userRole:'ADMIN',isLoading:false,...extra};return renderToStaticMarkup(React.createElement(Page));}
let html=render();for(const label of ['Demandes à traiter','Approuvées','Annulées','Tous les types','Département','300 000','Circuit']) {if(label==='Circuit')continue;assert.ok(html.includes(label),label);}
assert.ok(!html.includes('<button type="button" class="validation-request-open"><button'));
assert.ok(!render({userRole:'EMPLOYEE'}).includes('> Approuver'));
assert.ok(render({isLoading:true}).includes('Chargement des demandes à traiter'));
assert.ok(render({loans:[],advances:[]}).includes('Aucune demande à afficher'));
assert.ok(render({loadError:'Erreur réseau'}).includes('role="alert"'));
html=render({statusFilter:'cancelled'});assert.ok(!html.includes('class="validation-request-open"'));
const selected={kind:'loan',item:loans[1]};html=render({selected});assert.ok(html.includes('role="dialog"'));assert.ok(html.includes('Circuit existant'));assert.ok(html.includes('Traitement de la demande'));
function action(word){const result=buttons.find(b=>String(b.onClick).includes('handleDecision')&&String(b.onClick).includes(word));assert.ok(result,'decision action '+word);return result;}
async function main(){
  render({selected,recoverViaPayroll:false});await action('OUI').onClick();assert.equal(decisionCalls.at(-1).body.decision,'APPROVE');assert.equal(decisionCalls.at(-1).body.recoverViaPayroll,false);assert.equal(changes.selected,null);assert.equal(toasts.at(-1)[0],'success');
  const before=decisionCalls.length;render({selected,rejectMode:true,rejectionReason:''});await action('NON').onClick();assert.equal(decisionCalls.length,before);assert.equal(changes.rejectMode,true);
  render({selected,rejectMode:true,rejectionReason:'Budget indisponible'});await action('NON').onClick();assert.equal(decisionCalls.at(-1).body.rejectionReason,'Budget indisponible');assert.equal(decisionCalls.at(-1).body.decision,'REJECT');
  outcome='WAITING';render({selected});await action('OUI').onClick();assert.ok(!('selected' in changes));assert.equal(typeof changes.panelKey,'function');assert.equal(toasts.at(-1)[0],'info');
  outcome='CANCELLED';render({selected});await action('OUI').onClick();assert.ok(!('selected' in changes));assert.equal(toasts.length,0);
  render({selected,approvalState:{pending:{state:'WAITING_OPINIONS'}}});assert.ok(!buttons.some(b=>String(b.onClick).includes('handleDecision')&&String(b.onClick).includes('OUI')));
  const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
  const request=(url,method='GET',body={},role='ADMIN')=>demoResponse(new URL('https://demo.test'+url),method,body,store,role);
  const base='/approvals/requests/loan/demo-loan-pending';
  assert.equal(request(base+'/decision','POST',{decision:'APPROVE'},'EMPLOYEE').status,403);
  assert.equal(request(base+'/decision','POST',{decision:'REJECT',rejectionReason:''}).status,400);
  assert.equal((await request(base+'/state').json()).circuitActive,false);
  assert.equal((await request(base+'/decision','POST',{decision:'APPROVE',recoverViaPayroll:false,mode:'ASK'}).json()).status,'FINALIZED');
  assert.equal((await request('/loans/me').json()).find(l=>l.id==='demo-loan-pending').recoverViaPayroll,false);
  assert.equal(request(base+'/decision','POST',{decision:'APPROVE'}).status,400);
  const advance='/approvals/requests/advance/demo-advance-1';assert.equal((await request(advance+'/decision','POST',{decision:'REJECT',rejectionReason:'Justificatif manquant'}).json()).request.status,'REJECTED');
  assert.equal(request('/approvals/requests/loan/other-company/decision','POST',{decision:'APPROVE'}).status,404);
  console.log('Validations Prêts : API, calculs, orchestrateur, droits et documents conservés ; accord/refus, mode de remboursement, attente/annulation, filtres et démo vérifiés.');
}main().catch(e=>{console.error(e);process.exitCode=1;});
