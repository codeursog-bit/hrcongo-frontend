'use client';

// ============================================================================
// 📁 components/contracts/ContractRenewalModal.tsx
// Renouvellement d'un CDD OU conversion en CDI, sur le DERNIER maillon d'une chaîne.
//  - Simulation en direct (POST …/renewal/preview) : blocages et avertissements du
//    back affichés avec leur code, leur référence légale et leur caractère
//    « surmontable » ; rien n'est écrit tant qu'on ne valide pas.
//  - Un blocage de procédure ne peut être régularisé que par un ADMIN, avec motif.
// ============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Loader2, RotateCcw, Infinity as InfinityIcon, AlertTriangle, ShieldAlert,
  Scale, CheckCircle2, Info,
} from 'lucide-react';
import {
  contractChainService, violationsOf,
  type ChainRules, type ContractLink, type RenewalPreview, type RuleViolation,
} from '@/services/contract-chain';
import { fmtDate } from '@/lib/audit-labels';

type Mode = 'RENEW' | 'CONVERT';

const addDaysIso = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export function ViolationList({ violations }: { violations: RuleViolation[] }) {
  if (violations.length === 0) return null;
  return (
    <ul className="space-y-2">
      {violations.map((v, i) => {
        const block = v.level === 'BLOCK';
        return (
          <li key={`${v.code}-${i}`}
            className={`rounded-xl border p-3 text-sm ${block
              ? 'border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
              : 'border-[var(--border)] bg-[var(--surface-2)]'}`}>
            <div className="flex items-start gap-2">
              {block
                ? <ShieldAlert className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />
                : <AlertTriangle className="w-4 h-4 mt-0.5 text-[var(--text-muted)] shrink-0" />}
              <div className="min-w-0">
                <p className={block ? 'font-semibold text-red-700 dark:text-red-400' : 'font-semibold text-[var(--text)]'}>{v.message}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[var(--text-muted)]">
                  <span className="font-mono">{v.code}</span>
                  <span>{block ? 'Bloquant' : 'Avertissement'}</span>
                  {block && <span>{v.overridable ? 'Régularisable par un administrateur' : 'Non régularisable'}</span>}
                  {v.legalRef && <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {v.legalRef}</span>}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const input = 'w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]';
const label = 'block text-xs font-semibold text-[var(--text-muted)] mb-1';

export default function ContractRenewalModal({
  last, rules, canOverride, initialMode = 'RENEW', onClose, onDone,
}: {
  last: ContractLink; // dernier maillon de la chaîne
  rules: ChainRules | null;
  canOverride: boolean; // ADMIN / SUPER_ADMIN
  initialMode?: Mode;
  onClose: () => void;
  onDone: (result: { mode: Mode; warnings: RuleViolation[] }) => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const defaultStart = last.endDate ? addDaysIso(last.endDate, 1) : '';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cddMotif, setCddMotif] = useState(last.cddMotif ?? '');
  const [reason, setReason] = useState('');
  const [signedAt, setSignedAt] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [position, setPosition] = useState('');
  const [notes, setNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const [preview, setPreview] = useState<RenewalPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refused, setRefused] = useState<RuleViolation[]>([]);

  const salaryNumber = baseSalary.trim() === '' ? undefined : Number(baseSalary);
  const salaryInvalid = salaryNumber !== undefined && (!Number.isFinite(salaryNumber) || salaryNumber < 0);

  // Simulation en direct (renouvellement uniquement), avec anti-rebond.
  useEffect(() => {
    if (mode !== 'RENEW' || !endDate) { setPreview(null); return; }
    let alive = true;
    setPreviewing(true);
    const t = setTimeout(async () => {
      try {
        const r = await contractChainService.preview(last.id, {
          startDate, endDate, cddMotif, reason: reason || 'simulation', signedAt,
        });
        if (alive) { setPreview(r); setError(null); }
      } catch (e: any) {
        if (alive) { setPreview(null); setError(e?.message || 'Simulation impossible'); }
      } finally { if (alive) setPreviewing(false); }
    }, 450);
    return () => { alive = false; clearTimeout(t); };
  }, [mode, last.id, startDate, endDate, cddMotif, signedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocking = useMemo(() => (preview?.violations ?? []).filter(v => v.level === 'BLOCK'), [preview]);
  const needsOverride = !!preview && !preview.allowed && preview.overridableOnly;
  const hardBlocked = !!preview && !preview.allowed && !preview.overridableOnly;

  const canSubmit =
    !submitting && reason.trim().length >= 5 && !salaryInvalid &&
    (mode === 'CONVERT' || (!!endDate && !!preview && !hardBlocked &&
      (!needsOverride || (canOverride && overrideReason.trim().length >= 10))));

  async function submit() {
    setSubmitting(true); setError(null); setRefused([]);
    try {
      if (mode === 'RENEW') {
        const r = await contractChainService.renew(last.id, {
          startDate, endDate, cddMotif, reason, signedAt,
          baseSalary: salaryNumber, position, notes,
          overrideReason: needsOverride ? overrideReason : undefined,
        });
        onDone({ mode, warnings: r.warnings });
      } else {
        await contractChainService.convertToCdi(last.id, {
          startDate, reason, signedAt, baseSalary: salaryNumber, position, notes,
        });
        onDone({ mode, warnings: [] });
      }
    } catch (e: any) {
      setError(e?.message || 'Opération refusée');
      setRefused(violationsOf(e));
    } finally { setSubmitting(false); }
  }

  const shortCap = rules?.motifs.find(m => m.code === cddMotif)?.shortCap;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl">
        <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)] p-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[var(--text)]">Renouvellement de contrat</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Contrat de rang {last.rank} · {last.contractType} · {fmtDate(last.startDate)} → {fmtDate(last.endDate)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface-2)] text-[var(--text-muted)]"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {([
              ['RENEW', 'Renouveler le CDD', RotateCcw],
              ['CONVERT', 'Convertir en CDI', InfinityIcon],
            ] as const).map(([m, text, Icon]) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(null); setRefused([]); }}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border transition-colors ${mode === m
                  ? 'bg-[var(--brand)] text-white border-transparent'
                  : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]'}`}>
                <Icon className="w-4 h-4" /> {text}
              </button>
            ))}
          </div>

          {rules && mode === 'RENEW' && (
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)] flex gap-2">
              <Scale className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Limites légales : {rules.limits.MAX_RENEWALS} renouvellement maximum, durée ≤ période initiale,
                {' '}{rules.limits.MAX_TOTAL_MONTHS} mois au total
                {shortCap && <> ; pour ce motif, {rules.limits.SHORT_MOTIF_MAX_MONTHS} mois au total</>}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Début {mode === 'RENEW' ? 'du renouvellement' : 'du CDI'}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={input} />
              {defaultStart && <p className="text-[11px] text-[var(--text-muted)] mt-1">Par défaut : {fmtDate(defaultStart)} (lendemain de la fin)</p>}
            </div>
            {mode === 'RENEW' && (
              <div>
                <label className={label}>Fin du renouvellement *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={input} />
              </div>
            )}
            {mode === 'RENEW' && (
              <div className="sm:col-span-2">
                <label className={label}>Motif du CDD</label>
                <select value={cddMotif} onChange={e => setCddMotif(e.target.value)} className={input}>
                  <option value="">— Non renseigné —</option>
                  {(rules?.motifs ?? []).map(m => (
                    <option key={m.code} value={m.code}>{m.label}{m.shortCap ? ` (plafond ${rules?.limits.SHORT_MOTIF_MAX_MONTHS} mois)` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={label}>Raison {mode === 'RENEW' ? 'du renouvellement' : 'de la conversion'} * (5 caractères min.)</label>
              <input value={reason} onChange={e => setReason(e.target.value)} maxLength={255} className={input} />
            </div>
            <div>
              <label className={label}>Date de signature de l'avenant</label>
              <input type="date" value={signedAt} onChange={e => setSignedAt(e.target.value)} className={input} />
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Doit précéder la fin du contrat actuel.</p>
            </div>
            <div>
              <label className={label}>Nouveau salaire de base (FCFA)</label>
              <input inputMode="decimal" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} placeholder={`Actuel : ${Number(last.baseSalary).toLocaleString('fr-FR')}`} className={input} />
              {salaryInvalid && <p className="text-[11px] text-red-600 mt-1">Montant invalide</p>}
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Nouveau poste</label>
              <input value={position} onChange={e => setPosition(e.target.value)} maxLength={100} placeholder={`Actuel : ${last.position}`} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} rows={2} className={input} />
            </div>
          </div>

          {mode === 'RENEW' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] h-4">
                {previewing && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification des règles…</>}
                {!previewing && preview && preview.violations.length === 0 && (
                  <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Aucune règle enfreinte</span>
                )}
                {!endDate && <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Renseignez la date de fin pour lancer la vérification.</span>}
              </div>
              {preview && <ViolationList violations={preview.violations} />}

              {needsOverride && (
                <div className="rounded-xl border border-[var(--border)] p-3 space-y-2">
                  <p className="text-sm font-semibold text-[var(--text)]">Régularisation d'un blocage de procédure</p>
                  {canOverride ? (
                    <>
                      <p className="text-xs text-[var(--text-muted)]">
                        Réservé aux administrateurs. Le motif est obligatoire et l'événement sera enregistré comme critique dans le journal d'audit.
                      </p>
                      <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)} rows={2} maxLength={500}
                        placeholder="Motif de la régularisation (10 caractères min.)" className={input} />
                    </>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">Seul un administrateur peut passer outre ce blocage. Contactez-le pour régulariser.</p>
                  )}
                </div>
              )}
              {blocking.length > 0 && hardBlocked && (
                <p className="text-xs text-red-600">Un blocage légal empêche ce renouvellement : corrigez les dates ou passez en CDI.</p>
              )}
            </div>
          )}

          {mode === 'CONVERT' && (
            <p className="text-xs text-[var(--text-muted)] flex gap-2"><Info className="w-4 h-4 shrink-0" />
              Le CDD actuel sera clos (« Converti en CDI ») et un CDI de rang {last.rank + 1} sera créé dans la même chaîne, avec la même ancienneté.
            </p>
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>
              <ViolationList violations={refused} />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] p-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">Annuler</button>
          <button onClick={submit} disabled={!canSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'RENEW' ? (needsOverride ? 'Régulariser et renouveler' : 'Renouveler le contrat') : 'Convertir en CDI'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}