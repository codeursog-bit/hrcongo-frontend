
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Send, ArrowLeft, CheckCircle2, Copy, Check,
  Globe, MapPin, Building2, Loader2, FileText
} from 'lucide-react';
import { api } from '@/services/api';
import { Department } from '@/types/recruitment';

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryRange: ''
  });

  useEffect(() => {
    api.get<Department[]>('/departments').then(setDepartments).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        departmentId: formData.departmentId,
        location: formData.location,
        contractType: formData.contractType,
        processingMode: 'MANUAL'
      };

      const jobResponse = await api.post<CreatedJob>('/recruitment/jobs', payload);
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
    const url = `${window.location.origin}/jobs/manuel/${createdJob.id}`;
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
                    {`${window.location.origin}/jobs/manuel/${createdJob.id}`}
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

              <button 
                onClick={() => router.push('/recrutement/manuel/candidats')} 
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.02] relative z-10"
              >
                Voir les Candidatures
              </button>
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

// export default function CreateManualJobPage() {
//   const router = useRouter();
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [createdJob, setCreatedJob] = useState<any>(null);
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
//     api.get<Department[]>('/departments').then(setDepartments);
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

//       const jobResponse = await api.post('/recruitment/jobs', payload);
//       setCreatedJob(jobResponse);
//     } catch (e: any) {
//       alert(`Erreur: ${e.message || 'Impossible de créer l\'offre'}`);
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