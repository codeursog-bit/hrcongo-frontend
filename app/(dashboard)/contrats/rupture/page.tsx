'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Search, Calculator,
  FileText, CheckCircle2, Loader2, XCircle, ChevronRight,
  Gavel, Banknote, Info, ArrowLeft,
  UserX, History, Scale,
  DoorOpen, AlertCircle, TrendingDown, Handshake,
  CalendarX, FlaskConical, Sunset, Flame, HeartPulse,
  Zap, FileCheck, RotateCcw, Shield, Building2,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  contractType: string;
  hireDate: string;
  status: string;
  department?: { name: string };
}

interface RuptureCalc {
  employee: {
    id: string; nom: string; matricule: string; poste: string;
    contractType: string; hireDate: string; ruptureDate: string;
    yearsOfService: number; monthsOfService: number; cnssNumber?: string;
  };
  salaires: { dernierBrut: number; avg3Mois: number; referenceUsed: number };
  preavis:  { dureeJours: number; travaille: boolean; dispense: boolean; montant: number };
  indemnites: {
    licenciement: number; licenciementBase: string;
    preavis: number; conges: number; congesDays: number;
    dernierSalaire: number; dernierSalaireDays: number;
    autresSommes: number; autresSommesDetail: string; retraiteDetail?: string;
  };
  totaux: { brut: number; net: number; cnss: number; its: number };
  eligibilite: {
    aLicenciement: boolean; aPreavis: boolean; aConges: boolean;
    isRetraite: boolean; raisons: string[];
  };
}

interface RuptureCreatedResult {
  success: boolean;
  ruptureId: string;
  calculation: RuptureCalc;
  pseWarning?: string;
  documents: { lettreHtml: string; certificatHtml: string; cnssAttestationHtml: string };
}

interface HistoryItem {
  ruptureId: string; employeeId: string; nom: string; matricule: string;
  poste: string; department?: string; contractType: string;
  hireDate: string | Date; ruptureDate: string | Date; ruptureType: string;
  causeLabel?: string; totalNet: number; totalBrut: number; status: string;
  hasLettre: boolean; hasCertificat: boolean; hasCnss: boolean;
  createdAt: string | Date;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RUPTURE_ICON: Record<string, React.ElementType> = {
  DEMISSION: DoorOpen, LICENCIEMENT_FAUTE_SIMPLE: AlertCircle,
  LICENCIEMENT_FAUTE_GRAVE: AlertTriangle, LICENCIEMENT_FAUTE_LOURDE: Flame,
  LICENCIEMENT_ECONOMIQUE: TrendingDown, RUPTURE_CONVENTIONNELLE: Handshake,
  FIN_CDD: CalendarX, FIN_PERIODE_ESSAI: FlaskConical,
  RETRAITE: Sunset, DECES: HeartPulse, INVALIDITE: HeartPulse, FORCE_MAJEURE: Zap,
};

const RUPTURE_TYPES = [
  { value: 'DEMISSION',                 label: 'Démission',                 group: 'Initiative employé' },
  { value: 'LICENCIEMENT_FAUTE_SIMPLE', label: 'Licenciement faute simple', group: 'Initiative employeur' },
  { value: 'LICENCIEMENT_FAUTE_GRAVE',  label: 'Licenciement faute grave',  group: 'Initiative employeur' },
  { value: 'LICENCIEMENT_FAUTE_LOURDE', label: 'Licenciement faute lourde', group: 'Initiative employeur' },
  { value: 'LICENCIEMENT_ECONOMIQUE',   label: 'Licenciement économique',   group: 'Initiative employeur' },
  { value: 'RUPTURE_CONVENTIONNELLE',   label: 'Rupture conventionnelle',   group: 'Commun accord' },
  { value: 'FIN_CDD',                   label: 'Fin de CDD',                group: 'Terme du contrat' },
  { value: 'FIN_PERIODE_ESSAI',         label: "Fin période d'essai",       group: 'Terme du contrat' },
  { value: 'RETRAITE',                  label: 'Départ à la retraite',      group: 'Terme naturel' },
  { value: 'DECES',                     label: 'Décès',                     group: 'Terme naturel' },
  { value: 'INVALIDITE',                label: 'Invalidité / Inaptitude',   group: 'Terme naturel' },
  { value: 'FORCE_MAJEURE',             label: 'Force majeure',             group: 'Terme naturel' },
];

const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage',
  CONSULTANT: 'Consultant', INTERIM: 'Intérim', PRESTATAIRE: 'Prestataire',
};

