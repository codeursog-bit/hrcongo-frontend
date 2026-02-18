import { Company, ActivityLog, PaymentFailure, ChartDataPoint, Transaction, SubscriptionEvent, TaxBracket, Holiday, AuditLogEntry, CohortData, GeoDistribution, LogEntry, ApiRequest, DbQuery, ErrorGroup, SecurityEvent, WebhookDelivery, CronJob } from './types';
import { LayoutDashboard, Building, Users, CreditCard, Activity, Settings, Shield, FileText, Server, BarChart3, Terminal } from 'lucide-react';

export const COMPANIES: Company[] = [
  { 
    id: '1', 
    name: 'TechSolutions Congo', 
    logo: 'TS', 
    plan: 'Pro', 
    employees: 45, 
    lastActive: '2 mins ago', 
    status: 'Active', 
    mrr: 30000, 
    region: 'Brazzaville',
    rccm: 'CG-BZV-01-2023-B12',
    email: 'contact@techsolutions.cg',
    joinedDate: 'Jan 2023',
    contactPerson: 'Jean-Pierre Mbemba',
    health: { payment: 'good', usage: 'good', support: 'warning' }
  },
  { 
    id: '2', 
    name: 'Hotel Prestige', 
    logo: 'HP', 
    plan: 'Starter', 
    employees: 12, 
    lastActive: '15 mins ago', 
    status: 'Suspended', 
    mrr: 15000, 
    region: 'Pointe-Noire',
    rccm: 'CG-PNR-01-2022-B14',
    email: 'admin@hotelprestige.cg',
    joinedDate: 'Mar 2022',
    contactPerson: 'Marie Claire',
    health: { payment: 'critical', usage: 'warning', support: 'good' }
  },
  { 
    id: '3', 
    name: 'Mining Corp SA', 
    logo: 'MC', 
    plan: 'Enterprise', 
    employees: 340, 
    lastActive: '1 hour ago', 
    status: 'Active', 
    mrr: 120000, 
    region: 'Pointe-Noire',
    rccm: 'CG-PNR-01-2020-B99',
    email: 'it@miningcorp.cg',
    joinedDate: 'Jun 2020',
    contactPerson: 'Robert Nguesso',
    health: { payment: 'good', usage: 'good', support: 'good' }
  },
  { 
    id: '4', 
    name: 'Logistics Plus', 
    logo: 'LP', 
    plan: 'Pro', 
    employees: 67, 
    lastActive: '4 hours ago', 
    status: 'Active', 
    mrr: 30000, 
    region: 'Brazzaville',
    rccm: 'CG-BZV-01-2023-B45',
    email: 'ops@logisticsplus.cg',
    joinedDate: 'Feb 2023',
    contactPerson: 'Alain K.',
    health: { payment: 'good', usage: 'warning', support: 'good' }
  },
  { 
    id: '5', 
    name: 'Fresh Foods Ltd', 
    logo: 'FF', 
    plan: 'Trial', 
    employees: 8, 
    lastActive: '1 day ago', 
    status: 'Trial', 
    mrr: 0, 
    region: 'Dolisie',
    rccm: 'CG-DOL-01-2024-B01',
    email: 'hello@freshfoods.cg',
    joinedDate: 'Dec 2024',
    contactPerson: 'Sarah M.',
    health: { payment: 'good', usage: 'critical', support: 'good' }
  },
  { 
    id: '6', 
    name: 'Banque Verte', 
    logo: 'BV', 
    plan: 'Enterprise', 
    employees: 150, 
    lastActive: '5 mins ago', 
    status: 'Active', 
    mrr: 95000, 
    region: 'Brazzaville',
    rccm: 'CG-BZV-01-2019-B22',
    email: 'security@banqueverte.cg',
    joinedDate: 'Sep 2019',
    contactPerson: 'Director IT',
    health: { payment: 'good', usage: 'good', support: 'good' }
  },
  { 
    id: '7', 
    name: 'Construction AC', 
    logo: 'CA', 
    plan: 'Starter', 
    employees: 22, 
    lastActive: '2 days ago', 
    status: 'Active', 
    mrr: 15000, 
    region: 'Oyo',
    rccm: 'CG-OYO-01-2023-B11',
    email: 'info@constructionac.cg',
    joinedDate: 'Jul 2023',
    contactPerson: 'Pierre L.',
    health: { payment: 'warning', usage: 'good', support: 'warning' }
  },
  { 
    id: '8', 
    name: 'Digital Agency', 
    logo: 'DA', 
    plan: 'Pro', 
    employees: 15, 
    lastActive: '30 mins ago', 
    status: 'Active', 
    mrr: 30000, 
    region: 'Brazzaville',
    rccm: 'CG-BZV-01-2024-B88',
    email: 'hello@digitalagency.cg',
    joinedDate: 'Jan 2024',
    contactPerson: 'Alice Web',
    health: { payment: 'good', usage: 'good', support: 'good' }
  },
];

