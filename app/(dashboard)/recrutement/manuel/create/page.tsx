'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Send, ArrowLeft, CheckCircle2, Copy, Check,
  Globe, MapPin, Building2, Loader2, FileText, Upload, X, Image as ImageIcon,
  Calendar, DollarSign, Eye, Share2, Zap
} from 'lucide-react';
import { api } from '@/services/api';
import { Department } from '@/types/recruitment';
import Image from 'next/image';

interface CreatedJob {
  id: string;
  title: string;
}

export default function CreateManualJobPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'XAF',
    expirationDate: '',
    showOnPortal: true,
    isPremium: false, // ✨ NOUVEAU
    additionalDocumentType: '' as '' | 'CNI' | 'BULLETIN' | 'LETTRE_MOTIVATION' | 'BREF' | 'CASIER' | 'AUTRE',
    additionalDocumentLabel: '',
  });

  useEffect(() => {
    api.get<Department[]>('/departments').then(setDepartments).catch(console.error);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image trop volumineuse (max 2MB)');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format non supporté (JPG, PNG, WEBP uniquement)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType);
      formDataToSend.append('processingMode', 'MANUAL');
      formDataToSend.append('status', 'PUBLISHED');
      formDataToSend.append('showOnPortal', formData.showOnPortal.toString());
      formDataToSend.append('isPremium', formData.isPremium.toString()); // ✨ AJOUT
      
      if (formData.additionalDocumentType) {
        formDataToSend.append('additionalDocumentType', formData.additionalDocumentType);
        formDataToSend.append('additionalDocumentLabel', formData.additionalDocumentLabel || formData.additionalDocumentType);
      }
      
      if (formData.salaryMin) formDataToSend.append('salaryMin', formData.salaryMin);
      if (formData.salaryMax) formDataToSend.append('salaryMax', formData.salaryMax);
      formDataToSend.append('salaryCurrency', formData.salaryCurrency);
      
      // ✅ Date en ISO 8601
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // ✅ CORRECTION : Utiliser api.postFormData
      const jobResponse = await api.postFormData<CreatedJob>('/recruitment/jobs', formDataToSend);
      setCreatedJob(jobResponse);
    } catch (error) {
      const err = error as Error;
      alert(`Erreur: ${err.message || 'Impossible de créer l\'offre'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdJob) return;
    const url = `${window.location.origin}/jobs/${createdJob.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 px-4 relative">
      
      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {createdJob && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }}
              className="glass-panel rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

              <div className="text-center mb-8 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold text-[var(--text)] mb-2">Offre Publiée !</h2>
                <p className="text-[var(--text-muted)]">Votre offre est en ligne et visible par les candidats.</p>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 mb-8 relative z-10">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Lien public de candidature</p>
                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <Globe className="text-emerald-500 shrink-0" size={18} />
                  <p className="text-emerald-400 font-mono text-sm truncate flex-1">
                    {`${window.location.origin}/jobs/${createdJob.id}`}
                  </p>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-[var(--text)] rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isCopied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                  {isCopied ? 'Lien Copié !' : 'Copier le lien'}
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => router.push('/recrutement/manuel/candidats')} 
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Voir les Candidatures
                </button>
                <button 
                  onClick={() => router.push('/recrutement')} 
                  className="px-4 py-4 bg-white/10 hover:bg-white/20 text-[var(--text)] rounded-xl font-bold"
                >
                  <Eye size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="text-emerald-500" size={28}/>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-[var(--text)]">Créer une Offre Manuelle</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Recrutement traditionnel avec examen manuel des CV</p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 md:p-12 space-y-8 shadow-2xl">
        
        {/* IMAGE UPLOAD */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
            <ImageIcon size={16}/> Image de l'offre (Optionnel)
          </label>
          
          {imagePreview ? (
            <div className="relative group">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={400}
                height={200}
                className="w-full h-48 object-cover rounded-xl border border-white/10"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label className="block w-full h-48 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] hover:text-emerald-400 transition-colors">
                <Upload size={40} className="mb-3" />
                <p className="font-medium">Cliquez pour uploader une image</p>
                <p className="text-xs mt-1">JPG, PNG, WEBP (max 2MB)</p>
              </div>
            </label>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-muted)]">Intitulé du Poste *</label>
            <input 
              type="text" 
              required 
              placeholder="ex: Chef de Projet Marketing" 
              className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-5 py-4 outline-none text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2"><Building2 size={16}/> Département *</label>
              <select 
                required
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.departmentId} 
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Choisir...</option>
                {departments.map(d => <option key={d.id} value={d.id} className="bg-[var(--surface)]">{d.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2"><MapPin size={16}/> Lieu</label>
              <input 
                type="text" 
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)]">Type de Contrat</label>
              <select 
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.contractType} 
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
              >
                <option value="CDI" className="bg-[var(--surface)]">CDI</option>
                <option value="CDD" className="bg-[var(--surface)]">CDD</option>
                <option value="STAGE" className="bg-[var(--surface)]">Stage</option>
              </select>
            </div>
          </div>

          {/* SALARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
                <DollarSign size={16}/> Salaire Min
              </label>
              <input 
                type="number" 
                placeholder="Ex: 500000"
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.salaryMin} 
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
                <DollarSign size={16}/> Salaire Max
              </label>
              <input 
                type="number" 
                placeholder="Ex: 800000"
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.salaryMax} 
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)]">Devise</label>
              <select 
                className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
                value={formData.salaryCurrency} 
                onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
              >
                <option value="XAF" className="bg-[var(--surface)]">XAF</option>
                <option value="EUR" className="bg-[var(--surface)]">EUR</option>
                <option value="USD" className="bg-[var(--surface)]">USD</option>
              </select>
            </div>
          </div>

          {/* EXPIRATION */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-muted)] flex items-center gap-2">
              <Calendar size={16}/> Date d'expiration (Optionnel)
            </label>
            <input 
              type="date" 
              className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-[var(--text)]" 
              value={formData.expirationDate} 
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-muted)]">Description du Poste *</label>
            <textarea 
              required
              className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-5 py-4 min-h-[120px] outline-none text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 resize-none" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Décrivez les missions et responsabilités..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text-muted)]">Compétences et Qualifications</label>
            <textarea 
              className="w-full bg-[var(--bg)]/40 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] outline-none text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 resize-none" 
              value={formData.requirements} 
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
              placeholder="Expérience, diplômes, compétences techniques..."
            />
          </div>

          {/* PORTAL TOGGLE */}
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="text-emerald-400" size={20} />
              <div>
                <p className="font-bold text-emerald-400 text-sm">Publier sur le Portail</p>
                <p className="text-xs text-[var(--text-muted)]">Visible par tous les visiteurs</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.showOnPortal}
                onChange={(e) => setFormData({ ...formData, showOnPortal: e.target.checked })}
              />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* ✨ BOUTON BOOSTER */}
          <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Zap className="text-amber-400" size={20} />
              <div>
                <p className="font-bold text-amber-400 text-sm">Booster l'Offre (Premium)</p>
                <p className="text-xs text-[var(--text-muted)]">Met l'offre en tête du portail (30 jours)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.isPremium}
                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
              />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FileText size={24} className="text-emerald-400 mt-1 shrink-0"/>
              <div>
                <h4 className="text-sm font-bold text-emerald-400 mb-2">Mode Manuel Activé</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Les candidatures seront reçues dans votre espace et vous pourrez examiner chaque CV manuellement. 
                  Vous gérerez le processus de sélection étape par étape.
                </p>
              </div>
            </div>
          </div>

          {/* 📄 DOCUMENT SUPPLÉMENTAIRE */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-amber-400 shrink-0"/>
              <div>
                <p className="font-bold text-amber-300 text-sm">Document supplémentaire (Optionnel)</p>
                <p className="text-xs text-[var(--text-muted)]">En plus du CV, exiger un autre document au candidat lors de sa candidature</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {([
                { value: '' as const, label: 'Aucun' },
                { value: 'CNI' as const, label: "Pièce d'identité (CNI)" },
                { value: 'BULLETIN' as const, label: 'Bulletin de salaire' },
                { value: 'LETTRE_MOTIVATION' as const, label: 'Lettre de motivation' },
                { value: 'BREF' as const, label: 'BREF / Diplôme' },
                { value: 'CASIER' as const, label: 'Casier judiciaire' },
                { value: 'AUTRE' as const, label: 'Autre document' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, additionalDocumentType: opt.value, additionalDocumentLabel: '' })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.additionalDocumentType === opt.value
                      ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                      : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:border-amber-500/40 hover:text-amber-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {formData.additionalDocumentType === 'AUTRE' && (
              <input
                type="text"
                placeholder="Ex : Lettre de référence, Casier judiciaire..."
                value={formData.additionalDocumentLabel}
                onChange={e => setFormData({ ...formData, additionalDocumentLabel: e.target.value })}
                className="w-full bg-black/30 border border-amber-500/30 rounded-xl px-4 py-3 text-[var(--text)] text-sm placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-amber-500/40 outline-none"
              />
            )}
            {formData.additionalDocumentType && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <FileText size={14} className="text-amber-400 shrink-0"/>
                <p className="text-xs text-amber-300">
                  Les candidats devront fournir : <strong>{formData.additionalDocumentLabel || formData.additionalDocumentType}</strong> en plus de leur CV
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin"/> : <><Send size={18}/> Publier l'Offre</>}
        </button>
      </form>
    </div>
  );
}