// ============================================================================
// 📁 app/auth/register/page.tsx
// Inscription : 3 étapes (profil → formulaire → succès), sur la même coquille
// que la connexion (AuthShell) et les mêmes champs (FormElements).
// Logique inchangée : schémas zod, code affilié (affiliate_ref), redirections.
// ============================================================================
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft, ArrowRight, Briefcase, Building2, Check, Globe, Lock, Mail, Phone,
} from 'lucide-react';
import { api } from '@/services/api';
import { AuthShell, AuthHeading } from '@/components/auth/AuthShell';
import {
  TextField, PasswordField, PrimaryButton, ErrorBanner, InfoBanner, PasswordStrength,
} from '@/components/auth/FormElements';

const baseSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  email:     z.string().email('Email invalide'),
  password:  z.string().min(8, '8 caractères minimum'),
  confirmPassword: z.string(),
  accountType: z.enum(['COMPANY', 'CABINET']),
});

const companySchema = baseSchema.refine(
  (d) => d.password === d.confirmPassword,
  { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
);

const cabinetSchema = baseSchema.extend({
  cabinetName: z.string().min(2, 'Nom du cabinet requis'),
  subdomain: z
    .string()
    .min(3, '3 caractères minimum')
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  cabinetPhone: z.string().optional(),
}).refine(
  (d) => d.password === d.confirmPassword,
  { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] },
);

type FormData = z.infer<typeof cabinetSchema>;

interface RegisteredUser {
  id:               string;
  email:            string;
  firstName:        string;
  lastName:         string;
  role:             string;
  companyId?:       string | null;
  cabinetId?:       string | null;
  managedByCabinet?: boolean;
}

// ── Force du mot de passe : 0 à 4 (la barre commune attend ce format) ────────
const getPasswordScore = (pass: string) => {
  if (!pass) return 0;
  let score = 0;
  if (pass.length >= 8)          score += 1;
  if (/[A-Z]/.test(pass))        score += 1;
  if (/[0-9]/.test(pass))        score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;
  return score;
};

