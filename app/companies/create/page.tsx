

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Building2, MapPin, Save, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, ShieldCheck, Check, Landmark,
  HardHat, ShoppingCart, Factory, Flame, Truck,
  Utensils, Leaf, Wifi, HeartPulse, GraduationCap,
  Award, BookOpen, Sparkles, PartyPopper, Rocket,
  Phone, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactConfetti from 'react-confetti';
import { api } from '@/services/api';
import { useCompanyReminder } from '@/components/providers/CompanyReminderProvider';

// ─────────────────────────────────────────────────────────
// CONVENTIONS
// ─────────────────────────────────────────────────────────
const CONVENTION_CONFIG: Record<string, {
  icon: React.ElementType; color: string; bg: string; border: string; glow: string;
  label: string; description: string;
}> = {
  BTP:               { icon: HardHat,       color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/40',  glow: 'shadow-orange-500/20',  label: 'BTP',                description: 'Bâtiment & Travaux Publics' },
  COMMERCE:          { icon: ShoppingCart,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    glow: 'shadow-blue-500/20',    label: 'Commerce',           description: 'Commerce & Distribution' },
  INDUSTRIE:         { icon: Factory,       color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/40',   glow: 'shadow-slate-500/20',   label: 'Industrie',          description: 'Industrie & Manufacture' },
  HYDROCARBURES:     { icon: Flame,         color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/40',     glow: 'shadow-red-500/20',     label: 'Hydrocarbures',      description: 'Pétrole & Gaz' },
  BANQUES:           { icon: Landmark,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20', label: 'Banques & Finances', description: 'Banques, Assurances & Finance' },
  TRANSPORTS:        { icon: Truck,         color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/40',  glow: 'shadow-purple-500/20',  label: 'Transports',         description: 'Transports & Logistique' },
  HOTELLERIE:        { icon: Utensils,      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/40',   glow: 'shadow-amber-500/20',   label: 'Hôtellerie',         description: 'Hôtellerie & Restauration' },
  AGRICULTURE:       { icon: Leaf,          color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/40',   glow: 'shadow-green-500/20',   label: 'Agriculture',        description: 'Agriculture & Sylviculture' },
  TELECOMMUNICATIONS:{ icon: Wifi,          color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/40',    glow: 'shadow-cyan-500/20',    label: 'Télécoms',           description: 'Télécoms & Technologies' },
  SANTE:             { icon: HeartPulse,    color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/40',    glow: 'shadow-pink-500/20',    label: 'Santé',              description: 'Santé & Pharmacie' },
  EDUCATION:         { icon: GraduationCap, color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/40',  glow: 'shadow-indigo-500/20',  label: 'Éducation',          description: 'Enseignement & Formation' },
};

// ─────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identité',   icon: Building2,  color: 'sky',     encouragement: "Commençons par les bases", emoji: "🏢" },
  { id: 2, label: 'Contact',    icon: MapPin,      color: 'emerald', encouragement: "Presque à mi-chemin !",    emoji: "📍" },
  { id: 3, label: 'Convention', icon: BookOpen,    color: 'purple',  encouragement: "Excellent progrès !",      emoji: "📋" },
  { id: 4, label: 'Fiscalité',  icon: ShieldCheck, color: 'amber',   encouragement: "Dernière étape, on y est !", emoji: "🎯" },
];

const COLOR_MAP: Record<string, {
  ring: string; bg: string; bgLight: string; text: string; border: string;
  grad: string; glow: string; gradLight: string;
}> = {
  sky:     { ring: 'focus:ring-sky-500/30',     bg: 'bg-sky-500',     bgLight: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/50',     grad: 'from-sky-500 to-cyan-400',         glow: 'shadow-sky-500/30',     gradLight: 'from-sky-500/20 to-cyan-400/10' },
  emerald: { ring: 'focus:ring-emerald-500/30', bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/50', grad: 'from-emerald-500 to-teal-400',     glow: 'shadow-emerald-500/30', gradLight: 'from-emerald-500/20 to-teal-400/10' },
  purple:  { ring: 'focus:ring-purple-500/30',  bg: 'bg-purple-500',  bgLight: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/50',  grad: 'from-purple-500 to-violet-400',    glow: 'shadow-purple-500/30',  gradLight: 'from-purple-500/20 to-violet-400/10' },
  amber:   { ring: 'focus:ring-amber-500/30',   bg: 'bg-amber-500',   bgLight: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/50',   grad: 'from-amber-500 to-orange-400',    glow: 'shadow-amber-500/30',   gradLight: 'from-amber-500/20 to-orange-400/10' },
};

// ─────────────────────────────────────────────────────────
// COMPOSANT CHAMP — dark glassmorphism
// ─────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, placeholder, required, mono,
  type = 'text', hint, colorKey = 'sky', icon: Icon,
}: {
  label: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; required?: boolean; mono?: boolean;
  type?: string; hint?: string; colorKey?: string;
  icon?: React.ElementType;
}) {
  const [focused, setFocused] = useState(false);
  const col = COLOR_MAP[colorKey];

  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 text-gray-400 uppercase tracking-wide">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      <div className={`relative rounded-xl transition-all duration-200 ${focused ? `ring-2 ${col.ring}` : ''}`}>
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Icon size={15} className={focused ? col.text : 'text-gray-600'} style={{ transition: 'color 0.2s' }} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full py-3 ${Icon ? 'pl-10 pr-4' : 'px-4'} bg-white/5 border ${
            focused ? col.border : 'border-white/10'
          } rounded-xl outline-none transition-all text-sm text-white placeholder-gray-600 ${mono ? 'font-mono' : ''}`}
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-600">{hint}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────
export default function CreateCompanyPage() {
  const router = useRouter();
  const { recheckCompany } = useCompanyReminder();
  const [step, setStep]                   = useState(1);
  const [direction, setDirection]         = useState(1);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [isSuccess, setIsSuccess]         = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [confettiActive, setConfettiActive] = useState(false);
  const [windowSize, setWindowSize]       = useState({ width: 0, height: 0 });
  const [selectedConvention, setSelectedConvention] = useState('');
  const [createdCompanyName, setCreatedCompanyName] = useState('');

  const [form, setForm] = useState({
    legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '', industry: '',
    address: '', city: '', phone: '', email: '',
    appliesCnssEmployer: true, cnssEmployerRate: 20.28,
    defaultAppliesIrpp: true, defaultAppliesCnss: true,
  });

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
      localStorage.removeItem('affiliate_ref');
      setCreatedCompanyName(form.tradeName || form.legalName);
      setIsSuccess(true);
      setConfettiActive(true);
      await recheckCompany();
      setTimeout(() => setConfettiActive(false), 6000);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = STEPS[step - 1];
  const progress = (step / 4) * 100;
  const col = COLOR_MAP[currentStep.color];

  // ── ÉCRAN SUCCÈS ────────────────────────────────────────
  if (isSuccess) {
    return (
      <>
        {confettiActive && (
          <ReactConfetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={400}
            colors={['#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4']}
          />
        )}
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
          {/* Fond */}
          <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.7, bounce: 0.35 }}
            className="max-w-md w-full text-center"
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative w-40 h-12">
                <Image src="/logos/konza_logo_h_color.png" alt="Konza" fill className="object-contain" />
              </div>
            </div>

            {/* Icône */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
              className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
              <PartyPopper size={52} className="text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-4xl font-black text-white mb-2"
            >
              Félicitations ! 🎉
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="text-gray-400 mb-2 text-sm"
            >
              Votre entreprise a été créée avec succès
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8"
            >
              {createdCompanyName}
            </motion.p>

            {/* Prochaines étapes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left"
            >
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Prochaines étapes</p>
              {[
                { icon: '👤', text: 'Créez vos premiers employés',           sub: 'Importez ou ajoutez manuellement' },
                { icon: '📋', text: 'Configurez vos conventions collectives', sub: 'Catégories & salaires minimums' },
                { icon: '💰', text: 'Générez vos premiers bulletins de paie', sub: 'En quelques clics seulement' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.1 }}
                  className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{item.text}</p>
                    <p className="text-xs text-gray-500">{item.sub}</p>
                  </div>
                  <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                    <Check size={10} className="text-emerald-400" />
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
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all text-base"
            >
              <Rocket size={20} /> Accéder au tableau de bord
            </motion.button>
          </motion.div>
        </div>
      </>
    );
  }

  // ── VARIANTS STEPS ──────────────────────────────────────
  const variants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  // ── RENDU PRINCIPAL ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white py-8 px-4 relative overflow-hidden">

      {/* ── Fond halos ── */}
      <div className={`fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none transition-all duration-700 ${
        step === 1 ? 'bg-sky-500/8' : step === 2 ? 'bg-emerald-500/8' : step === 3 ? 'bg-purple-500/8' : 'bg-amber-500/8'
      }`} />
      <div className={`fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none transition-all duration-700 ${
        step === 1 ? 'bg-cyan-500/6' : step === 2 ? 'bg-teal-500/6' : step === 3 ? 'bg-violet-500/6' : 'bg-orange-500/6'
      }`} />

      {/* Grille */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Logo watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="relative w-[420px] h-[180px] opacity-[0.03]">
          <Image src="/logos/konza_logo_h_color.png" alt="" fill className="object-contain" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-10"
        >
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-400" />
          </button>
          <div className="flex-1">
            {/* Logo */}
            <div className="relative w-28 h-8 mb-1">
              <Image src="/logos/konza_logo_h_color.png" alt="Konza" fill className="object-contain object-left" />
            </div>
            <p className="text-xs text-gray-500">Configuration de votre espace RH</p>
          </div>
        </motion.div>

        {/* ── STEPPER ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Barre de progression */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
            <motion.div
              className={`h-full bg-gradient-to-r ${col.grad}`}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          {/* Steps */}
          <div className="flex items-start justify-between">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const c = COLOR_MAP[s.color];
              const isDone    = step > s.id;
              const isCurrent = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { if (s.id < step) goTo(s.id); }}
                  disabled={s.id > step}
                  className="flex flex-col items-center gap-2 disabled:cursor-not-allowed group"
                >
                  <motion.div
                    animate={{ scale: isCurrent ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                        : isCurrent
                        ? `${c.bgLight} border ${c.border} shadow-lg ${c.glow}`
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {isDone
                      ? <Check size={18} className="text-white" />
                      : <Icon size={18} className={isCurrent ? c.text : 'text-gray-600'} />
                    }
                    {isCurrent && (
                      <motion.div
                        className={`absolute inset-0 rounded-2xl ${c.bgLight} border ${c.border}`}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.div>
                  <span className={`text-[11px] font-bold hidden sm:block transition-colors ${
                    isCurrent ? 'text-white' : isDone ? 'text-emerald-400' : 'text-gray-600'
                  }`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── BADGE ENCOURAGEMENT ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`enc-${step}`}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="mb-5"
          >
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-white/10 backdrop-blur-sm`}>
              <Sparkles size={13} className={col.text} />
              <span className="text-gray-300">{currentStep.encouragement}</span>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs">Étape {step}/4</span>
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
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >

            {/* ═══ STEP 1 : IDENTITÉ ═══ */}
            {step === 1 && (
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                  <div className="w-10 h-10 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-center">
                    <Building2 size={19} className="text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Identité de l'entreprise</h2>
                    <p className="text-xs text-gray-500">Informations légales et secteur d'activité</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Nom Légal" name="legalName" value={form.legalName} onChange={handleChange}
                      placeholder="Ex: SARL INNOVATION TECH CONGO" required colorKey="sky" icon={Building2} />
                  </div>
                  <Field label="Nom Commercial" name="tradeName" value={form.tradeName} onChange={handleChange}
                    placeholder="Ex: InnoTech" colorKey="sky" />
                  <Field label="Secteur d'Activité" name="industry" value={form.industry} onChange={handleChange}
                    placeholder="Ex: Technologie, Commerce..." colorKey="sky" />
                  <Field label="N° RCCM" name="rccmNumber" value={form.rccmNumber} onChange={handleChange}
                    placeholder="CG-BZV-01-2024-B12-00123" required colorKey="sky" mono />
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
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                  <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                    <MapPin size={19} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Localisation & Contact</h2>
                    <p className="text-xs text-gray-500">Adresse et coordonnées de votre entreprise</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Adresse Complète" name="address" value={form.address} onChange={handleChange}
                      placeholder="Ex: 123 Avenue de l'Indépendance" required colorKey="emerald" icon={MapPin} />
                  </div>
                  <Field label="Ville" name="city" value={form.city} onChange={handleChange}
                    placeholder="Brazzaville, Pointe-Noire..." required colorKey="emerald" />
                  <Field label="Téléphone" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+242 06 123 45 67" required colorKey="emerald" icon={Phone} />
                  <div className="md:col-span-2">
                    <Field label="Email de Contact" name="email" value={form.email} onChange={handleChange}
                      placeholder="contact@entreprise.cg" required type="email" colorKey="emerald" icon={Mail} />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3 : CONVENTION ═══ */}
            {step === 3 && (
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                  <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/30 rounded-xl flex items-center justify-center">
                    <BookOpen size={19} className="text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Convention Collective</h2>
                    <p className="text-xs text-gray-500">Catégories et salaires minimums <span className="italic text-gray-600">(optionnel)</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(CONVENTION_CONFIG).map(([code, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedConvention === code;
                    return (
                      <motion.button
                        key={code}
                        type="button"
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedConvention(isSelected ? '' : code)}
                        className={`relative flex flex-col items-start gap-2 p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? `border-purple-500/60 bg-purple-500/10 shadow-lg shadow-purple-500/15`
                            : `border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]`
                        }`}
                      >
                        <div className={`w-9 h-9 ${isSelected ? 'bg-purple-500/20' : config.bg} rounded-lg flex items-center justify-center transition-all`}>
                          <Icon size={17} className={isSelected ? 'text-purple-400' : config.color} />
                        </div>
                        <div className="min-w-0 w-full">
                          <p className={`font-bold text-xs ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                            {config.label}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{config.description}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"
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
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-start gap-3">
                        <Award size={15} className="text-purple-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-purple-200">
                            Convention {CONVENTION_CONFIG[selectedConvention].label} sélectionnée ✓
                          </p>
                          <p className="text-xs text-purple-400/70 mt-0.5">
                            Les catégories professionnelles et salaires minimums seront disponibles pour vos employés.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!selectedConvention && (
                  <div className="p-3 bg-white/[0.02] border border-white/8 rounded-xl">
                    <p className="text-xs text-gray-600 flex items-center gap-2">
                      <AlertCircle size={12} className="shrink-0" />
                      Sans convention, les catégories ne seront pas pré-remplies. Modifiable plus tard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 4 : FISCALITÉ ═══ */}
            {step === 4 && (
              <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 space-y-5 shadow-2xl">
                <div className="flex items-center gap-3 pb-4 border-b border-white/8">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={19} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Configuration Fiscale</h2>
                    <p className="text-xs text-gray-500">Régime fiscal et défauts pour les employés</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* CNSS PATRONALE */}
                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-white/[0.03] border border-white/10 hover:border-sky-500/30 hover:bg-sky-500/5 rounded-xl transition-all group">
                    <input
                      type="checkbox" name="appliesCnssEmployer" checked={form.appliesCnssEmployer}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-600 bg-white/10 text-sky-500 focus:ring-sky-500 mt-0.5 shrink-0 accent-sky-500"
                    />
                    <div>
                      <span className="font-bold text-white text-sm block group-hover:text-sky-400 transition-colors">
                        L'entreprise paie la CNSS patronale
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">Charges patronales calculées sur les bulletins de paie</p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {form.appliesCnssEmployer && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-9 p-4 bg-sky-500/8 border border-sky-500/25 rounded-xl">
                          <label className="block text-[11px] font-bold text-sky-400 mb-2 uppercase tracking-wide">Taux CNSS Patronale</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number" name="cnssEmployerRate" min="0" max="50" step="0.5"
                              value={form.cnssEmployerRate} onChange={handleChange}
                              className="w-24 p-2.5 bg-white/5 border border-sky-500/30 rounded-xl font-mono font-bold text-white focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/50 outline-none text-sm"
                            />
                            <span className="text-xl font-bold text-gray-500">%</span>
                            <p className="text-xs text-gray-500">Standard Congo : <strong className="text-sky-400">16%</strong></p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border-t border-white/8 pt-4">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Défauts pour les nouveaux employés</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: 'defaultAppliesIrpp', checked: form.defaultAppliesIrpp, label: 'IRPP / ITS', sub: 'Impôt sur le revenu' },
                        { name: 'defaultAppliesCnss', checked: form.defaultAppliesCnss, label: 'CNSS salariale (4%)', sub: 'Cotisation sociale employé' },
                      ].map((item) => (
                        <label
                          key={item.name}
                          className="flex items-center gap-3 cursor-pointer p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 rounded-xl transition-all group"
                        >
                          <input
                            type="checkbox" name={item.name} checked={item.checked}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-gray-600 bg-white/10 text-emerald-500 focus:ring-emerald-500 shrink-0 accent-emerald-500"
                          />
                          <div>
                            <span className="text-sm font-bold text-white block group-hover:text-emerald-400 transition-colors">{item.label}</span>
                            <p className="text-xs text-gray-500">{item.sub}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* RÉCAP */}
                  <div className="p-4 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-xl">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Check size={11} className="text-emerald-400" /> Récapitulatif
                    </p>
                    <div className="space-y-2">
                      {[
                        { label: 'Entreprise',      val: form.tradeName || form.legalName || '—' },
                        { label: 'Ville',           val: form.city || '—' },
                        { label: 'Convention',      val: selectedConvention ? (CONVENTION_CONFIG[selectedConvention]?.label || selectedConvention) : 'Aucune' },
                        { label: 'CNSS patronale',  val: form.appliesCnssEmployer ? `${form.cnssEmployerRate}%` : 'Non applicable' },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                          <span className="text-xs text-gray-500">{label}</span>
                          <span className="text-xs font-semibold text-white">{val}</span>
                        </div>
                      ))}
                    </div>
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm flex items-center gap-2"
            >
              <AlertCircle size={15} className="shrink-0" /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── NAVIGATION ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mt-6"
        >
          <button
            type="button"
            onClick={() => step > 1 ? goTo(step - 1) : router.back()}
            className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-400 font-semibold rounded-xl hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={15} /> {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          {step < 4 ? (
            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className={`px-7 py-2.5 bg-gradient-to-r ${col.grad} text-white font-bold rounded-xl shadow-lg ${col.glow} flex items-center gap-2 text-sm transition-all`}
            >
              Suivant <ArrowRight size={15} />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/25 flex items-center gap-2 disabled:opacity-50 text-sm transition-all"
            >
              {isSubmitting
                ? <><Loader2 className="animate-spin" size={16} /> Création en cours...</>
                : <><Save size={16} /> Créer l'entreprise</>
              }
            </motion.button>
          )}
        </motion.div>

      </div>
    </div>
  );
}