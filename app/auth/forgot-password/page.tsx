'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

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

        <AnimatePresence mode="wait">
          {!sent ? (
            /* ── Formulaire ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail size={26} className="text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Mot de passe oublié ?</h1>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                  Entrez votre adresse email et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Adresse email
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white/5 transition-colors
                    ${error ? 'border-red-500/50' : 'border-white/10 focus-within:border-cyan-500/50'}`}>
                    <Mail size={16} className={error ? 'text-red-400' : 'text-gray-500'} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="votre@email.com"
                      autoFocus
                      autoComplete="email"
                      className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm outline-none"
                    />
                  </div>
                  {error && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={12} /> {error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
                >
                  {isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                  ) : (
                    'Envoyer le lien de réinitialisation'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  <ArrowLeft size={14} /> Retour à la connexion
                </Link>
              </div>
            </motion.div>

          ) : (
            /* ── Confirmation envoi ── */
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle2 size={30} className="text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-3">Vérifiez votre boîte mail</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                Si un compte est associé à{' '}
                <span className="text-white font-semibold">{email}</span>,
                vous recevrez un lien de réinitialisation.
              </p>
              <p className="text-gray-500 text-xs mb-8">
                Le lien est valable <span className="text-gray-400">30 minutes</span>. Pensez à vérifier vos spams.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors font-medium"
                >
                  Essayer avec un autre email
                </button>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-sm text-center text-white font-semibold transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}