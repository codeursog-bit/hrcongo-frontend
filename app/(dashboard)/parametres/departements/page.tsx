
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Network, Users, Trash2, Edit2, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/providers/AlertProvider';
import { api } from '@/services/api';

interface Department {
  id: string;
  name: string;
  code?: string;
  _count?: {
    employees: number;
  };
}

export default function DepartmentsPage() {
  const router = useRouter();
   const alert = useAlert();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDepartments = async () => {
    try {
      const data = await api.get<Department[]>('/departments');
      setDepartments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/departments', formData);
      setShowModal(false);
      setFormData({ name: '', code: '' });
      fetchDepartments();
} catch (e: any) {
  alert.error(
    'Erreur de création',
    e.message || 'Impossible de créer le département.'
  );
} finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
             <ArrowLeft size={20} className="text-gray-500 dark:text-gray-300" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Départements</h1>
              <p className="text-gray-500 dark:text-gray-400">Structurez votre organigramme.</p>
           </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2"
        >
           <Plus size={20} /> Ajouter Département
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {departments.map((dept) => (
             <motion.div 
               key={dept.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="group bg-white dark:bg-gray-800/50 backdrop-blur-md border border-gray-200 dark:border-white/5 rounded-3xl p-6 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-gray-800 transition-all relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                </div>

                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                   <Network size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{dept.name}</h3>
                {dept.code && <p className="text-xs font-mono text-gray-400 mb-4">{dept.code}</p>}
                
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 w-fit px-3 py-1.5 rounded-full">
                   <Users size={14} />
                   <span className="font-bold text-gray-900 dark:text-white">{dept._count?.employees || 0}</span> collaborateurs
                </div>
             </motion.div>
           ))}
           
           {/* Empty State Card */}
           <button 
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all min-h-[200px]"
           >
              <Plus size={32} className="mb-2" />
              <span className="font-bold">Créer nouveau</span>
           </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
               <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={20}/></button>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                     <Network size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Service</h2>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nom du département</label>
                     <input 
                        required
                        autoFocus
                        placeholder="Ex: Marketing, IT, Finance..."
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none text-lg"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Code (Optionnel)</label>
                     <input 
                        placeholder="Ex: MKT, IT, FIN..."
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none font-mono tracking-wider"
                     />
                  </div>

                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                     Créer le département
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
