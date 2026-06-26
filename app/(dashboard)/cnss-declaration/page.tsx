'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, Download, AlertTriangle, Clock,
  ChevronDown, RefreshCw, Shield, Users, Banknote,
  AlertCircle, Calendar, FileText, Building2,
  XCircle, Loader2, Eye, EyeOff, Receipt,
  ChevronRight, Info,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface EmployeeCnss {
  employeeId:              string;
  matricule:               string;
  cnssNumber:              string;
  nomFamille:              string;
  postNom:                 string;
  prenom:                  string;
  typeWorker:              1 | 2;
  departement:             string;
  poste:                   string;
  periodeLabelCnss:        string;
  brutGlobal:              number;
  salaireSOumisCotisation: number;
  // Cotisations séparées
  cnssSalarial:            number;   // 4%
  cnssEmployerPension:     number;   // 8%
  cnssEmployerFamily:      number;   // 10,03%
  cnssEmployerAccident:    number;   // 2,25%
  cnssEmployeurTotal:      number;   // total patronal
  cotisationDeclaree:      number;   // salarial + patronal
  // TUS séparés
  tusCnssAmount:           number;   // 5,475%
  tusDgiAmount:            number;   // 2,025%
  tusTotal:                number;   // 7,5%
  nbrJoursTravailles:      number;
  nbrHeuresTravaillees:    number;
  its:                     number;
  netSalary:               number;
  missingCnss:             boolean;
}

interface CnssTotals {
  effectif:             number;
  masseSalariale:       number;
  // Cotisations
  cnssSalarial:         number;
  cnssEmployerPension:  number;
  cnssEmployerFamily:   number;
  cnssEmployerAccident: number;
  cnssEmployeurTotal:   number;
  totalCotisations:     number;
  // TUS
  tusCnss:              number;
  tusDgi:               number;
  tusTotal:             number;
  // Versements
  totalAVerserCnss:     number;
  totalAVerserDgi:      number;
  totalJours:           number;
  // DGC
  dgcPensionBase:       number;
  dgcAtPfBase:          number;
  dgcCotisationPension: number;
  dgcCotisationAtPf:    number;
  dgcSousTot1:          number;
  dgcSousTot2:          number;
  dgcTotalAPayer:       number;
  // Pénalités
  isLate:               boolean;
  monthsLate:           number;
  latePenalty:          number;
  tusMajoration:        number;
  totalAvecPenalite:    number;
}

interface CnssRecap {
  company: { legalName: string; cnssNumber: string; cnssAffiliationNumber?: string } | null;
  month: number; year: number;
  employees: EmployeeCnss[];
  totals: CnssTotals;
  deadline: string;
  isLate: boolean;
  missingCnssCount: number;
}

interface HistoryItem {
  month: number; year: number; monthLabel: string;
  payrollCount: number; deadline: string;
  hasPaid: boolean; status: 'DÉCLARÉ'|'EN RETARD'|'À DÉCLARER'|'À VENIR';
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmt  = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n||0)) + ' FCFA';
const fmts = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n||0));

