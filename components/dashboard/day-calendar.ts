/** Calendar/date presentation only; never computes leave entitlements or payroll. */
export function dayKey(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Brazzaville', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value || '').join('-');
}
export function calendarDays(month: string) {
  const [year, index] = month.split('-').map(Number); const offset = (new Date(Date.UTC(year, index - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, index, 0)).getUTCDate();
  return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)] as (string | null)[];
}
export function elapsedClock(start?: string, end?: string, now = Date.now()): string {
  if (!start || !Number.isFinite(new Date(start).getTime())) return '00:00:00';
  const stop = end ? new Date(end).getTime() : now;
  if (!Number.isFinite(stop)) return '00:00:00';
  const seconds = Math.max(0, Math.floor((stop - new Date(start).getTime()) / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(n => String(n).padStart(2, '0')).join(':');
}
export function nextCalendarMonth(month: string, delta: number): string {
  const [year, index] = month.split('-').map(Number); return new Date(Date.UTC(year, index - 1 + delta, 1)).toISOString().slice(0, 7);
}
