'use client';

// app/auth/accept-invitation/[token]/page.tsx
// Logo cabinet (si disponible) à la place de Konza — même style que login

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ArrowRight, Building2, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvitationInfo {
  email:         string;
  cabinetName:   string | null;
  cabinetLogo:   string | null;
  cabinetColor:  string | null;
  cabinetColor2: string | null;
  companyName:   string | null;
}

interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  user: {
    id:               string;
    email:            string;
    firstName:        string;
    lastName:         string;
    role:             string;
    companyId:        string | null;
    cabinetId:        string | null;
    managedByCabinet: boolean;
  };
}

// ─── Critère mot de passe ─────────────────────────────────────────────────────

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="text-green-400 shrink-0" size={14} />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />
      )}
      <span className={met ? 'text-green-400' : 'text-gray-500'}>{text}</span>
    </div>
  );
}

// ─── Force mot de passe ───────────────────────────────────────────────────────

function getStrength(pwd: string) {
  if (!pwd) return { strength: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 8)   s += 25;
  if (/[A-Z]/.test(pwd)) s += 25;
  if (/[a-z]/.test(pwd)) s += 25;
  if (/[0-9]/.test(pwd)) s += 25;
  if (s <= 25)  return { strength: s,   label: 'Faible',    color: 'bg-red-500'    };
  if (s <= 50)  return { strength: s,   label: 'Moyen',     color: 'bg-orange-500' };
  if (s <= 75)  return { strength: s,   label: 'Bon',       color: 'bg-yellow-500' };
  return               { strength: 100, label: 'Excellent', color: 'bg-green-500'  };
}

// ─── Composant Logo (cabinet ou Konza) ───────────────────────────────────────

interface BrandLogoProps {
  info:         InvitationInfo | null;
  brandColor:   string;
  brandColor2:  string;
  hasCabinet:   boolean;
  size?:        'sm' | 'lg';
}

