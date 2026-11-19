// Layouts may evolve; business invariants use the frozen pre-review baseline.
require('./check-presences-review.cjs');
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
for(const file of ['components/DailyAttendanceReportPrintable.tsx','components/WeeklyAttendanceReportPrintable.tsx','components/attendance/AttendanceExportDialog.tsx']){
 const before=cp.execFileSync('git',['-c','safe.directory='+root.split(path.sep).join('/'),'show','HEAD:'+file],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n');
 assert.equal(fs.readFileSync(path.join(root,file),'utf8').replaceAll('\r\n','\n'),before,file+' protected');
}
console.log('Official attendance reports and export dialog unchanged.');