export const RECENT_ACTIVITY: ActivityLog[] = [
  { id: '1', message: 'TechSolutions upgraded to Pro', time: '2h ago', type: 'success' },
  { id: '2', message: 'New company registered: ABC Trading', time: '3h ago', type: 'info' },
  { id: '3', message: 'Payment received: 30,000 FCFA from Logistics Plus', time: '4h ago', type: 'success' },
  { id: '4', message: 'Support ticket #234 resolved', time: '5h ago', type: 'info' },
  { id: '5', message: 'Failed payment: Hotel Prestige', time: '6h ago', type: 'critical' },
  { id: '6', message: 'System backup completed', time: '8h ago', type: 'info' },
];

export const FAILED_PAYMENTS: PaymentFailure[] = [
  { id: '1', companyName: 'TechSolutions Congo', amount: 30000, attempts: 3, error: 'Insufficient Funds', contact: 'finance@techsolutions.cg' },
  { id: '2', companyName: 'Hotel Prestige', amount: 15000, attempts: 1, error: 'Card Expired', contact: 'manager@hotelprestige.cg' },
];

export const CHART_DATA: ChartDataPoint[] = [
  { name: 'Jan', revenue: 1800000, companies: 120, users: 1200 },
  { name: 'Feb', revenue: 1950000, companies: 128, users: 1350 },
  { name: 'Mar', revenue: 2050000, companies: 135, users: 1480 },
  { name: 'Apr', revenue: 2100000, companies: 140, users: 1600 },
  { name: 'May', revenue: 2150000, companies: 145, users: 1720 },
  { name: 'Jun', revenue: 2280000, companies: 152, users: 1847 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: '1', invoiceId: 'INV-2025-0123', companyId: '1', companyName: 'TechSolutions Congo', companyLogo: 'TS', plan: 'Pro', amount: 30000, date: '15 Jan, 14:30', method: 'Airtel Money', status: 'Success' },
  { id: '2', invoiceId: 'INV-2025-0122', companyId: '3', companyName: 'Mining Corp SA', companyLogo: 'MC', plan: 'Enterprise', amount: 120000, date: '15 Jan, 10:15', method: 'Bank Transfer', status: 'Success' },
  { id: '3', invoiceId: 'INV-2025-0121', companyId: '2', companyName: 'Hotel Prestige', companyLogo: 'HP', plan: 'Starter', amount: 15000, date: '14 Jan, 18:00', method: 'Manual', status: 'Failed' },
  { id: '4', invoiceId: 'INV-2025-0120', companyId: '6', companyName: 'Banque Verte', companyLogo: 'BV', plan: 'Enterprise', amount: 95000, date: '14 Jan, 09:45', method: 'Bank Transfer', status: 'Pending' },
  { id: '5', invoiceId: 'INV-2025-0119', companyId: '4', companyName: 'Logistics Plus', companyLogo: 'LP', plan: 'Pro', amount: 30000, date: '13 Jan, 11:20', method: 'MTN Mobile Money', status: 'Success' },
  { id: '6', invoiceId: 'INV-2025-0118', companyId: '8', companyName: 'Digital Agency', companyLogo: 'DA', plan: 'Pro', amount: 30000, date: '12 Jan, 16:30', method: 'Airtel Money', status: 'Success' },
];

