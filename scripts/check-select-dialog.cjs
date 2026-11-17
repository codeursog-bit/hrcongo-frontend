const fs=require('fs'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict');
// Exercise the real component's handlers with controlled DOM geometry, without a browser.
let states=[false,{left:0,width:0,top:0,maxHeight:300},true,0],stateIndex=0,refIndex=0,effects=[],inDialog=true,chosen,focused=false,pageScrolls=0;
let rect={left:120,width:320,top:250,bottom:296};
const dialogListeners=new Map(),windowListeners=new Map();
const dialog={id:'native-dialog',addEventListener:(key,fn)=>dialogListeners.set(key,fn),removeEventListener:key=>dialogListeners.delete(key)};
const body={id:'body'},option={offsetTop:132,offsetHeight:44,scrollIntoView(){pageScrolls++;throw Error('Must never scroll the page');}};
const menu={scrollTop:0,clientHeight:100,contains:node=>node===menu||node===option};
const button={closest:()=>inDialog?dialog:null,getBoundingClientRect:()=>rect,focus(){focused=true;}};
const refs=[{current:{contains:()=>false}},{current:button},{current:menu}];
const previous={document:global.document,window:global.window,ResizeObserver:global.ResizeObserver};let observed=[],disconnected=false,observerCallback;
global.document={body,getElementById:()=>option,addEventListener(){},removeEventListener(){}};
global.window={innerHeight:900,addEventListener:(key,fn)=>windowListeners.set(key,fn),removeEventListener:key=>windowListeners.delete(key)};
global.ResizeObserver=class {constructor(callback){observerCallback=callback;}observe(node){observed.push(node);}disconnect(){disconnected=true;}};
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('components/ui/FancySelect.tsx','utf8'),{compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText;
const react={...React,useId:()=>':select:',useRef:()=>refs[refIndex++],useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useState(initial){const i=stateIndex++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return[states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];}};
new Function('require','module','exports',code)(name=>name==='react'?react:name==='react-dom'?{createPortal:(child,host)=>React.createElement('test-portal',{host},child)}:name==='framer-motion'?{motion:{div:'div'},AnimatePresence:'test-presence',useReducedMotion:()=>false}:name.endsWith('.css')?{}:require(name),mod,mod.exports);
const props={value:'',onChange:value=>{chosen=value;},options:[{value:'',label:'Choisir'},{value:'transport',label:'Transport'},{value:'annual',label:'Annuelle'}]};
function render(){stateIndex=0;refIndex=0;effects=[];return mod.exports.FancySelect(props);}
function find(node,predicate){if(!node||typeof node!=='object')return; if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const match=find(child,predicate);if(match)return match;}}
const trigger=tree=>find(tree,node=>node.props?.className==='k-select-trigger');
function event(key){return{key,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;}};}
try {
 let tree=render();trigger(tree).props.onClick(event());tree=render();assert.equal(find(tree,n=>n.type==='test-portal').props.host,dialog,'menu must share the dialog top layer');assert.equal(states[1].top,304);assert.equal(states[1].left,120);
 const cleanup=effects[1]();assert.ok(observed.includes(dialog));assert.ok(observed.includes(button));effects[2]();assert.equal(menu.scrollTop,76);assert.equal(pageScrolls,0);
 rect={...rect,left:160};observerCallback();assert.equal(states[1].left,160,'track modal resizing');assert.ok(dialogListeners.has('animationend'));
 windowListeners.get('scroll')({target:menu});assert.equal(states[0],true,'local list scrolling stays open');
 const escape=event('Escape');trigger(render()).props.onKeyDown(escape);assert.equal(states[0],false);assert.ok(escape.prevented&&escape.stopped,'Escape closes list without closing dialog');
 const second=event('Escape');trigger(render()).props.onKeyDown(second);assert.ok(!second.prevented&&!second.stopped,'next Escape reaches the dialog');
 trigger(render()).props.onKeyDown(event('ArrowDown'));trigger(render()).props.onKeyDown(event('ArrowDown'));trigger(render()).props.onKeyDown(event('Enter'));assert.equal(chosen,'transport');assert.equal(states[0],false);assert.equal(focused,true);
 cleanup();assert.equal(disconnected,true);assert.equal(dialogListeners.size,0);
 inDialog=false;trigger(render()).props.onClick(event());assert.equal(find(render(),n=>n.type==='test-portal').props.host,body,'ordinary pages retain body portal');
 states[0]=false;global.window.innerHeight=400;rect={left:80,width:300,top:300,bottom:346};trigger(render()).props.onClick(event());assert.equal(states[1].bottom,108,'flip above near viewport bottom');assert.equal(states[1].top,undefined);
 states[0]=false;inDialog=true;global.window.innerHeight=545;rect={left:120,width:320,top:253,bottom:297};props.options.push({value:'four',label:'Quatre'},{value:'five',label:'Cinq'});trigger(render()).props.onClick(event());assert.equal(states[1].top,305,'prefer below the modal field when three rows fit');assert.equal(states[1].bottom,undefined);assert.equal(states[1].maxHeight,232);props.options.splice(3);
 states[2]=false;global.document=undefined;assert.doesNotThrow(render,'SSR must not touch document');
 console.log('Select : portail dans le dialog, position suivie, scroll local, clavier/Échap et repli hors modale vérifiés.');
} finally {Object.assign(global,previous);}
