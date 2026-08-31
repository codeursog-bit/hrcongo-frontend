'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useConvention } from '@/components/ConventionGuard';

// ─── Types alignés sur le backend v2 ────────────────────────────────────────

interface Employee {
  id: string; firstName: string; lastName: string; employeeNumber: string;
  position: string; contractType: 'CDI' | 'CDD' | string; hireDate: string;
  baseSalary: number; nbParts?: number;
  department?: { name: string }; professionalCategory?: string;
  categorie?: number; categorieLabel?: string;
}

// RuptureResult du backend v2
interface RuptureResult {
  employeeId:       string;
  conventionCode:   string;
  motif:            string;
  dateRupture:      string;
  dateFinEffective: string;
  anciennete: { annees: number; mois: number; jours: number; totalMois: number; detail: string };
  avg12: { montant: number; source: 'konza' | 'partiel' | 'fallback'; moisKonza: number; moisFallback: number; detail: string };
  composantes: {
    dernierSalairePro:  { montant: number; detail: string };
    indemConges:        { montant: number; detail: string; soldeJours: number };
    indemPreavis:       { montant: number; detail: string; payeur: string; dureeJours: number };
    indemLicenciement:  { montant: number; detail: string };
    indemRetraite?:     { montant: number; detail: string };
    indemDeces?:        { montant: number; detail: string };
    gratifProrata:      { montant: number; detail: string };
    autresSommes:       Array<{ libelle: string; montant: number }>;
  };
  fiscalite: {
    brutImposableITS: number; brutCotisableCNSS: number;
    its: number; cnss: number; exoLicenciement: number; detail: string;
  };
  totaux: { brutTotal: number; totalRetenues: number; netAPayer: number };
  alertes: Array<{ niveau: 'INFO' | 'ATTENTION' | 'CRITIQUE'; code: string; message: string; article?: string }>;
  checklist: Array<{ id: string; etape: string; description: string; statut: string; obligatoire: boolean; articleRef?: string }>;
  donneesManquantes: string[];
}

// Données migration — mode assisté
interface MigrationData {
  salairesHistoriques?: Array<{ mois: number; annee: number; brutTotal: number }>;
  soldeCongesAMigration?: number;
  congesPrisAvantKonza?: number;
  indemnitesAnterieures?: number;
}

// ─── Motifs de rupture ───────────────────────────────────────────────────────

