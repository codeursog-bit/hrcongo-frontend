export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function attendanceCutoff(date: Date, settings: { officialStartHour?: number; officialStartMinute?: number; lateToleranceMinutes?: number }) {
  const result = new Date(date);
  result.setHours(settings.officialStartHour ?? 8, (settings.officialStartMinute ?? 0) + (settings.lateToleranceMinutes ?? 0), 0, 0);
  return result;
}

export function monthlyAttendanceStatus(day: Date, working: boolean, status: any, now: Date, settings: Parameters<typeof attendanceCutoff>[1]): string {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const cell = new Date(day); cell.setHours(0, 0, 0, 0);
  if (cell > today) return 'future';
  if (status?.checkIn) return status.status === 'LATE' ? 'late' : status.status === 'REMOTE' ? 'remote' : 'present';
  if (!working) return 'non-working';
  if (cell.getTime() === today.getTime() && now < attendanceCutoff(now, settings)) return 'future';
  return ({ PRESENT: 'present', LATE: 'late', ABSENT_UNPAID: 'absent', ABSENT_PAID: 'leave', REMOTE: 'remote',
    LEAVE: 'leave', HOLIDAY: 'holiday', OFF_DAY: 'non-working', FUTURE: 'future' } as Record<string, string>)[status?.status] ?? 'future';
}
