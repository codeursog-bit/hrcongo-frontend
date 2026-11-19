// Exercise the real provider callbacks, including a slow initial fetch and rapid mode changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');const effects=[],refs=[],writes=[],restores=[];let snapshot={user:{mode:'dark',colors:null},effective:{colors:{}},company:{}};
let hold,delay=false;const pending=()=>new Promise(r=>hold=r);
const store=new Map([['user',JSON.stringify({id:'u',companyId:'c'})]]);
global.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};global.window=new EventTarget();
const react={createContext:()=>({Provider:'provider'}),useContext:()=>null,useState:v=>[v,()=>{}],useCallback:fn=>fn,useEffect:fn=>effects.push(fn),useLayoutEffect:()=>{},useRef:v=>{const ref={current:v};refs.push(ref);return ref;}};
const adapter={get:async()=>{const value=structuredClone(snapshot);if(delay){delay=false;await pending();}return value;},saveUser:async value=>{writes.push(value.mode);snapshot={...snapshot,user:value};}};
function load(file,stubs){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;new Function('require','module','exports',code)(p=>p in stubs?stubs[p]:require(p),m,m.exports);return m.exports;}
const {AppearanceProvider}=load('components/providers/AppearanceProvider.tsx',{'react':react,'next/navigation':{usePathname:()=>'/dashboard'},'@/lib/data/context':{featureActor:()=>({id:'u',companyId:'c'})},'@/lib/data/appearance':{getAppearance:()=>adapter,appearanceAvailable:true},'@/lib/data/appearance.demo':{APPEARANCE_EVENT:'appearance',companyAppearanceKey:()=>'',userAppearanceKey:()=>''},'@/lib/appearance':{APPEARANCE_TOKENS:[],appearanceTokens:()=>({})},'@/lib/demo/config':{DEMO_MODE:false}});
const tick=()=>new Promise(r=>setImmediate(r));
async function main(){
  AppearanceProvider({children:null,theme:'light',preference:'auto',onServerPreference:(...v)=>restores.push(v)});
  const cleanups=effects.map(fn=>fn());await tick();assert.deepEqual(restores,[['dark','u']]);
  restores.length=0;delay=true;window.dispatchEvent(new Event('focus'));await tick();
  const mode=value=>{const e=new Event('konza:appearance:mode-changed');e.detail=value;window.dispatchEvent(e);};
  mode('light');mode('auto');hold();await tick();await tick();
  assert.deepEqual(writes,['light','auto'],'mode writes must stay in user order');assert.equal(snapshot.user.mode,'auto');assert.ok(restores.every(([m])=>m==='auto'),'late initial fetch must not restore dark after a click');
  cleanups.forEach(fn=>fn?.());
  // ThemeProvider restores a server preference without emitting a save event loop.
  effects.length=0;const states=[];const fakeReact={...react,useState:v=>[v,x=>states.push(x)]};
  const {ThemeProvider}=load('components/providers/ThemeProvider.tsx',{'react':fakeReact,'next/navigation':{usePathname:()=>'/dashboard'},'./AppearanceProvider':{AppearanceProvider:'appearance-provider'},'@/lib/data/appearance':{appearanceAvailable:true},'@/lib/theme':{resolveTheme:()=> 'light'}});
  let emitted=0;window.addEventListener('konza:appearance:mode-changed',()=>emitted++);
  const tree=ThemeProvider({children:null});const restore=tree.props.children.props.onServerPreference;
  restore('dark','different-user');assert.equal(states.length,0);restore('dark','u');assert.equal(store.get('konza:appearance:mode:u'),'dark');assert.equal(emitted,0);assert.deepEqual(states,['dark',true]);
  console.log('PASS: mode serveur, réponse tardive, écritures successives, identité et absence de boucle de sauvegarde.');
}main().catch(e=>{console.error(e);process.exitCode=1;});
