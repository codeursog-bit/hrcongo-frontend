// 🕐 Jours travaillés de l'entreprise — convention : 0 = dimanche … 6 = samedi (comme Date.getDay()).
// Tolérant : un « 7 » enregistré par l'ancien écran Paramètres → Entreprise est lu comme dimanche.
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

export function isWorkDay(workDays: number[] | undefined | null, jsDay: number): boolean {
  const w = workDays && workDays.length ? workDays : DEFAULT_WORK_DAYS;
  return w.includes(jsDay) || (jsDay === 0 && w.includes(7));
}