const RT = [
  { v: 'LICENCIEMENT_MOTIF_PERSONNEL', l: 'Motif personnel',         g: 'Employeur', hasIndem: true  },
  { v: 'LICENCIEMENT_FAUTE_GRAVE',     l: 'Faute grave',             g: 'Employeur', hasIndem: false },
  { v: 'LICENCIEMENT_FAUTE_LOURDE',    l: 'Faute lourde',            g: 'Employeur', hasIndem: false },
  { v: 'LICENCIEMENT_ECONOMIQUE',      l: 'Motif économique',        g: 'Employeur', hasIndem: true  },
  { v: 'DEMISSION',                    l: 'Démission',               g: 'Salarié',   hasIndem: false },
  { v: 'RETRAITE_SALARIE',             l: 'Départ retraite salarié', g: 'Salarié',   hasIndem: true  },
  { v: 'RUPTURE_CONVENTIONNELLE',      l: 'Rupture conventionnelle', g: 'Commun',    hasIndem: true  },
  { v: 'FIN_CDD',                      l: 'Fin de CDD',              g: 'Contrat',   hasIndem: false },
  { v: 'RUPTURE_ANTICIPEE_CDD_EMPLOYEUR', l: 'Rupture anticipée CDD', g: 'Contrat', hasIndem: true  },
  { v: 'RETRAITE_EMPLOYEUR',           l: 'Mise à la retraite',      g: 'Employeur', hasIndem: true  },
  { v: 'INVALIDITE',                   l: 'Invalidité / Inaptitude', g: 'Médical',   hasIndem: true  },
  { v: 'DECES',                        l: 'Décès',                   g: 'Médical',   hasIndem: true  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt  = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtD = (d?: string) => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const inp = "w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all";

// ─── Composants UI ───────────────────────────────────────────────────────────

function Sp() {
  return <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin flex-shrink-0" />;
}

function Bdg({ c, v = 'd' }: { c: React.ReactNode; v?: 'd' | 's' | 'w' | 'r' | 'i' }) {
  const m = {
    d: 'bg-slate-800 text-slate-300 border-slate-700',
    s: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    w: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    r: 'bg-red-500/10 text-red-400 border-red-500/20',
    i: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }[v];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${m}`}>{c}</span>;
}

function Crd({ t, s, ch }: { t: string; s?: string; ch: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t}</p>
        {s && <p className="text-xs text-slate-600 mt-0.5">{s}</p>}
      </div>
      {ch}
    </div>
  );
}

function Fl({ l, req }: { l: string; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
      {l}{req && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

function Chk({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={onChange}
        className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
          checked ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-500' : 'bg-slate-800 border-slate-600'
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </label>
  );
}

function Stp({ s }: { s: 1 | 2 | 3 }) {
  const steps = [{ n: 1, l: 'Saisie' }, { n: 2, l: 'Calcul' }, { n: 3, l: 'Clôture' }];
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((x, i) => (
        <div key={x.n} className="flex items-center gap-1.5">
          {i > 0 && <div className={`w-6 h-px ${s > i ? 'bg-cyan-500' : 'bg-slate-700'}`} />}
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            s > x.n ? 'bg-cyan-500 text-slate-900'
              : s === x.n ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-slate-800 text-slate-600 border border-slate-700'
          }`}>
            {s > x.n ? '✓' : x.n}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${s === x.n ? 'text-cyan-400' : 'text-slate-600'}`}>
            {x.l}
          </span>
        </div>
      ))}
    </div>
  );
}

function AlerteBadge({ niveau }: { niveau: 'INFO' | 'ATTENTION' | 'CRITIQUE' }) {
  const m = {
    INFO:      'bg-blue-500/10 border-blue-500/20 text-blue-400',
    ATTENTION: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    CRITIQUE:  'bg-red-500/10 border-red-500/20 text-red-400',
  }[niveau];
  const icons = { INFO: 'ℹ️', ATTENTION: '⚠️', CRITIQUE: '🚨' };
  return <span className={`text-xs font-bold border rounded-full px-2 py-0.5 ${m}`}>{icons[niveau]}</span>;
}

// ─── Sélecteur motif de rupture ───────────────────────────────────────────────

function RuptureTypeSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const groups = ['Employeur', 'Salarié', 'Commun', 'Contrat', 'Médical'];
  return (
    <div>
      {groups.map(g => {
        const items = RT.filter(r => r.g === g);
        return (
          <div key={g} className="mb-4 last:mb-0">
            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-2">{g}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map(r => (
                <button
                  key={r.v}
                  onClick={() => onChange(r.v)}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold border transition-all ${
                    value === r.v
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
                  }`}
                >
                  {r.l}
                  {!r.hasIndem && <span className="block text-xs font-normal text-slate-600 mt-0.5">Pas d'indem. lic.</span>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Panel données manquantes (mode assisté) ──────────────────────────────────

function MigrationPanel({
  emp,
  migrationData,
  onChange,
}: {
  emp: Employee;
  migrationData: MigrationData;
  onChange: (d: MigrationData) => void;
}) {
  const [showMig, setShowMig] = useState(false);

  return (
    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
      <button
        onClick={() => setShowMig(s => !s)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs">⚠️</span>
          <span className="text-xs font-bold text-amber-400">Données avant Konza</span>
          <span className="text-xs text-slate-600">— Optionnel, améliore la précision</span>
        </div>
        <span className="text-xs text-slate-500">{showMig ? '▲' : '▼'}</span>
      </button>

      {showMig && (
        <div className="mt-4 space-y-4">
          {/* Congés avant Konza */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Fl l="Solde congés à la migration (j)" />
              <input
                type="number" min={0}
                value={migrationData.soldeCongesAMigration ?? ''}
                onChange={e => onChange({ ...migrationData, soldeCongesAMigration: +e.target.value || undefined })}
                placeholder="Ex: 12"
                className={inp}
              />
              <p className="text-xs text-slate-700 mt-1">Jours restants quand vous avez migré vers Konza</p>
            </div>
            <div>
              <Fl l="Indemnités antérieures (FCFA)" />
              <input
                type="number" min={0}
                value={migrationData.indemnitesAnterieures ?? ''}
                onChange={e => onChange({ ...migrationData, indemnitesAnterieures: +e.target.value || undefined })}
                placeholder="Ex: 500000"
                className={inp}
              />
              <p className="text-xs text-slate-700 mt-1">Indemnités déjà versées lors d'une rupture antérieure</p>
            </div>
          </div>

          {/* Historique salaires */}
          <div>
            <Fl l="Salaires manquants (si Konza a moins de 12 bulletins)" />
            <p className="text-xs text-slate-600 mb-2">
              Laissez vide pour utiliser le salaire actuel ({fmt(emp.baseSalary)} FCFA) sur les mois manquants
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => {
                const existing = migrationData.salairesHistoriques?.find(s => s.mois === i + 1);
                return (
                  <div key={i}>
                    <p className="text-xs text-slate-600 mb-1">Mois -{i + 1}</p>
                    <input
                      type="number" min={0}
                      value={existing?.brutTotal ?? ''}
                      placeholder={fmt(emp.baseSalary)}
                      onChange={e => {
                        const val = +e.target.value;
                        const histo = migrationData.salairesHistoriques?.filter(s => s.mois !== i + 1) ?? [];
                        if (val > 0) histo.push({ mois: i + 1, annee: new Date().getFullYear(), brutTotal: val });
                        onChange({ ...migrationData, salairesHistoriques: histo });
                      }}
                      className={`${inp} text-xs py-1.5`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ContractRupturePage() {
  const { status: convStatus } = useConvention();

  const [tab,         setTab]         = useState<'nouveau' | 'historique'>('nouveau');
  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [empLoad,     setEmpLoad]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [emp,         setEmp]         = useState<Employee | null>(null);

  const [form, setForm] = useState({
    motif:                   '',
    dateRupture:             new Date().toISOString().split('T')[0],
    dateFinEffective:        new Date().toISOString().split('T')[0],
    statutPreavis:           'DISPENSE_EMPLOYEUR' as 'EFFECTUE' | 'DISPENSE_EMPLOYEUR' | 'REFUSE_SALARIE' | 'NON_APPLICABLE',
    dureePreavjours:         30,
    joursTravaillesDernierMois: 26,
    rupturePendantConge:     false,
    congesPrisKonza:         0,
    causeDetail:             '',
    autresSommes:            [] as Array<{ libelle: string; montant: number; imposable: boolean; cotisable: boolean }>,
    autresSommesLabel:       '',
    autresSommesMontant:     0,
  });

  const [migrationData, setMigrationData] = useState<MigrationData>({});
  const [calc,        setCalc]        = useState<RuptureResult | null>(null);
  const [calcLoad,    setCalcLoad]    = useState(false);
  const [calcErr,     setCalcErr]     = useState<string | null>(null);
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [rid,         setRid]         = useState<string | null>(null);
  const [activeDoc,   setActiveDoc]   = useState<'lettre' | 'certificat' | 'cnss' | null>(null);
  const [docHtml,     setDocHtml]     = useState<string | null>(null);
  const [docLoad,     setDocLoad]     = useState(false);
  const [hist,        setHist]        = useState<any[]>([]);
  const [histLoad,    setHistLoad]    = useState(false);
  const [pse,         setPse]         = useState(false);
  const calcRef   = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setEmpLoad(true);
    api.get<Employee[]>('/employees?status=ACTIVE&limit=200')
      .then((d: any) => setEmployees(Array.isArray(d) ? d : (d.employees ?? d.data ?? d.items ?? [])))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoad(false));
  }, []);

  const loadHist = useCallback(() => {
    setHistLoad(true);
    api.get<any>('/contract-rupture')
      .then((d: any) => setHist(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => setHist([]))
      .finally(() => setHistLoad(false));
  }, []);

  useEffect(() => { if (tab === 'historique') loadHist(); }, [tab, loadHist]);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const ri  = RT.find(r => r.v === form.motif);

  // Ancienneté affichée en temps réel
  const ancMois = emp && form.dateRupture
    ? Math.floor((new Date(form.dateRupture).getTime() - new Date(emp.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;

  // Statut préavis auto selon motif
  function getStatutPreavisAuto(motif: string): typeof form.statutPreavis {
    if (['LICENCIEMENT_FAUTE_GRAVE', 'LICENCIEMENT_FAUTE_LOURDE', 'FIN_CDD', 'DECES'].includes(motif))
      return 'NON_APPLICABLE';
    return 'DISPENSE_EMPLOYEUR';
  }

  // ─── Calcul ──────────────────────────────────────────────────────────────
  async function doCalc() {
    if (!emp || !form.motif) return;
    setCalcLoad(true); setCalcErr(null);
    try {
      const payload = {
        employeeId:                emp.id,
        entrepriseId:              convStatus?.entrepriseId ?? '',
        conventionCode:            convStatus?.conventionCode ?? '',
        dateEmbauche:              emp.hireDate,
        dateRupture:               form.dateRupture,
        dateFinEffective:          form.dateFinEffective,
        typeContrat:               emp.contractType as 'CDI' | 'CDD',
        motif:                     form.motif,
        motifDetail:               form.causeDetail,
        categorie:                 emp.categorie ?? 1,
        categorieLabel:            emp.categorieLabel,
        poste:                     emp.position,
        salaireBase:               emp.baseSalary,
        salaireActuel:             emp.baseSalary,
        bulletinsKonza:            [],   // Le back récupère depuis son service paie
        congesPrisKonza:           form.congesPrisKonza,
        statutPreavis:             form.statutPreavis,
        dureePreavjours:           form.dureePreavjours,
        joursTravaillesDernierMois:form.joursTravaillesDernierMois,
        rupturePendantConge:       form.rupturePendantConge,
        nbParts:                   emp.nbParts ?? 1,
        migrationData:             Object.keys(migrationData).length ? migrationData : undefined,
        autresSommes:              form.autresSommes.length ? form.autresSommes : undefined,
        redacteurId:               'current-user',
      };

      const d = await api.post<RuptureResult>('/rupture/calculer', payload);

      // Vérification PSE si licenciement économique
      if (form.motif === 'LICENCIEMENT_ECONOMIQUE') {
        const p = await api.get<any>('/contract-rupture/pse-check').catch(() => ({ count: 0 }));
        if ((p.count ?? 0) >= 4) setPse(true);
      }

      setCalc(d);
      setStep(2);
      setTimeout(() => calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e: any) {
      setCalcErr(e.message ?? 'Erreur de calcul');
    } finally {
      setCalcLoad(false);
    }
  }

  async function doConfirm() {
    if (!emp || !calc) return;
    setConfirmLoad(true);
    try {
      const d = await api.post<any>('/contract-rupture', { employeeId: emp.id, motif: form.motif, ruptureResult: calc });
      setRid(d.ruptureId ?? d.id ?? 'CONF-' + Date.now());
      setStep(3);
    } catch (e: any) {
      setCalcErr(e.message ?? 'Erreur de confirmation');
    } finally {
      setConfirmLoad(false);
    }
  }

  async function loadDoc(type: 'lettre' | 'certificat' | 'cnss') {
    if (!rid && step < 3) return;
    setActiveDoc(type);
    setDocLoad(true);
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/contract-rupture/${rid}/document/${type}`,
        { credentials: 'include' }
      );
      setDocHtml(await r.text());
    } catch {
      setDocHtml('<p style="padding:20px;color:#ef4444">Erreur de chargement du document</p>');
    } finally {
      setDocLoad(false);
    }
  }

  function reset() {
    setStep(1); setCalc(null); setCalcErr(null); setEmp(null);
    setRid(null); setActiveDoc(null); setDocHtml(null); setPse(false);
    setMigrationData({});
    setForm(f => ({ ...f, motif: '', causeDetail: '', autresSommes: [], autresSommesLabel: '', autresSommesMontant: 0 }));
  }

  // Lignes STC — depuis les composantes du backend v2
  const bt = calc?.totaux.brutTotal ?? 0;
  const pct = (n: number, t: number) => t > 0 ? Math.round((n / t) * 100) : 0;

  const composante = calc?.composantes;
  const indemPrinc = composante?.indemRetraite ?? composante?.indemDeces ?? composante?.indemLicenciement;

  const decompteLines = calc ? [
    {
      l:    calc.anciennete.totalMois < 24 || ['RETRAITE_EMPLOYEUR','RETRAITE_SALARIE'].includes(calc.motif)
              ? (composante?.indemRetraite ? 'Indemnité de départ à la retraite'
                : composante?.indemDeces ? 'Indemnité aux héritiers'
                : 'Indemnité de licenciement')
              : 'Indemnité de licenciement',
      sub:  indemPrinc?.detail,
      v:    indemPrinc?.montant ?? 0,
      tag:  'Exonérée ITS + CNSS',
      tv:   's' as const,
      show: (indemPrinc?.montant ?? 0) > 0,
    },
    {
      l:    `Congés payés (${composante?.indemConges.soldeJours ?? 0} j)`,
      sub:  composante?.indemConges.detail,
      v:    composante?.indemConges.montant ?? 0,
      tag:  'Imposable ITS · CNSS',
      tv:   'i' as const,
      show: true,
    },
    {
      l:    `Préavis compensatoire (${composante?.indemPreavis.dureeJours ?? 0} j) — ${composante?.indemPreavis.payeur ?? ''}`,
      sub:  composante?.indemPreavis.detail,
      v:    composante?.indemPreavis.montant ?? 0,
      tag:  'Imposable ITS · CNSS',
      tv:   'w' as const,
      show: (composante?.indemPreavis.montant ?? 0) > 0,
    },
    {
      l:    'Dernier salaire proratisé',
      sub:  composante?.dernierSalairePro.detail,
      v:    composante?.dernierSalairePro.montant ?? 0,
      tag:  'Imposable ITS · CNSS',
      tv:   'i' as const,
      show: (composante?.dernierSalairePro.montant ?? 0) > 0,
    },
    {
      l:    'Gratification proratisée (13e mois)',
      sub:  composante?.gratifProrata.detail,
      v:    composante?.gratifProrata.montant ?? 0,
      tag:  'Imposable ITS · CNSS',
      tv:   'i' as const,
      show: (composante?.gratifProrata.montant ?? 0) > 0,
    },
    ...(composante?.autresSommes.map(a => ({
      l: a.libelle, sub: undefined, v: a.montant, tag: 'Autre', tv: 'd' as const, show: a.montant > 0,
    })) ?? []),
  ].filter(r => r.show) : [];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">

      {/* ── Alerte PSE ── */}
      {pse && (
        <div className="fixed top-4 right-4 z-40 w-80 bg-purple-950/95 border border-purple-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-purple-300 mb-1">PSE Requis — Art. 39 CT Congo</p>
              <p className="text-xs text-slate-400 leading-relaxed">Seuil de 5 licenciements économiques sur 30 jours atteint.</p>
              <Link href="/pse" className="inline-block mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 underline">
                Ouvrir une procédure PSE
              </Link>
            </div>
            <button onClick={() => setPse(false)} className="text-slate-500 hover:text-slate-300 text-xl leading-none">&times;</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-none">Rupture de Contrat</p>
            <p className="text-xs text-slate-500 hidden sm:block">Solde de tout compte · Code du Travail Congo</p>
          </div>

          {convStatus?.hasConvention && convStatus.conventionCode && (
            <Bdg c={convStatus.conventionCode} v="i" />
          )}

          <Link href="/pse" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-200 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-all shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            PSE
          </Link>

          <div className="flex bg-slate-800/60 rounded-xl p-0.5 gap-0.5 shrink-0">
            {(['nouveau', 'historique'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                  tab === t ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {t === 'nouveau' ? 'Nouvelle' : 'Historique'}
              </button>
            ))}
          </div>
          {tab === 'nouveau' && <Stp s={step} />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── HISTORIQUE ── */}
        {tab === 'historique' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold">Historique des ruptures</h2>
              <button onClick={loadHist} className="text-xs font-semibold text-slate-500 hover:text-slate-200 border border-white/10 px-3 py-1.5 rounded-lg transition-all">
                Actualiser
              </button>
            </div>
            {histLoad
              ? <div className="flex justify-center py-12"><Sp /></div>
              : hist.length === 0
              ? <div className="text-center py-12 text-slate-600 text-sm">Aucune rupture enregistrée</div>
              : (
                <div className="space-y-2">
                  {hist.map((r: any) => (
                    <div key={r.id} className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{r.employee?.firstName} {r.employee?.lastName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {r.employee?.employeeNumber} · {RT.find(t => t.v === r.motif)?.l ?? r.motif} · {fmtD(r.dateRupture ?? r.ruptureDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-cyan-400">{fmt(r.totalNet ?? r.netAPayer ?? 0)} FCFA</p>
                        <Bdg c={r.status ?? 'CONFIRME'} v={r.status === 'CONFIRME' ? 's' : 'd'} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── ÉTAPE 1 ── */}
        {tab === 'nouveau' && step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

            {/* Sélection employé */}
            <Crd t="Employé concerné" ch={
              <>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nom, matricule, poste..."
                  className={`${inp} mb-3`}
                />
                {empLoad
                  ? <div className="flex justify-center py-6"><Sp /></div>
                  : filtered.length === 0
                  ? <p className="text-center py-8 text-slate-600 text-xs">{employees.length === 0 ? 'Aucun employé actif trouvé' : 'Aucun résultat'}</p>
                  : (
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto no-scrollbar">
                      {filtered.map(e => {
                        const isSel = emp?.id === e.id;
                        const ancAns = Math.floor(ancMois / 12);
                        const ancM   = ancMois % 12;
                        return (
                          <button key={e.id} onClick={() => setEmp(e)}
                            className={`w-full p-3 rounded-xl text-left border transition-all ${
                              isSel
                                ? 'bg-cyan-500/10 border-cyan-500/40'
                                : 'bg-slate-800/40 border-white/5 hover:border-white/15 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{e.firstName} {e.lastName}</p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{e.employeeNumber} · {e.position}</p>
                                {e.department && <p className="text-xs text-slate-600">{e.department.name}</p>}
                              </div>
                              <Bdg c={e.contractType} v="i" />
                            </div>
                            {isSel && form.dateRupture && (
                              <div className="mt-2 pt-2 border-t border-cyan-500/20 text-xs text-cyan-400 font-medium">
                                {ancAns} ans {ancM} mois
                                {ancMois < 18 && <span className="text-amber-400 ml-2">— inf. à 18 mois</span>}
                                {e.professionalCategory && <span className="text-slate-500 ml-2">· {e.professionalCategory}</span>}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                }
              </>
            } />

            <div className="space-y-4">

              <Crd t="Nature de la rupture" ch={
                <RuptureTypeSelector
                  value={form.motif}
                  onChange={v => setForm(f => ({
                    ...f, motif: v,
                    statutPreavis: getStatutPreavisAuto(v),
                  }))}
                />
              } />

              <Crd t="Dates et préavis" ch={
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div>
                      <Fl l="Date notification" req />
                      <input type="date" value={form.dateRupture}
                        onChange={e => setForm(f => ({ ...f, dateRupture: e.target.value }))}
                        className={inp}
                      />
                    </div>
                    <div>
                      <Fl l="Date fin effective" req />
                      <input type="date" value={form.dateFinEffective}
                        onChange={e => setForm(f => ({ ...f, dateFinEffective: e.target.value }))}
                        className={inp}
                      />
                    </div>
                    <div>
                      <Fl l="Préavis (jours)" />
                      <input type="number" min={0} value={form.dureePreavjours}
                        onChange={e => setForm(f => ({ ...f, dureePreavjours: +e.target.value }))}
                        className={inp}
                      />
                    </div>
                    <div>
                      <Fl l="Congés pris (j)" />
                      <input type="number" min={0} value={form.congesPrisKonza}
                        onChange={e => setForm(f => ({ ...f, congesPrisKonza: +e.target.value }))}
                        className={inp}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <Fl l="Jours travaillés (dernier mois)" />
                      <input type="number" min={1} max={26} value={form.joursTravaillesDernierMois}
                        onChange={e => setForm(f => ({ ...f, joursTravaillesDernierMois: +e.target.value }))}
                        className={inp}
                      />
                    </div>
                    <div>
                      <Fl l="Statut préavis" />
                      <select
                        value={form.statutPreavis}
                        onChange={e => setForm(f => ({ ...f, statutPreavis: e.target.value as typeof form.statutPreavis }))}
                        className={inp}
                      >
                        <option value="DISPENSE_EMPLOYEUR">Dispensé par l'employeur</option>
                        <option value="EFFECTUE">Préavis effectué</option>
                        <option value="REFUSE_SALARIE">Refusé par le salarié</option>
                        <option value="NON_APPLICABLE">Non applicable</option>
                      </select>
                    </div>
                  </div>
                  <Chk
                    checked={form.rupturePendantConge}
                    onChange={() => setForm(f => ({ ...f, rupturePendantConge: !f.rupturePendantConge }))}
                    label="Rupture intervenant pendant le congé du salarié (préavis doublé selon convention)"
                  />
                </>
              } />

              <Crd t="Motif et compléments" ch={
                <>
                  <Fl l="Description des faits" />
                  <textarea rows={3} value={form.causeDetail}
                    onChange={e => setForm(f => ({ ...f, causeDetail: e.target.value }))}
                    placeholder="Description circonstanciée des motifs..."
                    className={`${inp} resize-none mb-4`}
                  />

                  {/* Autres sommes */}
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <Fl l="Libellé autre somme" />
                      <input value={form.autresSommesLabel}
                        onChange={e => setForm(f => ({ ...f, autresSommesLabel: e.target.value }))}
                        placeholder="Ex: Prime exceptionnelle"
                        className={inp}
                      />
                    </div>
                    <div>
                      <Fl l="Montant (FCFA)" />
                      <div className="flex gap-2">
                        <input type="number" min={0} value={form.autresSommesMontant}
                          onChange={e => setForm(f => ({ ...f, autresSommesMontant: +e.target.value }))}
                          className={inp}
                        />
                        <button
                          onClick={() => {
                            if (!form.autresSommesLabel || !form.autresSommesMontant) return;
                            setForm(f => ({
                              ...f,
                              autresSommes: [...f.autresSommes, { libelle: f.autresSommesLabel, montant: f.autresSommesMontant, imposable: true, cotisable: true }],
                              autresSommesLabel: '', autresSommesMontant: 0,
                            }));
                          }}
                          className="px-3 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold hover:bg-cyan-500/30 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  {form.autresSommes.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {form.autresSommes.map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg text-xs">
                          <span className="text-slate-300">{a.libelle}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">{fmt(a.montant)} FCFA</span>
                            <button onClick={() => setForm(f => ({ ...f, autresSommes: f.autresSommes.filter((_, j) => j !== i) }))}
                              className="text-slate-600 hover:text-red-400 transition-colors">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              } />

              {/* Panel migration — si l'employé est sélectionné */}
              {emp && (
                <MigrationPanel
                  emp={emp}
                  migrationData={migrationData}
                  onChange={setMigrationData}
                />
              )}

              {calcErr && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {calcErr}
                </div>
              )}

              <button
                onClick={doCalc}
                disabled={!emp || !form.motif || calcLoad}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  emp && form.motif && !calcLoad
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {calcLoad ? <><Sp /><span>Calcul en cours...</span></> : 'Calculer le solde de tout compte'}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {tab === 'nouveau' && step === 2 && calc && (
          <div ref={calcRef} className="space-y-5">
            <button onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Modifier
            </button>

            {/* Bandeau employé */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Bdg c={ri?.l} v="i" />
                  <Bdg c={calc.conventionCode} v="i" />
                  {calc.avg12.source === 'fallback' && <Bdg c="Avg12 estimé" v="w" />}
                  {calc.donneesManquantes.length > 0 && <Bdg c={`${calc.donneesManquantes.length} données manquantes`} v="w" />}
                </div>
                <p className="text-xl font-black tracking-tight">{emp?.firstName} {emp?.lastName}</p>
                <p className="text-xs text-slate-500 mt-1">{emp?.employeeNumber} · {emp?.position} · {emp?.contractType}</p>
                {/* Avg12 info */}
                <p className="text-xs text-slate-600 mt-1">{calc.avg12.detail}</p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-xs text-slate-500 mb-0.5">Ancienneté</p>
                <p className="text-2xl font-black text-cyan-400">
                  {calc.anciennete.annees} ans {calc.anciennete.mois} mois
                </p>
                <p className="text-xs text-slate-600">
                  {fmtD(emp?.hireDate)} → {fmtD(calc.dateFinEffective)}
                </p>
              </div>
            </div>

            {/* Alertes Konza — non bloquantes */}
            {calc.alertes.length > 0 && (
              <div className="space-y-2">
                {calc.alertes.map((a, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                    a.niveau === 'CRITIQUE' ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : a.niveau === 'ATTENTION' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    <AlerteBadge niveau={a.niveau} />
                    <div className="flex-1">
                      <span>{a.message}</span>
                      {a.article && <span className="text-slate-600 ml-1">({a.article})</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

              {/* Décompte STC */}
              <Crd t="Décompte — Solde de tout compte" ch={
                <div className="space-y-2">
                  {decompteLines.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-800/40 rounded-xl border border-white/5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 leading-snug">{r.l}</p>
                        {r.sub && <p className="text-xs text-slate-600 mt-0.5 truncate">{r.sub}</p>}
                        {r.tag && <Bdg c={r.tag} v={r.tv} />}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{fmt(r.v)}</p>
                        <p className="text-xs text-slate-600">FCFA</p>
                      </div>
                    </div>
                  ))}

                  {/* Totaux fiscaux */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    <div className="p-3 bg-slate-800/60 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Brut imposable</p>
                      <p className="text-lg font-bold">{fmt(calc.fiscalite.brutImposableITS)} <span className="text-xs text-slate-600">FCFA</span></p>
                      {calc.fiscalite.its > 0 && (
                        <p className="text-xs text-red-400 mt-0.5">ITS −{fmt(calc.fiscalite.its)} FCFA</p>
                      )}
                      {calc.fiscalite.cnss > 0 && (
                        <p className="text-xs text-orange-400">CNSS −{fmt(calc.fiscalite.cnss)} FCFA</p>
                      )}
                    </div>
                    <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl">
                      <p className="text-xs text-cyan-500 uppercase tracking-wider font-bold mb-1">Total NET</p>
                      <p className="text-xl font-black text-cyan-400">
                        {fmt(calc.totaux.netAPayer)} <span className="text-xs text-cyan-700">FCFA</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 text-right">
                    Brut total : {fmt(bt)} · Exonéré ITS : {fmt(calc.fiscalite.exoLicenciement)} FCFA
                  </p>
                </div>
              } />

              <div className="space-y-4">

                {/* Répartition */}
                <Crd t="Répartition" ch={
                  <>
                    {[
                      { l: 'Licenciement / Retraite', v: indemPrinc?.montant ?? 0, c: 'bg-cyan-500' },
                      { l: 'Congés',                   v: composante?.indemConges.montant ?? 0,       c: 'bg-blue-500' },
                      { l: 'Gratification',            v: composante?.gratifProrata.montant ?? 0,     c: 'bg-emerald-500' },
                      { l: 'Préavis',                  v: composante?.indemPreavis.montant ?? 0,      c: 'bg-amber-500' },
                      { l: 'Dernier salaire',          v: composante?.dernierSalairePro.montant ?? 0, c: 'bg-purple-500' },
                    ].filter(r => r.v > 0).map(r => (
                      <div key={r.l} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">{r.l}</span>
                          <span className="text-slate-400 font-semibold">{pct(r.v, bt)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${r.c} rounded-full transition-all duration-700`} style={{ width: `${pct(r.v, bt)}%` }} />
                        </div>
                      </div>
                    ))}
                  </>
                } />

                {/* Bases de calcul */}
                <Crd t="Bases de calcul" ch={
                  <>
                    {[
                      { l: 'Avg12 (base légale)', v: calc.avg12.montant },
                      { l: `Ancienneté totale`,   v: null, txt: calc.anciennete.detail },
                    ].map(({ l, v, txt }) => (
                      <div key={l} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-xs">
                        <span className="text-slate-500">{l}</span>
                        <span className="text-slate-300 font-semibold">
                          {txt ?? `${fmt(v!)} FCFA`}
                        </span>
                      </div>
                    ))}
                  </>
                } />

                {/* Checklist procédurale */}
                {calc.checklist.length > 0 && (
                  <Crd t="Procédure légale" s="Konza conseille — vous décidez" ch={
                    <div className="space-y-2">
                      {calc.checklist.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-start gap-2 text-xs">
                          <span className={item.obligatoire ? 'text-cyan-400' : 'text-slate-600'}>
                            {item.obligatoire ? '●' : '○'}
                          </span>
                          <div>
                            <p className={`font-semibold ${item.obligatoire ? 'text-slate-300' : 'text-slate-500'}`}>{item.etape}</p>
                            {item.articleRef && <p className="text-slate-700">{item.articleRef}</p>}
                          </div>
                        </div>
                      ))}
                      {calc.checklist.length > 5 && (
                        <p className="text-xs text-slate-600">+{calc.checklist.length - 5} étapes supplémentaires</p>
                      )}
                    </div>
                  } />
                )}

                <Link href="/pse" className="flex items-center justify-between p-4 bg-slate-900/60 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all group">
                  <div>
                    <p className="text-xs font-bold text-slate-400 group-hover:text-purple-300">Plan de Sauvegarde de l&apos;Emploi</p>
                    <p className="text-xs text-slate-600">Art. 39 CT Congo · PSE</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-700 group-hover:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Documents */}
            <Crd t="Documents officiels" s={rid ? undefined : 'Disponibles après confirmation'} ch={
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                  {([
                    { k: 'lettre'     as const, l: 'Lettre de notification', s: 'Art. 46 CT Congo'     },
                    { k: 'certificat' as const, l: 'Certificat de travail',  s: 'Exempt de timbre'     },
                    { k: 'cnss'       as const, l: 'Attestation CNSS',       s: "Cessation d'activité" },
                  ]).map(d => (
                    <button key={d.k} onClick={() => rid && loadDoc(d.k)} disabled={!rid}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        activeDoc === d.k ? 'bg-cyan-500/10 border-cyan-500/40'
                          : rid ? 'bg-slate-800/40 border-white/5 hover:border-white/15'
                          : 'bg-slate-800/20 border-white/5 opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-200 mb-0.5">{d.l}</p>
                      <p className="text-xs text-slate-600">{d.s}</p>
                      {!rid && <p className="text-xs text-slate-700 mt-0.5">Après confirmation</p>}
                    </button>
                  ))}
                </div>
                {activeDoc && (
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/60 border-b border-white/10">
                      <span className="text-xs font-bold text-slate-400">
                        {activeDoc === 'lettre' ? 'Lettre' : activeDoc === 'certificat' ? 'Certificat' : 'Attestation CNSS'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => iframeRef.current?.contentWindow?.print()}
                          className="text-xs font-semibold text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                          Imprimer
                        </button>
                        <button onClick={() => { setActiveDoc(null); setDocHtml(null); }}
                          className="text-xs text-slate-500 border border-white/10 px-2.5 py-1 rounded-lg">
                          &times;
                        </button>
                      </div>
                    </div>
                    {docLoad
                      ? <div className="h-48 flex items-center justify-center bg-white"><div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" /></div>
                      : <iframe ref={iframeRef} srcDoc={docHtml ?? ''} className="w-full h-[480px] bg-white border-0" title="doc" />
                    }
                  </div>
                )}
              </>
            } />

            {calcErr && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{calcErr}</div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={doConfirm}
                disabled={confirmLoad}
                className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  !confirmLoad
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {confirmLoad ? <><Sp /><span>Enregistrement...</span></> : 'Confirmer et clôturer le contrat'}
              </button>
              <p className="text-xs text-slate-600 leading-relaxed">
                Met à jour le statut de l&apos;employé et enregistre la rupture.
              </p>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 ── */}
        {tab === 'nouveau' && step === 3 && calc && (
          <div className="max-w-xl mx-auto text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-xl font-black mb-2">Contrat clôturé</h2>
            <p className="text-slate-400 text-sm mb-6">
              Rupture de <strong className="text-slate-200">{emp?.firstName} {emp?.lastName}</strong> enregistrée.
              {rid && <span className="block text-xs text-slate-600 mt-1">{rid}</span>}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6 text-left">
              {[
                { l: 'Total NET',   v: `${fmt(calc.totaux.netAPayer)} FCFA`,        c: 'text-cyan-400'   },
                { l: 'Ancienneté', v: `${calc.anciennete.annees} ans ${calc.anciennete.mois} mois`, c: 'text-blue-400' },
                { l: 'Convention', v: calc.conventionCode,                          c: 'text-indigo-400' },
                { l: 'Motif',      v: ri?.l ?? '—',                                c: 'text-slate-300'  },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-slate-800/60 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-0.5">{l}</p>
                  <p className={`text-sm font-bold ${c} leading-snug`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 flex-wrap mb-6">
              {(['lettre', 'certificat', 'cnss'] as const).map(d => (
                <button key={d} onClick={() => loadDoc(d)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-100 border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition-all">
                  {d === 'lettre' ? 'Lettre' : d === 'certificat' ? 'Certificat' : 'CNSS'}
                </button>
              ))}
            </div>
            {activeDoc && docHtml && (
              <div className="rounded-xl overflow-hidden border border-white/10 mb-5 text-left">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-800/60 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-400">Document</span>
                  <button onClick={() => iframeRef.current?.contentWindow?.print()}
                    className="text-xs font-semibold text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                    Imprimer
                  </button>
                </div>
                <iframe ref={iframeRef} srcDoc={docHtml} className="w-full h-80 bg-white border-0" title="doc" />
              </div>
            )}
            <button onClick={reset}
              className="bg-slate-800 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-100 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              Nouvelle rupture de contrat
            </button>
          </div>
        )}

      </div>
    </div>
  );
}