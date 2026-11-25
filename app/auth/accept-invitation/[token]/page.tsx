'use client';

// ============================================================================
// 📁 app/auth/accept-invitation/[token]/page.tsx
// Acceptation d'une invitation (employé, RH, gestionnaire…).
// Marque blanche conservée : si l'invitation vient d'un cabinet, le panneau de
// gauche affiche son logo / son nom / ses couleurs à la place de Konza.
// Logique inchangée : /auth/invitation-info, /auth/accept-invitation, auto-login.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle2, AlertCircle, ArrowRight, Loader2, Lock } from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import { PasswordField, TextField, PrimaryButton, SecondaryButton, ErrorBanner, Criteria, PasswordStrength } from '@/components/auth/FormElements';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvitationInfo {
  email:         string;
  cabinetName:   string | null;
  cabinetLogo:   string | null;
  cabinetColor:  string | null;
  cabinetColor2: string | null;
  companyName:   string | null;
}

interface LoginResponse {
  access_token:  string;
  refresh_token: string;
  user: {
    id:               string;
    email:            string;
    firstName:        string;
    lastName:         string;
    role:             string;
    companyId:        string | null;
    cabinetId:        string | null;
    managedByCabinet: boolean;
  };
}

// ─── Panneau de gauche : cabinet ou Konza ────────────────────────────────────

