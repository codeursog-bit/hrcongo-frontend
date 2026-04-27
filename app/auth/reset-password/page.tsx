'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, ShieldCheck, XCircle,
} from 'lucide-react';
import { api } from '@/services/api';

// ── Critère de mot de passe ────────────────────────────────────────────────
function Criteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met
        ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
        : <div className="w-3.5 h-3.5 rounded-full border border-gray-600 shrink-0" />}
      <span className={met ? 'text-emerald-400' : 'text-gray-500'}>{text}</span>
    </div>
  );
}

// ── Composant interne qui lit les searchParams ─────────────────────────────
function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  // Critères
  const has8   = password.length >= 8;
  const hasUpp = /[A-Z]/.test(password);
  const hasLow = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const allMet = has8 && hasUpp && hasLow && hasNum;

  const strength = [has8, hasUpp, hasLow, hasNum].filter(Boolean).length;
  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][strength];
  const strengthWidth = `${strength * 25}%`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) { setError('Token manquant — utilisez le lien reçu par email.'); return; }
    if (!allMet) { setError('Votre mot de passe ne remplit pas tous les critères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lien invalide ou expiré. Veuillez refaire une demande.');
    } finally {
      setIsLoading(false);
    }
  };

  // Token absent → message clair
  if (!token) {
    return (
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
        <p className="text-gray-400 text-sm mb-6">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/30 transition-colors"
        >
          Refaire une demande
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5"
        >
          <ShieldCheck size={30} className="text-emerald-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Mot de passe réinitialisé</h2>
        <p className="text-gray-400 text-sm mb-1">
          Votre mot de passe a été modifié avec succès.
        </p>
        <p className="text-gray-500 text-xs mb-6">Redirection vers la connexion dans 3 secondes…</p>
        <Link
          href="/auth/login"
          className="inline-block px-6 py-3 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          Se connecter maintenant
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Nouveau mot de passe</h1>
        <p className="text-gray-400 text-sm mt-2">
          Choisissez un mot de passe sécurisé pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Nouveau mot de passe */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Nouveau mot de passe
          </label>
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/5 transition-colors
            ${error && !password ? 'border-red-500/50' : 'border-white/10 focus-within:border-cyan-500/50'}`}>
            <Lock size={15} className="text-gray-500 shrink-0" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Au moins 8 caractères"
              autoFocus
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="text-gray-500 hover:text-gray-300 transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Barre de force */}
          {password && (
            <div className="mt-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: strengthWidth }}
                  />
                </div>
                <span className={`ml-3 text-xs font-bold ${
                  strength === 4 ? 'text-emerald-400' :
                  strength >= 2 ? 'text-yellow-400' : 'text-red-400'
                }`}>{strengthLabel}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <Criteria met={has8}   text="8 caractères minimum" />
                <Criteria met={hasUpp} text="1 majuscule" />
                <Criteria met={hasLow} text="1 minuscule" />
                <Criteria met={hasNum} text="1 chiffre" />
              </div>
            </div>
          )}
        </div>

        {/* Confirmation */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
            Confirmer le mot de passe
          </label>
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/5 transition-colors
            ${confirm && password !== confirm ? 'border-red-500/50' : 'border-white/10 focus-within:border-cyan-500/50'}`}>
            <Lock size={15} className="text-gray-500 shrink-0" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              placeholder="Répétez le mot de passe"
              className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="text-gray-500 hover:text-gray-300 transition-colors">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> Les mots de passe ne correspondent pas
            </p>
          )}
          {confirm && password === confirm && allMet && (
            <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> Les mots de passe correspondent
            </p>
          )}
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !allMet || password !== confirm}
          className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
        >
          {isLoading
            ? <><Loader2 size={16} className="animate-spin" /> Réinitialisation…</>
            : 'Réinitialiser le mot de passe'
          }
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
          Retour à la connexion
        </Link>
      </div>
    </motion.div>
  );
}

// ── Page principale avec Suspense ─────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Halos décoratifs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Logo Konza en filigrane */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="relative w-[480px] h-[240px] opacity-[0.04]">
          <Image src="/logos/konza_logo_h_color.png" alt="" fill className="object-contain" priority />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo Konza visible */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="relative w-52 h-16">
            <Image
              src="/logos/konza_logo_h_color.png"
              alt="Konza"
              fill
              className="object-contain drop-shadow-[0_0_24px_rgba(6,182,212,0.35)]"
              priority
            />
          </div>
        </motion.div>

        <Suspense fallback={
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}