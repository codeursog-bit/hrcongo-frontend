'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/abonnement/page.tsx — VERSION FINALE
// Plan PME/Employés avec choix de période + réductions automatiques
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, TopBar, Card, SectionHeader,
  Badge, Btn, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';
import { PaymentModal, type PaymentIntent } from '@/components/payment/PaymentModal';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

// ─── Types ────────────────────────────────────────────────────────────────────

type CabinetPlan          = 'STARTER' | 'PRO' | 'EXPERT';
type CabinetBillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'SEMESTRIAL' | 'YEARLY';
type CabinetSubStatus     = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';

interface PeriodPricing {
  pricePerMonth:  number;
  totalAmount:    number;
  discountPct:    number;
  discountAmount: number;
  months:         number;
  periodLabel:    string;
}

interface PlanConfig {
  label:        string;
  description:  string;
  maxCompanies: number;
  maxEmployees: number;
  priceMonthly: number;
  popular?:     boolean;
  pricing:      Record<CabinetBillingPeriod, PeriodPricing>;
}

interface CabinetSubscription {
  plan:             CabinetPlan;
  status:           CabinetSubStatus;
  maxCompanies:     number;
  maxEmployees:     number;
  currentCompanies: number;
  currentEmployees: number;
  pricePerMonth:    number;
  currentPeriodEnd: string;
  trialEndsAt:      string | null;
  daysLeftInTrial:  number;
  canAddCompany:    boolean;
  availablePlans:   Record<CabinetPlan, PlanConfig>;
  payments: Array<{
    id: string; amount: number; currency: string; status: string; createdAt: string;
  }>;
}

interface WalletData {
  bulletinsBalance:      number;
  isForfait:             boolean;
  trialActive:           boolean;
  forfaitActive:         boolean;
  bulletinsUsedThisMonth: number;
  pricing: { PACK_50: number; PACK_100: number; PACK_200: number };
  transactions: Array<{
    id: string; type: string; amount: number;
    description: string; createdAt: string; balanceAfter: number;
  }>;
}

const TX_LABELS: Record<string, { label: string; variant: any }> = {
  TRIAL_CREDIT:       { label: 'Trial offert',   variant: 'info'    },
  PACK_PURCHASE:      { label: 'Achat pack',      variant: 'success' },
  BULLETIN_DEBIT:     { label: 'Bulletin généré', variant: 'danger'  },
  BULLETIN_REFUND:    { label: 'Remboursement',   variant: 'success' },
  MANUAL_CREDIT:      { label: 'Crédit manuel',   variant: 'warning' },
  FORFAIT_ACTIVATION: { label: 'Forfait activé',  variant: 'info'    },
  FORFAIT_RESET:      { label: 'Reset mensuel',   variant: 'info'    },
};

const STATUS_CFG: Record<CabinetSubStatus, { label: string; variant: any }> = {
  TRIALING: { label: 'Essai gratuit', variant: 'info'    },
  ACTIVE:   { label: 'Actif',        variant: 'success' },
  PAST_DUE: { label: 'En retard',    variant: 'warning' },
  CANCELED: { label: 'Annulé',       variant: 'danger'  },
  PAUSED:   { label: 'Pausé',        variant: 'default' },
};

const PERIOD_ORDER: CabinetBillingPeriod[] = ['MONTHLY', 'QUARTERLY', 'SEMESTRIAL', 'YEARLY'];
const PERIOD_LABELS: Record<CabinetBillingPeriod, string> = {
  MONTHLY:    'Mensuel',
  QUARTERLY:  'Trimestriel',
  SEMESTRIAL: 'Semestriel',
  YEARLY:     'Annuel',
};

const PLAN_ORDER: CabinetPlan[] = ['STARTER', 'PRO', 'EXPERT'];
const PLAN_COLORS: Record<CabinetPlan, string> = {
  STARTER: C.cyan,
  PRO:     C.indigo,
  EXPERT:  C.violet,
};

// ─── Sous-composants ─────────────────────────────────────────────────────────

