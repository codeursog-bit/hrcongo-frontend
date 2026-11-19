'use client';

// ============================================================================
// 📄 components/performance/CompetencyGaps.tsx
// Compétences d'un employé : niveau actuel vs niveau requis par son poste.
//  • mode "self"       : l'employé consulte et peut s'inscrire à une formation suggérée
//  • mode "supervisor" : le supérieur / la RH met à jour les niveaux et affecte une formation
// ============================================================================

import React, { useState } from 'react';
import { Loader2, Check, GraduationCap, ChevronDown, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/services/api';
import { ScorePicker } from './ScorePicker';
import { fmtDate } from './sheet-types';
import { CATEGORY_CLS, CATEGORY_LABEL, EmployeeCompetencies, GapRowData } from './competency-types';

interface Props {
  data: EmployeeCompetencies;
  mode: 'self' | 'supervisor';
  onChanged?: () => void;
}

const cardCls = 'bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm';

function LevelBar({ current, required }: { current: number | null; required: number }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`h-2.5 rounded-full ${current !== null && n <= current
            ? (current >= required ? 'bg-[var(--green)]' : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]')
            : 'bg-[var(--surface-2)]'}`} />
        ))}
      </div>
      {/* repère du niveau requis */}
      <div className="absolute -top-1 h-4.5 w-0.5 bg-[var(--brand)]" style={{ left: `calc(${(required / 5) * 100}% - 3px)`, height: '18px' }} title={`Requis : ${required}`} />
    </div>
  );
}

