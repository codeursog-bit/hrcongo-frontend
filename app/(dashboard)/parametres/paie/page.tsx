'use client';

// ============================================================================
// 📁 app/(dashboard)/parametres/paie/page.tsx
// ============================================================================
// 🔥 KONZA SUITE — Paramètres de Paie Complets
//
// Onglets :
//   1. CNSS & Cotisations       (taux salarié / patronal + plafonds)
//   2. Heures supplémentaires   (4 taux décret 78-360 + toggle enabled)
//   3. Travail de nuit          (plage + prime nuit + toggle)
//   4. Barème ITS/IRPP          (tranches + simulateur)
//   5. Calendrier & Temps       (jours/mois, h/jour, date clôture/paiement)
//
// Raccourcis rapides vers :
//   • Plannings/Shifts         /presences/shifts
//   • Primes                   /parametres/primes
//   • Congés                   /conges
//   • Taxes entreprise         /parametres/taxes
//   • Déclaration CNSS         /cnss-declaration
//   • Contrats                 /contrats
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, AlertTriangle, Calculator, Percent, Clock,
  Calendar, Shield, Info, Loader2, CheckCircle2, Moon, Sun,
  ToggleLeft, ToggleRight, Zap, ChevronRight, FileText,
  Users, Gift, Banknote, ClipboardList, Landmark, X,
  Play, User, Plus, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'cnss' | 'overtime' | 'nightshift' | 'its' | 'calendar';

interface PayrollSettings {
  // CNSS
  cnssSalarialRate:        number;
  cnssEmployerRate:        number;
  cnssPensionCeiling:      number;
  cnssSocialCeiling:       number;
  cnssRounding:            string;
  // Heures sup
  overtimeEnabled:         boolean;
  overtimeRate10:          number;
  overtimeRate25:          number;
  overtimeRate50:          number;
  overtimeRate100:         number;
  // Nuit
  nightShiftEnabled:       boolean;
  nightShiftStartHour:     number;
  nightShiftEndHour:       number;
  nightShiftPremiumRate:   number;
  // ITS
  fiscalMode:              'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
  forfaitItsRate:          number;
  taxBrackets:             any;
  // Calendrier
  workDaysPerMonth:        number;
  workHoursPerDay:         number;
  officialStartHour:       number;
  lateToleranceMinutes:    number;
  workDays:                number[];
}

const DEFAULTS: PayrollSettings = {
  cnssSalarialRate:        4,
  cnssEmployerRate:        20.28,
  cnssPensionCeiling:      1200000,
  cnssSocialCeiling:       600000,
  cnssRounding:            'UP',
  overtimeEnabled:         true,
  overtimeRate10:          10,
  overtimeRate25:          25,
  overtimeRate50:          50,
  overtimeRate100:         100,
  nightShiftEnabled:       false,
  nightShiftStartHour:     22,
  nightShiftEndHour:       5,
  nightShiftPremiumRate:   0,
  fiscalMode:              'AUTO',
  forfaitItsRate:          0.08,
  taxBrackets:             null,
  workDaysPerMonth:        26,
  workHoursPerDay:         8,
  officialStartHour:       8,
  lateToleranceMinutes:    0,
  workDays:                [1, 2, 3, 4, 5],
};

const DAYS = [
  { v: 1, l: 'Lun' }, { v: 2, l: 'Mar' }, { v: 3, l: 'Mer' },
  { v: 4, l: 'Jeu' }, { v: 5, l: 'Ven' }, { v: 6, l: 'Sam' }, { v: 0, l: 'Dim' },
];

