'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  Download, ChevronRight, ArrowLeft, Loader2, Users, FileCheck,
  Zap, Info, Check, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  success: boolean;
  data: {
    totalRows: number;
    detectedColumns: string[];
    previewData: Record<string, any>[];
    suggestedMappings: Array<{ excelColumn: string; dbField: string; confidence: number }>;
    warnings: string[];
  };
}
interface ValidationResult {
  data: { isValid: boolean; validRows: number; invalidRows: number; errors: string[] };
}
interface ImportResult {
  data: { success: boolean; imported: number; skipped: number; errors: Array<{ row: number; message: string }> };
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
};

// ─── Step config ─────────────────────────────────────────────────────────────
const IMPORT_STEPS = [
  { num: 1, label: 'Fichier',     icon: Upload },
  { num: 2, label: 'Colonnes',    icon: FileCheck },
  { num: 3, label: 'Validation',  icon: CheckCircle2 },
  { num: 4, label: 'Résultat',    icon: Users },
];

// ─── Stepper ─────────────────────────────────────────────────────────────────
function ImportStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-0 max-w-lg mx-auto">
        {IMPORT_STEPS.map((step, idx) => {
          const isActive    = step.num === currentStep;
          const isCompleted = step.num < currentStep;
          const isLast      = idx === IMPORT_STEPS.length - 1;
          const Icon        = step.icon;
          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <motion.div
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-gray-900 dark:bg-white shadow-md'
                      : isActive
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {isCompleted
                    ? <Check size={16} strokeWidth={2.5} className="text-white dark:text-gray-900" />
                    : <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'} />
                  }
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.35, 0, 0.35] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-2xl bg-sky-400 -z-10"
                    />
                  )}
                </motion.div>
                <span className={`text-[10px] font-bold uppercase tracking-wide hidden sm:block transition-colors ${
                  isActive    ? 'text-gray-900 dark:text-white' :
                  isCompleted ? 'text-gray-400 dark:text-gray-500' :
                                'text-gray-300 dark:text-gray-600'
                }`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 mx-2 h-px relative top-[-10px] sm:top-[-14px] overflow-hidden">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <motion.div
                    className="absolute inset-0 bg-gray-700 dark:bg-gray-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step.num < currentStep ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="mt-5 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden max-w-lg mx-auto">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400"
          animate={{ width: `${((currentStep - 1) / (IMPORT_STEPS.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// ─── Page background ──────────────────────────────────────────────────────────
function PageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gray-50 dark:bg-[#0d1117]" />
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(circle, #64748b 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      <div className="absolute top-0 right-1/4 w-[450px] h-[350px] bg-sky-400/6 dark:bg-sky-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-emerald-400/4 dark:bg-emerald-500/6 rounded-full blur-[100px]" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EmployeeImportPage() {
  const router = useRouter();
  const [step, setStep]               = useState(1);
  const [file, setFile]               = useState<File | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [analysis, setAnalysis]       = useState<any>(null);
  const [mappings, setMappings]       = useState<Record<string, string>>({});
  const [validation, setValidation]   = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoading, setIsLoading]     = useState(false);

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
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      const result = await api.postFormData('/employees/import/analyze', fd) as AnalysisResult;
      if (result.success) {
        setAnalysis(result.data);
        const init: Record<string, string> = {};
        result.data.suggestedMappings.forEach(m => { init[m.excelColumn] = m.dbField; });
        setMappings(init);
        setStep(2);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Mapping validation ──────────────────────────────────────────────────────
  const handleMappingChange = (col: string, field: string) =>
    setMappings(prev => ({ ...prev, [col]: field }));

  const validateMappings = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings));
      const result = await api.postFormData('/employees/import/validate', fd) as ValidationResult;
      setValidation(result.data);
      setStep(3);
    } catch (error) { console.error('Erreur validation:', error); }
    finally { setIsLoading(false); }
  };

  // ── Execute import ──────────────────────────────────────────────────────────
  const executeImport = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings));
      const result = await api.postFormData('/employees/import/execute', fd) as ImportResult;
      setImportResult(result.data);
      setStep(4);
    } catch (error) { console.error('Erreur import:', error); }
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
    <>
      <PageBackground />

      <div className="w-full max-w-4xl mx-auto py-6 px-4">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors mb-2 group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Retour aux employés
            </button>
            <p className="text-xs font-bold tracking-[0.18em] text-gray-400 uppercase mb-1">Ressources Humaines</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Import Excel</h1>
          </div>
          {file && step > 1 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm"
            >
              <FileSpreadsheet size={15} className="text-emerald-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{file.name}</span>
            </motion.div>
          )}
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          {/* Stepper */}
          <ImportStepper currentStep={step} />

          {/* Content */}
          <div className="p-6 sm:p-10 min-h-[420px]">
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
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        Téléversez votre fichier Excel
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Formats acceptés : .xlsx, .xls · Max 5 Mo
                      </p>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/15 scale-[1.01]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                    >
                      <motion.div
                        animate={{ y: isDragging ? -6 : 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                          isDragging ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <FileSpreadsheet className={isDragging ? 'text-sky-500' : 'text-gray-400 dark:text-gray-500'} size={32} />
                        </div>
                        <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          {isDragging ? 'Relâchez le fichier ici' : 'Glissez-déposez votre fichier'}
                        </p>
                        <p className="text-sm text-gray-400 mb-5">ou</p>
                        <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-lg shadow-black/10">
                          <Upload size={15} />
                          Parcourir les fichiers
                          <input type="file" accept=".xlsx,.xls" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                        </label>
                      </motion.div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                      <div className="flex items-center justify-center gap-3 py-4">
                        <Loader2 className="animate-spin text-sky-500" size={20} />
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Analyse du fichier…</span>
                      </div>
                    )}

                    {/* Template download */}
                    <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <Download className="text-gray-500 dark:text-gray-400" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-0.5">Pas encore de fichier ?</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Téléchargez notre modèle avec colonnes pré-configurées.</p>
                      </div>
                      <button onClick={downloadTemplate}
                        className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">
                        Télécharger
                      </button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 2 : MAPPING ────────────────────────────────────── */}
                {step === 2 && analysis && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          Correspondance des colonnes
                        </h2>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5"><FileSpreadsheet size={13} />{analysis.totalRows} ligne(s)</span>
                          <span className="flex items-center gap-1.5"><Zap size={13} />{analysis.detectedColumns.length} colonne(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {analysis.warnings.length > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                          <AlertTriangle size={14} /> Avertissements
                        </div>
                        {analysis.warnings.map((w: string, i: number) => (
                          <p key={i} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                            <Info size={14} className="flex-shrink-0 mt-0.5" />{w}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Preview table */}
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <FileCheck size={13} /> Aperçu (3 premières lignes)
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                              {analysis.detectedColumns.map((col: string) => (
                                <th key={col} className="text-left px-4 py-2.5 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analysis.previewData.slice(0, 3).map((row: any, i: number) => (
                              <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                {analysis.detectedColumns.map((col: string) => (
                                  <td key={col} className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{row[col] ?? '—'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Mapping rows */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                        Faites correspondre vos colonnes aux champs du système
                      </p>
                      {analysis.detectedColumns.map((excelCol: string) => {
                        const suggestion = analysis.suggestedMappings.find((m: any) => m.excelColumn === excelCol);
                        const isMapped   = !!mappings[excelCol];
                        return (
                          <div key={excelCol} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                            isMapped
                              ? 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                          }`}>
                            {/* Column name */}
                            <div className="w-36 flex-shrink-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{excelCol}</p>
                              {suggestion && (
                                <p className="text-[10px] text-sky-500 flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 size={10} /> {suggestion.confidence}% confiance
                                </p>
                              )}
                            </div>
                            {/* Arrow */}
                            <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                            {/* Select */}
                            <select
                              value={mappings[excelCol] || ''}
                              onChange={e => handleMappingChange(excelCol, e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 outline-none transition-all"
                            >
                              <option value="">— Ignorer cette colonne —</option>
                              {Object.entries(DB_FIELDS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                            {/* Status indicator */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isMapped ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {isMapped
                                ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" />
                                : <X size={12} className="text-gray-300 dark:text-gray-600" />
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <button onClick={() => setStep(1)}
                        className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        ← Retour
                      </button>
                      <button onClick={validateMappings} disabled={isLoading}
                        className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all">
                        {isLoading ? <><Loader2 className="animate-spin" size={16} />Validation…</> : <>Valider <ChevronRight size={16} /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 3 : VALIDATION ─────────────────────────────────── */}
                {step === 3 && validation && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Résultat de la validation</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {validation.isValid ? 'Toutes les données sont prêtes à être importées.' : 'Certaines lignes contiennent des erreurs.'}
                      </p>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                          <CheckCircle2 size={14} /> Lignes valides
                        </div>
                        <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{validation.validRows}</div>
                      </div>
                      <div className={`p-5 border rounded-2xl ${
                        validation.invalidRows > 0
                          ? 'bg-red-50 dark:bg-red-900/15 border-red-100 dark:border-red-800/40'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                      }`}>
                        <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-2 ${
                          validation.invalidRows > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'
                        }`}>
                          <XCircle size={14} /> Lignes invalides
                        </div>
                        <div className={`text-4xl font-black ${
                          validation.invalidRows > 0 ? 'text-red-600 dark:text-red-300' : 'text-gray-400'
                        }`}>{validation.invalidRows}</div>
                      </div>
                    </div>

                    {/* Errors list */}
                    {validation.errors.length > 0 && (
                      <div className="rounded-2xl border border-red-100 dark:border-red-800/40 overflow-hidden">
                        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/15 border-b border-red-100 dark:border-red-800/40">
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                            <XCircle size={13} /> {validation.errors.length} erreur(s) détectée(s)
                          </p>
                        </div>
                        <div className="max-h-48 overflow-y-auto p-4 space-y-1.5">
                          {validation.errors.map((err: string, i: number) => (
                            <p key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                              <span className="text-red-400 mt-0.5 flex-shrink-0">·</span>{err}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between pt-2">
                      <button onClick={() => setStep(2)}
                        className="px-5 py-2.5 text-sm text-gray-500 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        ← Modifier le mapping
                      </button>
                      <button onClick={executeImport} disabled={!validation.isValid || isLoading}
                        className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        {isLoading ? <><Loader2 className="animate-spin" size={16} />Import…</> : <>Lancer l'import <ChevronRight size={16} /></>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── ÉTAPE 4 : RÉSULTAT ───────────────────────────────────── */}
                {step === 4 && importResult && (
                  <div className="text-center space-y-6 py-4 max-w-md mx-auto">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto ${
                        importResult.success
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/15'
                          : 'bg-amber-100 dark:bg-amber-900/30 shadow-lg shadow-amber-500/15'
                      }`}
                    >
                      {importResult.success
                        ? <CheckCircle2 size={40} className="text-emerald-600 dark:text-emerald-400" />
                        : <AlertTriangle size={40} className="text-amber-600 dark:text-amber-400" />
                      }
                    </motion.div>

                    {/* Text */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {importResult.success ? 'Import réussi !' : 'Import partiel'}
                      </h2>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300">
                        <Users size={15} />
                        {importResult.imported} employé(s) importé(s)
                        {importResult.skipped > 0 && (
                          <span className="text-gray-400 font-normal">· {importResult.skipped} ignoré(s)</span>
                        )}
                      </div>
                    </motion.div>

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-amber-100 dark:border-amber-800/40 overflow-hidden text-left">
                        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/15">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Erreurs rencontrées</p>
                        </div>
                        <div className="max-h-36 overflow-y-auto p-4 space-y-1.5">
                          {importResult.errors.map((err: any, i: number) => (
                            <p key={i} className="text-xs text-amber-700 dark:text-amber-400">
                              <span className="font-bold">Ligne {err.row} :</span> {err.message}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                      className="flex gap-3 justify-center">
                      <button onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Nouvel import
                      </button>
                      <button onClick={() => router.push('/employes')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 hover:from-sky-600 hover:to-cyan-600 transition-all group">
                        Voir les employés
                        <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                      </button>
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
          className="text-center text-xs text-gray-400 mt-4"
        >
          Les données importées peuvent être modifiées depuis la fiche de chaque employé
        </motion.p>
      </div>
    </>
  );
}