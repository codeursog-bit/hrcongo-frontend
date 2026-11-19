const fs=require('fs'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict');
const modules={},docEvents=new Map(),winEvents=new Map();
const body={},dialog={},inside={},trigger={},outside={};let focused=0,buttonFocused=false;
const menuLinks=[{focus(){focused=1;}}];
const menu={scrollHeight:200,contains:n=>n===inside,querySelector:()=>menuLinks[0],querySelectorAll:()=>menuLinks};
const button={closest:()=>dialog,focus(){buttonFocused=true;},getBoundingClientRect:()=>({left:280,right:370,top:100,bottom:140})};
const refs=[{clientWidth:350},{querySelectorAll:()=>[120,160,100].map(width=>({getBoundingClientRect:()=>({width})})),querySelector:()=>({getBoundingClientRect:()=>({width:90})})},{contains:n=>n===trigger},{getBoundingClientRect:()=>({left:20,right:370,top:100,bottom:140})},menu,button,null];
let stateValues=[null,2,true],stateIndex=0,refIndex=0,effects=[];
const old={window:global.window,document:global.document,ResizeObserver:global.ResizeObserver};
global.document={body,activeElement:menuLinks[0],fonts:null,addEventListener:(k,v)=>docEvents.set(k,v),removeEventListener:k=>docEvents.delete(k)};
global.window={innerWidth:390,innerHeight:640,addEventListener:(k,v)=>winEvents.set(k,v),removeEventListener:k=>winEvents.delete(k)};
let disconnected=false;
global.ResizeObserver=class{observe(){}disconnect(){disconnected=true;}};
const react={...React,useRef:initial=>({current:refs[refIndex++]??initial}),useState(initial){const i=stateIndex++;return[stateValues[i]??initial,v=>{stateValues[i]=typeof v==='function'?v(stateValues[i]):v;}];},useMemo:fn=>fn(),useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useLayoutEffect:fn=>effects.push(fn)};
function load(file){if(modules[file])return modules[file];const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{jsx:4,module:1,target:9,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>name==='react'?react:name==='react-dom'?{createPortal:(child,host)=>React.createElement('test-portal',{host},child)}:name==='next/link'?{__esModule:true,default:'a'}:name==='./module-nav-layout'?load('components/requests/module-nav-layout.ts'):name.endsWith('.css')?{}:require(name),m,m.exports);return modules[file]=m.exports;}
function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type||node.props?.role===type)return node;for(const child of React.Children.toArray(node.props?.children)){const result=find(child,type);if(result)return result;}return null;}
try{
 const Nav=load('components/requests/ModuleNav.tsx').default;
 const tree=Nav({items:[{href:'/a',label:'Vue',group:'pilot'},{href:'/b',label:'Rapport',group:'analysis'},{href:'/c',label:'Ma pointeuse',group:'action',active:true}],groupLabels:{analysis:'Analyse'}});
 const portal=find(tree,'test-portal');assert.equal(portal.props.host,dialog,'portal stays in native dialog top layer when necessary');
 const cleanups=effects.map(fn=>fn()).filter(v=>typeof v==='function');
 assert.equal(stateValues[1],2);assert.equal(focused,1,'opening focuses the first page without scrolling');
 assert.equal(stateValues[0].left+stateValues[0].width,370,'right side stays in module column');
 docEvents.get('mousedown')({target:inside});assert.equal(stateValues[2],true,'clicks inside portal are not outside clicks');
 winEvents.get('scroll')({target:inside});assert.equal(stateValues[2],true,'menu can scroll');
 const popup=find(tree,'menu');popup.props.onKeyDown({key:'End',preventDefault(){},currentTarget:menu});assert.equal(focused,1);
 docEvents.get('keydown')({key:'Escape',preventDefault(){}});assert.equal(stateValues[2],false);assert.equal(buttonFocused,true);
 stateValues[2]=true;docEvents.get('mousedown')({target:outside});assert.equal(stateValues[2],false);
 stateValues[2]=true;winEvents.get('scroll')({target:outside});assert.equal(stateValues[2],false,'page scrolling never leaves a detached popup');
 assert.ok(winEvents.has('resize'));cleanups.forEach(fn=>fn());assert.ok(disconnected);assert.equal(winEvents.size,0);assert.equal(docEvents.size,0);
 assert.match(fs.readFileSync('components/requests/module-nav.css','utf8'),/@media print[^}]*\.module-nav-menu/,'portal never appears in print');
 console.log('Menu Plus réel : portail, position, focus, clavier/Échap, clic extérieur, défilement et nettoyage des écouteurs vérifiés.');
}finally{for(const[k,v]of Object.entries(old))if(v===undefined)delete global[k];else global[k]=v;}
