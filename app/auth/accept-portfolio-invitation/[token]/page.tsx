'use client';

// app/auth/accept-portfolio-invitation/[token]/page.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Building2, Hexagon,
} from 'lucide-react';
import { api } from '@/services/api';

interface InvitationInfo {
  email: string;
  inviterName: string;
  companyCount: number;
}

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <CheckCircle2 className="text-emerald-500 shrink-0" size={14} /> : <div className="w-3.5 h-3.5 rounded-full border shrink-0" style={{ borderColor: 'var(--border)' }} />}
      <span style={{ color: met ? undefined : 'var(--text-muted)' }} className={met ? 'text-emerald-500' : ''}>{text}</span>
    </div>
  );
}

export default function AcceptPortfolioInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<InvitationInfo>(`/auth/portfolio-invitation-info/${token}`)
      .then(setInfo)
      .catch((e: any) => setLoadError(e.message || 'Lien invalide ou expiré'))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
  const allMet = Object.values(criteria).every(Boolean);
  const match = password.length > 0 && password === confirmPassword;

  const handleSubmit = async () => {
    if (!firstName || !lastName) { setError('Prénom et nom sont obligatoires'); return; }
    if (!allMet) { setError('Le mot de passe ne respecte pas tous les critères'); return; }
    if (!match) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post(`/auth/accept-portfolio-invitation/${token}`, { password, firstName, lastName });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création du compte");
    } finally {
      setSaving(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-sm w-full rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <AlertCircle size={28} className="mx-auto mb-3 text-red-500" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{loadError || 'Lien invalide'}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-sm w-full rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500" />
          <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Compte créé !</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Redirection vers la connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-3">
            <Hexagon size={22} className="text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>KonzaRH</p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-5 text-center" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
              <Building2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              <strong>{info.inviterName}</strong> vous invite à co-gérer son portefeuille de{' '}
              <strong>{info.companyCount} entreprise{info.companyCount > 1 ? 's' : ''}</strong>
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{info.email}</p>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Prénom</label>
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]" style={{ color: 'var(--text)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nom</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]" style={{ color: 'var(--text)' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]"
                  style={{ color: 'var(--text)' }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              <PasswordCriteria met={criteria.length} text="8 caractères min." />
              <PasswordCriteria met={criteria.upper} text="1 majuscule" />
              <PasswordCriteria met={criteria.lower} text="1 minuscule" />
              <PasswordCriteria met={criteria.digit} text="1 chiffre" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]"
                style={{ color: 'var(--text)' }}
              />
              {confirmPassword.length > 0 && !match && (
                <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0" />{error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {saving ? 'Création…' : 'Créer mon accès'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}