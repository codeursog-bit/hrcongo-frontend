'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Loader2, CheckCircle2, FileText, User,
  File, GraduationCap, DollarSign, Award,
  FileCheck, Paperclip, Receipt, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DocumentUploader } from './DocumentUploader';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { api } from '@/services/api';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { id: 'contrat_cdi', name: 'Contrat CDI', icon: File, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
  { id: 'contrat_cdd', name: 'Contrat CDD', icon: File, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
  { id: 'contrat_stage', name: 'Convention de Stage', icon: GraduationCap, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  { id: 'bulletin_paie', name: 'Bulletin de Paie', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'certificat_travail', name: 'Certificat de Travail', icon: Award, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
  { id: 'attestation_employeur', name: 'Attestation Employeur', icon: FileCheck, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' },
  { id: 'avenant', name: 'Avenant au Contrat', icon: Paperclip, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' },
  { id: 'solde_tout_compte', name: 'Solde de Tout Compte', icon: Receipt, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
  { id: 'autre', name: 'Autre Document', icon: Folder, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' }
];

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'form' | 'uploading' | 'success'>('form');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const { uploadDocument, isUploading, uploadProgress, error } = useDocumentUpload();

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStep('form');
    setSelectedType('');
    setSelectedEmployee('');
    setDescription('');
    setSelectedFile(null);
  };

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await api.get<any[]>('/employees');
      setEmployees(data || []);
    } catch (e) {
      console.error('Erreur chargement employés', e);
      setEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !selectedEmployee || !selectedFile) return;

    setStep('uploading');

    try {
      const docType = DOCUMENT_TYPES.find(t => t.id === selectedType);
      
      // ✅ Upload via backend (tout en un seul appel)
      await uploadDocument(selectedFile, {
        name: `${docType?.name} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: selectedType,
        description: description || undefined,
        employeeId: selectedEmployee
      });

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Erreur upload document:', err);
      alert(err.message || 'Erreur lors de l\'enregistrement du document');
      setStep('form');
    }
  };

  const canSubmit = selectedType && selectedEmployee && selectedFile && !isUploading;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-sky-500 to-blue-500 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <FileText size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {step === 'success' ? 'Document Enregistré !' : 'Nouveau Document'}
                </h2>
                <p className="text-sm text-white/80">
                  {step === 'form' && 'Ajoutez un document au dossier'}
                  {step === 'uploading' && 'Upload en cours...'}
                  {step === 'success' && 'Enregistrement réussi'}
                </p>
              </div>
            </div>
            {step !== 'uploading' && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {step === 'form' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Type de document *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {DOCUMENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`p-4 border-2 rounded-xl text-left transition-all ${
                            selectedType === type.id
                              ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                              <Icon size={20} />
                            </div>
                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                              {type.name}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    <User size={16} className="inline mr-2" />
                    Employé concerné *
                  </label>
                  {isLoadingEmployees ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <Loader2 className="animate-spin inline mr-2" size={16} />
                      Chargement...
                    </div>
                  ) : (
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
                    >
                      <option value="">Sélectionner un employé</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} - {emp.position || 'N/A'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Contrat renouvelé pour 2025..."
                    rows={3}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-750 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Fichier *
                  </label>
                  <DocumentUploader
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onRemove={() => setSelectedFile(null)}
                  />
                </div>
              </div>
            )}

            {step === 'uploading' && (
              <div className="py-12 text-center space-y-6">
                <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-full flex items-center justify-center mx-auto">
                  <Loader2 size={36} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Upload en cours...
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Veuillez patienter
                  </p>
                  <div className="max-w-xs mx-auto">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Progression</span>
                      <span className="font-bold text-sky-600">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 text-center">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Document enregistré !
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Le document a été ajouté avec succès
                </p>
              </div>
            )}
          </div>

          {step === 'form' && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 px-6 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}