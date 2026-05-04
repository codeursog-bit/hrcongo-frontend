'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Copy, Check, LogOut, Building2, TrendingUp, Clock,
  CheckCircle2, Loader2, Briefcase, Wallet, Send,
  AlertCircle, Bell, RefreshCw, ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commission {
  id: string;
  type: 'COMPANY' | 'CABINET';
  clientName: string;
  paymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  date: string;
  paidAt: string | null;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  paidAt?: string;
  paymentNote?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface DashboardData {
  affiliate: {
    id: string; firstName: string; lastName: string;
    email: string; referralCode: string; commissionRate: number;
    phone?: string; disbursementPhone?: string;
  };
  referralLink: string; // un seul lien
  kpis: {
    totalCompanies: number; pendingCompany: number; paidCompany: number;
    totalCabinets: number; pendingCabinet: number; paidCabinet: number;
    totalPending: number; totalPaid: number; totalEarned: number;
    commissionRate: number; threshold: number;
    thresholdReached: boolean; canRequestWithdrawal: boolean;
    activeWithdrawal: WithdrawalRequest | null;
  };
  companies: Array<{
    id: string; name: string; email: string; linkedAt: string;
    subscription: { plan: string; status: string } | null;
    recentPayments: Array<{ id: string; amount: number; paidAt: string }>;
  }>;
  cabinets: Array<{
    id: string; name: string; email: string; linkedAt: string;
    subscription: { plan: string; status: string } | null;
  }>;
  commissions: Commission[];
  cabinetCommissions: Commission[];
  withdrawalHistory: WithdrawalRequest[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CG', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING:   { cls: 'bg-amber-900/30 text-amber-400 border-amber-800/50',  label: 'En attente' },
    APPROVED:  { cls: 'bg-blue-900/30 text-blue-400 border-blue-800/50',     label: 'Yabetoo J+1' },
    PAID:      { cls: 'bg-green-900/30 text-green-400 border-green-800/50',  label: 'Versée' },
    REJECTED:  { cls: 'bg-red-900/30 text-red-400 border-red-800/50',        label: 'Rejeté' },
    CANCELLED: { cls: 'bg-gray-800 text-gray-500 border-gray-700',           label: 'Annulé' },
    ACTIVE:    { cls: 'bg-green-900/30 text-green-400 border-green-800/50',  label: 'Actif' },
    TRIALING:  { cls: 'bg-blue-900/30 text-blue-400 border-blue-800/50',     label: 'Essai' },
    PAST_DUE:  { cls: 'bg-red-900/30 text-red-400 border-red-800/50',        label: 'Impayé' },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-gray-800 text-gray-400 border-gray-700', label: status };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border font-medium ${cls}`}>{label}</span>;
}

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
      <div className="p-2 bg-gray-800/60 rounded-lg w-fit mb-3">{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [tab, setTab]         = useState<'overview' | 'companies' | 'cabinets' | 'commissions' | 'history'>('overview');
  const [commTab, setCommTab] = useState<'all' | 'company' | 'cabinet'>('all');

  const [copied, setCopied]           = useState(false);
  const [requesting, setRequesting]   = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchDashboard = useCallback(async () => {
    const token = localStorage.getItem('affiliate_token');
    if (!token) { router.push('/affiliate/login'); return; }
    try {
      const r = await fetch(`${API}/affiliate/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) { localStorage.removeItem('affiliate_token'); router.push('/affiliate/login'); return; }
      setData(await r.json());
    } catch { setError('Impossible de charger les données.'); }
    finally { setLoading(false); }
  }, [router, API]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleCopy = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestWithdrawal = async () => {
    setRequesting(true); setRequestError('');
    const token = localStorage.getItem('affiliate_token');
    try {
      const r = await fetch(`${API}/affiliate/withdrawal/request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Erreur');
      setRequestSuccess(true);
      fetchDashboard();
    } catch (e: any) { setRequestError(e.message); }
    finally { setRequesting(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-center">
      <div>
        <p className="text-red-400 text-sm mb-4">{error || 'Erreur de chargement'}</p>
        <button onClick={fetchDashboard} className="text-xs text-indigo-400 hover:text-indigo-300 underline">Réessayer</button>
      </div>
    </div>
  );

  const { affiliate, kpis, companies, cabinets, commissions, cabinetCommissions, withdrawalHistory, referralLink } = data;

  const allCommissions = [...commissions, ...cabinetCommissions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedComms = commTab === 'all' ? allCommissions
    : commTab === 'company' ? commissions : cabinetCommissions;

  const progressPct = Math.min(100, Math.round((kpis.totalPending / kpis.threshold) * 100));

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-200">

      {/* Header */}
      <header className="bg-gray-900/80 border-b border-gray-800 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{affiliate.firstName[0]}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{affiliate.firstName} {affiliate.lastName}</p>
              <p className="text-xs text-gray-500">Affilié Konza RH · {kpis.commissionRate}% de commission</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-gray-800/60 text-gray-400 px-2 py-1 rounded font-mono border border-gray-700">{affiliate.referralCode}</span>
            <button onClick={fetchDashboard} className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={() => { localStorage.removeItem('affiliate_token'); router.push('/affiliate/login'); }}
              className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800" title="Déconnexion">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Bandeau retrait / seuil ── */}
        {kpis.activeWithdrawal ? (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-300">Demande de retrait en cours</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {fmt(kpis.activeWithdrawal.amount)} · soumis le {fmtDate(kpis.activeWithdrawal.createdAt)}
                  {' '}<StatusBadge status={kpis.activeWithdrawal.status} />
                </p>
                {kpis.activeWithdrawal.status === 'APPROVED' && (
                  <p className="text-xs text-gray-600 mt-0.5">Versement Yabetoo planifié — exécution J+1</p>
                )}
              </div>
            </div>
          </div>
        ) : kpis.thresholdReached ? (
          <div className="bg-amber-900/20 border border-amber-800/50 rounded-2xl px-6 py-4 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Seuil atteint — vous pouvez demander un retrait !</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  {fmt(kpis.totalPending)} disponibles (PME + Cabinet) · Seuil : {fmt(kpis.threshold)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Versement sur{' '}
                  <span className="text-gray-400 font-mono">{affiliate.disbursementPhone || affiliate.phone || '—'}</span>
                </p>
              </div>
            </div>
            <div className="shrink-0">
              {requestSuccess ? (
                <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Demande envoyée</span>
              ) : (
                <>
                  <button onClick={handleRequestWithdrawal} disabled={requesting}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold text-sm rounded-xl disabled:opacity-50 shadow-lg shadow-amber-900/30">
                    {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Demander le retrait
                  </button>
                  {requestError && <p className="text-xs text-red-400 mt-1 text-right">{requestError}</p>}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-300 font-medium">Progression vers le retrait</p>
              </div>
              <span className="text-sm">
                <span className="text-amber-400 font-bold">{fmt(kpis.totalPending)}</span>
                <span className="text-gray-600"> / {fmt(kpis.threshold)}</span>
              </span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-gray-600 mt-1.5">
              Il vous manque <span className="text-gray-400">{fmt(Math.max(0, kpis.threshold - kpis.totalPending))}</span> pour atteindre le seuil.
            </p>
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={<Building2 className="w-4 h-4 text-blue-400" />} label="PME apportées"
            value={String(kpis.totalCompanies)} sub={`${fmt(kpis.pendingCompany)} en attente`} />
          <KpiCard icon={<Briefcase className="w-4 h-4 text-purple-400" />} label="Cabinets apportés"
            value={String(kpis.totalCabinets)} sub={`${fmt(kpis.pendingCabinet)} en attente`} />
          <KpiCard icon={<Clock className="w-4 h-4 text-amber-400" />} label="Total en attente"
            value={fmt(kpis.totalPending)} accent="text-amber-400"
            sub={`PME ${fmt(kpis.pendingCompany)} · Cabinet ${fmt(kpis.pendingCabinet)}`} />
          <KpiCard icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} label="Total versé"
            value={fmt(kpis.totalPaid)} accent="text-green-400"
            sub={`PME ${fmt(kpis.paidCompany)} · Cabinet ${fmt(kpis.paidCabinet)}`} />
        </div>

        {/* ── Lien d'affiliation — UN SEUL ── */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-gray-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Votre lien d'affiliation</p>
              <p className="text-xs text-gray-500">
                Partagez ce lien à toute personne — elle choisira ensuite si elle est une PME ou un Cabinet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-xl px-3 py-2.5">
            <span className="flex-1 text-sm text-gray-300 font-mono truncate">{referralLink}</span>
            <button onClick={() => handleCopy(referralLink)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${copied ? 'bg-green-600/30 text-green-400 border border-green-700/50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {copied ? <><Check className="w-4 h-4" />Copié !</> : <><Copy className="w-4 h-4" />Copier</>}
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 flex-wrap">
          {[
            { key: 'overview',    label: 'Vue globale',             icon: <TrendingUp className="w-3.5 h-3.5" /> },
            { key: 'companies',   label: `PME (${companies.length})`, icon: <Building2 className="w-3.5 h-3.5" /> },
            { key: 'cabinets',    label: `Cabinets (${cabinets.length})`, icon: <Briefcase className="w-3.5 h-3.5" /> },
            { key: 'commissions', label: `Commissions (${allCommissions.length})`, icon: <Wallet className="w-3.5 h-3.5" /> },
            { key: 'history',     label: 'Retraits', icon: <Clock className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ══ VUE GLOBALE ══ */}
        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">Commissions PME</h3>
                </div>
                <button onClick={() => setTab('companies')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">Voir tout<ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'PME actives', value: kpis.totalCompanies, type: 'count' },
                  { label: 'En attente',  value: kpis.pendingCompany, type: 'money', accent: 'text-amber-400' },
                  { label: 'Versé',       value: kpis.paidCompany,    type: 'money', accent: 'text-green-400' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className={`font-semibold ${(r as any).accent ?? 'text-white'}`}>
                      {r.type === 'money' ? fmt(r.value as number) : r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">Commissions Cabinet</h3>
                </div>
                <button onClick={() => setTab('cabinets')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">Voir tout<ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Cabinets actifs', value: kpis.totalCabinets,  type: 'count' },
                  { label: 'En attente',      value: kpis.pendingCabinet, type: 'money', accent: 'text-amber-400' },
                  { label: 'Versé',           value: kpis.paidCabinet,    type: 'money', accent: 'text-green-400' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{r.label}</span>
                    <span className={`font-semibold ${(r as any).accent ?? 'text-white'}`}>
                      {r.type === 'money' ? fmt(r.value as number) : r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-gray-900/60 border border-indigo-800/30 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-400" /> Résumé global
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{fmt(kpis.totalPending)}</p>
                  <p className="text-xs text-gray-500 mt-1">En attente (PME + Cabinet)</p>
                </div>
                <div className="text-center border-x border-gray-800">
                  <p className="text-2xl font-bold text-green-400">{fmt(kpis.totalPaid)}</p>
                  <p className="text-xs text-gray-500 mt-1">Déjà versé</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{fmt(kpis.totalEarned)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total gagné</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ PME ══ */}
        {tab === 'companies' && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            {companies.length === 0 ? (
              <div className="py-16 text-center"><Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune PME encore.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-800">
                    {['Entreprise', 'Inscrite le', 'Abonnement', 'Paiements récents'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {companies.map((c, i) => (
                      <tr key={c.id} className={`${i < companies.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30`}>
                        <td className="px-6 py-4"><p className="text-sm font-medium text-white">{c.name}</p><p className="text-xs text-gray-500">{c.email}</p></td>
                        <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">{fmtDate(c.linkedAt)}</td>
                        <td className="px-4 py-4">{c.subscription ? <div><StatusBadge status={c.subscription.status} /><p className="text-xs text-gray-600 mt-0.5">{c.subscription.plan}</p></div> : <span className="text-gray-700">—</span>}</td>
                        <td className="px-6 py-4">{c.recentPayments.length === 0 ? <span className="text-xs text-gray-700">Aucun</span> : <div className="space-y-1">{c.recentPayments.map(p => <p key={p.id} className="text-xs text-green-400">{fmt(p.amount)}</p>)}</div>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ CABINETS ══ */}
        {tab === 'cabinets' && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            {cabinets.length === 0 ? (
              <div className="py-16 text-center"><Briefcase className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun cabinet encore.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-800">
                    {['Cabinet', 'Inscrit le', 'Abonnement'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {cabinets.map((c, i) => (
                      <tr key={c.id} className={`${i < cabinets.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30`}>
                        <td className="px-6 py-4"><p className="text-sm font-medium text-white">{c.name}</p><p className="text-xs text-gray-500">{c.email}</p></td>
                        <td className="px-4 py-4 text-sm text-gray-400 whitespace-nowrap">{fmtDate(c.linkedAt)}</td>
                        <td className="px-4 py-4">{c.subscription ? <div><StatusBadge status={c.subscription.status} /><p className="text-xs text-gray-600 mt-0.5">{c.subscription.plan}</p></div> : <span className="text-gray-700">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ COMMISSIONS ══ */}
        {tab === 'commissions' && (
          <div>
            <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit mb-4">
              {[
                { key: 'all',     label: `Toutes (${allCommissions.length})` },
                { key: 'company', label: `PME (${commissions.length})` },
                { key: 'cabinet', label: `Cabinet (${cabinetCommissions.length})` },
              ].map(t => (
                <button key={t.key} onClick={() => setCommTab(t.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${commTab === t.key ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
              {displayedComms.length === 0 ? (
                <div className="py-16 text-center"><TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune commission.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-800">
                      {['Client', 'Type', 'Paiement', 'Taux', 'Commission', 'Statut', 'Date'].map((h, i) => (
                        <th key={h} className={`text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider ${i === 0 ? 'text-left px-6' : i === 6 ? 'text-right px-6' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {displayedComms.map((c, i) => (
                        <tr key={c.id} className={`${i < displayedComms.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30`}>
                          <td className="px-6 py-4 text-sm font-medium text-white">{c.clientName}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${c.type === 'COMPANY' ? 'text-blue-400 bg-blue-900/20 border-blue-800/40' : 'text-purple-400 bg-purple-900/20 border-purple-800/40'}`}>
                              {c.type === 'COMPANY' ? 'PME' : 'Cabinet'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400 text-center">{fmt(c.paymentAmount)}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 text-center">{c.commissionRate}%</td>
                          <td className="px-4 py-4 text-sm font-bold text-indigo-400 text-center">{fmt(c.commissionAmount)}</td>
                          <td className="px-4 py-4 text-center"><StatusBadge status={c.status} /></td>
                          <td className="px-6 py-4 text-xs text-gray-500 text-right whitespace-nowrap">{fmtDate(c.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t border-gray-800 bg-gray-900/40">
                      <td colSpan={4} className="px-6 py-3 text-xs text-gray-500 uppercase">Total affiché</td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-400 text-center">{fmt(displayedComms.reduce((s, c) => s + c.commissionAmount, 0))}</td>
                      <td colSpan={2} />
                    </tr></tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ RETRAITS ══ */}
        {tab === 'history' && (
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-sm font-semibold text-white">Historique des retraits</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Chaque retrait couvre toutes vos commissions PME + Cabinet en attente.
                Versement sur <span className="font-mono text-gray-400">{affiliate.disbursementPhone || affiliate.phone || '—'}</span>.
              </p>
            </div>
            {withdrawalHistory.length === 0 ? (
              <div className="py-16 text-center"><Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun retrait effectué.</p></div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {withdrawalHistory.map(wd => (
                  <div key={wd.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-800/20">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-semibold text-white">{fmt(wd.amount)}</p>
                        <StatusBadge status={wd.status} />
                      </div>
                      <p className="text-xs text-gray-500">Demande le {fmtDate(wd.createdAt)}</p>
                      {wd.status === 'APPROVED' && <p className="text-xs text-blue-400">Yabetoo traite le versement (J+1)</p>}
                      {wd.paidAt && <p className="text-xs text-green-500">Versé le {fmtDate(wd.paidAt)}</p>}
                      {wd.paymentNote && <p className="text-xs text-gray-600 font-mono mt-0.5">Réf : {wd.paymentNote}</p>}
                      {wd.rejectionReason && <p className="text-xs text-red-400">Motif : {wd.rejectionReason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-700 text-center pb-6">
          Commissions générées automatiquement à chaque paiement réussi.
        </p>
      </main>
    </div>
  );
}