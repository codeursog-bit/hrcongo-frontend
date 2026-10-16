'use client';

// ============================================================================
// 📁 components/request-history/RequestHistoryView.tsx
// ✅ Historique d'un type de demande (permissions, absences) — même modèle que
//    /conges/historique : KPI cliquables, filtres période / type / statut /
//    département / recherche, circuit de traitement par demande, export CSV.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, Download, ChevronLeft, ChevronRight, ChevronDown, Clock, CheckCircle2, XCircle,
  Hourglass, ListChecks, Timer, CalendarDays, ShieldCheck, Ban,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import PermissionTimeline from '@/components/permissions/PermissionTimeline';
import {
  RequestKind, Period, HistoryRow, toRows, inPeriod, MONTHS, MONTHS_SHORT, STATUS_LABELS, STATUS_BADGE,
  STATUS_COLORS, PERMISSION_TYPE_LABELS, ABSENCE_TYPE_LABELS, fmtStamp, fmtMinutes, avg, initials, downloadCsv,
} from '@/lib/request-history';

const PAGE_SIZE = 15;

const RET_LABEL: Record<string, string> = { CONFIRMED: 'Retour validé', PENDING_VALIDATION: 'Retour à valider', NOT_RETURNED: 'Pas encore rentré' };
const RET_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  PENDING_VALIDATION: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  NOT_RETURNED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

function Kpi({ icon: Icon, tone, value, label, active, onClick }: { icon: any; tone: string; value: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  const Tag: any = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`text-left bg-[var(--surface)] rounded-2xl border p-4 flex items-center gap-3 transition-all ${active ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[var(--border)]'} ${onClick ? 'hover:border-emerald-400 cursor-pointer' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon size={18} /></div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[var(--text)] truncate">{value}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
      </div>
    </Tag>
  );
}

function Step({ label, who, at, note, tone = 'bg-[var(--surface-2)] text-[var(--text-muted)]' }: { label: string; who?: string; at?: Date | null; note?: string | null; tone?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${tone}`} />
      <div className="min-w-0 text-xs">
        <p className="font-semibold text-[var(--text)]">{label}{who && who !== '—' ? <span className="font-normal text-[var(--text-muted)]"> · {who}</span> : null}</p>
        <p className="text-[var(--text-muted)]">{fmtStamp(at)}</p>
        {note ? <p className="text-[var(--text)] mt-0.5">{note}</p> : null}
      </div>
    </div>
  );
}

