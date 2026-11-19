'use client';
import '@/components/leave-history/leave-workspace.css';
import { RequestStatusTabs, RequestStatusBadge, RequestEmptyState } from '@/components/requests';
import { requestStatus, type RequestGroup } from '@/lib/request-status';
import { LeaveModuleFrame as ModulePageFrame } from '@/components/leave-history/LeaveModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

// ============================================================================
// 📁 app/(dashboard)/conges/mon-espace/page.tsx
// ✅ Espace employé — sobre : chiffres et statuts, très peu de texte.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, Clock, CheckCircle2, XCircle, Ban, Calendar, ArrowRight, Wallet, Umbrella, Zap,
  X, Check, AlertTriangle, History, Sparkles, Plane, Award, CalendarCheck, Sun, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import ContactAdminButton from '@/components/chat/ContactAdminButton';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_CONFIG: Record<Status, { label: string; badge: string; bar: string; icon: any }> = {
  PENDING:   { label: 'En attente', badge: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]   ', bar: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', icon: Clock },
  APPROVED:  { label: 'Accepté', badge: 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)] border-[var(--border)]   ', bar: 'bg-[var(--brand)]', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé', badge: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]   ', bar: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]', icon: XCircle },
  CANCELLED: { label: 'Annulé', badge: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]', bar: 'bg-[var(--surface-2)]', icon: Ban },
};

const TYPE_LABELS: Record<string, string> = { ANNUAL: 'Congé annuel', ANNUAL_ANTICIPATED: 'Congé annuel anticipé' };
const TYPE_ICONS: Record<string, any> = { ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap };

const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('fr-FR', { timeZone: 'UTC' });
const fmtLong = (d: string | Date) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--on-brand)]">
        <span className="text-4xl font-extrabold leading-none">{nb(value)}</span>
        <span className="text-sm font-semibold opacity-90 mt-1">sur {max} jours</span>
      </div>
    </div>
  );
}

// ─── Ligne du "calcul pas à pas" ─────────────────────────────────────────────

