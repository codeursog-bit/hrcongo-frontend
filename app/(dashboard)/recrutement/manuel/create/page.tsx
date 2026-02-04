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
              className="glass-panel rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

              <div className="text-center mb-8 relative z-10">
                <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Offre Publiée !</h2>
                <p className="text-slate-400">Votre offre est en ligne et visible par les candidats.</p>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/10 mb-8 relative z-10">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Lien public de candidature</p>
                <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <Globe className="text-blue-500 shrink-0" size={18} />
                  <p className="text-blue-400 font-mono text-sm truncate flex-1">
                    {`${window.location.origin}/jobs/${createdJob.id}`}
                  </p>
                </div>
                <button 
                  onClick={handleCopyLink}
                  className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isCopied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
                  {isCopied ? 'Lien Copié !' : 'Copier le lien'}
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => router.push('/recrutement/manuel/candidats')} 
                  className="flex-1 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Voir les Candidatures
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
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="text-blue-500" size={28}/>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une Offre Manuelle</h1>
          </div>
          <p className="text-sm text-slate-400">Recrutement traditionnel avec examen manuel des CV</p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl">
        
        {/* IMAGE UPLOAD */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
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
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <label className="block w-full h-48 border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-xl cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-blue-400 transition-colors">
                <Upload size={40} className="mb-3" />
                <p className="font-medium">Cliquez pour uploader une image</p>
                <p className="text-xs mt-1">JPG, PNG, WEBP (max 2MB)</p>
              </div>
            </label>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Intitulé du Poste *</label>
            <input 
              type="text" 
              required 
              placeholder="ex: Chef de Projet Marketing" 
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Building2 size={16}/> Département *</label>
              <select 
                required
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
                value={formData.departmentId} 
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Choisir...</option>
                {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><MapPin size={16}/> Lieu</label>
              <input 
                type="text" 
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
                value={formData.location} 
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Type de Contrat</label>
              <select 
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign size={16}/> Salaire Min
              </label>
              <input 
                type="number" 
                placeholder="Ex: 500000"
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
                value={formData.salaryMin} 
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign size={16}/> Salaire Max
              </label>
              <input 
                type="number" 
                placeholder="Ex: 800000"
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
                value={formData.salaryMax} 
                onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Devise</label>
              <select 
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
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
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Calendar size={16}/> Date d'expiration (Optionnel)
            </label>
            <input 
              type="date" 
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
              value={formData.expirationDate} 
              onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Description du Poste *</label>
            <textarea 
              required
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 min-h-[120px] outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50 resize-none" 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Décrivez les missions et responsabilités..."
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Compétences et Qualifications</label>
            <textarea 
              className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50 resize-none" 
              value={formData.requirements} 
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
              placeholder="Expérience, diplômes, compétences techniques..."
            />
          </div>

          {/* PORTAL TOGGLE */}
          <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Globe className="text-blue-400" size={20} />
              <div>
                <p className="font-bold text-blue-400 text-sm">Publier sur le Portail</p>
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
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
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

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <FileText size={24} className="text-blue-400 mt-1 shrink-0"/>
              <div>
                <h4 className="text-sm font-bold text-blue-400 mb-2">Mode Manuel Activé</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Les candidatures seront reçues dans votre espace et vous pourrez examiner chaque CV manuellement. 
                  Vous gérerez le processus de sélection étape par étape.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/10 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin"/> : <><Send size={18}/> Publier l'Offre</>}
        </button>
      </form>
    </div>
  );
}

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   Briefcase, Send, ArrowLeft, CheckCircle2, Copy, Check,
//   Globe, MapPin, Building2, Loader2, FileText
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { Department } from '@/types/recruitment';

// interface CreatedJob {
//   id: string;
//   title: string;
// }

// export default function CreateManualJobPage() {
//   const router = useRouter();
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
//   const [isCopied, setIsCopied] = useState(false);

//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     requirements: '',
//     departmentId: '',
//     location: 'Brazzaville, Siège',
//     contractType: 'CDI',
//     salaryRange: ''
//   });

