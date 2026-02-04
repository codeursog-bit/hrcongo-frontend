'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Briefcase, Upload, Loader2, Send, Hexagon,
  BrainCircuit, CheckCircle2, XCircle, Sparkles, TrendingUp,
  Zap, Target, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface JobOffer {
  id: string;
  title: string;
  location: string;
  type: string;
  description: string;
  requirements?: string;
}

interface ApplicationResult {
  isEligible: boolean;
  message: string;
  cvScore?: number;
  reasoning?: string;
  strengths?: string[];
  shouldTakeTest: boolean;
  candidateId?: string; // ✅ AJOUTÉ
}

export default function JobApplyIAPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [job, setJob] = useState<JobOffer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  
  const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`${API_URL}/public/jobs/${params.id}`);
        if (!res.ok) throw new Error('Offre introuvable');
        const data = await res.json();
        setJob(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [params.id]);

  // ✅ Countdown pour redirection (CORRIGÉ)
  useEffect(() => {
    if (applicationResult?.shouldTakeTest && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (applicationResult?.shouldTakeTest && redirectCountdown === 0) {
      // ✅ ROUTE CORRIGÉE
      if (applicationResult.candidateId) {
        router.push(`/jobs/ia/${params.id}/test/${applicationResult.candidateId}`);
      }
    }
  }, [applicationResult, redirectCountdown, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      alert("Veuillez uploader votre CV");
      return;
    }

    setIsApplying(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('coverLetter', formData.coverLetter);
      formDataToSend.append('resume', resumeFile);

      const res = await fetch(`${API_URL}/public/jobs/${params.id}/apply`, {
        method: 'POST',
        body: formDataToSend
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setApplicationResult(result);
      } else {
        alert(result.message || "Erreur lors de l'envoi.");
      }
    } catch (e) {
      alert("Erreur technique.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Le fichier est trop volumineux (max 5MB)");
        return;
      }
      setResumeFile(file);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
        <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
      </div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
      <XCircle size={64} className="text-red-500 mb-6"/>
      <h1 className="text-3xl font-bold mb-4">Offre introuvable</h1>
      <p className="text-slate-400 mb-8">Ce poste a peut-être été pourvu ou n'existe plus.</p>
      <Link href="/" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-bold">
        Retour à l'accueil
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-slate-200 relative overflow-hidden">
      
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Hexagon size={24} fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-white">HRCongo</span>
          </Link>
          
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
            <BrainCircuit size={16} className="text-cyan-400"/>
            <span className="text-xs font-bold text-cyan-400 uppercase">Recrutement IA</span>
          </div>
        </div>
      </nav>

      {/* SUCCESS/FAIL MODAL */}
      <AnimatePresence>
        {applicationResult && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 rounded-3xl p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
              style={{
                borderColor: applicationResult.isEligible ? 'rgba(6, 182, 212, 0.5)' : 'rgba(239, 68, 68, 0.5)'
              }}
            >
              {/* Glow effect */}
              <div 
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none"
                style={{
                  backgroundColor: applicationResult.isEligible ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                }}
              ></div>

              <div className="text-center mb-8 relative z-10">
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 shadow-2xl ${
                    applicationResult.isEligible 
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-cyan-500/50' 
                      : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 shadow-red-500/50'
                  }`}
                >
                  {applicationResult.isEligible ? (
                    <CheckCircle2 size={48} className="text-white" />
                  ) : (
                    <XCircle size={48} className="text-white" />
                  )}
                </div>
                
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                  {applicationResult.isEligible ? 'CV Validé !' : 'Profil Non Retenu'}
                </h2>
                
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">
                  {applicationResult.message}
                </p>

                {/* Score CV */}
                {applicationResult.cvScore !== undefined && (
                  <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/10 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Score CV Initial</span>
                      <span className={`text-3xl font-black ${applicationResult.isEligible ? 'text-cyan-400' : 'text-red-400'}`}>
                        {applicationResult.cvScore}/35
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(applicationResult.cvScore / 35) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${
                          applicationResult.isEligible 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                            : 'bg-red-500'
                        }`}
                      />
                    </div>

                    {applicationResult.reasoning && (
                      <p className="text-xs text-slate-400 mt-4 leading-relaxed italic">
                        {applicationResult.reasoning}
                      </p>
                    )}
                  </div>
                )}

                {/* Points Forts (si éligible) */}
                {applicationResult.strengths && applicationResult.strengths.length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 rounded-xl border border-emerald-500/30 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={18} className="text-emerald-400"/>
                      <h4 className="text-sm font-bold text-emerald-400 uppercase">Points Forts Identifiés</h4>
                    </div>
                    <ul className="space-y-2">
                      {applicationResult.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Redirection Test (si éligible) - ✅ CORRIGÉ */}
                {applicationResult.shouldTakeTest && applicationResult.candidateId && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 p-6 rounded-xl border border-cyan-500/30 mb-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Target size={24} className="text-cyan-400"/>
                      </div>
                      <div className="text-left">
                        <h4 className="text-lg font-bold text-white">Prochaine Étape : Test Technique</h4>
                        <p className="text-xs text-slate-400">Évaluez vos compétences pour finaliser votre candidature</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="text-6xl font-black text-cyan-400">{redirectCountdown}</div>
                      <div className="text-left">
                        <p className="text-sm text-slate-400">secondes avant</p>
                        <p className="text-xs text-slate-500">redirection automatique</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
                      <Loader2 className="animate-spin" size={14}/>
                      <span>Chargement du test...</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions - ✅ CORRIGÉ */}
              <div className="flex gap-4 relative z-10">
                {applicationResult.shouldTakeTest && applicationResult.candidateId ? (
                  <Link 
                    href={`/jobs/ia/${params.id}/test/${applicationResult.candidateId}`}
                    className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Zap size={20}/> Commencer le Test Maintenant
                  </Link>
                ) : (
                  <Link 
                    href="/" 
                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center transition-all"
                  >
                    Retour aux Offres
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT: Job Details */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="lg:col-span-7 space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase">
                    <BrainCircuit size={14}/>
                    Sélection IA Active
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                  {job.title}
                </h1>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <MapPin size={16} className="text-purple-400"/> 
                    <span className="text-white font-medium">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <Briefcase size={16} className="text-emerald-400"/> 
                    <span className="text-white font-medium">{job.type}</span>
                  </div>
                </div>
              </div>

              <div className="prose prose-invert prose-lg max-w-none">
                <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                  <h3 className="text-white font-bold text-2xl mb-4">À propos du rôle</h3>
                  <div className="text-slate-300 whitespace-pre-line leading-relaxed">{job.description}</div>
                </div>

                {job.requirements && (
                  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                    <h3 className="text-white font-bold text-2xl mb-4">Ce que nous recherchons</h3>
                    <div className="text-slate-300 whitespace-pre-line leading-relaxed">{job.requirements}</div>
                  </div>
                )}
              </div>

              {/* Info IA */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-8 rounded-3xl border-2 border-cyan-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/50">
                    <BrainCircuit size={32} className="text-white"/>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-3">Processus de Sélection Intelligent</h4>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                      Notre IA analyse votre CV en temps réel. Si votre profil correspond aux critères, vous passerez directement un test technique d'évaluation.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={18} className="text-cyan-400"/>
                          <p className="text-xs text-slate-400 uppercase font-bold">Étape 1</p>
                        </div>
                        <p className="text-sm text-white font-bold">Analyse CV (35 pts)</p>
                      </div>
                      <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={18} className="text-purple-400"/>
                          <p className="text-xs text-slate-400 uppercase font-bold">Étape 2</p>
                        </div>
                        <p className="text-sm text-white font-bold">Test Technique (65 pts)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: Form */}
            <div className="lg:col-span-5">
              <div className="sticky top-28">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl"
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Postuler</h3>
                      <p className="text-slate-400 text-sm">Votre CV sera analysé instantanément par notre IA</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Prénom *</label>
                        <input 
                          required 
                          name="firstName"
                          value={formData.firstName} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nom *</label>
                        <input 
                          required 
                          name="lastName"
                          value={formData.lastName} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email *</label>
                      <input 
                        required 
                        type="email" 
                        name="email"
                        value={formData.email} 
                        onChange={handleInputChange} 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        placeholder="jean.dupont@email.com"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Téléphone *</label>
                      <input 
                        required 
                        type="tel" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        placeholder="+242 06..."
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">CV (PDF, Max 5MB) *</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          className="hidden" 
                          id="resume-upload"
                          required
                        />
                        <label 
                          htmlFor="resume-upload"
                          className="block border-2 border-dashed border-white/20 bg-white/5 rounded-xl p-8 text-center hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
                        >
                          {resumeFile ? (
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle2 size={32} className="text-emerald-400"/>
                              <span className="text-sm font-medium text-emerald-400">{resumeFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload size={32} className="mx-auto text-slate-400 group-hover:text-cyan-400 mb-3 transition-colors" />
                              <p className="text-sm text-slate-400 group-hover:text-white transition-colors font-medium">
                                Cliquez pour importer votre CV
                              </p>
                              <p className="text-xs text-slate-600 mt-2">PDF, DOC ou DOCX</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Lettre de motivation (Optionnel)</label>
                      <textarea 
                        name="coverLetter"
                        value={formData.coverLetter} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none h-32 resize-none"
                        placeholder="Pourquoi ce poste vous intéresse..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isApplying} 
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-xl hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApplying ? (
                        <Loader2 className="animate-spin" size={24}/>
                      ) : (
                        <>
                          <Send size={20} /> 
                          Envoyer ma Candidature
                        </>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-center text-slate-500">
                      En cliquant, vous acceptez que HRCongo traite vos données personnelles.
                    </p>
                  </form>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}


// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   MapPin, Briefcase, Upload, Loader2, Send, Hexagon,
//   BrainCircuit, CheckCircle2, XCircle, Sparkles, TrendingUp,
//   Zap, Target, ArrowRight
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import Link from 'next/link';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// interface JobOffer {
//   id: string;
//   title: string;
//   location: string;
//   type: string;
//   description: string;
//   requirements?: string;
// }

// interface ApplicationResult {
//   isEligible: boolean;
//   message: string;
//   cvScore?: number;
//   reasoning?: string;
//   strengths?: string[];
//   shouldTakeTest: boolean;
//   testUrl?: string;
// }

// export default function JobApplyIAPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [job, setJob] = useState<JobOffer | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isApplying, setIsApplying] = useState(false);
  
//   const [applicationResult, setApplicationResult] = useState<ApplicationResult | null>(null);
//   const [redirectCountdown, setRedirectCountdown] = useState(3);
  
//   const [resumeFile, setResumeFile] = useState<File | null>(null);
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     coverLetter: ''
//   });

//   useEffect(() => {
//     const fetchJob = async () => {
//       try {
//         const res = await fetch(`${API_URL}/public/jobs/${params.id}`);
//         if (!res.ok) throw new Error('Offre introuvable');
//         const data = await res.json();
//         setJob(data);
//       } catch (e) {
//         console.error(e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchJob();
//   }, [params.id]);

//   // Countdown pour redirection
//   useEffect(() => {
//     if (applicationResult?.shouldTakeTest && redirectCountdown > 0) {
//       const timer = setTimeout(() => {
//         setRedirectCountdown(redirectCountdown - 1);
//       }, 1000);
//       return () => clearTimeout(timer);
//     } else if (applicationResult?.shouldTakeTest && redirectCountdown === 0) {
//       if (applicationResult.testUrl) {
//         router.push(applicationResult.testUrl);
//       }
//     }
//   }, [applicationResult, redirectCountdown, router]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!resumeFile) {
//       alert("Veuillez uploader votre CV");
//       return;
//     }

//     setIsApplying(true);

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append('firstName', formData.firstName);
//       formDataToSend.append('lastName', formData.lastName);
//       formDataToSend.append('email', formData.email);
//       formDataToSend.append('phone', formData.phone);
//       formDataToSend.append('coverLetter', formData.coverLetter);
//       formDataToSend.append('resume', resumeFile);

//       const res = await fetch(`${API_URL}/public/jobs/${params.id}/apply`, {
//         method: 'POST',
//         body: formDataToSend
//       });
      
//       const result = await res.json();
      
//       if (res.ok) {
//         setApplicationResult(result);
//       } else {
//         alert(result.message || "Erreur lors de l'envoi.");
//       }
//     } catch (e) {
//       alert("Erreur technique.");
//     } finally {
//       setIsApplying(false);
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       if (file.size > 5 * 1024 * 1024) {
//         alert("Le fichier est trop volumineux (max 5MB)");
//         return;
//       }
//       setResumeFile(file);
//     }
//   };

//   if (isLoading) return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//       <div className="relative">
//         <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse"></div>
//         <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
//       </div>
//     </div>
//   );

//   if (!job) return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
//       <XCircle size={64} className="text-red-500 mb-6"/>
//       <h1 className="text-3xl font-bold mb-4">Offre introuvable</h1>
//       <p className="text-slate-400 mb-8">Ce poste a peut-être été pourvu ou n'existe plus.</p>
//       <Link href="/" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-bold">
//         Retour à l'accueil
//       </Link>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-slate-200 relative overflow-hidden">
      
//       {/* Animated Background */}
//       <div className="fixed inset-0 z-0 pointer-events-none">
//         <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
//         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
//       </div>

//       {/* Navbar */}
//       <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
//         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
//           <Link href="/" className="flex items-center gap-3 group">
//             <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
//               <Hexagon size={24} fill="currentColor" />
//             </div>
//             <span className="text-xl font-bold text-white">HRCongo</span>
//           </Link>
          
//           <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30">
//             <BrainCircuit size={16} className="text-cyan-400"/>
//             <span className="text-xs font-bold text-cyan-400 uppercase">Recrutement IA</span>
//           </div>
//         </div>
//       </nav>

//       {/* SUCCESS/FAIL MODAL */}
//       <AnimatePresence>
//         {applicationResult && (
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
//           >
//             <motion.div 
//               initial={{ scale: 0.9, y: 20 }} 
//               animate={{ scale: 1, y: 0 }}
//               className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 rounded-3xl p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
//               style={{
//                 borderColor: applicationResult.isEligible ? 'rgba(6, 182, 212, 0.5)' : 'rgba(239, 68, 68, 0.5)'
//               }}
//             >
//               {/* Glow effect */}
//               <div 
//                 className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none"
//                 style={{
//                   backgroundColor: applicationResult.isEligible ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)'
//                 }}
//               ></div>

//               <div className="text-center mb-8 relative z-10">
//                 <div 
//                   className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 shadow-2xl ${
//                     applicationResult.isEligible 
//                       ? 'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-cyan-500/50' 
//                       : 'bg-gradient-to-br from-red-500 to-red-600 border-red-400 shadow-red-500/50'
//                   }`}
//                 >
//                   {applicationResult.isEligible ? (
//                     <CheckCircle2 size={48} className="text-white" />
//                   ) : (
//                     <XCircle size={48} className="text-white" />
//                   )}
//                 </div>
                
//                 <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
//                   {applicationResult.isEligible ? 'CV Validé !' : 'Profil Non Retenu'}
//                 </h2>
                
//                 <p className="text-slate-300 text-lg mb-6 leading-relaxed">
//                   {applicationResult.message}
//                 </p>

//                 {/* Score CV */}
//                 {applicationResult.cvScore !== undefined && (
//                   <div className="bg-black/40 backdrop-blur-sm p-6 rounded-2xl border border-white/10 mb-6">
//                     <div className="flex items-center justify-between mb-4">
//                       <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Score CV Initial</span>
//                       <span className={`text-3xl font-black ${applicationResult.isEligible ? 'text-cyan-400' : 'text-red-400'}`}>
//                         {applicationResult.cvScore}/35
//                       </span>
//                     </div>
                    
//                     {/* Progress Bar */}
//                     <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
//                       <motion.div 
//                         initial={{ width: 0 }}
//                         animate={{ width: `${(applicationResult.cvScore / 35) * 100}%` }}
//                         transition={{ duration: 1, delay: 0.5 }}
//                         className={`h-full ${
//                           applicationResult.isEligible 
//                             ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
//                             : 'bg-red-500'
//                         }`}
//                       />
//                     </div>

//                     {applicationResult.reasoning && (
//                       <p className="text-xs text-slate-400 mt-4 leading-relaxed italic">
//                         {applicationResult.reasoning}
//                       </p>
//                     )}
//                   </div>
//                 )}

//                 {/* Points Forts (si éligible) */}
//                 {applicationResult.strengths && applicationResult.strengths.length > 0 && (
//                   <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 rounded-xl border border-emerald-500/30 mb-6 text-left">
//                     <div className="flex items-center gap-2 mb-3">
//                       <Sparkles size={18} className="text-emerald-400"/>
//                       <h4 className="text-sm font-bold text-emerald-400 uppercase">Points Forts Identifiés</h4>
//                     </div>
//                     <ul className="space-y-2">
//                       {applicationResult.strengths.map((s: string, i: number) => (
//                         <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
//                           <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
//                           {s}
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}

//                 {/* Redirection Test (si éligible) */}
//                 {applicationResult.shouldTakeTest && (
//                   <motion.div 
//                     initial={{ opacity: 0, y: 10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 1 }}
//                     className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 p-6 rounded-xl border border-cyan-500/30 mb-6"
//                   >
//                     <div className="flex items-center gap-3 mb-4">
//                       <div className="p-2 bg-cyan-500/20 rounded-lg">
//                         <Target size={24} className="text-cyan-400"/>
//                       </div>
//                       <div className="text-left">
//                         <h4 className="text-lg font-bold text-white">Prochaine Étape : Test Technique</h4>
//                         <p className="text-xs text-slate-400">Évaluez vos compétences pour finaliser votre candidature</p>
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center justify-center gap-3 mb-4">
//                       <div className="text-6xl font-black text-cyan-400">{redirectCountdown}</div>
//                       <div className="text-left">
//                         <p className="text-sm text-slate-400">secondes avant</p>
//                         <p className="text-xs text-slate-500">redirection automatique</p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
//                       <Loader2 className="animate-spin" size={14}/>
//                       <span>Chargement du test...</span>
//                     </div>
//                   </motion.div>
//                 )}
//               </div>

//               {/* Actions */}
//               <div className="flex gap-4 relative z-10">
//                 {applicationResult.shouldTakeTest ? (
//                   <Link 
//                     href={applicationResult.testUrl || '/'} 
//                     className="flex-1 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-lg"
//                   >
//                     <Zap size={20}/> Commencer le Test Maintenant
//                   </Link>
//                 ) : (
//                   <Link 
//                     href="/" 
//                     className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center transition-all"
//                   >
//                     Retour aux Offres
//                   </Link>
//                 )}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Main Content */}
//       <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
//             {/* LEFT: Job Details */}
//             <motion.div 
//               initial={{ opacity: 0, y: 30 }} 
//               animate={{ opacity: 1, y: 0 }} 
//               className="lg:col-span-7 space-y-8"
//             >
//               <div className="space-y-6">
//                 <div className="flex items-center gap-3">
//                   <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase">
//                     <BrainCircuit size={14}/>
//                     Sélection IA Active
//                   </div>
//                 </div>
                
//                 <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
//                   {job.title}
//                 </h1>

//                 <div className="flex flex-wrap gap-4">
//                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
//                     <MapPin size={16} className="text-purple-400"/> 
//                     <span className="text-white font-medium">{job.location}</span>
//                   </div>
//                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
//                     <Briefcase size={16} className="text-emerald-400"/> 
//                     <span className="text-white font-medium">{job.type}</span>
//                   </div>
//                 </div>
//               </div>

//               <div className="prose prose-invert prose-lg max-w-none">
//                 <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
//                   <h3 className="text-white font-bold text-2xl mb-4">À propos du rôle</h3>
//                   <div className="text-slate-300 whitespace-pre-line leading-relaxed">{job.description}</div>
//                 </div>

//                 {job.requirements && (
//                   <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
//                     <h3 className="text-white font-bold text-2xl mb-4">Ce que nous recherchons</h3>
//                     <div className="text-slate-300 whitespace-pre-line leading-relaxed">{job.requirements}</div>
//                   </div>
//                 )}
//               </div>

//               {/* Info IA */}
//               <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 p-8 rounded-3xl border-2 border-cyan-500/30 backdrop-blur-sm">
//                 <div className="flex items-start gap-4">
//                   <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/50">
//                     <BrainCircuit size={32} className="text-white"/>
//                   </div>
//                   <div>
//                     <h4 className="text-xl font-bold text-white mb-3">Processus de Sélection Intelligent</h4>
//                     <p className="text-slate-300 mb-6 leading-relaxed">
//                       Notre IA analyse votre CV en temps réel. Si votre profil correspond aux critères, vous passerez directement un test technique d'évaluation.
//                     </p>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
//                         <div className="flex items-center gap-2 mb-2">
//                           <TrendingUp size={18} className="text-cyan-400"/>
//                           <p className="text-xs text-slate-400 uppercase font-bold">Étape 1</p>
//                         </div>
//                         <p className="text-sm text-white font-bold">Analyse CV (35 pts)</p>
//                       </div>
//                       <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl border border-white/5">
//                         <div className="flex items-center gap-2 mb-2">
//                           <Target size={18} className="text-purple-400"/>
//                           <p className="text-xs text-slate-400 uppercase font-bold">Étape 2</p>
//                         </div>
//                         <p className="text-sm text-white font-bold">Test Technique (65 pts)</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>

//             {/* RIGHT: Form */}
//             <div className="lg:col-span-5">
//               <div className="sticky top-28">
//                 <motion.div 
//                   initial={{ opacity: 0, x: 20 }} 
//                   animate={{ opacity: 1, x: 0 }}
//                   className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl"
//                 >
//                   <form onSubmit={handleSubmit} className="space-y-5">
//                     <div>
//                       <h3 className="text-2xl font-bold text-white mb-2">Postuler</h3>
//                       <p className="text-slate-400 text-sm">Votre CV sera analysé instantanément par notre IA</p>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div>
//                         <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Prénom *</label>
//                         <input 
//                           required 
//                           name="firstName"
//                           value={formData.firstName} 
//                           onChange={handleInputChange} 
//                           className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
//                           placeholder="Jean"
//                         />
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nom *</label>
//                         <input 
//                           required 
//                           name="lastName"
//                           value={formData.lastName} 
//                           onChange={handleInputChange} 
//                           className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
//                           placeholder="Dupont"
//                         />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email *</label>
//                       <input 
//                         required 
//                         type="email" 
//                         name="email"
//                         value={formData.email} 
//                         onChange={handleInputChange} 
//                         className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
//                         placeholder="jean.dupont@email.com"
//                       />
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Téléphone *</label>
//                       <input 
//                         required 
//                         type="tel" 
//                         name="phone"
//                         value={formData.phone} 
//                         onChange={handleInputChange} 
//                         className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none"
//                         placeholder="+242 06..."
//                       />
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">CV (PDF, Max 5MB) *</label>
//                       <div className="relative">
//                         <input 
//                           type="file" 
//                           accept=".pdf,.doc,.docx"
//                           onChange={handleFileChange}
//                           className="hidden" 
//                           id="resume-upload"
//                           required
//                         />
//                         <label 
//                           htmlFor="resume-upload"
//                           className="block border-2 border-dashed border-white/20 bg-white/5 rounded-xl p-8 text-center hover:bg-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
//                         >
//                           {resumeFile ? (
//                             <div className="flex flex-col items-center gap-2">
//                               <CheckCircle2 size={32} className="text-emerald-400"/>
//                               <span className="text-sm font-medium text-emerald-400">{resumeFile.name}</span>
//                             </div>
//                           ) : (
//                             <>
//                               <Upload size={32} className="mx-auto text-slate-400 group-hover:text-cyan-400 mb-3 transition-colors" />
//                               <p className="text-sm text-slate-400 group-hover:text-white transition-colors font-medium">
//                                 Cliquez pour importer votre CV
//                               </p>
//                               <p className="text-xs text-slate-600 mt-2">PDF, DOC ou DOCX</p>
//                             </>
//                           )}
//                         </label>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Lettre de motivation (Optionnel)</label>
//                       <textarea 
//                         name="coverLetter"
//                         value={formData.coverLetter} 
//                         onChange={handleInputChange} 
//                         className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500/50 outline-none h-32 resize-none"
//                         placeholder="Pourquoi ce poste vous intéresse..."
//                       />
//                     </div>

//                     <button 
//                       type="submit" 
//                       disabled={isApplying} 
//                       className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg shadow-xl hover:shadow-cyan-500/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
//                     >
//                       {isApplying ? (
//                         <Loader2 className="animate-spin" size={24}/>
//                       ) : (
//                         <>
//                           <Send size={20} /> 
//                           Envoyer ma Candidature
//                         </>
//                       )}
//                     </button>
                    
//                     <p className="text-[10px] text-center text-slate-500">
//                       En cliquant, vous acceptez que HRCongo traite vos données personnelles.
//                     </p>
//                   </form>
//                 </motion.div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </main>

//     </div>
//   );
// }