const AFFILIATE_MESSAGE = 'Vous avez été invité par un partenaire : votre compte sera lié automatiquement.';

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep]               = useState<'type' | 'form' | 'success'>('type');
  const [formStep, setFormStep]       = useState(0);
  const [accountType, setAccountType] = useState<'COMPANY' | 'CABINET' | null>(null);
  const [isLoading, setIsLoading]     = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(null);
  const [hasAffiliateRef, setHasAffiliateRef] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(accountType === 'CABINET' ? cabinetSchema : companySchema),
    mode: 'onChange',
    defaultValues: { accountType: 'COMPANY' },
  });

  const passwordValue  = form.watch('password');
  const subdomainValue = form.watch('subdomain') || '';
  const score          = getPasswordScore(passwordValue || '');
  const errors         = form.formState.errors;

  // ── Capturer ?ref= à l'arrivée ───────────────────────────────────────────
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('affiliate_ref', ref);
    setHasAffiliateRef(!!(ref ?? localStorage.getItem('affiliate_ref')));
  }, [searchParams]);

  const selectType = (type: 'COMPANY' | 'CABINET') => {
    setAccountType(type);
    form.setValue('accountType', type);
    setErrorMsg('');
    setFormStep(0);
    setStep('form');
  };

  const advanceForm = async () => {
    const fields: (keyof FormData)[] = formStep === 0
      ? ['firstName', 'lastName', 'email']
      : ['cabinetName', 'subdomain'];
    if (await form.trigger(fields)) setFormStep(value => value + 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const payload: any = {
        firstName:   data.firstName,
        lastName:    data.lastName,
        email:       data.email,
        password:    data.password,
        accountType: data.accountType,
      };
      if (data.accountType === 'CABINET') {
        payload.cabinetName  = data.cabinetName;
        payload.subdomain    = data.subdomain;
        payload.cabinetPhone = data.cabinetPhone;
      }
      // Lire le code affilié stocké
      const affiliateRef = localStorage.getItem('affiliate_ref');
      if (affiliateRef) {
        payload.affiliateCode = affiliateRef;
      }

      const res: any = await api.post('/auth/register', payload);

      // CABINET → linkCabinet est fait côté backend dans auth.service → on nettoie ici
      // COMPANY → /companies/create a encore besoin de affiliate_ref → on NE supprime PAS ici
      //           c'est /companies/create qui le lira et le supprimera lui-même
      if (data.accountType === 'CABINET') {
        localStorage.removeItem('affiliate_ref');
      }

      setRegisteredUser(res.user);
      localStorage.setItem('user', JSON.stringify(res.user));
      setStep('success');
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    const user = registeredUser ?? (() => {
      try { return JSON.parse(localStorage.getItem('user') || '{}'); }
      catch { return {}; }
    })();

    if (!user?.role) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'CABINET_ADMIN' || user.role === 'CABINET_GESTIONNAIRE') {
      if (user.cabinetId) {
        router.push(`/cabinet/${user.cabinetId}/dashboard`);
      } else {
        router.push('/auth/login');
      }
    } else {
      router.push('/companies/create');
    }
  };

  const isCabinet = accountType === 'CABINET';

  return (
    <AuthShell>
      {/* ══════════════ ÉTAPE 1 : profil ══════════════ */}
      {step === 'type' && (
        <>
          <AuthHeading
            title="Créer un compte"
            description="30 jours d’essai gratuit, sans carte bancaire."
          />

          {hasAffiliateRef && <div className="au-mb"><InfoBanner>{AFFILIATE_MESSAGE}</InfoBanner></div>}

          <div className="au-label">Quel est votre profil ?</div>
          <div className="au-choices">
            <button type="button" className="au-choice" onClick={() => selectType('COMPANY')}>
              <span className="au-tile au-tile-sm"><Building2 size={22} /></span>
              <span>
                <b>Je suis une entreprise</b>
                <small>Paie, employés, présences et congés dans un seul espace.</small>
              </span>
              <ArrowRight size={17} className="au-arrow-end" />
            </button>

            <button type="button" className="au-choice" onClick={() => selectType('CABINET')}>
              <span className="au-tile au-tile-sm"><Briefcase size={22} /></span>
              <span>
                <b>Je suis un cabinet RH</b>
                <small>La paie de toutes vos PME clientes depuis un seul tableau de bord.</small>
              </span>
              <ArrowRight size={17} className="au-arrow-end" />
            </button>
          </div>

          <div className="au-foot">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="au-link">Se connecter</Link>
          </div>
        </>
      )}

      {/* ══════════════ ÉTAPE 2 : formulaire ══════════════ */}
      {step === 'form' && (
        <>
          <div className="au-stepbar">
            <button type="button" className="au-back" onClick={() => formStep ? setFormStep(value => value - 1) : setStep('type')}>
              <ArrowLeft size={14} /> Retour
            </button>
            <span className="au-pill">Étape {formStep + 1} / {isCabinet ? 3 : 2}</span>
          </div>

          <AuthHeading
            title={formStep === 0 ? 'Faisons connaissance' : isCabinet && formStep === 1 ? 'Votre cabinet' : 'Protégez votre compte'}
            description={formStep === 0 ? 'Quelques informations pour commencer.' : isCabinet && formStep === 1 ? 'Un espace dédié à votre activité.' : 'Choisissez un mot de passe pour votre accès.'}
          />

          {hasAffiliateRef && <div className="au-mb"><InfoBanner>{AFFILIATE_MESSAGE}</InfoBanner></div>}
          {errorMsg && <div className="au-mb"><ErrorBanner>{errorMsg}</ErrorBanner></div>}

          <form className="au-stack" onSubmit={event => {
            if (formStep < (isCabinet ? 2 : 1)) {
              event.preventDefault();
              void advanceForm();
            } else {
              void form.handleSubmit(onSubmit)(event);
            }
          }} noValidate>
            {formStep === 0 && <><div className="au-row-2">
              <TextField
                {...form.register('firstName')}
                label="Prénom"
                autoComplete="given-name"
                error={errors.firstName?.message}
              />
              <TextField
                {...form.register('lastName')}
                label="Nom"
                autoComplete="family-name"
                error={errors.lastName?.message}
              />
            </div>
            <TextField
              {...form.register('email')}
              icon={Mail}
              label="Email professionnel"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
            /></>}

            {isCabinet && formStep === 1 && (
              <>
                <TextField
                  {...form.register('cabinetName')}
                  icon={Briefcase}
                  label="Nom du cabinet"
                  placeholder="ex : GL Conseil RH"
                  error={errors.cabinetName?.message}
                />
                <div>
                  <TextField
                    {...form.register('subdomain')}
                    icon={Globe}
                    label="Sous-domaine"
                    placeholder="ex : gl-conseil"
                    autoCapitalize="none"
                    error={errors.subdomain?.message}
                  />
                  {subdomainValue && !errors.subdomain && (
                    <p className="au-hint">Votre portail : <code>{subdomainValue}.konza-rh.app</code></p>
                  )}
                </div>
                <TextField
                  {...form.register('cabinetPhone')}
                  icon={Phone}
                  label="Téléphone (facultatif)"
                  type="tel"
                  autoComplete="tel"
                />
              </>
            )}

            {formStep === (isCabinet ? 2 : 1) && <><div>
              <PasswordField
                {...form.register('password')}
                icon={Lock}
                label="Mot de passe"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                error={errors.password?.message}
              />
              <PasswordStrength score={score} />
            </div>

            <PasswordField
              {...form.register('confirmPassword')}
              icon={Lock}
              label="Confirmer le mot de passe"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
            />
            </>}

            {formStep < (isCabinet ? 2 : 1) ? <PrimaryButton type="button" onClick={advanceForm}>
              Continuer <ArrowRight size={17} className="au-arrow" />
            </PrimaryButton> : <PrimaryButton type="submit" loading={isLoading}>
              {isCabinet ? 'Créer mon cabinet' : 'Créer mon compte'} <ArrowRight size={17} className="au-arrow" />
            </PrimaryButton>}

            <p className="au-note">Aucune carte bancaire · Résiliation à tout moment</p>
          </form>

          <div className="au-foot">
            Déjà un compte ?{' '}
            <Link href="/auth/login" className="au-link">Se connecter</Link>
          </div>
        </>
      )}

      {/* ══════════════ ÉTAPE 3 : succès ══════════════ */}
      {step === 'success' && (
        <>
          <div className="au-tile is-success"><Check size={26} strokeWidth={2.4} /></div>
          <AuthHeading
            title={isCabinet ? 'Cabinet créé' : 'Bienvenue sur Konza'}
            description={
              isCabinet
                ? 'Votre cabinet est prêt. Vous bénéficiez d’un mois d’accès gratuit.'
                : 'Votre compte est créé. Configurez maintenant votre entreprise pour commencer.'
            }
          />
          {isCabinet && (
            <p className="au-hint" style={{ marginTop: -12, marginBottom: 22 }}>
              Votre portail : <code>{form.getValues('subdomain')}.konza-rh.app</code>
            </p>
          )}
          <PrimaryButton type="button" onClick={handleSuccess}>
            {isCabinet ? 'Accéder à mon cabinet' : 'Créer mon entreprise'} <ArrowRight size={17} className="au-arrow" />
          </PrimaryButton>
        </>
      )}
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="au-root au-loading"><div className="au-spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
