// =============================================================================
// FICHIER : app/auth/login/page.tsx
// REFONTE : même design que l'app (tokens, orange Konza, thème clair / sombre),
//           panneau de marque animé via <AuthShell>.
// LOGIQUE : inchangée — 2FA (code TOTP + codes de secours + trusted device),
//           changement de mot de passe obligatoire, redirections.
// FIX     : tempToken2fa stocké dans useRef pour éviter la perte lors des
//           re-renders déclenchés par les providers globaux (CompanyReminder…)
// =============================================================================

'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, ArrowRight, Loader2, Shield, Smartphone } from 'lucide-react';
import { api } from '@/services/api';
import { authService } from '@/lib/services/authService';
import { getRedirectUrl } from '@/lib/redirectAfterLogin';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import {
  TextField,
  PasswordField,
  PrimaryButton,
  SecondaryButton,
  ErrorBanner,
  InfoBanner,
  WarningBanner,
  Criteria,
  PasswordStrength,
  AuthModal,
} from '@/components/auth/FormElements';

// =============================================================================
// TYPES
// =============================================================================

interface LoginResponse {
  status?: 'MUST_CHANGE_PASSWORD' | 'REQUIRES_2FA';
  tempToken?: string;
  tempToken2fa?: string;
  user: {
    id: string; email: string;
    firstName: string; lastName: string;
    role: string;
    companyId?: string | null;
    cabinetId?: string | null;
    managedByCabinet?: boolean;
  };
}

interface PasswordChangeResponse {
  user: {
    id: string; email: string;
    firstName: string; lastName: string;
    role: string;
    companyId?: string | null;
    cabinetId?: string | null;
  };
}

// =============================================================================
// SCHEMAS
// =============================================================================

// ✅ Accepte soit un email valide, soit un numéro de téléphone (au moins 8 chiffres)
const loginSchema = z.object({
  email: z.string()
    .min(1, "L'email ou le téléphone est requis")
    .refine(
      (val) => /\S+@\S+\.\S+/.test(val) || /^[0-9+\s-]{8,20}$/.test(val),
      "Entrez un email valide ou un numéro de téléphone"
    ),
  password:   z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
});

const passwordChangeSchema = z.object({
  newPassword:     z.string().min(8, "Au moins 8 caractères")
    .regex(/[A-Z]/, "Au moins 1 majuscule")
    .regex(/[a-z]/, "Au moins 1 minuscule")
    .regex(/[0-9]/, "Au moins 1 chiffre"),
  confirmPassword: z.string().min(1, "Confirmez votre mot de passe"),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues      = z.infer<typeof loginSchema>;
type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

// =============================================================================
// COMPOSANT : Modal 2FA (code TOTP ou code de secours)
// =============================================================================

interface TwoFAModalProps {
  isOpen:       boolean;
  tempToken2fa: string;
  onSuccess:    (user: LoginResponse['user']) => void;
  onCancel:     () => void;
}

function TwoFAModal({ isOpen, tempToken2fa, onSuccess, onCancel }: TwoFAModalProps) {
  const [code, setCode]                 = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post<{ user: LoginResponse['user'] }>(
        '/auth/2fa/validate',
        { tempToken2fa, code },
      );
      localStorage.setItem('user', JSON.stringify(response.user));
      onSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Code invalide. Réessayez.');
      setCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Accepte chiffres ET lettres (codes de secours = A3F2B1C4)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 8);
    setCode(val);
  };

  return (
    <AuthModal open={isOpen} onClose={isSubmitting ? undefined : onCancel} labelledBy="twofa-title">
      <div className="au-modal-head">
        <div className="au-tile au-tile-sm"><Smartphone size={24} /></div>
        <div>
          <h3 id="twofa-title" className="au-modal-title">Vérification en 2 étapes</h3>
          <p className="au-modal-sub">Ouvrez votre application d&apos;authentification</p>
        </div>
      </div>

      <div className="au-stack-sm">
        <InfoBanner>
          <Smartphone size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Entrez le code à <strong>6 chiffres</strong> affiché dans Google Authenticator, Authy ou Aegis.
            Il change toutes les <strong>30 secondes</strong>.
          </span>
        </InfoBanner>

        <WarningBanner title="Téléphone perdu ?">
          <span style={{ fontSize: 13 }}>
            Entrez l&apos;un de vos <strong>8 codes de secours</strong> (format <code>A3F2B1C4</code>) dans le même champ.
          </span>
        </WarningBanner>

        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginTop: 20 }}>
          <label htmlFor="twofa-code" className="au-label">Code d&apos;authentification</label>
          <input
            id="twofa-code"
            type="text"
            autoComplete="one-time-code"
            inputMode="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            autoFocus
            className="au-input au-otp"
          />
          <p className="au-otp-hint">Code TOTP (6 chiffres) ou code de secours (8 caractères)</p>
        </div>

        <div className="au-actions">
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </SecondaryButton>
          <PrimaryButton type="submit" loading={isSubmitting} disabled={code.length < 6}>
            <Shield size={16} /> Vérifier
          </PrimaryButton>
        </div>
      </form>
    </AuthModal>
  );
}

