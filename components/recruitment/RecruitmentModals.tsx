'use client';

// ============================================================================
// 📁 components/recruitment/RecruitmentModals.tsx
// Les fenêtres d'action utilisées par le pipeline, la fiche candidat et
// l'agenda : une seule implémentation → comportement identique partout.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { api } from '@/services/api';
import {
  Interview, KIND_LABEL, MODE_LABEL, RECO_LABEL, REJECTION_REASONS,
  errMsg, isoToLocalInput, localToIso, tomorrowTenLocal, fmtDate,
} from './recruitment-ui';

type Person = { id: string; firstName: string; lastName: string };
const checkbox = 'h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)]';

// ═════════════════════════════════════════════════════════════════════════════
// Refuser un candidat
// ═════════════════════════════════════════════════════════════════════════════
export function RejectModal({ candidate, onClose, onDone }: {
  candidate: Person; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason) return notify('error', 'Choisissez le motif du refus');
    setSaving(true);
    try {
      const r = await api.patch<{ emailSent: boolean | null }>(`/recruitment/candidates/${candidate.id}/move`, {
        status: 'REJECTED', rejectionReason: reason, note, sendEmail,
      });
      notify('success', 'Candidat refusé', r?.emailSent === false ? 'L’e-mail n’a pas pu être envoyé.' : undefined);
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Refuser ${candidate.firstName} ${candidate.lastName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Confirmer le refus</Button>
      </>}>
      <div className="space-y-4">
        <Select label="Motif du refus" required value={reason} onChange={(e) => setReason(e.target.value)}
          hint="Le motif alimente vos statistiques de recrutement.">
          <option value="">Choisir un motif</option>
          {REJECTION_REASONS.filter((r) => r.code !== 'OFFER_DECLINED').map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </Select>
        <Textarea label="Note interne (optionnel)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" className={checkbox} checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          Envoyer un e-mail de refus courtois au candidat
        </label>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Planifier / reporter un entretien
// ═════════════════════════════════════════════════════════════════════════════
export function InterviewModal({ candidate, interview, onClose, onDone }: {
  candidate: Person; interview?: Interview; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const edit = !!interview;
  const [f, setF] = useState({
    kind: interview?.kind ?? 'HR',
    mode: interview?.mode ?? 'ONSITE',
    scheduledAt: interview ? isoToLocalInput(interview.scheduledAt) : tomorrowTenLocal(),
    durationMin: String(interview?.durationMin ?? 45),
    location: interview?.location ?? '',
    meetingUrl: interview?.meetingUrl ?? '',
    interviewers: interview?.interviewers ?? '',
  });
  const [notifyCandidate, setNotifyCandidate] = useState(true);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.scheduledAt) return notify('error', 'Choisissez la date et l’heure');
    setSaving(true);
    try {
      const body = {
        kind: f.kind, mode: f.mode, scheduledAt: localToIso(f.scheduledAt),
        durationMin: Number(f.durationMin) || 45,
        location: f.location, meetingUrl: f.meetingUrl, interviewers: f.interviewers,
      };
      let res: any;
      if (edit) res = await api.patch(`/recruitment/interviews/${interview!.id}`, { ...body, notify: notifyCandidate });
      else res = await api.post(`/recruitment/candidates/${candidate.id}/interviews`, { ...body, sendInvitation: notifyCandidate });
      const warn = res?.warnings?.length ? res.warnings.join(' ') : undefined;
      notify(
        res?.emailSent === false ? 'error' : 'success',
        edit ? 'Entretien mis à jour' : 'Entretien planifié',
        res?.emailSent === false ? 'L’e-mail au candidat n’a pas pu être envoyé.' : warn,
      );
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${edit ? 'Modifier l’entretien' : 'Planifier un entretien'} — ${candidate.firstName} ${candidate.lastName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>{edit ? 'Enregistrer' : 'Planifier'}</Button>
      </>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Type d’entretien" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Select label="Format" value={f.mode} onChange={(e) => set('mode', e.target.value)}>
          {Object.entries(MODE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Input label="Date et heure" type="datetime-local" required value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} />
        <Input label="Durée (minutes)" type="number" min={10} max={480} step={5} value={f.durationMin} onChange={(e) => set('durationMin', e.target.value)} />
        {f.mode === 'ONSITE' && (
          <div className="sm:col-span-2"><Input label="Lieu (optionnel)" placeholder="Ex : Siège, salle de réunion 2" value={f.location} onChange={(e) => set('location', e.target.value)} /></div>
        )}
        {f.mode === 'VIDEO' && (
          <div className="sm:col-span-2"><Input label="Lien de connexion (optionnel)" placeholder="https://meet…" value={f.meetingUrl} onChange={(e) => set('meetingUrl', e.target.value)} /></div>
        )}
        <div className="sm:col-span-2">
          <Input label="Intervieweurs (optionnel)" placeholder="Ex : M. Okemba (DRH), Mme Ngoma (Responsable technique)" value={f.interviewers} onChange={(e) => set('interviewers', e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text)] sm:col-span-2">
          <input type="checkbox" className={checkbox} checked={notifyCandidate} onChange={(e) => setNotifyCandidate(e.target.checked)} />
          {edit ? 'Prévenir le candidat du changement par e-mail' : 'Envoyer l’invitation au candidat par e-mail'}
        </label>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Évaluer un entretien (grille de critères)
// ═════════════════════════════════════════════════════════════════════════════
const DEFAULT_CRITERIA = ['Compétences techniques', 'Expérience', 'Communication', 'Motivation', 'Adéquation à l’équipe'];

export function FeedbackModal({ interview, candidateName, onClose, onDone }: {
  interview: Interview; candidateName: string; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [criteria, setCriteria] = useState<Array<{ label: string; score: number; comment: string }>>(
    interview.criteria?.length
      ? interview.criteria.map((c) => ({ label: c.label, score: c.score, comment: c.comment ?? '' }))
      : DEFAULT_CRITERIA.map((label) => ({ label, score: 0, comment: '' })),
  );
  const [reco, setReco] = useState(interview.recommendation ?? '');
  const [summary, setSummary] = useState(interview.summary ?? '');
  const [saving, setSaving] = useState(false);

  const overall = useMemo(() => {
    const scored = criteria.filter((c) => c.score > 0);
    return scored.length ? Math.round((scored.reduce((s, c) => s + c.score, 0) / (scored.length * 5)) * 100) : 0;
  }, [criteria]);

  const setC = (i: number, patch: Partial<(typeof criteria)[number]>) =>
    setCriteria((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const submit = async () => {
    if (criteria.some((c) => c.score === 0)) return notify('error', 'Notez tous les critères (de 1 à 5)');
    if (!reco) return notify('error', 'Choisissez une recommandation');
    setSaving(true);
    try {
      await api.post(`/recruitment/interviews/${interview.id}/feedback`, {
        criteria: criteria.map((c) => ({ label: c.label, score: c.score, comment: c.comment })),
        recommendation: reco, summary,
      });
      notify('success', 'Évaluation enregistrée');
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Évaluation — ${candidateName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Enregistrer l’évaluation</Button>
      </>}>
      <div className="space-y-5">
        <p className="text-sm text-[var(--text-secondary)]">{KIND_LABEL[interview.kind]} du {fmtDate(interview.scheduledAt)}. Notez chaque critère de 1 (faible) à 5 (excellent).</p>
        <div className="space-y-3">
          {criteria.map((c, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input
                  aria-label={`Intitulé du critère ${i + 1}`}
                  value={c.label}
                  onChange={(e) => setC(i, { label: e.target.value })}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--text)] outline-none"
                  maxLength={80}
                />
                <div className="flex items-center gap-1" role="radiogroup" aria-label={`Note ${c.label}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n} type="button" role="radio" aria-checked={c.score === n}
                      onClick={() => setC(i, { score: n })}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${c.score === n ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
                    >{n}</button>
                  ))}
                  <button type="button" aria-label="Supprimer ce critère" onClick={() => setCriteria((cs) => cs.filter((_, idx) => idx !== i))}
                    disabled={criteria.length <= 1}
                    className="ml-1 rounded-lg p-2 text-[var(--text-secondary)] hover:text-[var(--danger-text)] disabled:opacity-30"><Trash2 size={15} strokeWidth={1.5} /></button>
                </div>
              </div>
              <input
                aria-label={`Commentaire ${c.label}`} placeholder="Commentaire (optionnel)" value={c.comment}
                onChange={(e) => setC(i, { comment: e.target.value })}
                className="mt-2 w-full bg-transparent text-xs text-[var(--text-secondary)] outline-none" maxLength={500}
              />
            </div>
          ))}
          {criteria.length < 12 && (
            <Button variant="ghost" onClick={() => setCriteria((cs) => [...cs, { label: 'Nouveau critère', score: 0, comment: '' }])}>
              <Plus size={15} strokeWidth={1.5} /> Ajouter un critère
            </Button>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--text)]">Recommandation</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Recommandation">
            {Object.entries(RECO_LABEL).map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={reco === k} onClick={() => setReco(k)}
                className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors ${reco === k
                  ? (k.endsWith('YES') ? 'border-[var(--border)] bg-[var(--brand-soft)] text-[var(--success-text)]' : 'border-[var(--border)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)]')
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>{l}</button>
            ))}
          </div>
        </div>

        <Textarea label="Synthèse (optionnel)" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Points forts, points de vigilance, ce qu’il faut vérifier…" />
        <p className="text-sm text-[var(--text-secondary)]">Score global : <strong className="text-[var(--text)]">{overall}/100</strong></p>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Faire une offre d'embauche
// ═════════════════════════════════════════════════════════════════════════════
export function OfferModal({ candidate, defaultSalary, currency = 'XAF', defaultStart, onClose, onDone }: {
  candidate: Person; defaultSalary?: number | null; currency?: string; defaultStart?: string | null;
  onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [salary, setSalary] = useState(defaultSalary ? String(defaultSalary) : '');
  const [startDate, setStartDate] = useState(defaultStart ? defaultStart.slice(0, 10) : '');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!salary || Number(salary) <= 0) return notify('error', 'Indiquez le salaire proposé');
    setSaving(true);
    try {
      const r = await api.post<{ emailSent: boolean | null }>(`/recruitment/candidates/${candidate.id}/offer`, {
        salary: Number(salary), startDate: startDate || null, note, sendEmail,
      });
      notify(r?.emailSent === false ? 'error' : 'success', 'Offre enregistrée', r?.emailSent === false ? 'L’e-mail n’a pas pu être envoyé.' : undefined);
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Offre d’embauche — ${candidate.firstName} ${candidate.lastName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Enregistrer l’offre</Button>
      </>}>
      <div className="space-y-4">
        <Input label={`Salaire mensuel proposé (${currency === 'XAF' ? 'FCFA' : currency})`} type="number" min={0} required value={salary} onChange={(e) => setSalary(e.target.value)} />
        <Input label="Date de début souhaitée (optionnel)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Textarea label="Note interne (optionnel)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" className={checkbox} checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          Envoyer la proposition au candidat par e-mail
        </label>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Embaucher (crée la fiche employé, sans doublon)
// ═════════════════════════════════════════════════════════════════════════════
interface HireResult {
  alreadyHired: boolean;
  employee: { id: string; employeeNumber?: string; firstName?: string; lastName?: string } | null;
  headcount?: number; hiredCount?: number; canCloseJob?: boolean;
  onboardingCreated: boolean; missingFields: string[]; phoneConflict?: boolean;
}

export function HireModal({ candidate, jobDepartmentId, defaultStart, onClose, onDone, onCloseJob }: {
  candidate: Person;
  /** string = département de l'offre ; null = l'offre n'en a pas (choix obligatoire) ; absent = inconnu (le serveur tranche) */
  jobDepartmentId?: string | null;
  defaultStart?: string | null;
  onClose: () => void; onDone: () => void; onCloseJob?: () => void;
}) {
  const notify = useToast();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const needsDepartment = jobDepartmentId === null;
  const [departmentId, setDepartmentId] = useState(jobDepartmentId ?? '');
  const [startDate, setStartDate] = useState((defaultStart ?? new Date().toISOString()).slice(0, 10));
  const [onboarding, setOnboarding] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<HireResult | null>(null);

  useEffect(() => {
    api.get<Array<{ id: string; name: string }>>('/departments').then((d) => setDepartments(d ?? [])).catch(() => setDepartments([]));
  }, []);

  const submit = async () => {
    if (needsDepartment && !departmentId) return notify('error', 'Choisissez le département du nouvel employé');
    setSaving(true);
    try {
      const r = await api.post<HireResult>(`/recruitment/candidates/${candidate.id}/hire`, {
        departmentId: departmentId || undefined, startDate: startDate || undefined, createOnboarding: onboarding,
      });
      setResult(r);
    } catch (e) {
      notify('error', errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal open onClose={onDone} title={result.alreadyHired ? 'Déjà embauché' : 'Embauche enregistrée'}
        actions={<Button onClick={onDone}>Terminer</Button>}>
        <div className="space-y-4">
          <p className="flex items-center gap-2 font-medium text-[var(--success-text)]">
            <CheckCircle2 size={18} strokeWidth={1.5} />
            {candidate.firstName} {candidate.lastName} {result.alreadyHired ? 'a déjà une fiche employé' : 'est maintenant employé(e)'}
            {result.employee?.employeeNumber ? ` — matricule ${result.employee.employeeNumber}` : ''}.
          </p>
          {!result.alreadyHired && result.missingFields.length > 0 && (
            <div className="rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] p-3 text-sm text-[var(--text)]">
              <p className="font-medium">À compléter dans la fiche employé :</p>
              <p className="mt-1 text-[var(--text-secondary)]">{result.missingFields.join(' · ')}</p>
              {result.phoneConflict && <p className="mt-1 text-[var(--text-secondary)]">Le téléphone du candidat est déjà utilisé par un autre employé : il n’a pas été repris.</p>}
            </div>
          )}
          {result.onboardingCreated && <p className="text-sm text-[var(--text-secondary)]">Le parcours d’intégration (onboarding) a été créé automatiquement.</p>}
          <div className="flex flex-wrap gap-2">
            {result.employee?.id && <Link href={`/employes/${result.employee.id}`} className="k-button k-button-secondary">Ouvrir la fiche employé</Link>}
            {result.canCloseJob && onCloseJob && (
              <Button variant="secondary" onClick={onCloseJob}>
                Tous les postes sont pourvus ({result.hiredCount}/{result.headcount}) — clôturer l’offre
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onClose={onClose} title={`Embaucher ${candidate.firstName} ${candidate.lastName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Créer la fiche employé</Button>
      </>}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">Une fiche employé sera créée à partir du dossier du candidat. Rien ne sera créé en double.</p>
        <Select
          label={needsDepartment ? 'Département (obligatoire à l’embauche)' : 'Département'}
          required={needsDepartment} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
          hint={needsDepartment ? 'L’offre n’avait pas de département : choisissez-le ici.' : 'Par défaut, le département de l’offre. Vous pouvez le changer.'}
        >
          <option value="">{needsDepartment ? 'Choisir un département' : 'Département de l’offre'}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
        <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" className={checkbox} checked={onboarding} onChange={(e) => setOnboarding(e.target.checked)} />
          Lancer automatiquement le parcours d’intégration (onboarding)
        </label>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Écrire au candidat (modèles modifiables)
// ═════════════════════════════════════════════════════════════════════════════
export function EmailModal({ candidate, initialTemplate, onClose, onDone }: {
  candidate: Person & { email: string }; initialTemplate?: string; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [templates, setTemplates] = useState<Array<{ id: string; label: string; description: string }>>([]);
  const [templateId, setTemplateId] = useState(initialTemplate ?? 'BLANK');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get<Array<{ id: string; label: string; description: string }>>('/recruitment/email-templates')
      .then((t) => setTemplates(t ?? [])).catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<{ subject: string; body: string }>(`/recruitment/candidates/${candidate.id}/email-preview?template=${encodeURIComponent(templateId)}`)
      .then((p) => { if (!cancelled) { setSubject(p.subject); setBody(p.body); } })
      .catch((e) => { if (!cancelled) notify('error', errMsg(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [templateId, candidate.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    if (!subject.trim() || !body.trim()) return notify('error', 'L’objet et le message sont obligatoires');
    setSending(true);
    try {
      const r = await api.post<{ sent: boolean }>(`/recruitment/candidates/${candidate.id}/email`, { subject, body });
      if (r?.sent) notify('success', 'E-mail envoyé'); else notify('error', 'L’e-mail n’a pas pu être envoyé', 'Il est tout de même noté dans la chronologie.');
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Écrire à ${candidate.firstName} ${candidate.lastName}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={send} loading={sending} disabled={loading}>Envoyer</Button>
      </>}>
      <div className="space-y-4">
        <Select label="Modèle" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
        <p className="text-xs text-[var(--text-secondary)]">À : {candidate.email} — le candidat peut vous répondre directement.</p>
        <Input label="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={loading} />
        <Textarea label="Message" rows={11} value={body} onChange={(e) => setBody(e.target.value)} disabled={loading} />
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Clôturer une offre (et prévenir les autres candidats)
// ═════════════════════════════════════════════════════════════════════════════
export function CloseJobModal({ job, activeCandidates, onClose, onDone }: {
  job: { id: string; title: string }; activeCandidates: number; onClose: () => void; onDone: () => void;
}) {
  const notify = useToast();
  const [rejectRemaining, setRejectRemaining] = useState(activeCandidates > 0);
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const r = await api.post<{ rejected: number; emailsSent: number }>(`/recruitment/jobs/${job.id}/close`, { rejectRemaining, sendEmail: rejectRemaining && sendEmail });
      notify('success', 'Offre clôturée', r.rejected ? `${r.rejected} candidat(s) classé(s) « poste pourvu », ${r.emailsSent} e-mail(s) envoyé(s).` : undefined);
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Clôturer « ${job.title} »`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Clôturer l’offre</Button>
      </>}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">L’offre n’acceptera plus de candidatures. Vous pourrez la rouvrir plus tard.</p>
        {activeCandidates > 0 ? (
          <>
            <label className="flex items-start gap-2 text-sm text-[var(--text)]">
              <input type="checkbox" className={`${checkbox} mt-0.5`} checked={rejectRemaining} onChange={(e) => setRejectRemaining(e.target.checked)} />
              <span>Classer les {activeCandidates} candidat(s) en cours (à traiter, présélection, entretien) comme « poste pourvu »<br />
                <span className="text-xs text-[var(--text-secondary)]">Les offres déjà envoyées ne sont pas touchées.</span></span>
            </label>
            <label className={`flex items-center gap-2 text-sm ${rejectRemaining ? 'text-[var(--text)]' : 'text-[var(--text-secondary)] opacity-60'}`}>
              <input type="checkbox" className={checkbox} checked={sendEmail && rejectRemaining} disabled={!rejectRemaining} onChange={(e) => setSendEmail(e.target.checked)} />
              Leur envoyer un e-mail courtois « poste pourvu »
            </label>
          </>
        ) : <p className="text-sm text-[var(--text)]">Aucun candidat en cours sur cette offre.</p>}
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Refuser plusieurs candidats d'un coup (avec e-mail courtois)
// ═════════════════════════════════════════════════════════════════════════════
export function BulkRejectModal({ ids, onClose, onDone }: { ids: string[]; onClose: () => void; onDone: () => void }) {
  const notify = useToast();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!reason) return notify('error', 'Choisissez le motif du refus');
    setSaving(true);
    try {
      const r = await api.post<{ done: number; emailsSent: number; failed: Array<{ message: string }> }>('/recruitment/bulk/move', {
        ids, status: 'REJECTED', rejectionReason: reason, note, sendEmail,
      });
      notify(
        r.failed.length ? 'error' : 'success',
        `${r.done} candidat(s) refusé(s)${sendEmail ? `, ${r.emailsSent} e-mail(s) envoyé(s)` : ''}`,
        r.failed.length ? `${r.failed.length} dossier(s) n’ont pas pu être traités : ${r.failed[0].message}` : undefined,
      );
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Refuser ${ids.length} candidat${ids.length > 1 ? 's' : ''}`}
      actions={<>
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button onClick={submit} loading={saving}>Confirmer les refus</Button>
      </>}>
      <div className="space-y-4">
        <Select label="Motif (le même pour tous)" required value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">Choisir un motif</option>
          {REJECTION_REASONS.filter((r) => r.code !== 'OFFER_DECLINED').map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </Select>
        <Textarea label="Note interne (optionnel)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-[var(--text)]">
          <input type="checkbox" className={checkbox} checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          Envoyer à chacun un e-mail de refus courtois
        </label>
        <p className="text-xs text-[var(--text-secondary)]">Chaque refus est noté dans la chronologie du candidat. Les candidats déjà embauchés sont ignorés.</p>
      </div>
    </Modal>
  );
}