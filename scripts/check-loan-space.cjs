const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),file=path.join(root,'app/(dashboard)/loans/mon-espace/page.tsx');
const source=fs.readFileSync(file,'utf8');
const old=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:app/(dashboard)/loans/mon-espace/page.tsx'],{cwd:root,encoding:'utf8'});
const protectedVars=['items','myKpis','myRequestKpis','trendData','printData','standardLoanData','standardAdvanceData','handleDownloadPdf','handleDownloadOrcaXlsx','handlePrintOrcaPdf','handleCancel','reference','PRINT_ID'];
function inspect(text){
  const sf=ts.createSourceFile('source.tsx',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out={calls:[],values:{},documents:[],contact:[],printConditions:[],hidden:[]};
  function visit(n){
    if(ts.isCallExpression(n)&&/^(api\.(get|patch)|fetch|useDocSignatures)$/.test(n.expression.getText(sf)))out.calls.push(n.getText(sf));
    if(ts.isVariableDeclaration(n)&&protectedVars.includes(n.name.getText(sf)))out.values[n.name.getText(sf)]=n.initializer.getText(sf).replace(/\s*toast\([^;]+;/g,'');
    if(ts.isJsxSelfClosingElement(n)&&['LoanRequestPrintable','LoanRequestDocument','AdvanceRequestDocument'].includes(n.tagName.getText(sf)))out.documents.push(n.getText(sf));
    if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(sf)==='ContactAdminButton')out.contact.push(n.attributes.properties.filter(p=>p.name?.getText(sf)!=='className').map(p=>p.getText(sf)));
    if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='DocumentPreviewModal')out.documents.push(n.getText(sf));
    if(ts.isJsxElement(n)&&n.openingElement.getText(sf).includes('fixed -left-[9999px]'))out.hidden.push(n.getText(sf));
    if(ts.isConditionalExpression(n)&&n.condition.getText(sf).includes('printAuthorized'))out.printConditions.push(n.condition.getText(sf));
    if(ts.isBinaryExpression(n)&&n.left.getText(sf).includes('printAuthorized'))out.printConditions.push(n.left.getText(sf));
    ts.forEachChild(n,visit);
  }visit(sf);return out;
}
assert.deepEqual(inspect(source),inspect(old),'API, calculs, documents, exports, contacts ou autorisations modifiés');
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let stateIndex=0,overrides={},filter='pending',currentPage=1,requestsIndex=0;
const names=[...source.matchAll(/const \[([^,\]]+),[^\]]+\] = useState/g)].map(m=>m[1]);
const opinion={functionCode:'RH',label:'Responsable RH',authorName:'Sandrine Mvoula',date:'2026-11-12T10:00:00Z',opinion:'FAVORABLE',signatureUrl:null};
Module._load=function(name,parent,...args){
  if(parent?.filename===file){
    if(name==='react')return {...React,useState(initial){const key=names[stateIndex++];return [key in overrides?overrides[key]:initial,()=>{}];},useEffect(){}};
    if(name==='next/navigation')return {useRouter:()=>({push(){}})};
    if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
    if(name==='@/hooks/useDocSignatures')return {useDocSignatures:()=>[opinion]};
    if(name==='@/components/FinanceSubNav')return {__esModule:true,default:()=>null};
    if(name==='@/components/chat/ContactAdminButton')return {__esModule:true,default:()=>null};
    if(name==='@/components/LoanRequestPrintable')return {__esModule:true,default:()=>null};
    if(name==='@/components/documents/RequestDocuments')return {LoanRequestDocument:()=>null,AdvanceRequestDocument:()=>null};
    if(name==='@/lib/loan-print')return {printLoanDocument(){},downloadLoanDocumentPDF(){}};
    if(name==='@/components/design-system/feedback')return {...load.call(this,name,parent,...args),useToast:()=>()=>{}};
  }
  if(name==='react'&&parent?.filename===path.join(root,'components/requests/index.tsx')){return {...React,useState(initial){return [requestsIndex++===0?filter:currentPage,()=>{}];}};}
  return load.call(this,name,parent,...args);
};
const Page=require(file).default;
const {loans,loanHistory}=require('../lib/demo/loans.ts');
function render(extra={}){stateIndex=0;requestsIndex=0;overrides={isLoading:false,loans,advances:[],...extra};return renderToStaticMarkup(React.createElement(Page));}
let html=render();for(const label of ['Mes demandes de prêts et avances','Nouvelle demande','Approuvées','Refusées','Annulées','Toutes','En attente'])assert.ok(html.includes(label),label);
assert.ok(html.includes('30 000')||html.includes('30 000'));assert.ok(!html.includes('NaN'));
assert.ok(render({isLoading:true}).includes('Chargement de vos demandes'));
assert.ok(render({loans:[]}).includes('Votre prochaine demande commence ici'));
assert.ok(render({loadError:'Chargement impossible'}).includes('role="alert"'));
html=render({selectedId:'demo-loan-pending'});assert.ok(html.includes('Annuler la demande'));assert.ok(html.includes('Avis · Responsable RH'));assert.ok(html.includes('Sandrine Mvoula'));assert.ok(html.includes('Impression non autorisée'));assert.ok(!html.includes('> Imprimer'));
html=render({selectedId:'demo-loan-1'});assert.ok(!html.includes('Annuler la demande'),'active loan cancellable');
html=render({mySpaceTab:'suivi',historyByLoan:{'demo-loan-1':loanHistory}});assert.ok(html.includes('200 000')||html.includes('200 000'));assert.ok(html.includes('Évolution de mes dettes'));assert.ok(html.includes('Remboursé'));assert.ok(!html.includes('Salaire net'));
filter='all';currentPage=2;const many=Array.from({length:21},(_,i)=>({...loans[1],id:'test-'+i,amount:i+1}));html=render({loans:many});assert.ok(html.includes('Page 2 / 3'));assert.equal((html.match(/Voir ma demande/g)||[]).length,10);
filter='pending';currentPage=1;
async function demo(){
  const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
  const request=(p,method='GET')=>demoResponse(new URL('https://demo.test'+p),method,{},store,'EMPLOYEE');
  const pendingBefore=await request('/dashboard/pending-requests-count').json();
  assert.equal(pendingBefore.loans,1);
  const history=await request('/loans/demo-loan-1/history').json();assert.equal(history.reduce((s,r)=>s+r.amount,0),loans[0].amount-loans[0].remainingBalance);
  assert.equal(request('/loans/demo-loan-1/cancel','PATCH').status,400);
  assert.equal(request('/loans/advances/demo-advance-1/cancel','PATCH').status,404);
  assert.equal(request('/loans/demo-loan-pending/cancel','PATCH').status,200);
  assert.equal((await request('/loans/me').json()).find(l=>l.id==='demo-loan-pending').status,'CANCELLED');
  assert.equal((await request('/dashboard/pending-requests-count').json()).total,pendingBefore.total-1);
  assert.equal(request('/loans/demo-loan-1/document-data').status,501);
  console.log('Mon espace Prêts : API, calculs, documents et exports identiques ; filtres/pagination, états, détail/avis, annulation et historique démo vérifiés.');
}
demo().catch(e=>{console.error(e);process.exitCode=1;});
