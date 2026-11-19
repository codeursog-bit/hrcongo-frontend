'use client';

import { AppearanceLink } from '@/components/appearance/AppearanceLink';
import React, { useEffect, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { SettingsPage } from '@/components/templates';
import { Card, Button, Skeleton } from '@/components/design-system/primitives';
import { Modal, SuccessMark, useToast } from '@/components/design-system/feedback';
import { ThemeControl } from '@/components/layout/ThemeControl';
import './account.css';
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Calendar, Briefcase, Building2,
  Users, Heart, Flag, CreditCard, BadgeCheck, Hash,
  Shirt,
  CheckCircle2, KeyRound, Eye, EyeOff,
  AlertCircle, Lock, Pencil, Save, X, Camera, Loader,
} from 'lucide-react';
import { api } from '@/services/api';
import { PushToggleButton } from '@/components/PushNotificationBanner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { NATIONALITY_OPTIONS } from '@/lib/nationalities';
import { invalidateMyEmployeePhotoCache } from '@/hooks/useMyEmployeePhoto';

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
  SUPER_ADMIN: { label: 'Super Admin',    color: 'bg-[var(--mustard)]' },
  ADMIN:       { label: 'Administrateur', color: 'bg-[var(--mustard)]' },
  HR_MANAGER:  { label: 'Responsable RH', color: 'bg-[var(--green)]' },
  MANAGER:     { label: 'Manager',        color: 'bg-[var(--mustard)]' },
  EMPLOYEE:    { label: 'Employé',        color: 'bg-[var(--green)]' },
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

function Field({ icon: Icon, label, value, editing, children }: { icon: React.ElementType; label: string; value?: React.ReactNode; editing?: boolean; children?: React.ReactNode }) {
  const id = useId();
  return <div className="account-field"><Icon strokeWidth={1.5} size={18} aria-hidden="true" /><div>{editing ? <><label htmlFor={id}>{label}</label>{React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { id }) : children}</> : <><span className="account-label">{label}</span><p>{value ?? '—'}</p></>}</div></div>;
}
const inputCls = 'k-input';
function MiniField({ label, value, editing, children }: { label: string; value?: React.ReactNode; editing?: boolean; children?: React.ReactNode }) {
  const id = useId(); const native = React.isValidElement(children) && ['input', 'select'].includes(String(children.type));
  return <div className="account-mini" role={editing && !native ? 'group' : undefined} aria-label={editing && !native ? label : undefined}>{editing && native ? <label htmlFor={id}>{label}</label> : <span className="account-label">{label}</span>}{editing ? native ? React.cloneElement(children as React.ReactElement<any>, { id }) : children : <p>{value ?? '—'}</p>}</div>;
}
function Section({ title, children, dense }: { title: string; children: React.ReactNode; dense?: boolean }) {
  return <Card title={title} className="account-section"><div className={dense ? 'account-fields-grid' : 'account-fields'}>{children}</div></Card>;
}
function AccountSkeleton() {
  return <div className="account template-page" role="status" aria-label="Chargement de votre compte"><Skeleton className="account-title-skeleton" /><Card><Skeleton className="account-profile-skeleton" /></Card><div className="account-columns">{[0,1].map(i => <Card key={i}><div className="k-stack">{[0,1,2,3].map(j => <Skeleton key={j} />)}</div></Card>)}</div></div>;
}

// ============================================================================
// Page
// ============================================================================

