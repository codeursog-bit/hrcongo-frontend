'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, MapPin, Save, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, ShieldCheck, Check, Landmark,
  HardHat, ShoppingCart, Factory, Flame, Truck,
  Utensils, Leaf, Wifi, HeartPulse, GraduationCap,
  Award, BookOpen, Sparkles, PartyPopper, Rocket,
  Phone, Mail, Hash, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { api } from '@/services/api';
import { useCompanyReminder } from '@/components/providers/CompanyReminderProvider';

// ─────────────────────────────────────────────────────────
// CONVENTIONS
// ─────────────────────────────────────────────────────────
const CONVENTION_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
  description: string;
}> = {
  BTP:              { icon: HardHat,      color: 'text-orange-600',  bg: 'bg-orange-50',   border: 'border-orange-200',  label: 'BTP',               description: 'Bâtiment & Travaux Publics' },
  COMMERCE:         { icon: ShoppingCart, color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200',    label: 'Commerce',          description: 'Commerce & Distribution' },
  INDUSTRIE:        { icon: Factory,      color: 'text-slate-600',   bg: 'bg-slate-50',    border: 'border-slate-200',   label: 'Industrie',         description: 'Industrie & Manufacture' },
  HYDROCARBURES:    { icon: Flame,        color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     label: 'Hydrocarbures',     description: 'Pétrole & Gaz' },
  BANQUES:          { icon: Landmark,     color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', label: 'Banques & Finances', description: 'Banques, Assurances & Finance' },
  TRANSPORTS:       { icon: Truck,        color: 'text-purple-600',  bg: 'bg-purple-50',   border: 'border-purple-200',  label: 'Transports',        description: 'Transports & Logistique' },
  HOTELLERIE:       { icon: Utensils,     color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   label: 'Hôtellerie',        description: 'Hôtellerie & Restauration' },
  AGRICULTURE:      { icon: Leaf,         color: 'text-green-600',   bg: 'bg-green-50',    border: 'border-green-200',   label: 'Agriculture',       description: 'Agriculture & Sylviculture' },
  TELECOMMUNICATIONS:{ icon: Wifi,        color: 'text-cyan-600',    bg: 'bg-cyan-50',     border: 'border-cyan-200',    label: 'Télécoms',          description: 'Télécoms & Technologies' },
  SANTE:            { icon: HeartPulse,   color: 'text-pink-600',    bg: 'bg-pink-50',     border: 'border-pink-200',    label: 'Santé',             description: 'Santé & Pharmacie' },
  EDUCATION:        { icon: GraduationCap,color: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-200',  label: 'Éducation',         description: 'Enseignement & Formation' },
};

// ─────────────────────────────────────────────────────────
// STEPS CONFIG
// ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identité',    icon: Building2,   color: 'sky',     encouragement: "Commençons par les bases 🏢" },
  { id: 2, label: 'Contact',     icon: MapPin,       color: 'emerald', encouragement: "Presque à mi-chemin ! 📍" },
  { id: 3, label: 'Convention',  icon: BookOpen,     color: 'purple',  encouragement: "Excellent progrès ! 📋" },
  { id: 4, label: 'Fiscalité',   icon: ShieldCheck,  color: 'amber',   encouragement: "Dernière étape, on y est ! 🎯" },
];

const COLOR_MAP: Record<string, { ring: string; bg: string; text: string; border: string; grad: string }> = {
  sky:     { ring: 'focus:ring-sky-500/20',     bg: 'bg-sky-500',     text: 'text-sky-500',     border: 'border-sky-500',     grad: 'from-sky-500 to-cyan-400' },
  emerald: { ring: 'focus:ring-emerald-500/20', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', grad: 'from-emerald-500 to-teal-400' },
  purple:  { ring: 'focus:ring-purple-500/20',  bg: 'bg-purple-500',  text: 'text-purple-500',  border: 'border-purple-500',  grad: 'from-purple-500 to-violet-400' },
  amber:   { ring: 'focus:ring-amber-500/20',   bg: 'bg-amber-500',   text: 'text-amber-500',   border: 'border-amber-500',   grad: 'from-amber-500 to-orange-400' },
};

// ─────────────────────────────────────────────────────────
// COMPOSANT CHAMP
// ─────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, placeholder, required, mono, type = 'text', hint, colorKey = 'sky'
}: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; required?: boolean; mono?: boolean; type?: string; hint?: string; colorKey?: string;
}) {
  const [focused, setFocused] = useState(false);
  const col = COLOR_MAP[colorKey];
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className={`relative rounded-xl transition-all duration-200 ${focused ? `ring-2 ${col.ring} ring-offset-0` : ''}`}>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full p-3 bg-gray-50 dark:bg-gray-900 border ${focused ? col.border : 'border-gray-200 dark:border-gray-600'} rounded-xl outline-none transition-all ${mono ? 'font-mono' : ''} text-gray-900 dark:text-white placeholder:text-gray-400`}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────
export default function CreateCompanyPage() {
  const router = useRouter();
  const { recheckCompany } = useCompanyReminder();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confettiActive, setConfettiActive] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [selectedConvention, setSelectedConvention] = useState('');
  const [createdCompanyName, setCreatedCompanyName] = useState('');

  const [form, setForm] = useState({
    legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '', industry: '',
    address: '', city: '', phone: '', email: '',
    appliesCnssEmployer: true, cnssEmployerRate: 20.28,
    defaultAppliesIrpp: true, defaultAppliesCnss: true,
  });

  // Taille window pour confettis
  useEffect(() => {
    const update = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const goTo = (next: number) => {
    setErrorMsg('');
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.legalName.trim()) return "Le nom légal est requis.";
      if (!form.rccmNumber.trim()) return "Le numéro RCCM est requis.";
    }
    if (step === 2) {
      if (!form.address.trim() || !form.city.trim()) return "L'adresse et la ville sont requises.";
      if (!form.phone.trim() || !form.email.trim()) return "Téléphone et email sont requis.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setErrorMsg(err); return; }
    if (step < 4) goTo(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      // ← Lire le code affilié stocké au moment de l'inscription
      const affiliateCode = localStorage.getItem('affiliate_ref') || undefined;

      await api.post('/companies', {
        legalName: form.legalName,
        tradeName: form.tradeName || undefined,
        rccmNumber: form.rccmNumber,
        cnssNumber: form.cnssNumber || undefined,
        taxNumber: form.taxNumber || undefined,
        address: form.address,
        city: form.city,
        country: 'CG',
        phone: form.phone,
        email: form.email,
        industry: form.industry || 'Autre',
        collectiveAgreement: selectedConvention || undefined,
        appliesCnssEmployer: form.appliesCnssEmployer,
        cnssEmployerRate: form.appliesCnssEmployer ? Number(form.cnssEmployerRate) : 0,
        defaultAppliesIrpp: form.defaultAppliesIrpp,
        defaultAppliesCnss: form.defaultAppliesCnss,
        affiliateCode,
      });

      // ← Nettoyer après usage pour ne pas re-lier si la company est recréée
      localStorage.removeItem('affiliate_ref');

      setCreatedCompanyName(form.tradeName || form.legalName);
      setIsSuccess(true);
      setConfettiActive(true);
      await recheckCompany();
      setTimeout(() => setConfettiActive(false), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS[step - 1];
  const progress = (step / 4) * 100;

  // ── ÉCRAN SUCCÈS ────────────────────────────────────────
  if (isSuccess) {
    return (
      <>
        {confettiActive && (
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={350}
            colors={['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']}
          />
        )}
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
            className="max-w-md w-full text-center"
          >
            {/* Icône animée */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
              <PartyPopper size={44} className="text-white" />
            </motion.div>

            {/* Titre */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-gray-900 dark:text-white mb-2"
            >
              Félicitations ! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-500 dark:text-gray-400 mb-2"
            >
              Votre entreprise a été créée avec succès
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-8"
            >
              {createdCompanyName}
            </motion.p>

            {/* Carte étapes suivantes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 text-left"
            >
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Prochaines étapes</p>
              {[
                { icon: '👤', text: 'Créez vos premiers employés' },
                { icon: '📋', text: 'Configurez les conventions collectives' },
                { icon: '💰', text: 'Générez vos premiers bulletins de paie' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.1 }}
                  className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                  <div className="ml-auto w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-emerald-600" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={() => router.push('/dashboard')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-all text-lg"
            >
              <Rocket size={22} /> Accéder au tableau de bord
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // ── VARIANTS ANIMATION STEPS ───────────────────────────
  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  // ── RENDU PRINCIPAL ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Créer votre entreprise</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configurez votre espace RH en quelques étapes</p>
          </div>
        </div>

        {/* ── STEPPER ── */}
        <div className="mb-8">
          {/* Barre de progression */}
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-5">
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-purple-500"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Steps indicators */}
          <div className="flex items-center justify-between relative">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const col = COLOR_MAP[s.color];
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { if (s.id < step) goTo(s.id); }}
                  disabled={s.id > step}
                  className={`flex flex-col items-center gap-1.5 group disabled:cursor-not-allowed`}
                >
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                        : isCurrent
                        ? `${col.bg} border-2 ${col.border} shadow-lg`
                        : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {isDone
                      ? <Check size={18} className="text-white" />
                      : <Icon size={18} className={isCurrent ? col.text : 'text-gray-400'} />
                    }
                  </motion.div>
                  <span className={`text-xs font-semibold hidden sm:block transition-colors ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MESSAGE D'ENCOURAGEMENT ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`enc-${step}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm`}>
              <Sparkles size={14} className={COLOR_MAP[currentStep.color].text} />
              <span className="text-gray-700 dark:text-gray-300">{currentStep.encouragement}</span>
              <span className="text-gray-400 text-xs">Étape {step}/4</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── CONTENU STEP ── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >

            {/* ═══ STEP 1 : IDENTITÉ ═══ */}
            {step === 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                    <Building2 size={20} className="text-sky-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Identité de l'entreprise</h2>
                    <p className="text-xs text-gray-500">Informations légales et secteur d'activité</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Nom Légal" name="legalName" value={form.legalName} onChange={handleChange}
                      placeholder="Ex: SARL INNOVATION TECH CONGO" required colorKey="sky" />
                  </div>
                  <Field label="Nom Commercial" name="tradeName" value={form.tradeName} onChange={handleChange}
                    placeholder="Ex: InnoTech" colorKey="sky" />
                  <Field label="Secteur d'Activité" name="industry" value={form.industry} onChange={handleChange}
                    placeholder="Ex: Technologie, Commerce..." colorKey="sky" />
                  <Field label="N° RCCM" name="rccmNumber" value={form.rccmNumber} onChange={handleChange}
                    placeholder="EX: CG-BZV-01-2024-B12-00123" required colorKey="sky" />
                  <Field label="N° CNSS Employeur" name="cnssNumber" value={form.cnssNumber} onChange={handleChange}
                    placeholder="123456789" mono colorKey="sky" hint="Optionnel" />
                  <div className="md:col-span-2">
                    <Field label="N° Fiscal — NIU" name="taxNumber" value={form.taxNumber} onChange={handleChange}
                      placeholder="M092500001234" mono colorKey="sky" hint="Optionnel" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 2 : CONTACT ═══ */}
            {step === 2 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <MapPin size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Localisation & Contact</h2>
                    <p className="text-xs text-gray-500">Adresse et coordonnées de votre entreprise</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Adresse Complète" name="address" value={form.address} onChange={handleChange}
                      placeholder="Ex: 123 Avenue de l'Indépendance" required colorKey="emerald" />
                  </div>
                  <Field label="Ville" name="city" value={form.city} onChange={handleChange}
                    placeholder="Ex: Brazzaville, Pointe-Noire..." required colorKey="emerald" />
                  <Field label="Téléphone" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+242 06 123 45 67" required colorKey="emerald" />
                  <div className="md:col-span-2">
                    <Field label="Email de Contact" name="email" value={form.email} onChange={handleChange}
                      placeholder="contact@entreprise.cg" required type="email" colorKey="emerald" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3 : CONVENTION ═══ */}
            {step === 3 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Convention Collective</h2>
                    <p className="text-xs text-gray-500">Définit les catégories et salaires minimums de vos employés <span className="italic">(optionnel)</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {Object.entries(CONVENTION_CONFIG).map(([code, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedConvention === code;
                    return (
                      <motion.button
                        key={code}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedConvention(isSelected ? '' : code)}
                        className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md shadow-purple-500/10'
                            : `border-gray-200 dark:border-gray-700 hover:${config.border} hover:${config.bg}`
                        }`}
                      >
                        <div className={`w-9 h-9 ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40' : config.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <Icon size={18} className={isSelected ? 'text-purple-600' : config.color} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold text-xs ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                            {config.label}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{config.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"
                          >
                            <Check size={9} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selectedConvention && CONVENTION_CONFIG[selectedConvention] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl flex items-start gap-3">
                        <Award size={16} className="text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                            Convention {CONVENTION_CONFIG[selectedConvention].label} ✓
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            Les catégories professionnelles et salaires minimums seront disponibles pour vos employés.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!selectedConvention && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <AlertCircle size={12} /> Sans convention, les catégories ne seront pas pré-remplies. Modifiable plus tard dans les paramètres.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 4 : FISCALITÉ ═══ */}
            {step === 4 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configuration Fiscale</h2>
                    <p className="text-xs text-gray-500">Régime fiscal de l'entreprise et défauts employés</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* CNSS PATRONALE */}
                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all group">
                    <input type="checkbox" name="appliesCnssEmployer" checked={form.appliesCnssEmployer}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm block group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        L'entreprise paie la CNSS patronale
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Charges patronales calculées sur les bulletins de paie</p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {form.appliesCnssEmployer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-9 p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-xl">
                          <label className="block text-xs font-bold text-sky-700 dark:text-sky-400 mb-2 uppercase">Taux CNSS Patronale</label>
                          <div className="flex items-center gap-3">
                            <input type="number" name="cnssEmployerRate" min="0" max="50" step="0.5"
                              value={form.cnssEmployerRate} onChange={handleChange}
                              className="w-24 p-2.5 bg-white dark:bg-gray-800 border border-sky-300 dark:border-sky-700 rounded-lg font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" />
                            <span className="text-xl font-bold text-gray-400">%</span>
                            <p className="text-xs text-gray-400">Standard Congo : <strong className="text-sky-600">16%</strong></p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Défauts pour les nouveaux employés</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 transition-all">
                        <input type="checkbox" name="defaultAppliesIrpp" checked={form.defaultAppliesIrpp}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">IRPP / ITS</span>
                          <p className="text-xs text-gray-400">Impôt sur le revenu</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 transition-all">
                        <input type="checkbox" name="defaultAppliesCnss" checked={form.defaultAppliesCnss}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 shrink-0" />
                        <div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white block">CNSS salariale (4%)</span>
                          <p className="text-xs text-gray-400">Cotisation sociale employé</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* RÉCAP */}
                <div className="p-4 bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/10 dark:to-emerald-900/10 border border-sky-200 dark:border-sky-800 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Check size={12} className="text-emerald-500" /> Récapitulatif
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { label: 'Entreprise', val: form.tradeName || form.legalName || '—' },
                      { label: 'Ville',       val: form.city || '—' },
                      { label: 'Convention',  val: selectedConvention ? (CONVENTION_CONFIG[selectedConvention]?.label || selectedConvention) : 'Aucune' },
                      { label: 'CNSS patronale', val: form.appliesCnssEmployer ? `${form.cnssEmployerRate}%` : 'Non applicable' },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* ── ERREUR ── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle size={16} /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── NAVIGATION ── */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => step > 1 ? goTo(step - 1) : router.back()}
            className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} /> {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {step < 4 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-6 py-2.5 bg-gradient-to-r ${COLOR_MAP[currentStep.color].grad} text-white font-bold rounded-xl shadow-lg flex items-center gap-2 text-sm transition-all`}
            >
              Suivant <ArrowRight size={16} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 text-sm transition-all"
            >
              {isSubmitting
                ? <><Loader2 className="animate-spin" size={17} /> Création en cours...</>
                : <><Save size={17} /> Créer l'entreprise</>
              }
            </motion.button>
          )}
        </div>

      </div>
    </div>
  );
}

// 'use client';

// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   Building2, MapPin, Phone, Mail, Briefcase, Save, ArrowLeft,
//   Loader2, AlertCircle, ShieldCheck, Check, Landmark, Lock
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { useCompanyReminder } from '@/components/providers/CompanyReminderProvider'; // 🆕

// export default function CreateCompanyPage() {
//   const router = useRouter();
//   const { recheckCompany } = useCompanyReminder(); // 🆕
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState('');

//   const [formData, setFormData] = useState({
//     // Identification
//     legalName: '',
//     tradeName: '',
//     rccmNumber: '',
//     cnssNumber: '',
//     taxNumber: '',
    
//     // Localisation
//     address: '',
//     city: '',
//     phone: '',
//     email: '',
    
//     // Activité
//     industry: '',
    
//     // Configuration Fiscale
//     appliesCnssEmployer: true,
//     cnssEmployerRate: 16,
//     defaultAppliesIrpp: true,
//     defaultAppliesCnss: true,
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleCheckboxChange = (name: string, checked: boolean) => {
//     setFormData(prev => ({ ...prev, [name]: checked }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMsg('');

//     // Validation
//     if (!formData.legalName.trim()) {
//       setErrorMsg('Le nom de l\'entreprise est requis');
//       setIsLoading(false);
//       return;
//     }

//     if (!formData.address.trim() || !formData.city.trim()) {
//       setErrorMsg('L\'adresse et la ville sont requises');
//       setIsLoading(false);
//       return;
//     }

//     if (!formData.phone.trim() || !formData.email.trim()) {
//       setErrorMsg('Les coordonnées sont requises');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       await api.post('/companies', {
//         legalName: formData.legalName,
//         tradeName: formData.tradeName || undefined,
//         rccmNumber: formData.rccmNumber || 'EN-COURS',
//         cnssNumber: formData.cnssNumber || undefined,
//         taxNumber: formData.taxNumber || undefined,
//         address: formData.address,
//         city: formData.city,
//         country: 'CG',
//         phone: formData.phone,
//         email: formData.email,
//         industry: formData.industry || 'Autre',
        
//         // Configuration Fiscale
//         appliesCnssEmployer: formData.appliesCnssEmployer,
//         cnssEmployerRate: formData.appliesCnssEmployer ? Number(formData.cnssEmployerRate) : 0,
//         defaultAppliesIrpp: formData.defaultAppliesIrpp,
//         defaultAppliesCnss: formData.defaultAppliesCnss,
//       });

//       // 🎯 IMPORTANT : Dire au Provider que l'entreprise existe maintenant !
//       await recheckCompany();

//       router.push('/dashboard');
//     } catch (err: any) {
//       console.error("Company creation error", err);
//       setErrorMsg(err.message || "Une erreur est survenue lors de la création de l'entreprise.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
//       <div className="max-w-4xl mx-auto">
        
//         {/* Header */}
//         <div className="flex items-center gap-4 mb-8">
//           <button 
//             onClick={() => router.back()} 
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400"/>
//           </button>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer une entreprise</h1>
//             <p className="text-gray-500 dark:text-gray-400 text-sm">Configurez votre structure RH</p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-8">
          
//           {/* SECTION 1: Identification */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <Building2 size={20} className="text-sky-500" /> Identification de l'entreprise
//             </h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Nom Légal de l'Entreprise *
//                 </label>
//                 <input 
//                   name="legalName"
//                   value={formData.legalName}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: SARL INNOVATION TECH CONGO"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Nom Commercial (optionnel)
//                 </label>
//                 <input 
//                   name="tradeName"
//                   value={formData.tradeName}
//                   onChange={handleChange}
//                   placeholder="Ex: InnoTech"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Secteur d'Activité *
//                 </label>
//                 <input 
//                   name="industry"
//                   value={formData.industry}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: Technologie, Commerce, Finance..."
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° RCCM (optionnel)
//                 </label>
//                 <input 
//                   name="rccmNumber"
//                   value={formData.rccmNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: CG-BZV-01-2024-B12-00123"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° CNSS (optionnel)
//                 </label>
//                 <input 
//                   name="cnssNumber"
//                   value={formData.cnssNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: 123456789"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° Fiscal - NIU (optionnel)
//                 </label>
//                 <input 
//                   name="taxNumber"
//                   value={formData.taxNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: M092500001234"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* SECTION 2: Localisation & Contact */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <MapPin size={20} className="text-emerald-500" /> Localisation & Contact
//             </h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Adresse Complète *
//                 </label>
//                 <input 
//                   name="address"
//                   value={formData.address}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: 123 Avenue de l'Indépendance"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Ville *
//                 </label>
//                 <input 
//                   name="city"
//                   value={formData.city}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: Brazzaville, Pointe-Noire..."
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Téléphone *
//                 </label>
//                 <input 
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: +242 06 123 45 67"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Email de Contact *
//                 </label>
//                 <input 
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: contact@entreprise.cg"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* SECTION 3: Configuration Fiscale */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
//               <ShieldCheck size={20} className="text-amber-500" /> Configuration Fiscale
//             </h3>
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
//               Définissez le régime fiscal de votre entreprise et les paramètres par défaut pour vos employés
//             </p>
            
//             <div className="space-y-5">
//               {/* CNSS PATRONALE */}
//               <label className="flex items-start gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
//                 <input 
//                   type="checkbox"
//                   checked={formData.appliesCnssEmployer}
//                   onChange={(e) => handleCheckboxChange('appliesCnssEmployer', e.target.checked)}
//                   className="w-6 h-6 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
//                 />
//                 <div className="flex-1">
//                   <span className="text-base font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
//                     L'entreprise paie la CNSS patronale
//                   </span>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Cochez si votre entreprise est immatriculée à la CNSS et doit payer les charges patronales (taux standard : 16%)
//                   </p>
//                 </div>
//               </label>

//               {/* TAUX PERSONNALISÉ */}
//               {formData.appliesCnssEmployer && (
//                 <div className="ml-10 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
//                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
//                     Taux CNSS Patronale (%)
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <input 
//                       type="number"
//                       name="cnssEmployerRate"
//                       min="0"
//                       max="50"
//                       step="0.5"
//                       value={formData.cnssEmployerRate}
//                       onChange={handleChange}
//                       className="w-32 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
//                     />
//                     <span className="text-2xl font-bold text-gray-400">%</span>
//                     <p className="text-xs text-gray-500 dark:text-gray-400">Taux légal standard : <strong className="text-sky-600">16%</strong></p>
//                   </div>
//                 </div>
//               )}

//               {/* SÉPARATEUR */}
//               <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
//                 <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
//                   Configuration par défaut pour les employés
//                 </h4>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
//                   Ces valeurs seront appliquées automatiquement lors de la création de nouveaux employés. Vous pourrez toujours les ajuster individuellement.
//                 </p>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {/* PAR DÉFAUT IRPP */}
//                   <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
//                     <input 
//                       type="checkbox"
//                       checked={formData.defaultAppliesIrpp}
//                       onChange={(e) => handleCheckboxChange('defaultAppliesIrpp', e.target.checked)}
//                       className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
//                     />
//                     <div>
//                       <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                         Soumis à l'IRPP/ITS
//                       </span>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">Impôt sur le revenu</p>
//                     </div>
//                   </label>

//                   {/* PAR DÉFAUT CNSS */}
//                   <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
//                     <input 
//                       type="checkbox"
//                       checked={formData.defaultAppliesCnss}
//                       onChange={(e) => handleCheckboxChange('defaultAppliesCnss', e.target.checked)}
//                       className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
//                     />
//                     <div>
//                       <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                         Soumis à la CNSS salariale (4%)
//                       </span>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">Cotisation sociale employé</p>
//                     </div>
//                   </label>
//                 </div>
//               </div>

//               {/* INFO */}
//               <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-xl">
//                 <p className="text-sm text-sky-900 dark:text-sky-100 flex items-center gap-2">
//                   <AlertCircle size={16} />
//                   <strong>Important :</strong> Ces paramètres peuvent être modifiés ultérieurement dans les paramètres de l'entreprise
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ERROR MESSAGE */}
//           {errorMsg && (
//             <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
//               <AlertCircle size={18} /> {errorMsg}
//             </div>
//           )}

//           {/* SUBMIT BUTTON */}
//           <div className="flex gap-4">
//             <button
//               type="button"
//               onClick={() => router.back()}
//               className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//             >
//               Annuler
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="flex-1 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="animate-spin" size={20} />
//                   Création en cours...
//                 </>
//               ) : (
//                 <>
//                   <Save size={20} />
//                   Créer l'entreprise
//                 </>
//               )}
//             </button>
//           </div>
//         </form>

//       </div>
//     </div>
//   );
// }


