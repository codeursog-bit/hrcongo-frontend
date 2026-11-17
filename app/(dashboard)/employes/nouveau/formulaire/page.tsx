'use client';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import '@/components/employees/employees.css';
import '@/components/employees/employee-workspace.css';
import '@/components/employees/employee-onboarding.css';
import { EmployeeJourney, EmployeeStepFeedback, EmployeeCelebration, EmployeeOnboardingStart } from '@/components/employees/create/EmployeeJourney';


import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User, Briefcase, Check, ChevronRight, ChevronLeft, Loader2, BadgeCheck,
  ShieldCheck, Heart, Sparkles, ArrowRight, Star, Copy, Eye, EyeOff, KeyRound,
  HeartPulse,
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Step1Identity } from '@/components/employees/create/Step1Identity';
import { Step2Family } from '@/components/employees/create/Step2Family';
import { Step3Contract } from '@/components/employees/create/Step3Contract';
import { Step4Validation } from '@/components/employees/create/Step4Validation';
import { Step5Additional } from '@/components/employees/create/Step5Additional';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

// ─── Steps config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identité',   icon: User,      color: 'bg-[var(--action)]', desc: 'Informations personnelles' },
  { id: 2, label: 'Famille',    icon: Heart,      color: 'bg-[var(--action)]',   desc: 'Situation familiale & fiscalité' },
  { id: 3, label: 'Contrat',    icon: Briefcase,  color: 'bg-[var(--action)]', desc: 'Poste, salaire & contrat' },
  { id: 4, label: 'Compléments', icon: HeartPulse, color: 'bg-[var(--action)]',  desc: 'Santé, urgence & divers' },
  { id: 5, label: 'Validation', icon: ShieldCheck, color: 'bg-[var(--action)]', desc: 'Vérification finale' },
];

// ─── Génération mot de passe ────────────────────────────────────────────────────
function generatePassword(length = 10): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '@#$!';
  const all = upper + lower + digits + special;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: length - 4 }, () => all[Math.floor(Math.random() * all.length)]),
  ];
  return pwd.sort(() => Math.random() - 0.5).join('');
}

// ─── Toast de célébration step ─────────────────────────────────────────────────

function StepCelebrationToast({ show, step }: { show: boolean; step: number }) {
 return <EmployeeStepFeedback show={show} step={step}/>;
}

