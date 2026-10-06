// 🆕 API de la pause de la journée
import { api } from '@/services/api';

export type BreakState =
  | 'UNAVAILABLE'  // planning/shift : pause d'entreprise non applicable
  | 'NOT_WORKING'  // pas pointé en entrée (ou déjà sorti)
  | 'TOO_EARLY'    // avant l'heure de début de pause
  | 'AVAILABLE'    // peut prendre sa pause
  | 'ON_BREAK'     // en pause : la reprise se pointe (scan / GPS)
  | 'DONE';        // pause terminée

export interface BreakInfo {
  startedAt: string;
  expectedEndAt: string;
  endedAt: string | null;
  minutes: number | null;
  lateMinutes: number;
  resumedAuto: boolean;
}

export interface BreakStatus {
  enabled: boolean;
  state?: BreakState;
  startsAt?: string;          // "12:00"
  durationMinutes?: number;
  toleranceMinutes?: number;
  pause?: BreakInfo | null;
}

export const breakApi = {
  status: () => api.get<BreakStatus>('/attendance-break/status'),
  start:  () => api.post<BreakStatus>('/attendance-break/start', {}),
  end:    (latitude?: number, longitude?: number, accuracy?: number) =>
    api.post<{ success: boolean; message: string; lateMinutes: number }>('/attendance-break/end', { latitude, longitude, accuracy }),
  // Admin / RH — justification obligatoire
  correct: (attendanceId: string, endedAt: string, reason: string) =>
    api.patch<{ success: boolean }>(`/attendance-break/${attendanceId}`, { endedAt, reason }),
};