'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Phone, Briefcase, MapPin, 
  Calendar, Download, Loader2, CheckCircle2, XCircle, UserPlus,
  MessageSquare, FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/services/api';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  resumeUrl: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  jobOffer: {
    title: string;
    location: string;
    type: string;
    department: { name: string };
  };
}

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHiring, setIsHiring] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, []);

  const fetchCandidate = async () => {
    try {
      const data = await api.get<Candidate>(`/recruitment/candidates/${params.id}`);
      setCandidate(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.patch(`/recruitment/candidates/${params.id}/status`, { status: newStatus });
      setCandidate(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const handleHire = async () => {
    if (!confirm("Confirmer l'embauche ? Cela créera automatiquement un dossier employé.")) return;
    
    setIsHiring(true);
    try {
      const employee = await api.post<any>(`/recruitment/candidates/${params.id}/hire`, {});
      alert(`Employé ${employee.firstName} ${employee.lastName} créé avec succès !`);
      router.push(`/employes/${employee.id}/edit`);
    } catch (e) {
      alert("Erreur lors de la création du dossier employé.");
    } finally {
      setIsHiring(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={32}/>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Candidat introuvable</h1>
        <Link href="/recrutement/kanban" className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold">
          Retour au pipeline
        </Link>
      </div>
    );
  }

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    APPLIED: { label: 'Nouvelle', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: User },
    SCREENING: { label: 'Qualifié', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: CheckCircle2 },
    INTERVIEW: { label: 'Entretien', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', icon: MessageSquare },
    OFFER: { label: 'Offre envoyée', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', icon: FileText },
    HIRED: { label: 'Embauché', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
    REJECTED: { label: 'Refusé', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: XCircle },
  };

  const ALL_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

  const statusConfig = STATUS_CONFIG[candidate.status] || STATUS_CONFIG.APPLIED;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20}/>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Candidature de {candidate.firstName} {candidate.lastName}</h1>
          <p className="text-sm text-gray-500">Postulé le {new Date(candidate.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        {candidate.status === 'HIRED' && (
          <button 
            onClick={handleHire}
            disabled={isHiring}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isHiring ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
            Créer Employé
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 text-center sticky top-8">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-lg">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {candidate.firstName} {candidate.lastName}
            </h2>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.color} font-bold text-sm mt-4 mb-6`}>
              <StatusIcon size={16} />
              {statusConfig.label}
            </div>

            {/* ✅ MENU DÉROULANT POUR CHANGER LE STATUT */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Changer le statut</label>
              <select 
                value={candidate.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 font-medium text-sm"
              >
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail size={16} className="text-gray-400"/>
                <a href={`mailto:${candidate.email}`} className="hover:text-cyan-500 transition-colors break-all">
                  {candidate.email}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={16} className="text-gray-400"/>
                <a href={`tel:${candidate.phone}`} className="hover:text-cyan-500 transition-colors">
                  {candidate.phone}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Calendar size={16} className="text-gray-400"/>
                <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <a 
              href={candidate.resumeUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Télécharger le CV
            </a>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-cyan-500"/>
              Poste visé
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-500 mb-1">Titre du poste</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{candidate.jobOffer.title}</p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Département</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <Briefcase size={14} className="text-purple-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.department.name}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Lieu</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <MapPin size={14} className="text-red-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.location}</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">Contrat</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                    <FileText size={14} className="text-orange-400"/>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{candidate.jobOffer.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-cyan-500"/>
              Lettre de motivation
            </h3>
            
            {candidate.coverLetter ? (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                  {candidate.coverLetter}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center py-8">
                Aucune lettre de motivation fournie
              </p>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
}