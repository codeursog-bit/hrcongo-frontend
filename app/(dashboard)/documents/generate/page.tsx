'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, Mail, AlertTriangle, FileBarChart, Search, 
  ArrowLeft, Download, Eye, CheckCircle2, Loader2, X, Scale, 
  GraduationCap, Briefcase, Gavel, Shield, Receipt, Map, Bell, Ban, Book
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
  // CONTRATS
  { 
    id: 'cdi', 
    title: 'Contrat CDI Standard', 
    desc: 'Contrat à durée indéterminée avec période d\'essai.', 
    icon: FileText, 
    category: 'contrats', 
    tags: ['Embauche', 'Juridique'], 
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20', 
    isPopular: true 
  },
  { 
    id: 'cdd', 
    title: 'Contrat CDD', 
    desc: 'Contrat à durée déterminée avec motif de recours.', 
    icon: FileText, 
    category: 'contrats', 
    tags: ['Embauche', 'Temporaire'], 
    color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20' 
  },
  { 
    id: 'attest_travail', 
    title: 'Certificat de Travail', 
    desc: 'Document obligatoire de fin de contrat.', 
    icon: Briefcase, 
    category: 'admin', 
    tags: ['Départ', 'Obligatoire'], 
    color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/20', 
    isPopular: true 
  },
  { 
    id: 'avertissement', 
    title: 'Lettre d\'Avertissement', 
    desc: 'Sanction disciplinaire de premier niveau.', 
    icon: Gavel, 
    category: 'disciplinaire', 
    tags: ['Sanction'], 
    color: 'text-red-600 bg-red-100 dark:bg-red-900/20' 
  },
];

export default function LegalLibraryPage() {
  const router = useRouter();
  
  // State
  const [activeCategory, setActiveCategory] = useState<DocCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  
  // Wizard State
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Chargement sécurisé des employés avec gestion d'erreur
    const loadEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
            const data = await api.get<any[]>('/employees');
            setEmployees(data || []);
        } catch (e) {
            console.error("Erreur chargement employés", e);
            // On ne bloque pas l'UI, on met juste un tableau vide pour éviter le crash
            setEmployees([]);
        } finally {
            setIsLoadingEmployees(false);
        }
    };
    loadEmployees();
  }, []);

  // Derived
  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesCat = activeCategory === 'all' || t.category === activeCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenWizard = (tpl: DocTemplate) => {
    setSelectedTemplate(tpl);
    setShowSuccess(false);
    setSelectedEmp('');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !selectedEmp) return;
    setIsGenerating(true);
    try {
        await api.post('/documents', {
            name: `${selectedTemplate.title} - ${new Date().toLocaleDateString()}`,
            type: selectedTemplate.id,
            description: selectedTemplate.desc,
            employeeId: selectedEmp
        });
        setShowSuccess(true);
    } catch (e) {
        alert("Erreur technique lors de la génération. Vérifiez votre connexion.");
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
             <ArrowLeft size={20} className="text-gray-500" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Bibliothèque Juridique</h1>
              <p className="text-gray-500 dark:text-gray-400">Générez des documents conformes.</p>
           </div>
        </div>
      </div>

      {/* SEARCH & GRID */}
      <div className="flex-1 space-y-6">
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher un modèle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500/20 outline-none text-lg"
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map(tpl => (
                <motion.div 
                    key={tpl.id}
                    layoutId={tpl.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => handleOpenWizard(tpl)}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tpl.color}`}>
                        <tpl.icon size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{tpl.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10 line-clamp-2">{tpl.desc}</p>
                </motion.div>
            ))}
        </div>
      </div>

      {/* WIZARD MODAL */}
      <AnimatePresence>
         {selectedTemplate && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
               <motion.div 
                  initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
               >
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${selectedTemplate.color}`}>
                           <selectedTemplate.icon size={24} />
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTemplate.title}</h2>
                        </div>
                     </div>
                     <button onClick={() => setSelectedTemplate(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20}/></button>
                  </div>

                  <div className="p-8 overflow-y-auto flex-1">
                     {showSuccess ? (
                        <div className="text-center py-10">
                           <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                              <CheckCircle2 size={48} strokeWidth={3} />
                           </div>
                           <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Document Prêt !</h3>
                           <button onClick={() => router.push('/documents')} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg">Voir mes documents</button>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div>
                              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Employé concerné</label>
                              {isLoadingEmployees ? (
                                  <div className="p-4 text-center text-sm text-gray-500"><Loader2 className="animate-spin inline mr-2"/> Chargement liste...</div>
                              ) : (
                                  <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-750 text-gray-900 dark:text-white">
                                    <option value="">Choisir un employé</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                    ))}
                                  </select>
                              )}
                           </div>
                           <button 
                              onClick={handleGenerate}
                              disabled={!selectedEmp || isGenerating}
                              className="w-full px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:scale-[1.02] transition-transform"
                           >
                              {isGenerating ? <Loader2 className="animate-spin"/> : <CheckCircle2 />} Générer le document
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