function Step({
  sign, tone, label, value, help, strong,
}: { sign: string; tone: string; label: string; value: string; help?: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex gap-3 py-2.5 ${strong ? '' : 'border-b border-[var(--border)]/70'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${tone}`}>{sign}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`text-sm ${strong ? 'font-extrabold text-[var(--text)]' : 'font-semibold text-[var(--text)]'}`}>{label}</p>
          <p className={`shrink-0 ${strong ? 'text-xl font-semibold text-[var(--action)] ' : 'text-base font-semibold text-[var(--text)]'}`}>{value}</p>
        </div>
        {help && <p className="text-xs text-[var(--text-muted)] mt-0.5">{help}</p>}
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

function CardTitle({ icon: Icon, children, tone = 'text-[var(--action)]' }: { icon: any; children: React.ReactNode; tone?: string }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text)] mb-4">
      <span className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center"><Icon size={16} className={tone} /></span>
      {children}
    </h2>
  );
}

export default function MonEspaceCongesPage() {
  const [uiStatus,setUiStatus]=useState<RequestGroup>('pending');
  const { bp } = useBasePath();
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [ex, setEx] = useState<any>(null); // solde expliqué
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [carryover, setCarryover] = useState<any[]>([]);

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
      setRequestError('Dates requises');
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
        <ModulePageSkeleton />
      </div>
    );
  }

  const nd = ex?.nextDeparture;
  const uiLeaves=myLeaves.filter(leave=>uiStatus==='all'||requestStatus(leave.status).group===uiStatus);

  return (
    <ModulePageFrame kind="list"><div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 space-y-5">
      <CongeSubNav userRole={userRole} />

      <header className="template-header"><h1>Mes demandes de congé</h1><Link href={bp('/conges/nouveau')} className="k-button k-button-primary">Nouvelle demande</Link></header>
      {/* ── 1) Résumé : le chiffre qui compte ── */}
      {ex ? (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="leave-hero relative overflow-hidden rounded-3xl bg-[var(--brand)]    text-[var(--on-brand)] p-6 sm:p-8 shadow-lg "
        >
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[var(--surface)]" />
          <div className="absolute right-24 -bottom-16 w-44 h-44 rounded-full bg-[var(--surface)]" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <Ring value={ex.base.acquired} max={ex.base.max} />
            <div className="text-center md:text-left flex-1">
              <p className="flex items-center justify-center md:justify-start gap-1.5 text-[var(--action)] text-sm font-semibold">
                <Sparkles size={15} /> Bonjour {ex.employee.firstName}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-1 leading-tight">
                <span className="underline decoration-white/40 decoration-4 underline-offset-4">{nb(ex.totals.remaining)} {plural(ex.totals.remaining, 'jour', 'jours')}</span> restants
              </h2>
              <div className="grid grid-cols-3 gap-2 mt-5 max-w-md mx-auto md:mx-0">
                {[
                  ['Mon droit total', nb(ex.totals.entitled)],
                  ['Déjà pris', nb(ex.totals.taken)],
                  ['Il me reste', nb(ex.totals.remaining)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-2xl bg-[var(--surface)] backdrop-blur px-3 py-2.5 text-center">
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
          <p className="text-sm text-[var(--text-muted)]">Solde indisponible</p>
        </Card>
      )}

      {ex && !ex.cycle.canTakeLeave && (
        <div className="flex items-start gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  px-4 py-3 text-sm text-[var(--warning-text)] ">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <span>
            Départ possible dès le <strong>{fmtLong(ex.cycle.eligibleDate)}</strong> · {ex.cycle.monthsUntilEligible} mois
          </span>
        </div>
      )}

      {ex && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* ── 2) Le calcul pas à pas ── */}
          <Card className="lg:col-span-3">
            <CardTitle icon={Wallet}>Mon solde</CardTitle>
            <Step
              sign="+" tone="bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] text-[var(--action)]  "
              label="Base acquise" value={`${nb(ex.base.acquired)} j`}
              help={`${ex.cycle.monthsElapsedFull} mois × ${nb(ex.base.perMonth)} j`}
            />
            {ex.seniority.applies && (
              <Step
                sign="+" tone="bg-[var(--brand-soft)] text-[var(--action)]  "
                label="Ancienneté" value={`${nb(ex.seniority.days)} j`}
              />
            )}
            <Step
              sign="−" tone="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]  "
              label="Déjà pris" value={`${nb(ex.totals.taken)} j`}
              help={ex.anticipated.days > 0 ? `dont ${nb(ex.anticipated.days)} j en anticipé` : undefined}
            />
            <Step
              sign="=" tone="bg-[var(--brand)] text-[var(--on-brand)]"
              label="Il me reste" value={`${nb(ex.totals.remaining)} j`} strong
            />

            {(ex.cycle.progressPct < 100 || ex.anticipated.days > 0) && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--border)]  bg-[var(--brand-soft)]  px-4 py-3">
                <span className="text-xs font-semibold text-[var(--action)] ">Fin de cycle · {fmtDate(ex.projection.cycleEndDate)}</span>
                <span className="text-sm font-extrabold text-[var(--text)]">{nb(ex.projection.remainingAtCycleEnd)} j</span>
              </div>
            )}
          </Card>

          {/* ── 3) Mon cycle ── */}
          <Card className="lg:col-span-2">
            <CardTitle icon={CalendarCheck} tone="text-[var(--action)]">Mon cycle de congé</CardTitle>
            <div className="relative pt-6 pb-2">
              <div className="h-3 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--brand)]  "
                  initial={{ width: 0 }}
                  animate={{ width: `${ex.cycle.progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <div
                className="absolute top-0 -translate-x-1/2 text-[11px] font-semibold text-[var(--action)]  whitespace-nowrap"
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
              <p className="text-xs text-[var(--text-muted)] mt-4">
                +{nb(ex.base.perMonth)} j dans {ex.base.daysUntilNextAccrual} {plural(ex.base.daysUntilNextAccrual, 'jour', 'jours')}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* ── Congés pris en avance (anticipés) ── */}
      {ex && ex.anticipated.leaves.length > 0 && (
        <Card className="!border-[var(--border)] dark:!border-[var(--border)]">
          <CardTitle icon={Zap} tone="text-[var(--warning-text)]">Congés anticipés</CardTitle>
          <div className="space-y-2">
            {ex.anticipated.leaves.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  px-4 py-2.5">
                <span className="text-sm text-[var(--text)]">{fmtDate(a.startDate)} → {fmtDate(a.endDate)}</span>
                <span className="text-sm font-semibold text-[var(--warning-text)]  shrink-0">− {nb(a.days)} j</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {ex && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* ── 4) Mon prochain départ ── */}
          <Card>
            <CardTitle icon={Plane} tone="text-[var(--action)]">Prochain départ</CardTitle>
            {nd?.kind === 'IN_PROGRESS' && (
              <div className="rounded-2xl bg-[var(--brand-soft)]  p-4">
                <p className="text-sm font-semibold text-[var(--action)]  flex items-center gap-2"><Sun size={16} /> En congé</p>
                <p className="text-sm text-[var(--text)] mt-1">Jusqu’au <strong>{fmtLong(nd.endDate)}</strong></p>
              </div>
            )}
            {nd?.kind === 'PLANNED' && (
              <div className={`rounded-2xl p-4 ${nd.status === 'APPROVED' ? 'bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))] ' : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] '}`}>
                <p className={`text-sm font-semibold flex items-center gap-2 ${nd.status === 'APPROVED' ? 'text-[var(--action)] ' : 'text-[var(--warning-text)] '}`}>
                  {nd.status === 'APPROVED' ? <><CheckCircle2 size={16} /> Validé</> : <><Clock size={16} /> En attente</>}
                </p>
                <p className="text-sm text-[var(--text)] mt-1">
                  {fmtDate(nd.startDate)} → {fmtDate(nd.endDate)} · {nb(nd.days)} j
                </p>
              </div>
            )}
            {nd?.kind === 'PROBABLE' && (
              <div className="rounded-2xl border-2 border-dashed border-[var(--border)]  p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--action)]">Probable</p>
                <p className="text-xl font-extrabold text-[var(--text)] mt-0.5">
                  {nd.reason === 'AVAILABLE_NOW' ? 'Dès maintenant' : fmtLong(nd.startDate)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{nb(ex.projection.remainingAtCycleEnd)} j disponibles</p>
                <Link
                  href={bp('/conges/nouveau')}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[var(--on-brand)] bg-[var(--brand)] hover:bg-[var(--brand)] px-3.5 py-2 rounded-xl"
                >
                  Faire une demande <ArrowRight size={13} />
                </Link>
              </div>
            )}
            {nd?.kind === 'NOT_YET' && (
              <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                <p className="text-sm text-[var(--text)]">
                  Possible dès le <strong>{fmtLong(nd.startDate)}</strong>
                </p>
              </div>
            )}
            {nd?.kind === 'NONE' && (
              <p className="text-sm text-[var(--text-muted)]">Aucun</p>
            )}
          </Card>

          {/* ── 5) Mon ancienneté ── */}
          <Card>
            <CardTitle icon={Award} tone="text-[var(--action)]">Mon ancienneté</CardTitle>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl bg-[var(--surface-2)] p-3">
                <p className="text-[11px] text-[var(--text-muted)]">Embauché le</p>
                <p className="text-sm font-semibold text-[var(--text)]">{fmtDate(ex.employee.hireDate)}</p>
              </div>
              <div className="rounded-2xl bg-[var(--brand-soft)]  p-3">
                <p className="text-[11px] text-[var(--action)] ">Ancienneté</p>
                <p className="text-sm font-semibold text-[var(--text)]">{ex.employee.seniority.label}</p>
              </div>
            </div>
            {ex.seniority.applies && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--text-muted)]">{ex.seniority.conventionName || 'Bonus'}</span>
                <strong className="text-[var(--text)]">+{nb(ex.seniority.currentBonus)} j</strong>
              </div>
            )}
            {ex.seniority.applies && ex.seniority.next && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Prochain palier : {ex.seniority.next.minYears} ans · {fmtDate(ex.seniority.next.date)} (+{nb(ex.seniority.next.days)} j)
              </p>
            )}
          </Card>
        </div>
      )}

      {/* ── Reliquat de retour anticipé — jours non pris à rattraper ── */}
      {carryover.length > 0 && (
        <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-3xl p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--warning-text)]  mb-3">
            <History size={16} /> Jours à prendre
          </div>
          <div className="space-y-3">
            {carryover.map(co => (
              <div key={co.sourceLeaveId} className="bg-[var(--surface)] rounded-2xl p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">
                    {fmtDate(co.originalStartDate)} → {fmtDate(co.originalEndDate)}
                  </p>
                  {co.kind === 'PARTIAL_ANNUAL' ? (
                    <>
                      <p className="text-xs text-[var(--text-muted)]">
                        {co.remainingBaseDays != null && (
                          <>{Math.round(co.remainingBaseDays * 10) / 10} j base{co.remainingSeniorityDays > 0 && ` + ${Math.round(co.remainingSeniorityDays * 10) / 10} j ancienneté`} · </>
                        )}
                        {co.nextDepartureDate ? <>départ le <strong>{fmtDate(co.nextDepartureDate)}</strong></> : 'date à confirmer'}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">Retour le {fmtDate(co.actualReturnDate)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-semibold text-[var(--warning-text)] ">{Math.round(co.remainingDays * 10) / 10}j</span>
                  {co.kind !== 'PARTIAL_ANNUAL' && (
                    <Button variant="ghost"
                      onClick={() => openRequestModal(co)}
                      className="text-xs font-semibold px-3 py-2 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)]"
                    >
                      Demander
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Mes demandes ── */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">Mes demandes</h2>
          <Link href={bp('/conges/nouveau')} className="text-xs font-semibold text-[var(--action)] hover:text-[var(--action)] flex items-center gap-1">
            Nouvelle <ArrowRight size={12} />
          </Link>
        </div>
        <div className="p-4"><RequestStatusTabs value={uiStatus} onChange={setUiStatus} /></div>
        {uiLeaves.length === 0 ? (
          <RequestEmptyState onCreate={()=>window.location.assign(bp('/conges/nouveau'))} />
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {uiLeaves.map(leave => {
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
                        {leave.carriedFromLeaveId ? 'Rattrapage' : (TYPE_LABELS[leave.type] || leave.type)}
                        {leave.carriedFromLeaveId && (
                          <span className="text-[10px] font-semibold text-[var(--warning-text)]  bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  px-1.5 py-0.5 rounded">Non payé</span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 flex-wrap">
                        {fmtDate(leave.startDate)} <ArrowRight size={10} /> {fmtDate(leave.endDate)} · {Math.round(Number(leave.daysCount))} {plural(Math.round(Number(leave.daysCount)), 'jour', 'jours')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RequestStatusBadge status={leave.status} />
                    {/* 💬 En attente / refusé : contacter l'administration pour s'expliquer */}
                    <ContactAdminButton
                      variant="compact"
                      status={leave.status}
                      decidedByUserId={leave.rejectedBy}
                      requestLabel={`ma demande de congé du ${fmtDate(leave.startDate)} au ${fmtDate(leave.endDate)}`}
                    />
                    {['PENDING', 'APPROVED'].includes(leave.status) && (
                      <Button variant="ghost"
                        onClick={() => handleCancel(leave.id)}
                        disabled={cancellingId === leave.id}
                        className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--danger-text)] disabled:opacity-40"
                      >
                        {cancellingId === leave.id ? <Loader2 size={12} className="animate-spin" /> : 'Annuler'}
                      </Button>
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
            className="fixed inset-0 bg-[rgb(0_0_0_/.48)] flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text)]">Jours restants</h2>
                <Button variant="ghost" onClick={() => setRequesting(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X size={20} />
                </Button>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                <strong className="text-[var(--text)]">{Math.round(requesting.remainingDays * 10) / 10} j</strong> à rattraper · repos non payé
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
                <div className="flex items-start gap-2 text-xs text-[var(--danger-text)]">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {requestError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setRequesting(null)} className="px-4 py-2 text-sm font-semibold rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                  Annuler
                </Button>
                <Button variant="ghost"
                  onClick={submitCarryoverRequest}
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] flex items-center gap-2 disabled:opacity-40"
                >
                  {isSubmittingRequest ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Envoyer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div></ModulePageFrame>
  );
}