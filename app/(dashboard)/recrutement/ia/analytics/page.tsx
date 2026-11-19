'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Target, BarChart3, GitCompare,
  PieChart as PieChartIcon, AlertTriangle, BrainCircuit,
  CheckCircle2, XCircle, Clock, ArrowLeft,
} from 'lucide-react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/services/api';
import Link from 'next/link';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Button, Card, DataTable, EmptyState } from '@/components/design-system/primitives';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';

interface AIStats {
  total: number;
  retenu: number;
  moyenne: number;
  seconde: number;
  refus: number;
  overrideRate: number;
  avgScore: number;
}

// Type pour les données brutes de l'API
interface CandidateAPIResponse {
  id: string;
  firstName: string;
  lastName: string;
  aiSuggestion: string;
  hrDecision: string | null;
  totalScore: number;
  cvScore: number;
  testScore: number;
  jobOffer?: {
    title: string;
  };
}

// Type pour l'affichage
interface CandidateResult {
  id: string;
  name: string;
  jobTitle: string;
  aiSuggestion: string;
  hrDecision: string | null;
  totalScore: number;
  cvScore: number;
  testScore: number;
}

export default function AnalyticsAIPage() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, candidatesData] = await Promise.all([
        api.get<AIStats>('/recruitment/ai-stats'),
        api.get<CandidateAPIResponse[]>('/recruitment/candidates')
      ]);
      
      setStats(statsData);
      
      // Filtrer et transformer les candidats avec aiSuggestion
      const aiCandidates = candidatesData
        .filter(c => c.aiSuggestion)
        .map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          jobTitle: c.jobOffer?.title || 'Poste non spécifié',
          aiSuggestion: c.aiSuggestion,
          hrDecision: c.hrDecision,
          totalScore: c.totalScore || 0,
          cvScore: c.cvScore || 0,
          testScore: c.testScore || 0
        }));
      
      setCandidates(aiCandidates);
      setLoadError(false);
    } catch (error) {
      console.error('Failed to load recruitment AI analytics', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <KonzaLoader variant="page" />;
  }

  if (loadError) {
    return (
      <ModulePageFrame kind="dashboard">
        <EmptyState
          title="Impossible de charger les statistiques IA"
          icon={BrainCircuit}
          action={<Button variant="secondary" onClick={() => void fetchData()}>Réessayer</Button>}
        >
          Vérifiez votre connexion, puis réessayez.
        </EmptyState>
      </ModulePageFrame>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <ModulePageFrame kind="dashboard">
        <EmptyState
          title="Aucune donnée IA disponible"
          icon={BrainCircuit}
          action={<Link href="/recrutement" className="k-button k-button-secondary"><ArrowLeft size={18} />Retour au Recrutement</Link>}
        >
          Publiez des offres en mode IA assistée pour voir les statistiques apparaître ici.
        </EmptyState>
      </ModulePageFrame>
    );
  }

  const pieData = [
    { name: 'Retenus', value: stats.retenu, fill: 'var(--green)' },
    { name: 'Moyens', value: stats.moyenne, fill: 'var(--mustard)' },
    { name: 'Seconde Chance', value: stats.seconde, fill: 'var(--brand)' },
    { name: 'Refusés', value: stats.refus, fill: 'var(--danger)' }
  ];

  const retentionRate = stats.total > 0 
    ? Math.round((stats.retenu / stats.total) * 100) 
    : 0;

  return (
    <ModulePageFrame kind="dashboard">
      <div className="mx-auto max-w-[1600px] space-y-8 pb-16">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-[var(--text)]">
              <BrainCircuit className="text-[var(--brand-strong)]" />
              Recrutement IA <span className="text-[var(--brand-strong)]">· Analytiques</span>
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Métriques de performance du système de sélection automatisé.</p>
          </div>
          <Link href="/recrutement" className="k-button k-button-secondary self-start">
            <ArrowLeft size={18} /> Retour au recrutement
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Candidats analysés IA', value: stats.total, icon: Users, tone: 'text-[var(--brand-strong)]' },
            { label: 'Taux de rétention IA', value: `${retentionRate}%`, icon: Target, tone: 'text-[var(--success-text)]' },
            { label: 'Score moyen / 100', value: stats.avgScore, icon: BarChart3, tone: 'text-[var(--accent-2)]' },
            { label: 'Décisions RH différentes', value: `${stats.overrideRate}%`, icon: GitCompare, tone: 'text-[var(--text-secondary)]' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} className="h-full !p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">{label}</p>
                  <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
                </div>
                <Icon size={21} strokeWidth={1.5} className={tone} aria-hidden="true" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <PieChartIcon size={19} className="text-[var(--brand-strong)]" />
              <h2 className="text-base font-semibold">Distribution des suggestions</h2>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.fill} stroke="var(--surface)" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)' }} itemStyle={{ color: 'var(--text)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3" aria-label="Légende des suggestions">
              {pieData.map((entry) => (
                <li key={entry.name} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span>{entry.name} ({entry.value})</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="min-w-0 overflow-hidden xl:col-span-2">
            <div className="mb-5 flex items-center gap-2">
              <GitCompare size={19} className="text-[var(--brand-strong)]" />
              <h2 className="text-base font-semibold">Suggestion IA vs décision RH</h2>
            </div>
            <DataTable
              caption="Comparaison des suggestions IA et décisions RH"
              rows={candidates}
              rowKey={candidate => candidate.id}
              empty={<EmptyState title="Aucune comparaison disponible">Les décisions apparaîtront ici lorsqu’une suggestion IA sera évaluée.</EmptyState>}
              columns={[
                { key: 'candidate', label: 'Candidat', render: candidate => <><strong>{candidate.name}</strong><small>{candidate.jobTitle}</small></> },
                { key: 'cv', label: 'CV', render: candidate => <span className="font-mono">{candidate.cvScore}/35</span> },
                { key: 'test', label: 'Test', render: candidate => <span className="font-mono">{candidate.testScore}/65</span> },
                { key: 'total', label: 'Total', render: candidate => <span className="font-mono font-semibold text-[var(--brand-strong)]">{candidate.totalScore}/100</span> },
                { key: 'ai', label: 'Suggestion IA', render: candidate => <Badge tone={candidate.aiSuggestion === 'RETENU' ? 'success' : candidate.aiSuggestion === 'MOYENNE' ? 'warning' : candidate.aiSuggestion === 'SECONDE_CHANCE' ? 'neutral' : 'danger'}>{candidate.aiSuggestion.replace('_', ' ')}</Badge> },
                { key: 'hr', label: 'Décision RH', render: candidate => {
                  const isOverride = !!candidate.hrDecision && candidate.aiSuggestion !== candidate.hrDecision;
                  return <span className="flex items-center gap-2">{candidate.hrDecision
                    ? <Badge tone={candidate.hrDecision === 'RETENU' ? 'success' : candidate.hrDecision === 'MOYENNE' ? 'warning' : candidate.hrDecision === 'SECONDE_CHANCE' ? 'neutral' : 'danger'}>{candidate.hrDecision.replace('_', ' ')}</Badge>
                    : <span className="text-[var(--text-secondary)]">En attente</span>}
                    {isOverride && <span title="Décision RH différente de l'IA"><AlertTriangle size={14} className="text-[var(--warning-text)]" aria-label="Décision différente" /></span>}
                  </span>;
                } },
              ]}
            />
          </Card>
        </div>

        <section aria-label="Synthèse des profils" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="!p-5">
            <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-[var(--success-text)]" /><h2 className="font-semibold">Profils retenus</h2></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-[var(--success-text)]">{stats.retenu}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Candidats avec score ≥ 75/100</p>
          </Card>
          <Card className="!p-5">
            <div className="flex items-center gap-3"><Clock size={20} className="text-[var(--text-secondary)]" /><h2 className="font-semibold">Seconde chance</h2></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{stats.seconde}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Profils à potentiel (40–54 pts)</p>
          </Card>
          <Card className="!p-5">
            <div className="flex items-center gap-3"><XCircle size={20} className="text-[var(--danger-text)]" /><h2 className="font-semibold">Profils refusés</h2></div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-[var(--danger-text)]">{stats.refus}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Candidats avec score &lt; 40/100</p>
          </Card>
        </section>
      </div>
    </ModulePageFrame>
  );
}