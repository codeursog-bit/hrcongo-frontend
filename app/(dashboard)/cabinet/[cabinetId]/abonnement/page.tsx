// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/abonnement/page.tsx
// ACTION  : CRÉER (nouveau fichier)
// =============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Wallet, Zap, Package, CheckCircle2,
  Loader2, ArrowRight, Clock, TrendingUp,
} from 'lucide-react';
import { api } from '@/services/api';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

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
  pricing: {
    PAYG_UNIT:       number;
    PACK_50:         number;
    PACK_100:        number;
    PACK_200:        number;
    FORFAIT_MONTHLY: number;
    TRIAL_BULLETINS: number;
  };
  transactions: Array<{
    id:          string;
    type:        string;
    amount:      number;
    description: string;
    createdAt:   string;
    balanceAfter: number;
  }>;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  TRIAL_CREDIT:      { label: 'Trial offert',     color: 'text-purple-400' },
  PACK_PURCHASE:     { label: 'Achat pack',        color: 'text-emerald-400' },
  FORFAIT_ACTIVATION:{ label: 'Forfait activé',    color: 'text-blue-400'   },
  BULLETIN_DEBIT:    { label: 'Bulletin généré',   color: 'text-red-400'    },
  BULLETIN_REFUND:   { label: 'Remboursement',     color: 'text-emerald-400'},
  MANUAL_CREDIT:     { label: 'Crédit manuel',     color: 'text-amber-400'  },
  FORFAIT_RESET:     { label: 'Reset mensuel',     color: 'text-blue-400'   },
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
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setBuying(null);
    }
  };

  const activateForfait = async () => {
    setBuying('forfait');
    try {
      const reference = `FORFAIT-${Date.now()}`;
      await api.post(`/cabinet/${cabinetId}/wallet/activate-forfait`, { reference });
      const updated: any = await api.get(`/cabinet/${cabinetId}/wallet`);
      setWallet(updated);
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setBuying(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  if (!wallet) return null;

  const trialDaysLeft = wallet.trialExpiresAt
    ? Math.max(0, Math.ceil((new Date(wallet.trialExpiresAt).getTime() - Date.now()) / 86400000))
    : null;

  const forfaitDaysLeft = wallet.forfaitExpiresAt
    ? Math.max(0, Math.ceil((new Date(wallet.forfaitExpiresAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 space-y-6 max-w-4xl mx-auto">

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet size={20} className="text-purple-400" /> Abonnement & bulletins
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Gérez votre solde de bulletins</p>
      </div>

      {/* Statut actuel */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Solde actuel</p>
          {wallet.forfaitActive ? (
            <>
              <p className="text-3xl font-bold text-blue-400">∞</p>
              <p className="text-xs text-gray-500 mt-1">Forfait illimité</p>
              {forfaitDaysLeft !== null && (
                <p className="text-xs text-blue-400 mt-1">Expire dans {forfaitDaysLeft} jours</p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-white">{wallet.bulletinsBalance}</p>
              <p className="text-xs text-gray-500 mt-1">bulletins disponibles</p>
              {wallet.trialActive && !wallet.trialExpired && trialDaysLeft !== null && (
                <p className="text-xs text-purple-400 mt-1">Trial · {trialDaysLeft}j restants</p>
              )}
              {wallet.trialExpired && <p className="text-xs text-red-400 mt-1">Trial expiré</p>}
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Utilisés ce mois</p>
          <p className="text-3xl font-bold text-white">{wallet.bulletinsUsedThisMonth}</p>
          <p className="text-xs text-gray-500 mt-1">bulletins générés</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tarif unitaire</p>
          <p className="text-3xl font-bold text-white">{fmt(wallet.pricing.PAYG_UNIT)}</p>
          <p className="text-xs text-gray-500 mt-1">FCFA / bulletin</p>
        </div>
      </div>

      {/* Forfait mensuel */}
      {!wallet.forfaitActive && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Zap size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Forfait mensuel illimité</p>
                <p className="text-gray-400 text-sm">
                  {fmt(wallet.pricing.FORFAIT_MONTHLY)} FCFA / mois · Bulletins illimités · PME illimitées
                </p>
                <p className="text-blue-400 text-xs mt-0.5">Rentable dès 18 bulletins / mois</p>
              </div>
            </div>
            <button
              onClick={activateForfait}
              disabled={!!buying}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {buying === 'forfait'
                ? <Loader2 size={14} className="animate-spin" />
                : <><Zap size={14} /> Activer — {fmt(wallet.pricing.FORFAIT_MONTHLY)} FCFA</>
              }
            </button>
          </div>
        </div>
      )}

      {wallet.forfaitActive && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-blue-400" />
          <div>
            <p className="text-blue-400 font-medium text-sm">Forfait mensuel actif</p>
            <p className="text-gray-500 text-xs">
              Bulletins illimités jusqu'au{' '}
              {wallet.forfaitExpiresAt ? new Date(wallet.forfaitExpiresAt).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Packs de bulletins */}
      <div>
        <p className="text-sm font-medium text-gray-400 mb-3">Packs de bulletins</p>
        <div className="grid grid-cols-3 gap-4">
          {([
            { pack: 'PACK_50'  as const, qty: 50,  price: wallet.pricing.PACK_50,  unit: 1800, label: 'Pack 50' },
            { pack: 'PACK_100' as const, qty: 100, price: wallet.pricing.PACK_100, unit: 1700, label: 'Pack 100' },
            { pack: 'PACK_200' as const, qty: 200, price: wallet.pricing.PACK_200, unit: 1500, label: 'Pack 200' },
          ]).map(({ pack, qty, price, unit, label }) => (
            <div key={pack} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package size={16} className="text-purple-400" />
                <p className="font-semibold text-white text-sm">{label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{qty}</p>
              <p className="text-xs text-gray-500">bulletins</p>
              <p className="text-sm font-medium text-purple-400 mt-2">{fmt(price)} FCFA</p>
              <p className="text-xs text-gray-600">{fmt(unit)} FCFA / bulletin</p>
              <button
                onClick={() => purchasePack(pack)}
                disabled={!!buying}
                className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {buying === pack
                  ? <Loader2 size={13} className="animate-spin" />
                  : <><ArrowRight size={13} /> Acheter</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Historique transactions */}
      <div>
        <p className="text-sm font-medium text-gray-400 mb-3">Historique</p>
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          {wallet.transactions.length === 0 ? (
            <p className="p-6 text-center text-gray-600 text-sm">Aucune transaction</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Date', 'Description', 'Mouvement', 'Solde après'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wallet.transactions.map(tx => {
                  const conf = typeLabels[tx.type] ?? { label: tx.type, color: 'text-gray-400' };
                  return (
                    <tr key={tx.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${conf.color}`}>{conf.label}</span>
                        <p className="text-gray-500 text-xs mt-0.5">{tx.description}</p>
                      </td>
                      <td className={`px-4 py-3 font-semibold ${tx.amount > 0 ? 'text-emerald-400' : tx.amount < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount === 0 ? '—' : tx.amount}
                      </td>
                      <td className="px-4 py-3 text-white">{tx.balanceAfter}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

