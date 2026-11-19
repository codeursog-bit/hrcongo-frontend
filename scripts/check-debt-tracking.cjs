const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),file=path.join(root,'app/(dashboard)/loans/suivi-dettes/page.tsx'),source=fs.readFileSync(file,'utf8');
const old=cp.execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','HEAD:app/(dashboard)/loans/suivi-dettes/page.tsx'],{cwd:root,encoding:'utf8'});
function inspect(text){const sf=ts.createSourceFile('page.tsx',text.replaceAll('\r\n','\n'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),out={api:[],vars:{},states:[]};function visit(n){
  if(ts.isCallExpression(n)&&/^(api\.get|fetch)$/.test(n.expression.getText(sf)))out.api.push(n.getText(sf));
  if(ts.isVariableDeclaration(n)&&['fmt','availableYears','departments','byEmployee','kpis','handleExport'].includes(n.name.getText(sf)))out.vars[n.name.getText(sf)]=n.initializer.getText(sf);
  if(ts.isVariableDeclaration(n)&&ts.isArrayBindingPattern(n.name)&&n.initializer?.expression?.getText(sf)==='useState'&&n.name.elements[0]?.name?.getText(sf)!=='loadError')out.states.push(n.getText(sf));ts.forEachChild(n,visit);
}visit(sf);return out;}
assert.deepEqual(inspect(source),inspect(old),'API, état des filtres, calculs ou export Excel modifiés');
const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),names=[...source.matchAll(/const \[([^,\]]+),[^\]]+\] = useState/g)].map(m=>m[1]);
let overrides={},stateIndex=0,table;
Module._load=function(name,parent,...args){if(parent?.filename===file){
  if(name==='react')return {...React,useState(initial){const key=names[stateIndex++];return [key in overrides?overrides[key]:initial,()=>{}];},useEffect(){}};
  if(name==='@/hooks/useBasePath')return {useBasePath:()=>({bp:p=>p})};
  if(name==='@/components/FinanceSubNav')return {__esModule:true,default:()=>null};
  if(name==='@/components/design-system/primitives'){const actual=load.call(this,name,parent,...args);return {...actual,DataTable:p=>{table=p;return React.createElement(actual.DataTable,p);}};}
}return load.call(this,name,parent,...args);};
const Page=require(file).default;
const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts');const store=createDemoStore();
const employee=store.employees[0],loan={...store.loans[0]},ancient={...loan,id:'old',amount:1000,remainingBalance:800,startDate:'2019-01-01',createdAt:'2019-01-01',repaymentLogs:[]};
function render(extra={}){stateIndex=0;table=null;overrides={isLoading:false,loans:[loan,ancient,store.loans[1]],advances:[],month:11,year:2026,...extra};return renderToStaticMarkup(React.createElement(Page));}
let html=render();assert.ok(html.includes('Suivi des dettes'));assert.ok(html.includes('Exporter en Excel'));assert.ok(html.includes('k-table-mobile'));
assert.equal(table.rows[0].totalRemaining,200800);assert.equal(table.rows[0].givenInPeriod,0);assert.equal(table.rows[0].paidInPeriod,50000);assert.equal(table.rows[0].totalGranted,301000);
assert.ok(html.includes('/loans/suivi-dettes/demo-laure'));
render({month:'',year:2026});assert.equal(table.rows[0].givenInPeriod,300000);assert.equal(table.rows[0].paidInPeriod,100000);assert.equal(table.rows[0].totalRemaining,200800);
render({month:1,year:2020});assert.equal(table.rows[0].totalRemaining,200800);assert.equal(table.rows[0].paidInPeriod,0);assert.equal(table.rows.length,1,'old debt disappeared with period filter');
render({nameFilter:'  DJOUMA  '});assert.equal(table.rows.length,1);
render({nameFilter:'Introuvable'});assert.equal(table.rows.length,0);
render({deptFilter:'Autre'});assert.equal(table.rows.length,0);
render({typeFilter:'AVANCE'});assert.equal(table.rows.length,0);
render({loans:[],advances:[{...store.advances[0],status:'APPROVED',remainingBalance:50000}]});assert.equal(table.rows[0].totalRemaining,50000);assert.equal(table.rows[0].totalRepaidCumul,25000);
html=render({loans:[],advances:[]});assert.ok(html.includes('Les dettes validées apparaîtront ici'));
html=render({isLoading:true});assert.ok(html.includes('Chargement du suivi des dettes'));assert.equal(table,null);
html=render({loadError:'Erreur de lecture'});assert.ok(html.includes('role="alert"'));
assert.equal(demoResponse(new URL('https://demo.test/loans/debt-tracking/export-xlsx?year=2026'),'GET',{},store,'ADMIN').status,501,'official export simulated');
console.log('Suivi des dettes : API/export/calculs conservés ; soldes globaux indépendants de la période, journaux, filtres, données démo et états vérifiés.');
