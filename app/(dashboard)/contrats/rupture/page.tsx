'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useConventionGuard } from '@/hooks/useConventionGuard';

interface Employee {
  id: string; firstName: string; lastName: string; employeeNumber: string;
  position: string; contractType: string; hireDate: string; baseSalary: number;
  department?: { name: string }; professionalCategory?: string;
}

interface Calc {
  meta: { conventionCode: string; conventionNom: string; salaireConforme: boolean };
  employee: { nom: string; matricule: string; poste: string; contractType: string; hireDate: string; ruptureDate: string; yearsOfService: number; monthsOfService: number };
  salaires: { dernierBrut: number; avg3Mois: number; avg12Mois: number };
  preavis: { dureeJours: number; payePar: string; montant: number };
  indemnites: { licenciement: number; licenciementDetail: string; preavis: number; conges: number; congesDays: number; congesPris: number; gratification: number; gratificationDetail: string; dernierSalaire: number; autresSommes: number };
  totaux: { brutImposable: number; indemnitesExonerees: number; brutTotal: number; its: number; net: number };
  eligibilite: { aLicenciement: boolean; aPreavis: boolean; aConges: boolean; aGratification: boolean; isRetraite: boolean; raisons: string[] };
  alertes: string[];
}

const RT = [
  { v: 'DEMISSION',                   l: 'Démission',                g: 'Salarié'   },
  { v: 'LICENCIEMENT_FAUTE_SIMPLE',   l: 'Faute simple',             g: 'Employeur' },
  { v: 'LICENCIEMENT_FAUTE_GRAVE',    l: 'Faute grave',              g: 'Employeur' },
  { v: 'LICENCIEMENT_FAUTE_LOURDE',   l: 'Faute lourde',             g: 'Employeur' },
  { v: 'LICENCIEMENT_ECONOMIQUE',     l: 'Motif économique',         g: 'Employeur' },
  { v: 'RUPTURE_CONVENTIONNELLE',     l: 'Rupture conventionnelle',  g: 'Commun'    },
  { v: 'FIN_CDD',                     l: 'Fin de CDD',               g: 'Contrat'   },
  { v: 'FIN_PERIODE_ESSAI',           l: "Fin période d'essai",      g: 'Contrat'   },
  { v: 'RETRAITE',                    l: 'Départ à la retraite',     g: 'Salarié'   },
  { v: 'INVALIDITE',                  l: 'Invalidité',               g: 'Médical'   },
];

const fmt  = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const fmtD = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const mois = (h: string, e: string) => Math.floor((new Date(e).getTime() - new Date(h).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
const inp  = "w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all";

// ─── Composants utilitaires ───────────────────────────────────────────────────

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
      <div onClick={onChange} className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${checked ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-500' : 'bg-slate-800 border-slate-600'}`}>
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
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s > x.n ? 'bg-cyan-500 text-slate-900' : s === x.n ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}>
            {s > x.n ? '✓' : x.n}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${s === x.n ? 'text-cyan-400' : 'text-slate-600'}`}>{x.l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Modal convention — branché sur useConventionGuard ───────────────────────

function ConvModal({
  predefined,
  activating,
  error,
  onActivate,
}: {
  predefined: { code: string; name: string; description: string; categories: any[] }[];
  activating: boolean;
  error: string | null;
  onActivate: (code: string) => Promise<boolean>;
}) {
  const [sel, setSel] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <Bdg c="Convention collective requise" v="w" />
        <h2 className="text-lg font-bold text-slate-100 mt-3 mb-2">Choisissez votre convention</h2>
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">
          Les barèmes légaux (indemnités, préavis, retraite) dépendent du secteur d&apos;activité de votre entreprise.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {predefined.map(c => (
            <button key={c.code} onClick={() => setSel(c.code)}
              className={`p-3.5 rounded-xl text-left border transition-all ${sel === c.code ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-800/60 border-white/5 hover:border-white/15'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${sel === c.code ? 'text-cyan-400' : 'text-slate-500'}`}>{c.code}</p>
              <p className={`text-xs leading-snug ${sel === c.code ? 'text-slate-100' : 'text-slate-400'}`}>
                {c.name.replace(` - ${c.code}`, '').replace(`${c.code} - `, '')}
              </p>
            </button>
          ))}
        </div>
        {error && <p className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</p>}
        <button
          onClick={() => sel && onActivate(sel)}
          disabled={!sel || activating}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${sel && !activating ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
          {activating ? 'Activation...' : sel ? `Activer ${sel}` : 'Sélectionnez une convention'}
        </button>
        <p className="text-center text-xs text-slate-600 mt-2">Modifiable dans Paramètres</p>
      </div>
    </div>
  );
}

