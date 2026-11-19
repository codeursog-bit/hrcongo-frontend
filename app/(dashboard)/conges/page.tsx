'use client';
import '@/components/leave-history/leave-workspace.css';
import { ModuleSelect } from '@/components/ui/ModuleSelect';
import { LeaveModuleFrame as ModulePageFrame } from '@/components/leave-history/LeaveModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Check, X, Clock, ArrowRight, UserCircle,
  Loader2, AlertCircle, FileText, CheckCircle2, XCircle,
  MessageSquare, Info, Wallet, Users, TrendingUp, BarChart3,
  AlertTriangle, Eye, Search, Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
// ✅ LOT E — circuit d'avis (inactif tant que l'admin n'a rien configuré)
import { useApprovalDecision } from '@/hooks/useApprovalDecision';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type LeaveType   = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'SPECIAL' | 'COMPENSATORY';

interface LeaveRequest {
  id: string;
  employee: {
    firstName: string;
    lastName:  string;
    photoUrl?: string;
    position:  string;
    department?: { name: string };
  };
  type:      LeaveType;
  startDate: string;
  endDate:   string;
  daysCount: number;
  reason?:   string;
  status:    LeaveStatus;
  createdAt: string;
  // ✅ Rattrapage d'un reliquat de retour anticipé — voir createCarryoverLeave/Request côté backend.
  carriedFromLeaveId?: string | null;
}

interface ProvisionSummary {
  totalProvision: number;
  details: Array<{ alertLevel: string }>;
}

// ─── Config types ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<LeaveType, { label: string; dot: string; badge: string }> = {
  ANNUAL:       { label: 'Congés Annuels',  dot: 'bg-[var(--brand)]', badge: 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)] border-[var(--border)]   ' },
  SICK:         { label: 'Maladie',         dot: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]',     badge: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]   ' },
  MATERNITY:    { label: 'Maternité',       dot: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',   badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ' },
  PATERNITY:    { label: 'Paternité',       dot: 'bg-[var(--brand)]', badge: 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)] border-[var(--border)]   ' },
  UNPAID:       { label: 'Sans Solde',      dot: 'bg-[var(--text-muted)]', badge: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]' },
  SPECIAL:      { label: 'Événement Fam.', dot: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',    badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ' },
  COMPENSATORY: { label: 'Compensatoire',  dot: 'bg-[var(--brand)]',  badge: 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)] border-[var(--border)]   ' },
};

