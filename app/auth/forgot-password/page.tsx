// =============================================================================
// FICHIER : app/auth/forgot-password/page.tsx
// REFONTE : même design que l'app et que /auth/login (AuthShell + tokens).
// LOGIQUE : inchangée — message neutre systématique après envoi (sécurité).
// =============================================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthCard, AuthHeading } from '@/components/auth/AuthShell';
import { TextField, PrimaryButton, SecondaryButton } from '@/components/auth/FormElements';

export default function ForgotPasswordPage() {
  const [email, setEmail]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("L'email est requis"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Format d'email invalide"); return; }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: any) {
      // Message neutre même en cas d'erreur (sécurité)
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            <AuthHeading
              title="Mot de passe oublié ?"
              description="Entrez votre adresse email, nous vous enverrons un lien de réinitialisation."
            />
            <AuthCard>
              <form onSubmit={handleSubmit} className="au-stack" noValidate>
                <TextField
                  icon={Mail}
                  type="email"
                  label="Adresse email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="vous@entreprise.cg"
                  autoFocus
                  autoComplete="email"
                  error={error}
                />

                <PrimaryButton type="submit" loading={isLoading}>
                  Envoyer le lien de réinitialisation
                </PrimaryButton>
              </form>

              <div className="au-foot">
                <Link href="/auth/login" className="au-link-muted">
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </div>
            </AuthCard>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AuthCard>
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                className="au-tile is-success"
              >
                <MailCheck size={26} />
              </motion.div>

              <h1 className="au-title au-title-sm">Vérifiez votre boîte mail</h1>
              <p className="au-desc">
                Si un compte est associé à <strong style={{ color: 'var(--text)' }}>{email}</strong>, vous recevrez un
                lien de réinitialisation.
              </p>
              <p className="au-desc" style={{ marginTop: 8, fontSize: 13 }}>
                Le lien est valable 30 minutes. Pensez à vérifier vos spams.
              </p>

              <div className="au-stack-sm" style={{ marginTop: 28 }}>
                <SecondaryButton onClick={() => { setSent(false); setEmail(''); }}>
                  Essayer avec un autre email
                </SecondaryButton>
                <Link href="/auth/login" className="au-link-muted" style={{ justifyContent: 'center', padding: '8px 0' }}>
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </div>
            </AuthCard>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}