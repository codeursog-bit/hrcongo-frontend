// ============================================================================
// 👥 PAGE SUPER ADMIN — Gestion des comptes (tous les utilisateurs de la plateforme)
// Fichier: frontend/app/admin/(protected)/comptes/page.tsx
// Liste filtrée · statistiques cliquables · fiche détaillée · actions tracées
// Les actions exigent un motif et sont écrites dans le journal d'audit.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Loader2, AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight, Unlock, KeyRound,
  ShieldOff, LogOut, Power, Mail, UserCog, Copy, Check, Building2, Briefcase, Trash2, ExternalLink,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const errMsg = (e: any) => e?.message || 'Une erreur est survenue';
const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super admin', ADMIN: 'Admin', HR_MANAGER: 'RH', MANAGER: 'Manager', EMPLOYEE: 'Employé',
  CABINET_ADMIN: 'Cabinet · admin', CABINET_GESTIONNAIRE: 'Cabinet · gestionnaire',
};
const ASSIGNABLE = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'];

const STATES: { id: string; label: string; stat: string; tone?: string }[] = [
  { id: '', label: 'Tous', stat: 'total' },
  { id: 'active', label: 'Actifs', stat: 'active' },
  { id: 'disabled', label: 'Désactivés', stat: 'disabled', tone: 'text-red-300' },
  { id: 'locked', label: 'Bloqués', stat: 'locked', tone: 'text-amber-300' },
  { id: 'never_logged', label: 'Jamais connectés', stat: 'neverLogged' },
  { id: 'inactive_90', label: 'Inactifs > 90 j', stat: 'inactive90' },
  { id: 'no_2fa', label: 'Admin/RH sans 2FA', stat: 'privilegedWithout2fa', tone: 'text-amber-300' },
  { id: 'multi', label: 'Multi-entreprises', stat: 'multiCompany' },
  { id: 'must_change', label: 'Mot de passe à changer', stat: 'mustChangePassword' },
];

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600';
const btnGhost =
  'flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50';