export const SUBSCRIPTION_EVENTS: SubscriptionEvent[] = [
  { id: '1', type: 'upgrade', companyName: 'TechSolutions', details: 'Starter → Pro', impact: 15000, date: 'Jan 12' },
  { id: '2', type: 'new', companyName: 'Fresh Foods', details: 'New Signup', impact: 0, date: 'Jan 10' },
  { id: '3', type: 'cancellation', companyName: 'Old Shop Ltd', details: 'Churned', impact: -15000, date: 'Jan 08' },
  { id: '4', type: 'upgrade', companyName: 'Digital Agency', details: 'Starter → Pro', impact: 15000, date: 'Jan 05' },
];

export const REVENUE_HISTORY_DATA = [
  { month: 'Feb', value: 1800000 },
  { month: 'Mar', value: 1950000 },
  { month: 'Apr', value: 2050000 },
  { month: 'May', value: 2100000 },
  { month: 'Jun', value: 2150000 },
  { month: 'Jul', value: 2120000 },
  { month: 'Aug', value: 2180000 },
  { month: 'Sep', value: 2220000 },
  { month: 'Oct', value: 2150000 },
  { month: 'Nov', value: 2240000 },
  { month: 'Dec', value: 2350000 },
  { month: 'Jan', value: 2280000 },
];

