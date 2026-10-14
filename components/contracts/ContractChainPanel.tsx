'use client';

// ============================================================================
// 📁 components/contracts/ContractChainPanel.tsx
// Traçabilité des contrats d'un employé : 1er contrat → renouvellement →
// (conversion CDI), chaque maillon avec TOUS les champs renvoyés par le back.
// À placer dans la page « Fiche contrat » (voir patches/03-front.md).
// ============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCcw, Infinity as InfinityIcon, History, Link2, Calendar, Wallet, Briefcase,
  FileSignature, UserCheck, Clock, CheckCircle2, ShieldAlert, Scale, FlaskConical, Layers, Info,
} from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import {
  contractChainService, type ChainRules, type ContractChain, type ContractLink, type RuleViolation,
} from '@/services/contract-chain';
import { authService } from '@/lib/services/authService';
import { useBasePath } from '@/hooks/useBasePath';
import SlideOver from '@/components/SlideOver';
import AuditHistoryPanel from '@/components/audit/AuditHistoryPanel';
import ContractRenewalModal, { ViolationList } from './ContractRenewalModal';
import {
  CONTRACT_TYPE_LABEL, KIND_LABEL, MOTIF_LABEL, STATUS_LABEL, fmtDate, fmtDateTime, fmtMoney,
} from '@/lib/audit-labels';

const WRITE_ROLES = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN'];
const OVERRIDE_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  CONVERTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  TERMINATED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  TRIAL_FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};
const statusCls = (s: string) => STATUS_CLS[s] ?? 'bg-[var(--surface-2)] text-[var(--text-muted)]';

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-0.5"><Icon className="w-3 h-3" /> {label}</p>
      <p className="text-sm font-semibold text-[var(--text)] break-words">{value}</p>
    </div>
  );
}

function LinkCard({
  link, all, isLast, onHistory,
}: { link: ContractLink; all: ContractLink[]; isLast: boolean; onHistory: () => void }) {
  const previous = link.previousContractId ? all.find(l => l.id === link.previousContractId) : null;
  return (
    <div className="relative pl-8">
      <span className={`absolute left-0 top-4 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${isLast
        ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
        {link.rank}
      </span>
      <div className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${isLast ? 'border-[var(--brand)] bg-[var(--surface)] shadow-sm' : 'border-[var(--border)] bg-[var(--surface)]'}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-[var(--text)]">{KIND_LABEL[link.kind] ?? link.kind}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--surface-2)] text-[var(--text)]">
              {CONTRACT_TYPE_LABEL[link.contractType] ?? link.contractType}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusCls(link.status)}`}>
              {STATUS_LABEL[link.status] ?? link.status}
            </span>
          </div>
          <button type="button" onClick={onHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)]">
            <History className="w-3.5 h-3.5" /> Historique d'audit
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          <Field icon={Calendar} label="Début" value={fmtDate(link.startDate)} />
          <Field icon={Calendar} label="Fin" value={link.endDate ? fmtDate(link.endDate) : 'Durée indéterminée'} />
          <Field icon={Clock} label="Durée" value={link.duration ? `${link.duration} mois` : '—'} />
          <Field icon={Briefcase} label="Poste" value={link.position} />
          <Field icon={Wallet} label="Salaire de base" value={fmtMoney(link.baseSalary)} />
          <Field icon={Layers} label="Renouvellements cumulés" value={link.renewalCount} />
          {link.cddMotif && <Field icon={Scale} label="Motif du CDD" value={MOTIF_LABEL[link.cddMotif] ?? link.cddMotif} />}
          {link.renewalReason && <div className="col-span-2 sm:col-span-3"><Field icon={Info} label={link.kind === 'CONVERSION_CDI' ? 'Raison de la conversion' : 'Raison du renouvellement'} value={link.renewalReason} /></div>}
          <Field icon={FileSignature} label="Signature" value={
            <>{link.signedAt ? fmtDate(link.signedAt) : 'Date non renseignée'}{' · '}{link.signedByEmp ? "signé par l'employé" : "non signé par l'employé"}</>
          } />
          {(link.trialPeriodDays || link.trialEndDate) && (
            <Field icon={FlaskConical} label="Période d'essai" value={
              <>{link.trialPeriodDays ? `${link.trialPeriodDays} jours` : ''}{link.trialEndDate ? ` · fin ${fmtDate(link.trialEndDate)}` : ''}</>
            } />
          )}
          {previous && <Field icon={Link2} label="Fait suite au" value={`Contrat de rang ${previous.rank} (${KIND_LABEL[previous.kind] ?? previous.kind})`} />}
          {link.renewedAt && (
            <Field icon={CheckCircle2} label="Clos le" value={<>{fmtDateTime(link.renewedAt)}{link.renewedByName ? ` · par ${link.renewedByName}` : ''}</>} />
          )}
          <Field icon={UserCheck} label="Enregistré le" value={<>{fmtDateTime(link.createdAt)}{link.createdByName ? ` · par ${link.createdByName}` : ''}</>} />
        </div>
      </div>
    </div>
  );
}

