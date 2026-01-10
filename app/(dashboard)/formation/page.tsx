
'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, PlayCircle, BookOpen, Clock, Star, 
  Search, Filter, Plus, CheckCircle2, Award, Download, 
  TrendingUp, Wallet, Users, MoreHorizontal, Video,
  ChevronRight, Loader2, X, ExternalLink, Youtube, FileText, Check,
  MapPin, Calendar, Building2, Ticket, Play, Info, Image as ImageIcon,
  LayoutGrid, List, Heart, Share2, Sparkles, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Types ---

type CourseFormat = 'ONLINE' | 'IN_PERSON' | 'HYBRID';
type CourseProviderType = 'INTERNAL' | 'EXTERNAL_VENDOR' | 'ONLINE_PLATFORM';
type TrainingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PLANNED';

interface Course {
  id: string;
  title: string;
  category: string;
  durationHours: number;
  format: CourseFormat; 
  providerType: CourseProviderType;
  providerName: string;
  location?: string;
  dateSchedule?: string;
  linkUrl?: string;
  thumbnailUrl?: string;
  description: string;
  status?: TrainingStatus;
}

export default function TrainingPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-learning'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tout');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Modal States ---
  const [showAddModal, setShowAddModal] = useState(false); 
  const [showViewerModal, setShowViewerModal] = useState<Course | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  // --- Form State ---
  const [newCourse, setNewCourse] = useState<{
      title: string;
      category: string;
      durationHours: number;
      format: CourseFormat;
      providerType: CourseProviderType;
      providerName: string;
      location: string;
      dateSchedule: string;
      linkUrl: string;
      thumbnailUrl: string;
      description: string;
  }>({
      title: '',
      category: 'Management',
      durationHours: 1,
      format: 'ONLINE',
      providerType: 'INTERNAL',
      providerName: 'RH Interne',
      location: '',
      dateSchedule: '',
      linkUrl: '',
      thumbnailUrl: '',
      description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données
  const fetchCourses = async () => {
    try {
        const data = await api.get<Course[]>('/training/courses');
        setCourses(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
        await fetchCourses();
    };
    init();
  }, []);

  const handleAddCourse = async () => {
      if (!newCourse.title) return;
      setIsSubmitting(true);
      try {
          await api.post('/training/courses', {
              ...newCourse,
              linkUrl: newCourse.format === 'IN_PERSON' ? undefined : newCourse.linkUrl,
              location: newCourse.format === 'ONLINE' ? undefined : newCourse.location,
              dateSchedule: newCourse.dateSchedule || undefined,
              thumbnailUrl: newCourse.thumbnailUrl || undefined
          });
          await fetchCourses();
          setShowAddModal(false);
          // Reset form
          setNewCourse({ 
              title: '', category: 'Management', durationHours: 1, 
              format: 'ONLINE', providerType: 'INTERNAL', providerName: 'RH Interne',
              location: '', dateSchedule: '', linkUrl: '', thumbnailUrl: '', description: '' 
          });
      } catch (e) {
          alert("Erreur lors de la création de la formation.");
      } finally {
          setIsSubmitting(false);
      }
  };

  // ACTION D'INSCRIPTION
  const handleStartLearning = async (course: Course) => {
      // Si déjà inscrit, on ne fait rien (normalement le bouton n'est pas affiché)
      if (course.status === 'IN_PROGRESS' || course.status === 'COMPLETED') {
          return;
      }

      setIsJoining(true);
      try {
          await api.post(`/training/join/${course.id}`, {});
          
          // Mise à jour locale immédiate pour UX fluide
          const updatedCourse = { ...course, status: 'IN_PROGRESS' as TrainingStatus };
          const updatedList = courses.map(c => c.id === course.id ? updatedCourse : c);
          
          setCourses(updatedList);
          
          // Mise à jour du modal ouvert pour passer en mode "Lecture"
          if(showViewerModal && showViewerModal.id === course.id) {
             setShowViewerModal(updatedCourse);
          }
          
      } catch (e) {
          alert("Erreur lors de l'inscription.");
      } finally {
          setIsJoining(false);
      }
  };

  const openCourseModal = (course: Course) => {
      setShowViewerModal(course);
  };

  const handleCompleteCourse = (courseId: string) => {
      const updated = courses.map(c => c.id === courseId ? {...c, status: 'COMPLETED' as TrainingStatus} : c);
      setCourses(updated);
      setShowViewerModal(null);
  };

  const isRH = currentUser && ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(currentUser.role);

  const getFormatBadge = (format: CourseFormat) => {
      switch(format) {
          case 'ONLINE': return <span className="text-[10px] bg-sky-500/10 text-sky-500 px-2 py-0.5 rounded flex items-center gap-1 border border-sky-500/20"><Video size={10}/> En ligne</span>;
          case 'IN_PERSON': return <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded flex items-center gap-1 border border-orange-500/20"><Users size={10}/> Présentiel</span>;
          case 'HYBRID': return <span className="text-[10px] bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/20"><TrendingUp size={10}/> Hybride</span>;
          default: return null;
      }
  };

  // Filtrage
  const displayedCourses = courses.filter(c => {
      if (activeTab === 'my-learning') return c.status === 'IN_PROGRESS' || c.status === 'COMPLETED';
      return true; 
  }).filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'Tout' || c.category === selectedCategory;
      return matchesSearch && matchesCat;
  });

  const featuredCourse = courses.length > 0 ? courses[0] : null;
  const categories = ['Tout', ...Array.from(new Set(courses.map(c => c.category)))];

  return (
    <div className="max-w-[1800px] mx-auto pb-20 space-y-8 px-4 sm:px-6">
      
      {/* HEADER & NAV */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pb-6 border-b border-gray-200 dark:border-white/5">
        <div>
           <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-500">Hub</span>
           </h1>
           <p className="text-gray-500 dark:text-gray-400 text-lg">Développez vos compétences avec nos contenus exclusifs.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-2xl flex items-center">
              <button 
                onClick={() => setActiveTab('catalog')} 
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Catalogue
              </button>
              <button 
                onClick={() => setActiveTab('my-learning')} 
                className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'my-learning' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Mes Formations
              </button>
           </div>
           {isRH && (
               <button onClick={() => setShowAddModal(true)} className="px-5 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                   <Plus size={20} /> <span className="hidden sm:inline">Nouveau cours</span>
               </button>
           )}
        </div>
      </div>

      {/* FEATURED SECTION (Catalog Only) */}
      {activeTab === 'catalog' && featuredCourse && !searchQuery && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative w-full h-[400px] rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl"
            onClick={() => openCourseModal(featuredCourse)}
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <img 
                    src={featuredCourse.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"} 
                    alt="Featured" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={12} /> À la une
                    </span>
                    {getFormatBadge(featuredCourse.format)}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                    {featuredCourse.title}
                </h2>
                <p className="text-gray-200 text-lg line-clamp-2 max-w-xl">
                    {featuredCourse.description}
                </p>
                <div className="flex items-center gap-4 pt-4">
                    <button className="px-8 py-3 bg-white text-black font-bold rounded-xl flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        {featuredCourse.status === 'IN_PROGRESS' ? <Play size={20} fill="currentColor"/> : <Info size={20} />} 
                        {featuredCourse.status === 'IN_PROGRESS' ? 'Reprendre' : 'Découvrir'}
                    </button>
                </div>
            </div>
        </motion.div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row items-center gap-6 sticky top-2 z-20 py-2">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher une compétence, un cours..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-sky-500/20 outline-none transition-all"
            />
         </div>
         <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                        px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all border
                        ${selectedCategory === cat 
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg' 
                            : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-400'}
                    `}
                >
                    {cat}
                </button>
            ))}
         </div>
      </div>

      {/* GRID CONTENT */}
      {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin text-sky-500" size={64} /></div>
      ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
             <AnimatePresence>
             {displayedCourses.map(course => {
                 const isEnrolled = course.status === 'IN_PROGRESS' || course.status === 'COMPLETED';
                 return (
                 <motion.div 
                   key={course.id}
                   layoutId={course.id}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full"
                   onClick={() => openCourseModal(course)}
                 >
                   {/* Thumbnail Area */}
                   <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
                       {course.thumbnailUrl ? (
                           <img src={course.thumbnailUrl} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${!isEnrolled ? 'grayscale-[50%]' : ''}`} />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-300">
                               {course.format === 'IN_PERSON' ? <Ticket size={48} /> : <PlayCircle size={48} />}
                           </div>
                       )}
                       
                       {/* Overlay si non inscrit : Lock icon */}
                       {!isEnrolled && (
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                               <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold flex items-center gap-2">
                                   <Lock size={16} /> Voir détails
                               </div>
                           </div>
                       )}

                       {/* Overlay si inscrit : Play icon */}
                       {isEnrolled && (
                           <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                                   <Play size={32} fill="currentColor" />
                               </div>
                           </div>
                       )}

                       {/* Status Badges */}
                       <div className="absolute top-3 left-3 flex gap-2">
                           {course.status === 'COMPLETED' && <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1"><CheckCircle2 size={10}/> Terminé</span>}
                           {course.status === 'IN_PROGRESS' && <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm flex items-center gap-1"><PlayCircle size={10}/> En cours</span>}
                       </div>
                       
                       <div className="absolute bottom-3 right-3">
                           <span className="bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                               <Clock size={12}/> {course.durationHours}h
                           </span>
                       </div>
                   </div>

                   {/* Info Area */}
                   <div className="p-5 flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">{course.category}</span>
                           {getFormatBadge(course.format)}
                       </div>
                       <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-snug mb-2 group-hover:text-sky-500 transition-colors">
                           {course.title}
                       </h3>
                       <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                           {course.description}
                       </p>
                       
                       <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                           <div className="flex items-center gap-2 text-xs text-gray-400">
                               <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold">
                                   {course.providerName.charAt(0)}
                               </div>
                               <span>{course.providerName}</span>
                           </div>
                           {/* Dynamic Action Text */}
                           <span className={`text-xs font-bold transition-transform flex items-center gap-1 ${isEnrolled ? 'text-sky-500 group-hover:translate-x-1' : 'text-gray-900 dark:text-white'}`}>
                               {isEnrolled ? 'Accéder' : 'S\'inscrire'} <ChevronRight size={14}/>
                           </span>
                       </div>
                   </div>
                 </motion.div>
             )})}
             </AnimatePresence>
          </motion.div>
      )}

      {!isLoading && displayedCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <BookOpen size={64} className="mb-4 opacity-20"/>
              <p>Aucun cours ne correspond à votre recherche.</p>
          </div>
      )}

      {/* --- ADD MODAL --- */}
      <AnimatePresence>
        {showAddModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
                    {/* ... (Formulaire création inchangé) ... */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Créer un cours</h2>
                        <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Titre de la formation</label>
                            <input 
                                value={newCourse.title} 
                                onChange={e => setNewCourse({...newCourse, title: e.target.value})} 
                                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white font-medium" 
                                placeholder="Ex: Leadership & Management" 
                            />
                        </div>
                        
                        {/* Thumbnail Input */}
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Image de couverture (URL)</label>
                            <div className="relative group">
                                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" size={20} />
                                <input 
                                    value={newCourse.thumbnailUrl} 
                                    onChange={e => setNewCourse({...newCourse, thumbnailUrl: e.target.value})} 
                                    className="w-full pl-12 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-sm" 
                                    placeholder="https://..." 
                                />
                            </div>
                            {newCourse.thumbnailUrl && (
                                <div className="mt-3 h-32 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                                    <img src={newCourse.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Aperçu</div>
                                </div>
                            )}
                        </div>

                        {/* Grid Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Catégorie</label>
                                <select 
                                    value={newCourse.category} 
                                    onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                                >
                                    {categories.filter(c => c !== 'Tout').map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="Autre">Autre</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Format</label>
                                <select 
                                    value={newCourse.format} 
                                    onChange={e => setNewCourse({...newCourse, format: e.target.value as CourseFormat})}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none"
                                >
                                    <option value="ONLINE">En Ligne</option>
                                    <option value="IN_PERSON">Présentiel</option>
                                    <option value="HYBRID">Hybride</option>
                                </select>
                            </div>
                        </div>

                        {newCourse.format === 'ONLINE' ? (
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Lien du contenu</label>
                                <input value={newCourse.linkUrl} onChange={e => setNewCourse({...newCourse, linkUrl: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-blue-500" placeholder="https://youtube.com/..." />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Lieu</label>
                                    <input value={newCourse.location} onChange={e => setNewCourse({...newCourse, location: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Date</label>
                                    <input type="datetime-local" value={newCourse.dateSchedule} onChange={e => setNewCourse({...newCourse, dateSchedule: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none" />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none h-24 resize-none" placeholder="De quoi parle ce cours ?" />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Annuler</button>
                        <button onClick={handleAddCourse} disabled={isSubmitting} className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-transform flex justify-center items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin"/> : <CheckCircle2 />} Publier
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL PLAYER / DETAILS --- */}
      <AnimatePresence>
        {showViewerModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-0 md:p-6">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-gray-900 w-full max-w-7xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10 relative">
                    
                    <button onClick={() => setShowViewerModal(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
                        <X size={24}/>
                    </button>

                    {/* Left: Player Area / Cover */}
                    <div className="flex-1 bg-black relative flex items-center justify-center">
                        
                        {/* --- STATE 1: NOT ENROLLED (VITRINE) --- */}
                        {(showViewerModal.status === 'NOT_STARTED' || !showViewerModal.status) && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-8 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(${showViewerModal.thumbnailUrl})` }}>
                                
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-6">
                                        {getFormatBadge(showViewerModal.format)}
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight max-w-3xl">
                                        {showViewerModal.title}
                                    </h2>
                                    <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-10 line-clamp-3 leading-relaxed">
                                        {showViewerModal.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-center gap-4">
                                        <button 
                                            onClick={() => handleStartLearning(showViewerModal)}
                                            disabled={isJoining}
                                            className="px-10 py-4 bg-white text-black font-bold text-lg rounded-full hover:scale-105 transition-transform flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                                        >
                                            {isJoining ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />} 
                                            S'inscrire gratuitement
                                        </button>
                                        <div className="text-white/60 text-sm font-medium">
                                            Durée : {showViewerModal.durationHours}h
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* --- STATE 2: ENROLLED (CONTENT ACCESSIBLE) --- */}
                        {(showViewerModal.status === 'IN_PROGRESS' || showViewerModal.status === 'COMPLETED') && (
                            <div className="w-full h-full relative">
                                {showViewerModal.format === 'ONLINE' && showViewerModal.linkUrl?.includes('youtube') ? (
                                    <iframe src={showViewerModal.linkUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                                ) : showViewerModal.format === 'IN_PERSON' ? (
                                    <div className="flex flex-col items-center justify-center h-full text-white p-8 bg-gray-900">
                                        <div className="bg-white text-black p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Convocation</p>
                                                    <h3 className="text-2xl font-black mt-1">Formation Présentielle</h3>
                                                </div>
                                                <Ticket size={32} className="text-orange-500" />
                                            </div>
                                            
                                            <div className="space-y-4 mb-8">
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="text-gray-400" size={20} />
                                                    <span className="font-bold">{showViewerModal.dateSchedule ? new Date(showViewerModal.dateSchedule).toLocaleString() : 'Date à venir'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <MapPin className="text-gray-400" size={20} />
                                                    <span className="font-bold">{showViewerModal.location || 'Lieu à confirmer'}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
                                                <p className="text-xs text-gray-500 font-mono text-center">QR Code d'accès (Simulation)</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-white p-8">
                                        <ExternalLink size={64} className="mb-4 opacity-50"/>
                                        <h3 className="text-xl font-bold mb-4">Contenu Externe</h3>
                                        <p className="text-gray-400 mb-6 text-center max-w-md">Ce cours est hébergé sur une plateforme partenaire. Cliquez ci-dessous pour y accéder.</p>
                                        <a href={showViewerModal.linkUrl} target="_blank" className="px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold transition-colors shadow-lg shadow-sky-600/20">
                                            Accéder au cours
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar Info */}
                    <div className="w-full md:w-96 bg-gray-800/50 backdrop-blur-md border-l border-white/5 flex flex-col">
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="flex gap-2 mb-4">
                                {getFormatBadge(showViewerModal.format)}
                                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded border border-white/10">{showViewerModal.durationHours}h</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">{showViewerModal.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                {showViewerModal.description || "Aucune description."}
                            </p>
                            
                            <div className="space-y-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Formateur</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white">
                                            {showViewerModal.providerName.charAt(0)}
                                        </div>
                                        <span className="text-white font-medium text-sm">{showViewerModal.providerName}</span>
                                    </div>
                                </div>

                                {showViewerModal.status === 'IN_PROGRESS' && (
                                    <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                                        <p className="text-xs text-emerald-400 uppercase font-bold mb-1">Statut</p>
                                        <p className="text-white font-bold flex items-center gap-2"><PlayCircle size={16} className="text-emerald-500"/> En cours</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-6 border-t border-white/5 bg-black/20">
                            {showViewerModal.status === 'IN_PROGRESS' ? (
                                <button 
                                    onClick={() => handleCompleteCourse(showViewerModal.id)}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={20} /> Marquer terminé
                                </button>
                            ) : showViewerModal.status === 'COMPLETED' ? (
                                <div className="w-full py-4 bg-white/10 text-emerald-400 font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-500/30">
                                    <CheckCircle2 size={20} /> Cours terminé
                                </div>
                            ) : (
                                <p className="text-center text-xs text-gray-500">Inscrivez-vous pour suivre votre progression.</p>
                            )}
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
