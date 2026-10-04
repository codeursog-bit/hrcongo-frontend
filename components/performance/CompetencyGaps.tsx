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

const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm';

function LevelBar({ current, required }: { current: number | null; required: number }) {
  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`h-2.5 rounded-full ${current !== null && n <= current
            ? (current >= required ? 'bg-emerald-500' : 'bg-amber-400')
            : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      {/* repère du niveau requis */}
      <div className="absolute -top-1 h-4.5 w-0.5 bg-purple-600" style={{ left: `calc(${(required / 5) * 100}% - 3px)`, height: '18px' }} title={`Requis : ${required}`} />
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
    ? { label: 'Non évalué', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500', icon: <Clock size={12} /> }
    : row.gap > 0
      ? { label: `Écart de ${row.gap}`, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: <AlertTriangle size={12} /> }
      : { label: 'Atteint', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', icon: <CheckCircle2 size={12} /> };

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
            <h3 className="font-bold text-gray-900 dark:text-white break-words">{row.competency.name}</h3>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${CATEGORY_CLS[row.competency.category]}`}>
              {CATEGORY_LABEL[row.competency.category]}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${state.cls}`}>{state.icon} {state.label}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </div>
        <div className="mt-4">
          <LevelBar current={row.current} required={row.required} />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Actuel : <b className="text-gray-800 dark:text-gray-200">{row.current ?? '—'}</b>/5</span>
            <span>Requis : <b className="text-purple-600 dark:text-purple-400">{row.required}</b>/5</span>
          </div>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          {row.competency.description && <p className="text-sm text-gray-600 dark:text-gray-300">{row.competency.description}</p>}

          {row.assessedAt && (
            <p className="text-xs text-gray-400">
              Dernière évaluation : {fmtDate(row.assessedAt)} ({row.source === 'REVIEW' ? "lors d'une évaluation" : 'saisie manuelle'})
            </p>
          )}

          {Object.keys(levels).length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {[1, 2, 3, 4, 5].filter(n => levels[String(n)]).map(n => (
                <li key={n} className={`flex gap-2 rounded-lg px-2.5 py-1.5 ${n === row.required ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                  <span className="font-bold text-purple-600 w-4 shrink-0">{n}</span>
                  <span className="text-gray-600 dark:text-gray-300 break-words">{levels[String(n)]}</span>
                </li>
              ))}
            </ul>
          )}

          {mode === 'supervisor' && onLevel && (
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Nouveau niveau</p>
              <ScorePicker value={pendingLevel ?? null} onChange={onLevel}
                levels={{ '1': levels['1'] ?? 'Notions', '2': levels['2'] ?? 'Débutant', '3': levels['3'] ?? 'Autonome', '4': levels['4'] ?? 'Confirmé', '5': levels['5'] ?? 'Expert' }} />
            </div>
          )}

          {row.gap > 0 && row.courses.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><GraduationCap size={16} className="text-purple-600" /> Formations pour progresser</p>
              <div className="space-y-2">
                {row.courses.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                      {c.durationHours ? <p className="text-xs text-gray-400">{c.durationHours} h</p> : null}
                    </div>
                    <button type="button" disabled={busy === c.id || done.has(c.id)} onClick={() => enroll(c.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 min-h-[40px] ${done.has(c.id)
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'} disabled:opacity-70`}>
                      {busy === c.id ? <Loader2 size={12} className="animate-spin" /> : done.has(c.id) ? <Check size={12} /> : null}
                      {done.has(c.id) ? 'Inscrit' : mode === 'self' ? "M'inscrire" : 'Affecter'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {row.gap > 0 && row.courses.length === 0 && (
            <p className="text-xs text-gray-400">Aucune formation n'est encore liée à cette compétence.</p>
          )}
          {error && <p className="text-xs text-red-500 break-words">{error}</p>}
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
      <div className={`${cardCls} p-8 text-center text-sm text-gray-500`}>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Atteintes', `${s.met}/${s.total}`, 'text-emerald-600'],
            ['Écarts', String(s.gaps), 'text-amber-600'],
            ['Non évaluées', String(s.notAssessed), 'text-gray-500'],
            ['Couverture', `${s.coverage} %`, 'text-purple-600'],
          ].map(([label, value, cls]) => (
            <div key={label} className={`${cardCls} p-4`}>
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400">Fiche de poste : {data.profile.title}. Le trait violet marque le niveau requis.</p>

      {[...data.rows].sort((a, b) => b.gap - a.gap).map(r => (
        <Row key={r.competency.id} row={r} mode={mode} employeeId={data.employee?.id} onChanged={onChanged}
          pendingLevel={pending[r.competency.id]}
          onLevel={mode === 'supervisor' && data.canAssess ? (n => setPending(p => ({ ...p, [r.competency.id]: n }))) : undefined} />
      ))}

      {mode === 'supervisor' && data.canAssess && pendingCount > 0 && (
        <div className="sticky bottom-3 z-20">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl p-3 sm:p-4 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300">{pendingCount} niveau(x) à enregistrer</span>
            <button onClick={save} disabled={saving}
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Enregistrer
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">{error}</p>}
        </div>
      )}
    </div>
  );
}