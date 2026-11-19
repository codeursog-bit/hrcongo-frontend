import type { DayOverview } from '@/types/contracts/day-overview';
/** Illustrative dates configured by the demo company, not a legal holiday calendar. */
export const dayOverview: DayOverview = { holidays: [{ date: '2026-12-25', label: 'Noël' }], absentColleagues: [{ id: 'demo-patrick', name: 'Patrick Likibi', label: 'Absent aujourd’hui' }], schedule: [{ label: 'Matin', start: '08:00', end: '12:00' }, { label: 'Après-midi', start: '13:00', end: '16:30' }] };
