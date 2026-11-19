const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');process.chdir(root);const resolve=Module._resolveFilename,load=Module._load;
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.tsx','.ts'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,f);require.extensions['.css']=()=>{};
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let current,names=[],index=0,states={},requests=[];
const notifications=Array.from({length:8},(_,i)=>({id:'n'+i,title:'Notification '+i,message:'Message '+i,createdAt:`2026-11-${String(10+i).padStart(2,'0')}T09:00:00Z`,read:false,type:'INFO'}));
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},...(parent?.filename===current?{useEffect(){},useRef:()=>({current:null}),useMemo:fn=>fn(),useCallback:fn=>fn,useState(initial){const key=names[index++];return[Object.hasOwn(states,key)?states[key]:typeof initial==='function'?initial():initial,()=>{}];}}:{})};
 if(name==='next/navigation')return{usePathname:()=>'/dashboard',useRouter:()=>({push(){},back(){}}),useParams:()=>({}),useSearchParams:()=>new URLSearchParams()};
 if(name==='next/link')return{__esModule:true,default:'a'};
 if(name==='framer-motion')return{...load.call(this,name,parent,...args),useReducedMotion:()=>false};
 if(name==='@/hooks/useBasePath')return{useBasePath:()=>({bp:p=>p})};
 if(name==='./CompanyBrand'||name==='@/components/layout/CompanyBrand')return{useShellBrand:()=>({logo:null,name:null})};
 if(name==='@/components/chat/ChatProvider')return{useChatUnread:()=>2};
 if(name.endsWith('usePortfolioAlerts'))return{usePortfolioAlerts:()=>({demandes:5,avis:3,messages:2})};
 if(name==='@/hooks/useMyEmployeePhoto')return{useMyEmployeePhoto:()=>undefined};
 if(name.endsWith('/ShellSearch')||name==='./ShellSearch')return{ShellSearch:()=>null};
 if(name.endsWith('/ThemeControl')||name==='./ThemeControl')return{ThemeControl:()=>null};
 if(name==='@/services/api')return{api:{get:async url=>{requests.push(url);return notifications;},patch:async()=>({})}};
 return load.call(this,name,parent,...args);
};
function prepare(file,extra={}){current=path.join(root,file);const text=fs.readFileSync(current,'utf8'),s=ts.createSourceFile(file,text,99,true,4);names=[];function visit(n){if(ts.isVariableDeclaration(n)&&ts.isArrayBindingPattern(n.name)&&n.initializer&&ts.isCallExpression(n.initializer)&&/(?:^|\.)useState$/.test(n.initializer.expression.getText(s)))names.push(n.name.elements[0].name.getText(s));ts.forEachChild(n,visit);}visit(s);index=0;states={user:{name:'Laure Djouma',firstName:'Laure',lastName:'Djouma',role:'ADMIN'},pendingRequestsCount:5,pendingAvisCount:3,leaveEligible:true,isDesktop:true,collapsed:false,tip:null,showNotifs:true,notifications,unreadCount:8,...extra};return text;}
function compileBaseline(file,text){const m=new Module(current);m.filename=current;m.paths=Module._nodeModulePaths(path.dirname(current));m._compile(ts.transpileModule(text,{fileName:file,compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText,current);return m.exports;}
function nodes(n){if(!n||typeof n!=='object')return[];return[n,...React.Children.toArray(n.props?.children).flatMap(nodes)];}
const {recentNotifications,NotificationPopover}=require('../components/layout/NotificationPopover.tsx');
assert.deepEqual(recentNotifications(notifications).map(n=>n.id),['n7','n6','n5','n4','n3']);assert.equal(notifications[0].id,'n0');assert.equal(recentNotifications([]).length,0);
assert.equal(recentNotifications([{createdAt:'bad'},{createdAt:'2026-11-18'}])[0].createdAt,'2026-11-18');
const {SidebarCount}=require('../components/layout/SidebarCount.tsx');const count=renderToStaticMarkup(React.createElement(SidebarCount,{count:5}));assert.ok(count.includes('shell-nav-count'));assert.ok(!count.includes('danger'));assert.ok(count.includes('>5<'));
const pop=renderToStaticMarkup(React.createElement(NotificationPopover,{onClose(){}},'Content'));assert.ok(pop.includes('role="dialog"'));assert.ok(pop.includes('Fermer les notifications'));
const {SidebarAccount}=require('../components/layout/SidebarAccount.tsx');
const account=renderToStaticMarkup(React.createElement(SidebarAccount,{name:'Laure Djouma',role:'Admin',email:'laure@example.test',mini:false,onLogout(){}}));
assert.ok(account.includes('Laure Djouma'));assert.ok(account.includes('laure@example.test'));assert.ok(account.includes('Se déconnecter'));assert.equal((account.match(/<button/g)||[]).length,1);
const CongeSubNav=require('../components/CongeSubNav.tsx').default;
for(const role of ['ADMIN','HR_MANAGER','MANAGER','EMPLOYEE']){const links=CongeSubNav({userRole:role}).props.links;assert.equal(links[0].href,'/conges/programme');assert.equal(new Set(links.map(l=>l.href)).size,links.length);assert.equal(links.some(l=>l.href==='/conges/soldes'),['ADMIN','HR_MANAGER'].includes(role));}
const record=process.argv.includes('--record'),target='docs/refonte/controle-cloche-sidebar/navigation.json';
const baseline=record?JSON.parse(fs.readFileSync('scripts/.bell-sidebar-before.json','utf8')):null;
const navigation=record?{}:JSON.parse(fs.readFileSync(target,'utf8'));
for(const file of ['components/layout/Sidebar.tsx','components/portfolio/PortfolioSidebar.tsx']){
 for(const role of ['ADMIN','HR_MANAGER','MANAGER','EMPLOYEE']){
  prepare(file,{user:{name:'Laure Djouma',role}});const now=require(current),Component=now.Sidebar||now.default;
  const props=file.includes('Portfolio')?{userName:'Laure Djouma',open:false}:{isOpen:false,onClose(){}};
  const after=Component(props),afterRoutes=nodes(after).filter(n=>n.type==='a').map(n=>n.props.href).sort();
  const key=file+'|'+role;let oldRoutes=navigation[key];if(record){index=0;const old=compileBaseline(file,baseline[file]),Old=old.Sidebar||old.default;const oldTree=Old(props);oldRoutes=nodes(oldTree).filter(n=>n.type==='a').map(n=>n.props.href).sort();navigation[key]=oldRoutes;}
  assert.deepEqual(afterRoutes,oldRoutes,file+' '+role+' keeps all role-filtered links');
  const request=nodes(after).find(n=>n.type==='a'&&/\/demandes$/.test(n.props.href));if(request){assert.equal(request.props.style.background,'transparent');assert.ok(!String(request.props.style.color).includes('danger'));}
 }
}
if(record){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(navigation,null,2)+'\n');}
for(const file of ['components/layout/TopNav.tsx','components/portfolio/PortfolioTopNav.tsx']){
 prepare(file);const mod=require(current),Top=mod.TopNav||mod.default;const html=renderToStaticMarkup(React.createElement(Top,{}));assert.equal((html.match(/class="shell-notif group/g)||[]).length,5);assert.ok(html.indexOf('Notification 7')<html.indexOf('Notification 6'));assert.ok(!html.includes('Notification 0'));
 prepare(file,{showNotifs:false});const tree=Top({});const bell=nodes(tree).find(n=>n.type==='button'&&String(n.props['aria-label']).startsWith('Notifications'));assert.ok(bell);bell.props.onClick();assert.equal(requests.at(-1),'/notifications?limit=5');
}
console.log('Cloche/sidebar : cinq notifications récentes, tri non mutatif, rafraîchissement, fermeture accessible, compteurs du thème et liens identiques par rôle vérifiés.');
