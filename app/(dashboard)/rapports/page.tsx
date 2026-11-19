'use client';
import { chartTheme } from '@/lib/chart-theme';
import '@/components/reports/reports.css';
import { ReportLaunchpad } from '@/components/reports/ReportLaunchpad';


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Wallet, Clock, Calendar, AlertCircle, CheckCircle,
  TrendingUp, TrendingDown, Shield,
  FileText, ChevronRight, BadgeCheck,
  Receipt, Landmark, FileX, FilePlus, AlertTriangle,
  LayoutDashboard, ClipboardList, DollarSign,
  UsersRound, UmbrellaOff, BookOpen, Building2, UserCircle, BarChart3,
  type LucideIcon,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useReducedMotion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';
import YearlyEvolutionPanel from '@/components/YearlyEvolutionPanel';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Button, Card, EmptyState, Select } from '@/components/design-system/primitives';
import { DashboardPage } from '@/components/templates';

const C = {
  sky: 'var(--brand)',
  emerald: 'var(--green)',
  amber: 'var(--mustard)',
  rose: 'var(--danger)',
  violet: 'var(--text-secondary)',
};
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fcfa = (v:number) => v>=1_000_000 ? `${(v/1_000_000).toFixed(2)} M FCFA` : `${Math.round(v).toLocaleString('fr-FR')} FCFA`;

