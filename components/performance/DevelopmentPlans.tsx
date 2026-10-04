'use client';

// ============================================================================
// 📄 components/performance/DevelopmentPlans.tsx
// Plan(s) de développement d'un employé.
//  • employé (canEdit=false)  : change le statut de ses actions + ajoute une note
//  • supérieur / RH (canEdit) : crée un plan (vide ou depuis les écarts de
//    compétences), ajoute / modifie / supprime des actions
// ============================================================================

import React, { useState } from 'react';
import {
  Plus, Loader2, X, Trash2, Calendar, GraduationCap, Target, Wand2, StickyNote, Check, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { fmtDate } from './sheet-types';
import {
  ACTION_STATUS_LABEL, ACTION_TYPE_LABEL, ActionStatus, ActionType, DevAction, DevPlan, PlansData,
} from './career-types';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400';
const cardCls = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm';

const STATUS_CLS: Record<ActionStatus, string> = {
  TODO: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  DONE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

// ─── Une action ──────────────────────────────────────────────────────────────
function ActionRow({ a, canEdit, onChanged }: { a: DevAction; canEdit: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(a.employeeNote ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: any) => {
    setBusy(true); setError(null);
    try { await api.patch(`/performance/development/actions/${a.id}`, body); onChanged(); }
    catch (e: any) { setError(e?.message || 'Mise à jour impossible'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm('Supprimer cette action ?')) return;
    setBusy(true);
    try { await api.delete(`/performance/development/actions/${a.id}`); onChanged(); }
    catch (e: any) { setError(e?.message || 'Suppression impossible'); setBusy(false); }
  };

  const late = a.dueDate && a.status !== 'DONE' && new Date(a.dueDate) < new Date();

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className={`font-medium break-words ${a.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{a.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
            <span>{ACTION_TYPE_LABEL[a.type]}</span>
            {a.competency && <span className="flex items-center gap-1"><Target size={11} /> {a.competency.name}</span>}
            {a.course && <span className="flex items-center gap-1"><GraduationCap size={11} /> {a.course.title}</span>}
            {a.dueDate && <span className={`flex items-center gap-1 ${late ? 'text-amber-600 font-medium' : ''}`}><Calendar size={11} /> {fmtDate(a.dueDate)}{late ? ' · en retard' : ''}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && (
            <button onClick={remove} disabled={busy} aria-label="Supprimer" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={15} /></button>
          )}
          <button onClick={() => setOpen(!open)} aria-label="Détails" className="p-2 rounded-lg text-gray-400"><ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button>
        </div>
      </div>

      {/* Statut : 3 boutons tactiles */}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {(['TODO', 'IN_PROGRESS', 'DONE'] as ActionStatus[]).map(s => (
          <button key={s} type="button" disabled={busy || a.status === s} onClick={() => patch({ status: s })}
            className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-bold transition-colors ${a.status === s ? STATUS_CLS[s] + ' ring-2 ring-purple-400/40' : 'bg-gray-50 dark:bg-gray-900/40 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {ACTION_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          {a.description && <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{a.description}</p>}
          <div>
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1 mb-1"><StickyNote size={12} /> {canEdit ? "Note de l'employé" : 'Ma note'}</label>
            {canEdit ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 rounded-lg p-2.5 break-words">{a.employeeNote || '—'}</p>
            ) : (
              <>
                <textarea rows={2} className={inputCls} value={note} onChange={e => setNote(e.target.value)} placeholder="Ce que vous avez fait, difficultés rencontrées…" />
                <button disabled={busy || note === (a.employeeNote ?? '')} onClick={() => patch({ employeeNote: note })}
                  className="mt-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Enregistrer la note
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-2 break-words">{error}</p>}
    </div>
  );
}

// ─── Modales ────────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">{children}</div>
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">{footer}</div>
      </motion.div>
    </motion.div>
  );
}

function NewPlanModal({ employeeId, onClose, onDone }: { employeeId: string; onClose: () => void; onDone: (generated: number) => void }) {
  const [title, setTitle] = useState(`Plan de développement ${new Date().getFullYear()}`);
  const [dueDate, setDueDate] = useState('');
  const [fromGaps, setFromGaps] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.post<{ generatedFromGaps: number }>(`/performance/development/employee/${employeeId}/plans`,
        { title, dueDate: dueDate || null, fromGaps });
      onDone(r?.generatedFromGaps ?? 0); onClose();
    } catch (e: any) { setError(e?.message || 'Création impossible'); }
    finally { setBusy(false); }
  };

  return (
    <Sheet title="Nouveau plan de développement" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
        <button onClick={create} disabled={busy || !title.trim()}
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Créer
        </button>
      </>}>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
        <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Échéance du plan (facultatif)</label>
        <input type="date" className={`${inputCls} mt-1`} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>
      <button type="button" onClick={() => setFromGaps(!fromGaps)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-left">
        <span>
          <span className="block text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Wand2 size={14} className="text-purple-600" /> Partir des écarts de compétences</span>
          <span className="block text-xs text-gray-500">Une action par compétence en dessous du niveau requis, avec la formation liée si elle existe</span>
        </span>
        <span className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${fromGaps ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
          <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${fromGaps ? 'translate-x-5' : ''}`} />
        </span>
      </button>
      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
    </Sheet>
  );
}

function NewActionModal({ planId, onClose, onDone }: { planId: string; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<ActionType>('TRAINING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setBusy(true); setError(null);
    try {
      await api.post(`/performance/development/plans/${planId}/actions`, { type, title, description: description || null, dueDate: dueDate || null });
      onDone(); onClose();
    } catch (e: any) { setError(e?.message || 'Ajout impossible'); }
    finally { setBusy(false); }
  };

  return (
    <Sheet title="Ajouter une action" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300">Annuler</button>
        <button onClick={add} disabled={busy || !title.trim()}
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 size={16} className="animate-spin" />} Ajouter
        </button>
      </>}>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ACTION_TYPE_LABEL) as ActionType[]).map(k => (
          <button key={k} type="button" onClick={() => setType(k)}
            className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${type === k ? 'bg-purple-600 text-white border-purple-600' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
            {ACTION_TYPE_LABEL[k]}
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
        <input className={`${inputCls} mt-1`} value={title} onChange={e => setTitle(e.target.value)} placeholder="ex : Suivre la formation conduite défensive" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Détails (facultatif)</label>
        <textarea rows={2} className={`${inputCls} mt-1`} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Échéance (facultatif)</label>
        <input type="date" className={`${inputCls} mt-1`} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3 break-words">{error}</p>}
    </Sheet>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export function DevelopmentPlans({ data, canEdit, onChanged }: { data: PlansData; canEdit: boolean; onChanged: () => void }) {
  const [newPlan, setNewPlan] = useState(false);
  const [addTo, setAddTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const planStatus = (p: DevPlan) =>
    p.status === 'COMPLETED' ? { label: 'Terminé', cls: STATUS_CLS.DONE }
    : p.status === 'CANCELLED' ? { label: 'Annulé', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500' }
    : { label: 'En cours', cls: STATUS_CLS.IN_PROGRESS };

  const setStatus = async (p: DevPlan, status: 'ACTIVE' | 'CANCELLED') => {
    try { await api.patch(`/performance/development/plans/${p.id}`, { status }); onChanged(); }
    catch (e: any) { alert(e?.message || 'Mise à jour impossible'); }
  };

  const removePlan = async (p: DevPlan) => {
    if (!confirm(`Supprimer le plan « ${p.title} » et ses actions ?`)) return;
    try { await api.delete(`/performance/development/plans/${p.id}`); onChanged(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  return (
    <div className="space-y-4">
      {canEdit && (
        <button onClick={() => setNewPlan(true)}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2">
          <Plus size={18} /> Nouveau plan
        </button>
      )}
      {notice && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm p-3">{notice}</div>}

      {data.plans.length === 0 ? (
        <div className={`${cardCls} p-8 text-center text-sm text-gray-500`}>
          {canEdit ? "Aucun plan. Créez-en un pour structurer la progression de l'employé." : "Aucun plan de développement pour le moment."}
        </div>
      ) : data.plans.map(p => {
        const ps = planStatus(p);
        const editable = canEdit && p.status !== 'CANCELLED';
        return (
          <div key={p.id} className={`${cardCls} p-4 sm:p-5 space-y-4 ${p.status === 'CANCELLED' ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white break-words">{p.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${ps.cls}`}>{ps.label}</span>
                  {p.dueDate && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} /> {fmtDate(p.dueDate)}</span>}
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 shrink-0">
                  {p.status === 'CANCELLED'
                    ? <button onClick={() => setStatus(p, 'ACTIVE')} className="px-3 py-2 rounded-lg text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20">Réactiver</button>
                    : p.status === 'ACTIVE' && <button onClick={() => setStatus(p, 'CANCELLED')} className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>}
                  <button onClick={() => removePlan(p)} aria-label="Supprimer le plan" className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">{p.progress.done}/{p.progress.total} action(s)</span>
                <span className="font-bold text-purple-600">{p.progress.pct} %</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"><div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${p.progress.pct}%` }} /></div>
            </div>

            <div className="space-y-3">
              {p.actions.map(a => <ActionRow key={a.id} a={a} canEdit={canEdit} onChanged={onChanged} />)}
              {p.actions.length === 0 && <p className="text-sm text-gray-400">Aucune action.</p>}
            </div>

            {editable && (
              <button onClick={() => setAddTo(p.id)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 hover:border-purple-400 hover:text-purple-600 font-bold text-sm flex items-center justify-center gap-2">
                <Plus size={16} /> Ajouter une action
              </button>
            )}
          </div>
        );
      })}

      <AnimatePresence>
        {newPlan && (
          <NewPlanModal employeeId={data.employeeId!} onClose={() => setNewPlan(false)}
            onDone={n => { setNotice(n > 0 ? `${n} action(s) créée(s) à partir des écarts de compétences.` : 'Plan créé. Aucun écart de compétence constaté : ajoutez vos actions.'); onChanged(); }} />
        )}
        {addTo && <NewActionModal planId={addTo} onClose={() => setAddTo(null)} onDone={onChanged} />}
      </AnimatePresence>
    </div>
  );
}