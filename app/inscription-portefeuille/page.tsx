'use client';

// ============================================================================
// 📁 app/inscription-portefeuille/page.tsx
// Page publique, autonome : pensée pour être partagée en lien direct.
// Page du PORTAIL : panneau de gauche avec le logo Konza.
// Logique inchangée : POST /auth/register-portfolio → /portefeuille/dashboard.
// ============================================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BarChart3, Building2, CheckCircle2, Layers, Lock, Mail, Users } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import {
  TextField, PasswordField, PrimaryButton, ErrorBanner, Criteria, PasswordStrength,
} from '@/components/auth/FormElements';

const VALUE_PROPS = [
  { icon: Building2, text: 'Ajoutez et gérez toutes vos entreprises depuis un seul compte' },
  { icon: Users, text: 'Employés, paie, congés et présences centralisés' },
  { icon: BarChart3, text: 'Rapports comparatifs entre vos entreprises' },
];

function Panel() {
  return (
    <div className="au-invite">
      <div className="au-invite-mark is-konza">
        <img src="/logos/konza_logo_h_white.png" alt="Konza RH" />
      </div>
      <h2 className="au-invite-title">Un compte pour gérer toutes vos entreprises</h2>
      <p className="au-invite-sub">
        Créez votre espace « portefeuille » et ajoutez vos entreprises quand vous voulez, sans rien préparer avant de commencer.
      </p>
      <ul style={{ listStyle: 'none', margin: '28px 0 0', padding: 0, display: 'grid', gap: 14 }}>
        {VALUE_PROPS.map(({ icon: Icon, text }) => (
          <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14.5, color: 'rgba(242,242,242,.78)' }}>
            <Icon size={17} style={{ color: '#FF9A62', flexShrink: 0 }} /> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InscriptionPortefeuillePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
  };
  const allMet = Object.values(criteria).every(Boolean);
  const score = password ? Object.values(criteria).filter(Boolean).length : 0;

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
      setError(err.message || 'Erreur lors de la création du compte');
      setSaving(false);
    }
  };

  return (
    <AuthShell panel={<Panel />}>
      <AuthHeading
        title="Créer mon portefeuille"
        description="Gratuit pour commencer. Ajoutez votre première entreprise après l’inscription."
      />

      {error && <div className="au-mb"><ErrorBanner>{error}</ErrorBanner></div>}

      <form className="au-stack" onSubmit={handleSubmit} noValidate>
        <div className="au-row-2">
          <TextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          <TextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
        </div>
        <TextField icon={Mail} label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <div>
          <PasswordField icon={Lock} label="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <PasswordStrength score={score} />
          <div className="au-crit-grid">
            <Criteria met={criteria.length} text="8 caractères minimum" />
            <Criteria met={criteria.upper} text="Une majuscule" />
            <Criteria met={criteria.lower} text="Une minuscule" />
            <Criteria met={criteria.digit} text="Un chiffre" />
          </div>
        </div>

        <PrimaryButton type="submit" loading={saving}>
          Créer mon compte <ArrowRight size={17} className="au-arrow" />
        </PrimaryButton>
      </form>

      <div className="au-foot">
        Déjà un compte ? <a href="/auth/login" className="au-link">Se connecter</a>
      </div>
    </AuthShell>
  );
}