// ─── SUCCESS MODAL ─────────────────────────────────────────────────────────────
function SuccessModal({
  show, firstName, lastName, email, generatedPassword, fromCandidate, onGoToEmployee, onAddAnother,
}: {
  show: boolean; firstName: string; lastName: string; email: string;
  generatedPassword: string; fromCandidate: boolean;
  onGoToEmployee: () => void; onAddAnother: () => void;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleCopy = () => {
    const text = `Email : ${email}\nMot de passe : ${generatedPassword}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
        document.body.appendChild(el);
        el.focus(); el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { setCopied(false); }
  };

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]  p-4"
        >
          <motion.div
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28, delay: 0.05 }}
            className="bg-[var(--surface)] rounded-[2rem] p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
          >
            {/* Subtle bg glow */}

            <div className="employee-created-celebration"><EmployeeCelebration final /></div>
            {/* Avatar */}
            <div className="flex justify-center mb-6 relative">
              <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.18 }}
                className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[var(--action)] flex items-center justify-center text-[var(--on-brand)] text-2xl font-black">
                  {initials || <User size={36} />}
                </div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.42, stiffness: 400, damping: 18 }}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[var(--action)] rounded-xl flex items-center justify-center shadow-lg border-2 border-[var(--surface)]">
                  <Check size={14} strokeWidth={3} className="text-[var(--on-brand)]" />
                </motion.div>
              </motion.div>
            </div>

            {/* Text */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="text-center mb-6">
              <h2 className="text-xl font-black text-[var(--text)] mb-1 tracking-tight">
                {firstName} {lastName}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mb-3">
                Dossier RH créé
              </p>
              {fromCandidate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-xl text-xs font-bold text-[var(--employee-ink,var(--text))] ">
                  <Star size={11} /> Candidat converti en employé
                </div>
              )}
            </motion.div>

            {/* Credentials box */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
              className="mb-5 p-4 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] space-y-2.5">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={13} className="text-[var(--employee-ink,var(--text))]" />
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Identifiants préparés pour l’invitation</span>
              </div>
              <div className="p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-0.5">Email</p>
                <p className="text-sm font-mono text-[var(--text)] select-all break-all">{email}</p>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-0.5">Mot de passe provisoire</p>
                  <p className="text-sm font-mono text-[var(--text)] tracking-wider select-all">
                    {showPwd ? generatedPassword : '••••••••••'}
                  </p>
                </div>
                <Button variant="ghost" type="button" onClick={() => setShowPwd(v => !v)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>
              <Button variant="ghost" type="button" onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  copied
                    ? 'border-[var(--border)] bg-[var(--brand-soft)] text-[var(--employee-ink,var(--text))]   '
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                }`}>
                {copied ? <><Check size={13} /> Copié !</> : <><Copy size={13} /> Copier les identifiants</>}
              </Button>
              <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
                L’accès dépend de la création du compte. Vérifiez les éventuels avertissements avant de transmettre ces identifiants à l’employé.
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
              className="space-y-2.5">
              <Button variant="primary" type="button" onClick={onGoToEmployee}
                className="w-full py-3.5 bg-[var(--action)] hover:bg-[var(--action)] text-[var(--on-brand)] font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 group cursor-pointer">
                Voir le dossier employé
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" type="button" onClick={onAddAnother}
                className="w-full py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-2)] text-[var(--text-muted)] font-bold rounded-2xl transition-colors border border-[var(--border)] text-sm cursor-pointer">
                + Créer un autre employé
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── STEPPER HEADER ─────────────────────────────────────────────────────────────
function StepperHeader({ currentStep }: { currentStep: number }) {
 return <EmployeeJourney currentStep={currentStep}/>;
}

// ─── PAGE BACKGROUND ────────────────────────────────────────────────────────────
function PageBackground() { return null; }

// ─── FORMULAIRE PRINCIPAL ─────────────────────────────────────────────────────
function CreateEmployeeFormInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const alert        = useAlert();
  const imageUpload  = useImageUpload();

  const [currentStep, setCurrentStep]         = useState(1);
  const [direction, setDirection]             = useState(0);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationStep, setCelebrationStep] = useState(0);
  const [isLoading, setIsLoading]             = useState(false);
  const [departments, setDepartments]         = useState<any[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [createdEmployeeId, setCreatedEmployeeId] = useState('');

  const fromCandidate = searchParams.get('fromCandidate') || '';
  const prefill = {
    firstName: searchParams.get('firstName') || '',
    lastName:  searchParams.get('lastName')  || '',
    email:     searchParams.get('email')     || '',
    phone:     searchParams.get('phone')     || '',
    position:  searchParams.get('jobTitle')  || '',
  };

  const [formData, setFormData] = useState({
    firstName:        prefill.firstName,
    lastName:         prefill.lastName,
    dateOfBirth:      '',
    placeOfBirth:     '',
    gender:           'MALE',
    phone:            prefill.phone,
    secondaryPhone:   '', // ✅ AJOUT : numéro secondaire, informatif uniquement
    email:            prefill.email,
    address:          '',
    city:             'Brazzaville',
    nationalIdNumber: '',
    cnssNumber:       '',
    cnssEmployeeDeclared: null as boolean|null,
    niu:              '',
    taxNumber:        '',
    employeeNumber:   '',
    maritalStatus:      'SINGLE',
    numberOfChildren:   0,
    isSubjectToIrpp:    true,
    isSubjectToCnss:    true,
    taxExemptionReason: '',
    hireDate:            new Date().toISOString().split('T')[0],
    contractType:        'CDI',
    contractEndDate:     '',
    position:            prefill.position,
    departmentId:        '',
    baseSalary:          '',
    openingCumulativeGross:  '',
    openingCumulativeMonths: '',
    professionalCategory: '',
    echelon:             '',
    trialPeriodDays:     '0',
    trialEndDate:        '',
    tolZone:             'PERIPHERIE' as 'VILLE' | 'PERIPHERIE',
    isResident:          'true',
    nationality:         '',
    paymentMethod:       'CASH',
    bankName:            '',
    bankAccountNumber:   '',
    mobileMoneyOperator: 'MTN',
    mobileMoneyNumber:   '',
    // 🆕 Fiche ORCA — Informations complémentaires
    bloodType:                '',
    pathology:                '',
    fatherName:               '',
    motherName:               '',
    educationLevel:           '',
    emergencyContactName:     '',
    emergencyContactRelation: '',
    emergencyContactPhone:    '',
    hasDrivingLicense:        false,
    drivingLicenseNumber:     '',
    foreignLanguages:         '',
    uniformSize:              '',
    shoeSize:                 '',
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await api.get<any[]>('/departments');
        setDepartments(data);
        if (data.length > 0) setFormData(prev => ({ ...prev, departmentId: data[0].id }));
      } catch {
        alert.error('Erreur', 'Impossible de charger les départements');
      }
    };
    fetchDepts();
  }, []);

  const handleDepartmentCreated = (newDept: any) => {
    setDepartments(prev => [...prev, newDept]);
    setFormData(prev => ({ ...prev, departmentId: newDept.id }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const missing: string[] = [];
    if (!formData.firstName.trim())    missing.push('Prénom');
    if (!formData.lastName.trim())     missing.push('Nom');
    if (!formData.dateOfBirth)         missing.push('Date de naissance');
    if (!formData.placeOfBirth.trim()) missing.push('Lieu de naissance');
    if (!formData.phone.trim())        missing.push('Téléphone');
    if (!formData.email.trim())        missing.push('Email');
    if (!formData.address.trim())      missing.push('Adresse');
    if (missing.length > 0) { alert.error('Champs manquants', `Veuillez remplir : ${missing.join(', ')}`); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.isSubjectToIrpp && !formData.isSubjectToCnss && !formData.taxExemptionReason.trim()) {
      alert.error('Raison requise', "Précisez la raison de l'exemption fiscale"); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const missing: string[] = [];
    if (!formData.position.trim())  missing.push('Poste');
    if (!formData.departmentId)     missing.push('Département');
    if (!formData.baseSalary || parseFloat(formData.baseSalary) <= 0) missing.push('Salaire valide');
    const needsEnd = ['CDD', 'STAGE', 'INTERIM', 'CONSULTANT'].includes(formData.contractType);
    if (needsEnd && !formData.contractEndDate) missing.push('Date de fin de contrat');
    if (missing.length > 0) { alert.error('Champs manquants', `Veuillez remplir : ${missing.join(', ')}`); return false; }
    return true;
  };

  const validateStep4 = () => {
    // Étape "Compléments" — tous les champs sont optionnels
    return true;
  };

  const triggerCelebration = (step: number) => {
    setCelebrationStep(step);
    setShowCelebration(true);
    return new Promise<void>(resolve => {
      setTimeout(() => { setShowCelebration(false); resolve(); }, 650);
    });
  };

  const nextStep = async () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep < 5) {
      setDirection(1);
      await triggerCelebration(currentStep);
      setCurrentStep(curr => curr + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) { setDirection(-1); setCurrentStep(curr => curr - 1); }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        firstName:           formData.firstName,
        lastName:            formData.lastName,
        dateOfBirth:         formData.dateOfBirth,
        placeOfBirth:        formData.placeOfBirth,
        gender:              formData.gender,
        maritalStatus:       formData.maritalStatus,
        numberOfChildren:    parseInt(formData.numberOfChildren as any) || 0,
        phone:               formData.phone,
        secondaryPhone:      (formData.secondaryPhone as string)?.trim() || null, // ✅ AJOUT
        email:               formData.email,
        address:             formData.address,
        city:                formData.city,
        nationalIdNumber:    formData.nationalIdNumber.trim() || null,
        cnssNumber:          formData.cnssNumber.trim() || null,
        cnssEmployeeDeclared: formData.cnssEmployeeDeclared,
        niu:                 (formData.niu as string).trim() || null,
        taxNumber:           (formData.taxNumber as string).trim() || null,
        employeeNumber:      (formData.employeeNumber as string).trim() || undefined,
        hireDate:            formData.hireDate,
        contractType:        formData.contractType,
        contractEndDate:     formData.contractEndDate || null,
        position:            formData.position,
        departmentId:        formData.departmentId,
        baseSalary:          parseFloat(formData.baseSalary),
        openingCumulativeGross:
          (formData.openingCumulativeGross as string).trim()
            ? parseFloat(formData.openingCumulativeGross as string)
            : null,
        openingCumulativeMonths:
          (formData.openingCumulativeMonths as string).trim()
            ? parseInt(formData.openingCumulativeMonths as string)
            : null,
        professionalCategory: (formData.professionalCategory as string) || null,
        echelon:             (formData.echelon as string).trim() || null,
        trialPeriodDays:     parseInt(formData.trialPeriodDays as string) || 0,
        tolZone:             formData.tolZone || 'PERIPHERIE',
        isResident:          formData.isResident !== 'false',
        nationality:         (formData.nationality as string) || null,
        paymentMethod:       formData.paymentMethod,
        bankName:            formData.bankName,
        bankAccountNumber:   formData.bankAccountNumber,
        mobileMoneyOperator: formData.mobileMoneyOperator,
        mobileMoneyNumber:   formData.mobileMoneyNumber,
        photoUrl:            imageUpload.uploadedUrl,
        isSubjectToIrpp:     formData.isSubjectToIrpp,
        isSubjectToCnss:     formData.isSubjectToCnss,
        taxExemptionReason:  formData.taxExemptionReason || null,
        // 🆕 Fiche ORCA — Informations complémentaires
        bloodType:                formData.bloodType || null,
        pathology:                formData.pathology || null,
        fatherName:               formData.fatherName || null,
        motherName:               formData.motherName || null,
        educationLevel:           formData.educationLevel || null,
        emergencyContactName:     formData.emergencyContactName || null,
        emergencyContactRelation: formData.emergencyContactRelation || null,
        emergencyContactPhone:    formData.emergencyContactPhone || null,
        hasDrivingLicense:        !!formData.hasDrivingLicense,
        drivingLicenseNumber:     formData.hasDrivingLicense ? (formData.drivingLicenseNumber || null) : null,
        foreignLanguages:         formData.foreignLanguages || null,
        uniformSize:              formData.uniformSize || null,
        shoeSize:                 formData.shoeSize || null,
      };

      const createdEmployee = await api.post<any>('/employees', payload);
      setCreatedEmployeeId(createdEmployee?.id || '');

      const pwd = generatePassword(10);
      setGeneratedPassword(pwd);

      try {
        const invitePromise = api.post('/users/invite', {
          email: formData.email, firstName: formData.firstName,
          lastName: formData.lastName, role: 'EMPLOYEE',
          password: pwd, departmentId: formData.departmentId,
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000));
        await Promise.race([invitePromise, timeout]);
      } catch (e: any) {
        if (e.message === 'timeout') {
          alert.warning('Email différé', "L'employé est créé. L'email d'invitation sera envoyé ultérieurement.");
        } else if (e?.response?.status === 409) {
          // silencieux : compte déjà existant
        } else {
          console.error('[invite] Erreur:', e?.response?.data || e.message);
          alert.warning('Compte non créé', e?.response?.data?.message || "Le compte utilisateur n'a pas pu être créé.");
        }
      }

      setIsLoading(false);
      setShowSuccess(true);
    } catch (error: any) {
      setIsLoading(false);
      // services/api.ts lève une Error avec .message / .status / .data
      // (pas de .response comme axios) → on lit donc error.data.
      const data = error?.data;
      if (Array.isArray(data?.fields) && data.fields.length > 0) {
        alert.error('Champs manquants', `Vérifiez : ${data.fields.join(', ')}`);
      } else {
        const msg = Array.isArray(data?.message)
          ? data.message.join(' • ')
          : data?.message || error?.message;
        alert.error('Erreur', msg || 'Erreur lors de la création');
      }
    }
  };

  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  return (
    <>
      <PageBackground /><EmployeeOnboardingStart />

      <div className="employee-create-workspace">

        {/* Celebration toast */}
        <StepCelebrationToast show={showCelebration} step={celebrationStep} />

        <SuccessModal
          show={showSuccess}
          firstName={formData.firstName}
          lastName={formData.lastName}
          email={formData.email}
          generatedPassword={generatedPassword}
          fromCandidate={!!fromCandidate}
          onGoToEmployee={() => router.push(createdEmployeeId ? `/employes/${createdEmployeeId}` : '/employes')}
          onAddAnother={() => window.location.reload()}
        />

        {/* Candidate banner */}
        {fromCandidate && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] rounded-2xl shadow-xl text-sm font-bold">
            <Sparkles size={14} className="text-[var(--employee-ink,var(--text))]  shrink-0" />
            Formulaire pré-rempli depuis le dossier candidat
          </motion.div>
        )}

        <div className="employee-create-shell">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="employee-create-heading"
          >
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
                Créer un employé
              </h1><p>Un dossier complet, une étape à la fois.</p>
            </div>
            <Button variant="ghost"
              onClick={() => router.back()}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] font-medium transition-colors hidden sm:block"
            >
              Annuler
            </Button>
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="employee-create-layout"
          >
            {/* Stepper */}
            <div className="employee-create-rail">
              <StepperHeader currentStep={currentStep} />
            </div>

            {/* Step content */}
            <div id="employee-step-content" tabIndex={-1} aria-busy={showCelebration} className="employee-create-content">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                >
                  {currentStep === 1 && (
                    <Step1Identity
                      formData={formData}
                      onInputChange={handleInputChange}
                      onSelectChange={handleSelectChange}
                      imageUpload={imageUpload}
                    />
                  )}
                  {currentStep === 2 && (
                    <Step2Family
                      formData={formData}
                      onInputChange={handleInputChange}
                      onSelectChange={handleSelectChange}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3Contract
                      formData={formData}
                      onInputChange={handleInputChange}
                      onSelectChange={handleSelectChange}
                      departments={departments}
                      onDepartmentCreated={handleDepartmentCreated}
                    />
                  )}
                  {currentStep === 4 && (
                    <Step5Additional
                      formData={formData}
                      onInputChange={handleInputChange}
                      onSelectChange={handleSelectChange}
                    />
                  )}
                  {currentStep === 5 && (
                    <Step4Validation
                      formData={formData}
                      departments={departments}
                      imagePreview={imageUpload.preview}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer navigation */}
            <div className="employee-create-footer">

              {/* Back / Cancel */}
              <Button variant="ghost"
                disabled={showCelebration || isLoading} onClick={currentStep === 1 ? () => router.back() : prevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors"
              >
                {currentStep === 1 ? (
                  'Annuler'
                ) : (
                  <><ChevronLeft size={16} /> Précédent</>
                )}
              </Button>

              {/* Dot indicators */}
              <div aria-hidden="true" className="journey-footer-dots">
                {STEPS.map((s) => (
                  <motion.div
                    key={s.id}
                    animate={{
                      width: s.id === currentStep ? 24 : 7,
                      opacity: s.id < currentStep ? 1 : s.id === currentStep ? 1 : 0.25,
                    }}
                    transition={{ duration: 0.28 }}
                    className={`h-1.5 rounded-full ${
                      s.id <= currentStep
                        ? 'bg-[var(--text)]'
                        : 'bg-[var(--border)]'
                    }`}
                  />
                ))}
              </div>

              {/* Next / Submit */}
              <Button variant="primary"
                onClick={currentStep === 5 ? handleSubmit : nextStep}
                disabled={isLoading || showCelebration || (currentStep === 1 && imageUpload.uploading)}
                className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-[var(--on-brand)] bg-[var(--action)] hover:bg-[var(--action)] shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={16} /> Création…</>
                ) : currentStep === 5 ? (
                  <><BadgeCheck size={16} /> Créer l'employé</>
                ) : (
                  <>Continuer <ChevronRight size={16} /></>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Help tip */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-[var(--text-muted)] mt-4"
          >
            Vous pourrez toujours modifier ou compléter le dossier plus tard
          </motion.p>
        </div>
      </div>
    </>
  );
}

export default function CreateEmployeePage() {
  return (
    <ModulePageFrame kind="list"><div className="employee-module-page employee-create-page"><MotionConfig reducedMotion="user"><Suspense fallback={
      <ModulePageSkeleton label="Chargement des employés" />
    }>
      <CreateEmployeeFormInner />
    </Suspense></MotionConfig></div></ModulePageFrame>
  );
}
