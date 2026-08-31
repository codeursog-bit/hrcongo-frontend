import Dexie, { Table } from 'dexie';

export interface QueuedAttendance {
  id?: number;
  employeeId: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  synced: boolean;
  syncedAt?: string;
  queuedAt: string;
  error?: string;
  retryCount: number;
}

export class KonzaRHDatabase extends Dexie {
  queuedAttendances!: Table<QueuedAttendance, number>;

  constructor() {
    super('KonzaRH'); // ✅ CHANGÉ ICI
    this.version(1).stores({
      queuedAttendances: '++id, employeeId, synced, timestamp',
    });
  }
}

export const db = new KonzaRHDatabase();

export async function addAttendanceToQueue(attendance: Omit<QueuedAttendance, 'id' | 'synced' | 'queuedAt' | 'retryCount'>) {
  return await db.queuedAttendances.add({
    ...attendance,
    synced: false,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  });
}

export async function getPendingAttendances() {
  return await db.queuedAttendances.where('synced').equals(0).toArray();
}

export async function markAttendanceSynced(id: number) {
  return await db.queuedAttendances.update(id, {
    synced: true,
    syncedAt: new Date().toISOString(),
  });
}

export async function clearAllData() {
  await db.queuedAttendances.clear();
}

export async function countPendingActions() {
  const count = await db.queuedAttendances.where('synced').equals(0).count();
  return { attendances: count, total: count };
}