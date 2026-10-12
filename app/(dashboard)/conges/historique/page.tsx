'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/historique/page.tsx
// ✅ Historique des congés — 2 onglets :
//    1) "Départs en congé" : congés APPROUVÉS dont la date de départ est
//       arrivée (un congé planifié mais pas encore parti n'y figure pas).
//       Clic sur une ligne → fiche employé (embauche, ancienneté, historique).
//    2) "Demandes" : toutes les demandes, tous statuts, avec le circuit de
//       traitement (validé/refusé par qui, quand, délai de réponse).
//    Filtres : mois, année ou période libre + type, département, recherche.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, Search, Download, ChevronLeft, ChevronRight, Users, Plane,
  CalendarCheck, Clock, CheckCircle2, XCircle, Hourglass, BarChart3, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import EmployeeDepartureDrawer from '@/components/leave-history/EmployeeDepartureDrawer';
import { HorizontalBars, TypeDonut } from '@/components/leave-history/LeaveCharts';
import {
  MONTHS, LEAVE_TYPE_LABELS, STATUS_LABELS, STATUS_BADGE, PHASE_LABELS, PHASE_BADGE,
  fmtDate, fmtDateTime, fmtDays, initials, downloadCsv,
} from '@/lib/leave-history-utils';

type Tab = 'departures' | 'requests';
type PeriodMode = 'month' | 'year' | 'custom' | 'all';

const PAGE_SIZE = 15;

function StatCard({ icon: Icon, tone, value, label }: { icon: any; tone: string; value: React.ReactNode; label: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon size={18} /></div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[var(--text)] truncate">{value}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function Avatar({ emp }: { emp: any }) {
  return emp.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={emp.photoUrl} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
  ) : (
    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
      {initials(emp.firstName, emp.lastName)}
    </div>
  );
}

