'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, FileText, Trash2, Clock, Wallet, Calendar, 
  CheckCircle, Mail, Phone, MapPin, Building2, User, Download, 
  AlertCircle, Printer, Eye, EyeOff,
  Briefcase, BadgeCheck, X,
  Laptop, Plus, Loader2, Shield, Award,
  BookOpen, Hash, CreditCard, ChevronRight,
  Gift, TrendingUp, Star, CalendarDays,
  HeartPulse, Users, GraduationCap, Car, Languages, Shirt, AlertTriangle, UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays } from 'date-fns';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { SalaryRecap } from '@/components/employees/SalaryRecap';

type TabType = 'info' | 'docs' | 'paie' | 'conges' | 'materiel';

const TEMP_CONTRACTS = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT', 'PRESTATAIRE'];
const BNC_CONTRACTS  = ['CONSULTANT', 'PRESTATAIRE'];

interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string | null; // ✅ AJOUT
  address: string;
  city: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  employeeNumber: string;
  hireDate: string;
  contractType: string;
  contractEndDate?: string | null;
  position: string;
  baseSalary: number;
  department: { name: string };
  nationalIdNumber: string;
  cnssNumber: string;
  photoUrl: string;
  isSubjectToIrpp: boolean;
  isSubjectToCnss: boolean;
  taxExemptionReason: string;
  professionalCategory: string;
  echelon: string;
  paymentMethod: string;
  // Période d'essai
  trialPeriodDays?: number | null;
  trialEndDate?: string | null;
  trialConfirmedAt?: string | null;
  trialStatus?: string;
  // BNC
  isResident?: boolean;
  nationality?: string | null;
  // 🆕 Champs réellement saisis à la création mais jamais affichés ici
  bankName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyOperator?: string | null;
  mobileMoneyNumber?: string | null;
  taxNumber?: string | null;
  niu?: string | null;
  tolZone?: string | null;
  // 🆕 Fiche ORCA — Informations complémentaires
  bloodType?: string | null;
  pathology?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  educationLevel?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string | null;
  foreignLanguages?: string | null;
  uniformSize?: string | null;
  shoeSize?: string | null;
  selfServiceEnabled?: boolean;
}

function getRoleFromStorage(): string {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'EMPLOYEE';
    const u = JSON.parse(raw);
    return u?.role || 'EMPLOYEE';
  } catch {
    return 'EMPLOYEE';
  }
}

