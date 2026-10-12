'use client';

// ============================================================================
// 📁 components/loans/CashPaymentModal.tsx
// ✅ v3 — Modal unique pour enregistrer un remboursement (prêts ET avances).
//    - Montant libre + raccourcis (25 % / 50 % / solder tout)
//    - Période du remboursement (mois + année) — pilote relevé, suivi et paie
//    - Aperçu animé : barre de progression + "reste après remboursement"
//    - Animation de succès (coche qui se dessine) puis fermeture douce
//    - Dette soldée → saisie bloquée
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Calendar, Check, Loader2, PartyPopper, ShieldCheck, Wallet, X } from 'lucide-react';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

const MONTHS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

type Period = { month: number; year: number };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Reste dû avant ce remboursement */
  remaining: number;
  /** Montant initial de la dette (optionnel — active la barre de progression globale) */
  total?: number;
  /** Retourne `false` si l'enregistrement a échoué (le modal reste alors ouvert) */
  onConfirm: (amount: number, period: Period) => Promise<void | boolean>;
};

/** Nombre qui "glisse" doucement vers sa nouvelle valeur */
function AnimatedAmount({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, v => fmt(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.55, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

export default function CashPaymentModal({ open, onClose, remaining, total, onConfirm }: Props) {
  const [amount, setAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settled, setSettled] = useState(false);

  const today = new Date();
  const curM = today.getMonth() + 1;
  const curY = today.getFullYear();
  const [month, setMonth] = useState(curM);
  const [year, setYear] = useState(curY);

  useEffect(() => {
    if (!open) return;
    setAmount(''); setSuccess(false); setSettled(false); setIsPaying(false);
    const d = new Date(); setMonth(d.getMonth() + 1); setYear(d.getFullYear());
  }, [open]);

  // Échap pour fermer
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPaying) onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, isPaying, onClose]);

  const numeric = Number(amount.replace(/[^\d]/g, '')) || 0;
  const fullyPaid = remaining <= 0; // 🔒 dette soldée : plus aucune saisie
  const overRemaining = numeric > remaining;
  const periodInFuture = year * 12 + month > curY * 12 + curM;
  const valid = numeric > 0 && !overRemaining && !periodInFuture && !fullyPaid;

  const afterPayment = Math.max(0, remaining - (overRemaining ? 0 : numeric));
  const paidBefore = total ? Math.max(0, total - remaining) : 0;
  const pctBefore = total ? Math.min(100, (paidBefore / total) * 100) : 0;
  const pctNew = total ? Math.min(100 - pctBefore, ((overRemaining ? 0 : numeric) / total) * 100) : 0;

  const years = useMemo(() => [curY, curY - 1, curY - 2, curY - 3], [curY]);
  const lastMonth = curM === 1 ? { month: 12, year: curY - 1 } : { month: curM - 1, year: curY };
  const isThisMonth = month === curM && year === curY;
  const isLastMonth = month === lastMonth.month && year === lastMonth.year;

  const quick = [
    { label: '25 %', value: Math.round(remaining * 0.25) },
    { label: '50 %', value: Math.round(remaining * 0.5) },
    { label: 'Tout solder', value: remaining },
  ];

  const handleConfirm = async () => {
    if (!valid || isPaying) return;
    setIsPaying(true);
    try {
      const res = await onConfirm(numeric, { month, year });
      if (res === false) return; // échec déjà signalé par l'appelant
      setSettled(numeric >= remaining);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } finally { setIsPaying(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cash-backdrop"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          onClick={() => !isPaying && !success && onClose()}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl shadow-emerald-900/20"
          >
            {/* Halo décoratif */}
            <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

            <AnimatePresence mode="wait">
              {success ? (
                /* ───────────── ÉTAT SUCCÈS ───────────── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="relative flex flex-col items-center text-center px-8 py-14"
                >
                  <div className="relative mb-6">
                    <motion.span
                      className="absolute inset-0 rounded-full bg-emerald-400/30"
                      initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 2.1, opacity: 0 }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                    />
                    <motion.span
                      className="absolute inset-0 rounded-full bg-emerald-400/20"
                      initial={{ scale: 0.6, opacity: 0.8 }} animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <motion.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }} />
                      </svg>
                    </div>
                  </div>
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-xl font-bold text-[var(--text)]">
                    {settled ? 'Dette entièrement soldée' : 'Remboursement enregistré'}
                  </motion.p>
                  <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-1.5 text-sm text-[var(--text-muted)]">
                    {fmt(numeric)} · {MONTHS_LONG[month - 1]} {year}
                  </motion.p>
                  {settled && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, type: 'spring' }}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      <PartyPopper size={13} /> Plus aucun reste à payer
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* ───────────── FORMULAIRE ───────────── */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="relative p-6">
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-md shadow-emerald-500/30">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <p className="text-lg font-bold leading-tight text-[var(--text)]">Enregistrer un remboursement</p>
                        <p className="text-xs text-[var(--text-muted)]">Paiement reçu en espèces</p>
                      </div>
                    </div>
                    <button onClick={onClose} disabled={isPaying} className="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]" aria-label="Fermer">
                      <X size={18} />
                    </button>
                  </div>

                  {fullyPaid ? (
                    <div className="flex flex-col items-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-8 text-center">
                      <ShieldCheck size={32} className="mb-2 text-emerald-600" />
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">Dette entièrement remboursée</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">Aucun nouveau remboursement ne peut être saisi.</p>
                    </div>
                  ) : (
                    <>
                      {/* Reste dû + progression */}
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 mb-5">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Reste dû</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(remaining)}</p>
                          </div>
                          <AnimatePresence>
                            {numeric > 0 && !overRemaining && (
                              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Après paiement</p>
                                <AnimatedAmount value={afterPayment} className={`text-xl font-bold ${afterPayment === 0 ? 'text-emerald-600' : 'text-[var(--text)]'}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {total ? (
                          <div className="mt-3">
                            <div className="flex h-2 overflow-hidden rounded-full bg-[var(--border)]">
                              <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pctBefore}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
                              <motion.div className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400" animate={{ width: `${pctNew}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
                            </div>
                            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                              {Math.round(pctBefore + pctNew)} % remboursé sur {fmt(total)}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {/* Montant */}
                      <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Montant remboursé</label>
                      <div className={`flex items-center rounded-2xl border-2 bg-[var(--surface)] px-4 transition-colors focus-within:border-emerald-500 ${overRemaining ? 'border-red-400' : 'border-[var(--border)]'}`}>
                        <input
                          type="text" inputMode="numeric" autoFocus
                          value={numeric ? numeric.toLocaleString('fr-FR') : ''}
                          onChange={e => setAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
                          placeholder="0"
                          className="w-full bg-transparent py-3.5 text-2xl font-bold tabular-nums text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]/40"
                        />
                        <span className="text-sm font-semibold text-[var(--text-muted)]">FCFA</span>
                      </div>
                      <AnimatePresence>
                        {overRemaining && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs font-medium text-red-600">
                            Le montant dépasse le reste dû ({fmt(remaining)}).
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {quick.map(q => {
                          const active = numeric === q.value && q.value > 0;
                          return (
                            <motion.button
                              key={q.label} type="button" whileTap={{ scale: 0.94 }}
                              onClick={() => setAmount(String(q.value))}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-emerald-400 hover:text-emerald-600'}`}
                            >
                              {q.label}
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Période */}
                      <div className="mt-5">
                        <div className="mb-1.5 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)]"><Calendar size={13} /> Période du remboursement</label>
                          <div className="flex gap-1.5">
                            <button type="button" onClick={() => { setMonth(curM); setYear(curY); }}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${isThisMonth ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-emerald-600'}`}>Ce mois</button>
                            <button type="button" onClick={() => { setMonth(lastMonth.month); setYear(lastMonth.year); }}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${isLastMonth ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-emerald-600'}`}>Mois dernier</button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <select value={month} onChange={e => setMonth(Number(e.target.value))}
                            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--text)] outline-none transition-colors focus:border-emerald-500">
                            {MONTHS_LONG.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                          </select>
                          <select value={year} onChange={e => setYear(Number(e.target.value))}
                            className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-medium text-[var(--text)] outline-none transition-colors focus:border-emerald-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                        <AnimatePresence>
                          {periodInFuture ? (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs font-medium text-red-600">
                              Une période future n&apos;est pas possible.
                            </motion.p>
                          ) : (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                              Ce remboursement sera comptabilisé sur {MONTHS_LONG[month - 1].toLowerCase()} {year} (relevé, suivi et paie).
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Action */}
                      <motion.button
                        onClick={handleConfirm} disabled={!valid || isPaying} whileTap={valid ? { scale: 0.98 } : undefined}
                        className="relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all enabled:hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        {valid && !isPaying && (
                          <motion.span
                            className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/20"
                            initial={{ left: '-40%' }} animate={{ left: '140%' }}
                            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                          />
                        )}
                        {isPaying ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        {isPaying ? 'Enregistrement…' : numeric > 0 && valid ? `Confirmer ${fmt(numeric)}` : 'Confirmer le remboursement'}
                      </motion.button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}