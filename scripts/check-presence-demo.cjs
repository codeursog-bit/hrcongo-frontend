const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),resolve=Module._resolveFilename,load=Module._load;
process.env.NEXT_PUBLIC_DEMO_MODE='true';
Module._resolveFilename=function(name,parent,...args){return resolve.call(this,name.startsWith('@/')?path.join(root,name.slice(2)):name,parent,...args);};
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:1,target:9,jsx:4,esModuleInterop:true}}).outputText,f);
require.extensions['.css']=()=>{};
const {createDemoStore,demoResponse}=require('../lib/demo/transport.ts'),store=createDemoStore();
const response=(p,m='GET',b={},role='ADMIN')=>demoResponse(new URL('https://example.test'+p),m,b,store,role);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');let currentFile,names=[],index=0,overrides={};
Module._load=function(name,parent,...args){
 if(name==='react')return {...React,useLayoutEffect(){},useState(initial){if(parent?.filename!==currentFile)return React.useState(initial);const key=names[index++];return [Object.hasOwn(overrides,key)?overrides[key]:typeof initial==='function'?initial():initial,()=>{}];}};
 if(name==='next/navigation')return {useRouter:()=>({push(){},back(){}}),useParams:()=>({}),usePathname:()=>'/presences',useSearchParams:()=>new URLSearchParams()};
 if(name==='@/components/providers/NotificationProvider')return {useNotification:()=>({addNotification(){}})};
 if(name==='@/components/providers/ThemeProvider')return {useTheme:()=>({theme:'light',preference:'auto',setPreference(){}})};
 return load.call(this,name,parent,...args);
};
function render(file,fn,extra={},props={}){
 currentFile=path.join(root,file);const source=fs.readFileSync(currentFile,'utf8'),ast=ts.createSourceFile(file,source,99,true,4),func=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===fn);assert.ok(func,fn);
 names=[...func.getText(ast).matchAll(/const\s*\[([^,\]]+),[^\]]+\]\s*=\s*useState/g)].map(m=>m[1].trim());index=0;overrides={userRole:'ADMIN',currentUser:{role:'ADMIN'},isAuthorized:true,ready:true,isLoading:false,loading:false,...extra};
 return renderToStaticMarkup(React.createElement(require(currentFile).default,props));
}
(async()=>{
 const month=await response('/attendance?month=11&year=2026').json(),mine=await response('/attendance?month=11&year=2026','GET',{},'EMPLOYEE').json();
 assert.equal(month.employees.length,3);assert.equal(month.dayStatuses.length,3);assert.equal(month.attendances.length,4);assert.equal(mine.employees.length,1);assert.ok(mine.attendances.every(a=>a.employeeId==='demo-laure'));
 assert.equal(response('/attendance/employee/demo-sandrine','GET',{},'EMPLOYEE').status,404);assert.equal(response('/attendance?companyId=outside').status,404);assert.equal(response('/attendance?month=10&year=2026').status,501);
 assert.equal((await response('/attendance/my-today').json())[0].checkOut,null);
 const dashboard=await response('/attendance-dashboard?mode=MOIS&month=11&year=2026').json();assert.equal(dashboard.totals.workedDays,month.attendances.length);assert.equal(dashboard.totals.theoreticalDays,6);assert.equal(dashboard.leaves.pending,1);
 assert.equal(response('/attendance-dashboard','GET',{},'EMPLOYEE').status,403);
 for(const p of ['/attendance/shifts','/attendance/shift-assignments','/checkin-devices/devices','/checkin-devices/credentials','/device-sync/connectors','/admin/display-screens','/pointage-qr/secret/list']){assert.equal(response(p).status,200,p);assert.equal(response(p,'GET',{},'EMPLOYEE').status,403,p);}
 for(const [p,m]of [['/attendance/manual','POST'],['/attendance/check-in','POST'],['/pointage-qr/scan','POST'],['/display/secret-punch','POST'],['/device-sync/connectors','POST'],['/admin/display-screens/approve','POST'],['/attendance-dashboard/export','GET']])assert.equal(response(p,m,{}).status,501,p);
 const report=await response('/attendance/report?month=11&year=2026').json();assert.equal(report.length,3);assert.equal(report[0].totalHours,8);assert.equal(report[2].daysAbsentUnpaid,2);
 const base='app/(dashboard)/presences/';
 for(const activeTab of ['daily','weekly','monthly','corrections','myview'])assert.doesNotThrow(()=>render(base+'page.tsx','AttendancePageContent',{currentUser:{role:'ADMIN'},data:month,activeTab,date:new Date('2026-11-13T12:00:00Z')}));
 for(const activeTab of ['daily','monthly'])assert.doesNotThrow(()=>render(base+'page.tsx','AttendancePageContent',{currentUser:{role:'EMPLOYEE'},userRole:'EMPLOYEE',data:mine,activeTab,myAttendances:mine.attendances,date:new Date('2026-11-13T12:00:00Z')}));
 for(const extra of [{data:report},{data:[]},{uiLoadError:'Test error'},{isGenerating:true}])assert.doesNotThrow(()=>render(base+'resume/page.tsx','AttendanceResumePageContent',extra));
 const shifts=await response('/attendance/shifts').json();
 for(const extra of [{shifts,employees:store.employees},{shifts,employees:store.employees,shiftModal:true},{shifts,employees:store.employees,assignModal:true},{loading:true},{error:'Test error'}])assert.doesNotThrow(()=>render(base+'shifts/page.tsx','ShiftsPageContent',extra));
 for(const extra of [{devices:await response('/checkin-devices/devices').json()},{showDeviceForm:true},{credentials:[]},{isLoading:true}])assert.doesNotThrow(()=>render(base+'tablettes/page.tsx','TablettesPageContent',{currentUser:{role:'ADMIN'},...extra}));
 for(const extra of [{connectors:await response('/device-sync/connectors').json()},{wizard:{}},{isLoading:true},{error:'Test error'}])assert.doesNotThrow(()=>render(base+'synchronisation/page.tsx','SynchronisationPage',extra));
 const screens=await response('/admin/display-screens').json();assert.doesNotThrow(()=>render(base+'ecrans/page.tsx','EcransPageContent',{screens}));
 for(const page of ['ecran','kiosk'])assert.doesNotThrow(()=>render(`app/${page}/page.tsx`,page==='ecran'?'EcranPageContent':'KioskPageContent'));
 for(const extra of [{},{timesRow:month.attendances[0]},{uiLoadError:'Test error'},{data:{employees:[],attendances:[],dayStatuses:[]}}])assert.doesNotThrow(()=>render(base+'DailyView.tsx','DailyView',{data:month,...extra},{selectedDate:new Date('2026-11-12T12:00:00Z'),setSelectedDate(){},userRole:'ADMIN',userDepartment:''}));
 for(const extra of [{},{editingAtt:month.attendances[0]},{activeTab:'overtime'},{showHistory:true}])assert.doesNotThrow(()=>render(base+'CorrectionsView.tsx','CorrectionsView',extra,{data:month,userRole:'ADMIN',userDepartment:'',onRefresh(){}}));
 for(const state of ['qr','setup','pairing','success','error','sleep']){currentFile=path.join(root,'components/attendance/AttendanceDisplayFrame.tsx');names=['state','time'];index=0;overrides={state,time:'08:30'};const Preview=require(currentFile).AttendanceDisplayFrame;assert.ok(renderToStaticMarkup(React.createElement(Preview,{kind:'qr'})).includes('08:30'));}
 const {AttendanceModuleFrame}=require('../components/attendance/AttendanceModuleFrame.tsx');let blocked=0;global.window={alert(){blocked++;}};AttendanceModuleFrame({children:null}).props.onClickCapture({target:{closest:()=>({textContent:'Exporter Excel',getAttribute(){return null;}})},preventDefault(){},stopPropagation(){}});assert.equal(blocked,1);delete global.window;
 console.log('Presence demo: snapshot, report, permissions, enterprise isolation, refused mutations and SSR views/modals checked.');
})().catch(e=>{console.error(e);process.exitCode=1;});