// ITS Congo 2026 (barème de référence)
const DEFAULT_ITS_BRACKETS = [
   { min: 0,         max: 615000,   rate: 0,        label: '0 – 615 000 FCFA (1 200 F fixe)'          },
  { min: 615000,   max: 1500_000, rate: 0.10,      label: '615 001 – 1 500 000 FCFA (10%)'           },
  { min: 1500_000, max: 3500_000, rate: 0.15,      label: '1 500 001 – 3 500 000 FCFA (15%)'         },
  { min: 3500_000, max: 5000_000, rate: 0.20,      label: '3 500 001 – 5 000 000 FCFA (20%)'         },
  { min: 5000_000, max: null,  rate: 0.30,      label: '> 5 000 000 FCFA (30%)'                   },
];

// ─── Composant Toast inline ───────────────────────────────────────────────────
function SavedBanner({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-emerald-500 text-white rounded-2xl shadow-2xl shadow-emerald-500/30">
      <CheckCircle2 size={18} />
      <span className="font-bold text-sm">Paramètres enregistrés !</span>
      <button onClick={onDismiss}><X size={14} /></button>
    </div>
  );
}

// ─── Composant : Raccourcis vers autres pages ─────────────────────────────────
function QuickLinks({ router }: { router: any }) {
  const links = [
    { icon: <Calendar size={16} />,    label: 'Plannings & Shifts',    href: '/presences/shifts',      color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
    { icon: <Gift size={16} />,        label: 'Primes',                href: '/parametres/primes',     color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
    { icon: <Users size={16} />,       label: 'Congés',                href: '/conges',                color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { icon: <Percent size={16} />,     label: 'Taxes entreprise',      href: '/parametres/taxes',      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { icon: <ClipboardList size={16} />,label: 'Déclaration CNSS',     href: '/cnss-declaration',      color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
    { icon: <FileText size={16} />,    label: 'Contrats',              href: '/contrats',              color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    { icon: <Banknote size={16} />,    label: 'Bulletins de paie',     href: '/paie',                  color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    { icon: <Landmark size={16} />,    label: 'Conventions collectives',href: '/parametres/entreprise', color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Accès rapide
      </p>
      <div className="grid grid-cols-2 gap-2">
        {links.map((l) => (
          <button
            key={l.href}
            onClick={() => router.push(l.href)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:-translate-y-0.5 ${l.color}`}
          >
            {l.icon}
            <span className="truncate">{l.label}</span>
            <ChevronRight size={12} className="ml-auto flex-shrink-0 opacity-60" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PayrollSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]   = useState<TabId>('cnss');
  const [settings, setSettings]     = useState<PayrollSettings>(DEFAULTS);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved]           = useState(false);

  // ── Simulateur de bulletin ──────────────────────────────────────────────────
  const [simBaseSalary, setSimBaseSalary]   = useState('');
  const [simWorkedDays, setSimWorkedDays]   = useState(26);
  const [simOt10, setSimOt10]               = useState(0);
  const [simOt25, setSimOt25]               = useState(0);
  const [simOt50, setSimOt50]               = useState(0);
  const [simBonuses, setSimBonuses]         = useState<{id:string;label:string;amount:number;taxable:boolean}[]>([]);
  const [simApplyCnss, setSimApplyCnss]     = useState(true);
  const [simApplyIts, setSimApplyIts]       = useState(true);
  const [simResult, setSimResult]           = useState<any>(null);
  const [simLoading, setSimLoading]         = useState(false);
  const [simError, setSimError]             = useState('');
  const [simExpanded, setSimExpanded]       = useState(false);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data: any = await api.get('/payroll-settings');
        if (data) {
          setSettings({
            cnssSalarialRate:        data.cnssSalarialRate        ?? 4,
            cnssEmployerRate:        data.cnssEmployerRate        ?? 20.28,
            cnssPensionCeiling:      data.cnssPensionCeiling      ?? 1200000,
            cnssSocialCeiling:       data.cnssSocialCeiling       ?? 600000,
            cnssRounding:            data.cnssRounding            ?? 'UP',
            overtimeEnabled:         data.overtimeEnabled         ?? true,
            overtimeRate10:          data.overtimeRate10          ?? 10,
            overtimeRate25:          data.overtimeRate25          ?? 25,
            overtimeRate50:          data.overtimeRate50          ?? 50,
            overtimeRate100:         data.overtimeRate100         ?? 100,
            nightShiftEnabled:       data.nightShiftEnabled       ?? false,
            nightShiftStartHour:     data.nightShiftStartHour     ?? 22,
            nightShiftEndHour:       data.nightShiftEndHour       ?? 5,
            nightShiftPremiumRate:   data.nightShiftPremiumRate   ?? 0,
            fiscalMode:              data.fiscalMode              ?? 'AUTO',
            forfaitItsRate:          data.forfaitItsRate          ?? 0.08,
            taxBrackets:             data.taxBrackets             ?? null,
            workDaysPerMonth:        data.workDaysPerMonth        ?? 26,
            workHoursPerDay:         data.workHoursPerDay         ?? 8,
            officialStartHour:       data.officialStartHour       ?? 8,
            lateToleranceMinutes:    data.lateToleranceMinutes    ?? 0,
            workDays:                data.workDays                ?? [1, 2, 3, 4, 5],
          });
        }
      } catch (e) {
        console.error('Erreur chargement paramètres paie', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const set = useCallback((key: keyof PayrollSettings, val: any) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  }, []);

  const toggleWorkDay = (day: number) => {
    setSettings(prev => {
      const workDays = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort();
      return { ...prev, workDays };
    });
  };

  // ── Sauvegarde ──────────────────────────────────────────────────────────────
const handleSave = async () => {
    setIsSaving(true);
    try {
      // ✅ Supprimer les champs qui appartiennent au modèle Company (pas PayrollSettings)
      // pour éviter l'erreur "property X should not exist" côté backend NestJS
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        payrollPaymentDay,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        payrollCloseDay,
        ...payrollPayload
      } = settings as any;
 
      await api.patch('/payroll-settings', payrollPayload);
      setShowConfirm(false);
      setSaved(true);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };
 

  // ── Simulation bulletin complet ─────────────────────────────────────────────
  const uid = () => Math.random().toString(36).slice(2, 8);

  const handleSimulate = async () => {
    const base = Number(simBaseSalary);
    if (!base || base < 70400) {
      setSimError('Salaire de base requis (min. 70 400 FCFA).');
      return;
    }
    setSimLoading(true); setSimError(''); setSimResult(null);
    try {
      const now = new Date();
      const payload: Record<string, any> = {
        firstName: 'Simulation', lastName: '',
        baseSalary: base,
        workedDays: simWorkedDays,
        workDays: settings.workDaysPerMonth,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        overtimeHours10: simOt10,
        overtimeHours25: simOt25,
        overtimeHours50: simOt50,
        overtimeHours100: 0,
        isSubjectToCnss: simApplyCnss,
        isSubjectToIrpp: simApplyIts,
        fiscalMode: settings.fiscalMode,
        forfaitItsRate: settings.fiscalMode === 'FORFAIT' ? settings.forfaitItsRate : undefined,
      };
      const validBonuses = simBonuses.filter(b => b.label.trim() && b.amount > 0);
      if (validBonuses.length > 0) {
        payload.manualBonuses = validBonuses.map(b => ({
          bonusType: b.label, amount: b.amount, isTaxable: b.taxable, isCnss: b.taxable,
        }));
      }
      const data: any = await api.post('/payrolls/simulate-free', payload);
      setSimResult(data);
      setSimExpanded(true);
    } catch (e: any) {
      // Fallback calcul local si l'endpoint n'est pas dispo
      const base2 = Number(simBaseSalary);
      const absenceDeduct = Math.round(base2 - (base2 / settings.workDaysPerMonth) * simWorkedDays);
      const adjustedBase = base2 - absenceDeduct;
      const bonusTotal = simBonuses.reduce((s, b) => s + b.amount, 0);
      const gross = adjustedBase + bonusTotal;
      const cnssCeiling = 1200000;
      const cnssBase = Math.min(gross, cnssCeiling);
      const cnssSal = simApplyCnss ? Math.round(cnssBase * 0.04) : 0;
      const taxableBase = gross - cnssSal;
      const abat = Math.round(taxableBase * 0.20);
      const imposable = taxableBase - abat;
      let its = 0;
      if (simApplyIts) {
        const brackets = DEFAULT_ITS_BRACKETS;
        for (const b of brackets) {
          const lo = b.min; const hi = b.max ?? 1e12;
          const chunk = Math.max(0, Math.min(imposable, hi) - lo);
          its += chunk * b.rate;
        }
        its = Math.round(its);
      }
      const net = gross - cnssSal - its;
      setSimResult({ grossSalary: gross, cnssSalarial: cnssSal, its, netSalary: net, _local: true });
      setSimExpanded(true);
    } finally {
      setSimLoading(false);
    }
  };

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const TABS: { id: TabId; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'cnss',       label: 'CNSS',           icon: Shield },
    { id: 'overtime',   label: 'Heures sup',     icon: Zap,       badge: settings.overtimeEnabled ? undefined : 'OFF' },
    { id: 'nightshift', label: 'Nuit',            icon: Moon,      badge: settings.nightShiftEnabled ? 'ON' : undefined },
    { id: 'its',        label: 'ITS / IRPP',      icon: Calculator },
    { id: 'calendar',   label: 'Calendrier',      icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-sky-500" size={40} />
      </div>
    );
  }

  const lateThreshold = `${String(settings.officialStartHour).padStart(2, '0')}h${String(settings.lateToleranceMinutes).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4">

      {saved && <SavedBanner onDismiss={() => setSaved(false)} />}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 mt-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Paramètres de Paie</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            CNSS · Heures sup · Nuit · ITS · Calendrier
          </p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
        >
          <Save size={16} /> Enregistrer
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                tab.badge === 'OFF'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Contenu principal ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* ════ ONGLET CNSS ════ */}
          {activeTab === 'cnss' && (
            <div className="space-y-5">
              {/* Part salariale */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Shield size={18} className="text-blue-500" /> CNSS Salariale
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Taux salarié (%)</label>
                    <input type="number" min={0} max={20} step={0.01}
                      value={settings.cnssSalarialRate}
                      onChange={e => set('cnssSalarialRate', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Retenu sur le salaire brut</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Taux patronal (%)</label>
                    <input type="number" min={0} max={40} step={0.01}
                      value={settings.cnssEmployerRate}
                      onChange={e => set('cnssEmployerRate', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Charge totale employeur (3 branches)</p>
                  </div>
                </div>
              </div>

              {/* Plafonds */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Shield size={18} className="text-purple-500" /> Plafonds de cotisation
                </h3>
                <p className="text-xs text-gray-500 mb-5">
                  Conformes au Décret n°99-284 du Congo
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'cnssPensionCeiling', label: 'Plafond Retraite & Pension', sub: '8% patronal — branche retraite' },
                    { key: 'cnssSocialCeiling',  label: 'Plafond Famille & Accidents', sub: '12.28% patronal — branches famille + AT' },
                  ].map(({ key, label, sub }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{label}</label>
                      <div className="relative">
                        <input type="number"
                          value={(settings as any)[key]}
                          onChange={e => set(key as any, +e.target.value)}
                          className="w-full p-3 pr-14 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                        />
                        <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">XAF</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Détail 3 branches */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Retraite',         rate: '8%',     ceiling: 'Plafond 1', color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400' },
                    { label: 'Prestations fam.', rate: '10.03%', ceiling: 'Plafond 2', color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' },
                    { label: 'Accidents',        rate: '2.25%',  ceiling: 'Plafond 2', color: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400' },
                  ].map((b) => (
                    <div key={b.label} className={`p-3 border rounded-xl ${b.color}`}>
                      <p className="text-xs font-bold mb-0.5">{b.label}</p>
                      <p className="text-lg font-black">{b.rate}</p>
                      <p className="text-[10px] opacity-70">{b.ceiling}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrondi */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Règle d'arrondi CNSS
                </label>
                <div className="flex gap-2">
                  {['UP', 'DOWN', 'NEAREST'].map(v => (
                    <button key={v} onClick={() => set('cnssRounding', v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        settings.cnssRounding === v
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}>
                      {v === 'UP' ? '↑ Supérieur' : v === 'DOWN' ? '↓ Inférieur' : '≈ Nearest'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ ONGLET HEURES SUP ════ */}
          {activeTab === 'overtime' && (
            <div className="space-y-5">
              {/* Toggle principal */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <Zap size={18} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Heures supplémentaires</p>
                      <p className="text-xs text-gray-500">Décret 78-360 — Congo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => set('overtimeEnabled', !settings.overtimeEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      settings.overtimeEnabled
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {settings.overtimeEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {settings.overtimeEnabled ? 'Activées' : 'Désactivées'}
                  </button>
                </div>

                <div className={`p-6 space-y-5 transition-opacity ${!settings.overtimeEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  {!settings.overtimeEnabled && (
                    <div className="!opacity-100 pointer-events-auto p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Les heures supplémentaires sont désactivées. Aucun calcul HS ne sera effectué.
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Taux de majoration</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'overtimeRate10'  as const, label: '5 premières HS/semaine',     color: 'emerald', desc: '(+10% légal Congo)' },
                        { key: 'overtimeRate25'  as const, label: 'HS suivantes — jour',        color: 'sky',     desc: '(+25% légal Congo)' },
                        { key: 'overtimeRate50'  as const, label: 'Nuit / Repos / Férié',      color: 'amber',   desc: '(+50% légal Congo)' },
                        { key: 'overtimeRate100' as const, label: 'Nuit Dimanche / Férié',     color: 'red',     desc: '(+100% légal Congo)' },
                      ].map((item) => (
                        <div key={item.key} className={`p-4 bg-${item.color}-50 dark:bg-${item.color}-900/10 border border-${item.color}-200 dark:border-${item.color}-800 rounded-xl`}>
                          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 leading-tight">
                            {item.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm font-bold">+</span>
                            <input type="number" min={0} max={200} step={5}
                              value={settings[item.key] as number}
                              onChange={e => set(item.key, +e.target.value)}
                              className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-transparent focus:border-sky-400 rounded-lg text-sm font-black text-center text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-400 text-sm">%</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 text-center">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl flex items-start gap-2">
                    <Info size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-sky-700 dark:text-sky-400">
                      Les taux sont ceux du <strong>Décret n°78-360</strong>. Modifiez-les uniquement si votre convention collective prévoit des taux différents.
                      La validation patron des heures sup passe par la page <strong>Présences → Corrections</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ ONGLET TRAVAIL DE NUIT ════ */}
          {activeTab === 'nightshift' && (
            <div className="space-y-5">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                      <Moon size={18} className="text-sky-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">Prime de travail de nuit</p>
                      <p className="text-xs text-gray-500">Pour shifts de nuit contractuels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => set('nightShiftEnabled', !settings.nightShiftEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      settings.nightShiftEnabled
                        ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {settings.nightShiftEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {settings.nightShiftEnabled ? 'Activée' : 'Désactivée'}
                  </button>
                </div>

                <div className={`p-6 space-y-5 transition-opacity ${!settings.nightShiftEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="!opacity-100 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800 rounded-xl flex items-start gap-2">
                    <Info size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-sky-700 dark:text-sky-400">
                      La prime de nuit s'applique aux heures travaillées pendant la plage définie ci-dessous.
                      Elle est <strong>distincte des heures sup</strong> — un infirmier en shift de nuit contractuel bénéficie de la prime, pas des heures sup.
                    </p>
                  </div>

                  {/* Plage horaire */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Plage horaire nocturne</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                          <Moon size={12} className="text-sky-400" /> Début de nuit
                        </label>
                        <select value={settings.nightShiftStartHour}
                          onChange={e => set('nightShiftStartHour', +e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white focus:border-sky-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                          <Sun size={12} className="text-amber-400" /> Fin de nuit
                        </label>
                        <select value={settings.nightShiftEndHour}
                          onChange={e => set('nightShiftEndHour', +e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white focus:border-sky-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-mono text-gray-500 text-center">
                      🌙 {String(settings.nightShiftStartHour).padStart(2, '0')}h00 → {String(settings.nightShiftEndHour).padStart(2, '0')}h00
                      {settings.nightShiftStartHour > settings.nightShiftEndHour
                        ? ' (traverse minuit)'
                        : ' (même jour)'}
                    </div>
                  </div>

                  {/* Taux prime */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Taux de la prime (%)</p>
                    <div className="flex items-center gap-4">
                      <input type="range" min={0} max={100} step={5}
                        value={settings.nightShiftPremiumRate}
                        onChange={e => set('nightShiftPremiumRate', +e.target.value)}
                        className="flex-1 accent-sky-500"
                      />
                      <div className="w-20 text-center px-3 py-2 bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-200 dark:border-sky-800 rounded-xl">
                        <span className="font-black text-sky-600 dark:text-sky-400 text-lg">+{settings.nightShiftPremiumRate}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[10, 15, 20, 25, 30].map(v => (
                        <button key={v} onClick={() => set('nightShiftPremiumRate', v)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            settings.nightShiftPremiumRate === v
                              ? 'bg-sky-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}>
                          +{v}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lien vers shifts */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <Calendar size={16} className="text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Plannings & Shifts</p>
                    <p className="text-xs text-gray-500">Assigner les shifts de nuit par employé</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/presences/shifts')}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold hover:-translate-y-0.5 transition-all"
                >
                  Gérer <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ════ ONGLET ITS / IRPP ════ */}
          {activeTab === 'its' && (
            <div className="space-y-5">
              {/* Mode fiscal */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calculator size={18} className="text-orange-500" /> Mode fiscal
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'AUTO',         label: 'Auto (recommandé)',    desc: 'Détection automatique ITS 2026' },
                    { v: 'ITS_2026',     label: 'ITS 2026',             desc: 'Nouveau barème Congo 2026' },
                    { v: 'IRPP_LEGACY',  label: 'IRPP Ancien',          desc: 'Barème IRPP historique' },
                    { v: 'FORFAIT',      label: 'Taux forfaitaire',     desc: 'Taux unique configurable' },
                  ].map(({ v, label, desc }) => (
                    <button key={v} onClick={() => set('fiscalMode', v as any)}
                      className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        settings.fiscalMode === v
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}>
                      <p className={`font-bold text-sm ${settings.fiscalMode === v ? 'text-sky-700 dark:text-sky-300' : 'text-gray-800 dark:text-white'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>

                {settings.fiscalMode === 'FORFAIT' && (
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Taux forfaitaire (%)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} step={0.5}
                        value={Math.round(settings.forfaitItsRate * 100 * 10) / 10}
                        onChange={e => set('forfaitItsRate', +e.target.value / 100)}
                        className="w-32 px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 font-mono font-bold text-gray-900 dark:text-white focus:border-sky-500"
                      />
                      <span className="text-gray-500 font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barème ITS */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Percent size={16} className="text-orange-500" /> Barème ITS 2026 — Congo
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tranches annuelles de l'Impôt sur le Traitement et les Salaires</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tranche (XAF/an)</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {DEFAULT_ITS_BRACKETS.map((b, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">
                            {b.min.toLocaleString('fr-FR')} → {b.max ? b.max.toLocaleString('fr-FR') : '∞'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                              b.rate === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                              : b.rate <= 0.1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : b.rate <= 0.25 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {b.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ ONGLET CALENDRIER ════ */}
          {activeTab === 'calendar' && (
            <div className="space-y-5">
              {/* Temps de travail */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Clock size={18} className="text-sky-500" /> Temps de travail
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Jours ouvrables / mois</label>
                    <input type="number" min={1} max={31}
                      value={settings.workDaysPerMonth}
                      onChange={e => set('workDaysPerMonth', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Heures / jour</label>
                    <input type="number" min={1} max={24} step={0.5}
                      value={settings.workHoursPerDay}
                      onChange={e => set('workHoursPerDay', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>

              {/* Pointage */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <Clock size={18} className="text-emerald-500" /> Paramètres de pointage
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Heure de début officielle</label>
                    <select value={settings.officialStartHour}
                      onChange={e => set('officialStartHour', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tolérance retard (min)</label>
                    <input type="number" min={0} max={120}
                      value={settings.lateToleranceMinutes}
                      onChange={e => set('lateToleranceMinutes', +e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                {/* Preview seuil */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-center">
                  ✅ <strong>PRÉSENT</strong> si arrivée ≤ <strong>{lateThreshold}</strong>
                  &nbsp;·&nbsp;
                  ⏰ <strong>RETARD</strong> si arrivée {'>'} <strong>{lateThreshold}</strong>
                </div>

                {/* Jours travaillés */}
                <div className="mt-5">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Jours travaillés</label>
                  <div className="flex gap-2">
                    {DAYS.map(({ v, l }) => (
                      <button key={v} onClick={() => toggleWorkDay(v)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          settings.workDays.includes(v)
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Actions */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sticky top-6">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Save size={18} /> Enregistrer
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Modifications appliquées immédiatement à toute l'entreprise
            </p>
          </div>

          {/* ── Simulateur bulletin (toujours visible) ─── */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl text-white shadow-xl overflow-hidden">
            <button
              onClick={() => setSimExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-700/60"
            >
              <div className="flex items-center gap-2">
                <Calculator size={16} className="text-sky-400" />
                <span className="font-bold text-sm">Simulateur de bulletin</span>
              </div>
              {simExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            <div className="p-5 space-y-4">
              {/* Salaire de base */}
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">Salaire de base (FCFA)</label>
                <input
                  type="number"
                  placeholder="ex: 350 000"
                  value={simBaseSalary}
                  onChange={e => { setSimBaseSalary(e.target.value); setSimResult(null); }}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white font-mono font-bold placeholder-gray-600 focus:border-sky-500 focus:outline-none text-sm"
                />
              </div>

              {/* Jours travaillés */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">Jours travaillés</label>
                  <input type="number" min={0} max={31}
                    value={simWorkedDays}
                    onChange={e => { setSimWorkedDays(+e.target.value); setSimResult(null); }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white font-bold text-center focus:border-sky-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1.5">Jours / mois</label>
                  <div className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 font-bold text-center text-sm">
                    {settings.workDaysPerMonth}
                  </div>
                </div>
              </div>

              {/* Heures sup rapides */}
              <div>
                <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-2">Heures supp.</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '+10%', val: simOt10, set: setSimOt10 },
                    { label: '+25%', val: simOt25, set: setSimOt25 },
                    { label: '+50%', val: simOt50, set: setSimOt50 },
                  ].map(({ label, val, set: setFn }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 w-8">{label}</span>
                      <input type="number" min={0} max={100}
                        value={val}
                        onChange={e => { setFn(+e.target.value); setSimResult(null); }}
                        className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-xs text-center focus:border-amber-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-600">h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] text-gray-400 uppercase font-bold tracking-wider">Primes</label>
                  <button
                    onClick={() => setSimBonuses(b => [...b, { id: uid(), label: '', amount: 0, taxable: true }])}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-bold"
                  >
                    <Plus size={11} /> Ajouter
                  </button>
                </div>
                {simBonuses.map(b => (
                  <div key={b.id} className="flex items-center gap-2 mb-2">
                    <input
                      placeholder="Prime transport..."
                      value={b.label}
                      onChange={e => setSimBonuses(p => p.map(x => x.id === b.id ? { ...x, label: e.target.value } : x))}
                      className="flex-1 min-w-0 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:border-sky-500 focus:outline-none"
                    />
                    <input type="number"
                      value={b.amount || ''}
                      onChange={e => setSimBonuses(p => p.map(x => x.id === b.id ? { ...x, amount: +e.target.value } : x))}
                      className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-xs text-center focus:border-sky-500 focus:outline-none"
                    />
                    <button onClick={() => setSimBonuses(p => p.filter(x => x.id !== b.id))}
                      className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* CNSS / ITS toggles */}
              <div className="flex gap-2">
                {[
                  { label: 'CNSS', val: simApplyCnss, set: setSimApplyCnss, color: 'bg-purple-600' },
                  { label: 'ITS', val: simApplyIts, set: setSimApplyIts, color: 'bg-orange-600' },
                ].map(({ label, val, set: setFn, color }) => (
                  <button key={label}
                    onClick={() => { setFn(!val); setSimResult(null); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                      val ? `${color} border-transparent text-white` : 'border-gray-700 text-gray-500 bg-transparent'
                    }`}>
                    {label} {val ? '✓' : '✗'}
                  </button>
                ))}
              </div>

              {simError && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{simError}</p>
              )}

              <button
                onClick={handleSimulate}
                disabled={simLoading || !simBaseSalary}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {simLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                {simLoading ? 'Calcul...' : 'Simuler le bulletin'}
              </button>

              {/* Résultats */}
              {simResult && simExpanded && (
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-3">Résultat de simulation</p>
                  {[
                    { label: 'Salaire brut',    value: simResult.grossSalary,    color: 'text-white' },
                    { label: 'CNSS salarié',    value: -simResult.cnssSalarial,  color: 'text-red-400' },
                    { label: 'ITS / IRPP',      value: -simResult.its,           color: 'text-orange-400' },
                    ...(simResult.totalLoanDeduction > 0 ? [{ label: 'Prêts', value: -simResult.totalLoanDeduction, color: 'text-red-400' }] : []),
                    ...(simResult.totalAdvanceDeduction > 0 ? [{ label: 'Avances', value: -simResult.totalAdvanceDeduction, color: 'text-red-400' }] : []),
                  ].map(({ label, value, color }) => value !== undefined && value !== 0 && (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className={`font-mono font-bold ${color}`}>
                        {value < 0 ? '−' : ''}{Math.abs(Math.round(value || 0)).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-gray-700">
                    <span className="font-black text-base">Net à payer</span>
                    <span className="font-black font-mono text-emerald-400 text-lg">
                      {Math.round(simResult.netSalary || 0).toLocaleString('fr-FR')} <span className="text-sm text-gray-500">XAF</span>
                    </span>
                  </div>
                  {simResult.totalEmployerCost > 0 && (
                    <div className="flex justify-between text-xs text-gray-500 pt-1">
                      <span>Coût total employeur</span>
                      <span className="font-mono">{Math.round(simResult.totalEmployerCost).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  {simResult._local && (
                    <p className="text-[10px] text-gray-600 text-center pt-1">* Calcul approximatif local</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Raccourcis */}
          <QuickLinks router={router} />
        </div>
      </div>

      {/* ── Modal confirmation ─────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmer les modifications</h3>
                <p className="text-sm text-gray-500">Ces changements impactent tous les bulletins futurs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Annuler
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
                {isSaving ? <><Loader2 className="animate-spin" size={18} /> Sauvegarde...</> : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}