const fmtXAF = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function LeaveManagementPage() {
  const [uiLoadError,setUiLoadError]=useState('');
  const { bp } = useBasePath();
  const [activeTab, setActiveTab]   = useState<'ACTION' | 'HISTORY'>('ACTION');
  const [leaves, setLeaves]         = useState<LeaveRequest[]>([]);
  const [provision, setProvision]   = useState<ProvisionSummary | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [modalData, setModalData]   = useState<{ type: 'approve' | 'reject'; leave: LeaveRequest } | null>(null);
  // ✅ LOT E — décision via l'orchestrateur (identique à avant si aucun circuit n'est configuré)
  const { decide, dialog: approvalDialog } = useApprovalDecision();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing]       = useState(false);
  const [userRole, setUserRole]     = useState<string>('');
  const [isRH, setIsRH]             = useState(false);
  // ✅ Filtres onglet Historique — par période (mois/année) et recherche par
  // nom d'employé. Purement côté front : la liste complète est déjà chargée
  // via /leaves, on ne fait qu'affiner l'affichage, sans rappel serveur.
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth]   = useState<number | 'ALL'>('ALL');
  const [historyYear, setHistoryYear]     = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserRole(u.role || '');
        setIsRH(['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(u.role));
      }
    } catch {}

    const loadAll = async () => {
      try {
        // Charger les congés + la provision en parallèle (provision uniquement pour RH/Admin)
        const stored = localStorage.getItem('user');
        const role   = stored ? JSON.parse(stored).role : '';
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(role);

        const [leavesData, provData] = await Promise.allSettled([
          api.get<LeaveRequest[]>('/leaves'),
          isAdmin ? api.get<ProvisionSummary>('/leaves/provision') : Promise.resolve(null),
        ]);

        if (leavesData.status === 'fulfilled') setLeaves(leavesData.value);
        if (provData.status === 'fulfilled' && provData.value) setProvision(provData.value);
      } catch (e) {
        console.error('Erreur chargement congés', e); setUiLoadError('Le chargement a échoué. Réessayez dans un instant.');
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, []);

  const pendingLeaves = useMemo(() => leaves.filter(l => l.status === 'PENDING'),  [leaves]);
  const historyLeaves = useMemo(() => leaves.filter(l => l.status !== 'PENDING'),  [leaves]);

  // ✅ Années disponibles pour le sélecteur — dérivées des données réellement
  // chargées (+ année en cours, toujours présente même sans historique).
  const historyYearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    historyLeaves.forEach(l => years.add(new Date(l.startDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [historyLeaves]);

  const filteredHistoryLeaves = useMemo(() => {
    const search = historySearch.trim().toLowerCase();
    return historyLeaves.filter(l => {
      if (historyYear !== 'ALL' && new Date(l.startDate).getFullYear() !== historyYear) return false;
      if (historyMonth !== 'ALL' && new Date(l.startDate).getMonth() + 1 !== historyMonth) return false;
      if (search) {
        const fullName = `${l.employee.firstName} ${l.employee.lastName}`.toLowerCase();
        if (!fullName.includes(search)) return false;
      }
      return true;
    });
  }, [historyLeaves, historySearch, historyMonth, historyYear]);

  // Alertes provision critiques
  const criticalCount = useMemo(
    () => provision?.details.filter(d => d.alertLevel === 'CRITICAL').length ?? 0,
    [provision]
  );
  const warningCount = useMemo(
    () => provision?.details.filter(d => d.alertLevel === 'WARNING').length ?? 0,
    [provision]
  );

  const openModal = (type: 'approve' | 'reject', leave: LeaveRequest) => {
    setRejectionReason('');
    setModalData({ type, leave });
  };

  const confirmAction = async () => {
    if (!modalData) return;
    if (modalData.type === 'reject' && !rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      const status = modalData.type === 'approve' ? 'APPROVED' : 'REJECTED';
      // ✅ LOT E — orchestrateur : sans circuit actif, décision immédiate (comportement d'avant).
      const out = await decide('leave', modalData.leave.id, {
        decision: modalData.type === 'approve' ? 'APPROVE' : 'REJECT',
        rejectionReason: modalData.type === 'reject' ? rejectionReason : undefined,
      });
      if (out.outcome === 'CANCELLED') return;
      if (out.outcome === 'WAITING') {
        // Validée « en attente d'avis » : la demande reste PENDING (ouvrir la fiche pour suivre les avis).
        setModalData(null);
        alert("Validation enregistrée : la demande sera finalisée dès que les avis attendus seront donnés. Ouvrez la demande pour suivre les avis.");
        return;
      }
      setLeaves(prev => prev.map(l => l.id === modalData.leave.id ? { ...l, status } : l));
      setModalData(null);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <ModulePageSkeleton />;

  return (
    <ModulePageFrame kind="list" error={uiLoadError}><div className="max-w-[1600px] mx-auto pb-24 space-y-8">
      <CongeSubNav userRole={userRole} />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 leave-header">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Demandes de congé
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Validez les demandes · Consultez l'historique de votre périmètre
          </p>
        </div>

        {/* ── BOUTONS DE NAVIGATION ── */}
        <div className="flex flex-wrap gap-2"><Link href={bp("/conges/nouveau")} className="k-button k-button-primary"><Calendar size={18} /> Nouvelle demande</Link>{!isRH && <Link href={bp("/conges/calendrier")} className="k-button k-button-secondary"><Calendar size={18} /> Calendrier</Link>}</div>
      </div>

      {/* ── BANDEAU PROVISION (si alertes critiques) ── */}
      {isRH && criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-2xl p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[var(--danger-text)] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[var(--danger-text)]  text-sm">
                {criticalCount} employé{criticalCount > 1 ? 's' : ''} proche{criticalCount > 1 ? 's' : ''} du plafond légal de cumul (3 ans sans congé)
              </p>
              <p className="text-xs text-[var(--danger-text)]  mt-0.5">
                Provision totale : <strong>{fmtXAF(provision?.totalProvision ?? 0)} F CFA</strong> · Planifiez les départs en congé pour éviter la perte de droits.
              </p>
            </div>
          </div>
          <Link
            href={bp("/conges/provision")}
            className="shrink-0 px-4 py-2 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            Voir le détail <ArrowRight size={14} />
          </Link>
        </motion.div>
      )}

      {/* ── BANDEAU PROVISION (alertes warning uniquement) ── */}
      {isRH && criticalCount === 0 && warningCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-2xl p-4 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-[var(--warning-text)] shrink-0" />
            <p className="text-sm text-[var(--warning-text)] ">
              <strong>{warningCount} employé{warningCount > 1 ? 's' : ''}</strong> n'{warningCount > 1 ? 'ont' : 'a'} pas pris de congé annuel depuis longtemps — approche du plafond légal de 3 ans.
              Provision : <strong>{fmtXAF(provision?.totalProvision ?? 0)} F CFA</strong>
            </p>
          </div>
          <Link href={bp("/conges/provision")} className="text-sm font-semibold text-[var(--warning-text)]  hover:underline flex items-center gap-1 shrink-0">
            Détails <ArrowRight size={13} />
          </Link>
        </motion.div>
      )}

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-[var(--surface-2)] p-1 rounded-xl w-fit">
        <Button variant="ghost"
          onClick={() => setActiveTab('ACTION')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'ACTION'
              ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <AlertCircle size={16} />
          À Traiter
          {pendingLeaves.length > 0 && (
            <span className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center ">
              {pendingLeaves.length}
            </span>
          )}
        </Button>
        <Button variant="ghost"
          onClick={() => setActiveTab('HISTORY')}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <FileText size={16} />
          Historique
        </Button>
      </div>

      {/* ── CONTENU ── */}
      <AnimatePresence mode="wait">

        {/* TAB PENDING */}
        {activeTab === 'ACTION' && (
          <motion.div key="action" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {pendingLeaves.length === 0 ? (
              <div className="text-center py-24 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  text-[var(--action)] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text)] mb-1">Tout est traité !</h3>
                <p className="text-[var(--text-muted)] text-sm">Aucune demande en attente.</p>
              </div>
            ) : (
              <div className="leave-pending-list">
                {pendingLeaves.map(leave => {
                  const cfg      = TYPE_CONFIG[leave.type] ?? TYPE_CONFIG.ANNUAL;
                  const initials = `${leave.employee.firstName[0]}${leave.employee.lastName[0]}`;
                  return (
                    <motion.div key={leave.id} layout className="leave-pending-row bg-[var(--surface)] overflow-hidden">
                      <div className="p-6 flex gap-5">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center font-semibold text-[var(--text-muted)] text-sm shrink-0">
                          {leave.employee.photoUrl ? (
                            <img src={leave.employee.photoUrl} className="w-full h-full rounded-xl object-cover" alt={initials} />
                          ) : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-semibold text-[var(--text)]">
                                {leave.employee.firstName} {leave.employee.lastName}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {leave.employee.position}{leave.employee.department ? ` · ${leave.employee.department.name}` : ''}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${cfg.badge} shrink-0`}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--surface-2)] px-3 py-2 rounded-lg mb-3">
                            <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
                            <span className="font-mono text-xs">{new Date(leave.startDate).toLocaleDateString('fr-FR')}</span>
                            <ArrowRight size={12} className="text-[var(--text-muted)]" />
                            <span className="font-mono text-xs">{new Date(leave.endDate).toLocaleDateString('fr-FR')}</span>
                            <span className="ml-auto font-semibold text-xs text-[var(--text-muted)]">{Math.round(Number(leave.daysCount))}j ouvrés</span>
                          </div>
                          {leave.type === 'UNPAID' && (
                            <p className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                              <Info size={12} className="text-[var(--text-muted)]" />
                              Congé sans solde — aucune indemnité versée
                            </p>
                          )}
                          {leave.carriedFromLeaveId && (
                            <p className="text-xs text-[var(--action)]  bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  px-3 py-1.5 rounded-lg mb-3 flex items-center gap-1.5">
                              <Info size={12} className="text-[var(--action)]" />
                              Rattrapage d'un reliquat de retour anticipé — non payé, sans impact sur le solde/cycle en cours
                            </p>
                          )}
                          {leave.reason && (
                            <p className="text-xs text-[var(--text-muted)] italic border-l-2 border-[var(--border)] pl-3 mb-4 truncate">
                              "{leave.reason}"
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Link
                              href={bp(`/conges/${leave.id}`)}
                              title="Voir le détail"
                              className="px-3 py-2.5 border border-[var(--border)] text-[var(--text-muted)] rounded-xl hover:bg-[var(--surface-2)] transition-colors flex items-center justify-center"
                            >
                              <Eye size={16} />
                            </Link>
                            <Button variant="primary"
                              onClick={() => openModal('approve', leave)}
                              className="flex-1 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Check size={16} /> Valider
                            </Button>
                            <Button variant="ghost"
                              onClick={() => openModal('reject', leave)}
                              className="flex-1 py-2.5 border border-[var(--border)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  hover:border-[var(--border)] hover:text-[var(--danger-text)] text-[var(--text-muted)] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <X size={16} /> Refuser
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB HISTORY */}
        {activeTab === 'HISTORY' && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            {/* ── Filtres historique : période + recherche par nom ── */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 flex flex-wrap items-center gap-2 leave-period-bar">
              <Filter size={16} className="text-[var(--text-muted)] shrink-0" />
              <ModuleSelect
                value={historyMonth}
                onChange={e => setHistoryMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5"
              >
                <option value="ALL">Tous les mois</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </ModuleSelect>
              <ModuleSelect
                value={historyYear}
                onChange={e => setHistoryYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg px-2 py-1.5"
              >
                <option value="ALL">Toutes les années</option>
                {historyYearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </ModuleSelect>
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Rechercher un employé par nom…"
                  className="w-full text-sm border border-[var(--border)] bg-[var(--surface)] rounded-lg pl-9 pr-3 py-1.5"
                />
              </div>
              {(historySearch || historyMonth !== 'ALL' || historyYear !== 'ALL') && (
                <Button variant="ghost"
                  onClick={() => { setHistorySearch(''); setHistoryMonth('ALL'); setHistoryYear('ALL'); }}
                  className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] px-2"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {filteredHistoryLeaves.length === 0 ? (
              <div className="text-center py-20 bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
                <Clock size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-muted)] text-sm">
                  {historyLeaves.length === 0 ? 'Aucun historique disponible.' : 'Aucun résultat pour ces filtres.'}
                </p>
              </div>
            ) : (
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="leave-table-scroll" tabIndex={0} role="region" aria-label="Tableau des congés défilant horizontalement"><table data-leave-table="true" className="w-full text-left">
                  <thead className="bg-[var(--surface-2)]/40 border-b border-[var(--border)]">
                    <tr>
                      {['Employé', 'Type', 'Période', 'Durée', 'Statut'].map(h => (
                        <th key={h} className="px-6 py-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                      ))}
                      <th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredHistoryLeaves.map(leave => {
                      const cfg = TYPE_CONFIG[leave.type] ?? TYPE_CONFIG.ANNUAL;
                      return (
                        <tr key={leave.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-[var(--text)]">
                              {leave.employee.firstName} {leave.employee.lastName}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">{leave.employee.department?.name}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                              {cfg.label}
                            </span>
                            {leave.carriedFromLeaveId && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-[var(--action)]  bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  px-1.5 py-0.5 rounded">
                                Rattrapage — non payé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-[var(--text-muted)]">
                            {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-[var(--text-muted)]">{Math.round(Number(leave.daysCount))}j</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {leave.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--action)]  bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  px-3 py-1.5 rounded-full border border-[var(--border)]">
                                <CheckCircle2 size={13} /> Validé
                              </span>
                            )}
                            {leave.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  px-3 py-1.5 rounded-full border border-[var(--border)]">
                                <XCircle size={13} /> Refusé
                              </span>
                            )}
                            {leave.status === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] bg-[var(--surface-2)] px-3 py-1.5 rounded-full border border-[var(--border)]">
                                Annulé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={bp(`/conges/${leave.id}`)} className="text-[var(--action)] hover:underline text-xs font-semibold">
                              Détail →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL CONFIRMATION ── */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.48)]  p-4"
            onClick={e => e.target === e.currentTarget && setModalData(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              className="bg-[var(--surface)] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[var(--border)]"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                modalData.type === 'approve' ? 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)]' : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]'
              }`}>
                {modalData.type === 'approve' ? <Check size={26} /> : <X size={26} />}
              </div>

              <h3 className="text-xl font-semibold text-[var(--text)] mb-1">
                {modalData.type === 'approve' ? 'Valider la demande' : 'Refuser la demande'}
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {modalData.type === 'approve'
                  ? "L'employé sera notifié par email."
                  : 'Un motif est requis pour justifier le refus.'}
              </p>

              <div className="bg-[var(--surface-2)] rounded-xl p-4 mb-6 space-y-1.5 text-sm border border-[var(--border)]">
                <p className="text-[var(--text-muted)]">
                  Employé : <strong className="text-[var(--text)]">
                    {modalData.leave.employee.firstName} {modalData.leave.employee.lastName}
                  </strong>
                </p>
                <p className="text-[var(--text-muted)]">
                  Période : {new Date(modalData.leave.startDate).toLocaleDateString('fr-FR')} → {new Date(modalData.leave.endDate).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-[var(--text-muted)]">
                  Durée : <strong className="text-[var(--text)]">{modalData.leave.daysCount} jours ouvrés</strong>
                </p>
                <p className="text-[var(--text-muted)]">
                  Type : <strong className="text-[var(--text)]">{TYPE_CONFIG[modalData.leave.type]?.label}</strong>
                  {modalData.leave.type === 'UNPAID' && (
                    <span className="ml-2 text-xs bg-[var(--border)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">Sans indemnité</span>
                  )}
                  {modalData.leave.carriedFromLeaveId && (
                    <span className="ml-2 text-xs bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  text-[var(--action)]  px-2 py-0.5 rounded-full">Rattrapage — non payé</span>
                  )}
                </p>
              </div>

              {modalData.type === 'reject' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    Motif du refus <span className="text-[var(--danger-text)]">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Ex: Chevauchement avec une absence, période de forte activité..."
                    rows={3}
                    className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] text-sm resize-none focus:ring-2 focus:ring-[var(--focus)] outline-none placeholder-[var(--text-muted)]"
                  />
                  {!rejectionReason.trim() && (
                    <p className="text-xs text-[var(--danger-text)] mt-1 flex items-center gap-1">
                      <Info size={12} /> Le motif est obligatoire
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="ghost"
                  onClick={() => setModalData(null)}
                  className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]"
                >
                  Annuler
                </Button>
                <Button variant="ghost"
                  onClick={confirmAction}
                  disabled={isProcessing || (modalData.type === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm text-[var(--on-brand)] shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    modalData.type === 'approve' ? 'bg-[var(--brand)] hover:bg-[var(--brand)]' : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : modalData.type === 'approve' ? (
                    <><Check size={16} /> Confirmer</>
                  ) : (
                    <><X size={16} /> Refuser</>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {approvalDialog}
    </div></ModulePageFrame>
  );
}