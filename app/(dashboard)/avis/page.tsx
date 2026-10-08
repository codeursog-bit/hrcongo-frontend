'use client';

// ============================================================================
// 📁 app/(dashboard)/avis/page.tsx — LOT B
// « Avis à donner » : demandes (prêts, avances, absences, congés) en attente sur lesquelles
// l'utilisateur est sollicité en raison de sa fonction (comptable, RH, DG…).
// L'avis est consultatif : il ne permet ni d'approuver ni de refuser.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquare, ChevronDown, ChevronUp, Inbox, Clock } from 'lucide-react';
import { InboxItem, ApprovalKind } from '@/services/approvals';
import { api } from '@/services/api';
import ApprovalPanel from '@/components/approvals/ApprovalPanel';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
const kindOf = (t: InboxItem['requestType']): ApprovalKind =>
  t === 'LOAN' ? 'loan' : t === 'ADVANCE' ? 'advance' : t === 'LEAVE' ? 'leave' : 'absence';
const labelOf = (t: InboxItem['requestType']) =>
  t === 'LOAN' ? 'Prêt' : t === 'ADVANCE' ? 'Avance' : t === 'LEAVE' ? 'Congé' : 'Absence';
// Élément de la boîte « toutes entreprises » : la sienne + celles où l'admin lui a donné une fonction d'avis.
type AvisItem = InboxItem & { companyId?: string; companyName?: string; external?: boolean };
const keyOf = (i: AvisItem) => `${i.companyId ?? ''}:${i.requestType}:${i.requestId}`;

export default function AvisPage() {
  const [items, setItems] = useState<AvisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      let res: { items: AvisItem[] };
      try {
        res = await api.get<{ items: AvisItem[] }>('/approvals/inbox/all');
      } catch {
        // Backend pas encore à jour → boîte habituelle (sa propre entreprise).
        res = await api.get<{ items: AvisItem[] }>('/approvals/inbox');
      }
      setItems(res.items || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger vos avis à donner.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Avis à donner</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Demandes sur lesquelles votre avis est sollicité. La décision finale revient à l&apos;administrateur ou au manager RH.
        </p>
      </div>

      {error && (
        <p className="text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-3">{error}</p>
      )}

      {items.length === 0 && !error ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center">
          <Inbox size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-60" />
          <p className="text-sm font-bold text-[var(--text)]">Rien à traiter pour le moment</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Vous serez notifié dès qu&apos;un avis vous sera demandé.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => {
            const k = keyOf(it);
            const isOpen = openKey === k;
            return (
              <li key={k} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenKey(isOpen ? null : k)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        {labelOf(it.requestType)}
                      </span>
                      <span className="text-sm font-bold text-[var(--text)] truncate">{it.employeeName}</span>
                      {it.external && it.companyName && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
                          {it.companyName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text)] mt-1">{it.detail}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Demandé le {fmtDate(it.createdAt)} · Avis attendu : {it.myMissing.map((m) => m.label).join(', ')}
                    </p>
                    {it.awaitingDecisionBy && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {it.awaitingDecisionBy} a déjà validé et n&apos;attend plus que les avis
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-[var(--text-muted)] flex items-center gap-2">
                    <MessageSquare size={16} />
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 border-t border-[var(--border)]">
                    {it.reason && (
                      <p className="text-sm text-[var(--text-muted)] mb-3">
                        <span className="font-bold text-[var(--text)]">Motif : </span>
                        {it.reason}
                      </p>
                    )}
                    <ApprovalPanel
                      kind={kindOf(it.requestType)}
                      requestId={it.requestId}
                      companyId={it.external ? it.companyId : undefined}
                      onChanged={load}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}