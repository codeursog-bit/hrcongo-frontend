const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),file=path.join(root,'components/ui/DocumentReader.tsx'),load=Module._load;
const React=require('react');let states=[0,0,null,0],stateIndex=0,refIndex=0,effects=[],observer,fullscreenCalls=0;
const frame={requestFullscreen:async()=>{fullscreenCalls++;}},view={clientWidth:352},paper={scrollHeight:1123};
global.ResizeObserver=class{constructor(fn){this.fn=fn;observer=this;}observe(){}disconnect(){this.disconnected=true;}};
global.document={fullscreenElement:null,exitFullscreen:async()=>{fullscreenCalls--;}};
global.window={innerHeight:900,addEventListener(){},removeEventListener(){}};
Module._load=function(name,parent,...args){if(name==='react'&&parent?.filename===file)return{...React,useRef:()=>({current:[frame,view,paper][refIndex++]}),useState:initial=>{const i=stateIndex++;if(states[i]===undefined)states[i]=initial;return[states[i],next=>{states[i]=next;}];},useEffect:fn=>effects.push(fn)};if(name.endsWith('.css'))return{};return load.call(this,name,parent,...args);};
const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,file);
const child=React.createElement('article',{id:'official-print'},'Original document');
function render(landscape=false,fitPage=false,initialZoom){stateIndex=refIndex=0;return m.exports.DocumentReader({children:child,landscape,fitPage,initialZoom});}
function nodes(n){if(!n||typeof n!=='object')return[];return[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
function find(tree,fragment){return nodes(tree).find(n=>String(n.props?.['aria-label']).includes(fragment));}
let tree=render();const cleanup=effects.shift()();tree=render();
let sized=nodes(tree).find(n=>n.props?.className==='document-reader-size');assert.equal(sized.props.style.width,320);assert.ok(sized.props.style.height>400);assert.equal(nodes(tree).find(n=>n.props?.className==='document-reader-paper loan-document-protected').props.children,child);
find(tree,'Augmenter').props.onClick();tree=render();assert.ok(nodes(tree).find(n=>n.type==='output').props.children[0]>40);
find(tree,'Ajuster').props.onClick();view.clientWidth=1200;observer.fn();tree=render();assert.equal(nodes(tree).find(n=>n.props?.className==='document-reader-size').props.style.width,794);
tree=render(true);assert.equal(nodes(tree).find(n=>n.props?.className==='document-reader-size').props.style.width,1123);
const fullPage=render(false,true);assert.ok(nodes(fullPage).find(n=>n.props?.className==='document-reader-size').props.style.height<=616);assert.ok(find(fullPage,'page entière'));
find(tree,'plein écran').props.onClick();assert.equal(fullscreenCalls,1);document.fullscreenElement=frame;find(tree,'plein écran').props.onClick();assert.equal(fullscreenCalls,0);cleanup();assert.equal(observer.disconnected,true);
states=[0,0,undefined,0];const bulletin=render(false,true,.72);assert.equal(nodes(bulletin).find(n=>n.type==='output').props.children[0],72);
console.log('Lecteur : ajustement mobile/bureau/paysage, zoom, redimensionnement, plein écran et document enfant inchangé vérifiés.');
