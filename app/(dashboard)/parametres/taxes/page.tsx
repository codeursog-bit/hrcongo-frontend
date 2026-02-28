'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, Info, Shield, AlertCircle, X, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

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
  if (tax.employeeRate > 0) parts.push(`${tax.employeeRate}% salarié`);
  if (tax.fixedEmployee  > 0) parts.push(`${tax.fixedEmployee.toLocaleString('fr-FR')} F salarié`);
  if (tax.employerRate  > 0) parts.push(`${tax.employerRate}% patronal`);
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
};

// ── Taxes légales non modifiables ─────────────────────────────────────────────
const SYSTEM_TAXES = [
  { code: 'CNSS_SAL',    name: 'CNSS Salariale',               rate: '4%',     side: 'Salarié',  color: 'blue',   note: 'Branche pension · plafond 1 200 000 F' },
  { code: 'CNSS_PENSION',name: 'CNSS Patronale — Pensions',    rate: '8%',     side: 'Patronal', color: 'amber',  note: 'Vieillesse / invalidité · plafond 1 200 000 F' },
  { code: 'CNSS_FAMILY', name: 'CNSS Patronale — Famille',     rate: '10,03%', side: 'Patronal', color: 'amber',  note: 'Prestations familiales · plafond 600 000 F' },
  { code: 'CNSS_AT',     name: 'CNSS Patronale — Accidents',   rate: '2,25%',  side: 'Patronal', color: 'amber',  note: 'Accidents du travail · plafond 600 000 F' },
  { code: 'TUS_DGI',     name: 'TUS — Part DGI',              rate: '4,13%',  side: 'Patronal', color: 'orange', note: 'Taxe Unique Salaires · déplafonné · versée DGI' },
  { code: 'TUS_CNSS',    name: 'TUS — Part CNSS',             rate: '3,38%',  side: 'Patronal', color: 'orange', note: 'Taxe Unique Salaires · déplafonné · versée CNSS' },
  { code: 'ITS',         name: 'ITS — Impôt sur Traitements', rate: 'Barème', side: 'Salarié',  color: 'purple', note: 'Progressif 1%/10%/25%/40% · abattement 20%' },
];

const SIDE_BADGE: Record<string, string> = {
  'Salarié':  'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-700',
  'Patronal': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  'Les deux': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
};