export default function MonProfilPage() {
  const router = useRouter();
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [employee, setEmployee] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasEmployee, setHasEmployee] = useState(true);

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

  // 🔧 FIX : ADMIN/SUPER_ADMIN/CABINET_* étaient exclus, donc GET /employees/me
  // n'était jamais appelé pour eux — même quand ils avaient bien une fiche
  // employé (photo, situation familiale, etc.), rien ne remontait, la page
  // retombait uniquement sur le User (nom/prénom/email, rien d'autre). Le
  // 404 "Profil employé introuvable" est déjà catché juste en dessous
  // (setHasEmployee(false)) quand un admin n'a réellement pas de fiche.
  const ROLES_WITH_EMPLOYEE_PROFILE = [
    'EMPLOYEE', 'HR_MANAGER', 'MANAGER',
    'ADMIN', 'SUPER_ADMIN', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE',
  ];

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
      // 🔒 maritalStatus/numberOfChildren restent dans `form` uniquement pour
      // l'affichage (formStateFromEmployee) — jamais envoyés ici : le back
      // (SelfServiceUpdateEmployeeDto) ne les déclare plus du tout, et avec
      // forbidNonWhitelisted:true, les envoyer ferait échouer TOUTE la requête
      // en 400, pas seulement ces deux champs.
      const { maritalStatus, numberOfChildren, ...editablePayload } = form;
      const payload = { ...editablePayload, photoUrl: imageUpload.uploadedUrl || form.photoUrl || undefined };
      const updated = await api.patch<EmployeeProfile>('/employees/me', payload);
      setEmployee(updated);
      setForm(formStateFromEmployee(updated));
      invalidateMyEmployeePhotoCache(); // 🆕 sidebar/topnav récupèrent la nouvelle photo au prochain montage
      setIsEditing(false);
      setSaveSuccess(true);
      toast('success', 'Profil enregistré', 'Vos informations ont été mises à jour.');
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
      toast('success', 'Mot de passe modifié');
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
      <AccountSkeleton />
    );
  }
  if (!authUser) return null;

  const roleInfo = ROLE_META[authUser.role] ?? ROLE_META.EMPLOYEE;
  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : `${authUser.firstName} ${authUser.lastName}`;
  const canEdit = !!employee?.selfServiceEnabled;
  const avatarSrc = imageUpload.preview || form.photoUrl || employee?.photoUrl
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=F7874B&color=fff&size=256`;

  const pwdChecks = [/[A-Z]/.test(pwdForm.next), /[a-z]/.test(pwdForm.next), /[0-9]/.test(pwdForm.next), pwdForm.next.length >= 8];
  const pwdStrength = pwdChecks.filter(Boolean).length;
  const pwdStrengthColor = pwdStrength === 4 ? 'bg-[var(--green)] w-full' : pwdStrength >= 2 ? 'bg-[var(--mustard)] w-2/3' : 'bg-[var(--danger)] w-1/3';
  const pwdStrengthLabel = pwdStrength === 4 ? '✓ Excellent' : pwdStrength >= 2 ? 'Moyen' : 'Faible';

  const set = <K extends keyof EditableFields>(key: K, value: EditableFields[K]) => setForm(f => ({ ...f, [key]: value }));

  const profileActions = (<div className="account-save-actions">
                {!isEditing ? (
                  <Button
                    onClick={canEdit ? startEditing : undefined}
                    disabled={!canEdit}
                    title={canEdit ? undefined : "Votre RH doit d'abord vous autoriser à modifier votre profil"}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      canEdit
                        ? 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--green)]/40'
                        : 'bg-[var(--surface-2)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Pencil strokeWidth={1.5} size={13} /> Modifier mes informations
                  </Button>
                ) : (
                  <div>
                    <Button onClick={cancelEditing} disabled={isSaving} variant="secondary">
                      <X strokeWidth={1.5} size={13} /> Annuler
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving || imageUpload.uploading} className="k-button-primary">
                      {isSaving ? <Loader2 strokeWidth={1.5} size={13} className="animate-spin" /> : <Save strokeWidth={1.5} size={13} />} Enregistrer
                    </Button>
                  </div>
                )}
                {!canEdit && (
                  <p className="text-[11px] text-[var(--text-secondary)] text-center mt-2">Autorisation RH requise pour modifier votre profil.</p>
                )}
              </div>);

  return (
    <div className="account">

      <SettingsPage title="Mon compte" description="Votre profil, vos accès et vos préférences." onSubmit={e => e.preventDefault()} saveAction={profileActions}
        navigation={<nav className="account-nav" aria-label="Sections du compte"><a href="#profil">Profil</a><a href="#preferences">Préférences</a><a href="#acces">Mes accès</a><a href="#securite">Sécurité</a></nav>}>
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft strokeWidth={1.5} size={16} /> Retour</Button>
        <motion.div initial={reduceMotion ? false : 'hidden'} animate="visible" variants={containerVariants} className="account-stack">
        {/* ══ EN-TÊTE ══ */}
        <motion.div variants={itemVariants} className="account-identity k-card" id="profil">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <div className="relative shrink-0">
              <img src={avatarSrc} alt={fullName} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-[var(--border)]" />
              {isEditing && (
                <label className="account-photo-picker absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--green)] rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-[var(--green)] transition-colors">
                  {imageUpload.uploading ? <Loader strokeWidth={1.5} size={13} className="text-white animate-spin" /> : <Camera strokeWidth={1.5} size={13} className="text-white" />}
                  <input aria-label="Choisir une photo de profil" type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && imageUpload.handleFileSelect(e.target.files[0])} />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-[var(--text)]">{fullName}</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {employee?.position ?? roleInfo.label}
                {employee?.department && <span className="text-[var(--success-text)]"> · {employee.department.name}</span>}
              </p>
              {employee && (
                <p className="text-xs font-medium text-[var(--text-secondary)] flex items-center justify-center sm:justify-start gap-1 mt-2">
                  <Hash strokeWidth={1.5} size={10} /> ID Employé : {employee.employeeNumber}
                  {employee.hireDate && <span className="normal-case font-semibold">· Ancienneté : {seniority(employee.hireDate)}</span>}
                </p>
              )}
              <span className="account-role">{roleInfo.label}{employee?.status ? ' · ' + (employee.status === 'ACTIVE' ? 'Actif' : employee.status === 'INACTIVE' ? 'Inactif' : employee.status) : ''}</span>
            </div>
          </div>
        </motion.div>

        {saveError && (
          <motion.div variants={itemVariants} role="alert" className="k-error account-feedback">
            <AlertCircle strokeWidth={1.5} size={14} /> {saveError}
          </motion.div>
        )}
        {saveSuccess && (
          <motion.div variants={itemVariants} role="status" className="account-success account-feedback">
            <CheckCircle2 strokeWidth={1.5} size={14} /> Profil mis à jour avec succès.
          </motion.div>
        )}

        {/* ══ DEUX COLONNES DE SECTIONS ══ */}
        <div className="account-columns">

          {/* Colonne gauche */}
          <div className="account-stack">
            <Section title="Coordonnées">
              {!hasEmployee && <p className="k-help">Aucune fiche employé associée. Contactez votre RH pour la compléter.</p>}
              <Field icon={Phone} label="Téléphone" value={employee?.phone} editing={isEditing}>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+242 06 000 00 00" />
              </Field>
              <Field icon={Mail} label="Email" value={employee?.email || authUser.email} editing={isEditing}>
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
                <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}><option value="">Sélectionner…</option>{GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </MiniField>
              {/*
                🔒 Situation familiale / Nombre d'enfants : jamais éditables par
                l'employé lui-même (impact direct sur la paie — nombre de
                parts fiscales). `editing={false}` en dur, quel que soit
                isEditing : toujours affiché en lecture seule ici, même quand
                le reste du profil est en mode édition. Seul un ADMIN/HR_MANAGER
                peut les modifier, via la fiche employé complète.
              */}
              <MiniField label="Situation familiale" value={employee?.maritalStatus ? MARITAL_OPTIONS.find(o => o.value === employee.maritalStatus)?.label : undefined} editing={false} />
              <MiniField label="Nombre d'enfants" value={employee?.numberOfChildren} editing={false} />
              <MiniField label="Nationalité" value={employee?.nationality} editing={isEditing}>
                <select className={inputCls} value={form.nationality} onChange={e => set('nationality', e.target.value)}><option value="">Sélectionner…</option>{NATIONALITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
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
                    <input type="checkbox" checked={form.hasDrivingLicense} onChange={e => set('hasDrivingLicense', e.target.checked)} className="w-4 h-4 rounded border-[var(--border)] text-[var(--success-text)] accent-[var(--green)]" />
                    <span className="text-sm text-[var(--text)]">J'ai le permis</span>
                  </label>
                  {form.hasDrivingLicense && <input className={inputCls} value={form.drivingLicenseNumber} onChange={e => set('drivingLicenseNumber', e.target.value)} placeholder="N° du permis" />}
                </div>
              </MiniField>
              <MiniField label="Taille de la tenue" value={employee?.uniformSize} editing={isEditing}>
                <select className={inputCls} value={form.uniformSize} onChange={e => set('uniformSize', e.target.value)}><option value="">—</option>{UNIFORM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </MiniField>
              <MiniField label="Pointure" value={employee?.shoeSize} editing={isEditing}>
                <input className={inputCls} value={form.shoeSize} onChange={e => set('shoeSize', e.target.value)} placeholder="42" />
              </MiniField>
            </Section>
          </div>

          {/* Colonne droite */}
          <div className="account-stack">
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
            <div id="securite"><Section title="Sécurité du compte">
              <div className="flex items-center justify-between py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                    <KeyRound strokeWidth={1.5} size={15} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">Mot de passe</p>
                    <p className="text-sm font-semibold text-[var(--text)] tracking-widest">••••••••••••••</p>
                  </div>
                </div>
                <Button onClick={() => setShowPwdModal(true)} className="k-button-primary">
                  <Lock strokeWidth={1.5} size={13} /> Modifier le mot de passe
                </Button>
              </div>

              <div className="account-access"><Link href="/parametres/securite">Authentification à deux facteurs <span aria-hidden="true">↗</span></Link><p>Configurer la protection de connexion dans les réglages de sécurité.</p></div>
            </Section></div>
          </div>
        </div>
      </motion.div>
        <AppearanceLink />
        <div id="preferences"><Section title="Préférences"><ThemeControl /><div className="account-preference"><span>Langue de l’interface</span><strong>Français</strong><p className="k-help">Le choix d’autres langues sera disponible prochainement.</p></div><div className="account-preference"><span>Afficher mon anniversaire à mes collègues</span><p className="k-help">Réglage bientôt disponible. Aucun changement de visibilité n’est appliqué ici.</p></div></Section></div>
        <div id="acces"><Section title="Mes accès"><div className="account-access"><Link href="/ma-paie">Ma paie et mes bulletins <span aria-hidden="true">↗</span></Link><p>Consulter les bulletins disponibles dans votre espace paie.</p></div><div className="account-access"><Link href="/ma-signature">Ma signature personnelle <span aria-hidden="true">↗</span></Link><p>L’enregistrement reste soumis au droit de signature accordé par votre administration.</p></div></Section></div>
        <Section title="Notifications"><div className="account-access"><Link href="/notifications">Voir mes notifications <span aria-hidden="true">↗</span></Link><p>Retrouver les informations et les demandes qui vous concernent.</p></div><div className="account-push"><p>Notifications sur cet appareil</p><PushToggleButton /></div></Section>
      </SettingsPage>

      {/* ── MODALE MOT DE PASSE ── */}
      {showPwdModal && <Modal open={showPwdModal} onClose={closePwdModal} title="Changer le mot de passe"><div className="account-password"><p className="k-help">Votre session reste active après le changement.</p>
            {pwdSuccess ? (
              <div className="text-center py-4">
                <SuccessMark />
                <p className="font-bold text-[var(--text)] mb-1">Mot de passe modifié !</p>
                <p className="text-xs text-[var(--text-secondary)] mb-5">Votre mot de passe a été mis à jour avec succès.</p>
                <Button onClick={closePwdModal} variant="secondary">
                  Fermer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Mot de passe actuel</label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] focus-within:border-[var(--brand)] transition-colors">
                    <Lock strokeWidth={1.5} size={14} className="text-[var(--text-secondary)]" />
                    <input type={showCurrent ? 'text' : 'password'} aria-label="Mot de passe actuel" autoComplete="current-password" value={pwdForm.current} onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))} placeholder="Votre mot de passe actuel" className="flex-1 bg-transparent text-[var(--text)] text-sm outline-none" />
                    <Button variant="ghost" aria-label={showCurrent ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} type="button" onClick={() => setShowCurrent(v => !v)}> {showCurrent ? <EyeOff strokeWidth={1.5} size={14} /> : <Eye strokeWidth={1.5} size={14} />}</Button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nouveau mot de passe</label>
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] focus-within:border-[var(--brand)] transition-colors">
                    <Lock strokeWidth={1.5} size={14} className="text-[var(--text-secondary)]" />
                    <input type={showNext ? 'text' : 'password'} aria-label="Nouveau mot de passe" autoComplete="new-password" value={pwdForm.next} onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))} placeholder="Min. 8 car., 1 majuscule, 1 chiffre" className="flex-1 bg-transparent text-[var(--text)] text-sm outline-none" />
                    <Button variant="ghost" aria-label={showNext ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} type="button" onClick={() => setShowNext(v => !v)}>{showNext ? <EyeOff strokeWidth={1.5} size={14} /> : <Eye strokeWidth={1.5} size={14} />}</Button>
                  </div>
                  {pwdForm.next && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${pwdStrengthColor}`} /></div>
                      <span className="text-[11px] text-[var(--text-secondary)]">{pwdStrengthLabel}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Confirmer le nouveau mot de passe</label>
                  <div className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border bg-[var(--surface-2)] focus-within:border-[var(--brand)] transition-colors ${pwdForm.confirm && pwdForm.confirm !== pwdForm.next ? 'border-[var(--danger)]' : 'border-[var(--border)]'}`}>
                    <Lock strokeWidth={1.5} size={14} className="text-[var(--text-secondary)]" />
                    <input type={showConfirmPwd ? 'text' : 'password'} aria-label="Confirmer le nouveau mot de passe" autoComplete="new-password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Répétez le nouveau mot de passe" className="flex-1 bg-transparent text-[var(--text)] text-sm outline-none" />
                    <Button variant="ghost" aria-label={showConfirmPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} type="button" onClick={() => setShowConfirmPwd(v => !v)}>{showConfirmPwd ? <EyeOff strokeWidth={1.5} size={14} /> : <Eye strokeWidth={1.5} size={14} />}</Button>
                  </div>
                </div>
                {pwdError && (
                  <div role="alert" className="k-error account-feedback">
                    <AlertCircle strokeWidth={1.5} size={14} className="text-[var(--danger-text)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--danger-text)]">{pwdError}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <Button onClick={closePwdModal} variant="secondary">Annuler</Button>
                  <Button onClick={handlePasswordChange} disabled={pwdLoading || !pwdForm.current || !pwdForm.next || !pwdForm.confirm} className="k-button-primary">
                    {pwdLoading ? <><Loader2 strokeWidth={1.5} size={14} className="animate-spin" /> Modification…</> : 'Modifier'}
                  </Button>
                </div>
              </div>
            )}
      </div></Modal>}
    </div>
  );
}
