'use client';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import '@/components/employees/employees.css';
import '@/components/employees/employee-workspace.css';
import '@/components/employees/employee-onboarding.css';
import { EmployeeProgress, EmployeeCelebration, EmployeeOnboardingStart } from '@/components/employees/create/EmployeeJourney';
import { FancySelect } from '@/components/ui/FancySelect';


import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Download, ChevronRight, ArrowLeft, Loader2, Users, FileCheck,
  Zap, Info, Check, X, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  success: boolean;
  data: {
    totalRows: number;
    detectedColumns: string[];
    previewData: Record<string, any>[];
    suggestedMappings: Array<{ excelColumn: string; dbField: string; confidence: number }>;
    warnings: string[];
    /** 🆕 aide au choix de la nature fiscale, par colonne */
    bonusColumnInfo?: Record<string, BonusColumnInfo>;
  };
}
interface BonusColumnInfo {
  name: string;
  allowanceHint: boolean;
  catalogName: string | null;
  catalogNature: 'TAXABLE' | 'NON_TAXABLE' | null;
  catalogLabel: string | null;
}
// 🆕 Primes / indemnités détectées (plan renvoyé par la validation)
interface BonusPlanItem {
  column: string; name: string; kind: string; kindLabel: string;
  action: 'REUSE' | 'CREATE'; conflict: 'NONE' | 'TAXABILITY';
  employees: number; totalAmount: number;
}
interface BonusSummary {
  templatesCreated: Array<{ name: string; kind: string }>;
  templatesReused: Array<{ name: string; kind: string }>;
  bonusesAssigned: number; totalAmount: number;
}
interface ValidationResult {
  data: {
    isValid: boolean; validRows: number; invalidRows: number; errors: string[];
    bonusPlan?: BonusPlanItem[]; bonusWarnings?: string[];
  };
}
interface ImportResult {
  data: {
    success: boolean; imported: number; skipped: number;
    errors: Array<{ row: number; message: string }>;
    bonuses?: BonusSummary;
  };
}

// ─── DB field labels ─────────────────────────────────────────────────────────
const DB_FIELDS: Record<string, string> = {
  firstName: 'Prénom', lastName: 'Nom', email: 'Email',
  nationalIdNumber: 'N° CNI', cnssNumber: 'N° CNSS',
  contractType: 'Type Contrat', baseSalary: 'Salaire', phone: 'Téléphone',
  dateOfBirth: 'Date Naissance', placeOfBirth: 'Lieu Naissance',
  gender: 'Genre', maritalStatus: 'Situation Familiale',
  numberOfChildren: 'Nombre Enfants', address: 'Adresse', city: 'Ville',
  position: 'Poste', departmentName: 'Département', hireDate: 'Date Embauche',
  taxNumber: 'N° Fiscal', bankName: 'Banque', bankAccountNumber: 'N° Compte',
  // 🆕 Convention collective
  professionalCategory: 'Catégorie (convention)', echelon: 'Échelon (convention)',
  // 🆕 Fiche ORCA — Informations complémentaires
  bloodType: 'Groupe Sanguin', pathology: 'Pathologie', educationLevel: "Niveau d'Études",
  fatherName: 'Nom du Père', motherName: 'Nom de la Mère',
  emergencyContactName: 'Contact Urgence — Nom', emergencyContactRelation: 'Contact Urgence — Lien',
  emergencyContactPhone: 'Contact Urgence — Téléphone',
  hasDrivingLicense: 'Permis de Conduire (Oui/Non)', drivingLicenseNumber: 'N° Permis',
  foreignLanguages: 'Langue Étrangère', uniformSize: 'Taille Tenue', shoeSize: 'Pointure',
  nationality: 'Nationalité',
};

// 🆕 Primes & indemnités : le NOM de la colonne devient le nom de la prime.
// Nature fiscale : IMPOSABLE par défaut, ou NON imposable (au choix de l'utilisateur).
const BONUS_TAXABLE     = 'BONUS_TAXABLE';
const BONUS_NON_TAXABLE = 'BONUS_NON_TAXABLE';
const isBonusValue = (v?: string) =>
  v === BONUS_TAXABLE || v === BONUS_NON_TAXABLE || v === 'BONUS_TAXABLE_CNSS' || v === 'BONUS_TAXABLE_NO_CNSS';
