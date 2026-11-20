// =============================================================================
// FICHIER : app/auth/reset-password/page.tsx
// REFONTE : même design que l'app et que /auth/login (AuthShell + tokens).
// LOGIQUE : inchangée — validation de token, critères de mot de passe,
//           redirection automatique vers /auth/login après succès.
// =============================================================================

'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Loader2, ShieldCheck, XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthCard, AuthHeading } from '@/components/auth/AuthShell';
import { PasswordField, PrimaryButton, ErrorBanner, Criteria, PasswordStrength } from '@/components/auth/FormElements';

// ── Composant interne qui lit les searchParams ─────────────────────────────
function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

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
      <AuthCard>
        <div className="au-tile is-danger"><XCircle size={26} /></div>
        <h1 className="au-title au-title-sm">Lien invalide</h1>
        <p className="au-desc">Ce lien de réinitialisation est invalide ou a expiré.</p>
        <div style={{ marginTop: 28 }}>
          <Link href="/auth/forgot-password" className="au-btn au-btn-primary">
            Refaire une demande <ArrowRight size={17} className="au-arrow" />
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (success) {
    return (
      <AuthCard>
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
          className="au-tile is-success"
        >
          <ShieldCheck size={26} />
        </motion.div>
        <h1 className="au-title au-title-sm">Mot de passe réinitialisé</h1>
        <p className="au-desc">Votre mot de passe a été modifié avec succès.</p>
        <p className="au-desc" style={{ marginTop: 6, fontSize: 13 }}>Redirection vers la connexion dans 3 secondes…</p>
        <div style={{ marginTop: 28 }}>
          <Link href="/auth/login" className="au-btn au-btn-primary">
            Se connecter maintenant <ArrowRight size={17} className="au-arrow" />
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="au-stack" noValidate>
        <div>
          <PasswordField
            icon={Lock}
            label="Nouveau mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Au moins 8 caractères"
            autoComplete="new-password"
            autoFocus
          />
          <PasswordStrength score={score} />
          {password && (
            <div className="au-crit-grid">
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
            autoComplete="new-password"
            error={confirm && password !== confirm ? 'Les mots de passe ne correspondent pas' : undefined}
          />
          {confirm && password === confirm && allMet && (
            <p className="au-ok"><CheckCircle2 size={13} /> Les mots de passe correspondent</p>
          )}
        </div>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <PrimaryButton type="submit" loading={isLoading} disabled={!allMet || password !== confirm}>
          Réinitialiser le mot de passe
        </PrimaryButton>
      </form>

      <div className="au-foot">
        <Link href="/auth/login" className="au-link-muted">Retour à la connexion</Link>
      </div>
    </AuthCard>
  );
}

// ── Page principale avec Suspense ─────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <AuthHeading title="Nouveau mot de passe" description="Choisissez un mot de passe sécurisé pour votre compte." />
      <Suspense fallback={
        <div className="au-loading" style={{ height: 160 }}>
          <Loader2 className="au-spin" size={28} style={{ color: 'var(--brand)' }} aria-label="Chargement" />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </AuthShell>
  );
}