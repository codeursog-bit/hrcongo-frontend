'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/suivi-dettes/page.tsx
// ✅ Page "Suivi des dettes" — uniquement les employés dont un prêt/avance a
//    été VALIDÉ (pas tout le monde), regroupés, avec filtres mois (défaut :
//    mois en cours) / année / département / type, KPI qui se recalculent,
//    et export Excel générique (indépendant du format Orca).
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ChevronRight } from 'lucide-react';
import { ListPage } from '@/components/templates';
import { Button, Card, Input, Select, DataTable, EmptyState, Skeleton, type Column } from '@/components/design-system/primitives';
import { LoanSpaceKpi } from '@/components/loans/LoanSpaceView';
import '@/components/loans/debt-tracking.css';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

export default function SuiviDettesPage() {
  const { bp } = useBasePath();
  const [loadError, setLoadError] = useState('');
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState<number | ''>(now.getMonth() + 1); // '' = toute l'année
  const [year, setYear] = useState(now.getFullYear());
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
        setLoans(l || []); setAdvances(a || []);
      } catch (e) { console.error('Erreur chargement suivi des dettes', e); setLoadError('Le suivi des dettes n’a pas pu être chargé. Réessayez dans un instant.'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const availableYears = useMemo(() => {
    const set = new Set<number>([now.getFullYear()]);
    loans.forEach(r => set.add(new Date(r.startDate ?? r.createdAt).getFullYear()));
    advances.forEach(r => set.add(r.year ?? r.deductYear ?? new Date(r.createdAt).getFullYear()));
    [...loans, ...advances].forEach(r => (r.repaymentLogs ?? []).forEach((log: any) => set.add(log.year)));
    return Array.from(set).sort((a, b) => b - a);
  }, [loans, advances]);

  const departments = useMemo(() => Array.from(new Set([...loans, ...advances].map(r => r.employee?.department?.name).filter(Boolean))).sort(), [loans, advances]);

  // ── Regroupement par employé ──────────────────────────────────────────
  // ⚠️ Distinction essentielle :
  //  - "Donné (période)" et "Remboursé (période)" reflètent l'ACTIVITÉ du
  //    mois/année sélectionné (nouveaux prêts/avances accordés, paiements
  //    effectués) — c'est normal que ça varie selon la période affichée.
  //  - "Reste à rembourser" est TOUJOURS le vrai solde global actuel de
  //    l'employé, TOUT PRÊT/TOUTE AVANCE ACTIF confondu, peu importe quand
  //    ils ont été accordés. Un prêt de 2020 jamais remboursé doit continuer
  //    à apparaître ici quel que soit le mois/l'année affiché — le filtre de
  //    période ne doit JAMAIS faire disparaître une dette réelle. À l'inverse,
  //    un nouveau prêt accordé aujourd'hui s'ajoute immédiatement à ce total,
  //    et un remboursement le fait baisser immédiatement, peu importe la
  //    période affichée au moment où on regarde.
  const byEmployee = useMemo(() => {
    const inPeriodDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (d.getFullYear() !== year) return false;
      if (month !== '' && d.getMonth() + 1 !== month) return false;
      return true;
    };
    const inPeriodLog = (log: any) => {
      if (log.year !== year) return false;
      if (month !== '' && log.month !== month) return false;
      return true;
    };
    const nameQuery = nameFilter.trim().toLowerCase();
    const matchesName = (x: any) => !nameQuery || `${x.employee?.firstName ?? ''} ${x.employee?.lastName ?? ''}`.toLowerCase().includes(nameQuery);
    const matchesCommon = (x: any) => matchesName(x) && (!deptFilter || x.employee?.department?.name === deptFilter);

    type Row = { employeeId: string; employee: any; types: Set<string>; givenInPeriod: number; paidInPeriod: number; totalGranted: number; totalRepaidCumul: number; totalRemaining: number };
    const map = new Map<string, Row>();
    const touch = (emp: any, id: string): Row => {
      if (!map.has(id)) map.set(id, { employeeId: id, employee: emp, types: new Set(), givenInPeriod: 0, paidInPeriod: 0, totalGranted: 0, totalRepaidCumul: 0, totalRemaining: 0 });
      return map.get(id)!;
    };

    // 1) Cumul (accordé/remboursé/solde) — jamais filtré par période, seulement par type/dept/nom
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type) || !['ACTIVE', 'PAID'].includes(l.status)) return;
      const row = touch(l.employee, l.employeeId);
      row.totalGranted += Number(l.amount);
      row.totalRepaidCumul += Number(l.amount) - Number(l.remainingBalance);
      row.totalRemaining += Number(l.remainingBalance);
      row.types.add(l.type ?? 'ARGENT');
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE') || !['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)) return;
      const row = touch(a.employee, a.employeeId);
      row.totalGranted += Number(a.amount);
      row.totalRepaidCumul += Number(a.amount) - Number(a.remainingBalance ?? a.amount);
      row.totalRemaining += Number(a.remainingBalance ?? (['DEDUCTED', 'PAID'].includes(a.status) ? 0 : a.amount));
      row.types.add('AVANCE');
    });

    // 2) "Donné" — nouveaux prêts/avances accordés PENDANT la période affichée
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type) || !['ACTIVE', 'PAID'].includes(l.status)) return;
      if (inPeriodDate(l.startDate ?? l.createdAt)) {
        const row = touch(l.employee, l.employeeId);
        row.givenInPeriod += Number(l.amount);
        row.types.add(l.type ?? 'ARGENT');
      }
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE') || !['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status)) return;
      if (inPeriodDate(a.month && a.year ? new Date(a.year, a.month - 1, 1) : a.createdAt)) {
        const row = touch(a.employee, a.employeeId);
        row.givenInPeriod += Number(a.amount);
        row.types.add('AVANCE');
      }
    });

    // 3) "Remboursé" — paiements réellement journalisés PENDANT la période
    loans.forEach(l => {
      if (!matchesCommon(l) || (typeFilter && typeFilter !== l.type)) return;
      (l.repaymentLogs ?? []).forEach((log: any) => {
        if (inPeriodLog(log)) touch(l.employee, l.employeeId).paidInPeriod += Number(log.amount);
      });
    });
    advances.forEach(a => {
      if (!matchesCommon(a) || (typeFilter && typeFilter !== 'AVANCE')) return;
      (a.repaymentLogs ?? []).forEach((log: any) => {
        if (inPeriodLog(log)) touch(a.employee, a.employeeId).paidInPeriod += Number(log.amount);
      });
    });

    // On affiche tout employé ayant déjà eu un prêt/une avance (comme sur la
    // page Relevé) — pas seulement ceux avec une activité dans la période.
    return Array.from(map.values())
      .filter(r => r.totalGranted > 0)
      .sort((a, b) => b.totalRemaining - a.totalRemaining);
  }, [loans, advances, month, year, typeFilter, deptFilter, nameFilter]);

  const kpis = useMemo(() => ({
    employees: byEmployee.length,
    totalGranted: byEmployee.reduce((s, e) => s + e.totalGranted, 0),
    totalRepaidCumul: byEmployee.reduce((s, e) => s + e.totalRepaidCumul, 0),
    totalGiven: byEmployee.reduce((s, e) => s + e.givenInPeriod, 0),
    totalRemaining: byEmployee.reduce((s, e) => s + e.totalRemaining, 0),
    totalPaid: byEmployee.reduce((s, e) => s + e.paidInPeriod, 0),
  }), [byEmployee]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const params = new URLSearchParams({ year: String(year) });
      if (month !== '') params.set('month', String(month));
      if (deptFilter) params.set('department', deptFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`${API_URL}/loans/debt-tracking/export-xlsx?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error("Échec de l'export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `suivi-dettes-${year}${month !== '' ? '-' + month : ''}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsExporting(false); }
  };

  if (isLoading) return <DebtTrackingSkeleton />;
  type DebtRow = (typeof byEmployee)[number];
  const period = month !== '' ? MONTHS_FR[month - 1] : year;
  const columns: Column<DebtRow>[] = [
    { key:'employee',label:'Employé',render:e=><Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)}>{[e.employee?.firstName,e.employee?.lastName].filter(Boolean).join(' ') || 'Employé'}</Link> },
    { key:'department',label:'Département',render:e=>e.employee?.department?.name || '—' },
    { key:'types',label:'Type(s)',render:e=>Array.from(e.types as Set<string>).map((t:string)=>TYPE_LABEL[t]??t).join(', ')||'—' },
    { key:'given',label:`Accordé (${period})`,render:e=><span className="debt-tracking-money">{e.givenInPeriod>0?fmt(e.givenInPeriod):'—'}</span> },
    { key:'paid',label:`Remboursé (${period})`,render:e=><span className="debt-tracking-money debt-tracking-paid">{e.paidInPeriod>0?fmt(e.paidInPeriod):'—'}</span> },
    { key:'remaining',label:'Solde restant (à ce jour)',render:e=><span className="debt-tracking-money debt-tracking-remaining">{fmt(e.totalRemaining)}</span> },
    { key:'view',label:'Fiche',render:e=><Link href={bp(`/loans/suivi-dettes/${e.employeeId}`)} className="debt-tracking-view">Voir la fiche <ChevronRight size={16} strokeWidth={1.5}/></Link> },
  ];
  return <div className="debt-tracking"><ListPage title="Suivi des dettes" description="Le solde restant est toujours à jour ; accordé et remboursé reflètent l’activité de la période affichée." navigation={<FinanceSubNav userRole={userRole}/>} error={loadError}
    action={<Button onClick={handleExport} loading={isExporting}><Download size={17} strokeWidth={1.5}/>Exporter en Excel</Button>}
    summary={<div className="debt-tracking-summary"><LoanSpaceKpi label="Employés concernés" value={kpis.employees} isCount/><LoanSpaceKpi label="Montant total accordé" value={kpis.totalGranted}/><LoanSpaceKpi label="Total remboursé (cumul)" value={kpis.totalRepaidCumul} tone="success"/><LoanSpaceKpi label="Solde restant (à ce jour)" value={kpis.totalRemaining} tone="warning"/></div>}>
    <Card title="Période et filtres"><div className="template-stack"><div className="debt-tracking-mode" role="group" aria-label="Période du suivi"><Button variant="secondary" aria-pressed={month!==''} onClick={()=>{if(month==='')setMonth(now.getMonth()+1);}}>Mensuelle</Button><Button variant="secondary" aria-pressed={month===''} onClick={()=>setMonth('')}>Annuelle</Button></div><div className="debt-tracking-filters">
      <Input label="Rechercher un employé" value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="Nom ou prénom"/>
      {month!==''&&<Select label="Mois" value={month} onChange={e=>setMonth(Number(e.target.value))}>{MONTHS_FR.map((name,i)=><option key={name} value={i+1}>{name}</option>)}</Select>}
      <Select label="Année" value={year} onChange={e=>setYear(Number(e.target.value))}>{availableYears.map(value=><option key={value} value={value}>{value}</option>)}</Select>
      <Select label="Département" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}><option value="">Tous les départements</option>{departments.map(value=><option key={value} value={value}>{value}</option>)}</Select>
      <Select label="Type de demande" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="">Tous les types</option>{Object.entries(TYPE_LABEL).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select>
    </div><p className="k-help">La période filtre l’activité. Le solde restant conserve les dettes encore dues, même lorsqu’elles sont plus anciennes.</p></div></Card>
    <div className="debt-tracking-period"><LoanSpaceKpi label={`Accordé (${period})`} value={kpis.totalGiven}/><LoanSpaceKpi label={`Remboursé (${period})`} value={kpis.totalPaid} tone="success"/></div>
    <Card title="Employés concernés"><div className="debt-tracking-table"><DataTable caption="Suivi des dettes par employé" columns={columns} rows={byEmployee} rowKey={e=>e.employeeId} empty={<EmptyState title="Les dettes validées apparaîtront ici">Aucun employé ne correspond aux filtres avec un prêt ou une avance validés. Essayez un autre nom, département ou type.</EmptyState>}/></div></Card>
  </ListPage></div>;
}
function DebtTrackingSkeleton(){return <div className="debt-tracking template-page" role="status" aria-label="Chargement du suivi des dettes"><Skeleton style={{height:36,width:240}}/><div className="debt-tracking-summary">{[0,1,2,3].map(i=><Card key={i}><Skeleton/><Skeleton style={{height:28,marginTop:16}}/></Card>)}</div><Card><Skeleton style={{height:100}}/></Card><div className="debt-tracking-period">{[0,1].map(i=><Card key={i}><Skeleton/><Skeleton style={{height:28,marginTop:16}}/></Card>)}</div><Card><div className="template-stack">{[0,1,2].map(i=><Skeleton key={i} style={{height:40}}/>)}</div></Card></div>;}