// =============================================================================
// COMPOSANT : Modal changement mot de passe obligatoire
// =============================================================================

interface ChangePasswordModalProps {
  isOpen:    boolean;
  tempToken: string;
  userInfo:  { firstName: string; lastName: string };
  onSuccess: (user: PasswordChangeResponse['user']) => void;
  onCancel:  () => void;
}

function ChangePasswordModal({ isOpen, tempToken, userInfo, onSuccess, onCancel }: ChangePasswordModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword', '');

  const has8   = newPassword.length >= 8;
  const hasUpp = /[A-Z]/.test(newPassword);
  const hasLow = /[a-z]/.test(newPassword);
  const hasNum = /[0-9]/.test(newPassword);
  const score  = [has8, hasUpp, hasLow, hasNum].filter(Boolean).length;

  const onSubmit = async (data: PasswordChangeValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post<PasswordChangeResponse>('/auth/force-password-change', {
        tempToken,
        newPassword: data.newPassword,
      });
      localStorage.setItem('user', JSON.stringify(response.user));
      onSuccess(response.user);
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthModal open={isOpen} onClose={isSubmitting ? undefined : onCancel} labelledBy="chgpwd-title">
      <div className="au-modal-head">
        <div className="au-tile au-tile-sm"><Shield size={24} /></div>
        <div style={{ minWidth: 0 }}>
          <h3 id="chgpwd-title" className="au-modal-title">Sécurisez votre compte</h3>
          <p className="au-modal-sub">Bienvenue {userInfo.firstName} !</p>
        </div>
      </div>

      <div className="au-stack-sm">
        <WarningBanner title="Premier changement obligatoire">
          <span style={{ fontSize: 13 }}>
            Pour votre sécurité, créez un nouveau mot de passe avant d&apos;accéder à votre espace.
          </span>
        </WarningBanner>
        {error && <ErrorBanner>{error}</ErrorBanner>}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="au-stack" style={{ marginTop: 20 }}>
        <div>
          <PasswordField
            {...register('newPassword')}
            icon={Lock}
            label="Nouveau mot de passe"
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            error={errors.newPassword?.message}
          />
          <PasswordStrength score={score} />
          <div className="au-crit-grid">
            <Criteria met={has8}   text="8 caractères minimum" />
            <Criteria met={hasUpp} text="Une majuscule" />
            <Criteria met={hasLow} text="Une minuscule" />
            <Criteria met={hasNum} text="Un chiffre" />
          </div>
        </div>

        <PasswordField
          {...register('confirmPassword')}
          icon={Lock}
          label="Confirmer le mot de passe"
          placeholder="Retapez votre mot de passe"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
        />

        <div className="au-actions" style={{ marginTop: 4 }}>
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </SecondaryButton>
          <PrimaryButton type="submit" loading={isSubmitting}>
            Valider
          </PrimaryButton>
        </div>
      </form>
    </AuthModal>
  );
}

