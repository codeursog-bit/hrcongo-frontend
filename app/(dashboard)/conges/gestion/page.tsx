'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/gestion/page.tsx
// ✅ Vue d'ensemble admin RH — combine congé (Annuel/Anticipé) et absence
//    (Conventionnelle/Exceptionnelle) : KPI, filtres, fiche employé détaillée.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Loader2, Users, UserCheck, Clock, CalendarCheck, Filter,
  ChevronRight, X, Umbrella, Zap, Stethoscope, Sparkles, Lock, Unlock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';

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
  PENDING: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GestionCongesPage() {
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
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
      console.error('Erreur chargement gestion congés', e);
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

  const subTypeOptions = useMemo(() => {
    if (typeFilter === 'CONVENTIONNELLE') return ['MALADIE', 'MATERNITE', 'PATERNITE', 'AUTRE'];
    if (typeFilter === 'EXCEPTIONNELLE') return ['MARIAGE', 'DECES', 'NAISSANCE', 'AUTRE'];
    return [];
  }, [typeFilter]);

  const kpis = overview?.kpis;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <CongeSubNav userRole={userRole} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion des congés</h1>
        <p className="text-sm text-gray-400">Vue d'ensemble congés et absences — filtrable par mois, type et statut</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-sky-500 mb-1"><Umbrella size={16} /><span className="text-xs font-bold uppercase tracking-wider">En congé</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.onLeaveToday ?? '—'}</p>
          <p className="text-xs text-gray-400">aujourd'hui</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-violet-500 mb-1"><UserCheck size={16} /><span className="text-xs font-bold uppercase tracking-wider">En absence</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.onAbsenceToday ?? '—'}</p>
          <p className="text-xs text-gray-400">
            dont {kpis?.absencePaidToday ?? 0} payée(s) · {kpis?.absenceUnpaidToday ?? 0} non payée(s)
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1"><Clock size={16} /><span className="text-xs font-bold uppercase tracking-wider">En attente</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.pendingRequests ?? '—'}</p>
          <p className="text-xs text-gray-400">demande(s) à traiter</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1"><CalendarCheck size={16} /><span className="text-xs font-bold uppercase tracking-wider">Jours validés</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.daysApprovedThisPeriod ?? '—'}</p>
          <p className="text-xs text-gray-400">ce mois</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setSubTypeFilter(''); }} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          <option value="">Tous les types</option>
          <option value="ANNUAL">Annuel</option>
          <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
          <option value="CONVENTIONNELLE">Conventionnelle</option>
          <option value="EXCEPTIONNELLE">Exceptionnelle</option>
        </select>
        {subTypeOptions.length > 0 && (
          <select value={subTypeFilter} onChange={e => setSubTypeFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
            <option value="">Tous les sous-motifs</option>
            {subTypeOptions.map(s => <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvé</option>
          <option value="REJECTED">Refusé</option>
        </select>
      </div>

      {/* Liste */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sky-500" size={28} /></div>
        ) : !overview?.events.length ? (
          <div className="text-center py-16 text-gray-400 text-sm">Aucune demande sur cette période avec ces filtres.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
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
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{ev.employee.firstName} {ev.employee.lastName}</p>
                      <p className="text-xs text-gray-400">{ev.employee.department?.name || ev.employee.position || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} className="text-gray-400" />
                        <span>{TYPE_LABELS[ev.type] || ev.type}{ev.subType ? ` · ${SUBTYPE_LABELS[ev.subType] || ev.subType}` : ''}</span>
                      </div>
                      {ev.kind === 'ABSENCE' && (
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-semibold ${ev.isPaid ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {ev.isPaid ? <Unlock size={10} /> : <Lock size={10} />} {ev.isPaid ? 'Compté présent' : 'Compté absent'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(ev.startDate)} → {fmtDate(ev.endDate)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{ev.daysCount}j</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[ev.status] || ''}`}>
                        {STATUS_LABELS[ev.status] || ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3"><ChevronRight size={14} className="text-gray-300" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Panneau fiche employé */}
      <AnimatePresence>
        {selectedEmployeeId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex justify-end"
            onClick={() => setSelectedEmployeeId(null)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className="w-full max-w-md bg-white dark:bg-gray-800 h-full overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Historique congés</h2>
                <button onClick={() => setSelectedEmployeeId(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <X size={18} />
                </button>
              </div>

              {isLoadingHistory ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sky-500" size={24} /></div>
              ) : history ? (
                <>
                  <div className="mb-6">
                    <p className="font-bold text-gray-900 dark:text-white">{history.employee.firstName} {history.employee.lastName}</p>
                    <p className="text-sm text-gray-400">{history.employee.department?.name || history.employee.position}</p>
                  </div>
                  <div className="space-y-3">
                    {history.history.length === 0 && <p className="text-sm text-gray-400">Aucun congé ou absence enregistré.</p>}
                    {history.history.map((h: any) => {
                      const Icon = TYPE_ICONS[h.type] || Umbrella;
                      return (
                        <div key={`${h.kind}-${h.id}`} className="p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
                              <Icon size={14} className="text-gray-400" />
                              {TYPE_LABELS[h.type] || h.type}{h.subType ? ` · ${SUBTYPE_LABELS[h.subType] || h.subType}` : ''}
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[h.status] || ''}`}>
                              {STATUS_LABELS[h.status] || h.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{fmtDate(h.startDate)} → {fmtDate(h.endDate)} · {h.daysCount}j</p>
                          {h.reason && <p className="text-xs text-gray-400 mt-1 italic">"{h.reason}"</p>}
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
    </div>
  );
}