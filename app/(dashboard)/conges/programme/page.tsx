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
  Users, Plane, CalendarClock, Plus, X, Check, Pencil, Trash2, AlertTriangle,
} from 'lucide-react';
import { api } from '@/services/api';
import CongeSubNav from '@/components/CongeSubNav';
import LeavePlanningPrintable from '@/components/LeavePlanningPrintable';
import { printLeaveDocument, downloadLeaveDocumentPDF } from '@/lib/leave-print';

/** Affichage propre d'un nombre de jours (évite les artefacts de virgule
 * flottante type "28.799999999999997j") — arrondi entier, jamais de décimale
 * affichée. */
function formatDays(n: number | string): string {
  return String(Math.round(Number(n || 0)));
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
    extraDaysGranted: '', resumptionNote: '',
  });
  // ✅ Édition d'une planification existante — même modale que la création,
  // seul l'appel réseau change (PATCH sur la même ligne au lieu de POST),
  // pour ne jamais dupliquer la planification sur cette page ni sur le
  // planning / calendrier qui lisent la même donnée.
  const [editingRow, setEditingRow] = useState<DepartureRow | null>(null);
  // ✅ Suppression — confirmation avant l'appel DELETE définitif.
  const [deletingRow, setDeletingRow] = useState<DepartureRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  // ✅ CORRECTIF (demande explicite) : cette modale ("Planifier") crée le
  // congé déjà APPROVED — c'était le seul chemin où le motif de report et
  // les jours d'ancienneté n'étaient jamais proposés au RH (contrairement
  // à l'écran d'approbation d'une demande employé, /conges/[id]).
  const [manualBalance, setManualBalance] = useState<{ annualEntitled: number; seniorityDays: number } | null>(null);
  // ✅ Rattrapage d'un reliquat de retour anticipé — si l'employé sélectionné
  // en a un disponible, le RH peut planifier ce repos (non payé, sans impact
  // sur le solde/cycle en cours) au lieu d'un congé normal.
  const [carryoverOptions, setCarryoverOptions] = useState<any[]>([]);
  const [selectedCarryoverId, setSelectedCarryoverId] = useState<string>('');

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
    setEditingRow(null);
    setManualForm({ employeeId: employees[0]?.id || '', type: 'ANNUAL', startDate: '', endDate: '', reason: '', extraDaysGranted: '', resumptionNote: '' });
    setManualBalance(null);
    setSelectedCarryoverId('');
    setShowManualModal(true);
  };

  // ✅ Pré-remplit la même modale avec les valeurs de la ligne — la
  // sauvegarde appellera PATCH /leaves/:id au lieu de POST /leaves/manual.
  const openEditModal = (row: DepartureRow) => {
    setManualError('');
    setEditingRow(row);
    setManualForm({
      employeeId: row.employeeId,
      type: (row.type === 'ANNUAL_ANTICIPATED' ? 'ANNUAL_ANTICIPATED' : 'ANNUAL'),
      startDate: new Date(row.startDate).toISOString().slice(0, 10),
      endDate: new Date(row.endDate).toISOString().slice(0, 10),
      reason: '',
      extraDaysGranted: '',
      resumptionNote: '',
    });
    setManualBalance(null);
    setShowManualModal(true);
  };

  // ✅ Charge le solde de l'employé sélectionné pour afficher le rappel
  // "26j + Xj ancienneté" et pouvoir estimer un éventuel reste.
  useEffect(() => {
    if (!manualForm.employeeId || !showManualModal) return;
    (async () => {
      try {
        const bal = await api.get<any>(`/leaves/balance/${manualForm.employeeId}`);
        setManualBalance({
          annualEntitled: Number(bal?.annualEntitled ?? 26),
          seniorityDays: Number(bal?.seniorityDays ?? 0),
        });
      } catch {
        setManualBalance(null);
      }
    })();
  }, [manualForm.employeeId, showManualModal]);

  // ✅ Charge les reliquats de retour anticipé encore disponibles pour
  // l'employé sélectionné — n'a de sens qu'à la création (pas en édition).
  useEffect(() => {
    if (!manualForm.employeeId || !showManualModal || editingRow) {
      setCarryoverOptions([]);
      return;
    }
    setSelectedCarryoverId('');
    (async () => {
      try {
        const co = await api.get<any[]>(`/leaves/carryover/${manualForm.employeeId}`);
        setCarryoverOptions(co || []);
      } catch {
        setCarryoverOptions([]);
      }
    })();
  }, [manualForm.employeeId, showManualModal, editingRow]);

  // Jours calendaires approximatifs entre les 2 dates (estimation front —
  // le vrai décompte en jours ouvrés se fait côté serveur à la sauvegarde).
  const manualEstimatedDays = manualForm.startDate && manualForm.endDate
    ? Math.max(0, Math.round((new Date(manualForm.endDate).getTime() - new Date(manualForm.startDate).getTime()) / 86400000) + 1)
    : 0;
  const manualBaseRemaining = manualBalance ? Math.max(0, 26 - manualEstimatedDays) : 0;
  const manualSeniorityRemaining = manualBalance
    ? Math.max(0, manualBalance.seniorityDays - Math.max(0, manualEstimatedDays - 26))
    : 0;
  const manualNeedsMotif = !selectedCarryoverId && manualForm.type === 'ANNUAL' && (manualBaseRemaining > 0 || Number(manualForm.extraDaysGranted) > 0);
  const selectedCarryover = carryoverOptions.find(c => c.sourceLeaveId === selectedCarryoverId) || null;

  const saveManualLeave = async () => {
    if (!manualForm.employeeId || !manualForm.startDate || !manualForm.endDate) {
      setManualError('Employé, date de départ et date de retour sont requis.');
      return;
    }
    if (manualNeedsMotif && !manualForm.resumptionNote.trim()) {
      setManualError('Merci de préciser le motif de report (il apparaîtra sur la lettre officielle).');
      return;
    }
    setIsSavingManual(true);
    setManualError('');
    try {
      if (editingRow) {
        // ✅ Modification en place — même ligne, jamais de nouvelle création.
        await api.patch(`/leaves/${editingRow.id}`, {
          type: manualForm.type,
          startDate: manualForm.startDate,
          endDate: manualForm.endDate,
          reason: manualForm.reason || undefined,
          extraDaysGranted: manualForm.extraDaysGranted ? Number(manualForm.extraDaysGranted) : undefined,
          resumptionNote: manualForm.resumptionNote || undefined,
        });
      } else if (selectedCarryoverId) {
        // ✅ Rattrapage d'un reliquat — toujours ANNUAL, jamais payé, ne
        // touche jamais le solde/cycle en cours (voir createCarryoverLeave
        // côté backend). Auto-approuvé comme toute planification RH.
        await api.post('/leaves/manual', {
          employeeId: manualForm.employeeId,
          type: 'ANNUAL',
          startDate: manualForm.startDate,
          endDate: manualForm.endDate,
          carriedFromLeaveId: selectedCarryoverId,
        });
      } else {
        await api.post('/leaves/manual', {
          ...manualForm,
          extraDaysGranted: manualForm.extraDaysGranted ? Number(manualForm.extraDaysGranted) : undefined,
          resumptionNote: manualForm.resumptionNote || undefined,
        });
      }
      setShowManualModal(false);
      setEditingRow(null);
      setSelectedCarryoverId('');
      await load();
    } catch (e: any) {
      setManualError(e?.message || (editingRow ? 'Erreur lors de la modification du congé' : 'Erreur lors de la planification du congé'));
    } finally {
      setIsSavingManual(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingRow) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/leaves/${deletingRow.id}`);
      setDeletingRow(null);
      await load();
    } catch (e: any) {
      setDeleteError(e?.message || 'Erreur lors de la suppression du congé');
    } finally {
      setIsDeleting(false);
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
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase mb-1">Congés</p>
          <h1 className="text-3xl font-bold text-[var(--text)]">Programme des départs</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Qui part en congé, et quand — {monthLabel}</p>
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
          <button onClick={() => setTimeout(() => printLeaveDocument(REPORT_ID, 'landscape'), 50)} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)]">
            <Printer size={16} /> Imprimer
          </button>
          <button onClick={handleDownloadPdf} disabled={isExportingPdf} className="px-4 py-2.5 border border-[var(--border)] text-sm font-semibold rounded-xl text-[var(--text-muted)] flex items-center gap-2 hover:bg-[var(--surface-2)] disabled:opacity-40">
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} PDF
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!filteredRows.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            <Download size={15} /> CSV
          </button>
          {company?.documentTemplate === 'ORCA' && (
            <button
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/planning/document.xlsx?month=${month}&year=${year}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              title="Télécharger le fichier Excel original rempli"
            >
              <FileDown size={15} /> Programme (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-[var(--text-muted)]" />
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{MONTHS[m - 1]}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          <option value="">Tous les types</option>
          <option value="ANNUAL">Annuel</option>
          <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
      ) : (
        <>
          {/* Mini-dashboard — repris de /planning, sans aucun montant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center"><Users size={20} /></div>
              <div><p className="text-2xl font-bold text-[var(--text)]">{stats.count}</p><p className="text-xs text-[var(--text-muted)]">Employés concernés ce mois</p></div>
            </div>
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center"><Plane size={20} /></div>
              <div><p className="text-2xl font-bold text-[var(--text)]">{stats.totalDays}</p><p className="text-xs text-[var(--text-muted)]">Jours ouvrables cumulés</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-sm font-bold text-[var(--text)] mb-4">Jours de congé posés par mois — {year}</p>
              {yearlyTrend.every(m => m.totalDays === 0) ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucun congé posé sur {year}.</p>
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
                            className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-800 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-700'}`}
                            style={{ height: `${Math.max(heightPct, m.totalDays > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold ${isCurrent ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>{MONTHS[m.month - 1].slice(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-sm font-bold text-[var(--text)] mb-4">Répartition par département — {monthLabel}</p>
              {deptBreakdown.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucun département ce mois-ci.</p>
              ) : (
                <div className="space-y-3">
                  {deptBreakdown.map(d => {
                    const max = deptBreakdown[0].days || 1;
                    return (
                      <div key={d.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[var(--text-muted)] truncate">{d.name}</span>
                          <span className="text-[var(--text-muted)] shrink-0 ml-2">{d.days}j</span>
                        </div>
                        <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 dark:bg-amber-600 rounded-full" style={{ width: `${(d.days / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tableau — qui part quand */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-x-auto">
            {!filteredRows.length ? (
              <div className="text-center py-16 text-[var(--text-muted)] text-sm">Aucun départ sur cette période avec ces filtres.</div>
            ) : (
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Département</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date de départ</th>
                    <th className="px-4 py-3">Date de retour</th>
                    <th className="px-4 py-3">Jours</th>
                    <th className="px-4 py-3">Statut</th>
                    {canPlan && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(r => {
                    const Icon = TYPE_ICONS[r.type] || Umbrella;
                    return (
                      <tr key={r.id} className="border-b border-[var(--border)]">
                        <td className="px-4 py-3 font-semibold text-[var(--text)]">{r.employee.lastName} {r.employee.firstName}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{r.employee.department?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Icon size={14} className="text-[var(--text-muted)]" />
                            {TYPE_LABELS[r.type] || r.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{fmtDate(r.startDate)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{fmtDate(r.endDate)}</td>
                        <td className="px-4 py-3 font-semibold text-[var(--text-muted)]">{formatDays(r.daysCount)}j</td>
                        <td className="px-4 py-3">
                          {r.isTheoretical ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                              <CalendarClock size={12} /> Prévu
                            </span>
                          ) : r.isManual ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500" title="Planifié directement par le RH/Admin">
                              <Plus size={12} /> Planifié RH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                              <Plane size={12} /> Confirmé
                            </span>
                          )}
                        </td>
                        {canPlan && (
                          <td className="px-4 py-3">
                            {!r.isTheoretical && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(r)}
                                  title="Modifier cette planification"
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => { setDeleteError(''); setDeletingRow(r); }}
                                  title="Supprimer cette planification"
                                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Impression — identique au modèle Excel, mode "departures" (sans montant) */}
          <div className="bg-[var(--surface-2)] rounded-2xl p-4 overflow-auto border border-[var(--border)]">
            <div className="scale-[0.75] origin-top-left" style={{ width: '133%' }}>
              <LeavePlanningPrintable id={REPORT_ID} company={company || {}} monthLabel={monthLabel} rows={printableRows as any} mode="departures" />
            </div>
          </div>
        </>
      )}

      {showManualModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">{editingRow ? 'Modifier la planification' : 'Planifier un congé'}</h2>
              <button onClick={() => { setShowManualModal(false); setEditingRow(null); }} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {editingRow
                ? "Modifie directement cette planification — les dates/le type sont ajustés sur la même ligne, sans jamais en créer une nouvelle."
                : "Crée directement un congé validé pour l'employé — remplace tout calcul automatique pour cette période."}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Employé</label>
                {editingRow ? (
                  <p className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface-2)]/50 rounded-lg px-3 py-2 text-[var(--text-muted)]">
                    {editingRow.employee.lastName} {editingRow.employee.firstName}
                  </p>
                ) : (
                  <select
                    value={manualForm.employeeId}
                    onChange={e => setManualForm(f => ({ ...f, employeeId: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  >
                    <option value="">— Sélectionner —</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.lastName} {e.firstName}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* ✅ Rattrapage d'un reliquat — visible seulement à la création
                  et si l'employé sélectionné en a un disponible. */}
              {!editingRow && carryoverOptions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <label className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Rattrapage d'un reliquat de retour anticipé (repos non payé)
                  </label>
                  <select
                    value={selectedCarryoverId}
                    onChange={e => setSelectedCarryoverId(e.target.value)}
                    className="mt-1 w-full text-sm border border-amber-200 dark:border-amber-700 bg-[var(--surface)] rounded-lg px-3 py-2"
                  >
                    <option value="">— Congé normal (aucun rattrapage) —</option>
                    {carryoverOptions.map((co: any) => (
                      <option key={co.sourceLeaveId} value={co.sourceLeaveId}>
                        {Math.round(co.remainingDays * 10) / 10}j restants — congé du {new Date(co.originalStartDate).toLocaleDateString('fr-FR')} au {new Date(co.originalEndDate).toLocaleDateString('fr-FR')}
                      </option>
                    ))}
                  </select>
                  {selectedCarryover && (
                    <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1.5">
                      Ce repos ne sera jamais payé et ne touchera ni le solde ni le cycle en cours — plafonné à {Math.round(selectedCarryover.remainingDays * 10) / 10}j.
                    </p>
                  )}
                </div>
              )}

              {!selectedCarryoverId && (
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Type</label>
                  <select
                    value={manualForm.type}
                    onChange={e => setManualForm(f => ({ ...f, type: e.target.value as any }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  >
                    <option value="ANNUAL">Annuel</option>
                    <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={manualForm.startDate}
                    onChange={e => setManualForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={manualForm.endDate}
                    onChange={e => setManualForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Note (optionnel)</label>
                <input
                  type="text"
                  value={manualForm.reason}
                  onChange={e => setManualForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Ex : accord oral avec le chef de service"
                  className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                />
              </div>

              {!selectedCarryoverId && manualForm.type === 'ANNUAL' && (
                <div className="space-y-2 pt-1 border-t border-[var(--border)]">
                  {manualBalance && (
                    <p className="text-xs text-[var(--text-muted)] pt-2">
                      Droit du cycle : {Math.round(manualBalance.annualEntitled)}j
                      {manualBalance.seniorityDays > 0 && ` (dont ${Math.round(manualBalance.seniorityDays)}j ancienneté)`}
                    </p>
                  )}
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)]">Jours d&apos;ancienneté reportés (optionnel)</label>
                    <input
                      type="number" min="0" step="0.5"
                      value={manualForm.extraDaysGranted}
                      onChange={e => setManualForm(f => ({ ...f, extraDaysGranted: e.target.value }))}
                      placeholder="Ex : 4 — laisser vide si non applicable"
                      className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                    />
                    {(manualBaseRemaining > 0 || manualSeniorityRemaining > 0) && (
                      <p className="text-xs text-amber-600 mt-1">
                        Congé partiel probable : ~{manualEstimatedDays}j estimés — il resterait ~{manualBaseRemaining}j de congé de base
                        {manualSeniorityRemaining > 0 ? ` et ${manualSeniorityRemaining}j d'ancienneté` : ''} à reporter.
                      </p>
                    )}
                  </div>
                  {manualNeedsMotif && (
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-muted)]">Motif de report (pour la lettre) *</label>
                      <input
                        type="text"
                        value={manualForm.resumptionNote}
                        onChange={e => setManualForm(f => ({ ...f, resumptionNote: e.target.value }))}
                        placeholder="Ex : seront récupérés après la période de forte activité du service..."
                        className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {manualError && <div className="text-xs text-red-500">{manualError}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setShowManualModal(false); setEditingRow(null); }} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={saveManualLeave}
                disabled={isSavingManual}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isSavingManual ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingRow ? 'Enregistrer' : 'Planifier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-bold text-[var(--text)]">Supprimer cette planification ?</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Le congé du {fmtDate(deletingRow.startDate)} au {fmtDate(deletingRow.endDate)} pour {deletingRow.employee.lastName} {deletingRow.employee.firstName} sera définitivement supprimé et son solde de congé restauré. Cette action est irréversible.
            </p>
            {deleteError && <div className="text-xs text-red-500">{deleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setDeletingRow(null); setDeleteError(''); }} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-40"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}