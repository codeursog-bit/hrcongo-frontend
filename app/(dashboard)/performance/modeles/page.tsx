'use client';

// ============================================================================
// 📄 app/(dashboard)/performance/modeles/page.tsx
// Modèles de fiche par poste (équivalent de l'onglet "Chauffeur" de l'Excel) :
//   • facteurs de succès / compétences (poids = 100 %)
//   • objectifs proposés au lancement d'un cycle (poids = 100 %), facultatifs
// Édition réservée à la RH ; consultation pour les managers.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Loader2, X, Trash2, Pencil, CheckCircle2, AlertTriangle, Layers, Briefcase,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, getStoredUser, sumWeights } from '@/components/performance/sheet-types';

interface Criterion { id?: string; label: string; description?: string; weight: number }
interface Objective { title: string; kpi?: string | null; weight: number }
interface Template {
  id: string; name: string; description?: string | null; jobTitle?: string | null;
  criteria: Criterion[]; objectives?: Objective[] | null;
}
interface TemplatesResponse {
  builtin: Array<{ id: string; name: string; criteria: Criterion[] }>;
  custom: Template[];
}

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';

function evenWeights(n: number): number[] {
  if (n <= 0) return [];
  const base = Math.floor((100 / n) * 100) / 100;
  const w = Array(n).fill(base);
  w[n - 1] = Math.round((100 - base * (n - 1)) * 100) / 100;
  return w;
}

function TotalChip({ items }: { items: Array<{ weight?: number | null }> }) {
  const total = sumWeights(items);
  const ok = Math.abs(total - 100) < 0.011;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${ok
      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
      {ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />} {total} %
    </span>
  );
}

