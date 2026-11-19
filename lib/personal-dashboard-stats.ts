export function computeFallbackLeaveBalance(employeeProfile: any, approvedAnnualLeaves: any[]) {
  const takenDays = approvedAnnualLeaves.reduce((acc: number, curr: any) => acc + (curr.daysCount || 0), 0);
  if (!employeeProfile?.hireDate) return 0;
  const months = (Date.now() - new Date(employeeProfile.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(0, Math.round(Math.min(26, months * (26 / 12)) * 10) / 10 - takenDays);
}

// 🆕 KPI dettes (prêts + avances) de l'employé connecté — même logique que
// /loans/mon-espace (myKpis), pour rester cohérent avec le reste de l'app.
export function computeDebtKpis(loans: any[] = [], advances: any[] = []) {
  const dueLoans = loans.filter((l) => ['ACTIVE', 'PAID'].includes(l.status));
  const paidLoans = dueLoans.reduce((s, l) => s + (Number(l.amount) - Number(l.remainingBalance)), 0);
  const paidAdvances = advances.filter((a) => ['DEDUCTED', 'PAID'].includes(a.status)).reduce((s, a) => s + Number(a.amount), 0);
  const totalRemaining = loans.filter((l) => l.status === 'ACTIVE').reduce((s, l) => s + Number(l.remainingBalance), 0)
    + advances.filter((a) => a.status === 'APPROVED').reduce((s, a) => s + Number(a.amount), 0);
  return { totalPaid: paidLoans + paidAdvances, totalRemaining };
}

// 🆕 Taux de présence du mois en cours uniquement, à partir de
// /attendance/employee/:id (mêmes statuts DayStatus que partout ailleurs).
export function computeMonthlyPresenceRate(dayStatuses: any[] = []) {
  const workable = dayStatuses.filter((d) => !['OFF_DAY', 'HOLIDAY', 'FUTURE', 'LEAVE'].includes(d.status));
  if (workable.length === 0) return 0;
  const present = workable.filter((d) => ['PRESENT', 'LATE', 'REMOTE'].includes(d.status)).length;
  return Math.round((present / workable.length) * 100);
}

