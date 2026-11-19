const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename,load=Module._load;Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.tsx','.ts'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let current,names=[],index=0,states={},pathname='/parametres',requests=[];
const alert={success(){},error(){},info(){},confirm:async()=>false};
Module._load=function(name,parent,...args){
 if(name==='react')return{...React,useLayoutEffect(){},...(parent?.filename===current?{useEffect(){},useMemo:fn=>fn(),useCallback:fn=>fn,useRef:initial=>({current:initial}),useState:initial=>{const key=names[index++];if(key===undefined)return[typeof initial==='function'?initial():initial,()=>{}];if(!Object.hasOwn(states,key))states[key]=typeof initial==='function'?initial():initial;return[states[key],value=>{states[key]=typeof value==='function'?value(states[key]):value;}];}}:{})};
 if(name==='next/navigation')return{useRouter:()=>({push(){},back(){}}),usePathname:()=>pathname,useParams:()=>({}),useSearchParams:()=>new URLSearchParams()};
 if(name==='next/link')return{__esModule:true,default:'a'};
 if(name==='@dnd-kit/core')return{...load.call(this,name,parent,...args),useSensor:()=>({}),useSensors:(...s)=>s};
 if(name==='@/hooks/useBasePath')return{useBasePath:()=>({bp:p=>p})};
 if(name==='@/components/providers/AlertProvider')return{useAlert:()=>alert};
 if(name==='@/hooks/useSubscription')return{usePlans:()=>({plans:null,isLoading:false})};
 if(name==='@/services/api')return{api:{get:async p=>{requests.push(p);return{};},post:async()=>{throw Error('No writes in view tests');}}};
 if(name==='framer-motion')return{...load.call(this,name,parent,...args),useReducedMotion:()=>true};
 if(/^@\/components\/(?:BulletinRenderer|FactureRenderer|CanvasRenderer)/.test(name)){const Renderer=props=>React.createElement('div',{'data-official-renderer':name},props.template?.templateId);Renderer.docKind=name;return{__esModule:true,default:Renderer};}
 if(name==='@/components/CanvasEditor')return{__esModule:true,default:()=>React.createElement('div',{'data-canvas-editor':true})};
 return load.call(this,name,parent,...args);
};
function prepare(file,overrides={}){current=path.join(root,'app/(dashboard)/parametres',file);const s=ts.createSourceFile(file,fs.readFileSync(current,'utf8'),99,true,4);let best=[];for(const fn of s.statements.filter(ts.isFunctionDeclaration)){const list=[];function visit(n){if(n!==fn&&ts.isFunctionDeclaration(n))return;if(ts.isVariableDeclaration(n)&&ts.isArrayBindingPattern(n.name)&&n.initializer&&ts.isCallExpression(n.initializer)&&/(?:^|\.)useState$/.test(n.initializer.expression.getText(s)))list.push(n.name.elements[0].name.getText(s));ts.forEachChild(n,visit);}visit(fn);if(list.length>best.length)best=list;}names=best;index=0;states={...overrides};pathname='/parametres'+(file==='page.tsx'?'':'/'+file.split('/')[0]);return require(current).default;}
const {company,departments}=require('../lib/demo/employees.ts'),{subscription}=require('../lib/demo/subscription.ts'),{demoBonusTemplates}=require('../lib/demo/bonus-catalog.ts'),{demoSettingsUsers,demoCircuits}=require('../lib/demo/settings.ts');
const cases=[
 ['page.tsx',{},['settings-home-groups','Entreprise et équipe','Paie et documents']],
 ['departements/page.tsx',{departments,isLoading:false},['settings-department-row','Administration']],
 ['users/page.tsx',{users:demoSettingsUsers,departments,isLoading:false,currentUserRole:'ADMIN',currentUserId:'demo-user'},['settings-user-row','Laure']],
 ['entreprise/page.tsx',{isLoading:false,companyId:company.id},['settings-local-tabs','Identification']],
 ['paie/page.tsx',{isLoading:false},['settings-local-tabs','CNSS Salariale']],
 ['primes/page.tsx',{isLoading:false,templates:demoBonusTemplates},['Catalogue des primes','Transport']],
 ['taxes/page.tsx',{isLoading:false,taxes:[]},['Cotisations','Taxes personnalisées']],
 ['circuits/page.tsx',{loading:false,config:demoCircuits,draft:demoCircuits.circuits},['settings-circuit-card','Prêts']],
 ['securite/page.tsx',{loadingMe:false,role:'ADMIN'},['Sécurité du compte','2FA']],
 ['subscription/page.tsx',{isLoading:false,subscription},['Abonnement','Plan actuel']],
 ['bulletin/page.tsx',{loading:false},['settings-model-choice','settings-document-kind','data-official-renderer']],
];
for(const[file,values,expected]of cases){const Component=prepare(file,values),html=renderToStaticMarkup(React.createElement(Component));for(const value of expected)assert.ok(html.includes(value),file+' missing '+value);}
// Exercise the real local model-selection handlers, without invoking Save or any API.
const Designer=prepare('bulletin/page.tsx',{loading:false,showPreview:false});
function nodes(node){if(!node||typeof node!=='object')return[];const children=React.Children.toArray(node.props?.children).flatMap(nodes);if(typeof node.type==='function'&&['GabaritTab','FactureTab'].includes(node.type.name))return[node,...children,...nodes(node.type(node.props))];return[node,...children];}
function raw(){index=0;return Designer();}
let tree=raw();assert.ok(!nodes(tree).some(n=>n.type.name==='DocumentReader'));const originals={primary:states.cfg.style.primaryColor,secondary:states.cfg.style.secondaryColor};
const choices=nodes(tree).filter(n=>n.type.name==='SettingsModelChoice');assert.ok(choices.length>=4);for(const choice of choices){choice.props.onClick();choice.props.onPreview();assert.equal(states.showPreview,true);assert.equal(states.cfg.style.primaryColor,originals.primary);assert.equal(states.cfg.style.secondaryColor,originals.secondary);tree=raw();assert.ok(nodes(tree).some(n=>n.type.docKind?.includes('BulletinRenderer')));}
states.showPreview=false;tree=raw();const invoice=nodes(tree).find(n=>n.type==='button'&&n.props.onClick?.toString().includes("setPreviewKind('facture')"));assert.ok(invoice);invoice.props.onClick();tree=raw();const invoices=nodes(tree).filter(n=>n.type.name==='SettingsModelChoice');assert.equal(invoices.length,3);
for(const choice of invoices){choice.props.onClick();choice.props.onPreview();tree=raw();assert.equal(states.showPreview,true);const document=nodes(tree).find(n=>n.type.docKind?.includes('FactureRenderer'));assert.ok(document);assert.ok(document.props.template.factureTemplateId);}
const {SettingsModelChoice}=require('../components/settings/SettingsModelChoice.tsx');
let clicked=0,previewed=0,scrolled=0;global.requestAnimationFrame=fn=>fn();global.window={matchMedia:()=>({matches:true})};global.document={getElementById:id=>{assert.equal(id,'settings-model-reader');return{scrollIntoView:options=>{assert.equal(options.behavior,'auto');scrolled++;}};}};
SettingsModelChoice({selected:false,onClick:()=>clicked++,onPreview:()=>previewed++,children:'Modèle'}).props.onClick({});assert.deepEqual([clicked,previewed,scrolled],[1,1,1]);
assert.deepEqual(requests,[]);console.log('Paramètres : 11 vues rendues, choix des gabarits bulletin et des trois factures, aperçu masqué réouvert, couleurs conservées, navigation mobile avec mouvement réduit et aucune sauvegarde/API exécutée.');
