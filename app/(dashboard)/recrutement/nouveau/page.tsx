
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Save, Loader2, Building2, CheckCircle2, Copy, Check, ExternalLink, Share2, Globe } from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateJobOfferPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Success Modal State
  const [createdJob, setCreatedJob] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryRange: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    api.get<any[]>('/departments').then(setDepartments);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const response = await api.post('/recruitment/jobs', formData);
        // Au lieu de rediriger, on stocke le job créé pour afficher la modale
        setCreatedJob(response);
    } catch (e) {
        alert("Erreur lors de la publication de l'offre.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
      if (!createdJob) return;
      // Construction du lien public
      const url = `${window.location.origin}/jobs/${createdJob.id}`;
      navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 relative">
       
       {/* SUCCESS MODAL - LINK GENERATOR */}
       <AnimatePresence>
        {createdJob && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="text-center mb-8 relative z-10">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Offre Publiée !</h2>
                        <p className="text-slate-400">Votre offre est en ligne et prête à être partagée.</p>
                    </div>

                    <div className="bg-black/30 p-4 rounded-2xl border border-white/10 mb-8 relative z-10">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Lien public de candidature</p>
                        <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                            <Globe className="text-cyan-500 shrink-0" size={18} />
                            <div className="flex-1 overflow-hidden">
                                <p className="text-cyan-400 font-mono text-sm truncate">
                                    {`${window.location.origin}/jobs/${createdJob.id}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-3">
                            <button 
                                onClick={handleCopyLink}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                {isCopied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                                {isCopied ? 'Lien Copié !' : 'Copier le lien'}
                            </button>
                            <a 
                                href={`/jobs/${createdJob.id}`} 
                                target="_blank"
                                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center"
                            >
                                <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <button 
                            onClick={() => router.push('/recrutement')} 
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                        >
                            Retour au Tableau de Bord
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
       </AnimatePresence>

       <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
             <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une offre d'emploi</h1>
             <p className="text-sm text-gray-500">Publiez un poste et commencez à recevoir des candidats.</p>
          </div>
       </div>

       <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
          
          {/* SECTION 1: DETAILS */}
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase size={20} className="text-sky-500"/> Détails du poste
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Titre de l'offre</label>
                   <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-lg font-medium" placeholder="Ex: Développeur Fullstack Senior" />
                </div>

                <div>
                   <FancySelect 
                      label="Département"
                      value={formData.departmentId}
                      onChange={(v) => setFormData({...formData, departmentId: v})}
                      icon={Building2}
                      options={departments.map(d => ({ value: d.id, label: d.name }))}
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type de contrat</label>
                   <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none appearance-none cursor-pointer">
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="STAGE">Stage</option>
                      <option value="FREELANCE">Freelance</option>
                   </select>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lieu</label>
                   <div className="relative">
                      <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fourchette Salaire (Optionnel)</label>
                   <div className="relative">
                      <input value={formData.salaryRange} onChange={e => setFormData({...formData, salaryRange: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" placeholder="Ex: 800k - 1.2M" />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                   </div>
                </div>
             </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

          {/* SECTION 2: DESCRIPTION */}
          <div className="space-y-6">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Description & Pré-requis</h3>
             
             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description du poste</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[150px] resize-y" placeholder="Détaillez les missions..." />
             </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Compétences requises</label>
                <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[100px] resize-y" placeholder="Liste des compétences..." />
             </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
             <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} Publier l'offre
             </button>
          </div>

       </form>
    </div>
  );
}
