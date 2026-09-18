'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, Info, Shield, AlertCircle, X, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

// ── Types ─────────────────────────────────────────────────────────────────────
type CompanyTaxBase = 'GROSS' | 'TAXABLE' | 'NET_IMPOSABLE' | 'FIXED';

interface CompanyTax {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  employeeRate: number;
  fixedEmployee: number;
  employerRate: number;
  fixedEmployer: number;
  baseType: CompanyTaxBase;
  hasCeiling: boolean;
  ceiling?: number;
  isActive: boolean;
  minSalaryThreshold?: number;
  thresholdType: 'ELIGIBILITY' | 'EXCESS_ONLY';
  createdAt: string;
  updatedAt: string;
}

interface TaxFormData {
  name: string;
  code: string;
  description: string;
  baseType: CompanyTaxBase;
  employeeRate: string;
  fixedEmployee: string;
  employerRate: string;
  fixedEmployer: string;
  hasCeiling: boolean;
  ceiling: string;
  isActive: boolean;
  minSalaryThreshold: string;
  thresholdType: 'ELIGIBILITY' | 'EXCESS_ONLY';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE_TYPE_LABELS: Record<CompanyTaxBase, string> = {
  GROSS:         'Salaire brut',
  TAXABLE:       'SBT (brut − CNSS)',
  NET_IMPOSABLE: 'RNI (après abattement)',
  FIXED:         'Montant fixe',
};

function formatTaxRate(tax: CompanyTax): string {
  const parts: string[] = [];
  // Les taux BDD sont en décimal (0.0227) → afficher en % lisible (2,27%)
  if (tax.employeeRate > 0) parts.push(`${parseFloat((tax.employeeRate * 100).toPrecision(6)).toString().replace('.', ',')}% salarié`);
  if (tax.fixedEmployee  > 0) parts.push(`${tax.fixedEmployee.toLocaleString('fr-FR')} F salarié`);
  if (tax.employerRate  > 0) parts.push(`${parseFloat((tax.employerRate * 100).toPrecision(6)).toString().replace('.', ',')}% patronal`);
  if (tax.fixedEmployer > 0) parts.push(`${tax.fixedEmployer.toLocaleString('fr-FR')} F patronal`);
  return parts.join(' / ') || '—';
}

const EMPTY_FORM: TaxFormData = {
  name: '', code: '', description: '',
  baseType: 'GROSS',
  employeeRate: '', fixedEmployee: '',
  employerRate: '', fixedEmployer: '',
  hasCeiling: false, ceiling: '',
  isActive: true,
  minSalaryThreshold: '',
  thresholdType: 'ELIGIBILITY',
};

// ── Taxes légales non modifiables ─────────────────────────────────────────────
const SYSTEM_TAXES = [
  { code: 'CNSS_SAL',    name: 'CNSS Salariale',               rate: '4%',     side: 'Salarié',  color: 'emerald',   note: 'Branche pension · plafond 1 200 000 F' },
  { code: 'CNSS_PENSION',name: 'CNSS Patronale — Pensions',    rate: '8%',     side: 'Patronal', color: 'amber',  note: 'Vieillesse / invalidité · plafond 1 200 000 F' },
  { code: 'CNSS_FAMILY', name: 'CNSS Patronale — Famille',     rate: '10,03%', side: 'Patronal', color: 'amber',  note: 'Prestations familiales · plafond 600 000 F' },
  { code: 'CNSS_AT',     name: 'CNSS Patronale — Accidents',   rate: '2,25%',  side: 'Patronal', color: 'amber',  note: 'Accidents du travail · plafond 600 000 F' },
  { code: 'TUS_DGI',     name: 'TUS — Part DGI',              rate: '4,13%',  side: 'Patronal', color: 'amber', note: 'Taxe Unique Salaires · déplafonné · versée DGI' },
  { code: 'TUS_CNSS',    name: 'TUS — Part CNSS',             rate: '3,38%',  side: 'Patronal', color: 'amber', note: 'Taxe Unique Salaires · déplafonné · versée CNSS' },
  { code: 'ITS',         name: 'ITS — Impôt sur Traitements', rate: 'Barème', side: 'Salarié',  color: 'emerald', note: 'Progressif 1200(forfait)/10%/25%/40% · abattement 20%' },
];

const SIDE_BADGE: Record<string, string> = {
  'Salarié':  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
  'Patronal': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  'Les deux': 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
};

const COLOR_RING: Record<string, string> = {
  emerald: 'ring-emerald-400',
  amber:   'ring-amber-400',
};

// ── Composant Toast ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border transition-all
      ${type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
      {type === 'success' ? '✓' : '✗'} {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function TaxesPage() {
  const { bp } = useBasePath();
  const [taxes, setTaxes]           = useState<CompanyTax[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editingTax, setEditingTax] = useState<CompanyTax | null>(null);
  const [form, setForm]             = useState<TaxFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyTax | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast]           = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchTaxes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<CompanyTax[]>('/company-taxes');
      setTaxes(Array.isArray(data) ? data : []);
    } catch {
      showToast('Impossible de charger les taxes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  // ── Ouvrir modal ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingTax(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (tax: CompanyTax) => {
    setEditingTax(tax);
    setForm({
      name: tax.name, code: tax.code, description: tax.description ?? '',
      baseType: tax.baseType,
      // Taux BDD en décimal → convertir en % lisible pour l'input (0.0227 → 2.27)
      employeeRate:  tax.employeeRate  > 0 ? String(parseFloat((tax.employeeRate  * 100).toPrecision(6))) : '',
      fixedEmployee: tax.fixedEmployee > 0 ? String(tax.fixedEmployee) : '',
      employerRate:  tax.employerRate  > 0 ? String(parseFloat((tax.employerRate  * 100).toPrecision(6))) : '',
      fixedEmployer: tax.fixedEmployer > 0 ? String(tax.fixedEmployer) : '',
      hasCeiling: tax.hasCeiling,
      ceiling: tax.ceiling ? String(tax.ceiling) : '',
      isActive: tax.isActive,
      minSalaryThreshold: tax.minSalaryThreshold ? String(tax.minSalaryThreshold) : '',
      thresholdType: tax.thresholdType ?? 'ELIGIBILITY',
    });
    setShowModal(true);
  };

  // ── Sauvegarder ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showToast('Nom et code sont obligatoires', 'error');
      return;
    }
    const empRate = parseFloat(form.employeeRate  || '0');
    const empFix  = parseFloat(form.fixedEmployee || '0');
    const patRate = parseFloat(form.employerRate  || '0');
    const patFix  = parseFloat(form.fixedEmployer || '0');
    // On autorise des taux/montants à 0 — une taxe peut servir de marqueur
    // ou être complétée ultérieurement (ex: CAMU_SOL sans taux configuré)

    const dto = {
      name:          form.name.trim(),
      code:          form.code.trim().toUpperCase(),
      description:   form.description.trim() || undefined,
      baseType:      form.baseType,
      employeeRate:  empRate / 100,   // % saisi (ex: 2.27) → décimal (0.0227) pour le back
      fixedEmployee: empFix,
      employerRate:  patRate / 100,   // % saisi (ex: 4.55) → décimal (0.0455) pour le back
      fixedEmployer: patFix,
      hasCeiling:    form.hasCeiling,
      ceiling:       form.hasCeiling && form.ceiling ? parseFloat(form.ceiling) : undefined,
      isActive:      form.isActive,
      minSalaryThreshold: form.minSalaryThreshold ? parseFloat(form.minSalaryThreshold) : undefined,
      thresholdType: form.minSalaryThreshold ? form.thresholdType : undefined,
    };

    setIsSaving(true);
    try {
      if (editingTax) {
        await api.patch(`/company-taxes/${editingTax.id}`, dto);
        showToast('Taxe mise à jour', 'success');
      } else {
        await api.post('/company-taxes', dto);
        showToast('Taxe créée', 'success');
      }
      setShowModal(false);
      fetchTaxes();
    } catch (e: any) {
      showToast(e?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle actif ──────────────────────────────────────────────────────────
  const handleToggle = async (tax: CompanyTax) => {
    try {
      await api.patch(`/company-taxes/${tax.id}/toggle`, {});
      setTaxes(prev => prev.map(t => t.id === tax.id ? { ...t, isActive: !t.isActive } : t));
      showToast(`${tax.name} ${tax.isActive ? 'désactivée' : 'activée'}`, 'success');
    } catch {
      showToast('Impossible de modifier le statut', 'error');
    }
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/company-taxes/${deleteTarget.id}`);
      showToast('Taxe supprimée', 'success');
      setDeleteTarget(null);
      fetchTaxes();
    } catch {
      showToast('Impossible de supprimer cette taxe', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Calcul badge "Salarié / Patronal / Les deux" ──────────────────────────
  const getSideBadge = (tax: CompanyTax) => {
    const hasSal = tax.employeeRate > 0 || tax.fixedEmployee > 0;
    const hasPat = tax.employerRate > 0 || tax.fixedEmployer > 0;
    if (hasSal && hasPat) return 'Les deux';
    if (hasPat) return 'Patronal';
    return 'Salarié';
  };

  const setF = (patch: Partial<TaxFormData>) => setForm(prev => ({ ...prev, ...patch }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={bp('/parametres')} className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ChevronLeft size={18} className="text-[var(--text-muted)]" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
          <Receipt size={18} color="white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-[var(--text)]">Cotisations & Taxes</h1>
          <p className="text-xs text-[var(--text-muted)]">Taxes légales fixes + taxes personnalisées</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm shadow-emerald-500/25 transition-all text-sm">
          <Plus size={15} /> Nouvelle taxe
        </button>
      </div>

      {/* ── Section 1 : Taxes légales ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-[var(--text-muted)]" />
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Taxes légales — Congo 2026</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">Non modifiables</span>
        </div>
        <div className="grid gap-2">
          {SYSTEM_TAXES.map(t => (
            <div key={t.code} className={`flex items-center gap-4 px-4 py-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] ring-1 ${COLOR_RING[t.color]} ring-opacity-30`}>
              <div className={`w-1.5 h-10 rounded-full bg-${t.color}-400 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[var(--text)]">{t.name}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{t.code}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.note}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SIDE_BADGE[t.side]}`}>{t.side}</span>
                <span className="text-sm font-black font-mono text-[var(--text)] w-16 text-right">{t.rate}</span>
                <Lock size={13} className="text-[var(--text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2 : Taxes personnalisées ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={14} className="text-emerald-500" />
          <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Taxes personnalisées</h2>
          {taxes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
              {taxes.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-500" size={28} />
          </div>
        ) : taxes.length === 0 ? (
          <div className="text-center py-14 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]">
            <Receipt size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="font-bold text-[var(--text)] text-sm mb-1">Aucune taxe personnalisée</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">TOL, CAMU, taxe apprentissage, etc.</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all">
              <Plus size={14} /> Créer la première taxe
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {taxes.map(tax => {
              const side = getSideBadge(tax);
              return (
                <div key={tax.id} className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 transition-all ${!tax.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-[var(--text)]">{tax.name}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{tax.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SIDE_BADGE[side]}`}>{side}</span>
                        {!tax.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">Inactif</span>}
                      </div>
                      {tax.description && <p className="text-xs text-[var(--text-muted)] mb-1.5">{tax.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-[var(--text-muted)]">
                        <span>Base : <strong>{BASE_TYPE_LABELS[tax.baseType]}</strong></span>
                        <span>Taux : <strong className="font-mono">{formatTaxRate(tax)}</strong></span>
                        {tax.hasCeiling && tax.ceiling && <span>Plafond : <strong className="font-mono">{tax.ceiling.toLocaleString('fr-FR')} F</strong></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggle(tax)} title={tax.isActive ? 'Désactiver' : 'Activer'}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                        {tax.isActive
                          ? <ToggleRight size={20} className="text-emerald-500" />
                          : <ToggleLeft  size={20} className="text-[var(--text-muted)]" />}
                      </button>
                      <button onClick={() => openEdit(tax)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        <Pencil size={15} className="text-emerald-500" />
                      </button>
                      <button onClick={() => setDeleteTarget(tax)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex gap-3">
        <Info size={15} className="text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
          <p className="font-bold">Comment fonctionnent les taxes personnalisées ?</p>
          <p>Chaque taxe est appliquée automatiquement à tous les bulletins de paie générés. La base de calcul détermine sur quel montant le taux est appliqué. Vous pouvez configurer une part salariale, une part patronale, ou les deux.</p>
        </div>
      </div>

      {/* ── MODAL CRÉER / MODIFIER ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-black text-[var(--text)] text-lg">
                {editingTax ? 'Modifier la taxe' : 'Nouvelle taxe'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
                <X size={18} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Body modal */}
            <div className="p-5 space-y-4">

              {/* Nom + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nom *</label>
                  <input value={form.name} onChange={e => setF({ name: e.target.value })} placeholder="Ex: Taxe apprentissage"
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Code *</label>
                  <input value={form.code} onChange={e => setF({ code: e.target.value.toUpperCase() })} placeholder="Ex: TAX_APP"
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm font-mono bg-[var(--surface)] outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e => setF({ description: e.target.value })} placeholder="Description optionnelle"
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none" />
              </div>

              {/* Base de calcul */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Base de calcul</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BASE_TYPE_LABELS) as [CompanyTaxBase, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setF({ baseType: key })}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${form.baseType === key ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-emerald-300'}`}>
                      <p className={`text-xs font-bold ${form.baseType === key ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--text-muted)]'}`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Taux salarié */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Part Salarié</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Taux (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.employeeRate} onChange={e => setF({ employeeRate: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--surface)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Montant fixe (FCFA)</label>
                    <input type="number" min="0" value={form.fixedEmployee} onChange={e => setF({ fixedEmployee: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--surface)] outline-none" />
                  </div>
                </div>
              </div>

              {/* Taux patronal */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Part Patronale</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Taux (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.employerRate} onChange={e => setF({ employerRate: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--surface)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[var(--text-muted)] mb-1">Montant fixe (FCFA)</label>
                    <input type="number" min="0" value={form.fixedEmployer} onChange={e => setF({ fixedEmployer: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm font-mono bg-[var(--surface)] outline-none" />
                  </div>
                </div>
              </div>

              {/* Plafond */}
              {/* Plafond de calcul */}
              <div className="flex items-center gap-3">
                <button onClick={() => setF({ hasCeiling: !form.hasCeiling })}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${form.hasCeiling ? 'bg-emerald-600' : 'bg-[var(--surface-2)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.hasCeiling ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => setF({ hasCeiling: !form.hasCeiling })}>
                  Plafond de calcul
                </label>
                {form.hasCeiling && (
                  <input type="number" min="0" value={form.ceiling} onChange={e => setF({ ceiling: e.target.value })} placeholder="Ex: 1200000"
                    className="flex-1 px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm font-mono bg-[var(--surface)] outline-none" />
                )}
              </div>

              {/* Seuil minimum salaire (ex: CAMU) */}
              <div className="space-y-1.5">
                <label className="text-sm text-[var(--text-muted)]">
                  Seuil de salaire brut <span className="text-xs text-[var(--text-muted)]">(laisser vide = s'applique toujours)</span>
                </label>
                <input type="number" min="0" value={form.minSalaryThreshold}
                  onChange={e => setF({ minSalaryThreshold: e.target.value })}
                  placeholder="Ex: 500000 pour CAMU solidarité"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm font-mono bg-[var(--surface)] outline-none focus:border-emerald-400 transition-colors" />
                {form.minSalaryThreshold && (
                  <>
                    {/* Toggle ELIGIBILITY / EXCESS_ONLY */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setF({ thresholdType: 'ELIGIBILITY' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${form.thresholdType === 'ELIGIBILITY' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-emerald-300'}`}>
                        Éligibilité
                      </button>
                      <button
                        onClick={() => setF({ thresholdType: 'EXCESS_ONLY' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${form.thresholdType === 'EXCESS_ONLY' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-emerald-300'}`}>
                        Sur l'excédent
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {form.thresholdType === 'EXCESS_ONLY'
                        ? `⚠️ Taxe sur l'excédent : (brut − ${parseFloat(form.minSalaryThreshold).toLocaleString('fr-FR')} FCFA) × taux — ex: CAMU solidarité`
                        : `⚠️ Taxe ignorée si salaire brut < ${parseFloat(form.minSalaryThreshold).toLocaleString('fr-FR')} FCFA`}
                    </p>
                  </>
                )}
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <button onClick={() => setF({ isActive: !form.isActive })}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${form.isActive ? 'bg-emerald-600' : 'bg-[var(--surface-2)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => setF({ isActive: !form.isActive })}>
                  Activer immédiatement
                </label>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex gap-3 p-5 border-t border-[var(--border)]">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold text-sm hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]">
                Annuler
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingTax ? <Pencil size={15} /> : <Plus size={15} />)}
                {isSaving ? 'Enregistrement…' : editingTax ? 'Mettre à jour' : 'Créer la taxe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-[var(--text)] mb-2">Supprimer cette taxe ?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-1">
                <strong className="text-[var(--text)]">{deleteTarget.name}</strong>
              </p>
              <p className="text-xs text-red-500 mb-5">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold text-sm hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={15} />}
                  {isDeleting ? 'Suppression…' : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}