'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/mon-espace/page.tsx
// ✅ Espace employé — refonte : un solde de congé que TOUT LE MONDE comprend.
//    • Résumé en haut : "il me reste X jours" + anneau "acquis sur 26 jours"
//    • Le calcul pas à pas (base + ancienneté − déjà pris = reste), chaque ligne expliquée
//    • Mon cycle (12 mois) et la date à partir de laquelle je peux partir
//    • Mon prochain départ : planifié, ou date probable
//    • Mon ancienneté, ma convention et mon prochain palier
//    • "Comprendre mon solde" : questions/réponses en mots simples
//    • Reliquat de retour anticipé (jours à rattraper) + mes demandes (conservés)
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Clock, CheckCircle2, XCircle, Ban, Calendar, ArrowRight, Wallet, Info, Umbrella, Zap,
  X, Check, AlertTriangle, History, Sparkles, Plane, Award, ChevronDown, CalendarCheck, Sun, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; bar: string; icon: any }> = {
  PENDING:   { label: 'En attente de validation', badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800', bar: 'bg-amber-400', icon: Clock },
  APPROVED:  { label: 'Accepté', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800', bar: 'bg-emerald-500', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé', badge: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800', bar: 'bg-red-400', icon: XCircle },
  CANCELLED: { label: 'Annulé', badge: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]', bar: 'bg-slate-300', icon: Ban },
};

const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Congé annuel', ANNUAL_ANTICIPATED: 'Congé annuel anticipé' };
const TYPE_ICONS: Record<string, any> = { ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap };

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
const fmtLong = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtMonthYear = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const nb = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
const plural = (n: number, one: string, many: string) => (n > 1 ? many : one);

// ─── Anneau de progression "X sur 26" ───────────────────────────────────────

function Ring({ value, max }: { value: number; max: number }) {
  const R = 70, C = 2 * Math.PI * R;
  const pct = Math.min(1, value / max);
  return (
    <div className="relative w-44 h-44 shrink-0">
      <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="14" />
        <motion.circle
          cx="90" cy="90" r={R} fill="none" stroke="#fff" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl font-extrabold leading-none">{nb(value)}</span>
        <span className="text-sm font-semibold opacity-90 mt-1">sur {max} jours</span>
      </div>
    </div>
  );
}

// ─── Ligne du "calcul pas à pas" ─────────────────────────────────────────────

function Step({
  sign, tone, label, value, help, strong,
}: { sign: string; tone: string; label: string; value: string; help: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex gap-3 py-3 ${strong ? '' : 'border-b border-[var(--border)]/70'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${tone}`}>{sign}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`text-sm ${strong ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text)]'}`}>{label}</p>
          <p className={`shrink-0 ${strong ? 'text-xl font-extrabold text-emerald-600 dark:text-emerald-400' : 'text-base font-bold text-[var(--text)]'}`}>{value}</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{help}</p>
      </div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-sm p-5 sm:p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardTitle({ icon: Icon, children, tone = 'text-emerald-500' }: { icon: any; children: React.ReactNode; tone?: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--text)] mb-4">
      <span className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center"><Icon size={16} className={tone} /></span>
      {children}
    </h2>
  );
}

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'C’est quoi le « solde de congé » ?',
    a: 'C’est le nombre de jours de repos payés auxquels vous avez droit et que vous n’avez pas encore pris. Quand vous partez en congé, ce nombre diminue du nombre de jours posés.',
  },
  {
    q: 'Pourquoi « sur 26 jours » ?',
    a: 'La loi prévoit 26 jours de congé pour une année complète de travail (12 mois). Ces jours ne tombent pas d’un coup : chaque mois travaillé vous en apporte environ 2,2. Au bout de 12 mois, vous avez vos 26 jours.',
  },
  {
    q: 'Pourquoi ai-je des jours en plus ?',
    a: 'Selon la convention collective de votre entreprise, plus vous avez d’années d’ancienneté, plus vous avez de jours de congé supplémentaires. Ils sont ajoutés à vos 26 jours dès le début du cycle.',
  },
  {
    q: 'Quand est-ce que je peux partir en congé ?',
    a: 'Un congé annuel normal est possible après un cycle complet de 12 mois. La date indiquée dans « Mon prochain départ » est une date probable : elle devient officielle quand les RH valident votre demande.',
  },
  {
    q: 'J’ai pris un congé en avance (anticipé) : que se passe-t-il ?',
    a: 'Ses jours sont retirés de votre solde. À la date normale de votre congé, vous partez avec ce qui reste (par exemple 26 − 10 = 16 jours) : le système n’attend pas que vous ayez 26 jours. Ensuite, un nouveau cycle commence.',
  },
  {
    q: 'Mon solde a changé, pourquoi ?',
    a: 'Il augmente chaque début de mois (jours acquis), et il diminue quand un congé est validé. Les jours non pris après un retour anticipé apparaissent séparément, en orange, dans « Jours restants à prendre ».',
  },
];