// ─── Sous-composant : Sélecteur de nature de rupture ─────────────────────────
// ⚠️ EXTRAIT ICI pour éviter l'erreur TS1005 (JSX trop imbriqué sur 1 ligne)

function RuptureTypeSelector({
  ruptureType,
  onChange,
}: {
  ruptureType: string;
  onChange: (v: string) => void;
}) {
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
                    ruptureType === r.v
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-200'
                  }`}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ContractRupturePage() {
  // ── Convention — géré par le hook centralisé ──
  const {
    status:           convStatus,
    predefined:       convPredefined,
    showModal:        showConv,
    activating:       convActivating,
    error:            convError,
    activateConvention,
    recheckStatus,
  } = useConventionGuard();

  const [tab,         setTab]         = useState<'nouveau' | 'historique'>('nouveau');
  const [step,        setStep]        = useState<1 | 2 | 3>(1);
  const [employees,   setEmployees]   = useState<Employee[]>([]);
  const [empLoad,     setEmpLoad]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [emp,         setEmp]         = useState<Employee | null>(null);
  const [form,        setForm]        = useState({
    ruptureType: '', ruptureDate: new Date().toISOString().split('T')[0],
    noticePeriodDays: 30, noticeWorked: false, noticeWaived: false,
    employerInitiated: true, congesPrisAnneeEnCours: 0,
    autresSommesDues: 0, autresSommesDetail: '', causeDetail: '', causeLabel: '',
  });
  const [calc,        setCalc]        = useState<Calc | null>(null);
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
  const calcRef  = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setEmpLoad(true);
    api.get<any>('/employees?status=ACTIVE&limit=200')
      .then(d => {
        const list = Array.isArray(d) ? d : (d.employees ?? d.data ?? d.items ?? d.content ?? []);
        setEmployees(list);
      })
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoad(false));
  }, []);

  const loadHist = useCallback(() => {
    setHistLoad(true);
    api.get<any>('/contract-rupture')
      .then(d => setHist(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => setHist([]))
      .finally(() => setHistLoad(false));
  }, []);

  useEffect(() => { if (tab === 'historique') loadHist(); }, [tab, loadHist]);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`
      .toLowerCase().includes(search.toLowerCase())
  );
  const anc = emp && form.ruptureDate ? mois(emp.hireDate, form.ruptureDate) : 0;
  const ri  = RT.find(r => r.v === form.ruptureType);
  const bt  = calc?.totaux.brutTotal ?? 0;
  const pct = (n: number, t: number) => t > 0 ? Math.round((n / t) * 100) : 0;

  async function doCalc() {
    if (!emp || !form.ruptureType) return;
    setCalcLoad(true); setCalcErr(null);
    try {
      const d = await api.post<Calc>('/contract-rupture/calculate', { employeeId: emp.id, ...form });
      if (form.ruptureType === 'LICENCIEMENT_ECONOMIQUE') {
        const p = await api.get<any>('/contract-rupture/pse-check');
        if ((p.count ?? 0) >= 4) setPse(true);
      }
      setCalc(d); setStep(2);
      setTimeout(() => calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (e: any) {
      setCalcErr(e.message ?? 'Erreur de calcul');
    } finally {
      setCalcLoad(false);
    }
  }

  async function doConfirm() {
    if (!emp) return;
    setConfirmLoad(true);
    try {
      const d = await api.post<any>('/contract-rupture', { employeeId: emp.id, ...form });
      setRid(d.ruptureId); setStep(3);
    } catch (e: any) {
      setCalcErr(e.message ?? 'Erreur');
    } finally {
      setConfirmLoad(false);
    }
  }

  async function loadDoc(type: 'lettre' | 'certificat' | 'cnss') {
    if (!rid) return;
    setActiveDoc(type); setDocLoad(true);
    try {
      const r = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/contract-rupture/${rid}/document/${type}`,
        { credentials: 'include' }
      );
      setDocHtml(await r.text());
    } catch {
      setDocHtml('<p style="padding:20px;color:#ef4444">Erreur</p>');
    } finally {
      setDocLoad(false);
    }
  }

  function reset() {
    setStep(1); setCalc(null); setCalcErr(null); setEmp(null);
    setRid(null); setActiveDoc(null); setDocHtml(null); setPse(false);
    setForm(f => ({ ...f, ruptureType: '', causeDetail: '', causeLabel: '' }));
  }

  // ── Lignes du décompte STC ──
  const decompteLines = calc ? [
    {
      l: calc.eligibilite.isRetraite ? 'Indemnité de retraite' : 'Indemnité de licenciement',
      sub: calc.indemnites.licenciementDetail,
      v: calc.indemnites.licenciement,
      t: 'Exonérée ITS', tv: 's' as const,
      show: calc.indemnites.licenciement > 0,
    },
    {
      l: `Congés payés (${Math.round(calc.indemnites.congesDays * 10) / 10} j — ${calc.indemnites.congesPris} j pris)`,
      v: calc.indemnites.conges,
      t: 'Art. 127 CT', tv: 'i' as const,
      show: true,
    },
    {
      l: 'Gratification proratisée',
      sub: calc.indemnites.gratificationDetail,
      v: calc.indemnites.gratification,
      t: 'Légale obligatoire', tv: 'i' as const,
      show: calc.eligibilite.aGratification,
    },
    {
      l: `Préavis compensatoire (${calc.preavis.dureeJours} j) — par ${calc.preavis.payePar}`,
      v: calc.indemnites.preavis,
      t: 'Imposable ITS', tv: 'w' as const,
      show: calc.indemnites.preavis > 0,
    },
    {
      l: 'Dernier salaire proratisé',
      v: calc.indemnites.dernierSalaire,
      show: calc.indemnites.dernierSalaire > 0,
    },
    ...(calc.indemnites.autresSommes > 0 ? [{
      l: form.autresSommesDetail || 'Autres sommes dues',
      v: calc.indemnites.autresSommes,
      show: true,
    }] : []),
  ].filter(r => r.show) : [];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">

      {showConv && (
        <ConvModal
          predefined={convPredefined}
          activating={convActivating}
          error={convError}
          onActivate={async (code) => {
            const ok = await activateConvention(code);
            return ok;
          }}
        />
      )}

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
          {convStatus?.hasConvention && <Bdg c={convStatus.conventionCode} v="i" />}
          <Link href="/pse" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-200 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-all shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            PSE
          </Link>
          <div className="flex bg-slate-800/60 rounded-xl p-0.5 gap-0.5 shrink-0">
            {(['nouveau', 'historique'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${tab === t ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-500 hover:text-slate-200'}`}>
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
                          {r.employee?.employeeNumber} · {RT.find(t => t.v === r.ruptureType)?.l ?? r.ruptureType} · {fmtD(r.ruptureDate)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-cyan-400">{fmt(r.totalNet)} FCFA</p>
                        <Bdg c={r.status} v={r.status === 'CONFIRME' ? 's' : 'd'} />
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
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                        return (
                          <button key={e.id} onClick={() => setEmp(e)}
                            className={`w-full p-3 rounded-xl text-left border transition-all ${isSel ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-800/40 border-white/5 hover:border-white/15 hover:bg-slate-800/60'}`}>
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{e.firstName} {e.lastName}</p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">{e.employeeNumber} · {e.position}</p>
                                {e.department && <p className="text-xs text-slate-600">{e.department.name}</p>}
                              </div>
                              <Bdg c={e.contractType} v="i" />
                            </div>
                            {isSel && form.ruptureDate && (
                              <div className="mt-2 pt-2 border-t border-cyan-500/20 text-xs text-cyan-400 font-medium">
                                {Math.floor(anc / 12)} ans {anc % 12} mois
                                {anc < 18 && <span className="text-amber-400 ml-2">— inf. à 18 mois</span>}
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

              {/* ✅ FIX : RuptureTypeSelector extrait en composant séparé */}
              <Crd t="Nature de la rupture" ch={
                <RuptureTypeSelector
                  ruptureType={form.ruptureType}
                  onChange={v => setForm(f => ({ ...f, ruptureType: v }))}
                />
              } />

              <Crd t="Dates et préavis" ch={
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    <div>
                      <Fl l="Date de rupture" req />
                      <input type="date" value={form.ruptureDate}
                        onChange={e => setForm(f => ({ ...f, ruptureDate: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <Fl l="Préavis (jours)" />
                      <input type="number" min={0} value={form.noticePeriodDays}
                        onChange={e => setForm(f => ({ ...f, noticePeriodDays: +e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <Fl l="Congés pris (j)" />
                      <input type="number" min={0} max={26} value={form.congesPrisAnneeEnCours}
                        onChange={e => setForm(f => ({ ...f, congesPrisAnneeEnCours: +e.target.value }))}
                        className={inp} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Chk checked={form.noticeWorked} onChange={() => setForm(f => ({ ...f, noticeWorked: !f.noticeWorked }))} label="Préavis travaillé" />
                    <Chk checked={form.noticeWaived} onChange={() => setForm(f => ({ ...f, noticeWaived: !f.noticeWaived }))} label="Préavis dispensé" />
                    <Chk checked={form.employerInitiated} onChange={() => setForm(f => ({ ...f, employerInitiated: !f.employerInitiated }))} label="Initiative employeur" />
                  </div>
                </>
              } />

              <Crd t="Motif et compléments" ch={
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <Fl l="Libellé motif" />
                      <input value={form.causeLabel}
                        onChange={e => setForm(f => ({ ...f, causeLabel: e.target.value }))}
                        placeholder="Ex: Insuffisance professionnelle"
                        className={inp} />
                    </div>
                    <div>
                      <Fl l="Autres sommes (FCFA)" />
                      <input type="number" min={0} value={form.autresSommesDues}
                        onChange={e => setForm(f => ({ ...f, autresSommesDues: +e.target.value }))}
                        className={inp} />
                    </div>
                  </div>
                  <Fl l="Détail des faits" />
                  <textarea rows={3} value={form.causeDetail}
                    onChange={e => setForm(f => ({ ...f, causeDetail: e.target.value }))}
                    placeholder="Description circonstanciée..."
                    className={`${inp} resize-none`} />
                </>
              } />

              {calcErr && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{calcErr}</div>
              )}

              <button onClick={doCalc} disabled={!emp || !form.ruptureType || calcLoad}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${emp && form.ruptureType && !calcLoad ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                {calcLoad ? <><Sp /><span>Calcul en cours...</span></> : 'Calculer le solde de tout compte'}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 ── */}
        {tab === 'nouveau' && step === 2 && calc && (
          <div ref={calcRef} className="space-y-5">
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
              Modifier
            </button>

            {/* Bandeau employé */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Bdg c={ri?.l} v="i" />
                  <Bdg c={calc.meta.conventionCode} v="i" />
                  {!calc.meta.salaireConforme && <Bdg c="Salaire sous le minimum" v="w" />}
                </div>
                <p className="text-xl font-black tracking-tight">{calc.employee.nom}</p>
                <p className="text-xs text-slate-500 mt-1">{calc.employee.matricule} · {calc.employee.poste} · {calc.employee.contractType}</p>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-xs text-slate-500 mb-0.5">Ancienneté</p>
                <p className="text-2xl font-black text-cyan-400">{Math.floor(calc.employee.yearsOfService)} ans {calc.employee.monthsOfService % 12} mois</p>
                <p className="text-xs text-slate-600">{fmtD(calc.employee.hireDate)} → {fmtD(calc.employee.ruptureDate)}</p>
              </div>
            </div>

            {calc.alertes.map((a, i) => (
              <div key={i} className={`p-3 rounded-xl text-xs border ${a.startsWith('⚠') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>{a}</div>
            ))}

            {calc.eligibilite.raisons.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-900/60 border border-white/10 rounded-xl">
                {calc.eligibilite.raisons.map((r, i) => (
                  <span key={i} className={`text-xs font-medium ${r.startsWith('✅') ? 'text-emerald-400' : r.startsWith('❌') ? 'text-red-400' : 'text-slate-500'}`}>{r}</span>
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
                        {'sub' in r && r.sub && <p className="text-xs text-slate-600 mt-0.5 truncate">{r.sub as string}</p>}
                        {'t' in r && r.t && <Bdg c={r.t as string} v={(r as any).tv ?? 'd'} />}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{fmt(r.v)}</p>
                        <p className="text-xs text-slate-600">FCFA</p>
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    <div className="p-3 bg-slate-800/60 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Brut imposable</p>
                      <p className="text-lg font-bold">{fmt(calc.totaux.brutImposable)} <span className="text-xs text-slate-600">FCFA</span></p>
                      {calc.totaux.its > 0 && <p className="text-xs text-red-400 mt-0.5">ITS −{fmt(calc.totaux.its)} FCFA</p>}
                    </div>
                    <div className="p-3 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl">
                      <p className="text-xs text-cyan-500 uppercase tracking-wider font-bold mb-1">Total NET</p>
                      <p className="text-xl font-black text-cyan-400">{fmt(calc.totaux.net)} <span className="text-xs text-cyan-700">FCFA</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 text-right">Brut total : {fmt(bt)} · Exonéré : {fmt(calc.totaux.indemnitesExonerees)} FCFA</p>
                </div>
              } />

              <div className="space-y-4">
                {/* Répartition */}
                <Crd t="Répartition" ch={
                  <>
                    {[
                      { l: 'Licenciement',  v: calc.indemnites.licenciement,   c: 'bg-cyan-500'    },
                      { l: 'Congés',        v: calc.indemnites.conges,         c: 'bg-blue-500'    },
                      { l: 'Gratification', v: calc.indemnites.gratification,  c: 'bg-emerald-500' },
                      { l: 'Préavis',       v: calc.indemnites.preavis,        c: 'bg-amber-500'   },
                      { l: 'Dernier sal.',  v: calc.indemnites.dernierSalaire, c: 'bg-purple-500'  },
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
                      { l: 'Dernier brut', v: calc.salaires.dernierBrut  },
                      { l: 'Moy. 3 mois',  v: calc.salaires.avg3Mois    },
                      { l: 'Moy. 12 mois', v: calc.salaires.avg12Mois   },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex justify-between py-2 border-b border-white/5 last:border-0 text-xs">
                        <span className="text-slate-500">{l}</span>
                        <span className="text-slate-300 font-semibold">{fmt(v)} FCFA</span>
                      </div>
                    ))}
                  </>
                } />

                <Link href="/pse" className="flex items-center justify-between p-4 bg-slate-900/60 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all group">
                  <div>
                    <p className="text-xs font-bold text-slate-400 group-hover:text-purple-300">Plan de Sauvegarde de l&apos;Emploi</p>
                    <p className="text-xs text-slate-600">Art. 39 CT Congo · PSE</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-700 group-hover:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                </Link>
              </div>
            </div>

            {/* Documents */}
            <Crd t="Documents officiels" s={rid ? undefined : 'Disponibles après confirmation'} ch={
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
                  {([
                    { k: 'lettre'    as const, l: 'Lettre de notification', s: 'Art. 46 CT Congo'    },
                    { k: 'certificat'as const, l: 'Certificat de travail',  s: 'Exempt de timbre'    },
                    { k: 'cnss'      as const, l: 'Attestation CNSS',       s: "Cessation d'activité" },
                  ]).map(d => (
                    <button key={d.k} onClick={() => rid && loadDoc(d.k)} disabled={!rid}
                      className={`p-4 rounded-xl text-left border transition-all ${activeDoc === d.k ? 'bg-cyan-500/10 border-cyan-500/40' : rid ? 'bg-slate-800/40 border-white/5 hover:border-white/15' : 'bg-slate-800/20 border-white/5 opacity-40 cursor-not-allowed'}`}>
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
                        {activeDoc === 'lettre' ? 'Lettre' : activeDoc === 'certificat' ? 'Certificat' : 'CNSS'}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => iframeRef.current?.contentWindow?.print()} className="text-xs font-semibold text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg">Imprimer</button>
                        <button onClick={() => { setActiveDoc(null); setDocHtml(null); }} className="text-xs text-slate-500 border border-white/10 px-2.5 py-1 rounded-lg">&times;</button>
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
              <button onClick={doConfirm} disabled={confirmLoad}
                className={`px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${!confirmLoad ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                {confirmLoad ? <><Sp /><span>Enregistrement...</span></> : 'Confirmer et clôturer le contrat'}
              </button>
              <p className="text-xs text-slate-600 leading-relaxed">Met à jour le statut de l&apos;employé et enregistre la rupture.</p>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 ── */}
        {tab === 'nouveau' && step === 3 && calc && (
          <div className="max-w-xl mx-auto text-center py-12 px-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-emerald-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h2 className="text-xl font-black mb-2">Contrat clôturé</h2>
            <p className="text-slate-400 text-sm mb-6">
              Rupture de <strong className="text-slate-200">{calc.employee.nom}</strong> enregistrée avec succès.
              {rid && <span className="block text-xs text-slate-600 mt-1">{rid}</span>}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-6 text-left">
              {[
                { l: 'Total NET',    v: `${fmt(calc.totaux.net)} FCFA`,            c: 'text-cyan-400'   },
                { l: 'Ancienneté',   v: `${Math.floor(calc.employee.yearsOfService)} ans`, c: 'text-blue-400'   },
                { l: 'Convention',   v: calc.meta.conventionCode,                  c: 'text-indigo-400' },
                { l: 'Motif',        v: ri?.l ?? '—',                              c: 'text-slate-300'  },
              ].map(({ l, v, c }) => (
                <div key={l} className="bg-slate-800/60 border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-slate-600 uppercase tracking-wider mb-0.5">{l}</p>
                  <p className={`text-sm font-bold ${c} leading-snug`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 flex-wrap mb-6">
              {(['lettre', 'certificat', 'cnss'] as const).map(d => (
                <button key={d} onClick={() => loadDoc(d)} className="text-xs font-semibold text-slate-400 hover:text-slate-100 border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg transition-all">
                  {d === 'lettre' ? 'Lettre' : d === 'certificat' ? 'Certificat' : 'CNSS'}
                </button>
              ))}
            </div>
            {activeDoc && docHtml && (
              <div className="rounded-xl overflow-hidden border border-white/10 mb-5 text-left">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-800/60 border-b border-white/10">
                  <span className="text-xs font-bold text-slate-400">Document</span>
                  <button onClick={() => iframeRef.current?.contentWindow?.print()} className="text-xs font-semibold text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-lg">Imprimer</button>
                </div>
                <iframe ref={iframeRef} srcDoc={docHtml} className="w-full h-80 bg-white border-0" title="doc" />
              </div>
            )}
            <button onClick={reset} className="bg-slate-800 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-100 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              Nouvelle rupture de contrat
            </button>
          </div>
        )}

      </div>
    </div>
  );
}