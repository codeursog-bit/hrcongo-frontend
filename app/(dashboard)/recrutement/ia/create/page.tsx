'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sparkles, Plus, Trash2, GripVertical, BrainCircuit, Send, X,
  MapPin, Building2, Loader2, ArrowLeft, CheckCircle2, Copy, Check,
  Globe, Target, GraduationCap, Zap, Upload, ImageIcon, Calendar, DollarSign, Eye, Clock, FileText
} from 'lucide-react';
import { api } from '@/services/api';
import { EducationLevel, QuizQuestion, Department } from '@/types/recruitment';
import Image from 'next/image';

interface CreatedJob {
  id: string;
  title: string;
}

export default function CreateIAJobPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useAIQuestions, setUseAIQuestions] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    requiredSkills: [] as string[],
    minExperience: 2,
    educationLevel: EducationLevel.BAC_PLUS_3,
    testDurationMinutes: 10,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'XAF',
    expirationDate: '',
    showOnPortal: false,
    quiz: [] as QuizQuestion[],
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

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!formData.requiredSkills.includes(newSkill.trim())) {
        setFormData(prev => ({ ...prev, requiredSkills: [...prev.requiredSkills, newSkill.trim()] }));
      }
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) }));
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addQuestion = () => {
    if (formData.quiz.length >= 10) return;
    const newQ: QuizQuestion = { 
      id: generateId(), 
      text: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0, 
      points: 6 
    };
    setFormData(prev => ({ ...prev, quiz: [...prev.quiz, newQ] }));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setFormData(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData(prev => ({ ...prev, quiz: prev.quiz.filter(q => q.id !== id) }));
  };

  const handleReorder = (newOrder: QuizQuestion[]) => {
    setFormData(prev => ({ ...prev, quiz: newOrder }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification selon le mode choisi
    if (!useAIQuestions && formData.quiz.length === 0) {
      alert("Ajoutez au moins une question ou activez la génération IA");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ FormData avec le format exact attendu par le DTO
      const formDataToSend = new FormData();
      
      // Champs basiques
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType); // ✅ Garde contractType
      formDataToSend.append('processingMode', 'AI_ASSISTED');
      formDataToSend.append('status', 'PUBLISHED');
      formDataToSend.append('showOnPortal', formData.showOnPortal.toString());
      formDataToSend.append('isPremium', formData.isPremium.toString()); // ✨ AJOUT
      if (formData.additionalDocumentType) {
        formDataToSend.append('additionalDocumentType', formData.additionalDocumentType);
        formDataToSend.append('additionalDocumentLabel', formData.additionalDocumentLabel || formData.additionalDocumentType);
      }
      
      // ✅ requiredSkills en JSON string (sera transformé par le DTO)
      formDataToSend.append('requiredSkills', JSON.stringify(formData.requiredSkills));
      
      formDataToSend.append('minExperience', formData.minExperience.toString());
      formDataToSend.append('educationLevel', formData.educationLevel);
      
      // Salaire (en string, sera transformé par le DTO)
      if (formData.salaryMin) formDataToSend.append('salaryMin', formData.salaryMin);
      if (formData.salaryMax) formDataToSend.append('salaryMax', formData.salaryMax);
      formDataToSend.append('salaryCurrency', formData.salaryCurrency);
      
      // ✅ Date en ISO 8601
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      // aiConfig en JSON
      const aiConfig = {
        minScoreRetenu: 75,
        minScoreMoyenne: 55,
        minScoreSeconde: 40,
        testDurationMinutes: formData.testDurationMinutes,
        testQuestionCount: useAIQuestions ? 10 : formData.quiz.length
      };
      formDataToSend.append('aiConfig', JSON.stringify(aiConfig));
      
      // Image (optionnelle)
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // ✅ UTILISATION DE api.postFormData
      const jobResponse = await api.postFormData<CreatedJob>('/recruitment/jobs', formDataToSend);
      
      // Si mode manuel, créer les questions
      if (!useAIQuestions && formData.quiz.length > 0) {
        for (let i = 0; i < formData.quiz.length; i++) {
          const q = formData.quiz[i];
          await api.post(`/recruitment/jobs/${jobResponse.id}/questions`, {
            question: q.text,
            questionType: 'MULTIPLE_CHOICE',
            points: q.points,
            order: i,
            options: q.options,
            correctAnswers: [q.options[q.correctAnswer]]
          });
        }
      }
      // Si mode IA, déclencher la génération auto
      else if (useAIQuestions) {
        await api.post(`/recruitment/jobs/${jobResponse.id}/generate-test-questions`, {});
      }

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
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-5xl mx-auto pb-20 pt-8 px-4 relative z-10">
        
        {/* SUCCESS MODAL */}
        <AnimatePresence>
          {createdJob && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }}
                className="bg-[var(--surface)] border border-emerald-500/30 rounded-2xl p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>

                <div className="text-center mb-8 relative z-10">
                  <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/50">
                    <BrainCircuit size={48} className="text-[var(--text)]" />
                  </div>
                  <h2 className="text-4xl font-black text-[var(--text)] mb-3 tracking-tight">Offre IA Activée !</h2>
                  <p className="text-[var(--text-muted)]">Le recrutement intelligent est opérationnel.</p>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl border border-emerald-500/30 mb-8 relative z-10">
                  <p className="text-xs font-bold text-emerald-400 uppercase mb-3 tracking-wider">Lien Public IA</p>
                  <div className="flex items-center gap-3 bg-[var(--bg)]/60 p-4 rounded-xl border border-white/5">
                    <Globe className="text-emerald-400 shrink-0" size={20} />
                    <p className="text-emerald-300 font-mono text-sm truncate flex-1">
                      {`${window.location.origin}/jobs/${createdJob.id}`}
                    </p>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isCopied ? <Check size={16}/> : <Copy size={16}/>}
                    {isCopied ? 'Lien Copié !' : 'Copier le Lien'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push('/recrutement/ia/candidats')} 
                    className="flex-1 py-4 bg-[#FAFAFA] hover:bg-white text-black font-bold rounded-xl shadow-xl transition-all"
                  >
                    Voir les Candidats IA
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
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => router.back()} 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors backdrop-blur-sm"
          >
            <ArrowLeft size={20} className="text-[var(--text)]" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="text-emerald-400" size={32}/>
              <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">Créer une Offre IA</h1>
            </div>
            <p className="text-[var(--text-muted)]">Recrutement intelligent avec sélection automatique</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* IMAGE UPLOAD */}
          <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
              <ImageIcon className="text-emerald-400"/>
              Image de l'offre (Optionnel)
            </h3>
            
            {imagePreview ? (
              <div className="relative group">
                <Image 
                  src={imagePreview} 
                  alt="Preview" 
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-2xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                  }}
                  className="absolute top-4 right-4 p-3 bg-red-500/80 hover:bg-red-600 rounded-xl text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="block w-full h-64 border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-2xl cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] hover:text-emerald-400 transition-colors">
                  <Upload size={48} className="mb-4" />
                  <p className="font-bold text-lg">Cliquez pour uploader une image</p>
                  <p className="text-sm mt-2">JPG, PNG, WEBP (max 2MB)</p>
                </div>
              </label>
            )}
          </div>

          {/* CARD: Info de base */}
          <div className="bg-[var(--surface)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
              <Zap className="text-amber-400"/>
              Informations Générales
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Intitulé du Poste *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="ex: Développeur Full-Stack Senior" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                    <Building2 size={16}/> Département *
                  </label>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                    value={formData.departmentId} 
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="" className="bg-[var(--surface)]">Choisir...</option>
                    {departments.map(d => <option key={d.id} value={d.id} className="bg-[var(--surface)]">{d.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                    <MapPin size={16}/> Lieu
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Contrat</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
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
                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                    <DollarSign size={16}/> Salaire Min
                  </label>
                  <input 
                    type="number" 
                    placeholder="Ex: 500000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                    value={formData.salaryMin} 
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                    <DollarSign size={16}/> Salaire Max
                  </label>
                  <input 
                    type="number" 
                    placeholder="Ex: 800000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                    value={formData.salaryMax} 
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Devise</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
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
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                  <Calendar size={16}/> Date d'expiration (Optionnel)
                </label>
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                  value={formData.expirationDate} 
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} 
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Description *</label>
                <textarea 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[140px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Décrivez le poste et les missions..."
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-[var(--text-muted)] mb-2 block">Prérequis</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none" 
                  value={formData.requirements} 
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
                  placeholder="Compétences et qualifications requises..."
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

              {/* ⏱ DURÉE DU TEST */}
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="text-emerald-400 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-emerald-300 text-sm">Durée du test (minutes)</p>
                    <p className="text-xs text-[var(--text-muted)]">Temps accordé aux candidats pour répondre</p>
                  </div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={formData.testDurationMinutes}
                  onChange={e => setFormData({ ...formData, testDurationMinutes: Math.max(1, parseInt(e.target.value) || 10) })}
                  className="w-20 text-center bg-black/40 border border-emerald-500/40 rounded-xl px-3 py-2 text-[var(--text)] font-bold text-lg focus:ring-2 focus:ring-emerald-500/50 outline-none"
                />
              </div>

              {/* 📄 DOCUMENT SUPPLÉMENTAIRE */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <FileText className="text-amber-400 shrink-0" size={20} />
                  <div>
                    <p className="font-bold text-amber-300 text-sm">Document supplémentaire (Optionnel)</p>
                    <p className="text-xs text-[var(--text-muted)]">En plus du CV, exiger un autre document au candidat</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {([
                    { value: '', label: 'Aucun' },
                    { value: 'CNI', label: "Pièce d'identité (CNI)" },
                    { value: 'BULLETIN', label: 'Bulletin de salaire' },
                    { value: 'LETTRE_MOTIVATION', label: 'Lettre de motivation' },
                    { value: 'BREF', label: 'BREF / Diplôme' },
                    { value: 'CASIER', label: 'Casier judiciaire' },
                    { value: 'AUTRE', label: 'Autre document' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, additionalDocumentType: opt.value, additionalDocumentLabel: '' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.additionalDocumentType === opt.value
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                          : 'bg-white/5 border-white/10 text-[var(--text-muted)] hover:border-amber-500/40'
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
              </div>
            </div>
          </div>

          {/* CARD: Critères IA */}
          <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text)] mb-6 flex items-center gap-3">
              <Sparkles className="text-emerald-400"/>
              Critères de Sélection IA
            </h3>

            <div className="space-y-6">
              {/* Skills */}
              <div>
                <label className="text-sm font-bold text-emerald-300 mb-3 block">Compétences Clés (pour analyse CV)</label>
                <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-4 flex flex-wrap gap-2 min-h-[60px]">
                  <AnimatePresence>
                    {formData.requiredSkills.map(skill => (
                      <motion.span 
                        key={skill}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-emerald-500/30 transition-colors"
                      >
                        {skill}
                        <X size={14} className="cursor-pointer hover:text-[var(--text)]" onClick={() => removeSkill(skill)} />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input 
                    type="text"
                    className="bg-transparent border-none outline-none text-sm p-2 text-[var(--text)] flex-1 min-w-[150px] placeholder:text-[var(--text-muted)]"
                    placeholder="Tapez + Entrée..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                  />
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-bold text-emerald-300">Expérience Minimale</label>
                    <span className="text-emerald-400 font-bold text-lg">{formData.minExperience} ans</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    step="1"
                    className="w-full h-3 bg-[var(--surface-2)] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    value={formData.minExperience}
                    onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-emerald-300 mb-3 block flex items-center gap-2">
                    <GraduationCap size={16}/> Niveau d'Études
                  </label>
                  <select 
                    className="w-full bg-black/30 border border-emerald-500/20 rounded-xl px-4 py-3 text-[var(--text)] focus:ring-2 focus:ring-emerald-500/50 outline-none" 
                    value={formData.educationLevel} 
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as EducationLevel })}
                  >
                    {Object.values(EducationLevel).map(lvl => <option key={lvl} value={lvl} className="bg-[var(--surface)]">{lvl}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CARD: MODE QUESTIONS */}
          <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-3">
                <Target className="text-emerald-400"/>
                Questions d'Évaluation
              </h3>
              
              {/* TOGGLE IA/MANUEL */}
              <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-emerald-500/20">
                <span className="text-sm font-bold text-emerald-300">Génération IA</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={useAIQuestions}
                    onChange={(e) => setUseAIQuestions(e.target.checked)}
                  />
                  <div className="w-14 h-7 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {useAIQuestions ? (
              <div className="bg-black/30 border border-emerald-500/20 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/50">
                  <Sparkles size={36} className="text-[var(--text)]" />
                </div>
                <h4 className="text-xl font-bold text-[var(--text)] mb-3">Génération Automatique Activée</h4>
                <p className="text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                  L'IA générera automatiquement <span className="text-emerald-400 font-bold">10 questions pertinentes</span> basées sur les compétences requises et la description du poste.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-emerald-300">
                  <BrainCircuit size={16} />
                  <span>Powered by Mistral AI</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-[var(--text-muted)]">Créez manuellement vos questions ({formData.quiz.length}/10)</p>
                  <button 
                    type="button" 
                    onClick={addQuestion} 
                    disabled={formData.quiz.length >= 10}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>

                <Reorder.Group axis="y" values={formData.quiz} onReorder={handleReorder} className="space-y-5">
                  {formData.quiz.map((q, idx) => (
                    <Reorder.Item 
                      key={q.id} 
                      value={q} 
                      className="bg-black/30 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-emerald-400 transition-colors">
                          <GripVertical size={24}/>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-emerald-400/70 uppercase tracking-widest">Question {idx + 1}</span>
                            <button 
                              type="button" 
                              onClick={() => removeQuestion(q.id)} 
                              className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <input 
                            type="text" 
                            placeholder="Entrez la question..." 
                            className="w-full bg-transparent border-b border-emerald-500/20 py-3 text-[var(--text)] outline-none focus:border-emerald-500/50 transition-colors placeholder:text-[var(--text-muted)]"
                            value={q.text} 
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex gap-3 items-center">
                                <button 
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { correctAnswer: optIdx })}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${q.correctAnswer === optIdx ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-110' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)]'}`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>
                                <input 
                                  type="text" 
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className="flex-1 bg-[var(--bg)]/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-[var(--text)] outline-none focus:border-emerald-500/30 transition-colors placeholder:text-[var(--text-muted)]"
                                  value={opt} 
                                  onChange={(e) => {
                                    const nextOpts = [...q.options];
                                    nextOpts[optIdx] = e.target.value;
                                    updateQuestion(q.id, { options: nextOpts });
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-4 pt-2">
                            <span className="text-xs text-[var(--text-muted)]">Points :</span>
                            <input 
                              type="number" 
                              min="1" 
                              max="10"
                              className="w-20 bg-[var(--bg)]/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-[var(--text)] text-center"
                              value={q.points}
                              onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {formData.quiz.length === 0 && (
                  <div className="py-16 border-2 border-dashed border-emerald-500/20 rounded-2xl text-center">
                    <Target size={48} className="mx-auto text-emerald-500/30 mb-4"/>
                    <p className="text-[var(--text-muted)] italic">Aucune question. Ajoutez-en pour activer le test manuel.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* SUBMIT */}
          <button 
            type="submit" 
            disabled={isSubmitting || (!useAIQuestions && formData.quiz.length === 0)} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-emerald-500/20 text-lg"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={24}/>
            ) : (
              <>
                <BrainCircuit size={24}/>
                Activer le Recrutement IA
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}