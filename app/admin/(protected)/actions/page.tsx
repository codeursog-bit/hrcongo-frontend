// ============================================================================
// 🛠️ PAGE SUPER ADMIN — Actions de support (remplace les requêtes SQL à la main)
// Fichier: frontend/app/admin/(protected)/actions/page.tsx
// Onglets : Bulletins · Utilisateurs · Journal des actions
// Chaque action demande un motif et est tracée dans le journal d'audit.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench, FileText, Users, History, Search, Loader2, AlertTriangle, CheckCircle2, X, Trash2,
  Unlock, KeyRound, ShieldOff, LogOut, Power, Copy, Check, ChevronLeft, ChevronRight, Lock,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

type Tab = 'payrolls' | 'users' | 'history';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon', VALIDATED: 'Validé', TO_PAY: 'À payer', PAID: 'Payé', CANCELLED: 'Annulé',
};
const STATUS_CLS: Record<string, string> = {
  DRAFT: 'bg-gray-700/40 text-gray-300', VALIDATED: 'bg-blue-500/15 text-blue-300',
  TO_PAY: 'bg-amber-500/15 text-amber-300', PAID: 'bg-emerald-500/15 text-emerald-300',
  CANCELLED: 'bg-red-500/15 text-red-300',
};
const SEV_CLS: Record<string, string> = {
  INFO: 'text-blue-300', WARN: 'text-amber-300', CRITICAL: 'text-red-300',
};

