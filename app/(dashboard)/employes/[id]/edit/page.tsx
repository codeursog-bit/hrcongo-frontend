'use client';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import '@/components/employees/employees.css';
import '@/components/employees/employee-finishing.css';
import { EmployeeOnboardingStart as EmployeePageStart } from '@/components/employees/create/EmployeeJourney';
import { DossierTabList } from '@/components/employees/EmployeeDossier';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { CnssDeclarationField } from '@/components/employees/CnssDeclarationField';


// ============================================================================
// 📁 app/(dashboard)/employes/[id]/edit/page.tsx
// 🆕 contractEndDate dans la section Contrat
// 🆕 Raccourcis durée + aperçu durée
// 🆕 Chargement de la date de fin existante (import Excel / recrutement)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, User, Briefcase, Heart, Shield,
  Wallet, AlertCircle, Phone, Mail, MapPin, Calendar,
  Building2, DollarSign, Smartphone, CreditCard,
  Award, Hash, Check, CalendarDays, Clock, BadgeCheck, Power, XCircle,
  HeartPulse, Users, GraduationCap, Car, Languages, Shirt, AlertTriangle, Flag, UserCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { FancySelect } from '@/components/ui/FancySelect';
import { useBasePath } from '@/hooks/useBasePath';
import { NATIONALITY_OPTIONS } from '@/lib/nationalities';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageUploader } from '@/components/employees/ImageUploader';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

const REQUIRES_END_DATE = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT', 'PRESTATAIRE'];

