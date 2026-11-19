'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, Info, Shield, AlertCircle, X, Loader2, Lock
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { SettingsFrame as ModulePageFrame } from '@/components/settings/SettingsFrame';

// ── Types ─────────────────────────────────────────────────────────────────────
type CompanyTaxBase = 'GROSS' | 'TAXABLE' | 'NET_IMPOSABLE' | 'FIXED';
type ContractKind = 'CDI' | 'CDD' | 'STAGE' | 'CONSULTANT' | 'PRESTATAIRE' | 'INTERIM';

const CONTRACT_OPTIONS: { value: ContractKind; label: string }[] = [
  { value: 'CDI',         label: 'CDI' },
  { value: 'CDD',         label: 'CDD' },
  { value: 'STAGE',       label: 'Stage' },
  { value: 'CONSULTANT',  label: 'Consultant' },
  { value: 'PRESTATAIRE', label: 'Prestataire' },
  { value: 'INTERIM',     label: 'Intérim' },
];
const MONTH_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

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
  applicableContractTypes?: ContractKind[];
  isRecurring?: boolean;
  applicableMonth?: number | null;
  applicableYear?: number | null;
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
  applicableContractTypes: ContractKind[];
  isRecurring: boolean;
  applicableMonth: string;
  applicableYear: string;
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
  applicableContractTypes: ['CDI', 'CDD'],
  isRecurring: true,
  applicableMonth: String(new Date().getMonth() + 1),
  applicableYear: String(new Date().getFullYear()),
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
  'Salarié':  'bg-[var(--brand-soft)] text-[var(--success-text)] border-[var(--border)]   ',
  'Patronal': 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ',
  'Les deux': 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',
};

const COLOR_RING: Record<string, string> = {
  emerald: 'ring-[var(--focus)]',
  amber:   'ring-[var(--focus)]',
};