function UsageBar({ label, current, max, color }: {
  label: string; current: number; max: number; color: string;
}) {
  const pct      = Math.min(100, Math.round((current / Math.max(max, 1)) * 100));
  const barColor = pct >= 90 ? C.red : pct >= 70 ? C.amber : color;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: C.textMuted }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: C.textPrimary }}>
          {current}<span style={{ color: C.textMuted }}>/{max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      {pct >= 90 && <p className="text-[10px] mt-1" style={{ color: C.red }}>⚠ Limite proche</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AbonnementPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [sub,            setSub]            = useState<CabinetSubscription | null>(null);
  const [subLoading,     setSubLoading]     = useState(true);
  const [wallet,         setWallet]         = useState<WalletData | null>(null);
  const [walletLoad,     setWalletLoad]     = useState(true);
  const [activeTab,      setActiveTab]      = useState<'plan' | 'bulletins'>('plan');
  const [selectedPeriod, setSelectedPeriod] = useState<CabinetBillingPeriod>('MONTHLY');
  const [upgradeLoading, setUpgradeLoading] = useState<CabinetPlan | null>(null);
  const [buyingPack,     setBuyingPack]     = useState<string | null>(null);
  const [intent,         setIntent]         = useState<PaymentIntent | null>(null);
  const [selectedPlan,   setSelectedPlan]   = useState<CabinetPlan | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSub = useCallback(async () => {
    try {
      const data = await api.get<CabinetSubscription>(`/cabinet/${cabinetId}/subscription`);
      setSub(data as any);
    } catch { showToast("Impossible de charger l'abonnement", false); }
    finally { setSubLoading(false); }
  }, [cabinetId]);

  useEffect(() => { fetchSub(); }, [fetchSub]);
  useEffect(() => {
    api.get(`/cabinet/${cabinetId}/wallet`)
      .then((r: any) => setWallet(r)).catch(console.error)
      .finally(() => setWalletLoad(false));
  }, [cabinetId]);

  const handleSelectPlan = async (plan: CabinetPlan) => {
    setUpgradeLoading(plan);
    try {
      const data = await api.post<PaymentIntent>(`/cabinet/${cabinetId}/subscription/upgrade`, {
        plan,
        billingPeriod: selectedPeriod,
      });
      setIntent(data as any);
      setSelectedPlan(plan);
    } catch { showToast('Erreur, réessayez.', false); }
    finally { setUpgradeLoading(null); }
  };

  const purchasePack = async (pack: 'PACK_50' | 'PACK_100' | 'PACK_200') => {
    setBuyingPack(pack);
    try {
      await api.post(`/cabinet/${cabinetId}/wallet/purchase-pack`, { pack, reference: `PACK-${Date.now()}` });
      const updated: any = await api.get(`/cabinet/${cabinetId}/wallet`);
      setWallet(updated);
      showToast('Pack ajouté.');
    } catch { showToast("Erreur lors de l'achat.", false); }
    finally { setBuyingPack(null); }
  };

  if (subLoading) return <LoadingScreen />;

  const daysLeft  = sub?.daysLeftInTrial ?? 0;
  const statusCfg = sub ? STATUS_CFG[sub.status] : STATUS_CFG.TRIALING;
  const packs     = [
    { id: 'PACK_50',  label: '50 bulletins',  price: wallet?.pricing.PACK_50,  color: C.cyan   },
    { id: 'PACK_100', label: '100 bulletins', price: wallet?.pricing.PACK_100, color: C.indigo },
    { id: 'PACK_200', label: '200 bulletins', price: wallet?.pricing.PACK_200, color: C.violet },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />
      <div className="ml-56">
        <TopBar
          title="Abonnement"
          subtitle={sub ? `Plan ${sub.plan} · ${sub.currentCompanies}/${sub.maxCompanies} PME · ${sub.currentEmployees} employés` : ''}
          breadcrumb="Cabinet"
        />

        <div className="p-8 space-y-6">

          {/* ── Bannière essai ── */}
          {sub?.status === 'TRIALING' && daysLeft <= 7 && (
            <div
              className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>
                  Essai — {daysLeft}j restant{daysLeft > 1 ? 's' : ''}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  Choisissez un plan pour continuer sans interruption.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('plan')}
                style={{
                  background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 600,
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Choisir
              </button>
            </div>
          )}

          {/* ── Bannière paiement en retard ── */}
          {sub?.status === 'PAST_DUE' && (
            <div
              className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: C.red }}>Paiement en retard</p>
                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                  Renouvelez pour continuer à accéder à vos PME.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('plan')}
                style={{
                  background: C.red, color: '#fff', fontSize: 12, fontWeight: 600,
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Renouveler
              </button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div
            className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}
          >
            {(['plan', 'bulletins'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setActiveTab(k)}
                style={{
                  padding: '8px 18px', borderRadius: 10, fontSize: 13,
                  fontWeight: activeTab === k ? 600 : 400,
                  color:      activeTab === k ? C.textPrimary : C.textMuted,
                  background: activeTab === k ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {k === 'plan' ? 'Plan cabinet' : 'Bulletins de paie'}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════
              ONGLET PLAN
          ══════════════════════════════════════════ */}
          {activeTab === 'plan' && sub && (
            <div className="space-y-6">

              {/* Plan actuel + usage */}
              <Card>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                        Plan actuel
                      </p>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold" style={{ color: C.textPrimary }}>{sub.plan}</p>
                        <Badge label={statusCfg.label} variant={statusCfg.variant} />
                      </div>
                      <p className="text-sm mt-1" style={{ color: C.textMuted }}>
                        {fmt(sub.pricePerMonth)} F/mois
                        {sub.status === 'TRIALING' && daysLeft > 0 && (
                          <span style={{ color: C.cyan }}> · {daysLeft}j d'essai</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: C.textMuted }}>
                        {sub.status === 'TRIALING' ? "Fin d'essai" : 'Renouvellement'}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                        {new Date(sub.trialEndsAt ?? sub.currentPeriodEnd).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <UsageBar label="PME gérées"    current={sub.currentCompanies} max={sub.maxCompanies} color={C.indigo} />
                    <UsageBar label="Employés total" current={sub.currentEmployees} max={sub.maxEmployees} color={C.cyan}   />
                  </div>
                </div>
              </Card>

              {/* Sélecteur de période + grille des plans */}
              <div>
                <SectionHeader
                  title="Changer de plan"
                  sub="Choisissez votre période pour profiter des réductions"
                />

                {/* Sélecteur période */}
                <div className="flex gap-2 mt-3 mb-5 flex-wrap">
                  {PERIOD_ORDER.map((period) => {
                    const discountPct = sub.availablePlans?.STARTER?.pricing?.[period]?.discountPct ?? 0;
                    return (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        style={{
                          padding: '8px 16px', borderRadius: 10, fontSize: 12,
                          fontWeight:  selectedPeriod === period ? 700 : 400,
                          border:      `1px solid ${selectedPeriod === period ? C.indigo : C.border}`,
                          background:  selectedPeriod === period ? `${C.indigo}20` : 'transparent',
                          color:       selectedPeriod === period ? C.indigoL : C.textMuted,
                          cursor: 'pointer', transition: 'all 150ms',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {PERIOD_LABELS[period]}
                        {discountPct > 0 && (
                          <span style={{
                            background: C.emerald, color: '#fff',
                            fontSize: 9, fontWeight: 800,
                            padding: '1px 5px', borderRadius: 99,
                          }}>
                            -{discountPct}%
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Grille plans */}
                <div className="grid grid-cols-3 gap-4">
                  {PLAN_ORDER.map((planKey) => {
                    const planCfg   = sub.availablePlans?.[planKey];
                    const isCurrent = planKey === sub.plan;
                    const pricing   = planCfg?.pricing?.[selectedPeriod];
                    const accent    = PLAN_COLORS[planKey];
                    const isDown    = PLAN_ORDER.indexOf(planKey) < PLAN_ORDER.indexOf(sub.plan);

                    if (!planCfg) return null;

                    return (
                      <div
                        key={planKey}
                        style={{
                          background:   isCurrent ? `${accent}12` : C.cardBg,
                          border:       `1px solid ${isCurrent ? accent : C.border}`,
                          borderRadius: 16, padding: 20, position: 'relative',
                        }}
                      >
                        {planCfg.popular && !isCurrent && (
                          <div style={{
                            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                            background: C.indigo, color: '#fff', fontSize: 10, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 99,
                          }}>POPULAIRE</div>
                        )}
                        {isCurrent && (
                          <div style={{
                            position: 'absolute', top: -10, right: 16,
                            background: accent, color: '#fff', fontSize: 10, fontWeight: 700,
                            padding: '3px 10px', borderRadius: 99,
                          }}>ACTUEL</div>
                        )}

                        <p className="text-base font-bold mb-0.5" style={{ color: C.textPrimary }}>{planCfg.label}</p>
                        <p className="text-xs mb-3"                style={{ color: C.textMuted  }}>{planCfg.description}</p>

                        {pricing && (
                          <div className="mb-4">
                            <p className="text-2xl font-bold" style={{ color: accent }}>
                              {fmt(pricing.totalAmount)}
                              <span className="text-sm font-normal ml-1" style={{ color: C.textMuted }}>F</span>
                            </p>
                            {pricing.months > 1 && (
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs" style={{ color: C.textMuted }}>
                                  soit {fmt(Math.round(pricing.totalAmount / pricing.months))} F/mois
                                </p>
                                {pricing.discountPct > 0 && (
                                  <span style={{
                                    background: 'rgba(16,185,129,0.15)', color: C.emerald,
                                    fontSize: 10, fontWeight: 700,
                                    padding: '1px 6px', borderRadius: 99, border: `1px solid ${C.emerald}40`,
                                  }}>
                                    -{pricing.discountPct}% · -{fmt(pricing.discountAmount)} F
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs" style={{ color: C.textSecondary }}>
                            <Ico.Building size={11} color={accent} />
                            <span><strong style={{ color: C.textPrimary }}>{planCfg.maxCompanies}</strong> PME</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: C.textSecondary }}>
                            <Ico.Users size={11} color={accent} />
                            <span>
                              <strong style={{ color: C.textPrimary }}>
                                {planCfg.maxEmployees >= 1000
                                  ? `${planCfg.maxEmployees / 1000}k`
                                  : planCfg.maxEmployees}
                              </strong>{' '}
                              employés
                            </span>
                          </div>
                        </div>

                        {!isCurrent && (
                          <Btn
                            variant={!isDown ? 'primary' : 'ghost'}
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => !isDown && handleSelectPlan(planKey)}
                            disabled={upgradeLoading === planKey || isDown}
                          >
                            {upgradeLoading === planKey
                              ? 'Chargement…'
                              : isDown
                              ? 'Contact support'
                              : `Passer au ${planCfg.label}`}
                          </Btn>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ✅ C.textDim → C.textMuted (correction #1) */}
                <p className="text-xs mt-3" style={{ color: C.textMuted }}>
                  Les PME de votre cabinet bénéficient de toutes les fonctionnalités RH.
                  Seule la génération de bulletins est facturée séparément via le wallet.
                  Downgrade ou plan sur mesure → contactez le support.
                </p>
              </div>

              {/* Historique paiements */}
              {sub.payments?.length > 0 && (
                <Card>
                  <SectionHeader title="Historique paiements" sub="Factures d'abonnement cabinet" />
                  <div>
                    {sub.payments.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                        style={{ borderBottom: idx < sub.payments.length - 1 ? `1px solid ${C.border}` : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = C.cardBgHover)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: p.status === 'SUCCEEDED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}
                        >
                          <Ico.Wallet size={14} color={p.status === 'SUCCEEDED' ? C.emerald : C.red} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: C.textPrimary }}>Abonnement cabinet</p>
                          <p className="text-xs" style={{ color: C.textMuted }}>
                            {new Date(p.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                          {fmt(p.amount)} {p.currency}
                        </p>
                        <Badge
                          label={p.status === 'SUCCEEDED' ? 'Réussi' : p.status === 'PROCESSING' ? 'En cours' : 'Échoué'}
                          variant={p.status === 'SUCCEEDED' ? 'success' : p.status === 'PROCESSING' ? 'info' : 'danger'}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ✅ C.textDim → C.textMuted (corrections #2 et #3) */}
              <div
                className="flex items-start gap-3 p-4 rounded-xl text-xs"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, color: C.textMuted }}
              >
                <Ico.Wallet size={13} color={C.textMuted} />
                Paiements via YabetooPay (MTN / Airtel / Orange). L'abonnement est activé après confirmation sur votre téléphone.
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              ONGLET BULLETINS
          ══════════════════════════════════════════ */}
          {activeTab === 'bulletins' && (
            <div className="space-y-6">
              {walletLoad ? (
                <Card>
                  <div className="py-12 text-center text-sm" style={{ color: C.textMuted }}>Chargement…</div>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">

                    {/* Solde */}
                    <Card accentColor={C.indigo} className="p-6 col-span-1">
                      <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>
                        Solde bulletins
                      </p>
                      <p className="text-4xl font-bold mb-1" style={{ color: C.textPrimary }}>
                        {wallet?.bulletinsBalance ?? 0}
                      </p>
                      <p className="text-sm" style={{ color: C.textSecondary }}>bulletins disponibles</p>
                      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: C.textMuted }}>Ce mois</span>
                          <span className="font-semibold" style={{ color: C.textPrimary }}>
                            {wallet?.bulletinsUsedThisMonth ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-2">
                          <span style={{ color: C.textMuted }}>Mode</span>
                          <Badge
                            label={wallet?.trialActive ? 'Essai' : wallet?.forfaitActive ? 'Forfait' : 'Pay-as-you-go'}
                            variant={wallet?.trialActive ? 'info' : wallet?.forfaitActive ? 'success' : 'default'}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Packs */}
                    <div className="col-span-2 grid grid-cols-3 gap-4">
                      {packs.map((pack) => (
                        <Card key={pack.id} accentColor={pack.color} className="p-5 flex flex-col">
                          <p className="text-sm font-semibold mb-1" style={{ color: C.textPrimary }}>{pack.label}</p>
                          <p className="text-2xl font-bold mb-auto" style={{ color: pack.color }}>
                            {pack.price ? `${fmt(pack.price)} F` : '—'}
                          </p>
                          <Btn
                            variant="ghost" size="sm"
                            className="mt-4 w-full justify-center"
                            onClick={() => purchasePack(pack.id as any)}
                            disabled={!!buyingPack}
                          >
                            {buyingPack === pack.id ? 'Traitement…' : 'Acheter'}
                          </Btn>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* ✅ C.textDim → C.textMuted (correction #4) */}
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    Un bulletin est débité à chaque génération de fiche de paie. Indépendant du plan cabinet.
                  </p>

                  {/* Historique transactions */}
                  <Card>
                    <SectionHeader title="Historique transactions" sub="Bulletins achetés et débités" />
                    <div>
                      {(wallet?.transactions ?? []).length === 0 ? (
                        <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                          Aucune transaction
                        </div>
                      ) : (
                        wallet?.transactions.map((tx, idx) => {
                          const cfg     = TX_LABELS[tx.type] ?? { label: tx.type, variant: 'default' };
                          const isDebit = tx.type === 'BULLETIN_DEBIT';
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                              style={{
                                borderBottom: idx < (wallet!.transactions.length - 1)
                                  ? `1px solid ${C.border}` : 'none',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = C.cardBgHover)}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: isDebit ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}
                              >
                                <Ico.Wallet size={14} color={isDebit ? C.red : C.emerald} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm" style={{ color: C.textPrimary }}>{tx.description}</p>
                                <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>
                                  {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                                    day: 'numeric', month: 'long', year: 'numeric',
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold" style={{ color: isDebit ? C.red : C.emerald }}>
                                  {isDebit ? '-' : '+'}{Math.abs(tx.amount)}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                                  Solde: {tx.balanceAfter}
                                </p>
                              </div>
                              <Badge label={cfg.label} variant={cfg.variant} />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal paiement ── */}
      {intent && selectedPlan && (
        <PaymentModal
          intent={intent}
          planLabel={`${sub?.availablePlans?.[selectedPlan]?.label ?? selectedPlan} ${PERIOD_LABELS[selectedPeriod]}`}
          confirmEndpoint={`/cabinet/${cabinetId}/subscription/confirm-payment`}
          successUrl={`/cabinet/${cabinetId}/abonnement`}
          onClose={() => { setIntent(null); setSelectedPlan(null); }}
          onSuccess={() => {
            showToast('Paiement envoyé ! Plan activé après confirmation.');
            setTimeout(() => fetchSub(), 5000);
          }}
          onError={(msg) => showToast(msg, false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold"
          style={{
            background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border:     `1px solid ${toast.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color:      toast.ok ? C.emerald : C.red,
          }}
        >
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  );
}