function BrandLogo({ info, brandColor, brandColor2, hasCabinet, size = 'lg' }: BrandLogoProps) {
  if (info?.cabinetLogo) {
    return (
      <div
        className={size === 'lg' ? 'p-6 rounded-3xl shadow-2xl' : 'p-3 rounded-2xl'}
        style={{ background: `${brandColor}18`, border: `1px solid ${brandColor}30` }}
      >
        <img
          src={info.cabinetLogo}
          alt={info.cabinetName ?? 'Cabinet'}
          className={size === 'lg' ? 'h-20 w-auto object-contain' : 'h-10 w-auto object-contain'}
        />
      </div>
    );
  }

  if (hasCabinet) {
    return (
      <div
        className={`${size === 'lg' ? 'w-24 h-24 rounded-3xl' : 'w-14 h-14 rounded-2xl'} flex items-center justify-center`}
        style={{
          background: `linear-gradient(135deg, ${brandColor}, ${brandColor2})`,
          boxShadow:  `0 0 40px ${brandColor}40`,
        }}
      >
        <Building2 size={size === 'lg' ? 48 : 26} className="text-white" />
      </div>
    );
  }

  // Fallback : logo Konza
  return (
    <div className={`relative ${size === 'lg' ? 'w-72 h-24' : 'w-44 h-14'}`}>
      <Image
        src="/logos/konza_logo_h_color.png"
        alt="Konza"
        fill
        className={`object-contain ${size === 'lg'
          ? 'drop-shadow-[0_0_32px_rgba(6,182,212,0.35)]'
          : 'drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]'}`}
        priority
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Step = 'loading' | 'form' | 'success' | 'error';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token  = params.token as string;

  const [step,    setStep]    = useState<Step>('loading');
  const [info,    setInfo]    = useState<InvitationInfo | null>(null);
  const [loadErr, setLoadErr] = useState('');

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [showCfm,    setShowCfm]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');

  // ── Chargement info invitation ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<InvitationInfo>(`/auth/invitation-info/${token}`);
        setInfo(res);
        setStep('form');
      } catch (e: any) {
        setLoadErr(e.message || "Ce lien d'invitation est invalide ou a expiré.");
        setStep('error');
      }
    };
    load();
  }, [token]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const strength      = getStrength(password);
  const passwordMatch = confirm.length > 0 && password === confirm;
  const passwordOk    =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
  const formOk =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    passwordOk &&
    passwordMatch;

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formOk) return;

    setSubmitting(true);
    setSubmitErr('');

    try {
      // 1. Créer le compte via accept-invitation
      await api.post(`/auth/accept-invitation/${token}`, {
        password,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
      });

      // 2. Auto-login avec les credentials
      const loginRes = await api.post<LoginResponse>('/auth/login', {
        email:    info!.email,
        password,
      });

      // Tokens en cookie HttpOnly — rien à stocker
      localStorage.setItem('user', JSON.stringify(loginRes.user));

      setStep('success');

      // 3. Redirection
      setTimeout(() => {
        const { companyId, managedByCabinet, role } = loginRes.user;
        if (managedByCabinet && companyId) {
          router.push(
            role === 'EMPLOYEE'
              ? `/pme/${companyId}/conges/mon-espace`
              : `/pme/${companyId}/dashboard`,
          );
        } else {
          router.push('/dashboard');
        }
      }, 1500);

    } catch (e: any) {
      setSubmitErr(e.message || 'Une erreur est survenue. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  // ── Couleur branding ────────────────────────────────────────────────────────
  const brandColor  = info?.cabinetColor  || '#06b6d4';
  const brandColor2 = info?.cabinetColor2 || '#3b82f6';
  const hasCabinet  = !!(info?.cabinetName || info?.cabinetLogo);

  // ══════════════════════════════════════════════════════════════════════════
  // Loading
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'loading') {
    return (
      <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white items-center justify-center">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-44 h-14 mb-2">
            <Image
              src="/logos/konza_logo_h_color.png"
              alt="Konza"
              fill
              className="object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              priority
            />
          </div>
          <Loader2 size={22} className="animate-spin text-cyan-400" />
          <p className="text-sm text-gray-400">Vérification de votre invitation...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Erreur
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'error') {
    return (
      <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="relative w-44 h-14">
                <Image src="/logos/konza_logo_h_color.png" alt="Konza" fill className="object-contain opacity-60" priority />
              </div>
            </div>
            <div className="w-20 h-20 bg-red-500/15 border border-red-500/25 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={36} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Lien invalide</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">{loadErr}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all"
            >
              ← Retour à la connexion
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Succès
  // ══════════════════════════════════════════════════════════════════════════
  if (step === 'success') {
    return (
      <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white">
        <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-600/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-24 h-24 bg-green-500/15 border border-green-500/25 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={44} className="text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Compte créé !</h1>
            <p className="text-gray-400 text-sm mb-1">
              Bienvenue, <span className="text-white font-semibold">{firstName}</span>
            </p>
            {info?.companyName && (
              <p className="text-gray-500 text-xs mb-6">Espace RH — {info.companyName}</p>
            )}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Redirection en cours...
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Formulaire
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full bg-[#020617] text-white font-sans overflow-x-hidden">

      {/* Background FX */}
      <div className="fixed top-0 right-0 w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] rounded-full blur-[80px] lg:blur-[120px] animate-pulse pointer-events-none"
           style={{ background: `${brandColor}18` }} />
      <div className="fixed bottom-0 left-0 w-[300px] sm:w-[500px] lg:w-[800px] h-[300px] sm:h-[500px] lg:h-[800px] rounded-full blur-[80px] lg:blur-[120px] pointer-events-none"
           style={{ background: `${brandColor2}12` }} />

      {/* Filigrane Konza si pas de cabinet */}
      {!hasCabinet && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none">
          <div className="relative w-[480px] h-[240px] opacity-[0.04]">
            <Image src="/logos/konza_logo_h_color.png" alt="" fill className="object-contain" priority />
          </div>
        </div>
      )}

      {/* ── GAUCHE — Branding cabinet ou Konza ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 z-10">
        <div className="relative z-10 text-center max-w-lg">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10 flex justify-center"
          >
            <BrandLogo
              info={info}
              brandColor={brandColor}
              brandColor2={brandColor2}
              hasCabinet={hasCabinet}
              size="lg"
            />
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight"
          >
            {info?.cabinetName ?? 'Konza RH'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400 leading-relaxed"
          >
            {info?.companyName
              ? `Accédez à l'espace RH de\u00a0${info.companyName}`
              : 'Complétez votre inscription pour accéder à la plateforme'}
          </motion.p>

          {/* Badge entreprise */}
          {info?.companyName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-medium"
              style={{
                borderColor: `${brandColor}40`,
                background:  `${brandColor}15`,
                color:        brandColor,
              }}
            >
              <Building2 size={15} />
              {info.companyName}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── DROITE — Formulaire ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 py-6 sm:py-8 md:py-12 relative z-10 min-h-screen min-h-[100dvh]">
        <div className="w-full max-w-md mx-auto">

          {/* Logo mobile */}
          <div className="lg:hidden mb-6 flex justify-center">
            <BrandLogo
              info={info}
              brandColor={brandColor}
              brandColor2={brandColor2}
              hasCabinet={hasCabinet}
              size="sm"
            />
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Créez votre accès
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-400">
              {info?.companyName
                ? `Espace RH — ${info.companyName}`
                : 'Finalisez votre inscription'}
            </p>

            {/* Badge email invité */}
            {info?.email && (
              <div className="mt-4 flex items-center gap-2.5 p-3 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${brandColor}20`, border: `1px solid ${brandColor}30` }}>
                  <User size={13} style={{ color: brandColor }} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Compte invité</p>
                  <p className="text-sm text-white font-medium">{info.email}</p>
                </div>
              </div>
            )}

            {/* Erreur */}
            <AnimatePresence>
              {submitErr && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 sm:gap-3"
                >
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs sm:text-sm text-red-300 font-medium">{submitErr}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulaire */}
            <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>

              {/* Prénom / Nom */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Prénom *</label>
                  <div className="relative group">
                    <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Jean"
                      required
                      className="block w-full pl-10 sm:pl-12 pr-3 py-2.5 sm:py-3.5 text-sm bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Nom *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Dupont"
                    required
                    className="block w-full px-3 py-2.5 sm:py-3.5 text-sm bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Mot de passe *</label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    required
                    className="block w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border border-white/10 focus:border-cyan-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-white transition-colors">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Barre force */}
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Force</span>
                      <span className={`font-bold ${strength.strength === 100 ? 'text-green-400' : 'text-gray-400'}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${strength.strength}%` }}
                        className={`h-full ${strength.color} transition-all duration-300`}
                      />
                    </div>
                  </div>
                )}

                {/* Critères */}
                <div className="mt-3 space-y-1">
                  <PasswordCriteria met={password.length >= 8}    text="Au moins 8 caractères" />
                  <PasswordCriteria met={/[A-Z]/.test(password)}  text="Une majuscule"          />
                  <PasswordCriteria met={/[a-z]/.test(password)}  text="Une minuscule"          />
                  <PasswordCriteria met={/[0-9]/.test(password)}  text="Un chiffre"             />
                </div>
              </div>

              {/* Confirmation */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5">Confirmer le mot de passe *</label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none" />
                  <input
                    type={showCfm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Retapez votre mot de passe"
                    required
                    className={`block w-full pl-10 sm:pl-12 pr-11 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                      confirm.length > 0 && !passwordMatch
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                        : confirm.length > 0 && passwordMatch
                        ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20'
                        : 'border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/50'
                    }`}
                  />
                  <button type="button" onClick={() => setShowCfm(v => !v)}
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-500 hover:text-white transition-colors">
                    {showCfm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm.length > 0 && !passwordMatch && (
                  <p className="mt-1 text-xs text-red-400">Les mots de passe ne correspondent pas</p>
                )}
                {confirm.length > 0 && passwordMatch && (
                  <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Les mots de passe correspondent
                  </p>
                )}
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting || !formOk}
                className="w-full flex justify-center items-center gap-2 py-3 sm:py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                style={{
                  background: `linear-gradient(to right, ${brandColor}, ${brandColor2})`,
                  boxShadow:  `0 0 20px ${brandColor}40`,
                }}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Créer mon accès <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Lien connexion */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="font-bold transition-colors hover:text-white"
                  style={{ color: brandColor }}
                >
                  Se connecter
                </button>
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}