// 'use client';

// import { useState, useCallback } from 'react';
// import { addAttendanceToQueue } from '@/lib/pwa/db';
// import { useOffline } from './useOffline';

// export function useAttendanceOffline() {
//   const { isOffline } = useOffline();
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const checkIn = useCallback(async (data: {
//     employeeId: string;
//     type?: 'CHECK_IN' | 'CHECK_OUT';
//     latitude?: number;
//     longitude?: number;
//     notes?: string;
//   }, apiClient?: any) => {
//     setIsSubmitting(true);

//     try {
//       const timestamp = new Date().toISOString();

//       if (isOffline || !apiClient) {
//         await addAttendanceToQueue({
//           employeeId: data.employeeId,
//           type: data.type || 'CHECK_IN',
//           timestamp,
//           latitude: data.latitude,
//           longitude: data.longitude,
//           notes: data.notes,
//         });

//         return {
//           success: true,
//           offline: true,
//           message: 'Pointage enregistré localement. Sera synchronisé automatiquement.',
//         };
//       }

//       try {
//         await apiClient.post('/attendance/check-in', {
//           employeeId: data.employeeId,
//           timestamp,
//           latitude: data.latitude,
//           longitude: data.longitude,
//           notes: data.notes,
//         });

//         return {
//           success: true,
//           offline: false,
//           message: 'Pointage enregistré avec succès.',
//         };
//       } catch (apiError) {
//         await addAttendanceToQueue({
//           employeeId: data.employeeId,
//           type: data.type || 'CHECK_IN',
//           timestamp,
//           latitude: data.latitude,
//           longitude: data.longitude,
//           notes: data.notes,
//         });

//         return {
//           success: true,
//           offline: true,
//           message: 'Connexion instable. Pointage enregistré localement.',
//         };
//       }
//     } catch (error: any) {
//       return {
//         success: false,
//         offline: isOffline,
//         message: error.message || 'Erreur lors du pointage',
//       };
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [isOffline]);

//   return {
//     checkIn,
//     isSubmitting,
//     isOffline,
//   };
// }

// hooks/useAttendanceOffline.ts
'use client';

import { useState, useCallback } from 'react';
import { addAttendanceToQueue } from '@/lib/pwa/db';
import { useOffline } from './useOffline';
import { attendanceApi } from '@/services/attendance-api';

export function useAttendanceOffline() {
  const { isOffline } = useOffline();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkIn = useCallback(async (data: {
    employeeId: string;
    type?: 'CHECK_IN' | 'CHECK_OUT';
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) => {
    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();

      // Mode offline détecté en amont
      if (isOffline) {
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

      // Online → appel API direct, on propage TOUTE la réponse backend
      try {
        const response = await attendanceApi.checkIn({
          employeeId: data.employeeId,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes,
        });

        return {
          success: true,
          offline: false,
          message: 'Pointage enregistré avec succès.',
          // ✅ Propage earlyArrival, slightLate, et tous les champs extras du backend
          ...response,
        };

      } catch (apiError: any) {
        // ✅ Le serveur a répondu avec un rejet métier (ex: OUT_OF_GEOFENCE,
        // LOCATION_REQUIRED, abonnement bloqué...) — ce n'est PAS une
        // coupure réseau, il ne faut surtout pas mettre ça en file offline
        // (l'employé penserait que son pointage est "réussi" alors qu'il a
        // été refusé). Seule l'absence de `code` signale que `fetch` a
        // échoué avant même d'atteindre le serveur (vraie coupure réseau).
        if (apiError?.code) {
          throw apiError;
        }

        // Vrai échec réseau → fallback offline
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