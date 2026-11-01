// ============================================================================
// lib/bulletin-salary-prorata.ts
//
// Présentation « salaire de base proratisé » du bulletin (option entreprise
// `company.salaryProrataDisplay`).
//
// ⚠️ PRÉSENTATION SEULEMENT. Rien n'est écrit en base : SAL_BASE (salaire plein)
// et ABS_DEDUCT (déduction d'absence) restent tels quels, donc le journal de
// paie, la DAS, l'audit… voient toujours l'absence. On ne fait ici que
// fusionner les deux lignes à l'affichage, comme pour une prime au prorata :
//
//   Version actuelle :  Salaire de base   26 | 29 645,04 | 770 771
//                       Déduction absences  6 | 29 645,04 | 177 870 (retenue)
//   Version proratisée: Salaire de base   20 | 29 645,04 | 592 901
//
// Seule la déduction réellement appliquée par le moteur (ABS_DEDUCT) est
// retranchée : une absence justifiée payée n'est jamais déduite, donc elle
// reste comptée dans les jours payés. Les lignes de congé (ABS_CONGE,
// INDEM_CONGE, CONGE_SUPP) ne sont jamais touchées.
//
// Sans effet (bulletin renvoyé tel quel) quand :
//   • l'option est désactivée ;
//   • il n'y a pas de ligne d'absence ;
//   • le bulletin est ancien (SAL_BASE sans Nombre/Base) ou incohérent
//     (base différente entre salaire et absence) — on ne devine rien.
// ============================================================================

const n = (v: any): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const round2 = (x: number): number => Math.round(x * 100) / 100;

export function presentSalaryProrata<T extends { items?: any[] }>(payroll: T): T {
  if (!payroll || !(payroll as any).company?.salaryProrataDisplay) return payroll;

  const items: any[] = Array.isArray(payroll.items) ? payroll.items : [];
  const sal = items.find((i) => i?.code === 'SAL_BASE' && i?.type === 'GAIN');
  const abs = items.find((i) => i?.code === 'ABS_DEDUCT');
  if (!sal || !abs) return payroll;

  const qSal = n(sal.quantity);
  const qAbs = n(abs.quantity);
  const base = n(sal.base);
  if (!(qSal > 0) || !(qAbs > 0) || !(qAbs < qSal) || !(base > 0)) return payroll;
  // Même valeur d'un jour sur les deux lignes, sinon Nombre × Base ne tombe plus juste.
  if (Math.abs(n(abs.base) - base) >= 0.005) return payroll;

  const amount = n(sal.amount) - n(abs.amount);
  if (!(amount >= 0)) return payroll;

  return {
    ...payroll,
    items: items
      .filter((i) => i !== abs)
      .map((i) => (i === sal ? { ...sal, quantity: round2(qSal - qAbs), amount } : i)),
  };
}