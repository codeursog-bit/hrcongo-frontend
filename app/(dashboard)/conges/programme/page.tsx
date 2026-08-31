'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/programme/page.tsx
// ✅ "Programme des départs" — page PUBLIQUE (visible par tous les employés).
//    Répond à "qui part en congé quand" : fusionne les congés déjà validés
//    (dont les demandes anticipées) et les départs théoriques calculés
//    automatiquement à partir du cycle d'acquisition (mois anniversaire
//    d'embauche/retour) — voir /leaves/departure-program côté back.
//    ⚠️ Aucun montant/indemnité ici (confidentiel) — ça reste sur /planning,
//    réservé RH/Admin.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Filter, Umbrella, Zap, Download, FileDown, Printer,
  Users, Plane, CalendarClock, Plus, X, Check,
} from 'lucide-react';
import { api } from '@/services/api';
import CongeSubNav from '@/components/CongeSubNav';
import LeavePlanningPrintable from '@/components/LeavePlanningPrintable';
import { printLeaveDocument, downloadLeaveDocumentPDF } from '@/lib/leave-print';

/** Affichage propre d'un nombre de jours (évite les artefacts de virgule
 * flottante type "28.799999999999997j" — arrondit à 1 décimale, sans
 * afficher ".0" pour les comptes ronds). */
