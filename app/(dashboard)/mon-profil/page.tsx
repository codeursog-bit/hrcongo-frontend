'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Briefcase, Building2,
  Users, Heart, Flag, CreditCard, BadgeCheck, Hash,
  Shirt,
  Palmtree, CheckCircle2, Fingerprint, XCircle, KeyRound, Eye, EyeOff,
  AlertCircle, Lock, Pencil, Save, X, Camera, Loader,
} from 'lucide-react';
import { api } from '@/services/api';
import { PushToggleButton } from '@/components/PushNotificationBanner';
import { StatCard } from '@/components/ui/StatCard';
import { useImageUpload } from '@/hooks/useImageUpload';
import { NATIONALITY_OPTIONS } from '@/lib/nationalities';
import { FancySelect } from '@/components/ui/FancySelect';

// ============================================================================
// Types
// ============================================================================

interface Department { id: string; name: string; color?: string; }

interface EmployeeProfile {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  photoUrl?: string;
  position: string;
  contractType: string;
  hireDate: string;
  dateOfBirth: string;
  placeOfBirth: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  nationalIdNumber?: string;
  cnssNumber?: string;
  nationality?: string;
  department: Department;
  status: string;
  bloodType?: string;
  pathology?: string;
  fatherName?: string;
  motherName?: string;
  educationLevel?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string;
  foreignLanguages?: string;
  uniformSize?: string;
  shoeSize?: string;
  // 🆕 Auto-service
  selfServiceEnabled?: boolean;
  selfServiceEnabledAt?: string | null;
}

interface AuthUser {
  id: string; firstName: string; lastName: string; email: string; role: string; companyId: string;
}

// Champs que l'employé peut modifier lui-même quand l'auto-service est activé —
// doit rester en miroir strict de SelfServiceUpdateEmployeeDto côté backend.
interface EditableFields {
  phone: string; email: string; address: string; city: string; nationality: string;
  gender: string; maritalStatus: string; numberOfChildren: number;
  bloodType: string; pathology: string; fatherName: string; motherName: string; educationLevel: string;
  emergencyContactName: string; emergencyContactRelation: string; emergencyContactPhone: string;
  hasDrivingLicense: boolean; drivingLicenseNumber: string;
  foreignLanguages: string; uniformSize: string; shoeSize: string;
  photoUrl: string;
}

const EMPTY_FORM: EditableFields = {
  phone: '', email: '', address: '', city: '', nationality: '',
  gender: 'MALE', maritalStatus: 'SINGLE', numberOfChildren: 0,
  bloodType: '', pathology: '', fatherName: '', motherName: '', educationLevel: '',
  emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
  hasDrivingLicense: false, drivingLicenseNumber: '',
  foreignLanguages: '', uniformSize: '', shoeSize: '',
  photoUrl: '',
};

function formStateFromEmployee(e: EmployeeProfile): EditableFields {
  return {
    phone: e.phone || '', email: e.email || '', address: e.address || '', city: e.city || '',
    nationality: e.nationality || '', gender: e.gender || 'MALE',
    maritalStatus: e.maritalStatus || 'SINGLE', numberOfChildren: e.numberOfChildren ?? 0,
    bloodType: e.bloodType || '', pathology: e.pathology || '', fatherName: e.fatherName || '',
    motherName: e.motherName || '', educationLevel: e.educationLevel || '',
    emergencyContactName: e.emergencyContactName || '', emergencyContactRelation: e.emergencyContactRelation || '',
    emergencyContactPhone: e.emergencyContactPhone || '',
    hasDrivingLicense: !!e.hasDrivingLicense, drivingLicenseNumber: e.drivingLicenseNumber || '',
    foreignLanguages: e.foreignLanguages || '', uniformSize: e.uniformSize || '', shoeSize: e.shoeSize || '',
    photoUrl: e.photoUrl || '',
  };
}

// ============================================================================
// Helpers
// ============================================================================