function KpiCard({ icon:Icon, label, value, sub, color=C.sky, trend, trendUp }: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Icon size={19} strokeWidth={1.5} style={{color}} aria-hidden="true" />
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trendUp?'text-[var(--green)]':'text-[var(--danger)]'}`}>
            {trendUp?<TrendingUp size={12} strokeWidth={1.5}/>:<TrendingDown size={12} strokeWidth={1.5}/>} {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--text)] tracking-tight tabular-nums">{value}</p>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-[11px] text-[var(--text-secondary)] mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

function SectionTitle({children}: {children: React.ReactNode}) {
  return <h2 className="text-base font-semibold text-[var(--text)] mb-4">{children}</h2>;
}

export default function RapportsPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
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
    <KonzaLoader variant="page" />
  );

  const masseBrute   = Number(overview?.payrollTotal||0);
  const effectif     = Number(overview?.headcount||0);
  const congesActifs = Number(overview?.activeLeaves||0);
  const salaryTrend  = overview?.salaryTrend||[];
  const cnssTotal    = cnss?.totals;
  const otSummary    = overtime?.summary;
  const otByEmp      = overtime?.byEmployee||[];
  const monthLabel   = MONTHS[month-1]+' '+year;

  const periodFilter = (
    <div className="flex flex-wrap items-end gap-3" aria-label="Période du rapport">
      <Select label="Mois" id="reports-month" value={month} onChange={e=>setMonth(+e.target.value)}>
        {MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
      </Select>
      <Select label="Année" id="reports-year" value={year} onChange={e=>setYear(+e.target.value)}>
        {[year-1,year,year+1].map(y=><option key={y} value={y}>{y}</option>)}
      </Select>
    </div>
  );

  return (
    <div className="reports-workspace reports-overview max-w-[1600px] mx-auto w-full pb-20">
      <DashboardPage
        title="Rapports RH"
        description="L’essentiel des effectifs, de la paie et des échéances de votre entreprise."
        action={periodFilter}
        navigation={<RapportsSubNav active="/rapports" />}
      >
      <ReportLaunchpad />

      {/* ═══ KPI GLOBAUX ═══════════════════════════════════════════════════ */}
      <section className="col-span-full">
        <SectionTitle>Indicateurs globaux</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Users}   label="Effectif actif"        value={overview ? effectif.toString() : '—'}      color={C.sky}     sub={overview ? 'Salariés en activité' : 'Données indisponibles'}/>
          <KpiCard icon={Wallet}  label="Masse salariale brute" value={overview ? fcfa(masseBrute) : '—'}          color={C.emerald} sub={overview ? monthLabel : 'Données indisponibles'}/>
          <KpiCard icon={Calendar}label="Congés en cours"       value={overview ? congesActifs.toString() : '—'}  color={C.amber}   sub="Approuvés actifs"/>
          <KpiCard icon={Clock}   label="H. Sup ce mois"        value={otSummary?.totalHours?`${Number(otSummary.totalHours).toFixed(0)}h`:'—'} color={C.violet} sub={otSummary?.totalAmount||'—'}/>
        </div>
      </section>

      {/* ═══ CNSS MENSUELLE ════════════════════════════════════════════════ */}
      <section className="col-span-full">
        <SectionTitle>Déclaration CNSS — {monthLabel} · Taux officiels cnss.cg</SectionTitle>
        {cnssLoad ? (
          <KonzaLoader variant="section" />
        ) : !cnssTotal ? (
          <Card><EmptyState title={`Aucun bulletin généré pour ${monthLabel}`} icon={Landmark}>Générez d'abord les bulletins de paie pour ce mois.</EmptyState></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Part salariale — Cpte 431100 */}
            <Card title="Part salariale" action={<Badge tone="neutral">Cpte 431100 · 4% plafonné</Badge>}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Retraite salarié (4%)</span><span className="font-medium tabular-nums">{Math.round(cnssTotal.cnssSalarial).toLocaleString('fr-FR')} FCFA</span></div>
                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2"><span className="font-semibold text-[var(--text)]">Total salarié</span><span className="font-semibold text-[var(--brand-strong)] tabular-nums">{Math.round(cnssTotal.cnssSalarial).toLocaleString('fr-FR')} FCFA</span></div>
              </div>
            </Card>

            {/* Part patronale — Cpte 664100 / 431300 */}
            <Card title="Part patronale" action={<Badge tone="neutral">Cptes 664100 / 431300 · 20,28% max</Badge>}>
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
                <div className="flex justify-between text-sm border-t border-[var(--border)] pt-2"><span className="font-semibold text-[var(--text)]">Total patronal</span><span className="font-semibold text-[var(--mustard)] tabular-nums">{Math.round(cnssTotal.cnssEmployeurTotal).toLocaleString('fr-FR')} FCFA</span></div>
              </div>
            </Card>

            {/* TUS + Totaux — Cpte 641300 */}
            <Card title="TUS + récapitulatif" action={<Badge tone="neutral">Cpte 641300 · 7,5% brut</Badge>}>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>TUS-DGI (2,025%)</span><span className="font-semibold">{Math.round(cnssTotal.tusDgi).toLocaleString('fr-FR')}</span></div>
                <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>TUS-CNSS (5,475%)</span><span className="font-semibold">{Math.round(cnssTotal.tusCnss).toLocaleString('fr-FR')}</span></div>
                <div className="border-t border-[var(--border)] pt-2 space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-[var(--text-muted)]">Total CNSS global</span><span className="font-semibold">{Math.round(cnssTotal.totalCotisations).toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-[var(--text)]">À verser CNSS</span><span className="font-semibold text-[var(--green)] tabular-nums">{Math.round(cnssTotal.totalAVerserCnss).toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-[var(--text)]">À verser DGI (TUS)</span><span className="font-semibold text-[var(--mustard)] tabular-nums">{Math.round(cnssTotal.totalAVerserDgi).toLocaleString('fr-FR')} FCFA</span></div>
                </div>
              </div>
            </Card>

            {/* Alerte NIU */}
            {cnss?.totals?.missingCnss>0 && (
              <div className="lg:col-span-3 flex items-start gap-3 p-4 rounded-[var(--radius-control)]" style={{background:'color-mix(in srgb, var(--mustard) 12%, transparent)'}}>
                <AlertTriangle strokeWidth={1.5} size={18} className="text-[var(--mustard)] mt-0.5 shrink-0"/>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">{cnss.totals.missingCnss} salarié(s) sans numéro CNSS</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">La déclaration nominative DNMS sera incomplète. Complétez les fiches employés avant dépôt.</p>
                </div>
                <Button variant="secondary" className="shrink-0" onClick={()=>router.push(bp('/cnss-declaration'))}>Voir</Button>
              </div>
            )}

            <div className="lg:col-span-3 flex justify-end">
              <Button onClick={()=>router.push(bp('/cnss-declaration'))}>
                <FileText size={16} strokeWidth={1.5}/> Déclaration CNSS complète <ChevronRight size={16} strokeWidth={1.5}/>
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ HEURES SUPPLÉMENTAIRES ════════════════════════════════════════ */}
      <section className="col-span-full">
        <SectionTitle>Heures supplémentaires — {monthLabel} · Décret 78-360</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <Card title="Récapitulatif" className="space-y-4">
            {[
              {label:'Total heures',       val:otSummary?`${Number(otSummary.totalHours).toFixed(1)} h`:'—',                          color:C.violet},
              {label:'Coût total H.Sup',   val:otSummary?.totalAmount||'—',                                                            color:C.amber},
              {label:'Salariés concernés', val:`${otSummary?.employeesWithOvertime||0} / ${effectif}`,                                  color:C.sky},
            ].map(row=>(
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-sm text-[var(--text-muted)]">{row.label}</span>
                <span className="font-semibold" style={{color:row.color}}>{row.val}</span>
              </div>
            ))}
            <div className="p-3 rounded-[var(--radius-control)] bg-[var(--accent-2-soft)]">
              <p className="text-[11px] font-semibold text-[var(--mustard)] mb-1">Barème légal Congo</p>
              <div className="grid grid-cols-2 gap-x-3 text-[11px] text-[var(--text-secondary)]">
                <span>41–48h → +10%</span><span>49–54h → +25%</span>
                <span>55–60h → +50%</span><span>&gt;60h → +100%</span>
              </div>
            </div>
          </Card>

          <Card title="Détail par salarié" className="lg:col-span-2">
            {otByEmp.length===0 ? (
              <EmptyState title="Aucune heure supplémentaire ce mois" icon={Clock}>Les heures supplémentaires apparaîtront ici pour la période choisie.</EmptyState>
            ) : (
              <>
                <div className="k-table-desktop overflow-x-auto">
                  <div className="reports-table-region" role="region" aria-label="Données du rapport" tabIndex={0}><table data-report-table className="k-table reports-table">
                    <thead>
                    <tr>
                      <th scope="col">Salarié</th>
                      <th scope="col" className="text-center">+10%</th>
                      <th scope="col" className="text-center">+25%</th>
                      <th scope="col" className="text-center">+50%</th>
                      <th scope="col" className="text-center">+100%</th>
                      <th scope="col" className="text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otByEmp.slice(0,12).map((emp:any,i:number)=>(
                      <tr key={i}>
                        <td className="font-medium text-[var(--text)]">{emp.name||emp.employeeName||'—'}</td>
                        <td className="text-center text-[var(--text-secondary)]">{emp.overtime10?`${emp.overtime10}h`:'—'}</td>
                        <td className="text-center text-[var(--text-secondary)]">{emp.overtime25?`${emp.overtime25}h`:'—'}</td>
                        <td className="text-center text-[var(--text-secondary)]">{emp.overtime50?`${emp.overtime50}h`:'—'}</td>
                        <td className="text-center text-[var(--text-secondary)]">{emp.overtime100?`${emp.overtime100}h`:'—'}</td>
                        <td className="text-right font-semibold text-[var(--mustard)]">{emp.amount?Math.round(emp.amount).toLocaleString('fr-FR')+' F':'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  </table></div>
                </div>
                <ul className="k-table-mobile" aria-label="Heures supplémentaires par salarié">
                  {otByEmp.slice(0,12).map((emp:any,i:number)=>(
                    <li key={i}>
                      <dl>
                        <div><dt>Salarié</dt><dd className="font-medium">{emp.name||emp.employeeName||'—'}</dd></div>
                        <div><dt>Majoration +10%</dt><dd>{emp.overtime10?`${emp.overtime10}h`:'—'}</dd></div>
                        <div><dt>Majoration +25%</dt><dd>{emp.overtime25?`${emp.overtime25}h`:'—'}</dd></div>
                        <div><dt>Majoration +50%</dt><dd>{emp.overtime50?`${emp.overtime50}h`:'—'}</dd></div>
                        <div><dt>Majoration +100%</dt><dd>{emp.overtime100?`${emp.overtime100}h`:'—'}</dd></div>
                        <div><dt>Montant</dt><dd className="font-semibold text-[var(--mustard)]">{emp.amount?Math.round(emp.amount).toLocaleString('fr-FR')+' F':'—'}</dd></div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* ═══ CONGÉS ══════════════════════════════════════════════════════ */}
      <section className="col-span-full">
        <SectionTitle>Congés — Code du travail Congo (art. 113) · Cpte 4281</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
          {(leaves?.kpi||[{label:'Total demandes',value:'—'},{label:'Solde moyen',value:'—'}]).map((kpi:any,i:number)=>(
            <Card key={i}>
              <p className="text-2xl font-semibold text-[var(--text)] tabular-nums">{kpi.value}</p>
              <p className="text-xs font-semibold text-[var(--text-secondary)] mt-2">{kpi.label}</p>
            </Card>
          ))}
        </div>
        {leaves?.distribution?.length>0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {leaves.distribution.map((d:any,i:number)=>(
              <Badge key={i} tone="neutral">{d.name} · {d.value}</Badge>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={()=>router.push(bp('/rapports/analyse-conges'))}>
            Analyse détaillée <ChevronRight size={16} strokeWidth={1.5}/>
          </Button>
        </div>
      </section>

      {/* ═══ CONTRATS & RUPTURES ════════════════════════════════════════ */}
      <section className="col-span-full">
        <SectionTitle>Contrats &amp; Ruptures · Code du travail Congo</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Périodes d'essai */}
          <Card title="Périodes d'essai actives" action={<Badge tone="info">{trials.length}</Badge>}>
            {trials.length===0 ? (
              <EmptyState title="Aucune période d'essai en cours" icon={BadgeCheck}>Les échéances actives apparaîtront ici.</EmptyState>
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
                        <Badge tone={urgent ? 'danger' : 'warning'}>
                          {days<=0?'Expirée':`${days}j restants`}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* CDD expirant */}
          <Card title="CDD arrivant à terme" action={<Badge tone="warning">{expiring.length}</Badge>}>
            {expiring.length===0 ? (
              <EmptyState title="Aucun CDD en fin de contrat imminent" icon={CheckCircle}>Les contrats à échéance apparaîtront ici.</EmptyState>
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
                        {days!==null&&<Badge tone={days<=30 ? 'danger' : 'warning'}>{days<=0?'Expiré':`${days}j`}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="secondary" onClick={()=>router.push(bp('/contrats'))}>
                <FilePlus size={16} strokeWidth={1.5}/> Tous les contrats
              </Button>
              <Button variant="secondary" onClick={()=>router.push(bp('/contrats/rupture'))}>
                <FileX size={16} strokeWidth={1.5}/> Ruptures de contrat
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ═══ GRAPHIQUE MASSE SALARIALE ══════════════════════════════════ */}
      {salaryTrend.length>0 && (
        <section className="col-span-full">
          <SectionTitle>Évolution masse salariale — Compte 661100 · {year}</SectionTitle>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">Brut · Net · Charges (M FCFA)</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">OHADA classe 6 — 6 derniers mois</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]" aria-label="Légende du graphique">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{background:C.sky}}/> Brut</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{background:C.emerald}}/> Net</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{background:C.amber}}/> Charges</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salaryTrend} margin={{top:5,right:10,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gBrut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.sky} stopOpacity={0.3}/><stop offset="95%" stopColor={C.sky} stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.emerald} stopOpacity={0.3}/><stop offset="95%" stopColor={C.emerald} stopOpacity={0.02}/></linearGradient>
                  <linearGradient id="gCharges" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.2}/><stop offset="95%" stopColor={C.amber} stopOpacity={0.02}/></linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'var(--text-secondary)'}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={chartTheme.tooltip} labelStyle={{color:'var(--text)',fontWeight:600}} formatter={(v:any)=>[`${Number(v).toFixed(2)} M FCFA`]}/>
                <Area activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}} type="monotone" dataKey="brut"    stroke={C.sky}     fill="url(#gBrut)"    strokeWidth={2} dot={false} isAnimationActive={prefersReducedMotion !== true} animationDuration={700}/>
                <Area activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}} type="monotone" dataKey="net"     stroke={C.emerald} fill="url(#gNet)"     strokeWidth={2} dot={false} isAnimationActive={prefersReducedMotion !== true} animationDuration={700}/>
                <Area activeDot={{r:5,stroke:chartTheme.surface,strokeWidth:3}} type="monotone" dataKey="charges" stroke={C.amber}   fill="url(#gCharges)" strokeWidth={2} dot={false} isAnimationActive={prefersReducedMotion !== true} animationDuration={700}/>
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>
      )}

      {/* ═══ RÉFÉRENCE OHADA ══════════════════════════════════════════════ */}
      <section className="col-span-full">
        <Card title="Plan comptable OHADA — Comptes paie utilisés dans les exports">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
                <div key={c.compte} className="bg-[var(--surface-2)] rounded-[var(--radius-control)] px-3 py-3">
                  <p className="text-xs font-mono font-semibold text-[var(--brand-strong)]">{c.compte}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{c.lib}</p>
                </div>
              ))}
            </div>
        </Card>
      </section>

      {/* ═══ ÉVOLUTION PLURIANNUELLE (en bas de page) ══════════════════════ */}
      <section className="col-span-full">
        <YearlyEvolutionPanel />
      </section>

      </DashboardPage>
    </div>
  );
}
