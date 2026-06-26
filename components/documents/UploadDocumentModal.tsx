'use client';

// ============================================================================
// 📄 components/documents/UploadDocumentModal.tsx
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileText, User, CheckCircle2,
  Loader2, AlertCircle, ChevronDown, Calendar,
  Building2, Hash, File,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types de documents avec leurs contraintes ────────────────────────────────

const DOCUMENT_TYPES = [
  {
    id: 'id_card',         label: 'Carte d\'identité (CNI)',   needsExpiry: true,  needsNumber: true,  group: 'Identité',
    icon: '🪪', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  },
  {
    id: 'passport',        label: 'Passeport',                  needsExpiry: true,  needsNumber: true,  group: 'Identité',
    icon: '📘', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
  },
  {
    id: 'driver_license',  label: 'Permis de conduire',         needsExpiry: true,  needsNumber: true,  group: 'Identité',
    icon: '🚗', color: 'text-violet-600 bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800',
  },
  {
    id: 'contract',        label: 'Contrat de travail',         needsExpiry: false, needsNumber: false, group: 'RH',
    icon: '📝', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
  },
  {
    id: 'payslip',         label: 'Bulletin de paie',           needsExpiry: false, needsNumber: false, group: 'RH',
    icon: '💰', color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
  },
  {
    id: 'work_certificate', label: 'Attestation de travail',    needsExpiry: false, needsNumber: false, group: 'RH',
    icon: '📋', color: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
  },
  {
    id: 'salary_attestation', label: 'Attestation de salaire', needsExpiry: false, needsNumber: false, group: 'RH',
    icon: '📊', color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800',
  },
  {
    id: 'diploma',         label: 'Diplôme',                    needsExpiry: false, needsNumber: true,  group: 'Formation',
    icon: '🎓', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  },
  {
    id: 'certification',   label: 'Certification / HSE',        needsExpiry: true,  needsNumber: true,  group: 'Formation',
    icon: '🏅', color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  },
  {
    id: 'training_cert',   label: 'Attestation de formation',   needsExpiry: true,  needsNumber: false, group: 'Formation',
    icon: '📚', color: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
  },
  {
    id: 'medical_cert',    label: 'Certificat médical',         needsExpiry: true,  needsNumber: false, group: 'Médical',
    icon: '🏥', color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  },
  {
    id: 'medical_visit',   label: 'Visite médicale d\'aptitude', needsExpiry: true, needsNumber: false, group: 'Médical',
    icon: '⚕️', color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
  },
  {
    id: 'resume',          label: 'CV',                         needsExpiry: false, needsNumber: false, group: 'Divers',
    icon: '📄', color: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-700',
  },
  {
    id: 'other',           label: 'Autre document',             needsExpiry: false, needsNumber: false, group: 'Divers',
    icon: '📎', color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
  },
] as const;

const GROUPS = ['Identité', 'RH', 'Formation', 'Médical', 'Divers'];
const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 10 * 1024 * 1024;

// ─── Composant DropZone ───────────────────────────────────────────────────────

