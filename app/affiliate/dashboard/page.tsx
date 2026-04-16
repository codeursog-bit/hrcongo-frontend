'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy, Check, LogOut, Building2, TrendingUp,
  Clock, CheckCircle2, Loader2, Users,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  affiliate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    referralCode: string;
    commissionRate: number;
    createdAt: string;
  };
  referralLink: string;
  kpis: {
    totalCompanies: number;
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
    commissionRate: number;
  };
  companies: Array<{
    id: string;
    name: string;
    email: string;
    linkedAt: string;
    subscription: { plan: string; status: string } | null;
    recentPayments: Array<{ id: string; amount: number; paidAt: string }>;
  }>;
  commissions: Array<{
    id: string;
    companyName: string;
    paymentAmount: number;
    commissionRate: number;
    commissionAmount: number;
    status: 'PENDING' | 'PAID';
    date: string;
    paidAt: string | null;
  }>;
}

// ─── Formatage ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Sous-composants inline ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:  { cls: 'bg-amber-900/30 text-amber-400 border-amber-800/50',  label: 'En attente' },
    PAID:     { cls: 'bg-green-900/30 text-green-400 border-green-800/50',   label: 'Versée' },
    ACTIVE:   { cls: 'bg-green-900/30 text-green-400 border-green-800/50',   label: 'Actif' },
    TRIALING: { cls: 'bg-blue-900/30 text-blue-400 border-blue-800/50',      label: 'Essai' },
    PAST_DUE: { cls: 'bg-red-900/30 text-red-400 border-red-800/50',         label: 'Impayé' },
    FREE:     { cls: 'bg-gray-800/60 text-gray-400 border-gray-700',         label: 'Gratuit' },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-gray-800/60 text-gray-400 border-gray-700', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${cls}`}>
      {label}
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-gray-800/60 rounded-lg">{icon}</div>
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'companies' | 'commissions'>('companies');
  const [copied, setCopied] = useState(false);

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem('affiliate_token');
    if (!token) {
      router.push('/affiliate/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/affiliate/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('affiliate_token');
        router.push('/affiliate/login');
        return;
      }

      const json = await res.json();
      setData(json);
    } catch {
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('affiliate_token');
    router.push('/affiliate/login');
  };

  // ─── États de chargement / erreur ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-4">{error || 'Erreur de chargement'}</p>
          <button
            onClick={fetchDashboard}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const { affiliate, kpis, companies, commissions, referralLink } = data;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200">
      {/* ── Header ── */}
      <header className="bg-gray-900/80 border-b border-gray-800 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {affiliate.firstName} {affiliate.lastName}
              </p>
              <p className="text-xs text-gray-500">Affilié Konza RH</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-900/40 text-indigo-300 px-3 py-1.5 rounded-full font-medium border border-indigo-800/50">
              Commission : {kpis.commissionRate}%
            </span>
            <span className="text-xs bg-gray-800/60 text-gray-400 px-2 py-1 rounded font-mono border border-gray-700">
              {affiliate.referralCode}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<Building2 className="w-4 h-4 text-gray-400" />}
            label="Entreprises apportées"
            value={String(kpis.totalCompanies)}
          />
          <KpiCard
            icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
            label="Commissions totales"
            value={fmt(kpis.totalCommissions)}
            sub="toutes périodes"
          />
          <KpiCard
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            label="En attente de versement"
            value={fmt(kpis.pendingCommissions)}
            accent="text-amber-400"
          />
          <KpiCard
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
            label="Déjà versé"
            value={fmt(kpis.paidCommissions)}
            accent="text-green-400"
          />
        </div>

        {/* ── Lien d'affiliation ── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Votre lien d'affiliation</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Partagez ce lien. Toute entreprise qui s'inscrit via ce lien sera automatiquement liée à votre compte.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/50 rounded-xl px-4 py-3">
            <span className="flex-1 text-sm text-indigo-300 font-mono truncate text-xs sm:text-sm">
              {referralLink}
            </span>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-green-600/30 text-green-400 border border-green-700/50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>

        {/* ── Onglets ── */}
        <div>
          <div className="flex gap-1 mb-5 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
            <button
              onClick={() => setTab('companies')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'companies'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Mes entreprises ({companies.length})
              </span>
            </button>
            <button
              onClick={() => setTab('commissions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === 'commissions'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Commissions ({commissions.length})
              </span>
            </button>
          </div>

          {/* ── Table Entreprises ── */}
          {tab === 'companies' && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
              {companies.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune entreprise pour l'instant.</p>
                  <p className="text-xs text-gray-600 mt-1">Partagez votre lien pour commencer.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Entreprise</th>
                        <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Inscrite le</th>
                        <th className="text-left text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Abonnement</th>
                        <th className="text-right text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Paiements récents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c, i) => (
                        <tr
                          key={c.id}
                          className={`${i < companies.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors`}
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-white">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">
                            {fmtDate(c.linkedAt)}
                          </td>
                          <td className="px-4 py-4">
                            {c.subscription ? (
                              <div className="flex flex-col gap-1">
                                <StatusBadge status={c.subscription.status} />
                                <span className="text-xs text-gray-600">{c.subscription.plan}</span>
                              </div>
                            ) : (
                              <span className="text-gray-700">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {c.recentPayments.length === 0 ? (
                              <span className="text-xs text-gray-700">Aucun paiement</span>
                            ) : (
                              <div className="flex flex-col gap-1 items-end">
                                {c.recentPayments.slice(0, 3).map((p) => (
                                  <span key={p.id} className="text-xs text-green-400 font-medium">
                                    {fmt(p.amount)}
                                    {p.paidAt && (
                                      <span className="text-gray-600 font-normal ml-1">
                                        {fmtDate(p.paidAt)}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Table Commissions ── */}
          {tab === 'commissions' && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm">
              {commissions.length === 0 ? (
                <div className="py-16 text-center">
                  <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucune commission pour l'instant.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Les commissions apparaissent à chaque paiement réussi de vos entreprises.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Entreprise</th>
                        <th className="text-right text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Paiement</th>
                        <th className="text-right text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Taux</th>
                        <th className="text-right text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Commission</th>
                        <th className="text-center text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Statut</th>
                        <th className="text-right text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c, i) => (
                        <tr
                          key={c.id}
                          className={`${i < commissions.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-white">{c.companyName}</td>
                          <td className="px-4 py-4 text-sm text-gray-400 text-right">{fmt(c.paymentAmount)}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 text-right">{c.commissionRate}%</td>
                          <td className="px-4 py-4 text-sm font-bold text-indigo-400 text-right">{fmt(c.commissionAmount)}</td>
                          <td className="px-4 py-4 text-center">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 text-right whitespace-nowrap">
                            {fmtDate(c.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-800 bg-gray-900/40">
                        <td colSpan={3} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-400 text-right">
                          {fmt(kpis.totalCommissions)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Note de transparence ── */}
        <p className="text-xs text-gray-700 text-center pb-6">
          Seules les transactions réussies génèrent des commissions. Les versements seront disponibles dans une prochaine mise à jour.
        </p>
      </main>
    </div>
  );
}
