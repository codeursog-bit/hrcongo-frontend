'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Loader2, Search, RefreshCw, Calendar,
  ArrowRight, User, Briefcase, History, RotateCcw, TrendingUp,
  Shield, AlertCircle, XCircle, ChevronDown,
} from 'lucide-react';
import { api } from '@/services/api';

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
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const CONTRACT_TYPES = [
  { value: 'CDI',         label: 'CDI',          desc: 'Contrat à Durée Indéterminée',         icon: '♾️', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { value: 'CDD',         label: 'CDD',          desc: 'Contrat à Durée Déterminée',           icon: '📅', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { value: 'STAGE',       label: 'Stage',        desc: 'Convention de stage',                  icon: '🎓', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  { value: 'CONSULTANT',  label: 'Consultant',   desc: 'Contrat de prestation intellectuelle', icon: '💼', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' },
  { value: 'INTERIM',     label: 'Intérim',      desc: 'Mission via agence d\'intérim',        icon: '🔄', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  { value: 'PRESTATAIRE', label: 'Prestataire',  desc: 'Contrat de sous-traitance / service',  icon: '🤝', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function seniority(hireDate: string): string {
  const h = new Date(hireDate);
  const now = new Date();
  const months = (now.getFullYear() - h.getFullYear()) * 12 + now.getMonth() - h.getMonth();
  const years = Math.floor(months / 12);
  const rem   = months % 12;
  if (years === 0) return `${rem} mois`;
  if (rem === 0)   return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} ${rem} mois`;
}

// ─── Composants UI ────────────────────────────────────────────────────────────
function ContractBadge({ type }: { type: string }) {
  const ct = CONTRACT_TYPES.find(c => c.value === type);
  if (!ct) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${ct.color}`}>
      {ct.icon} {ct.label}
    </span>
  );
}

function UrgencyBadge({ days }: { days: number }) {
  if (days <= 7)  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">🔴 J-{days}</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">🟠 J-{days}</span>;
  if (days <= 60) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">🟡 J-{days}</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">J-{days}</span>;
}

// ── Modal renouvellement / conversion ─────────────────────────────────────────
function RenewModal({
  employee, onClose, onSave,
}: {
  employee: ContractEmployee;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [action, setAction]   = useState<'RENEW' | 'CONVERT'>('RENEW');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handleSave = async () => {
    if (action === 'RENEW' && !endDate) { setError('Date de fin obligatoire'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        employeeId:   employee.id,
        action,
        newEndDate:   action === 'RENEW' ? endDate : undefined,
        newContractType: action === 'CONVERT' ? 'CDI' : employee.contractType,
        notes,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl">
        <div className="p-6">
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
            {employee.firstName} {employee.lastName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {employee.position} · <ContractBadge type={employee.contractType} />
            {employee.contractEndDate && ` · Fin : ${formatDate(employee.contractEndDate)}`}
          </p>

          {/* Choix action */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setAction('RENEW')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                action === 'RENEW'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <RotateCcw className={`w-6 h-6 ${action === 'RENEW' ? 'text-blue-600' : 'text-slate-400'}`} />
              <div className="text-center">
                <p className={`font-semibold text-sm ${action === 'RENEW' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  Renouveler
                </p>
                <p className="text-xs text-slate-500">Nouveau {employee.contractType}</p>
              </div>
            </button>

            {(employee.contractType === 'CDD' || employee.contractType === 'STAGE') && (
              <button
                onClick={() => setAction('CONVERT')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  action === 'CONVERT'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <TrendingUp className={`w-6 h-6 ${action === 'CONVERT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="text-center">
                  <p className={`font-semibold text-sm ${action === 'CONVERT' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Convertir en CDI
                  </p>
                  <p className="text-xs text-slate-500">Embauche définitive</p>
                </div>
              </button>
            )}
          </div>

          {/* Champs */}
          {action === 'RENEW' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nouvelle date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          )}

          {action === 'CONVERT' && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                ✅ Le contrat sera converti en <strong>CDI</strong> à compter d'aujourd'hui.
                L'ancienneté sera calculée depuis la date d'embauche originale ({formatDate(employee.hireDate)}).
              </p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
            <textarea
              rows={2}
              placeholder="Motif du renouvellement, conditions particulières…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md ${
                action === 'CONVERT'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
              } disabled:opacity-50`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : action === 'CONVERT' ? <TrendingUp className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              {action === 'CONVERT' ? 'Convertir en CDI' : 'Renouveler'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

type Tab = 'actifs' | 'expirant' | 'termines';

export default function ContratsPage() {
  const [employees, setEmployees] = useState<ContractEmployee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [tab, setTab]             = useState<Tab>('actifs');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [renewModal, setRenewModal] = useState<ContractEmployee | null>(null);
  const [saving, setSaving]       = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get<any>('/employees?limit=500')
      .then(d => setEmployees(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Catégoriser ───────────────────────────────────────────────────────────
  const actifs = employees.filter(e =>
    e.status === 'ACTIVE' &&
    (!e.contractEndDate || daysUntil(e.contractEndDate) > 60)
  );

  const expirant = employees.filter(e =>
    e.status === 'ACTIVE' &&
    e.contractEndDate &&
    daysUntil(e.contractEndDate) <= 60 &&
    daysUntil(e.contractEndDate) >= 0
  ).sort((a, b) =>
    new Date(a.contractEndDate!).getTime() - new Date(b.contractEndDate!).getTime()
  );

  const termines = employees.filter(e => e.status === 'TERMINATED');

  const getCurrentList = () => {
    let list = tab === 'actifs' ? actifs : tab === 'expirant' ? expirant : termines;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(s) ||
        e.employeeNumber.toLowerCase().includes(s) ||
        e.position.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'ALL') {
      list = list.filter(e => e.contractType === typeFilter);
    }
    return list;
  };

  const list = getCurrentList();

  // ── Sauvegarder renouvellement ─────────────────────────────────────────────
  const handleRenewSave = async (data: any) => {
    const endpoint = data.action === 'CONVERT'
      ? `/employees/${data.employeeId}/convert-to-cdi`
      : `/employees/${data.employeeId}/renew-contract`;

    await api.patch(endpoint, {
      contractEndDate: data.newEndDate,
      contractType:    data.newContractType,
      notes:           data.notes,
    });

    setSuccessMsg(data.action === 'CONVERT' ? '✅ Converti en CDI avec succès' : '✅ Contrat renouvelé');
    setTimeout(() => setSuccessMsg(''), 4000);
    load();
  };

  // ── Stats rapides ──────────────────────────────────────────────────────────
  const critiques = expirant.filter(e => daysUntil(e.contractEndDate!) <= 7).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion des Contrats</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {actifs.length} actifs · {expirant.length} expirant bientôt · {termines.length} terminés
            </p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Message succès */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />{successMsg}
        </div>
      )}

      {/* Alerte critique */}
      {critiques > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400 text-sm">
              🔴 {critiques} contrat{critiques > 1 ? 's' : ''} expire{critiques === 1 ? '' : 'nt'} dans moins de 7 jours !
            </p>
            <button onClick={() => setTab('expirant')} className="text-xs text-red-600 dark:text-red-400 underline mt-0.5">
              Voir maintenant →
            </button>
          </div>
        </div>
      )}

      {/* Stats par type */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {CONTRACT_TYPES.map(ct => {
          const count = employees.filter(e => e.contractType === ct.value && e.status === 'ACTIVE').length;
          return (
            <button
              key={ct.value}
              onClick={() => setTypeFilter(typeFilter === ct.value ? 'ALL' : ct.value)}
              className={`p-3 rounded-xl border text-center transition-all ${
                typeFilter === ct.value
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="text-lg mb-1">{ct.icon}</div>
              <div className="font-bold text-slate-900 dark:text-white text-lg leading-none">{count}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{ct.label}</div>
            </button>
          );
        })}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit">
        {[
          { id: 'actifs',    label: 'Actifs',             count: actifs.length,    icon: CheckCircle2 },
          { id: 'expirant',  label: 'Expirant bientôt',   count: expirant.length,  icon: Clock },
          { id: 'termines',  label: 'Terminés',           count: termines.length,  icon: XCircle },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full font-bold ${
              tab === t.id
                ? 'bg-white/20 text-white'
                : t.id === 'expirant' && t.count > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, matricule, poste…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">Aucun contrat trouvé</div>
      ) : (
        <div className="space-y-3">
          {list.map(emp => {
            const days     = emp.contractEndDate ? daysUntil(emp.contractEndDate) : null;
            const isExpiring = days !== null && days <= 60;
            const canRenew = emp.status === 'ACTIVE' && emp.contractType !== 'CDI';

            return (
              <div
                key={emp.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                  isExpiring && days! <= 7
                    ? 'border-red-300 dark:border-red-700'
                    : isExpiring && days! <= 30
                      ? 'border-amber-300 dark:border-amber-700'
                      : 'border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>

                  {/* Info principale */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                      <ContractBadge type={emp.contractType} />
                      {days !== null && days <= 60 && <UrgencyBadge days={days} />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {emp.position} · {emp.department?.name ?? '—'} · Mat. {emp.employeeNumber}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-slate-400">
                        🗓 Embauché : {formatDate(emp.hireDate)} · Ancienneté : {seniority(emp.hireDate)}
                      </span>
                      {emp.contractEndDate && (
                        <span className={`text-xs font-medium ${days! <= 7 ? 'text-red-600 dark:text-red-400' : days! <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                          📆 Fin : {formatDate(emp.contractEndDate)}
                        </span>
                      )}
                      {emp.baseSalary > 0 && (
                        <span className="text-xs text-slate-400">{fmt(emp.baseSalary)}/mois</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {canRenew && (
                      <button
                        onClick={() => setRenewModal(emp)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {emp.contractType === 'CDD' ? 'Renouveler / CDI' : 'Renouveler'}
                      </button>
                    )}
                    <a
                      href={`/employes/${emp.id}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Barre de progression CDD */}
                {emp.contractEndDate && emp.status === 'ACTIVE' && (() => {
                  const total = (new Date(emp.contractEndDate).getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24);
                  const elapsed = (Date.now() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24);
                  const pct = Math.min(100, Math.round((elapsed / total) * 100));
                  return (
                    <div className="px-4 pb-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Début contrat</span>
                        <span className={pct >= 80 ? 'text-amber-500 font-semibold' : ''}>{pct}% écoulé</span>
                        <span>Fin</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Info réglementaire */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">📋 Règles Code du Travail Congo</p>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <p>• <strong>CDD</strong> : max 2 ans renouvellement inclus (art. 32 CT). Au-delà = CDI automatique.</p>
          <p>• <strong>Stage</strong> : max 6 mois, convention obligatoire avec l'école.</p>
          <p>• <strong>Période d'essai CDI</strong> : max 3 mois (cadres), 1 mois (autres).</p>
          <p>• <strong>Consultant/Prestataire</strong> : pas de lien de subordination. Pas d'indemnités CT.</p>
          <p>• <strong>Intérim</strong> : salarié de l'agence. L'entreprise gère uniquement la mission.</p>
          <p>• <strong>PRESTATAIRE</strong> : contrat commercial (non CT). Facturation sans bulletin de paie.</p>
        </div>
      </div>

      {/* Modal */}
      {renewModal && (
        <RenewModal
          employee={renewModal}
          onClose={() => setRenewModal(null)}
          onSave={handleRenewSave}
        />
      )}
    </div>
  );
}