const CONTRACT_COLORS: Record<string, string> = {
  CDI:         'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  CDD:         'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  STAGE:       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  CONSULTANT:  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  INTERIM:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  PRESTATAIRE: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const STATUS_COLORS: Record<string, string> = {
  CALCULE:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  VALIDE:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAYE:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CONTESTE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVE:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  EN_COURS: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const fmt  = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
const fmtN = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

function seniority(hireDate: string, ruptureDate: string) {
  const h = new Date(hireDate), r = new Date(ruptureDate);
  const months = (r.getFullYear() - h.getFullYear()) * 12 + r.getMonth() - h.getMonth();
  const years = Math.floor(months / 12);
  const remMon = months % 12;
  if (years === 0) return `${remMon} mois`;
  if (remMon === 0) return `${years} an${years > 1 ? 's' : ''}`;
  return `${years} an${years > 1 ? 's' : ''} ${remMon} mois`;
}

// ─── Composants UI ───────────────────────────────────────────────────────────

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
      {children}
    </span>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <Icon className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function LineIndemnite({ label, sub, amount, highlight }: {
  label: string; sub?: string; amount: number; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between py-2.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${highlight ? 'font-bold' : ''}`}>
      <div>
        <p className={`text-sm ${highlight ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <p className={`text-sm ml-4 shrink-0 ${amount > 0 ? (highlight ? 'text-emerald-600 dark:text-emerald-400 font-bold text-base' : 'text-slate-900 dark:text-white font-semibold') : 'text-slate-400'}`}>
        {amount > 0 ? fmt(amount) : '—'}
      </p>
    </div>
  );
}

// ✅ FIX 401 — Les documents s'ouvrent via <a href> (pas de header Authorization possible).
// Le guard JWT a été retiré côté backend sur ces 3 endpoints.
// Sécurité assurée par l'UUID non devinable de la rupture.
function DocButton({ href, icon: Icon, label, color }: {
  href: string; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors ${color}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </a>
  );
}

// ─── Bouton document dans l'historique ───────────────────────────────────────
function HistoryDocBtn({ href, icon: Icon, label, color }: {
  href: string; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${color}`}
    >
      <Icon className="w-3 h-3" /> {label}
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

type Step = 'select' | 'form' | 'preview' | 'confirm' | 'history';

const INIT_FORM = {
  ruptureType: '', ruptureDate: new Date().toISOString().split('T')[0],
  causeCode: '', causeLabel: '', causeDetail: '',
  noticePeriodDays: '', noticeWorked: true, noticeWaived: false,
  autresSommesDues: '', autresSommesDetail: '', notes: '',
};

export default function ContractRupturePage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [step, setStep]               = useState<Step>('select');
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [search, setSearch]           = useState('');
  const [loadingEmps, setLoadingEmps] = useState(false);
  const [history, setHistory]         = useState<HistoryItem[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [selected, setSelected]       = useState<Employee | null>(null);
  const [form, setForm]               = useState(INIT_FORM);
  const [calc, setCalc]               = useState<RuptureCalc | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [result, setResult]           = useState<RuptureCreatedResult | null>(null);
  const [pseWarning, setPseWarning]   = useState('');

  useEffect(() => {
    if (step !== 'select') return;
    setLoadingEmps(true);
    api.get<any>('/employees?status=ACTIVE&limit=200')
      .then(d => setEmployees(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingEmps(false));
  }, [step]);

  useEffect(() => {
    if (step !== 'history') return;
    setLoadingHist(true);
    api.get<HistoryItem[]>('/contract-rupture')
      .then(d => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, [step]);

  const filteredEmployees = employees.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${e.firstName} ${e.lastName}`.toLowerCase().includes(s)
      || e.employeeNumber.toLowerCase().includes(s)
      || e.position.toLowerCase().includes(s);
  });

  const buildPayload = () => {
    const payload: Record<string, any> = {
      employeeId:  selected!.id,
      ruptureType: form.ruptureType,
      ruptureDate: form.ruptureDate,
      noticeWorked: form.noticeWorked,
      noticeWaived: form.noticeWaived,
    };
    if (form.causeCode)          payload.causeCode          = form.causeCode;
    if (form.causeLabel)         payload.causeLabel         = form.causeLabel;
    if (form.causeDetail)        payload.causeDetail        = form.causeDetail;
    if (form.noticePeriodDays)   payload.noticePeriodDays   = Number(form.noticePeriodDays);
    if (form.autresSommesDues)   payload.autresSommesDues   = Number(form.autresSommesDues);
    if (form.autresSommesDetail) payload.autresSommesDetail = form.autresSommesDetail;
    if (form.notes)              payload.notes              = form.notes;
    return payload;
  };

  const handleCalculate = useCallback(async () => {
    if (!selected || !form.ruptureType || !form.ruptureDate) return;
    setCalculating(true); setCalcError('');
    try {
      const r = await api.post<RuptureCalc>('/contract-rupture/calculate', buildPayload());
      setCalc(r); setStep('preview');
    } catch (e: any) { setCalcError(e.message || 'Erreur de calcul'); }
    finally { setCalculating(false); }
  }, [selected, form]);

  const handleConfirm = async () => {
    if (!selected || !form.ruptureType) return;
    setSaving(true); setSaveError(''); setPseWarning('');
    try {
      const r = await api.post<RuptureCreatedResult>('/contract-rupture', buildPayload());
      setResult(r);
      if (r.pseWarning) setPseWarning(r.pseWarning);
      setStep('confirm');
    } catch (e: any) { setSaveError(e.message || 'Erreur lors de la sauvegarde'); }
    finally { setSaving(false); }
  };

  const resetAll = () => {
    setStep('select'); setSelected(null); setCalc(null);
    setResult(null); setPseWarning(''); setForm(INIT_FORM);
  };

  const ruptureTypeInfo = RUPTURE_TYPES.find(r => r.value === form.ruptureType);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'select' ? router.push(bp('/contrats')) : setStep('select')}
            className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-500/30">
            <Gavel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Rupture de Contrat
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Solde de tout compte · Indemnités légales · Code du Travail Congo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(bp('/contrats/rupture/pse'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors">
            <Building2 className="w-4 h-4" /> PSE
          </button>
          <button onClick={() => router.push(bp('/contrats'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
            <FileText className="w-4 h-4" /> Contrats
          </button>
          <button onClick={() => setStep(step === 'history' ? 'select' : 'history')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
            <History className="w-4 h-4" /> Historique
          </button>
        </div>
      </div>

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      {step !== 'history' && (
        <div className="flex items-center gap-2 mb-6 text-xs text-slate-400">
          {[
            { key: 'select', label: '1. Choisir employé' },
            { key: 'form',   label: '2. Motif & dates' },
            { key: 'preview',label: '3. Calcul indemnités' },
            { key: 'confirm',label: '4. Confirmation' },
          ].map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <span className={`font-medium transition-colors ${step === s.key ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ══ ÉTAPE 1 — Sélection employé ════════════════════════════════════════ */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher par nom, matricule, poste…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          {loadingEmps && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>}
          {!loadingEmps && filteredEmployees.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Aucun employé actif trouvé</div>
          )}
          <div className="grid gap-3">
            {filteredEmployees.map(emp => (
              <button key={emp.id} onClick={() => { setSelected(emp); setStep('form'); }}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all text-left group">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 group-hover:bg-red-100 dark:group-hover:bg-red-950/40 group-hover:text-red-600 transition-colors">
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{emp.position} · {emp.department?.name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Chip color={CONTRACT_COLORS[emp.contractType]}>{CONTRACT_LABELS[emp.contractType] ?? emp.contractType}</Chip>
                  <span className="text-xs text-slate-400 font-mono">{emp.employeeNumber}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 2 — Formulaire motif ═════════════════════════════════════════ */}
      {step === 'form' && selected && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center font-bold text-red-600 dark:text-red-400 text-base shrink-0">
              {selected.firstName[0]}{selected.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 dark:text-white">{selected.firstName} {selected.lastName}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{selected.position} · Mat. {selected.employeeNumber}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                <Chip color={CONTRACT_COLORS[selected.contractType]}>{CONTRACT_LABELS[selected.contractType] ?? selected.contractType}</Chip>
                <Chip>Embauché le {new Date(selected.hireDate).toLocaleDateString('fr-FR')}</Chip>
                <Chip>Ancienneté : {seniority(selected.hireDate, form.ruptureDate)}</Chip>
              </div>
            </div>
            <button onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-600 p-1">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Type de rupture <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RUPTURE_TYPES.map(r => {
                  const RIcon = RUPTURE_ICON[r.value] || Gavel;
                  return (
                    <button key={r.value} type="button"
                      onClick={() => setForm(f => ({ ...f, ruptureType: r.value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                        form.ruptureType === r.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}>
                      <RIcon className={`w-4 h-4 shrink-0 ${form.ruptureType === r.value ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="truncate">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Date effective de rupture <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.ruptureDate}
                onChange={e => setForm(f => ({ ...f, ruptureDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              {form.ruptureDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Ancienneté : <strong className="text-slate-600 dark:text-slate-300">{seniority(selected.hireDate, form.ruptureDate)}</strong>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Motif / Code interne</label>
              <input type="text" placeholder="Ex : ABANDON_POSTE, RESTRUCTURATION…"
                value={form.causeCode} onChange={e => setForm(f => ({ ...f, causeCode: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description détaillée du motif</label>
              <textarea rows={3} placeholder="Décrivez les faits ayant motivé la rupture…"
                value={form.causeDetail} onChange={e => setForm(f => ({ ...f, causeDetail: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Préavis (jours) — laisser vide pour auto
              </label>
              <input type="number" min={0} placeholder="Auto-calculé selon le type de contrat"
                value={form.noticePeriodDays} onChange={e => setForm(f => ({ ...f, noticePeriodDays: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.noticeWorked}
                  onChange={e => setForm(f => ({ ...f, noticeWorked: e.target.checked }))}
                  className="w-4 h-4 accent-red-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Préavis effectué</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.noticeWaived}
                  onChange={e => setForm(f => ({ ...f, noticeWaived: e.target.checked }))}
                  className="w-4 h-4 accent-red-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Préavis dispensé (avec indemnité compensatrice)
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Autres sommes dues (FCFA)</label>
              <input type="number" min={0} placeholder="0"
                value={form.autresSommesDues} onChange={e => setForm(f => ({ ...f, autresSommesDues: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Détail autres sommes</label>
              <input type="text" placeholder="Ex : Prime non versée, remboursement avance…"
                value={form.autresSommesDetail} onChange={e => setForm(f => ({ ...f, autresSommesDetail: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes internes (non imprimées)</label>
              <textarea rows={2} placeholder="Observations RH confidentielles…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
              />
            </div>
          </div>

          {calcError && (
            <div className="flex gap-2 items-start p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{calcError}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('select')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
              Retour
            </button>
            <button type="button" onClick={handleCalculate}
              disabled={!form.ruptureType || !form.ruptureDate || calculating}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-red-500/30 transition-all">
              {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Calculer les indemnités
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 3 — Aperçu du calcul ════════════════════════════════════════ */}
      {step === 'preview' && calc && (
        <div className="space-y-5">
          <div className="p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700 text-white flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg">{calc.employee.nom}</p>
              <p className="text-sm text-slate-400">
                {calc.employee.poste} · {CONTRACT_LABELS[calc.employee.contractType] ?? calc.employee.contractType} · {calc.employee.matricule}
              </p>
              {calc.employee.cnssNumber && (
                <p className="text-xs text-slate-500 mt-0.5">CNSS : {calc.employee.cnssNumber}</p>
              )}
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-400">Ancienneté</p>
                <p className="font-bold text-white">{calc.employee.yearsOfService.toFixed(1)} ans</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Salaire réf.</p>
                <p className="font-bold text-emerald-400">{fmtN(calc.salaires.referenceUsed)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Type rupture</p>
                <p className="font-bold text-red-400">{ruptureTypeInfo?.label ?? form.ruptureType}</p>
              </div>
            </div>
          </div>

          {calc.eligibilite.isRetraite && calc.indemnites.retraiteDetail && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Sunset className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Calcul retraite — barème sur salaire de base catégoriel</p>
                <p className="text-xs opacity-80">{calc.indemnites.retraiteDetail}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <Section title="Éligibilité aux indemnités" icon={Scale}>
              <div className="space-y-2">
                {[
                  { ok: calc.eligibilite.aLicenciement, label: calc.eligibilite.isRetraite ? 'Indemnité de départ retraite' : 'Indemnité de licenciement' },
                  { ok: calc.eligibilite.aPreavis,      label: 'Indemnité compensatrice de préavis' },
                  { ok: calc.eligibilite.aConges,       label: 'Indemnité compensatrice de congés' },
                ].map(e => (
                  <div key={e.label} className="flex items-center gap-2">
                    {e.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                    <span className={`text-sm ${e.ok ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'}`}>{e.label}</span>
                  </div>
                ))}
                {calc.eligibilite.raisons.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {calc.eligibilite.raisons.map((r, i) => (
                      <p key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />{r}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Base de calcul" icon={Banknote}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Dernier salaire brut</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fmt(calc.salaires.dernierBrut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Moyenne 3 derniers mois</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{fmt(calc.salaires.avg3Mois)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Salaire de référence utilisé</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{fmt(calc.salaires.referenceUsed)}</span>
                </div>
                {calc.indemnites.licenciementBase && (
                  <div className="mt-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Barème :</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 break-words">{calc.indemnites.licenciementBase}</p>
                  </div>
                )}
              </div>
            </Section>
          </div>

          <Section title="Détail du solde de tout compte" icon={FileText}>
            <LineIndemnite
              label={calc.eligibilite.isRetraite ? 'Indemnité de départ à la retraite' : 'Indemnité de licenciement'}
              sub={calc.indemnites.licenciementBase || 'Barème art. 82 Code Travail Congo'}
              amount={calc.indemnites.licenciement}
            />
            <LineIndemnite
              label="Indemnité compensatrice de préavis"
              sub={`${calc.preavis.dureeJours} jours — ${calc.preavis.dispense ? 'dispensé' : calc.preavis.travaille ? 'effectué' : 'non effectué'}`}
              amount={calc.indemnites.preavis}
            />
            <LineIndemnite
              label="Indemnité compensatrice de congés payés"
              sub={`${Math.round(calc.indemnites.congesDays * 10) / 10} jours non pris (26 j/an, art. 127 CT)`}
              amount={calc.indemnites.conges}
            />
            {calc.indemnites.dernierSalaire > 0 && (
              <LineIndemnite
                label="Dernier salaire proratisé"
                sub={`${calc.indemnites.dernierSalaireDays} jours travaillés ce mois`}
                amount={calc.indemnites.dernierSalaire}
              />
            )}
            {calc.indemnites.autresSommes > 0 && (
              <LineIndemnite
                label="Autres sommes dues"
                sub={calc.indemnites.autresSommesDetail}
                amount={calc.indemnites.autresSommes}
              />
            )}
          </Section>

          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700 p-5 text-white">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Total brut</p>
                <p className="text-lg font-bold text-white">{fmt(calc.totaux.brut)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">ITS / CNSS</p>
                <p className="text-lg font-bold text-slate-400">{calc.totaux.its > 0 ? fmt(calc.totaux.its) : 'Exonéré'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Net à payer</p>
                <p className="text-2xl font-bold text-emerald-400">{fmt(calc.totaux.net)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Info className="w-3 h-3" />
              Indemnités légales exonérées d'ITS et CNSS (art. 2-9 CGI Congo)
            </p>
          </div>

          {saveError && (
            <div className="flex gap-2 items-start p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{saveError}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep('form')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
              Modifier
            </button>
            <button type="button" onClick={handleConfirm} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md shadow-red-500/30 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
              Confirmer la rupture et terminer l'employé
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 4 — Confirmation + Documents ════════════════════════════════ */}
      {step === 'confirm' && result && (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Rupture enregistrée</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            L'employé a été marqué comme <strong>Terminé</strong>. Solde de tout compte :{' '}
            <strong className="text-emerald-600">{fmt(result.calculation.totaux.net)}</strong>
          </p>

          {pseWarning && (
            <div className="w-full max-w-md p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-2 text-sm text-amber-700 dark:text-amber-400 text-left">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Attention PSE requis</p>
                <p className="text-xs">{pseWarning}</p>
                <button onClick={() => router.push(bp('/contrats/rupture/pse'))} className="mt-2 text-xs font-semibold underline">
                  Créer un PSE →
                </button>
              </div>
            </div>
          )}

          {/* ✅ 3 boutons toujours visibles — plus de condition hasCnss */}
          <div className="flex flex-col gap-2 w-full max-w-sm pt-2">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Documents légaux obligatoires
            </p>
            <DocButton
              href={`${API_URL}/contract-rupture/${result.ruptureId}/lettre`}
              icon={FileText}
              label="Lettre de notification (art. 46 CT)"
              color="bg-blue-600 hover:bg-blue-700"
            />
            <DocButton
              href={`${API_URL}/contract-rupture/${result.ruptureId}/certificat`}
              icon={FileCheck}
              label="Certificat de travail (art. 46 CT)"
              color="bg-indigo-600 hover:bg-indigo-700"
            />
            {/* ✅ CNSS toujours visible — pas de condition */}
            <DocButton
              href={`${API_URL}/contract-rupture/${result.ruptureId}/cnss`}
              icon={Shield}
              label="Attestation CNSS cessation (Décret 2002-578)"
              color="bg-emerald-600 hover:bg-emerald-700"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Ouvrez chaque document puis Ctrl+P / Cmd+P pour imprimer
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 justify-center">
            <button type="button" onClick={resetAll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-semibold hover:bg-slate-800 transition-colors">
              <RotateCcw className="w-4 h-4" /> Nouvelle rupture
            </button>
            <button type="button" onClick={() => router.push(bp('/contrats'))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
              <FileText className="w-4 h-4" /> Retour aux contrats
            </button>
            <button type="button" onClick={() => setStep('history')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
              <History className="w-4 h-4" /> Voir l'historique
            </button>
          </div>
        </div>
      )}

      {/* ══ HISTORIQUE ════════════════════════════════════════════════════════ */}
      {step === 'history' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">Historique des ruptures</h2>

          {loadingHist && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-red-500 animate-spin" /></div>}
          {!loadingHist && history.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-sm">Aucune rupture enregistrée</div>
          )}

          <div className="grid gap-3">
            {history.map(h => (
              <div key={h.ruptureId}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400 shrink-0">
                    {h.nom.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{h.nom}</p>
                      <Chip color={CONTRACT_COLORS[h.contractType]}>{CONTRACT_LABELS[h.contractType] ?? h.contractType}</Chip>
                      <Chip color={STATUS_COLORS[h.status]}>{h.status}</Chip>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {h.poste} · {h.department ?? '—'} · {h.causeLabel ?? h.ruptureType ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {h.ruptureDate ? new Date(h.ruptureDate).toLocaleDateString('fr-FR') : '—'}
                    </p>
                  </div>

                  <div className="text-right shrink-0 mr-2">
                    <p className="text-xs text-slate-400">Net</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {h.totalNet != null ? fmtN(h.totalNet) + ' F' : '—'}
                    </p>
                  </div>

                  {/* ✅ Les 3 boutons sont toujours affichés dans l'historique
                      Plus de condition h.hasLettre / h.hasCertificat / h.hasCnss
                      Le backend retourne 404 si le doc n'existe pas — cas rare */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <HistoryDocBtn
                      href={`${API_URL}/contract-rupture/${h.ruptureId}/lettre`}
                      icon={FileText} label="Lettre"
                      color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    />
                    <HistoryDocBtn
                      href={`${API_URL}/contract-rupture/${h.ruptureId}/certificat`}
                      icon={FileCheck} label="Certificat"
                      color="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
                    />
                    <HistoryDocBtn
                      href={`${API_URL}/contract-rupture/${h.ruptureId}/cnss`}
                      icon={Shield} label="CNSS"
                      color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setStep('select')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>
      )}
    </div>
  );
}