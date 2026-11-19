const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react');
const root=path.resolve(__dirname,'..'),file=path.join(root,'app/(dashboard)/contrats/employe/[employeeId]/page.tsx'),load=Module._load;
let states=[],index=0,effects=[],fail=true,requests=[],reloads=0;
global.window={location:{reload(){reloads++;}}};
Module._load=function(name,parent,...args){
 if(name==='react')return{...React,useState:initial=>{const i=index++;if(states[i]===undefined)states[i]=initial;return[states[i],v=>{states[i]=v;}];},useEffect:fn=>effects.push(fn)};
 if(name==='next/navigation')return{useParams:()=>({employeeId:'demo-patrick'}),useRouter:()=>({push(){}})};
 if(name==='@/hooks/useBasePath')return{useBasePath:()=>({bp:p=>p})};
 if(name==='@/services/api')return{api:{get:async url=>{requests.push(url);if(fail)throw Error('Indisponible');return url.startsWith('/employees/')?{id:'demo-patrick',firstName:'Patrick',lastName:'Likibi',hireDate:'2024-01-08',baseSalary:425000,contractType:'CDI',position:'Commercial',employeeNumber:'MS-003'}:[];}}};
 if(name.startsWith('@/'))return new Proxy({},{get:(_t,key)=>key==='__esModule'?true:({children})=>children||null});
 return load.call(this,name,parent,...args);
};
const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,file);
const Component=m.exports.default().props.children.type;
async function run(){Component();effects.shift()();await new Promise(setImmediate);index=0;const error=Component();assert.equal(error.props.role,'alert');assert.ok(error.props.children[1].props.onClick);error.props.children[1].props.onClick();assert.equal(reloads,1);assert.deepEqual(requests,['/employees/demo-patrick','/contracts/generation/employee/demo-patrick']);fail=false;states=[];index=0;effects=[];Component();effects.shift()();await new Promise(setImmediate);index=0;const page=Component();assert.notEqual(page.props.role,'alert');assert.equal(states[3],false);console.log('Contrat employé : échec réseau géré sans rejet non traité, réessai, chargement réussi et endpoints inchangés vérifiés.');}
run().catch(e=>{console.error(e);process.exitCode=1;});