// ── Composant Toast ───────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border transition-colors
      ${type === 'success' ? 'bg-[var(--brand-soft)]  text-[var(--success-text)]  border-[var(--border)] ' : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  border-[var(--border)] '}`}>
      {type === 'success' ? '✓' : '✗'} {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
function TaxesPage() {
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
      applicableContractTypes: tax.applicableContractTypes?.length ? tax.applicableContractTypes : ['CDI', 'CDD'],
      isRecurring: tax.isRecurring ?? true,
      applicableMonth: tax.applicableMonth ? String(tax.applicableMonth) : String(new Date().getMonth() + 1),
      applicableYear: tax.applicableYear ? String(tax.applicableYear) : String(new Date().getFullYear()),
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

    if (form.applicableContractTypes.length === 0) {
      showToast('Sélectionnez au moins un type de contrat', 'error');
      return;
    }
    if (!form.isRecurring && (!form.applicableMonth || !form.applicableYear)) {
      showToast("Choisissez le mois et l'année d'application", 'error');
      return;
    }

    // En modification, on envoie `null` pour vider un champ (sinon `undefined`
    // est ignoré côté serveur et l'ancienne valeur est conservée).
    const emptyValue = editingTax ? null : undefined;

    const dto: Record<string, any> = {
      name:          form.name.trim(),
      description:   form.description.trim() || emptyValue,
      baseType:      form.baseType,
      employeeRate:  empRate / 100,   // % saisi (ex: 2.27) → décimal (0.0227) pour le back
      fixedEmployee: empFix,
      employerRate:  patRate / 100,   // % saisi (ex: 4.55) → décimal (0.0455) pour le back
      fixedEmployer: patFix,
      hasCeiling:    form.hasCeiling,
      ceiling:       form.hasCeiling && form.ceiling ? parseFloat(form.ceiling) : emptyValue,
      isActive:      form.isActive,
      minSalaryThreshold: form.minSalaryThreshold ? parseFloat(form.minSalaryThreshold) : emptyValue,
      thresholdType: form.minSalaryThreshold ? form.thresholdType : undefined,
      applicableContractTypes: form.applicableContractTypes,
      isRecurring:   form.isRecurring,
      applicableMonth: form.isRecurring ? undefined : parseInt(form.applicableMonth, 10),
      applicableYear:  form.isRecurring ? undefined : parseInt(form.applicableYear, 10),
    };
    // Le code n'est envoyé qu'à la création : il est immuable ensuite
    // (l'envoyer en PATCH provoquait « property code should not exist »).
    if (!editingTax) dto.code = form.code.trim().toUpperCase();

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
    } catch (e: any) {
      showToast(e?.message || 'Impossible de supprimer cette taxe', 'error');
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
      <div className="settings-page-header flex items-center gap-3 mb-6">
        <Link href={bp('/parametres')} className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ChevronLeft size={18} className="text-[var(--text-muted)]" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-[var(--brand)] flex items-center justify-center shadow-lg ">
          <Receipt size={18} color="white" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-[var(--text)]">Cotisations & Taxes</h1>
          <p className="text-xs text-[var(--text-muted)]">Taxes légales fixes + taxes personnalisées</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl shadow-sm  transition-colors text-sm">
          <Plus size={15} /> Nouvelle taxe
        </button>
      </div>

      {/* ── Section 1 : Taxes légales ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Taxes légales — Congo 2026</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">Non modifiables</span>
        </div>
        <div className="grid gap-2">
          {SYSTEM_TAXES.map(t => (
            <div key={t.code} className={`settings-tax-card flex items-center gap-4 px-4 py-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] ring-1 ${COLOR_RING[t.color]} ring-opacity-30`}>
              <div className={`w-1.5 h-10 rounded-full bg-[var(--brand)] shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-[var(--text)]">{t.name}</span>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{t.code}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t.note}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SIDE_BADGE[t.side]}`}>{t.side}</span>
                <span className="text-sm font-semibold font-mono text-[var(--text)] w-16 text-right">{t.rate}</span>
                <Lock size={13} className="text-[var(--text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2 : Taxes personnalisées ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={14} className="text-[var(--success-text)]" />
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Taxes personnalisées</h2>
          {taxes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--brand-soft)]  text-[var(--success-text)]  border border-[var(--border)] ">
              {taxes.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <KonzaLoader variant="section" />
        ) : taxes.length === 0 ? (
          <div className="text-center py-14 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]">
            <Receipt size={36} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="font-semibold text-[var(--text)] text-sm mb-1">Aucune taxe personnalisée</p>
            <p className="text-xs text-[var(--text-muted)] mb-4">TOL, CAMU, taxe apprentissage, etc.</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl text-sm transition-colors">
              <Plus size={14} /> Créer la première taxe
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {taxes.map(tax => {
              const side = getSideBadge(tax);
              return (
                <div key={tax.id} className={`bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-4 transition-colors ${!tax.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-[var(--text)]">{tax.name}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">{tax.code}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${SIDE_BADGE[side]}`}>{side}</span>
                        {!tax.isActive && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">Inactif</span>}
                      </div>
                      {tax.description && <p className="text-xs text-[var(--text-muted)] mb-1.5">{tax.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-[var(--text-muted)]">
                        <span>Base : <strong>{BASE_TYPE_LABELS[tax.baseType]}</strong></span>
                        <span>Taux : <strong className="font-mono">{formatTaxRate(tax)}</strong></span>
                        {tax.hasCeiling && tax.ceiling && <span>Plafond : <strong className="font-mono">{tax.ceiling.toLocaleString('fr-FR')} F</strong></span>}
                        <span>Contrats : <strong>{(tax.applicableContractTypes?.length ? tax.applicableContractTypes : ['CDI', 'CDD']).join(', ')}</strong></span>
                        <span>Période : <strong>{tax.isRecurring === false && tax.applicableMonth ? `${MONTH_LABELS[tax.applicableMonth - 1]} ${tax.applicableYear}` : 'Chaque mois'}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleToggle(tax)} title={tax.isActive ? 'Désactiver' : 'Activer'}
                        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                        {tax.isActive
                          ? <ToggleRight size={20} className="text-[var(--success-text)]" />
                          : <ToggleLeft  size={20} className="text-[var(--text-muted)]" />}
                      </button>
                      <button onClick={() => openEdit(tax)} className="p-1.5 rounded-lg hover:bg-[var(--brand-soft)]  transition-colors">
                        <Pencil size={15} className="text-[var(--success-text)]" />
                      </button>
                      <button onClick={() => setDeleteTarget(tax)} className="p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  transition-colors">
                        <Trash2 size={15} className="text-[var(--danger-text)]" />
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
      <div className="mt-8 p-4 bg-[var(--brand-soft)]  rounded-2xl border border-[var(--border)]  flex gap-3">
        <Info size={15} className="text-[var(--success-text)] shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--success-text)]  space-y-1">
          <p className="font-semibold">Comment fonctionnent les taxes personnalisées ?</p>
          <p>Chaque taxe est appliquée automatiquement à tous les bulletins de paie générés. La base de calcul détermine sur quel montant le taux est appliqué. Vous pouvez configurer une part salariale, une part patronale, ou les deux.</p>
        </div>
      </div>

      {/* ── MODAL CRÉER / MODIFIER ────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.5)]  p-4">
          <div className="bg-[var(--surface)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text)] text-lg">
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
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nom *</label>
                  <input value={form.name} onChange={e => setF({ name: e.target.value })} placeholder="Ex: Taxe apprentissage"
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)]" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Code *</label>
                  <input value={form.code} onChange={e => setF({ code: e.target.value.toUpperCase() })} placeholder="Ex: TAX_APP"
                    disabled={!!editingTax} title={editingTax ? 'Le code ne peut pas être modifié' : undefined}
                    className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm font-mono bg-[var(--surface)] outline-none focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)] disabled:opacity-60 disabled:cursor-not-allowed" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Description</label>
                <input value={form.description} onChange={e => setF({ description: e.target.value })} placeholder="Description optionnelle"
                  className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none" />
              </div>

              {/* Base de calcul */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Base de calcul</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(BASE_TYPE_LABELS) as [CompanyTaxBase, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setF({ baseType: key })}
                      className={`p-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${form.baseType === key ? 'border-[var(--border)] bg-[var(--brand-soft)] ' : 'border-[var(--border)] hover:border-[var(--border)]'}`}>
                      <p className={`text-xs font-semibold ${form.baseType === key ? 'text-[var(--success-text)] ' : 'text-[var(--text-muted)]'}`}>{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Taux salarié */}
              <div className="p-3 bg-[var(--brand-soft)]  rounded-xl border border-[var(--border)] ">
                <p className="text-[10px] font-semibold text-[var(--success-text)]  uppercase tracking-wider mb-2">Part Salarié</p>
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
              <div className="p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-xl border border-[var(--border)] ">
                <p className="text-[10px] font-semibold text-[var(--warning-text)]  uppercase tracking-wider mb-2">Part Patronale</p>
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
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${form.hasCeiling ? 'bg-[var(--brand)]' : 'bg-[var(--surface-2)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-[var(--surface)] rounded-full shadow transition-colors ${form.hasCeiling ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => setF({ hasCeiling: !form.hasCeiling })}>
                  Plafond de calcul
                </label>
                {form.hasCeiling && (
                  <input type="number" min="0" value={form.ceiling} onChange={e => setF({ ceiling: e.target.value })} placeholder="Ex: 1200000"
                    className="flex-1 px-3 py-2 border border-[var(--border)]  rounded-xl text-sm font-mono bg-[var(--surface)] outline-none" />
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
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-xl text-sm font-mono bg-[var(--surface)] outline-none focus:border-[var(--border)] transition-colors" />
                {form.minSalaryThreshold && (
                  <>
                    {/* Toggle ELIGIBILITY / EXCESS_ONLY */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setF({ thresholdType: 'ELIGIBILITY' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${form.thresholdType === 'ELIGIBILITY' ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                        Éligibilité
                      </button>
                      <button
                        onClick={() => setF({ thresholdType: 'EXCESS_ONLY' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${form.thresholdType === 'EXCESS_ONLY' ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                        Sur l'excédent
                      </button>
                    </div>
                    <p className="text-xs text-[var(--warning-text)] ">
                      {form.thresholdType === 'EXCESS_ONLY'
                        ? `Taxe sur l'excédent : (brut − ${parseFloat(form.minSalaryThreshold).toLocaleString('fr-FR')} FCFA) × taux — ex: CAMU solidarité`
                        : `Taxe ignorée si salaire brut < ${parseFloat(form.minSalaryThreshold).toLocaleString('fr-FR')} FCFA`}
                    </p>
                  </>
                )}
              </div>

              {/* Types de contrat concernés */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Types de contrat concernés *</label>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_OPTIONS.map(opt => {
                    const on = form.applicableContractTypes.includes(opt.value);
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => setF({
                          applicableContractTypes: on
                            ? form.applicableContractTypes.filter(c => c !== opt.value)
                            : [...form.applicableContractTypes, opt.value],
                        })}
                        className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${on ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-[var(--text-muted)]">Par défaut CDI et CDD. La taxe n'impactera que la paie des contrats cochés.</p>
              </div>

              {/* Périodicité */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Application</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setF({ isRecurring: true })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${form.isRecurring ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                    Chaque mois
                  </button>
                  <button type="button" onClick={() => setF({ isRecurring: false })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors ${!form.isRecurring ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]' : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'}`}>
                    Un mois précis
                  </button>
                </div>
                {!form.isRecurring && (
                  <div className="grid grid-cols-2 gap-3">
                    <ModuleSelect value={form.applicableMonth} onChange={e => setF({ applicableMonth: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none">
                      {MONTH_LABELS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </ModuleSelect>
                    <input type="number" min={2000} max={2100} value={form.applicableYear} onChange={e => setF({ applicableYear: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface)] outline-none" />
                  </div>
                )}
              </div>

              {/* Actif */}
              <div className="flex items-center gap-3">
                <button onClick={() => setF({ isActive: !form.isActive })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${form.isActive ? 'bg-[var(--brand)]' : 'bg-[var(--surface-2)]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-[var(--surface)] rounded-full shadow transition-colors ${form.isActive ? 'left-5' : 'left-0.5'}`} />
                </button>
                <label className="text-sm text-[var(--text-muted)] cursor-pointer" onClick={() => setF({ isActive: !form.isActive })}>
                  Activer immédiatement
                </label>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex gap-3 p-5 border-t border-[var(--border)]">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]">
                Annuler
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingTax ? <Pencil size={15} /> : <Plus size={15} />)}
                {isSaving ? 'Enregistrement…' : editingTax ? 'Mettre à jour' : 'Créer la taxe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUPPRESSION ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.5)]  p-4">
          <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-[var(--danger-text)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Supprimer cette taxe ?</h3>
              <p className="text-sm text-[var(--text-muted)] mb-1">
                <strong className="text-[var(--text)]">{deleteTarget.name}</strong>
              </p>
              <p className="text-xs text-[var(--danger-text)] mb-5">Cette action est irréversible.</p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 py-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--text)] font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
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


export default function TaxesPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <TaxesPage />
    </ModulePageFrame>
  );
}
