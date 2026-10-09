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
  description?: string | null;
  employeeCount?: number;
  activeEmployees?: number;
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
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', code: '' });
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setFormData({ name: dept.name, code: dept.code || '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', code: '' });
  };

  const getCount = (dept: Department) =>
    dept.activeEmployees ?? dept.employeeCount ?? dept._count?.employees ?? 0;

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
      if (editing) {
        await api.patch(`/departments/${editing.id}`, formData);
        alert.success('Département modifié', `« ${formData.name.trim()} » a été mis à jour.`);
      } else {
        await api.post('/departments', formData);
      }
      closeModal();
      fetchDepartments();
} catch (e: any) {
  alert.error(
    editing ? 'Erreur de modification' : 'Erreur de création',
    e.message || (editing ? 'Impossible de modifier le département.' : 'Impossible de créer le département.')
  );
} finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/departments/${deleteTarget.id}`);
      alert.success('Département supprimé', `« ${deleteTarget.name} » a été supprimé.`);
      setDeleteTarget(null);
      fetchDepartments();
    } catch (e: any) {
      alert.error(
        'Suppression impossible',
        e.message || 'Impossible de supprimer le département.'
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
             <ArrowLeft size={20} className="text-[var(--text-muted)]" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">Départements</h1>
              <p className="text-[var(--text-muted)]">Structurez votre organigramme.</p>
           </div>
        </div>
        <button 
          onClick={openCreate}
          className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
           <Plus size={20} /> Ajouter Département
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {departments.map((dept) => (
             <motion.div 
               key={dept.id}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="group bg-[var(--surface)] backdrop-blur-md border border-[var(--border)] rounded-2xl p-6 hover:border-emerald-500/50 hover:bg-[var(--surface)] transition-all relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                   <button
                     type="button"
                     onClick={() => openEdit(dept)}
                     title="Modifier"
                     className="p-2 text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                   ><Edit2 size={16} /></button>
                   <button
                     type="button"
                     onClick={() => setDeleteTarget(dept)}
                     title="Supprimer"
                     className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                   ><Trash2 size={16} /></button>
                </div>

                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                   <Network size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-[var(--text)] mb-1">{dept.name}</h3>
                {dept.code && <p className="text-xs font-mono text-[var(--text-muted)] mb-4">{dept.code}</p>}
                
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--surface-2)] w-fit px-3 py-1.5 rounded-full">
                   <Users size={14} />
                   <span className="font-bold text-[var(--text)]">{getCount(dept)}</span> collaborateurs
                </div>
             </motion.div>
           ))}
           
           {/* Empty State Card */}
           <button 
              onClick={openCreate}
              className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all min-h-[200px]"
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
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-2xl relative"
            >
               <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20}/></button>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                     <Network size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--text)]">{editing ? 'Modifier le département' : 'Nouveau Service'}</h2>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="block text-sm font-bold text-[var(--text)] mb-2">Nom du département</label>
                     <input 
                        required
                        autoFocus
                        placeholder="Ex: Marketing, IT, Finance..."
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none text-lg"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-[var(--text)] mb-2">Code (Optionnel)</label>
                     <input 
                        placeholder="Ex: MKT, IT, FIN..."
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                        className="w-full p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono tracking-wider"
                     />
                  </div>

                  <button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
                  >
                     {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                     {editing ? 'Enregistrer les modifications' : 'Créer le département'}
                  </button>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation de suppression */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                  <Trash2 size={24} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text)]">Supprimer ce département ?</h2>
              </div>
              <p className="text-[var(--text-muted)] mb-6">
                Le département <span className="font-bold text-[var(--text)]">« {deleteTarget.name} »</span> sera supprimé définitivement.
                Un département qui contient encore des collaborateurs ne peut pas être supprimé.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-bold rounded-xl hover:bg-[var(--surface)] transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex justify-center items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}