const SUGGESTED_DURATIONS: Record<string, { label: string; months: number }[]> = {
  STAGE:      [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
  CDD:        [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an', months: 12 }],
  INTERIM:    [{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }],
  CONSULTANT: [{ label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }, { label: '1 an', months: 12 }],
  PRESTATAIRE:[{ label: '1 mois', months: 1 }, { label: '3 mois', months: 3 }, { label: '6 mois', months: 6 }],
};

// ✅ AJOUT : mêmes constantes BNC que la page de création (Step3Contract.tsx),
// pour garder un comportement identique création/édition.
const BNC_CONTRACTS = ['CONSULTANT', 'PRESTATAIRE'];

const CONTRACT_INFO: Record<string, { cnss: string; impot: string; tus: string; alertes: string[] }> = {
  CDI:         { cnss: 'CNSS 4% sal. + 20,28% pat.', impot: 'ITS barème',      tus: 'TUS 7,5%',     alertes: [] },
  CDD:         { cnss: 'CNSS identique CDI',          impot: 'ITS barème',      tus: 'TUS 7,5%',     alertes: ['Max 2 ans renouvellement inclus'] },
  STAGE:       { cnss: 'AT patronale 2,25% seulement', impot: 'ITS si > SMIG',  tus: 'Aucun',        alertes: ['Convention tripartite obligatoire', 'Max 6 mois'] },
  CONSULTANT:  { cnss: 'Aucune CNSS',                  impot: 'BNC à la source', tus: 'Aucun',        alertes: ['Facture HT — pas de bulletin', 'BNC reversé DGI avant le 15'] },
  PRESTATAIRE: { cnss: 'Aucune CNSS',                  impot: 'BNC à la source', tus: 'Aucun',        alertes: ['Facture HT — pas de bulletin', 'BNC reversé DGI avant le 15'] },
  INTERIM:     { cnss: "Géré par l'agence",            impot: "Géré par l'agence", tus: "Géré par l'agence", alertes: ["Pas de bulletin — suivi mission uniquement"] },
};

// ─── Aperçu durée ─────────────────────────────────────────────────────────
function ContractDurationPreview({ hireDate, endDate }: { hireDate: string; endDate: string }) {
  if (!hireDate || !endDate) return null;
  const start     = new Date(hireDate);
  const end       = new Date(endDate);
  if (end <= start) return null;

  const totalDays = differenceInDays(end, start);
  const today     = new Date();
  const daysLeft  = differenceInDays(end, today);
  const pct       = Math.min(100, Math.max(0, Math.round(((totalDays - daysLeft) / totalDays) * 100)));

  const barColor  = daysLeft <= 7 ? 'bg-[var(--danger)]' : daysLeft <= 30 ? 'bg-[var(--mustard)]' : daysLeft <= 60 ? 'bg-[var(--mustard)]' : 'bg-[var(--green)]';
  const textColor = daysLeft <= 7 ? 'text-[var(--danger-text)]' : daysLeft <= 30 ? 'text-[var(--warning-text)]' : 'text-[var(--success-text)]';

  function fmt(days: number) {
    if (days < 30) return `${days}j`;
    const m = Math.floor(days / 30);
    const r = days % 30;
    return r === 0 ? `${m} mois` : `${m} mois ${r}j`;
  }

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--text-secondary)] flex items-center gap-1"><Clock size={12} /> Durée totale</span>
        <span className="font-bold text-[var(--text)]">{fmt(totalDays)}</span>
      </div>
      <div>
        <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`} />
        </div>
        <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mt-1">
          <span>{format(start, 'd MMM yyyy', { locale: fr })}</span>
          <span className={daysLeft <= 30 ? 'text-[var(--text-secondary)] font-bold' : ''}>{format(end, 'd MMM yyyy', { locale: fr })}</span>
        </div>
      </div>
      <p className={`text-xs font-semibold flex items-center gap-1 ${textColor}`}>
        <CalendarDays size={11} />
        {daysLeft <= 0 ? 'Contrat expiré' : `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`}
        {daysLeft > 0 && ' — alertes automatiques actives'}
      </p>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────
export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const { bp } = useBasePath();
  const router = useRouter();
  const alert  = useAlert();
  const [isSaving, setIsSaving]   = useState(false);
  const [uiLoadError, setUiLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // 🔒 CORRECTIF (audit) : companyId capturé à la lecture, renvoyé explicitement
  // sur les actions d'écriture (voir handleSubmit / handleToggleSelfService) —
  // pour un admin multi-entreprises, la session (user.companyId en base) est
  // partagée entre TOUS ses appareils connectés ; si un autre appareil bascule
  // d'entreprise entre le chargement de cette page et l'enregistrement, l'ancien
  // code se retrouvait à agir sur la mauvaise entreprise (ou se faisait
  // refuser l'accès à tort). En envoyant le companyId réellement affiché ici,
  // l'action reste correcte quoi qu'il se passe ailleurs.
  const [employeeCompanyId, setEmployeeCompanyId] = useState<string | undefined>();
  const [activeSection, setActiveSection] = useState<'identity' | 'family' | 'contract' | 'payment' | 'fiscal' | 'additional' | 'statut'>('identity');
  const [departments, setDepartments]         = useState<any[]>([]);
  const [companyConvention, setCompanyConvention]       = useState<string | null>(null);
  const [conventionCategories, setConventionCategories] = useState<any[]>([]);
  const imageUpload = useImageUpload(); // 🆕 Photo employé
  // 🆕 Auto-service employé
  const [selfService, setSelfService] = useState<{ enabled: boolean; at?: string | null; by?: string | null }>({ enabled: false });
  const [isTogglingSelfService, setIsTogglingSelfService] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '', placeOfBirth: '',
    gender: 'MALE', phone: '', secondaryPhone: '', email: '', address: '', city: '',
    nationalIdNumber: '', cnssNumber: '', niu: '', taxNumber: '',
    cnssEmployeeDeclared: null as boolean|null,
    trialPeriodDays: '0', trialEndDate: '',
    status: 'ACTIVE', terminationDate: '', terminationReason: '',
    maritalStatus: 'SINGLE', numberOfChildren: 0,
    hireDate: '', contractType: 'CDI',
    contractEndDate: '',  // 🆕
    position: '', departmentId: '',
    baseSalary: '', professionalCategory: '', echelon: '',
    openingCumulativeGross: '', openingCumulativeMonths: '',
    isResident: 'true', // ✅ AJOUT : nécessaire pour le calcul BNC (CONSULTANT / PRESTATAIRE)
    employeeNumber: '',
    photoUrl: '', // 🆕 Photo existante (avant remplacement éventuel)
    paymentMethod: 'CASH', bankName: '', bankAccountNumber: '',
    mobileMoneyOperator: 'MTN', mobileMoneyNumber: '',
    isSubjectToIrpp: true, isSubjectToCnss: true, taxExemptionReason: '',
    tolZone: 'VILLE' as 'VILLE' | 'PERIPHERIE',
    nationality: '',
    // 🆕 Fiche ORCA — Informations complémentaires
    bloodType: '', pathology: '', fatherName: '', motherName: '',
    educationLevel: '',
    emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
    hasDrivingLicense: false, drivingLicenseNumber: '',
    foreignLanguages: '', uniformSize: '', shoeSize: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [employee, depts, company] = await Promise.all([
          api.get<any>(`/employees/${params.id}`),
          api.get<any[]>('/departments'),
          api.get<any>('/companies/mine'),
        ]);
        setDepartments(depts || []);
        setEmployeeCompanyId(employee.companyId);
        setSelfService({ enabled: !!employee.selfServiceEnabled, at: employee.selfServiceEnabledAt, by: employee.selfServiceEnabledBy });
        if (company?.collectiveAgreement) {
          setCompanyConvention(company.collectiveAgreement);
          try {
            const cats = await api.get<any[]>(`/conventions/categories/${company.collectiveAgreement}`);
            setConventionCategories(cats || []);
          } catch {}
        }
        setFormData({
          firstName:           employee.firstName || '',
          lastName:            employee.lastName || '',
          dateOfBirth:         employee.dateOfBirth?.split('T')[0] || '',
          placeOfBirth:        employee.placeOfBirth || '',
          gender:              employee.gender || 'MALE',
          phone:               employee.phone || '',
          secondaryPhone:      employee.secondaryPhone || '', // ✅ AJOUT
          email:               employee.email || '',
          address:             employee.address || '',
          city:                employee.city || '',
          nationalIdNumber:    employee.nationalIdNumber || '',
          cnssNumber:          employee.cnssNumber || '',
          cnssEmployeeDeclared: employee.cnssEmployeeDeclared ?? null,
          niu:                 employee.niu || '',
          taxNumber:           employee.taxNumber || '',
          trialPeriodDays:     employee.trialPeriodDays?.toString() || '0',
          trialEndDate:        employee.trialEndDate?.split('T')[0] || '',
          status:              employee.status || 'ACTIVE',
          terminationDate:     employee.terminationDate?.split('T')[0] || '',
          terminationReason:   employee.terminationReason || '',
          maritalStatus:       employee.maritalStatus || 'SINGLE',
          numberOfChildren:    employee.numberOfChildren || 0,
          hireDate:            employee.hireDate?.split('T')[0] || '',
          contractType:        employee.contractType || 'CDI',
          contractEndDate:     employee.contractEndDate?.split('T')[0] || '', // 🆕
          position:            employee.position || '',
          departmentId:        employee.departmentId || '',
          baseSalary:          employee.baseSalary?.toString() || '',
          openingCumulativeGross:  employee.openingCumulativeGross?.toString() || '',
          openingCumulativeMonths: employee.openingCumulativeMonths?.toString() || '',
          professionalCategory:employee.professionalCategory || '',
          echelon:             employee.echelon || '',
          isResident:          employee.isResident === false ? 'false' : 'true', // ✅ AJOUT
          employeeNumber:      employee.employeeNumber || '',
          paymentMethod:       employee.paymentMethod || 'CASH',
          bankName:            employee.bankName || '',
          bankAccountNumber:   employee.bankAccountNumber || '',
          mobileMoneyOperator: employee.mobileMoneyOperator || 'MTN',
          mobileMoneyNumber:   employee.mobileMoneyNumber || '',
          isSubjectToIrpp:     employee.isSubjectToIrpp ?? true,
          isSubjectToCnss:     employee.isSubjectToCnss ?? true,
          taxExemptionReason:  employee.taxExemptionReason || '',
          tolZone:             employee.tolZone || 'VILLE',
          nationality:         employee.nationality || '',
          photoUrl:            employee.photoUrl || '',
          // 🆕 Fiche ORCA — Informations complémentaires
          bloodType:                employee.bloodType || '',
          pathology:                employee.pathology || '',
          fatherName:               employee.fatherName || '',
          motherName:               employee.motherName || '',
          educationLevel:           employee.educationLevel || '',
          emergencyContactName:     employee.emergencyContactName || '',
          emergencyContactRelation: employee.emergencyContactRelation || '',
          emergencyContactPhone:    employee.emergencyContactPhone || '',
          hasDrivingLicense:        employee.hasDrivingLicense ?? false,
          drivingLicenseNumber:     employee.drivingLicenseNumber || '',
          foreignLanguages:         employee.foreignLanguages || '',
          uniformSize:              employee.uniformSize || '',
          shoeSize:                 employee.shoeSize || '',
        });
      } catch {
        alert.error('Erreur', 'Impossible de charger les données');
        setUiLoadError('Le dossier n’a pas pu être chargé. Rechargez la page avant de le modifier.');
      } finally {
        setIsLoading(false);
      }
    };
    setUiLoadError('');
    load();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Changer type → effacer date fin si CDI
  const handleContractTypeChange = (type: string) => {
    handleSelect('contractType', type);
    if (type === 'CDI') handleSelect('contractEndDate', '');
    if (BNC_CONTRACTS.includes(type) && !formData.isResident) handleSelect('isResident', 'true');
  };

  // Raccourcis durée
  const applySuggestion = (months: number) => {
    if (!formData.hireDate) {
      alert.warning("Date d'embauche manquante", "Renseignez d'abord la date d'embauche");
      return;
    }
    const end = new Date(formData.hireDate);
    end.setMonth(end.getMonth() + months);
    handleSelect('contractEndDate', end.toISOString().split('T')[0]);
  };

  const handleCategoryChange = (code: string) => {
    handleSelect('professionalCategory', code);
    // code = cat+éch combinés (é.g. "Cat.3 Éch.4", "C5-E2") → on le stocke aussi dans echelon
    handleSelect('echelon', code);
    const cat = conventionCategories.find((c) => c.code === code);
    if (cat?.minSalary && cat.minSalary > 0 && (!formData.baseSalary || parseFloat(formData.baseSalary) < cat.minSalary)) {
      handleSelect('baseSalary', cat.minSalary.toString());
      alert.info('Salaire ajusté', `Minimum conventionnel : ${cat.minSalary.toLocaleString()} FCFA`);
    }
  };

  // 🆕 Autoriser / révoquer l'auto-service employé (action immédiate, indépendante de "Enregistrer")
  const handleToggleSelfService = async () => {
    setIsTogglingSelfService(true);
    try {
      const next = !selfService.enabled;
      const res: any = await api.patch(`/employees/${params.id}/self-service${employeeCompanyId ? `?companyId=${employeeCompanyId}` : ''}`, { enabled: next });
      setSelfService({ enabled: !!res.selfServiceEnabled, at: res.selfServiceEnabledAt, by: res.selfServiceEnabledBy });
    } catch (err: any) {
      alert.error(err?.message || "Erreur lors de la mise à jour de l'accès");
    } finally {
      setIsTogglingSelfService(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/employees/${params.id}${employeeCompanyId ? `?companyId=${employeeCompanyId}` : ''}`, {
        firstName: formData.firstName, lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth, placeOfBirth: formData.placeOfBirth,
        gender: formData.gender, phone: formData.phone, secondaryPhone: formData.secondaryPhone?.trim() || null, email: formData.email,
        address: formData.address, city: formData.city,
        nationalIdNumber: formData.nationalIdNumber || null,
        cnssNumber: formData.cnssNumber || null,
        cnssEmployeeDeclared: formData.cnssEmployeeDeclared,
        niu: formData.niu?.trim() || null,
        taxNumber: formData.taxNumber?.trim() || null,
        trialPeriodDays: parseInt(formData.trialPeriodDays as string) || 0,
        status: formData.status,
        terminationDate: formData.status !== 'ACTIVE' && formData.terminationDate ? formData.terminationDate : null,
        terminationReason: formData.status !== 'ACTIVE' ? formData.terminationReason || null : null,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
        hireDate: formData.hireDate, contractType: formData.contractType,
        contractEndDate: formData.contractEndDate || null, // 🆕
        position: formData.position, departmentId: formData.departmentId,
        baseSalary: parseFloat(formData.baseSalary),
        openingCumulativeGross:
          (formData.openingCumulativeGross as string).trim()
            ? parseFloat(formData.openingCumulativeGross as string)
            : null,
        openingCumulativeMonths:
          (formData.openingCumulativeMonths as string).trim()
            ? parseInt(formData.openingCumulativeMonths as string)
            : null,
        professionalCategory: formData.professionalCategory || null,
        echelon: formData.echelon || null,
        isResident: formData.isResident !== 'false', // ✅ AJOUT
        employeeNumber: formData.employeeNumber?.trim() || undefined,
        paymentMethod: formData.paymentMethod,
        bankName: formData.bankName || null, bankAccountNumber: formData.bankAccountNumber || null,
        mobileMoneyOperator: formData.mobileMoneyOperator || null, mobileMoneyNumber: formData.mobileMoneyNumber || null,
        isSubjectToIrpp: formData.isSubjectToIrpp, isSubjectToCnss: formData.isSubjectToCnss,
        taxExemptionReason: formData.taxExemptionReason || null,
        tolZone: formData.tolZone,
        nationality: formData.nationality || null,
        // 🆕 Photo : nouvelle image uploadée si choisie, sinon on garde/retire l'existante
        photoUrl: imageUpload.uploadedUrl || formData.photoUrl || null,
        // 🆕 Fiche ORCA — Informations complémentaires
        bloodType: formData.bloodType || null,
        pathology: formData.pathology || null,
        fatherName: formData.fatherName || null,
        motherName: formData.motherName || null,
        educationLevel: formData.educationLevel || null,
        emergencyContactName: formData.emergencyContactName || null,
        emergencyContactRelation: formData.emergencyContactRelation || null,
        emergencyContactPhone: formData.emergencyContactPhone || null,
        hasDrivingLicense: !!formData.hasDrivingLicense,
        drivingLicenseNumber: formData.hasDrivingLicense ? (formData.drivingLicenseNumber || null) : null,
        foreignLanguages: formData.foreignLanguages || null,
        uniformSize: formData.uniformSize || null,
        shoeSize: formData.shoeSize || null,
      });
      alert.success('Dossier mis à jour', 'Les modifications ont été enregistrées.');
      router.push(bp(`/employes/${params.id}`));
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  const SECTIONS = [
    { id: 'identity', label: 'Identité',         icon: User,     color: 'text-[var(--text-secondary)]' },
    { id: 'family',   label: 'Famille & Fiscal',  icon: Heart,    color: 'text-[var(--text-secondary)]' },
    { id: 'contract', label: 'Contrat',            icon: Briefcase,color: 'text-[var(--text-secondary)]' },
    { id: 'payment',  label: 'Paiement',           icon: Wallet,   color: 'text-[var(--text-secondary)]' },
    { id: 'fiscal',   label: 'Fiscalité',          icon: Shield,   color: 'text-[var(--text-secondary)]' },
    { id: 'additional', label: 'Compléments',       icon: HeartPulse, color: 'text-[var(--text-secondary)]' },
    { id: 'statut',   label: 'Statut',              icon: BadgeCheck, color: 'text-[var(--text-secondary)]'  },
  ];

  const inputClass  = "w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] focus:border-[var(--border)] outline-none transition-all";
  const labelClass  = "block text-sm font-bold text-[var(--text-secondary)] mb-2";
  const needsEndDate = REQUIRES_END_DATE.includes(formData.contractType);
  const suggestions  = SUGGESTED_DURATIONS[formData.contractType] ?? [];

  // ✅ AJOUT : mêmes calculs que la page de création (Step3Contract.tsx)
  const isBncContract = BNC_CONTRACTS.includes(formData.contractType);
  const contractMeta  = CONTRACT_INFO[formData.contractType] ?? CONTRACT_INFO['CDI'];
  const isResidentBool = formData.isResident !== 'false';
  const montantHT  = parseFloat(formData.baseSalary as string) || 0;
  const bncTaux    = isResidentBool ? 0.10 : 0.20;
  const bncMontant = isBncContract && montantHT > 0 ? Math.round(montantHT * bncTaux) : 0;
  const bncNet     = montantHT - bncMontant;

  if (isLoading) return (
    <ModulePageSkeleton label="Chargement des employés" />
  );

  return (
    <ModulePageFrame kind="detail" error={uiLoadError}><div className="employee-module-page employee-edit-page"><EmployeePageStart/><div className="employee-edit-shell">
      <header className="employee-editor-heading"><div><Button variant="ghost" onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors">
          <ArrowLeft size={16} /> Retour au profil
        </Button><h1>Modifier le dossier</h1><p>Parcourez les rubriques, puis enregistrez toutes vos modifications.</p></div><div className="employee-editor-person"><ProfileAvatar name={`${formData.firstName} ${formData.lastName}`} src={imageUpload.preview || formData.photoUrl || null}/><div><strong>{formData.firstName} {formData.lastName}</strong><span>{formData.position || formData.employeeNumber}</span></div></div></header>
      <div className="employee-editor-layout">
        {/* Sidebar */}
        <div className="employee-edit-tabs">
          <DossierTabList>
            {SECTIONS.map((s) => (
              <Button variant="ghost" key={s.id} role="tab" id={`edit-tab-${s.id}`} aria-controls="employee-edit-panel" aria-selected={activeSection === s.id} tabIndex={activeSection === s.id ? 0 : -1} onClick={() => setActiveSection(s.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  activeSection === s.id ? 'bg-[var(--text)] text-[var(--bg)] shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
                }`}>
                <s.icon size={16} className={activeSection === s.id ? '' : s.color} />
                {s.label}
              </Button>
            ))}
          </DossierTabList>
        </div>

        {/* Formulaire */}
        <div className="employee-edit-content">
          <AnimatePresence mode="wait">
            <motion.div id="employee-edit-panel" role="tabpanel" aria-labelledby={`edit-tab-${activeSection}`} key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

              {/* ── IDENTITÉ ── */}
              {activeSection === 'identity' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><User size={20} className="text-[var(--text-secondary)]" /> Identité & Coordonnées</h2>

                  {/* 🆕 Photo de l'employé */}
                  <div className="employee-edit-photo">
                    <ImageUploader
                      preview={imageUpload.preview || formData.photoUrl || null}
                      uploading={imageUpload.uploading}
                      progress={imageUpload.progress}
                      onFileSelect={imageUpload.handleFileSelect}
                      onClear={() => { imageUpload.clearImage(); setFormData(prev => ({ ...prev, photoUrl: '' })); }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Prénom *</label><input name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Nom *</label><input name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Date de naissance</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Lieu de naissance</label><input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className={inputClass} /></div>
                    <div><FancySelect label="Genre" value={formData.gender} onChange={(v) => handleSelect('gender', v)} icon={User} options={[{ value: 'MALE', label: 'Homme' }, { value: 'FEMALE', label: 'Femme' }]} /></div>
                    <div><label className={labelClass}><Phone size={13} className="inline mr-1 text-[var(--text-secondary)]" />Téléphone</label><input name="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}><Phone size={13} className="inline mr-1 text-[var(--text-secondary)]" />Téléphone secondaire</label><input name="secondaryPhone" value={formData.secondaryPhone} onChange={handleChange} className={inputClass} placeholder="Optionnel" /></div>
                    <div className="md:col-span-2"><label className={labelClass}><Mail size={13} className="inline mr-1 text-[var(--text-secondary)]" />Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}><MapPin size={13} className="inline mr-1 text-[var(--text-secondary)]" />Adresse</label><input name="address" value={formData.address} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Ville</label><input name="city" value={formData.city} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}><Hash size={13} className="inline mr-1" />N° CNI <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel)</span></label><input name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}><Shield size={13} className="inline mr-1" />N° CNSS <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel)</span></label><input name="cnssNumber" value={formData.cnssNumber} onChange={handleChange} className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}>Matricule <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel — généré auto si vide)</span></label><input name="employeeNumber" value={formData.employeeNumber} onChange={handleChange} placeholder="Généré automatiquement" className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}>NIU <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel)</span></label><input name="niu" value={formData.niu} onChange={handleChange} placeholder="NIU de l'employé" className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}>N° Fiscal <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel)</span></label><input name="taxNumber" value={formData.taxNumber} onChange={handleChange} placeholder="Numéro d'impôt individuel" className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}><Flag size={13} className="inline mr-1 text-[var(--text-secondary)]" />Nationalité <span className="text-xs text-[var(--text-secondary)] font-normal">(optionnel)</span></label><FancySelect label="" value={formData.nationality} onChange={(v) => handleSelect('nationality', v)} icon={Flag} placeholder="Sélectionner un pays…" options={NATIONALITY_OPTIONS} /></div>
                  </div>
                </div>
              )}

              {/* ── FAMILLE ── */}
              {activeSection === 'family' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><Heart size={20} className="text-[var(--text-secondary)]" /> Situation Familiale</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><FancySelect label="Situation familiale" value={formData.maritalStatus} onChange={(v) => handleSelect('maritalStatus', v)} icon={Heart}
                      options={[{ value: 'SINGLE', label: 'Célibataire' }, { value: 'MARRIED', label: 'Marié(e)' }, { value: 'DIVORCED', label: 'Divorcé(e)' }, { value: 'WIDOWED', label: 'Veuf/Veuve' }]} /></div>
                    <div>
                      <label className={labelClass}>Nombre d'enfants</label>
                      <input type="number" min="0" max="20" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleChange}
                        className="w-full px-4 py-3 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--border)] outline-none text-2xl font-bold text-center" />
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Impacte le quotient familial IRPP</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── CONTRAT 🆕 ── */}
              {activeSection === 'contract' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><Briefcase size={20} className="text-[var(--text-secondary)]" /> Contrat & Poste</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Intitulé du Poste *</label><input name="position" value={formData.position} onChange={handleChange} className={inputClass} /></div>
                    <div><FancySelect label="Département" value={formData.departmentId} onChange={(v) => handleSelect('departmentId', v)} icon={Building2} options={departments.map((d) => ({ value: d.id, label: d.name }))} /></div>
                    <div><label className={labelClass}><Calendar size={13} className="inline mr-1 text-[var(--text-secondary)]" />Date d'embauche</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className={inputClass} /></div>

                    {/* Type de contrat */}
                    <div>
                      <label className={labelClass}>Type de contrat</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['CDI', 'CDD', 'STAGE', 'CONSULTANT', 'PRESTATAIRE', 'INTERIM'].map((type) => (
                          <Button variant="ghost" key={type} type="button" onClick={() => handleContractTypeChange(type)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                              formData.contractType === type
                                ? 'border-[var(--border)] bg-[var(--surface-2)]  text-[var(--text-secondary)] '
                                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'
                            }`}>
                            {type}
                          </Button>
                        ))}
                      </div>

                      {/* ✅ AJOUT : résumé fiscal inline (même logique que la création) */}
                      {formData.contractType && (
                        <div className="mt-2 p-3.5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                          <div className="grid grid-cols-3 gap-3 text-[11px]">
                            {[
                              { label: 'CNSS',  value: contractMeta?.cnss },
                              { label: 'Impôt', value: contractMeta?.impot },
                              { label: 'TUS',   value: contractMeta?.tus },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="font-black text-[var(--text-secondary)] uppercase tracking-wider mb-0.5">{label}</p>
                                <p className="font-semibold text-[var(--text-secondary)] text-[11px] leading-tight">{value}</p>
                              </div>
                            ))}
                          </div>
                          {contractMeta?.alertes.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1">
                              {contractMeta.alertes.map((a, i) => (
                                <p key={i} className="text-[11px] text-[var(--text-secondary)]  flex items-center gap-1.5">
                                  <AlertCircle size={10} className="shrink-0" /> {a}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 🆕 DATE DE FIN CONDITIONNELLE */}
                    <div className="md:col-span-2">
                      <AnimatePresence>
                        {needsEndDate ? (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="p-5 bg-[var(--surface-2)]  border-2 border-[var(--border)]  rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-bold text-[var(--text-secondary)]  flex items-center gap-2">
                                <CalendarDays size={15} className="text-[var(--text-secondary)]" />
                                Date de fin de contrat <span className="text-[var(--danger-text)]">*</span>
                              </label>
                              {/* Raccourcis */}
                              <div className="flex gap-1.5">
                                {suggestions.map((s) => (
                                  <Button variant="ghost" key={s.months} type="button" onClick={() => applySuggestion(s.months)}
                                    className="px-2.5 py-1 bg-[var(--surface)]  border border-[var(--border)]  rounded-lg text-[11px] font-bold text-[var(--text-secondary)]  hover:bg-[var(--surface-2)] transition-colors">
                                    +{s.label}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <input type="date" name="contractEndDate" value={formData.contractEndDate || ''} onChange={handleChange}
                              min={formData.hireDate || undefined}
                              className="w-full px-4 py-3 border-2 border-[var(--border)]  rounded-xl bg-[var(--surface)]  focus:border-[var(--border)] outline-none font-medium" />
                            <ContractDurationPreview hireDate={formData.hireDate} endDate={formData.contractEndDate} />
                          </motion.div>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="p-4 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl">
                            <p className="text-sm text-[var(--text-secondary)]  flex items-center gap-2 font-medium">
                              <Check size={15} /> CDI — contrat à durée indéterminée, pas de date de fin
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Période d'essai */}
                    {['CDI', 'CDD'].includes(formData.contractType) && (
                      <div className="md:col-span-2 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-[var(--text-secondary)]" />
                          <span className="text-sm font-bold text-[var(--text-secondary)]">Période d'essai <span className="font-normal text-[var(--text-secondary)]">(optionnel)</span></span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Durée (jours)</label>
                            <input type="number" min="0" max="90" name="trialPeriodDays" value={formData.trialPeriodDays} onChange={handleChange} className={inputClass} placeholder="0" />
                          </div>
                          <div>
                            <label className={labelClass}>Fin de période d'essai</label>
                            <input type="date" name="trialEndDate" value={formData.trialEndDate} onChange={handleChange} className={inputClass} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Salaire */}
                    <div className="md:col-span-2">
                      <label className={labelClass}><DollarSign size={13} className="inline mr-1 text-[var(--text-secondary)]" />{isBncContract ? 'Montant HT de la prestation *' : 'Salaire de base *'}</label>
                      <div className="relative">
                        <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange}
                          className="w-full px-4 py-4 pr-20 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--border)] outline-none font-bold text-2xl" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-bold">FCFA</span>
                      </div>
                    </div>

                    {/* ✅ Cumul brut avant Konza RH — optionnel, pour un
                        calcul plus fidèle de l'indemnité de congé tant que
                        l'historique de paie dans l'app est encore court. */}
                    {!isBncContract && (
                      <div className="md:col-span-2">
                        <label className={labelClass}>Cumul brut avant Konza RH (optionnel)</label>
                        <p className="text-xs text-[var(--text-secondary)] mb-2">Somme des salaires bruts déjà perçus par l&apos;employé depuis le début de son cycle de congé en cours, avant Konza RH (ex: cycle démarré en janvier, vous arrivez sur Konza en juillet → cumul des 6 bulletins jan-juin). Utilisé pour l&apos;indemnité de congé tant que l&apos;historique réel est court. Se remet à zéro tout seul au prochain cycle.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <input type="number" name="openingCumulativeGross" value={formData.openingCumulativeGross} onChange={handleChange}
                              placeholder="Cumul brut" className="w-full px-4 py-3 pr-16 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--border)] outline-none font-semibold" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs font-bold">FCFA</span>
                          </div>
                          <div className="relative">
                            <input type="number" name="openingCumulativeMonths" value={formData.openingCumulativeMonths} onChange={handleChange}
                              placeholder="Nb de mois" className="w-full px-4 py-3 pr-14 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] text-[var(--text)] focus:border-[var(--border)] outline-none font-semibold" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-xs font-bold">mois</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ AJOUT : bloc BNC (Consultant / Prestataire) — même logique que la création */}
                    {isBncContract && (
                      <div className="md:col-span-2 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-4">
                        <div className="flex items-center gap-2">
                          <UserCheck size={13} className="text-[var(--text-secondary)]" />
                          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                            Retenue BNC · Résidence fiscale
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          CGI Congo art. 47 ter &amp; art. 44 — le taux dépend du statut de résidence.
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'true',  label: 'Résident / Congolais',  sub: 'BNC 10%', active: isResidentBool },
                            { value: 'false', label: 'Étranger non résident', sub: 'BNC 20%', active: !isResidentBool },
                          ].map(({ value, label, sub, active }) => (
                            <Button variant="ghost"
                              key={value}
                              type="button"
                              onClick={() => handleSelect('isResident', value)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                active
                                  ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)] shadow-md'
                                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]'
                              }`}
                            >
                              <p className="text-[11px] font-bold">{label}</p>
                              <p className={`text-base font-black mt-0.5 ${active ? '' : 'text-[var(--text-secondary)]'}`}>{sub}</p>
                            </Button>
                          ))}
                        </div>

                        {montantHT > 0 && (
                          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)] space-y-2 text-xs">
                            <p className="font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                              <DollarSign size={11} /> Calcul BNC
                            </p>
                            <div className="flex justify-between text-[var(--text-secondary)]">
                              <span>Montant HT</span>
                              <span className="font-bold text-[var(--text)]">{montantHT.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between text-[var(--text-secondary)]">
                              <span>BNC retenu ({bncTaux * 100}%)</span>
                              <span className="font-bold text-[var(--danger-text)]">− {bncMontant.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div className="flex justify-between border-t border-[var(--border)] pt-2">
                              <span className="font-bold text-[var(--text-secondary)]">Net versé</span>
                              <span className="font-bold text-[var(--text-secondary)] ">{bncNet.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] pt-0.5">
                              Les {bncMontant.toLocaleString('fr-FR')} FCFA sont à reverser à la DGI avant le 15 du mois.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Convention collective */}
                    {companyConvention && conventionCategories.length > 0 && (
                      <div className="md:col-span-2 p-5 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl">
                        <div className="flex items-center gap-2 mb-3"><Award size={18} className="text-[var(--text-secondary)]" />
                          <h4 className="font-bold text-[var(--text-secondary)]  text-sm">Convention : {companyConvention}</h4>
                        </div>
                        <FancySelect label="Catégorie conventionnelle" value={String(formData.professionalCategory)} onChange={value => handleCategoryChange(value)} options={[{value:'',label:'Sélectionner une catégorie...'},...conventionCategories.map(cat=>({value:cat.code,label:`${cat.label} — ${cat.minSalary.toLocaleString()} FCFA min.`}))]} />
                        {formData.professionalCategory && (
                          <p className="text-xs text-[var(--text-secondary)] mt-2 flex items-center gap-1.5">
                            <span className="font-mono bg-[var(--surface-2)]  text-[var(--text-secondary)]  px-2 py-0.5 rounded font-bold">{formData.professionalCategory}</span>
                            enregistré comme grade
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PAIEMENT ── */}
              {activeSection === 'payment' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><Wallet size={20} className="text-[var(--text-secondary)]" /> Mode de Paiement</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone }, { value: 'BANK_TRANSFER', label: 'Virement', icon: Building2 }, { value: 'CASH', label: 'Espèces', icon: CreditCard }].map(({ value, label, icon: Icon }) => (
                      <Button variant="ghost" key={value} type="button" onClick={() => handleSelect('paymentMethod', value)}
                        className={`p-4 rounded-xl border text-center transition-all ${formData.paymentMethod === value ? 'border-[var(--border)] bg-[var(--surface-2)]  text-[var(--text-secondary)] ' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'}`}>
                        <Icon className="mx-auto mb-1.5" size={20} /><div className="text-xs font-bold">{label}</div>
                      </Button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {formData.paymentMethod === 'BANK_TRANSFER' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <FancySelect label="Banque" value={formData.bankName} onChange={(v) => handleSelect('bankName', v)} icon={Building2}
                          options={[{ value: 'BGFI', label: 'BGFI Bank' }, { value: 'ECOBANK', label: 'Ecobank' }, { value: 'LCB', label: 'LCB Bank' }, { value: 'UBA', label: 'UBA' }]} />
                        <div><label className={labelClass}>N° de compte</label><input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass + ' font-mono'} /></div>
                      </motion.div>
                    )}
                    {formData.paymentMethod === 'MOBILE_MONEY' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <FancySelect label="Opérateur" value={formData.mobileMoneyOperator} onChange={(v) => handleSelect('mobileMoneyOperator', v)} icon={Smartphone}
                          options={[{ value: 'MTN', label: 'MTN Mobile Money' }, { value: 'AIRTEL', label: 'Airtel Money' }]} />
                        <div><label className={labelClass}>Numéro de téléphone</label><input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={handleChange} className={inputClass + ' font-mono'} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── FISCALITÉ ── */}
              {activeSection === 'fiscal' && (
                <div className="employee-edit-section space-y-5">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><Shield size={20} className="text-[var(--text-secondary)]" /> Retenues de paie</h2>
                  <CnssDeclarationField value={formData.cnssEmployeeDeclared} onChange={value=>handleSelect('cnssEmployeeDeclared',value)} />
                  <p className="fiscal-setting-note">Ces réglages activent les retenues de paie ; ils ne confirment ni une immatriculation ni le dépôt d’une déclaration. Le numéro CNSS se renseigne dans l’identité.</p>
                  {[
                    { key: 'isSubjectToIrpp', label: 'Retenue ITS / IRPP en paie', desc: 'Active la retenue d’impôt sur le revenu dans le calcul de paie.' },
                    { key: 'isSubjectToCnss', label: 'Cotisation CNSS en paie', desc: 'Active la cotisation salariale dans le calcul de paie.' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-4 cursor-pointer p-5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] transition-all group">
                      <input type="checkbox" checked={(formData as any)[key]} onChange={(e) => handleSelect(key, e.target.checked)} className="w-6 h-6 mt-0.5 rounded border-[var(--border)] text-[var(--text-secondary)] focus:ring-[var(--focus)]" />
                      <div><span className="font-bold text-[var(--text)] block mb-1">{label}</span><p className="text-sm text-[var(--text-secondary)]">{desc}</p></div>
                    </label>
                  ))}

                  {/* Zone TOL */}
                  <div className="p-5 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] space-y-2">
                    <p className="font-bold text-[var(--text)] text-sm">Zone TOL (Taxe d'Occupation des Locaux)</p>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">Détermine le montant de la TOL prélevée sur le bulletin</p>
                    <div className="flex gap-3">
                      {([
                        { value: 'VILLE',      label: 'Ville',       desc: '5 000 F/mois', color: 'sky' },
                        { value: 'PERIPHERIE', label: 'Périphérie',  desc: '1 000 F/mois', color: 'emerald' },
                      ] as const).map(opt => (
                        <label key={opt.value} className={`flex-1 flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                          formData.tolZone === opt.value
                            ? 'border-[var(--border)] bg-[var(--surface-2)] '
                            : 'border-[var(--border)] hover:border-[var(--border)]'
                        }`}>
                          <input type="radio" name="tolZone" value={opt.value}
                            checked={formData.tolZone === opt.value}
                            onChange={() => handleSelect('tolZone', opt.value)}
                            className="text-[var(--text-secondary)]" />
                          <div>
                            <span className="font-bold text-[var(--text)] text-sm block">{opt.label}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl">
                        <FancySelect label="Raison de l’exemption" value={String(formData.taxExemptionReason)} onChange={value => handleSelect('taxExemptionReason', value)} options={[{"value":"","label":"Sélectionner une raison..."},{"value":"Stagiaire académique non rémunéré","label":"Stagiaire académique non rémunéré"},{"value":"Consultant externe - Auto-entrepreneur","label":"Consultant externe - Auto-entrepreneur"},{"value":"Expatrié sous convention fiscale","label":"Expatrié sous convention fiscale"},{"value":"Bénévolat / Mission humanitaire","label":"Bénévolat / Mission humanitaire"},{"value":"Autre raison légale","label":"Autre raison légale"}]} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── COMPLÉMENTS (Fiche ORCA) 🆕 ── */}
              {activeSection === 'additional' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><HeartPulse size={20} className="text-[var(--text-secondary)]" /> Informations complémentaires</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><FancySelect label="Groupe sanguin" value={formData.bloodType} onChange={(v) => handleSelect('bloodType', v)} icon={HeartPulse}
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((b) => ({ value: b, label: b }))} /></div>
                    <div><label className={labelClass}>Niveau d'études / diplôme</label><input name="educationLevel" value={formData.educationLevel} onChange={handleChange} className={inputClass} placeholder="BEPC, BAC, Licence…" /></div>
                  </div>

                  <div>
                    <label className={labelClass}>Pathologie / maladie habituelle <span className="text-xs text-[var(--text-secondary)] font-normal">(laisser vide si aucune)</span></label>
                    <textarea name="pathology" value={formData.pathology} onChange={handleChange} rows={2} className={inputClass + ' resize-none'} placeholder="Ex : Asthme, diabète…" />
                  </div>

                  <div className="border-t border-[var(--border)] pt-5">
                    <p className={labelClass}><Users size={13} className="inline mr-1 text-[var(--text-secondary)]" />Filiation</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div><label className={labelClass}>Nom & prénom(s) du père</label><input name="fatherName" value={formData.fatherName} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Nom & prénom(s) de la mère</label><input name="motherName" value={formData.motherName} onChange={handleChange} className={inputClass} /></div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-5">
                    <p className={labelClass}><AlertTriangle size={13} className="inline mr-1 text-[var(--text-secondary)]" />Personne à contacter en cas d'urgence</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div><label className={labelClass}>Nom & prénom</label><input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Lien de parenté</label><input name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} className={inputClass} /></div>
                      <div><label className={labelClass}>Téléphone</label><input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={inputClass} /></div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-5 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.hasDrivingLicense} onChange={(e) => handleSelect('hasDrivingLicense', e.target.checked)}
                        className="w-6 h-6 rounded border-[var(--border)] text-[var(--text-secondary)] focus:ring-[var(--focus)]" />
                      <span className="font-bold text-[var(--text)] flex items-center gap-1.5"><Car size={16} className="text-[var(--text-secondary)]" /> Permis de conduire</span>
                    </label>
                    {formData.hasDrivingLicense && (
                      <div><label className={labelClass}>N° du permis</label><input name="drivingLicenseNumber" value={formData.drivingLicenseNumber} onChange={handleChange} className={inputClass + ' font-mono text-sm'} /></div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[var(--border)] pt-5">
                    <div><label className={labelClass}><Languages size={13} className="inline mr-1 text-[var(--text-secondary)]" />Langue étrangère</label><input name="foreignLanguages" value={formData.foreignLanguages} onChange={handleChange} className={inputClass} placeholder="Anglais, Lingala…" /></div>
                    <div><FancySelect label="Taille de la tenue" value={formData.uniformSize} onChange={(v) => handleSelect('uniformSize', v)} icon={Shirt}
                      options={['S', 'M', 'L', 'XL', 'XXL'].map((s) => ({ value: s, label: s }))} /></div>
                    <div><label className={labelClass}>Pointure de chaussures</label><input name="shoeSize" value={formData.shoeSize} onChange={handleChange} className={inputClass} placeholder="42" /></div>
                  </div>
                </div>
              )}

              {/* ── STATUT ── */}
              {activeSection === 'statut' && (
                <div className="employee-edit-section space-y-6">
                  <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><Power size={20} className="text-[var(--text-secondary)]" /> Statut de l'employé</h2>

                  {/* Statut actif / inactif */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'ACTIVE',     label: 'Actif',     icon: BadgeCheck, desc: 'Employé en poste',          color: 'emerald' },
                      { value: 'INACTIVE',   label: 'Inactif',   icon: XCircle,    desc: 'Contrat terminé / archivé', color: 'rose'    },
                    ] as const).map(({ value, label, icon: Icon, desc, color }) => (
                      <Button variant="ghost" key={value} type="button" onClick={() => handleSelect('status', value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.status === value
                            ? color === 'emerald'
                              ? 'border-[var(--border)] bg-[var(--surface-2)] '
                              : 'border-[var(--border)] bg-[var(--surface-2)] '
                            : 'border-[var(--border)] hover:border-[var(--text-secondary)]'
                        }`}>
                        <Icon size={18} className={formData.status === value ? (color === 'emerald' ? 'text-[var(--text-secondary)]' : 'text-[var(--danger-text)]') : 'text-[var(--text-secondary)]'} />
                        <p className="font-bold text-[var(--text)] mt-2 text-sm">{label}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{desc}</p>
                      </Button>
                    ))}
                  </div>

                  {/* Champs conditionnels si INACTIVE */}
                  {formData.status !== 'ACTIVE' && (
                    <div className="space-y-4 p-4 bg-[var(--surface-2)]  border border-[var(--border)]  rounded-xl">
                      <div>
                        <label className={labelClass}>Date de fin de contrat effective</label>
                        <input type="date" name="terminationDate" value={formData.terminationDate} onChange={handleChange} className={inputClass} />
                      </div>
                      <div>
                        <FancySelect label="Motif de fin de contrat" value={String(formData.terminationReason)} onChange={value => handleSelect('terminationReason', value)} options={[{"value":"","label":"Sélectionner un motif…"},{"value":"Démission","label":"Démission"},{"value":"Licenciement","label":"Licenciement"},{"value":"Rupture conventionnelle","label":"Rupture conventionnelle"},{"value":"Fin de contrat CDD","label":"Fin de contrat CDD"},{"value":"Départ à la retraite","label":"Départ à la retraite"},{"value":"Décès","label":"Décès"},{"value":"Autre","label":"Autre"}]} />
                      </div>
                    </div>
                  )}

                  {/* 🆕 Auto-service employé */}
                  <div className={`p-5 rounded-xl border-2 transition-all ${selfService.enabled ? 'border-[var(--border)] bg-[var(--surface-2)]  ' : 'border-[var(--border)]'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-[var(--text)] text-sm flex items-center gap-2">
                          <UserCheck size={16} className={selfService.enabled ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'} />
                          Modification du profil par l'employé
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
                          Autorise temporairement l'employé à mettre à jour lui-même ses informations personnelles
                          (coordonnées, situation familiale, contact d'urgence, etc.) depuis "Mon Profil" — jamais le
                          contrat, le poste, le salaire ou les informations de paie. Repasse la bascule une fois les
                          modifications validées pour reverrouiller l'accès.
                        </p>
                        {selfService.enabled && selfService.at && (
                          <p className="text-xs text-[var(--text-secondary)]  mt-2 font-medium">
                            Accès accordé le {new Date(selfService.at).toLocaleDateString('fr-FR')}{selfService.by ? ` par ${selfService.by}` : ''}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost"
                        type="button"
                        role="switch" aria-checked={selfService.enabled} aria-label="Autoriser la modification du profil" onClick={handleToggleSelfService}
                        disabled={isTogglingSelfService}
                        className={`shrink-0 relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${selfService.enabled ? 'bg-[var(--action)]' : 'bg-[var(--border)]'}`}
                      >
                        <span className={`absolute top-1 left-1 w-6 h-6 bg-[var(--surface)] rounded-full shadow transform transition-transform ${selfService.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="employee-edit-savebar"><p>Enregistre les modifications de toutes les rubriques.</p>
            <Button variant="primary" onClick={handleSave} disabled={isSaving || imageUpload.uploading || !!uiLoadError}
              className="px-8 py-3 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition-colors">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </div>
      </div>
    </div></div></ModulePageFrame>
  );
}
