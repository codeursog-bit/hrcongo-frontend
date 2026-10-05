'use client';

// ============================================================================
// 📄 components/performance/PerformanceStart.tsx
// « Par où commencer ? » — carte de démarrage pour la RH et les managers.
// Elle montre les étapes dans l'ordre, coche ce qui est fait (calculé à partir
// des vraies données) et propose UN gros bouton : l'étape suivante.
// Pas de formation nécessaire : on suit simplement le bouton.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, ChevronDown, Compass } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, getStoredUser } from './sheet-types';

interface Props {
  /** Évaluations déjà chargées par la page (statut seulement) */
  reviews: Array<{ status: string }>;
}

interface Step {
  key: string;
  title: string;
  hint: string;
  href: string;
  cta: string;
  done: boolean;
  optional?: boolean;
  disabled?: boolean;
  badge?: string;
}

const HIDE_KEY = 'perf_start_hidden';

export default function PerformanceStart({ reviews }: Props) {
  const { bp } = useBasePath();
  const [isHR, setIsHR] = useState(false);
  const [goals, setGoals] = useState<number | null>(null);
  const [customGrids, setCustomGrids] = useState<number | null>(null);
  const [cycles, setCycles] = useState<Array<{ launchedAt?: string | null }> | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setIsHR(!!u?.role && HR_ROLES.includes(u.role));
    try { setHidden(localStorage.getItem(HIDE_KEY) === '1'); } catch { /* stockage indisponible */ }
    api.get<any[]>('/performance/goals').then(r => setGoals(Array.isArray(r) ? r.length : 0)).catch(() => setGoals(null));
    api.get<{ custom: any[] }>('/performance/templates').then(r => setCustomGrids(r?.custom?.length ?? 0)).catch(() => setCustomGrids(null));
    api.get<any[]>('/performance/cycles').then(r => setCycles(Array.isArray(r) ? r : [])).catch(() => setCycles(null));
  }, []);

  const toggle = (v: boolean) => {
    setHidden(v);
    try { localStorage.setItem(HIDE_KEY, v ? '1' : '0'); } catch { /* ignore */ }
  };

  // Tant que les données ne sont pas là, on n'affiche rien (évite un clignotement)
  if (goals === null || cycles === null) return null;

  const drafts = reviews.filter(r => r.status === 'DRAFT').length;
  const sent = reviews.filter(r => r.status === 'SUBMITTED').length;
  const hasReviews = reviews.length > 0;
  const launched = cycles.some(c => !!c.launchedAt);
  const hasCycle = cycles.length > 0;

  const steps: Step[] = [
    {
      key: 'goals', title: 'Fixer les objectifs',
      hint: "Dites à chaque employé ce qu'il doit atteindre.",
      href: '/performance/objectifs', cta: 'Créer des objectifs', done: goals > 0,
    },
    {
      key: 'grid', title: 'Choisir la grille de notation',
      hint: customGrids ? 'Vos grilles sont prêtes.' : 'Facultatif : une grille standard est déjà prête.',
      href: '/performance/modeles', cta: 'Voir les grilles', done: (customGrids ?? 0) > 0, optional: true,
    },
    {
      key: 'launch', title: "Lancer la campagne d'évaluation",
      hint: hasCycle
        ? 'Une fiche est créée pour chaque employé, avec ses objectifs.'
        : isHR ? 'Une campagne = évaluer toute l\'équipe pour une période (ex : T4 2026).' : "La RH doit d'abord créer la campagne.",
      href: '/performance/cycles', cta: hasCycle ? 'Lancer la campagne' : isHR ? 'Créer la campagne' : 'Voir les campagnes',
      done: launched, disabled: !hasCycle && !isHR,
    },
    {
      key: 'rate', title: 'Noter chaque employé',
      hint: drafts > 0 ? `${drafts} évaluation(s) à noter puis à envoyer.` : hasReviews ? 'Toutes les évaluations sont envoyées.' : 'Apparaît après le lancement.',
      href: '/performance', cta: 'Voir les évaluations à noter', done: hasReviews && drafts === 0,
      badge: drafts > 0 ? String(drafts) : undefined,
    },
    {
      key: 'read', title: "L'employé lit et confirme",
      hint: sent > 0 ? `${sent} employé(s) doivent encore confirmer avoir lu leur évaluation.` : hasReviews && drafts === 0 ? 'Tout le monde a confirmé.' : 'Après envoi de l\'évaluation.',
      href: '/performance', cta: 'Voir qui doit confirmer', done: hasReviews && drafts === 0 && sent === 0,
      badge: sent > 0 ? String(sent) : undefined,
    },
  ];

  const current = steps.find(s => !s.done && !s.optional && !s.disabled) ?? steps.find(s => !s.done && !s.optional);
  const required = steps.filter(s => !s.optional);
  const doneRequired = required.filter(s => s.done).length;
  const allDone = steps.every(s => s.done || s.optional);

  if (hidden) {
    return (
      <button onClick={() => toggle(false)} className="print:hidden text-sm font-bold text-purple-600 hover:underline flex items-center gap-1.5">
        <Compass size={15} /> Afficher le guide « Par où commencer ? »
      </button>
    );
  }

  return (
    <section className="print:hidden bg-white dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-purple-900/40 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0"><Compass size={20} /></div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-white">{allDone ? 'Tout est à jour 🎉' : 'Par où commencer ?'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {allDone ? 'Aucune action en attente. Relancez une campagne quand la prochaine période commence.' : 'Suivez les étapes dans l\'ordre. Le bouton violet vous emmène à la bonne page.'}
            </p>
          </div>
        </div>
        <button onClick={() => toggle(true)} className="text-xs font-bold text-gray-400 hover:text-gray-600 shrink-0 px-2 py-1 flex items-center gap-1" aria-label="Masquer le guide">
          Masquer <ChevronDown size={14} className="rotate-180" />
        </button>
      </div>

      <ol className="px-4 sm:px-5 pb-2 space-y-2">
        {steps.map((s, i) => {
          const isCurrent = current?.key === s.key;
          return (
            <li key={s.key} className={`flex items-start gap-3 rounded-xl p-3 ${isCurrent ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${s.done ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                {s.done ? <Check size={14} /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${s.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {s.title}{s.optional && <span className="ml-2 text-[11px] font-medium text-gray-400 no-underline">facultatif</span>}
                  {s.badge && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[11px] font-bold">{s.badge}</span>}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.hint}</p>
              </div>
              {!s.disabled && !s.done && (
                <Link href={bp(s.href)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 min-h-[40px] ${isCurrent ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20' : 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20'}`}>
                  <span className="hidden sm:inline">{s.cta}</span><span className="sm:hidden">Ouvrir</span> <ChevronRight size={14} />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <div className="px-5 pb-4 text-xs text-gray-400">{doneRequired} étape(s) sur {required.length} terminée(s)</div>
    </section>
  );
}