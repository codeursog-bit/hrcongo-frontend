'use client';
import { PerformanceOverlay } from '@/components/performance/PerformanceOverlay';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


// ============================================================================
// 📄 app/(dashboard)/performance/competences/page.tsx
// Compétences : vue équipe (RH + managers), référentiel et fiches de poste (RH).
// Un manager voit uniquement son département ; il ne modifie pas le référentiel.
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Loader2, X, Trash2, Pencil, AlertTriangle, Users, BookOpen,
  Briefcase, Search, ChevronRight, Wand2, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { api } from '@/services/api';
import PerformanceNav from '@/components/performance/PerformanceNav';
import { useBasePath } from '@/hooks/useBasePath';
import { HR_ROLES, getStoredUser } from '@/components/performance/sheet-types';
import {
  CATEGORY_CLS, CATEGORY_LABEL, CompetencyCategory, CompetencyItem, JobProfileItem, TeamOverview,
} from '@/components/performance/competency-types';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { PerformanceFrame as ModulePageFrame } from '@/components/performance/PerformanceFrame';

type Tab = 'team' | 'referentiel' | 'postes';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]';
const cardCls = 'bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm';

function Modal({ title, onClose, children, footer, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; wide?: boolean;
}) {
  return (
    <PerformanceOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[rgb(0_0_0_/.45)] sm:p-4" onClose={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} shadow-2xl border border-[var(--border)] max-h-[94vh] flex flex-col`}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"><X strokeWidth={1.5} size={18} /></button>
        </div>
        <div className="p-5 space-y-5 overflow-y-auto">{children}</div>
        <div className="p-5 border-t border-[var(--border)] flex gap-3">{footer}</div>
      </motion.div>
    </PerformanceOverlay>
  );
}

