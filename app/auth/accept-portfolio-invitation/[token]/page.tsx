'use client';

// ============================================================================
// 📁 app/auth/accept-portfolio-invitation/[token]/page.tsx
// Invitation à co-gérer un portefeuille d'entreprises.
// Logique inchangée : /auth/portfolio-invitation-info, /auth/accept-portfolio-invitation.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { PasswordField, TextField, PrimaryButton, SecondaryButton, ErrorBanner, Criteria, PasswordStrength } from '@/components/auth/FormElements';

interface InvitationInfo {
  email: string;
  inviterName: string;
  companyCount: number;
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
  const score = password ? Object.values(criteria).filter(Boolean).length : 0;
  const match = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName || !lastName) { setError('Prénom et nom sont obligatoires'); return; }
    if (!allMet) { setError('Le mot de passe ne respecte pas tous les critères'); return; }
    if (!match) { setError('Les mots de passe ne correspondent pas'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post(`/auth/accept-portfolio-invitation/${token}`, { password, firstName, lastName });
      setDone(true);
      setTimeout(() => router.push('/auth/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInfo) {
    return (
      <AuthShell variant="centered">
        <div className="au-center"><div className="au-spinner" style={{ margin: '0 auto' }} /></div>
      </AuthShell>
    );
  }

  if (loadError || !info) {
    return (
      <AuthShell variant="centered">
        <div className="au-center">
          <div className="au-tile is-danger" style={{ margin: '0 auto 22px' }}><AlertCircle size={26} /></div>
          <AuthHeading title="Lien invalide" description={loadError || 'Ce lien est invalide ou a expiré.'} />
          <SecondaryButton type="button" onClick={() => router.push('/auth/login')}>
            Retour à la connexion
          </SecondaryButton>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell variant="centered">
        <div className="au-center">
          <div className="au-tile is-success" style={{ margin: '0 auto 22px' }}><CheckCircle2 size={26} /></div>
          <AuthHeading title="Compte créé" description="Redirection vers la connexion…" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Créez votre accès"
        description={
          <>
            <strong>{info.inviterName}</strong> vous invite à co-gérer son portefeuille de{' '}
            <strong>{info.companyCount} entreprise{info.companyCount > 1 ? 's' : ''}</strong>.
          </>
        }
      />

      <div className="au-guest">
        <small>Compte invité</small>
        <span>{info.email}</span>
      </div>

      {error && <div className="au-mb"><ErrorBanner>{error}</ErrorBanner></div>}

      <form className="au-stack" onSubmit={handleSubmit} noValidate>
        <div className="au-row-2">
          <TextField label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          <TextField label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
        </div>

        <div>
          <PasswordField
            icon={Lock}
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength score={score} />
          <div className="au-crit-grid">
            <Criteria met={criteria.length} text="8 caractères minimum" />
            <Criteria met={criteria.upper} text="Une majuscule" />
            <Criteria met={criteria.lower} text="Une minuscule" />
            <Criteria met={criteria.digit} text="Un chiffre" />
          </div>
        </div>

        <PasswordField
          icon={Lock}
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          error={confirmPassword.length > 0 && !match ? 'Les mots de passe ne correspondent pas' : undefined}
        />

        <PrimaryButton type="submit" loading={saving}>
          Créer mon accès <ArrowRight size={17} className="au-arrow" />
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}