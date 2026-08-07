'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/suivi-dettes/[employeeId]/page.tsx
// ✅ v2 — Fiche dette complète d'UN employé, côté admin/RH. C'est LA page de
//    référence pour gérer un employé : on y voit SES prêts et SES avances,
//    et pour chacun, SES remboursements (traçabilité : emprunté quand,
//    remboursé quand, combien). Depuis ici on peut :
//      - Modifier un prêt/avance (montant, mensualité/mois de déduction, motif)
//      - Supprimer un prêt/avance (réservé ADMIN/SUPER_ADMIN si déjà validé)
//      - Enregistrer un remboursement (prêts ET avances)
//      - Supprimer un remboursement erroné (double saisie...) — solde recalculé
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, Banknote, Wallet, PiggyBank, TrendingUp, Clock,
  CheckCircle2, XCircle, Ban, Wallet as WalletIcon, Pencil, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';
import CashPaymentModal from '@/components/loans/CashPaymentModal';
import EditDebtModal from '@/components/loans/EditDebtModal';

const DRH_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER']; // peut enregistrer/supprimer un remboursement
const FULL_ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']; // peut modifier/supprimer un prêt ou une avance déjà validé(e)

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
  const [logsByItem, setLogsByItem] = useState<Record<string, any[]>>({}); // clé: `${kind}-${id}`
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [payModal, setPayModal] = useState<{ kind: 'loan' | 'advance'; id: string; remaining: number } | null>(null);
  const [editItem, setEditItem] = useState<{ kind: 'loan' | 'advance'; id: string; amount: number; monthlyRepayment?: number; deductMonth?: number; deductYear?: number; reason?: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManageRepayments = DRH_ROLES.includes(userRole);
  const canEditDebt = FULL_ADMIN_ROLES.includes(userRole);

  const load = async () => {
    try {
      const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
      const myLoans = (l || []).filter((x: any) => x.employeeId === employeeId);
      const myAdvances = (a || []).filter((x: any) => x.employeeId === employeeId);
      setLoans(myLoans); setAdvances(myAdvances);
      setEmployee(myLoans[0]?.employee || myAdvances[0]?.employee || null);

      // ── Historique des remboursements — pour les prêts ET les avances ──
      const loansForHistory = myLoans.filter((x: any) => ['ACTIVE', 'PAID'].includes(x.status));
      const advancesForHistory = myAdvances.filter((x: any) => ['APPROVED', 'DEDUCTED', 'PAID'].includes(x.status));
      const [loanHistories, advanceHistories] = await Promise.all([
        Promise.all(loansForHistory.map((x: any) => api.get(`/loans/${x.id}/history`).catch(() => []))),
        Promise.all(advancesForHistory.map((x: any) => api.get(`/loans/advances/${x.id}/history`).catch(() => []))),
      ]);
      const map: Record<string, any[]> = {};
      loansForHistory.forEach((x: any, i: number) => { map[`loan-${x.id}`] = loanHistories[i] || []; });
      advancesForHistory.forEach((x: any, i: number) => { map[`advance-${x.id}`] = advanceHistories[i] || []; });
      setLogsByItem(map);
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
    const paidAdvances = advances.filter(a => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0)
      + advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + (Number(a.amount) - Number(a.remainingBalance ?? a.amount)), 0);
    const totalRemaining = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
      + advances.filter(a => a.status === 'APPROVED').reduce((s, a) => s + Number(a.remainingBalance ?? a.amount), 0);
    const monthlyLoad = loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.monthlyRepayment), 0);
    return { totalDue, totalPaid: paidLoans + paidAdvances, totalRemaining, monthlyLoad };
  }, [loans, advances]);

  // ── Historique unifié (les dettes elles-mêmes), trié du plus récent au plus ancien ──
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
    const allLogs = Object.values(logsByItem).flat();
    return months.map(m => {
      const emprunte = history.filter(r => { const d = new Date(r.createdAt); return d.getFullYear() === m.year && d.getMonth() + 1 === m.month; }).reduce((s, r) => s + Number(r.amount), 0);
      const rembourse = allLogs.filter((log: any) => log.year === m.year && log.month === m.month).reduce((s: number, log: any) => s + Number(log.amount), 0);
      return { mois: m.label, Emprunté: Math.round(emprunte), Remboursé: Math.round(rembourse) };
    });
  }, [history, logsByItem]);

  const handlePay = async (amount: number) => {
    if (!payModal) return;
    try {
      const path = payModal.kind === 'loan' ? `/loans/${payModal.id}/cash-repayment` : `/loans/advances/${payModal.id}/cash-repayment`;
      await api.post(path, { amount });
      setPayModal(null);
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur'); }
  };

  const handleSaveEdit = async (id: string, kind: 'loan' | 'advance', data: any) => {
    const path = kind === 'loan' ? `/loans/${id}` : `/loans/advances/${id}`;
    await api.patch(path, data);
    setEditItem(null);
    await load();
  };

  const handleDeleteDebt = async (kind: 'loan' | 'advance', id: string) => {
    if (!confirm(`Supprimer ${kind === 'loan' ? 'ce prêt' : 'cette avance'} ? Cette action est irréversible.`)) return;
    setBusyId(id);
    try {
      const path = kind === 'loan' ? `/loans/${id}` : `/loans/advances/${id}`;
      await api.delete(path);
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur lors de la suppression'); }
    finally { setBusyId(null); }
  };

  const handleDeleteLog = async (kind: 'loan' | 'advance', debtId: string, logId: string) => {
    if (!confirm('Supprimer ce remboursement ? Le montant sera automatiquement remis sur le solde restant.')) return;
    setBusyId(logId);
    try {
      const path = kind === 'loan' ? `/loans/${debtId}/cash-repayment/${logId}` : `/loans/advances/${debtId}/cash-repayment/${logId}`;
      await api.delete(path);
      await load();
    } catch (e: any) { alert(e?.message || 'Erreur lors de la suppression'); }
    finally { setBusyId(null); }
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
        <KpiCard icon={PiggyBank} label="Déjà remboursé (cumul des retenues)" value={fmt(kpis.totalPaid)} tone="emerald" />
        <KpiCard icon={Wallet} label="Reste à rembourser" value={fmt(kpis.totalRemaining)} tone="amber" />
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

      {/* ══════════════════ PRÊTS & AVANCES — détail + remboursements ══════════════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Prêts et avances — détail et remboursements</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {history.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucune dette pour cet employé.</p>
          ) : history.map(r => {
            const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING;
            const Icon = cfg.icon;
            const key = `${r.kind}-${r.id}`;
            const logs = logsByItem[key] ?? [];
            const isOpen = !!expanded[key];
            const canRepay = (r.kind === 'loan' && r.status === 'ACTIVE') || (r.kind === 'advance' && r.status === 'APPROVED');
            const canEditThis = canEditDebt || (r.status === 'PENDING' && canManageRepayments);
            const canDeleteThis = canEditDebt || (['PENDING', 'REJECTED', 'CANCELLED'].includes(r.status) && canManageRepayments);
            const hasLogHistory = ['ACTIVE', 'PAID'].includes(r.status) || (r.kind === 'advance' && ['APPROVED', 'DEDUCTED', 'PAID'].includes(r.status));

            return (
              <div key={key} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {TYPE_LABEL[r.requestType] ?? r.requestType} · {fmt(Number(r.amount))}
                      {r.kind === 'advance' && <span className="text-gray-400 font-normal"> · déduction {r.deductMonth}/{r.deductYear}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.reason ? `${r.reason} · ` : ''}
                      {r.kind === 'loan' && r.decidedByRole ? `Validé par ${r.decidedByRole === 'DG' ? 'la Direction Générale' : 'le DRH'} · ` : ''}
                      Reste : {fmt(Number(r.remainingBalance ?? r.amount))}
                      {r.rejectionReason ? ` · Refusé : ${r.rejectionReason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.cls}`}><Icon size={10} /> {cfg.label}</span>
                    {canRepay && (
                      <button onClick={() => setPayModal({ kind: r.kind, id: r.id, remaining: Number(r.remainingBalance ?? r.amount) })} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                        <WalletIcon size={13} /> Confirmer un remboursement
                      </button>
                    )}
                    {canEditThis && (
                      <button onClick={() => setEditItem({ kind: r.kind, id: r.id, amount: Number(r.amount), monthlyRepayment: r.monthlyRepayment ? Number(r.monthlyRepayment) : undefined, deductMonth: r.deductMonth, deductYear: r.deductYear, reason: r.reason })} className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1">
                        <Pencil size={12} /> Modifier
                      </button>
                    )}
                    {canDeleteThis && (
                      <button onClick={() => handleDeleteDebt(r.kind, r.id)} disabled={busyId === r.id} className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 flex items-center gap-1">
                        {busyId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Supprimer
                      </button>
                    )}
                    {hasLogHistory && (
                      <button onClick={() => setExpanded(s => ({ ...s, [key]: !s[key] }))} className="px-2 py-1.5 text-xs font-semibold text-sky-600 hover:underline flex items-center gap-0.5">
                        {logs.length} remb. {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-3 ml-1 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-1.5">
                    {logs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-1">Aucun remboursement enregistré pour l&apos;instant.</p>
                    ) : logs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between gap-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                        <div>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">{fmt(Number(log.amount))}</span>
                          <span className="text-xs text-gray-400 ml-2">{MONTHS_FR[log.month - 1]} {log.year}</span>
                          <span className="text-[10px] text-gray-400 ml-2">{log.method === 'PAYROLL' ? '· déduit sur paie' : '· espèces'}</span>
                        </div>
                        {canManageRepayments && (
                          <button onClick={() => handleDeleteLog(r.kind, r.id, log.id)} disabled={busyId === log.id} className="text-gray-400 hover:text-red-600 disabled:opacity-40 shrink-0" title="Supprimer ce remboursement">
                            {busyId === log.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CashPaymentModal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        remaining={payModal?.remaining ?? 0}
        onConfirm={handlePay}
      />

      <EditDebtModal
        open={!!editItem}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSave={handleSaveEdit}
      />
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
