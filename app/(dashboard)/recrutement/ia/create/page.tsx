'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sparkles, Plus, Trash2, GripVertical, BrainCircuit, Send, X,
  MapPin, Building2, Loader2, ArrowLeft, CheckCircle2, Copy, Check,
  Globe, Target, GraduationCap, Zap, Upload, ImageIcon, Calendar, DollarSign, Eye
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
    testDurationMinutes: 30,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'XAF',
    expirationDate: '',
    showOnPortal: true,
    quiz: [] as QuizQuestion[],
    isPremium: false // ✨ NOUVEAU
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
      alert("⚠️ Ajoutez au moins une question ou activez la génération IA");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
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
                className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-3xl p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>

                <div className="text-center mb-8 relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
                    <BrainCircuit size={48} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Offre IA Activée !</h2>
                  <p className="text-slate-400">Le recrutement intelligent est opérationnel.</p>
                </div>

                <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/30 mb-8 relative z-10">
                  <p className="text-xs font-bold text-cyan-400 uppercase mb-3 tracking-wider">Lien Public IA</p>
                  <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    <Globe className="text-cyan-400 shrink-0" size={20} />
                    <p className="text-cyan-300 font-mono text-sm truncate flex-1">
                      {`${window.location.origin}/jobs/${createdJob.id}`}
                    </p>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isCopied ? <Check size={16}/> : <Copy size={16}/>}
                    {isCopied ? 'Lien Copié !' : 'Copier le Lien'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => router.push('/recrutement/ia/candidats')} 
                    className="flex-1 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-xl transition-all"
                  >
                    Voir les Candidats IA
                  </button>
                  <button 
                    onClick={() => router.push('/recrutement')} 
                    className="px-4 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold"
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
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="text-cyan-400" size={32}/>
              <h1 className="text-3xl font-black text-white tracking-tight">Créer une Offre IA</h1>
            </div>
            <p className="text-slate-400">Recrutement intelligent avec sélection automatique</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* IMAGE UPLOAD */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <ImageIcon className="text-purple-400"/>
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
                  className="absolute top-4 right-4 p-3 bg-red-500/80 hover:bg-red-600 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="block w-full h-64 border-2 border-dashed border-white/20 hover:border-cyan-500/50 rounded-2xl cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-cyan-400 transition-colors">
                  <Upload size={48} className="mb-4" />
                  <p className="font-bold text-lg">Cliquez pour uploader une image</p>
                  <p className="text-sm mt-2">JPG, PNG, WEBP (max 2MB)</p>
                </div>
              </label>
            )}
          </div>

          {/* CARD: Info de base */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="text-yellow-400"/>
              Informations Générales
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Intitulé du Poste *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="ex: Développeur Full-Stack Senior" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                    <Building2 size={16}/> Département *
                  </label>
                  <select 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.departmentId} 
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  >
                    <option value="" className="bg-slate-900">Choisir...</option>
                    {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                    <MapPin size={16}/> Lieu
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.location} 
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Contrat</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.contractType} 
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  >
                    <option value="CDI" className="bg-slate-900">CDI</option>
                    <option value="CDD" className="bg-slate-900">CDD</option>
                    <option value="STAGE" className="bg-slate-900">Stage</option>
                  </select>
                </div>
              </div>

              {/* SALARY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                    <DollarSign size={16}/> Salaire Min
                  </label>
                  <input 
                    type="number" 
                    placeholder="Ex: 500000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.salaryMin} 
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} 
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                    <DollarSign size={16}/> Salaire Max
                  </label>
                  <input 
                    type="number" 
                    placeholder="Ex: 800000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.salaryMax} 
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Devise</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.salaryCurrency} 
                    onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                  >
                    <option value="XAF" className="bg-slate-900">XAF</option>
                    <option value="EUR" className="bg-slate-900">EUR</option>
                    <option value="USD" className="bg-slate-900">USD</option>
                  </select>
                </div>
              </div>

              {/* EXPIRATION */}
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
                  <Calendar size={16}/> Date d'expiration (Optionnel)
                </label>
                <input 
                  type="date" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                  value={formData.expirationDate} 
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} 
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Description *</label>
                <textarea 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[140px] text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Décrivez le poste et les missions..."
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-slate-300 mb-2 block">Prérequis</label>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none" 
                  value={formData.requirements} 
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
                  placeholder="Compétences et qualifications requises..."
                />
              </div>

              {/* PORTAL TOGGLE */}
              <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Globe className="text-cyan-400" size={20} />
                  <div>
                    <p className="font-bold text-cyan-400 text-sm">Publier sur le Portail</p>
                    <p className="text-xs text-slate-400">Visible par tous les visiteurs</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.showOnPortal}
                    onChange={(e) => setFormData({ ...formData, showOnPortal: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              {/* ✨ BOUTON BOOSTER */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Zap className="text-yellow-400" size={20} />
                  <div>
                    <p className="font-bold text-yellow-400 text-sm">Booster l'Offre (Premium)</p>
                    <p className="text-xs text-slate-400">Met l'offre en tête du portail (30 jours)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-orange-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* CARD: Critères IA */}
          <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Sparkles className="text-cyan-400"/>
              Critères de Sélection IA
            </h3>

            <div className="space-y-6">
              {/* Skills */}
              <div>
                <label className="text-sm font-bold text-cyan-300 mb-3 block">Compétences Clés (pour analyse CV)</label>
                <div className="bg-black/30 border border-cyan-500/20 rounded-xl p-4 flex flex-wrap gap-2 min-h-[60px]">
                  <AnimatePresence>
                    {formData.requiredSkills.map(skill => (
                      <motion.span 
                        key={skill}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-cyan-500/30 transition-colors"
                      >
                        {skill}
                        <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
                      </motion.span>
                    ))}
                  </AnimatePresence>
                  <input 
                    type="text"
                    className="bg-transparent border-none outline-none text-sm p-2 text-white flex-1 min-w-[150px] placeholder:text-slate-600"
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
                    <label className="text-sm font-bold text-cyan-300">Expérience Minimale</label>
                    <span className="text-cyan-400 font-bold text-lg">{formData.minExperience} ans</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    step="1"
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    value={formData.minExperience}
                    onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-cyan-300 mb-3 block flex items-center gap-2">
                    <GraduationCap size={16}/> Niveau d'Études
                  </label>
                  <select 
                    className="w-full bg-black/30 border border-cyan-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
                    value={formData.educationLevel} 
                    onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as EducationLevel })}
                  >
                    {Object.values(EducationLevel).map(lvl => <option key={lvl} value={lvl} className="bg-slate-900">{lvl}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CARD: MODE QUESTIONS */}
          <div className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Target className="text-purple-400"/>
                Questions d'Évaluation
              </h3>
              
              {/* TOGGLE IA/MANUEL */}
              <div className="flex items-center gap-4 bg-black/40 px-5 py-3 rounded-xl border border-purple-500/20">
                <span className="text-sm font-bold text-purple-300">Génération IA</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={useAIQuestions}
                    onChange={(e) => setUseAIQuestions(e.target.checked)}
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                </label>
              </div>
            </div>

            {useAIQuestions ? (
              <div className="bg-black/30 border border-purple-500/20 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
                  <Sparkles size={36} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-3">Génération Automatique Activée</h4>
                <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  L'IA générera automatiquement <span className="text-purple-400 font-bold">10 questions pertinentes</span> basées sur les compétences requises et la description du poste.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-300">
                  <BrainCircuit size={16} />
                  <span>Powered by Mistral AI</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-slate-400">Créez manuellement vos questions ({formData.quiz.length}/10)</p>
                  <button 
                    type="button" 
                    onClick={addQuestion} 
                    disabled={formData.quiz.length >= 10}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>

                <Reorder.Group axis="y" values={formData.quiz} onReorder={handleReorder} className="space-y-5">
                  {formData.quiz.map((q, idx) => (
                    <Reorder.Item 
                      key={q.id} 
                      value={q} 
                      className="bg-black/30 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-purple-400 transition-colors">
                          <GripVertical size={24}/>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-purple-400/70 uppercase tracking-widest">Question {idx + 1}</span>
                            <button 
                              type="button" 
                              onClick={() => removeQuestion(q.id)} 
                              className="text-slate-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <input 
                            type="text" 
                            placeholder="Entrez la question..." 
                            className="w-full bg-transparent border-b border-purple-500/20 py-3 text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
                            value={q.text} 
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex gap-3 items-center">
                                <button 
                                  type="button"
                                  onClick={() => updateQuestion(q.id, { correctAnswer: optIdx })}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${q.correctAnswer === optIdx ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-110' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </button>
                                <input 
                                  type="text" 
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/30 transition-colors placeholder:text-slate-600"
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
                            <span className="text-xs text-slate-500">Points :</span>
                            <input 
                              type="number" 
                              min="1" 
                              max="10"
                              className="w-20 bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white text-center"
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
                  <div className="py-16 border-2 border-dashed border-purple-500/20 rounded-3xl text-center">
                    <Target size={48} className="mx-auto text-purple-500/30 mb-4"/>
                    <p className="text-slate-500 italic">Aucune question. Ajoutez-en pour activer le test manuel.</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* SUBMIT */}
          <button 
            type="submit" 
            disabled={isSubmitting || (!useAIQuestions && formData.quiz.length === 0)} 
            className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-cyan-500/20 text-lg"
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

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion, AnimatePresence, Reorder } from 'framer-motion';
// import {
//   Sparkles, Plus, Trash2, GripVertical, BrainCircuit, Send, X,
//   MapPin, Building2, Loader2, ArrowLeft, CheckCircle2, Copy, Check,
//   Globe, Target, GraduationCap, Zap
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { EducationLevel, QuizQuestion, Department } from '@/types/recruitment';

// interface CreatedJob {
//   id: string;
//   title: string;
// }

// export default function CreateIAJobPage() {
//   const router = useRouter();
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
//   const [isCopied, setIsCopied] = useState(false);
//   const [newSkill, setNewSkill] = useState('');

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     requirements: '',
//     departmentId: '',
//     location: 'Brazzaville, Siège',
//     contractType: 'CDI',
//     requiredSkills: [] as string[],
//     minExperience: 2,
//     educationLevel: EducationLevel.BAC_PLUS_3,
//     testDurationMinutes: 30,
//     quiz: [] as QuizQuestion[]
//   });

//   useEffect(() => {
//     api.get<Department[]>('/departments').then(setDepartments).catch(console.error);
//   }, []);

//   const handleAddSkill = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && newSkill.trim()) {
//       e.preventDefault();
//       if (!formData.requiredSkills.includes(newSkill.trim())) {
//         setFormData(prev => ({ ...prev, requiredSkills: [...prev.requiredSkills, newSkill.trim()] }));
//       }
//       setNewSkill('');
//     }
//   };

//   const removeSkill = (skill: string) => {
//     setFormData(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) }));
//   };

//   const generateId = () => Math.random().toString(36).substring(2, 9);

//   const addQuestion = () => {
//     if (formData.quiz.length >= 10) return;
//     const newQ: QuizQuestion = { 
//       id: generateId(), 
//       text: '', 
//       options: ['', '', '', ''], 
//       correctAnswer: 0, 
//       points: 6 
//     };
//     setFormData(prev => ({ ...prev, quiz: [...prev.quiz, newQ] }));
//   };

//   const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
//     setFormData(prev => ({
//       ...prev,
//       quiz: prev.quiz.map(q => q.id === id ? { ...q, ...updates } : q)
//     }));
//   };

//   const removeQuestion = (id: string) => {
//     setFormData(prev => ({ ...prev, quiz: prev.quiz.filter(q => q.id !== id) }));
//   };

//   const handleReorder = (newOrder: QuizQuestion[]) => {
//     setFormData(prev => ({ ...prev, quiz: newOrder }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (formData.quiz.length === 0) {
//       alert("⚠️ Ajoutez au moins une question pour le test IA");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const payload = {
//         title: formData.title,
//         description: formData.description,
//         requirements: formData.requirements,
//         departmentId: formData.departmentId,
//         location: formData.location,
//         contractType: formData.contractType,
//         processingMode: 'AI_ASSISTED',
//         requiredSkills: formData.requiredSkills,
//         minExperience: formData.minExperience,
//         educationLevel: formData.educationLevel,
//         aiConfig: {
//           minScoreRetenu: 75,
//           minScoreMoyenne: 55,
//           minScoreSeconde: 40,
//           testDurationMinutes: formData.testDurationMinutes
//         }
//       };

//       const jobResponse = await api.post<CreatedJob>('/recruitment/jobs', payload);
      
//       // Créer les questions avec les bonnes réponses
//       for (let i = 0; i < formData.quiz.length; i++) {
//         const q = formData.quiz[i];
//         await api.post(`/recruitment/jobs/${jobResponse.id}/questions`, {
//           question: q.text,
//           questionType: 'MULTIPLE_CHOICE',
//           points: q.points,
//           order: i,
//           options: q.options,
//           correctAnswers: [q.options[q.correctAnswer]]
//         });
//       }

//       setCreatedJob(jobResponse);
//     } catch (error) {
//       const err = error as Error;
//       alert(`Erreur: ${err.message || 'Impossible de créer l\'offre'}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCopyLink = () => {
//     if (!createdJob) return;
//     const url = `${window.location.origin}/jobs/ia/${createdJob.id}`;
//     navigator.clipboard.writeText(url);
//     setIsCopied(true);
//     setTimeout(() => setIsCopied(false), 2000);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      
//       {/* Animated Background */}
//       <div className="fixed inset-0 pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//       </div>

//       <div className="max-w-5xl mx-auto pb-20 pt-8 px-4 relative z-10">
        
//         {/* SUCCESS MODAL */}
//         <AnimatePresence>
//           {createdJob && (
//             <motion.div 
//               initial={{ opacity: 0 }} 
//               animate={{ opacity: 1 }}
//               className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
//             >
//               <motion.div 
//                 initial={{ scale: 0.9, y: 20 }} 
//                 animate={{ scale: 1, y: 0 }}
//                 className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-3xl p-10 max-w-lg w-full shadow-2xl relative overflow-hidden"
//               >
//                 <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
//                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -ml-20 -mb-20"></div>

//                 <div className="text-center mb-8 relative z-10">
//                   <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/50">
//                     <BrainCircuit size={48} className="text-white" />
//                   </div>
//                   <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Offre IA Activée !</h2>
//                   <p className="text-slate-400">Le recrutement intelligent est opérationnel.</p>
//                 </div>

//                 <div className="bg-black/40 p-5 rounded-2xl border border-cyan-500/30 mb-8 relative z-10">
//                   <p className="text-xs font-bold text-cyan-400 uppercase mb-3 tracking-wider">Lien Public IA</p>
//                   <div className="flex items-center gap-3 bg-slate-950/60 p-4 rounded-xl border border-white/5">
//                     <Globe className="text-cyan-400 shrink-0" size={20} />
//                     <p className="text-cyan-300 font-mono text-sm truncate flex-1">
//                       {`${window.location.origin}/jobs/ia/${createdJob.id}`}
//                     </p>
//                   </div>
//                   <button 
//                     onClick={handleCopyLink}
//                     className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg"
//                   >
//                     {isCopied ? <Check size={16}/> : <Copy size={16}/>}
//                     {isCopied ? 'Lien Copié !' : 'Copier le Lien'}
//                   </button>
//                 </div>

//                 <button 
//                   onClick={() => router.push('/recrutement/ia/candidats')} 
//                   className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-xl transition-transform hover:scale-[1.02] relative z-10"
//                 >
//                   Voir les Candidats IA
//                 </button>
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* HEADER */}
//         <div className="flex items-center gap-4 mb-10">
//           <button 
//             onClick={() => router.back()} 
//             className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors backdrop-blur-sm"
//           >
//             <ArrowLeft size={20} className="text-white" />
//           </button>
//           <div className="flex-1">
//             <div className="flex items-center gap-3 mb-2">
//               <BrainCircuit className="text-cyan-400" size={32}/>
//               <h1 className="text-3xl font-black text-white tracking-tight">Créer une Offre IA</h1>
//             </div>
//             <p className="text-slate-400">Recrutement intelligent avec sélection automatique</p>
//           </div>
//         </div>

//         {/* FORM */}
//         <form onSubmit={handleSubmit} className="space-y-8">
          
//           {/* CARD: Info de base */}
//           <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
//               <Zap className="text-yellow-400"/>
//               Informations Générales
//             </h3>
            
//             <div className="space-y-5">
//               <div>
//                 <label className="text-sm font-bold text-slate-300 mb-2 block">Intitulé du Poste *</label>
//                 <input 
//                   type="text" 
//                   required 
//                   placeholder="ex: Développeur Full-Stack Senior" 
//                   className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all" 
//                   value={formData.title} 
//                   onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
//                 />
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
//                     <Building2 size={16}/> Département *
//                   </label>
//                   <select 
//                     required
//                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
//                     value={formData.departmentId} 
//                     onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
//                   >
//                     <option value="" className="bg-slate-900">Choisir...</option>
//                     {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
//                   </select>
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-bold text-slate-300 mb-2 block flex items-center gap-2">
//                     <MapPin size={16}/> Lieu
//                   </label>
//                   <input 
//                     type="text" 
//                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
//                     value={formData.location} 
//                     onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-bold text-slate-300 mb-2 block">Contrat</label>
//                   <select 
//                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
//                     value={formData.contractType} 
//                     onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
//                   >
//                     <option value="CDI" className="bg-slate-900">CDI</option>
//                     <option value="CDD" className="bg-slate-900">CDD</option>
//                     <option value="STAGE" className="bg-slate-900">Stage</option>
//                   </select>
//                 </div>
//               </div>
              
//               <div>
//                 <label className="text-sm font-bold text-slate-300 mb-2 block">Description *</label>
//                 <textarea 
//                   required
//                   className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[140px] text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none" 
//                   value={formData.description} 
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
//                   placeholder="Décrivez le poste et les missions..."
//                 />
//               </div>
              
//               <div>
//                 <label className="text-sm font-bold text-slate-300 mb-2 block">Prérequis</label>
//                 <textarea 
//                   className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none resize-none" 
//                   value={formData.requirements} 
//                   onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
//                   placeholder="Compétences et qualifications requises..."
//                 />
//               </div>
//             </div>
//           </div>

//           {/* CARD: Critères IA */}
//           <div className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl">
//             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
//               <Sparkles className="text-cyan-400"/>
//               Critères de Sélection IA
//             </h3>

//             <div className="space-y-6">
//               {/* Skills */}
//               <div>
//                 <label className="text-sm font-bold text-cyan-300 mb-3 block">Compétences Clés (pour analyse CV)</label>
//                 <div className="bg-black/30 border border-cyan-500/20 rounded-xl p-4 flex flex-wrap gap-2 min-h-[60px]">
//                   <AnimatePresence>
//                     {formData.requiredSkills.map(skill => (
//                       <motion.span 
//                         key={skill}
//                         initial={{ scale: 0.8, opacity: 0 }}
//                         animate={{ scale: 1, opacity: 1 }}
//                         exit={{ scale: 0.8, opacity: 0 }}
//                         className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-cyan-500/30 transition-colors"
//                       >
//                         {skill}
//                         <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSkill(skill)} />
//                       </motion.span>
//                     ))}
//                   </AnimatePresence>
//                   <input 
//                     type="text"
//                     className="bg-transparent border-none outline-none text-sm p-2 text-white flex-1 min-w-[150px] placeholder:text-slate-600"
//                     placeholder="Tapez + Entrée..."
//                     value={newSkill}
//                     onChange={(e) => setNewSkill(e.target.value)}
//                     onKeyDown={handleAddSkill}
//                   />
//                 </div>
//               </div>

//               {/* Sliders */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <div className="flex justify-between mb-3">
//                     <label className="text-sm font-bold text-cyan-300">Expérience Minimale</label>
//                     <span className="text-cyan-400 font-bold text-lg">{formData.minExperience} ans</span>
//                   </div>
//                   <input 
//                     type="range" 
//                     min="0" 
//                     max="15" 
//                     step="1"
//                     className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
//                     value={formData.minExperience}
//                     onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) })}
//                   />
//                 </div>
                
//                 <div>
//                   <label className="text-sm font-bold text-cyan-300 mb-3 block flex items-center gap-2">
//                     <GraduationCap size={16}/> Niveau d'Études
//                   </label>
//                   <select 
//                     className="w-full bg-black/30 border border-cyan-500/20 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none" 
//                     value={formData.educationLevel} 
//                     onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as EducationLevel })}
//                   >
//                     {Object.values(EducationLevel).map(lvl => <option key={lvl} value={lvl} className="bg-slate-900">{lvl}</option>)}
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* CARD: Quiz Builder */}
//           <div className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold text-white flex items-center gap-3">
//                 <Target className="text-purple-400"/>
//                 Questions d'Évaluation ({formData.quiz.length}/10)
//               </h3>
//               <button 
//                 type="button" 
//                 onClick={addQuestion} 
//                 disabled={formData.quiz.length >= 10}
//                 className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
//               >
//                 <Plus size={16} /> Ajouter
//               </button>
//             </div>

//             <Reorder.Group axis="y" values={formData.quiz} onReorder={handleReorder} className="space-y-5">
//               {formData.quiz.map((q, idx) => (
//                 <Reorder.Item 
//                   key={q.id} 
//                   value={q} 
//                   className="bg-black/30 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-colors"
//                 >
//                   <div className="flex gap-4">
//                     <div className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-purple-400 transition-colors">
//                       <GripVertical size={24}/>
//                     </div>
                    
//                     <div className="flex-1 space-y-4">
//                       <div className="flex justify-between items-center">
//                         <span className="text-xs font-black text-purple-400/70 uppercase tracking-widest">Question {idx + 1}</span>
//                         <button 
//                           type="button" 
//                           onClick={() => removeQuestion(q.id)} 
//                           className="text-slate-600 hover:text-red-400 transition-colors"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
                      
//                       <input 
//                         type="text" 
//                         placeholder="Entrez la question..." 
//                         className="w-full bg-transparent border-b border-purple-500/20 py-3 text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
//                         value={q.text} 
//                         onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
//                       />
                      
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         {q.options.map((opt, optIdx) => (
//                           <div key={optIdx} className="flex gap-3 items-center">
//                             <button 
//                               type="button"
//                               onClick={() => updateQuestion(q.id, { correctAnswer: optIdx })}
//                               className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${q.correctAnswer === optIdx ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-110' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
//                             >
//                               {String.fromCharCode(65 + optIdx)}
//                             </button>
//                             <input 
//                               type="text" 
//                               placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
//                               className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/30 transition-colors placeholder:text-slate-600"
//                               value={opt} 
//                               onChange={(e) => {
//                                 const nextOpts = [...q.options];
//                                 nextOpts[optIdx] = e.target.value;
//                                 updateQuestion(q.id, { options: nextOpts });
//                               }}
//                             />
//                           </div>
//                         ))}
//                       </div>

//                       <div className="flex items-center gap-4 pt-2">
//                         <span className="text-xs text-slate-500">Points :</span>
//                         <input 
//                           type="number" 
//                           min="1" 
//                           max="10"
//                           className="w-20 bg-slate-950/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white text-center"
//                           value={q.points}
//                           onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </Reorder.Item>
//               ))}
//             </Reorder.Group>
            
//             {formData.quiz.length === 0 && (
//               <div className="py-16 border-2 border-dashed border-purple-500/20 rounded-3xl text-center">
//                 <Target size={48} className="mx-auto text-purple-500/30 mb-4"/>
//                 <p className="text-slate-500 italic">Aucune question. Ajoutez-en pour activer le test.</p>
//               </div>
//             )}
//           </div>

//           {/* SUBMIT */}
//           <button 
//             type="submit" 
//             disabled={isSubmitting || formData.quiz.length === 0} 
//             className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-cyan-500/20 text-lg"
//           >
//             {isSubmitting ? (
//               <Loader2 className="animate-spin" size={24}/>
//             ) : (
//               <>
//                 <BrainCircuit size={24}/>
//                 Activer le Recrutement IA
//               </>
//             )}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }


