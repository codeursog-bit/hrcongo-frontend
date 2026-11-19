const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const assert = require('node:assert/strict'), ts = require('typescript'), React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const file = path.resolve(__dirname,'../components/subscription/SubscriptionAccessGate.tsx');
let pathname='/employees', state={subscription:{plan:'PRO',status:'ACTIVE',accessRestricted:true}}, actor={user:{companyId:'company'},userRole:'ADMIN'};
const m = new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));
m.require=id=>({
  'next/navigation':{usePathname:()=>pathname,useRouter:()=>({replace(){}})},
  '@/hooks/useAuth':{useAuth:()=>actor},
  '@/hooks/useSubscription':{useSubscription:()=>({...state,refetch(){}})},
  '@/lib/subscription-access':{pageEntitlement:()=>undefined},
  '@/components/design-system/feedback':{Modal:({title,children,actions})=>React.createElement('section',null,title,children,actions)},
  '@/components/design-system/primitives':{Button:({children})=>React.createElement('button',null,children)},
}[id] || require(id));
m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
const render=()=>renderToStaticMarkup(React.createElement(m.exports.default,null,React.createElement('div',null,'BUSINESS_CONTENT')));
assert.ok(!render().includes('BUSINESS_CONTENT'));assert.ok(render().includes('Renouveler'));
pathname='/dashboard';assert.ok(render().includes('BUSINESS_CONTENT'));
pathname='/parametres/subscription';assert.ok(render().includes('BUSINESS_CONTENT'));
pathname='/employees';state={isLoading:true};assert.ok(!render().includes('BUSINESS_CONTENT'));
state={error:new Error('offline')};assert.ok(!render().includes('BUSINESS_CONTENT'));
state={subscription:{plan:'FREE',status:'ACTIVE',downgradedAt:'2026-01-01'}};assert.ok(!render().includes('BUSINESS_CONTENT'));
state={subscription:{plan:'PRO',status:'ACTIVE',currentPeriodEnd:'2000-01-01'}};assert.ok(!render().includes('BUSINESS_CONTENT'));
state={subscription:{plan:'PRO',status:'ACTIVE',currentPeriodEnd:'2099-01-01',accessRestricted:false}};assert.ok(render().includes('BUSINESS_CONTENT'));
actor={user:{companyId:'company'},userRole:'EMPLOYEE'};state={subscription:{plan:'PRO',status:'PAUSED'}};assert.ok(!render().includes('Renouveler l’abonnement'));assert.ok(!render().includes('BUSINESS_CONTENT'));
actor={user:{companyId:'company',managedByCabinet:true},userRole:'ADMIN'};assert.ok(render().includes('BUSINESS_CONTENT'));
console.log('Subscription access: 11 scenarios passed');
