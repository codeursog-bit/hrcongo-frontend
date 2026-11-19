/* Focused regression checks for demo isolation, privacy and theme compatibility. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, parent, ...args) { return resolve.call(this, name.startsWith('@/') ? path.join(root, name.slice(2)) : name, parent, ...args); };
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);

async function main() {
  const { resolveTheme } = require('../lib/theme.ts');
  assert.equal(resolveTheme('auto', false), 'light'); assert.equal(resolveTheme('auto', true), 'dark');
  assert.equal(resolveTheme('light', true), 'light'); assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme('auto', false, true), 'dark');
  const layout = fs.readFileSync(path.join(root, 'app/layout.tsx'), 'utf8');
  const initialThemeScript = [...layout.matchAll(/__html: `([^`]+)`/g)].map(match => match[1]).find(script => script.startsWith('(function(){try{var s=localStorage'));
  for (const [saved, systemDark, pathname, expected] of [[null, false, '/auth/login', 'light'], [null, true, '/dashboard', 'dark'], ['light', true, '/dashboard', 'light'], ['auto', false, '/dashboard', 'light'], [null, false, '/cabinet/c/dashboard', 'dark']]) {
    const classes = []; vm.runInNewContext(initialThemeScript, { localStorage: { getItem: () => saved }, location: { pathname }, window: { matchMedia: () => ({ matches: systemDark }) }, document: { documentElement: { classList: { add: c => classes.push(c) }, style: {} } } }); assert.deepEqual(classes, [expected]);
  }
  const { tasksDemo } = require('../lib/data/tasks.demo.ts');
  const employee = { id: 'test-employee', companyId: 'test-company', role: 'EMPLOYEE', name: 'Test', departmentId: 'sales' };
  const admin = { ...employee, id: 'test-admin', role: 'ADMIN', departmentId: 'rh' };
  const other = { ...employee, id: 'test-other', companyId: 'other-company' };
  const mine = tasksDemo(employee), manager = tasksDemo(admin);
  const personal = await mine.createPersonal('Dossier personnel');
  await manager.createPersonal('Note privée admin');
  assert.equal((await manager.list('admin')).length, 0, 'admin must never list personal tasks');
  await assert.rejects(() => manager.update(personal.id, 'DONE'), /inaccessible/);
  await assert.rejects(() => mine.assign('Affectation', [admin.id]), /réservé/);
  const assigned = await manager.assign('Dossier partagé', [employee.id]);
  assert.equal((await manager.list('admin')).length, 1); assert.equal((await mine.list('me')).length, 2);
  await mine.update(assigned.id, 'DONE'); assert.ok((await manager.list('admin'))[0].completedAt);
  await mine.comment(assigned.id, 'Terminé'); assert.equal((await manager.list('admin'))[0].comments.length, 1);
  assert.equal((await tasksDemo(other).list('me')).length, 0);
  const departmentTask = await manager.assign('Équipe RH', [], 'rh');
  await assert.rejects(() => mine.update(departmentTask.id, 'DONE'), /inaccessible/);
  const { dayEventsDemo } = require('../lib/data/day-events.demo.ts');
  const events = dayEventsDemo(employee), event = (await events.list())[0];
  await events.react(event.id, '🎉'); assert.equal((await events.list())[0].reactions[0].count, 1);
  await events.react(event.id, '🎉'); assert.equal((await events.list())[0].reactions[0].count, 0);
  await assert.rejects(() => dayEventsDemo(other).react(event.id, '🎉'), /indisponible/);
  const { announcementsDemo } = require('../lib/data/announcements.demo.ts');
  await assert.rejects(() => announcementsDemo(employee).create('Titre', 'Message'), /réservé/);
  await announcementsDemo(admin).create('Réunion', 'Vendredi à 10 heures.');
  assert.equal((await announcementsDemo(employee).list()).length, 1); assert.equal((await announcementsDemo(other).list()).length, 0);
  const { anniversariesDemo } = require('../lib/data/anniversaries.demo.ts');
  assert.equal((await anniversariesDemo({ ...employee, companyId: 'demo-company', id: 'not-recipient' }).list()).length, 0);
  const privateNotifications = anniversariesDemo({ ...employee, companyId: 'demo-company', id: 'demo-user' });
  assert.equal((await privateNotifications.list()).length, 1); await privateNotifications.markRead('demo-anniversary-1'); assert.equal((await privateNotifications.list())[0].read, true);
  const { createDemoStore, demoResponse, installDemoTransport } = require('../lib/demo/transport.ts');
  const store = createDemoStore();
  const response = endpoint => demoResponse(new URL('http://demo.test' + endpoint), 'GET', {}, store, 'ADMIN');
  assert.equal((await response('/dashboard/summary').json()).totalEmployees, store.employees.length);
  assert.equal((await response('/dashboard/summary').json()).masseSalariale, store.employees.reduce((sum, e) => sum + e.baseSalary, 0));
  assert.equal(response('/unknown').status, 501); assert.equal(response('/cnss-declaration/export/dgc').status, 501);
  assert.equal((await response('/subscriptions/usage').json()).limits.employees.current, 3);
  let realCalls = 0;
  global.window = { location: { origin: 'http://front.test' }, fetch: async () => { realCalls++; return new Response('real'); } };
  const original = window.fetch, previousUrl = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = 'http://demo.test/v1';
  const uninstall = installDemoTransport('EMPLOYEE');
  assert.equal((await (await window.fetch('http://demo.test/v1/auth/verify', { method: 'POST' })).json()).user.role, 'EMPLOYEE');
  assert.equal((await window.fetch('http://demo.test/v1/unsupported', { method: 'DELETE' })).status, 501); assert.equal(realCalls, 0);
  await window.fetch('http://front.test/logo.svg'); assert.equal(realCalls, 1);
  const aborted = new AbortController(); aborted.abort(); await assert.rejects(() => window.fetch('http://demo.test/v1/employees', { signal: aborted.signal }), /annulée/);
  uninstall(); assert.equal(window.fetch, original);
  if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL; else process.env.NEXT_PUBLIC_API_URL = previousUrl;
  delete global.window;
  const snapshot = fs.readFileSync(path.join(root, 'docs/refonte/legacy-tokens.css'), 'utf8');
  const globals = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  for (const selector of ['.theme-legacy', '.dark .theme-legacy, .theme-legacy.dark']) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const block = text => text.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'))[1];
    assert.equal(block(snapshot), block(globals), `historical tokens changed: ${selector}`);
    assert.equal([...block(globals).matchAll(/--[\w-]+:/g)].length, 11);
  }
  const calls=[];global.fetch=async(url,config)=>{calls.push([new URL(url).pathname,config.credentials]);return Response.json([]);};
  await require('../lib/data/tasks.api.ts').tasksApi.list('me');
  await require('../lib/data/day-events.api.ts').dayEventsApi.list();
  await require('../lib/data/announcements.api.ts').announcementsApi.list();
  await require('../lib/data/anniversaries.api.ts').anniversariesApi.list();
  assert.deepEqual(calls,[['/tasks/me','include'],['/day-events','include'],['/announcements','include'],['/anniversaries/notifications','include']]);
  console.log('Fondations vérifiées : thème et script initial, tâches privées et assignées, entreprises isolées, réactions, annonces, notifications privées, transport démo sans fuite réseau, tokens legacy exacts.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
