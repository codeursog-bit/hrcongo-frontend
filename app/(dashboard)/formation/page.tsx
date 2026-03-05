'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Plus, Search, Loader2, X, CheckCircle2, Clock,
  Users, Calendar, FileText, Download, TrendingUp, Wallet, Award,
  BookOpen, Play, Ticket, MapPin, ExternalLink, Sparkles, Video,
  BarChart3, Target, Zap, ArrowUpRight, Bell, ClipboardList,
  Ban, ChevronRight, Info, Briefcase, BadgeCheck, ScrollText,
  Send, ShieldCheck, PlayCircle, Check, AlertCircle, Flame,
  Trophy, BookMarked, RotateCcw, UserCheck, Edit3, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseFormat    = 'ONLINE' | 'IN_PERSON' | 'HYBRID';
type ProviderType    = 'INTERNAL' | 'EXTERNAL_VENDOR' | 'ONLINE_PLATFORM';
type TrainingStatus  = 'REQUESTED' | 'APPROVED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETION_REQUESTED' | 'COMPLETED' | 'CANCELLED' | 'NOT_STARTED';
type ActiveView      = 'dashboard' | 'catalog' | 'my-learning' | 'requests' | 'pfa';

interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  durationHours?: number;
  cost?: number;
  format: CourseFormat;
  providerType: ProviderType;
  providerName?: string;
  location?: string;
  dateSchedule?: string;
  linkUrl?: string;
  thumbnailUrl?: string;
  status?: TrainingStatus;
  enrolledCount?: number;
  completedCount?: number;
}

interface TrainingRequest {
  id: string;
  status: TrainingStatus;
  reason?: string;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  employee: { id: string; firstName: string; lastName: string; position: string; department?: { name: string } };
  course: { id: string; title: string; cost?: number; format: CourseFormat; durationHours?: number };
  reviewedBy?: { firstName: string; lastName: string };
}

interface DeptBudget {
  departmentId: string;
  name: string;
  color: string;
  allocated: number;
  consumed: number;
  remaining: number;
  employeeCount: number;
  completedTrainings: number;
  inProgressTrainings: number;
  progressPct: number;
}

interface DashboardData {
  totalCourses: number;
  activeTrainings: number;
  pendingRequests: number;
  completionRate: number;
  certifiedEmployees: number;
  totalBudget: number;
  consumed: number;
  deptBudgets: DeptBudget[];
}

interface PfaData {
  year: number;
  totalAllocated: number;
  totalConsumed: number;
  totalRemaining: number;
  globalProgress: number;
  totalTrainings: number;
  departments: DeptBudget[];
}

interface MyTrainings {
  assigned:            any[];
  inProgress:          any[];
  completionRequested: any[];
  completed:           any[];
  requested:           any[];
}

