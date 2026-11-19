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
  HIRE:     { icon: <UserPlus strokeWidth={1.5} size={16} />,       cls: 'bg-[var(--brand-soft)] text-[var(--action)]' },
  CAREER:   { icon: <Briefcase strokeWidth={1.5} size={16} />,      cls: 'bg-[var(--brand-soft)] text-[var(--action)]' },
  ECHELON:  { icon: <TrendingUp strokeWidth={1.5} size={16} />,     cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]' },
  TRAINING: { icon: <GraduationCap strokeWidth={1.5} size={16} />,  cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]' },
  REVIEW:   { icon: <ClipboardCheck strokeWidth={1.5} size={16} />, cls: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
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
    return <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-8 text-center text-sm text-[var(--text-secondary)] performance-card">Aucun événement pour le moment.</div>;
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--surface-2)]">
      {items.map(it => {
        const st = STYLE[it.kind];
        return (
          <li key={it.id} className="relative flex gap-3 sm:gap-4">
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-4 ring-[var(--focus)] ${st.cls}`}>{st.icon}</div>
            <div className="flex-1 min-w-0 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm p-4 performance-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text)] break-words">{it.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{fmtDate(it.date)}</p>
                </div>
                {it.deletable && (
                  <button onClick={() => remove(it.id)} disabled={busy === it.id} aria-label="Supprimer"
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] shrink-0">
                    {busy === it.id ? <Loader2 strokeWidth={1.5} size={15} className="animate-spin" /> : <Trash2 strokeWidth={1.5} size={15} />}
                  </button>
                )}
              </div>
              {(it.fromValue || it.toValue) && (
                <p className="mt-2 text-sm text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                  {it.fromValue && <span className="px-2 py-0.5 rounded-md bg-[var(--surface-2)]">{it.fromValue}</span>}
                  {it.fromValue && it.toValue && <ArrowRight strokeWidth={1.5} size={14} className="text-[var(--text-secondary)]" />}
                  {it.toValue && <span className="px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--action)] font-medium">{it.toValue}</span>}
                </p>
              )}
              {it.detail && <p className="mt-2 text-sm text-[var(--text-secondary)]">{it.detail}</p>}
              {it.notes && (
                <p className="mt-3 text-xs text-[var(--text-secondary)] bg-[var(--surface-2)] rounded-lg p-2.5 flex gap-2 break-words">
                  <StickyNote strokeWidth={1.5} size={13} className="shrink-0 mt-0.5" /> <span><b>Note interne :</b> {it.notes}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}