const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} FCFA`;

// ─── Step config ─────────────────────────────────────────────────────────────
const IMPORT_STEPS = [
  { num: 1, label: 'Fichier',     icon: Upload },
  { num: 2, label: 'Colonnes',    icon: FileCheck },
  { num: 3, label: 'Validation',  icon: CheckCircle2 },
  { num: 4, label: 'Résultat',    icon: Users },
];

// ─── Stepper ─────────────────────────────────────────────────────────────────
function ImportStepper({ currentStep }: { currentStep: number }) {
 return <EmployeeProgress currentStep={currentStep} steps={IMPORT_STEPS.map(item => [item.label, ['Choisir le fichier Excel','Associer les colonnes','Vérifier avant de lancer','Retrouver le résultat'][item.num - 1] || ''])} />;
}

// ─── Page background ──────────────────────────────────────────────────────────
function PageBackground() { return null; }

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EmployeeImportPage() {
  const router = useRouter();
  const [uiImportError, setUiImportError] = useState('');
  const [step, setStep]               = useState(1);
  const [file, setFile]               = useState<File | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [analysis, setAnalysis]       = useState<any>(null);
  const [mappings, setMappings]       = useState<Record<string, string>>({});
  const [validation, setValidation]   = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoading, setIsLoading]     = useState(false);
  // 🆕 l'utilisateur doit confirmer la nature fiscale des primes avant de valider
  const [fiscalConfirmed, setFiscalConfirmed] = useState(false);

  // ── Upload & Analyse ────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) handleFileSelect(f);
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setUiImportError('');
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const result = await api.postFormData('/employees/import/analyze', fd) as AnalysisResult;
      if (result.success) {
        setAnalysis(result.data);
        const init: Record<string, string> = {};
        result.data.suggestedMappings.forEach(m => { init[m.excelColumn] = m.dbField; });
        // 🆕 prime déjà au catalogue → sa nature fait foi
        Object.keys(init).forEach(col => {
          const nat = result.data.bonusColumnInfo?.[col]?.catalogNature;
          if (isBonusValue(init[col]) && nat) init[col] = nat === 'NON_TAXABLE' ? BONUS_NON_TAXABLE : BONUS_TAXABLE;
        });
        setFiscalConfirmed(false);
        setMappings(init);
        setStep(2);
      }
    } catch (error) {
      console.error('Erreur analyse:', error); setUiImportError(error instanceof Error ? error.message : 'Le fichier n’a pas pu être analysé. Réessayez avec un fichier Excel.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Mapping validation ──────────────────────────────────────────────────────
  const handleMappingChange = (col: string, field: string) => {
    const wasBonus = isBonusValue(mappings[col]);
    if (field === BONUS_TAXABLE && wasBonus) return; // on garde la nature déjà choisie
    // 🆕 prime déjà au catalogue → sa nature fait foi ; sinon « imposable » par défaut
    const nat = analysis?.bonusColumnInfo?.[col]?.catalogNature;
    const next = field === BONUS_TAXABLE && nat === 'NON_TAXABLE' ? BONUS_NON_TAXABLE : field;
    setMappings(prev => ({ ...prev, [col]: next }));
    if (wasBonus || isBonusValue(field)) setFiscalConfirmed(false);
  };

  const setBonusNature = (col: string, nature: 'TAXABLE' | 'NON_TAXABLE') => {
    setMappings(prev => ({ ...prev, [col]: nature === 'NON_TAXABLE' ? BONUS_NON_TAXABLE : BONUS_TAXABLE }));
    setFiscalConfirmed(false);
  };
  const bonusCols = Object.keys(mappings).filter(c => isBonusValue(mappings[c]));

  const validateMappings = async () => {
    if (!file) return;
    setUiImportError('');
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings));
      const result = await api.postFormData('/employees/import/validate', fd) as ValidationResult;
      setValidation(result.data);
      setStep(3);
    } catch (error) { console.error('Erreur validation:', error); setUiImportError(error instanceof Error ? error.message : 'La vérification a échoué. Vos correspondances sont conservées.'); }
    finally { setIsLoading(false); }
  };

  // ── Execute import ──────────────────────────────────────────────────────────
  const executeImport = async () => {
    if (!file) return;
    setUiImportError('');
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings));
      const result = await api.postFormData('/employees/import/execute', fd) as ImportResult;
      setImportResult(result.data);
      setStep(4);
    } catch (error) { console.error('Erreur import:', error); setUiImportError(error instanceof Error ? error.message : 'L’import n’a pas pu aboutir. Vérifiez le résultat avant de réessayer.'); }
    finally { setIsLoading(false); }
  };

  // ── Template download ───────────────────────────────────────────────────────
  const downloadTemplate = async () => {
    try {
      const blob = await api.getBlob('/employees/import/template');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'template_import_employes.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) { console.error('Erreur téléchargement:', error); }
  };

  const variants = {
    enter:  { x: 24, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit:   { x: -24, opacity: 0 },
  };

  return (
    <ModulePageFrame kind="list"><div className="employee-module-page employee-import-page"><>
      <PageBackground /><EmployeeOnboardingStart />

      <div className="employee-import-shell">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="employee-import-heading">
          <div>
            <Button variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors mb-2 group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Retour aux employés
            </Button>
            <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Importer des employés</h1><p>Votre équipe rejoint Konza, une étape à la fois.</p>
          </div>
          {file && step > 1 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-sm"
            >
              <FileSpreadsheet size={15} className="text-[var(--success-text)]" />
              <span className="font-medium text-[var(--text-muted)] max-w-[180px] truncate">{file.name}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="employee-import-panel"
        >
          {/* Stepper */}
          <ImportStepper currentStep={step} />

          {/* Content */}
          <div id="employee-import-content" className="employee-import-content">{uiImportError && <div className="employee-import-error" role="alert"><AlertTriangle size={18} strokeWidth={1.5}/><p>{uiImportError}</p><Button variant="ghost" onClick={() => { setUiImportError(''); }} aria-label="Fermer le message"><X size={16}/></Button></div>}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              >

                {/* ── ÉTAPE 1 : UPLOAD ─────────────────────────────────────── */}
                {step === 1 && (
                  <div className="employee-import-start">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-[var(--text)] mb-1">
                        Téléversez votre fichier Excel
                      </h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        Formats acceptés : .xlsx, .xls · Max 5 Mo
                      </p>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`employee-import-dropzone relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-[var(--border)] bg-[var(--import-success-soft)]  '
                          : 'border-[var(--border)] hover:border-[var(--text-muted)] bg-[var(--surface-2)]'
                      }`}
                    >
                      <motion.div
                        animate={{ y: isDragging ? -6 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                          isDragging ? 'bg-[var(--import-success-soft)] ' : 'bg-[var(--surface-2)]'
                        }`}>
                          <FileSpreadsheet className={isDragging ? 'text-[var(--success-text)]' : 'text-[var(--text-muted)]'} size={32} />
                        </div>
                        <p className="text-base font-semibold text-[var(--text-muted)] mb-1">
                          {isDragging ? 'Relâchez le fichier ici' : 'Glissez-déposez votre fichier'}
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mb-5">ou</p>
                        <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--action)] text-[var(--on-brand)] rounded-xl font-bold text-sm cursor-pointer hover:bg-[var(--action)] transition-colors shadow-lg ">
                          <Upload size={15} />
                          Parcourir les fichiers
                          <input type="file" accept=".xlsx,.xls" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="sr-only" />
                        </label>
                      </motion.div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <KonzaLoader variant="inline" label="Analyse du fichier…" />
                      </div>
                    )}

                    {/* Template download */}
                    <div className="employee-import-template">
                      <div className="w-10 h-10 bg-[var(--surface-2)] rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <Download className="text-[var(--text-muted)]" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[var(--text)] mb-0.5">Pas encore de fichier ?</p>
                        <p className="text-xs text-[var(--text-muted)]">Téléchargez notre modèle avec colonnes pré-configurées.</p>
                      </div>
                      <Button variant="ghost" onClick={downloadTemplate}
                        className="flex-shrink-0 px-4 py-2 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl font-bold text-xs border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors shadow-sm">
                        Télécharger
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 2 : MAPPING ────────────────────────────────────── */}
                {step === 2 && analysis && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-[var(--text)] mb-1">
                          Correspondance des colonnes
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} />{analysis.totalRows} ligne(s)</span>
                          <span className="flex items-center gap-1.5"><Zap size={13} />{analysis.detectedColumns.length} colonne(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {analysis.warnings.length > 0 && (
                      <div className="p-4 bg-[var(--import-warning-soft)]  border border-[var(--border)]  rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--warning-text)]  uppercase tracking-wide">
                          <AlertTriangle size={14} /> Avertissements
                        </div>
                        {analysis.warnings.map((w: string, i: number) => (
                          <p key={i} className="text-sm text-[var(--warning-text)]  flex items-start gap-2">
                            <Info size={14} className="flex-shrink-0 mt-0.5" />{w}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Preview table */}
                    <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
                      <div className="px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--border)]">
                        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                          <FileCheck size={13} /> Aperçu (3 premières lignes)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="employee-import-table w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)]">
                              {analysis.detectedColumns.map((col: string) => (
                                <th key={col} className="text-left px-4 py-2.5 font-bold text-[var(--text-muted)] whitespace-nowrap text-xs">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.previewData.slice(0, 3).map((row: any, i: number) => (
                              <tr key={i} className="border-b border-[var(--border)] last:border-0">
                                {analysis.detectedColumns.map((col: string) => (
                                  <td key={col} className="px-4 py-2.5 text-[var(--text-muted)] whitespace-nowrap text-xs">{row[col] ?? '—'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mapping rows */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Faites correspondre vos colonnes aux champs du système
                      </p>
                      {analysis.detectedColumns.map((excelCol: string) => {
                        const suggestion = analysis.suggestedMappings.find((m: any) => m.excelColumn === excelCol);
                        const isMapped   = !!mappings[excelCol];
                        return (
                          <div key={excelCol}>
                          <div className={`employee-import-mapping flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                            isMapped
                              ? 'bg-[var(--surface-2)] border-[var(--border)]'
                              : 'bg-[var(--surface)] border-[var(--border)]'
                          }`}>
                            {/* Column name */}
                            <div className="w-36 flex-shrink-0">
                              <p className="text-sm font-medium text-[var(--text-muted)] truncate">{excelCol}</p>
                              {suggestion && (
                                <p className="text-[10px] text-[var(--success-text)] flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 size={10} /> {suggestion.confidence}% confiance
                                </p>
                              )}
                            </div>
                            {/* Arrow */}
                            <ChevronRight size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                            {/* Select */}
                            <div className="employee-import-select"><FancySelect label="" placeholder={`Champ pour ${excelCol}`}
 value={isBonusValue(mappings[excelCol]) ? BONUS_TAXABLE : (mappings[excelCol] || '')}
 onChange={value => handleMappingChange(excelCol, value)}
 options={[{value:'',label:'Ignorer cette colonne'},...Object.entries(DB_FIELDS).map(([value,label])=>({value,label})),{value:BONUS_TAXABLE,label:'Prime / indemnité (nom de la colonne conservé)'}]} /></div>
                            {/* Status indicator */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isMapped ? 'bg-[var(--import-success-soft)] ' : 'bg-[var(--surface-2)]'
                            }`}>
                              {isMapped
                                ? <Check size={12} className="text-[var(--success-text)] " />
                                : <X size={12} className="text-[var(--text-muted)]" />
                              }
                            </div>
                          </div>

                          {/* 🆕 Nature fiscale de la prime */}
                          {isBonusValue(mappings[excelCol]) && (() => {
                            const info   = analysis.bonusColumnInfo?.[excelCol];
                            const locked = !!info?.catalogNature;
                            const nature: 'TAXABLE' | 'NON_TAXABLE' = locked
                              ? (info!.catalogNature as 'TAXABLE' | 'NON_TAXABLE')
                              : mappings[excelCol] === BONUS_NON_TAXABLE ? 'NON_TAXABLE' : 'TAXABLE';
                            return (
                              <div className="ml-6 mt-1.5 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-2.5">
                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                                  <Coins size={12} /> Prime : <b className="text-[var(--text)]">{info?.name ?? excelCol}</b>
                                  {info?.catalogName && <span>(déjà dans votre catalogue)</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Nature fiscale</span>
                                  <div className="inline-flex rounded-lg border border-[var(--border)] overflow-hidden">
                                    {([['TAXABLE', 'Imposable'], ['NON_TAXABLE', 'Non imposable']] as const).map(([val, label]) => (
                                      <Button variant="ghost" key={val} type="button" disabled={locked}
                                        onClick={() => setBonusNature(excelCol, val)}
                                        className={`px-3.5 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed ${
                                          nature === val
                                            ? 'bg-[var(--text)] text-[var(--bg)]'
                                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)]'
                                        }`}>{label}</Button>
                                    ))}
                                  </div>
                                </div>
                                {locked ? (
                                  <p className="text-[11px] text-[var(--text-muted)]">Défini par votre catalogue : {info?.catalogLabel}. Pour le changer, modifiez la prime dans le catalogue.</p>
                                ) : info?.allowanceHint && nature === 'TAXABLE' ? (
                                  <p className="text-[11px] text-[var(--text-muted)] flex items-start gap-1.5">
                                    <Info size={12} className="flex-shrink-0 mt-0.5" />
                                    Les frais de transport, panier, logement, représentation… sont souvent non imposables : vérifiez.
                                  </p>
                                ) : null}
                              </div>
                            );
                          })()}
                          </div>
                        );
                      })}
                    </div>

                    {/* 🆕 Confirmation de la nature fiscale des primes */}
                    {bonusCols.length > 0 && (
                      <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-3">
                        <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                          <Coins size={15} /> Nature fiscale des primes ({bonusCols.length})
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Chaque prime est imposable par défaut. Passez en « Non imposable » les indemnités qui ne le sont pas (transport, représentation…).
                          Ce choix détermine les retenues sur le bulletin.
                        </p>
                        <ul className="space-y-1">
                          {bonusCols.map((c: string) => {
                            const info = analysis.bonusColumnInfo?.[c];
                            const non  = (info?.catalogNature ? info.catalogNature === 'NON_TAXABLE' : mappings[c] === BONUS_NON_TAXABLE);
                            return (
                              <li key={c} className="flex items-center justify-between text-sm text-[var(--text)]">
                                <span>{info?.name ?? c}</span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                  non ? 'bg-[var(--surface-2)] text-[var(--text-secondary)]  border-[var(--border)]'
                                      : 'bg-[var(--import-success-soft)] text-[var(--success-text)]  border-[var(--border)]'
                                }`}>{non ? 'Non imposable' : 'Imposable'}</span>
                              </li>
                            );
                          })}
                        </ul>
                        <label className="flex items-center gap-2 text-sm text-[var(--text)] cursor-pointer">
                          <input type="checkbox" checked={fiscalConfirmed} onChange={e => setFiscalConfirmed(e.target.checked)} className="accent-[var(--brand)]" />
                          J'ai vérifié la nature fiscale de chaque prime
                        </label>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <Button variant="ghost" onClick={() => setStep(1)}
                        className="px-5 py-2.5 text-sm text-[var(--text-muted)] font-semibold hover:bg-[var(--surface-2)] rounded-xl transition-colors">
                        ← Retour
                      </Button>
                      <Button variant="primary" onClick={validateMappings} disabled={isLoading || (bonusCols.length > 0 && !fiscalConfirmed)}
                        className="flex items-center gap-2 px-7 py-2.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
                        {isLoading ? <><Loader2 className="animate-spin" size={16} />Validation…</> : <>Valider <ChevronRight size={16} /></>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 3 : VALIDATION ─────────────────────────────────── */}
                {step === 3 && validation && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text)] mb-1">Résultat de la validation</h2>
                      <p className="text-sm text-[var(--text-muted)]">
                        {validation.isValid ? 'Toutes les données sont prêtes à être importées.' : 'Certaines lignes contiennent des erreurs.'}
                      </p>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-[var(--import-success-soft)]  border border-[var(--border)]  rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--success-text)]  uppercase tracking-wide mb-2">
                          <CheckCircle2 size={14} /> Lignes valides
                        </div>
                        <div className="text-4xl font-black text-[var(--success-text)] ">{validation.validRows}</div>
                      </div>
                      <div className={`p-5 border rounded-2xl ${
                        validation.invalidRows > 0
                          ? 'bg-[var(--import-danger-soft)]  border-[var(--border)] '
                          : 'bg-[var(--surface-2)] border-[var(--border)]'
                      }`}>
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2 ${
                          validation.invalidRows > 0 ? 'text-[var(--danger-text)] ' : 'text-[var(--text-muted)]'
                        }`}>
                          <XCircle size={14} /> Lignes invalides
                        </div>
                        <div className={`text-4xl font-black ${
                          validation.invalidRows > 0 ? 'text-[var(--danger-text)] ' : 'text-[var(--text-muted)]'
                        }`}>{validation.invalidRows}</div>
                      </div>
                    </div>

                    {/* 🆕 Primes et indemnités détectées */}
                    {validation.bonusPlan && validation.bonusPlan.length > 0 && (
                      <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
                        <div className="px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--border)]">
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                            <Coins size={13} /> Primes et indemnités ({validation.bonusPlan.length})
                          </p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="employee-import-table w-full text-sm">
                            <thead>
                              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                                <th className="px-4 py-2.5">Prime</th>
                                <th className="px-4 py-2.5">Type</th>
                                <th className="px-4 py-2.5">Catalogue</th>
                                <th className="px-4 py-2.5 text-right">Employés</th>
                                <th className="px-4 py-2.5 text-right">Total / mois</th>
                              </tr>
                            </thead>
                            <tbody>
                              {validation.bonusPlan.map((b: BonusPlanItem) => (
                                <tr key={b.column} className="border-b last:border-0 border-[var(--border)]">
                                  <td className="px-4 py-2.5 font-semibold text-[var(--text)]">{b.name}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                      b.kind === 'BONUS_NON_TAXABLE'
                                        ? 'bg-[var(--surface-2)] text-[var(--text-secondary)]  border-[var(--border)]'
                                        : 'bg-[var(--import-success-soft)] text-[var(--success-text)]  border-[var(--border)]'
                                    }`}>{b.kindLabel}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs">
                                    {b.action === 'CREATE' ? 'Sera créée' : 'Déjà au catalogue'}
                                    {b.conflict !== 'NONE' && <span className="block text-[11px]">type du catalogue conservé</span>}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-[var(--text)]">{b.employees}</td>
                                  <td className="px-4 py-2.5 text-right text-[var(--text)]">{fcfa(b.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {validation.bonusWarnings && validation.bonusWarnings.length > 0 && (
                          <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)] space-y-1.5">
                            {validation.bonusWarnings.map((w: string, i: number) => (
                              <p key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                                <Info size={13} className="flex-shrink-0 mt-0.5" />{w}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Errors list */}
                    {validation.errors.length > 0 && (
                      <div className="rounded-2xl border border-[var(--border)]  overflow-hidden">
                        <div className="px-5 py-3 bg-[var(--import-danger-soft)]  border-b border-[var(--border)] ">
                          <p className="text-xs font-bold text-[var(--danger-text)]  uppercase tracking-wide flex items-center gap-1.5">
                            <XCircle size={13} /> {validation.errors.length} erreur(s) détectée(s)
                          </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-4 space-y-1.5">
                          {validation.errors.map((err: string, i: number) => (
                            <p key={i} className="text-sm text-[var(--danger-text)]  flex items-start gap-2">
                              <span className="text-[var(--danger-text)] mt-0.5 flex-shrink-0">·</span>{err}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <Button variant="ghost" onClick={() => setStep(2)}
                        className="px-5 py-2.5 text-sm text-[var(--text-muted)] font-semibold hover:bg-[var(--surface-2)] rounded-xl transition-colors">
                        ← Modifier le mapping
                      </Button>
                      <Button variant="primary" onClick={executeImport} disabled={!validation.isValid || isLoading}
                        className="flex items-center gap-2 px-7 py-2.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        {isLoading ? <><Loader2 className="animate-spin" size={16} />Import…</> : <>Lancer l'import <ChevronRight size={16} /></>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 4 : RÉSULTAT ───────────────────────────────────── */}
                {step === 4 && importResult && (
                  <div className="employee-import-result text-center space-y-6 py-4 max-w-md mx-auto">
                    {importResult.success && importResult.imported > 0 && <div className="employee-import-celebration"><EmployeeCelebration final /></div>}
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto ${
                        importResult.success
                          ? 'bg-[var(--import-success-soft)]  shadow-lg '
                          : 'bg-[var(--import-warning-soft)]  shadow-lg '
                      }`}
                    >
                      {importResult.success
                        ? <CheckCircle2 size={40} className="text-[var(--success-text)] " />
                        : <AlertTriangle size={40} className="text-[var(--warning-text)] " />
                      }
                    </motion.div>

                    {/* Text */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                      <h2 className="text-2xl font-black text-[var(--text)] mb-2 tracking-tight">
                        {importResult.success ? 'Import réussi !' : 'Import partiel'}
                      </h2>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] rounded-2xl text-sm font-bold text-[var(--text-muted)]">
                        <Users size={15} />
                        {importResult.imported} employé(s) importé(s)
                        {importResult.skipped > 0 && (
                          <span className="text-[var(--text-muted)] font-normal">· {importResult.skipped} ignoré(s)</span>
                        )}
                      </div>
                    </motion.div>

                    {/* 🆕 Primes et indemnités */}
                    {importResult.bonuses && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
                        className="rounded-2xl border border-[var(--border)] overflow-hidden text-left">
                        <div className="px-5 py-3 bg-[var(--surface-2)] border-b border-[var(--border)]">
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                            <Coins size={13} /> Primes et indemnités
                          </p>
                        </div>
                        <div className="p-4 space-y-2 text-sm text-[var(--text)]">
                          <p><b>{importResult.bonuses.bonusesAssigned}</b> prime(s) attribuée(s) · <b>{fcfa(importResult.bonuses.totalAmount)}</b> / mois</p>
                          {importResult.bonuses.templatesCreated.length > 0 && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Créées dans le catalogue : {importResult.bonuses.templatesCreated.map((t: { name: string }) => t.name).join(', ')}
                            </p>
                          )}
                          {importResult.bonuses.templatesReused.length > 0 && (
                            <p className="text-xs text-[var(--text-muted)]">
                              Catalogue existant utilisé : {importResult.bonuses.templatesReused.map((t: { name: string }) => t.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-[var(--border)]  overflow-hidden text-left">
                        <div className="px-5 py-3 bg-[var(--import-warning-soft)] ">
                          <p className="text-xs font-bold text-[var(--warning-text)]  uppercase tracking-wide">Erreurs rencontrées</p>
                        </div>
                        <div className="max-h-36 overflow-y-auto p-4 space-y-1.5">
                          {importResult.errors.map((err: any, i: number) => (
                            <p key={i} className="text-xs text-[var(--warning-text)] ">
                              <span className="font-bold">Ligne {err.row} :</span> {err.message}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                      className="flex gap-3 justify-center">
                      <Button variant="ghost" onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl font-bold text-sm hover:bg-[var(--border)] transition-colors">
                        Nouvel import
                      </Button>
                      <Button variant="primary" onClick={() => router.push('/employes')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] rounded-xl font-bold text-sm transition-colors group">
                        Voir les employés
                        <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </motion.div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-center text-xs text-[var(--text-muted)] mt-4"
        >
          Les données importées peuvent être modifiées depuis la fiche de chaque employé
        </motion.p>
      </div>
    </></div></ModulePageFrame>
  );
}