const ROLE_META: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin',    color: 'bg-purple-500' },
  ADMIN:       { label: 'Administrateur', color: 'bg-rose-500' },
  HR_MANAGER:  { label: 'Responsable RH', color: 'bg-sky-500' },
  MANAGER:     { label: 'Manager',        color: 'bg-amber-500' },
  EMPLOYEE:    { label: 'Employé',        color: 'bg-emerald-500' },
};
const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stagiaire', INTERIM: 'Intérimaire', CONSULTANT: 'Consultant', PRESTATAIRE: 'Prestataire',
};
const GENDER_LABELS: Record<string, string> = { MALE: 'Masculin', FEMALE: 'Féminin' };
const GENDER_OPTIONS = [{ value: 'MALE', label: 'Masculin' }, { value: 'FEMALE', label: 'Féminin' }];
const MARITAL_OPTIONS = [
  { value: 'SINGLE', label: 'Célibataire' }, { value: 'MARRIED', label: 'Marié(e)' },
  { value: 'DIVORCED', label: 'Divorcé(e)' }, { value: 'WIDOWED', label: 'Veuf/Veuve' },
];
const UNIFORM_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'].map(s => ({ value: s, label: s }));

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const seniority = (hireDate?: string) => {
  if (!hireDate) return '—';
  const diff = Date.now() - new Date(hireDate).getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
  if (years === 0) return `${months} mois`;
  return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
};

const calculateAge = (dob?: string): number | null => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday = today.getMonth() > birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age;
};

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ============================================================================
// Petits composants de champ
// ============================================================================