// =============================================================================
// INNER LOGIN CONTENT
// =============================================================================

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get('callbackUrl');

  const [isLoading, setIsLoading]                 = useState(false);
  const [serverError, setServerError]             = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal]           = useState(false);
  const [tempToken, setTempToken]                 = useState('');
  const [tempToken2fa, setTempToken2fa]           = useState('');
  const [userInfo, setUserInfo]                   = useState({ firstName: '', lastName: '' });

  // ✅ FIX : ref stable pour tempToken2fa — survive aux re-renders des providers
  const tempToken2faRef = useRef('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const redirectAfterLogin = (user: LoginResponse['user']) => {
    router.push(callbackUrl ?? getRedirectUrl(user as any));
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError('');
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email:    data.email,
        password: data.password,
      });

      if (response.user?.role === 'SUPER_ADMIN') {
        setServerError('Les Super Admins doivent se connecter via /admin/login');
        authService.logout();
        return;
      }

      // CAS 1 : changement de mot de passe obligatoire
      if (response.status === 'MUST_CHANGE_PASSWORD' && response.tempToken) {
        setTempToken(response.tempToken);
        setUserInfo(response.user);
        setShowPasswordModal(true);
        return;
      }

      // CAS 2 : 2FA requis
      if (response.status === 'REQUIRES_2FA' && response.tempToken2fa) {
        // ✅ FIX : stocker dans la ref ET dans le state
        tempToken2faRef.current = response.tempToken2fa;
        setTempToken2fa(response.tempToken2fa);
        setShow2FAModal(true);
        return;
      }

      // CAS 3 : login normal
      localStorage.setItem('user', JSON.stringify(response.user));
      redirectAfterLogin(response.user);

    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('incorrect') || msg.includes('invalid'))
        setServerError('Email/téléphone ou mot de passe incorrect');
      else if (msg.includes('désactivé') || msg.includes('disabled'))
        setServerError('Votre compte a été désactivé. Contactez votre administrateur.');
      else if (msg.includes('verrouillé') || msg.includes('locked'))
        setServerError(error.message);
      else if (msg.includes('réseau') || msg.includes('network'))
        setServerError('Erreur de connexion. Vérifiez votre internet.');
      else
        setServerError(error.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASuccess = (user: LoginResponse['user']) => {
    setShow2FAModal(false);
    tempToken2faRef.current = '';
    redirectAfterLogin(user);
  };

  const handlePasswordChangeSuccess = (user: PasswordChangeResponse['user']) => {
    setShowPasswordModal(false);
    redirectAfterLogin(user);
  };

  return (
    <>
      <AuthShell>
        <AuthHeading
          title="Se connecter à Konza"
          description="Connectez-vous pour accéder à votre espace Konza RH."
        />

        <div>
          {serverError && <div className="au-mb"><ErrorBanner>{serverError}</ErrorBanner></div>}

          <form className="au-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              icon={Mail}
              label="Email ou téléphone"
              type="text"
              autoComplete="username"
              placeholder="admin@konza-rh.cg ou 06 xxx xx xx"
              error={errors.email?.message}
            />

            <div>
              <PasswordField
                {...register('password')}
                icon={Lock}
                label="Mot de passe"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
              />
              <div className="au-row-end" style={{ marginTop: 10 }}>
                <Link href="/auth/forgot-password" className="au-link-muted">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <PrimaryButton type="submit" loading={isLoading}>
              Se connecter <ArrowRight size={17} className="au-arrow" />
            </PrimaryButton>
          </form>

          <div className="au-foot">
            Nouveau ici ?{' '}
            <Link href="/auth/register" className="au-link">Créer un compte</Link>
          </div>
        </div>
      </AuthShell>

      {/* Modal 2FA — ✅ FIX : tempToken2fa lu depuis la ref, jamais vide */}
      <TwoFAModal
        isOpen={show2FAModal}
        tempToken2fa={tempToken2faRef.current}
        onSuccess={handle2FASuccess}
        onCancel={() => {
          setShow2FAModal(false);
          tempToken2faRef.current = '';
          setTempToken2fa('');
        }}
      />

      {/* Modal changement mot de passe */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        tempToken={tempToken}
        userInfo={userInfo}
        onSuccess={handlePasswordChangeSuccess}
        onCancel={() => { setShowPasswordModal(false); setTempToken(''); setUserInfo({ firstName: '', lastName: '' }); }}
      />
    </>
  );
}

// =============================================================================
// PAGE EXPORT
// =============================================================================

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="au-root au-loading">
        <Loader2 className="au-spin" size={30} style={{ color: 'var(--brand)' }} aria-label="Chargement" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}