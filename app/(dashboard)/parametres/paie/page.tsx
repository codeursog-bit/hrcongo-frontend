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
  Users, Gift, Banknote, ClipboardList, Landmark, X, Palmtree, CalendarClock
} from 'lucide-react';
import { api } from '@/services/api';
 import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabId = 'cnss' | 'overtime' | 'nightshift' | 'its' | 'calendar' | 'conges';

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
    { icon: <Calendar size={16} />,    label: 'Plannings & Shifts',    href: '/presences/shifts',      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { icon: <Gift size={16} />,        label: 'Primes',                href: '/parametres/primes',     color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { icon: <Users size={16} />,       label: 'Congés',                href: '/conges',                color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { icon: <Percent size={16} />,     label: 'Taxes entreprise',      href: '/parametres/taxes',      color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { icon: <ClipboardList size={16} />,label: 'Déclaration CNSS',     href: '/cnss-declaration',      color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { icon: <FileText size={16} />,    label: 'Contrats',              href: '/contrats',              color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { icon: <Banknote size={16} />,    label: 'Bulletins de paie',     href: '/paie',                  color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { icon: <Landmark size={16} />,    label: 'Conventions collectives',href: '/parametres/entreprise', color: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]' },
  ];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
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

  // 🆕 Config congés — stockée sur Company (pas PayrollSettings)
  const [leaveMethod, setLeaveMethod] = useState<'AVERAGE_12M' | 'CURRENT_SALARY'>('AVERAGE_12M');
  // 🆕 Mode de cycle de départ en congé (ROLLING = glissant/retour réel,
  // ANNIVERSARY = toujours calé sur le mois d'embauche)
  const [leaveCycleMode, setLeaveCycleMode] = useState<'ROLLING' | 'ANNIVERSARY'>('ROLLING');

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

    // 🆕 Charger la config congés depuis Company
    api.get<any>('/companies/mine').then(ci => {
      if (ci?.leaveIndemnityMethod) setLeaveMethod(ci.leaveIndemnityMethod);
      if (ci?.leaveCycleMode) setLeaveCycleMode(ci.leaveCycleMode);
    }).catch(() => {});
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
      // ✅ CNSS et ITS : lecture seule — exclus du payload pour ne pas écraser les taux légaux
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        payrollPaymentDay,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        payrollCloseDay,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cnssSalarialRate,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cnssEmployerRate,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cnssPensionCeiling,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cnssSocialCeiling,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fiscalMode,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        forfaitItsRate,
        ...payrollPayload
      } = settings as any;

      // 1. Paramètres de paie (heures sup, nuit, calendrier, arrondi)
      await api.patch('/payroll-settings', payrollPayload);

      // 2. 🆕 Config congés → Company
      await api.patch('/companies', {
        leaveIndemnityMethod: leaveMethod,
        leaveCycleMode,
      });

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
    { id: 'conges',     label: 'Congés',          icon: Palmtree },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
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
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[var(--text)]">Paramètres de Paie</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            CNSS · Heures sup · Nuit · ITS · Calendrier
          </p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
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
                ? 'bg-[var(--text)] text-[var(--bg)] shadow-lg'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            {tab.badge && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                tab.badge === 'OFF'
                  ? 'bg-[var(--surface-2)] text-[var(--text-muted)]'
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                    <Shield size={18} className="text-emerald-500" /> CNSS Salariale
                  </h3>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5 font-bold">
                    Taux légaux — lecture seule
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Taux salarié (%)</label>
                    <div className="relative">
                      <input type="number" readOnly disabled
                        value={settings.cnssSalarialRate}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-[var(--text-muted)]">% — fixe</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Décret Congo — non modifiable</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Taux patronal (%)</label>
                    <div className="relative">
                      <input type="number" readOnly disabled
                        value={settings.cnssEmployerRate}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-3 text-[10px] text-[var(--text-muted)]">% — fixe</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Décret n°99-284 — 3 branches incluses</p>
                  </div>
                </div>
              </div>

              {/* Plafonds */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--text)] mb-2 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-500" /> Plafonds de cotisation
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-5">
                  Conformes au Décret n°99-284 du Congo
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'cnssPensionCeiling', label: 'Plafond Retraite & Pension', sub: '8% patronal — branche retraite' },
                    { key: 'cnssSocialCeiling',  label: 'Plafond Famille & Accidents', sub: '12.28% patronal — branches famille + AT' },
                  ].map(({ key, label, sub }) => (
                    <div key={key}>
                      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">{label}</label>
                      <div className="relative">
                        <input type="number"
                          value={(settings as any)[key]}
                          onChange={e => set(key as any, +e.target.value)}
                          className="w-full p-3 pr-14 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono font-bold text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                        />
                        <span className="absolute right-3 top-3 text-xs text-[var(--text-muted)] font-bold">XAF</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Détail 3 branches */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Retraite',         rate: '8%',     ceiling: 'Plafond 1', color: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' },
                    { label: 'Prestations fam.', rate: '10.03%', ceiling: 'Plafond 2', color: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' },
                    { label: 'Accidents',        rate: '2.25%',  ceiling: 'Plafond 2', color: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' },
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                <label className="block text-sm font-bold text-[var(--text)] mb-3">
                  Règle d'arrondi CNSS
                </label>
                <div className="flex gap-2">
                  {['UP', 'DOWN', 'NEAREST'].map(v => (
                    <button key={v} onClick={() => set('cnssRounding', v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                        settings.cnssRounding === v
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-emerald-300'
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <Zap size={18} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text)]">Heures supplémentaires</p>
                      <p className="text-xs text-[var(--text-muted)]">Décret 78-360 — Congo</p>
                    </div>
                  </div>
                  <button
                    onClick={() => set('overtimeEnabled', !settings.overtimeEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      settings.overtimeEnabled
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'
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
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Taux de majoration</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'overtimeRate10'  as const, label: '5 premières HS/semaine',     color: 'emerald', desc: '(+10% légal Congo)' },
                        { key: 'overtimeRate25'  as const, label: 'HS suivantes — jour',        color: 'emerald',     desc: '(+25% légal Congo)' },
                        { key: 'overtimeRate50'  as const, label: 'Nuit / Repos / Férié',      color: 'amber',   desc: '(+50% légal Congo)' },
                        { key: 'overtimeRate100' as const, label: 'Nuit Dimanche / Férié',     color: 'amber',     desc: '(+100% légal Congo)' },
                      ].map((item) => (
                        <div key={item.key} className={`p-4 bg-${item.color}-50 dark:bg-${item.color}-900/10 border border-${item.color}-200 dark:border-${item.color}-800 rounded-xl`}>
                          <label className="block text-xs font-bold text-[var(--text-muted)] mb-2 leading-tight">
                            {item.label}
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)] text-sm font-bold">+</span>
                            <input type="number" min={0} max={200} step={5}
                              value={settings[item.key] as number}
                              onChange={e => set(item.key, +e.target.value)}
                              className="flex-1 px-2 py-1.5 bg-[var(--surface)] border border-transparent focus:border-emerald-400 rounded-lg text-sm font-black text-center text-[var(--text)]"
                            />
                            <span className="text-[var(--text-muted)] text-sm">%</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 text-center">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-2">
                    <Info size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                      <Moon size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text)]">Prime de travail de nuit</p>
                      <p className="text-xs text-[var(--text-muted)]">Pour shifts de nuit contractuels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => set('nightShiftEnabled', !settings.nightShiftEnabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      settings.nightShiftEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                        : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {settings.nightShiftEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {settings.nightShiftEnabled ? 'Activée' : 'Désactivée'}
                  </button>
                </div>

                <div className={`p-6 space-y-5 transition-opacity ${!settings.nightShiftEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="!opacity-100 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl flex items-start gap-2">
                    <Info size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      La prime de nuit s'applique aux heures travaillées pendant la plage définie ci-dessous.
                      Elle est <strong>distincte des heures sup</strong> — un infirmier en shift de nuit contractuel bénéficie de la prime, pas des heures sup.
                    </p>
                  </div>

                  {/* Plage horaire */}
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Plage horaire nocturne</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                          <Moon size={12} className="text-emerald-400" /> Début de nuit
                        </label>
                        <select value={settings.nightShiftStartHour}
                          onChange={e => set('nightShiftStartHour', +e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm font-bold text-[var(--text)] focus:border-emerald-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                          <Sun size={12} className="text-amber-400" /> Fin de nuit
                        </label>
                        <select value={settings.nightShiftEndHour}
                          onChange={e => set('nightShiftEndHour', +e.target.value)}
                          className="w-full px-3 py-2.5 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] text-sm font-bold text-[var(--text)] focus:border-emerald-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-2 px-3 py-2 bg-[var(--surface-2)] rounded-xl text-xs font-mono text-[var(--text-muted)] text-center">
                      🌙 {String(settings.nightShiftStartHour).padStart(2, '0')}h00 → {String(settings.nightShiftEndHour).padStart(2, '0')}h00
                      {settings.nightShiftStartHour > settings.nightShiftEndHour
                        ? ' (traverse minuit)'
                        : ' (même jour)'}
                    </div>
                  </div>

                  {/* Taux prime */}
                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">Taux de la prime (%)</p>
                    <div className="flex items-center gap-4">
                      <input type="range" min={0} max={100} step={5}
                        value={settings.nightShiftPremiumRate}
                        onChange={e => set('nightShiftPremiumRate', +e.target.value)}
                        className="flex-1 accent-emerald-500"
                      />
                      <div className="w-20 text-center px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">+{settings.nightShiftPremiumRate}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[10, 15, 20, 25, 30].map(v => (
                        <button key={v} onClick={() => set('nightShiftPremiumRate', v)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            settings.nightShiftPremiumRate === v
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                          }`}>
                          +{v}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lien vers shifts */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <Calendar size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--text)]">Plannings & Shifts</p>
                    <p className="text-xs text-[var(--text-muted)]">Assigner les shifts de nuit par employé</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(bp('/presences/shifts'))}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:-translate-y-0.5 transition-all"
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                    <Calculator size={18} className="text-emerald-500" /> Mode fiscal
                  </h3>
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5 font-bold">
                    Barème légal — lecture seule
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pointer-events-none opacity-70">
                  {[
                    { v: 'AUTO',         label: 'Auto (recommandé)',    desc: 'Détection automatique ITS 2026' },
                    { v: 'ITS_2026',     label: 'ITS 2026',             desc: 'Nouveau barème Congo 2026' },
                    { v: 'IRPP_LEGACY',  label: 'IRPP Ancien',          desc: 'Barème IRPP historique' },
                    { v: 'FORFAIT',      label: 'Taux forfaitaire',     desc: 'Taux unique configurable' },
                  ].map(({ v, label, desc }) => (
                    <div key={v}
                      className={`flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left ${
                        settings.fiscalMode === v
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-[var(--border)]'
                      }`}>
                      <p className={`font-bold text-sm ${settings.fiscalMode === v ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--text)]'}`}>
                        {label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-3 italic">Le mode fiscal est défini par votre configuration légale Congo. Contactez le support pour toute modification.</p>
              </div>

              {/* Barème ITS */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                  <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
                    <Percent size={16} className="text-emerald-500" /> Barème ITS 2026 — Congo
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Tranches annuelles de l'Impôt sur le Traitement et les Salaires</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--surface-2)]">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-[var(--text-muted)] uppercase">Tranche (XAF/an)</th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-[var(--text-muted)] uppercase">Taux</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {DEFAULT_ITS_BRACKETS.map((b, i) => (
                        <tr key={i} className="hover:bg-[var(--surface-2)]/50">
                          <td className="px-5 py-3 font-mono text-[var(--text)]">
                            {b.min.toLocaleString('fr-FR')} → {b.max ? b.max.toLocaleString('fr-FR') : '∞'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                              b.rate === 0 ? 'bg-[var(--surface-2)] text-[var(--text-muted)]'
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
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                  <Clock size={18} className="text-emerald-500" /> Temps de travail
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Jours ouvrables / mois</label>
                    <input type="number" min={1} max={31}
                      value={settings.workDaysPerMonth}
                      onChange={e => set('workDaysPerMonth', +e.target.value)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Heures / jour</label>
                    <input type="number" min={1} max={24} step={0.5}
                      value={settings.workHoursPerDay}
                      onChange={e => set('workHoursPerDay', +e.target.value)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Pointage */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--text)] mb-5 flex items-center gap-2">
                  <Clock size={18} className="text-emerald-500" /> Paramètres de pointage
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Heure de début officielle</label>
                    <select value={settings.officialStartHour}
                      onChange={e => set('officialStartHour', +e.target.value)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}h00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Tolérance retard (min)</label>
                    <input type="number" min={0} max={120}
                      value={settings.lateToleranceMinutes}
                      onChange={e => set('lateToleranceMinutes', +e.target.value)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20"
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
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Jours travaillés</label>
                  <div className="flex gap-2">
                    {DAYS.map(({ v, l }) => (
                      <button key={v} onClick={() => toggleWorkDay(v)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          settings.workDays.includes(v)
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ ONGLET CONGÉS ════ */}
          {activeTab === 'conges' && (
            <div className="space-y-5">

              {/* Méthode de calcul de l'indemnité */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <Calculator size={18} className="text-emerald-500" /> Méthode de calcul de l'indemnité
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">Les deux méthodes sont légales au Congo. L'entreprise choisit celle qu'elle applique dans son règlement intérieur.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      v: 'AVERAGE_12M',
                      label: '1/12e annuel (défaut)',
                      desc: 'Indemnité = total brut 12 mois de référence ÷ 12 ÷ 26 × jours. Avantage si primes variables.',
                    },
                    {
                      v: 'CURRENT_SALARY',
                      label: 'Maintien de salaire',
                      desc: 'Indemnité = dernier brut mensuel ÷ 26 × jours. Simple et lisible.',
                    },
                  ].map(({ v, label, desc }) => (
                    <button key={v} onClick={() => setLeaveMethod(v as any)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        leaveMethod === v
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-[var(--border)] hover:border-emerald-300'
                      }`}>
                      <p className={`font-bold text-sm mb-1 ${leaveMethod === v ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--text)]'}`}>{label}</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🆕 Mode de cycle de congé (JANUARY/JUNE existent aussi
                  légalement, mais dans les faits c'est ROLLING ou l'ancre
                  d'embauche qui sont utilisées — voir conversation produit) */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="font-bold text-[var(--text)] mb-1 flex items-center gap-2">
                  <CalendarClock size={18} className="text-emerald-500" /> Mode de cycle de départ en congé
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Le règlement intérieur doit préciser ce mode. Change uniquement QUAND le prochain départ est dû — le solde (26j + ancienneté) reste identique dans les deux cas.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      v: 'ROLLING',
                      label: 'Glissant (défaut)',
                      desc: "Le cycle redémarre à la date réelle de RETOUR de congé — toujours 12 mois de présence avant le prochain départ, mais la date de départ dérive dans le temps d'une année sur l'autre.",
                    },
                    {
                      v: 'ANNIVERSARY',
                      label: "Date anniversaire d'embauche",
                      desc: "Le départ tombe toujours le même mois chaque année (ex : embauché en février → toujours en février). Prévisible pour la planification RH, mais le cycle suivant le premier ne compte que 11 mois réels de présence.",
                    },
                  ].map(({ v, label, desc }) => (
                    <button key={v} onClick={() => setLeaveCycleMode(v as any)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        leaveCycleMode === v
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-[var(--border)] hover:border-emerald-300'
                      }`}>
                      <p className={`font-bold text-sm mb-1 ${leaveCycleMode === v ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--text)]'}`}>{label}</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
                    </button>
                  ))}
                </div>
                {leaveCycleMode === 'ANNIVERSARY' && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-start gap-1.5">
                    <Info size={13} className="mt-0.5 shrink-0" />
                    Ce changement s'applique aux prochains cycles calculés — les cycles déjà ouverts (en cours) ne sont pas recalculés rétroactivement.
                  </p>
                )}
              </div>

              {/* Rappel règles légales */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <Info size={13} /> Règles légales Congo — non modifiables
                </p>
                <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                  <li>• 26 jours ouvrables / an — acquisition : 2,16 j/mois</li>
                  <li>• Plafond de report : 78 jours (3 ans)</li>
                  <li>• Base de calcul : brut total (primes incluses) ÷ 26</li>
                  <li>• L'indemnité est soumise à ITS et CNSS comme un salaire</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Actions */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sticky top-6">
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Save size={18} /> Enregistrer
            </button>
            <p className="text-xs text-[var(--text-muted)] text-center mt-3">
              Modifications appliquées immédiatement à toute l'entreprise
            </p>
          </div>

          {/* Simulateur ITS (uniquement sur l'onglet ITS) */}
          {activeTab === 'its' && (
            <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-700">
                <Calculator size={18} className="text-emerald-400" />
                <h3 className="font-bold">Simulateur ITS / IRPP</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] uppercase font-bold">Revenu imposable annuel</label>
                  <div className="relative mt-1.5">
                    <input type="number"
                      value={simIncome}
                      onChange={e => setSimIncome(+e.target.value)}
                      className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white font-mono font-bold focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)]">XAF</span>
                  </div>
                </div>
                <button onClick={calculateITS}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm transition-colors">
                  Calculer
                </button>
                {simResult && (
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    {simResult.breakdown.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs text-[var(--text-muted)]">
                        <span>{b.range}</span>
                        <span className="font-mono">{b.amount.toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-amber-400 pt-2 border-t border-gray-700">
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
          <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[var(--border)]"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Confirmer les modifications</h3>
                <p className="text-sm text-[var(--text-muted)]">Ces changements impactent tous les bulletins futurs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
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