'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Briefcase, ChevronRight, Loader2, Building2, Sparkles, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyJob {
  id: string;
  title: string;
  location: string;
  type: string;
  department: string | null;
  imageUrl: string | null;
  processingMode: 'MANUAL' | 'AI_ASSISTED';
  salaryRange: string | null;
  candidatesCount: number;
  createdAt: string;
}

interface CompanyData {
  legalName: string;
  logo: string | null;
  industry: string | null;
  city: string | null;
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

export default function CompanyJobsPage() {
  // ✅ FIX : Utiliser useParams correctement
  const params = useParams<{ companyId: string }>();
  const companyId = params?.companyId;

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    // ✅ Vérifier que companyId existe avant de fetch
    if (!companyId) {
      console.error('❌ companyId is undefined');
      setIsLoading(false);
      return;
    }
    
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    if (!companyId) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/jobs/company/${companyId}`);
      
      if (!response.ok) throw new Error('Erreur chargement');
      
      const data = await response.json();
      setCompany(data.company);
      setJobs(data.jobs);
    } catch (error) {
      console.error('Erreur chargement données entreprise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = selectedType ? jobs.filter(j => j.type === selectedType) : jobs;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 className="animate-spin text-blue-500" size={64} />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <p className="text-xl text-slate-500 mb-4">Entreprise introuvable</p>
          <p className="text-sm text-slate-400">CompanyId: {companyId || 'undefined'}</p>
        </div>
      </div>
    );
  }

  const colors = company.careerPageColors || { primary: '#2563eb', secondary: '#1e40af', accent: '#06b6d4' };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* BANNER */}
      <div className="relative h-80 overflow-hidden">
        {company.careerPageBanner ? (
          <Image 
            src={company.careerPageBanner} 
            alt={company.legalName} 
            fill
            className="object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
            }}
          ></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

        {/* Company Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            {(company.careerPageLogo || company.logo) && (
              <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-2xl border-4 border-white/20">
                <Image 
                  src={company.careerPageLogo || company.logo!} 
                  alt={company.legalName} 
                  width={128}
                  height={128}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 mb-4">
              <h1 className="text-5xl font-black text-white mb-3">{company.legalName}</h1>
              <div className="flex items-center gap-4 text-white/90">
                {company.industry && (
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full font-medium">
                    {company.industry}
                  </span>
                )}
                {company.city && (
                  <span className="flex items-center gap-2">
                    <MapPin size={18} />
                    {company.city}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Briefcase size={18} />
                  {jobs.length} offre{jobs.length > 1 ? 's' : ''} disponible{jobs.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* SIDEBAR: About Company */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* About */}
            {company.careerPageAbout && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 
                  className="text-2xl font-black mb-4"
                  style={{ color: colors.primary }}
                >
                  À Propos
                </h2>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {company.careerPageAbout}
                </p>
              </div>
            )}

            {/* Values */}
            {company.careerPageValues && company.careerPageValues.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 
                  className="text-2xl font-black mb-6"
                  style={{ color: colors.primary }}
                >
                  Nos Valeurs
                </h2>
                <div className="space-y-3">
                  {company.careerPageValues.map((value, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{ 
                        backgroundColor: `${colors.accent}15`,
                        borderLeft: `4px solid ${colors.accent}`
                      }}
                    >
                      <Sparkles size={20} style={{ color: colors.accent }} />
                      <span className="font-bold text-slate-700 dark:text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {company.careerPagePhotos && company.careerPagePhotos.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 
                  className="text-2xl font-black mb-6"
                  style={{ color: colors.primary }}
                >
                  La Vie chez Nous
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {company.careerPagePhotos.map((photo, idx) => (
                    <Image 
                      key={idx} 
                      src={photo} 
                      alt={`Photo ${idx + 1}`} 
                      width={200}
                      height={150}
                      className="w-full h-32 object-cover rounded-xl hover:scale-105 transition-transform cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MAIN: Job Listings */}
          <div className="lg:col-span-2">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Postes Disponibles
              </h2>
              
              <select
                className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 text-slate-900 dark:text-white font-medium"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">Tous les contrats</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
              </select>
            </div>

            {/* Jobs Grid */}
            {filteredJobs.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Briefcase size={64} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Aucune offre disponible</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg hover:shadow-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-opacity-0 transition-all duration-300"
                    style={{ 
                      borderColor: `${colors.primary}00`,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = colors.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Image */}
                      {job.imageUrl && (
                        <div className="shrink-0">
                          <Image 
                            src={job.imageUrl} 
                            alt={job.title} 
                            width={200}
                            height={130}
                            className="w-full md:w-48 h-32 object-cover rounded-2xl"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        <h3 
                          className="text-2xl font-black text-slate-900 dark:text-white mb-3 group-hover:underline"
                          style={{ textDecorationColor: colors.accent }}
                        >
                          {job.title}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
                            <MapPin size={14} style={{ color: colors.accent }} />
                            {job.location}
                          </span>
                          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
                            <Clock size={14} style={{ color: colors.accent }} />
                            {job.type}
                          </span>
                          {job.department && (
                            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg flex items-center gap-2">
                              <Briefcase size={14} style={{ color: colors.accent }} />
                              {job.department}
                            </span>
                          )}
                        </div>

                        {job.salaryRange && (
                          <p className="text-lg font-black mb-4 flex items-center gap-2" style={{ color: colors.primary }}>
                            <DollarSign size={20} />
                            {job.salaryRange}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>Publié le {new Date(job.createdAt).toLocaleDateString('fr-FR')}</span>
                            {job.candidatesCount > 0 && (
                              <span className="flex items-center gap-1.5">
                                <Users size={14} />
                                {job.candidatesCount} candidat{job.candidatesCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <Link
                              href={`/jobs/${job.id}`}
                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-all"
                            >
                              Détails
                            </Link>
                            <Link
                              href={job.processingMode === 'AI_ASSISTED' ? `/jobs/ia/${job.id}` : `/jobs/manuel/${job.id}`}
                              className="px-6 py-2 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                              style={{ 
                                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                              }}
                            >
                              Postuler <ChevronRight size={16} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-slate-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400">
            © 2026 {company.legalName}. Plateforme de recrutement propulsée par RH Konza.
          </p>
        </div>
      </div>
    </div>
  );
}