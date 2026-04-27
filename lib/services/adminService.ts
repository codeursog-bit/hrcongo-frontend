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
  // ── Entreprises ──────────────────────────────────────────────────────────
  getCompanies: (filters?: { status?: string; plan?: string; search?: string }) => {
    const p = new URLSearchParams();
    if (filters?.status) p.set('status', filters.status);
    if (filters?.plan)   p.set('plan',   filters.plan);
    if (filters?.search) p.set('search', filters.search);
    return adminFetch<any>(`/admin/companies?${p}`);
  },
  getCompanyDetails: (id: string)      => adminFetch<any>(`/admin/companies/${id}`),

  // ── Monitoring — données complètes ───────────────────────────────────────
  getMonitoringData: () => adminFetch<any>('/admin/monitoring'),

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