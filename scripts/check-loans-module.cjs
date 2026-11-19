const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const routes=['page.tsx','dashboard/page.tsx','rapport/page.tsx','releve/page.tsx','releve/[employeeId]/page.tsx','suivi-dettes/[employeeId]/page.tsx'];
const shared=['components/loans/LoansDashboard.tsx','components/loans/LoansOverview.tsx','components/request-reports/LoansRequestsPanel.tsx'];
const original=file=>cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:'+file],{cwd:root,encoding:'utf8'});
function normalize(s){return s.replaceAll('\r\n','\n').replace(/\s*setRefonteError\('[^']*'\);/g,'').replace(/var\(--loan-[\w-]+, (#[\da-fA-F]{6})\)/g,'$1').replaceAll(' loan-document-protected','');}
function inspect(text){const sf=ts.createSourceFile('test.tsx',normalize(text),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out={calls:[],values:[],documents:[],actions:[]};
 function hasJsx(n){let found=false;function v(x){if(ts.isJsxElement(x)||ts.isJsxSelfClosingElement(x))found=true;else ts.forEachChild(x,v);}v(n);return found;}
 function v(n){
  if(ts.isCallExpression(n)&&/^(api\.(get|post|patch|put|delete)|fetch|useApprovalDecision|useDocSignatures|useBasePath|useParams|useRouter)$/.test(n.expression.getText(sf)))out.calls.push(n.getText(sf));
  if(ts.isVariableDeclaration(n)&&n.initializer){const name=n.name.getText(sf);if(!/refonte|motion|^Page$|^id$/.test(name)&&!['C','TT','TICK','LBL','CHART_COLORS','TYPE_COLOR','DEPT_COLORS','GROUP_COLOR','STATUS_COLORS','TABS'].includes(name)&&!hasJsx(n.initializer)&&!n.initializer.getText(sf).includes('useLoan'))out.values.push(n.getText(sf));}
  if(ts.isJsxAttribute(n)&&/^(onClick|onChange|onSubmit|onConfirm|onSave|onClose)$/.test(n.name.getText(sf)))out.actions.push(n.getText(sf));
  if((ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n))&&/^(LoanRequestPrintable|LoanRequestDocument|AdvanceRequestDocument|DocumentPreviewModal|PrintAuthorizationModal|LoansExportDialog|style)$/.test((ts.isJsxElement(n)?n.openingElement:n).tagName.getText(sf))){out.documents.push(n.getText(sf));return;}
  ts.forEachChild(n,v);
 }v(sf);return out;
}
for(const file of [...routes.map(r=>'app/(dashboard)/loans/'+r),...shared]){
 const before=inspect(original(file)),after=inspect(fs.readFileSync(path.join(root,file),'utf8'));
 // Chart-only JSX branches duplicate label callbacks, never action callbacks.
 assert.deepEqual(after.calls,before.calls,file+': appels réseau/hooks métier');
 assert.deepEqual(after.values,before.values,file+': états/calculs/permissions/handlers');
 assert.deepEqual(after.actions,before.actions,file+': actions et payloads');
 assert.deepEqual(after.documents,before.documents,file+': documents et exports protégés');
}
// The complete printable part of the individual statement remains byte-equivalent.
function printable(text){const sf=ts.createSourceFile('test.tsx',normalize(text),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword));let jsx=fn.body.statements.filter(ts.isReturnStatement).at(-1).expression;while(ts.isParenthesizedExpression(jsx))jsx=jsx.expression;if(jsx.openingElement.tagName.getText(sf)==='LoanModuleFrame')jsx=jsx.children.find(ts.isJsxElement);return jsx.children.filter(ts.isJsxElement).filter(n=>!n.openingElement.attributes.getText(sf).includes('print:hidden')).map(n=>n.getText(sf));}
const statement='app/(dashboard)/loans/releve/[employeeId]/page.tsx';assert.deepEqual(printable(fs.readFileSync(path.join(root,statement),'utf8')),printable(original(statement)),'Relevé imprimable modifié');

const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let currentFile,names,index,overrides;
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===currentFile?{useEffect(){},useState(initial){const key=names[index++];return [key in overrides?overrides[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{})};
 if(name==='next/navigation')return {useParams:()=>({employeeId:'demo-laure'}),useRouter:()=>({push(){},replace(){}}),usePathname:()=>'/loans',useSearchParams:()=>new URLSearchParams()};
 if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
 if(name==='@/hooks/useApprovalDecision')return {useApprovalDecision:()=>({decide(){},dialog:null})};
 if(name==='@/hooks/useDocSignatures')return {useDocSignatures:()=>({})};
 if(name==='@/components/FinanceSubNav')return {__esModule:true,default:()=>null};
 return load.call(this,name,parent,...args);
};
const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
function render(rel,extra={}){
 currentFile=path.join(root,'app/(dashboard)/loans/'+rel);const source=fs.readFileSync(currentFile,'utf8');
 names=[...source.matchAll(/const \[([^,\]]+),[^\]]+\]\s*=\s*useState/g)].map(m=>m[1]);index=0;
 overrides={isLoading:false,ready:true,userRole:'ADMIN',loans:store.loans,advances:store.advances,employee:store.employees[0],employeesList:store.employees,logsByItem:{'loan-demo-loan-1':store.loans[0].repaymentLogs},...extra};
 const Page=require(currentFile).default;return renderToStaticMarkup(React.createElement(Page));
}
for(const rel of routes){const html=render(rel);assert.ok(html.includes('loan-module'),rel+': gabarit absent');if(rel!=='dashboard/page.tsx'){assert.ok(render(rel,{isLoading:true}).includes('role="status"'),rel+': skeleton absent');assert.ok(render(rel,{refonteError:'Test indisponibilité'}).includes('role="alert"'),rel+': erreur absente');assert.doesNotThrow(()=>render(rel,{loans:[],advances:[],mouvements:[],employee:null}));}}
for(const tab of ['overview','loans','advances','deductions'])assert.doesNotThrow(()=>render('page.tsx',{tab}));
let html=render('suivi-dettes/[employeeId]/page.tsx',{expanded:{'loan-demo-loan-1':true}});assert.ok(html.includes('Laure'));assert.ok(html.includes('Modifier'));
html=render('suivi-dettes/[employeeId]/page.tsx',{userRole:'EMPLOYEE'});assert.ok(!html.includes('title="Modifier"'));assert.ok(!html.includes('title="Supprimer"'));
assert.ok(render('releve/[employeeId]/page.tsx').includes('loan-document-protected'));
function response(p,role='ADMIN'){return demoResponse(new URL('https://example.test'+p),'GET',{},store,role);}
(async()=>{
 let res=response('/loans-dashboard?mode=ANNEE&year=2026');assert.equal(res.status,200);let data=await res.json();assert.equal(data.totals.grantedAmount,300000);assert.equal(data.totals.repaidInPeriod,100000);assert.equal(data.totals.outstandingTotal,200000);assert.equal(data.topIndebted[0].extra,200000);assert.equal(data.evolution.length,12);
 data=await response('/loans-dashboard?mode=MOIS&month=11&year=2026').json();assert.equal(data.totals.repaidInPeriod,50000);assert.equal(data.totals.grantedAmount,0);assert.equal(data.totals.recoveredAmount,0);assert.equal(data.totals.outstandingTotal,200000);
 assert.equal(response('/loans-dashboard?companyId=other').status,404);assert.equal(response('/loans-dashboard','EMPLOYEE').status,403);
 assert.equal(response('/loans/advances/demo-advance-1/history').status,200);assert.equal(response('/loans/advances/demo-advance-1/history','EMPLOYEE').status,404);
 assert.equal(response('/loans-dashboard/export').status,501);
 console.log('Prêts : 6 routes, données/actions/permissions, documents/relevé, états/onglets et fixtures vérifiés.');
})().catch(e=>{console.error(e);process.exitCode=1;});
