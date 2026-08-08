'use client';

// ============================================================================
// 📁 app/(dashboard)/loans/releve/[employeeId]/page.tsx
// ✅ Relevé de compte chronologique d'un employé — calqué sur le modèle Excel
//    du client (une ligne par mouvement : Date / Motif / Réf / Montant /
//    Remboursement), avec un total en tête façon feuille "RECAP".
// ✅ Page de LECTURE / suivi et impression — pour modifier ou supprimer un
//    prêt/avance/remboursement, on va sur la fiche "Suivi des dettes" qui a
//    les actions d'édition.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Printer, Pencil } from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import FinanceSubNav from '@/components/FinanceSubNav';

const TYPE_LABEL: Record<string, string> = { ARGENT: 'Prêt argent', MARCHANDISE: 'Prêt marchandise', AUTRE: 'Autre prêt', AVANCE: 'Avance sur salaire' };
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' FCFA';
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

type Mouvement = { date: string; motif: string; ref: string; montant: number; remboursement: number };

export default function ReleveEmployeeDetailPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const router = useRouter();
  const { bp } = useBasePath();

  const [employee, setEmployee] = useState<any>(null);
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try { const stored = localStorage.getItem('user'); if (stored) setUserRole(JSON.parse(stored).role || ''); } catch {}
    (async () => {
      try {
        const [l, a, d]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances'), api.get('/company-deductions')]);
        const myLoans = (l || []).filter((x: any) => x.employeeId === employeeId);
        const myAdvances = (a || []).filter((x: any) => x.employeeId === employeeId);
        const myDeductions = (d || []).filter((x: any) => x.employeeId === employeeId && x.status !== 'CANCELLED');
        setEmployee(myLoans[0]?.employee || myAdvances[0]?.employee || myDeductions[0]?.employee || null);

        const relevantLoans = myLoans.filter((x: any) => ['ACTIVE', 'PAID'].includes(x.status));
        const relevantAdvances = myAdvances.filter((x: any) => ['APPROVED', 'DEDUCTED', 'PAID'].includes(x.status));
        const [loanHistories, advanceHistories] = await Promise.all([
          Promise.all(relevantLoans.map((x: any) => api.get(`/loans/${x.id}/history`).catch(() => []))),
          Promise.all(relevantAdvances.map((x: any) => api.get(`/loans/advances/${x.id}/history`).catch(() => []))),
        ]);

        const rows: Mouvement[] = [];

        myLoans.forEach((x: any) => {
          rows.push({ date: x.createdAt, motif: TYPE_LABEL[x.type ?? 'ARGENT'], ref: x.reference || '', montant: Number(x.amount), remboursement: 0 });
        });
        relevantLoans.forEach((x: any, i: number) => {
          (loanHistories[i] || []).forEach((log: any) => {
            rows.push({ date: log.createdAt || `${log.year}-${String(log.month).padStart(2, '0')}-01`, motif: 'Remboursement prêt', ref: '', montant: 0, remboursement: Number(log.amount) });
          });
        });

        myAdvances.forEach((x: any) => {
          rows.push({ date: x.createdAt, motif: 'Avance sur salaire', ref: x.reference || '', montant: Number(x.amount), remboursement: 0 });
        });
        relevantAdvances.forEach((x: any, i: number) => {
          (advanceHistories[i] || []).forEach((log: any) => {
            rows.push({ date: log.createdAt || `${log.year}-${String(log.month).padStart(2, '0')}-01`, motif: 'Remboursement avance', ref: '', montant: 0, remboursement: Number(log.amount) });
          });
        });

        myDeductions.forEach((x: any) => {
          // Retenue diverse (Pharmacie, Hôpital, Cantine...) — dès qu'elle est
          // DEDUCTED, elle a été retenue directement sur la paie : c'est donc
          // un débit ET un remboursement immédiat sur la même ligne.
          rows.push({ date: x.createdAt, motif: x.label, ref: '', montant: Number(x.amount), remboursement: x.status === 'DEDUCTED' ? Number(x.amount) : 0 });
        });

        rows.sort((r1, r2) => new Date(r1.date).getTime() - new Date(r2.date).getTime());
        setMouvements(rows);
      } catch (e) { console.error('Erreur relevé employé', e); }
      finally { setIsLoading(false); }
    })();
  }, [employeeId]);

  const totals = useMemo(() => {
    const totalMontant = mouvements.reduce((s, m) => s + m.montant, 0);
    const totalRemb = mouvements.reduce((s, m) => s + m.remboursement, 0);
    return { totalMontant, totalRemb, solde: totalMontant - totalRemb };
  }, [mouvements]);

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  const initials = `${employee?.firstName?.[0] ?? ''}${employee?.lastName?.[0] ?? ''}`;

  return (
    <div className="max-w-[900px] mx-auto pb-24 space-y-5 print:max-w-full">
      <div className="print:hidden">
        <FinanceSubNav userRole={userRole} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => router.push(bp('/loans/releve'))} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-semibold">
          <ArrowLeft size={16} /> Retour au relevé
        </button>
        <div className="flex gap-2">
          <button onClick={() => router.push(bp(`/loans/suivi-dettes/${employeeId}`))} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 text-xs font-semibold rounded-lg text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <Pencil size={12} /> Modifier / gérer
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Printer size={12} /> Imprimer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-base font-bold text-sky-600 overflow-hidden shrink-0 print:hidden">
          {employee?.photoUrl ? <img src={employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Relevé de compte — {employee?.firstName} {employee?.lastName}</h1>
          <p className="text-sm text-gray-500">{employee?.department?.name || '—'} · Matricule {employee?.employeeNumber || '—'}</p>
        </div>
      </div>

      {/* ── Totaux, façon ligne 2 de la feuille Excel ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Total emprunté</p>
          <p className="font-bold text-gray-800 dark:text-gray-100">{fmt(totals.totalMontant)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Total remboursé</p>
          <p className="font-bold text-emerald-600">{fmt(totals.totalRemb)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 text-center">
          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Solde</p>
          <p className={`font-bold ${totals.solde > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{fmt(totals.solde)}</p>
        </div>
      </div>

      {/* ── Relevé chronologique ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Motif</th>
              <th className="px-4 py-2.5 text-right">Montant emprunté</th>
              <th className="px-4 py-2.5 text-right">Remboursement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {mouvements.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Aucun mouvement pour cet employé.</td></tr>
            ) : mouvements.map((m, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{fmtDate(m.date)}</td>
                <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">{m.motif}</td>
                <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-200">{m.montant ? fmt(m.montant) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">{m.remboursement ? fmt(m.remboursement) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}