function StatCard({ label, value, sub, icon:Icon, color, alert }: {
  label:string; value:string; sub?:string;
  icon:React.ElementType; color:string; alert?:boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-5 border bg-white dark:bg-slate-900 transition-all ${
      alert
        ? 'border-red-300 dark:border-red-700 shadow-md shadow-red-100 dark:shadow-red-950/30'
        : 'border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md'
    }`}>
      {alert && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse"/>}
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white"/></div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
          <p className={`text-lg font-bold truncate ${alert?'text-red-600 dark:text-red-400':'text-slate-900 dark:text-white'}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function Badge({ status }:{ status: HistoryItem['status'] }) {
  const s: Record<string,string> = {
    'DÉCLARÉ':   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'EN RETARD': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    'À DÉCLARER':'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'À VENIR':   'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[status]}`}>{status}</span>;
}

// ─── PAGE ──────────────────────────────────────────────────────────────────
export default function CnssDeclarationPage() {
  const now = new Date();
  const [month,      setMonth]      = useState(now.getMonth()+1);
  const [year,       setYear]       = useState(now.getFullYear());
  const [recap,      setRecap]      = useState<CnssRecap|null>(null);
  const [history,    setHistory]    = useState<HistoryItem[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [histLoad,   setHistLoad]   = useState(false);
  const [error,      setError]      = useState('');
  const [tab,        setTab]        = useState<'dnms'|'dgc'|'historique'|'taux'>('dnms');
  const [showDetail, setShowDetail] = useState(true);
  const [xlsxLoad,   setXlsxLoad]  = useState(false);
  const [csvLoad,    setCsvLoad]    = useState(false);
  const [search,     setSearch]     = useState('');
  const [missingOnly,setMissingOnly]= useState(false);

  const loadRecap = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await api.get<CnssRecap>(`/cnss-declaration/recap?month=${month}&year=${year}`);
      setRecap(d);
    } catch(e:any) { setError(e.message||'Erreur chargement'); }
    finally { setLoading(false); }
  }, [month, year]);

  const loadHistory = useCallback(async () => {
    setHistLoad(true);
    try { setHistory(await api.get<HistoryItem[]>(`/cnss-declaration/history?year=${year}`)); }
    catch{} finally { setHistLoad(false); }
  }, [year]);

  useEffect(() => { loadRecap(); }, [loadRecap]);
  useEffect(() => { if(tab==='historique') loadHistory(); }, [tab, loadHistory]);

  const doExport = async (type:'excel'|'csv', setLoad:(v:boolean)=>void) => {
    if(!recap) return;
    setLoad(true);
    try {
      const mm   = String(month).padStart(2,'0');
      const slug = (recap.company?.legalName||'ENTREPRISE').replace(/\s+/g,'_').toUpperCase();
      const ext  = type==='excel'?'xlsx':'csv';
      const blob = await api.getBlob(`/cnss-declaration/export/${type==='excel'?'excel':'csv'}?month=${month}&year=${year}`);
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `CNSS_DNMS_${mm}_${year}_${slug}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch(e:any) { alert('❌ '+e.message); }
    finally { setLoad(false); }
  };

  const filtered = (recap?.employees??[]).filter(emp => {
    if(missingOnly && !emp.missingCnss) return false;
    const q = search.toLowerCase();
    return !q || emp.nomFamille.toLowerCase().includes(q)
              || emp.prenom.toLowerCase().includes(q)
              || emp.matricule.toLowerCase().includes(q);
  });

  const deadline = recap ? new Date(recap.deadline) : null;
  const isLate   = recap?.isLate ?? false;
  const mm       = String(month).padStart(2,'0');
  const affil    = recap?.company?.cnssAffiliationNumber || recap?.company?.cnssNumber || '—';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Shield className="w-6 h-6 text-white"/>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Déclaration CNSS</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">DNMS & Déclaration Globale — Congo Brazzaville</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select value={month} onChange={e=>setMonth(Number(e.target.value))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
            <div className="relative">
              <select value={year} onChange={e=>setYear(Number(e.target.value))}
                className="pl-3 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
            <button onClick={loadRecap}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?'animate-spin':''}`}/>
            </button>
          </div>
        </div>

        {isLate && (
          <div className="mt-4 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Déclaration en retard — {recap?.totals.monthsLate} mois
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                Date limite dépassée ({deadline?.toLocaleDateString('fr-FR')}).
                Pénalité estimée : <strong>{fmt(recap?.totals.latePenalty??0)}</strong> (10%/mois — Loi 004/86).
                Régularisez auprès de la CNSS dès que possible.
              </p>
            </div>
          </div>
        )}
        {(recap?.missingCnssCount??0) > 0 && (
          <div className="mt-3 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>{recap?.missingCnssCount} travailleur(s)</strong> sans N° CNSS —
              immatriculez-les avant de soumettre la déclaration.
            </p>
          </div>
        )}
      </div>

      {/* ── ONGLETS ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit">
        {([
          {id:'dnms',       label:'DNMS',                icon:FileText},
          {id:'dgc',        label:'Déclaration Globale', icon:Receipt},
          {id:'historique', label:'Historique',          icon:Calendar},
          {id:'taux',       label:'Taux & Règles',       icon:Info},
        ] as const).map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              tab===t.id
                ?'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                :'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ONGLET DNMS
      ════════════════════════════════════════════════════════════════ */}
      {tab==='dnms' && (
        <div className="space-y-6">
          {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin"/></div>}
          {error && !loading && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0"/>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {recap && !loading && (<>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Effectif déclaré" value={`${recap.totals.effectif} salariés`}
                sub={`${MONTHS[month-1]} ${year}`} icon={Users} color="bg-blue-600"/>
              <StatCard label="Masse salariale" value={fmt(recap.totals.masseSalariale)}
                sub="Brut global déplafonné" icon={Banknote} color="bg-indigo-600"/>
              <StatCard label="À verser → CNSS" value={fmt(recap.totals.totalAVerserCnss)}
                sub="Cotisations + TUS-CNSS" icon={Shield} color="bg-emerald-600" alert={isLate}/>
              <StatCard label="À verser → DGI" value={fmt(recap.totals.totalAVerserDgi)}
                sub="TUS part Trésor (2,025%)" icon={Building2} color="bg-violet-600"/>
            </div>

            {/* Détail cotisations + Versements */}
            <div className="grid md:grid-cols-2 gap-4">

              {/* Détail par branche */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <button onClick={()=>setShowDetail(!showDetail)}
                    className="flex items-center justify-between w-full">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Détail des cotisations
                    </h3>
                    {showDetail?<EyeOff className="w-4 h-4 text-slate-400"/>:<Eye className="w-4 h-4 text-slate-400"/>}
                  </button>
                </div>
                {showDetail && (
                  <div className="p-4 space-y-1 text-sm">
                    {/* Part salariale */}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-1 pb-2">Part salariale</p>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">Pension 4% (plaf. 1 200 000 FCFA)</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmts(recap.totals.cnssSalarial)}</span>
                    </div>
                    {/* Part patronale */}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-3 pb-2">Part patronale</p>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">Pension 8% (plaf. 1 200 000 FCFA)</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmts(recap.totals.cnssEmployerPension)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">Prest. Familiales 10,03% (plaf. 600 000 FCFA)</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmts(recap.totals.cnssEmployerFamily)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">Accidents Travail 2,25% (plaf. 600 000 FCFA)</span>
                      <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmts(recap.totals.cnssEmployerAccident)}</span>
                    </div>
                    {/* Total cotisations */}
                    <div className="flex justify-between items-center py-2 font-bold border-b-2 border-blue-200 dark:border-blue-800">
                      <span className="text-slate-800 dark:text-slate-200">Total cotisations CNSS (24,28%)</span>
                      <span className="text-blue-600 dark:text-blue-400 tabular-nums">{fmt(recap.totals.totalCotisations)}</span>
                    </div>
                    {/* TUS */}
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-3 pb-2">TUS — 7,5% patronal (sans plafond)</p>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-400">Part versée à la CNSS (5,475%)</span>
                      <span className="font-semibold text-violet-700 dark:text-violet-400 tabular-nums">{fmts(recap.totals.tusCnss)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600 dark:text-slate-400">Part versée à la DGI/Trésor (2,025%)</span>
                      <span className="font-semibold text-violet-700 dark:text-violet-400 tabular-nums">{fmts(recap.totals.tusDgi)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Versements */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-500"/>Récapitulatif versements
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${
                    isLate
                      ?'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                      :'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <Clock className={`w-4 h-4 ${isLate?'text-red-500':'text-emerald-500'}`}/>
                    <div>
                      <p className={`text-xs font-semibold ${isLate?'text-red-600 dark:text-red-400':'text-emerald-700 dark:text-emerald-400'}`}>
                        {isLate?'Date limite dépassée':'Dans les délais'}
                      </p>
                      <p className={`text-xs ${isLate?'text-red-500':'text-emerald-600 dark:text-emerald-500'}`}>
                        Dépôt avant le {deadline?.toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <div>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">→ CNSS</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">Cotisations (24,28%) + TUS (5,475%)</p>
                    </div>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400 tabular-nums">{fmt(recap.totals.totalAVerserCnss)}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-800/50">
                    <div>
                      <p className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wide">→ DGI / Trésor</p>
                      <p className="text-xs text-violet-600 dark:text-violet-500">TUS part Trésor (2,025%)</p>
                    </div>
                    <p className="text-lg font-bold text-violet-700 dark:text-violet-400 tabular-nums">{fmt(recap.totals.totalAVerserDgi)}</p>
                  </div>
                  {isLate && (
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800">
                      <div>
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">Majoration retard</p>
                        <p className="text-xs text-red-500">{recap.totals.monthsLate} mois × 10%</p>
                      </div>
                      <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{fmt(recap.totals.latePenalty)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boutons export */}
            <div className="flex flex-wrap gap-3">
              <button onClick={()=>doExport('excel',setXlsxLoad)} disabled={xlsxLoad||recap.employees.length===0}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 transition-all">
                {xlsxLoad?<Loader2 className="w-4 h-4 animate-spin"/>:<FileSpreadsheet className="w-4 h-4"/>}
                Exporter Excel (DNMS + TUS + DGC)
              </button>
              <button onClick={()=>doExport('csv',setCsvLoad)} disabled={csvLoad||recap.employees.length===0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl shadow-sm transition-all">
                {csvLoad?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}
                Exporter CSV (e-déclaration)
              </button>
              <a href="https://edeclaration.cnss.cg" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/30 transition-all">
                <ChevronRight className="w-4 h-4"/>Portail e-Déclaration CNSS
              </a>
            </div>

            {/* Tableau nominatif — tous les champs séparés */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500"/>
                  Liste nominative — {filtered.length} travailleur(s)
                </h3>
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}
                    className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-44"/>
                  {recap.missingCnssCount>0 && (
                    <button onClick={()=>setMissingOnly(!missingOnly)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        missingOnly?'bg-amber-500 border-amber-500 text-white':'border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
                      }`}>
                      <AlertCircle className="w-3 h-3"/>Sans CNSS ({recap.missingCnssCount})
                    </button>
                  )}
                </div>
              </div>

              {recap.employees.length===0 ? (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3"/>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aucun bulletin validé pour {MONTHS[month-1]} {year}</p>
                  <p className="text-xs text-slate-400 mt-1">Générez et validez les bulletins de ce mois avant la déclaration.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        {/* Identité */}
                        <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Matricule</th>
                        <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">N° CNSS</th>
                        <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Noms</th>
                        <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Post noms</th>
                        <th className="px-3 py-3 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Prénoms</th>
                        <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                        {/* Salaires */}
                        <th className="px-3 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Brut global</th>
                        <th className="px-3 py-3 text-right font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sal. soumis</th>
                        {/* Cotisations séparées */}
                        <th className="px-3 py-3 text-right font-semibold text-blue-500 uppercase tracking-wider whitespace-nowrap">Sal. 4%</th>
                        <th className="px-3 py-3 text-right font-semibold text-emerald-600 uppercase tracking-wider whitespace-nowrap">Pat. Pen. 8%</th>
                        <th className="px-3 py-3 text-right font-semibold text-emerald-600 uppercase tracking-wider whitespace-nowrap">Pat. Fam. 10,03%</th>
                        <th className="px-3 py-3 text-right font-semibold text-emerald-600 uppercase tracking-wider whitespace-nowrap">Pat. AT 2,25%</th>
                        <th className="px-3 py-3 text-right font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap bg-slate-100 dark:bg-slate-800">Total Cotis.</th>
                        {/* TUS séparés */}
                        <th className="px-3 py-3 text-right font-semibold text-violet-500 uppercase tracking-wider whitespace-nowrap">TUS CNSS 5,475%</th>
                        <th className="px-3 py-3 text-right font-semibold text-violet-500 uppercase tracking-wider whitespace-nowrap">TUS DGI 2,025%</th>
                        <th className="px-3 py-3 text-right font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider whitespace-nowrap bg-violet-50 dark:bg-violet-950/30">Total TUS 7,5%</th>
                        {/* Jours */}
                        <th className="px-3 py-3 text-center font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Jours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((emp, idx) => (
                        <tr key={emp.employeeId}
                          className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${emp.missingCnss?'bg-amber-50/50 dark:bg-amber-950/10':''}`}>
                          <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">{emp.matricule}</td>
                          <td className="px-3 py-2.5">
                            {emp.cnssNumber
                              ? <span className="font-mono text-slate-700 dark:text-slate-300">{emp.cnssNumber}</span>
                              : <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle className="w-3 h-3"/>Manquant</span>}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white whitespace-nowrap">{emp.nomFamille}</td>
                          <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{emp.postNom||'—'}</td>
                          <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{emp.prenom}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`px-1.5 py-0.5 rounded-full font-semibold ${
                              emp.typeWorker===2
                                ?'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                :'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {emp.typeWorker===2?'Stag.':'Trav.'}
                            </span>
                          </td>
                          {/* Salaires */}
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">{fmts(emp.brutGlobal)}</td>
                          <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">{fmts(emp.salaireSOumisCotisation)}</td>
                          {/* Cotisations séparées */}
                          <td className="px-3 py-2.5 text-right text-blue-600 dark:text-blue-400 font-semibold tabular-nums whitespace-nowrap">{fmts(emp.cnssSalarial)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{fmts(emp.cnssEmployerPension)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{fmts(emp.cnssEmployerFamily)}</td>
                          <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{fmts(emp.cnssEmployerAccident)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap bg-slate-50 dark:bg-slate-800/40">{fmts(emp.cotisationDeclaree)}</td>
                          {/* TUS séparés */}
                          <td className="px-3 py-2.5 text-right text-violet-600 dark:text-violet-400 tabular-nums whitespace-nowrap">{fmts(emp.tusCnssAmount)}</td>
                          <td className="px-3 py-2.5 text-right text-violet-600 dark:text-violet-400 tabular-nums whitespace-nowrap">{fmts(emp.tusDgiAmount)}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-violet-700 dark:text-violet-300 tabular-nums whitespace-nowrap bg-violet-50 dark:bg-violet-950/20">{fmts(emp.tusTotal)}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-400">{emp.nbrJoursTravailles}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                        <td colSpan={6} className="px-3 py-3 font-bold text-white text-xs uppercase tracking-wider">
                          TOTAL — {recap.totals.effectif} travailleur(s)
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-white tabular-nums whitespace-nowrap">{fmts(recap.totals.masseSalariale)}</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-300 tabular-nums whitespace-nowrap">
                          {fmts(recap.employees.reduce((s,e)=>s+e.salaireSOumisCotisation,0))}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-blue-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.cnssSalarial)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.cnssEmployerPension)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.cnssEmployerFamily)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.cnssEmployerAccident)}</td>
                        <td className="px-3 py-3 text-right font-bold text-white tabular-nums whitespace-nowrap">{fmts(recap.totals.totalCotisations)}</td>
                        <td className="px-3 py-3 text-right font-bold text-violet-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.tusCnss)}</td>
                        <td className="px-3 py-3 text-right font-bold text-violet-300 tabular-nums whitespace-nowrap">{fmts(recap.totals.tusDgi)}</td>
                        <td className="px-3 py-3 text-right font-bold text-violet-200 tabular-nums whitespace-nowrap">{fmts(recap.totals.tusTotal)}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-300">{recap.totals.totalJours}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>)}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ONGLET DGC
      ════════════════════════════════════════════════════════════════ */}
      {tab==='dgc' && (
        <div className="max-w-2xl">
          {!recap && <p className="text-sm text-slate-500">Sélectionnez un mois pour charger les données.</p>}
          {recap && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
              <div className="p-4 bg-blue-700 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-300">CNSS Congo — Direction du Recouvrement</p>
                <h3 className="font-bold text-lg mt-0.5">DÉCLARATION GLOBALE DE COTISATION</h3>
                <p className="text-xs text-blue-200">Service Cotisants</p>
              </div>
              <div className="p-5 space-y-4 text-sm">
                {/* Identification */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Raison Sociale</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{recap.company?.legalName||'—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">N° Affiliation CNSS</p>
                    <p className="font-semibold font-mono text-slate-900 dark:text-white">{affil}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Période</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{mm} / {year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase">Effectif</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{recap.totals.effectif} salarié(s)</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="font-semibold">Salaire Brut déplafonné</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">{fmt(recap.totals.masseSalariale)}</span>
                </div>

                {/* ST1 — TUS */}
                <div className="border border-violet-200 dark:border-violet-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300 font-semibold text-xs uppercase tracking-wider">
                    Sous-Total (1) — TUS (Taxe Unique sur Salaires — 7,5%)
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">TUS 7,5% × brut déplafonné</span>
                      <span className="font-medium tabular-nums">{fmt(recap.totals.tusTotal)}</span>
                    </div>
                    <div className="ml-4 space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>↳ Part CNSS (5,475%)</span>
                        <span className="tabular-nums">{fmts(recap.totals.tusCnss)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>↳ Part DGI (2,025%)</span>
                        <span className="tabular-nums">{fmts(recap.totals.tusDgi)} FCFA</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Majoration retard ({recap.totals.monthsLate} mois × 10%)</span>
                      <span className="tabular-nums">{fmts(recap.totals.tusMajoration)} FCFA</span>
                    </div>
                    <div className="flex justify-between font-bold text-violet-700 dark:text-violet-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>SOUS-TOTAL (1)</span>
                      <span className="tabular-nums">{fmt(recap.totals.dgcSousTot1)}</span>
                    </div>
                  </div>
                </div>

                {/* ST2 — Cotisations */}
                <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold text-xs uppercase tracking-wider">
                    Sous-Total (2) — Cotisations Régimes CNSS
                  </div>
                  <div className="p-3 space-y-2">
                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Assurance Pensions — {fmts(recap.totals.dgcPensionBase)} F × 12%
                        </span>
                        <span className="font-medium tabular-nums">{fmt(recap.totals.dgcCotisationPension)}</span>
                      </div>
                      <div className="ml-4 space-y-0.5 text-xs text-slate-400 mt-1">
                        <div className="flex justify-between">
                          <span>↳ Salarié 4%</span>
                          <span className="tabular-nums">{fmts(recap.totals.cnssSalarial)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>↳ Employeur 8%</span>
                          <span className="tabular-nums">{fmts(recap.totals.cnssEmployerPension)} FCFA</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          AT & Prest. Familiales — {fmts(recap.totals.dgcAtPfBase)} F × 12,28%
                        </span>
                        <span className="font-medium tabular-nums">{fmt(recap.totals.dgcCotisationAtPf)}</span>
                      </div>
                      <div className="ml-4 space-y-0.5 text-xs text-slate-400 mt-1">
                        <div className="flex justify-between">
                          <span>↳ Prest. Familiales 10,03%</span>
                          <span className="tabular-nums">{fmts(recap.totals.cnssEmployerFamily)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>↳ Accidents Travail 2,25%</span>
                          <span className="tabular-nums">{fmts(recap.totals.cnssEmployerAccident)} FCFA</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Majoration retard ({recap.totals.monthsLate} mois × 10%)</span>
                      <span className="tabular-nums">{fmts(recap.totals.latePenalty)} FCFA</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400"><span>Pénalité</span><span>—</span></div>
                    <div className="flex justify-between text-xs text-slate-400"><span>Déduction sur avis de crédit</span><span>—</span></div>
                    <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>SOUS-TOTAL (2)</span>
                      <span className="tabular-nums">{fmt(recap.totals.dgcSousTot2)}</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL */}
                <div className="flex justify-between items-center p-4 bg-slate-900 dark:bg-slate-950 rounded-xl text-white">
                  <span className="font-bold text-base uppercase tracking-wide">TOTAL À PAYER (1 + 2)</span>
                  <span className="text-2xl font-bold text-emerald-400 tabular-nums">{fmt(recap.totals.dgcTotalAPayer)}</span>
                </div>
                <p className="text-xs text-slate-400 italic text-center">
                  NB : Joindre la liste nominative ou télédéclarer sur edeclaration.cnss.cg
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ONGLET HISTORIQUE
      ════════════════════════════════════════════════════════════════ */}
      {tab==='historique' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Suivi déclarations {year}</h2>
            {histLoad && <Loader2 className="w-4 h-4 text-blue-500 animate-spin"/>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MONTHS.map((label, idx) => {
              const item    = history.find(h=>h.month===idx+1);
              const status  = item?.status ?? 'À VENIR';
              const isCurr  = idx+1===month;
              const borders: Record<string,string> = {
                'DÉCLARÉ':   'border-emerald-300 dark:border-emerald-700',
                'EN RETARD': 'border-red-300 dark:border-red-700',
                'À DÉCLARER':'border-amber-300 dark:border-amber-700',
                'À VENIR':   'border-slate-200 dark:border-slate-700',
              };
              const bgs: Record<string,string> = {
                'DÉCLARÉ':   'bg-emerald-50 dark:bg-emerald-950/30',
                'EN RETARD': 'bg-red-50 dark:bg-red-950/30',
                'À DÉCLARER':'bg-amber-50 dark:bg-amber-950/30',
                'À VENIR':   'bg-white dark:bg-slate-900',
              };
              return (
                <button key={idx} onClick={()=>{setMonth(idx+1);setTab('dnms');}}
                  className={`p-3 rounded-xl border transition-all text-left hover:shadow-md ${borders[status]} ${bgs[status]} ${isCurr?'ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-950':''}`}>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{label}</p>
                  <Badge status={status}/>
                  {item && item.payrollCount>0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.payrollCount} bulletins</p>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {[{l:'Déclaré',c:'bg-emerald-500'},{l:'En retard',c:'bg-red-500'},{l:'À déclarer',c:'bg-amber-500'},{l:'À venir',c:'bg-slate-400'}].map(x=>(
              <div key={x.l} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className={`w-2.5 h-2.5 rounded-full ${x.c}`}/>{x.l}
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">📅 Rappel CNSS Congo</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              Déclaration et paiement <strong>avant le 15 du mois suivant</strong>.
              Tout retard entraîne une <strong>majoration de 10% par mois</strong> (Loi 004/86 du 25/02/1986).
              Télédéclaration sur <strong>edeclaration.cnss.cg</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ONGLET TAUX & RÈGLES
      ════════════════════════════════════════════════════════════════ */}
      {tab==='taux' && (
        <div className="space-y-5 max-w-3xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-blue-600 text-white">
              <h3 className="font-bold text-base">Taux de cotisations CNSS — Congo Brazzaville</h3>
              <p className="text-xs text-blue-200 mt-1">Source : cnss.cg — En vigueur</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  {['Branche','Part salarié','Part employeur','Total','Plafond/mois'].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {b:'Assurance Pensions',              sal:'4%', pat:'8%',    tot:'12%',    p:'1 200 000 FCFA'},
                  {b:'Prestations Familiales',          sal:'—',  pat:'10,03%',tot:'10,03%', p:'600 000 FCFA'},
                  {b:'Accidents du Travail & Maladies', sal:'—',  pat:'2,25%', tot:'2,25%',  p:'600 000 FCFA'},
                ].map((r,i)=>(
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{r.b}</td>
                    <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-center">{r.sal}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-center">{r.pat}</td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">{r.tot}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.p}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                  <td className="px-4 py-3 font-bold text-white">TOTAL CNSS</td>
                  <td className="px-4 py-3 font-bold text-blue-300 text-center">4%</td>
                  <td className="px-4 py-3 font-bold text-emerald-300 text-center">20,28%</td>
                  <td className="px-4 py-3 font-bold text-white text-center">24,28%</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-sm">
            <div className="p-4 bg-violet-600 text-white">
              <h3 className="font-bold text-base">TUS — Taxe Unique sur les Salaires (7,5%)</h3>
              <p className="text-xs text-violet-200 mt-1">100% patronal — Sans plafond — Base = brut global déplafonné</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  {d:'Part versée à la CNSS',       t:'5,475%', i:'Versée avec les cotisations mensuelles'},
                  {d:'Part versée à la DGI/Trésor', t:'2,025%', i:'Versée séparément à la Direction Générale des Impôts'},
                ].map((r,i)=>(
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-800 ${i%2===0?'bg-white dark:bg-slate-900':'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.d}</td>
                    <td className="px-4 py-3 font-bold text-violet-600 dark:text-violet-400 text-center">{r.t}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.i}</td>
                  </tr>
                ))}
                <tr className="bg-slate-900 dark:bg-slate-950 border-t-2 border-slate-700">
                  <td className="px-4 py-3 font-bold text-white">TOTAL TUS</td>
                  <td className="px-4 py-3 font-bold text-violet-300 text-center">7,5%</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">Base = brut global déplafonné</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4"/>Règles essentielles
            </p>
            <div className="space-y-2">
              {[
                {e:'📅',t:'Délai',d:'Déclaration et paiement avant le 15 du mois suivant.'},
                {e:'⚠️',t:'Retard',d:'Majoration 10%/mois sur cotisations et TUS (Loi 004/86 du 25/02/1986).'},
                {e:'💰',t:'Plafond',d:'Pension : min(brut, 1 200 000 FCFA). AT/PF : min(brut, 600 000 FCFA). TUS : sans plafond.'},
                {e:'📋',t:'Post nom',d:'Ex: "MBEMBA NKOSI Jean-Pierre" → Noms=MBEMBA, Post noms=NKOSI, Prénoms=Jean-Pierre.'},
                {e:'🔢',t:'N° CNSS',d:'Obligatoire pour chaque travailleur dans la DNMS. Stagiaires = Type 2.'},
                {e:'🌐',t:'e-déclaration',d:'edeclaration.cnss.cg — le CSV exporté est compatible.'},
              ].map((r,i)=>(
                <div key={i} className="flex gap-3 p-2.5 bg-white dark:bg-slate-800/40 rounded-xl">
                  <span>{r.e}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{r.t} </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{r.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}