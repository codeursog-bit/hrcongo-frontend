'use client';
import { RecruitmentFormOutline } from '@/components/recruitment/RecruitmentFrame';
import { RecruitmentNav } from '@/components/recruitment/recruitment-ui';
import '@/components/recruitment/recruitment.css';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Send, ArrowLeft, Copy, Check, Upload, X
} from 'lucide-react';
import { api } from '@/services/api';
import { Department } from '@/types/recruitment';
import Image from 'next/image';
import { Badge, Button, Card, Input, Select, Textarea } from '@/components/design-system/primitives';

interface CreatedJob {
  id: string;
  title: string;
}

export default function CreateManualJobPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'XAF',
    expirationDate: '',
    showOnPortal: true,
    isPremium: false, // ✨ NOUVEAU
    additionalDocumentType: '' as '' | 'CNI' | 'BULLETIN' | 'LETTRE_MOTIVATION' | 'BREF' | 'CASIER' | 'AUTRE',
    additionalDocumentLabel: '',
  });

  useEffect(() => {
    api.get<Department[]>('/departments').then(setDepartments).catch(console.error);
  }, []);

  // Offre créée depuis une demande de recrutement validée : on préremplit ce qui est connu
  const [requisitionId, setRequisitionId] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('requisition');
    if (!id) return;
    setRequisitionId(id);
    api.get<any>(`/recruitment/requisitions/${id}`).then((r) => {
      setFormData((p) => ({
        ...p,
        title: r.title ?? p.title,
        departmentId: r.departmentId ?? '',
        contractType: r.contractType ?? p.contractType,
        salaryMin: r.salaryMin ? String(Math.round(Number(r.salaryMin))) : p.salaryMin,
        salaryMax: r.salaryMax ? String(Math.round(Number(r.salaryMax))) : p.salaryMax,
      }));
    }).catch(() => { /* la page reste utilisable sans préremplissage */ });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image trop volumineuse (max 2MB)');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format non supporté (JPG, PNG, WEBP uniquement)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType);
      formDataToSend.append('processingMode', 'MANUAL');
      formDataToSend.append('status', 'PUBLISHED');
      formDataToSend.append('showOnPortal', formData.showOnPortal.toString());
      formDataToSend.append('isPremium', formData.isPremium.toString()); // ✨ AJOUT
      
      if (formData.additionalDocumentType) {
        formDataToSend.append('additionalDocumentType', formData.additionalDocumentType);
        formDataToSend.append('additionalDocumentLabel', formData.additionalDocumentLabel || formData.additionalDocumentType);
      }
      
      if (formData.salaryMin) formDataToSend.append('salaryMin', formData.salaryMin);
      if (formData.salaryMax) formDataToSend.append('salaryMax', formData.salaryMax);
      formDataToSend.append('salaryCurrency', formData.salaryCurrency);
      
      // ✅ Date en ISO 8601
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // ✅ CORRECTION : Utiliser api.postFormData
      const jobResponse = await api.postFormData<CreatedJob>('/recruitment/jobs', formDataToSend);
      setCreatedJob(jobResponse);
      if (requisitionId) {
        // Lie l'offre à la demande : suivi « postes à pourvoir / pourvus »
        try { await api.post(`/recruitment/requisitions/${requisitionId}/link-job`, { jobOfferId: jobResponse.id }); } catch { /* modifiable depuis « Demandes » */ }
      }
    } catch (error) {
      const err = error as Error;
      alert(`Erreur: ${err.message || 'Impossible de créer l\'offre'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!createdJob) return;
    const url = `${window.location.origin}/jobs/${createdJob.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="recruitment-workspace max-w-6xl mx-auto space-y-6 px-4 pb-20 pt-6">
      
      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {createdJob && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.5)]  p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Confirmation de publication"
              className="w-full max-w-lg"
            >
              <Card title="Offre publiée" action={<Badge tone="success">Succès</Badge>}>
                <div className="space-y-6">
                  <p className="text-sm text-[var(--text-muted)]">Votre offre est en ligne et visible par les candidats.</p>
                  <div className="space-y-3 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4">
                    <p className="text-sm font-semibold text-[var(--text)]">Lien public de candidature</p>
                    <p className="break-all text-sm text-[var(--text-muted)]">{`${window.location.origin}/jobs/${createdJob.id}`}</p>
                    <Button type="button" variant="secondary" onClick={handleCopyLink}>
                      {isCopied ? <Check size={16} strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
                      {isCopied ? 'Lien copié' : 'Copier le lien'}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" onClick={() => router.push(`/recrutement/pipeline?job=${createdJob.id}`)}>
                      Voir les candidatures
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => router.push('/recrutement')}>
                      Retour au recrutement
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Button type="button" variant="secondary" onClick={() => router.back()} aria-label="Retour">
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="text-[var(--brand)]" size={24} strokeWidth={1.5}/>
            <h1 className="text-2xl font-semibold text-[var(--text)]">Créer une offre manuelle</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Recrutement traditionnel avec examen manuel des CV</p>
        </div>
      </div>

      {/* FORM */}
      <RecruitmentNav /><div className="recruitment-form-layout"><RecruitmentFormOutline sections={[{"id":"recruit-section-1","label":"Informations sur le poste"},{"id":"recruit-section-2","label":"Image de l'offre (optionnel)"},{"id":"recruit-section-3","label":"Publication et visibilité"},{"id":"recruit-section-4","label":"Mode de traitement"},{"id":"recruit-section-5","label":"Document supplémentaire (optionnel)"}]} /><form data-guide="recrutement-manual-form" onSubmit={handleSubmit} className="space-y-6">
        
        {/* IMAGE UPLOAD */}


        {requisitionId && (
          <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text)]">
            Offre créée à partir d’une demande de recrutement : les informations connues sont préremplies, vous pouvez les modifier.
          </div>
        )}

        <Card id="recruit-section-1" title="Informations sur le poste">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Intitulé du poste"
                required
                placeholder="Ex : Chef de projet marketing"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <Select
              label="Département (optionnel)"
              hint="Vous pourrez le définir plus tard. Il ne sera exigé qu’à l’embauche."
              value={formData.departmentId}
              onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
            >
              <option value="">Aucun département pour l’instant</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input
              label="Lieu"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
            <Select
              label="Type de contrat"
              value={formData.contractType}
              onChange={e => setFormData({ ...formData, contractType: e.target.value })}
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
            </Select>
          </div>

          {/* SALARY */}
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <Input label="Salaire minimum" type="number" placeholder="Ex : 500000" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })} />
            <Input label="Salaire maximum" type="number" placeholder="Ex : 800000" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })} />
            <Select label="Devise" value={formData.salaryCurrency} onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })}>
              <option value="XAF">XAF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
          </div>

          {/* EXPIRATION */}
          <div className="mt-5 max-w-sm">
            <Input label="Date d'expiration (optionnel)" type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
          </div>
          
          <div className="mt-5 space-y-5">
            <Textarea
              label="Description du poste (optionnel)"
              rows={6}
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Décrivez les missions et responsabilités..."
            />
          
            <Textarea
              label="Compétences et qualifications"
              rows={4}
              value={formData.requirements} 
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
              placeholder="Expérience, diplômes, compétences techniques..."
            />
          </div>
        </Card>
