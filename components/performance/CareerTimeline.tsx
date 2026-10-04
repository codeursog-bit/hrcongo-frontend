'use client';

// ============================================================================
// 📄 components/performance/CareerTimeline.tsx
// Chronologie de carrière : la plus récente en haut. Les notes internes ne sont
// présentes que pour les supérieurs / la RH (l'API ne les envoie pas à l'employé).
// ============================================================================

import React, { useState } from 'react';
import {
  Briefcase, TrendingUp, GraduationCap, ClipboardCheck, UserPlus, Trash2, ArrowRight, StickyNote, Loader2,
} from 'lucide-react';
import { api } from '@/services/api';
import { fmtDate } from './sheet-types';
import { TimelineItem, TimelineKind } from './career-types';

const STYLE: Record<TimelineKind, { icon: React.ReactNode; cls: string }> = {
  HIRE:     { icon: <UserPlus size={16} />,       cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  CAREER:   { icon: <Briefcase size={16} />,      cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
  ECHELON:  { icon: <TrendingUp size={16} />,     cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' },
  TRAINING: { icon: <GraduationCap size={16} />,  cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  REVIEW:   { icon: <ClipboardCheck size={16} />, cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500' },
};

export function CareerTimeline({ items, onChanged }: { items: TimelineItem[]; onChanged?: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return;
    setBusy(id);
    try { await api.delete(`/performance/career/events/${id}`); onChanged?.(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
    finally { setBusy(null); }
  };

  if (items.length === 0) {
    return <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center text-sm text-gray-500">Aucun événement pour le moment.</div>;
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200 dark:before:bg-gray-700">
      {items.map(it => {
        const st = STYLE[it.kind];
        return (
          <li key={it.id} className="relative flex gap-3 sm:gap-4">
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-gray-50 dark:ring-gray-900 ${st.cls}`}>{st.icon}</div>
            <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white break-words">{it.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(it.date)}</p>
                </div>
                {it.deletable && (
                  <button onClick={() => remove(it.id)} disabled={busy === it.id} aria-label="Supprimer"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                    {busy === it.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                )}
              </div>
              {(it.fromValue || it.toValue) && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex flex-wrap items-center gap-2">
                  {it.fromValue && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700">{it.fromValue}</span>}
                  {it.fromValue && it.toValue && <ArrowRight size={14} className="text-gray-400" />}
                  {it.toValue && <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">{it.toValue}</span>}
                </p>
              )}
              {it.detail && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{it.detail}</p>}
              {it.notes && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2.5 flex gap-2 break-words">
                  <StickyNote size={13} className="shrink-0 mt-0.5" /> <span><b>Note interne :</b> {it.notes}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}