//   useEffect(() => {
//     api.get<Department[]>('/departments').then(setDepartments).catch(console.error);
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     try {
//       const payload = {
//         title: formData.title,
//         description: formData.description,
//         requirements: formData.requirements,
//         departmentId: formData.departmentId,
//         location: formData.location,
//         contractType: formData.contractType,
//         processingMode: 'MANUAL'
//       };

//       const jobResponse = await api.post<CreatedJob>('/recruitment/jobs', payload);
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
//     const url = `${window.location.origin}/jobs/manuel/${createdJob.id}`;
//     navigator.clipboard.writeText(url);
//     setIsCopied(true);
//     setTimeout(() => setIsCopied(false), 2000);
//   };

//   return (
//     <div className="max-w-4xl mx-auto pb-20 pt-6 px-4 relative">
      
//       {/* SUCCESS MODAL */}
//       <AnimatePresence>
//         {createdJob && (
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
//           >
//             <motion.div 
//               initial={{ scale: 0.9, y: 20 }} 
//               animate={{ scale: 1, y: 0 }}
//               className="glass-panel rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
//             >
//               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>

//               <div className="text-center mb-8 relative z-10">
//                 <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
//                   <CheckCircle2 size={40} />
//                 </div>
//                 <h2 className="text-3xl font-bold text-white mb-2">Offre Publiée !</h2>
//                 <p className="text-slate-400">Votre offre est en ligne et visible par les candidats.</p>
//               </div>

//               <div className="bg-black/30 p-4 rounded-2xl border border-white/10 mb-8 relative z-10">
//                 <p className="text-xs font-bold text-slate-500 uppercase mb-2">Lien public de candidature</p>
//                 <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
//                   <Globe className="text-blue-500 shrink-0" size={18} />
//                   <p className="text-blue-400 font-mono text-sm truncate flex-1">
//                     {`${window.location.origin}/jobs/manuel/${createdJob.id}`}
//                   </p>
//                 </div>
//                 <button 
//                   onClick={handleCopyLink}
//                   className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
//                 >
//                   {isCopied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16}/>}
//                   {isCopied ? 'Lien Copié !' : 'Copier le lien'}
//                 </button>
//               </div>

//               <button 
//                 onClick={() => router.push('/recrutement/manuel/candidats')} 
//                 className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] relative z-10"
//               >
//                 Voir les Candidatures
//               </button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* HEADER */}
//       <div className="flex items-center gap-4 mb-8">
//         <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//           <ArrowLeft size={20} className="text-gray-500" />
//         </button>
//         <div>
//           <div className="flex items-center gap-3 mb-1">
//             <Briefcase className="text-blue-500" size={28}/>
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer une Offre Manuelle</h1>
//           </div>
//           <p className="text-sm text-slate-400">Recrutement traditionnel avec examen manuel des CV</p>
//         </div>
//       </div>

//       {/* FORM */}
//       <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 md:p-12 space-y-8 shadow-2xl">
        
//         <div className="space-y-6">
//           <div className="space-y-2">
//             <label className="text-sm font-semibold text-slate-300">Intitulé du Poste *</label>
//             <input 
//               type="text" 
//               required 
//               placeholder="ex: Chef de Projet Marketing" 
//               className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50" 
//               value={formData.title} 
//               onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
//             />
//           </div>
          
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Building2 size={16}/> Département *</label>
//               <select 
//                 required
//                 className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
//                 value={formData.departmentId} 
//                 onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
//               >
//                 <option value="">Choisir...</option>
//                 {departments.map(d => <option key={d.id} value={d.id} className="bg-slate-900">{d.name}</option>)}
//               </select>
//             </div>
            
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><MapPin size={16}/> Lieu</label>
//               <input 
//                 type="text" 
//                 className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
//                 value={formData.location} 
//                 onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
//               />
//             </div>
            
//             <div className="space-y-2">
//               <label className="text-sm font-semibold text-slate-300">Type de Contrat</label>
//               <select 
//                 className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-4 py-4 outline-none text-slate-100" 
//                 value={formData.contractType} 
//                 onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
//               >
//                 <option value="CDI" className="bg-slate-900">CDI</option>
//                 <option value="CDD" className="bg-slate-900">CDD</option>
//                 <option value="STAGE" className="bg-slate-900">Stage</option>
//               </select>
//             </div>
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-semibold text-slate-300">Description du Poste *</label>
//             <textarea 
//               required
//               className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 min-h-[120px] outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50 resize-none" 
//               value={formData.description} 
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
//               placeholder="Décrivez les missions et responsabilités..."
//             />
//           </div>
          
//           <div className="space-y-2">
//             <label className="text-sm font-semibold text-slate-300">Compétences et Qualifications</label>
//             <textarea 
//               className="w-full bg-slate-950/40 border border-white/10 rounded-xl px-5 py-4 min-h-[100px] outline-none text-slate-100 focus:ring-2 focus:ring-blue-500/50 resize-none" 
//               value={formData.requirements} 
//               onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
//               placeholder="Expérience, diplômes, compétences techniques..."
//             />
//           </div>

//           <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
//             <div className="flex items-start gap-3">
//               <FileText size={24} className="text-blue-400 mt-1 shrink-0"/>
//               <div>
//                 <h4 className="text-sm font-bold text-blue-400 mb-2">Mode Manuel Activé</h4>
//                 <p className="text-xs text-slate-400 leading-relaxed">
//                   Les candidatures seront reçues dans votre espace et vous pourrez examiner chaque CV manuellement. 
//                   Vous gérerez le processus de sélection étape par étape.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* SUBMIT */}
//         <button 
//           type="submit" 
//           disabled={isSubmitting} 
//           className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/10 disabled:opacity-50"
//         >
//           {isSubmitting ? <Loader2 className="animate-spin"/> : <><Send size={18}/> Publier l'Offre</>}
//         </button>
//       </form>
//     </div>
//   );
// }
