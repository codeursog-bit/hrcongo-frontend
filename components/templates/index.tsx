'use client';
import React from 'react';
import { Button, Card, TableSkeleton } from '@/components/design-system/primitives';
import './templates.css';

export interface PageProps { title: string; description?: string; action?: React.ReactNode; navigation?: React.ReactNode; children: React.ReactNode }
export function PageHeader({ title, description, action, navigation }: Omit<PageProps, 'children'>) {
  return <><header className="template-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="template-actions">{action}</div>}</header>{navigation}</>;
}
export function ListPage({ title, description, action, navigation, summary, filters, loading, error, children, header }: PageProps & { summary?: React.ReactNode; filters?: React.ReactNode; loading?: boolean; error?: string; header?: React.ReactNode }) {
  return <div className="template-page">{header === undefined ? <PageHeader {...{ title, description, action, navigation }} /> : header}{summary && <div className="template-summary">{summary}</div>}{filters && <div className="template-filters">{filters}</div>}{error && <p className="k-error" role="alert">{error}</p>}{loading ? <Card><TableSkeleton /></Card> : children}</div>;
}
export function DetailPage({ title, description, action, navigation, status, history, aside, children, header }: PageProps & { status?: React.ReactNode; history?: React.ReactNode; aside?: React.ReactNode; header?: React.ReactNode }) {
  return <div className="template-page">{header === undefined ? <PageHeader {...{ title, description, action, navigation }} /> : header}{status && <div>{status}</div>}<div className={aside ? 'template-columns' : 'template-stack'}><div className="template-stack">{children}{history}</div>{aside && <aside className="template-stack">{aside}</aside>}</div></div>;
}
export function FormPage({ title, description, action, navigation, summary, children }: PageProps & { summary?: React.ReactNode }) {
  return <div className="template-page"><PageHeader {...{ title, description, action, navigation }} /><div className="template-columns"><div className="template-stack">{children}</div>{summary && <aside className="template-summary-sticky">{summary}</aside>}</div></div>;
}
export function DashboardPage({ title, description, action, navigation, summary, children, header }: PageProps & { summary?: React.ReactNode; header?: React.ReactNode }) {
  return <div className="template-page">{header === undefined ? <PageHeader {...{ title, description, action, navigation }} /> : header}{summary && <div className="template-summary">{summary}</div>}<div className="template-dashboard">{children}</div></div>;
}
export function SettingsPage({ title, description, navigation, children, onSubmit, saving, saved, error, saveAction }: Omit<PageProps, 'action'> & { onSubmit: React.FormEventHandler<HTMLFormElement>; saving?: boolean; saved?: boolean; error?: string; saveAction?: React.ReactNode }) {
  return <div className="template-page"><PageHeader {...{ title, description, navigation }} /><form onSubmit={onSubmit} className="template-stack">{children}<div className="template-save">{error && <p className="k-error" role="alert">{error}</p>}{saved && <p role="status" className="k-caption">Modifications enregistrées.</p>}{saveAction === undefined ? <Button type="submit" loading={saving}>Enregistrer les modifications</Button> : saveAction}</div></form></div>;
}
