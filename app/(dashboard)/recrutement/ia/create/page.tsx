'use client';
import { RecruitmentFormOutline } from '@/components/recruitment/RecruitmentFrame';
import { RecruitmentNav } from '@/components/recruitment/recruitment-ui';
import '@/components/recruitment/recruitment.css';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus, Trash2, GripVertical, BrainCircuit, X, ArrowLeft, Copy, Check, Upload
} from 'lucide-react';
import { api } from '@/services/api';
import { EducationLevel, QuizQuestion, Department } from '@/types/recruitment';
import Image from 'next/image';
import { Badge, Button, Card, Input, Select, Textarea } from '@/components/design-system/primitives';

interface CreatedJob {
  id: string;
  title: string;
}

export default function CreateIAJobPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [useAIQuestions, setUseAIQuestions] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    requiredSkills: [] as string[],
    minExperience: 2,
    educationLevel: EducationLevel.BAC_PLUS_3,
    testDurationMinutes: 10,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'XAF',
    expirationDate: '',
    showOnPortal: false,
    quiz: [] as QuizQuestion[],
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

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!formData.requiredSkills.includes(newSkill.trim())) {
        setFormData(prev => ({ ...prev, requiredSkills: [...prev.requiredSkills, newSkill.trim()] }));
      }
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) }));
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addQuestion = () => {
    if (formData.quiz.length >= 10) return;
    const newQ: QuizQuestion = { 
      id: generateId(), 
      text: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0, 
      points: 6 
    };
    setFormData(prev => ({ ...prev, quiz: [...prev.quiz, newQ] }));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setFormData(prev => ({
      ...prev,
      quiz: prev.quiz.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData(prev => ({ ...prev, quiz: prev.quiz.filter(q => q.id !== id) }));
  };

  const handleReorder = (newOrder: QuizQuestion[]) => {
    setFormData(prev => ({ ...prev, quiz: newOrder }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérification selon le mode choisi
    if (!useAIQuestions && formData.quiz.length === 0) {
      alert("Ajoutez au moins une question ou activez la génération IA");
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ FormData avec le format exact attendu par le DTO
      const formDataToSend = new FormData();
      
      // Champs basiques
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType); // ✅ Garde contractType
      formDataToSend.append('processingMode', 'AI_ASSISTED');
      formDataToSend.append('status', 'PUBLISHED');
      formDataToSend.append('showOnPortal', formData.showOnPortal.toString());
      formDataToSend.append('isPremium', formData.isPremium.toString()); // ✨ AJOUT
      if (formData.additionalDocumentType) {
        formDataToSend.append('additionalDocumentType', formData.additionalDocumentType);
        formDataToSend.append('additionalDocumentLabel', formData.additionalDocumentLabel || formData.additionalDocumentType);
      }
      
      // ✅ requiredSkills en JSON string (sera transformé par le DTO)
      formDataToSend.append('requiredSkills', JSON.stringify(formData.requiredSkills));
      
      formDataToSend.append('minExperience', formData.minExperience.toString());
      formDataToSend.append('educationLevel', formData.educationLevel);
      
      // Salaire (en string, sera transformé par le DTO)
      if (formData.salaryMin) formDataToSend.append('salaryMin', formData.salaryMin);
      if (formData.salaryMax) formDataToSend.append('salaryMax', formData.salaryMax);
      formDataToSend.append('salaryCurrency', formData.salaryCurrency);
      
      // ✅ Date en ISO 8601
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      // aiConfig en JSON
      const aiConfig = {
        minScoreRetenu: 75,
        minScoreMoyenne: 55,
        minScoreSeconde: 40,
        testDurationMinutes: formData.testDurationMinutes,
        testQuestionCount: useAIQuestions ? 10 : formData.quiz.length
      };
      formDataToSend.append('aiConfig', JSON.stringify(aiConfig));
      
      // Image (optionnelle)
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      // ✅ UTILISATION DE api.postFormData
      const jobResponse = await api.postFormData<CreatedJob>('/recruitment/jobs', formDataToSend);
      
      // Si mode manuel, créer les questions
      if (!useAIQuestions && formData.quiz.length > 0) {
        for (let i = 0; i < formData.quiz.length; i++) {
          const q = formData.quiz[i];
          await api.post(`/recruitment/jobs/${jobResponse.id}/questions`, {
            question: q.text,
            questionType: 'MULTIPLE_CHOICE',
            points: q.points,
            order: i,
            options: q.options,
            correctAnswers: [q.options[q.correctAnswer]]
          });
        }
      }
      // Si mode IA, déclencher la génération auto
      else if (useAIQuestions) {
        await api.post(`/recruitment/jobs/${jobResponse.id}/generate-test-questions`, {});
      }

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
    <div className="recruitment-form-page min-h-screen bg-[var(--bg)] relative overflow-hidden">
      
      <div className="recruitment-workspace max-w-6xl mx-auto pb-20 pt-8 px-4 relative z-10">
        
        {/* SUCCESS MODAL */}
        <AnimatePresence>
          {createdJob && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.5)] p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }}
                role="dialog"
                aria-modal="true"
                aria-label="Confirmation de publication"
                className="w-full max-w-lg"
              >
                <Card title="Offre IA activée" action={<Badge tone="success">Succès</Badge>}>
                  <div className="space-y-6">
                    <p className="text-sm text-[var(--text-muted)]">Le recrutement intelligent est opérationnel.</p>
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
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BrainCircuit className="text-[var(--brand)]" size={24} strokeWidth={1.5}/>
              <h1 className="text-2xl font-semibold text-[var(--text)]">Créer une offre IA</h1>
            </div>
            <p className="text-[var(--text-muted)]">Recrutement intelligent avec sélection automatique</p>
          </div>
        </div>

        {/* FORM */}
        <RecruitmentNav /><div className="recruitment-form-layout"><RecruitmentFormOutline sections={[{"id":"recruit-section-1","label":"Informations générales"},{"id":"recruit-section-2","label":"Image de l'offre (optionnel)"},{"id":"recruit-section-3","label":"Critères de sélection IA"},{"id":"recruit-section-4","label":"Questions d'évaluation"}]} /><form data-guide="recrutement-ai-form" onSubmit={handleSubmit} className="space-y-6">
          
          {/* IMAGE UPLOAD */}


          {requisitionId && (
          <div role="status" className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text)]">
            Offre créée à partir d’une demande de recrutement : les informations connues sont préremplies, vous pouvez les modifier.
          </div>
          )}

          {/* CARD: Info de base */}
          <Card id="recruit-section-1" title="Informations générales">
            
            <div className="space-y-5">
              <Input
                label="Intitulé du poste"
                required
                placeholder="Ex : Développeur Full-Stack Senior"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Select
                  label="Département (optionnel)"
                  value={formData.departmentId}
                  onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                >
                  <option value="">Aucun département pour l’instant</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>
                <Input label="Lieu" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                <Select label="Type de contrat" value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value })}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="STAGE">Stage</option>
                </Select>
              </div>

              {/* SALARY */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <Input label="Salaire minimum" type="number" placeholder="Ex : 500000" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })} />
                <Input label="Salaire maximum" type="number" placeholder="Ex : 800000" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })} />
                <Select label="Devise" value={formData.salaryCurrency} onChange={e => setFormData({ ...formData, salaryCurrency: e.target.value })}>
                  <option value="XAF">XAF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </Select>
              </div>

              {/* EXPIRATION */}
              <div className="max-w-sm">
                <Input label="Date d'expiration (optionnel)" type="date" value={formData.expirationDate} onChange={e => setFormData({ ...formData, expirationDate: e.target.value })} />
              </div>
              
              <Textarea
                label="Description (nécessaire : elle sert à générer les questions du test)"
                required
                rows={6}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez le poste et les missions..."
              />
              
              <Textarea
                label="Prérequis"
                rows={4}
                value={formData.requirements}
                onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Compétences et qualifications requises..."
              />

              {/* PORTAL TOGGLE */}
              <label className="flex min-h-16 items-center justify-between gap-4 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 cursor-pointer">
                <span>
                  <span className="block font-semibold text-[var(--text)]">Publier sur le portail</span>
                  <span className="block text-sm text-[var(--text-muted)]">Visible par tous les visiteurs</span>
                </span>
                <input type="checkbox" className="size-5 shrink-0 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" aria-label="Publier sur le portail" checked={formData.showOnPortal} onChange={e => setFormData({ ...formData, showOnPortal: e.target.checked })} />
              </label>

              {/* ✨ BOUTON BOOSTER */}
              <label className="flex min-h-16 items-center justify-between gap-4 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 cursor-pointer">
                <span>
                  <span className="block font-semibold text-[var(--text)]">Offre premium</span>
                  <span className="block text-sm text-[var(--text-muted)]">Met l'offre en tête du portail pendant 30 jours</span>
                </span>
                <input type="checkbox" className="size-5 shrink-0 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" aria-label="Activer l'offre premium" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} />
              </label>

              {/* ⏱ DURÉE DU TEST */}
              <Input
                label="Durée du test (minutes)"
                hint="Temps accordé aux candidats pour répondre."
                type="number"
                min={1}
                max={180}
                value={formData.testDurationMinutes}
                onChange={e => setFormData({ ...formData, testDurationMinutes: Math.max(1, parseInt(e.target.value) || 10) })}
              />

              {/* 📄 DOCUMENT SUPPLÉMENTAIRE */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[var(--text)]">Document supplémentaire (optionnel)</h4>
                <p className="text-sm text-[var(--text-muted)]">En plus du CV, demandez un document additionnel au candidat.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {([
                    { value: '', label: 'Aucun' },
                    { value: 'CNI', label: "Pièce d'identité (CNI)" },
                    { value: 'BULLETIN', label: 'Bulletin de salaire' },
                    { value: 'LETTRE_MOTIVATION', label: 'Lettre de motivation' },
                    { value: 'BREF', label: 'BREF / Diplôme' },
                    { value: 'CASIER', label: 'Casier judiciaire' },
                    { value: 'AUTRE', label: 'Autre document' },
                  ] as const).map(opt => (
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
              </div>
            </div>
          </Card>
<Card className="recruitment-form-image" id="recruit-section-2" title="Image de l'offre (optionnel)">
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

          {/* CARD: Critères IA */}
          <Card id="recruit-section-3" title="Critères de sélection IA">

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2" aria-label="Compétences sélectionnées">
                  <AnimatePresence>
                    {formData.requiredSkills.map(skill => (
                      <motion.span key={skill} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                        <Badge tone="info">
                          {skill}
                          <button type="button" className="ml-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" aria-label={`Retirer la compétence ${skill}`} onClick={() => removeSkill(skill)}>
                            <X size={12} strokeWidth={1.5} />
                          </button>
                        </Badge>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                <Input
                  label="Compétences clés pour l'analyse des CV"
                  hint="Saisissez une compétence et appuyez sur Entrée."
                  type="text"
                  placeholder="Ex : gestion de projet"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <label htmlFor="minimum-experience" className="text-sm font-semibold text-[var(--text)]">Expérience minimale</label>
                    <span className="text-sm font-medium text-[var(--text-muted)]">{formData.minExperience} ans</span>
                  </div>
                  <input 
                    type="range" 
                    id="minimum-experience"
                    min="0" 
                    max="15" 
                    step="1"
                    className="w-full accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)] focus-visible:outline-offset-2"
                    value={formData.minExperience}
                    onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) })}
                  />
                </div>
                
                <Select label="Niveau d'études" value={formData.educationLevel} onChange={e => setFormData({ ...formData, educationLevel: e.target.value as EducationLevel })}>
                  {Object.values(EducationLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </Select>
              </div>
            </div>
          </Card>

          {/* CARD: MODE QUESTIONS */}
          <Card id="recruit-section-4"
            title="Questions d'évaluation"
            action={
              <label className="flex min-h-11 items-center gap-3 cursor-pointer">
                <span className="text-sm text-[var(--text-muted)]">Génération IA</span>
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                  aria-label="Activer la génération des questions par IA"
                  checked={useAIQuestions}
                  onChange={e => setUseAIQuestions(e.target.checked)}
                />
              </label>
            }
          >

            {useAIQuestions ? (
              <div className="space-y-3 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-6">
                <Badge tone="info">Génération IA activée</Badge>
                <p className="text-sm text-[var(--text-muted)]">
                  L'IA générera automatiquement 10 questions basées sur les compétences requises et la description du poste.
                </p>
                <p className="text-sm text-[var(--text-muted)]">Mistral AI</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-sm text-[var(--text-muted)]">Créez manuellement vos questions ({formData.quiz.length}/10)</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addQuestion}
                    disabled={formData.quiz.length >= 10}
                  >
                    <Plus size={16} strokeWidth={1.5} /> Ajouter une question
                  </Button>
                </div>

                <Reorder.Group axis="y" values={formData.quiz} onReorder={handleReorder} className="space-y-5">
                  {formData.quiz.map((q, idx) => (
                    <Reorder.Item 
                      key={q.id} 
                      value={q} 
                      className="rounded-[var(--radius-control)] bg-[var(--surface-2)] p-5"
                    >
                      <div className="flex gap-4">
                        <div className="cursor-grab active:cursor-grabbing text-[var(--text-muted)]" aria-hidden="true">
                          <GripVertical size={20} strokeWidth={1.5}/>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-center">
                            <Badge tone="neutral">Question {idx + 1}</Badge>
                            <Button type="button" variant="ghost" onClick={() => removeQuestion(q.id)} aria-label={`Supprimer la question ${idx + 1}`}>
                              <Trash2 size={18} strokeWidth={1.5} />
                            </Button>
                          </div>
                          
                          <Input
                            label={`Question ${idx + 1}`}
                            placeholder="Entrez la question..."
                            value={q.text}
                            onChange={e => updateQuestion(q.id, { text: e.target.value })}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                                <Button
                                  type="button"
                                  variant={q.correctAnswer === optIdx ? 'primary' : 'secondary'}
                                  aria-pressed={q.correctAnswer === optIdx}
                                  aria-label={`Définir l’option ${String.fromCharCode(65 + optIdx)} comme bonne réponse à la question ${idx + 1}`}
                                  onClick={() => updateQuestion(q.id, { correctAnswer: optIdx })}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </Button>
                                <Input
                                  label={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                  value={opt} 
                                  onChange={(e) => {
                                    const nextOpts = [...q.options];
                                    nextOpts[optIdx] = e.target.value;
                                    updateQuestion(q.id, { options: nextOpts });
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="max-w-40">
                            <Input
                              label="Points"
                              type="number"
                              min="1"
                              max="10"
                              value={q.points}
                              onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                
                {formData.quiz.length === 0 && (
                  <div className="rounded-[var(--radius-control)] bg-[var(--surface-2)] p-6 text-center">
                    <p className="font-medium text-[var(--text)]">Aucune question pour le moment</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Ajoutez une question pour activer le test manuel.</p>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* SUBMIT */}
          <Button
            type="submit" 
            disabled={isSubmitting || (!useAIQuestions && formData.quiz.length === 0)} 
            loading={isSubmitting}
            className="recruitment-form-submit w-full"
          >
            {isSubmitting ? 'Publication…' : 'Activer le recrutement IA'}
          </Button>
        </form></div>
      </div>
    </div>
  );
}