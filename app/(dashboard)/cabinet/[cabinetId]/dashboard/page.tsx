'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/abonnement/page.tsx
// REFONTE UX — Wallet & plans, design cabinet-ui
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, TopBar, Card, SectionHeader,
  Badge, Btn, LoadingScreen, Banner,
} from '@/components/cabinet/cabinet-ui';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

interface WalletData {
  bulletinsBalance:       number;
  isForfait:              boolean;
  forfaitExpiresAt:       string | null;
  trialActive:            boolean;
  trialExpiresAt:         string | null;
  forfaitActive:          boolean;
  trialExpired:           boolean;
  canGenerate:            boolean;
  effectiveBalance:       number | null;
  bulletinsUsedThisMonth: number;
  pricing: { PAYG_UNIT: number; PACK_50: number; PACK_100: number; PACK_200: number; FORFAIT_MONTHLY: number; TRIAL_BULLETINS: number };
  transactions: Array<{ id: string; type: string; amount: number; description: string; createdAt: string; balanceAfter: number }>;
}

const TX_LABELS: Record<string, { label: string; variant: any }> = {
  TRIAL_CREDIT:       { label: 'Trial offert',   variant: 'info'    },
  PACK_PURCHASE:      { label: 'Achat pack',      variant: 'success' },
  FORFAIT_ACTIVATION: { label: 'Forfait activé',  variant: 'info'    },
  BULLETIN_DEBIT:     { label: 'Bulletin généré', variant: 'danger'  },
  BULLETIN_REFUND:    { label: 'Remboursement',   variant: 'success' },
  MANUAL_CREDIT:      { label: 'Crédit manuel',   variant: 'warning' },
  FORFAIT_RESET:      { label: 'Reset mensuel',   variant: 'info'    },
};

export default function AbonnementPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [wallet,  setWallet]  = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying,  setBuying]  = useState<string | null>(null);

  useEffect(() => {
    api.get(`/cabinet/${cabinetId}/wallet`)
      .then((r: any) => setWallet(r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const purchasePack = async (pack: 'PACK_50' | 'PACK_100' | 'PACK_200') => {
    setBuying(pack);
    try {
      const reference = `PACK-${Date.now()}`;
      await api.post(`/cabinet/${cabinetId}/wallet/purchase-pack`, { pack, reference });
      const updated: any = await api.get(`/cabinet/${cabinetId}/wallet`);
      setWallet(updated);
    } catch (e: any) { console.error(e); }
    finally { setBuying(null); }
  };

  if (loading) return <LoadingScreen />;

  const packs = [
    { id: 'PACK_50',  label: '50 bulletins',  price: wallet?.pricing.PACK_50,  color: C.cyan    },
    { id: 'PACK_100', label: '100 bulletins', price: wallet?.pricing.PACK_100, color: C.indigo  },
    { id: 'PACK_200', label: '200 bulletins', price: wallet?.pricing.PACK_200, color: C.violet  },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <div className="ml-56">
        <TopBar title="Abonnement" subtitle="Solde bulletins et historique" breadcrumb="Cabinet" />

        <div className="p-8 space-y-6">

          {/* ── Solde principal ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            <Card accentColor={C.indigo} className="p-6 col-span-1">
              <p className="text-[11px] uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>
                Solde actuel
              </p>
              <p className="text-4xl font-bold mb-1" style={{ color: C.textPrimary }}>
                {wallet?.bulletinsBalance ?? 0}
              </p>
              <p className="text-sm" style={{ color: C.textSecondary }}>bulletins disponibles</p>

              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: C.textMuted }}>Utilisés ce mois</span>
                  <span className="font-semibold" style={{ color: C.textPrimary }}>
                    {wallet?.bulletinsUsedThisMonth ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span style={{ color: C.textMuted }}>Statut</span>
                  <Badge
                    label={wallet?.trialActive ? 'Essai gratuit' : wallet?.forfaitActive ? 'Forfait actif' : 'Pay-as-you-go'}
                    variant={wallet?.trialActive ? 'info' : wallet?.forfaitActive ? 'success' : 'default'}
                  />
                </div>
              </div>
            </Card>

            <div className="col-span-2 grid grid-cols-3 gap-4">
              {packs.map(pack => (
                <Card key={pack.id} accentColor={pack.color} className="p-5 flex flex-col">
                  <p className="text-sm font-semibold mb-1" style={{ color: C.textPrimary }}>{pack.label}</p>
                  <p className="text-2xl font-bold mb-auto" style={{ color: pack.color }}>
                    {pack.price ? `${fmt(pack.price)} F` : '—'}
                  </p>
                  <Btn
                    variant="ghost"
                    size="sm"
                    className="mt-4 w-full justify-center"
                    onClick={() => purchasePack(pack.id as any)}
                  >
                    {buying === pack.id ? 'Traitement…' : 'Acheter'}
                  </Btn>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Historique transactions ─────────────────────────────────── */}
          <Card>
            <SectionHeader title="Historique" sub="Toutes les transactions" />
            <div>
              {(wallet?.transactions ?? []).length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                  Aucune transaction
                </div>
              ) : (
                (wallet?.transactions ?? []).map((tx, idx) => {
                  const cfg = TX_LABELS[tx.type] ?? { label: tx.type, variant: 'default' };
                  const isDebit = tx.type === 'BULLETIN_DEBIT';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                      style={{ borderBottom: idx < (wallet?.transactions.length ?? 0) - 1 ? `1px solid ${C.border}` : 'none' }}
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
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: isDebit ? C.red : C.emerald }}>
                          {isDebit ? '-' : '+'}{Math.abs(tx.amount)}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>
                          Solde : {tx.balanceAfter}
                        </p>
                      </div>
                      <Badge label={cfg.label} variant={cfg.variant} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}