const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
const errMsg = (e: any) => e?.message || e?.response?.data?.message || 'Une erreur est survenue';

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
      m.ok ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : 'text-red-300 border-red-500/25 bg-red-500/10'
    }`}>
      {m.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {m.text}
    </div>
  );
}

// ── Modale de confirmation avec motif obligatoire ────────────────────────────
type Confirm = {
  title: string;
  description: React.ReactNode;
  danger?: boolean;
  confirmLabel: string;
  /** Case « action critique » à cocher (ex. suppression d'un bulletin payé) */
  criticalCheck?: string;
  run: (reason: string, critical: boolean) => Promise<void>;
};

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [critical, setCritical] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = reason.trim().length >= 5 && (!c.criticalCheck || critical);

  const go = async () => {
    setBusy(true); setErr(null);
    try { await c.run(reason.trim(), critical); onClose(); }
    catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold ${c.danger ? 'text-red-300' : 'text-white'}`}>{c.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">{c.description}</div>
        <label className="text-xs text-gray-400 space-y-1 block">
          Motif (obligatoire — enregistré dans le journal d'audit)
          <textarea className={`${inputCls} min-h-[70px]`} maxLength={300} value={reason}
            placeholder="Ex. : demande du client #123, paiement enregistré par erreur"
            onChange={e => setReason(e.target.value)} />
        </label>
        {c.criticalCheck && (
          <label className="flex items-start gap-2 text-xs text-red-300">
            <input type="checkbox" className="mt-0.5" checked={critical} onChange={e => setCritical(e.target.checked)} />
            {c.criticalCheck}
          </label>
        )}
        {err && <Msg m={{ ok: false, text: err }} />}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose} disabled={busy}>Annuler</button>
          <button
            disabled={!valid || busy} onClick={go}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white disabled:opacity-50 ${
              c.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {busy && <Loader2 size={14} className="animate-spin" />} {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Onglet Bulletins ─────────────────────────────────────────────────────────
function PayrollsTab({ ask, notify }: { ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void }) {
  const now = new Date();
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(now.getFullYear()));
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminService.getCompanies()
      .then((r: any) => setCompanies(Array.isArray(r) ? r : r?.data ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!companyId) { setData(null); return; }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ companyId, page: String(page) });
      if (month) qs.set('month', month);
      if (year) qs.set('year', year);
      if (status) qs.set('status', status);
      if (search.trim()) qs.set('search', search.trim());
      setData(await adminService.get<any>(`/admin/actions/payrolls?${qs.toString()}`));
    } catch (e) { notify({ ok: false, text: errMsg(e) }); setData(null); }
    finally { setLoading(false); }
  }, [companyId, month, year, status, search, page, notify]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { setPage(1); }, [companyId, month, year, status, search]);

  const changeStatus = (p: any, target: string) => ask({
    title: `Passer le bulletin en « ${STATUS_LABEL[target]} »`,
    danger: p.status === 'PAID' || target === 'PAID',
    confirmLabel: 'Changer le statut',
    description: (
      <>
        <p><b className="text-gray-200">{p.employee}</b> · période {p.period}</p>
        <p>{STATUS_LABEL[p.status]} → <b className="text-gray-200">{STATUS_LABEL[target]}</b></p>
        <p className="text-xs text-gray-500">Les indicateurs validé / payé et les dates sont remis en cohérence automatiquement.</p>
      </>
    ),
    run: async (reason) => {
      await adminService.patch(`/admin/actions/payrolls/${p.id}/status`, { status: target, reason });
      notify({ ok: true, text: `Bulletin de ${p.employee} (${p.period}) → ${STATUS_LABEL[target]}` });
      load();
    },
  });

  const remove = (p: any) => ask({
    title: 'Supprimer ce bulletin',
    danger: true,
    confirmLabel: 'Supprimer définitivement',
    criticalCheck: (p.status === 'PAID' || p.status === 'TO_PAY')
      ? `Je confirme supprimer un bulletin au statut « ${STATUS_LABEL[p.status]} »` : undefined,
    description: (
      <>
        <p><b className="text-gray-200">{p.employee}</b> · période {p.period} · {STATUS_LABEL[p.status]}</p>
        <p>Les prêts, avances et retenues prélevés sur ce bulletin seront remis en état. Cette action est irréversible.</p>
      </>
    ),
    run: async (reason, critical) => {
      await adminService.delete(`/admin/actions/payrolls/${p.id}`, { reason, force: critical });
      notify({ ok: true, text: `Bulletin de ${p.employee} (${p.period}) supprimé` });
      load();
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <select className={`${inputCls} col-span-2`} value={companyId} onChange={e => setCompanyId(e.target.value)}>
          <option value="">Choisir une entreprise…</option>
          {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name || c.tradeName || c.legalName}</option>)}
        </select>
        <select className={inputCls} value={month} onChange={e => setMonth(e.target.value)}>
          <option value="">Tous les mois</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>)}
        </select>
        <input type="number" className={inputCls} value={year} onChange={e => setYear(e.target.value)} placeholder="Année" />
        <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className={`${inputCls} pl-9`} placeholder="Rechercher un employé…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {!companyId && <p className="text-sm text-gray-500">Choisissez une entreprise pour afficher ses bulletins.</p>}
      {loading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p>}

      {data && !loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 text-left">
              <tr><th className="px-4 py-3">Employé</th><th className="px-4 py-3">Période</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Aucun bulletin</td></tr>}
              {data.items.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-white">{p.employee}</td>
                  <td className="px-4 py-3 text-gray-300">{p.period}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    {p.lockedByCompta && <span title="Transmis à Compta : seule l'annulation est possible" className="ml-2 inline-flex items-center gap-1 text-xs text-amber-300"><Lock size={11} /> Compta</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300"
                        value="" onChange={e => e.target.value && changeStatus(p, e.target.value)}>
                        <option value="">Changer le statut…</option>
                        {Object.entries(STATUS_LABEL)
                          .filter(([k]) => k !== p.status && (!p.lockedByCompta || k === 'CANCELLED'))
                          .map(([k, v]) => <option key={k} value={k}>→ {v}</option>)}
                      </select>
                      {!p.lockedByCompta && <button className={btnDanger} onClick={() => remove(p)}><Trash2 size={12} /> Supprimer</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
            <span>{data.total} bulletin(s)</span>
            <div className="flex items-center gap-2">
              <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></button>
              <span>Page {page}</span>
              <button className={btnGhost} disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet Utilisateurs ──────────────────────────────────────────────────────
function UsersTab({ ask, notify }: { ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [temp, setTemp] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!q.trim()) { setUsers([]); return; }
    setLoading(true);
    try { setUsers(await adminService.get<any[]>(`/admin/actions/users?q=${encodeURIComponent(q.trim())}`)); }
    catch (e) { notify({ ok: false, text: errMsg(e) }); }
    finally { setLoading(false); }
  }, [q, notify]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const simple = (u: any, path: string, title: string, desc: string, okText: string, danger = false) => ask({
    title, danger, confirmLabel: title,
    description: <><p><b className="text-gray-200">{u.name}</b> · {u.email}</p><p>{desc}</p></>,
    run: async (reason) => { await adminService.post(`/admin/actions/users/${u.id}/${path}`, { reason }); notify({ ok: true, text: okText }); load(); },
  });

  const toggleActive = (u: any) => ask({
    title: u.isActive ? 'Désactiver le compte' : 'Réactiver le compte',
    danger: u.isActive, confirmLabel: u.isActive ? 'Désactiver' : 'Réactiver',
    description: <><p><b className="text-gray-200">{u.name}</b> · {u.email}</p>
      {u.isActive && <p>Les sessions ouvertes seront coupées immédiatement.</p>}</>,
    run: async (reason) => {
      await adminService.patch(`/admin/actions/users/${u.id}/active`, { isActive: !u.isActive, reason });
      notify({ ok: true, text: `${u.name} : compte ${u.isActive ? 'désactivé' : 'réactivé'}` });
      load();
    },
  });

  const resetPwd = (u: any) => ask({
    title: 'Réinitialiser le mot de passe', danger: true, confirmLabel: 'Générer un mot de passe',
    description: <><p><b className="text-gray-200">{u.name}</b> · {u.email}</p>
      <p>Un mot de passe temporaire sera affiché une seule fois. L'utilisateur devra le changer à la connexion et ses sessions seront coupées.</p></>,
    run: async (reason) => {
      const r = await adminService.post<any>(`/admin/actions/users/${u.id}/reset-password`, { reason });
      setTemp({ email: r.email, password: r.tempPassword });
      load();
    },
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className={`${inputCls} pl-9`} placeholder="Email, prénom ou nom de l'utilisateur…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {loading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Recherche…</p>}
      {!q.trim() && <p className="text-sm text-gray-500">Saisissez un email ou un nom pour trouver un compte.</p>}

      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-white text-sm font-medium">{u.name} <span className="text-xs text-gray-500">· {u.role}</span></p>
                <p className="text-xs text-gray-500">{u.email}{u.company ? ` · ${u.company.name}` : ''}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className={`px-2 py-0.5 rounded-full ${u.isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>{u.isActive ? 'Actif' : 'Désactivé'}</span>
                {u.isLocked && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Bloqué</span>}
                {u.twoFactorEnabled && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">2FA</span>}
                {u.mustChangePassword && <span className="px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300">Mot de passe à changer</span>}
              </div>
            </div>
            <p className="text-xs text-gray-500">Dernière connexion : {fmtDateTime(u.lastLoginAt)} · échecs de connexion : {u.failedLoginAttempts}</p>
            {u.role !== 'SUPER_ADMIN' && (
              <div className="flex flex-wrap gap-2">
                <button className={btnGhost} onClick={() => simple(u, 'unlock', 'Débloquer le compte', 'Remet à zéro les échecs de connexion et lève le blocage.', `${u.name} débloqué`)}><Unlock size={12} /> Débloquer</button>
                <button className={btnGhost} onClick={() => resetPwd(u)}><KeyRound size={12} /> Réinitialiser le mot de passe</button>
                {u.twoFactorEnabled && <button className={btnGhost} onClick={() => simple(u, 'disable-2fa', 'Désactiver la 2FA', "L'utilisateur devra la réactiver lui-même.", `2FA de ${u.name} désactivée`, true)}><ShieldOff size={12} /> Couper la 2FA</button>}
                <button className={btnGhost} onClick={() => simple(u, 'revoke-sessions', 'Révoquer les sessions', 'Déconnecte immédiatement tous ses appareils.', `Sessions de ${u.name} révoquées`)}><LogOut size={12} /> Révoquer les sessions</button>
                <button className={u.isActive ? btnDanger : btnGhost} onClick={() => toggleActive(u)}><Power size={12} /> {u.isActive ? 'Désactiver' : 'Réactiver'}</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {temp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
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
    </div>
  );
}

// ── Onglet Journal ───────────────────────────────────────────────────────────
function HistoryTab({ notify }: { notify: (m: { ok: boolean; text: string }) => void }) {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminService.get<any>(`/admin/actions/history?page=${page}`).then(setData)
      .catch(e => notify({ ok: false, text: errMsg(e) })).finally(() => setLoading(false));
  }, [page, notify]);

  return (
    <div className="space-y-3">
      {loading && <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p>}
      {data?.items?.length === 0 && <p className="text-sm text-gray-500">Aucune action enregistrée.</p>}
      {data?.items?.map((e: any) => (
        <div key={e.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span className={SEV_CLS[e.severity]}>{e.severity} · {e.action}</span>
            <span>{fmtDateTime(e.occurredAt)}{e.company ? ` · ${e.company}` : ''}</span>
          </div>
          <p className="text-gray-200 mt-1">{e.summary}</p>
          {e.actorLabel && <p className="text-xs text-gray-500 mt-0.5">Par {e.actorLabel}</p>}
        </div>
      ))}
      {data && (
        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></button>
          <span>Page {page} · {data.total} action(s)</span>
          <button className={btnGhost} disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></button>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AdminActionsPage() {
  const [tab, setTab] = useState<Tab>('payrolls');
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const notify = useCallback((m: { ok: boolean; text: string }) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 5000);
  }, []);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'payrolls', label: 'Bulletins', icon: FileText },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'history', label: 'Journal des actions', icon: History },
  ];

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2"><Wrench size={20} /> Actions de support</h1>
        <p className="text-sm text-gray-500 mt-1">Corriger sans passer par SQL. Chaque action exige un motif et est tracée dans le journal d'audit de l'entreprise.</p>
      </div>

      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <Msg m={msg} />

      {tab === 'payrolls' && <PayrollsTab ask={setConfirm} notify={notify} />}
      {tab === 'users' && <UsersTab ask={setConfirm} notify={notify} />}
      {tab === 'history' && <HistoryTab notify={notify} />}

      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}