function InvitePanel({ info, brandColor, brandColor2, hasCabinet }: {
  info: InvitationInfo | null; brandColor: string; brandColor2: string; hasCabinet: boolean;
}) {
  return (
    <div className="au-invite">
      {info?.cabinetLogo ? (
        <div className="au-invite-mark is-logo">
          <img src={info.cabinetLogo} alt={info.cabinetName ?? 'Cabinet'} />
        </div>
      ) : hasCabinet ? (
        <div className="au-invite-mark is-icon" style={{ background: brandColor }}>
          <Building2 size={34} />
        </div>
      ) : (
        <div className="au-invite-mark is-konza">
          <img src="/logos/konza_logo_h_color.png" alt="Konza RH" />
        </div>
      )}

      <h2 className="au-invite-title">{info?.cabinetName ?? 'Konza RH'}</h2>
      <p className="au-invite-sub">
        {info?.companyName
          ? `Accédez à l’espace RH de\u00a0${info.companyName}.`
          : 'Complétez votre inscription pour accéder à la plateforme.'}
      </p>

      {info?.companyName && (
        <div
          className="au-invite-badge"
          style={{ borderColor: `${brandColor}55`, background: `${brandColor}1f`, color: 'var(--text)' }}
        >
          <Building2 size={15} />
          {info.companyName}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Step = 'loading' | 'form' | 'success' | 'error';

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token  = params.token as string;

  const [step,    setStep]    = useState<Step>('loading');
  const [info,    setInfo]    = useState<InvitationInfo | null>(null);
  const [loadErr, setLoadErr] = useState('');

  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');

  // ── Chargement info invitation ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<InvitationInfo>(`/auth/invitation-info/${token}`);
        setInfo(res);
        setStep('form');
      } catch (e: any) {
        setLoadErr(e.message || "Ce lien d'invitation est invalide ou a expiré.");
        setStep('error');
      }
    };
    load();
  }, [token]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const crit = {
    length: password.length >= 8,
    upper:  /[A-Z]/.test(password),
    lower:  /[a-z]/.test(password),
    digit:  /[0-9]/.test(password),
  };
  const score         = password ? Object.values(crit).filter(Boolean).length : 0;
  const passwordMatch = confirm.length > 0 && password === confirm;
  const passwordOk    = Object.values(crit).every(Boolean);
  const formOk =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    passwordOk &&
    passwordMatch;

  // ── Soumission ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formOk) return;

    setSubmitting(true);
    setSubmitErr('');

    try {
      // 1. Créer le compte via accept-invitation
      await api.post(`/auth/accept-invitation/${token}`, {
        password,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
      });

      // 2. Auto-login avec les credentials
      const loginRes = await api.post<LoginResponse>('/auth/login', {
        email:    info!.email,
        password,
      });

      // Tokens en cookie HttpOnly — rien à stocker
      localStorage.setItem('user', JSON.stringify(loginRes.user));

      setStep('success');

      // 3. Redirection
      setTimeout(() => {
        const { companyId, managedByCabinet, role } = loginRes.user;
        if (managedByCabinet && companyId) {
          router.push(
            role === 'EMPLOYEE'
              ? `/pme/${companyId}/conges/mon-espace`
              : `/pme/${companyId}/dashboard`,
          );
        } else {
          router.push('/dashboard');
        }
      }, 1500);

    } catch (e: any) {
      setSubmitErr(e.message || 'Une erreur est survenue. Veuillez réessayer.');
      setSubmitting(false);
    }
  };

  const brandColor  = info?.cabinetColor  || '#F7874B';
  const brandColor2 = info?.cabinetColor2 || '#E8B23A';
  const hasCabinet  = !!(info?.cabinetName || info?.cabinetLogo);

  // ── Chargement ──────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <AuthShell variant="centered">
        <div className="au-center">
          <div className="au-spinner" style={{ margin: '0 auto 16px' }} />
          <p className="au-desc" style={{ margin: 0 }}>Vérification de votre invitation…</p>
        </div>
      </AuthShell>
    );
  }

  // ── Lien invalide ───────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <AuthShell variant="centered">
        <div className="au-center">
          <div className="au-tile is-danger" style={{ margin: '0 auto 22px' }}><AlertCircle size={26} /></div>
          <AuthHeading title="Lien invalide" description={loadErr} />
          <SecondaryButton type="button" onClick={() => router.push('/auth/login')}>
            Retour à la connexion
          </SecondaryButton>
        </div>
      </AuthShell>
    );
  }

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <AuthShell variant="centered">
        <div className="au-center">
          <div className="au-tile is-success" style={{ margin: '0 auto 22px' }}><CheckCircle2 size={26} /></div>
          <AuthHeading
            title="Compte créé"
            description={
              <>
                Bienvenue, <strong>{firstName}</strong>.
                {info?.companyName && <><br />Espace RH — {info.companyName}</>}
              </>
            }
          />
          <p className="au-note" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Loader2 size={14} className="au-spin" /> Redirection en cours…
          </p>
        </div>
      </AuthShell>
    );
  }

  // ── Formulaire ──────────────────────────────────────────────────────────────
  return (
    <AuthShell
      panel={<InvitePanel info={info} brandColor={brandColor} brandColor2={brandColor2} hasCabinet={hasCabinet} />}
    >
      <AuthHeading
        title="Créez votre accès"
        description={info?.companyName ? `Espace RH — ${info.companyName}` : 'Finalisez votre inscription.'}
      />

      {info?.email && (
        <div className="au-guest">
          <small>Compte invité</small>
          <span>{info.email}</span>
        </div>
      )}

      {submitErr && <div className="au-mb"><ErrorBanner>{submitErr}</ErrorBanner></div>}

      <form className="au-stack" onSubmit={handleSubmit} noValidate>
        <div className="au-row-2">
          <TextField
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jean"
            autoComplete="given-name"
            required
          />
          <TextField
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Dupont"
            autoComplete="family-name"
            required
          />
        </div>

        <div>
          <PasswordField
            icon={Lock}
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            required
          />
          <PasswordStrength score={score} />
          <div className="au-crit-grid">
            <Criteria met={crit.length} text="8 caractères minimum" />
            <Criteria met={crit.upper}  text="Une majuscule" />
            <Criteria met={crit.lower}  text="Une minuscule" />
            <Criteria met={crit.digit}  text="Un chiffre" />
          </div>
        </div>

        <div>
          <PasswordField
            icon={Lock}
            label="Confirmer le mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Retapez votre mot de passe"
            autoComplete="new-password"
            required
            error={confirm.length > 0 && !passwordMatch ? 'Les mots de passe ne correspondent pas' : undefined}
          />
          {passwordMatch && (
            <p className="au-ok"><CheckCircle2 size={13} /> Les mots de passe correspondent</p>
          )}
        </div>

        <PrimaryButton type="submit" loading={submitting} disabled={!formOk}>
          Créer mon accès <ArrowRight size={17} className="au-arrow" />
        </PrimaryButton>
      </form>

      <div className="au-foot">
        Vous avez déjà un compte ?{' '}
        <button type="button" className="au-link" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }} onClick={() => router.push('/auth/login')}>
          Se connecter
        </button>
      </div>
    </AuthShell>
  );
}