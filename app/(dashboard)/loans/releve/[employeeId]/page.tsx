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
        const [l, a]: any = await Promise.all([api.get('/loans'), api.get('/loans/advances')]);
        const myLoans = (l || []).filter((x: any) => x.employeeId === employeeId);
        const myAdvances = (a || []).filter((x: any) => x.employeeId === employeeId);
        setEmployee(myLoans[0]?.employee || myAdvances[0]?.employee || null);

        const relevantLoans = myLoans.filter((x: any) => ['ACTIVE', 'PAID'].includes(x.status));
        const relevantAdvances = myAdvances.filter((x: any) => ['APPROVED', 'DEDUCTED', 'PAID'].includes(x.status));
        const [loanHistories, advanceHistories] = await Promise.all([
          Promise.all(relevantLoans.map((x: any) => api.get(`/loans/${x.id}/history`).catch(() => []))),
          Promise.all(relevantAdvances.map((x: any) => api.get(`/loans/advances/${x.id}/history`).catch(() => []))),
        ]);

        const rows: Mouvement[] = [];

        myLoans.forEach((x: any) => {
          const label = TYPE_LABEL[x.type ?? 'ARGENT'];
          // ✅ startDate (date de départ voulue à la création), pas createdAt
          // (date de création de l'enregistrement, souvent "aujourd'hui" même
          // si le prêt a été programmé pour un mois différent).
          rows.push({ date: x.startDate ?? x.createdAt, motif: x.type === 'AUTRE' && x.reason ? x.reason : label, ref: x.reference || '', montant: Number(x.amount), remboursement: 0 });
        });
        relevantLoans.forEach((x: any, i: number) => {
          (loanHistories[i] || []).forEach((log: any) => {
            // ✅ recordedAt est le vrai champ sur LoanRepaymentLog — log.createdAt
            // n'existe pas du tout sur ce modèle, donc ça retombait toujours
            // sur le 1er du mois (approximatif) au lieu de l'heure précise du
            // remboursement.
            rows.push({ date: log.recordedAt || `${log.year}-${String(log.month).padStart(2, '0')}-01`, motif: 'Remboursement prêt', ref: '', montant: 0, remboursement: Number(log.amount) });
          });
        });

        myAdvances.forEach((x: any) => {
          rows.push({ date: x.createdAt, motif: 'Avance sur salaire', ref: x.reference || '', montant: Number(x.amount), remboursement: 0 });
        });
        relevantAdvances.forEach((x: any, i: number) => {
          (advanceHistories[i] || []).forEach((log: any) => {
            rows.push({ date: log.recordedAt || `${log.year}-${String(log.month).padStart(2, '0')}-01`, motif: 'Remboursement avance', ref: '', montant: 0, remboursement: Number(log.amount) });
          });
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

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  const initials = `${employee?.firstName?.[0] ?? ''}${employee?.lastName?.[0] ?? ''}`;

  return (
    <div className="max-w-[1200px] mx-auto pb-24 space-y-5 print:max-w-full">
      <div className="print:hidden">
        <FinanceSubNav userRole={userRole} />
      </div>

      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => router.push(bp('/loans/releve'))} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)] font-semibold">
          <ArrowLeft size={16} /> Retour au relevé
        </button>
        <div className="flex gap-2">
          <button onClick={() => router.push(bp(`/loans/suivi-dettes/${employeeId}`))} className="px-3 py-1.5 border border-[var(--border)] text-xs font-semibold rounded-lg text-[var(--text-muted)] flex items-center gap-1.5">
            <Pencil size={12} /> Modifier / gérer
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Printer size={12} /> Imprimer
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-base font-bold text-emerald-600 overflow-hidden shrink-0 print:hidden">
          {employee?.photoUrl ? <img src={employee.photoUrl} className="w-full h-full object-cover" alt={initials} /> : initials}
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--text)]">Relevé de compte — {employee?.firstName} {employee?.lastName}</h1>
          <p className="text-sm text-[var(--text-muted)]">{employee?.department?.name || '—'} · Matricule {employee?.employeeNumber || '—'}</p>
        </div>
      </div>

      {/* ── Totaux, façon ligne 2 de la feuille Excel ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Total emprunté</p>
          <p className="font-bold text-[var(--text)]">{fmt(totals.totalMontant)}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Total remboursé</p>
          <p className="font-bold text-emerald-600">{fmt(totals.totalRemb)}</p>
        </div>
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-3 text-center">
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Solde</p>
          <p className={`font-bold ${totals.solde > 0 ? 'text-amber-600' : 'text-[var(--text-muted)]'}`}>{fmt(totals.solde)}</p>
        </div>
      </div>

      {/* ── Relevé chronologique ── */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-[var(--text-muted)] uppercase border-b border-[var(--border)]">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Motif</th>
              <th className="px-4 py-2.5 text-right">Montant emprunté</th>
              <th className="px-4 py-2.5 text-right">Remboursement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {mouvements.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-[var(--text-muted)]">Aucun mouvement pour cet employé.</td></tr>
            ) : mouvements.map((m, i) => (
              <tr key={i}>
                <td className="px-4 py-2.5 text-[var(--text-muted)] whitespace-nowrap">{fmtDate(m.date)}</td>
                <td className="px-4 py-2.5 text-[var(--text)]">{m.motif}</td>
                <td className="px-4 py-2.5 text-right text-[var(--text)]">{m.montant ? fmt(m.montant) : '—'}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">{m.remboursement ? fmt(m.remboursement) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}