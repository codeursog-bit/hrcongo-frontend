'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/suivi-dettes/[employeeId]/page.tsx
// ✅ Fiche dette d'UN employé, côté admin/RH — 4 KPI, historique complet
//    (traçabilité : date, type, motif, validé par), courbe d'évolution de
//    la dette dans le temps, et un bouton "Payer" bien visible pour
//    enregistrer un paiement ou solder la dette.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Banknote, Wallet, PiggyBank, TrendingUp, Clock,
  CheckCircle2, XCircle, Ban, Wallet as WalletIcon, X,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';

const STATUS_CFG: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING:    { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  PENDING_DG: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-100', icon: Clock },
  ACTIVE:     { label: 'Actif',      cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  APPROVED:   { label: 'Approuvée',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: CheckCircle2 },
  PAID:       { label: 'Soldé',      cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  DEDUCTED:   { label: 'Déduite',    cls: 'bg-sky-50 text-sky-700 border-sky-100', icon: CheckCircle2 },
  REJECTED:   { label: 'Refusé',     cls: 'bg-red-50 text-red-700 border-red-100', icon: XCircle },
  CANCELLED:  { label: 'Annulé',     cls: 'bg-gray-50 text-gray-500 border-gray-200', icon: Ban },
};

export default function EmployeeDebtDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const router = useRouter();
  const { bp } = useBasePath();

  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  const [historyByLoan, setHistoryByLoan] = useState<Record<string, any[]>>({});
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [payModal, setPayModal] = useState<{ loanId: string; remaining: number } | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  const load = async () => {
    try {
      const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
      const myLoans = (l || []).filter((x: any) => x.employeeId === employeeId);
      const myAdvances = (a || []).filter((x: any) => x.employeeId === employeeId);
      setLoans(myLoans); setAdvances(myAdvances);
      setEmployee(myLoans[0]?.employee || myAdvances[0]?.employee || null);

      const histories = await Promise.all(myLoans.filter((x: any) => x.status === 'ACTIVE' || x.status === 'PAID').map((x: any) => api.get(`/loans/${x.id}/history`).catch(() => [])));
      const map: Record<string, any[]> = {};
      myLoans.forEach((x: any, i: number) => { if (x.status === 'ACTIVE' || x.status === 'PAID') map[x.id] = histories[myLoans.filter((y: any) => y.status === 'ACTIVE' || y.status === 'PAID').indexOf(x)] || []; });
      setHistoryByLoan(map);
    } catch (e) { console.error('Erreur fiche employé', e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    load();
  }, [employeeId]);

  // ── 4 KPI ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const dueLoans = loans.filter(l => ['ACTIVE', 'PAID'].includes(l.status));
    const dueAdvances = advances.filter(a => ['APPROVED', 'DEDUCTED', 'PAID'].includes(a.status));
    const totalDue = dueLoans.reduce((s, l) => s + Number(l.amount), 0) + dueAdvances.reduce((s, a) => s + Number(a.amount), 0);
    const paidLoans = dueLoans.reduce((s, l) => s + (Number(l.amount) - Number(l.remainingBalance)), 0);
    const paidAdvances = advances.filter(a => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0);
    const totalRemaining = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
      + advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.amount), 0);
    const monthlyLoad = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.monthlyRepayment), 0);
    return { totalDue, totalPaid: paidLoans + paidAdvances, totalRemaining, monthlyLoad };
  }, [loans, advances]);

  // ── Historique unifié, trié du plus récent au plus ancien ────────────────
  const history = useMemo(() => {
    const l = loans.map(x => ({ ...x, kind: 'loan' as const, requestType: x.type ?? 'ARGENT' }));
    const a = advances.map(x => ({ ...x, kind: 'advance' as const, requestType: 'AVANCE' }));
    return [...l, ...a].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
  }, [loans, advances]);

  // ── Courbe d'évolution : emprunté vs remboursé, 12 derniers mois ────────
  const trendData = useMemo(() => {
    const months: { key: string; label: string; year: number; month: number }[] = [];
    const ref = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth() + 1}`, label: `${MONTHS_FR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const allLogs = Object.values(historyByLoan).flat();
    return months.map(m => {
      const emprunte = history.filter(r => { const d = new Date(r.createdAt); return d.getFullYear() === m.year && d.getMonth() + 1 === m.month; }).reduce((s, r) => s + Number(r.amount), 0);
      const rembourse = allLogs.filter((log: any) => log.year === m.year && log.month === m.month).reduce((s: number, log: any) => s + Number(log.amount), 0);
      return { mois: m.label, Emprunté: Math.round(emprunte), Remboursé: Math.round(rembourse) };
    });
  }, [history, historyByLoan]);

  const handlePay = async () => {
    if (!payModal) return;
    const amount = Number(payAmount.replace(/[^\d.]/g, ''));
    if (!amount || amount <= 0) { alert('Montant invalide'); return; }
    setIsPaying(true);
    try {
      await api.post(`/loans/${payModal.loanId}/cash-repayment`, { amount });
      setPayModal(null); setPayAmount('');
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); } finally { setIsPaying(false); }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  const initials = `${employee?.firstName?.[0] ?? ''}${employee?.lastName?.[0] ?? ''}`;

  return (
    <div className="max-w-[1200px] mx-auto pb-24 space-y-6">
      <FinanceSubNav userRole={userRole} />

      <button onClick={() => router.push(bp('/loans/suivi-dettes'))} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold">
        <ArrowLeft size={16} /> Retour au suivi des dettes
      </button>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-lg font-bold text-sky-600 overflow-hidden shrink-0">
          {employee?.photoUrl ? <img src={employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{employee?.firstName} {employee?.lastName}</h1>
          <p className="text-sm text-gray-500">{employee?.department?.name || '—'} · Matricule {employee?.employeeNumber || '—'}</p>
        </div>
      </div>

      {/* ══════════════════ KPI ══════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Banknote} label="Montant dû (total)" value={fmt(kpis.totalDue)} tone="slate" />
        <KpiCard icon={PiggyBank} label="Déjà payé" value={fmt(kpis.totalPaid)} tone="emerald" />
        <KpiCard icon={Wallet} label="Reste à payer" value={fmt(kpis.totalRemaining)} tone="amber" />
        <KpiCard icon={TrendingUp} label="Mensualité en cours" value={fmt(kpis.monthlyLoad)} tone="sky" />
      </div>

      {/* ══════════════════ COURBE D'ÉVOLUTION ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">Évolution de la dette (12 derniers mois)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="mois" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend />
            <Line type="monotone" dataKey="Emprunté" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Remboursé" stroke="#10b981" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ══════════════════ HISTORIQUE / TRAÇABILITÉ ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Historique complet</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {history.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune dette pour cet employé.</p>
          ) : history.map(r => {
            const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING;
            const Icon = cfg.icon;
            return (
              <div key={`${r.kind}-${r.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {TYPE_LABEL[r.requestType] ?? r.requestType} · {fmt(Number(r.amount))}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.reason ? `${r.reason} · ` : ''}
                    {r.kind === 'loan' && r.decidedByRole ? `Validé par ${r.decidedByRole === 'DG' ? 'la Direction Générale' : 'le DRH'}` : ''}
                    {r.rejectionReason ? `Refusé : ${r.rejectionReason}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                  {r.kind === 'loan' && r.status === 'ACTIVE' && (
                    <button onClick={() => setPayModal({ loanId: r.id, remaining: Number(r.remainingBalance) })} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                      <WalletIcon size={13} /> Payer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════ MODAL PAIEMENT ══════════════════ */}
      {payModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPayModal(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-gray-900 dark:text-white text-lg">Enregistrer un paiement</p>
              <button onClick={() => setPayModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Reste dû : <span className="font-semibold text-amber-600">{fmt(payModal.remaining)}</span></p>
            <input
              type="text" inputMode="numeric" autoFocus value={payAmount} onChange={e => setPayAmount(e.target.value)}
              placeholder="Montant payé (FCFA)"
              className="w-full text-lg font-semibold p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 mb-3"
            />
            <button onClick={() => setPayAmount(String(payModal.remaining))} className="text-xs font-semibold text-sky-600 hover:underline mb-4">
              Solder toute la dette ({fmt(payModal.remaining)})
            </button>
            <div className="flex gap-2">
              <button onClick={handlePay} disabled={isPaying} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {isPaying ? <Loader2 size={16} className="animate-spin" /> : <WalletIcon size={16} />} Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'slate' | 'emerald' | 'amber' | 'sky' }) {
  const cls: Record<string, string> = {
    slate: 'bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${cls[tone]}`}><Icon size={18} /></div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
    </div>
  );
}