export const NAVIGATION_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Terminal, label: 'Monitoring', path: '/admin/monitoring' },
  { icon: Building, label: 'Companies', path: '/admin/companies' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: CreditCard, label: 'Billing', path: '/admin/billing' },
  { icon: Activity, label: 'System Health', path: 'admin/health' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

// --- Settings Constants ---

export const ITS_BRACKETS: TaxBracket[] = [
  { id: '1', min: 0, max: 100000, rate: 0 },
  { id: '2', min: 100001, max: 500000, rate: 1 },
  { id: '3', min: 500001, max: 1100000, rate: 5 },
  { id: '4', min: 1100001, max: 3000000, rate: 15 },
  { id: '5', min: 3000001, max: 5000000, rate: 25 },
  { id: '6', min: 5000001, max: null, rate: 40 },
];

export const HOLIDAYS_2025: Holiday[] = [
  { id: '1', date: '2025-01-01', name: 'Nouvel An' },
  { id: '2', date: '2025-05-01', name: 'Fête du Travail' },
  { id: '3', date: '2025-06-10', name: 'Réconciliation' },
  { id: '4', date: '2025-08-15', name: 'Fête Nationale' },
  { id: '5', date: '2025-12-25', name: 'Noël' },
];

export const AUDIT_LOGS: AuditLogEntry[] = [
  { id: '1', timestamp: '15/01/2025 14:23', user: 'You', action: 'Update Payroll', details: 'Changed CNSS rate 4% → 4.5%', ip: '197.10.22.45' },
  { id: '2', timestamp: '14/01/2025 09:15', user: 'Admin2', action: 'Create Company', details: 'Created company TechSolutions', ip: '41.202.4.12' },
  { id: '3', timestamp: '13/01/2025 11:00', user: 'System', action: 'Backup', details: 'Automated daily backup (2.4GB)', ip: 'Localhost' },
  { id: '4', timestamp: '12/01/2025 16:45', user: 'You', action: 'Update Settings', details: 'Enabled IP Whitelisting', ip: '197.10.22.45' },
  { id: '5', timestamp: '10/01/2025 08:30', user: 'Admin3', action: 'User Login', details: 'Failed login attempt (3x)', ip: '154.66.12.1' },
];

// --- Analytics Data ---

export const ACQUISITION_DATA = [
    { day: '1', value: 2 },
    { day: '5', value: 4 },
    { day: '10', value: 3 },
    { day: '15', value: 6 },
    { day: '20', value: 8 },
    { day: '25', value: 10 },
    { day: '30', value: 12 },
];

export const CHURN_REASONS = [
    { name: 'Pricing', value: 40, color: '#F87171' },
    { name: 'Competitor', value: 30, color: '#FBBF24' },
    { name: 'Closed', value: 20, color: '#9CA3AF' },
    { name: 'Other', value: 10, color: '#60A5FA' },
];

export const DAU_DATA = [
    { day: 'Mon', value: 420 },
    { day: 'Tue', value: 480 },
    { day: 'Wed', value: 510 },
    { day: 'Thu', value: 490 },
    { day: 'Fri', value: 542 }, // Peak (Payroll day)
    { day: 'Sat', value: 280 },
    { day: 'Sun', value: 234 },
];

export const FEATURE_USAGE = [
    { name: 'Dashboard', value: 1847 },
    { name: 'Employees', value: 1654 },
    { name: 'Payroll', value: 1423 },
    { name: 'Leaves', value: 1245 },
    { name: 'Attendance', value: 987 },
    { name: 'Reports', value: 756 },
    { name: 'Docs', value: 543 },
];

export const COHORT_DATA: CohortData[] = [
    { cohort: 'Jan 24', months: [100, 92, 85, 78, 71] },
    { cohort: 'Feb 24', months: [100, 95, 88, 82, 0] },
    { cohort: 'Mar 24', months: [100, 91, 86, 0, 0] },
    { cohort: 'Apr 24', months: [100, 94, 0, 0, 0] },
    { cohort: 'May 24', months: [100, 0, 0, 0, 0] },
];

export const LATENCY_DATA = [
    { time: '00:00', value: 45 },
    { time: '04:00', value: 50 },
    { time: '08:00', value: 120 },
    { time: '10:00', value: 340 }, // Peak
    { time: '12:00', value: 180 },
    { time: '16:00', value: 150 },
    { time: '20:00', value: 90 },
];

export const GEO_DISTRIBUTION: GeoDistribution[] = [
    { city: 'Brazzaville', count: 98, growth: 12 },
    { city: 'Pointe-Noire', count: 41, growth: 18 },
    { city: 'Dolisie', count: 7, growth: 2 },
    { city: 'Nkayi', count: 4, growth: 0 },
    { city: 'Other', count: 2, growth: 0 },
];

export const INDUSTRY_DATA = [
    { name: 'Tech/IT', value: 35, color: '#60A5FA' },
    { name: 'Retail', value: 28, color: '#34D399' },
    { name: 'Services', value: 18, color: '#A78BFA' },
    { name: 'Manufact.', value: 12, color: '#FBBF24' },
    { name: 'Other', value: 7, color: '#9CA3AF' },
];

// --- Monitoring Mock Data ---

export const LOGS_DATA: LogEntry[] = [
  { id: '1', timestamp: '14:23:45.123', level: 'INFO', service: 'Auth', message: 'User login successful', user: 'admin@tech.cg', ip: '197.234.56.78', duration: 234 },
  { id: '2', timestamp: '14:23:44.890', level: 'INFO', service: 'API', message: 'GET /api/employees', user: 'hr@hotel.cg', ip: '41.202.4.12', duration: 87 },
  { id: '3', timestamp: '14:23:43.456', level: 'WARN', service: 'Auth', message: 'Failed login attempt (Invalid password)', user: 'unknown', ip: '45.12.34.56', duration: 12 },
  { id: '4', timestamp: '14:23:42.112', level: 'ERROR', service: 'Payroll', message: 'Calculation failed: Division by zero', user: 'finance@mining.cg', ip: '154.66.12.1', duration: 450 },
  { id: '5', timestamp: '14:23:41.005', level: 'DEBUG', service: 'DB', message: 'Query executed: SELECT * FROM users WHERE id=?', user: 'system', duration: 4 },
  { id: '6', timestamp: '14:23:40.888', level: 'INFO', service: 'Worker', message: 'Processed job: send_email_123', user: 'system', duration: 1200 },
  { id: '7', timestamp: '14:23:39.567', level: 'FATAL', service: 'Core', message: 'Redis connection lost', user: 'system', duration: 0 },
];

export const API_REQUESTS_DATA: ApiRequest[] = [
  { id: '1', timestamp: '14:23:45', method: 'POST', endpoint: '/api/payroll/calculate', user: 'admin@tech.cg', company: 'TechSol', status: 200, duration: 234 },
  { id: '2', timestamp: '14:23:44', method: 'GET', endpoint: '/api/employees', user: 'hr@hotel.cg', company: 'Hotel Pr.', status: 200, duration: 87 },
  { id: '3', timestamp: '14:23:43', method: 'POST', endpoint: '/api/auth/login', user: '-', company: '-', status: 401, duration: 12 },
  { id: '4', timestamp: '14:23:41', method: 'GET', endpoint: '/api/reports/summary', user: 'finance@mining.cg', company: 'Mining Corp', status: 500, duration: 450 },
  { id: '5', timestamp: '14:23:40', method: 'PUT', endpoint: '/api/settings', user: 'admin@tech.cg', company: 'TechSol', status: 200, duration: 156 },
];

export const DB_QUERIES_DATA: DbQuery[] = [
  { id: '1', timestamp: '14:23:45', query: 'SELECT * FROM employees WHERE company_id = ?', duration: 156, rows: 48, table: 'employees', user: 'admin' },
  { id: '2', timestamp: '14:23:44', query: 'INSERT INTO payrolls (id, amount, status) VALUES (...)', duration: 23, rows: 1, table: 'payrolls', user: 'hr' },
  { id: '3', timestamp: '14:23:42', query: 'UPDATE users SET last_login = NOW() WHERE id = ?', duration: 12, rows: 1, table: 'users', user: 'system' },
  { id: '4', timestamp: '14:23:40', query: 'SELECT * FROM logs ORDER BY created_at DESC LIMIT 100', duration: 890, rows: 100, table: 'logs', user: 'admin' },
];

export const ERROR_GROUPS_DATA: ErrorGroup[] = [
  { id: '1', message: "Cannot read property 'salary' of undefined", count: 12, trend: 200, affectedUsers: 3, lastSeen: '12m ago', status: 'Open' },
  { id: '2', message: "Database connection timeout (5000ms)", count: 5, trend: 0, affectedUsers: 5, lastSeen: '1h ago', status: 'Investigating' },
  { id: '3', message: "Invalid API Key provided", count: 45, trend: -10, affectedUsers: 12, lastSeen: '2m ago', status: 'Ignored' },
];

export const SECURITY_EVENTS_DATA: SecurityEvent[] = [
  { id: '1', timestamp: '14:23:45', type: 'Failed login (3x)', user: 'unknown', ip: '45.12.34.56', location: 'Lagos, Nigeria', risk: 'High' },
  { id: '2', timestamp: '14:22:10', type: 'Suspicious activity', user: 'admin@tech.cg', ip: '197.x.x.x', location: 'Brazzaville, Congo', risk: 'Medium' },
  { id: '3', timestamp: '14:20:05', type: 'Password changed', user: 'hr@hotel.cg', ip: '197.x.x.x', location: 'Pointe-Noire, Congo', risk: 'Low' },
];

export const WEBHOOKS_DATA: WebhookDelivery[] = [
  { id: '1', timestamp: '14:23:45', endpoint: 'https://client.com/webhook', event: 'payroll.created', status: 200, attempts: 1, duration: '234ms' },
  { id: '2', timestamp: '14:22:10', endpoint: 'https://api.example.com/hook', event: 'employee.updated', status: 500, attempts: 3, duration: 'timeout' },
];

export const CRON_JOBS_DATA: CronJob[] = [
  { id: '1', name: 'Daily backup', schedule: 'Daily 02:00', lastRun: '8 hours ago', nextRun: 'in 16 hours', status: 'Success', duration: '12 min' },
  { id: '2', name: 'Send reminders', schedule: 'Every hour', lastRun: '23 min ago', nextRun: 'in 37 min', status: 'Success', duration: '3 sec' },
  { id: '3', name: 'Calculate analytics', schedule: 'Daily 01:00', lastRun: '9 hours ago', nextRun: 'in 15 hours', status: 'Failed', duration: 'timeout' },
];
