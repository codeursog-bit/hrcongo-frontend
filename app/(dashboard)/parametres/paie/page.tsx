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
  Users, Gift, Banknote, ClipboardList, Landmark, X
} from 'lucide-react';
import { api } from '@/services/api';
 import { useBasePath } from '@/hooks/useBasePath';

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
  { min: 615000,   max: 1500000, rate: 0.10,      label: '615 001 – 1 500 000 FCFA (10%)'           },
  { min: 1500_000, max: 3500000, rate: 0.15,      label: '1 500 001 – 3 500 000 FCFA (15%)'         },
  { min: 3500_000, max: 5000000, rate: 0.20,      label: '3 500 001 – 5 000 000 FCFA (20%)'         },
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
  const { bp } = useBasePath();
  const [activeTab, setActiveTab]   = useState<TabId>('cnss');
  const [settings, setSettings]     = useState<PayrollSettings>(DEFAULTS);
  const [isLoading, setIsLoading]   = useState(true);
  const [isSaving, setIsSaving]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved]           = useState(false);

  // Simulateur ITS
  const [simIncome, setSimIncome]   = useState(450000);
  const [simResult, setSimResult]   = useState<any>(null);

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
 

  // ── Simulateur ITS ──────────────────────────────────────────────────────────
  const calculateITS = () => {
    const brackets = settings.taxBrackets || DEFAULT_ITS_BRACKETS;
    let tax = 0;
    const breakdown: any[] = [];

    for (const b of brackets) {
      const lo   = b.min;
      const hi   = b.max ?? Number.MAX_SAFE_INTEGER;
      const chunk = Math.max(0, Math.min(simIncome, hi) - lo + 1);
      const amt   = chunk * b.rate;
      if (chunk > 0) {
        breakdown.push({ range: `${lo.toLocaleString('fr-FR')} – ${b.max ? b.max.toLocaleString('fr-FR') : '∞'}`, rate: b.label || `${(b.rate * 100).toFixed(0)}%`, amount: Math.round(amt) });
        tax += amt;
      }
    }
    // Abattement 20%
    const net = simIncome - Math.round(tax);
    setSimResult({ breakdown, total: Math.round(tax), net });
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
                  onClick={() => router.push(bp('/presences/shifts'))}
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

          {/* Simulateur ITS (uniquement sur l'onglet ITS) */}
          {activeTab === 'its' && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-700">
                <Calculator size={18} className="text-sky-400" />
                <h3 className="font-bold">Simulateur ITS / IRPP</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold">Revenu imposable annuel</label>
                  <div className="relative mt-1.5">
                    <input type="number"
                      value={simIncome}
                      onChange={e => setSimIncome(+e.target.value)}
                      className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white font-mono font-bold focus:border-sky-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">XAF</span>
                  </div>
                </div>
                <button onClick={calculateITS}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold text-sm transition-colors">
                  Calculer
                </button>
                {simResult && (
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    {simResult.breakdown.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400">
                        <span>{b.range}</span>
                        <span className="font-mono">{b.amount.toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-orange-400 pt-2 border-t border-gray-700">
                      <span>Total ITS</span>
                      <span className="font-mono">{simResult.total.toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-400 text-lg">
                      <span>Net</span>
                      <span className="font-mono">{simResult.net.toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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