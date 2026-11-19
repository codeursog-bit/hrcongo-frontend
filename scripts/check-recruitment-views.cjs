const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename,load=Module._load;Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.tsx','.ts'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let current,names=[],index=0,states={},pathname='/recrutement';
const notify=Object.assign(()=>{}, {success(){},error(){},info(){}});
Module._load=function(name,parent,...args){
 if(name==='react'&&parent?.filename===current)return{...React,useEffect(){},useLayoutEffect(){},useMemo:fn=>fn(),useCallback:fn=>fn,useRef:initial=>({current:initial}),useState:initial=>{const key=names[index++];return[Object.hasOwn(states,key)?states[key]:typeof initial==='function'?initial():initial,()=>{}];}};
 if(name==='next/navigation')return{useRouter:()=>({push(){},back(){}}),usePathname:()=>pathname,useParams:()=>({id:'demo-candidate-2'}),useSearchParams:()=>new URLSearchParams()};
 if(name==='next/link')return{__esModule:true,default:'a'};
 if(name==='next/image')return{__esModule:true,default:'img'};
 if(name==='framer-motion')return{...load.call(this,name,parent,...args),useReducedMotion:()=>true};
 if(name==='@/components/design-system/feedback')return{...load.call(this,name,parent,...args),useToast:()=>notify};
 if(name==='@/components/ui/useToast')return{ToastProvider:({children})=>children,useToast:()=>({toast:notify})};
 return load.call(this,name,parent,...args);
};
const data=require('../lib/demo/recruitment.ts');
function prepare(file,overrides){current=path.join(root,'app/(dashboard)/recrutement',file);const s=ts.createSourceFile(file,fs.readFileSync(current,'utf8'),99,true,4);let fn;s.forEachChild(n=>{if(ts.isFunctionDeclaration(n)&&n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword))fn=n;});assert.ok(fn,file);names=[];function visit(n){if(ts.isVariableDeclaration(n)&&n.initializer&&ts.isCallExpression(n.initializer)){const call=n.initializer.expression.getText(s);if(/(?:^|\.)useState$/.test(call)&&ts.isArrayBindingPattern(n.name))names.push(n.name.elements[0].name.getText(s));if(call==='useDebounced')names.push('__debounce');}ts.forEachChild(n,visit);}visit(fn.body);index=0;states=overrides;pathname='/recrutement/'+file.replace('/page.tsx','');return require(current).default;}
const cases=[
 ['page.tsx',{jobs:data.recruitmentJobs},['Chargé de recrutement','recruitment-job-stages']],
 ['tableau-de-bord/page.tsx',{data:data.recruitmentDashboard,loading:false},['À faire maintenant','recruitment-stat','recruitment-attention-layout']],
 ['pipeline/page.tsx',{data:{candidates:data.recruitmentCandidates,jobs:data.recruitmentJobs,sources:[]},ready:true,loading:false},['Ariane Mabiala','recruitment-lane','Déplacer']],
 ['entretiens/page.tsx',{data:{interviews:data.recruitmentInterviews,pendingFeedback:[]}},['Grâce Moukala','recruitment-agenda-row']],
 ['demandes/page.tsx',{items:data.recruitmentRequisitions,isHr:true},['Chargé de recrutement','Valider']],
 ['modeles/page.tsx',{templates:data.recruitmentTemplates,currentId:'ACK',subject:'Bonjour {{prenom}}',body:'Texte de démonstration'},['recruitment-mail-editor','Aperçu (avec des exemples)']],
 ['candidat/[id]/page.tsx',{fiche:{candidate:data.recruitmentCandidates[2],job:data.recruitmentJobs[0],daysInStage:2,activities:[],interviews:data.recruitmentInterviews,otherApplications:[]},loading:false},['Grâce','recruitment-candidate-layout']],
 ['manuel/create/page.tsx',{},['recruitment-form-outline','Intitulé du poste','Publier']],
 ['ia/create/page.tsx',{},['recruitment-form-outline','Critères de sélection IA','Activer']],
];
for(const[file,overrides,expected]of cases){const Component=prepare(file,overrides),html=renderToStaticMarkup(React.createElement(Component,{params:{id:'demo-job-rh'}}));for(const text of expected)assert.ok(html.includes(text),file+' missing '+text);}
async function demo(){const request=(p,method='GET')=>data.demoRecruitment(new URL('http://demo.test'+p),method);const q=await request('/recruitment/pipeline?q=ariane').json();assert.equal(q.candidates.length,1);assert.equal((await request('/recruitment/pipeline?source=WhatsApp').json()).candidates.length,1);assert.equal((await request('/recruitment/requisitions?status=PENDING').json()).length,1);assert.equal(request('/recruitment/candidates/demo-candidate-0/fiche').status,200);assert.equal(request('/recruitment/candidates/demo-candidate-0/hire','POST').status,501);assert.equal(request('/recruitment/jobs/demo-job-rh','DELETE').status,501);assert.equal(request('/recruitment/interviews/agenda').status,200);const {demoResponse,createDemoStore}=require('../lib/demo/transport.ts');assert.equal(demoResponse(new URL('http://demo.test/recruitment/pipeline'),'GET',{},createDemoStore(),'EMPLOYEE').status,403);console.log('Recrutement : neuf vues réelles rendues avec fixtures, repères de formulaire, filtres démo et refus des mutations vérifiés.');}
demo().catch(e=>{console.error(e);process.exitCode=1;});
