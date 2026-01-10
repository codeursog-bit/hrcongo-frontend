'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Save, Loader2, Building2 } from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

interface Department {
  id: string;
  name: string;
}

interface JobData {
  title: string;
  departmentId: string;
  location: string;
  type: string;
  description: string;
  requirements?: string;
}

interface FormData {
  title: string;
  departmentId: string;
  location: string;
  contractType: string;
  salaryRange: string;
  description: string;
  requirements: string;
}

export default function EditJobOfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryRange: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [jobData, deptData] = await Promise.all([
          api.get(`/recruitment/jobs/${params.id}`),
          api.get('/departments')
        ]);
        
        setDepartments(deptData as Department[]);
        
        const job = jobData as JobData;
        setFormData({
          title: job.title,
          departmentId: job.departmentId,
          location: job.location,
          contractType: job.type,
          salaryRange: '',
          description: job.description,
          requirements: job.requirements || ''
        });
      } catch (e) {
        console.error(e);
        alert("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/recruitment/jobs/${params.id}`, formData);
      alert("Offre mise à jour avec succès !");
      router.push('/recrutement');
    } catch (e) {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={32}/>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'offre d'emploi</h1>
          <p className="text-sm text-gray-500">Mettez à jour les informations du poste.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
        
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
                <option value="CONSULTANT">Consultant</option>
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
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} Enregistrer
          </button>
        </div>

      </form>
    </div>
  );
}