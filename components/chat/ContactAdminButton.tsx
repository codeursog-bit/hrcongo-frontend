'use client';

// components/chat/ContactAdminButton.tsx
// Bouton « Contacter l'administration » affiché à l'employé sur SES demandes
// (congé, permission, absence, prêt, avance…) tant qu'elles sont EN ATTENTE ou
// REFUSÉES : il peut ainsi s'expliquer ou se justifier par la messagerie.
//
// Fonctionnement :
//   • Demande REFUSÉE + id de la personne qui a refusé  → on ouvre directement
//     la discussion avec elle (POST /chat/conversations).
//   • Sinon, ou si la discussion ne peut pas s'ouvrir (la personne n'est pas
//     joignable par la messagerie : rôle hors chat, autre entreprise…)
//     → on ouvre la messagerie sur la liste des contacts (Administration / RH
//     en tête) pour que l'employé choisisse.
//   • Dans les deux cas le message est PRÉ-REMPLI (modifiable) avec la demande
//     concernée ; rien n'est envoyé automatiquement.
//
// Masqué automatiquement quand la messagerie n'est pas disponible (rôle sans
// accès au chat, espace PME/cabinet où le ChatProvider n'est pas monté).

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { MAX_MESSAGE_LENGTH, chatApi } from '@/services/chat-api';
import { useChat } from '@/components/chat/ChatProvider';

interface ContactAdminButtonProps {
  /** Statut de la demande : seuls PENDING / PENDING_DG / REJECTED affichent le bouton */
  status?: string | null;
  /** Ex. « ma demande de congé du 12/10/2026 au 15/10/2026 » — insérée dans le message */
  requestLabel: string;
  /** id (User) de la personne qui a refusé : permet d'ouvrir directement la discussion avec elle */
  decidedByUserId?: string | null;
  /** block : encadré avec phrase d'aide (panneau de détail) — compact : simple bouton (ligne de liste) */
  variant?: 'block' | 'compact';
  className?: string;
}

export default function ContactAdminButton({
  status,
  requestLabel,
  decidedByUserId,
  variant = 'block',
  className = '',
}: ContactAdminButtonProps) {
  const router = useRouter();
  const { enabled } = useChat();
  const [busy, setBusy] = useState(false);

  const isRejected = status === 'REJECTED';
  const isPending = status === 'PENDING' || status === 'PENDING_DG';
  if (!enabled || (!isRejected && !isPending)) return null;

  const message = (isRejected
    ? `Bonjour, je vous contacte au sujet de ${requestLabel}, qui a été refusée. Je souhaiterais vous apporter quelques précisions : `
    : `Bonjour, je me permets de vous contacter au sujet de ${requestLabel}, toujours en attente de traitement. `
  ).slice(0, MAX_MESSAGE_LENGTH);

  const go = async () => {
    if (busy) return;
    setBusy(true);
    const draft = encodeURIComponent(message);
    try {
      // B — demande refusée : on ouvre directement la discussion avec la personne qui a refusé
      if (isRejected && decidedByUserId) {
        try {
          const conv = await chatApi.open(decidedByUserId);
          router.push(`/messages?c=${conv.id}&draft=${draft}`);
          return;
        } catch {
          /* pas joignable par la messagerie → repli A */
        }
      }
      // A — sinon : liste des contacts (Administration / RH en tête), message pré-rempli
      router.push(`/messages?new=1&draft=${draft}`);
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : MessageCircle;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-60 ${className}`}
      >
        <Icon size={12} className={busy ? 'animate-spin' : ''} /> Contacter l&apos;administration
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 ${
        isRejected
          ? 'border-red-100 bg-red-50/60 dark:border-red-900/40 dark:bg-red-900/10'
          : 'border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-900/10'
      } ${className}`}
    >
      <p className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>
        {isRejected
          ? 'Vous souhaitez vous justifier ou demander un réexamen ? Écrivez à l’administration.'
          : 'Un complément d’information à apporter sur cette demande ? Écrivez à l’administration.'}
      </p>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition-colors shrink-0"
      >
        <Icon size={15} className={busy ? 'animate-spin' : ''} /> Contacter l&apos;administration
      </button>
    </div>
  );
}