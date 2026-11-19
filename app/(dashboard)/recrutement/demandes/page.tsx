'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';

// ============================================================================
// 📁 app/(dashboard)/recrutement/demandes/page.tsx
// DEMANDES DE RECRUTEMENT — le besoin, AVANT l'offre.
//   Manager : exprime le besoin (seul l'intitulé est obligatoire)
//   RH : valide ou refuse (avec raison) → crée l'offre à partir du besoin
//   Le suivi continue ensuite : offre liée, candidats, postes pourvus.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input, Select, Textarea } from '@/components/design-system/primitives';
import type { Tone } from '@/components/design-system/primitives';
import { Modal, useToast } from '@/components/design-system/feedback';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import {
  HR_ROLES, RecruitmentHeader, RecruitmentNav, errMsg, fmtDate, fmtMoney, readUserRole, timeAgo,
} from '@/components/recruitment/recruitment-ui';

interface Requisition {
  id: string; title: string; departmentId: string | null; departmentName: string | null; headcount: number;
  contractType: string | null; reason: string; priority: 'NORMAL' | 'URGENT'; justification: string | null;
  salaryMin: string | number | null; salaryMax: string | number | null; desiredStartDate: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';
  requestedByName: string | null; reviewedByName: string | null; reviewedAt: string | null; reviewNote: string | null;
  jobOfferId: string | null; createdAt: string;
  job: { id: string; title: string; status: string; candidates: number; hired: number } | null;
}

const STATUS: Record<Requisition['status'], { label: string; tone: Tone }> = {
  PENDING: { label: 'En attente', tone: 'warning' },
  APPROVED: { label: 'Validée', tone: 'success' },
  REJECTED: { label: 'Refusée', tone: 'danger' },
  FULFILLED: { label: 'Pourvue', tone: 'success' },
  CANCELLED: { label: 'Annulée', tone: 'neutral' },
};
const REASON: Record<string, string> = {
  REPLACEMENT: 'Remplacement', NEW_POSITION: 'Nouveau poste', REINFORCEMENT: 'Renfort d’équipe', SEASONAL: 'Besoin saisonnier',
};
const CONTRACT: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', CONSULTANT: 'Consultant', INTERIM: 'Intérim', PRESTATAIRE: 'Prestataire',
};
const FILTERS: Array<{ id: 'ALL' | Requisition['status']; label: string }> = [
  { id: 'ALL', label: 'Toutes' }, { id: 'PENDING', label: 'En attente' }, { id: 'APPROVED', label: 'Validées' },
  { id: 'FULFILLED', label: 'Pourvues' }, { id: 'REJECTED', label: 'Refusées' }, { id: 'CANCELLED', label: 'Annulées' },
];

