'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wallet, Clock, Calendar, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Loader2, Shield,
  FileText, ChevronRight, BadgeCheck,
  Receipt, Landmark, FileX, FilePlus, AlertTriangle,
  LayoutDashboard, ClipboardList, DollarSign,
  UsersRound, UmbrellaOff, BookOpen, Building2, UserCircle, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import YearlyEvolutionPanel from '@/components/YearlyEvolutionPanel';

const C = { sky:'#0EA5E9', emerald:'#10B981', amber:'#F59E0B', rose:'#EF4444', violet:'#8B5CF6' };
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fcfa = (v:number) => v>=1_000_000 ? `${(v/1_000_000).toFixed(2)} M FCFA` : `${Math.round(v).toLocaleString('fr-FR')} FCFA`;

function KpiCard({ icon:Icon, label, value, sub, color=C.sky, trend, trendUp }:any) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--border)] shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:color+'20'}}>
          <Icon size={20} style={{color}} />
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-1 ${trendUp?'text-emerald-500':'text-red-500'}`}>
            {trendUp?<TrendingUp size={12}/>:<TrendingDown size={12}/>} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-[var(--text)] tracking-tight">{value}</p>
        <p className="text-xs font-bold text-[var(--text-muted)] mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({children}:any) {
  return <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">{children}</h2>;
}

export default function RapportsPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const now = new Date();
  const [month,setMonth] = useState(now.getMonth()+1);
  const [year,setYear]   = useState(now.getFullYear());

  const [overview,  setOverview]  = useState<any>(null);
  const [payroll,   setPayroll]   = useState<any>(null);
  const [overtime,  setOvertime]  = useState<any>(null);
  const [leaves,    setLeaves]    = useState<any>(null);
  const [cnss,      setCnss]      = useState<any>(null);
  const [trials,    setTrials]    = useState<any[]>([]);
  const [expiring,  setExpiring]  = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cnssLoad,  setCnssLoad]  = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [ov,pay,ot,lv,ct,exp] = await Promise.allSettled([
          api.get('/reports/overview'),
          api.get('/reports/payroll'),
          api.get(`/reports/overtime?month=${month}&year=${year}`),
          api.get('/reports/leaves'),
          api.get('/contracts/trials'),
          api.get('/contracts/expiring'),
        ]);
        if(ov.status==='fulfilled')  setOverview(ov.value);
        if(pay.status==='fulfilled') setPayroll(pay.value);
        if(ot.status==='fulfilled')  setOvertime(ot.value);
        if(lv.status==='fulfilled')  setLeaves(lv.value);
        if(ct.status==='fulfilled')  setTrials(Array.isArray((ct as any).value)?(ct as any).value:[]);
        if(exp.status==='fulfilled') setExpiring(Array.isArray((exp as any).value)?(exp as any).value:[]);
      } catch(e){console.error(e);}
      finally{setIsLoading(false);}
    };
    load();
  },[]);

  useEffect(() => {
    const loadCnss = async () => {
      setCnssLoad(true);
      try { const d = await api.get(`/cnss-declaration/recap?month=${month}&year=${year}`); setCnss(d); }
      catch { setCnss(null); }
      finally { setCnssLoad(false); }
    };
    loadCnss();
  },[month,year]);

  if(isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[var(--brand)]" size={36}/>
    </div>
  );

  const masseBrute   = Number(overview?.payrollTotal||0);
  const effectif     = Number(overview?.headcount||0);
  const congesActifs = Number(overview?.activeLeaves||0);
  const salaryTrend  = overview?.salaryTrend||[];
  const cnssTotal    = cnss?.totals;
  const otSummary    = overtime?.summary;
  const otByEmp      = overtime?.byEmployee||[];
  const monthLabel   = MONTHS[month-1]+' '+year;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 px-4">

      {/* EN-TÊTE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">Tableau de bord RH</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Vue d'ensemble · Norme OHADA · Droit du travail Congo</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 shadow-sm">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Période :</span>
          <select value={month} onChange={e=>setMonth(+e.target.value)} className="bg-transparent font-bold text-[var(--text)] text-sm outline-none cursor-pointer">
            {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e=>setYear(+e.target.value)} className="bg-transparent font-bold text-[var(--text)] text-sm outline-none cursor-pointer">
            {[year-1,year,year+1].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* NAV */}
      <RapportsSubNav active="/rapports" />

      {/* ═══ KPI GLOBAUX ═══════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>Indicateurs globaux</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users}   label="Effectif actif"        value={effectif.toString()}      color={C.sky}     sub="Salariés en activité"/>
          <KpiCard icon={Wallet}  label="Masse salariale brute" value={fcfa(masseBrute)}          color={C.emerald} sub={`Cpte 661100 · ${monthLabel}`}/>
          <KpiCard icon={Calendar}label="Congés en cours"       value={congesActifs.toString()}  color={C.amber}   sub="Approuvés actifs"/>
          <KpiCard icon={Clock}   label="H. Sup ce mois"        value={otSummary?.totalHours?`${Number(otSummary.totalHours).toFixed(0)}h`:'—'} color={C.violet} sub={otSummary?.totalAmount||'—'}/>
        </div>
      </div>

      {/* ═══ CNSS MENSUELLE ════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>Déclaration CNSS — {monthLabel} · Taux officiels cnss.cg</SectionTitle>
        {cnssLoad ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[var(--brand)]" size={28}/></div>
        ) : !cnssTotal ? (
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
            <Landmark size={36} className="mx-auto mb-3 opacity-30"/>
            <p className="font-medium">Aucun bulletin généré pour {monthLabel}</p>
            <p className="text-sm mt-1">Générez d'abord les bulletins de paie pour ce mois.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Part salariale — Cpte 431100 */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center"><Users size={16} className="text-[var(--brand)]"/></div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">Part Salariale</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Compte 431100 · 4% plafonné</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Retraite salarié (4%)</span><span className="font-bold">{Math.round(cnssTotal.cnssSalarial).toLocaleString('fr-FR')} FCFA</span></div>
                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2"><span className="font-bold text-[var(--text)]">Total salarié</span><span className="font-black text-[var(--brand)]">{Math.round(cnssTotal.cnssSalarial).toLocaleString('fr-FR')} FCFA</span></div>
              </div>
            </div>

            {/* Part patronale — Cpte 664100 / 431300 */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-2-soft)] flex items-center justify-center"><Shield size={16} className="text-[var(--accent-2)]"/></div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">Part Patronale</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Cptes 664100 / 431300 · 20,28% max</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  {label:'Retraite employeur (8%)',     val:cnssTotal.cnssEmployerPension},
                  {label:'Prest. familiales (10,03%)',  val:cnssTotal.cnssEmployerFamily},
                  {label:'Accidents travail (2,25%)',   val:cnssTotal.cnssEmployerAccident},
                ].map(r=>(
                  <div key={r.label} className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>{r.label}</span><span className="font-semibold text-[var(--text)]">{Math.round(r.val).toLocaleString('fr-FR')}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2"><span className="font-bold text-[var(--text)]">Total patronal</span><span className="font-black text-[var(--accent-2)]">{Math.round(cnssTotal.cnssEmployeurTotal).toLocaleString('fr-FR')} FCFA</span></div>
              </div>
            </div>

            {/* TUS + Totaux — Cpte 641300 */}
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"><Receipt size={16} className="text-amber-600"/></div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">TUS + Récapitulatif</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Compte 641300 · 7,5% brut</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>TUS-DGI (2,025%)</span><span className="font-semibold">{Math.round(cnssTotal.tusDgi).toLocaleString('fr-FR')}</span></div>
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>TUS-CNSS (5,475%)</span><span className="font-semibold">{Math.round(cnssTotal.tusCnss).toLocaleString('fr-FR')}</span></div>
                <div className="border-t border-[var(--border)] pt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Total CNSS global</span><span className="font-bold">{Math.round(cnssTotal.totalCotisations).toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-[var(--text)]">À verser CNSS</span><span className="font-black text-emerald-600">{Math.round(cnssTotal.totalAVerserCnss).toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="font-bold text-[var(--text)]">À verser DGI (TUS)</span><span className="font-black text-amber-600">{Math.round(cnssTotal.totalAVerserDgi).toLocaleString('fr-FR')} FCFA</span></div>
                </div>
              </div>
            </div>

            {/* Alerte NIU */}
            {cnss?.totals?.missingCnss>0 && (
              <div className="lg:col-span-3 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0"/>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{cnss.totals.missingCnss} salarié(s) sans numéro CNSS</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">La déclaration nominative DNMS sera incomplète. Complétez les fiches employés avant dépôt.</p>
                </div>
                <button onClick={()=>router.push(bp('/cnss-declaration'))} className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-400 transition-colors">Voir</button>
              </div>
            )}

            <div className="lg:col-span-3 flex justify-end">
              <button onClick={()=>router.push(bp('/cnss-declaration'))} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-bold hover:opacity-90 transition-colors shadow-sm">
                <FileText size={15}/> Déclaration CNSS complète <ChevronRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ HEURES SUPPLÉMENTAIRES ════════════════════════════════════════ */}
      <div>
        <SectionTitle>Heures supplémentaires — {monthLabel} · Décret 78-360</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Récapitulatif</p>
            {[
              {label:'Total heures',       val:otSummary?`${Number(otSummary.totalHours).toFixed(1)} h`:'—',                          color:C.violet},
              {label:'Coût total H.Sup',   val:otSummary?.totalAmount||'—',                                                            color:C.amber},
              {label:'Salariés concernés', val:`${otSummary?.employeesWithOvertime||0} / ${effectif}`,                                  color:C.sky},
            ].map(row=>(
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--text-muted)]">{row.label}</span>
                <span className="font-bold" style={{color:row.color}}>{row.val}</span>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-[var(--accent-2-soft)] border border-[var(--accent-2)]/30">
              <p className="text-[11px] font-bold text-[var(--accent-2)] mb-1">Barème légal Congo</p>
              <div className="grid grid-cols-2 gap-x-3 text-[10px] text-[var(--text-muted)]">
                <span>41–48h → +10%</span><span>49–54h → +25%</span>
                <span>55–60h → +50%</span><span>&gt;60h → +100%</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
              <p className="text-sm font-bold text-[var(--text)]">Détail par salarié</p>
            </div>
            {otByEmp.length===0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
                <Clock size={32} className="mb-2 opacity-30"/>
                <p className="text-sm">Aucune heure supplémentaire ce mois</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-2)]/50 text-xs font-bold text-[var(--text-muted)] uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Salarié</th>
                      <th className="px-3 py-3 text-center">+10%</th>
                      <th className="px-3 py-3 text-center">+25%</th>
                      <th className="px-3 py-3 text-center">+50%</th>
                      <th className="px-3 py-3 text-center">+100%</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {otByEmp.slice(0,12).map((emp:any,i:number)=>(
                      <tr key={i} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-[var(--text)] text-sm">{emp.name||emp.employeeName||'—'}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-[var(--text-muted)]">{emp.overtime10?`${emp.overtime10}h`:'—'}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-[var(--text-muted)]">{emp.overtime25?`${emp.overtime25}h`:'—'}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-[var(--text-muted)]">{emp.overtime50?`${emp.overtime50}h`:'—'}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-[var(--text-muted)]">{emp.overtime100?`${emp.overtime100}h`:'—'}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[var(--accent-2)]">{emp.amount?Math.round(emp.amount).toLocaleString('fr-FR')+' F':'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ CONGÉS ══════════════════════════════════════════════════════ */}
      <div>
        <SectionTitle>Congés — Code du travail Congo (art. 113) · Cpte 4281</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          {(leaves?.kpi||[{label:'Total demandes',value:'—'},{label:'Solde moyen',value:'—'}]).map((kpi:any,i:number)=>(
            <div key={i} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <p className="text-2xl font-black text-[var(--text)]">{kpi.value}</p>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>
        {leaves?.distribution?.length>0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {leaves.distribution.map((d:any,i:number)=>(
              <div key={i} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] px-4 py-2 flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--text-muted)]">{d.name}</span>
                <span className="text-sm font-black text-[var(--text)]">{d.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <button onClick={()=>router.push(bp('/rapports/analyse-conges'))} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
            Analyse détaillée <ChevronRight size={14}/>
          </button>
        </div>
      </div>

      {/* ═══ CONTRATS & RUPTURES ════════════════════════════════════════ */}
      <div>
        <SectionTitle>Contrats &amp; Ruptures · Code du travail Congo</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Périodes d'essai */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} className="text-[var(--brand)]"/>
                <p className="text-sm font-bold text-[var(--text)]">Périodes d'essai actives</p>
              </div>
              <span className="text-xs font-bold text-[var(--brand)] bg-[var(--brand-soft)] px-2 py-1 rounded-full">{trials.length}</span>
            </div>
            {trials.length===0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                <BadgeCheck size={28} className="mb-2 opacity-30"/><p className="text-sm">Aucune période d'essai en cours</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {trials.slice(0,7).map((t:any,i:number)=>{
                  const end=t.trialEndDate?new Date(t.trialEndDate):null;
                  const days=end?Math.ceil((end.getTime()-Date.now())/86_400_000):null;
                  const urgent=days!==null&&days<=7;
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{t.firstName} {t.lastName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{t.position} · {t.contractType}</p>
                      </div>
                      {days!==null && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${urgent?'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400':'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                          {days<=0?'Expirée':`${days}j restants`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CDD expirant */}
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-2)]/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500"/>
                <p className="text-sm font-bold text-[var(--text)]">CDD arrivant à terme</p>
              </div>
              <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">{expiring.length}</span>
            </div>
            {expiring.length===0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                <CheckCircle size={28} className="mb-2 opacity-30"/><p className="text-sm">Aucun CDD en fin de contrat imminent</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {expiring.slice(0,7).map((c:any,i:number)=>{
                  const end=c.contractEndDate?new Date(c.contractEndDate):null;
                  const days=end?Math.ceil((end.getTime()-Date.now())/86_400_000):null;
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{c.position||c.department?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)]">{end?end.toLocaleDateString('fr-FR'):'—'}</p>
                        {days!==null&&<span className={`text-[11px] font-bold ${days<=30?'text-red-500':'text-amber-500'}`}>{days<=0?'Expiré':`${days}j`}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-5 py-3 border-t border-[var(--border)] flex gap-2">
              <button onClick={()=>router.push(bp('/contrats'))} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
                <FilePlus size={13}/> Tous les contrats
              </button>
              <button onClick={()=>router.push(bp('/contrats/rupture'))} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 dark:border-red-800 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <FileX size={13}/> Ruptures de contrat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ GRAPHIQUE MASSE SALARIALE ══════════════════════════════════ */}
      {salaryTrend.length>0 && (
        <div>
          <SectionTitle>Évolution masse salariale — Compte 661100 · {year}</SectionTitle>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-[var(--text)]">Brut · Net · Charges (M FCFA)</p>
                <p className="text-xs text-[var(--text-muted)]">OHADA classe 6 — 6 derniers mois</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{background:C.sky}}/> Brut</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{background:C.emerald}}/> Net</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{background:C.rose}}/> Charges</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salaryTrend} margin={{top:5,right:10,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gBrut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.sky} stopOpacity={0.3}/><stop offset="95%" stopColor={C.sky} stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.emerald} stopOpacity={0.3}/><stop offset="95%" stopColor={C.emerald} stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gCharges" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.rose} stopOpacity={0.2}/><stop offset="95%" stopColor={C.rose} stopOpacity={0.02}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,fontSize:12}} labelStyle={{color:'#e2e8f0',fontWeight:700}} formatter={(v:any)=>[`${Number(v).toFixed(2)} M FCFA`]}/>
                <Area type="monotone" dataKey="brut"    stroke={C.sky}     fill="url(#gBrut)"    strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="net"     stroke={C.emerald} fill="url(#gNet)"     strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="charges" stroke={C.rose}    fill="url(#gCharges)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ RÉFÉRENCE OHADA ══════════════════════════════════════════════ */}
      <div className="bg-[var(--brand-soft)] border border-[var(--brand)]/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-[var(--brand)] mt-0.5 shrink-0"/>
          <div>
            <p className="text-sm font-bold text-[var(--text)] mb-2">Plan comptable OHADA — Comptes paie utilisés dans les exports</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                {compte:'661100',lib:'Salaires bruts'},
                {compte:'431100',lib:'CNSS salarié'},
                {compte:'431300',lib:'CNSS employeur'},
                {compte:'447200',lib:'ITS / IRPP'},
                {compte:'422100',lib:'Net à payer'},
                {compte:'641300',lib:'TUS'},
                {compte:'664100',lib:'Charges pat.'},
                {compte:'4281',  lib:'Congés à payer'},
              ].map(c=>(
                <div key={c.compte} className="bg-[var(--surface)] rounded-xl px-3 py-2 border border-[var(--brand)]/30">
                  <p className="text-xs font-mono font-black text-[var(--brand)]">{c.compte}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.lib}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ÉVOLUTION PLURIANNUELLE (en bas de page) ══════════════════════ */}
      <YearlyEvolutionPanel />

    </div>
  );
}