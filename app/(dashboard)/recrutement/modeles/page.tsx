'use client';

// ============================================================================
// 📁 app/(dashboard)/recrutement/modeles/page.tsx
// MODÈLES D'E-MAILS — chaque entreprise parle à ses candidats avec son propre ton.
//   Les modèles servent partout : « Écrire », refus, offre, clôture d'offre,
//   rappel automatique d'entretien. Variables : {{prenom}} {{poste}} {{entreprise}}…
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mail } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';
import { RecruitmentHeader, RecruitmentNav, errMsg } from '@/components/recruitment/recruitment-ui';

interface Template {
  id: string; label: string; description: string; subject: string; body: string;
  defaultSubject: string; defaultBody: string; customized: boolean;
}

const VARIABLES: Array<{ key: string; label: string; sample: string }> = [
  { key: 'prenom', label: 'Prénom', sample: 'Marie' },
  { key: 'nom', label: 'Nom', sample: 'Mavoungou' },
  { key: 'poste', label: 'Poste', sample: 'Comptable' },
  { key: 'entreprise', label: 'Entreprise', sample: 'Votre entreprise' },
  { key: 'recruteur', label: 'Recruteur', sample: 'Votre nom' },
  { key: 'date_entretien', label: 'Date de l’entretien', sample: 'jeudi 20 novembre 2026' },
  { key: 'heure_entretien', label: 'Heure de l’entretien', sample: '10:00' },
  { key: 'lieu', label: 'Lieu / lien', sample: 'Siège, salle 2' },
  { key: 'salaire', label: 'Salaire proposé', sample: '450 000 FCFA' },
  { key: 'date_debut', label: 'Date de début', sample: 'lundi 1 décembre 2026' },
];

const fill = (text: string) => text.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, k: string) => VARIABLES.find((v) => v.key === k)?.sample ?? '');

export default function EmailTemplatesPage() {
  const notify = useToast();
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState('');
  const [currentId, setCurrentId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const select = useCallback((t: Template) => { setCurrentId(t.id); setSubject(t.subject); setBody(t.body); }, []);

  const load = useCallback(async (keepId?: string) => {
    try {
      const list = await api.get<Template[]>('/recruitment/email-templates');
      setTemplates(list);
      const t = list.find((x) => x.id === (keepId ?? '')) ?? list[0];
      if (t) select(t);
      setError('');
    } catch (e) { setError(errMsg(e)); setTemplates([]); }
  }, [select]);
  useEffect(() => { void load(); }, [load]);

  const current = templates?.find((t) => t.id === currentId);
  const dirty = !!current && (subject !== current.subject || body !== current.body);

  const pick = (t: Template) => {
    if (dirty && !window.confirm('Vous avez des modifications non enregistrées. Les abandonner ?')) return;
    select(t);
  };

  const insertVar = (key: string) => {
    const el = bodyRef.current;
    const token = `{{${key}}}`;
    if (!el) { setBody((b) => b + token); return; }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + token.length, start + token.length); });
  };

  const save = async () => {
    if (!subject.trim() || !body.trim()) return notify('error', 'L’objet et le message sont obligatoires');
    setSaving(true);
    try { await api.put(`/recruitment/email-templates/${currentId}`, { subject, body }); notify('success', 'Modèle enregistré'); await load(currentId); }
    catch (e) { notify('error', errMsg(e)); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!window.confirm('Rétablir le modèle d’origine ? Votre version sera supprimée.')) return;
    try { await api.delete(`/recruitment/email-templates/${currentId}`); notify('success', 'Modèle d’origine rétabli'); await load(currentId); }
    catch (e) { notify('error', errMsg(e)); }
  };

  return (
    <ModulePageFrame kind="list" error={error || undefined}>
      <div className="mx-auto max-w-[1300px] space-y-6 pb-20">
        <RecruitmentHeader title="Modèles d’e-mails" subtitle="Adaptez le ton de vos messages aux candidats : refus, convocation, offre, rappel d’entretien…" />
        <RecruitmentNav />

        {templates === null ? <KonzaLoader variant="section" /> : templates.length === 0 ? (
          <EmptyState title="Modèles indisponibles" icon={Mail}>Rechargez la page ou vérifiez vos droits (réservé à la RH).</EmptyState>
        ) : (
          <div className="recruitment-mail-layout">
            <nav aria-label="Modèles" className="space-y-2">
              {templates.map((t) => (
                <button key={t.id} type="button" onClick={() => pick(t)} aria-current={t.id === currentId ? 'true' : undefined}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${t.id === currentId ? 'border-[var(--brand)] bg-[var(--surface-2)]' : 'border-[var(--border)] hover:bg-[var(--surface-2)]'}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--text)]">{t.label}</span>
                    {t.customized && <Badge tone="info">Personnalisé</Badge>}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{t.description}</span>
                </button>
              ))}
            </nav>

            {current && (
              <div className="recruitment-mail-editor min-w-0">
                <Card title={current.label}>
                  <div className="space-y-4">
                    <Input label="Objet" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={255} />
                    <div>
                      <label htmlFor="tpl-body" className="mb-1.5 block text-sm font-medium text-[var(--text)]">Message</label>
                      <textarea id="tpl-body" ref={bodyRef} rows={14} value={body} onChange={(e) => setBody(e.target.value)} maxLength={6000}
                        className="w-full rounded-xl border border-[var(--border)] bg-transparent text-[var(--text)]" />
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-[var(--text-secondary)]">Cliquez pour insérer une variable à l’endroit du curseur — elle est remplacée automatiquement à l’envoi :</p>
                      <div className="flex flex-wrap gap-2">
                        {VARIABLES.map((v) => (
                          <button key={v.key} type="button" onClick={() => insertVar(v.key)} title={`Exemple : ${v.sample}`}
                            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text)] hover:border-[var(--brand)]">
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {current.customized && <Button variant="ghost" onClick={reset}>Rétablir le modèle d’origine</Button>}
                      <Button onClick={save} loading={saving} disabled={!dirty}>Enregistrer</Button>
                    </div>
                  </div>
                </Card>

                <Card title="Aperçu (avec des exemples)">
                  <p className="mb-3 text-sm font-medium text-[var(--text)]">{fill(subject)}</p>
                  <p className="whitespace-pre-line rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--text)]">{fill(body)}</p>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </ModulePageFrame>
  );
}