export default function RequisitionsPage() {
  const notify = useToast();
  const [isHr, setIsHr] = useState(false);
  const [items, setItems] = useState<Requisition[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | Requisition['status']>('ALL');
  const [form, setForm] = useState<null | { requisition?: Requisition }>(null);
  const [reviewing, setReviewing] = useState<Requisition | null>(null);
  const [freeJobs, setFreeJobs] = useState<Array<{ id: string; title: string }>>([]);
  const [linkChoice, setLinkChoice] = useState<Record<string, string>>({});

  useEffect(() => { setIsHr(HR_ROLES.includes(readUserRole() ?? '')); }, []);

  const load = useCallback(async () => {
    try { setItems(await api.get<Requisition[]>('/recruitment/requisitions')); setError(''); }
    catch (e) { setError(errMsg(e)); setItems([]); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Offres publiées sans demande : proposées pour « lier à une offre existante »
  useEffect(() => {
    if (!isHr) return;
    api.get<Array<{ id: string; title: string; status: string; requisitionId: string | null }>>('/recruitment/jobs-overview')
      .then((j) => setFreeJobs((j ?? []).filter((x) => x.status === 'PUBLISHED' && !x.requisitionId).map((x) => ({ id: x.id, title: x.title }))))
      .catch(() => setFreeJobs([]));
  }, [isHr, items]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: items?.length ?? 0 };
    for (const r of items ?? []) m[r.status] = (m[r.status] ?? 0) + 1;
    return m;
  }, [items]);
  const visible = (items ?? []).filter((r) => filter === 'ALL' || r.status === filter);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); notify('success', ok); await load(); }
    catch (e) { notify('error', errMsg(e)); }
  };

  return (
    <ModulePageFrame kind="list" error={error || undefined}>
      <div className="mx-auto max-w-[1100px] space-y-6 pb-20">
        <RecruitmentHeader
          title="Demandes de recrutement"
          subtitle={isHr ? 'Les besoins exprimés par les équipes : validez-les, puis lancez l’offre.' : 'Exprimez un besoin : la RH le valide puis lance le recrutement.'}
          actions={<Button onClick={() => setForm({})}><Plus size={18} strokeWidth={1.5} /> Nouvelle demande</Button>}
        />
        <RecruitmentNav />

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par statut">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
              className={`min-h-10 rounded-xl border px-4 text-sm font-medium transition-colors ${filter === f.id ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--on-brand)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)]'}`}>
              {f.label}{counts[f.id] ? ` (${counts[f.id]})` : ''}
            </button>
          ))}
        </div>

        {items === null ? <KonzaLoader variant="section" /> : visible.length === 0 ? (
          <EmptyState title={filter === 'ALL' ? 'Aucune demande pour le moment' : 'Aucune demande dans ce statut'} icon={FileText}
            action={filter === 'ALL' ? <Button onClick={() => setForm({})}>Créer une demande</Button> : undefined}>
            {isHr ? 'Quand un manager exprime un besoin, vous le retrouvez ici pour le valider.' : 'Décrivez le poste dont votre équipe a besoin : seul l’intitulé est obligatoire.'}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {visible.map((r) => (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-[var(--text)]">{r.title}</h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {[r.departmentName, r.contractType ? CONTRACT[r.contractType] : null, REASON[r.reason]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.priority === 'URGENT' && <Badge tone="danger">Urgent</Badge>}
                    <Badge tone="info">{r.headcount} poste{r.headcount > 1 ? 's' : ''}</Badge>
                    <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                  </div>
                </div>

                {r.justification && <p className="mt-3 whitespace-pre-line text-sm text-[var(--text)]">{r.justification}</p>}

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-secondary)]">
                  <div>Demandée par {r.requestedByName ?? '—'} · {timeAgo(r.createdAt)}</div>
                  {(r.salaryMin || r.salaryMax) && <div>Budget : {fmtMoney(r.salaryMin)} – {fmtMoney(r.salaryMax)}</div>}
                  {r.desiredStartDate && <div>Prise de poste souhaitée : {fmtDate(r.desiredStartDate)}</div>}
                </dl>

                {(r.status === 'REJECTED' || (r.status === 'APPROVED' && r.reviewNote)) && r.reviewNote && (
                  <p className="mt-3 rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text)]">
                    <strong>{r.reviewedByName ?? 'La RH'} :</strong> {r.reviewNote}
                  </p>
                )}

                {r.job && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text)]">Offre : {r.job.title}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{r.job.hired}/{r.headcount} poste(s) pourvu(s) · {r.job.candidates} candidature(s)</p>
                    </div>
                    <Link href={`/recrutement/pipeline?job=${r.job.id}`} className="k-button k-button-secondary">Voir les candidats</Link>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {isHr && r.status === 'PENDING' && (
                    <>
                      <Button onClick={() => act(() => api.post(`/recruitment/requisitions/${r.id}/review`, { decision: 'APPROVED' }), 'Demande validée')}>Valider</Button>
                      <Button variant="secondary" onClick={() => setReviewing(r)}>Refuser…</Button>
                    </>
                  )}
                  {isHr && r.status === 'APPROVED' && !r.jobOfferId && (
                    <>
                      <Link href={`/recrutement/manuel/create?requisition=${r.id}`} className="k-button k-button-primary">Créer l’offre</Link>
                      <Link href={`/recrutement/ia/create?requisition=${r.id}`} className="k-button k-button-secondary">Créer l’offre avec l’IA</Link>
                      {freeJobs.length > 0 && (
                        <span className="flex items-center gap-2">
                          <ModuleSelect aria-label="Lier à une offre existante" value={linkChoice[r.id] ?? ''} onChange={(e) => setLinkChoice((c) => ({ ...c, [r.id]: e.target.value }))}
                            className="rounded-xl border border-[var(--border)] bg-transparent text-sm text-[var(--text)]" style={{ height: 40, padding: '6px 10px', maxWidth: 240 }}>
                            <option value="">Lier à une offre existante…</option>
                            {freeJobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                          </ModuleSelect>
                          <Button variant="ghost" disabled={!linkChoice[r.id]} onClick={() => act(() => api.post(`/recruitment/requisitions/${r.id}/link-job`, { jobOfferId: linkChoice[r.id] }), 'Offre liée à la demande')}>Lier</Button>
                        </span>
                      )}
                    </>
                  )}
                  {!isHr && r.status === 'PENDING' && <Button variant="secondary" onClick={() => setForm({ requisition: r })}>Modifier</Button>}
                  {(r.status === 'PENDING' || (r.status === 'APPROVED' && !r.jobOfferId)) && (
                    <Button variant="ghost" onClick={() => { if (window.confirm('Annuler cette demande ?')) void act(() => api.post(`/recruitment/requisitions/${r.id}/cancel`, {}), 'Demande annulée'); }}>Annuler la demande</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {form && <RequisitionForm requisition={form.requisition} isHr={isHr} onClose={() => setForm(null)} onDone={() => { setForm(null); void load(); }} />}
      {reviewing && <RefuseModal requisition={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); void load(); }} />}
    </ModulePageFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function RefuseModal({ requisition, onClose, onDone }: { requisition: Requisition; onClose: () => void; onDone: () => void }) {
  const notify = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!note.trim()) return notify('error', 'Indiquez la raison : le demandeur la verra');
    setSaving(true);
    try { await api.post(`/recruitment/requisitions/${requisition.id}/review`, { decision: 'REJECTED', note }); notify('success', 'Demande refusée'); onDone(); }
    catch (e) { notify('error', errMsg(e)); setSaving(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Refuser « ${requisition.title} »`}
      actions={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>Refuser la demande</Button></>}>
      <Textarea label="Raison du refus" rows={4} required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex : poste gelé ce trimestre, besoin couvert par une mobilité interne…" />
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function RequisitionForm({ requisition, isHr, onClose, onDone }: { requisition?: Requisition; isHr: boolean; onClose: () => void; onDone: () => void }) {
  const notify = useToast();
  const edit = !!requisition;
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    title: requisition?.title ?? '',
    headcount: String(requisition?.headcount ?? 1),
    reason: requisition?.reason ?? 'NEW_POSITION',
    priority: requisition?.priority ?? 'NORMAL',
    departmentId: requisition?.departmentId ?? '',
    contractType: requisition?.contractType ?? '',
    salaryMin: requisition?.salaryMin ? String(requisition.salaryMin) : '',
    salaryMax: requisition?.salaryMax ? String(requisition.salaryMax) : '',
    desiredStartDate: requisition?.desiredStartDate ? requisition.desiredStartDate.slice(0, 10) : '',
    justification: requisition?.justification ?? '',
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get<Array<{ id: string; name: string }>>('/departments').then((d) => setDepartments(d ?? [])).catch(() => setDepartments([]));
  }, []);

  const submit = async () => {
    if (!f.title.trim()) return notify('error', 'Indiquez l’intitulé du poste');
    setSaving(true);
    try {
      const body = {
        title: f.title, headcount: Number(f.headcount) || 1, reason: f.reason, priority: f.priority,
        departmentId: f.departmentId || null, contractType: f.contractType || null,
        salaryMin: f.salaryMin || null, salaryMax: f.salaryMax || null,
        desiredStartDate: f.desiredStartDate || null, justification: f.justification,
      };
      if (edit) await api.patch(`/recruitment/requisitions/${requisition!.id}`, body);
      else await api.post('/recruitment/requisitions', body);
      notify('success', edit ? 'Demande modifiée' : isHr ? 'Besoin enregistré et validé' : 'Demande envoyée à la RH');
      onDone();
    } catch (e) {
      notify('error', errMsg(e));
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={edit ? 'Modifier la demande' : 'Nouvelle demande de recrutement'}
      actions={<><Button variant="secondary" onClick={onClose}>Annuler</Button><Button onClick={submit} loading={saving}>{edit ? 'Enregistrer' : isHr ? 'Enregistrer' : 'Envoyer la demande'}</Button></>}>
      <div className="space-y-4">
        {!edit && isHr && <p className="rounded-xl bg-[var(--surface-2)] p-3 text-sm text-[var(--text-secondary)]">Créée par la RH : cette demande est validée d’office, vous pourrez lancer l’offre tout de suite.</p>}
        <Input label="Poste recherché" required value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex : Comptable, Chauffeur-livreur, Développeur…" maxLength={255} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Nombre de postes" type="number" min={1} max={100} value={f.headcount} onChange={(e) => set('headcount', e.target.value)} />
          <Select label="Motif" value={f.reason} onChange={(e) => set('reason', e.target.value)}>
            {Object.entries(REASON).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Select label="Priorité" value={f.priority} onChange={(e) => set('priority', e.target.value)}>
            <option value="NORMAL">Normale</option>
            <option value="URGENT">Urgente</option>
          </Select>
        </div>
        <Textarea label="Pourquoi ce besoin ? (optionnel)" rows={3} value={f.justification} onChange={(e) => set('justification', e.target.value)} placeholder="Départ à remplacer, nouveau projet, surcharge de l’équipe…" />

        <details className="rounded-xl border border-[var(--border)] p-3">
          <summary className="cursor-pointer text-sm font-medium text-[var(--text)]">Plus de détails (optionnel)</summary>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Département" value={f.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
              <option value="">Aucun / à définir</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select label="Type de contrat" value={f.contractType} onChange={(e) => set('contractType', e.target.value)}>
              <option value="">À définir</option>
              {Object.entries(CONTRACT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
            <Input label="Salaire mensuel minimum (FCFA)" type="number" min={0} value={f.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} />
            <Input label="Salaire mensuel maximum (FCFA)" type="number" min={0} value={f.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} />
            <div className="sm:col-span-2"><Input label="Prise de poste souhaitée" type="date" value={f.desiredStartDate} onChange={(e) => set('desiredStartDate', e.target.value)} /></div>
          </div>
        </details>
      </div>
    </Modal>
  );
}
