
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Star, Calendar, Loader2, Plus, ArrowRight, User, Check, X, MessageSquare } from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

export default function PerformancePage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
      employeeId: '',
      score: 3,
      comments: '',
      date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);

            try {
                const reviewsData = await api.get<any[]>('/performance/reviews');
                setReviews(reviewsData);

                // Load employees for manager/admin dropdown
                if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(user.role)) {
                    const empData = await api.get<any[]>('/employees');
                    setEmployees(empData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
      if (!newReview.employeeId) return;
      setIsSubmitting(true);
      try {
          await api.post('/performance/reviews', newReview);
          
          // Refresh list
          const updated = await api.get<any[]>('/performance/reviews');
          setReviews(updated);
          setShowModal(false);
          setNewReview({ employeeId: '', score: 3, comments: '', date: new Date().toISOString().split('T')[0] });
      } catch (e) {
          alert("Erreur");
      } finally {
          setIsSubmitting(false);
      }
  };

  const canCreate = currentUser && ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Performance</h1>
           <p className="text-gray-500 dark:text-gray-400">Suivi des évaluations et feedback.</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/performance/objectifs" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Target size={18} /> <span className="hidden sm:inline">Gérer les Objectifs</span>
           </Link>
           {canCreate && (
               <button 
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
               >
                  <Plus size={20} /> Nouvelle Évaluation
               </button>
           )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
         <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Historique des Évaluations</h3>
         </div>
         {isLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-purple-500" size={40}/></div> : (
             <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {reviews.map(review => (
                    <motion.div 
                        key={review.id} 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
                    >
                        <div className="flex items-center gap-5">
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner
                                ${review.score >= 4 ? 'bg-emerald-100 text-emerald-600' : review.score >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}
                            `}>
                                {review.score}<span className="text-xs opacity-60">/5</span>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{review.employee.firstName} {review.employee.lastName}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{review.employee.position} • {review.employee.department?.name}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col md:items-end gap-1">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">
                                <Calendar size={14} /> {new Date(review.date).toLocaleDateString()}
                            </div>
                            <p className="text-sm text-gray-400 italic max-w-md text-right truncate">"{review.comments}"</p>
                        </div>
                    </motion.div>
                ))}
                {reviews.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center text-gray-400">
                        <Star size={48} className="opacity-20 mb-4" />
                        <p>Aucune évaluation enregistrée pour le moment.</p>
                        {canCreate && <p className="text-sm mt-2 text-purple-500">Lancez la première évaluation !</p>}
                    </div>
                )}
             </div>
         )}
      </div>

      {/* MODAL CREATION */}
      <AnimatePresence>
        {showModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                                <Star size={24} fill="currentColor" className="opacity-80" />
                            </div>
                            Évaluer un collaborateur
                        </h2>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20}/></button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <FancySelect 
                                label="Employé"
                                value={newReview.employeeId}
                                onChange={(v) => setNewReview({...newReview, employeeId: v})}
                                icon={User}
                                options={employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
                                placeholder="Qui évaluez-vous ?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Note Globale</label>
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button 
                                        key={s}
                                        onClick={() => setNewReview({...newReview, score: s})}
                                        className={`
                                            flex-1 py-3 rounded-xl font-bold text-lg border transition-all
                                            ${newReview.score === s 
                                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/30 scale-105' 
                                                : 'bg-white dark:bg-gray-700 text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 px-1">
                                <span className="text-xs text-gray-400">Insuffisant</span>
                                <span className="text-xs text-gray-400">Excellent</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Commentaires / Feedback</label>
                            <textarea 
                                value={newReview.comments}
                                onChange={(e) => setNewReview({...newReview, comments: e.target.value})}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 min-h-[100px] resize-none"
                                placeholder="Points forts, axes d'amélioration..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Date de l'entretien</label>
                            <input 
                                type="date"
                                value={newReview.date}
                                onChange={(e) => setNewReview({...newReview, date: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                        <button onClick={handleSubmit} disabled={isSubmitting || !newReview.employeeId} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={18} />} Enregistrer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
