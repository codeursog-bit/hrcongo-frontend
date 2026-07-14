'use client';

// ============================================================================
// 📄 app/(dashboard)/documents/legal/page.tsx
// Corrigé : /employees/simple au lieu de /employees (réponse paginée sinon)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Search, ArrowLeft, CheckCircle2, Loader2, X,
  Briefcase, Gavel, Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

type DocCategory = 'contrats' | 'disciplinaire' | 'admin' | 'social';

interface DocTemplate {
  id: string;
  title: string;
  desc: string;
  icon: any;
  category: DocCategory;
  tags: string[];
  color: string;
  isPopular?: boolean;
}

const TEMPLATES: DocTemplate[] = [
  {
    id: 'contrat',
    title: 'Contrat CDI Standard',
    desc: 'Contrat à durée indéterminée avec période d\'essai.',
    icon: FileText, category: 'contrats', tags: ['Embauche', 'Juridique'],
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20', isPopular: true,
  },
  {
    id: 'contrat',
    title: 'Contrat CDD',
    desc: 'Contrat à durée déterminée avec motif de recours.',
    icon: FileText, category: 'contrats', tags: ['Embauche', 'Temporaire'],
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
  },
  {
    id: 'work_certificate',
    title: 'Certificat de Travail',
    desc: 'Document obligatoire de fin de contrat.',
    icon: Briefcase, category: 'admin', tags: ['Départ', 'Obligatoire'],
    color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/20', isPopular: true,
  },
  {
    id: 'other',
    title: 'Lettre d\'Avertissement',
    desc: 'Sanction disciplinaire de premier niveau.',
    icon: Gavel, category: 'disciplinaire', tags: ['Sanction'],
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  },
];

export default function LegalLibraryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [employees, setEmployees]           = useState<any[]>([]);
  const [isLoadingEmployees, setLoadingEmp] = useState(false);
  const [selectedEmp, setSelectedEmp]       = useState('');
  const [isGenerating, setGenerating]       = useState(false);
  const [showSuccess, setShowSuccess]       = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoadingEmp(true);
      try {
        // ✅ /employees/simple — retourne un tableau direct (pas paginé)
        const data = await api.get<any[]>('/employees/simple');
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        setEmployees([]);
      } finally {
        setLoadingEmp(false);
      }
    };
    load();
  }, []);

  const filtered = TEMPLATES.filter(t => {
    const q = searchQuery.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q));
  });

  const handleOpenWizard = (tpl: DocTemplate) => {
    setSelectedTemplate(tpl);
    setShowSuccess(false);
    setSelectedEmp('');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedEmp) return;
    setGenerating(true);
    try {
      const formData = new FormData();
      // Ce modal crée une entrée document sans fichier physique (document généré)
      // On utilise POST /documents/upload avec un fichier placeholder ou
      // une route dédiée selon votre back. Ici on fait un appel simple.
      await api.post('/documents/generate', {
        name:        `${selectedTemplate.title} — ${new Date().toLocaleDateString('fr-FR')}`,
        type:        selectedTemplate.id,
        description: selectedTemplate.desc,
        employeeId:  selectedEmp,
      });
      setShowSuccess(true);
    } catch {
      alert('Erreur technique lors de la génération. Vérifiez votre connexion.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Bibliothèque Juridique</h1>
          <p className="text-gray-500 dark:text-gray-400">Générez des documents conformes au droit du travail.</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher un modèle..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500/20 outline-none text-lg"
        />
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((tpl, i) => (
          <motion.div
            key={`${tpl.id}-${i}`}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            onClick={() => handleOpenWizard(tpl)}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tpl.color}`}>
              <tpl.icon size={24} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{tpl.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{tpl.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {tpl.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal wizard */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Header modal */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedTemplate.color}`}>
                    <selectedTemplate.icon size={22} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTemplate.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corps modal */}
              <div className="p-8">
                {showSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 size={40} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Document créé !</h3>
                    <p className="text-gray-400 text-sm mb-5">Le document a été ajouté à la liste.</p>
                    <button
                      onClick={() => router.push('/documents')}
                      className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
                    >
                      Voir mes documents
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                        Employé concerné *
                      </label>
                      {isLoadingEmployees ? (
                        <div className="p-4 text-center text-sm text-gray-400">
                          <Loader2 size={16} className="animate-spin inline mr-2" /> Chargement...
                        </div>
                      ) : (
                        <select
                          value={selectedEmp}
                          onChange={e => setSelectedEmp(e.target.value)}
                          className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                          <option value="">— Choisir un employé —</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.firstName} {emp.lastName}{emp.position ? ` · ${emp.position}` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {!isLoadingEmployees && employees.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">Aucun employé trouvé</p>
                      )}
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={!selectedEmp || isGenerating}
                      className="w-full px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:scale-[1.01] transition-transform"
                    >
                      {isGenerating
                        ? <Loader2 size={18} className="animate-spin" />
                        : <CheckCircle2 size={18} />
                      }
                      Générer le document
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}