// ─── Éditeur de compétence ───────────────────────────────────────────────────
function CompetencyEditor({ item, courses, onClose, onSaved }: {
  item: CompetencyItem | null; courses: Array<{ id: string; title: string }>; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<CompetencyCategory>(item?.category ?? 'TECHNICAL');
  const [description, setDescription] = useState(item?.description ?? '');
  const [levels, setLevels] = useState<Record<string, string>>(item?.levels ?? {});
  const [courseIds, setCourseIds] = useState<string[]>(item?.courses.map(c => c.id) ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCourse = (id: string) => setCourseIds(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  const save = async () => {
    setSaving(true); setError(null);
    const body = { name, category, description: description || null, levels, courseIds };
    try {
      if (item) await api.patch(`/performance/competencies/${item.id}`, body);
      else await api.post('/performance/competencies', body);
      onSaved(); onClose();
    } catch (e: any) { setError(e?.message || 'Enregistrement impossible'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={item ? 'Modifier la compétence' : 'Nouvelle compétence'} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
        <button onClick={save} disabled={saving || !name.trim()}
          className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />} Enregistrer
        </button>
      </>}>
      <div>
        <label className="text-sm font-medium text-[var(--text)]">Nom</label>
        <input className={`${inputCls} mt-1`} value={name} onChange={e => setName(e.target.value)} placeholder="ex : Conduite défensive" />
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--text)]">Catégorie</label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {(Object.keys(CATEGORY_LABEL) as CompetencyCategory[]).map(k => (
            <button key={k} type="button" onClick={() => setCategory(k)}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${category === k
                ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]'
                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)]'}`}>
              {CATEGORY_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--text)]">Description (facultatif)</label>
        <textarea rows={2} className={`${inputCls} mt-1`} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text)]">Ce que signifie chaque niveau (facultatif)</p>
        <p className="text-xs text-[var(--text-secondary)] mb-2">Des descripteurs clairs rendent les notes comparables entre évaluateurs.</p>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[var(--brand-soft)] text-[var(--action)] text-sm font-semibold flex items-center justify-center shrink-0">{n}</span>
              <input className={inputCls} value={levels[String(n)] ?? ''} onChange={e => setLevels(p => ({ ...p, [String(n)]: e.target.value }))}
                placeholder={['Notions de base', 'Applique avec aide', 'Autonome', 'Confirmé, guide les autres', 'Expert, référent'][n - 1]} />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text)] mb-2">Formations liées <span className="text-xs font-normal text-[var(--text-secondary)]">(proposées en cas d'écart)</span></p>
        {courses.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">Aucune formation au catalogue.</p>
        ) : (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {courses.map(c => (
              <label key={c.id} className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[var(--surface-2)]">
                <input type="checkbox" className="w-5 h-5 accent-purple-600" checked={courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)} />
                <span className="text-sm text-[var(--text)] truncate">{c.title}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3 break-words">{error}</p>}
    </Modal>
  );
}

// ─── Éditeur de fiche de poste ───────────────────────────────────────────────
function ProfileEditor({ item, competencies, suggestions, onClose, onSaved }: {
  item: JobProfileItem | null; competencies: CompetencyItem[]; suggestions: string[]; onClose: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [reqs, setReqs] = useState<Array<{ competencyId: string; requiredLevel: number }>>(
    item?.requirements.map(r => ({ competencyId: r.competencyId, requiredLevel: r.requiredLevel })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = competencies.filter(c => c.isActive);
  const available = active.filter(c => !reqs.some(r => r.competencyId === c.id));
  const nameOf = (id: string) => competencies.find(c => c.id === id)?.name ?? '—';

  const save = async () => {
    setSaving(true); setError(null);
    const body = { title, description: description || null, requirements: reqs };
    try {
      if (item) await api.patch(`/performance/job-profiles/${item.id}`, body);
      else await api.post('/performance/job-profiles', body);
      onSaved(); onClose();
    } catch (e: any) { setError(e?.message || 'Enregistrement impossible'); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={item ? 'Modifier la fiche de poste' : 'Nouvelle fiche de poste'} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--border)] font-semibold text-[var(--text-secondary)]">Annuler</button>
        <button onClick={save} disabled={saving || !title.trim()}
          className="flex-1 py-3 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
          {saving && <Loader2 strokeWidth={1.5} size={16} className="animate-spin" />} Enregistrer
        </button>
      </>}>
      <div>
        <label className="text-sm font-medium text-[var(--text)]">Intitulé du poste</label>
        <input className={`${inputCls} mt-1`} list="positions-list" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Identique au poste dans la fiche employé" />
        <datalist id="positions-list">{suggestions.map(s => <option key={s} value={s} />)}</datalist>
        <p className="text-xs text-[var(--text-secondary)] mt-1">Les employés dont le poste porte ce nom sont rattachés automatiquement à cette fiche.</p>
      </div>
      <div>
        <label className="text-sm font-medium text-[var(--text)]">Description (facultatif)</label>
        <textarea rows={2} className={`${inputCls} mt-1`} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[var(--text)]">Compétences requises et niveau attendu</p>
        {reqs.length === 0 && <p className="text-xs text-[var(--text-secondary)]">Aucune compétence pour l'instant.</p>}
        {reqs.map((r, i) => (
          <div key={r.competencyId} className="rounded-xl border border-[var(--border)] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--text)] truncate">{nameOf(r.competencyId)}</span>
              <button type="button" aria-label="Retirer" onClick={() => setReqs(p => p.filter((_, k) => k !== i))}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] shrink-0"><Trash2 strokeWidth={1.5} size={16} /></button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setReqs(p => p.map((x, k) => (k === i ? { ...x, requiredLevel: n } : x)))}
                  className={`min-h-[44px] rounded-xl font-semibold ${r.requiredLevel === n ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>{n}</button>
              ))}
            </div>
          </div>
        ))}
        {available.length > 0 ? (
          <ModuleSelect className={inputCls} value="" onChange={e => { if (e.target.value) setReqs(p => [...p, { competencyId: e.target.value, requiredLevel: 3 }]); }}>
            <option value="">+ Ajouter une compétence…</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.name} ({CATEGORY_LABEL[c.category]})</option>)}
          </ModuleSelect>
        ) : active.length === 0 ? (
          <p className="text-xs text-[var(--warning-text)]">Créez d'abord des compétences dans l'onglet « Référentiel ».</p>
        ) : null}
      </div>
      {error && <p className="text-sm text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-xl p-3 break-words">{error}</p>}
    </Modal>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
function CompetencesPage() {
  const { bp } = useBasePath();
  const [isHR, setIsHR] = useState(false);
  const [tab, setTab] = useState<Tab>('team');

  const [team, setTeam] = useState<TeamOverview | null>(null);
  const [comps, setComps] = useState<CompetencyItem[]>([]);
  const [profiles, setProfiles] = useState<JobProfileItem[]>([]);
  const [uncovered, setUncovered] = useState<string[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editComp, setEditComp] = useState<CompetencyItem | null | 'new'>(null);
  const [editProfile, setEditProfile] = useState<JobProfileItem | null | 'new'>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c, p] = await Promise.all([
        api.get<TeamOverview>('/performance/competencies/team'),
        api.get<CompetencyItem[]>('/performance/competencies'),
        api.get<{ profiles: JobProfileItem[]; uncoveredPositions: string[] }>('/performance/job-profiles'),
      ]);
      setTeam(t); setComps(c); setProfiles(p.profiles); setUncovered(p.uncoveredPositions);
      setError(null);
    } catch (e: any) { setError(e?.message || 'Chargement impossible'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    const hr = !!u?.role && HR_ROLES.includes(u.role);
    setIsHR(hr);
    load();
    // Catalogue de formations (pour lier une compétence) — RH uniquement
    if (hr) {
      api.get<any>('/training/courses')
        .then(r => setCourses((Array.isArray(r) ? r : r?.courses ?? []).map((x: any) => ({ id: x.id, title: x.title }))))
        .catch(() => setCourses([]));
    }
  }, [load]);

  const removeComp = async (c: CompetencyItem) => {
    if (!confirm(`Supprimer « ${c.name} » ?\nSi elle a déjà été évaluée, elle sera archivée (l'historique est conservé).`)) return;
    try {
      const r = await api.delete<{ archived: boolean }>(`/performance/competencies/${c.id}`);
      setNotice(r?.archived ? `« ${c.name} » a été archivée.` : null);
      load();
    } catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  const removeProfile = async (p: JobProfileItem) => {
    if (!confirm(`Supprimer la fiche « ${p.title} » ?`)) return;
    try { await api.delete(`/performance/job-profiles/${p.id}`); load(); }
    catch (e: any) { alert(e?.message || 'Suppression impossible'); }
  };

  const generate = async (p: JobProfileItem) => {
    try {
      const r = await api.post<{ replaced: boolean }>(`/performance/job-profiles/${p.id}/generate-template`, {});
      setNotice(`Modèle d'évaluation « Compétences — ${p.title} » ${r?.replaced ? 'mis à jour' : 'créé'}. Il sera utilisé au prochain lancement de cycle.`);
    } catch (e: any) { alert(e?.message || 'Génération impossible'); }
  };

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode; show: boolean }> = [
    { key: 'team', label: 'Équipe', icon: <Users strokeWidth={1.5} size={16} />, show: true },
    { key: 'referentiel', label: 'Référentiel', icon: <BookOpen strokeWidth={1.5} size={16} />, show: true },
    { key: 'postes', label: 'Fiches de poste', icon: <Briefcase strokeWidth={1.5} size={16} />, show: true },
  ];

  const q = search.toLowerCase();
  const people = (team?.employees ?? []).filter(e => !q || `${e.firstName} ${e.lastName} ${e.position}`.toLowerCase().includes(q));

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-6 sm:space-y-8">
      <PerformanceNav />
      <div>
        <Link href={bp('/performance')} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--action)] mb-2">
          <ArrowLeft strokeWidth={1.5} size={14} /> Performance
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight">Compétences</h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base">Ce que chaque poste exige, où en est chaque employé, et quelles formations proposer</p>
      </div>

      {error && <div className="rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] text-sm p-4 flex items-center gap-2"><AlertTriangle strokeWidth={1.5} size={16} /> {error}</div>}
      {notice && (
        <div className="rounded-xl bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] text-sm p-4 flex items-start gap-2 justify-between">
          <span className="flex items-start gap-2"><CheckCircle2 strokeWidth={1.5} size={16} className="mt-0.5 shrink-0" /> {notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer"><X strokeWidth={1.5} size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto">
        {tabs.filter(t => t.show).map(t => (
          <button aria-pressed={tab === t.key} key={t.key} onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${tab === t.key
              ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow-lg'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && !team ? (
        <KonzaLoader variant="section" />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* ÉQUIPE */}
            {tab === 'team' && team && (
              <>
                {team.topNeeds.length > 0 && (
                  <div className={`${cardCls} p-4 sm:p-5`}>
                    <p className="font-semibold text-[var(--text)] flex items-center gap-2 mb-3"><TrendingUp strokeWidth={1.5} size={16} className="text-[var(--action)]" /> Besoins de développement les plus fréquents</p>
                    <div className="space-y-2">
                      {team.topNeeds.map(n => (
                        <div key={n.competencyId} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--text)] truncate">{n.name}</span>
                          <span className="px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] text-xs font-semibold shrink-0">{n.employees} employé(s)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {team.withoutProfile > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">{team.withoutProfile} employé(s) n'ont pas de fiche de poste correspondante.</p>
                )}
                <div className="relative max-w-sm">
                  <Search strokeWidth={1.5} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input className={`${inputCls} pl-9`} placeholder="Rechercher un employé…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {people.length === 0 ? (
                  <div className={`${cardCls} p-10 text-center text-sm text-[var(--text-secondary)]`}>Aucun employé dans votre périmètre.</div>
                ) : (
                  <div className="grid gap-3">
                    {people.map(e => (
                      <Link key={e.id} href={bp(`/performance/competences/employe/${e.id}`)}
                        className={`${cardCls} p-4 flex items-center gap-3 sm:gap-4 hover:bg-[var(--surface-2)] transition-colors`}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-[var(--text)] text-sm shrink-0 bg-[var(--surface)] text-[var(--text)] performance-card">
                          {e.photoUrl ? <img referrerPolicy="no-referrer" src={e.photoUrl} alt="" className="w-full h-full rounded-full object-cover" /> : `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[var(--text)] truncate">{e.firstName} {e.lastName}</p>
                          <p className="text-sm text-[var(--text-secondary)] truncate">{[e.position, e.department?.name].filter(Boolean).join(' · ')}</p>
                        </div>
                        {e.summary ? (
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-[var(--action)]">{e.summary.coverage} %</p>
                            <p className="text-xs text-[var(--text-secondary)]">{e.summary.gaps > 0 ? `${e.summary.gaps} écart(s)` : e.summary.notAssessed > 0 ? `${e.summary.notAssessed} à évaluer` : 'complet'}</p>
                          </div>
                        ) : <span className="text-xs text-[var(--text-secondary)] shrink-0">Pas de fiche</span>}
                        <ChevronRight strokeWidth={1.5} size={18} className="text-[var(--text-secondary)] shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* RÉFÉRENTIEL */}
            {tab === 'referentiel' && (
              <>
                {isHR && (
                  <button onClick={() => setEditComp('new')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center gap-2">
                    <Plus strokeWidth={1.5} size={20} /> Nouvelle compétence
                  </button>
                )}
                {comps.length === 0 ? (
                  <div className={`${cardCls} p-10 text-center`}>
                    <BookOpen strokeWidth={1.5} className="mx-auto text-[var(--text-secondary)] mb-3" size={36} />
                    <p className="font-semibold text-[var(--text)]">Aucune compétence</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{isHR ? 'Commencez par les 5 à 10 compétences clés de votre entreprise.' : "La RH n'a pas encore défini de référentiel."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {comps.map(c => (
                      <div key={c.id} className={`${cardCls} p-5 flex flex-col ${c.isActive ? '' : 'opacity-60'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[var(--text)] break-words">{c.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${CATEGORY_CLS[c.category]}`}>{CATEGORY_LABEL[c.category]}</span>
                              {!c.isActive && <span className="text-[11px] font-semibold text-[var(--text-secondary)]">Archivée</span>}
                            </div>
                          </div>
                          {isHR && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setEditComp(c)} aria-label="Modifier" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--action)] hover:bg-[var(--brand-soft)]"><Pencil strokeWidth={1.5} size={16} /></button>
                              <button onClick={() => removeComp(c)} aria-label="Supprimer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"><Trash2 strokeWidth={1.5} size={16} /></button>
                            </div>
                          )}
                        </div>
                        {c.description && <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-3">{c.description}</p>}
                        <p className="mt-auto pt-4 text-xs text-[var(--text-secondary)]">
                          {c._count?.jobRequirements ?? 0} poste(s) · {c.courses.length} formation(s) liée(s)
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* FICHES DE POSTE */}
            {tab === 'postes' && (
              <>
                {isHR && (
                  <button onClick={() => setEditProfile('new')}
                    className="px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold shadow-lg flex items-center gap-2">
                    <Plus strokeWidth={1.5} size={20} /> Nouvelle fiche de poste
                  </button>
                )}
                {isHR && uncovered.length > 0 && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Postes sans fiche : {uncovered.slice(0, 8).join(', ')}{uncovered.length > 8 ? '…' : ''}
                  </p>
                )}
                {profiles.length === 0 ? (
                  <div className={`${cardCls} p-10 text-center`}>
                    <Briefcase strokeWidth={1.5} className="mx-auto text-[var(--text-secondary)] mb-3" size={36} />
                    <p className="font-semibold text-[var(--text)]">Aucune fiche de poste</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Une fiche indique, pour un poste, le niveau attendu sur chaque compétence.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {profiles.map(p => (
                      <div key={p.id} className={`${cardCls} p-5 flex flex-col`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[var(--text)] truncate">{p.title}</h3>
                            <p className="text-sm text-[var(--text-secondary)]">{p.employeeCount} employé(s)</p>
                          </div>
                          {isHR && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setEditProfile(p)} aria-label="Modifier" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--action)] hover:bg-[var(--brand-soft)]"><Pencil strokeWidth={1.5} size={16} /></button>
                              <button onClick={() => removeProfile(p)} aria-label="Supprimer" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]"><Trash2 strokeWidth={1.5} size={16} /></button>
                            </div>
                          )}
                        </div>
                        <ul className="mt-4 space-y-1.5 text-sm text-[var(--text-secondary)] flex-1">
                          {p.requirements.slice(0, 6).map(r => (
                            <li key={r.id} className="flex items-center justify-between gap-2">
                              <span className="truncate">{r.competency.name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--action)] text-xs font-semibold shrink-0">niv. {r.requiredLevel}</span>
                            </li>
                          ))}
                          {p.requirements.length === 0 && <li className="text-xs text-[var(--text-secondary)]">Aucune compétence requise</li>}
                          {p.requirements.length > 6 && <li className="text-xs text-[var(--text-secondary)]">+ {p.requirements.length - 6} autre(s)</li>}
                        </ul>
                        {isHR && p.requirements.length > 0 && (
                          <button onClick={() => generate(p)}
                            className="mt-4 w-full py-2.5 rounded-xl border border-[var(--border)] text-[var(--action)] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[var(--brand-soft)]">
                            <Wand2 strokeWidth={1.5} size={15} /> Créer le modèle d'évaluation
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {editComp && (
          <CompetencyEditor key={editComp === 'new' ? 'new' : editComp.id} item={editComp === 'new' ? null : editComp}
            courses={courses} onClose={() => setEditComp(null)} onSaved={load} />
        )}
        {editProfile && (
          <ProfileEditor key={editProfile === 'new' ? 'newp' : editProfile.id} item={editProfile === 'new' ? null : editProfile}
            competencies={comps} suggestions={uncovered} onClose={() => setEditProfile(null)} onSaved={load} />
        )}
      </AnimatePresence>
    </div>
  );
}


export default function CompetencesPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <CompetencesPage />
    </ModulePageFrame>
  );
}
