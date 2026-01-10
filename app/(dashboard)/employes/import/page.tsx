'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Download, ChevronRight, ArrowLeft, Loader2, Users, FileCheck, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// Types pour l'import
interface AnalysisResult {
  success: boolean;
  data: {
    totalRows: number;
    detectedColumns: string[];
    previewData: Record<string, any>[];
    suggestedMappings: Array<{
      excelColumn: string;
      dbField: string;
      confidence: number;
    }>;
    warnings: string[];
  };
}

interface ValidationResult {
  data: {
    isValid: boolean;
    validRows: number;
    invalidRows: number;
    errors: string[];
  };
}

interface ImportResult {
  data: {
    success: boolean;
    imported: number;
    skipped: number;
    errors: Array<{ row: number; message: string }>;
  };
}

export default function EmployeeImportPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // 📤 ÉTAPE 1 : UPLOAD & ANALYSE
  // ============================================================================
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const result = await api.postFormData('/employees/import/analyze', formData) as AnalysisResult;
      
      if (result.success) {
        setAnalysis(result.data);
        
        // Initialiser les mappings avec les suggestions
        const initialMappings: Record<string, string> = {};
        result.data.suggestedMappings.forEach((mapping) => {
          initialMappings[mapping.excelColumn] = mapping.dbField;
        });
        setMappings(initialMappings);
        
        setStep(2);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      alert('Erreur lors de l\'analyse du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 🎯 ÉTAPE 2 : MAPPING DES COLONNES
  // ============================================================================

  const handleMappingChange = (excelColumn: string, dbField: string) => {
    setMappings(prev => ({
      ...prev,
      [excelColumn]: dbField
    }));
  };

  const validateMappings = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mappings', JSON.stringify(mappings));

      const result = await api.postFormData('/employees/import/validate', formData) as ValidationResult;
      setValidation(result.data);
      setStep(3);
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // ✅ ÉTAPE 3 : VALIDATION & IMPORT
  // ============================================================================

  const executeImport = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mappings', JSON.stringify(mappings));

      const result = await api.postFormData('/employees/import/execute', formData) as ImportResult;
      setImportResult(result.data);
      setStep(4);
    } catch (error) {
      console.error('Erreur import:', error);
      alert('Erreur lors de l\'import');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // 📥 TÉLÉCHARGER LE TEMPLATE
  // ============================================================================

  const downloadTemplate = async () => {
    try {
      const blob = await api.getBlob('/employees/import/template');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_import_employes.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement template:', error);
    }
  };

  // ============================================================================
  // 🎨 RENDU UI
  // ============================================================================

  const DB_FIELDS: Record<string, string> = {
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    nationalIdNumber: 'N° CNI',
    cnssNumber: 'N° CNSS',
    contractType: 'Type Contrat',
    baseSalary: 'Salaire',
    phone: 'Téléphone',
    dateOfBirth: 'Date Naissance',
    placeOfBirth: 'Lieu Naissance',
    gender: 'Genre',
    maritalStatus: 'Situation Familiale',
    numberOfChildren: 'Nombre Enfants',
    address: 'Adresse',
    city: 'Ville',
    position: 'Poste',
    departmentName: 'Département',
    hireDate: 'Date Embauche',
    taxNumber: 'N° Fiscal',
    bankName: 'Banque',
    bankAccountNumber: 'N° Compte',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour aux employés</span>
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-2xl">
              <Upload className="text-sky-600 dark:text-sky-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Excel</h1>
              <p className="text-gray-600 dark:text-gray-400">Importez rapidement vos employés depuis un fichier Excel</p>
            </div>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 p-6 mb-6">
          <div className="flex items-center justify-between relative max-w-3xl mx-auto">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-sky-500 dark:bg-sky-400 -z-10 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }} 
            />
            
            {[
              { num: 1, label: 'Upload', icon: Upload },
              { num: 2, label: 'Mapping', icon: FileCheck },
              { num: 3, label: 'Validation', icon: CheckCircle2 },
              { num: 4, label: 'Import', icon: Users }
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center bg-white dark:bg-gray-800/50 px-4 rounded-full py-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step >= num 
                    ? 'bg-sky-500 dark:bg-sky-600 text-white shadow-lg shadow-sky-500/30' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  <Icon size={20} />
                </div>
                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                  step >= num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              
              {/* ÉTAPE 1 : UPLOAD */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Téléversez votre fichier Excel
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Formats acceptés : .xlsx, .xls (max 5 Mo)
                    </p>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                      isDragging 
                        ? 'border-sky-500 dark:border-sky-400 bg-sky-50 dark:bg-sky-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <FileSpreadsheet className="mx-auto mb-4 text-gray-400 dark:text-gray-500" size={64} />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">ou</p>
                    <label className="inline-block px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold cursor-pointer hover:scale-105 transition-transform shadow-lg">
                      Parcourir les fichiers
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Download Template */}
                  <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-6 flex items-start gap-4">
                    <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                      <Download className="text-sky-600 dark:text-sky-400" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                        Vous n'avez pas encore de fichier ?
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                        Téléchargez notre modèle Excel avec les colonnes pré-configurées et un exemple.
                      </p>
                      <button 
                        onClick={downloadTemplate}
                        className="px-4 py-2 bg-sky-500 dark:bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-600 dark:hover:bg-sky-700 transition-colors text-sm shadow-lg shadow-sky-500/30"
                      >
                        Télécharger le modèle
                      </button>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="flex items-center justify-center gap-3 py-8">
                      <Loader2 className="animate-spin text-sky-500" size={24} />
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        Analyse du fichier en cours...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ÉTAPE 2 : MAPPING */}
              {step === 2 && analysis && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Vérifier la correspondance des colonnes
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet size={16} />
                        {analysis.totalRows} ligne(s)
                      </span>
                      <span className="flex items-center gap-2">
                        <Zap size={16} />
                        {analysis.detectedColumns.length} colonne(s)
                      </span>
                    </div>
                  </div>

                  {/* Warnings */}
                  {analysis.warnings.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-orange-900 dark:text-orange-300 mb-2">
                        <AlertTriangle size={20} />
                        Avertissements
                      </div>
                      {analysis.warnings.map((warning: string, i: number) => (
                        <p key={i} className="text-orange-700 dark:text-orange-400 text-sm flex items-start gap-2">
                          <Info size={16} className="flex-shrink-0 mt-0.5" />
                          {warning}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Preview Data */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-white/5">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileCheck size={18} />
                      Aperçu des données
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            {analysis.detectedColumns.map((col: string) => (
                              <th key={col} className="text-left p-2 font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.previewData.slice(0, 3).map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                              {analysis.detectedColumns.map((col: string) => (
                                <td key={col} className="p-2 text-gray-600 dark:text-gray-400">
                                  {row[col]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mapping Table */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ChevronRight size={18} />
                      Correspondance des colonnes
                    </h3>
                    {analysis.detectedColumns.map((excelCol: string) => {
                      const suggestion = analysis.suggestedMappings.find((m: any) => m.excelColumn === excelCol);
                      return (
                        <div key={excelCol} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-white/5">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{excelCol}</div>
                            {suggestion && (
                              <div className="text-xs text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Confiance: {suggestion.confidence}%
                              </div>
                            )}
                          </div>
                          <ChevronRight className="text-gray-400" size={20} />
                          <div className="flex-1">
                            <select
                              value={mappings[excelCol] || ''}
                              onChange={(e) => handleMappingChange(excelCol, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
                            >
                              <option value="">-- Ignorer --</option>
                              {Object.entries(DB_FIELDS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={validateMappings}
                      disabled={isLoading}
                      className="px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 shadow-lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Validation...
                        </>
                      ) : (
                        <>
                          Valider le mapping
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 3 : VALIDATION */}
              {step === 3 && validation && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Résultat de la validation
                    </h2>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                        <CheckCircle2 size={20} />
                        <span className="font-bold">Lignes valides</span>
                      </div>
                      <div className="text-4xl font-bold text-emerald-900 dark:text-emerald-300">
                        {validation.validRows}
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                        <XCircle size={20} />
                        <span className="font-bold">Lignes invalides</span>
                      </div>
                      <div className="text-4xl font-bold text-red-900 dark:text-red-300">
                        {validation.invalidRows}
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 max-h-64 overflow-y-auto">
                      <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-300 mb-3">
                        <XCircle size={20} />
                        Erreurs détectées ({validation.errors.length})
                      </div>
                      <div className="space-y-1">
                        {validation.errors.map((error: string, i: number) => (
                          <p key={i} className="text-red-700 dark:text-red-400 text-sm">• {error}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between pt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                      Modifier le mapping
                    </button>
                    <button
                      onClick={executeImport}
                      disabled={!validation.isValid || isLoading}
                      className="px-8 py-3 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          Lancer l'import
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4 : RÉSULTAT */}
              {step === 4 && importResult && (
                <div className="text-center space-y-6 py-8">
                  <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                    importResult.success 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  }`}>
                    {importResult.success ? <CheckCircle2 size={48} /> : <AlertTriangle size={48} />}
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {importResult.success ? 'Import réussi !' : 'Import partiel'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                      {importResult.imported} employé(s) importé(s)
                      {importResult.skipped > 0 && ` • ${importResult.skipped} ignoré(s)`}
                    </p>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 max-w-2xl mx-auto text-left max-h-48 overflow-y-auto">
                      <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-2">
                        Erreurs rencontrées
                      </h3>
                      {importResult.errors.map((error: any, i: number) => (
                        <p key={i} className="text-orange-700 dark:text-orange-400 text-sm">
                          Ligne {error.row}: {error.message}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Nouvel import
                    </button>
                    <button
                      onClick={() => window.location.href = '/employes'}
                      className="px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                      Voir les employés
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}