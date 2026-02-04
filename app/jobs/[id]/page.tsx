'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MapPin, Clock, Briefcase, Building2, Calendar, DollarSign, 
  Share2, Loader2, AlertCircle, ChevronRight, Facebook, 
  Linkedin, Twitter, MessageCircle, Copy, Check, ArrowLeft, Sparkles, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JobDetail {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string;
  type: string;
  companyId: string; // ✅ AJOUT
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  imageUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  requiredSkills: string[];
  minExperience: number | null;
  educationLevel: string | null;
  expirationDate: string | null;
  isExpired: boolean;
  createdAt: string;
  company: {
    legalName: string;
    logo: string | null;
    careerPageLogo: string | null;
    industry: string | null;
    city: string | null;
  };
  department: {
    name: string;
  } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/${jobId}?source=direct`);
      
      if (!response.ok) throw new Error('Offre introuvable');
      
      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error('Erreur chargement offre:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getSalaryRange = () => {
    if (!job || !job.salaryMin || !job.salaryMax) return null;
    return `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} ${job.salaryCurrency}`;
  };

  const getDaysRemaining = () => {
    if (!job?.expirationDate) return null;
    const now = new Date();
    const expiration = new Date(job.expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={64} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <AlertCircle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Offre introuvable</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Cette offre n'existe pas ou a été retirée.</p>
        <Link href="/jobs/portal" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl">
          Retour au portail
        </Link>
      </div>
    );
  }

  const salaryRange = getSalaryRange();
  const daysRemaining = getDaysRemaining();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* SHARE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Partager cette offre</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-bold transition-colors"
                >
                  <Linkedin size={20} />
                  LinkedIn
                </a>
                
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(job.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#0C85D0] text-white rounded-xl font-bold transition-colors"
                >
                  <Twitter size={20} />
                  Twitter
                </a>
                
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-xl font-bold transition-colors"
                >
                  <Facebook size={20} />
                  Facebook
                </a>
                
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(job.title + ' - ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#1EBE57] text-white rounded-xl font-bold transition-colors"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </a>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 flex items-center gap-3">
                <input 
                  type="text" 
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent outline-none text-sm text-slate-600 dark:text-slate-400 font-mono"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER IMAGE */}
      {job.imageUrl && (
        <div className="relative h-96 overflow-hidden">
          <Image 
            src={job.imageUrl} 
            alt={job.title} 
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-12">
        
        {/* BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour aux offres
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* TITLE & COMPANY */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-6 mb-6">
                {(job.company.careerPageLogo || job.company.logo) && (
                  <div className="shrink-0">
                    <Image 
                      src={job.company.careerPageLogo || job.company.logo!} 
                      alt={job.company.legalName} 
                      width={80}
                      height={80}
                      className="rounded-2xl border-2 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3">
                    {job.title}
                  </h1>
                  <Link
                    href={`/company/${job.companyId}/jobs`}
                    className="text-xl font-bold text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    {job.company.legalName}
                  </Link>
                  {job.company.industry && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{job.company.industry}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
                  <MapPin size={18} className="text-red-500" />
                  {job.location}
                </span>
                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
                  <Clock size={18} className="text-green-500" />
                  {job.type}
                </span>
                {job.department && (
                  <span className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2">
                    <Briefcase size={18} className="text-purple-500" />
                    {job.department.name}
                  </span>
                )}
                {salaryRange && (
                  <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold rounded-xl flex items-center gap-2">
                    <DollarSign size={18} />
                    {salaryRange}
                  </span>
                )}
              </div>

              {/* EXPIRATION WARNING */}
              {job.isExpired && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} />
                    <div>
                      <p className="font-black text-red-600 dark:text-red-400 text-lg">Offre Expirée</p>
                      <p className="text-red-600 dark:text-red-400 text-sm">Cette offre n'est plus disponible</p>
                    </div>
                  </div>
                </div>
              )}

              {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 rounded-2xl p-4 mb-6">
                  <p className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2">
                    <Calendar size={18} />
                    Expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-4">
                {!job.isExpired && (
                  <Link
                    href={job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`}
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-black text-lg rounded-2xl shadow-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                  >
                    Postuler Maintenant <ChevronRight size={24} />
                  </Link>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-2xl transition-colors flex items-center gap-2"
                >
                  <Share2 size={20} />
                  Partager
                </button>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Description du Poste</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </div>

            {/* REQUIREMENTS */}
            {job.requirements && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Prérequis & Qualifications</h2>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* SKILLS */}
            {job.requiredSkills.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 sticky top-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Compétences Requises</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold rounded-xl text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DETAILS */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">Détails</h3>
              <div className="space-y-4">
                {job.minExperience !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Expérience</span>
                    <span className="font-bold text-slate-900 dark:text-white">{job.minExperience}+ ans</span>
                  </div>
                )}
                {job.educationLevel && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Formation</span>
                    <span className="font-bold text-slate-900 dark:text-white">{job.educationLevel}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Publié le</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {new Date(job.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Mode</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {job.processingMode === 'AI_ASSISTED' ? (
                      <>
                        <Sparkles size={16} className="text-cyan-400" />
                        IA
                      </>
                    ) : (
                      <>
                        <Users size={16} className="text-blue-500" />
                        Manuel
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* COMPANY LINK */}
            <Link
              href={`/company/${job.companyId}/jobs`}
              className="block bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-3xl p-6 hover:shadow-lg transition-all"
            >
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Voir toutes les offres de</p>
              <p className="text-xl font-black text-blue-600 dark:text-cyan-400 flex items-center gap-2">
                {job.company.legalName} <ChevronRight size={20} />
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}