<Card className="recruitment-form-image" id="recruit-section-2" title="Image de l'offre (optionnel)">
          {imagePreview ? (
            <div className="relative group">
              <Image
                src={imagePreview}
                alt="Aperçu de l’image de l’offre"
                width={400}
                height={200}
                className="w-full max-h-72 rounded-xl object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                aria-label="Retirer l’image de l’offre"
                className="absolute right-3 top-3"
              >
                <X size={18} strokeWidth={1.5} />
              </Button>
            </div>
          ) : (
            <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl bg-[var(--surface-2)] p-6 text-center text-[var(--text-muted)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)] focus-within:outline-offset-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
              <Upload size={32} strokeWidth={1.5} aria-hidden="true" />
              <span className="font-medium text-[var(--text)]">Choisir une image</span>
              <span className="text-sm">JPG, PNG ou WEBP · 2 Mo maximum</span>
            </label>
          )}
        </Card>

        <Card id="recruit-section-3" title="Publication et visibilité">
          <div className="space-y-3">
            <label className="flex min-h-16 items-center justify-between gap-4 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 cursor-pointer">
              <span>
                <span className="block font-semibold text-[var(--text)]">Publier sur le portail</span>
                <span className="block text-sm text-[var(--text-muted)]">Visible par tous les visiteurs</span>
              </span>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                aria-label="Publier sur le portail"
                checked={formData.showOnPortal}
                onChange={e => setFormData({ ...formData, showOnPortal: e.target.checked })}
              />
            </label>
            <label className="flex min-h-16 items-center justify-between gap-4 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 cursor-pointer">
              <span>
                <span className="block font-semibold text-[var(--text)]">Offre premium</span>
                <span className="block text-sm text-[var(--text-muted)]">Met l'offre en tête du portail pendant 30 jours</span>
              </span>
              <input
                type="checkbox"
                className="size-5 shrink-0 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                aria-label="Activer l'offre premium"
                checked={formData.isPremium}
                onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
              />
            </label>
          </div>
        </Card>

        <Card id="recruit-section-4" title="Mode de traitement">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <p className="max-w-2xl text-sm text-[var(--text-muted)]">
              Les candidatures seront reçues dans votre espace pour examiner chaque CV et gérer le processus de sélection.
            </p>
            <Badge tone="info">Examen manuel</Badge>
          </div>
        </Card>

          {/* 📄 DOCUMENT SUPPLÉMENTAIRE */}
          <Card id="recruit-section-5" title="Document supplémentaire (optionnel)">
            <div className="flex items-center gap-3">
              <p className="text-sm text-[var(--text-muted)]">En plus du CV, demandez un document additionnel au candidat.</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {([
                { value: '' as const, label: 'Aucun' },
                { value: 'CNI' as const, label: "Pièce d'identité (CNI)" },
                { value: 'BULLETIN' as const, label: 'Bulletin de salaire' },
                { value: 'LETTRE_MOTIVATION' as const, label: 'Lettre de motivation' },
                { value: 'BREF' as const, label: 'BREF / Diplôme' },
                { value: 'CASIER' as const, label: 'Casier judiciaire' },
                { value: 'AUTRE' as const, label: 'Autre document' },
              ]).map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={formData.additionalDocumentType === opt.value ? 'primary' : 'secondary'}
                  aria-pressed={formData.additionalDocumentType === opt.value}
                  onClick={() => setFormData({ ...formData, additionalDocumentType: opt.value, additionalDocumentLabel: '' })}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {formData.additionalDocumentType === 'AUTRE' && (
              <Input
                label="Nom du document"
                placeholder="Ex : Lettre de référence, Casier judiciaire..."
                value={formData.additionalDocumentLabel}
                onChange={e => setFormData({ ...formData, additionalDocumentLabel: e.target.value })}
              />
            )}
            {formData.additionalDocumentType && (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Document demandé : <strong className="text-[var(--text)]">{formData.additionalDocumentLabel || formData.additionalDocumentType}</strong>, en plus du CV.
              </p>
            )}
          </Card>

        {/* SUBMIT */}
        <div className="recruitment-form-submit flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Publication…' : <><Send size={18} strokeWidth={1.5} aria-hidden="true" /> Publier l'offre</>}
          </Button>
        </div>
      </form></div>
    </div>
  );
}