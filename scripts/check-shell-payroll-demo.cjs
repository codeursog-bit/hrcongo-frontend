const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');process.chdir(root);const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const page=path.join(root,'app/(dashboard)/paie/[id]/page.tsx');let states={},index=0,pathName='/paie/demo',brand={logo:null,name:null},failedLogo=null,calls=[],documentProps;
const names=['pdfLoading','data','userRole','isLoading','isBusy','auditBlocked','showEmployer','confirm','bonuses'];
const fixture={status:'DRAFT',month:11,year:2026,grossSalary:600000,netSalary:500000,totalDeductions:100000,employee:{id:'employee-demo',firstName:'Laure',lastName:'Djouma',employeeNumber:'EMP-001',position:'Assistante RH'},company:{tradeName:'Entreprise démo',bulletinTemplateId:'demo-template'},items:[{id:'cnss',code:'CNSS_SAL',type:'DEDUCTION',label:'CNSS',amount:20000},{id:'its',code:'ITS',type:'DEDUCTION',label:'ITS',amount:80000}]};
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===page?{useEffect(){},useState(initial){const key=names[index++];return[Object.hasOwn(states,key)?states[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{}),...(parent?.filename.endsWith('BrandLogo.tsx')?{useState:()=>[failedLogo,v=>{failedLogo=v;}]}:{}),...(parent?.filename.endsWith('PayrollTableRow.tsx')?{useState:()=>[true,()=>{}],useRef:()=>({current:null})}:{})};
 if(name==='next/navigation')return{useRouter:()=>({push(){},back(){}}),usePathname:()=>pathName,useParams:()=>({}),useSearchParams:()=>new URLSearchParams()};
 if(name==='@/hooks/useBasePath')return{useBasePath:()=>({bp:p=>p})};
 if(name==='@/hooks/useCompanyLogo')return{useCompanyLogo:()=>brand};
 if(name==='@/components/ui/AnchoredMenu')return{AnchoredMenu:props=>React.createElement('div',{'data-payroll-actions':true},props.children)};
 if(name==='@/services/api'&&parent?.filename===page)return{api:{get:async()=>fixture,patch:async(url,payload)=>{calls.push({method:'PATCH',url,payload});return fixture;},delete:async url=>{calls.push({method:'DELETE',url});}}};
 if(name==='@/components/BulletinDisplay')return{__esModule:true,default:props=>{documentProps=props;return React.createElement('div',{'data-official-document':'unchanged'});}};
 if(name==='@/lib/bulletin-print')return{getBulletinRootId:id=>'root-'+id,printBulletin:id=>calls.push({method:'PRINT',id}),downloadBulletinPDF:async(id,filename)=>calls.push({method:'PDF',id,filename})};
 return load.call(this,name,parent,...args);
};
const Page=require(page).default;
function render(extra={}){index=0;states={data:fixture,isLoading:false,userRole:'ADMIN',bonuses:[],...extra};return renderToStaticMarkup(React.createElement(Page,{params:{id:'payroll-demo'}}));}
function raw(extra={}){index=0;states={data:fixture,isLoading:false,userRole:'ADMIN',bonuses:[],...extra};return Page({params:{id:'payroll-demo'}});}
function nodes(n){if(!n||typeof n!=='object')return[];return[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
(async()=>{
 const recapHtml=render({showEmployer:true,data:{...fixture,totalDeductions:101234,netSalary:498766,totalEmployerCost:745000,items:[...fixture.items,{code:'CTAX_CAMU',label:'CAMU salarié',type:'DEDUCTION',amount:1234},{code:'CTAX_EMP_CAMU',label:'CAMU employeur',type:'EMPLOYER_COST',amount:145000}]}});
 const summaryStart=recapHtml.indexOf('payroll-pay-summary'),summary=recapHtml.slice(summaryStart,recapHtml.indexOf('</section>',summaryStart));assert.ok(!summary.includes('<dl'));assert.ok(!summary.includes('<details'));assert.ok(!summary.includes('CAMU'));
 const recap=recapHtml.slice(recapHtml.indexOf('Récapitulatif</h3>'));assert.equal((recap.match(/<dt>CAMU salarié<\/dt>/g)||[]).length,1);assert.ok(recapHtml.includes((745000).toLocaleString('fr-FR')));
 for(const status of ['DRAFT','VALIDATED','TO_PAY','PAID','CANCELLED']){const html=render({data:{...fixture,status}});assert.ok(html.includes('Salaire brut'));assert.ok(html.includes('Total des retenues'));assert.ok(html.includes('Net à payer'));assert.ok(html.includes('Laure'));assert.equal((html.match(/data-official-document/g)||[]).length,1);assert.deepEqual(documentProps.payroll.items,fixture.items);assert.deepEqual(documentProps.payroll.employee,fixture.employee);}
 const employee=render({userRole:'EMPLOYEE'});assert.ok(!employee.includes('> Valider</button>'));assert.ok(!employee.includes('> Modifier</button>'));
 assert.ok(render({data:null}).includes('Bulletin introuvable'));assert.ok(render({isLoading:true}).includes('Chargement'));
 for(const confirm of ['validate','pay','cancel','restore','delete']){
  const tree=raw({confirm});const action=nodes(tree).find(n=>n.props?.onClick?.name==='handleConfirm');assert.ok(action,confirm);await action.props.onClick();
  const last=calls.at(-1);assert.equal(last.url,'/payrolls/payroll-demo');assert.equal(last.method,confirm==='delete'?'DELETE':'PATCH');
  if(confirm!=='delete')assert.equal(last.payload.status,{validate:'VALIDATED',pay:'TO_PAY',cancel:'CANCELLED',restore:'DRAFT'}[confirm]);
 }
 const buttons=nodes(raw()).filter(n=>n.type==='button');const print=buttons.find(n=>n.props.children?.some?.(v=>typeof v==='string'&&/Imprimer/.test(v)));assert.ok(print);print.props.onClick();assert.equal(calls.at(-1).id,'root-demo-template');
 const {CompanyBrandProvider}=require('../components/layout/CompanyBrand.tsx'),{KonzaLoader}=require('../components/ui/KonzaLoader.tsx'),{BrandLogo}=require('../components/ui/BrandLogo.tsx');
 function loader(route='/presences',props={}){pathName=route;return renderToStaticMarkup(React.createElement(CompanyBrandProvider,{},React.createElement(KonzaLoader,props)));}
 brand={logo:null,name:null};assert.ok(loader().includes('konza_logo_h_color.png'));
 brand={logo:'/company-logo.svg',name:'Entreprise Démo'};assert.ok(loader().includes('/company-logo.svg'));assert.ok(loader().includes('brand-loader-track'));
 assert.ok(loader('/portefeuille/dashboard').includes('/company-logo.svg'));
 for(const route of ['/admin','/cabinet/demo']){const html=loader(route);assert.ok(html.includes('konza-loader-ring'));assert.ok(!html.includes('brand-loader-track'));}
 failedLogo=null;const logo=BrandLogo({src:'/broken.png',name:'Entreprise'});logo.props.children.props.onError();const fallback=renderToStaticMarkup(React.createElement(BrandLogo,{src:'/broken.png',name:'Entreprise'}));assert.ok(fallback.includes('konza_logo_h_color.png'));assert.ok(!fallback.includes('src="/broken.png"'));
 const updated=renderToStaticMarkup(React.createElement(BrandLogo,{src:'/updated.svg',name:'Entreprise'}));assert.ok(updated.includes('/updated.svg'));
 const {PayrollTableRow}=require('../app/(dashboard)/paie/components/PayrollTableRow.tsx');
 for(const status of ['Draft','Validated','ToPay','Paid','Cancelled']){
  const row=React.createElement(PayrollTableRow,{entry:{id:'demo',name:'Laure Djouma',matricule:'EMP-001',position:'Assistante RH',department:'Administration',daysWorked:20,totalDays:22,netSalary:500000,status},isSelected:false,isActionLoading:false,onToggleSelect(){},onView(){},onStatusChange(){},onEdit(){},onDelete(){}});
  const html=renderToStaticMarkup(React.createElement('table',{},React.createElement('tbody',{},row)));assert.ok(html.includes('data-payroll-actions'));assert.equal(html.includes('Suppression définitive'),!['ToPay','Paid'].includes(status));
 }
 console.log('Coquille/paie : logos Konza/entreprise/échec/mise à jour, loaders entreprise/portefeuille/legacy, cinq statuts, droits, confirmations et document contrôlés.');
})().catch(error=>{console.error(error);process.exitCode=1;});
