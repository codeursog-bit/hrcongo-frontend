// ============================================================================
// 🏛️ PAGE SUPER ADMIN — Gestion des cabinets
// Fichier: frontend/app/admin/(protected)/cabinets/page.tsx
// Vue d'ensemble (wallets, revenus, « à traiter ») · Liste · Fiche cabinet + actions
// Effectifs recomptés en direct ; chaque action exige un motif et est tracée.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Landmark, Search, Loader2, AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight, Power, Coins,
  Infinity as InfinityIcon, Clock, RefreshCw, ExternalLink, Trash2, Building2, Users,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const errMsg = (e: any) => e?.message || 'Une erreur est survenue';
const fmt = (n?: number | null) => `${Math.round(n ?? 0).toLocaleString('fr-FR')} F`;
const fmtN = (n?: number | null) => (n ?? 0).toLocaleString('fr-FR');
const fmtDT = (d?: string | null) => (d ? new Date(d).toLocaleString('fr-FR') : '—');
const fmtD = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

const STATES: { id: string; label: string }[] = [
  { id: '', label: 'Tous' }, { id: 'active', label: 'Actifs' }, { id: 'inactive', label: 'Désactivés' },
  { id: 'no_balance', label: 'Solde épuisé' }, { id: 'trial', label: 'En essai' },
  { id: 'forfait', label: 'Forfait illimité' }, { id: 'no_wallet', label: 'Sans wallet' },
];
const TX_LABEL: Record<string, string> = {
  TRIAL_CREDIT: 'Essai', PACK_PURCHASE: 'Achat pack', FORFAIT_ACTIVATION: 'Forfait activé', BULLETIN_DEBIT: 'Bulletin débité',
  BULLETIN_REFUND: 'Bulletin remboursé', MANUAL_CREDIT: 'Ajustement manuel', FORFAIT_RESET: 'Forfait terminé',
};
const PAY_STATUS: Record<string, string> = { PENDING: 'En attente', PROCESSING: 'En cours', SUCCEEDED: 'Réussi', FAILED: 'Échoué', REFUNDED: 'Remboursé' };
const ROLE_LABEL: Record<string, string> = { CABINET_ADMIN: 'Admin cabinet', GESTIONNAIRE: 'Gestionnaire' };