function formatDays(n: number | string): string {
  const v = Math.round(Number(n || 0) * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

interface DepartureRow {
  id: string;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
    position?: string;
    contractType?: string;
    hireDate?: string;
    department?: { name?: string } | null;
  };
  type: 'ANNUAL' | 'ANNUAL_ANTICIPATED' | string;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: string; // 'APPROVED' (réel) | 'PREVU' (calcul théorique)
  isTheoretical: boolean;
  isManual?: boolean;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé',
};
const TYPE_ICONS: Record<string, any> = {
  ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap,
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function ProgrammeCongesPage() {
  const [userRole, setUserRole] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [rows, setRows] = useState<DepartureRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [yearlyTrend, setYearlyTrend] = useState<{ month: number; count: number; totalDays: number }[]>([]);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('');

  // ✅ Planification manuelle RH — le manuel prime sur le théorique dès
  // qu'un vrai congé APPROVED existe pour la période (voir buildDepartureRows
  // côté back), donc pas de logique supplémentaire côté front : on crée le
  // congé, on recharge le mois, et le calcul auto s'efface tout seul pour
  // cet employé.
  const canPlan = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualForm, setManualForm] = useState({
    employeeId: '', type: 'ANNUAL' as 'ANNUAL' | 'ANNUAL_ANTICIPATED',
    startDate: '', endDate: '', reason: '',
  });

  useEffect(() => {
    if (!canPlan) return;
    (async () => {
      try {
        const data = await api.get<any[]>('/employees/simple');
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Erreur chargement employés', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPlan]);

  const openManualModal = () => {
    setManualError('');
    setManualForm({ employeeId: employees[0]?.id || '', type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
    setShowManualModal(true);
  };

  const saveManualLeave = async () => {
    if (!manualForm.employeeId || !manualForm.startDate || !manualForm.endDate) {
      setManualError('Employé, date de départ et date de retour sont requis.');
      return;
    }
    setIsSavingManual(true);
    setManualError('');
    try {
      await api.post('/leaves/manual', manualForm);
      setShowManualModal(false);
      await load();
    } catch (e: any) {
      setManualError(e?.message || 'Erreur lors de la planification du congé');
    } finally {
      setIsSavingManual(false);
    }
  };

  const REPORT_ID = 'programme-departs-print';
  const monthLabel = `${MONTHS[month - 1]} ${year}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
    } catch {}
    (async () => {
      try {
        const me: any = await api.get('/auth/me');
        setCompany(me?.company ?? null);
      } catch (e) {
        console.error('Erreur chargement entreprise', e);
      }
    })();
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      const data = await api.get<{ rows: DepartureRow[] }>(`/leaves/departure-program?${params.toString()}`);
      setRows(data.rows || []);
    } catch (e) {
      console.error('Erreur chargement programme des départs', e);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  useEffect(() => {
    (async () => {
      try {
        const trend = await api.get<any>(`/leaves/yearly-trend?year=${year}`);
        setYearlyTrend(trend || []);
      } catch (e) {
        console.error('Erreur chargement tendance annuelle', e);
      }
    })();
  }, [year]);

  const filteredRows = useMemo(
    () => (typeFilter ? rows.filter(r => r.type === typeFilter) : rows),
    [rows, typeFilter],
  );

  const stats = useMemo(() => {
    const rawTotal = filteredRows.reduce((s, r) => s + Number(r.daysCount || 0), 0);
    const totalDays = Math.round(rawTotal * 10) / 10; // évite les artefacts d'addition flottante (ex: 925.2000000000004)
    return { count: filteredRows.length, totalDays };
  }, [filteredRows]);

  const deptBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filteredRows) {
      const name = r.employee?.department?.name || 'Sans département';
      map.set(name, (map.get(name) || 0) + Number(r.daysCount || 0));
    }
    return Array.from(map.entries())
      .map(([name, days]) => ({ name, days: Math.round(days * 10) / 10 }))
      .sort((a, b) => b.days - a.days);
  }, [filteredRows]);

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      await downloadLeaveDocumentPDF(REPORT_ID, `programme-conges-${year}-${String(month).padStart(2, '0')}.pdf`, 'landscape');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = () => {
    const header = ['Nom', 'Département', 'Type', 'Date de départ', 'Date de retour', 'Jours', 'Statut'];
    const csvRows = filteredRows.map(r => [
      `${r.employee.lastName} ${r.employee.firstName}`,
      r.employee.department?.name || '',
      TYPE_LABELS[r.type] || r.type,
      fmtDate(r.startDate),
      fmtDate(r.endDate),
      String(r.daysCount),
      r.isTheoretical ? 'Prévu' : 'Confirmé',
    ]);
    const csv = [header, ...csvRows].map(row => row.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programme-conges-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Adapte les lignes au format attendu par LeavePlanningPrintable (mode "departures" = pas de colonne montant)
  const printableRows = filteredRows.map(r => ({
    employee: r.employee,
    startDate: r.startDate,
    endDate: r.endDate,
    daysCount: r.daysCount,
    status: r.isTheoretical ? 'PREVU' : r.status,
  }));

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-6">
      <CongeSubNav userRole={userRole} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Programme des départs</h1>
          <p className="text-sm text-gray-400 mt-1">Qui part en congé, et quand — {monthLabel}</p>
        </div>
        <div className="flex gap-2">
          {canPlan && (
            <button
              onClick={openManualModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
            >
              <Plus size={15} /> Planifier un congé
            </button>
          )}
          <button onClick={() => setTimeout(() => printLeaveDocument(REPORT_ID, 'landscape'), 50)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Printer size={16} /> Imprimer
          </button>
          <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!filteredRows.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            <Download size={15} /> CSV
          </button>
          {company?.documentTemplate === 'ORCA' && (
            <button
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/planning/document.xlsx?month=${month}&year=${year}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40"
              title="Télécharger le fichier Excel original rempli"
            >
              <FileDown size={15} /> Programme (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{MONTHS[m - 1]}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          <option value="">Tous les types</option>
          <option value="ANNUAL">Annuel</option>
          <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>
      ) : (
        <>
          {/* Mini-dashboard — repris de /planning, sans aucun montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count}</p><p className="text-xs text-gray-400">Employés concernés ce mois</p></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center"><Plane size={20} /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDays}</p><p className="text-xs text-gray-400">Jours ouvrables cumulés</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Jours de congé posés par mois — {year}</p>
              {yearlyTrend.every(m => m.totalDays === 0) ? (
                <p className="text-sm text-gray-400 py-8 text-center">Aucun congé posé sur {year}.</p>
              ) : (
                <div className="flex items-end gap-1.5 h-40">
                  {yearlyTrend.map(m => {
                    const max = Math.max(...yearlyTrend.map(x => x.totalDays), 1);
                    const heightPct = (m.totalDays / max) * 100;
                    const isCurrent = m.month === month;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div className="w-full flex items-end h-32 relative">
                          <div
                            title={`${m.totalDays}j — ${m.count} congé(s)`}
                            className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-sky-500' : 'bg-sky-200 dark:bg-sky-800 group-hover:bg-sky-300 dark:group-hover:bg-sky-700'}`}
                            style={{ height: `${Math.max(heightPct, m.totalDays > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold ${isCurrent ? 'text-sky-600' : 'text-gray-400'}`}>{MONTHS[m.month - 1].slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Répartition par département — {monthLabel}</p>
              {deptBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Aucun département ce mois-ci.</p>
              ) : (
                <div className="space-y-3">
                  {deptBreakdown.map(d => {
                    const max = deptBreakdown[0].days || 1;
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-600 dark:text-gray-300 truncate">{d.name}</span>
                          <span className="text-gray-400 shrink-0 ml-2">{d.days}j</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 dark:bg-violet-600 rounded-full" style={{ width: `${(d.days / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tableau — qui part quand */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
            {!filteredRows.length ? (
              <div className="text-center py-16 text-gray-400 text-sm">Aucun départ sur cette période avec ces filtres.</div>
            ) : (
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Département</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date de départ</th>
                    <th className="px-4 py-3">Date de retour</th>
                    <th className="px-4 py-3">Jours</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(r => {
                    const Icon = TYPE_ICONS[r.type] || Umbrella;
                    return (
                      <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.employee.lastName} {r.employee.firstName}</td>
                        <td className="px-4 py-3 text-gray-500">{r.employee.department?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} className="text-gray-400" />
                            {TYPE_LABELS[r.type] || r.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{fmtDate(r.startDate)}</td>
                        <td className="px-4 py-3 text-gray-500">{fmtDate(r.endDate)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{formatDays(r.daysCount)}j</td>
                        <td className="px-4 py-3">
                          {r.isTheoretical ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                              <CalendarClock size={12} /> Prévu
                            </span>
                          ) : r.isManual ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-500" title="Planifié directement par le RH/Admin">
                              <Plus size={12} /> Planifié RH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                              <Plane size={12} /> Confirmé
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Impression — identique au modèle Excel, mode "departures" (sans montant) */}
          <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 overflow-auto border border-gray-200 dark:border-gray-700">
            <div className="scale-[0.75] origin-top-left" style={{ width: '133%' }}>
              <LeavePlanningPrintable id={REPORT_ID} company={company || {}} monthLabel={monthLabel} rows={printableRows as any} mode="departures" />
            </div>
          </div>
        </>
      )}

      {showManualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Planifier un congé</h2>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Crée directement un congé validé pour l'employé — remplace tout calcul automatique pour cette période.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Employé</label>
                <select
                  value={manualForm.employeeId}
                  onChange={e => setManualForm(f => ({ ...f, employeeId: e.target.value }))}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2"
                >
                  <option value="">— Sélectionner —</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.lastName} {e.firstName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Type</label>
                <select
                  value={manualForm.type}
                  onChange={e => setManualForm(f => ({ ...f, type: e.target.value as any }))}
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2"
                >
                  <option value="ANNUAL">Annuel</option>
                  <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Date de départ</label>
                  <input
                    type="date"
                    value={manualForm.startDate}
                    onChange={e => setManualForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Date de retour</label>
                  <input
                    type="date"
                    value={manualForm.endDate}
                    onChange={e => setManualForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Note (optionnel)</label>
                <input
                  type="text"
                  value={manualForm.reason}
                  onChange={e => setManualForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex : accord oral avec le chef de service"
                  className="mt-1 w-full text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {manualError && <div className="text-xs text-red-500">{manualError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowManualModal(false)} className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700">
                Annuler
              </button>
              <button
                onClick={saveManualLeave}
                disabled={isSavingManual}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isSavingManual ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}