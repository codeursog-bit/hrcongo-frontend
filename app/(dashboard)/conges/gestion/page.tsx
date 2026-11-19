'use client';
import '@/components/leave-history/leave-workspace.css';
import { ModuleSelect } from '@/components/ui/ModuleSelect';
import { LeaveModuleFrame as ModulePageFrame } from '@/components/leave-history/LeaveModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

// ============================================================================
// 📁 app/(dashboard)/conges/gestion/page.tsx
// ✅ Vue d'ensemble admin RH — combine congé (Annuel/Anticipé) et absence
//    (Conventionnelle/Exceptionnelle) : KPI, filtres, fiche employé détaillée.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Users, UserCheck, Clock, CalendarCheck, Filter,
  ChevronRight, X, Umbrella, Zap, Stethoscope, Sparkles, Lock, Unlock,
  Pencil, Trash2, AlertTriangle, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveEvent {
  id: string;
  employeeId: string;
  kind: 'LEAVE' | 'ABSENCE';
  employee: { firstName: string; lastName: string; position?: string; department?: { name: string } };
  type: string;
  subType: string | null;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: string;
  isPaid: boolean;
  // ✅ Retour anticipé — présent uniquement sur les congés (kind 'LEAVE').
  returnConfirmed?: boolean;
  actualReturnDate?: string | null;
  forfeitedDays?: number;
  // ✅ Rattrapage d'un reliquat — ce congé consomme le reliquat d'un autre.
  isCarryover?: boolean;
}

interface EarlyReturn {
  id: string;
  employeeId: string;
  employee: { firstName: string; lastName: string; position?: string; department?: { name: string } };
  type: string;
  startDate: string;
  endDate: string;
  actualReturnDate: string;
  forfeitedDays: number;
}

