import { getPendingAttendances, markAttendanceSynced } from './db';

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

async function syncAttendance(attendance: any, apiClient: any): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await apiClient.post('/attendance/check-in', {
      employeeId: attendance.employeeId,
      timestamp: attendance.timestamp,
      latitude: attendance.latitude,
      longitude: attendance.longitude,
      notes: attendance.notes,
    });

    if (response) {
      await markAttendanceSynced(attendance.id);
      return { success: true };
    }
    return { success: false, error: 'No response' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncAllPendingAttendances(apiClient: any) {
  if (isSyncing) return { success: 0, failed: 0, total: 0, errors: [] };

  isSyncing = true;
  try {
    const pending = await getPendingAttendances();
    if (pending.length === 0) return { success: 0, failed: 0, total: 0, errors: [] };

    const results = { success: 0, failed: 0, total: pending.length, errors: [] as any[] };

    for (const attendance of pending) {
      const result = await syncAttendance(attendance, apiClient);
      
      // ✅ FIX: Toujours un objet avec success
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ 
          id: attendance.id!, 
          error: result.error || 'Unknown error' 
        });
      }
    }

    return results;
  } finally {
    isSyncing = false;
  }
}

export function startAutoSync(apiClient: any, onSyncComplete?: (result: any) => void) {
  if (syncInterval) return;

  syncInterval = setInterval(async () => {
    if (!navigator.onLine) return;
    const result = await syncAllPendingAttendances(apiClient);
    if (result.total > 0 && onSyncComplete) {
      onSyncComplete(result);
    }
  }, 30000);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}