export default function RequestHistoryView({ kind }: { kind: RequestKind }) {
  const { bp } = useBasePath();
  const now = new Date();
  const isPerm = kind === 'permission';
  const TYPE_LABELS = isPerm ? PERMISSION_TYPE_LABELS : ABSENCE_TYPE_LABELS;

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<Period>({ mode: 'year', month: now.getMonth() + 1, year: now.getFullYear(), from: '', to: '' });
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list: any = await api.get(isPerm ? '/permission-tickets' : '/absence-requests');
        setRows(toRows(kind, Array.isArray(list) ? list : []));
      } catch (e: any) {
        setError(e?.message || 'Impossible de charger l’historique');
      } finally { setLoading(false); }
    })();
  }, [kind, isPerm]);

  const years = useMemo(() => {
    const s = new Set<number>([now.getFullYear()]);
    rows.forEach(r => s.add(r.ref.getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const depts = useMemo(() => Array.from(new Set(rows.map(r => r.dept))).sort(), [rows]);

  // Période + type + département + recherche (les KPI de statut se calculent là-dessus)
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter(r => inPeriod(r.ref, period) && (!type || r.type === type) && (!dept || r.dept === dept))
      .filter(r => !q || r.name.toLowerCase().includes(q) || (r.number || '').toLowerCase().includes(q) || r.reason.toLowerCase().includes(q))
      .sort((a, b) => b.ref.getTime() - a.ref.getTime());
  }, [rows, period, type, dept, search]);

  const list = useMemo(() => (status ? base.filter(r => r.status === status) : base), [base, status]);
  useEffect(() => setPage(1), [period, type, dept, search, status]);

  const kpi = useMemo(() => {
    const c = (s: string) => base.filter(r => r.status === s).length;
    return {
      total: base.length, pending: c('PENDING'), approved: c('APPROVED'), rejected: c('REJECTED'), cancelled: c('CANCELLED'),
      response: avg(base.map(r => r.responseMin).filter((n): n is number => n != null)),
      returnsPending: base.filter(r => r.ret === 'PENDING_VALIDATION').length,
      days: base.filter(r => r.status === 'APPROVED').reduce((s, r) => s + (r.days || 0), 0),
    };
  }, [base]);

  // Volume mensuel (sur l'année affichée) empilé par statut
  const monthly = useMemo(() => {
    const y = period.mode === 'all' || period.mode === 'custom' ? now.getFullYear() : period.year;
    const q = search.trim().toLowerCase();
    const src = rows.filter(r => r.ref.getFullYear() === y && (!type || r.type === type) && (!dept || r.dept === dept)
      && (!q || r.name.toLowerCase().includes(q)));
    return MONTHS_SHORT.map((m, i) => {
      const inM = src.filter(r => r.ref.getMonth() === i);
      return { mois: m, Approuvées: inM.filter(r => r.status === 'APPROVED').length, 'En attente': inM.filter(r => r.status === 'PENDING').length, Refusées: inM.filter(r => r.status === 'REJECTED').length, Annulées: inM.filter(r => r.status === 'CANCELLED').length };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, period, type, dept, search]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const header = ['Employé', 'Matricule', 'Département', 'Type', isPerm ? 'Créneau' : 'Période', 'Statut', 'Demandé le', 'Décidé le', 'Décideur', 'Délai de réponse', 'Motif', 'Motif de refus']
      .concat(isPerm ? ['Retour', 'Durée de sortie', 'Heures corrigées'] : ['Jours ouvrés']);
    const data = list.map(r => [
      r.name, r.number || '', r.dept, TYPE_LABELS[r.type] || r.type, r.when, STATUS_LABELS[r.status] || r.status,
      fmtStamp(r.createdAt), fmtStamp(r.reviewedAt), r.reviewer, fmtMinutes(r.responseMin), r.reason, r.rejection || '',
      ...(isPerm ? [RET_LABEL[r.ret || 'NOT_RETURNED'], fmtMinutes(r.outMin), r.adjusted ? 'Oui' : 'Non'] : [String(r.days ?? 0)]),
    ]);
    downloadCsv(`historique-${isPerm ? 'permissions' : 'absences'}-${new Date().toISOString().slice(0, 10)}.csv`, header, data);
  };

  if (loading) return <KonzaLoader variant="page" />;

  const sel = 'text-xs px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Historique — {isPerm ? 'Permissions' : 'Absences'}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isPerm ? 'Tous les tickets de sortie, avec le circuit d’autorisation et de validation du retour.' : 'Toutes les demandes d’absence, avec le circuit de traitement.'}
          </p>
        </div>
        <button onClick={exportCsv} disabled={!list.length} className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white flex items-center gap-1.5 disabled:opacity-40">
          <Download size={14} /> Exporter ({list.length})
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-3 flex flex-wrap items-center gap-2">
        <select value={period.mode} onChange={e => setPeriod({ ...period, mode: e.target.value as any })} className={sel}>
          <option value="month">Par mois</option><option value="year">Par année</option><option value="custom">Période libre</option><option value="all">Tout</option>
        </select>
        {period.mode === 'month' && (
          <select value={period.month} onChange={e => setPeriod({ ...period, month: Number(e.target.value) })} className={sel}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        )}
        {(period.mode === 'month' || period.mode === 'year') && (
          <select value={period.year} onChange={e => setPeriod({ ...period, year: Number(e.target.value) })} className={sel}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {period.mode === 'custom' && (<>
          <input type="date" value={period.from} onChange={e => setPeriod({ ...period, from: e.target.value })} className={sel} />
          <span className="text-xs text-[var(--text-muted)]">au</span>
          <input type="date" value={period.to} onChange={e => setPeriod({ ...period, to: e.target.value })} className={sel} />
        </>)}
        <select value={type} onChange={e => setType(e.target.value)} className={sel}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={dept} onChange={e => setDept(e.target.value)} className={sel}>
          <option value="">Tous les départements</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Employé, matricule, motif…" className={`${sel} w-full pl-8`} />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* KPI — cliquables pour filtrer par statut */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi icon={ListChecks} tone="bg-sky-50 text-sky-600 dark:bg-sky-900/20" value={kpi.total} label="Demandes" active={!status} onClick={() => setStatus('')} />
        <Kpi icon={Hourglass} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" value={kpi.pending} label="En attente" active={status === 'PENDING'} onClick={() => setStatus(status === 'PENDING' ? '' : 'PENDING')} />
        <Kpi icon={CheckCircle2} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" value={kpi.approved} label="Approuvées" active={status === 'APPROVED'} onClick={() => setStatus(status === 'APPROVED' ? '' : 'APPROVED')} />
        <Kpi icon={XCircle} tone="bg-red-50 text-red-600 dark:bg-red-900/20" value={kpi.rejected} label="Refusées" active={status === 'REJECTED'} onClick={() => setStatus(status === 'REJECTED' ? '' : 'REJECTED')} />
        <Kpi icon={Timer} tone="bg-violet-50 text-violet-600 dark:bg-violet-900/20" value={fmtMinutes(kpi.response)} label="Délai moyen de réponse" />
        {isPerm
          ? <Kpi icon={ShieldCheck} tone="bg-amber-50 text-amber-600 dark:bg-amber-900/20" value={kpi.returnsPending} label="Retours à valider" />
          : <Kpi icon={CalendarDays} tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" value={`${kpi.days} j`} label="Jours approuvés" />}
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
        <p className="text-sm font-bold text-[var(--text)] mb-3">Volume mensuel par statut</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mois" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
            <Tooltip /><Legend />
            <Bar dataKey="Approuvées" stackId="a" fill={STATUS_COLORS.APPROVED} />
            <Bar dataKey="En attente" stackId="a" fill={STATUS_COLORS.PENDING} />
            <Bar dataKey="Refusées" stackId="a" fill={STATUS_COLORS.REJECTED} />
            <Bar dataKey="Annulées" stackId="a" fill={STATUS_COLORS.CANCELLED} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)]">
              <tr>
                {['Employé', 'Type', isPerm ? 'Créneau' : 'Période', 'Statut', 'Traitement', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {slice.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">Aucune demande pour ces filtres.</td></tr>
              ) : slice.map(r => (
                <React.Fragment key={r.id}>
                  <tr onClick={() => setOpen(open === r.id ? null : r.id)} className="hover:bg-[var(--surface-2)]/40 cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {r.photoUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={r.photoUrl} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                          : <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">{initials(r.name.split(' ')[0], r.name.split(' ').slice(1).join(' '))}</div>}
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">{r.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">{r.dept}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text)]">{TYPE_LABELS[r.type] || r.type}</td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--text)] whitespace-nowrap">{r.when}</p>
                      {r.sub && <p className="text-[11px] text-[var(--text-muted)]">{r.sub}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${STATUS_BADGE[r.status]}`}>{STATUS_LABELS[r.status] || r.status}</span>
                      {isPerm && r.status === 'APPROVED' && r.ret && (
                        <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${RET_BADGE[r.ret]}`}>{RET_LABEL[r.ret]}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {r.reviewedAt ? <><p className="text-[var(--text)]">{r.reviewer}</p><p>en {fmtMinutes(r.responseMin)}</p></> : r.status === 'PENDING' ? 'En attente de décision' : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]"><ChevronDown size={16} className={`transition-transform ${open === r.id ? 'rotate-180' : ''}`} /></td>
                  </tr>
                  {open === r.id && (
                    <tr className="bg-[var(--surface-2)]/40">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Circuit de traitement</p>
                            <Step label="Demande créée" at={r.createdAt} tone="bg-sky-500" />
                            {r.reviewedAt && <Step label={r.status === 'REJECTED' ? 'Refusée' : r.status === 'CANCELLED' ? 'Annulée' : 'Approuvée'} who={r.reviewer} at={r.reviewedAt} note={r.rejection} tone={r.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'} />}
                            {!r.reviewedAt && r.status === 'CANCELLED' && <Step label="Annulée" at={r.raw.cancelledAt || r.raw.updatedAt} note={r.raw.cancellationReason} tone="bg-slate-400" />}
                            {isPerm && r.declaredAt && <Step label="Retour déclaré" who={r.declaredBy} at={r.declaredAt} tone="bg-amber-500" />}
                            {isPerm && r.ret === 'CONFIRMED' && <Step label={r.adjusted ? 'Retour validé (heures corrigées)' : 'Retour validé'} who={r.confirmedBy} at={r.confirmedAt} note={r.outMin != null ? `Durée réelle de sortie : ${fmtMinutes(r.outMin)}${r.overrunMin != null && r.overrunMin > 10 ? ` — dépassement de ${fmtMinutes(r.overrunMin)}` : ''}` : undefined} tone="bg-emerald-500" />}
                            {r.reason && <p className="text-xs text-[var(--text-muted)] pt-1"><span className="font-semibold text-[var(--text)]">Motif : </span>{r.reason}</p>}
                            {isPerm && r.employeeId && (
                              <Link href={bp(`/presences/permissions/suivi/${r.employeeId}`)} className="inline-block text-xs font-semibold text-emerald-600 hover:underline">Voir le suivi de l’employé</Link>
                            )}
                          </div>
                          {isPerm && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Traçabilité détaillée</p>
                              <PermissionTimeline ticketId={r.id} refreshKey={`${r.status}|${r.ret}|${r.raw.actualReturnTime ?? ''}`} />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
          <span>{list.length} demande(s) · page {page}/{pages}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-30"><ChevronLeft size={14} /></button>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