const btnDanger =
  'flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 rounded-lg text-xs transition-colors disabled:opacity-50';

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2 border ${
      m.ok ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : 'text-red-300 border-red-500/25 bg-red-500/10'}`}>
      {m.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {m.text}
    </div>
  );
}

// ── Modale de confirmation (motif obligatoire + champ optionnel) ─────────────
type Confirm = {
  title: string;
  description: React.ReactNode;
  danger?: boolean;
  confirmLabel: string;
  input?: { label: string; kind: 'email' | 'role'; initial?: string };
  run: (reason: string, value: string) => Promise<void>;
};

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [value, setValue] = useState(c.input?.initial ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = reason.trim().length >= 5 && (!c.input || value.trim().length > 0);

  const go = async () => {
    setBusy(true); setErr(null);
    try { await c.run(reason.trim(), value.trim()); onClose(); }
    catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold ${c.danger ? 'text-red-300' : 'text-white'}`}>{c.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">{c.description}</div>
        {c.input && (
          <label className="text-xs text-gray-400 space-y-1 block">{c.input.label}
            {c.input.kind === 'role' ? (
              <select className={inputCls} value={value} onChange={e => setValue(e.target.value)}>
                {ASSIGNABLE.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            ) : (
              <input type="email" className={inputCls} value={value} onChange={e => setValue(e.target.value)} />
            )}
          </label>
        )}
        <label className="text-xs text-gray-400 space-y-1 block">
          Motif (obligatoire — enregistré dans le journal d'audit)
          <textarea className={`${inputCls} min-h-[70px]`} maxLength={300} value={reason}
            placeholder="Ex. : demande du client, faute de frappe dans l'email"
            onChange={e => setReason(e.target.value)} />
        </label>
        {err && <Msg m={{ ok: false, text: err }} />}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose} disabled={busy}>Annuler</button>
          <button disabled={!valid || busy} onClick={go}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white disabled:opacity-50 ${c.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {busy && <Loader2 size={14} className="animate-spin" />} {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fiche détaillée (panneau latéral) ────────────────────────────────────────
function AccountDrawer({
  userId, onClose, onChanged, ask, notify,
}: {
  userId: string; onClose: () => void; onChanged: () => void;
  ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void;
}) {
  const router = useRouter();
  const [u, setU] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [temp, setTemp] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setU(await adminService.get<any>(`/admin/accounts/${userId}`)); }
    catch (e) { notify({ ok: false, text: errMsg(e) }); onClose(); }
    finally { setLoading(false); }
  }, [userId, notify, onClose]);
  useEffect(() => { load(); }, [load]);

  const after = (text: string) => { notify({ ok: true, text }); load(); onChanged(); };
  const base = `/admin/actions/users/${userId}`;

  const simple = (path: string, title: string, desc: string, ok: string, danger = false) => ask({
    title, danger, confirmLabel: title,
    description: <><p><b className="text-gray-200">{u.name}</b> · {u.email}</p><p>{desc}</p></>,
    run: async (reason) => { await adminService.post(`${base}/${path}`, { reason }); after(ok); },
  });

  if (loading && !u) {
    return (
      <Shell onClose={onClose}><p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p></Shell>
    );
  }
  if (!u) return null;
  const protectedAccount = u.role === 'SUPER_ADMIN';
  const canChangeRole = !['SUPER_ADMIN', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE'].includes(u.role);

  return (
    <Shell onClose={onClose}>
      <div>
        <h2 className="text-lg font-semibold text-white">{u.name}</h2>
        <p className="text-sm text-gray-500">{u.email} · {ROLE_LABEL[u.role] ?? u.role}</p>
        <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
          <span className={`px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{u.isActive ? 'Actif' : 'Désactivé'}</span>
          {u.isLocked && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Bloqué jusqu'à {fmtDT(u.lockedUntil)}</span>}
          {u.twoFactorEnabled ? <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">2FA</span> : <span className="px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-400">Sans 2FA</span>}
          {u.mustChangePassword && <span className="px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300">Mot de passe à changer</span>}
          {u.multiCompany.enabled && <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300">Multi-entreprises (max {u.multiCompany.maxCompanies})</span>}
        </div>
      </div>

      {!protectedAccount && (
        <Section title="Actions">
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => simple('unlock', 'Débloquer le compte', 'Remet à zéro les échecs de connexion et lève le blocage.', 'Compte débloqué')}><Unlock size={12} /> Débloquer</button>
            <button className={btnGhost} onClick={() => ask({
              title: 'Réinitialiser le mot de passe', danger: true, confirmLabel: 'Générer un mot de passe',
              description: <p>Un mot de passe temporaire sera affiché une seule fois ; changement obligatoire à la connexion, sessions coupées.</p>,
              run: async (reason) => { const r = await adminService.post<any>(`${base}/reset-password`, { reason }); setTemp({ email: r.email, password: r.tempPassword }); load(); onChanged(); },
            })}><KeyRound size={12} /> Réinitialiser le mot de passe</button>
            {u.twoFactorEnabled && <button className={btnGhost} onClick={() => simple('disable-2fa', 'Désactiver la 2FA', "L'utilisateur devra la réactiver lui-même.", '2FA désactivée', true)}><ShieldOff size={12} /> Couper la 2FA</button>}
            <button className={btnGhost} onClick={() => simple('revoke-sessions', 'Révoquer les sessions', 'Déconnecte immédiatement tous ses appareils.', 'Sessions révoquées')}><LogOut size={12} /> Révoquer les sessions</button>
            <button className={btnGhost} onClick={() => ask({
              title: "Corriger l'adresse email", confirmLabel: 'Changer l’email', danger: true,
              description: <p>Actuelle : <b className="text-gray-200">{u.email}</b>. Les sessions seront coupées.</p>,
              input: { label: 'Nouvelle adresse email', kind: 'email', initial: u.email },
              run: async (reason, email) => { await adminService.patch(`${base}/email`, { email, reason }); after('Email modifié'); },
            })}><Mail size={12} /> Changer l'email</button>
            {canChangeRole && <button className={btnGhost} onClick={() => ask({
              title: 'Changer le rôle', confirmLabel: 'Changer le rôle', danger: true,
              description: <p>Rôle actuel : <b className="text-gray-200">{ROLE_LABEL[u.role] ?? u.role}</b>. L'utilisateur devra se reconnecter. Impossible de rétrograder le dernier admin actif.</p>,
              input: { label: 'Nouveau rôle', kind: 'role', initial: ASSIGNABLE.includes(u.role) ? u.role : 'EMPLOYEE' },
              run: async (reason, role) => { await adminService.patch(`${base}/role`, { role, reason }); after('Rôle modifié'); },
            })}><UserCog size={12} /> Changer le rôle</button>}
            <button className={u.isActive ? btnDanger : btnGhost} onClick={() => ask({
              title: u.isActive ? 'Désactiver le compte' : 'Réactiver le compte', danger: u.isActive,
              confirmLabel: u.isActive ? 'Désactiver' : 'Réactiver',
              description: u.isActive ? <p>Les sessions ouvertes seront coupées immédiatement.</p> : <p>Le compte pourra de nouveau se connecter.</p>,
              run: async (reason) => { await adminService.patch(`${base}/active`, { isActive: !u.isActive, reason }); after(u.isActive ? 'Compte désactivé' : 'Compte réactivé'); },
            })}><Power size={12} /> {u.isActive ? 'Désactiver' : 'Réactiver'}</button>
          </div>
        </Section>
      )}

      <Section title={`Entreprises (${u.companies.length})`}>
        {u.companies.length === 0 && <p className="text-sm text-gray-500">Aucune entreprise liée</p>}
        <div className="space-y-2">
          {u.companies.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
              <div>
                <p className="text-white flex items-center gap-2"><Building2 size={13} /> {c.name}
                  {c.primary && <span className="text-[10px] px-1.5 rounded bg-gray-800 text-gray-400">principale</span>}
                  {!c.isActive && <span className="text-[10px] px-1.5 rounded bg-red-500/15 text-red-300">inactive</span>}
                </p>
                <p className="text-xs text-gray-500">{c.subscription ? `${c.subscription.plan} · ${c.subscription.status} · fin ${fmtD(c.subscription.currentPeriodEnd)}` : 'Sans abonnement'}</p>
              </div>
              <button className={btnGhost} onClick={() => router.push(`/admin/companies/${c.id}/gestion`)}><ExternalLink size={12} /> Gestion</button>
            </div>
          ))}
        </div>
        {u.multiCompany.enabled && (
          <button className={`${btnGhost} mt-2`} onClick={() => router.push('/admin/portefeuilles')}><Briefcase size={12} /> Rattacher / détacher des entreprises</button>
        )}
      </Section>

      <Section title="Sécurité">
        <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
          <dt className="text-gray-500">Dernière connexion</dt><dd className="text-gray-300">{fmtDT(u.security.lastLoginAt)}</dd>
          <dt className="text-gray-500">Dernière IP</dt><dd className="text-gray-300">{u.security.lastLoginIp ?? '—'}</dd>
          <dt className="text-gray-500">Dernière activité</dt><dd className="text-gray-300">{fmtDT(u.security.lastActiveAt)}</dd>
          <dt className="text-gray-500">Première connexion</dt><dd className="text-gray-300">{fmtDT(u.security.firstLoginAt)}</dd>
          <dt className="text-gray-500">Mot de passe changé le</dt><dd className="text-gray-300">{fmtDT(u.security.passwordChangedAt)}</dd>
          <dt className="text-gray-500">Échecs de connexion</dt><dd className="text-gray-300">{u.failedLoginAttempts}</dd>
          <dt className="text-gray-500">Appareils push</dt><dd className="text-gray-300">{u.push.devices}</dd>
          <dt className="text-gray-500">Compte créé le</dt><dd className="text-gray-300">{fmtD(u.createdAt)}</dd>
        </dl>
      </Section>

      <Section title={`Sessions (${u.sessions.active} active${u.sessions.active > 1 ? 's' : ''})`}>
        {u.sessions.recent.length === 0 && <p className="text-sm text-gray-500">Aucune session enregistrée</p>}
        <div className="space-y-1">
          {u.sessions.recent.map((s: any) => (
            <p key={s.id} className="text-xs text-gray-400 flex justify-between">
              <span>{fmtDT(s.createdAt)}</span>
              <span className={s.active ? 'text-emerald-300' : s.revokedAt ? 'text-red-300' : 'text-gray-600'}>{s.active ? 'active' : s.revokedAt ? 'révoquée' : 'expirée'}</span>
            </p>
          ))}
        </div>
      </Section>

      {u.pendingInvitations.length > 0 && (
        <Section title="Invitations en attente">
          {u.pendingInvitations.map((i: any) => (
            <div key={i.id} className="flex items-center justify-between text-xs text-gray-400">
              <span>{ROLE_LABEL[i.role] ?? i.role} · expire le {fmtD(i.expiresAt)}</span>
              <button className={btnDanger} onClick={() => ask({
                title: "Annuler l'invitation", danger: true, confirmLabel: 'Annuler l’invitation',
                description: <p>Le lien envoyé deviendra inutilisable.</p>,
                run: async (reason) => { await adminService.delete(`/admin/actions/invitations/${i.id}`, { reason }); after('Invitation annulée'); },
              })}><Trash2 size={12} /> Annuler</button>
            </div>
          ))}
        </Section>
      )}

      <Section title="Activité récente">
        {u.activity.length === 0 && <p className="text-sm text-gray-500">Aucune activité</p>}
        <div className="space-y-1.5">
          {u.activity.map((a: any) => (
            <div key={a.id} className="text-xs"><p className="text-gray-300">{a.description || a.action}</p><p className="text-gray-600">{fmtDT(a.createdAt)} · {a.entity}</p></div>
          ))}
        </div>
      </Section>

      {u.adminActions.length > 0 && (
        <Section title="Actions super admin sur ce compte">
          {u.adminActions.map((a: any) => (
            <div key={a.id} className="text-xs"><p className="text-gray-300">{a.summary}</p><p className="text-gray-600">{fmtDT(a.occurredAt)}</p></div>
          ))}
        </Section>
      )}

      {temp && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-white">Mot de passe temporaire</h3>
            <p className="text-sm text-gray-400">Pour <b className="text-gray-200">{temp.email}</b>. Il ne sera plus jamais affiché : transmettez-le par un canal sûr.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-emerald-300 tracking-wider">{temp.password}</code>
              <button className={btnGhost} onClick={async () => { await navigator.clipboard.writeText(temp.password).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
            <div className="flex justify-end"><button className={btnGhost} onClick={() => setTemp(null)}>J'ai noté le mot de passe</button></div>
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="absolute inset-0" onClick={onClose} />
      <aside className="relative w-full max-w-xl h-full overflow-y-auto bg-gray-900 border-l border-gray-800 p-5 space-y-5">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white"><X size={18} /></button>
        {children}
      </aside>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><h3 className="text-xs uppercase tracking-wide text-gray-500">{title}</h3>{children}</div>;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [stats, setStats] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [state, setState] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = useCallback((m: { ok: boolean; text: string }) => { setMsg(m); setTimeout(() => setMsg(null), 5000); }, []);

  useEffect(() => {
    adminService.getCompanies().then((r: any) => setCompanies(Array.isArray(r) ? r : r?.data ?? [])).catch(() => {});
  }, []);

  const loadStats = useCallback(() => { adminService.get<any>('/admin/accounts/stats').then(setStats).catch(() => {}); }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (q.trim()) qs.set('q', q.trim());
      if (role) qs.set('role', role);
      if (state) qs.set('state', state);
      if (companyId) qs.set('companyId', companyId);
      setData(await adminService.get<any>(`/admin/accounts?${qs.toString()}`));
    } catch (e) { notify({ ok: false, text: errMsg(e) }); }
    finally { setLoading(false); }
  }, [q, role, state, companyId, page, notify]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setPage(1); }, [q, role, state, companyId]);

  const refreshAll = () => { load(); loadStats(); };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2"><Users size={20} /> Gestion des comptes</h1>
        <p className="text-sm text-gray-500 mt-1">Tous les utilisateurs de la plateforme. Les actions exigent un motif et sont tracées.</p>
      </div>

      {stats && (
        <div className="flex flex-wrap gap-2">
          {STATES.map(s => (
            <button key={s.id || 'all'} onClick={() => setState(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${
                state === s.id ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}>
              {s.label} · <span className={s.tone ?? ''}>{stats[s.stat] ?? 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="relative col-span-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className={`${inputCls} pl-9`} placeholder="Email, prénom ou nom…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={inputCls} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">Toutes les entreprises</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.tradeName || c.legalName}</option>)}
        </select>
      </div>

      <Msg m={msg} />

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 text-left">
            <tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Entreprise</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Dernière connexion</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && !data && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500"><Loader2 size={14} className="inline animate-spin" /> Chargement…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Aucun compte</td></tr>}
            {data?.items.map((u: any) => (
              <tr key={u.id} onClick={() => setSelected(u.id)} className="hover:bg-gray-800/50 cursor-pointer">
                <td className="px-4 py-3"><p className="text-white">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></td>
                <td className="px-4 py-3 text-gray-300">{ROLE_LABEL[u.role] ?? u.role}{u.multiCompany && <span className="ml-1 text-xs text-purple-300">· {u.linkedCompanies} ent.</span>}</td>
                <td className="px-4 py-3 text-gray-400">{u.company?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{u.isActive ? 'Actif' : 'Désactivé'}</span>
                    {u.isLocked && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Bloqué</span>}
                    {u.twoFactorEnabled && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">2FA</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{fmtDT(u.lastLoginAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
            <span>{data.total} compte(s)</span>
            <div className="flex items-center gap-2">
              <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></button>
              <span>Page {page}</span>
              <button className={btnGhost} disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </div>

      {selected && <AccountDrawer userId={selected} onClose={() => setSelected(null)} onChanged={refreshAll} ask={setConfirm} notify={notify} />}
      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}