export default function MonEspaceCongesPage() {
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [ex, setEx] = useState<any>(null); // solde expliqué
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [carryover, setCarryover] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ✅ Demande de rattrapage (bouton "Demander mes jours restants")
  const [requesting, setRequesting] = useState<any>(null);
  const [requestForm, setRequestForm] = useState({ startDate: '', endDate: '' });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [bal, explained, leaves] = await Promise.all([
        api.get<any>('/leaves/me/balance').catch(() => null),
        api.get<any>('/leaves/me/balance-explained').catch(() => null),
        api.get<any[]>('/leaves/me').catch(() => []),
      ]);
      setBalance(bal);
      setEx(explained);
      setMyLeaves(leaves || []);
      if (bal?.employeeId) {
        const co = await api.get<any[]>(`/leaves/carryover/${bal.employeeId}`).catch(() => []);
        setCarryover(co || []);
      }
    } catch (e) {
      console.error('Erreur chargement de mon espace congés', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openRequestModal = (source: any) => {
    setRequestError('');
    setRequesting(source);
    setRequestForm({ startDate: '', endDate: '' });
  };

  const submitCarryoverRequest = async () => {
    if (!requesting || !balance?.employeeId) return;
    if (!requestForm.startDate || !requestForm.endDate) {
      setRequestError('Renseigne une date de départ et une date de retour');
      return;
    }
    setIsSubmittingRequest(true);
    setRequestError('');
    try {
      await api.post('/leaves', {
        employeeId: balance.employeeId,
        type: 'ANNUAL',
        startDate: requestForm.startDate,
        endDate: requestForm.endDate,
        reason: 'Demande de rattrapage — reliquat de retour anticipé (repos non payé)',
        carriedFromLeaveId: requesting.sourceLeaveId,
      });
      setRequesting(null);
      await load();
    } catch (e: any) {
      setRequestError(e?.message || 'Erreur lors de la demande de rattrapage');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Annuler cette demande de congé ?')) return;
    setCancellingId(leaveId);
    try {
      await api.patch(`/leaves/${leaveId}/cancel`, {});
      await load();
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'annulation");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <CongeSubNav userRole={userRole} />
        <KonzaLoader variant="page" />
      </div>
    );
  }

  const nd = ex?.nextDeparture;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-5">
      <CongeSubNav userRole={userRole} />

      {/* ── 1) Résumé : le chiffre qui compte ── */}
      {ex ? (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-lg shadow-emerald-500/20"
        >
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute right-24 -bottom-16 w-44 h-44 rounded-full bg-white/5" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <Ring value={ex.base.acquired} max={ex.base.max} />
            <div className="text-center md:text-left flex-1">
              <p className="flex items-center justify-center md:justify-start gap-1.5 text-emerald-100 text-sm font-semibold">
                <Sparkles size={15} /> Bonjour {ex.employee.firstName}
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold mt-1 leading-tight">
                Il vous reste <span className="underline decoration-white/40 decoration-4 underline-offset-4">{nb(ex.totals.remaining)} {plural(ex.totals.remaining, 'jour', 'jours')}</span> de congé
              </h1>
              <p className="text-emerald-50/90 text-sm mt-3 max-w-xl">
                {ex.base.missing > 0
                  ? <>L’anneau montre vos jours de base acquis : <strong>{nb(ex.base.acquired)} sur {ex.base.max}</strong>. Il en manque encore {nb(ex.base.missing)} ; ils s’ajoutent automatiquement chaque mois (environ {nb(ex.base.perMonth)} jours par mois).</>
                  : <>Vos <strong>{ex.base.max} jours de base</strong> sont complets pour ce cycle.</>}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-5 max-w-md mx-auto md:mx-0">
                {[
                  ['Mon droit total', nb(ex.totals.entitled)],
                  ['Déjà pris', nb(ex.totals.taken)],
                  ['Il me reste', nb(ex.totals.remaining)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-2xl bg-white/15 backdrop-blur px-3 py-2.5 text-center">
                    <p className="text-xl font-extrabold">{v}<span className="text-xs font-semibold opacity-80"> j</span></p>
                    <p className="text-[11px] opacity-90">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      ) : (
        <Card>
          <p className="text-sm text-[var(--text-muted)]">Impossible de charger votre solde pour le moment. Réessayez dans un instant.</p>
        </Card>
      )}

      {ex && !ex.cycle.canTakeLeave && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <span>
            Vos jours s’accumulent, mais un congé annuel normal n’est possible qu’après 12 mois.
            Vous pourrez partir à partir du <strong>{fmtLong(ex.cycle.eligibleDate)}</strong> (encore {ex.cycle.monthsUntilEligible} {plural(ex.cycle.monthsUntilEligible, 'mois', 'mois')}).
          </span>
        </div>
      )}

      {ex && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* ── 2) Le calcul pas à pas ── */}
          <Card className="lg:col-span-3">
            <CardTitle icon={Wallet}>Comment mon solde est calculé</CardTitle>
            <Step
              sign="+" tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
              label="Jours de base acquis" value={`${nb(ex.base.acquired)} j`}
              help={
                <>
                  {ex.cycle.startReason === 'HIRE' && <>Votre cycle a commencé à votre embauche, en {fmtMonthYear(ex.cycle.startDate)}. </>}
                  {ex.cycle.startReason === 'LAST_LEAVE_RETURN' && <>Votre cycle a recommencé à votre retour de congé, en {fmtMonthYear(ex.cycle.startDate)}. </>}
                  {ex.cycle.startReason === 'ANNIVERSARY' && <>Votre cycle a commencé à votre dernier anniversaire d’embauche, en {fmtMonthYear(ex.cycle.startDate)}. </>}
                  Depuis, <strong>{ex.cycle.monthsElapsedFull} mois</strong> se sont écoulés, et chaque mois vous apporte environ <strong>{nb(ex.base.perMonth)} jours</strong>
                  {' '}(26 jours ÷ 12 mois) : {ex.cycle.monthsElapsedFull} × {nb(ex.base.perMonth)} ≈ <strong>{nb(ex.base.acquired)} jours</strong>.
                </>
              }
            />
            <Step
              sign="+" tone="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
              label="Jours d’ancienneté" value={`${nb(ex.seniority.days)} j`}
              help={
                !ex.seniority.applies
                  ? 'Votre entreprise n’accorde pas de jours supplémentaires pour l’ancienneté.'
                  : ex.seniority.days > 0
                    ? <>Vous avez {ex.employee.seniority.label} d’ancienneté : votre convention ({ex.seniority.conventionName}) vous accorde {nb(ex.seniority.days)} {plural(ex.seniority.days, 'jour', 'jours')} en plus.</>
                    : <>Pas encore de jours d’ancienneté.{ex.seniority.next && <> Le premier palier arrive à {ex.seniority.next.minYears} ans d’ancienneté.</>}</>
              }
            />
            <Step
              sign="=" tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              label="Mon droit total" value={`${nb(ex.totals.entitled)} j`}
              help="C’est la somme de vos jours de base et de vos jours d’ancienneté."
            />
            <Step
              sign="−" tone="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              label="Jours déjà pris" value={`${nb(ex.totals.taken)} j`}
              help={ex.anticipated.days > 0
                ? <>Les jours de vos congés déjà validés sur ce cycle, dont <strong>{nb(ex.anticipated.days)} {plural(ex.anticipated.days, 'jour', 'jours')} pris en congé anticipé</strong> (voir plus bas).</>
                : 'Les jours de vos congés déjà validés par les RH, sur ce cycle.'}
            />
            <Step
              sign="=" tone="bg-emerald-500 text-white"
              label="Il me reste" value={`${nb(ex.totals.remaining)} j`}
              help="Ce sont les jours que vous pouvez encore poser en congé payé aujourd’hui." strong
            />

            {(ex.cycle.progressPct < 100 || ex.anticipated.days > 0) && (
              <div className="mt-4 rounded-2xl border-2 border-dashed border-sky-300 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-900/10 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-600 dark:text-sky-300 mb-2">
                  À la fin de mon cycle ({fmtDate(ex.projection.cycleEndDate)})
                </p>
                <p className="text-sm text-[var(--text)] leading-relaxed">
                  Vous aurez acquis vos <strong>{nb(ex.projection.fullEntitlement)} jours</strong>
                  {ex.seniority.days > 0 && <> (26 de base + {nb(ex.seniority.days)} d’ancienneté)</>}.
                  {ex.projection.taken > 0 && <> Moins les <strong>{nb(ex.projection.taken)} jours</strong> déjà pris, il vous restera <strong>{nb(ex.projection.remainingAtCycleEnd)} jours</strong>.</>}
                  {' '}Vous partirez donc avec <strong>{nb(ex.projection.remainingAtCycleEnd)} jours</strong> à la date normale de congé
                  {ex.projection.taken > 0 && <> — sans attendre d’en avoir 26</>}.
                </p>
              </div>
            )}
          </Card>

          {/* ── 3) Mon cycle ── */}
          <Card className="lg:col-span-2">
            <CardTitle icon={CalendarCheck} tone="text-sky-500">Mon cycle de congé</CardTitle>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Un cycle dure <strong className="text-[var(--text)]">12 mois</strong>. Au bout, vous avez acquis vos 26 jours et pouvez partir en congé.
            </p>
            <div className="relative pt-6 pb-2">
              <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${ex.cycle.progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div
                className="absolute top-0 -translate-x-1/2 text-[11px] font-bold text-sky-600 dark:text-sky-300 whitespace-nowrap"
                style={{ left: `${Math.min(Math.max(ex.cycle.progressPct, 8), 92)}%` }}
              >
                Mois {Math.min(12, Math.floor(ex.cycle.monthsWorked) + 1)} / 12
              </div>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>Début<br /><strong className="text-[var(--text)]">{fmtDate(ex.cycle.startDate)}</strong></span>
              <span className="text-right">Fin<br /><strong className="text-[var(--text)]">{fmtDate(ex.cycle.endDate)}</strong></span>
            </div>
            {ex.base.daysUntilNextAccrual != null && ex.base.missing > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-4 flex items-start gap-1.5">
                <Info size={13} className="mt-0.5 shrink-0" />
                Prochains jours ajoutés dans {ex.base.daysUntilNextAccrual} {plural(ex.base.daysUntilNextAccrual, 'jour', 'jours')} (début du mois).
              </p>
            )}
          </Card>
        </div>
      )}

      {/* ── Congés pris en avance (anticipés) ── */}
      {ex && ex.anticipated.leaves.length > 0 && (
        <Card className="!border-amber-200 dark:!border-amber-800">
          <CardTitle icon={Zap} tone="text-amber-500">Mes congés pris en avance (anticipés)</CardTitle>
          <p className="text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
            Un congé anticipé, c’est un congé pris <strong className="text-[var(--text)]">avant</strong> la fin de votre cycle. Ses jours sont retirés de votre solde :
            ils ne seront donc pas à reprendre à votre congé normal.
          </p>
          <div className="space-y-2 mb-5">
            {ex.anticipated.leaves.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 px-4 py-3">
                <span className="text-sm text-[var(--text)]">Du <strong>{fmtDate(a.startDate)}</strong> au <strong>{fmtDate(a.endDate)}</strong></span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 shrink-0">− {nb(a.days)} {plural(a.days, 'jour', 'jours')}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/15 px-4 py-3">
              <p className="text-2xl font-extrabold text-emerald-600">{nb(ex.projection.fullEntitlement)}</p>
              <p className="text-[11px] text-[var(--text-muted)]">jours acquis<br />en fin de cycle</p>
            </div>
            <span className="text-xl font-bold text-[var(--text-muted)]">−</span>
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/15 px-4 py-3">
              <p className="text-2xl font-extrabold text-amber-600">{nb(ex.projection.taken)}</p>
              <p className="text-[11px] text-[var(--text-muted)]">jours déjà pris<br />(anticipé compris)</p>
            </div>
            <span className="text-xl font-bold text-[var(--text-muted)]">=</span>
            <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/15 px-4 py-3">
              <p className="text-2xl font-extrabold text-sky-600">{nb(ex.projection.remainingAtCycleEnd)}</p>
              <p className="text-[11px] text-[var(--text-muted)]">jours pour votre<br />congé normal</p>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
            À la date normale de votre congé, vous partirez avec {nb(ex.projection.remainingAtCycleEnd)} jours, puis un nouveau cycle recommencera.
          </p>
        </Card>
      )}

      {ex && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* ── 4) Mon prochain départ ── */}
          <Card>
            <CardTitle icon={Plane} tone="text-blue-500">Mon prochain départ en congé</CardTitle>
            {nd?.kind === 'IN_PROGRESS' && (
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/15 p-4">
                <p className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2"><Sun size={16} /> Vous êtes en congé</p>
                <p className="text-sm text-[var(--text)] mt-1">Jusqu’au <strong>{fmtLong(nd.endDate)}</strong> ({nb(nd.days)} jours).</p>
              </div>
            )}
            {nd?.kind === 'PLANNED' && (
              <div className={`rounded-2xl p-4 ${nd.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-amber-50 dark:bg-amber-900/15'}`}>
                <p className={`text-sm font-bold flex items-center gap-2 ${nd.status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {nd.status === 'APPROVED' ? <><CheckCircle2 size={16} /> Congé validé</> : <><Clock size={16} /> Demande en attente de validation</>}
                </p>
                <p className="text-sm text-[var(--text)] mt-1">
                  Du <strong>{fmtLong(nd.startDate)}</strong> au <strong>{fmtLong(nd.endDate)}</strong> ({nb(nd.days)} {plural(nd.days, 'jour', 'jours')}).
                </p>
              </div>
            )}
            {nd?.kind === 'PROBABLE' && (
              <div className="rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Date probable</p>
                <p className="text-xl font-extrabold text-[var(--text)] mt-0.5">
                  {nd.reason === 'AVAILABLE_NOW' ? 'Dès maintenant' : fmtLong(nd.startDate)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
                  {nd.reason === 'AVAILABLE_NOW'
                    ? <>Votre cycle est terminé : vous pouvez demander votre congé de {nb(ex.projection.remainingAtCycleEnd)} jours.</>
                    : <>C’est la fin de votre cycle de 12 mois. À cette date, il vous restera <strong>{nb(ex.projection.remainingAtCycleEnd)} jours</strong>
                        {ex.projection.taken > 0 && <> ({nb(ex.projection.fullEntitlement)} acquis − {nb(ex.projection.taken)} déjà pris)</>} : c’est avec eux que vous partirez. Cette date deviendra officielle quand votre demande sera validée.</>}
                </p>
                <Link
                  href={bp('/conges/nouveau')}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl"
                >
                  Faire une demande <ArrowRight size={13} />
                </Link>
              </div>
            )}
            {nd?.kind === 'NOT_YET' && (
              <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text)]">
                  Votre premier congé annuel sera possible à partir du <strong>{fmtLong(nd.startDate)}</strong>.
                </p>
              </div>
            )}
            {nd?.kind === 'NONE' && (
              <p className="text-sm text-[var(--text-muted)]">Aucun congé à prévoir : votre solde est utilisé.</p>
            )}
          </Card>

          {/* ── 5) Mon ancienneté ── */}
          <Card>
            <CardTitle icon={Award} tone="text-violet-500">Mon ancienneté</CardTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-[var(--surface-2)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Embauché le</p>
                <p className="text-sm font-bold text-[var(--text)]">{fmtDate(ex.employee.hireDate)}</p>
              </div>
              <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/15 p-3">
                <p className="text-[11px] text-violet-600 dark:text-violet-300">Ancienneté</p>
                <p className="text-sm font-bold text-[var(--text)]">{ex.employee.seniority.label}</p>
              </div>
            </div>
            {ex.seniority.applies ? (
              <div className="text-sm text-[var(--text)] space-y-2">
                {ex.seniority.conventionName && (
                  <p className="text-xs text-[var(--text-muted)]">Convention de votre entreprise : <strong className="text-[var(--text)]">{ex.seniority.conventionName}</strong></p>
                )}
                <p>
                  À ce jour : <strong>{nb(ex.seniority.currentBonus)} {plural(ex.seniority.currentBonus, 'jour', 'jours')}</strong> en plus pour l’ancienneté.
                </p>
                {ex.seniority.next && (
                  <p className="text-xs text-[var(--text-muted)] rounded-xl bg-violet-50/70 dark:bg-violet-900/10 px-3 py-2">
                    Prochain palier : à <strong>{ex.seniority.next.minYears} ans</strong> d’ancienneté (le {fmtDate(ex.seniority.next.date)}),
                    vous aurez <strong>{nb(ex.seniority.next.days)} jours</strong> en plus sur votre cycle suivant.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Votre entreprise n’accorde pas de jours de congé supplémentaires pour l’ancienneté.</p>
            )}
          </Card>
        </div>
      )}

      {/* ── 6) Comprendre mon solde ── */}
      <Card>
        <CardTitle icon={Info} tone="text-sky-500">Comprendre mon solde</CardTitle>
        <div className="divide-y divide-[var(--border)]">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 py-3 text-left"
              >
                <span className="text-sm font-semibold text-[var(--text)]">{f.q}</span>
                <ChevronDown size={16} className={`text-[var(--text-muted)] transition-transform shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="text-sm text-[var(--text-muted)] overflow-hidden pb-3 leading-relaxed"
                  >
                    {f.a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Reliquat de retour anticipé — jours non pris à rattraper ── */}
      {carryover.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300 mb-3">
            <History size={16} /> Jours restants à prendre (cycle précédent)
          </div>
          <div className="space-y-3">
            {carryover.map(co => (
              <div key={co.sourceLeaveId} className="bg-[var(--surface)] rounded-2xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">
                    Congé {co.cycleLabel ? `du cycle ${co.cycleLabel}` : ''} — {fmtDate(co.originalStartDate)} au {fmtDate(co.originalEndDate)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Retour anticipé le {fmtDate(co.actualReturnDate)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{Math.round(co.remainingDays * 10) / 10}j</span>
                  <button
                    onClick={() => openRequestModal(co)}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Demander mes jours restants
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-3">
            Ce reliquat ne fait jamais partie de mon cycle en cours et n&apos;est jamais payé une seconde fois — c&apos;est un repos physique, à faire valider par le RH comme une demande normale.
          </p>
        </div>
      )}

      {/* ── Mes demandes ── */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text)]">Mes demandes de congé</h2>
          <Link href={bp('/conges/nouveau')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            Nouvelle demande <ArrowRight size={12} />
          </Link>
        </div>
        {myLeaves.length === 0 ? (
          <div className="text-center py-14">
            <Calendar size={28} className="text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Aucune demande de congé pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {myLeaves.map(leave => {
              const st = STATUS_CONFIG[leave.status as Status] || STATUS_CONFIG.PENDING;
              const StIcon = st.icon;
              const Icon = TYPE_ICONS[leave.type] || Umbrella;
              return (
                <div key={leave.id} className="relative px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--surface-2)]/50 transition-colors">
                  <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${st.bar}`} />
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center shrink-0">
                      <Icon size={17} className="text-[var(--text-muted)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                        {leave.carriedFromLeaveId ? 'Rattrapage — reliquat non payé' : (TYPE_LABELS[leave.type] || leave.type)}
                        {leave.carriedFromLeaveId && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">Non payé</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
                        {fmtDate(leave.startDate)} <ArrowRight size={10} /> {fmtDate(leave.endDate)} · {Math.round(Number(leave.daysCount))} {plural(Math.round(Number(leave.daysCount)), 'jour', 'jours')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${st.badge}`}>
                      <StIcon size={11} /> {st.label}
                    </span>
                    {['PENDING', 'APPROVED'].includes(leave.status) && (
                      <button
                        onClick={() => handleCancel(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 disabled:opacity-40"
                      >
                        {cancellingId === leave.id ? <Loader2 size={12} className="animate-spin" /> : 'Annuler'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modale : demander mes jours restants ── */}
      <AnimatePresence>
        {requesting && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">Demander mes jours restants</h2>
                <button onClick={() => setRequesting(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X size={20} />
                </button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Il te reste <strong>{Math.round(requesting.remainingDays * 10) / 10}j</strong> à rattraper sur ton congé du {fmtDate(requesting.originalStartDate)} au {fmtDate(requesting.originalEndDate)}. Ce repos n&apos;est pas payé une seconde fois et n&apos;affecte pas ton solde en cours — le RH validera comme une demande normale.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de départ</label>
                  <input
                    type="date"
                    value={requestForm.startDate}
                    onChange={e => setRequestForm(f => ({ ...f, startDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface-2)] rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Date de retour</label>
                  <input
                    type="date"
                    value={requestForm.endDate}
                    onChange={e => setRequestForm(f => ({ ...f, endDate: e.target.value }))}
                    className="mt-1 w-full text-sm border border-[var(--border)] bg-[var(--surface-2)] rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              {requestError && (
                <div className="flex items-start gap-2 text-xs text-red-500">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {requestError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setRequesting(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                  Annuler
                </button>
                <button
                  onClick={submitCarryoverRequest}
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 disabled:opacity-40"
                >
                  {isSubmittingRequest ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Envoyer la demande
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}