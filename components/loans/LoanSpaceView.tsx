'use client';
import React from 'react';
import { Card, Skeleton } from '@/components/design-system/primitives';
import { SmoothChart } from '@/components/design-system/charts';
import './loan-space.css';

export function LoanSpaceSkeleton() {
  return <div className="loan-space template-page" role="status" aria-label="Chargement de vos demandes de prêts et avances"><Skeleton className="loan-space-title-skeleton" /><div className="loan-space-kpis">{[0,1,2,3].map(i => <Card key={i}><Skeleton /><Skeleton className="loan-space-value-skeleton" /></Card>)}</div><div className="request-master-detail"><Card><div className="template-stack">{[0,1,2].map(i => <Skeleton key={i} className="loan-space-row-skeleton" />)}</div></Card><Card><Skeleton className="loan-space-detail-skeleton" /></Card></div></div>;
}
export function LoanSpaceKpi({ label, value, isCount, tone }: { label: string; value: number; isCount?: boolean; tone?: 'neutral' | 'success' | 'warning' }) {
  return <Card className={`loan-space-kpi loan-space-kpi-${tone || 'neutral'}`}><p>{label}</p><strong>{isCount ? value : `${Math.round(value).toLocaleString('fr-FR')} FCFA`}</strong></Card>;
}
export function LoanDebtChart({ data }: { data: { mois: string; Emprunté: number; Remboursé: number }[] }) {
  return <Card title="Évolution de mes dettes (12 mois)"><SmoothChart label="Prêts et remboursements par mois" primaryLabel="Emprunté" secondaryLabel="Remboursé" data={data.map(d => ({ label: d.mois, primary: d.Emprunté, secondary: d.Remboursé }))} /></Card>;
}
