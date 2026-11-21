// 📁 lib/demo/transport.ts
import { company, demoUser, departments, employees } from './employees';
import { payrolls, salaryTrend } from './payroll';
import { recentDashboardPayrolls, dashboardUpcoming } from './dashboard-upcoming';
import { demoRecruitment } from './recruitment';
import { demoSettings } from './settings';
import { demoPerformance } from './performance';
import { leaves, leaveBalance } from './leaves';
import { loans, advances, loanHistory } from './loans';
import { attendance, permissions, absences } from './attendance';
import { subscription, usage } from './subscription';
import { demoLoansDashboard } from './loans-dashboard';
import { demoLeaveScreen } from './leave-screens';
import { demoPermissionTickets } from './permission-tickets';
import { demoAbsenceRequests } from './absence-requests';
import { assets, demoAssets } from './assets';
import { trainingRequests, demoTraining } from './training';
import { demoServiceCatalogs } from './service-catalogs';
import { demoEmployeeManagement } from './employee-management';
import { demoWorkforce } from './workforce';
import { demoPresenceScreens } from './presence-screens';

const notifications = [{ id: 'demo-notification-1', type: 'LEAVE', title: 'Demande de congé de Patrick Likibi', message: 'Une demande attend votre décision.', link: '/conges', read: false, createdAt: '2026-11-12T08:00:00+01:00' }];
type Store = ReturnType<typeof createDemoStore>;
export function createDemoStore() {
  const store = structuredClone({ employees, leaves, loans, advances, attendance, permissions, absences, notifications, assets, trainingRequests });
  // This fictional employee has been granted self-service by their RH.
  store.employees[0].selfServiceEnabled = true;
  store.employees.forEach((employee,index)=>Object.assign(employee,{cnssNumber:index===0?'DEMO-CNSS-001':null,cnssEmployeeDeclared:index===0?false:index===1?true:null,isSubjectToCnss:index!==2,isSubjectToIrpp:index!==2}));
  Object.assign(store.loans[0], { repaymentLogs: structuredClone(loanHistory) });
  return store;
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
/** Closed fixture router: unsupported requests never fall through to the real API. */
export function demoResponse(url: URL, method: string, body: Record<string, unknown>, store: Store, role: 'ADMIN' | 'EMPLOYEE'): Response {
  const p = url.pathname;
  const user = demoUser(role);
  const settings = demoSettings(url, method, role);
  if (settings) return settings;
  const performance = demoPerformance(url, method, role);
  if (performance) return performance;
  if (method === 'GET' && p === '/contract-templates/contracts') {
    const employeeId = url.searchParams.get('employeeId');
    const employee = store.employees.find(item => item.id === employeeId);
    if (!employee || role === 'EMPLOYEE' && employeeId !== user.employeeId) return json({ message: 'Historique de contrats introuvable.' }, 404);
    return json([]);
  }
  const recruitment = demoRecruitment(url, method);
  if (recruitment) return role === 'ADMIN' ? recruitment : json({ message: 'Cet espace de recrutement est réservé aux RH en démonstration.' }, 403);
  const serviceCatalog = demoServiceCatalogs(url, method, role);
  if (serviceCatalog) return serviceCatalog;
  if (method === 'GET' && p === '/companies/bulletin-template') return json({ config: { templateId: 'default' } });
  if (method === 'GET' && /^\/payrolls\/demo-payroll-\d+$/.test(p)) {
    const payroll = payrolls.find(item => item.id === p.split('/')[2]);
    if (!payroll || role === 'EMPLOYEE' && payroll.employeeId !== user.employeeId) return json({ message: 'Bulletin de démonstration introuvable.' }, 404);
    return json(payroll);
  }
  if (/export|print|bulletin|document|signature|payment|checkout|subscription.*pay/.test(p)) return json({ message: 'Cette sortie officielle ou action de paiement est indisponible en démonstration.' }, 501);
  if (p === '/auth/verify' || p === '/auth/login' || p === '/auth/refresh') return json({ user });
  if (p === '/auth/me') return json(user);
  if (p === '/auth/logout') return json({ success: true });
  if (p === '/employees/me' && method === 'GET') return json(store.employees[0]);
  if (p === '/employees/me' && method === 'PATCH') {
    if (!store.employees[0].selfServiceEnabled) return json({ message: 'Autorisation RH requise pour modifier votre profil.' }, 403);
    const allowed = ['phone', 'email', 'address', 'city', 'nationality', 'gender', 'bloodType', 'pathology', 'fatherName', 'motherName', 'educationLevel', 'emergencyContactName', 'emergencyContactRelation', 'emergencyContactPhone', 'hasDrivingLicense', 'drivingLicenseNumber', 'foreignLanguages', 'uniformSize', 'shoeSize', 'photoUrl'];
    if (Object.keys(body).some(key => !allowed.includes(key))) return json({ message: 'Champ non modifiable en auto-service.' }, 400);
    Object.assign(store.employees[0], body);
    return json(store.employees[0]);
  }
  if (p === '/employees/simple' && method === 'GET') return json(store.employees.filter(employee=>employee.status==='ACTIVE'));
  const employeeManagement = demoEmployeeManagement(url, method, body, store, role);
  if (employeeManagement) return employeeManagement;
  const workforceResponse = demoWorkforce(url, method, store, role);
  if (workforceResponse) return workforceResponse;
  const presenceResponse = demoPresenceScreens(url, method, store, role);
  if (presenceResponse) return presenceResponse;
  const assetResponse = demoAssets(url, method, body, store, role);
  if (assetResponse) return assetResponse;
  const trainingResponse = demoTraining(url, method, body, store, role);
  if (trainingResponse) return trainingResponse;
  const permissionTicket = demoPermissionTickets(url, method, body, store, role);
  if (permissionTicket) return permissionTicket;
  const absenceRequest = demoAbsenceRequests(url, method, body, store, role);
  if (absenceRequest) return absenceRequest;
  if (p === '/loans-dashboard' && method === 'GET') {
    if (role !== 'ADMIN') return json({ message: 'Accès réservé aux RH.' }, 403);
    if (url.searchParams.has('companyId') && url.searchParams.get('companyId') !== company.id) return json({ message: 'Entreprise inaccessible.' }, 404);
    return json(demoLoansDashboard(url.searchParams, store));
  }
  const advanceHistory = p.match(/^\/loans\/advances\/([^/]+)\/history$/);
  if (advanceHistory && method === 'GET') {
    const item = store.advances.find(x => x.id === advanceHistory[1]);
    if (!item || (role !== 'ADMIN' && item.employeeId !== employees[0].id)) return json({ message: 'Demande inaccessible.' }, 404);
    return json([]);
  }
  if (p === '/departments' && method === 'GET') return json(departments);
  if (/^\/companies\/(mine|me|demo-company)$/.test(p)) return json(company);
  if (p === '/approvals/me') return json({ canSign: false, functions: [], externalCompanies: [] });
  const approvalMatch = p.match(/^\/approvals\/requests\/(loan|advance)\/([^/]+)\/(state|decision)$/);
  if (approvalMatch) {
    const [, kind, id, action] = approvalMatch;
    const collection: Record<string, unknown>[] = kind === 'loan' ? store.loans : store.advances;
    const item = collection.find(entry => entry.id === id && store.employees.some(employee => employee.id === entry.employeeId && employee.companyId === company.id));
    if (!item || (role !== 'ADMIN' && item.employeeId !== employees[0].id)) return json({ message: 'Demande inaccessible.' }, 404);
    if (action === 'state' && method === 'GET') return json({ requestType: kind === 'loan' ? 'LOAN' : 'ADVANCE', requestId: id, requestStatus: item.status, circuitActive: false, steps: [], opinions: [], missing: [], pending: null, me: { canDecide: role === 'ADMIN', canGiveOpinionAs: [] } });
    if (action === 'decision' && method === 'POST') {
      if (role !== 'ADMIN') return json({ message: 'Décision réservée aux RH.' }, 403);
      if (!['PENDING', 'PENDING_DG'].includes(String(item.status))) return json({ message: 'Cette demande a déjà été traitée.' }, 400);
      if (!['APPROVE', 'REJECT'].includes(String(body.decision))) return json({ message: 'Décision invalide.' }, 400);
      if (body.decision === 'REJECT' && (typeof body.rejectionReason !== 'string' || !body.rejectionReason.trim())) return json({ message: 'Le motif du refus est obligatoire.' }, 400);
      item.status = body.decision === 'REJECT' ? 'REJECTED' : kind === 'loan' ? 'ACTIVE' : 'APPROVED';
      if (body.decision === 'REJECT') item.rejectionReason = body.rejectionReason;
      else item.recoverViaPayroll = body.recoverViaPayroll ?? true;
      return json({ status: 'FINALIZED', request: item });
    }
    return json({ message: 'Action non simulée.' }, 501);
  }
  if (p.startsWith('/approvals/inbox')) return json([]);
  if (p === '/finance/status') return json({ enabled: false });
  if (p === '/leaves/me/eligibility') return json({ eligible: true });
  const leaveScreen = demoLeaveScreen(url, method, store, role);
  if (leaveScreen) return leaveScreen;
  if (p.includes('balance')) return json(leaveBalance);
  if (p === '/leaves/provision') return json({ totalProvision: 0, details: [] });
  if (p === '/company-deductions') return json([]);
  const pendingDemoLoans = store.loans.filter(item => ['PENDING', 'PENDING_DG'].includes(item.status)).length;
  const pendingDemoAdvances = store.advances.filter(item => item.status === 'PENDING').length;
  const demoMonthlyRequests = [...store.loans, ...store.advances].filter(item => item.createdAt.startsWith('2026-11') && !['CANCELLED', 'REJECTED'].includes(item.status)).reduce((total, item) => total + Number(item.amount), 0);
  if (p === '/dashboard/pending-requests-count') return json({ total: 3 + pendingDemoLoans + pendingDemoAdvances, leaves: 1, absences: 1, permissions: 1, loans: pendingDemoLoans, advances: pendingDemoAdvances });
  if (p === '/dashboard/summary') return json({ ...dashboardUpcoming,totalEmployees: 3, masseSalariale: 1455000, attendanceRate: 67, absentToday: 1, pendingRequestsTotal: 3 + pendingDemoLoans + pendingDemoAdvances, pendingLeaves: 1, pendingAbsences: 1, pendingPermissions: 1, leavesThisMonth: 1, totalPretAvanceMois: demoMonthlyRequests, recentPayrolls: recentDashboardPayrolls, recentActivities: [{ id: 'demo-activity', type: 'LEAVE', text: 'Demande de congé', subText: 'Patrick Likibi a envoyé sa demande.', time: '2026-11-12T08:00:00+01:00' }] });
  if (p === '/dashboard/charts') return json({ salaryTrend, deptDistribution: departments.map(d => ({ ...d, value: 1 })) });
  if (p === '/payrolls') return json(payrolls.filter(e => !url.searchParams.get('employeeId') || e.employeeId === url.searchParams.get('employeeId')));
  if (p === '/notifications/read-all' && method === 'PATCH') { store.notifications = []; return json({ success: true }); }
  if (/^\/notifications\/[^/]+\/read$/.test(p)) { store.notifications = store.notifications.filter(n => n.id !== p.split('/')[2]); return json({ success: true }); }
  if (p === '/notifications') return json(store.notifications);
  if (p === '/chat/poll') return json({ v: 'demo', changed: false, unreadTotal: 0, conversations: [], receipts: [], serverTime: '2026-11-12T09:00:00+01:00' });
  if (p === '/chat/away') return json({ success: true });
  const historyMatch = p.match(/^\/loans\/([^/]+)\/history$/);
  if (historyMatch && method === 'GET') {
    const loan = store.loans.find(item => item.id === historyMatch[1]);
    if (!loan || (role !== 'ADMIN' && loan.employeeId !== employees[0].id)) return json({ message: 'Demande inaccessible.' }, 404);
    return json(loanHistory.filter(item => item.loanId === loan.id));
  }
  const cancelMatch = p.match(/^\/loans\/(advances\/)?([^/]+)\/cancel$/);
  if (cancelMatch && method === 'PATCH') {
    const collection = cancelMatch[1] ? store.advances : store.loans;
    const item = collection.find(entry => entry.id === cancelMatch[2] && entry.employeeId === employees[0].id);
    if (!item) return json({ message: 'Demande inaccessible.' }, 404);
    if (!['PENDING', 'PENDING_DG'].includes(item.status)) return json({ message: 'Seule une demande en attente peut être annulée.' }, 400);
    item.status = 'CANCELLED';
    return json(item);
  }
  if (p === '/subscriptions/current') return json(subscription);
  if (p === '/subscriptions/usage') return json(usage);
  if (p === '/attendance/today') return json(store.attendance);
  if (p.startsWith('/attendance/employee/')) return json([]);
  if ((p === '/loans' || p === '/loans/advances') && method === 'POST') {
    if (body.employeeId && role !== 'ADMIN') return json({ message: 'Création pour un employé réservée aux RH.' }, 403);
    const target = store.employees.find(employee => employee.id === (body.employeeId || employees[0].id) && employee.companyId === company.id);
    if (!target) return json({ message: 'Employé inaccessible.' }, 404);
    const amount = Number(body.amount), monthly = Number(body.monthlyRepayment);
    const advance = p === '/loans/advances';
    if (!Number.isFinite(amount) || amount <= 0 || typeof body.reason !== 'string' || body.reason.trim().length < 3 || (!advance && (!Number.isFinite(monthly) || monthly <= 0))) return json({ message: 'Vérifiez le montant, la mensualité et le motif.' }, 400);
    const record = { ...body, id: `demo-request-${crypto.randomUUID()}`, employeeId: target.id, employee: target, amount, remainingBalance: amount, status: role === 'ADMIN' && body.employeeId ? (advance ? 'APPROVED' : 'ACTIVE') : 'PENDING', printAuthorized: false, createdAt: new Date().toISOString() };
    const collection: Record<string, unknown>[] = advance ? store.advances : store.loans;
    collection.push(record);
    return json(record, 201);
  }
  const collections: Record<string, { id: string; employeeId?: string; status?: string; [key: string]: unknown }[]> = {
    '/employees': store.employees, '/leaves': store.leaves, '/loans/advances': store.advances, '/loans': store.loans,
    '/absences': store.absences, '/absence-requests': store.absences, '/permissions': store.permissions, '/permission-tickets': store.permissions,
  };
  const base = Object.keys(collections).sort((a, b) => b.length - a.length).find(k => p === k || p.startsWith(k + '/'));
  if (base) {
    const list = collections[base]; const suffix = p.slice(base.length + 1); const mine = suffix === 'me';
    if (method === 'GET') {
      if (suffix && !mine) { const found = list.find(e => e.id === suffix); return found ? json(found) : json({ message: 'Exemple non disponible pour cet écran.' }, 404); }
      const items = mine ? list.filter(e => e.employeeId === employees[0].id) : list;
      if (base === '/employees') { const page = Number(url.searchParams.get('page') || 1), limit = Number(url.searchParams.get('limit') || 20); return json({ data: items.slice((page - 1) * limit, page * limit), total: items.length, page, limit, totalPages: 1, meta: { total: items.length, page, limit, totalPages: 1 } }); }
      return json(items);
    }
    // Existing payroll, approval, debt and entitlement calculations are intentionally not simulated.
    return json({ message: 'Cette action métier sera disponible après intégration du module de démonstration.' }, 501);
  }
  return json({ message: `Exemple non disponible : ${method} ${p}` }, 501);
}

export function installDemoTransport(role: 'ADMIN' | 'EMPLOYEE') {
  const original = window.fetch; const store = createDemoStore();
  const base = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', window.location.origin);
  window.fetch = async (input, init) => {
    const raw = input instanceof Request ? input.url : String(input); const url = new URL(raw, window.location.origin);
    if (url.origin !== base.origin || !(url.pathname === base.pathname.replace(/\/$/, '') || url.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/'))) return original.call(window, input, init);
    if (init?.signal?.aborted || input instanceof Request && input.signal.aborted) throw new DOMException('Requête annulée', 'AbortError');
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let body: Record<string, unknown> = {};
    try { const rawBody = init?.body || (input instanceof Request ? await input.clone().text() : null); if (typeof rawBody === 'string') body = JSON.parse(rawBody); } catch { /* non-JSON requests stay unsupported */ }
    const relative = new URL(url); relative.pathname = url.pathname.slice(base.pathname.replace(/\/$/, '').length) || '/';
    return demoResponse(relative, method, body, store, role);
  };
  return () => { window.fetch = original; };
}