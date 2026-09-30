// ============================================================================
// 📁 services/display-screen-api.ts
// Contrat front ↔ backend du pointage par scan QR dynamique + code secret.
//  • Routes « écran »  : jeton d'appareil dans le header x-display-token
//                        (localStorage de la TABLETTE, remis à l'approbation).
//  • Routes « admin »  : JWT habituel via `api`.
//  • Routes « employé »: JWT habituel via `api` — jamais de route publique.
// ============================================================================
import { api } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'konza_display_token';

export type ScreenScope = 'COMPANY' | 'PORTFOLIO';
export type ScreenStatus = 'PENDING' | 'APPROVED' | 'REVOKED';
export type PunchMode = 'SCAN' | 'GPS';

export interface QrToken { token: string; validFrom: number; validUntil: number } // epoch ms
export interface QrBatch { tokens: QrToken[]; serverTime: number; stepSeconds: number }
export interface ScreenInfo {
  name: string | null;
  scope: ScreenScope;
  label: string;
  workHours: { startHour: number; endHour: number } | null;
}
export interface PunchResult {
  success: boolean;
  direction?: 'IN' | 'OUT';
  firstName?: string;
  message?: string;
  code?: string;
  at?: string;
  requiresConfirmation?: boolean;
  reason?: string;
}
export interface AdminScreen {
  id: string; name: string | null; status: ScreenStatus; scope: ScreenScope | null;
  companyLabel: string | null; lastSeenAt: string | null; approvedAt: string | null;
}
export interface SecretStatus { hasSecret: boolean; updatedAt: string | null }

// ── Jeton d'appareil (tablette) ─────────────────────────────────────────────
export const deviceToken = {
  get: (): string | null => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* stockage indisponible */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* noop */ } },
};

// ── Appels « écran » ────────────────────────────────────────────────────────
async function deviceFetch<T>(path: string, init: RequestInit = {}, withToken = true): Promise<{ status: number; data: T | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withToken) {
    const t = deviceToken.get();
    if (!t) return { status: 401, data: null };            // pas de jeton → à appairer
    headers['x-display-token'] = t;
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers: { ...headers, ...(init.headers as any) } });
  let data: any = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, data };
}

export const displayApi = {
  startPairing: () =>
    deviceFetch<{ pairingCode: string; pollToken: string; expiresAt: number }>('/display/pairing/start', { method: 'POST' }, false),
  pollPairing: (pollToken: string) =>
    deviceFetch<{ status: 'PENDING' | 'APPROVED' | 'EXPIRED'; deviceToken?: string }>(
      '/display/pairing/poll', { method: 'POST', body: JSON.stringify({ pollToken }) }, false),
  me:      () => deviceFetch<ScreenInfo>('/display/me'),
  qrBatch: () => deviceFetch<QrBatch>('/display/qr-batch'),
  secretPunch: (secret: string, confirm?: boolean) =>
    deviceFetch<PunchResult & { message?: string }>('/display/secret-punch', {
      method: 'POST', body: JSON.stringify({ secret, confirm: confirm || undefined }),
    }),
};

// ── Admin / RH ──────────────────────────────────────────────────────────────
export const adminScreensApi = {
  list:    () => api.get<AdminScreen[]>('/admin/display-screens'),
  approve: (b: { code: string; name: string; scope: ScreenScope }) =>
    api.post<AdminScreen>('/admin/display-screens/approve', b),
  rename:  (id: string, name: string) => api.patch<AdminScreen>(`/admin/display-screens/${id}`, { name }),
  revoke:  (id: string) => api.delete<{ success: boolean }>(`/admin/display-screens/${id}`),
  regenerate: (id: string) => api.post<{ success: boolean }>(`/admin/display-screens/${id}/regenerate`, {}),
};

// ── Employé connecté (scan) + code secret géré par ADMIN / RH uniquement ──────────────────────────────
export const employeeQrApi = {
  /** enabled = un écran approuvé couvre mon entreprise ; defaultMode = SCAN si enabled, sinon GPS. */
  config:  () => api.get<{ enabled: boolean; defaultMode: PunchMode }>('/pointage-qr/config'),
  scan:    (b: { token: string; confirm?: boolean }) => api.post<PunchResult>('/pointage-qr/scan', b),

  // RH
  employeeSecret:       (employeeId: string) => api.get<SecretStatus>(`/pointage-qr/secret/employee/${employeeId}`),
  setEmployeeSecret:    (employeeId: string, secret: string) =>
    api.put<{ success: boolean }>(`/pointage-qr/secret/employee/${employeeId}`, { secret }),
  removeEmployeeSecret: (employeeId: string) =>
    api.delete<{ success: boolean }>(`/pointage-qr/secret/employee/${employeeId}`),
};

// ── Force du code secret (miroir du backend, pour un retour immédiat) ───────
export function secretError(raw: string): string | null {
  const n = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  if (/^\d+$/.test(n)) {
    if (n.length < 6 || n.length > 10) return 'Un PIN doit contenir entre 6 et 10 chiffres.';
    let asc = true, desc = true;
    for (let i = 1; i < n.length; i++) { const d = +n[i] - +n[i - 1]; if (d !== 1) asc = false; if (d !== -1) desc = false; }
    if (/^(\d)\1+$/.test(n) || asc || desc) return 'Ce PIN est trop facile à deviner (suite ou chiffre répété).';
    return null;
  }
  if (n.length < 5 || n.length > 32) return 'Un mot secret doit contenir entre 5 et 32 caractères.';
  if (/^(.)\1+$/.test(n)) return 'Ce mot secret est trop facile à deviner.';
  return null;
}