const COLOR_RING: Record<string, string> = {
  blue:   'ring-blue-400',
  amber:  'ring-amber-400',
  orange: 'ring-orange-400',
  purple: 'ring-purple-400',
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
      employeeRate:  tax.employeeRate  > 0 ? String(tax.employeeRate)  : '',
      fixedEmployee: tax.fixedEmployee > 0 ? String(tax.fixedEmployee) : '',
      employerRate:  tax.employerRate  > 0 ? String(tax.employerRate)  : '',
      fixedEmployer: tax.fixedEmployer > 0 ? String(tax.fixedEmployer) : '',
      hasCeiling: tax.hasCeiling,
      ceiling: tax.ceiling ? String(tax.ceiling) : '',
      isActive: tax.isActive,
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
    if (empRate === 0 && empFix === 0 && patRate === 0 && patFix === 0) {
      showToast('Renseignez au moins un taux ou montant', 'error');
      return;
    }

    const dto = {
      name:          form.name.trim(),
      code:          form.code.trim().toUpperCase(),
      description:   form.description.trim() || undefined,
      baseType:      form.baseType,
      employeeRate:  empRate,
      fixedEmployee: empFix,
      employerRate:  patRate,
      fixedEmployer: patFix,
      hasCeiling:    form.hasCeiling,
      ceiling:       form.hasCeiling && form.ceiling ? parseFloat(form.ceiling) : undefined,
      isActive:      form.isActive,
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
        <Link href="/parametres" className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ChevronLeft size={18} className="text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Receipt size={18} color="white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Cotisations & Taxes</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Taxes légales fixes + taxes personnalisées</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm shadow-orange-500/25 transition-all text-sm">
          <Plus size={15} /> Nouvelle taxe
        </button>
      </div>

      {/* ── Section 1 : Taxes légales ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-gray-400" />
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taxes légales — Congo 2026</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 border border-gray-200 dark:border-gray-600">Non modifiables</span>
        </div>
        <div className="grid gap-2">
          {SYSTEM_TAXES.map(t => (
            <div key={t.code} className={`flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 ring-1 ${COLOR_RING[t.color]} ring-opacity-30`}>
              <div className={`w-1.5 h-10 rounded-full bg-${t.color}-400 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{t.code}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{t.note}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${SIDE_BADGE[t.side]}`}>{t.side}</span>
                <span className="text-sm font-black font-mono text-gray-700 dark:text-gray-200 w-16 text-right">{t.rate}</span>
                <Lock size={13} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2 : Taxes personnalisées ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={14} className="text-orange-500" />
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taxes personnalisées</h2>
          {taxes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
              {taxes.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>
        ) : taxes.length === 0 ? (
          <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Receipt size={36} className="mx-auto text-gray-200 dark:text-gray-600 mb-3" />
            <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">Aucune taxe personnalisée</p>
            <p className="text-xs text-gray-400 mb-4">TOL, CAMU, taxe apprentissage, etc.</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-all">
              <Plus size={14} /> Créer la première taxe
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {taxes.map(tax => {
              const side = getSideBadge(tax);
              return (
                <div key={tax.id} className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-all ${!tax.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{tax.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{tax.code}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SIDE_BADGE[side]}`}>{side}</span>
                        {!tax.isActive && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 border border-gray-200 dark:border-gray-600">Inactif</span>}
                      </div>
                      {tax.description && <p className="text-xs text-gray-400 mb-1.5">{tax.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
                        <span>Base : <strong>{BASE_TYPE_LABELS[tax.baseType]}</strong></span>
                        <span>Taux : <strong className="font-mono">{formatTaxRate(tax)}</strong></span>
                        {tax.hasCeiling && tax.ceiling && <span>Plafond : <strong className="font-mono">{tax.ceiling.toLocaleString('fr-FR')} F</strong></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggle(tax)} title={tax.isActive ? 'Désactiver' : 'Activer'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        {tax.isActive
                          ? <ToggleRight size={20} className="text-emerald-500" />
                          : <ToggleLeft  size={20} className="text-gray-400" />}
                      </button>
                      <button onClick={() => openEdit(tax)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Pencil size={15} className="text-blue-500" />
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
      <div className="mt-8 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-200 dark:border-sky-800 flex gap-3">
        <Info size={15} className="text-sky-500 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-700 dark:text-sky-300 space-y-1">
          <p className="font-bold">Comment fonctionnent les taxes personnalisées ?</p>
          <p>Chaque taxe est appliquée automatiquement à tous les bulletins de paie générés. La base de calcul détermine sur quel montant le taux est appliqué. Vous pouvez configurer une part salariale, une part patronale, ou les deux.</p>
        </div>
      </div>

      {/* ── MODAL CRÉER / MODIFIER ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-black text-gray-900 dark:text-white text-lg">
                {editingTax ? 'Modifier la taxe' : 'Nouvelle taxe'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Body modal */}
            <div className="p-5 space-y-4">

              {/* Nom + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nom *</label>
                  <input value={form.name} onChange={e => setF({ name: e.target.value })} placeholder="Ex: Taxe apprentissage"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Code *</label>
                  <input value={form.code} onChange={e => setF({ code: e.target.value.toUpperCase() })} placeholder="Ex: TAX_APP"
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e => setF({ description: e.target.value })} placeholder="Description optionnelle"
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 outline-none" />
              </div>

              {/* Base de calcul */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Base de calcul</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BASE_TYPE_LABELS) as [CompanyTaxBase, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setF({ baseType: key })}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${form.baseType === key ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                      <p className={`text-xs font-bold ${form.baseType === key ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'}`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Taux salarié */}
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800">
                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2">Part Salarié</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Taux (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.employeeRate} onChange={e => setF({ employeeRate: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono bg-white dark:bg-gray-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Montant fixe (FCFA)</label>
                    <input type="number" min="0" value={form.fixedEmployee} onChange={e => setF({ fixedEmployee: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono bg-white dark:bg-gray-800 outline-none" />
                  </div>
                </div>
              </div>

              {/* Taux patronal */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Part Patronale</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Taux (%)</label>
                    <input type="number" min="0" max="100" step="0.01" value={form.employerRate} onChange={e => setF({ employerRate: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono bg-white dark:bg-gray-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Montant fixe (FCFA)</label>
                    <input type="number" min="0" value={form.fixedEmployer} onChange={e => setF({ fixedEmployer: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono bg-white dark:bg-gray-800 outline-none" />
                  </div>
                </div>
              </div>

              {/* Plafond */}
              <div className="flex items-center gap-3">
                <button onClick={() => setF({ hasCeiling: !form.hasCeiling })}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${form.hasCeiling ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.hasCeiling ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => setF({ hasCeiling: !form.hasCeiling })}>
                  Plafond de calcul
                </label>
                {form.hasCeiling && (
                  <input type="number" min="0" value={form.ceiling} onChange={e => setF({ ceiling: e.target.value })} placeholder="Ex: 1200000"
                    className="flex-1 px-3 py-2 border border-orange-200 dark:border-orange-700 rounded-xl text-sm font-mono bg-white dark:bg-gray-800 outline-none" />
                )}
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <button onClick={() => setF({ isActive: !form.isActive })}
                  className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => setF({ isActive: !form.isActive })}>
                  Activer immédiatement
                </label>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
                Annuler
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Supprimer cette taxe ?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                <strong className="text-gray-700 dark:text-gray-200">{deleteTarget.name}</strong>
              </p>
              <p className="text-xs text-red-500 mb-5">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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