function DropZone({ file, onFile, onRemove, error }: {
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
  error?: string | null;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = (f: File) => {
    if (!ACCEPTED_MIME.includes(f.type)) {
      alert('Format non accepté. Utilisez PDF, JPG, PNG ou DOCX.');
      return;
    }
    if (f.size > MAX_SIZE) {
      alert('Fichier trop volumineux (max 10 Mo).');
      return;
    }
    onFile(f);
  };

  if (file) {
    const isPdf = file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/');
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
            {isPdf ? '📄' : isImg ? '🖼️' : '📝'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
          </div>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-800 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-red-600 text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => ref.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
        ${drag ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-sky-300 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
    >
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-3">
        <Upload size={22} className="text-sky-500" />
      </div>
      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Glissez votre fichier ici</p>
      <p className="text-xs text-gray-400 mt-1">ou cliquez pour parcourir</p>
      <p className="text-xs text-gray-300 dark:text-gray-500 mt-2">PDF, JPG, PNG, DOCX · max 10 Mo</p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedEmployeeId?: string;
}

export function UploadDocumentModal({ isOpen, onClose, onSuccess, preselectedEmployeeId }: Props) {
  const [step, setStep]         = useState<'type' | 'details' | 'uploading' | 'success'>('type');
  const [selectedType, setSelectedType] = useState<typeof DOCUMENT_TYPES[number] | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Formulaire
  const [employeeId,     setEmployeeId]     = useState(preselectedEmployeeId ?? '');
  const [documentName,   setDocumentName]   = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingBody,    setIssuingBody]    = useState('');
  const [issuedAt,       setIssuedAt]       = useState('');
  const [expiresAt,      setExpiresAt]      = useState('');
  const [description,    setDescription]    = useState('');
  const [file,           setFile]           = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      if (preselectedEmployeeId) setEmployeeId(preselectedEmployeeId);
    } else {
      reset();
    }
  }, [isOpen, preselectedEmployeeId]);

  // Pré-remplir le nom du document quand le type change
  useEffect(() => {
    if (selectedType) {
      setDocumentName(selectedType.label);
    }
  }, [selectedType]);

  const reset = () => {
    setStep('type');
    setSelectedType(null);
    setEmployeeId(preselectedEmployeeId ?? '');
    setDocumentName('');
    setDocumentNumber('');
    setIssuingBody('');
    setIssuedAt('');
    setExpiresAt('');
    setDescription('');
    setFile(null);
    setUploadError(null);
    setUploadProgress(0);
  };

  const loadEmployees = async () => {
    setLoadingEmp(true);
    try {
      const data = await api.get<any[]>('/employees');
      setEmployees(Array.isArray(data) ? data : []);
    } catch { setEmployees([]); }
    finally { setLoadingEmp(false); }
  };

  const canGoToDetails = !!selectedType;

  const canSubmit =
    !!employeeId &&
    !!documentName.trim() &&
    !!file &&
    (!selectedType?.needsExpiry || !!expiresAt);

  const handleSubmit = async () => {
    if (!canSubmit || !selectedType || !file) return;
    setStep('uploading');
    setUploadError(null);
    setUploadProgress(0);

    // Simule la progression (le vrai progress est opaque côté Multer/NestJS)
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 8, 85));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentName);
      formData.append('type', selectedType.id);
      formData.append('employeeId', employeeId);
      if (description)    formData.append('description', description);
      if (documentNumber) formData.append('documentNumber', documentNumber);
      if (issuingBody)    formData.append('issuingBody', issuingBody);
      if (issuedAt)       formData.append('issuedAt', issuedAt);
      if (expiresAt)      formData.append('expiresAt', expiresAt);

      await api.postFormData('/documents/upload', formData);

      clearInterval(interval);
      setUploadProgress(100);
      setStep('success');
      setTimeout(() => { onSuccess(); }, 2000);
    } catch (err: any) {
      clearInterval(interval);
      setUploadError(err?.message ?? 'Erreur lors de l\'upload');
      setStep('details');
    }
  };

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
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1,    opacity: 1, y: 0 }}
          exit={{ scale: 0.96,    opacity: 0, y: 8 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <FileText size={18} className="text-sky-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-base">
                  {step === 'success' ? 'Document enregistré !' : 'Ajouter un document'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 'type'      && 'Étape 1 — Choisissez le type'}
                  {step === 'details'   && `Étape 2 — Informations du document`}
                  {step === 'uploading' && 'Enregistrement en cours...'}
                  {step === 'success'   && 'En attente de validation RH'}
                </p>
              </div>
            </div>
            {step !== 'uploading' && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                <X size={18} />
              </button>
            )}
          </div>

          {/* Corps */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Étape 1 : Choix du type ─────────────────────────────────── */}
            {step === 'type' && (
              <div className="p-6 space-y-5">
                {GROUPS.map(group => {
                  const items = DOCUMENT_TYPES.filter(t => t.group === group);
                  return (
                    <div key={group}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map(type => (
                          <button
                            key={type.id}
                            onClick={() => setSelectedType(type as any)}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.01]
                              ${selectedType?.id === type.id
                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                                : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                              }`}
                          >
                            <span className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg flex-shrink-0 ${type.color}`}>
                              {type.icon}
                            </span>
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{type.label}</p>
                              {type.needsExpiry && (
                                <p className="text-xs text-amber-500 mt-0.5 flex items-center gap-1">
                                  <Calendar size={10} /> Expiration requise
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Étape 2 : Formulaire ────────────────────────────────────── */}
            {step === 'details' && selectedType && (
              <div className="p-6 space-y-5">

                {/* Type sélectionné (rappel) */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${selectedType.color}`}>
                  <span className="text-2xl">{selectedType.icon}</span>
                  <div>
                    <p className="font-bold text-sm">{selectedType.label}</p>
                    <button onClick={() => setStep('type')} className="text-xs underline opacity-70 hover:opacity-100">
                      Changer
                    </button>
                  </div>
                </div>

                {/* Employé */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <User size={13} className="inline mr-1.5" />Employé concerné <span className="text-red-500">*</span>
                  </label>
                  {loadingEmp ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" /> Chargement...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                        disabled={!!preselectedEmployeeId}
                      >
                        <option value="">— Sélectionner un employé —</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.firstName} {e.lastName}{e.position ? ` · ${e.position}` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  )}
                </div>

                {/* Nom du document */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <FileText size={13} className="inline mr-1.5" />Nom du document <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={documentName}
                    onChange={e => setDocumentName(e.target.value)}
                    placeholder={`Ex: ${selectedType.label} de Jean Dupont`}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder-gray-300"
                  />
                </div>

                {/* Numéro & Organisme sur 2 colonnes */}
                {(selectedType.needsNumber || true) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        <Hash size={13} className="inline mr-1.5" />Numéro du document
                      </label>
                      <input
                        value={documentNumber}
                        onChange={e => setDocumentNumber(e.target.value)}
                        placeholder="N° CNI, diplôme..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        <Building2 size={13} className="inline mr-1.5" />Organisme émetteur
                      </label>
                      <input
                        value={issuingBody}
                        onChange={e => setIssuingBody(e.target.value)}
                        placeholder="Ministère, école..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder-gray-300"
                      />
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Calendar size={13} className="inline mr-1.5" />Date d'émission
                    </label>
                    <input
                      type="date"
                      value={issuedAt}
                      onChange={e => setIssuedAt(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      <Calendar size={13} className="inline mr-1.5" />
                      Date d'expiration
                      {selectedType.needsExpiry && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400
                        ${selectedType.needsExpiry && !expiresAt ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-600'}`}
                    />
                    {selectedType.needsExpiry && !expiresAt && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={11} /> Obligatoire pour ce type
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Précisions supplémentaires..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 placeholder-gray-300 resize-none"
                  />
                </div>

                {/* Fichier */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    <File size={13} className="inline mr-1.5" />Fichier <span className="text-red-500">*</span>
                  </label>
                  <DropZone
                    file={file}
                    onFile={setFile}
                    onRemove={() => setFile(null)}
                    error={uploadError}
                  />
                </div>

                {/* Erreur globale */}
                {uploadError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* ── Uploading ───────────────────────────────────────────────── */}
            {step === 'uploading' && (
              <div className="py-16 text-center px-6">
                <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Loader2 size={30} className="text-sky-500 animate-spin" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Enregistrement en cours...</h3>
                <p className="text-sm text-gray-400 mb-6">Veuillez patienter</p>
                <div className="max-w-xs mx-auto">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Progression</span>
                    <span className="font-bold text-sky-600">{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Succès ──────────────────────────────────────────────────── */}
            {step === 'success' && (
              <div className="py-16 text-center px-6">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Document enregistré !</h3>
                <p className="text-gray-400 text-sm">
                  Le document est maintenant en attente de validation par un RH.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === 'type' || step === 'details') && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <button
                onClick={step === 'type' ? onClose : () => setStep('type')}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {step === 'type' ? 'Annuler' : '← Retour'}
              </button>

              {step === 'type' && (
                <button
                  onClick={() => setStep('details')}
                  disabled={!canGoToDetails}
                  className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
                >
                  Continuer →
                </button>
              )}

              {step === 'details' && (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Enregistrer
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}