function Row({ row, mode, employeeId, onChanged, pendingLevel, onLevel }: {
  row: GapRowData; mode: Props['mode']; employeeId?: string; onChanged?: () => void;
  pendingLevel?: number; onLevel?: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const levels = row.competency.levels ?? {};
  const state = row.current === null
    ? { label: 'Non évalué', cls: 'bg-[var(--surface-2)] text-[var(--text-secondary)]', icon: <Clock strokeWidth={1.5} size={12} /> }
    : row.gap > 0
      ? { label: `Écart de ${row.gap}`, cls: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]', icon: <AlertTriangle strokeWidth={1.5} size={12} /> }
      : { label: 'Atteint', cls: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]', icon: <CheckCircle2 strokeWidth={1.5} size={12} /> };

  const enroll = async (courseId: string) => {
    setBusy(courseId); setError(null);
    try {
      if (mode === 'self') await api.post(`/training/join/${courseId}`, {});
      else await api.post('/training/assign', { courseId, employeeId });
      setDone(prev => new Set(prev).add(courseId));
      onChanged?.();
    } catch (e: any) { setError(e?.message || 'Action impossible'); }
    finally { setBusy(null); }
  };

  return (
    <div className={`${cardCls} p-4 sm:p-5`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left" aria-expanded={open}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--text)] break-words">{row.competency.name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${CATEGORY_CLS[row.competency.category]}`}>
              {CATEGORY_LABEL[row.competency.category]}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${state.cls}`}>{state.icon} {state.label}</span>
            <ChevronDown strokeWidth={1.5} size={16} className={`text-[var(--text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        <div className="mt-4">
          <LevelBar current={row.current} required={row.required} />
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-2">
            <span>Actuel : <b className="text-[var(--text)]">{row.current ?? '—'}</b>/5</span>
            <span>Requis : <b className="text-[var(--action)]">{row.required}</b>/5</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-4">
          {row.competency.description && <p className="text-sm text-[var(--text-secondary)]">{row.competency.description}</p>}

          {row.assessedAt && (
            <p className="text-xs text-[var(--text-secondary)]">
              Dernière évaluation : {fmtDate(row.assessedAt)} ({row.source === 'REVIEW' ? "lors d'une évaluation" : 'saisie manuelle'})
            </p>
          )}

          {Object.keys(levels).length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {[1, 2, 3, 4, 5].filter(n => levels[String(n)]).map(n => (
                <li key={n} className={`flex gap-2 rounded-lg px-2.5 py-1.5 ${n === row.required ? 'bg-[var(--brand-soft)]' : ''}`}>
                  <span className="font-semibold text-[var(--action)] w-4 shrink-0">{n}</span>
                  <span className="text-[var(--text-secondary)] break-words">{levels[String(n)]}</span>
                </li>
              ))}
            </ul>
          )}

          {mode === 'supervisor' && onLevel && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">Nouveau niveau</p>
              <ScorePicker value={pendingLevel ?? null} onChange={onLevel}
                levels={{ '1': levels['1'] ?? 'Notions', '2': levels['2'] ?? 'Débutant', '3': levels['3'] ?? 'Autonome', '4': levels['4'] ?? 'Confirmé', '5': levels['5'] ?? 'Expert' }} />
            </div>
          )}

          {row.gap > 0 && row.courses.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2 flex items-center gap-2"><GraduationCap strokeWidth={1.5} size={16} className="text-[var(--action)]" /> Formations pour progresser</p>
              <div className="space-y-2">
                {row.courses.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{c.title}</p>
                      {c.durationHours ? <p className="text-xs text-[var(--text-secondary)]">{c.durationHours} h</p> : null}
                    </div>
                    <button type="button" disabled={busy === c.id || done.has(c.id)} onClick={() => enroll(c.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${done.has(c.id)
                        ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]'
                        : 'bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)]'} disabled:opacity-70`}>
                      {busy === c.id ? <Loader2 strokeWidth={1.5} size={12} className="animate-spin" /> : done.has(c.id) ? <Check strokeWidth={1.5} size={12} /> : null}
                      {done.has(c.id) ? 'Inscrit' : mode === 'self' ? "M'inscrire" : 'Affecter'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {row.gap > 0 && row.courses.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)]">Aucune formation n'est encore liée à cette compétence.</p>
          )}
          {error && <p className="text-xs text-[var(--danger-text)] break-words">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function CompetencyGaps({ data, mode, onChanged }: Props) {
  const [pending, setPending] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data.profile) {
    return (
      <div className={`${cardCls} p-8 text-center text-sm text-[var(--text-secondary)]`}>
        Aucune fiche de poste n'est définie pour {data.employee?.position ? `« ${data.employee.position} »` : 'ce poste'}.
        {mode === 'supervisor' ? " La RH peut la créer dans « Fiches de poste »." : ''}
      </div>
    );
  }

  const s = data.summary;
  const pendingCount = Object.keys(pending).length;

  const save = async () => {
    if (!data.employee) return;
    setSaving(true); setError(null);
    try {
      await api.post(`/performance/competencies/employee/${data.employee.id}/assess`, {
        assessments: Object.entries(pending).map(([competencyId, level]) => ({ competencyId, level })),
      });
      setPending({});
      onChanged?.();
    } catch (e: any) { setError(e?.message || 'Enregistrement impossible'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 performance-metrics">
          {[
            ['Atteintes', `${s.met}/${s.total}`, 'text-[var(--success-text)]'],
            ['Écarts', String(s.gaps), 'text-[var(--warning-text)]'],
            ['Non évaluées', String(s.notAssessed), 'text-[var(--text-secondary)]'],
            ['Couverture', `${s.coverage} %`, 'text-[var(--action)]'],
          ].map(([label, value, cls]) => (
            <div key={label} className={`${cardCls} p-4`}>
              <p className={`text-2xl font-semibold ${cls}`}>{value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-[var(--text-secondary)]">Fiche de poste : {data.profile.title}. Le trait violet marque le niveau requis.</p>

      {[...data.rows].sort((a, b) => b.gap - a.gap).map(r => (
        <Row key={r.competency.id} row={r} mode={mode} employeeId={data.employee?.id} onChanged={onChanged}
          pendingLevel={pending[r.competency.id]}
          onLevel={mode === 'supervisor' && data.canAssess ? (n => setPending(p => ({ ...p, [r.competency.id]: n }))) : undefined} />
      ))}

      {mode === 'supervisor' && data.canAssess && pendingCount > 0 && (
        <div className="sticky bottom-3 z-20">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl p-3 sm:p-4 flex items-center justify-between gap-3 performance-card">
            <span className="text-sm text-[var(--text-secondary)]">{pendingCount} niveau(x) à enregistrer</span>
            <button onClick={save} disabled={saving}
              className="px-5 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 strokeWidth={1.5} size={16} className="animate-spin" /> : <Check strokeWidth={1.5} size={16} />} Enregistrer
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3">{error}</p>}
        </div>
      )}
    </div>
  );
}