function Field({
  icon: Icon, label, value, editing, children,
}: { icon: React.ElementType; label: string; value?: React.ReactNode; editing?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        {editing ? children : <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value ?? '—'}</p>}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400";

// 🆕 Champ compact sans icône, pour les sections denses en grille
function MiniField({
  label, value, editing, children,
}: { label: string; value?: React.ReactNode; editing?: boolean; children?: React.ReactNode }) {
  return (
    <div className="py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      {editing ? children : <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value ?? '—'}</p>}
    </div>
  );
}

function Section({ title, children, dense }: { title: string; children: React.ReactNode; dense?: boolean }) {
  return (
    <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
        <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{title}</h3>
      </div>
      <div className={dense ? "px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-x-6" : "px-5 py-1 divide-y divide-gray-100 dark:divide-gray-700/60"}>{children}</div>
    </motion.div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function MonProfilPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEmployee, setHasEmployee] = useState(true);

  const [leaveBalanceData, setLeaveBalanceData] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

  // ── Édition (auto-service) ────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const imageUpload = useImageUpload();

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const ROLES_WITH_EMPLOYEE_PROFILE = ['EMPLOYEE', 'HR_MANAGER', 'MANAGER'];

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/auth/login'); return; }
      const u: AuthUser = JSON.parse(stored);
      setAuthUser(u);

      if (ROLES_WITH_EMPLOYEE_PROFILE.includes(u.role)) {
        try {
          const emp = await api.get<EmployeeProfile>('/employees/me');
          setEmployee(emp);
          setForm(formStateFromEmployee(emp));

          try {
            const balance = await api.get<any>('/leaves/me/balance');
            setLeaveBalanceData(balance);
          } catch { /* silencieux */ }

          try {
            const now = new Date();
            const summary = await api.get<any>(`/attendance/summary/${emp.id}/${now.getMonth() + 1}/${now.getFullYear()}`);
            setAttendanceSummary(summary);
          } catch { /* silencieux */ }
        } catch {
          setHasEmployee(false);
        }
      } else {
        setHasEmployee(false);
      }
    } catch (e) {
      console.error('Erreur chargement profil', e);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    if (employee) setForm(formStateFromEmployee(employee));
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (employee) setForm(formStateFromEmployee(employee));
    imageUpload.clearImage?.();
    setSaveError('');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, photoUrl: imageUpload.uploadedUrl || form.photoUrl || undefined };
      const updated = await api.patch<EmployeeProfile>('/employees/me', payload);
      setEmployee(updated);
      setForm(formStateFromEmployee(updated));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Erreur lors de l\'enregistrement. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwdError('');
    if (!pwdForm.current) { setPwdError('Entrez votre mot de passe actuel.'); return; }
    if (pwdForm.next.length < 8) { setPwdError('Le nouveau mot de passe doit faire au moins 8 caractères.'); return; }
    if (!/[A-Z]/.test(pwdForm.next)) { setPwdError('Au moins une majuscule requise.'); return; }
    if (!/[0-9]/.test(pwdForm.next)) { setPwdError('Au moins un chiffre requis.'); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError('Les mots de passe ne correspondent pas.'); return; }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwdForm.current, newPassword: pwdForm.next });
      setPwdSuccess(true);
    } catch (err: any) {
      setPwdError(err?.response?.data?.message || err?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPwdLoading(false);
    }
  };

  const closePwdModal = () => {
    setShowPwdModal(false);
    setPwdSuccess(false);
    setPwdForm({ current: '', next: '', confirm: '' });
    setPwdError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="animate-spin text-sky-500" size={40} />
      </div>
    );
  }
  if (!authUser) return null;

  const roleInfo = ROLE_META[authUser.role] ?? ROLE_META.EMPLOYEE;
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : `${authUser.firstName} ${authUser.lastName}`;
  const canEdit = !!employee?.selfServiceEnabled;
  const avatarSrc = imageUpload.preview || form.photoUrl || employee?.photoUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0ea5e9&color=fff&size=256`;

  const stats = {
    leaveBalance: leaveBalanceData ? Math.round(Number(leaveBalanceData.annualRemaining ?? 0) * 10) / 10 : 0,
    leaveTaken: leaveBalanceData ? Math.round(Number(leaveBalanceData.annualTaken ?? 0) * 10) / 10 : 0,
    presencesThisMonth: attendanceSummary ? Number(attendanceSummary.daysPresent ?? 0) : 0,
    absencesThisMonth: attendanceSummary ? Number(attendanceSummary.daysAbsentPaid ?? 0) + Number(attendanceSummary.daysAbsentUnpaid ?? 0) : 0,
  };

  const pwdChecks = [/[A-Z]/.test(pwdForm.next), /[a-z]/.test(pwdForm.next), /[0-9]/.test(pwdForm.next), pwdForm.next.length >= 8];
  const pwdStrength = pwdChecks.filter(Boolean).length;
  const pwdStrengthColor = pwdStrength === 4 ? 'bg-emerald-500 w-full' : pwdStrength >= 2 ? 'bg-yellow-500 w-2/3' : 'bg-red-500 w-1/3';
  const pwdStrengthLabel = pwdStrength === 4 ? '✓ Excellent' : pwdStrength >= 2 ? 'Moyen' : 'Faible';

  const set = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PushToggleButton />

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto px-4 py-8 space-y-5">

        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={16} /> Retour
        </button>

        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Mon Profil</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Toutes vos informations personnelles et professionnelles.</p>
        </div>

        {/* ══ EN-TÊTE + STATS (côte à côte sur desktop) ══ */}
        <div className="flex flex-col lg:flex-row gap-5">
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 lg:w-[380px] shrink-0">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative shrink-0">
                <img src={avatarSrc} alt={fullName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-100 dark:ring-gray-700" />
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-sky-600 transition-colors">
                    {imageUpload.uploading ? <Loader size={13} className="text-white animate-spin" /> : <Camera size={13} className="text-white" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && imageUpload.handleFileSelect(e.target.files[0])} />
                  </label>
                )}
              </div>

              <div>
                <h1 className="text-xl font-black text-gray-900 dark:text-white">{fullName}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {employee?.position ?? roleInfo.label}
                  {employee?.department && <span className="text-sky-600 dark:text-sky-400"> · {employee.department.name}</span>}
                </p>
              </div>

              {employee && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                  <Hash size={10} /> ID Employé : {employee.employeeNumber}
                </p>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Employé actif
              </span>
            </div>
          </motion.div>

          {/* ══ STATS ══ */}
          {hasEmployee && (
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div variants={itemVariants}><StatCard label="Ancienneté" value={employee?.hireDate ? seniority(employee.hireDate) : '—'} trend="vs dernier" isPositive icon={Calendar} gradientFrom="from-sky-500" gradientTo="to-blue-600" /></motion.div>
              <motion.div variants={itemVariants}><StatCard label="Congés restants" value={`${stats.leaveBalance} jours dispo.`} trend="vs dernier" isPositive icon={Palmtree} gradientFrom="from-emerald-400" gradientTo="to-teal-600" /></motion.div>
              <motion.div variants={itemVariants}><StatCard label="Présences" value={`${stats.presencesThisMonth} ce mois-ci`} trend="vs dernier" isPositive icon={Fingerprint} gradientFrom="from-violet-500" gradientTo="to-purple-600" /></motion.div>
              <motion.div variants={itemVariants}><StatCard label="Absences" value={`${stats.absencesThisMonth} ce mois-ci`} trend="vs dernier" isPositive={stats.absencesThisMonth === 0} icon={XCircle} gradientFrom="from-orange-400" gradientTo="to-red-500" /></motion.div>
            </div>
          )}
        </div>

        {saveError && (
          <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            <AlertCircle size={14} /> {saveError}
          </motion.div>
        )}
        {saveSuccess && (
          <motion.div variants={itemVariants} className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> Profil mis à jour avec succès.
          </motion.div>
        )}

        {/* ══ DEUX COLONNES DE SECTIONS ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* Colonne gauche */}
          <div className="space-y-5">
            <Section title="Coordonnées">
              <Field icon={Phone} label="Téléphone" value={employee?.phone} editing={isEditing}>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+242 06 000 00 00" />
              </Field>
              <Field icon={Mail} label="Email" value={employee?.email} editing={isEditing}>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </Field>
              <Field icon={MapPin} label="Adresse" value={employee?.address} editing={isEditing}>
                <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} />
              </Field>
              <Field icon={MapPin} label="Ville" value={employee?.city} editing={isEditing}>
                <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} />
              </Field>
            </Section>

            <Section title="Identité & Famille" dense>
              <MiniField label="Date de naissance" value={fmtDate(employee?.dateOfBirth)} />
              <MiniField label="Âge" value={employee?.dateOfBirth ? `${calculateAge(employee.dateOfBirth)} ans` : undefined} />
              <MiniField label="Lieu de naissance" value={employee?.placeOfBirth} />
              <MiniField label="Genre" value={employee?.gender ? GENDER_LABELS[employee.gender] : undefined} editing={isEditing}>
                <FancySelect label="" value={form.gender} onChange={(v) => set('gender', v)} icon={Users} options={GENDER_OPTIONS} />
              </MiniField>
              <MiniField label="Situation familiale" value={employee?.maritalStatus ? MARITAL_OPTIONS.find(o => o.value === employee.maritalStatus)?.label : undefined} editing={isEditing}>
                <FancySelect label="" value={form.maritalStatus} onChange={(v) => set('maritalStatus', v)} icon={Heart} options={MARITAL_OPTIONS} />
              </MiniField>
              <MiniField label="Nombre d'enfants" value={employee?.numberOfChildren} editing={isEditing}>
                <input className={inputCls} type="number" min={0} value={form.numberOfChildren} onChange={e => set('numberOfChildren', parseInt(e.target.value) || 0)} />
              </MiniField>
              <MiniField label="Nationalité" value={employee?.nationality} editing={isEditing}>
                <FancySelect label="" value={form.nationality} onChange={(v) => set('nationality', v)} icon={Flag} placeholder="Sélectionner…" options={NATIONALITY_OPTIONS} />
              </MiniField>
              <MiniField label="Nom du père" value={employee?.fatherName} editing={isEditing}>
                <input className={inputCls} value={form.fatherName} onChange={e => set('fatherName', e.target.value)} />
              </MiniField>
              <MiniField label="Nom de la mère" value={employee?.motherName} editing={isEditing}>
                <input className={inputCls} value={form.motherName} onChange={e => set('motherName', e.target.value)} />
              </MiniField>
            </Section>

            <Section title="Santé & Divers" dense>
              <MiniField label="Groupe sanguin" value={employee?.bloodType} editing={isEditing}>
                <input className={inputCls} value={form.bloodType} onChange={e => set('bloodType', e.target.value)} placeholder="A+, O-…" />
              </MiniField>
              <MiniField label="Pathologie" value={employee?.pathology || 'Aucune renseignée'} editing={isEditing}>
                <input className={inputCls} value={form.pathology} onChange={e => set('pathology', e.target.value)} placeholder="Laisser vide si aucune" />
              </MiniField>
              <MiniField label="Niveau d'études" value={employee?.educationLevel} editing={isEditing}>
                <input className={inputCls} value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)} />
              </MiniField>
              <MiniField label="Langue étrangère" value={employee?.foreignLanguages} editing={isEditing}>
                <input className={inputCls} value={form.foreignLanguages} onChange={e => set('foreignLanguages', e.target.value)} />
              </MiniField>
              <MiniField label="Permis de conduire" value={employee?.hasDrivingLicense ? `Oui${employee?.drivingLicenseNumber ? ` — ${employee.drivingLicenseNumber}` : ''}` : (employee ? 'Non' : undefined)} editing={isEditing}>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hasDrivingLicense} onChange={e => set('hasDrivingLicense', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-sky-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">J'ai le permis</span>
                  </label>
                  {form.hasDrivingLicense && <input className={inputCls} value={form.drivingLicenseNumber} onChange={e => set('drivingLicenseNumber', e.target.value)} placeholder="N° du permis" />}
                </div>
              </MiniField>
              <MiniField label="Taille de la tenue" value={employee?.uniformSize} editing={isEditing}>
                <FancySelect label="" value={form.uniformSize} onChange={(v) => set('uniformSize', v)} icon={Shirt} placeholder="—" options={UNIFORM_OPTIONS} />
              </MiniField>
              <MiniField label="Pointure" value={employee?.shoeSize} editing={isEditing}>
                <input className={inputCls} value={form.shoeSize} onChange={e => set('shoeSize', e.target.value)} placeholder="42" />
              </MiniField>
            </Section>
          </div>

          {/* Colonne droite */}
          <div className="space-y-5">
            {hasEmployee && (
              <Section title="Informations professionnelles (gérées par les RH)">
                <Field icon={Briefcase} label="Poste" value={employee?.position} />
                <Field icon={Building2} label="Département" value={employee?.department?.name} />
                <Field icon={BadgeCheck} label="Type de contrat" value={employee?.contractType ? CONTRACT_LABELS[employee.contractType] ?? employee.contractType : undefined} />
                <Field icon={Calendar} label="Date d'embauche" value={fmtDate(employee?.hireDate)} />
                <Field icon={CreditCard} label="N° CNI" value={employee?.nationalIdNumber} />
                <Field icon={BadgeCheck} label="N° CNSS" value={employee?.cnssNumber} />
              </Section>
            )}

            <Section title="Personne à contacter en cas d'urgence">
              <Field icon={Users} label="Nom" value={employee?.emergencyContactName} editing={isEditing}>
                <input className={inputCls} value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
              </Field>
              <Field icon={Heart} label="Lien de parenté" value={employee?.emergencyContactRelation} editing={isEditing}>
                <input className={inputCls} value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} />
              </Field>
              <Field icon={Phone} label="Téléphone" value={employee?.emergencyContactPhone} editing={isEditing}>
                <input className={inputCls} value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
              </Field>
            </Section>

            {/* ══ SÉCURITÉ (mot de passe + déclencheur d'édition) ══ */}
            <Section title="Sécurité du compte">
              <div className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <KeyRound size={15} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Mot de passe</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white tracking-widest">••••••••••••••</p>
                  </div>
                </div>
                <button onClick={() => setShowPwdModal(true)} className="shrink-0 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                  <Lock size={13} /> Modifier le mot de passe
                </button>
              </div>

              <div className="py-3">
                {!isEditing ? (
                  <button
                    onClick={canEdit ? startEditing : undefined}
                    disabled={!canEdit}
                    title={canEdit ? undefined : "Votre RH doit d'abord vous autoriser à modifier votre profil"}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      canEdit
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/15'
                        : 'bg-gray-50 dark:bg-white/5 text-gray-350 dark:text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <Pencil size={13} /> Modifier mes informations
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEditing} disabled={isSaving} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                      <X size={13} /> Annuler
                    </button>
                    <button onClick={handleSaveProfile} disabled={isSaving || imageUpload.uploading} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                      {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Enregistrer
                    </button>
                  </div>
                )}
                {!canEdit && (
                  <p className="text-[11px] text-gray-400 text-center mt-2">Autorisation RH requise pour modifier votre profil.</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      </motion.div>

      {/* ── MODALE MOT DE PASSE ── */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center">
                <KeyRound size={18} className="text-sky-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Changer le mot de passe</h3>
                <p className="text-xs text-gray-400">Votre session reste active après le changement</p>
              </div>
            </div>

            {pwdSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-white mb-1">Mot de passe modifié !</p>
                <p className="text-xs text-gray-400 mb-5">Votre mot de passe a été mis à jour avec succès.</p>
                <button onClick={closePwdModal} className="px-6 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors">
                  Fermer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Mot de passe actuel</label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 focus-within:border-sky-400 transition-colors">
                    <Lock size={14} className="text-gray-400" />
                    <input type={showCurrent ? 'text' : 'password'} value={pwdForm.current} onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))} placeholder="Votre mot de passe actuel" className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none" />
                    <button type="button" onClick={() => setShowCurrent(v => !v)} className="text-gray-400 hover:text-gray-600"> {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Nouveau mot de passe</label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 focus-within:border-sky-400 transition-colors">
                    <Lock size={14} className="text-gray-400" />
                    <input type={showNext ? 'text' : 'password'} value={pwdForm.next} onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))} placeholder="Min. 8 car., 1 majuscule, 1 chiffre" className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none" />
                    <button type="button" onClick={() => setShowNext(v => !v)} className="text-gray-400 hover:text-gray-600">{showNext ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {pwdForm.next && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${pwdStrengthColor}`} /></div>
                      <span className="text-[11px] text-gray-400">{pwdStrengthLabel}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Confirmer le nouveau mot de passe</label>
                  <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900/40 focus-within:border-sky-400 transition-colors ${pwdForm.confirm && pwdForm.confirm !== pwdForm.next ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}>
                    <Lock size={14} className="text-gray-400" />
                    <input type={showConfirmPwd ? 'text' : 'password'} value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Répétez le nouveau mot de passe" className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none" />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="text-gray-400 hover:text-gray-600">{showConfirmPwd ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                </div>
                {pwdError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-300">{pwdError}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={closePwdModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium">Annuler</button>
                  <button onClick={handlePasswordChange} disabled={pwdLoading || !pwdForm.current || !pwdForm.next || !pwdForm.confirm} className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    {pwdLoading ? <><Loader2 size={14} className="animate-spin" /> Modification…</> : 'Modifier'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}