interface Overview {
  period: { month: number; year: number };
  kpis: {
    onLeaveToday: number;
    onAbsenceToday: number;
    absencePaidToday: number;
    absenceUnpaidToday: number;
    pendingRequests: number;
    daysApprovedThisPeriod: number;
  };
  events: LeaveEvent[];
  earlyReturns: EarlyReturn[];
}

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé',
  CONVENTIONNELLE: 'Conventionnelle', EXCEPTIONNELLE: 'Exceptionnelle',
};
const SUBTYPE_LABELS: Record<string, string> = {
  MALADIE: 'Maladie', MATERNITE: 'Maternité', PATERNITE: 'Paternité',
  MARIAGE: 'Mariage', DECES: 'Décès', NAISSANCE: 'Naissance', AUTRE: 'Autre',
};
const TYPE_ICONS: Record<string, any> = {
  ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap, CONVENTIONNELLE: Stethoscope, EXCEPTIONNELLE: Sparkles,
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé', CANCELLED: 'Annulé',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  ',
  APPROVED: 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)]  ',
  REJECTED: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]  ',
  CANCELLED: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GestionCongesPage() {
  const [uiLoadError,setUiLoadError]=useState('');
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('');
  const [subTypeFilter, setSubTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [history, setHistory] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ✅ Modifier / Supprimer une ligne "LEAVE" de l'historique — réservé
  // RH/Admin, quelle que soit l'origine (demande employé, admin, ou
  // planification RH). Les absences (kind 'ABSENCE') ne sont pas concernées
  // ici — elles relèvent du module Absences.
  const canManage = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ type: 'ANNUAL' as 'ANNUAL' | 'ANNUAL_ANTICIPATED', startDate: '', endDate: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
    } catch {}
    // ✅ Lien direct depuis le bandeau "Retours anticipés" — ouvre
    // automatiquement l'historique de l'employé ciblé.
    try {
      const params = new URLSearchParams(window.location.search);
      const employeeId = params.get('employee');
      if (employeeId) openEmployeeHistory(employeeId);
    } catch {}
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (typeFilter) params.set('type', typeFilter);
      if (subTypeFilter) params.set('subType', subTypeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get<Overview>(`/leaves/management-overview?${params.toString()}`);
      setOverview(data);
    } catch (e) {
      console.error('Erreur chargement gestion congés', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year, typeFilter, subTypeFilter, statusFilter]);

  const openEmployeeHistory = async (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsLoadingHistory(true);
    try {
      const data = await api.get(`/leaves/employee-history/${employeeId}`);
      setHistory(data);
    } catch (e) {
      console.error('Erreur historique employé', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ✅ Modifier — réutilise PATCH /leaves/:id (updateLeavePlanning côté
  // back) : édition EN PLACE, jamais de duplication, l'écart de solde est
  // ajusté automatiquement.
  const openEditItem = (item: any) => {
    setEditError('');
    setEditingItem(item);
    setEditForm({
      type: item.type === 'ANNUAL_ANTICIPATED' ? 'ANNUAL_ANTICIPATED' : 'ANNUAL',
      startDate: new Date(item.startDate).toISOString().slice(0, 10),
      endDate: new Date(item.endDate).toISOString().slice(0, 10),
    });
  };

  const saveEditItem = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    setEditError('');
    try {
      await api.patch(`/leaves/${editingItem.id}`, {
        type: editForm.type,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditingItem(null);
      if (selectedEmployeeId) await openEmployeeHistory(selectedEmployeeId);
      await load();
    } catch (e: any) {
      setEditError(e?.message || 'Erreur lors de la modification du congé');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ✅ Supprimer définitivement — restaure le solde puis retire la ligne
  // (deleteLeave côté back) ; distinct d'une annulation, qui garde une trace.
  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsDeletingItem(true);
    setDeleteError('');
    try {
      await api.delete(`/leaves/${deletingItem.id}`);
      setDeletingItem(null);
      if (selectedEmployeeId) await openEmployeeHistory(selectedEmployeeId);
      await load();
    } catch (e: any) {
      setDeleteError(e?.message || 'Erreur lors de la suppression du congé');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const subTypeOptions = useMemo(() => {
    if (typeFilter === 'CONVENTIONNELLE') return ['MALADIE', 'MATERNITE', 'PATERNITE', 'AUTRE'];
    if (typeFilter === 'EXCEPTIONNELLE') return ['MARIAGE', 'DECES', 'NAISSANCE', 'AUTRE'];
    return [];
  }, [typeFilter]);

  const kpis = overview?.kpis;

  return (
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-6xl mx-auto p-4 md:p-6">
      <CongeSubNav userRole={userRole} />

      <div className="mb-6 leave-header">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Gestion des congés</h1>
        <p className="text-sm text-[var(--text-muted)]">Vue d'ensemble congés et absences — filtrable par mois, type et statut</p>
      </div>

      {/* ── Retours anticipés en attente — pense-bête permanent, indépendant
          du mois/année affiché : ces jours restent légalement non reversés
          au solde (voir la fiche congé), mais le RH doit s'en souvenir pour
          décider s'il replanifie un départ pour les jours non pris. ── */}
      {!!overview?.earlyReturns?.length && (
        <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-[var(--warning-text)]  font-semibold text-sm mb-3">
            <Clock size={16} /> Retours anticipés — jours non pris à ne pas oublier ({overview.earlyReturns.length})
          </div>
          <div className="space-y-2">
            {overview.earlyReturns.map(er => (
              <div key={er.id} className="flex items-center justify-between gap-3 bg-[var(--surface)] rounded-xl px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold text-[var(--text)]">{er.employee.firstName} {er.employee.lastName}</span>
                  <span className="text-[var(--text-muted)] ml-2">
                    congé {fmtDate(er.startDate)} → {fmtDate(er.endDate)}, rentré le {fmtDate(er.actualReturnDate)}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[var(--warning-text)]  font-semibold text-xs">{Math.round(er.forfeitedDays)}j non pris</span>
                  <Button variant="ghost"
                    onClick={() => openEmployeeHistory(er.employeeId)}
                    className="text-xs font-semibold text-[var(--action)]  hover:underline"
                  >
                    Voir l'historique
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--warning-text)]  mt-3">
            Purement informatif : ces jours ne sont pas reversés automatiquement au solde. C'est au RH de décider, au cas par cas, s'il replanifie un départ pour les jours non pris (via "Programme des départs" ou "Nouvelle demande").
          </p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 leave-metrics">
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--action)] mb-1"><Umbrella size={16} /><span className="text-xs font-semibold uppercase tracking-wider">En congé</span></div>
          <p className="text-2xl font-semibold text-[var(--text)]">{kpis?.onLeaveToday ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)]">aujourd'hui</p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--warning-text)] mb-1"><UserCheck size={16} /><span className="text-xs font-semibold uppercase tracking-wider">En absence</span></div>
          <p className="text-2xl font-semibold text-[var(--text)]">{kpis?.onAbsenceToday ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)]">
            dont {kpis?.absencePaidToday ?? 0} payée(s) · {kpis?.absenceUnpaidToday ?? 0} non payée(s)
          </p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--warning-text)] mb-1"><Clock size={16} /><span className="text-xs font-semibold uppercase tracking-wider">En attente</span></div>
          <p className="text-2xl font-semibold text-[var(--text)]">{kpis?.pendingRequests ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)]">demande(s) à traiter</p>
        </div>
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center gap-2 text-[var(--action)] mb-1"><CalendarCheck size={16} /><span className="text-xs font-semibold uppercase tracking-wider">Jours validés</span></div>
          <p className="text-2xl font-semibold text-[var(--text)]">{kpis?.daysApprovedThisPeriod ?? '—'}</p>
          <p className="text-xs text-[var(--text-muted)]">ce mois</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 mb-4 flex flex-wrap items-center gap-2 leave-period-bar">
        <Filter size={16} className="text-[var(--text-muted)]" />
        <ModuleSelect value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>
          ))}
        </ModuleSelect>
        <ModuleSelect value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </ModuleSelect>
        <ModuleSelect value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setSubTypeFilter(''); }} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          <option value="">Tous les types</option>
          <option value="ANNUAL">Annuel</option>
          <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
          <option value="CONVENTIONNELLE">Conventionnelle</option>
          <option value="EXCEPTIONNELLE">Exceptionnelle</option>
        </ModuleSelect>
        {subTypeOptions.length > 0 && (
          <ModuleSelect value={subTypeFilter} onChange={e => setSubTypeFilter(e.target.value)} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
            <option value="">Tous les sous-motifs</option>
            {subTypeOptions.map(s => <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>)}
          </ModuleSelect>
        )}
        <ModuleSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5">
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvé</option>
          <option value="REJECTED">Refusé</option>
        </ModuleSelect>
      </div>

      {/* Liste */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {isLoading ? (
          <ModulePageSkeleton />
        ) : !overview?.events.length ? (
          <div className="text-center py-16 text-[var(--text-muted)] text-sm">Aucune demande sur cette période avec ces filtres.</div>
        ) : (
          <div className="leave-table-scroll" tabIndex={0} role="region" aria-label="Tableau des congés défilant horizontalement"><table data-leave-table="true" className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Jours</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {overview.events.map(ev => {
                const Icon = TYPE_ICONS[ev.type] || Umbrella;
                return (
                  <tr
                    key={`${ev.kind}-${ev.id}`}
                    onClick={() => openEmployeeHistory(ev.employeeId)}
                    className="border-b border-[var(--border)] hover:bg-[var(--surface-2)]/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--text)]">{ev.employee.firstName} {ev.employee.lastName}</p>
                      <p className="text-xs text-[var(--text-muted)]">{ev.employee.department?.name || ev.employee.position || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} className="text-[var(--text-muted)]" />
                        <span>{TYPE_LABELS[ev.type] || ev.type}{ev.subType ? ` · ${SUBTYPE_LABELS[ev.subType] || ev.subType}` : ''}</span>
                      </div>
                      {ev.kind === 'ABSENCE' && (
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold ${ev.isPaid ? 'text-[var(--action)]' : 'text-[var(--text-muted)]'}`}>
                          {ev.isPaid ? <Unlock size={10} /> : <Lock size={10} />} {ev.isPaid ? 'Compté présent' : 'Compté absent'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {fmtDate(ev.startDate)} → {fmtDate(ev.endDate)}
                      {ev.kind === 'LEAVE' && ev.returnConfirmed && Number(ev.forfeitedDays) > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--warning-text)]  bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  px-1.5 py-0.5 rounded">
                            ↩ Retour anticipé le {fmtDate(ev.actualReturnDate!)} · {Math.round(Number(ev.forfeitedDays))}j non pris
                          </span>
                        </div>
                      )}
                      {ev.kind === 'LEAVE' && ev.isCarryover && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--action)]  bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  px-1.5 py-0.5 rounded">
                            Rattrapage — non payé
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-muted)]">{Math.round(Number(ev.daysCount))}j</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[ev.status] || ''}`}>
                        {STATUS_LABELS[ev.status] || ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChevronRight size={14} className="text-[var(--text-muted)]" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>

      {/* Panneau fiche employé */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgb(0_0_0_/.48)] flex justify-end"
            onClick={() => setSelectedEmployeeId(null)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="w-full max-w-md bg-[var(--surface)] h-full overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[var(--text)]">Historique congés</h2>
                <Button variant="ghost" onClick={() => setSelectedEmployeeId(null)} className="p-2 rounded-lg hover:bg-[var(--surface-2)]">
                  <X size={18} />
                </Button>
              </div>

              {isLoadingHistory ? (
                <ModulePageSkeleton />
              ) : history ? (
                <>
                  <div className="mb-6">
                    <p className="font-semibold text-[var(--text)]">{history.employee.firstName} {history.employee.lastName}</p>
                    <p className="text-sm text-[var(--text-muted)]">{history.employee.department?.name || history.employee.position}</p>
                  </div>
                  <div className="space-y-3">
                    {history.history.length === 0 && <p className="text-sm text-[var(--text-muted)]">Aucun congé ou absence enregistré.</p>}
                    {history.history.map((h: any) => {
                      const Icon = TYPE_ICONS[h.type] || Umbrella;
                      return (
                        <div key={`${h.kind}-${h.id}`} className="p-3 border border-[var(--border)] rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)]">
                              <Icon size={14} className="text-[var(--text-muted)]" />
                              {TYPE_LABELS[h.type] || h.type}{h.subType ? ` · ${SUBTYPE_LABELS[h.subType] || h.subType}` : ''}
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[h.status] || ''}`}>
                              {STATUS_LABELS[h.status] || h.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{fmtDate(h.startDate)} → {fmtDate(h.endDate)} · {Math.round(Number(h.daysCount))}j</p>
                          {h.reason && <p className="text-xs text-[var(--text-muted)] mt-1 italic">"{h.reason}"</p>}
                          {h.kind === 'LEAVE' && h.returnConfirmed && Number(h.forfeitedDays) > 0 && (
                            <p className="text-[11px] font-semibold text-[var(--warning-text)]  bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  inline-block px-1.5 py-0.5 rounded mt-1">
                              ↩ Retour anticipé le {fmtDate(h.actualReturnDate)} · {Math.round(Number(h.forfeitedDays))}j non pris
                            </p>
                          )}
                          {h.kind === 'LEAVE' && h.isCarryover && (
                            <p className="text-[11px] font-semibold text-[var(--action)]  bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  inline-block px-1.5 py-0.5 rounded mt-1 ml-1">
                              Rattrapage — non payé
                            </p>
                          )}
                          {canManage && h.kind === 'LEAVE' && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[var(--border)]">
                              <Button variant="ghost"
                                onClick={() => openEditItem(h)}
                                className="text-xs font-semibold px-2 py-1 rounded-lg text-[var(--action)]  hover:bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  flex items-center gap-1"
                              >
                                <Pencil size={12} /> Modifier
                              </Button>
                              <Button variant="ghost"
                                onClick={() => { setDeleteError(''); setDeletingItem(h); }}
                                className="text-xs font-semibold px-2 py-1 rounded-lg text-[var(--danger-text)]  hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Supprimer
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {editingItem && (
        <div className="fixed inset-0 bg-[rgb(0_0_0_/.48)] flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text)]">Modifier ce congé</h2>
              <Button variant="ghost" onClick={() => setEditingItem(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Modifie directement cette demande — dates/type ajustés sur la même ligne, sans jamais en créer une nouvelle ni impacter le calendrier en double.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]">Type</label>
                <ModuleSelect
                  value={editForm.type}
                  onChange={e => setEditForm(f => ({ ...f, type: e.target.value as any }))}
                  className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                >
                  <option value="ANNUAL">Annuel</option>
                  <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
                </ModuleSelect>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
            {editError && <div className="text-xs text-[var(--danger-text)]">{editError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </Button>
              <Button variant="primary"
                onClick={saveEditItem}
                disabled={isSavingEdit}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] flex items-center gap-2 disabled:opacity-40"
              >
                {isSavingEdit ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {deletingItem && (
        <div className="fixed inset-0 bg-[rgb(0_0_0_/.48)] flex items-center justify-center z-[60] p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">Supprimer ce congé ?</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Le congé du {fmtDate(deletingItem.startDate)} au {fmtDate(deletingItem.endDate)} sera définitivement supprimé et le solde restauré s'il avait déjà été approuvé. Cette action est irréversible.
            </p>
            {deleteError && <div className="text-xs text-[var(--danger-text)]">{deleteError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDeletingItem(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                Annuler
              </Button>
              <Button variant="ghost"
                onClick={confirmDeleteItem}
                disabled={isDeletingItem}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] flex items-center gap-2 disabled:opacity-40"
              >
                {isDeletingItem ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div></ModulePageFrame>
  );
}