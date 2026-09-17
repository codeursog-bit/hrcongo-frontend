'use client';

/**
 * AssignPrimePage — /primes
 * Attribuer des primes à un employé en choisissant depuis le catalogue entreprise.
 * Bouton "Gérer le catalogue" → /parametres/primes?back=/primes
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, Trash2, Loader2, Gift, Zap, Hand,
  DollarSign, Calendar, Save, AlertCircle,
  Clock, Search, User, ChevronDown, X, CheckCircle2, Building2,
  Settings2, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import type { BonusTemplate } from '@/app/(dashboard)/parametres/primes/page';
import { useBasePath } from '@/hooks/useBasePath';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  departmentName?: string;
  department?: { name: string };
  employeeNumber?: string;
}

interface Bonus {
  id: string;
  bonusType: string;
  amount?: number;
  percentage?: number;
  baseCalculation?: string;
  isRecurring: boolean;
  description?: string;
  source: 'MANUAL' | 'AUTOMATIC';
  targetMonth?: number;
  targetYear?: number;
  isTaxable: boolean;
  isCnss: boolean;
}

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2,  label: 'Février' },
  { value: 3, label: 'Mars' },    { value: 4,  label: 'Avril' },
  { value: 5, label: 'Mai' },     { value: 6,  label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8,  label: 'Août' },
  { value: 9, label: 'Septembre'},{ value: 10, label: 'Octobre' },
  { value: 11,label: 'Novembre' },{ value: 12, label: 'Décembre' },
];

const now = new Date();
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

// ─── Badges fiscaux ──────────────────────────────────────────────────────────
const FiscalBadges = ({ isTaxable, isCnss }: { isTaxable: boolean; isCnss: boolean }) => (
  <span className="inline-flex gap-1">
    {isTaxable  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">ITS</span>}
    {isCnss     && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">CNSS</span>}
    {!isTaxable && !isCnss  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">Net direct</span>}
    {isTaxable  && !isCnss  && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">ITS seul.</span>}
  </span>
);

// ─── Bouton catalogue (présent en bas de chaque liste de primes) ─────────────
const CatalogueLink = ({ backUrl }: { backUrl: string }) => {
  const router = useRouter();
  const { bp } = useBasePath();
  return (
    <button
      onClick={() => router.push(bp(`/parametres/primes?back=${encodeURIComponent(backUrl)}`))}
      className="w-full flex items-center justify-between p-4 mt-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] hover:border-emerald-500/40 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
          <Settings2 size={16} className="text-emerald-500" />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-[var(--text)]">Personnaliser le catalogue</p>
          <p className="text-xs text-[var(--text-muted)]">Ajouter, modifier ou supprimer des types de primes</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

export default function AssignPrimePage() {
  const router    = useRouter();
  const { bp } = useBasePath();
  const alert     = useAlert();
  const searchRef = useRef<HTMLInputElement>(null);

  const [employees, setEmployees]         = useState<Employee[]>([]);
  const [filtered,  setFiltered]          = useState<Employee[]>([]);
  const [selected,  setSelected]          = useState<Employee | null>(null);
  const [query,     setQuery]             = useState('');
  const [showDrop,  setShowDrop]          = useState(false);
  const [loadingEmps, setLoadingEmps]     = useState(true);

  const [bonuses,      setBonuses]        = useState<Bonus[]>([]);
  const [templates,    setTemplates]      = useState<BonusTemplate[]>([]);
  const [loadingData,  setLoadingData]    = useState(false);
  const [showModal,    setShowModal]      = useState(false);
  const [isSaving,     setIsSaving]       = useState(false);
  const [deletingId,   setDeletingId]     = useState<string | null>(null);

  // Formulaire modal — basé sur le catalogue
  const [selectedTemplate, setSelectedTemplate] = useState<BonusTemplate | null>(null);
  const [customAmount,      setCustomAmount]      = useState('');
  const [isRecurring,       setIsRecurring]       = useState(true);
  const [targetMonth,       setTargetMonth]       = useState(now.getMonth() + 1);
  const [targetYear,        setTargetYear]        = useState(now.getFullYear());

  // ── Charger employés + catalogue ──────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<any>('/employees').then(r => Array.isArray(r) ? r : r?.data || []),
      api.get<any>('/bonus-templates').then(r => Array.isArray(r) ? r : r?.data || []),
    ]).then(([emps, tmpls]) => {
      setEmployees(emps);
      setFiltered(emps);
      setTemplates(tmpls);
    }).catch(console.error)
      .finally(() => setLoadingEmps(false));
  }, []);

  // ── Filtrage recherche ────────────────────────────────────────────────
  useEffect(() => {
    const q = query.toLowerCase().trim();
    setFiltered(!q ? employees : employees.filter(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.position?.toLowerCase().includes(q) ||
      e.employeeNumber?.toLowerCase().includes(q) ||
      (e.department?.name || e.departmentName || '').toLowerCase().includes(q)
    ));
  }, [query, employees]);

  // ── Charger primes employé ────────────────────────────────────────────
  const loadBonuses = async (emp: Employee) => {
    setLoadingData(true);
    try {
      const res = await api.get<any>(`/employee-bonuses?employeeId=${emp.id}`);
      setBonuses(Array.isArray(res) ? res : res?.data || []);
    } catch { setBonuses([]); }
    finally   { setLoadingData(false); }
  };

  const handleSelect = (emp: Employee) => {
    setSelected(emp);
    setShowDrop(false);
    setQuery(`${emp.firstName} ${emp.lastName}`);
    loadBonuses(emp);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    setBonuses([]);
    setFiltered(employees);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  // ── Ouvrir modal ajout ────────────────────────────────────────────────
  const openModal = () => {
    setSelectedTemplate(null);
    setCustomAmount('');
    setIsRecurring(true);
    setTargetMonth(now.getMonth() + 1);
    setTargetYear(now.getFullYear());
    setShowModal(true);
  };

  // ── Quand on choisit un template → pré-remplir ───────────────────────
  const handleTemplateChange = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId) || null;
    setSelectedTemplate(tmpl);
    if (tmpl) {
      setIsRecurring(tmpl.isRecurring);
      // Pré-remplir montant si fixe
      if (tmpl.defaultAmount != null) setCustomAmount(String(tmpl.defaultAmount));
      else setCustomAmount('');
    }
  };

  // ── Ajouter la prime à l'employé ─────────────────────────────────────
  const handleAdd = async () => {
    if (!selected || !selectedTemplate) {
      alert.error('Prime requise', 'Choisissez une prime dans le catalogue.');
      return;
    }

    const hasDefaultAmount = selectedTemplate.defaultAmount != null;
    const hasDefaultPct    = selectedTemplate.defaultPercentage != null;
    const needsAmount      = !hasDefaultAmount && !hasDefaultPct;

    if (needsAmount && !customAmount) {
      alert.error('Montant requis', 'Cette prime nécessite un montant.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        employeeId:  selected.id,
        bonusType:   selectedTemplate.name,
        isRecurring,
        isTaxable:   selectedTemplate.isTaxable,
        isCnss:      selectedTemplate.isCnss,
        description: selectedTemplate.description || null,
      };

      if (!isRecurring) {
        payload.targetMonth = targetMonth;
        payload.targetYear  = targetYear;
      }

      // Montant : custom > defaultAmount > % du template
      if (customAmount) {
        payload.amount = parseFloat(customAmount);
      } else if (hasDefaultAmount) {
        payload.amount = selectedTemplate.defaultAmount;
      } else if (hasDefaultPct) {
        payload.percentage      = selectedTemplate.defaultPercentage;
        payload.baseCalculation = selectedTemplate.baseCalculation;
      }

      const created = await api.post<Bonus>('/employee-bonuses', payload);
      setBonuses(prev => [
        {
          ...(created as Bonus),
          source:    'MANUAL',
          isTaxable: selectedTemplate.isTaxable,
          isCnss:    selectedTemplate.isCnss,
        },
        ...prev,
      ]);

      alert.success('Prime ajoutée', `"${selectedTemplate.name}" attribuée avec succès.`);
      setShowModal(false);
    } catch (e: any) {
      alert.error('Erreur', e?.message || "Impossible d'ajouter la prime.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/employee-bonuses/${id}`);
      setBonuses(prev => prev.filter(b => b.id !== id));
      alert.success('Supprimée', `"${name}" a été retirée.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer.');
    } finally {
      setDeletingId(null);
    }
  };

  const manualBonuses = bonuses.filter(b => b.source === 'MANUAL');
  const autoBonuses   = bonuses.filter(b => b.source === 'AUTOMATIC');
  const totalMensuel  = manualBonuses.filter(b => b.isRecurring && b.amount).reduce((s, b) => s + (b.amount || 0), 0);
  const deptName      = (e: Employee) => e.department?.name || e.departmentName || '—';
  const getMonthLabel = (m?: number) => MONTHS.find(x => x.value === m)?.label || '';

  const activeTemplates = templates.filter(t => t.isActive !== false);

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-emerald-500 transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>
        {selected && (
          <button onClick={openModal}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-colors">
            <Plus size={18} /> Attribuer une prime
          </button>
        )}
      </div>

      {/* Titre */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)] flex items-center gap-3">
          <Gift size={28} className="text-emerald-500" /> Attribuer des primes
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Choisissez depuis le catalogue entreprise · Montants ajustables par employé.
        </p>
      </div>

      {/* ── Sélecteur employé ── */}
      <div className="glass-panel rounded-2xl p-6 border border-[var(--border)]">
        <label className="block text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
          <User size={16} className="text-emerald-500" /> Choisir un employé
        </label>

        <div className="relative">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors bg-[var(--surface)] ${
            showDrop ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-[var(--border)]'
          }`}>
            <Search size={18} className="text-[var(--text-muted)] shrink-0" />
            <input ref={searchRef} type="text" value={query}
              onChange={e => { setQuery(e.target.value); setShowDrop(true); if (selected) setSelected(null); }}
              onFocus={() => setShowDrop(true)}
              placeholder="Rechercher par nom, poste, matricule..."
              className="flex-1 bg-transparent outline-none text-[var(--text)] placeholder-[var(--text-muted)] font-medium" />
            {selected
              ? <button onClick={handleClear} className="p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"><X size={16} /></button>
              : <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform ${showDrop ? 'rotate-180' : ''}`} />
            }
          </div>

          <AnimatePresence>
            {showDrop && !selected && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                className="absolute z-50 mt-2 w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden"
                onMouseDown={e => e.preventDefault()}>
                {loadingEmps ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 className="animate-spin text-emerald-500" size={20} />
                    <span className="text-[var(--text-muted)] text-sm">Chargement...</span>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="py-8 text-center text-[var(--text-muted)] text-sm">Aucun employé trouvé</div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                    {filtered.map(emp => (
                      <li key={emp.id}>
                        <button onClick={() => handleSelect(emp)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface-2)] transition-colors text-left">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--text)] truncate">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5 mt-0.5">
                              <Building2 size={11} /> {deptName(emp)}
                              {emp.position && <><span className="opacity-30">•</span>{emp.position}</>}
                            </p>
                          </div>
                          {emp.employeeNumber && <span className="text-xs text-[var(--text-muted)] font-mono shrink-0">{emp.employeeNumber}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
                {selected.firstName[0]}{selected.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[var(--text)]">{selected.firstName} {selected.lastName}</p>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                  <Building2 size={12} /> {deptName(selected)}
                  {selected.position && <>• {selected.position}</>}
                </p>
              </div>
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Contenu primes ── */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Hand size={22} className="text-emerald-500" /></div>
                <div><p className="text-xs text-[var(--text-muted)] uppercase font-bold">Primes manuelles</p><p className="text-2xl font-bold text-[var(--text)]">{manualBonuses.length}</p></div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center"><Zap size={22} className="text-amber-500" /></div>
                <div><p className="text-xs text-[var(--text-muted)] uppercase font-bold">Automatiques</p><p className="text-2xl font-bold text-[var(--text)]">{autoBonuses.length}</p></div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center"><DollarSign size={22} className="text-emerald-500" /></div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Total mensuel</p>
                  <p className="text-2xl font-bold text-[var(--text)] font-mono">
                    {totalMensuel.toLocaleString('fr-FR')}<span className="text-sm font-normal text-[var(--text-muted)] ml-1">F</span>
                  </p>
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={28} />
                <span className="text-[var(--text-muted)]">Chargement...</span>
              </div>
            ) : (
              <>
                {/* Primes manuelles */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center"><Hand size={16} className="text-emerald-500" /></div>
                    <h2 className="text-lg font-bold text-[var(--text)]">Primes Manuelles</h2>
                  </div>

                  {manualBonuses.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-10 text-center">
                      <Gift size={28} className="text-[var(--text-muted)] opacity-40 mx-auto mb-3" />
                      <p className="text-[var(--text-muted)] font-medium mb-4">Aucune prime attribuée</p>
                      <button onClick={openModal}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 mx-auto transition-colors">
                        <Plus size={16} /> Attribuer la première prime
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {manualBonuses.map(b => (
                          <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="glass-panel rounded-xl p-5 flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                              <Gift size={22} className="text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-[var(--text)]">{b.bonusType}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                                  b.isRecurring
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                }`}>
                                  {b.isRecurring ? 'Récurrente' : 'Ponctuelle'}
                                </span>
                                {!b.isRecurring && b.targetMonth && b.targetYear && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                    <Calendar size={10} /> {getMonthLabel(b.targetMonth)} {b.targetYear}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1">
                                <FiscalBadges isTaxable={b.isTaxable} isCnss={b.isCnss} />
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {b.amount != null && <p className="font-bold text-lg text-[var(--text)] font-mono">+{b.amount.toLocaleString('fr-FR')} <span className="text-xs text-[var(--text-muted)]">F</span></p>}
                              {b.percentage != null && <p className="font-bold text-lg text-amber-500">+{b.percentage}% <span className="text-xs text-[var(--text-muted)]">{b.baseCalculation === 'GROSS_SALARY' ? 'brut' : 'base'}</span></p>}
                            </div>
                            <button onClick={() => handleDelete(b.id, b.bonusType)} disabled={deletingId === b.id}
                              className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                              {deletingId === b.id ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* ✅ Bouton catalogue — toujours présent */}
                  <CatalogueLink backUrl="/primes" />
                </section>

                {/* Primes automatiques */}
                {autoBonuses.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center"><Zap size={16} className="text-amber-500" /></div>
                      <h2 className="text-lg font-bold text-[var(--text)]">Primes Automatiques</h2>
                      <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">Convention</span>
                    </div>
                    <div className="space-y-3">
                      {autoBonuses.map(b => (
                        <div key={b.id} className="glass-panel rounded-xl p-5 flex items-center gap-5 border-l-4 border-l-amber-500">
                          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0"><Zap size={22} className="text-amber-500" /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-[var(--text)]">{b.bonusType}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1"><Zap size={10} /> Auto</span>
                            </div>
                            <div className="mt-1"><FiscalBadges isTaxable={b.isTaxable} isCnss={b.isCnss} /></div>
                          </div>
                          <div className="text-right shrink-0">
                            {b.amount != null && <p className="font-bold text-lg text-[var(--text)] font-mono">+{b.amount.toLocaleString('fr-FR')} <span className="text-xs text-[var(--text-muted)]">F</span></p>}
                            {b.percentage != null && <p className="font-bold text-lg text-amber-500">+{b.percentage}% base</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {!selected && !loadingEmps && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-panel rounded-2xl p-16 text-center">
          <User size={36} className="text-[var(--text-muted)] opacity-40 mx-auto mb-4" />
          <p className="text-[var(--text-muted)] font-medium text-lg mb-1">Aucun employé sélectionné</p>
          <p className="text-[var(--text-muted)] text-sm">Recherchez un employé pour gérer ses primes.</p>
        </motion.div>
      )}

      {/* ================================================================
          MODAL AJOUT — choisit depuis le catalogue
      ================================================================ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-y-auto max-h-[92vh]">

              <button onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">Attribuer une prime</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{selected?.firstName} {selected?.lastName}</p>
                </div>
              </div>

              <div className="space-y-5">

                {/* ✅ Choisir depuis le catalogue */}
                <div>
                  <label className="block text-sm font-bold text-[var(--text)] mb-2">
                    Type de prime (catalogue)
                  </label>
                  {activeTemplates.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <p className="text-sm text-amber-500 mb-3">
                        Le catalogue est vide. Créez d'abord vos types de primes.
                      </p>
                      <button
                        onClick={() => { setShowModal(false); router.push(bp('/parametres/primes?back=/primes')); }}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-sm">
                        <Settings2 size={14} /> Aller au catalogue
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={e => handleTemplateChange(e.target.value)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none text-[var(--text)] font-medium focus:border-emerald-500">
                      <option value="" disabled>— Choisir depuis le catalogue —</option>
                      {activeTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Aperçu du template sélectionné */}
                  {selectedTemplate && (
                    <div className="mt-2 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">{selectedTemplate.description || 'Aucune description'}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <FiscalBadges isTaxable={selectedTemplate.isTaxable} isCnss={selectedTemplate.isCnss} />
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                            selectedTemplate.isRecurring
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          }`}>{selectedTemplate.isRecurring ? 'Récurrente' : 'Ponctuelle'}</span>
                        </div>
                      </div>
                      {selectedTemplate.defaultAmount != null && (
                        <span className="text-sm font-black font-mono text-[var(--text)] ml-2">
                          {selectedTemplate.defaultAmount.toLocaleString('fr-FR')} F
                        </span>
                      )}
                      {selectedTemplate.defaultPercentage != null && (
                        <span className="text-sm font-black font-mono text-amber-500 ml-2">
                          {selectedTemplate.defaultPercentage}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Montant personnalisé — si pas de montant fixe dans le template */}
                {selectedTemplate && selectedTemplate.defaultAmount == null && selectedTemplate.defaultPercentage == null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text)] mb-2">
                      Montant pour cet employé (FCFA)
                    </label>
                    <input type="number" min="0" value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="Ex: 25 000"
                      className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-xl text-[var(--text)]" />
                  </div>
                )}

                {/* Montant personnalisé optionnel si montant fixe mais on veut override */}
                {selectedTemplate && selectedTemplate.defaultAmount != null && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text)] mb-2">
                      Ajuster le montant <span className="text-xs font-normal text-[var(--text-muted)]">(optionnel — défaut : {selectedTemplate.defaultAmount.toLocaleString('fr-FR')} F)</span>
                    </label>
                    <input type="number" min="0" value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder={String(selectedTemplate.defaultAmount)}
                      className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl outline-none font-bold font-mono text-lg text-[var(--text)]" />
                  </div>
                )}

                {/* Fréquence (par défaut depuis le template, modifiable) */}
                {selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--text)] mb-2">Fréquence</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setIsRecurring(true)}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${
                          isRecurring
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}>
                        <div className="font-bold text-sm">Récurrente</div>
                        <div className="text-xs opacity-75 mt-0.5">Chaque mois</div>
                      </button>
                      <button type="button" onClick={() => setIsRecurring(false)}
                        className={`p-3 rounded-xl border-2 text-left transition-colors ${
                          !isRecurring
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}>
                        <div className="font-bold text-sm">Ponctuelle</div>
                        <div className="text-xs opacity-75 mt-0.5">1 mois cible</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mois cible si ponctuelle */}
                <AnimatePresence>
                  {selectedTemplate && !isRecurring && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <label className="block text-sm font-bold text-amber-500 mb-2 flex items-center gap-1">
                        <Calendar size={14} /> Mois cible
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <select value={targetMonth} onChange={e => setTargetMonth(Number(e.target.value))}
                          className="w-full p-2.5 bg-[var(--surface)] border border-amber-500/30 rounded-lg outline-none text-[var(--text)] font-medium text-sm">
                          {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={targetYear} onChange={e => setTargetYear(Number(e.target.value))}
                          className="w-full p-2.5 bg-[var(--surface)] border border-amber-500/30 rounded-lg outline-none text-[var(--text)] font-medium text-sm">
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lien vers le catalogue */}
                <div className="pt-1">
                  <button
                    onClick={() => { setShowModal(false); router.push(bp('/parametres/primes?back=/primes')); }}
                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-emerald-500 transition-colors">
                    <Settings2 size={12} />
                    Vous ne trouvez pas la prime souhaitée ? Gérer le catalogue →
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowModal(false)}
                    className="flex-1 py-4 bg-[var(--surface-2)] text-[var(--text)] font-bold rounded-xl hover:bg-[var(--border)] transition-colors">
                    Annuler
                  </button>
                  <button onClick={handleAdd} disabled={isSaving || !selectedTemplate}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Attribuer
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}