interface CertificateData {
  ref: string;
  employeeName: string;
  position?: string;
  department?: string;
  courseTitle: string;
  durationHours?: number;
  providerName?: string;
  mention: string;
  validationNote?: string;
  validatedBy: string;
  validatedAt: string;
  year: number;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department?: { name: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt    = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtCFA = (n?: number) => n != null && n > 0 ? `${Number(n).toLocaleString('fr-FR')} FCFA` : '—';

const FORMAT_CFG: Record<CourseFormat, { label: string; color: string; icon: React.ReactNode }> = {
  ONLINE:    { label: 'En ligne',   color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',       icon: <Video size={10} /> },
  IN_PERSON: { label: 'Présentiel', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: <Users size={10} /> },
  HYBRID:    { label: 'Hybride',    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: <Zap size={10} /> },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  REQUESTED:   { label: 'En attente',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',    icon: <Send size={11} /> },
  APPROVED:    { label: 'Approuvée',   color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',        icon: <ShieldCheck size={11} /> },
  PLANNED:     { label: 'Planifiée',   color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20',  icon: <Calendar size={11} /> },
  IN_PROGRESS: { label: 'En cours',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',      icon: <PlayCircle size={11} /> },
  COMPLETED:   { label: 'Certifiée',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle2 size={11} /> },
  CANCELLED:   { label: 'Annulée',     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',        icon: <Ban size={11} /> },
  COMPLETION_REQUESTED: { label: 'Validation en attente', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: <Clock size={11} /> },
  NOT_STARTED: { label: 'Non démarrée', color: 'text-slate-400',  bg: 'bg-slate-500/10 border-slate-500/20',   icon: <Clock size={11} /> },
};

const FormatBadge = ({ format }: { format: CourseFormat }) => {
  const c = FORMAT_CFG[format];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${c.color}`}>{c.icon} {c.label}</span>;
};

const StatusBadge = ({ status }: { status: TrainingStatus | string }) => {
  const c = STATUS_CFG[status] ?? STATUS_CFG.NOT_STARTED;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${c.bg} ${c.color}`}>{c.icon} {c.label}</span>;
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl p-5 border bg-white dark:bg-slate-800/50 backdrop-blur-sm ${color} group hover:scale-[1.02] transition-transform cursor-default`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-current/10 flex items-center justify-center">
          <Icon size={18} className="text-current opacity-80" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ArrowUpRight size={9} /> {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── Budget Bar ───────────────────────────────────────────────────────────────

function BudgetBar({ dept }: { dept: DeptBudget }) {
  const pct      = dept.progressPct ?? 0;
  const isOver80 = pct > 80;
  return (
    <div className="py-3 border-b border-slate-100 dark:border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dept.color }} />
          <span className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</span>
          <span className="text-[10px] text-slate-400">{dept.employeeCount} emp.</span>
        </div>
        <div className="text-right">
          <span className={`text-xs font-black ${isOver80 ? 'text-amber-500' : 'text-slate-700 dark:text-white'}`}>{pct}%</span>
          {dept.allocated > 0 && (
            <span className="text-[10px] text-slate-400 ml-1.5">{fmtCFA(dept.consumed)} / {fmtCFA(dept.allocated)}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: isOver80 ? '#f59e0b' : dept.color }}
        />
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onOpen, isRH }: { course: Course; onOpen: () => void; isRH: boolean }) {
  const isEnrolled = course.status === 'IN_PROGRESS' || course.status === 'COMPLETED';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      className="group relative bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-white/8 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={course.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-white/5 flex items-center justify-center">
              {course.format === 'IN_PERSON' ? <Ticket size={28} className="text-slate-400" /> : <BookOpen size={28} className="text-slate-400" />}
            </div>
          </div>
        )}
        {/* Gradient permanent pour protéger le contenu */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Status badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {course.status === 'COMPLETED'   && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 size={8}/> Certifiée</span>}
          {course.status === 'IN_PROGRESS' && <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"><PlayCircle size={8}/> En cours</span>}
          {course.status === 'PLANNED'     && <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"><Calendar size={8}/> Assignée</span>}
        </div>

        {/* Durée + Coût */}
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          {course.durationHours && (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Clock size={9}/> {course.durationHours}h
            </span>
          )}
          {course.cost && isRH && (
            <span className="bg-black/60 backdrop-blur-sm text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded">
              {fmtCFA(course.cost)}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
            <Play size={20} fill="white" className="text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">{course.category ?? 'Formation'}</span>
          <FormatBadge format={course.format} />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors line-clamp-2">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{course.description}</p>
        )}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-white">
              {(course.providerName ?? 'I').charAt(0)}
            </div>
            <span className="text-[10px] text-slate-400 truncate max-w-[90px]">{course.providerName ?? 'Interne'}</span>
          </div>
          {isRH && course.enrolledCount != null && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Users size={9}/> {course.enrolledCount}</span>
          )}
          <span className="text-[10px] font-bold text-sky-500 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
            {isEnrolled ? 'Accéder' : 'Voir'} <ChevronRight size={11}/>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function FormationPage() {
  const [currentUser, setCurrentUser]   = useState<any>(null);
  const [activeView, setActiveView]     = useState<ActiveView>('dashboard');

  // Data
  const [courses, setCourses]           = useState<Course[]>([]);
  const [requests, setRequests]         = useState<TrainingRequest[]>([]);
  const [dashboard, setDashboard]       = useState<DashboardData | null>(null);
  const [pfa, setPfa]                   = useState<PfaData | null>(null);
  const [myTrainings, setMyTrainings]   = useState<MyTrainings | null>(null);

  // Loading states
  const [loadingCourses, setLoadingCourses]     = useState(true);
  const [loadingDash, setLoadingDash]           = useState(true);
  const [loadingRequests, setLoadingRequests]   = useState(false);
  const [loadingPfa, setLoadingPfa]             = useState(false);
  const [loadingMine, setLoadingMine]           = useState(false);

  // Modals
  const [showAddModal, setShowAddModal]         = useState(false);
  const [showCourseModal, setShowCourseModal]   = useState<Course | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal]   = useState<DeptBudget | null>(null);
  const [showAssignModal, setShowAssignModal]   = useState<Course | null>(null);
  const [validateModal, setValidateModal]       = useState<{ sessionId: string; employeeName: string; courseTitle: string } | null>(null);
  const [validateForm, setValidateForm]         = useState({ mention: '', note: '' });
  const [employees, setEmployees]               = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Actions
  const [isJoining, setIsJoining]       = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId]         = useState<string | null>(null);

  // Filtres catalogue
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tout');

  // Forms
  const [newCourse, setNewCourse] = useState({
    title: '', category: 'Management', durationHours: 8,
    format: 'IN_PERSON' as CourseFormat,
    providerType: 'EXTERNAL_VENDOR' as ProviderType,
    providerName: '', location: '', dateSchedule: '',
    linkUrl: '', thumbnailUrl: '', description: '', cost: 0,
  });
  const [requestForm, setRequestForm]   = useState({ courseId: '', reason: '' });
  const [budgetForm, setBudgetForm]     = useState('');
  const [reviewNote, setReviewNote]     = useState('');

  // ── Rôles ───────────────────────────────────────────────────────────────────
  const isRH      = currentUser && ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'].includes(currentUser.role);
  const isManager = currentUser?.role === 'MANAGER';

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadCourses();
    if (isRH || isManager) {
      loadDashboard();
      loadRequests();
    }
    loadMyTrainings();
  }, [currentUser]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const data = await api.get<Course[]>('/training/courses');
      setCourses(data ?? []);
    } catch { setCourses([]); }
    finally { setLoadingCourses(false); }
  };

  const loadDashboard = async () => {
    setLoadingDash(true);
    try {
      const data = await api.get<DashboardData>('/training/dashboard');
      setDashboard(data);
    } catch { setDashboard(null); }
    finally { setLoadingDash(false); }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await api.get<TrainingRequest[]>('/training/requests');
      setRequests(data ?? []);
    } catch { setRequests([]); }
    finally { setLoadingRequests(false); }
  };

  const loadPfa = async () => {
    setLoadingPfa(true);
    try {
      const data = await api.get<PfaData>('/training/pfa');
      setPfa(data);
    } catch { setPfa(null); }
    finally { setLoadingPfa(false); }
  };

  const loadMyTrainings = async () => {
    setLoadingMine(true);
    try {
      const data = await api.get<MyTrainings>('/training/my');
      setMyTrainings(data);
    } catch { setMyTrainings(null); }
    finally { setLoadingMine(false); }
  };

  // Charger les données selon la vue active
  useEffect(() => {
    if (!currentUser) return;
    if (activeView === 'requests' && requests.length === 0) loadRequests();
    if (activeView === 'pfa' && !pfa) loadPfa();
  }, [activeView, currentUser]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleAddCourse = async () => {
    if (!newCourse.title.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/training/courses', {
        ...newCourse,
        cost:         newCourse.cost || undefined,
        linkUrl:      newCourse.format === 'IN_PERSON' ? undefined : newCourse.linkUrl,
        location:     newCourse.format === 'ONLINE' ? undefined : newCourse.location,
        dateSchedule: newCourse.dateSchedule || undefined,
        thumbnailUrl: newCourse.thumbnailUrl || undefined,
      });
      await loadCourses();
      await loadDashboard();
      setShowAddModal(false);
      setNewCourse({ title: '', category: 'Management', durationHours: 8, format: 'IN_PERSON', providerType: 'EXTERNAL_VENDOR', providerName: '', location: '', dateSchedule: '', linkUrl: '', thumbnailUrl: '', description: '', cost: 0 });
    } catch { alert('Erreur lors de la création.'); }
    finally { setIsSubmitting(false); }
  };

  const handleJoin = async (course: Course) => {
    if (course.status === 'IN_PROGRESS' || course.status === 'COMPLETED') return;
    setIsJoining(true);
    try {
      await api.post(`/training/join/${course.id}`, {});
      await loadCourses();
      await loadMyTrainings();
      if (showCourseModal?.id === course.id) {
        setShowCourseModal({ ...course, status: 'IN_PROGRESS' });
      }
    } catch { alert("Erreur lors de l'inscription."); }
    finally { setIsJoining(false); }
  };

  // Employé demande validation
  const handleRequestCompletion = async (course: Course) => {
    const session = myTrainings?.inProgress.find((s: any) => s.course?.id === course.id);
    if (!session) return;
    setActionId(session.id);
    try {
      await api.patch(`/training/request-completion/${session.id}`, {});
      await loadCourses();
      await loadMyTrainings();
      setShowCourseModal(null);
    } catch (e: any) { alert(e?.message ?? 'Erreur.'); }
    finally { setActionId(null); }
  };

  // RH valide avec mention
  const handleValidateCompletion = async () => {
    if (!validateModal || !validateForm.mention) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/training/validate/${validateModal.sessionId}`, {
        mention: validateForm.mention,
        validationNote: validateForm.note || undefined,
      });
      await loadRequests();
      await loadDashboard();
      setValidateModal(null);
      setValidateForm({ mention: '', note: '' });
    } catch (e: any) { alert(e?.message ?? 'Erreur lors de la validation.'); }
    finally { setIsSubmitting(false); }
  };

  const handleSendRequest = async () => {
    if (!requestForm.courseId) return;
    setIsSubmitting(true);
    try {
      await api.post('/training/requests', requestForm);
      await loadMyTrainings();
      await loadDashboard();
      setShowRequestModal(false);
      setRequestForm({ courseId: '', reason: '' });
    } catch (e: any) {
      alert(e?.message ?? 'Erreur lors de la demande.');
    } finally { setIsSubmitting(false); }
  };

  const handleReview = async (reqId: string, status: 'APPROVED' | 'CANCELLED') => {
    setActionId(reqId);
    try {
      await api.patch(`/training/requests/${reqId}`, { status, reviewNote });
      await loadRequests();
      await loadDashboard();
      setReviewNote('');
    } catch { alert('Erreur.'); }
    finally { setActionId(null); }
  };

  const generateCertificate = (data: CertificateData) => {
    const canvas = document.createElement('canvas');
    canvas.width  = 1122;
    canvas.height = 794;
    const ctx = canvas.getContext('2d')!;

    // ── Fond ────────────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 1122, 794);
    bg.addColorStop(0,   '#0c1426');
    bg.addColorStop(0.5, '#0f1e3d');
    bg.addColorStop(1,   '#0c1426');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1122, 794);

    // ── Motif géométrique fond ───────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth   = 1;
    for (let i = 0; i < 1122; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 794); ctx.stroke();
    }
    for (let j = 0; j < 794; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(1122, j); ctx.stroke();
    }

    // ── Bordure extérieure or ────────────────────────────────────────────────
    const borderGrad = ctx.createLinearGradient(0, 0, 1122, 0);
    borderGrad.addColorStop(0,   '#b8860b');
    borderGrad.addColorStop(0.5, '#ffd700');
    borderGrad.addColorStop(1,   '#b8860b');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth   = 8;
    ctx.strokeRect(24, 24, 1074, 746);

    // ── Bordure intérieure fine ──────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,215,0,0.25)';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(36, 36, 1050, 722);

    // ── Coins décoratifs ─────────────────────────────────────────────────────
    const corners = [[50,50],[1072,50],[50,744],[1072,744]];
    corners.forEach(([cx, cy]) => {
      ctx.strokeStyle = 'rgba(255,215,0,0.6)';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,0,0.15)';
      ctx.fill();
    });

    // ── En-tête : République du Congo + entreprise ───────────────────────────
    ctx.fillStyle   = 'rgba(255,215,0,0.12)';
    ctx.fillRect(0, 60, 1122, 70);

    ctx.fillStyle   = 'rgba(255,215,0,0.8)';
    ctx.font        = 'bold 11px sans-serif';
    ctx.textAlign   = 'center';
    ctx.letterSpacing = '4px';
    ctx.fillText('RÉPUBLIQUE DU CONGO  •  CERTIFICAT OFFICIEL DE FORMATION PROFESSIONNELLE', 561, 100);
    ctx.letterSpacing = '0px';

    // ── Ligne décorative ─────────────────────────────────────────────────────
    const lineGrad = ctx.createLinearGradient(100, 0, 1022, 0);
    lineGrad.addColorStop(0,   'transparent');
    lineGrad.addColorStop(0.3, 'rgba(255,215,0,0.8)');
    lineGrad.addColorStop(0.7, 'rgba(255,215,0,0.8)');
    lineGrad.addColorStop(1,   'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(100, 142); ctx.lineTo(1022, 142); ctx.stroke();

    // ── Sceau central (cercle) ───────────────────────────────────────────────
    const sealGrad = ctx.createRadialGradient(561, 390, 20, 561, 390, 70);
    sealGrad.addColorStop(0,   'rgba(255,215,0,0.25)');
    sealGrad.addColorStop(1,   'rgba(255,215,0,0.03)');
    ctx.fillStyle = sealGrad;
    ctx.beginPath(); ctx.arc(561, 390, 70, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,0,0.35)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.arc(561, 390, 70, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,215,0,0.15)';
    ctx.beginPath(); ctx.arc(561, 390, 80, 0, Math.PI*2); ctx.stroke();
    // Étoile au centre
    ctx.fillStyle = 'rgba(255,215,0,0.6)';
    ctx.font      = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 561, 403);

    // ── Texte principal ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(200,220,255,0.55)';
    ctx.font      = '13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ce certificat est décerné à', 561, 178);

    // Nom employé
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 46px serif';
    ctx.fillText(data.employeeName, 561, 240);

    // Poste + département
    ctx.fillStyle = 'rgba(200,220,255,0.5)';
    ctx.font      = 'italic 14px serif';
    const posInfo = [data.position, data.department].filter(Boolean).join(' — ');
    if (posInfo) ctx.fillText(posInfo, 561, 268);

    // Ligne sous nom
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(200, 284); ctx.lineTo(922, 284); ctx.stroke();

    ctx.fillStyle = 'rgba(200,220,255,0.45)';
    ctx.font      = '13px serif';
    ctx.fillText('pour avoir complété avec succès la formation', 561, 318);

    // Titre formation
    ctx.fillStyle = '#7dd3fc';
    ctx.font      = 'bold 26px serif';
    let title = data.courseTitle;
    while (ctx.measureText(title).width > 860 && title.length > 10)
      title = title.slice(0,-4)+'...';
    ctx.fillText(title, 561, 362);

    // Durée + organisme
    const details = [
      data.durationHours ? `Durée : ${data.durationHours}h` : '',
      data.providerName  ? `Organisme : ${data.providerName}` : '',
    ].filter(Boolean).join('   •   ');
    if (details) {
      ctx.fillStyle = 'rgba(200,220,255,0.4)';
      ctx.font      = '12px serif';
      ctx.fillText(details, 561, 420);
    }

    // ── Mention (badge central) ──────────────────────────────────────────────
    const mentionColors: Record<string,string> = {
      'Satisfaisant': '#94a3b8',
      'Bien':         '#34d399',
      'Très Bien':    '#60a5fa',
      'Excellent':    '#fbbf24',
    };
    const mc = mentionColors[data.mention] ?? '#fbbf24';
    // Badge
    ctx.strokeStyle = mc;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    const bw = 200, bh = 38, bx = 561 - bw/2, by = 460;
    ctx.roundRect(bx, by, bw, bh, 8);
    ctx.stroke();
    ctx.fillStyle = mc + '18';
    ctx.fill();
    ctx.fillStyle = mc;
    ctx.font      = 'bold 15px sans-serif';
    ctx.fillText(`Mention : ${data.mention.toUpperCase()}`, 561, 484);

    // Note du valideur (si présente)
    if (data.validationNote) {
      ctx.fillStyle = 'rgba(200,220,255,0.35)';
      ctx.font      = 'italic 11px serif';
      ctx.fillText(`"${data.validationNote}"`, 561, 518);
    }

    // ── Ligne séparation bas ─────────────────────────────────────────────────
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(100, 548); ctx.lineTo(1022, 548); ctx.stroke();

    // ── Zone bas : date gauche | référence centre | signature droite ─────────

    // Date
    const dateStr = new Date(data.validatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.font      = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Brazzaville, le ' + dateStr, 80, 620);

    // Référence
    ctx.textAlign   = 'center';
    ctx.fillStyle   = 'rgba(255,215,0,0.5)';
    ctx.font        = 'bold 10px monospace';
    ctx.fillText('Réf. ' + data.ref, 561, 600);
    // QR-like placeholder
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth   = 1;
    ctx.strokeRect(524, 608, 74, 74);
    ctx.fillStyle   = 'rgba(255,215,0,0.06)';
    ctx.fillRect(524, 608, 74, 74);
    ctx.fillStyle   = 'rgba(255,215,0,0.25)';
    ctx.font        = '8px monospace';
    ctx.fillText('VÉRIFIABLE', 561, 650);
    ctx.fillText('HRCONGO.COM', 561, 664);
    ctx.fillText(data.ref.slice(-8), 561, 678);

    // Signature RH
    ctx.textAlign   = 'right';
    ctx.fillStyle   = '#ffffff';
    ctx.font        = 'bold 13px serif';
    ctx.fillText(data.validatedBy, 1042, 620);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(900, 628); ctx.lineTo(1042, 628); ctx.stroke();
    ctx.fillStyle   = 'rgba(200,220,255,0.4)';
    ctx.font        = '10px sans-serif';
    ctx.fillText('Responsable Ressources Humaines', 1042, 645);

    // ── Pied de page ─────────────────────────────────────────────────────────
    ctx.fillStyle   = 'rgba(255,215,0,0.2)';
    ctx.fillRect(0, 718, 1122, 52);
    ctx.fillStyle   = 'rgba(255,215,0,0.45)';
    ctx.font        = '9px monospace';
    ctx.textAlign   = 'center';
    ctx.fillText('Document officiel généré par HRCongo | Académie Formation | Loi 45-75 Code du Travail — République du Congo', 561, 738);
    ctx.fillText('Ce certificat est vérifiable en ligne sur hrcongo.com/verify/' + data.ref, 561, 754);

    // ── Téléchargement ───────────────────────────────────────────────────────
    const link = document.createElement('a');
    link.download = `certificat-${data.employeeName.replace(/\s+/g,'-').toLowerCase()}-${data.year}.png`;
    link.href     = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const openAssignModal = async (course: Course) => {
    setShowAssignModal(course);
    setSelectedEmployeeId('');
    setLoadingEmployees(true);
    try {
      // /employees/simple retourne un tableau direct (pas paginé)
      const list = await api.get<any[]>('/employees/simple');
      setEmployees(Array.isArray(list) ? list : []);
    } catch { setEmployees([]); }
    finally { setLoadingEmployees(false); }
  };

  const handleAssign = async () => {
    if (!showAssignModal || !selectedEmployeeId) return;
    setIsSubmitting(true);
    try {
      await api.post('/training/assign', {
        courseId:   showAssignModal.id,
        employeeId: selectedEmployeeId,
      });
      await loadDashboard();
      setShowAssignModal(null);
      setSelectedEmployeeId('');
    } catch (e: any) {
      alert(e?.message ?? 'Erreur lors de l\'assignation.');
    } finally { setIsSubmitting(false); }
  };

  const handleUpdateBudget = async () => {
    if (!showBudgetModal || !budgetForm) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/training/pfa/${showBudgetModal.departmentId}`, { trainingBudget: Number(budgetForm) });
      await loadPfa();
      await loadDashboard();
      setShowBudgetModal(null);
      setBudgetForm('');
    } catch { alert('Erreur lors de la mise à jour.'); }
    finally { setIsSubmitting(false); }
  };

  // ── Données filtrées ────────────────────────────────────────────────────────
  const categories = ['Tout', ...Array.from(new Set(courses.map(c => c.category).filter(Boolean) as string[]))];

  // Filtrage par rôle : Manager ne voit que les cours de son département via myTrainings
  const visibleCourses = isManager
    ? courses // Le back filtre déjà via findAllCourses — le Manager voit le catalogue global mais ses stats sont filtrées
    : courses;

  const filteredCourses = visibleCourses.filter(c => {
    const matchSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat    = selectedCategory === 'Tout' || c.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const pendingCount = requests.filter(r => r.status === 'REQUESTED').length
    || dashboard?.pendingRequests || 0;

  // ── Nav ──────────────────────────────────────────────────────────────────────
  const navItems: { id: ActiveView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard',   label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'catalog',     label: 'Catalogue',        icon: BookOpen },
    { id: 'my-learning', label: 'Mes Formations',   icon: GraduationCap },
    ...(isRH || isManager ? [
      { id: 'requests' as ActiveView, label: 'Demandes', icon: ClipboardList, badge: pendingCount },
    ] : []),
    ...(isRH ? [
      { id: 'pfa' as ActiveView, label: 'Plan Annuel', icon: Target },
    ] : []),
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1800px] mx-auto pb-20 space-y-6 px-4 sm:px-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Académie <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-500">Formation</span>
            </h1>
            <p className="text-xs text-slate-400">Plan de développement des compétences — Congo-Brazzaville</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isRH && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold transition-all"
            >
              <Send size={14} /> Demander une formation
            </button>
          )}
          {isRH && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-sm font-black shadow-lg shadow-sky-500/20 hover:scale-105 transition-all"
            >
              <Plus size={16} /> Nouveau cours
            </button>
          )}
        </div>
      </div>

      {/* NAV TABS */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 w-fit overflow-x-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeView === item.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <item.icon size={14} /> {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ VUE DASHBOARD ══════════════════════════════════════════════════════ */}
      {activeView === 'dashboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {loadingDash ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={36} /></div>
          ) : dashboard ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard icon={Wallet}     label="Budget alloué"    value={fmtCFA(dashboard.totalBudget)}    color="border-sky-200 dark:border-sky-500/20 text-sky-500" />
                <KpiCard icon={TrendingUp} label="Consommé"         value={fmtCFA(dashboard.consumed)}       color="border-amber-200 dark:border-amber-500/20 text-amber-500"
                  sub={dashboard.totalBudget > 0 ? `${Math.round(dashboard.consumed/dashboard.totalBudget*100)}% du budget` : undefined} />
                <KpiCard icon={PlayCircle} label="En cours"         value={String(dashboard.activeTrainings)} color="border-blue-200 dark:border-blue-500/20 text-blue-500" />
                <KpiCard icon={Bell}       label="En attente"       value={String(dashboard.pendingRequests)} color="border-red-200 dark:border-red-500/20 text-red-500" />
                <KpiCard icon={Target}     label="Taux complétion"  value={`${dashboard.completionRate}%`}    color="border-emerald-200 dark:border-emerald-500/20 text-emerald-500" />
                <KpiCard icon={BadgeCheck} label="Certifiés"        value={String(dashboard.certifiedEmployees)} color="border-purple-200 dark:border-purple-500/20 text-purple-500" />
              </div>

              {/* Budget depts + Demandes récentes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/8 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white">Plan Formation Annuel</h3>
                      <p className="text-xs text-slate-400">Budget par département</p>
                    </div>
                    {isRH && (
                      <button onClick={() => setActiveView('pfa')} className="text-xs font-bold text-sky-500 flex items-center gap-1">
                        Gérer <ChevronRight size={12}/>
                      </button>
                    )}
                  </div>
                  {dashboard.deptBudgets.length > 0
                    ? dashboard.deptBudgets.map(d => <BudgetBar key={d.departmentId} dept={d} />)
                    : <p className="text-sm text-slate-400 text-center py-4">Aucun budget configuré</p>
                  }
                </div>

                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/8 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white">Demandes récentes</h3>
                      <p className="text-xs text-slate-400">{dashboard.pendingRequests} en attente</p>
                    </div>
                    <button onClick={() => setActiveView('requests')} className="text-xs font-bold text-sky-500 flex items-center gap-1">
                      Voir tout <ChevronRight size={12}/>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {requests.slice(0, 4).length > 0 ? requests.slice(0, 4).map(req => (
                      <div key={req.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-white/8">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-black text-slate-700 dark:text-white shrink-0">
                          {req.employee.firstName[0]}{req.employee.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{req.employee.firstName} {req.employee.lastName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{req.course.title}</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    )) : (
                      <p className="text-sm text-slate-400 text-center py-4">Aucune demande récente</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloc conformité légale */}
              <div className="relative overflow-hidden bg-gradient-to-r from-sky-900/40 to-indigo-900/40 border border-sky-500/20 rounded-2xl p-6">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                      <ScrollText size={24} className="text-sky-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-white">Conformité — Code du Travail Congolais</h3>
                      <p className="text-sky-200/60 text-sm">Loi 45-75 : Obligation de formation continue sur la masse salariale</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">
                        {dashboard.totalBudget > 0 ? Math.round(dashboard.consumed/dashboard.totalBudget*100) : 0}%
                      </p>
                      <p className="text-[10px] text-sky-300/60 uppercase font-bold">Budget utilisé</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-400">{dashboard.certifiedEmployees}</p>
                      <p className="text-[10px] text-sky-300/60 uppercase font-bold">Certifiés</p>
                    </div>
                    <button className="ml-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-colors">
                      <Download size={13}/> Bilan PDF
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BarChart3 size={40} className="mx-auto mb-3 opacity-20"/>
              <p>Impossible de charger le tableau de bord.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══ VUE CATALOGUE ══════════════════════════════════════════════════════ */}
      {activeView === 'catalog' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Barre recherche + filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                type="text"
                placeholder="Rechercher une formation, une compétence…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-white/8 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === cat
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow'
                      : 'bg-white dark:bg-slate-800/60 text-slate-500 border-slate-200 dark:border-white/8'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Featured */}
          {filteredCourses.length > 0 && !searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowCourseModal(filteredCourses[0])}
              className="relative h-64 sm:h-72 rounded-2xl overflow-hidden cursor-pointer group"
            >
              <img
                src={filteredCourses[0].thumbnailUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={filteredCourses[0].title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"/>
              <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full sm:w-2/3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-sky-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"><Flame size={9}/> À la une</span>
                  <FormatBadge format={filteredCourses[0].format}/>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 leading-tight">{filteredCourses[0].title}</h2>
                <p className="text-slate-300 text-sm line-clamp-2">{filteredCourses[0].description}</p>
              </div>
            </motion.div>
          )}

          {/* Grille */}
          {loadingCourses ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} onOpen={() => setShowCourseModal(course)} isRH={!!isRH}/>
              ))}
            </div>
          )}
          {!loadingCourses && filteredCourses.length === 0 && (
            <div className="flex flex-col items-center py-20 text-slate-400">
              <BookOpen size={40} className="mb-3 opacity-20"/>
              <p className="font-bold">Aucun cours trouvé</p>
              <p className="text-sm">Essayez un autre terme</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══ VUE MES FORMATIONS ════════════════════════════════════════════════ */}
      {activeView === 'my-learning' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {loadingMine ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
          ) : myTrainings ? (
            <>
              {/* Passeport compétences */}
              <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/20 rounded-2xl p-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"/>
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <Trophy size={28} className="text-indigo-300"/>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-lg">Mon Passeport Compétences</h3>
                      <p className="text-indigo-200/60 text-sm">
                        {myTrainings.completed.length} certifiée(s) • {myTrainings.inProgress.length} en cours
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      myTrainings.completed.forEach((s: any, i: number) => {
                        if (s.certificateUrl) {
                          setTimeout(() => {
                            try {
                              const data: CertificateData = JSON.parse(atob(s.certificateUrl));
                              generateCertificate(data);
                            } catch {}
                          }, i * 400);
                        }
                      });
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0">
                    <Download size={13}/> Télécharger PDF
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {myTrainings.completed.map((s: any) => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-white">
                      <BadgeCheck size={10} className="text-emerald-400"/> {s.course?.title}
                    </span>
                  ))}
                  {myTrainings.completed.length === 0 && (
                    <span className="text-sm text-indigo-300/50">Terminez vos premières formations pour construire votre passeport.</span>
                  )}
                </div>
              </div>

              {/* Assignées */}
              {myTrainings.assigned.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={13} className="text-amber-400"/> Formations assignées / obligatoires
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTrainings.assigned.map((s: any) => (
                      <CourseCard key={s.id} course={{ ...s.course, status: s.status }} onOpen={() => setShowCourseModal({ ...s.course, status: s.status })} isRH={false}/>
                    ))}
                  </div>
                </div>
              )}

              {/* En cours */}
              <div>
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <PlayCircle size={13} className="text-blue-400"/> En cours
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTrainings.inProgress.map((s: any) => (
                    <CourseCard key={s.id} course={{ ...s.course, status: 'IN_PROGRESS' }} onOpen={() => setShowCourseModal({ ...s.course, status: 'IN_PROGRESS' })} isRH={false}/>
                  ))}
                  {myTrainings.inProgress.length === 0 && (
                    <div className="col-span-3 text-center py-10 text-slate-400">
                      <PlayCircle size={32} className="mx-auto mb-2 opacity-20"/>
                      <p className="text-sm">Aucune formation en cours. Explorez le catalogue !</p>
                    </div>
                  )}
                </div>
              </div>

              {/* En attente de validation */}
              {myTrainings.completionRequested?.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={13} className="text-orange-400"/> En attente de validation RH
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTrainings.completionRequested.map((s: any) => (
                      <CourseCard key={s.id} course={{ ...s.course, status: 'COMPLETION_REQUESTED' }} onOpen={() => setShowCourseModal({ ...s.course, status: 'COMPLETION_REQUESTED' })} isRH={false}/>
                    ))}
                  </div>
                </div>
              )}

              {/* Terminées */}
              {myTrainings.completed.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400"/> Certifiées
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTrainings.completed.map((s: any) => (
                      <CourseCard key={s.id} course={{ ...s.course, status: 'COMPLETED' }} onOpen={() => setShowCourseModal({ ...s.course, status: 'COMPLETED' })} isRH={false}/>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-20"/>
              <p>Impossible de charger vos formations.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══ VUE DEMANDES ══════════════════════════════════════════════════════ */}
      {activeView === 'requests' && (isRH || isManager) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Gestion des demandes</h2>
              <p className="text-sm text-slate-400">
                {requests.filter(r => r.status === 'REQUESTED').length} en attente • {requests.length} au total
              </p>
            </div>
            <button onClick={loadRequests} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <RotateCcw size={16} className="text-slate-400"/>
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ClipboardList size={40} className="mx-auto mb-3 opacity-20"/>
              <p className="font-bold">Aucune demande pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/8 rounded-2xl p-5"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Employé */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-black text-slate-700 dark:text-white shrink-0">
                        {req.employee.firstName[0]}{req.employee.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white">{req.employee.firstName} {req.employee.lastName}</p>
                        <p className="text-xs text-slate-400 truncate">{req.employee.position}{req.employee.department && ` • ${req.employee.department.name}`}</p>
                      </div>
                    </div>

                    {/* Formation */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{req.course.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <FormatBadge format={req.course.format}/>
                        {req.course.cost && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded">
                            {fmtCFA(req.course.cost)}
                          </span>
                        )}
                      </div>
                      {req.reason && <p className="text-[11px] text-slate-400 mt-1.5 italic">"{req.reason}"</p>}
                    </div>

                    {/* Date + Status + Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:block">{fmt(req.createdAt)}</span>
                      <StatusBadge status={req.status}/>
                      {req.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleReview(req.id, 'APPROVED')}
                            disabled={actionId === req.id}
                            className="p-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors"
                            title="Approuver"
                          >
                            {actionId === req.id ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'CANCELLED')}
                            disabled={actionId === req.id}
                            className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                            title="Refuser"
                          >
                            <X size={15}/>
                          </button>
                        </>
                      )}
                      {req.status === 'COMPLETION_REQUESTED' && (
                        <button
                          onClick={() => setValidateModal({ sessionId: req.id, employeeName: `${req.employee.firstName} ${req.employee.lastName}`, courseTitle: req.course.title })}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Award size={13}/> Certifier
                        </button>
                      )}
                      {req.reviewedBy && (
                        <span className="text-[10px] text-slate-400">
                          par {req.reviewedBy.firstName}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ══ VUE PLAN ANNUEL ═══════════════════════════════════════════════════ */}
      {activeView === 'pfa' && isRH && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Plan de Formation Annuel {pfa?.year ?? new Date().getFullYear()}
              </h2>
              <p className="text-sm text-slate-400">Suivi budgétaire et conformité Loi 45-75</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow hover:scale-105 transition-transform">
              <Download size={14}/> Bilan PDF
            </button>
          </div>

          {loadingPfa ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={36}/></div>
          ) : pfa ? (
            <>
              {/* Résumé global */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Budget Alloué', value: fmtCFA(pfa.totalAllocated), color: 'text-slate-900 dark:text-white', sub: `Exercice ${pfa.year}` },
                  { label: 'Consommé',      value: fmtCFA(pfa.totalConsumed),   color: 'text-amber-500',                sub: `${pfa.globalProgress}% du budget` },
                  { label: 'Disponible',    value: fmtCFA(pfa.totalRemaining),  color: 'text-emerald-500',             sub: `${100 - pfa.globalProgress}% restant` },
                ].map(item => (
                  <div key={item.label} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/8 rounded-2xl p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                    <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
                  </div>
                ))}
              </div>

              {/* Tableau détaillé */}
              <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">Détail par Département</h3>
                  <span className="text-xs text-slate-400">{pfa.totalTrainings} formation(s) cette année</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        {['Département', 'Employés', 'Budget alloué', 'Consommé', 'Disponible', 'Terminées', 'Avancement', ''].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pfa.departments.map(dept => (
                        <tr key={dept.departmentId} className="border-b border-slate-50 dark:border-white/3 hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: dept.color }}/>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{dept.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-sm">{dept.employeeCount}</td>
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white text-sm">{fmtCFA(dept.allocated)}</td>
                          <td className="px-5 py-4 text-amber-500 font-bold text-sm">{fmtCFA(dept.consumed)}</td>
                          <td className="px-5 py-4 text-emerald-500 font-bold text-sm">{fmtCFA(dept.remaining)}</td>
                          <td className="px-5 py-4 text-slate-500 text-sm">{dept.completedTrainings}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full min-w-[60px]">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, dept.progressPct)}%`, background: dept.progressPct > 80 ? '#f59e0b' : dept.color }}/>
                              </div>
                              <span className={`text-xs font-black ${dept.progressPct > 80 ? 'text-amber-400' : 'text-slate-500'}`}>{dept.progressPct}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => { setShowBudgetModal(dept); setBudgetForm(String(dept.allocated)); }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                              title="Modifier le budget"
                            >
                              <Edit3 size={13} className="text-slate-400"/>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Note légale */}
              <div className="flex items-start gap-3 p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-500/20 rounded-xl">
                <Info size={15} className="text-sky-500 shrink-0 mt-0.5"/>
                <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                  <strong>Obligation légale :</strong> La Loi 45-75 du Code du Travail congolais impose aux entreprises de consacrer
                  une part de leur masse salariale à la formation professionnelle continue. Ce bilan constitue une preuve
                  de conformité exportable lors d'un contrôle ONEMO ou de l'Inspection du Travail.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <Target size={40} className="mx-auto mb-3 opacity-20"/>
              <p>Impossible de charger le plan annuel.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL — DÉTAIL COURS
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCourseModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/10 flex flex-col md:flex-row overflow-hidden"
            >
              {/* Left — Player */}
              <div className="flex-1 bg-black relative min-h-[220px] md:min-h-0 flex items-center justify-center">
                {/* Close */}
                <button onClick={() => setShowCourseModal(null)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 text-white rounded-full backdrop-blur-md z-10">
                  <X size={18}/>
                </button>

                {/* Non inscrit / Planifié */}
                {(!showCourseModal.status || showCourseModal.status === 'NOT_STARTED' || showCourseModal.status === 'PLANNED') && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.97)), url(${showCourseModal.thumbnailUrl})` }}
                  >
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                      <FormatBadge format={showCourseModal.format}/>
                      <h2 className="text-3xl font-black text-white mt-4 mb-3 leading-tight">{showCourseModal.title}</h2>
                      <p className="text-slate-300 max-w-md mx-auto mb-8 text-sm">{showCourseModal.description}</p>
                      {showCourseModal.status !== 'PLANNED' ? (
                        <button
                          onClick={() => handleJoin(showCourseModal)}
                          disabled={isJoining}
                          className="px-8 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform flex items-center gap-2 mx-auto shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                          {isJoining ? <Loader2 className="animate-spin" size={16}/> : <Play fill="black" size={16}/>}
                          S'inscrire à cette formation
                        </button>
                      ) : (
                        <div className="px-6 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold rounded-full flex items-center gap-2 mx-auto w-fit">
                          <Calendar size={15}/> Formation assignée — En attente de démarrage
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}

                {/* En cours / Terminé — Online YouTube */}
                {(showCourseModal.status === 'IN_PROGRESS' || showCourseModal.status === 'COMPLETED') && showCourseModal.format === 'ONLINE' && showCourseModal.linkUrl?.includes('youtube') && (
                  <iframe src={showCourseModal.linkUrl} className="w-full h-full min-h-[300px]" allow="autoplay; encrypted-media" allowFullScreen/>
                )}

                {/* En cours / Terminé — Présentiel */}
                {(showCourseModal.status === 'IN_PROGRESS' || showCourseModal.status === 'COMPLETED') && showCourseModal.format === 'IN_PERSON' && (
                  <div className="flex items-center justify-center w-full h-full p-8">
                    <div className="bg-white text-slate-900 rounded-3xl p-7 max-w-sm w-full shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"/>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Convocation Officielle</p>
                          <h3 className="text-base font-black mt-0.5">Formation Présentielle</h3>
                        </div>
                        <Ticket size={24} className="text-amber-500"/>
                      </div>
                      <div className="space-y-2.5 mb-5">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Calendar size={16} className="text-slate-400"/>
                          <span className="font-bold text-sm">{showCourseModal.dateSchedule ? fmt(showCourseModal.dateSchedule) : 'Date à confirmer'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <MapPin size={16} className="text-slate-400"/>
                          <span className="font-bold text-sm">{showCourseModal.location ?? 'Lieu à confirmer'}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <Clock size={16} className="text-slate-400"/>
                          <span className="font-bold text-sm">{showCourseModal.durationHours}h de formation</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 text-center">
                        <p className="text-[9px] text-slate-400 font-mono">Feuille de présence — Référence</p>
                        <p className="text-xs font-black text-slate-700 mt-1">{showCourseModal.id?.slice(0,8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* En cours / Terminé — Lien externe */}
                {(showCourseModal.status === 'IN_PROGRESS' || showCourseModal.status === 'COMPLETED') && showCourseModal.format === 'ONLINE' && !showCourseModal.linkUrl?.includes('youtube') && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-white text-center">
                    <ExternalLink size={40} className="mb-4 opacity-40"/>
                    <h3 className="text-lg font-bold mb-2">Contenu hébergé en externe</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm">Ce cours est accessible sur une plateforme partenaire.</p>
                    {showCourseModal.linkUrl && (
                      <a href={showCourseModal.linkUrl} target="_blank" className="px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold transition-colors">
                        Accéder au cours <ExternalLink size={14} className="inline ml-1"/>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Right — Sidebar */}
              <div className="w-full md:w-80 bg-slate-800/60 border-l border-white/8 flex flex-col">
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  <div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <FormatBadge format={showCourseModal.format}/>
                      {showCourseModal.durationHours && (
                        <span className="text-[10px] bg-white/5 text-white px-2 py-0.5 rounded border border-white/10">
                          {showCourseModal.durationHours}h
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-white text-base leading-snug">{showCourseModal.title}</h3>
                    {showCourseModal.status && <div className="mt-2"><StatusBadge status={showCourseModal.status}/></div>}
                  </div>

                  {showCourseModal.description && (
                    <p className="text-slate-400 text-xs leading-relaxed">{showCourseModal.description}</p>
                  )}

                  <div className="space-y-2">
                    {showCourseModal.providerName && (
                      <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
                        <Briefcase size={13} className="text-slate-400"/>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Organisme</p>
                          <p className="text-xs font-bold text-white">{showCourseModal.providerName}</p>
                        </div>
                      </div>
                    )}
                    {showCourseModal.cost != null && isRH && (
                      <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
                        <Wallet size={13} className="text-amber-400"/>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Coût</p>
                          <p className="text-xs font-bold text-amber-400">{fmtCFA(showCourseModal.cost)}</p>
                        </div>
                      </div>
                    )}
                    {showCourseModal.location && (
                      <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
                        <MapPin size={13} className="text-slate-400"/>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Lieu</p>
                          <p className="text-xs font-bold text-white">{showCourseModal.location}</p>
                        </div>
                      </div>
                    )}
                    {showCourseModal.dateSchedule && (
                      <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl border border-white/5">
                        <Calendar size={13} className="text-slate-400"/>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Date</p>
                          <p className="text-xs font-bold text-white">{fmt(showCourseModal.dateSchedule)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer actions */}
                <div className="p-5 border-t border-white/8 space-y-2">
                  {showCourseModal.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleRequestCompletion(showCourseModal)}
                      disabled={!!actionId}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionId ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>}
                      J'ai terminé cette formation
                    </button>
                  )}
                  {showCourseModal.status === 'COMPLETION_REQUESTED' && (
                    <div className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-xl flex items-center justify-center gap-2 text-sm">
                      <Clock size={15}/> En attente de validation RH
                    </div>
                  )}
                  {showCourseModal.status === 'COMPLETED' && (
                    <>
                      <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black rounded-xl flex items-center justify-center gap-2">
                        <BadgeCheck size={16}/> Certification obtenue
                      </div>
                      <button
                        onClick={() => {
                          const s = myTrainings?.completed.find((s: any) => s.course?.id === showCourseModal.id);
                          if (s?.certificateUrl) {
                            try {
                              const data: CertificateData = JSON.parse(atob(s.certificateUrl));
                              generateCertificate(data);
                            } catch { alert('Certificat introuvable.'); }
                          } else { alert('Certificat non encore généré.'); }
                        }}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                        <Download size={13}/> Télécharger l'attestation
                      </button>
                    </>
                  )}
                  {isRH && (
                    <button
                      onClick={() => { setShowCourseModal(null); openAssignModal(showCourseModal); }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors">
                      <UserCheck size={13}/> Assigner à des employés
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — CRÉER UN COURS ════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Créer une formation</h2>
                  <p className="text-xs text-slate-400">Visible dans le catalogue de l'entreprise</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X size={16} className="text-slate-500"/></button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Intitulé *', key: 'title', type: 'text', placeholder: 'Ex: OHADA — Comptabilité avancée', full: true },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      value={(newCourse as any)[field.key]}
                      onChange={e => setNewCourse({ ...newCourse, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Format</label>
                    <select value={newCourse.format} onChange={e => setNewCourse({ ...newCourse, format: e.target.value as CourseFormat })}
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none">
                      <option value="IN_PERSON">Présentiel</option>
                      <option value="ONLINE">En ligne</option>
                      <option value="HYBRID">Hybride</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Durée (h)</label>
                    <input type="number" min={1} value={newCourse.durationHours}
                      onChange={e => setNewCourse({ ...newCourse, durationHours: Number(e.target.value) })}
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Organisme</label>
                    <input value={newCourse.providerName} onChange={e => setNewCourse({ ...newCourse, providerName: e.target.value })}
                      placeholder="Cabinet Mbemba & Associés"
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Coût (FCFA)</label>
                    <input type="number" min={0} value={newCourse.cost}
                      onChange={e => setNewCourse({ ...newCourse, cost: Number(e.target.value) })}
                      placeholder="450000"
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                  </div>
                </div>

                {newCourse.format !== 'ONLINE' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lieu</label>
                      <input value={newCourse.location} onChange={e => setNewCourse({ ...newCourse, location: e.target.value })}
                        placeholder="Brazzaville"
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date</label>
                      <input type="datetime-local" value={newCourse.dateSchedule}
                        onChange={e => setNewCourse({ ...newCourse, dateSchedule: e.target.value })}
                        className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                    </div>
                  </div>
                )}

                {newCourse.format !== 'IN_PERSON' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lien du contenu</label>
                    <input value={newCourse.linkUrl} onChange={e => setNewCourse({ ...newCourse, linkUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sky-500 text-sm focus:outline-none"/>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                  <textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })}
                    rows={3} placeholder="Objectifs pédagogiques, public cible, prérequis…"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none resize-none"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Image (URL)</label>
                  <input value={newCourse.thumbnailUrl} onChange={e => setNewCourse({ ...newCourse, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none"/>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleAddCourse} disabled={isSubmitting || !newCourse.title.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}
                  Publier
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — DEMANDE DE FORMATION ═════════════════════════════════════ */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Demander une formation</h2>
                  <p className="text-xs text-slate-400">Votre demande sera transmise au RH pour validation</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X size={16} className="text-slate-500"/></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Formation souhaitée *</label>
                  <select value={requestForm.courseId} onChange={e => setRequestForm({ ...requestForm, courseId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none">
                    <option value="">Choisir dans le catalogue…</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Justification / Besoin</label>
                  <textarea value={requestForm.reason} onChange={e => setRequestForm({ ...requestForm, reason: e.target.value })}
                    rows={4} placeholder="En quoi cette formation est-elle utile pour votre poste ou vos missions ?"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none resize-none"/>
                </div>
                <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-500/20 rounded-xl">
                  <Info size={13} className="text-sky-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-sky-700 dark:text-sky-300">Votre RH recevra une notification et validera sous 48h ouvrées.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSendRequest} disabled={isSubmitting || !requestForm.courseId}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : <Send size={15}/>}
                  Envoyer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — MODIFIER BUDGET DÉPARTEMENT ══════════════════════════════ */}
      <AnimatePresence>
        {showBudgetModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Budget Formation</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: showBudgetModal.color }}/> {showBudgetModal.name}
                  </p>
                </div>
                <button onClick={() => setShowBudgetModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X size={16}/></button>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Montant alloué (FCFA)</label>
                <input
                  type="number" min={0} value={budgetForm}
                  onChange={e => setBudgetForm(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-lg font-black focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  placeholder="Ex: 2000000"
                />
                <p className="text-xs text-slate-400 mt-1">Actuellement : {fmtCFA(showBudgetModal.allocated)}</p>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowBudgetModal(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleUpdateBudget} disabled={isSubmitting || !budgetForm}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — VALIDER FORMATION + MENTION ══════════════════════════════ */}
      <AnimatePresence>
        {validateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Certifier la formation</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{validateModal.employeeName}</p>
                </div>
                <button onClick={() => setValidateModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
                  <X size={16} className="text-slate-500"/>
                </button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Award size={18} className="text-amber-500"/>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{validateModal.courseTitle}</p>
                  <p className="text-[11px] text-slate-400">Demande de validation reçue</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mention *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'SATISFAISANT', label: 'Satisfaisant', active: 'border-slate-400 bg-slate-50 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300', emoji: '✓' },
                    { value: 'BIEN',         label: 'Bien',         active: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', emoji: '★' },
                    { value: 'TRES_BIEN',    label: 'Très Bien',    active: 'border-sky-400 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300', emoji: '★★' },
                    { value: 'EXCELLENT',    label: 'Excellent',    active: 'border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300', emoji: '★★★' },
                  ].map(m => (
                    <button key={m.value}
                      onClick={() => setValidateForm({ ...validateForm, mention: m.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        validateForm.mention === m.value ? m.active : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black">{m.label}</span>
                        <span className="text-[10px] opacity-70">{m.emoji}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Observation (optionnel)</label>
                <input type="text" maxLength={120}
                  value={validateForm.note}
                  onChange={e => setValidateForm({ ...validateForm, note: e.target.value })}
                  placeholder="Ex: Très bonne participation, assidu les 3 jours"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <p className="text-[10px] text-slate-400 mt-1">Apparaîtra sur le certificat. {validateForm.note.length}/120</p>
              </div>
              {validateForm.mention && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl flex items-center gap-3">
                  <Star size={16} className="text-amber-400 shrink-0"/>
                  <p className="text-[11px] text-slate-400 dark:text-slate-300">
                    {validateModal.employeeName} — {validateModal.courseTitle}
                    {' '}· Mention : <strong>{validateForm.mention === 'TRES_BIEN' ? 'Très Bien' : validateForm.mention.charAt(0) + validateForm.mention.slice(1).toLowerCase()}</strong>
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setValidateModal(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleValidateCompletion} disabled={isSubmitting || !validateForm.mention}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : <Award size={15}/>}
                  Émettre le certificat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — ASSIGNER À UN EMPLOYÉ ════════════════════════════════════ */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-white/10"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Assigner la formation</h2>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{showAssignModal.title}</p>
                </div>
                <button onClick={() => setShowAssignModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
                  <X size={16} className="text-slate-500"/>
                </button>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <GraduationCap size={18} className="text-sky-500"/>
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{showAssignModal.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FormatBadge format={showAssignModal.format}/>
                    {showAssignModal.durationHours && <span className="text-[10px] text-slate-400">{showAssignModal.durationHours}h</span>}
                    {showAssignModal.cost && <span className="text-[10px] text-amber-500 font-bold">{fmtCFA(showAssignModal.cost)}</span>}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Choisir l'employé *</label>
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-sky-500"/></div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {employees.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Aucun employé trouvé</p>
                    ) : employees.map((emp: Employee) => (
                      <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedEmployeeId === emp.id
                            ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40'
                            : 'bg-slate-50 dark:bg-white/3 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-700 dark:text-white shrink-0">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{emp.position}{emp.department && ` • ${emp.department.name}`}</p>
                        </div>
                        {selectedEmployeeId === emp.id && <CheckCircle2 size={16} className="text-sky-500 shrink-0"/>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowAssignModal(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleAssign} disabled={isSubmitting || !selectedEmployeeId}
                  className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black rounded-xl text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : <UserCheck size={15}/>}
                  Assigner
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}