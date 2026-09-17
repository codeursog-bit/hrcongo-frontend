'use client';

// app/inscription-portefeuille/page.tsx
// Page publique, autonome — pensée pour être partagée en lien direct,
// sans passer par une invitation manuelle.

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Hexagon, Layers, Building2, Users, BarChart3, ArrowRight, Loader2,
  Lock, Mail, User as UserIcon, Eye, EyeOff, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { api } from '@/services/api';

function PasswordCriteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <CheckCircle2 className="text-emerald-500 shrink-0" size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700 shrink-0" />}
      <span className={met ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-600'}>{text}</span>
    </div>
  );
}

const VALUE_PROPS = [
  { icon: Building2, text: 'Ajoutez et gérez toutes vos entreprises depuis un seul compte' },
  { icon: Users, text: 'Employés, paie, congés et présences centralisés' },
  { icon: BarChart3, text: 'Rapports comparatifs entre vos entreprises' },
];

export default function InscriptionPortefeuillePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
  const allMet = Object.values(criteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) { setError('Tous les champs sont obligatoires'); return; }
    if (!allMet) { setError('Le mot de passe ne respecte pas tous les critères'); return; }
    setSaving(true);
    setError('');
    try {
      const res: any = await api.post('/auth/register-portfolio', { email, password, firstName, lastName });
      if (res?.user) localStorage.setItem('user', JSON.stringify(res.user));
      router.push('/portefeuille/dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* ── Panneau de gauche — présentation ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Hexagon size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">KonzaRH</span>
        </div>

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
            <Layers size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-4">
            Un compte pour gérer<br />toutes vos entreprises
          </h1>
          <p className="text-emerald-50/80 text-sm leading-relaxed mb-8 max-w-sm">
            Créez votre espace "portefeuille" et ajoutez vos entreprises quand vous voulez —
            aucune limite dans ce qu'il faut faire avant de commencer.
          </p>
          <div className="space-y-4">
            {VALUE_PROPS.map((v, i) => {
              const Icon = v.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-white" />
                  </div>
                  <p className="text-sm text-emerald-50/90">{v.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-xs text-emerald-100/50">© {new Date().getFullYear()} KonzaRH</p>
      </div>

      {/* ── Panneau de droite — formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Hexagon size={18} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>KonzaRH</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Créer mon portefeuille</h2>
          <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
            Gratuit pour commencer — ajoutez votre première entreprise après inscription.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Prénom</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" style={{ color: 'var(--text)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Nom</label>
                <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" style={{ color: 'var(--text)' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" style={{ color: 'var(--text)' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  style={{ color: 'var(--text)' }}
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                <PasswordCriteria met={criteria.length} text="8 caractères min." />
                <PasswordCriteria met={criteria.upper} text="1 majuscule" />
                <PasswordCriteria met={criteria.lower} text="1 minuscule" />
                <PasswordCriteria met={criteria.digit} text="1 chiffre" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {saving ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
            Déjà un compte ? <a href="/auth/login" className="font-bold text-emerald-600 dark:text-emerald-400">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  );
}