// ─── Éditeur ─────────────────────────────────────────────────────────────────
function TemplateEditor({ template, positions, onClose, onSaved }: { template: Template | null; positions: string[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(template?.name ?? '');
  const [jobTitle, setJobTitle] = useState(template?.jobTitle ?? '');
  const [criteria, setCriteria] = useState<Criterion[]>(template?.criteria ?? [
    { label: '', weight: 20 }, { label: '', weight: 20 }, { label: '', weight: 20 }, { label: '', weight: 20 }, { label: '', weight: 20 },
  ]);
  const [objectives, setObjectives] = useState<Objective[]>(template?.objectives ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setC = (i: number, p: Partial<Criterion>) => setCriteria(prev => prev.map((c, k) => (k === i ? { ...c, ...p } : c)));
  const setO = (i: number, p: Partial<Objective>) => setObjectives(prev => prev.map((o, k) => (k === i ? { ...o, ...p } : o)));

  const rebalance = (kind: 'c' | 'o') => {
    if (kind === 'c') setCriteria(prev => evenWeights(prev.length).map((w, i) => ({ ...prev[i], weight: w })));
    else setObjectives(prev => evenWeights(prev.length).map((w, i) => ({ ...prev[i], weight: w })));
  };

  const save = async () => {
    setSaving(true); setError(null);
    const body = {
      name, jobTitle: jobTitle.trim() || null,
      criteria: criteria.map(c => ({ ...c, label: c.label.trim() })),
      objectives: objectives.length ? objectives.map(o => ({ ...o, title: o.title.trim() })) : [],
    };
    try {
      if (template) await api.patch(`/performance/templates/${template.id}`, body);
      else await api.post('/performance/templates', body);
      onSaved(); onClose();
    } catch (e: any) { setError(e?.message || 'Enregistrement impossible'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{template ? 'Modifier la grille' : 'Nouvelle grille'}</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la grille</label>
              <input className={`${inputCls} mt-1`} value={name} onChange={e => setName(e.target.value)} placeholder="ex : Chauffeur" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pour quel poste ? <span className="text-xs font-normal text-gray-400">(facultatif)</span></label>
              <input className={`${inputCls} mt-1`} list="template-positions" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Choisissez un poste existant" />
              <datalist id="template-positions">{positions.map(p => <option key={p} value={p} />)}</datalist>
              <p className="text-xs text-gray-400 mt-1">Doit être écrit comme dans la fiche employé : c'est ce qui rattache le modèle aux bons employés.</p>
            </div>
          </div>

          {/* Critères */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div><h3 className="font-bold text-gray-900 dark:text-white">Critères de notation</h3><p className="text-xs text-gray-400">Ce sur quoi on note. « % » = l'importance du critère (le total doit faire 100 %).</p></div>
              <div className="flex items-center gap-2">
                <TotalChip items={criteria} />
                <button type="button" onClick={() => rebalance('c')} className="text-xs font-bold text-purple-600 hover:underline">Répartir</button>
              </div>
            </div>
            {criteria.map((c, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input className={inputCls} value={c.label} onChange={e => setC(i, { label: e.target.value })} placeholder="Critère (ex : Qualité & Rigueur)" />
                  <input className={`${inputCls} text-xs`} value={c.description ?? ''} onChange={e => setC(i, { description: e.target.value })} placeholder="Description (facultatif)" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" min={1} max={100} inputMode="decimal" className={`${inputCls} w-[4.5rem] text-center`} value={c.weight}
                    onChange={e => setC(i, { weight: Number(e.target.value) })} aria-label="Poids en pourcentage" />
                  <span className="text-sm text-gray-400">%</span>
                  <button type="button" aria-label="Retirer" onClick={() => setCriteria(prev => prev.filter((_, k) => k !== i))}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setCriteria(prev => [...prev, { label: '', weight: 0 }])}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold text-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Ajouter un critère
            </button>
          </div>

          {/* Objectifs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Objectifs de départ <span className="text-xs font-normal text-gray-400">(facultatif)</span></h3>
                <p className="text-xs text-gray-400">Donnés automatiquement à un employé de ce poste qui n'a encore aucun objectif.</p>
              </div>
              {objectives.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <TotalChip items={objectives} />
                  <button type="button" onClick={() => rebalance('o')} className="text-xs font-bold text-purple-600 hover:underline">Répartir</button>
                </div>
              )}
            </div>
            {objectives.map((o, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input className={inputCls} value={o.title} onChange={e => setO(i, { title: e.target.value })} placeholder="Objectif" />
                  <input className={`${inputCls} text-xs`} value={o.kpi ?? ''} onChange={e => setO(i, { kpi: e.target.value })} placeholder="Livrables / KPI" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" min={1} max={100} inputMode="decimal" className={`${inputCls} w-[4.5rem] text-center`} value={o.weight}
                    onChange={e => setO(i, { weight: Number(e.target.value) })} aria-label="Poids en pourcentage" />
                  <span className="text-sm text-gray-400">%</span>
                  <button type="button" aria-label="Retirer" onClick={() => setObjectives(prev => prev.filter((_, k) => k !== i))}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setObjectives(prev => [...prev, { title: '', kpi: '', weight: 0 }])}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold text-sm flex items-center justify-center gap-2">
              <Plus size={16} /> Ajouter un objectif
            </button>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const { bp } = useBasePath();
  const [data, setData] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHR, setIsHR] = useState(false);
  const [editing, setEditing] = useState<Template | null | 'new'>(null);
  const [positions, setPositions] = useState<Record<string, { label: string; count: number }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.get<TemplatesResponse>('/performance/templates'));
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    setIsHR(!!u?.role && HR_ROLES.includes(u.role));
    load();
    // Postes réellement utilisés dans l'entreprise : aide à la saisie + détection de fautes de frappe
    api.get<any[]>('/employees/simple')
      .then(list => {
        const acc: Record<string, { label: string; count: number }> = {};
        (Array.isArray(list) ? list : []).forEach(e => {
          const label = (e.position ?? '').trim();
          if (!label) return;
          const k = label.toLowerCase();
          acc[k] = { label: acc[k]?.label ?? label, count: (acc[k]?.count ?? 0) + 1 };
        });
        setPositions(acc);
      })
      .catch(() => setPositions({}));
  }, [load]);

  const remove = async (t: Template) => {
    if (!confirm(`Supprimer la grille « ${t.name} » ?\nLes évaluations déjà créées ne sont pas modifiées.`)) return;
    try { await api.delete(`/performance/templates/${t.id}`); load(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={bp('/performance/cycles')} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 mb-2">
            <ArrowLeft size={14} /> Campagnes
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Grilles de notation</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">La liste des critères sur lesquels on note. Créez-en une par poste : elle est utilisée automatiquement.</p>
        </div>
        {isHR && (
          <button onClick={() => setEditing('new')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2">
            <Plus size={20} /> Nouvelle grille
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-4 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={28} /></div>
      ) : data && (
        <>
          {data.custom.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <Layers className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="font-bold text-gray-900 dark:text-white">Vous n'avez pas encore créé de grille</p>
              <p className="text-sm text-gray-500 mt-1">Pas de souci : une grille standard est utilisée pour tout le monde tant que vous n'en créez pas.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.custom.map(t => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{t.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                        <Briefcase size={13} /> {t.jobTitle || 'Tous les postes'}
                      </p>
                      {t.jobTitle && Object.keys(positions).length > 0 && (
                        positions[t.jobTitle.trim().toLowerCase()]
                          ? <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{positions[t.jobTitle.trim().toLowerCase()].count} employé(s) concerné(s)</p>
                          : <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> Aucun employé n'a ce poste : vérifiez l'orthographe.</p>
                      )}
                    </div>
                    {isHR && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditing(t)} aria-label="Modifier" className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"><Pencil size={16} /></button>
                        <button onClick={() => remove(t)} aria-label="Supprimer" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600 dark:text-gray-300 flex-1">
                    {t.criteria.slice(0, 5).map((c, i) => (
                      <li key={i} className="flex items-center justify-between gap-2"><span className="truncate">{c.label}</span><span className="text-gray-400 shrink-0">{c.weight} %</span></li>
                    ))}
                    {t.criteria.length > 5 && <li className="text-xs text-gray-400">+ {t.criteria.length - 5} autre(s)</li>}
                  </ul>
                  {t.objectives && t.objectives.length > 0 && (
                    <p className="mt-3 text-xs text-gray-400">{t.objectives.length} objectif(s) proposé(s)</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Grilles déjà prêtes (non modifiables)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.builtin.map(b => (
                <div key={b.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{b.criteria.length} critères</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {editing && (
          <TemplateEditor
            key={editing === 'new' ? 'new' : editing.id}
            template={editing === 'new' ? null : editing}
            positions={Object.values(positions).map(p => p.label)}
            onClose={() => setEditing(null)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}