'use client';

// ============================================================================
// 📁 app/companies/create/page.tsx
// Création de l'entreprise : 4 étapes (identité, contact, convention, fiscalité)
// sur la coquille commune des pages auth (AuthShell « centered »).
// Logique inchangée : même validation, même payload POST /companies, code
// affilié, recheckCompany(), redirection vers /dashboard.
// ============================================================================

import React, { useState } from 'react';
import './create-company.css';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Check, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '@/services/api';
import { useLegalParams } from '@/hooks/useLegalParams';
import { useCompanyReminder } from '@/components/providers/CompanyReminderProvider';
import {
  ConventionPicker,
  getConventionCatalogEntry,
} from '@/components/conventions/ConventionPicker';
import { AuthShell, AuthCard, AuthHeading } from '@/components/auth/AuthShell';
import {
  TextField,
  PrimaryButton,
  SecondaryButton,
  ErrorBanner,
  InfoBanner,
} from '@/components/auth/FormElements';

const STEPS = [
  {
    id: 1,
    label: 'Identité',
    title: 'Identité de l’entreprise',
    desc: 'Informations légales et secteur d’activité.',
  },
  {
    id: 2,
    label: 'Contact',
    title: 'Localisation et contact',
    desc: 'Adresse et coordonnées de votre entreprise.',
  },
  {
    id: 3,
    label: 'Convention',
    title: 'Convention collective',
    desc: 'Catégories et salaires minimums (facultatif).',
  },
  {
    id: 4,
    label: 'Fiscalité',
    title: 'Configuration fiscale',
    desc: 'Régime fiscal et valeurs par défaut pour les employés.',
  },
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const { recheckCompany } = useCompanyReminder();
  // Taux CNSS patronal total en vigueur (pension + famille + accidents), en %, piloté par le super administrateur
  const legal = useLegalParams();
  const employerPct = +(
    (legal.cnss.employerPensionRate +
      legal.cnss.employerFamilyRate +
      legal.cnss.employerAccidentRate) *
    100
  ).toFixed(3);
  const employerPctLabel = String(employerPct).replace('.', ',');
  const employeePctLabel = String(+(legal.cnss.salarialRate * 100).toFixed(3)).replace('.', ',');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedConvention, setSelectedConvention] = useState('');
  const [createdCompanyName, setCreatedCompanyName] = useState('');

  const [form, setForm] = useState({
    legalName: '',
    tradeName: '',
    rccmNumber: '',
    cnssNumber: '',
    taxNumber: '',
    industry: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    appliesCnssEmployer: true,
    defaultAppliesIrpp: true,
    defaultAppliesCnss: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const goTo = (next: number) => {
    setErrorMsg('');
    setStep(next);
  };

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!form.legalName.trim()) return 'Le nom légal est requis.';
      if (!form.rccmNumber.trim()) return 'Le numéro RCCM est requis.';
    }
    if (step === 2) {
      if (!form.address.trim() || !form.city.trim()) return 'L’adresse et la ville sont requises.';
      if (!form.phone.trim() || !form.email.trim()) return 'Téléphone et email sont requis.';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    if (step < 4) goTo(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const affiliateCode = localStorage.getItem('affiliate_ref') || undefined;
      await api.post('/companies', {
        legalName: form.legalName,
        tradeName: form.tradeName || undefined,
        rccmNumber: form.rccmNumber,
        cnssNumber: form.cnssNumber || undefined,
        taxNumber: form.taxNumber || undefined,
        address: form.address,
        city: form.city,
        country: 'CG',
        phone: form.phone,
        email: form.email,
        industry: form.industry || 'Autre',
        collectiveAgreement: selectedConvention || undefined,
        appliesCnssEmployer: form.appliesCnssEmployer,
        cnssEmployerRate: form.appliesCnssEmployer ? employerPct : 0,
        defaultAppliesIrpp: form.defaultAppliesIrpp,
        defaultAppliesCnss: form.defaultAppliesCnss,
        affiliateCode,
      });
      localStorage.removeItem('affiliate_ref');
      setCreatedCompanyName(form.tradeName || form.legalName);
      setIsSuccess(true);
      await recheckCompany();
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const current = STEPS[step - 1];
  const conventionLabel = selectedConvention
    ? getConventionCatalogEntry(selectedConvention)?.label || selectedConvention
    : '';

  // ── Succès ──────────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <AuthShell variant="centered">
        <AuthCard className="au-center">
          <div className="au-tile is-success" style={{ margin: '0 auto 22px' }}>
            <Check size={26} strokeWidth={2.4} />
          </div>
          <AuthHeading
            title="Entreprise créée"
            description={<strong>{createdCompanyName}</strong>}
          />

          <ol className="au-next">
            {[
              {
                t: 'Ajoutez vos premiers employés',
                s: 'Importez un fichier ou saisissez-les un par un',
              },
              { t: 'Vérifiez votre convention collective', s: 'Catégories et salaires minimums' },
              { t: 'Générez vos premiers bulletins de paie', s: 'En quelques clics' },
            ].map((item, i) => (
              <li key={item.t}>
                <em>{i + 1}</em>
                <span>
                  <b>{item.t}</b>
                  <small>{item.s}</small>
                </span>
              </li>
            ))}
          </ol>

          <PrimaryButton type="button" onClick={() => router.push('/dashboard')}>
            Accéder au tableau de bord <ArrowRight size={17} className="au-arrow" />
          </PrimaryButton>
        </AuthCard>
      </AuthShell>
    );
  }

  // ── Assistant ───────────────────────────────────────────────────────────────
  return (
    <AuthShell variant="centered" maxWidth={1040}>
      <AuthCard className="au-left company-setup">
        <header className="company-intro">
          <p>Configuration initiale</p>
          <h2>Créons votre espace entreprise.</h2>
          <span>Quatre étapes pour préparer vos dossiers et votre paie.</span>
        </header>
        <ol className="company-steps" aria-label="Étapes de création">
          {STEPS.map((s) => (
            <li
              key={s.id}
              className={step > s.id ? 'is-done' : step === s.id ? 'is-current' : ''}
              aria-current={step === s.id ? 'step' : undefined}
            >
              {step > s.id ? (
                <button type="button" onClick={() => goTo(s.id)}>
                  <span>
                    <Check size={15} />
                  </span>
                  <b>{s.label}</b>
                </button>
              ) : (
                <div>
                  <span>{s.id}</span>
                  <b>{s.label}</b>
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="company-workspace">
          <section className="company-fields" aria-label={current.title}>
            <AuthHeading title={current.title} description={current.desc} />

            {errorMsg && (
              <div className="au-mb">
                <ErrorBanner>{errorMsg}</ErrorBanner>
              </div>
            )}

            {/* ═══ 1 : identité ═══ */}
            {step === 1 && (
              <div className="au-stack">
                <TextField
                  label="Nom légal *"
                  name="legalName"
                  value={form.legalName}
                  onChange={handleChange}
                  icon={Building2}
                  placeholder="Ex : SARL INNOVATION TECH CONGO"
                />
                <div className="au-row-2">
                  <TextField
                    label="Nom commercial"
                    name="tradeName"
                    value={form.tradeName}
                    onChange={handleChange}
                    placeholder="Ex : InnoTech"
                  />
                  <TextField
                    label="Secteur d’activité"
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="Ex : Commerce"
                  />
                </div>
                <div className="au-row-2">
                  <TextField
                    label="N° RCCM *"
                    name="rccmNumber"
                    value={form.rccmNumber}
                    onChange={handleChange}
                    placeholder="CG-BZV-01-2024-B12-00123"
                  />
                  <TextField
                    label="N° CNSS employeur"
                    name="cnssNumber"
                    value={form.cnssNumber}
                    onChange={handleChange}
                    placeholder="Facultatif"
                  />
                </div>
                <TextField
                  label="N° fiscal (NIU)"
                  name="taxNumber"
                  value={form.taxNumber}
                  onChange={handleChange}
                  placeholder="Facultatif"
                />
              </div>
            )}

            {/* ═══ 2 : contact ═══ */}
            {step === 2 && (
              <div className="au-stack">
                <TextField
                  label="Adresse complète *"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  icon={MapPin}
                  placeholder="Ex : 123 avenue de l’Indépendance"
                  autoComplete="street-address"
                />
                <div className="au-row-2">
                  <TextField
                    label="Ville *"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Brazzaville, Pointe-Noire…"
                  />
                  <TextField
                    label="Téléphone *"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    icon={Phone}
                    type="tel"
                    placeholder="+242 06 123 45 67"
                    autoComplete="tel"
                  />
                </div>
                <TextField
                  label="Email de contact *"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  icon={Mail}
                  type="email"
                  placeholder="contact@entreprise.cg"
                  autoComplete="email"
                />
              </div>
            )}

            {/* ═══ 3 : convention ═══ */}
            {step === 3 && (
              <div className="au-stack-sm">
                <div className="au-conv">
                  <ConventionPicker
                    selected={selectedConvention}
                    onSelect={setSelectedConvention}
                    variant="light"
                  />
                </div>
                {selectedConvention ? (
                  <InfoBanner>
                    Convention {conventionLabel} sélectionnée. Les catégories professionnelles et
                    les salaires minimums seront disponibles pour vos employés.
                  </InfoBanner>
                ) : (
                  <p className="au-hint">
                    Sans convention, les catégories ne sont pas pré-remplies. Vous pourrez en
                    choisir une plus tard dans les paramètres.
                  </p>
                )}
              </div>
            )}

            {/* ═══ 4 : fiscalité ═══ */}
            {step === 4 && (
              <div className="au-stack-sm">
                <label className="au-check">
                  <input
                    type="checkbox"
                    name="appliesCnssEmployer"
                    checked={form.appliesCnssEmployer}
                    onChange={handleChange}
                  />
                  <span>
                    <b>L’entreprise paie la CNSS patronale</b>
                    <small>
                      Charges patronales calculées sur les bulletins de paie
                      {form.appliesCnssEmployer && <> · taux de {employerPctLabel} % en vigueur</>}
                    </small>
                  </span>
                </label>

                <p className="au-subtitle">Valeurs par défaut pour les nouveaux employés</p>
                <label className="au-check">
                  <input
                    type="checkbox"
                    name="defaultAppliesIrpp"
                    checked={form.defaultAppliesIrpp}
                    onChange={handleChange}
                  />
                  <span>
                    <b>IRPP / ITS</b>
                    <small>Impôt sur le revenu</small>
                  </span>
                </label>
                <label className="au-check">
                  <input
                    type="checkbox"
                    name="defaultAppliesCnss"
                    checked={form.defaultAppliesCnss}
                    onChange={handleChange}
                  />
                  <span>
                    <b>CNSS salariale ({employeePctLabel} %)</b>
                    <small>Cotisation sociale de l’employé</small>
                  </span>
                </label>

                <p className="au-subtitle">Récapitulatif</p>
                <div className="au-recap">
                  <div>
                    <span>Entreprise</span>
                    <b>{form.tradeName || form.legalName || '—'}</b>
                  </div>
                  <div>
                    <span>Ville</span>
                    <b>{form.city || '—'}</b>
                  </div>
                  <div>
                    <span>Convention</span>
                    <b>{conventionLabel || 'Aucune'}</b>
                  </div>
                  <div>
                    <span>CNSS patronale</span>
                    <b>{form.appliesCnssEmployer ? `${employerPctLabel} %` : 'Non applicable'}</b>
                  </div>
                </div>
              </div>
            )}
          </section>
          <aside className="company-guidance">
            <p className="company-context">Votre entreprise</p>
            <h3>{form.tradeName || form.legalName || 'Un espace à votre nom'}</h3>
            <dl>
              <div>
                <dt>Identité légale</dt>
                <dd>{form.legalName || 'À renseigner'}</dd>
              </div>
              <div>
                <dt>RCCM</dt>
                <dd>{form.rccmNumber || 'À renseigner'}</dd>
              </div>
              <div>
                <dt>Ville</dt>
                <dd>{form.city || 'À renseigner'}</dd>
              </div>
            </dl>
            <div className="company-tip">
              <h4>
                {
                  [
                    'Les informations de référence',
                    'Des coordonnées faciles à retrouver',
                    'Un cadre adapté à votre activité',
                    'Vérifiez avant de créer',
                  ][step - 1]
                }
              </h4>
              <p>
                {
                  [
                    'Utilisez les informations présentes sur les documents de votre entreprise. Les champs marqués * sont obligatoires.',
                    'Ces coordonnées seront associées à votre entreprise. Vérifiez notamment l’adresse et l’email de contact.',
                    'La convention est facultative. Vous pourrez la choisir ou la modifier plus tard dans les paramètres.',
                    'Les taux affichés viennent du référentiel légal. Ces choix définissent les valeurs par défaut de votre espace.',
                  ][step - 1]
                }
              </p>
            </div>
          </aside>
        </div>
        <div className="au-actions">
          <SecondaryButton
            type="button"
            onClick={() => (step > 1 ? goTo(step - 1) : router.back())}
          >
            <ArrowLeft size={16} /> {step === 1 ? 'Annuler' : 'Précédent'}
          </SecondaryButton>

          {step < 4 ? (
            <PrimaryButton type="button" onClick={handleNext}>
              Suivant <ArrowRight size={17} className="au-arrow" />
            </PrimaryButton>
          ) : (
            <PrimaryButton type="button" onClick={handleSubmit} loading={isSubmitting}>
              Créer l’entreprise <ArrowRight size={17} className="au-arrow" />
            </PrimaryButton>
          )}
        </div>
      </AuthCard>
    </AuthShell>
  );
}
