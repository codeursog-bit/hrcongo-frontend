'use client';

import { useState, useCallback } from 'react';
import { addAttendanceToQueue } from '@/lib/pwa/db';
import { useOffline } from './useOffline';

export function useAttendanceOffline() {
  const { isOffline } = useOffline();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkIn = useCallback(async (data: {
    employeeId: string;
    type?: 'CHECK_IN' | 'CHECK_OUT';
    latitude?: number;
    longitude?: number;
    notes?: string;
  }, apiClient?: any) => {
    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();

      if (isOffline || !apiClient) {
        await addAttendanceToQueue({
          employeeId: data.employeeId,
          type: data.type || 'CHECK_IN',
          timestamp,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
        });

        return {
          success: true,
          offline: true,
          message: 'Pointage enregistré localement. Sera synchronisé automatiquement.',
        };
      }

      try {
        await apiClient.post('/attendance/check-in', {
          employeeId: data.employeeId,
          timestamp,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
        });

        return {
          success: true,
          offline: false,
          message: 'Pointage enregistré avec succès.',
        };
      } catch (apiError) {
        await addAttendanceToQueue({
          employeeId: data.employeeId,
          type: data.type || 'CHECK_IN',
          timestamp,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
        });

        return {
          success: true,
          offline: true,
          message: 'Connexion instable. Pointage enregistré localement.',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        offline: isOffline,
        message: error.message || 'Erreur lors du pointage',
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [isOffline]);

  return {
    checkIn,
    isSubmitting,
    isOffline,
  };
}