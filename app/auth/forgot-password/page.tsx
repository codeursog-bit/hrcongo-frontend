// =============================================================================
// FICHIER : app/auth/forgot-password/page.tsx
// REFONTE : même système visuel que /auth/login et /auth/register.
// LOGIQUE : inchangée — message neutre systématique après envoi (sécurité).
// =============================================================================

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
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
      <div className="w-full max-w-[400px]">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
              <AuthHeading
                title="Mot de passe oublié ?"
                description="Entrez votre adresse email, nous vous enverrons un lien de réinitialisation."
              />
              <AuthCard>
                <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="mt-6 text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#8B8F98] transition-colors hover:text-[#FAFAFA]"
                  >
                    <ArrowLeft size={13} /> Retour à la connexion
                  </Link>
                </div>
              </AuthCard>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <AuthCard className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, delay: 0.1 }}
                  className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#10B981]/30 bg-[#10B981]/[0.12]"
                >
                  <CheckCircle2 size={26} className="text-[#10B981]" />
                </motion.div>
                <h2 className="mb-3 text-[19px] font-semibold text-[#FAFAFA]">Vérifiez votre boîte mail</h2>
                <p className="mb-1.5 text-[13.5px] leading-relaxed text-[#8B8F98]">
                  Si un compte est associé à{' '}
                  <span className="font-medium text-[#FAFAFA]">{email}</span>, vous recevrez un lien de
                  réinitialisation.
                </p>
                <p className="mb-7 text-[12.5px] text-[#5A5E66]">
                  Le lien est valable <span className="text-[#8B8F98]">30 minutes</span>. Pensez à vérifier vos
                  spams.
                </p>

                <div className="space-y-3">
                  <SecondaryButton onClick={() => { setSent(false); setEmail(''); }}>
                    Essayer avec un autre email
                  </SecondaryButton>
                  <Link
                    href="/auth/login"
                    className="block w-full rounded-xl bg-white/[0.03] px-4 py-3 text-center text-[13.5px] font-medium text-[#FAFAFA] transition-colors hover:bg-white/[0.06]"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </AuthCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthShell>
  );
}