const card = 'bg-gray-900 border border-gray-800 rounded-2xl p-4';
const inputCls = 'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600';
const btnGhost = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors disabled:opacity-50';
const btnDanger = 'flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600/15 hover:bg-red-600/30 text-red-300 rounded-lg text-xs transition-colors disabled:opacity-50';

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-2 border ${
      m.ok ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : 'text-red-300 border-red-500/25 bg-red-500/10'}`}>
      {m.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {m.text}
    </div>
  );
}
function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return <div className={card}><div className="text-xs text-gray-500">{label}</div><div className="text-2xl font-semibold text-white mt-1">{value}</div>{sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-2"><h3 className="text-xs uppercase tracking-wide text-gray-500">{title}</h3>{children}</div>;
}
function Badge({ children, tone }: { children: React.ReactNode; tone: 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'purple' }) {
  const cls = { green: 'bg-emerald-500/15 text-emerald-300', red: 'bg-red-500/15 text-red-300', amber: 'bg-amber-500/15 text-amber-300', blue: 'bg-blue-500/15 text-blue-300', gray: 'bg-gray-700/40 text-gray-300', purple: 'bg-purple-500/15 text-purple-300' }[tone];
  return <span className={`px-2 py-0.5 rounded-full text-[11px] ${cls}`}>{children}</span>;
}

function WalletBadges({ w }: { w: any }) {
  if (!w) return <Badge tone="red">Sans wallet</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {w.forfaitActive && <Badge tone="purple">Forfait · {fmtD(w.forfaitExpiresAt)}</Badge>}
      {w.trialActive && <Badge tone="blue">Essai · {fmtD(w.trialExpiresAt)}</Badge>}
      {w.trialExpired && <Badge tone="amber">Essai expiré</Badge>}
      {!w.forfaitActive && <Badge tone={w.balance > 0 ? 'green' : 'red'}>{w.balance} bulletin(s)</Badge>}
    </div>
  );
}

// ── Modale de confirmation (motif obligatoire + champ optionnel) ─────────────
type Confirm = {
  title: string; description: React.ReactNode; danger?: boolean; confirmLabel: string;
  input?: { label: string; kind: 'number' | 'select'; initial?: string; options?: { value: string; label: string }[]; min?: number; max?: number };
  run: (reason: string, value: string) => Promise<void>;
};

function ConfirmModal({ c, onClose }: { c: Confirm; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [value, setValue] = useState(c.input?.initial ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = reason.trim().length >= 5 && (!c.input || value.trim() !== '');
  const go = async () => {
    setBusy(true); setErr(null);
    try { await c.run(reason.trim(), value.trim()); onClose(); } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold ${c.danger ? 'text-red-300' : 'text-white'}`}>{c.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={16} /></button>
        </div>
        <div className="text-sm text-gray-400 space-y-1">{c.description}</div>
        {c.input && (
          <label className="text-xs text-gray-400 space-y-1 block">{c.input.label}
            {c.input.kind === 'select'
              ? <select className={inputCls} value={value} onChange={e => setValue(e.target.value)}>{c.input.options!.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              : <input type="number" className={inputCls} min={c.input.min} max={c.input.max} value={value} onChange={e => setValue(e.target.value)} />}
          </label>
        )}
        <label className="text-xs text-gray-400 space-y-1 block">
          Motif (obligatoire — enregistré dans le journal d'audit)
          <textarea className={`${inputCls} min-h-[70px]`} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex. : geste commercial, paiement reçu hors plateforme" />
        </label>
        {err && <Msg m={{ ok: false, text: err }} />}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose} disabled={busy}>Annuler</button>
          <button disabled={!valid || busy} onClick={go}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white disabled:opacity-50 ${c.danger ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
            {busy && <Loader2 size={14} className="animate-spin" />} {c.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Fiche cabinet ────────────────────────────────────────────────────────────
function CabinetDrawer({ id, onClose, onChanged, ask, notify }: {
  id: string; onClose: () => void; onChanged: () => void; ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void;
}) {
  const router = useRouter();
  const [c, setC] = useState<any>(null);
  const load = useCallback(async () => {
    try { setC(await adminService.get<any>(`/admin/cabinets/${id}`)); } catch (e) { notify({ ok: false, text: errMsg(e) }); onClose(); }
  }, [id, notify, onClose]);
  useEffect(() => { load(); }, [load]);

  const after = (text: string) => { notify({ ok: true, text }); load(); onChanged(); };
  const base = `/admin/cabinets/${id}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="absolute inset-0" onClick={onClose} />
      <aside className="relative w-full max-w-2xl h-full overflow-y-auto bg-gray-900 border-l border-gray-800 p-5 space-y-5">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white"><X size={18} /></button>
        {!c ? <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p> : (
          <>
            <div>
              <h2 className="text-lg font-semibold text-white">{c.name}</h2>
              <p className="text-sm text-gray-500">{c.email}{c.phone ? ` · ${c.phone}` : ''} · {c.subdomain}.konza-rh.app</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge tone={c.isActive ? 'green' : 'red'}>{c.isActive ? 'Actif' : 'Désactivé'}</Badge>
                {c.affiliate && <Badge tone="gray">Affilié : {c.affiliate.name} ({c.affiliate.code})</Badge>}
                <Badge tone="gray">Créé le {fmtD(c.createdAt)}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="PME actives" value={c.live.companies} />
              <Stat label="Employés actifs" value={fmtN(c.live.employees)} sub="recompté en direct" />
              <Stat label="Membres" value={c.live.members} />
              <Stat label="Bulletins ce mois" value={fmtN(c.live.payrollsThisMonth)} />
            </div>

            <Section title="Actions">
              <div className="flex flex-wrap gap-2">
                <button className={btnGhost} disabled={!c.wallet} onClick={() => ask({
                  title: 'Ajuster le solde de bulletins', confirmLabel: 'Appliquer',
                  description: <p>Solde actuel : <b className="text-gray-200">{c.wallet?.balance}</b> bulletin(s). Valeur positive = crédit, négative = correction (le solde ne peut pas devenir négatif).</p>,
                  input: { label: 'Variation (ex. 20 ou −10)', kind: 'number', initial: '10', min: -10000, max: 10000 },
                  run: async (reason, v) => { await adminService.post(`${base}/bulletins`, { delta: Number(v), reason }); after('Solde ajusté'); },
                })}><Coins size={12} /> Ajuster le solde</button>
                <button className={btnGhost} disabled={!c.wallet} onClick={() => ask({
                  title: c.wallet?.forfaitActive ? 'Prolonger le forfait illimité' : 'Activer le forfait illimité', confirmLabel: 'Valider',
                  description: <p>Bulletins illimités pendant la durée choisie{c.wallet?.forfaitActive ? ` (ajoutée à la fin actuelle : ${fmtD(c.wallet.forfaitExpiresAt)})` : ''}.</p>,
                  input: { label: 'Durée', kind: 'select', initial: '1', options: [1, 2, 3, 6, 12].map(m => ({ value: String(m), label: `${m} mois` })) },
                  run: async (reason, v) => { await adminService.post(`${base}/forfait`, { active: true, months: Number(v), reason }); after('Forfait activé'); },
                })}><InfinityIcon size={12} /> {c.wallet?.forfaitActive ? 'Prolonger le forfait' : 'Activer le forfait'}</button>
                {c.wallet?.forfaitActive && <button className={btnDanger} onClick={() => ask({
                  title: 'Terminer le forfait', danger: true, confirmLabel: 'Terminer le forfait',
                  description: <p>Le forfait s'arrête immédiatement ; le cabinet repasse sur son solde de bulletins ({c.wallet.balance}).</p>,
                  run: async (reason) => { await adminService.post(`${base}/forfait`, { active: false, reason }); after('Forfait terminé'); },
                })}>Terminer le forfait</button>}
                <button className={btnGhost} disabled={!c.wallet} onClick={() => ask({
                  title: "Prolonger l'essai", confirmLabel: 'Prolonger',
                  description: <p>Fin d'essai actuelle : {fmtD(c.wallet?.trialExpiresAt)}. La durée s'ajoute à la fin actuelle (ou à aujourd'hui si l'essai est expiré).</p>,
                  input: { label: 'Jours supplémentaires', kind: 'number', initial: '30', min: 1, max: 180 },
                  run: async (reason, v) => { await adminService.post(`${base}/trial`, { days: Number(v), reason }); after('Essai prolongé'); },
                })}><Clock size={12} /> Prolonger l'essai</button>
                <button className={c.isActive ? btnDanger : btnGhost} onClick={() => ask({
                  title: c.isActive ? 'Désactiver le cabinet' : 'Réactiver le cabinet', danger: c.isActive, confirmLabel: c.isActive ? 'Désactiver' : 'Réactiver',
                  description: c.isActive ? <p>Les membres ne pourront plus se connecter et leurs sessions ouvertes seront coupées.</p> : <p>Les membres pourront de nouveau se connecter.</p>,
                  run: async (reason) => { await adminService.patch(`${base}/active`, { isActive: !c.isActive, reason }); after(c.isActive ? 'Cabinet désactivé' : 'Cabinet réactivé'); },
                })}><Power size={12} /> {c.isActive ? 'Désactiver' : 'Réactiver'}</button>
              </div>
            </Section>

            <Section title="Wallet">
              {!c.wallet ? <p className="text-sm text-red-300">Ce cabinet n'a pas de wallet : il ne peut pas générer de bulletins.</p> : (
                <>
                  <div className="flex flex-wrap items-center gap-2"><WalletBadges w={c.wallet} />
                    <span className="text-xs text-gray-500">{c.wallet.usedThisMonth} bulletin(s) utilisé(s) ce mois · {c.wallet.canGenerate ? 'peut générer' : 'ne peut pas générer'}</span></div>
                  <div className="space-y-1 mt-2">
                    {c.wallet.transactions.length === 0 && <p className="text-sm text-gray-500">Aucun mouvement</p>}
                    {c.wallet.transactions.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-xs bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5">
                        <span className="text-gray-300 truncate pr-2">{TX_LABEL[t.type] ?? t.type} · <span className="text-gray-500">{t.description}</span></span>
                        <span className="text-gray-400 whitespace-nowrap">{t.amount > 0 ? '+' : ''}{t.amount} → {t.balanceAfter} · {fmtD(t.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>

            <Section title={`PME clientes (${c.companies.length})`}>
              {c.companies.length === 0 && <p className="text-sm text-gray-500">Aucune PME rattachée</p>}
              <div className="space-y-2">
                {c.companies.map((co: any) => (
                  <div key={co.id} className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-white flex items-center gap-2"><Building2 size={13} /> {co.name}
                        {!co.linkActive && <Badge tone="gray">lien inactif</Badge>}{!co.companyActive && <Badge tone="red">entreprise inactive</Badge>}</p>
                      <button className={btnGhost} onClick={() => router.push(`/admin/companies/${co.id}/gestion`)}><ExternalLink size={12} /> Gestion</button>
                    </div>
                    <p className="text-xs text-gray-500">{co.employees} employé(s) actif(s) · {co.payrollsThisMonth} bulletin(s) ce mois · depuis le {fmtD(co.startDate)}</p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {([['pmePortalEnabled', 'Portail PME'], ['employeeAccessEnabled', 'Accès employés']] as const).map(([k, label]) => (
                        <label key={k} className="flex items-center gap-1.5 text-gray-400 cursor-pointer">
                          <input type="checkbox" checked={co[k]} onChange={() => ask({
                            title: `${label} — ${co[k] ? 'désactiver' : 'activer'}`, confirmLabel: 'Appliquer',
                            description: <p><b className="text-gray-200">{co.name}</b> · {label} sera {co[k] ? 'désactivé' : 'activé'}.</p>,
                            run: async (reason) => { await adminService.patch(`${base}/companies/${co.id}/access`, { [k]: !co[k], reason }); after(`${label} modifié`); },
                          })} /> {label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title={`Membres (${c.members.length})`}>
              <div className="space-y-1.5">
                {c.members.map((m: any) => (
                  <div key={m.userId} className="flex items-center justify-between text-sm bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                    <div><p className="text-white flex items-center gap-2"><Users size={13} /> {m.name} <span className="text-xs text-gray-500">· {ROLE_LABEL[m.role] ?? m.role}</span></p>
                      <p className="text-xs text-gray-500">{m.email} · dernière connexion {fmtDT(m.lastLoginAt)}</p></div>
                    <div className="flex items-center gap-1.5">{!m.isActive && <Badge tone="red">désactivé</Badge>}{m.twoFactorEnabled && <Badge tone="blue">2FA</Badge>}
                      <button className={btnGhost} onClick={() => router.push('/admin/comptes')}><ExternalLink size={12} /> Comptes</button></div>
                  </div>
                ))}
              </div>
              {c.pendingInvitations.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <p className="text-xs text-gray-500">Invitations en attente</p>
                  {c.pendingInvitations.map((i: any) => (
                    <div key={i.id} className="flex items-center justify-between text-xs text-gray-400 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5">
                      <span>{i.email} · expire le {fmtD(i.expiresAt)}</span>
                      <button className={btnDanger} onClick={() => ask({
                        title: "Annuler l'invitation", danger: true, confirmLabel: "Annuler l'invitation",
                        description: <p>Le lien envoyé à <b className="text-gray-200">{i.email}</b> deviendra inutilisable.</p>,
                        run: async (reason) => { await adminService.delete(`/admin/actions/invitations/${i.id}`, { reason }); after('Invitation annulée'); },
                      })}><Trash2 size={12} /> Annuler</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {c.legacySubscription && (
              <Section title="Ancien abonnement (compteurs stockés)">
                <p className="text-xs text-gray-400">{c.legacySubscription.plan} · {c.legacySubscription.status} · limites {c.legacySubscription.maxCompanies} PME / {c.legacySubscription.maxEmployees} employés</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-gray-400">Stocké : {c.legacySubscription.stored.companies} PME / {c.legacySubscription.stored.employees} employés</span>
                  <span className="text-gray-300">En direct : {c.legacySubscription.live.companies} PME / {c.legacySubscription.live.employees} employés</span>
                  {c.legacySubscription.drift
                    ? <><Badge tone="amber">Écart détecté</Badge>
                        <button className={btnGhost} onClick={() => ask({
                          title: 'Resynchroniser les compteurs', confirmLabel: 'Resynchroniser',
                          description: <p>Remplace les valeurs stockées par le recomptage en direct.</p>,
                          run: async (reason) => { await adminService.post(`${base}/recalculate-counters`, { reason }); after('Compteurs resynchronisés'); },
                        })}><RefreshCw size={12} /> Resynchroniser</button></>
                    : <Badge tone="green">Synchronisés</Badge>}
                </div>
              </Section>
            )}

            <Section title="Paiements du cabinet">
              {c.payments.length === 0 && <p className="text-sm text-gray-500">Aucun paiement</p>}
              <div className="space-y-1">
                {c.payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-xs bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5">
                    <span className="text-gray-300">{fmt(p.amount)} · {p.plan ?? '—'}{p.months ? ` · ${p.months} mois` : ''}{p.yabetopayOperator ? ` · ${p.yabetopayOperator} ${p.yabetopayPhone ?? ''}` : ''}</span>
                    <span className="text-gray-500">{PAY_STATUS[p.status] ?? p.status} · {fmtD(p.paidAt ?? p.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Section>

            {c.closures.length > 0 && (
              <Section title="Dernières clôtures groupées">
                {c.closures.map((cl: any) => (
                  <p key={cl.id} className="text-xs text-gray-400 flex justify-between">
                    <span>{String(cl.month).padStart(2, '0')}/{cl.year} · {cl.status}</span>
                    <span>{cl.successCount}/{cl.totalCompanies} PME{cl.failedCount ? ` · ${cl.failedCount} échec(s)` : ''}</span>
                  </p>
                ))}
              </Section>
            )}

            {c.history.length > 0 && (
              <Section title="Actions super admin sur ce cabinet">
                {c.history.map((h: any) => <div key={h.id} className="text-xs"><p className="text-gray-300">{h.summary}</p><p className="text-gray-600">{fmtDT(h.occurredAt)}</p></div>)}
              </Section>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

// ── Vue d'ensemble ───────────────────────────────────────────────────────────
function OverviewTab({ onOpen, ask, notify }: { onOpen: (id: string) => void; ask: (c: Confirm) => void; notify: (m: { ok: boolean; text: string }) => void }) {
  const [o, setO] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => { adminService.get<any>('/admin/cabinets/overview').then(setO).catch(e => setErr(errMsg(e))); }, []);
  useEffect(() => { load(); }, [load]);
  if (err) return <Msg m={{ ok: false, text: err }} />;
  if (!o) return <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Chargement…</p>;
  const a = o.attention;
  const row = (id: string, name: string, extra: string, key: string) => (
    <button key={key} onClick={() => onOpen(id)} className="w-full flex items-center justify-between text-left text-sm hover:bg-gray-800/50 rounded-lg px-2 py-1.5">
      <span className="text-white">{name}</span><span className="text-xs text-gray-400">{extra}</span>
    </button>
  );
  const nothing = !a.zeroBalance.length && !a.trialEndingSoon.length && !a.forfaitEndingSoon.length && !a.stuckPayments.length && !a.noWallet && !a.activeWithoutAdmin && !a.failedClosuresLast30Days;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Cabinets actifs" value={o.cabinets.active} sub={`${o.cabinets.inactive} désactivé(s) · ${o.cabinets.linkedCompanies} PME liées`} />
        <Stat label="Encaissé ce mois" value={fmt(o.revenue.thisMonth)} sub={`${o.revenue.thisMonthCount} paiement(s) · année : ${fmt(o.revenue.thisYear)}`} />
        <Stat label="Bulletins en réserve" value={fmtN(o.wallets.totalBalance)} sub={`${fmtN(o.wallets.usedThisMonth)} utilisés ce mois`} />
        <Stat label="Forfaits / essais" value={`${o.wallets.forfaitActive} / ${o.wallets.trialActive}`} sub={`${o.wallets.trialExpired} essai(s) expiré(s)`} />
      </div>

      <div className={card}>
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-300" /> À traiter</h3>
        {nothing && <p className="text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 size={14} /> Rien à traiter.</p>}
        <div className="grid md:grid-cols-2 gap-4">
          {a.zeroBalance.length > 0 && <div><p className="text-xs text-red-300 mb-1">Solde épuisé — génération bloquée ({o.wallets.zeroBalance})</p>{a.zeroBalance.map((w: any) => row(w.cabinetId, w.name, '0 bulletin', `z${w.cabinetId}`))}</div>}
          {a.trialEndingSoon.length > 0 && <div><p className="text-xs text-amber-300 mb-1">Essai qui se termine sous 7 jours</p>{a.trialEndingSoon.map((w: any) => row(w.cabinetId, w.name, `${fmtD(w.endsAt)} · ${w.balance} bulletin(s)`, `t${w.cabinetId}`))}</div>}
          {a.forfaitEndingSoon.length > 0 && <div><p className="text-xs text-amber-300 mb-1">Forfait qui se termine sous 7 jours</p>{a.forfaitEndingSoon.map((w: any) => row(w.cabinetId, w.name, fmtD(w.endsAt), `f${w.cabinetId}`))}</div>}
          {a.stuckPayments.length > 0 && <div><p className="text-xs text-amber-300 mb-1">Paiements bloqués (&gt; 1 h)</p>{a.stuckPayments.map((p: any) => row(p.cabinetId, p.cabinet, `${fmt(p.amount)} · ${fmtDT(p.createdAt)}`, `p${p.id}`))}</div>}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-400">
          {a.noWallet > 0 && <span className="text-red-300">{a.noWallet} cabinet(s) sans wallet</span>}
          {a.activeWithoutAdmin > 0 && <span className="text-amber-300">{a.activeWithoutAdmin} cabinet(s) actif(s) sans admin</span>}
          {a.failedClosuresLast30Days > 0 && <span className="text-amber-300">{a.failedClosuresLast30Days} clôture(s) groupée(s) en échec sur 30 jours</span>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-3">Plus gros consommateurs ce mois</h3>
          {o.topUsage.length === 0 && <p className="text-sm text-gray-500">Aucune consommation</p>}
          {o.topUsage.map((t: any) => <p key={t.cabinetId} className="text-sm text-gray-300 flex justify-between"><button className="hover:text-white" onClick={() => onOpen(t.cabinetId)}>{t.name}</button><span>{t.used} bulletin(s)</span></p>)}
        </div>
        <div className={card}>
          <h3 className="text-sm font-medium text-white mb-2">Maintenance</h3>
          <p className="text-xs text-gray-500 mb-3">Resynchronise les compteurs stockés (PME / employés) de tous les cabinets avec le recomptage en direct. Seuls ceux qui dérivent sont modifiés et tracés.</p>
          <button className={btnGhost} onClick={() => ask({
            title: 'Resynchroniser tous les compteurs', confirmLabel: 'Lancer',
            description: <p>Compare puis corrige uniquement les écarts.</p>,
            run: async (reason) => { const r = await adminService.post<any>('/admin/cabinets/recalculate-counters', { reason }); notify({ ok: true, text: `${r.checked} cabinet(s) vérifié(s), ${r.corrected} corrigé(s)` }); load(); },
          })}><RefreshCw size={12} /> Resynchroniser tout</button>
        </div>
      </div>
    </div>
  );
}

// ── Liste ────────────────────────────────────────────────────────────────────
function ListTab({ onOpen, refreshKey }: { onOpen: (id: string) => void; refreshKey: number }) {
  const [q, setQ] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (q.trim()) qs.set('q', q.trim());
      if (state) qs.set('state', state);
      setData(await adminService.get<any>(`/admin/cabinets?${qs.toString()}`));
    } catch (e) { setErr(errMsg(e)); } finally { setLoading(false); }
  }, [q, state, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load, refreshKey]);
  useEffect(() => { setPage(1); }, [q, state]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATES.map(s => (
          <button key={s.id || 'all'} onClick={() => setState(s.id)}
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${state === s.id ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'}`}>{s.label}</button>
        ))}
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className={`${inputCls} pl-9`} placeholder="Nom, email ou sous-domaine du cabinet…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {err && <Msg m={{ ok: false, text: err }} />}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 text-left"><tr><th className="px-4 py-3">Cabinet</th><th className="px-4 py-3">PME</th><th className="px-4 py-3">Employés</th><th className="px-4 py-3">Membres</th><th className="px-4 py-3">Wallet</th><th className="px-4 py-3">État</th></tr></thead>
          <tbody className="divide-y divide-gray-800">
            {loading && !data && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500"><Loader2 size={14} className="inline animate-spin" /> Chargement…</td></tr>}
            {data?.items.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Aucun cabinet</td></tr>}
            {data?.items.map((c: any) => (
              <tr key={c.id} onClick={() => onOpen(c.id)} className="hover:bg-gray-800/50 cursor-pointer">
                <td className="px-4 py-3"><p className="text-white">{c.name}</p><p className="text-xs text-gray-500">{c.email}</p></td>
                <td className="px-4 py-3 text-gray-300">{c.companies}</td>
                <td className="px-4 py-3 text-gray-300">{fmtN(c.employees)}</td>
                <td className="px-4 py-3 text-gray-300">{c.members}</td>
                <td className="px-4 py-3"><WalletBadges w={c.wallet} /></td>
                <td className="px-4 py-3"><Badge tone={c.isActive ? 'green' : 'red'}>{c.isActive ? 'Actif' : 'Désactivé'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500 border-t border-gray-800">
            <span>{data.total} cabinet(s)</span>
            <div className="flex items-center gap-2">
              <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={12} /></button>
              <span>Page {page}</span>
              <button className={btnGhost} disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}><ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CabinetsAdminPage() {
  const [tab, setTab] = useState<'overview' | 'list'>('overview');
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const notify = useCallback((m: { ok: boolean; text: string }) => { setMsg(m); setTimeout(() => setMsg(null), 6000); }, []);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-white flex items-center gap-2"><Landmark size={20} /> Gestion des cabinets</h1>
        <p className="text-sm text-gray-500 mt-1">Wallets, forfaits, PME clientes. Effectifs recomptés en direct ; les actions exigent un motif et sont tracées.</p>
      </div>
      <div className="flex gap-2 border-b border-gray-800">
        {([['overview', "Vue d'ensemble"], ['list', 'Cabinets']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${tab === id ? 'border-red-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{label}</button>
        ))}
      </div>
      <Msg m={msg} />
      {tab === 'overview' && <OverviewTab key={refreshKey} onOpen={setSelected} ask={setConfirm} notify={notify} />}
      {tab === 'list' && <ListTab onOpen={setSelected} refreshKey={refreshKey} />}
      {selected && <CabinetDrawer id={selected} onClose={() => setSelected(null)} onChanged={() => setRefreshKey(k => k + 1)} ask={setConfirm} notify={notify} />}
      {confirm && <ConfirmModal c={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}