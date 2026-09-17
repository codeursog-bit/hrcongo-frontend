// ============================================================================
// 📁 lib/services/adminService.ts
// Client API typé pour le super admin — utilise le cookie HttpOnly
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function adminFetch<T>(
  endpoint: string,
  method:   'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?:    any,
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    throw new Error('Session expirée');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Erreur ${res.status}` }));
    throw new Error(err.message || `Erreur ${res.status}`);
  }

  return res.json();
}

export const adminService = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  getDashboardStats:  () => adminFetch<any>('/admin/stats'),
  getAnalytics:       () => adminFetch<any>('/admin/analytics'),
  getBilling:         () => adminFetch<any>('/admin/billing'),
  // ── Présence / activité utilisateurs ────────────────────────────────────
  getUsersOnlineNow:      () => adminFetch<any>('/admin/users/online'),
  getUsersRecentlyOnline: (hours?: number) => adminFetch<any>(`/admin/users/recently-online${hours ? `?hours=${hours}` : ''}`),
  getMostActiveUsers:     (period?: 'today' | 'week' | 'month') => adminFetch<any>(`/admin/users/most-active?period=${period ?? 'week'}`),
  getPushStatus:          () => adminFetch<any>('/admin/users/push-status'),
  // ── Portefeuilles multi-entreprises ─────────────────────────────────────
  searchPortfolioUsers: (q?: string) => adminFetch<any>(`/admin/portfolio-users/search${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  getPortfolioUserDetail: (userId: string) => adminFetch<any>(`/admin/portfolio-users/${userId}`),
  attachCompanyToUser: (userId: string, companyId: string) =>
    adminFetch<any>(`/admin/portfolio-users/${userId}/attach-company`, 'POST', { companyId }),
  detachCompanyFromUser: (userId: string, companyId: string) =>
    adminFetch<any>(`/admin/portfolio-users/${userId}/companies/${companyId}`, 'DELETE'),
  togglePortfolioFlag: (userId: string, enabled: boolean, maxCompanies?: number) =>
    adminFetch<any>(`/admin/portfolio-users/${userId}/toggle-flag`, 'POST', { enabled, maxCompanies }),
  createPortfolioUser: (data: { email: string; password: string; firstName: string; lastName: string; companyIds: string[]; maxCompanies?: number }) =>
    adminFetch<any>('/admin/portfolio-users', 'POST', data),
  // ── Entreprises ──────────────────────────────────────────────────────────
  getCompanies: (filters?: { status?: string; plan?: string; search?: string; includeArchived?: boolean }) => {
    const p = new URLSearchParams();
    if (filters?.status)   p.set('status',   filters.status);
    if (filters?.plan)     p.set('plan',     filters.plan);
    if (filters?.search)   p.set('search',   filters.search);
    if (filters?.includeArchived) p.set('includeArchived', 'true');
    return adminFetch<any>(`/admin/companies?${p}`);
  },
  getCompanyDetails: (id: string)      => adminFetch<any>(`/admin/companies/${id}`),

  updateCompany: (id: string, data: { legalName?: string; tradeName?: string; email?: string; phone?: string; address?: string; city?: string; website?: string }) =>
    adminFetch<any>(`/admin/companies/${id}`, 'PATCH', data),

  updateCompanyStatus: (id: string, isActive: boolean, reason?: string) =>
    adminFetch<any>(`/admin/companies/${id}/status`, 'PATCH', { isActive, reason }),

  archiveCompany: (id: string, reason?: string) =>
    adminFetch<any>(`/admin/companies/${id}/archive`, 'POST', { reason }),

  unarchiveCompany: (id: string) =>
    adminFetch<any>(`/admin/companies/${id}/unarchive`, 'POST'),

  // ── Abonnements ──────────────────────────────────────────────────────────
  // ── Abonnements ──────────────────────────────────────────────────────────
  getSubscriptions: (filters?: { expiringInDays?: number; expired?: boolean; status?: string }) => {
    const p = new URLSearchParams();
    if (filters?.expiringInDays !== undefined) p.set('expiringInDays', String(filters.expiringInDays));
    if (filters?.expired) p.set('expired', 'true');
    if (filters?.status) p.set('status', filters.status);
    return adminFetch<any>(`/admin/subscriptions?${p}`);
  },

  activateSubscription: (companyId: string, opts?: { amount?: number; paymentMethod?: string; reason?: string }) =>
    adminFetch<any>(`/admin/companies/${companyId}/subscription/activate`, 'PATCH', opts ?? {}),

  setSubscriptionPeriod: (companyId: string, data: {
    startDate?: string; endDate: string; billingCycle?: 'MONTHLY' | 'YEARLY';
    amount?: number; paymentMethod?: string; reason?: string;
  }) =>
    adminFetch<any>(`/admin/companies/${companyId}/subscription/period`, 'PATCH', data),

  suspendSubscription: (companyId: string, status?: 'PAUSED' | 'CANCELED', reason?: string) =>
    adminFetch<any>(`/admin/companies/${companyId}/subscription/suspend`, 'PATCH', { status, reason }),

  changeSubscriptionPlan: (companyId: string, plan: string, pricePerMonth?: number, reason?: string) =>
    adminFetch<any>(`/admin/companies/${companyId}/subscription/plan`, 'PATCH', { plan, pricePerMonth, reason }),

  extendSubscription: (companyId: string, days: number, opts?: { amount?: number; paymentMethod?: string; reason?: string }) =>
    adminFetch<any>(`/admin/companies/${companyId}/subscription/extend`, 'PATCH', { days, ...opts }),

  // ── Monitoring — données complètes ───────────────────────────────────────
  getMonitoringData: () => adminFetch<any>('/admin/monitoring'),

  getSystemLogs: (filters?: { page?: number; limit?: number; source?: string; level?: string; companyId?: string; from?: string; to?: string }) => {
    const p = new URLSearchParams();
    if (filters?.page) p.set('page', String(filters.page));
    if (filters?.limit) p.set('limit', String(filters.limit));
    if (filters?.source) p.set('source', filters.source);
    if (filters?.level) p.set('level', filters.level);
    if (filters?.companyId) p.set('companyId', filters.companyId);
    if (filters?.from) p.set('from', filters.from);
    if (filters?.to) p.set('to', filters.to);
    return adminFetch<any>(`/admin/monitoring/system-logs?${p}`);
  },
  getSystemLogSources: () => adminFetch<any>('/admin/monitoring/system-logs/sources'),

  // ── Audit logs — filtrables ───────────────────────────────────────────────
  getAuditLogs: (filters?: {
    page?:      number;   limit?:     number;
    companyId?: string;   action?:    string;
    entity?:    string;   severity?:  string;
    userId?:    string;   from?:      string;
    to?:        string;
  }) => {
    const p = new URLSearchParams();
    if (filters?.page)      p.set('page',      String(filters.page));
    if (filters?.limit)     p.set('limit',     String(filters.limit));
    if (filters?.companyId) p.set('companyId', filters.companyId);
    if (filters?.action)    p.set('action',    filters.action);
    if (filters?.entity)    p.set('entity',    filters.entity);
    if (filters?.severity)  p.set('severity',  filters.severity);
    if (filters?.userId)    p.set('userId',    filters.userId);
    if (filters?.from)      p.set('from',      filters.from);
    if (filters?.to)        p.set('to',        filters.to);
    return adminFetch<any>(`/admin/monitoring/logs?${p}`);
  },

  // ── Sécurité ─────────────────────────────────────────────────────────────
  getSecurityEvents: (limit = 200) =>
    adminFetch<any>(`/admin/monitoring/security?limit=${limit}`),

  // ── Stats globales ────────────────────────────────────────────────────────
  getMonitoringStats: () => adminFetch<any>('/admin/monitoring/stats'),

  // ── Santé serveur ─────────────────────────────────────────────────────────
  getServerHealth: () => adminFetch<any>('/admin/monitoring/health'),
  getHealthDetails:() => adminFetch<any>('/health/details'),

  // ── Stats par entreprise ──────────────────────────────────────────────────
  getCompanyAudit: (id: string) => adminFetch<any>(`/admin/monitoring/company/${id}`),

  // ── Utilisateurs ─────────────────────────────────────────────────────────
  getUsers: () => adminFetch<any>('/admin/users'),

  // ── Affiliés ──────────────────────────────────────────────────────────────
  getAffiliates: () => adminFetch<any>('/affiliate/admin'),

  // ── Paramètres ───────────────────────────────────────────────────────────
  getSettings:    () => adminFetch<any>('/admin/settings'),
  updateSettings: (data: any) => adminFetch<any>('/admin/settings', 'PATCH', data),

  // ── Utilisateurs super admin ──────────────────────────────────────────────
  inviteSuperAdmin:(email: string) =>
    adminFetch<any>('/users/invite', 'POST', { email, role: 'SUPER_ADMIN' }),

  // ── Alias billing ────────────────────────────────────────────────────────
  getBillingStats: () => adminFetch<any>('/admin/billing'),

  // ── Maintenance BDD ─────────────────────────────────────────────────────
  runCleanup: () => adminFetch<any>('/admin/maintenance/cleanup', 'POST'),

  // ── Error tracking ────────────────────────────────────────────────────────
  getErrors: (filters?: {
    page?: number; limit?: number; companyId?: string; errorCode?: string;
    statusCode?: number; path?: string; severity?: string;
    resolved?: boolean; from?: string; to?: string;
  }) => {
    const p = new URLSearchParams();
    if (filters?.page)       p.set('page',       String(filters.page));
    if (filters?.limit)      p.set('limit',       String(filters.limit));
    if (filters?.companyId)  p.set('companyId',   filters.companyId!);
    if (filters?.errorCode)  p.set('errorCode',   filters.errorCode!);
    if (filters?.statusCode) p.set('statusCode',  String(filters.statusCode));
    if (filters?.path)       p.set('path',        filters.path!);
    if (filters?.severity)   p.set('severity',    filters.severity!);
    if (filters?.from)       p.set('from',        filters.from!);
    if (filters?.to)         p.set('to',          filters.to!);
    if (filters?.resolved !== undefined) p.set('resolved', String(filters.resolved));
    return adminFetch<any>(`/admin/errors?${p}`);
  },

  getErrorStats:   () => adminFetch<any>('/admin/errors/stats'),

  resolveError: (id: string, note?: string) =>
    adminFetch<any>(`/admin/errors/${id}/resolve`, 'PATCH', { note }),

  resolveByCode: (code: string) =>
    adminFetch<any>(`/admin/errors/resolve-by-code/${code}`, 'PATCH'),

  cleanupErrors: (days = 30) =>
    adminFetch<any>(`/admin/errors/cleanup?days=${days}`, 'DELETE'),
};