// ============================================================================
// 📁 lib/debt-dates.ts
// ✅ Date de RÉFÉRENCE d'une dette — UNE seule règle pour toutes les pages
//    (suivi, rapport, vue d'ensemble, mon espace) afin que "janvier" soit
//    "janvier" partout :
//    - Prêt   → date de début saisie (startDate)
//    - Avance → mois/année de la demande (month/year), sinon createdAt
// ============================================================================

export function debtRefDate(r: any, kind?: 'loan' | 'advance'): Date {
  const isAdvance = kind ? kind === 'advance' : (r?.requestType === 'AVANCE' || (r?.deductMonth != null && r?.monthlyRepayment == null));
  if (isAdvance) return r.month && r.year ? new Date(r.year, r.month - 1, 1) : new Date(r.createdAt);
  return new Date(r.startDate ?? r.createdAt);
}