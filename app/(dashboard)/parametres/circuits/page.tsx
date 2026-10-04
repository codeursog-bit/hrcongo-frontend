'use client';

// ============================================================================
// 📁 app/(dashboard)/parametres/circuits/page.tsx — LOT B
// L'admin choisit, pour chaque type de demande, quels avis sont demandés et
// dans quel ordre (ex. prêts = Comptable → RH → DG ; avances = RH → DG).
// Sans circuit actif, le comportement actuel reste STRICTEMENT inchangé.
// Les avis sont consultatifs : la décision finale reste à l'Admin / Manager RH.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, ListChecks, Plus, Trash2, UserX, Save, Info } from 'lucide-react';
import { useAlert } from '@/components/providers/AlertProvider';
import { approvalsApi, CircuitsConfig, ApprovalKind } from '@/services/approvals';

type TypeKey = 'LOAN' | 'ADVANCE' | 'ABSENCE' | 'LEAVE';
const TYPES: { key: TypeKey; kind: ApprovalKind; title: string; desc: string }[] = [
  { key: 'LOAN', kind: 'loan', title: 'Prêts', desc: 'Avis demandés avant la décision sur un prêt.' },
  { key: 'ADVANCE', kind: 'advance', title: 'Avances', desc: 'Avis demandés avant la décision sur une avance.' },
  { key: 'ABSENCE', kind: 'absence', title: 'Absences', desc: 'Avis demandés avant la décision sur une demande d’absence.' },
  { key: 'LEAVE', kind: 'leave', title: 'Congés', desc: 'Avis demandés avant la décision sur une demande de congé (repos). L’indemnité ne dépend que du planning.' },
];

export default function CircuitsPage() {
  const router = useRouter();
  const alert = useAlert();
  const [config, setConfig] = useState<CircuitsConfig | null>(null);
  const [draft, setDraft] = useState<Record<TypeKey, { isActive: boolean; steps: string[] }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<TypeKey | null>(null);

  const load = async () => {
    try {
      const c = await approvalsApi.getCircuits();
      setConfig(c);
      setDraft({
        LOAN: { ...c.circuits.LOAN, steps: [...c.circuits.LOAN.steps] },
        ADVANCE: { ...c.circuits.ADVANCE, steps: [...c.circuits.ADVANCE.steps] },
        ABSENCE: { ...(c.circuits.ABSENCE ?? { isActive: false, steps: [] }), steps: [...(c.circuits.ABSENCE?.steps ?? [])] },
        LEAVE: { ...(c.circuits.LEAVE ?? { isActive: false, steps: [] }), steps: [...(c.circuits.LEAVE?.steps ?? [])] },
      });
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de charger les circuits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !config || !draft) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const labelOf = (code: string) => config.catalog.find((f) => f.code === code)?.label ?? code;
  const dirty = (k: TypeKey) =>
    JSON.stringify(draft[k]) !== JSON.stringify(config.circuits[k] ?? { isActive: false, steps: [] });

  const update = (k: TypeKey, patch: Partial<{ isActive: boolean; steps: string[] }>) =>
    setDraft((d) => (d ? { ...d, [k]: { ...d[k], ...patch } } : d));

  const move = (k: TypeKey, i: number, dir: -1 | 1) => {
    const steps = [...draft[k].steps];
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    [steps[i], steps[j]] = [steps[j], steps[i]];
    update(k, { steps });
  };

  const save = async (t: (typeof TYPES)[number]) => {
    setSaving(t.key);
    try {
      await approvalsApi.saveCircuit(t.kind, draft[t.key]);
      await load();
      alert.success('Circuit enregistré', `Le circuit « ${t.title} » a été mis à jour.`);
    } catch (e: any) {
      alert.error('Erreur', e?.message || "Impossible d'enregistrer le circuit.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Circuits de validation</h1>
          <p className="text-sm text-[var(--text-muted)]">Quels avis demander, et dans quel ordre.</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex items-start gap-3">
        <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Les avis sont <strong className="text-[var(--text)]">consultatifs</strong> : la décision finale (approuver ou refuser)
          reste à l&apos;administrateur ou au manager RH. Sans circuit actif, tout fonctionne comme avant.
          Une étape sans titulaire est ignorée. Les fonctions s&apos;attribuent dans « Gestion Utilisateurs ».
        </p>
      </div>

      {TYPES.map((t) => {
        const d = draft[t.key];
        const available = config.catalog.filter((f) => !d.steps.includes(f.code));
        return (
          <div key={t.key} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                  <ListChecks size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">{t.title}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{t.desc}</p>
                </div>
              </div>
              <button
                type="button"
                disabled={!config.canEdit}
                onClick={() => update(t.key, { isActive: !d.isActive })}
                className={`shrink-0 w-12 h-7 rounded-full flex items-center px-0.5 transition-colors disabled:opacity-50 ${d.isActive ? 'bg-emerald-500 justify-end' : 'bg-[var(--border)] justify-start'}`}
                aria-label={d.isActive ? 'Désactiver le circuit' : 'Activer le circuit'}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow" />
              </button>
            </div>

            {d.steps.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] bg-[var(--surface-2)] border border-dashed border-[var(--border)] rounded-xl p-4 text-center">
                Aucune étape — le circuit n&apos;a aucun effet.
              </p>
            ) : (
              <ol className="space-y-2">
                {d.steps.map((code, i) => {
                  const holders = config.holdersByCode[code] ?? [];
                  return (
                    <li key={code} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                      <span className="w-7 h-7 shrink-0 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--text)]">{labelOf(code)}</p>
                        <p className={`text-xs truncate flex items-center gap-1 ${holders.length ? 'text-[var(--text-muted)]' : 'text-amber-600'}`}>
                          {holders.length ? holders.join(', ') : (<><UserX size={12} /> Aucun titulaire — étape ignorée</>)}
                        </p>
                      </div>
                      {config.canEdit && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => move(t.key, i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-[var(--surface)] disabled:opacity-30 text-[var(--text-muted)]" aria-label="Monter"><ArrowUp size={16} /></button>
                          <button onClick={() => move(t.key, i, 1)} disabled={i === d.steps.length - 1} className="p-1.5 rounded-lg hover:bg-[var(--surface)] disabled:opacity-30 text-[var(--text-muted)]" aria-label="Descendre"><ArrowDown size={16} /></button>
                          <button onClick={() => update(t.key, { steps: d.steps.filter((c) => c !== code) })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" aria-label="Retirer"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            {config.canEdit && available.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {available.map((f) => (
                  <button
                    key={f.code}
                    onClick={() => update(t.key, { steps: [...d.steps, f.code] })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text)] hover:bg-[var(--surface-2)]"
                  >
                    <Plus size={13} /> {f.label}
                  </button>
                ))}
              </div>
            )}

            {config.canEdit ? (
              <button
                onClick={() => save(t)}
                disabled={!dirty(t.key) || saving !== null}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                {saving === t.key ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Seul l&apos;administrateur peut modifier les circuits.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