// 🆕 Calcule l'âge à partir de la date de naissance
function calculateAge(dateOfBirth?: string | null): number | string {
  if (!dateOfBirth) return '—';
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return '—';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

// 🆕 Composant durée + jours restants pour contrats temporaires
function ContractCountdown({ contractType, hireDate, contractEndDate }: {
  contractType: string;
  hireDate: string;
  contractEndDate?: string | null;
}) {
  if (!TEMP_CONTRACTS.includes(contractType) || !contractEndDate) return null;

  const today    = new Date();
  const endDate  = new Date(contractEndDate);
  const start    = new Date(hireDate);
  const totalDays = differenceInDays(endDate, start);
  const daysLeft  = differenceInDays(endDate, today);
  const isExpired = daysLeft < 0;
  const pctElapsed = Math.min(100, Math.round(((totalDays - Math.max(daysLeft, 0)) / totalDays) * 100));

  const urgencyColor = isExpired
    ? 'text-[var(--text-muted)]'
    : daysLeft <= 7  ? 'text-red-600 dark:text-red-400'
    : daysLeft <= 14 ? 'text-amber-600 dark:text-amber-400'
    : daysLeft <= 30 ? 'text-yellow-600 dark:text-yellow-500'
    : 'text-emerald-600 dark:text-emerald-400';

  const barColor = isExpired
    ? 'bg-gray-400'
    : daysLeft <= 7  ? 'bg-red-500'
    : daysLeft <= 14 ? 'bg-amber-500'
    : daysLeft <= 30 ? 'bg-yellow-500'
    : 'bg-emerald-500';

  const durationLabel = totalDays < 30
    ? `${totalDays}j`
    : totalDays < 365
    ? `${Math.floor(totalDays / 30)} mois`
    : `${Math.floor(totalDays / 365)} an${Math.floor(totalDays / 365) > 1 ? 's' : ''}`;

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-3">
      {/* Date de fin */}
      <div>
        <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1">
          <CalendarDays size={11} /> Date de fin de contrat
        </p>
        <p className={`font-bold ${urgencyColor}`}>
          {endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Barre progression */}
      <div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
          <span>Durée totale : {durationLabel}</span>
          <span>{pctElapsed}% écoulé</span>
        </div>
        <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pctElapsed}%` }}
          />
        </div>
      </div>

      {/* Jours restants */}
      {isExpired ? (
        <div className="flex items-center gap-2 p-2 bg-[var(--surface-2)] rounded-lg">
          <span className="text-xs font-bold text-[var(--text-muted)]">⚠️ Contrat expiré</span>
        </div>
      ) : (
        <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
          daysLeft <= 7
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            : daysLeft <= 30
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
        }`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${barColor} ${daysLeft <= 7 ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold ${urgencyColor}`}>
            {daysLeft <= 7
              ? `🔴 Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} !`
              : daysLeft <= 30
              ? `🟠 ${daysLeft} jours restants`
              : `✅ ${daysLeft} jours restants`
            }
          </span>
        </div>
      )}
    </div>
  );
}

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { bp } = useBasePath();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showSalary, setShowSalary] = useState(false);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyConvention, setCompanyConvention] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{ name?: string; logoUrl?: string | null; address?: string | null; rccmNumber?: string | null }>({});
  const [isGeneratingFiche, setIsGeneratingFiche] = useState(false);
  const [isTogglingSelfService, setIsTogglingSelfService] = useState(false);

  const [userRole, setUserRole] = useState('EMPLOYEE');
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(userRole);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  // 🆕 Primes de l'employé — pour le récap "Salaire contractuel" (brut/net
  // basé sur le salaire de base + primes mensuelles récurrentes uniquement,
  // hors 13e mois et primes ponctuelles à mois ciblé)
  const [employeeBonuses, setEmployeeBonuses] = useState<any[]>([]);

  useEffect(() => {
    setUserRole(getRoleFromStorage());
  }, []);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const data = await api.get<EmployeeDetail>(`/employees/${params.id}`);
        setEmployee(data);
        try {
          const company: any = await api.get('/companies/mine');
          if (company?.collectiveAgreement) setCompanyConvention(company.collectiveAgreement);
          setCompanyInfo({
            name: company?.tradeName || company?.legalName,
            logoUrl: company?.logo,
            address: company?.address ? `${company.address}${company?.city ? `, ${company.city}` : ''}` : undefined,
            rccmNumber: company?.rccmNumber,
          });
        } catch {}
        // 🆕 Primes — best-effort, ne bloque pas l'affichage de la fiche si ça échoue
        try {
          const bonuses = await api.get<any[]>(`/employee-bonuses?employeeId=${params.id}`);
          setEmployeeBonuses(bonuses || []);
        } catch {}
      } catch (e) {
        console.error('Error fetching employee', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  useEffect(() => {
    if (!employee || activeTab === 'info') return;
    const fetchTabData = async () => {
      setTabLoading(true);
      setTabData(null);
      try {
        let data;
        if (activeTab === 'docs')     data = await api.get(`/documents/employee/${employee.id}`);
        if (activeTab === 'paie')     data = await api.get(`/payrolls?employeeId=${employee.id}`);
        if (activeTab === 'conges')   data = await api.get(`/leaves?employeeId=${employee.id}`);
        if (activeTab === 'materiel') data = await api.get(`/assets/employee/${employee.id}`);
        setTabData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, employee]);

  const handleDelete = async () => {
    if (!employee) return;
    setIsDeleting(true);
    try {
      await api.delete(`/employees/${params.id}`);
      router.push(bp('/employes'));
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // 🆕 Génère et télécharge la fiche de renseignement en PDF (inspirée du modèle ORCA)
  // 🆕 Autoriser / révoquer l'auto-service employé (édition de son propre profil)
  const handleToggleSelfService = async () => {
    if (!employee) return;
    setIsTogglingSelfService(true);
    try {
      const next = !employee.selfServiceEnabled;
      const res: any = await api.patch(`/employees/${params.id}/self-service`, { enabled: next });
      setEmployee(prev => prev ? { ...prev, selfServiceEnabled: !!res.selfServiceEnabled } : prev);
    } catch (err: any) {
      alert(err?.message || "Erreur lors de la mise à jour de l'accès");
    } finally {
      setIsTogglingSelfService(false);
    }
  };

  const handleDownloadFiche = async () => {
    if (!employee) return;
    setIsGeneratingFiche(true);
    try {
      const [{ pdf }, { FicheEmployePdf }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/employees/FicheEmployePdf'),
      ]);
      const doc = (
        <FicheEmployePdf
          employee={{
            employeeNumber: employee.employeeNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            dateOfBirth: employee.dateOfBirth,
            placeOfBirth: employee.placeOfBirth,
            bloodType: employee.bloodType,
            pathology: employee.pathology,
            address: employee.address,
            phone: employee.phone,
            email: employee.email,
            fatherName: employee.fatherName,
            motherName: employee.motherName,
            maritalStatus: employee.maritalStatus,
            numberOfChildren: employee.numberOfChildren,
            position: employee.position,
            departmentName: employee.department?.name,
            educationLevel: employee.educationLevel,
            emergencyContactName: employee.emergencyContactName,
            emergencyContactRelation: employee.emergencyContactRelation,
            emergencyContactPhone: employee.emergencyContactPhone,
            hasDrivingLicense: employee.hasDrivingLicense,
            drivingLicenseNumber: employee.drivingLicenseNumber,
            foreignLanguages: employee.foreignLanguages,
            bankAccountNumber: employee.bankAccountNumber,
            cnssNumber: employee.cnssNumber,
            nationalIdNumber: employee.nationalIdNumber,
            uniformSize: employee.uniformSize,
            shoeSize: employee.shoeSize,
            hireDate: employee.hireDate,
          }}
          company={companyInfo}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = `${employee.lastName}_${employee.firstName}`.replace(/\s+/g, '_');
      a.href = url;
      a.download = `fiche_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Erreur génération fiche PDF', err);
      alert("Impossible de générer la fiche PDF pour le moment.");
    } finally {
      setIsGeneratingFiche(false);
    }
  };

  const getAnciennete = () => {
    if (!employee?.hireDate) return '';
    const hire = new Date(employee.hireDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${rem} mois`;
    return `${years} an${years > 1 ? 's' : ''}${rem > 0 ? ` ${rem} mois` : ''}`;
  };

  if (isLoading || !employee) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'info') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-8">

            {/* Informations personnelles */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <User size={20} className="text-emerald-500" /> Informations Personnelles
              </h3>
              <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Nom complet</p>
                  <p className="font-medium text-[var(--text)]">{employee.firstName} {employee.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Date de naissance</p>
                  <p className="font-medium text-[var(--text)]">{new Date(employee.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Âge</p>
                  <p className="font-medium text-[var(--text)]">{calculateAge(employee.dateOfBirth)} ans</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Lieu de naissance</p>
                  <p className="font-medium text-[var(--text)]">{employee.placeOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Genre</p>
                  <p className="font-medium text-[var(--text)]">{employee.gender === 'MALE' ? 'Homme' : 'Femme'}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Phone size={11} /> Téléphone</p>
                  <p className="font-medium font-mono text-[var(--text)]">{employee.phone}</p>
                </div>
                {employee.secondaryPhone && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Phone size={11} /> Téléphone secondaire</p>
                    <p className="font-medium font-mono text-[var(--text)]">{employee.secondaryPhone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Mail size={11} /> Email</p>
                  <p className="font-medium text-[var(--text)] truncate">{employee.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><MapPin size={11} /> Adresse</p>
                  <p className="font-medium text-[var(--text)]">{employee.address}{employee.city ? `, ${employee.city}` : ''}</p>
                </div>
                {(employee.maritalStatus || employee.numberOfChildren >= 0) && (
                  <>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Situation familiale</p>
                      <p className="font-medium text-[var(--text)]">
                        {employee.maritalStatus === 'SINGLE' ? 'Célibataire' : employee.maritalStatus === 'MARRIED' ? 'Marié(e)' : employee.maritalStatus === 'DIVORCED' ? 'Divorcé(e)' : 'Veuf/Veuve'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Enfants à charge</p>
                      <p className="font-medium text-[var(--text)]">{employee.numberOfChildren || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Documents administratifs */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-emerald-500" /> Documents Administratifs
              </h3>
              <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Hash size={11} /> N° CNI / Passeport</p>
                  <p className="font-semibold font-mono text-[var(--text)]">{employee.nationalIdNumber || <span className="text-[var(--text-muted)] italic text-sm font-sans font-normal">Non renseigné</span>}</p>
                </div>
                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Shield size={11} /> N° CNSS</p>
                  <p className="font-semibold font-mono text-[var(--text)]">{employee.cnssNumber || <span className="text-[var(--text-muted)] italic text-sm font-sans font-normal">Non renseigné</span>}</p>
                </div>
              </div>
            </section>

            {/* 🆕 Informations complémentaires (Fiche ORCA) */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <HeartPulse size={20} className="text-amber-500" /> Informations Complémentaires
              </h3>
              <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Groupe sanguin</p>
                    <p className="font-medium text-[var(--text)]">{employee.bloodType || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><GraduationCap size={11} /> Niveau d'études</p>
                    <p className="font-medium text-[var(--text)]">{employee.educationLevel || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Pathologie / maladie habituelle</p>
                    <p className="font-medium text-[var(--text)]">{employee.pathology || <span className="text-[var(--text-muted)] italic text-sm">Aucune renseignée</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Users size={11} /> Nom & prénom(s) du père</p>
                    <p className="font-medium text-[var(--text)]">{employee.fatherName || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Users size={11} /> Nom & prénom(s) de la mère</p>
                    <p className="font-medium text-[var(--text)]">{employee.motherName || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Languages size={11} /> Langue étrangère</p>
                    <p className="font-medium text-[var(--text)]">{employee.foreignLanguages || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Car size={11} /> Permis de conduire</p>
                    <p className="font-medium text-[var(--text)]">
                      {employee.hasDrivingLicense
                        ? `Oui${employee.drivingLicenseNumber ? ` — ${employee.drivingLicenseNumber}` : ''}`
                        : <span className="text-[var(--text-muted)] italic text-sm">Non</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1"><Shirt size={11} /> Taille de la tenue</p>
                    <p className="font-medium text-[var(--text)]">{employee.uniformSize || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Pointure de chaussures</p>
                    <p className="font-medium text-[var(--text)]">{employee.shoeSize || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                  </div>
                </div>

                {(employee.emergencyContactName || employee.emergencyContactPhone) && (
                  <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1"><AlertTriangle size={11} /> Personne à contacter en cas d'urgence</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)]">Nom</p>
                        <p className="font-semibold text-[var(--text)]">{employee.emergencyContactName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)]">Lien de parenté</p>
                        <p className="font-semibold text-[var(--text)]">{employee.emergencyContactRelation || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[var(--text-muted)]">Téléphone</p>
                        <p className="font-semibold font-mono text-[var(--text)]">{employee.emergencyContactPhone || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Convention collective */}
            {(companyConvention || employee.professionalCategory) && (
              <section>
                <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                  <Award size={20} className="text-amber-500" /> Classification Conventionnelle
                </h3>
                <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)] space-y-3">
                  {companyConvention && (
                    <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                      <div>
                        <p className="text-xs text-amber-500 mb-0.5">Convention Collective</p>
                        <p className="font-bold text-amber-900 dark:text-amber-100">{companyConvention}</p>
                      </div>
                      <BookOpen size={20} className="text-amber-400" />
                    </div>
                  )}
                  {employee.professionalCategory && (
                    <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                      <div>
                        <p className="text-xs text-[var(--text-muted)] mb-0.5">Catégorie Professionnelle</p>
                        <p className="font-bold font-mono text-[var(--text)]">{employee.professionalCategory}</p>
                      </div>
                      {employee.echelon && (
                        <div className="text-right">
                          <p className="text-xs text-[var(--text-muted)] mb-0.5">Échelon</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">{employee.echelon}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Régime fiscal */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Shield size={20} className="text-emerald-500" /> Régime Fiscal
              </h3>
              <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${employee.isSubjectToIrpp ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${employee.isSubjectToIrpp ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">IRPP / ITS</p>
                      <p className="text-xs text-[var(--text-muted)]">{employee.isSubjectToIrpp ? 'Soumis' : 'Exempté'}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${employee.isSubjectToCnss ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${employee.isSubjectToCnss ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)]">CNSS (4%)</p>
                      <p className="text-xs text-[var(--text-muted)]">{employee.isSubjectToCnss ? 'Soumis' : 'Exempté'}</p>
                    </div>
                  </div>
                </div>
                {employee.taxExemptionReason && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span><strong>Raison d'exemption :</strong> {employee.taxExemptionReason}</span>
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* EMPLOI — 🆕 avec durée contrat */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-amber-500" /> Emploi
              </h3>
              <div className="bg-[var(--surface-2)] rounded-2xl p-6 border border-[var(--border)] space-y-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Date d'embauche</p>
                  <p className="font-medium text-[var(--text)]">{new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Ancienneté : {getAnciennete()}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Type de contrat</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold ${
                    employee.contractType === 'CDI'         ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                    employee.contractType === 'CDD'         ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                    employee.contractType === 'STAGE'       ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                    employee.contractType === 'CONSULTANT'  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                    employee.contractType === 'PRESTATAIRE' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    <Briefcase size={12} />
                    {employee.contractType === 'CDI' ? '♾️ CDI' :
                     employee.contractType === 'CDD' ? '📅 CDD' :
                     employee.contractType === 'STAGE' ? '🎓 Stage' :
                     employee.contractType === 'CONSULTANT' ? '💼 Consultant' :
                     employee.contractType === 'PRESTATAIRE' ? '🤝 Prestataire' :
                     employee.contractType === 'INTERIM' ? '🔄 Intérim' :
                     employee.contractType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Poste occupé</p>
                  <p className="font-medium text-[var(--text)]">{employee.position}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Département</p>
                  <p className="font-medium text-[var(--text)]">{employee.department?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Mode de paiement</p>
                  <p className="font-medium text-[var(--text)]">
                    {employee.paymentMethod === 'CASH' ? 'Espèces' : employee.paymentMethod === 'BANK_TRANSFER' ? 'Virement bancaire' : 'Mobile Money'}
                  </p>
                </div>
                {employee.paymentMethod === 'BANK_TRANSFER' && (
                  <>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Banque</p>
                      <p className="font-medium text-[var(--text)]">{employee.bankName || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">N° de compte</p>
                      <p className="font-medium text-[var(--text)] font-mono">{employee.bankAccountNumber || <span className="text-[var(--text-muted)] italic text-sm font-sans">Non renseigné</span>}</p>
                    </div>
                  </>
                )}
                {employee.paymentMethod === 'MOBILE_MONEY' && (
                  <>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Opérateur Mobile Money</p>
                      <p className="font-medium text-[var(--text)]">{employee.mobileMoneyOperator || <span className="text-[var(--text-muted)] italic text-sm">Non renseigné</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">N° Mobile Money</p>
                      <p className="font-medium text-[var(--text)] font-mono">{employee.mobileMoneyNumber || <span className="text-[var(--text-muted)] italic text-sm font-sans">Non renseigné</span>}</p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">N° Fiscal</p>
                  <p className="font-medium text-[var(--text)] font-mono">{employee.taxNumber || <span className="text-[var(--text-muted)] italic text-sm font-sans">Non renseigné</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">NIU</p>
                  <p className="font-medium text-[var(--text)] font-mono">{employee.niu || <span className="text-[var(--text-muted)] italic text-sm font-sans">Non renseigné</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">Zone (transport / TOL)</p>
                  <p className="font-medium text-[var(--text)]">{employee.tolZone === 'PERIPHERIE' ? 'Périphérie' : 'Ville'}</p>
                </div>

                {/* 🆕 Durée contrat pour CDD/STAGE/INTERIM/CONSULTANT */}
                <ContractCountdown
                  contractType={employee.contractType}
                  hireDate={employee.hireDate}
                  contractEndDate={employee.contractEndDate}
                />

                {/* CDI — badge durée indéterminée */}
                {employee.contractType === 'CDI' && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle size={13} className="text-emerald-500" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">CDI — Durée indéterminée</span>
                    </div>
                  </div>
                )}

                {/* Période d'essai */}
                {/* ✅ "employee.trialPeriodDays && ..." affichait un "0"
                    littéral quand trialPeriodDays valait 0 (JSX rend 0 tel
                    quel). "?? 0" gère aussi le cas null/undefined (TS strict)
                    sans réintroduire ce risque : le résultat de ">" est
                    toujours un booléen, jamais rendu comme 0. */}
                {(employee.trialPeriodDays ?? 0) > 0 && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                      <Clock size={11} /> Période d'essai
                    </p>
                    {employee.trialStatus === 'IN_PROGRESS' && employee.trialEndDate && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">⏱️ Essai en cours</span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            {Math.max(0, Math.ceil((new Date(employee.trialEndDate).getTime() - Date.now()) / 86400000))} jours restants
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                          Fin le {new Date(employee.trialEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">Rupture sans préavis ni indemnités possible.</p>
                      </div>
                    )}
                    {employee.trialStatus === 'CONFIRMED' && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                        <CheckCircle size={13} className="text-emerald-500" />
                        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                          Essai confirmé {employee.trialConfirmedAt ? `— le ${new Date(employee.trialConfirmedAt).toLocaleDateString('fr-FR')}` : ''}
                        </span>
                      </div>
                    )}
                    {employee.trialStatus === 'EXPIRED' && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <AlertCircle size={13} className="text-amber-500" />
                        <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                          Essai expiré — à régulariser (confirmation ou rupture)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* BNC — Consultant / Prestataire */}
                {BNC_CONTRACTS.includes(employee.contractType) && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2">Régime fiscal BNC</p>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">Résidence</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${employee.isResident !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                          {employee.isResident !== false ? '🇨🇬 Résident' : '🌍 Non-résident'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">Taux BNC</span>
                        <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                          {employee.isResident !== false ? '10%' : '20%'}
                        </span>
                      </div>
                      {employee.nationality && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-700 dark:text-emerald-400">Nationalité</span>
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{employee.nationality}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-500 pt-1">
                        ⚠️ Pas de bulletin — FACTURE HT. BNC reversé DGI avant le 15.
                      </p>
                    </div>
                  </div>
                )}

                {/* INTERIM — info agence */}
                {employee.contractType === 'INTERIM' && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">🔄 Intérimaire</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Salarié de l'agence d'intérim. Aucun bulletin généré côté entreprise. Suivi de mission uniquement.
                      </p>
                    </div>
                  </div>
                )}

                {/* STAGE — info convention */}
                {employee.contractType === 'STAGE' && (
                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">🎓 Stage</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500">
                        Gratification. CNSS patronale AT 2,25% uniquement. ITS seulement si gratification &gt; SMIG (50 400 FCFA).
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1">Salaire de base</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-[var(--text)] font-mono">
                      {showSalary ? `${employee.baseSalary?.toLocaleString('fr-FR')} FCFA` : '• • • • • • •'}
                    </p>
                    <button onClick={() => setShowSalary(!showSalary)} className="text-[var(--text-muted)] hover:text-emerald-500 transition-colors p-1">
                      {showSalary ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 🆕 Brut/net estimés — base + primes mensuelles imposables
                    (transport, sursalaire...). Exclut volontairement le 13e
                    mois et toute prime à mois ciblé : ce sont des montants
                    temporaires, pas une base stable pour l'estimation.
                    "Estimé" et pas "contractuel" : ça varie d'un mois à
                    l'autre selon les primes actives ce mois-là. Respecte le
                    même masquage que le salaire de base. */}
                {showSalary && employee.baseSalary != null && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <SalaryRecap
                      employeeId={employee.id}
                      employee={employee}
                      bonuses={employeeBonuses}
                    />
                  </div>
                )}

                {/* ✅ Cumul brut avant Konza RH — affiché seulement s'il a été
                    renseigné. Rappel explicite de son usage : sert au calcul
                    de l'indemnité de congé payé tant que l'historique de paie
                    réel dans l'app est encore court (voir leaves-indemnity.service.ts,
                    méthode AVERAGE_12M). */}
                {(employee as any).openingCumulativeGross != null && (
                  <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1">Cumul brut avant Konza RH</p>
                    <p className="text-xl font-bold text-[var(--text)] font-mono">
                      {showSalary
                        ? `${Number((employee as any).openingCumulativeGross).toLocaleString('fr-FR')} FCFA sur ${(employee as any).openingCumulativeMonths ?? '?'} mois`
                        : '• • • • • • •'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Cumul des bruts du cycle de congé en cours avant l&apos;arrivée sur Konza RH. Utilisé pour l&apos;indemnité de congé tant que l&apos;historique réel est court — se remet à zéro tout seul au prochain cycle.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Actions rapides */}
            <section>
              <h3 className="text-lg font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Star size={20} className="text-amber-500" /> Actions Rapides
              </h3>
              <div className="space-y-2">
                <Link href={bp(`/employes/${params.id}/primes`)}
                  className="flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                      <Gift size={16} className="text-amber-500" />
                    </div>
                    <span className="font-bold text-sm text-[var(--text)]">Gérer les primes</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
                <Link href={`/employes/${params.id}/edit`}
                  className="flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <Edit size={16} className="text-emerald-500" />
                    </div>
                    <span className="font-bold text-sm text-[var(--text)]">Modifier le dossier</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </Link>
                <button
                  onClick={handleDownloadFiche}
                  disabled={isGeneratingFiche}
                  className="w-full flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      {isGeneratingFiche ? <Loader2 size={16} className="text-emerald-500 animate-spin" /> : <FileText size={16} className="text-emerald-500" />}
                    </div>
                    <span className="font-bold text-sm text-[var(--text)]">
                      {isGeneratingFiche ? 'Génération…' : 'Fiche de renseignement (PDF)'}
                    </span>
                  </div>
                  <Download size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </button>
                <button
                  onClick={handleToggleSelfService}
                  disabled={isTogglingSelfService}
                  className={`w-full flex items-center justify-between p-4 border rounded-xl transition-all group disabled:opacity-60 ${
                    employee?.selfServiceEnabled
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                      : 'bg-[var(--surface-2)] border-[var(--border)] hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${employee?.selfServiceEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-[var(--surface-2)]'}`}>
                      {isTogglingSelfService ? <Loader2 size={16} className="text-emerald-500 animate-spin" /> : <UserCheck size={16} className={employee?.selfServiceEnabled ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-sm text-[var(--text)] block">
                        {employee?.selfServiceEnabled ? "Auto-service activé" : "Autoriser l'employé à modifier son profil"}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {employee?.selfServiceEnabled ? "Cliquer pour reverrouiller" : 'Cliquer pour accorder un accès temporaire'}
                      </span>
                    </div>
                  </div>
                  <div className={`shrink-0 relative w-11 h-6 rounded-full transition-colors ${employee?.selfServiceEnabled ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform ${employee?.selfServiceEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
                <button onClick={() => setActiveTab('paie')}
                  className="w-full flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <span className="font-bold text-sm text-[var(--text)]">Historique de paie</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </button>
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full flex items-center justify-between p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Trash2 size={16} className="text-red-500" />
                      </div>
                      <span className="font-bold text-sm text-red-600 dark:text-red-400">Supprimer l'employé</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (tabLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
    if (!tabData || tabData.length === 0) return (
      <div className="py-20 text-center">
        <AlertCircle size={28} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-[var(--text-muted)] font-medium">Aucune donnée disponible</p>
      </div>
    );

    if (activeTab === 'docs') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map((doc: any) => (
            <div key={doc.id} className="p-4 border border-[var(--border)] rounded-xl flex items-center gap-3 bg-[var(--surface)] hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg"><FileText size={20} /></div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold truncate text-[var(--text)]">{doc.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{doc.type}</p>
              </div>
              <button className="text-[var(--text-muted)] hover:text-emerald-500 transition-colors"><Download size={18} /></button>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'paie') {
      return (
        <div className="space-y-3">
          {tabData.map((p: any) => (
            <Link href={bp(`/paie/bulletins/${p.id}`)} key={p.id}>
              <div className="flex justify-between items-center p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:bg-[var(--surface-2)] hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-emerald-500/20">
                    <span className="leading-none">{String(p.month).padStart(2, '0')}</span>
                    <span className="leading-none opacity-75 text-[10px]">{p.year?.toString().slice(2)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text)]">Bulletin de Paie</p>
                    <p className="text-xs text-[var(--text-muted)]">Net versé : <strong className="text-emerald-600 dark:text-emerald-400">{p.netSalary?.toLocaleString('fr-FR')} FCFA</strong></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {p.status === 'PAID' ? 'Payé' : 'En attente'}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'conges') {
      return (
        <div className="space-y-3">
          {tabData.map((l: any) => (
            <div key={l.id} className="flex justify-between items-center p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${l.type === 'SICK' ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500'}`}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)]">
                    {l.type === 'SICK' ? 'Congé maladie' : l.type === 'ANNUAL' ? 'Congé annuel' : l.type}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {new Date(l.startDate).toLocaleDateString('fr-FR')} → {new Date(l.endDate).toLocaleDateString('fr-FR')} · <strong>{l.daysCount}j</strong>
                  </p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : l.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {l.status === 'APPROVED' ? 'Approuvé' : l.status === 'PENDING' ? 'En attente' : 'Refusé'}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'materiel') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabData.map((a: any) => (
            <div key={a.id} className="p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] flex items-center gap-4">
              <div className="p-3 bg-[var(--surface-2)] rounded-lg"><Laptop size={20} className="text-[var(--text-muted)]" /></div>
              <div>
                <p className="font-bold text-[var(--text)]">{a.name}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono">{a.serialNumber}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">

      {/* MODAL SUPPRESSION */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setShowDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-[var(--surface)] rounded-2xl p-8 shadow-xl max-w-md w-full border border-red-200 dark:border-red-800/50 z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-50 dark:bg-red-900/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
              {!isDeleting && (
                <button onClick={() => setShowDeleteModal(false)}
                  className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-xl transition-colors z-10">
                  <X size={18} />
                </button>
              )}
              <div className="relative flex justify-center mb-5">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <div className="w-14 h-14 bg-red-200 dark:bg-red-800/40 rounded-full flex items-center justify-center">
                    <Trash2 size={26} className="text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-[var(--text)] mb-1">Supprimer cet employé ?</h2>
              <p className="text-center text-[var(--text-muted)] text-sm mb-1">Vous êtes sur le point de désactiver le dossier de</p>
              <p className="text-center font-extrabold text-[var(--text)] text-lg mb-5">{employee.firstName} {employee.lastName}</p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl p-4 mb-6">
                <p className="text-red-700 dark:text-red-300 text-sm font-bold flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="shrink-0" /> Cette action est irréversible
                </p>
                <ul className="space-y-2">
                  {[
                    { text: <>Le statut passera à <strong>TERMINÉ</strong></>, color: 'red' },
                    { text: <>Le compte utilisateur sera <strong>définitivement supprimé</strong></>, color: 'red' },
                    { text: <>L'email sera à nouveau <strong>disponible</strong></>, color: 'red' },
                    { text: <>L'historique de paie et congés seront <strong>conservés</strong></>, color: 'emerald' },
                  ].map((item, i) => (
                    <li key={i} className={`flex items-start gap-2 text-${item.color}-600 dark:text-${item.color}-400 text-xs`}>
                      <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-400 mt-1.5 shrink-0`} />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-bold hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50">
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25">
                  {isDeleting ? <><Loader2 size={16} className="animate-spin" />Suppression...</> : <><Trash2 size={16} />Supprimer</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Link href={bp('/employes')} className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-emerald-500 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Retour à la liste
      </Link>

      {/* HEADER */}
      <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 shadow-sm border border-[var(--border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="relative shrink-0">
            <img
              src={employee.photoUrl || `https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}&background=10B981&color=fff&size=128`}
              alt={employee.firstName}
              className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-[var(--surface)]"
            />
            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <CheckCircle size={14} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text)]">{employee.firstName} {employee.lastName}</h1>
                <p className="text-lg text-[var(--text-muted)] font-medium flex items-center gap-2 flex-wrap mt-1">
                  <span>{employee.position}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)]" />
                  <span className="text-emerald-600 dark:text-emerald-400">{employee.department?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 rounded-lg bg-[var(--surface-2)] text-sm font-mono text-[var(--text-muted)] border border-[var(--border)]">
                    {employee.employeeNumber}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-2)] text-sm text-gray-600 dark:text-[var(--text-muted)] border border-[var(--border)]">
                    <Briefcase size={14} /> {employee.contractType}
                  </span>
                  {/* 🆕 Badge jours restants dans le header si contrat temporaire */}
                  {TEMP_CONTRACTS.includes(employee.contractType) && employee.contractEndDate && (() => {
                    const daysLeft = differenceInDays(new Date(employee.contractEndDate), new Date());
                    if (daysLeft < 0) return (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] text-sm font-bold border border-[var(--border)]">
                        ⚠️ Expiré
                      </span>
                    );
                    if (daysLeft <= 30) return (
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border ${
                        daysLeft <= 7
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      }`}>
                        <CalendarDays size={13} /> J-{daysLeft}
                      </span>
                    );
                    return null;
                  })()}
                  {companyConvention && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <BookOpen size={13} /> {companyConvention}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={bp(`/employes/${params.id}/primes`)}
                  className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors border border-amber-200 dark:border-amber-800"
                  title="Gérer les primes">
                  <Gift size={20} />
                </Link>
                <button onClick={() => router.push(bp(`/employes/${params.id}/edit`))}
                  className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-700"
                  title="Modifier">
                  <Edit size={20} />
                </button>
                {canDelete && (
                  <button onClick={() => setShowDeleteModal(true)}
                    className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                    title="Supprimer l'employé">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar border-b border-[var(--border)]">
          {[
            { id: 'info',     label: 'Informations' },
            { id: 'docs',     label: 'Documents' },
            { id: 'paie',     label: 'Historique Paie' },
            { id: 'conges',   label: 'Congés' },
            { id: 'materiel', label: 'Matériel' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
        <div className="p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}