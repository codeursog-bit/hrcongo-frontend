'use client';
import { RecruitmentFormOutline } from '@/components/recruitment/RecruitmentFrame';
import { RecruitmentNav } from '@/components/recruitment/recruitment-ui';
import '@/components/recruitment/recruitment.css';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { api } from '@/services/api';
import Image from 'next/image';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Button, Card, Input, Select, Textarea } from '@/components/design-system/primitives';

interface Department {
  id: string;
  name: string;
}

interface JobData {
  title: string;
  departmentId: string | null;
  location: string;
  type: string;
  description: string;
  requirements?: string;
  imageUrl?: string;
  expirationDate?: string;
  status: string;
  isExpired: boolean;
  aiConfig?: { testDurationMinutes?: number };
  additionalDocumentType?: string;
  additionalDocumentLabel?: string;
}

interface FormData {
  title: string;
  departmentId: string;
  location: string;
  contractType: string;
  salaryRange: string;
  description: string;
  requirements: string;
  expirationDate: string;
  status: string;
  testDurationMinutes: number;
  additionalDocumentType: '' | 'CNI' | 'BULLETIN' | 'LETTRE_MOTIVATION' | 'BREF' | 'CASIER' | 'AUTRE';
  additionalDocumentLabel: string;
}

export default function EditJobOfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryRange: '',
    description: '',
    requirements: '',
    expirationDate: '',
    status: 'PUBLISHED',
    testDurationMinutes: 10,
    additionalDocumentType: '',
    additionalDocumentLabel: '',
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [jobData, deptData] = await Promise.all([
          api.get(`/recruitment/jobs/${params.id}`),
          api.get('/departments')
        ]);
        
        setDepartments(deptData as Department[]);
        
        const job = jobData as JobData;
        
        if (job.imageUrl) {
          setExistingImageUrl(job.imageUrl);
          setImagePreview(job.imageUrl);
        }
        
        let formattedDate = '';
        if (job.expirationDate) {
          const date = new Date(job.expirationDate);
          formattedDate = date.toISOString().split('T')[0];
        }
        
        setFormData({
          title: job.title,
          departmentId: job.departmentId ?? '',
          location: job.location,
          contractType: job.type,
          salaryRange: '',
          description: job.description,
          requirements: job.requirements || '',
          expirationDate: formattedDate,
          status: job.status,
          testDurationMinutes: job.aiConfig?.testDurationMinutes ?? 10,
          additionalDocumentType: (job.additionalDocumentType as '' | 'CNI' | 'BREF' | 'AUTRE') || '',
          additionalDocumentLabel: job.additionalDocumentLabel || '',
        });
      } catch (e) {
        console.error(e);
        alert("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [params.id]);

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

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setExistingImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('status', formData.status); // ✅ Envoyer le statut
      
      const aiConfig = { testDurationMinutes: formData.testDurationMinutes };
      formDataToSend.append('aiConfig', JSON.stringify(aiConfig));

      if (formData.additionalDocumentType) {
        formDataToSend.append('additionalDocumentType', formData.additionalDocumentType);
        formDataToSend.append('additionalDocumentLabel', formData.additionalDocumentLabel || formData.additionalDocumentType);
      } else {
        formDataToSend.append('additionalDocumentType', '');
      }
      
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (!existingImageUrl && !imagePreview) {
        formDataToSend.append('removeImage', 'true');
      }
      
      await api.putFormData(`/recruitment/jobs/${params.id}`, formDataToSend);
      
      alert("Offre mise à jour avec succès !");
      router.push('/recrutement');
    } catch (e) {
      console.error("Erreur détaillée:", e);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <KonzaLoader variant="page" />
    );
  }

  return (
    <div className="recruitment-workspace max-w-6xl mx-auto space-y-6 px-4 pb-20 pt-6">
      <div className="flex items-center gap-4 mb-8">
        <Button type="button" variant="secondary" onClick={() => router.back()} aria-label="Retour">
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Modifier l'offre d'emploi</h1>
          <p className="text-sm text-[var(--text-muted)]">Mettez à jour les informations du poste.</p>
        </div>
      </div>

      <RecruitmentNav /><div className="recruitment-form-layout"><RecruitmentFormOutline sections={[{"id":"recruit-section-1","label":"Statut de l'offre"},{"id":"recruit-section-2","label":"Image de l'offre"},{"id":"recruit-section-3","label":"Détails du poste"},{"id":"recruit-section-4","label":"Description et prérequis"},{"id":"recruit-section-5","label":"Durée du test"},{"id":"recruit-section-6","label":"Document supplémentaire (optionnel)"}]} /><form onSubmit={handleSubmit} className="space-y-6">
        
        <Card id="recruit-section-1" title="Statut de l'offre">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              {formData.status === 'PUBLISHED' ? 'Visible par les candidats' : 'Cachée du portail'}
            </p>
            <label className="inline-flex min-h-11 items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="size-5 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                aria-label="Publier l’offre"
                checked={formData.status === 'PUBLISHED'}
                onChange={(e) => setFormData({
                  ...formData,
                  status: e.target.checked ? 'PUBLISHED' : 'DRAFT'
                })}
              />
              <Badge tone={formData.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                {formData.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
              </Badge>
            </label>
          </div>
        </Card>

        <Card className="recruitment-form-image" id="recruit-section-2" title="Image de l'offre">
          {imagePreview ? (
            <div className="relative group">
              <Image 
                src={imagePreview} 
                alt="Aperçu de l’image de l’offre"
                width={800}
                height={400}
                className="w-full max-h-80 rounded-xl object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleRemoveImage}
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
                aria-label="Choisir une image pour l’offre"
              />
              <Upload size={32} strokeWidth={1.5} aria-hidden="true" />
              <span className="font-medium text-[var(--text)]">Choisir une image</span>
              <span className="text-sm">JPG, PNG ou WEBP · 2 Mo maximum</span>
            </label>
          )}
        </Card>

        <Card id="recruit-section-3" title="Détails du poste">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Titre de l'offre"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex : Développeur Fullstack Senior"
              className="text-lg font-medium"
            />
            <Select
              label="Département (optionnel)"
              value={formData.departmentId}
              onChange={e => setFormData({...formData, departmentId: e.target.value})}
            >
              <option value="">Aucun département</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select
              label="Type de contrat"
              value={formData.contractType}
              onChange={e => setFormData({...formData, contractType: e.target.value})}
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="STAGE">Stage</option>
              <option value="CONSULTANT">Consultant</option>
            </Select>
            <Input
              label="Lieu"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            />
            <Input
              label="Fourchette de salaire (optionnel)"
              value={formData.salaryRange}
              onChange={e => setFormData({...formData, salaryRange: e.target.value})}
              placeholder="Ex : 800k - 1.2M"
            />
            <Input
              label="Date d'expiration"
              type="date"
              value={formData.expirationDate}
              onChange={e => setFormData({...formData, expirationDate: e.target.value})}
            />
          </div>
        </Card>

        <Card id="recruit-section-4" title="Description et prérequis">
          <div className="space-y-5">
            <Textarea
              label="Description du poste"
              required
              rows={6}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Détaillez les missions..."
            />
            <Textarea
              label="Compétences requises"
              rows={4}
              value={formData.requirements}
              onChange={e => setFormData({...formData, requirements: e.target.value})}
              placeholder="Liste des compétences..."
            />
          </div>
        </Card>

        <Card id="recruit-section-5" title="Durée du test">
          <Input
            label="Durée en minutes"
            hint="Temps accordé aux candidats pour répondre au test."
            type="number"
            min={1}
            max={180}
            value={formData.testDurationMinutes}
            onChange={e => setFormData({...formData, testDurationMinutes: Math.max(1, parseInt(e.target.value) || 10)})}
          />
        </Card>

        <Card id="recruit-section-6" title="Document supplémentaire (optionnel)">
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">En plus du CV, demandez un document additionnel au candidat.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                { value: '' as const, label: 'Aucun' },
                { value: 'CNI' as const, label: "Pièce d'identité" },
                { value: 'BREF' as const, label: 'BREF / Diplôme' },
                { value: 'AUTRE' as const, label: 'Autre' },
              ]).map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={formData.additionalDocumentType === opt.value ? 'primary' : 'secondary'}
                  aria-pressed={formData.additionalDocumentType === opt.value}
                  onClick={() => setFormData({...formData, additionalDocumentType: opt.value, additionalDocumentLabel: ''})}
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
                onChange={e => setFormData({...formData, additionalDocumentLabel: e.target.value})}
              />
            )}
            {formData.additionalDocumentType && (
              <p className="text-sm text-[var(--text-muted)]">
                Document demandé : <strong className="text-[var(--text)]">{formData.additionalDocumentLabel || formData.additionalDocumentType}</strong>, en plus du CV.
              </p>
            )}
          </div>
        </Card>

        <div className="recruitment-form-submit flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : <><Save size={18} strokeWidth={1.5} aria-hidden="true" /> Enregistrer</>}
          </Button>
        </div>
      </form></div>
    </div>
  );
}