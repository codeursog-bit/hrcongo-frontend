'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, MapPin, Clock, Briefcase, CheckCircle2, 
  ArrowRight, Upload, Loader2, Send, Hexagon,
  Globe, DollarSign, Sparkles, User, Mail, Phone, FileText, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function JobApplyClient({ id }: { id: string }) {
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/public/jobs/${id}`);
        if (!res.ok) throw new Error('Offre introuvable');
        const data = await res.json();
        setJob(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      alert("Veuillez uploader votre CV");
      return;
    }

    setIsApplying(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('coverLetter', formData.coverLetter);
      formDataToSend.append('resume', resumeFile);

      const res = await fetch(`${API_URL}/public/jobs/${id}/apply`, {
        method: 'POST',
        body: formDataToSend
      });
      
      if (res.ok) {
        setShowSuccess(true);
      } else {
        alert("Erreur lors de l'envoi.");
      }
    } catch (e) {
      alert("Erreur technique.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 5MB)");
        return;
      }
      setResumeFile(file);
    }
  };

  if (isLoading) return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
        </div>
      </div>
    );
  
    if (!job) return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Offre introuvable</h1>
        <p className="text-slate-400 mb-8">Ce poste a peut-être été pourvu ou n'existe plus.</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  
    return (
      <div className="min-h-screen bg-[#020617] font-sans text-slate-200 relative overflow-x-hidden">
        
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px]"></div>
        </div>
  
        <nav className="fixed top-0 w-full z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Hexagon size={24} fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-white">HRCongo</span>
            </Link>
            <Link href="/" className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-bold transition-colors">
              Autres Offres
            </Link>
          </div>
        </nav>
  
        <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 space-y-10"
              >
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-cyan-400 text-xs font-bold uppercase">
                    <Sparkles size={12} />
                    {job.department?.name || 'Recrutement'}
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1]">
                    {job.title}
                  </h1>
  
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5">
                      <MapPin size={16} className="text-purple-400"/> {job.location}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5">
                      <Briefcase size={16} className="text-emerald-400"/> {job.type}
                    </div>
                  </div>
                </div>
  
                <div className="prose prose-invert prose-lg max-w-none text-slate-300">
                  <h3 className="text-white font-bold text-2xl mb-4">À propos du rôle</h3>
                  <div className="whitespace-pre-line mb-8">{job.description}</div>
  
                  <h3 className="text-white font-bold text-2xl mb-4">Ce que nous recherchons</h3>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 whitespace-pre-line">
                    {job.requirements || "Aucun pré-requis spécifique."}
                  </div>
                </div>
              </motion.div>
  
              <div className="lg:col-span-5">
                <div className="sticky top-28">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
  
                    <AnimatePresence mode="wait">
                      {showSuccess ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }} 
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-center py-10 flex flex-col items-center"
                        >
                          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <CheckCircle2 size={48} className="text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-2">Candidature reçue !</h3>
                          <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                            Merci {formData.firstName}. Notre équipe RH étudiera votre profil.
                          </p>
                          <Link href="/" className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10">
                            Retour aux offres
                          </Link>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                          <div>
                            <h3 className="text-2xl font-bold text-white">Postuler</h3>
                            <p className="text-slate-400 text-sm mt-1">Remplissez le formulaire ci-dessous.</p>
                          </div>
  
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Prénom</label>
                              <input 
                                required 
                                name="firstName"
                                value={formData.firstName} 
                                onChange={handleInputChange} 
                                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 outline-none"
                                placeholder="Jean"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nom</label>
                              <input 
                                required 
                                name="lastName"
                                value={formData.lastName} 
                                onChange={handleInputChange} 
                                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 outline-none"
                                placeholder="Dupont"
                              />
                            </div>
                          </div>
  
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                            <input 
                              required 
                              type="email" 
                              name="email"
                              value={formData.email} 
                              onChange={handleInputChange} 
                              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 outline-none"
                              placeholder="jean.dupont@email.com"
                            />
                          </div>
  
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Téléphone</label>
                            <input 
                              required 
                              type="tel" 
                              name="phone"
                              value={formData.phone} 
                              onChange={handleInputChange} 
                              className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 outline-none"
                              placeholder="+242 06..."
                            />
                          </div>
  
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">CV (PDF, Max 5MB)</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                className="hidden" 
                                id="resume-upload"
                                required
                              />
                              <label 
                                htmlFor="resume-upload"
                                className="block border border-dashed border-white/20 bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
                              >
                                {resumeFile ? (
                                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                                    <Check size={20} />
                                    <span className="text-sm font-medium">{resumeFile.name}</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload size={24} className="mx-auto text-slate-400 group-hover:text-cyan-400 mb-2" />
                                    <p className="text-xs text-slate-400 group-hover:text-slate-200">Cliquez pour importer</p>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>
  
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Motivation (Optionnel)</label>
                            <textarea 
                              name="coverLetter"
                              value={formData.coverLetter} 
                              onChange={handleInputChange} 
                              className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-cyan-500/50 outline-none h-28 resize-none text-sm"
                              placeholder="Pourquoi êtes-vous le candidat idéal..."
                            />
                          </div>
  
                          <button 
                            type="submit" 
                            disabled={isApplying} 
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg shadow-lg hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 mt-2"
                          >
                            {isApplying ? <Loader2 className="animate-spin" /> : <>Envoyer ma candidature <Send size={20} /></>}
                          </button>
                          
                          <p className="text-[10px] text-center text-slate-500 mt-4">
                            En cliquant, vous acceptez que HRCongo traite vos données.
                          </p>
                        </form>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>
  
            </div>
          </div>
        </main>
  
      </div>
    );
  }