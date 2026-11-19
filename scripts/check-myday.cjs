const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), Module = require('node:module'), ts = require('typescript');
const root = path.resolve(__dirname, '..'); const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...args) { return originalResolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, parent, ...args); };
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, file);
require.extensions['.css'] = () => {};
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
function inspect(source) {
  const sf = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), calls = [], helpers = {}; let manager;
  function visit(node) {
    if (ts.isCallExpression(node) && /^api\.(get|post|put|patch|delete)$/.test(node.expression.getText(sf))) calls.push(node.getText(sf).replace(/\s+/g, ' '));
    if (ts.isFunctionDeclaration(node) && node.name?.text.startsWith('compute')) helpers[node.name.text] = node.body.getText(sf);
    if (ts.isIfStatement(node) && node.expression.getText(sf) === "userRole === 'MANAGER'") manager = node.thenStatement.getText(sf);
    ts.forEachChild(node, visit);
  }
  visit(sf); return { calls, helpers, manager };
}
async function main() {
  const old = inspect(cp.execFileSync('git', ['-c', 'safe.directory=' + root.replaceAll('\\', '/'), 'show', 'HEAD:components/DashboardContent.tsx'], { cwd: root, encoding: 'utf8' }));
  const current = inspect(fs.readFileSync(path.join(root, 'components/DashboardContent.tsx'), 'utf8'));
  assert.deepEqual(current.calls, old.calls, 'existing dashboard API calls changed'); assert.equal(current.manager, old.manager, 'manager view changed');
  assert.deepEqual(inspect(fs.readFileSync(path.join(root, 'lib/personal-dashboard-stats.ts'), 'utf8')).helpers, old.helpers, 'existing calculations changed');
  for (const call of inspect(fs.readFileSync(path.join(root, 'hooks/usePersonalDay.ts'), 'utf8')).calls) assert.ok(old.calls.includes(call), 'admin personal view introduced an unknown read: ' + call);
  const { calendarDays, dayKey, elapsedClock, nextCalendarMonth } = require('../components/dashboard/day-calendar.ts');
  assert.equal(dayKey(new Date('2026-11-11T23:30:00Z')), '2026-11-12');
  assert.equal(calendarDays('2024-02').filter(Boolean).length, 29); assert.equal(calendarDays('2026-02').filter(Boolean).length, 28);
  assert.equal(nextCalendarMonth('2026-12', 1), '2027-01'); assert.equal(nextCalendarMonth('2026-01', -1), '2025-12');
  assert.equal(elapsedClock('2026-11-12T07:00:00Z', '2026-11-12T09:30:05Z'), '02:30:05');
  assert.equal(elapsedClock('invalid'), '00:00:00'); assert.equal(elapsedClock('2026-11-12T09:00:00Z', undefined, new Date('2026-11-12T08:00:00Z').getTime()), '00:00:00');
  const { MyDay, MyDaySkeleton } = require('../components/dashboard/MyDay.tsx');
  const { DayCalendar } = require('../components/dashboard/MyDayWidgets.tsx');
  const { ToastProvider } = require('../components/design-system/feedback.tsx');
  const props = { userName: 'Laure', stats: { pendingLeaves: 2, remainingLeaves: '18.0', lastSalary: '123987 F', lastSalaryMonth: 'novembre', totalPaid: 100000, totalDebt: 200000, presenceRateMonth: 95 }, context: { employee: { id: 'demo-laure' } }, leaveEligible: true };
  const render = data => renderToStaticMarkup(React.createElement(ToastProvider, null, React.createElement(MyDay, data)));
  const snapshot = JSON.stringify(props); const html = render(props);
  for (const text of ['Ma journée', 'Mon pointage', 'Mes tâches', 'Mon calendrier', 'Dans l’équipe', 'Mes horaires', 'Mon résumé personnel', 'Mes accès utiles']) assert.ok(html.includes(text), text);
  assert.ok(!html.includes('123987'), 'salary exposed before explicit reveal'); assert.equal(JSON.stringify(props), snapshot);
  assert.ok(!render({ ...props, leaveEligible: false }).includes('href="/conges/nouveau"'), 'leave eligibility ignored');
  assert.ok(render({ ...props, stats: {}, context: { employee: null } }).includes('Votre fiche employé'));
  assert.ok(render({ ...props, error: 'indisponible' }).includes('role="alert"'));
  assert.ok(renderToStaticMarkup(React.createElement(MyDaySkeleton)).includes('role="status"'));
  const today = dayKey(); const calendar = renderToStaticMarkup(React.createElement(DayCalendar, { context: { leaves: [{ id: 'approved', status: 'APPROVED', startDate: today, endDate: today }] }, holidays: [{ date: today, label: 'Férié configuré' }], holidaysAvailable: true }));
  assert.ok(calendar.includes('Congé approuvé')); assert.ok(calendar.includes('Férié configuré'));
  const { tasksDemo } = require('../lib/data/tasks.demo.ts');
  const actor = { id: 'demo-user', companyId: 'demo-company', role: 'EMPLOYEE', name: 'Laure', departmentId: 'demo-rh' };
  const tasks = tasksDemo(actor); assert.equal((await tasks.list('me')).length, 2);
  await tasks.update('demo-task-assigned', 'BLOCKED', 'Document attendu'); assert.equal((await tasks.list('me')).find(t => t.id === 'demo-task-assigned').blockedReason, 'Document attendu');
  const admin = tasksDemo({ ...actor, id: 'another-admin', role: 'ADMIN' }); assert.ok((await admin.list('admin')).every(t => t.scope === 'ASSIGNED'));
  const { dayOverviewDemo } = require('../lib/data/day-overview.demo.ts'); assert.equal((await dayOverviewDemo({ ...actor, companyId: 'other-company' }).get()).absentColleagues.length, 0);
  console.log('Ma journée vérifiée : API et calculs conservés, vue manager inchangée, calendrier/chrono, salaire masqué, éligibilité congés, états et tâches privées/assignées.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
