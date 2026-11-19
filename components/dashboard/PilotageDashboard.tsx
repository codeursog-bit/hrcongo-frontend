'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, FileText, Lightbulb, Plus, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Button, Card, EmptyState, Skeleton } from '@/components/design-system/primitives';
import { CapsuleChart, DonutChart, SmoothChart } from '@/components/design-system/charts';
import { DashboardPage } from '@/components/templates';
import './pilotage.css';

interface PayrollPreview { id: string; employee?: { firstName?: string | null; lastName?: string | null; photoUrl?: string | null }; netSalary?: number | string; createdAt?: string }
interface ActivityPreview { id: string; type?: string; text?: string; subText?: string; time?: string }
interface UpcomingLeave {id:string;startDate:string;endDate:string;employee:{id:string;firstName:string;lastName:string}}
interface UpcomingContract {id:string;employee:{id:string;firstName:string;lastName:string};contractType:string;kind:string;dueAt:string;daysLeft:number;urgency:'danger'|'warning'|'neutral'}
interface PilotageProps {
  userName: string; monthLabel: string; pendingTotal: number; leavesThisMonth: number; totalPretAvanceMois: number; deptCount: number; error?: string;
  stats: { totalEmployees?: number; masseSalariale?: number; attendanceRate?: number; absentToday?: number; pendingLeaves?: number; pendingAbsences?: number; pendingPermissions?: number; recentPayrolls?: PayrollPreview[]; recentActivities?: ActivityPreview[]; upcomingLeaves?:UpcomingLeave[];upcomingContracts?:UpcomingContract[] };
  charts: { salaryTrend?: { name?: string; masseSalariale: number; value: number }[]; deptDistribution?: { id?: string | number; name?: string; value: number }[] };
}
const money = (value?: number | string) => { const amount = Number(value ?? 0); return Number.isFinite(amount) ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) : '—'; };
const date = (value?: string, withTime = false) => { if (!value) return 'Date non renseignée'; const d = new Date(value); return Number.isNaN(d.getTime()) ? 'Date non renseignée' : d.toLocaleString('fr-FR', withTime ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }); };
const shortcuts: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Ajouter un employé', href: '/employes/nouveau', icon: Users }, { label: 'Créer une paie', href: '/paie/nouveau', icon: Wallet },
  { label: 'Gérer les congés', href: '/conges', icon: CalendarDays }, { label: 'Consulter les rapports', href: '/rapports', icon: FileText },
  { label: 'Suggérer une fonctionnalité', href: '/suggestions', icon: Lightbulb },
];
const activityLabels: Record<string, string> = { LEAVE: 'Congé', ABSENCE: 'Absence', PERMISSION: 'Permission', HIRE: 'Équipe', ATTENDANCE: 'Présence' };

export function PilotageSkeleton() {
  return <div className="pilotage" role="status" aria-label="Chargement du pilotage RH"><span className="k-sr-only">Chargement des indicateurs RH…</span><Skeleton className="pilotage-skeleton-title" /><div className="pilotage-kpis">{[0, 1, 2, 3].map(i => <Card key={i}><Skeleton /><Skeleton className="pilotage-skeleton-value" /><Skeleton className="k-short" /></Card>)}</div><div className="pilotage-secondary">{[0, 1, 2].map(i => <Card key={i}><Skeleton /><Skeleton className="pilotage-skeleton-value" /></Card>)}</div><div className="pilotage-loading-grid"><Card><Skeleton className="pilotage-skeleton-chart" /></Card><Card><Skeleton className="pilotage-skeleton-chart" /></Card></div></div>;
}

