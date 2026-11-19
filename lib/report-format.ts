/** Une valeur absente ne doit ni planter l'écran ni devenir une variation de 0 %. */
export function formatReportPercent(value: unknown): string {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) ? `${number > 0 ? '+' : ''}${number.toFixed(1)}%` : '—';
}
