'use client';

// ============================================================================
// 📁 hooks/useApprovalDecision.tsx — LOT B
// Décision via l'orchestrateur (POST /approvals/requests/:type/:id/decision).
//   - Sans circuit configuré : le back décide tout de suite, EXACTEMENT comme
//     avant → aucune fenêtre, aucun changement visible.
//   - Avec circuit et des avis manquants : une fenêtre explique pourquoi les
//     avis sont utiles et propose « Attendre les avis » ou « Valider sans
//     attendre (urgence) ».
// Usage :
//   const { decide, dialog } = useApprovalDecision();
//   const out = await decide('loan', id, { decision: 'APPROVE', recoverViaPayroll });
//   ...
//   return (<> ... {dialog} </>);
// ============================================================================

import React, { useCallback, useState } from 'react';
import { Clock, Zap, X, Loader2 } from 'lucide-react';
import { approvalsApi, ApprovalKind, DecisionBody } from '@/services/approvals';

export type DecideOutcome =
  | { outcome: 'DONE'; forced?: boolean }
  | { outcome: 'WAITING' }
  | { outcome: 'CANCELLED' };

interface PendingChoice {
  missing: { code: string; label: string; holders: string[] }[];
  resolve: (mode: 'WAIT' | 'NOW' | null) => void;
}

export function useApprovalDecision() {
  const [choice, setChoice] = useState<PendingChoice | null>(null);
  const [busy, setBusy] = useState(false);

  const decide = useCallback(
    async (
      kind: ApprovalKind,
      id: string,
      body: Omit<DecisionBody, 'mode'>,
    ): Promise<DecideOutcome> => {
      const first = await approvalsApi.decide(kind, id, { ...body, mode: 'ASK' });

      if (first.status === 'FINALIZED') return { outcome: 'DONE' };
      if (first.status === 'WAITING_OPINIONS') return { outcome: 'WAITING' };

      // NEEDS_CHOICE → on demande à la personne
      const mode = await new Promise<'WAIT' | 'NOW' | null>((resolve) => {
        setChoice({ missing: first.missing, resolve });
      });
      if (!mode) {
        setChoice(null);
        return { outcome: 'CANCELLED' };
      }

      setBusy(true);
      try {
        const second = await approvalsApi.decide(kind, id, { ...body, mode });
        if (second.status === 'WAITING_OPINIONS') return { outcome: 'WAITING' };
        return { outcome: 'DONE', forced: mode === 'NOW' };
      } finally {
        setBusy(false);
        setChoice(null);
      }
    },
    [],
  );

  const dialog = choice ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-[var(--text)]">Des avis sont encore attendus</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Avant de valider, il manque l&apos;avis de :
            </p>
          </div>
          <button
            onClick={() => choice.resolve(null)}
            disabled={busy}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <ul className="space-y-2 mb-4">
          {choice.missing.map((m) => (
            <li
              key={m.code}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]"
            >
              <span className="text-sm font-bold text-[var(--text)]">{m.label}</span>
              <span className="text-xs text-[var(--text-muted)] text-right">
                {m.holders.length > 0 ? m.holders.join(', ') : '—'}
              </span>
            </li>
          ))}
        </ul>

        <p className="text-sm text-[var(--text-muted)] mb-5 leading-relaxed">
          Ces avis éclairent votre décision (par exemple la disponibilité des fonds).
          Si vous attendez, la demande sera finalisée automatiquement une fois les avis
          donnés, et <strong className="text-[var(--text)]">ne sera comptabilisée qu&apos;à ce moment-là</strong>.
          Si c&apos;est urgent, vous pouvez valider sans attendre.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => choice.resolve('WAIT')}
            disabled={busy}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
            Attendre les avis
          </button>
          <button
            onClick={() => choice.resolve('NOW')}
            disabled={busy}
            className="w-full py-3 border border-[var(--border)] hover:bg-[var(--surface-2)] disabled:opacity-60 text-[var(--text)] font-bold text-sm rounded-xl flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Valider sans attendre (urgence)
          </button>
          <button
            onClick={() => choice.resolve(null)}
            disabled={busy}
            className="w-full py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { decide, dialog };
}
