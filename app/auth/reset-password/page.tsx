// =============================================================================
// FICHIER : app/auth/reset-password/page.tsx
// REFONTE : même système visuel que /auth/login, /auth/register et
//           /auth/forgot-password.
// LOGIQUE : inchangée — validation de token, critères de mot de passe,
//           redirection automatique vers /auth/login après succès.
// =============================================================================

'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Loader2, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthCard, AuthHeading } from '@/components/auth/AuthShell';
import { PasswordField, PrimaryButton, ErrorBanner, Criteria, PasswordStrength } from '@/components/auth/FormElements';

// ── Composant interne qui lit les searchParams ─────────────────────────────
function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  const has8   = password.length >= 8;
  const hasUpp = /[A-Z]/.test(password);
  const hasLow = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);
  const allMet = has8 && hasUpp && hasLow && hasNum;
  const score  = [has8, hasUpp, hasLow, hasNum].filter(Boolean).length;

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
      <AuthCard className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/[0.08]">
          <XCircle size={26} className="text-red-400" />
        </div>
        <h2 className="mb-2 text-[19px] font-semibold text-[#FAFAFA]">Lien invalide</h2>
        <p className="mb-6 text-[13.5px] text-[#8B8F98]">Ce lien de réinitialisation est invalide ou a expiré.</p>
        <Link
          href="/auth/forgot-password"
          className="inline-block rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.1] px-6 py-3 text-[13.5px] font-semibold text-[#10B981] transition-colors hover:bg-[#10B981]/[0.16]"
        >
          Refaire une demande
        </Link>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
        <AuthCard className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.12]"
          >
            <ShieldCheck size={26} className="text-[#10B981]" />
          </motion.div>
          <h2 className="mb-2 text-[19px] font-semibold text-[#FAFAFA]">Mot de passe réinitialisé</h2>
          <p className="mb-1 text-[13.5px] text-[#8B8F98]">Votre mot de passe a été modifié avec succès.</p>
          <p className="mb-6 text-[12.5px] text-[#5A5E66]">Redirection vers la connexion dans 3 secondes…</p>
          <Link
            href="/auth/login"
            className="inline-block rounded-xl bg-[#FAFAFA] px-6 py-3 text-[13.5px] font-medium text-black transition-colors hover:bg-white"
          >
            Se connecter maintenant
          </Link>
        </AuthCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <PasswordField
              icon={Lock}
              label="Nouveau mot de passe"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Au moins 8 caractères"
              autoFocus
            />
            <PasswordStrength score={score} />
            {password && (
              <div className="mt-3 grid grid-cols-2 gap-y-1.5">
                <Criteria met={has8}   text="8 caractères minimum" />
                <Criteria met={hasUpp} text="1 majuscule" />
                <Criteria met={hasLow} text="1 minuscule" />
                <Criteria met={hasNum} text="1 chiffre" />
              </div>
            )}
          </div>

          <div>
            <PasswordField
              icon={Lock}
              label="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(''); }}
              placeholder="Répétez le mot de passe"
              error={confirm && password !== confirm ? 'Les mots de passe ne correspondent pas' : undefined}
            />
            {confirm && password === confirm && allMet && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#10B981]">
                <CheckCircle2 size={12} /> Les mots de passe correspondent
              </p>
            )}
          </div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <PrimaryButton type="submit" loading={isLoading} disabled={!allMet || password !== confirm}>
            Réinitialiser le mot de passe
          </PrimaryButton>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-[13px] text-[#8B8F98] transition-colors hover:text-[#FAFAFA]">
            Retour à la connexion
          </Link>
        </div>
      </AuthCard>
    </motion.div>
  );
}

// ── Page principale avec Suspense ─────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-[400px]">
        <AuthHeading title="Nouveau mot de passe" description="Choisissez un mot de passe sécurisé pour votre compte." />
        <Suspense fallback={
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin text-[#10B981]" size={28} />
          </div>
        }>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </AuthShell>
  );
}