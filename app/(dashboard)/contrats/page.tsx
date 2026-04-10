'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Clock, CheckCircle2, AlertTriangle, ChevronRight,
  Loader2, Search, RefreshCw, RotateCcw, TrendingUp, AlertCircle,
  XCircle, ChevronDown, UserX, Shield, Calculator, Users,
  CalendarX, Gavel, Info, Check,
} from 'lucide-react';
import { api } from '@/services/api';
import { differenceInDays } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContractEmployee {
  id: string;
  firstName: string; lastName: string;
  employeeNumber: string; position: string;
  contractType: string;
  hireDate: string;
  contractEndDate: string | null;
  status: string;
  department?: { name: string };
  baseSalary: number;
  trialPeriodDays?: number | null;
  trialEndDate?: string | null;
  trialStatus?: string;
  trialConfirmedAt?: string | null;
  isResident?: boolean;
  nationality?: string | null;
}

interface TrialEmployee {
  id: string; firstName: string; lastName: string;
  employeeNumber: string; position: string;
  contractType: string; hireDate: string;
  trialPeriodDays: number; trialEndDate: string;
  trialStatus: string; daysLeft: number; urgency: string;
  department?: { name: string };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CONTRACT_META: Record<string, { icon: string; label: string; color: string; badge: string }> = {
  CDI:         { icon: '♾️', label: 'CDI',         color: 'blue',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  CDD:         { icon: '📅', label: 'CDD',         color: 'amber',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  STAGE:       { icon: '🎓', label: 'Stage',       color: 'purple', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  CONSULTANT:  { icon: '💼', label: 'Consultant',  color: 'teal',   badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
  PRESTATAIRE: { icon: '🤝', label: 'Prestataire', color: 'slate',  badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  INTERIM:     { icon: '🔄', label: 'Intérim',     color: 'orange', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
};

const TEMP_CONTRACTS = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT', 'PRESTATAIRE'];
const BNC_CONTRACTS  = ['CONSULTANT', 'PRESTATAIRE'];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
function seniority(h: string) {
  const m = (new Date().getFullYear() - new Date(h).getFullYear()) * 12 + new Date().getMonth() - new Date(h).getMonth();
  const y = Math.floor(m / 12), r = m % 12;
  if (y === 0) return `${r} mois`;
  return r === 0 ? `${y} an${y > 1 ? 's' : ''}` : `${y} an${y > 1 ? 's' : ''} ${r}m`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Tab = 'actifs' | 'expirant' | 'essais' | 'bnc' | 'termines';

// ─── Composants ───────────────────────────────────────────────────────────────
function ContractBadge({ type }: { type: string }) {
  const m = CONTRACT_META[type];
  if (!m) return <span className="text-xs font-semibold text-slate-500">{type}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${m.badge}`}>
      {m.icon} {m.label}
    </span>
  );
}

function UrgencyBadge({ days, status }: { days: number; status: string }) {
  if (status === 'EXPIRED') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Expiré</span>;
  if (days <= 3)  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">🔴 J-{days}</span>;
  if (days <= 7)  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">🟠 J-{days}</span>;
  if (days <= 14) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">🟡 J-{days}</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">J-{days}</span>;
}

// ─── Modal renouvellement ─────────────────────────────────────────────────────
function RenewModal({ emp, onClose, onDone }: { emp: ContractEmployee; onClose: () => void; onDone: () => void }) {
  const [action, setAction] = useState<'RENEW' | 'CONVERT'>('RENEW');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canConvert = ['CDD', 'STAGE'].includes(emp.contractType);

  const save = async () => {
    if (action === 'RENEW' && !endDate) { setError('Date de fin obligatoire'); return; }
    setSaving(true); setError('');
    try {
      if (action === 'CONVERT') {
        await api.patch(`/employees/${emp.id}`, { contractType: 'CDI', contractEndDate: null });
      } else {
        await api.patch(`/employees/${emp.id}`, { contractEndDate: endDate });
      }
      onDone();
    } catch (e: any) { setError(e.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{emp.firstName} {emp.lastName}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{emp.position} · <ContractBadge type={emp.contractType} /></p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setAction('RENEW')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${action === 'RENEW' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
            <RotateCcw className={`w-5 h-5 ${action === 'RENEW' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className={`text-sm font-semibold ${action === 'RENEW' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Renouveler</span>
          </button>
          {canConvert && (
            <button onClick={() => setAction('CONVERT')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${action === 'CONVERT' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <TrendingUp className={`w-5 h-5 ${action === 'CONVERT' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className={`text-sm font-semibold ${action === 'CONVERT' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>Convertir CDI</span>
            </button>
          )}
        </div>
        {action === 'RENEW' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nouvelle date de fin *</label>
            <input type="date" value={endDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          </div>
        )}
        {action === 'CONVERT' && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-400">
            ✅ Converti en CDI à partir d'aujourd'hui. Ancienneté comptée depuis {fmtDate(emp.hireDate)}.
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
          <button onClick={save} disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 ${action === 'CONVERT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : action === 'CONVERT' ? <TrendingUp className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            {action === 'CONVERT' ? 'Convertir en CDI' : 'Renouveler'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal confirmation/rupture essai ────────────────────────────────────────
function TrialModal({ emp, mode, onClose, onDone }: { emp: TrialEmployee; mode: 'CONFIRM' | 'FAIL'; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (mode === 'FAIL' && !reason.trim()) { setError('Motif obligatoire'); return; }
    setSaving(true); setError('');
    try {
      if (mode === 'CONFIRM') {
        await api.patch(`/contracts/${emp.id}/confirm-trial`, {});
      } else {
        await api.patch(`/contracts/${emp.id}/fail-trial`, { reason });
      }
      onDone();
    } catch (e: any) { setError(e.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const isConfirm = mode === 'CONFIRM';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isConfirm ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
            {isConfirm ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{isConfirm ? 'Confirmer l\'essai' : 'Rompre l\'essai'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{emp.firstName} {emp.lastName} · {emp.contractType}</p>
          </div>
        </div>
        {isConfirm ? (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400 space-y-1">
            <p className="font-semibold">✅ L'employé sera confirmé définitivement.</p>
            <p>Son statut d'essai passe à CONFIRMÉ. Le {emp.contractType} continue normalement avec toutes les charges.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <p className="font-semibold">⚠️ Rupture pendant l'essai</p>
              <p className="mt-1">Aucun préavis ni indemnité de licenciement. L'employé sera marqué Terminé.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Motif de rupture *</label>
              <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Ex: Compétences insuffisantes, manque d'adéquation au poste…"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none" />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Annuler</button>
          <button onClick={save} disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md disabled:opacity-50 ${isConfirm ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isConfirm ? <Check className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
            {isConfirm ? 'Confirmer l\'essai' : 'Rompre l\'essai'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ContratsPage() {
  const [employees, setEmployees] = useState<ContractEmployee[]>([]);
  const [trials, setTrials]       = useState<TrialEmployee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [trialsLoading, setTrialsLoading] = useState(false);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState<Tab>('actifs');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [renewModal, setRenewModal] = useState<ContractEmployee | null>(null);
  const [trialModal, setTrialModal] = useState<{ emp: TrialEmployee; mode: 'CONFIRM' | 'FAIL' } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/employees?limit=500');
      setEmployees(Array.isArray(data) ? data : data.data ?? []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const loadTrials = useCallback(async () => {
    setTrialsLoading(true);
    try {
      const data = await api.get<TrialEmployee[]>('/contracts/trials');
      setTrials(Array.isArray(data) ? data : []);
    } catch {}
    finally { setTrialsLoading(false); }
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { if (tab === 'essais') loadTrials(); }, [tab, loadTrials]);

  const onSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
    loadEmployees();
    if (tab === 'essais') loadTrials();
  };

  // Catégorisation
  const now = new Date();
  const actifs    = employees.filter(e => e.status === 'ACTIVE' && (!e.contractEndDate || differenceInDays(new Date(e.contractEndDate), now) > 60));
  const expirant  = employees.filter(e => e.status === 'ACTIVE' && e.contractEndDate && differenceInDays(new Date(e.contractEndDate), now) <= 60 && differenceInDays(new Date(e.contractEndDate), now) >= 0).sort((a, b) => new Date(a.contractEndDate!).getTime() - new Date(b.contractEndDate!).getTime());
  const bncList   = employees.filter(e => e.status === 'ACTIVE' && BNC_CONTRACTS.includes(e.contractType));
  const termines  = employees.filter(e => e.status === 'TERMINATED');

  const critiques = expirant.filter(e => differenceInDays(new Date(e.contractEndDate!), now) <= 7).length;
  const trialsExpired = trials.filter(e => e.trialStatus === 'EXPIRED').length;

  const filtered = (list: ContractEmployee[]) => {
    let r = list;
    if (typeFilter !== 'ALL') r = r.filter(e => e.contractType === typeFilter);
    if (search) { const s = search.toLowerCase(); r = r.filter(e => `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`.toLowerCase().includes(s)); }
    return r;
  };

  const currentList = tab === 'actifs' ? filtered(actifs) : tab === 'expirant' ? filtered(expirant) : tab === 'termines' ? filtered(termines) : tab === 'bnc' ? filtered(bncList) : [];

  // Stat cards
  const TABS: { id: Tab; label: string; count: number; icon: React.ElementType; alert?: boolean }[] = [
    { id: 'actifs',   label: 'Actifs',          count: actifs.length,   icon: CheckCircle2 },
    { id: 'expirant', label: 'Expirant bientôt', count: expirant.length, icon: Clock,       alert: critiques > 0 },
    { id: 'essais',   label: 'Périodes d\'essai',count: trials.length,   icon: Shield,      alert: trialsExpired > 0 },
    { id: 'bnc',      label: 'BNC',             count: bncList.length,  icon: Calculator },
    { id: 'termines', label: 'Terminés',         count: termines.length, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion des Contrats</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{actifs.length} actifs · {expirant.length} expirant · {trials.length} en essai · {bncList.length} BNC</p>
          </div>
        </div>
        <button onClick={() => { loadEmployees(); if (tab === 'essais') loadTrials(); }}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Succès */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {successMsg}
        </div>
      )}

      {/* Alertes */}
      {critiques > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">🔴 {critiques} contrat{critiques > 1 ? 's' : ''} expire{critiques === 1 ? '' : 'nt'} dans moins de 7 jours !</p>
            <button onClick={() => setTab('expirant')} className="text-xs text-red-600 dark:text-red-400 underline mt-0.5">Voir maintenant →</button>
          </div>
        </div>
      )}
      {trialsExpired > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">⚠️ {trialsExpired} période{trialsExpired > 1 ? 's' : ''} d'essai expirée{trialsExpired > 1 ? 's' : ''} sans action</p>
            <button onClick={() => setTab('essais')} className="text-xs text-amber-600 dark:text-amber-400 underline mt-0.5">Régulariser →</button>
          </div>
        </div>
      )}

      {/* Stats mini par type */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Object.entries(CONTRACT_META).map(([ct, m]) => {
          const count = employees.filter(e => e.contractType === ct && e.status === 'ACTIVE').length;
          return (
            <button key={ct} onClick={() => setTypeFilter(typeFilter === ct ? 'ALL' : ct)}
              className={`p-3 rounded-xl border text-center transition-all ${typeFilter === ct ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <div className="text-lg mb-0.5">{m.icon}</div>
              <div className="font-bold text-slate-900 dark:text-white text-lg leading-none">{count}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.label}</div>
            </button>
          );
        })}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === t.id ? 'bg-white/20 text-white' : t.alert ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{t.count}</span>
            {t.alert && tab !== t.id && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Recherche (pas pour essais) */}
      {tab !== 'essais' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher nom, matricule, poste…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
        </div>
      )}

      {/* ═══ ONG. ESSAIS ════════════════════════════════════════════════════ */}
      {tab === 'essais' && (
        <div className="space-y-3">
          {trialsLoading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>}
          {!trialsLoading && trials.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
              <Shield className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              Aucune période d'essai en cours
            </div>
          )}
          {trials.map(emp => (
            <div key={emp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm ${emp.trialStatus === 'EXPIRED' ? 'border-amber-300 dark:border-amber-700' : emp.daysLeft <= 7 ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <div className="flex items-center gap-4 p-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${emp.trialStatus === 'EXPIRED' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}>
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                    <ContractBadge type={emp.contractType} />
                    <UrgencyBadge days={emp.daysLeft} status={emp.trialStatus} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.position} · {emp.department?.name} · Mat. {emp.employeeNumber}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Embauché {fmtDate(emp.hireDate)} · Fin essai : {fmtDate(emp.trialEndDate)} ({emp.trialPeriodDays}j)</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setTrialModal({ emp, mode: 'CONFIRM' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors">
                    <Check className="w-3 h-3" /> Confirmer
                  </button>
                  <button onClick={() => setTrialModal({ emp, mode: 'FAIL' })}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                    <UserX className="w-3 h-3" /> Rompre
                  </button>
                </div>
              </div>
              {/* Barre de progression essai */}
              {emp.trialStatus === 'IN_PROGRESS' && (
                <div className="px-4 pb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Début</span>
                    <span className={emp.daysLeft <= 7 ? 'text-red-500 font-semibold' : ''}>{emp.daysLeft > 0 ? `${emp.daysLeft}j restants` : 'Terminé'}</span>
                    <span>Fin essai</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    {(() => {
                      const total = emp.trialPeriodDays;
                      const elapsed = total - emp.daysLeft;
                      const pct = Math.min(100, Math.round((elapsed / total) * 100));
                      return <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />;
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ ONG. BNC ═══════════════════════════════════════════════════════ */}
      {tab === 'bnc' && (
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs text-teal-700 dark:text-teal-400 space-y-1">
            <p className="font-bold">📋 Régime BNC — Obligation légale Congo (CGI art. 47 ter &amp; 44)</p>
            <p>• Résident/Congolais → <strong>BNC 10%</strong> retenu à la source sur montant HT</p>
            <p>• Étranger non domicilié → <strong>BNC 20%</strong> retenu à la source sur montant HT</p>
            <p>• Reversement à la DGI avant le <strong>15 du mois suivant</strong> le paiement</p>
            <p>• Amende <strong>100%</strong> si retenue non effectuée (LF 2025)</p>
          </div>
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Aucun consultant ou prestataire actif</div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    {['Nom', 'Type', 'Poste', 'Résidence', 'Taux BNC', 'Montant HT/mois', 'BNC mensuel'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((emp, i) => {
                    const bncTaux = emp.isResident !== false ? 0.10 : 0.20;
                    const bncMontant = Math.round(emp.baseSalary * bncTaux);
                    return (
                      <tr key={emp.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{emp.firstName} {emp.lastName}</td>
                        <td className="px-4 py-3"><ContractBadge type={emp.contractType} /></td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{emp.position}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.isResident !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'}`}>
                            {emp.isResident !== false ? '🇨🇬 Résident' : '🌍 Étranger'}
                            {emp.nationality ? ` (${emp.nationality})` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">{bncTaux * 100}%</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmt(emp.baseSalary)}</td>
                        <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{fmt(bncMontant)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                    <td colSpan={5} className="px-4 py-3 font-bold text-white text-xs uppercase">TOTAL ({currentList.length})</td>
                    <td className="px-4 py-3 font-bold text-white">{fmt(currentList.reduce((s, e) => s + e.baseSalary, 0))}</td>
                    <td className="px-4 py-3 font-bold text-red-400">{fmt(currentList.reduce((s, e) => s + Math.round(e.baseSalary * (e.isResident !== false ? 0.10 : 0.20)), 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ LISTES ACTIFS / EXPIRANT / TERMINES ═══════════════════════════ */}
      {tab !== 'essais' && tab !== 'bnc' && (
        <>
          {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>}
          {!loading && currentList.length === 0 && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">Aucun contrat trouvé</div>
          )}
          <div className="space-y-3">
            {currentList.map(emp => {
              const endDays = emp.contractEndDate ? differenceInDays(new Date(emp.contractEndDate), now) : null;
              const canRenew = emp.status === 'ACTIVE' && TEMP_CONTRACTS.includes(emp.contractType);
              const hasActiveTrial = emp.trialStatus === 'IN_PROGRESS' || emp.trialStatus === 'EXPIRED';
              const total = emp.contractEndDate ? differenceInDays(new Date(emp.contractEndDate), new Date(emp.hireDate)) : null;
              const elapsed = total && endDays !== null ? total - Math.max(0, endDays) : null;
              const pct = total && elapsed ? Math.min(100, Math.round((elapsed / total) * 100)) : null;

              return (
                <div key={emp.id} className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${endDays !== null && endDays <= 7 ? 'border-red-300 dark:border-red-700' : endDays !== null && endDays <= 30 ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700/60'}`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                        <ContractBadge type={emp.contractType} />
                        {endDays !== null && endDays <= 60 && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${endDays <= 7 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : endDays <= 30 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                            J-{endDays}
                          </span>
                        )}
                        {hasActiveTrial && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.trialStatus === 'EXPIRED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'}`}>
                            {emp.trialStatus === 'EXPIRED' ? '⚠️ Essai expiré' : '⏱️ En essai'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{emp.position} · {emp.department?.name} · Mat. {emp.employeeNumber}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
                        <span>Embauché {fmtDate(emp.hireDate)}</span>
                        <span>Ancienneté : {seniority(emp.hireDate)}</span>
                        {emp.contractEndDate && <span className={endDays !== null && endDays <= 30 ? 'text-amber-500 font-semibold' : ''}>Fin : {fmtDate(emp.contractEndDate)}</span>}
                        {emp.status === 'ACTIVE' && <span>{fmt(emp.baseSalary)}/mois</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canRenew && (
                        <button onClick={() => setRenewModal(emp)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors">
                          <RotateCcw className="w-3 h-3" />
                          {emp.contractType === 'CDD' ? 'Renouveler / CDI' : 'Renouveler'}
                        </button>
                      )}
                      <a href={`/employes/${emp.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Barre progression CDD/STAGE */}
                  {pct !== null && emp.status === 'ACTIVE' && (
                    <div className="px-4 pb-3">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Début</span>
                        <span className={pct >= 80 ? 'text-amber-500 font-semibold' : ''}>{pct}% écoulé</span>
                        <span>Fin</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Info légale */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">📋 Code du Travail Congo — Rappels clés</p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <p>• <strong>CDI</strong> : Essai max 3 mois cadres / 1 mois autres. Préavis 8j à 3 mois.</p>
          <p>• <strong>CDD</strong> : Max 2 ans renouvellement inclus. Requalification CDI au-delà.</p>
          <p>• <strong>Stage</strong> : Max 6 mois. Convention tripartite obligatoire. CNSS AT 2,25%.</p>
          <p>• <strong>Consultant/Prestataire</strong> : BNC 10%/20% reversé DGI avant le 15. Amende 100% si absent.</p>
          <p>• <strong>Intérim</strong> : Salarié de l'agence. Pas de bulletin côté entreprise.</p>
          <p>• <strong>Essai</strong> : Paie normale. Rupture libre sans indemnité ni préavis.</p>
        </div>
      </div>

      {/* Modals */}
      {renewModal && (
        <RenewModal emp={renewModal} onClose={() => setRenewModal(null)}
          onDone={() => { setRenewModal(null); onSuccess('✅ Contrat mis à jour'); }} />
      )}
      {trialModal && (
        <TrialModal emp={trialModal.emp} mode={trialModal.mode}
          onClose={() => setTrialModal(null)}
          onDone={() => { setTrialModal(null); onSuccess(trialModal.mode === 'CONFIRM' ? '✅ Essai confirmé' : '✅ Rupture d\'essai enregistrée'); }} />
      )}
    </div>
  );
}