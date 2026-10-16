'use client';

// ============================================================================
// 📁 components/AccessDenied.tsx
// ✅ Écran « Accès refusé » (403) affiché À LA PLACE de la page quand le rôle
//    n'a pas le droit d'y entrer (RouteGuard) — et réutilisé par /forbidden.
//    Mêmes props qu'avant ({ role, homeHref }) : rien à changer ailleurs.
//    UX : on dit clairement ce qui se passe, quelle page était visée, et on
//    propose 3 sorties (retour, mon espace, écrire à l'administration) +
//    des raccourcis vers les pages que l'utilisateur peut ouvrir.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldAlert, Lock, ArrowLeft, Home, MessageCircle, CalendarDays, FileText, Ticket, HandCoins, Fingerprint,
} from 'lucide-react';
import { useBasePath } from '@/hooks/useBasePath';
import { ROLE_LABELS, normalizePath } from '@/lib/route-access';

const CAN_MESSAGE = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'];

// Pages ouvertes à TOUS les rôles (voir route-access.ts) — sûres à proposer
const SHORTCUTS = [
  { href: '/presences/pointage', label: 'Ma pointeuse', icon: Fingerprint },
  { href: '/conges/mon-espace', label: 'Mes congés', icon: CalendarDays },
  { href: '/presences/absences/mon-espace', label: 'Mes absences', icon: FileText },
  { href: '/presences/permissions/mon-espace', label: 'Mes permissions', icon: Ticket },
  { href: '/loans/mon-espace', label: 'Mes prêts', icon: HandCoins },
];

export default function AccessDenied({ role, homeHref }: { role?: string | null; homeHref: string }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { bp } = useBasePath();
  const requested = normalizePath(pathname);
  const roleLabel = (role && ROLE_LABELS[role]) || role || '—';
  // Sur la page /forbidden elle-même, afficher « page demandée » n'a pas de sens
  const showRequested = requested !== '/forbidden' && requested !== '/';

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* ── Illustration ── */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="relative w-36 h-36 mx-auto mb-7"
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 opacity-25 blur-2xl" />
          <div className="relative w-full h-full rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-xl flex items-center justify-center">
            <ShieldAlert size={60} className="text-violet-500" strokeWidth={1.6} />
          </div>
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute -top-1 -right-3 px-3 py-1 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-extrabold shadow-lg border-4 border-[var(--bg)]"
          >
            403
          </motion.span>
        </motion.div>

        {/* ── Message ── */}
        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text)]">Cette page ne vous est pas accessible</h1>
          <p className="mt-3 text-[var(--text-muted)] leading-relaxed">
            Votre profil <b className="text-[var(--text)]">{roleLabel}</b> n’a pas les droits nécessaires pour ouvrir cette page.
            Rien n’a été modifié, et vos autres espaces restent accessibles.
          </p>
        </motion.div>

        {/* ── Détails ── */}
        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] text-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Votre profil</span>
            <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text)] text-xs font-bold">{roleLabel}</span>
          </div>
          {showRequested && (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Page demandée</span>
              <code className="text-xs text-[var(--text)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg truncate">{requested}</code>
            </div>
          )}
          <div className="flex gap-2.5 px-4 py-3 text-[var(--text-muted)]">
            <Lock size={15} className="shrink-0 mt-0.5" />
            <p className="text-[13px] leading-relaxed">Cette page est réservée à un autre profil. Si vous pensez que c’est une erreur, demandez à votre administration de vérifier vos droits.</p>
          </div>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mt-6 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={homeHref} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-sm transition-colors">
              <Home size={17} /> Retour à mon espace
            </Link>
            <button onClick={() => (window.history.length > 1 ? router.back() : router.push(homeHref))}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--text)] font-semibold transition-colors">
              <ArrowLeft size={17} /> Page précédente
            </button>
          </div>

          {role && CAN_MESSAGE.includes(role) && (
            <Link href={bp('/messages')} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              <MessageCircle size={16} /> Écrire à l’administration pour demander l’accès
            </Link>
          )}
        </motion.div>

        {/* ── Raccourcis ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Pages accessibles pour vous</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SHORTCUTS.map(s => {
              const Icon = s.icon;
              return (
                <Link key={s.href} href={bp(s.href)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-emerald-300 transition-colors">
                  <Icon size={13} /> {s.label}
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}