export default function ContractChainPanel({ employeeId }: { employeeId: string }) {
  const { companyId, isPme } = useBasePath();
  const [role, setRole] = useState<string | null>(null);
  const [chains, setChains] = useState<ContractChain[] | null>(null);
  const [rules, setRules] = useState<ChainRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ last: ContractLink; mode: 'RENEW' | 'CONVERT' } | null>(null);
  const [history, setHistory] = useState<ContractLink | null>(null);
  const [notice, setNotice] = useState<{ text: string; warnings: RuleViolation[] } | null>(null);

  useEffect(() => { setRole(authService.getCurrentUser()?.role ?? null); }, []);
  const canWrite = !!role && WRITE_ROLES.includes(role);
  const canOverride = !!role && OVERRIDE_ROLES.includes(role);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, r] = await Promise.all([
        contractChainService.chains(employeeId),
        contractChainService.rules().catch(() => null),
      ]);
      setChains(c); setRules(r);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les contrats');
      setChains([]);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  // Arrivée depuis la liste « Contrats expirant » : ?renouveler=1 ouvre directement le modal.
  useEffect(() => {
    if (!chains || modal || typeof window === 'undefined') return;
    if (new URLSearchParams(window.location.search).get('renouveler') !== '1') return;
    const cur = chains.find(c => c.current);
    const last = cur?.links[cur.links.length - 1];
    if (canWrite && last && last.contractType === 'CDD') setModal({ last, mode: 'RENEW' });
  }, [chains, canWrite]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!chains) {
    return <KonzaLoader variant="section" />;
  }

  const sorted = [...chains].sort((a, b) => Number(b.current) - Number(a.current)
    || (b.links[b.links.length - 1].startDate).localeCompare(a.links[a.links.length - 1].startDate));

  return (
    <section className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5" /> Traçabilité des contrats
      </p>

      {notice && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3 space-y-2">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {notice.text}</p>
          {notice.warnings.length > 0 && (
            <>
              <p className="text-xs text-[var(--text-muted)]">Points d'attention relevés par le contrôle :</p>
              <ViolationList violations={notice.warnings} />
            </>
          )}
        </motion.div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2"><ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" /> {error}</p>}

      {!error && sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
          Aucun contrat enregistré pour cet employé.
        </div>
      )}

      {sorted.map(chain => {
        const last = chain.links[chain.links.length - 1];
        const isCdd = last.contractType === 'CDD' && ['ACTIVE', 'TRIAL'].includes(last.status);
        const exhausted = chain.renewalsUsed >= chain.renewalsAllowed;
        return (
          <div key={chain.chainId} className="bg-[var(--surface-2)]/40 rounded-2xl border border-[var(--border)] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${chain.current ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                  {chain.current ? 'Chaîne en cours' : 'Chaîne terminée'}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{chain.links.length} contrat{chain.links.length > 1 ? 's' : ''}</span>
                {chain.renewalsAllowed > 0 && (
                  <span className="text-xs text-[var(--text-muted)]">· renouvellements : {chain.renewalsUsed}/{chain.renewalsAllowed}</span>
                )}
                <span className="text-[10px] font-mono text-[var(--text-muted)]">chaîne {chain.chainId.slice(0, 8)}…</span>
              </div>

              {chain.current && canWrite && isCdd && (
                <div className="flex gap-2">
                  <button type="button" disabled={exhausted} onClick={() => setModal({ last, mode: 'RENEW' })}
                    title={exhausted ? 'Un seul renouvellement autorisé : passez en CDI' : undefined}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white disabled:opacity-40 disabled:cursor-not-allowed">
                    <RotateCcw className="w-3.5 h-3.5" /> Renouveler
                  </button>
                  <button type="button" onClick={() => setModal({ last, mode: 'CONVERT' })}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]">
                    <InfinityIcon className="w-3.5 h-3.5" /> Convertir en CDI
                  </button>
                </div>
              )}
            </div>

            {chain.current && canWrite && isCdd && exhausted && (
              <p className="text-xs text-[var(--text-muted)] flex gap-2"><Info className="w-4 h-4 shrink-0" />
                Le seul renouvellement autorisé a été utilisé : la suite logique est la conversion en CDI.
              </p>
            )}

            <div className="space-y-3 relative before:absolute before:left-3 before:top-6 before:bottom-6 before:w-px before:bg-[var(--border)]">
              {chain.links.map(l => (
                <LinkCard key={l.id} link={l} all={chain.links} isLast={l.id === last.id} onHistory={() => setHistory(l)} />
              ))}
            </div>
          </div>
        );
      })}

      {modal && (
        <ContractRenewalModal last={modal.last} rules={rules} canOverride={canOverride} initialMode={modal.mode}
          onClose={() => setModal(null)}
          onDone={({ mode, warnings }) => {
            setModal(null);
            setNotice({ text: mode === 'RENEW' ? 'Contrat renouvelé : un nouveau maillon a été ajouté à la chaîne.' : 'CDD converti en CDI : la chaîne a été mise à jour.', warnings });
            load();
          }} />
      )}

      <SlideOver open={!!history} onClose={() => setHistory(null)} widthClass="max-w-xl"
        title="Historique d'audit du contrat"
        subtitle={history ? `Rang ${history.rank} · ${KIND_LABEL[history.kind] ?? history.kind}` : undefined}>
        {history && (
          <AuditHistoryPanel entity="EMPLOYEE_CONTRACT" entityId={history.id}
            companyId={isPme ? companyId : undefined} viewerRole={role ?? undefined} />
        )}
      </SlideOver>
    </section>
  );
}