export default function LeaveHistoryPage() {
  const { bp } = useBasePath();
  const now = new Date();

  const [userRole, setUserRole] = useState('');
  const [tab, setTab] = useState<Tab>('departures');

  // Filtres
  const [periodMode, setPeriodMode] = useState<PeriodMode>('year');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Données
  const [data, setData] = useState<any>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
    } catch {}
  }, []);

  // Liste des départements (via la vue diagrammes, déjà scopée par rôle)
  useEffect(() => {
    api.get<any>(`/leaves/visual-overview?year=${year}`)
      .then(r => setDepartments((r?.departments || []).map((d: any) => ({ id: d.id, name: d.name }))))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (periodMode === 'month') { p.set('year', String(year)); p.set('month', String(month)); }
    if (periodMode === 'year') p.set('year', String(year));
    if (periodMode === 'custom') { if (from) p.set('from', from); if (to) p.set('to', to); }
    if (type) p.set('type', type);
    if (tab === 'requests' && status) p.set('status', status);
    if (departmentId) p.set('departmentId', departmentId);
    if (debouncedSearch.trim()) p.set('search', debouncedSearch.trim());
    return p.toString();
  }, [periodMode, year, month, from, to, type, status, departmentId, debouncedSearch, tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = tab === 'departures' ? 'departure-history' : 'requests-history';
      const res = await api.get<any>(`/leaves/${endpoint}?${queryString}`);
      setData(res);
      setPage(1);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger l\u2019historique.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tab, queryString]);

  useEffect(() => { load(); }, [load]);

  const rows: any[] = data?.rows ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const periodLabel =
    periodMode === 'month' ? `${MONTHS[month - 1]} ${year}`
    : periodMode === 'year' ? `Année ${year}`
    : periodMode === 'custom' ? `${from ? fmtDate(from) : '…'} → ${to ? fmtDate(to) : '…'}`
    : 'Toute la période';

  const shiftPeriod = (dir: -1 | 1) => {
    if (periodMode === 'month') {
      const idx = month - 1 + dir;
      if (idx < 0) { setMonth(12); setYear(y => y - 1); }
      else if (idx > 11) { setMonth(1); setYear(y => y + 1); }
      else setMonth(idx + 1);
    } else if (periodMode === 'year') setYear(y => y + dir);
  };

  const exportCsv = () => {
    if (tab === 'departures') {
      downloadCsv(
        `historique-departs-conge.csv`,
        ['Matricule', 'Nom', 'Département', 'Poste', "Date d'embauche", 'Ancienneté au départ', 'Type', 'Départ', 'Retour prévu', 'Jours', 'Situation'],
        rows.map(r => [
          r.employee.employeeNumber, `${r.employee.firstName} ${r.employee.lastName}`,
          r.employee.department?.name || '', r.employee.position, fmtDate(r.employee.hireDate),
          r.employee.seniorityAtDeparture?.label || '', LEAVE_TYPE_LABELS[r.type] || r.type,
          fmtDate(r.startDate), fmtDate(r.endDate), r.daysCount, PHASE_LABELS[r.phase],
        ]),
      );
    } else {
      downloadCsv(
        `historique-demandes-conge.csv`,
        ['Matricule', 'Nom', 'Département', 'Type', 'Demandé le', 'Du', 'Au', 'Jours', 'Statut', 'Traité par', 'Traité le', 'Délai (j)', 'Motif de refus / annulation'],
        rows.map(r => [
          r.employee.employeeNumber, `${r.employee.firstName} ${r.employee.lastName}`,
          r.employee.department?.name || '', LEAVE_TYPE_LABELS[r.type] || r.type,
          fmtDate(r.requestedAt), fmtDate(r.startDate), fmtDate(r.endDate), r.daysCount,
          STATUS_LABELS[r.status], r.approvedByName || r.rejectedByName || '',
          fmtDate(r.approvedAt || r.rejectedAt), r.processingDays ?? '',
          r.rejectionReason || r.cancellationReason || '',
        ]),
      );
    }
  };

  const inputCls =
    'px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40';

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-bold text-[var(--text)]">Historique</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {tab === 'departures'
              ? 'Les congés dont la date de départ est arrivée. Un congé planifié n’apparaît ici qu’à partir de son premier jour.'
              : 'Toutes les demandes de congé, avec leur traitement (validation, refus, annulation).'}
          </p>
        </div>
        <Link
          href={bp('/conges/diagrammes')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 w-fit"
        >
          <BarChart3 size={16} /> Voir en diagrammes <ArrowRight size={14} />
        </Link>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl w-fit">
        {([
          ['departures', 'Départs en congé', Plane],
          ['requests', 'Historique des demandes', CalendarCheck],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => { setTab(k); setStatus(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
              tab === k ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl">
            {([['month', 'Mois'], ['year', 'Année'], ['custom', 'Période'], ['all', 'Tout']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setPeriodMode(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${periodMode === k ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {(periodMode === 'month' || periodMode === 'year') && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => shiftPeriod(-1)} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronLeft size={16} /></button>
              <span className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-sm font-semibold min-w-[150px] text-center">{periodLabel}</span>
              <button onClick={() => shiftPeriod(1)} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]"><ChevronRight size={16} /></button>
            </div>
          )}
          {periodMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} aria-label="Du" />
              <span className="text-[var(--text-muted)] text-sm">au</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} aria-label="Au" />
            </div>
          )}

          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="ml-auto px-4 py-2 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un employé (nom, matricule)…"
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <select value={type} onChange={e => setType(e.target.value)} className={inputCls}>
            <option value="">Tous les types</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {departments.length > 1 && (
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} className={inputCls}>
              <option value="">Tous les départements</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          {tab === 'requests' && (
            <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          )}
        </div>
        {tab === 'requests' && (
          <p className="text-[11px] text-[var(--text-muted)]">Pour cet onglet, la période porte sur la date de la demande.</p>
        )}
        {tab === 'departures' && (
          <p className="text-[11px] text-[var(--text-muted)]">Pour cet onglet, la période porte sur la date de départ.</p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
      ) : (
        <>
          {/* KPI */}
          {tab === 'departures' && data?.stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard icon={Plane} tone="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" value={data.stats.count} label="Départs sur la période" />
                <StatCard icon={Users} tone="bg-blue-100 dark:bg-blue-900/30 text-blue-600" value={data.stats.uniqueEmployees} label="Employés concernés" />
                <StatCard icon={CalendarCheck} tone="bg-amber-100 dark:bg-amber-900/30 text-amber-600" value={fmtDays(data.stats.totalDays)} label="Jours de congé cumulés" />
                <StatCard icon={Clock} tone="bg-violet-100 dark:bg-violet-900/30 text-violet-600" value={fmtDays(data.stats.averageDays)} label="Durée moyenne" />
                <StatCard icon={Plane} tone="bg-sky-100 dark:bg-sky-900/30 text-sky-600" value={data.stats.inProgress} label="Actuellement en congé" />
              </div>

              {data.stats.count > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
                    <p className="text-sm font-bold text-[var(--text)] mb-4">Par type de congé</p>
                    <TypeDonut data={data.stats.byType.map((t: any) => ({ type: t.type, value: t.totalDays }))} />
                  </div>
                  <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
                    <p className="text-sm font-bold text-[var(--text)] mb-4">Jours de congé par département</p>
                    <HorizontalBars data={data.stats.byDepartment.slice(0, 6).map((d: any) => ({ name: d.name, value: d.totalDays }))} />
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'requests' && data?.stats && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={CalendarCheck} tone="bg-blue-100 dark:bg-blue-900/30 text-blue-600" value={data.stats.total} label="Demandes" />
              <StatCard icon={CheckCircle2} tone="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" value={data.stats.byStatus.APPROVED} label="Approuvées" />
              <StatCard icon={XCircle} tone="bg-red-100 dark:bg-red-900/30 text-red-600" value={data.stats.byStatus.REJECTED} label="Refusées" />
              <StatCard icon={Hourglass} tone="bg-amber-100 dark:bg-amber-900/30 text-amber-600" value={data.stats.byStatus.PENDING} label="En attente" />
              <StatCard
                icon={Clock} tone="bg-violet-100 dark:bg-violet-900/30 text-violet-600"
                value={data.stats.averageProcessingDays !== null ? fmtDays(data.stats.averageProcessingDays) : '—'}
                label={data.stats.approvalRate !== null ? `Délai moyen · ${data.stats.approvalRate} % d’acceptation` : 'Délai moyen de réponse'}
              />
            </div>
          )}

          {data?.truncated && (
            <p className="text-xs text-amber-600">Résultats limités aux 2 000 plus récents — affinez la période pour tout voir.</p>
          )}

          {/* Tableau */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            {rows.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-16 text-center">Aucun résultat pour ces filtres.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--text-muted)] bg-[var(--surface-2)]">
                      <th className="px-4 py-3 font-bold">Employé</th>
                      {tab === 'departures' ? (
                        <>
                          <th className="px-4 py-3 font-bold">Embauche · Ancienneté</th>
                          <th className="px-4 py-3 font-bold">Type</th>
                          <th className="px-4 py-3 font-bold">Départ → Retour</th>
                          <th className="px-4 py-3 font-bold text-right">Jours</th>
                          <th className="px-4 py-3 font-bold">Situation</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 font-bold">Demandé le</th>
                          <th className="px-4 py-3 font-bold">Type</th>
                          <th className="px-4 py-3 font-bold">Période demandée</th>
                          <th className="px-4 py-3 font-bold text-right">Jours</th>
                          <th className="px-4 py-3 font-bold">Statut</th>
                          <th className="px-4 py-3 font-bold">Traitement</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(r => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedEmployeeId(r.employee.id)}
                        className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/60 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar emp={r.employee} />
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">{r.employee.firstName} {r.employee.lastName}</p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate">
                                {r.employee.department?.name || 'Sans département'} · {r.employee.position}
                              </p>
                            </div>
                          </div>
                        </td>

                        {tab === 'departures' ? (
                          <>
                            <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                              <div>{fmtDate(r.employee.hireDate)}</div>
                              <div className="text-[var(--text)] font-medium">{r.employee.seniorityAtDeparture?.label}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">
                              {LEAVE_TYPE_LABELS[r.type] || r.type}
                              {r.isCarryover && <span className="block text-[10px] text-[var(--text-muted)]">Rattrapage de reliquat</span>}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              <div>{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</div>
                              {r.forfeitedDays > 0 && (
                                <div className="text-[10px] text-amber-600">Retour anticipé le {fmtDate(r.actualReturnDate)}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{fmtDays(r.daysCount)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${PHASE_BADGE[r.phase]}`}>{PHASE_LABELS[r.phase]}</span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(r.requestedAt)}</td>
                            <td className="px-4 py-3 text-xs">
                              {LEAVE_TYPE_LABELS[r.type] || r.type}
                              {r.isManual && <span className="block text-[10px] text-[var(--text-muted)]">Saisi par le RH</span>}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</td>
                            <td className="px-4 py-3 text-right font-semibold">{fmtDays(r.daysCount)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${STATUS_BADGE[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-[var(--text-muted)] max-w-[260px]">
                              {r.status === 'APPROVED' && <>Validée par {r.approvedByName || '—'} le {fmtDateTime(r.approvedAt)}</>}
                              {r.status === 'REJECTED' && (
                                <>Refusée par {r.rejectedByName || '—'} le {fmtDate(r.rejectedAt)}
                                  {r.rejectionReason && <span className="block italic">« {r.rejectionReason} »</span>}</>
                              )}
                              {r.status === 'CANCELLED' && (
                                <>Annulée le {fmtDate(r.cancelledAt)}
                                  {r.cancellationReason && <span className="block italic">« {r.cancellationReason} »</span>}</>
                              )}
                              {r.status === 'PENDING' && 'En attente de décision'}
                              {r.processingDays !== null && <span className="block">Délai de réponse : {fmtDays(r.processingDays)}</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rows.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                <span>{rows.length} résultat{rows.length > 1 ? 's' : ''}</span>
                <div className="flex items-center gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40"><ChevronLeft size={14} /></button>
                  <span>Page {page} / {pageCount}</span>
                  <button disabled={page === pageCount} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40"><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedEmployeeId && (
        <EmployeeDepartureDrawer employeeId={selectedEmployeeId} onClose={() => setSelectedEmployeeId(null)} />
      )}
    </div>
  );
}