export function PilotageDashboard({ userName, monthLabel, stats, charts, pendingTotal, leavesThisMonth, totalPretAvanceMois, deptCount, error }: PilotageProps) {
  const [upcomingTab,setUpcomingTab]=useState<'leaves'|'contracts'>('leaves');
  // Presentation aliases only: every numerical value comes from the existing data layer.
  const salary = (charts.salaryTrend || []).map(row => ({ label: row.name || 'Période', primary: row.masseSalariale, secondary: row.value }));
  const departments = (charts.deptDistribution || []).map(row => ({ name: row.name || 'Département sans nom', value: row.value }));
  const payrolls = (stats.recentPayrolls || []).slice(0,5); const activities = stats.recentActivities || [];
  const summary = <>
    <div className="pilotage-kpis">
      <Card className="pilotage-kpi"><p className="pilotage-label">Total employés</p><strong>{stats.totalEmployees ?? 0}</strong><span className="pilotage-footnote"><i className="pilotage-dot" />Actif</span></Card>
      <Card className="pilotage-kpi pilotage-hero"><p className="pilotage-label">Masse salariale</p><strong>{money(stats.masseSalariale)} <small>FCFA</small></strong><span className="pilotage-footnote">{monthLabel} · Mensuel</span><Wallet className="pilotage-hero-mark" size={86} strokeWidth={1} aria-hidden="true" /></Card>
      <Card className="pilotage-kpi"><p className="pilotage-label">Taux de présence</p><strong>{stats.attendanceRate ?? 0}<small> %</small></strong><span className="pilotage-footnote">{stats.absentToday ?? 0} absent(s) aujourd’hui</span></Card>
      <Card className="pilotage-kpi"><div className="pilotage-card-heading"><p className="pilotage-label">Demandes en attente</p><Link href="/demandes" className="pilotage-inline-link" aria-label="Traiter les demandes en attente"><ArrowRight size={18} strokeWidth={1.5} /></Link></div><strong>{pendingTotal}</strong><div className="pilotage-pending"><span>{stats.pendingLeaves ?? 0} congé(s)</span><span>{stats.pendingAbsences ?? 0} absence(s)</span><span>{stats.pendingPermissions ?? 0} permission(s)</span></div></Card>
    </div>
    <div className="pilotage-secondary">
      <Card><CalendarDays size={21} strokeWidth={1.5} aria-hidden="true" /><div><p className="pilotage-label">Départs en congé</p><strong>{leavesThisMonth}</strong><span className="pilotage-footnote">Ce mois</span></div></Card>
      <Card><Wallet size={21} strokeWidth={1.5} aria-hidden="true" /><div><p className="pilotage-label">Prêts et avances</p><strong>{money(totalPretAvanceMois)} <small>FCFA</small></strong><span className="pilotage-footnote">Accordés ce mois</span></div></Card>
      <Card><Users size={21} strokeWidth={1.5} aria-hidden="true" /><div><p className="pilotage-label">Départements</p><strong>{deptCount}</strong><span className="pilotage-footnote">Actifs</span></div></Card>
    </div>
  </>;
  if (error) return <div className="pilotage"><DashboardPage title="Pilotage RH" description={`Vue d’ensemble · ${monthLabel}`}><Card className="pilotage-full"><div role="alert"><h2>Le pilotage RH n’a pas pu être chargé.</h2><p className="k-caption">Les indicateurs ne sont pas disponibles pour le moment.</p></div><Button onClick={() => window.location.reload()}>Réessayer</Button></Card></DashboardPage></div>;
  return <div className="pilotage"><DashboardPage title={`Bonjour${userName ? `, ${userName}` : ''}`} description={`Le point sur votre équipe et votre paie · ${monthLabel}`} action={<span className="pilotage-page-label">Pilotage RH</span>} summary={summary}>
    <Card className="pilotage-trend" title="Évolution de la masse salariale" action={<span className="pilotage-caption">FCFA</span>}>{salary.length ? <SmoothChart data={salary} /> : <EmptyState title="Votre évolution de paie prendra forme ici">Les périodes disponibles apparaîtront après la préparation des premières paies.</EmptyState>}</Card>
    <Card className="pilotage-departments" title="Répartition par département">{departments.length ? <DonutChart data={departments} total={String(stats.totalEmployees ?? 0)} label="employés" /> : <EmptyState title="Une vue de votre organisation">La répartition apparaîtra lorsque votre équipe sera rattachée aux départements.</EmptyState>}</Card>
    <Card className="pilotage-activity" title="Activité récente" action={<span className="pilotage-live"><i />36 h</span>}>{activities.length ? <ol className="pilotage-activity-list">{activities.map((activity, index) => <li key={activity.id || index}><span className="pilotage-activity-mark" aria-hidden="true"><Check size={14} strokeWidth={1.5} /></span><div><span className="pilotage-activity-kind">{activityLabels[activity.type || ''] || 'Activité'}</span><p>{activity.text || 'Une mise à jour a été enregistrée.'}</p>{activity.subText && <span className="pilotage-caption">{activity.subText}</span>}<time dateTime={activity.time}>{date(activity.time, true)}</time></div></li>)}</ol> : <EmptyState title="Votre fil d’activité est à jour">Les nouvelles demandes et les mouvements de votre équipe seront regroupés ici.</EmptyState>}</Card>
    <Card className="pilotage-bars" title="Masse salariale et salaire net par mois" action={<span className="pilotage-caption">FCFA</span>}>{salary.length ? <CapsuleChart data={salary} /> : <EmptyState title="Comparez les périodes en un regard">Les montants servis par la paie apparaîtront ici.</EmptyState>}</Card>
    <Card className="pilotage-payrolls" title="Derniers bulletins" action={<Link className="pilotage-inline-link" href="/paie">Voir tout<ArrowRight size={14} strokeWidth={1.5} /></Link>}>
      {payrolls.length ? <ul className="pilotage-payroll-list">{payrolls.map((payroll, index) => { const name = [payroll.employee?.firstName, payroll.employee?.lastName].filter(Boolean).join(' ') || 'Employé'; const initials = [payroll.employee?.firstName, payroll.employee?.lastName].map(part => (part || '').slice(0, 1)).join('') || '?'; return <li key={payroll.id || index}><span className="pilotage-avatar" aria-hidden="true">{initials}</span><div><strong>{name}</strong><span>Net : {money(payroll.netSalary)} FCFA</span></div><time dateTime={payroll.createdAt}>{date(payroll.createdAt)}</time></li>; })}</ul> : <EmptyState title="Les premiers bulletins arriveront ici">Préparez une paie pour retrouver les derniers montants nets de votre équipe.</EmptyState>}
    </Card>
    <Card className="pilotage-upcoming" title="À l’approche">
      <div className="pilotage-upcoming-tabs" role="group" aria-label="Échéances à consulter">
        <button type="button" aria-pressed={upcomingTab==='leaves'} onClick={()=>setUpcomingTab('leaves')}>Départs en congé <span>{stats.upcomingLeaves?.length||0}</span></button>
        <button type="button" aria-pressed={upcomingTab==='contracts'} onClick={()=>setUpcomingTab('contracts')}>Fins de contrat <span>{stats.upcomingContracts?.length||0}</span></button>
      </div>
      <div className="pilotage-upcoming-content" aria-live="polite">
      {upcomingTab==='leaves' ? (stats.upcomingLeaves?.length ? <ul className="pilotage-deadline-list">{stats.upcomingLeaves.map(leave=><li key={leave.id}><CalendarDays size={17} strokeWidth={1.5} aria-hidden="true"/><div><Link href={`/conges/${leave.id}`}>{leave.employee.firstName} {leave.employee.lastName}</Link><span>Du {date(leave.startDate)} au {date(leave.endDate)}</span></div><ArrowRight size={14} aria-hidden="true"/></li>)}</ul> : <EmptyState title="Aucun départ programmé prochainement">Les congés approuvés des 45 prochains jours apparaîtront ici.</EmptyState>) :
      (stats.upcomingContracts?.length ? <ul className="pilotage-deadline-list">{stats.upcomingContracts.map(contract=><li key={contract.id} data-urgency={contract.urgency}><span className="pilotage-deadline-dot" aria-hidden="true"/><div><Link href={`/employes/${contract.employee.id}`}>{contract.employee.firstName} {contract.employee.lastName}</Link><span>{contract.kind==='TRIAL'?'Fin d’essai':contract.contractType} · {date(contract.dueAt)}</span></div><strong className="pilotage-deadline-days">{contract.daysLeft<0?'Échu':contract.daysLeft===0?'Aujourd’hui':`J−${contract.daysLeft}`}</strong></li>)}</ul> : <EmptyState title="Aucune fin de contrat proche">CDD, stages, prestations et essais à échéance dans les 90 prochains jours seront suivis ici.</EmptyState>)}
      </div>
    </Card>
    <Card className="pilotage-shortcuts" title="Raccourcis"><div className="pilotage-shortcut-list">{shortcuts.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={19} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span><ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" /></Link>)}</div></Card>
  </DashboardPage></div>;
}
