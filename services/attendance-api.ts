// // services/attendance-api.ts
// // 🔗 SERVICE DE CONNEXION FRONTEND ↔️ BACKEND
// // Adapté à la nouvelle structure backend séparée

// import { api } from '@/services/api';

// // ========================================
// // 📦 TYPES (Alignés sur le backend)
// // ========================================

// export interface AttendanceRecord {
//   id: string;
//   employeeId: string;
//   companyId: string;
//   date: string;
//   checkIn?: Date | string;
//   checkOut?: Date | string;
//   checkInLat?: number;
//   checkInLon?: number;
//   checkOutLat?: number;
//   checkOutLon?: number;
//   status: string;
//   totalHours?: number;
//   normalHours?: number;
//   overtime15?: number;
//   overtime50?: number;
//   notes?: string;
//   leaveId?: string;
//   employee?: {
//     firstName: string;
//     lastName: string;
//     position: string;
//   };
// }

// export interface DayStatus {
//   date: string;
//   status: string;
//   leaveType?: string;
//   checkIn?: Date;
//   checkOut?: Date;
//   totalHours?: number;
//   overtime15?: number;
//   overtime50?: number;
// }

// export interface MonthlyReportItem {
//   id: string;
//   employeeId: string;
//   name: string;
//   matricule: string;
//   avatar: string | null;
//   department: string;
//   daysPresent: number;
//   daysLate: number;
//   daysRemote: number;
//   daysOnLeave: number;
//   daysHoliday: number;
//   daysOffDay: number;
//   daysAbsentUnpaid: number;
//   normalHours: number;
//   totalHours: number;
//   overtime15: number;
//   overtime50: number;
//   status: string;
//   trend: string;
//   details: Array<{
//     date: string;
//     status: string;
//     in: string;
//     out: string;
//     total: string;
//     type: string;
//     leaveType?: string;
//   }>;
// }

// // ========================================
// // 🔧 SERVICE ATTENDANCE API
// // ========================================

// export const attendanceApi = {
  
//   /**
//    * ✅ CHECK-IN : Pointer l'entrée
//    */
//   checkIn: async (data: {
//     employeeId: string;
//     latitude?: number;
//     longitude?: number;
//     notes?: string;
//   }): Promise<AttendanceRecord> => {
//     return api.post<AttendanceRecord>('/attendance/check-in', data);
//   },

//   /**
//    * ✅ CHECK-OUT : Pointer la sortie
//    */
//   checkOut: async (data: {
//     employeeId: string;
//     latitude?: number;
//     longitude?: number;
//   }): Promise<AttendanceRecord> => {
//     return api.post<AttendanceRecord>('/attendance/check-out', data);
//   },

//   /**
//    * ✅ AUJOURD'HUI : Liste des pointages du jour
//    */
//   getToday: async (): Promise<AttendanceRecord[]> => {
//     return api.get<AttendanceRecord[]>('/attendance/today');
//   },

//   /**
//    * ✅ HISTORIQUE MENSUEL : Tous les employés + leurs pointages
//    */
//   getMonthly: async (params: {
//     month: number;
//     year: number;
//   }): Promise<{
//     employees: any[];
//     attendances: AttendanceRecord[];
//     dayStatuses: DayStatus[][];
//   }> => {
//     return api.get<any>(
//       `/attendance?month=${params.month}&year=${params.year}`
//     );
//   },

//   /**
//    * ✅ RAPPORT MENSUEL : Synthèse par employé
//    */
//   getMonthlyReport: async (params: {
//     month: number;
//     year: number;
//   }): Promise<MonthlyReportItem[]> => {
//     return api.get<MonthlyReportItem[]>(
//       `/attendance/report?month=${params.month}&year=${params.year}`
//     );
//   },

//   /**
//    * ✅ DÉTAILS EMPLOYÉ : Statuts jour par jour
//    */
//   getEmployeeAttendance: async (params: {
//     employeeId: string;
//     month: number;
//     year: number;
//   }): Promise<DayStatus[]> => {
//     return api.get<DayStatus[]>(
//       `/attendance/employee/${params.employeeId}?month=${params.month}&year=${params.year}`
//     );
//   },

//   /**
//    * ✅ GÉNÉRER GRILLE : Créer les jours du mois (Admin)
//    */
//   generateGrid: async (data: {
//     month: number;
//     year: number;
//   }): Promise<{ success: boolean; generated: number; message: string }> => {
//     return api.post<any>('/attendance/generate-grid', data);
//   },

  
//   /**
//    * ✅ CORRIGER : Modifier un pointage (Admin/RH)
//    */
//   correctAttendance: async (
//     attendanceId: string,
//     data: {
//       status?: string;
//       checkIn?: Date;
//       checkOut?: Date;
//       totalHours?: number;
//       reason: string;
//     }
//   ): Promise<{
//     success: boolean;
//     attendance: AttendanceRecord;
//     changes: Array<{ field: string; oldValue?: string; newValue: string }>;
//   }> => {
//     return api.put<any>(`/attendance/correct/${attendanceId}`, data);
//   },

//   /**
//    * ✅ STATISTIQUES : Agrégations mensuelles (Admin/RH)
//    */
//   getMonthlyStats: async (params: {
//     month: number;
//     year: number;
//   }): Promise<{
//     totalEmployees: number;
//     totalPresent: number;
//     totalLate: number;
//     totalRemote: number;
//     totalAbsent: number;
//     totalHours: number;
//     totalOvertime: number;
//     averagePresenceRate: number;
//   }> => {
//     return api.get<any>(
//       `/attendance/stats?month=${params.month}&year=${params.year}`
//     );
//   }
// };

// // ========================================
// // 🧪 UTILITAIRES (Helpers pour le frontend)
// // ========================================

// /**
//  * Formater une date pour l'affichage
//  */
// export const formatAttendanceDate = (date: Date | string): string => {
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleDateString('fr-FR', { 
//     weekday: 'short', 
//     day: 'numeric', 
//     month: 'short' 
//   });
// };

// /**
//  * Formater une heure pour l'affichage
//  */
// export const formatAttendanceTime = (date: Date | string | null | undefined): string => {
//   if (!date) return '--:--';
//   const d = typeof date === 'string' ? new Date(date) : date;
//   return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
// };

// /**
//  * Calculer la durée entre deux timestamps
//  */
// export const calculateDuration = (
//   checkIn: Date | string, 
//   checkOut: Date | string
// ): string => {
//   const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
//   const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
//   const durationMs = end.getTime() - start.getTime();
//   const hours = Math.floor(durationMs / (1000 * 60 * 60));
//   const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
//   return `${hours}h${minutes.toString().padStart(2, '0')}`;
// };

// /**
//  * Obtenir la couleur du statut
//  */
// export const getStatusColor = (status: string): string => {
//   const colors: Record<string, string> = {
//     'PRESENT': 'text-emerald-400',
//     'LATE': 'text-orange-400',
//     'REMOTE': 'text-sky-400',
//     'ABSENT_UNPAID': 'text-red-400',
//     'LEAVE': 'text-purple-400',
//     'HOLIDAY': 'text-indigo-400',
//     'OFF_DAY': 'text-slate-400'
//   };
//   return colors[status] || 'text-slate-400';
// };

// /**
//  * Obtenir le label français du statut
//  */
// export const getStatusLabel = (status: string): string => {
//   const labels: Record<string, string> = {
//     'PRESENT': 'Présent',
//     'LATE': 'Retard',
//     'REMOTE': 'Télétravail',
//     'ABSENT_UNPAID': 'Absent',
//     'LEAVE': 'Congé',
//     'HOLIDAY': 'Férié',
//     'OFF_DAY': 'Repos',
//     'PENDING': 'En attente'
//   };
//   return labels[status] || status;
// };

// services/attendance-api.ts
// 🔗 SERVICE DE CONNEXION FRONTEND ↔️ BACKEND
// Adapté à la nouvelle structure backend séparée

import { api } from '@/services/api';

// ========================================
// 📦 TYPES (Alignés sur le backend)
// ========================================

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  companyId: string;
  date: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  checkInLat?: number;
  checkInLon?: number;
  checkOutLat?: number;
  checkOutLon?: number;
  status: string;
  totalHours?: number;
  normalHours?: number;
  overtime15?: number;
  overtime50?: number;
  notes?: string;
  leaveId?: string;
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
  };
}

export interface DayStatus {
  date: string;
  status: string;
  leaveType?: string;
  checkIn?: Date;
  checkOut?: Date;
  totalHours?: number;
  overtime15?: number;
  overtime50?: number;
}

export interface MonthlyReportItem {
  id: string;
  employeeId: string;
  name: string;
  matricule: string;
  avatar: string | null;
  department: string;
  daysPresent: number;
  daysLate: number;
  daysRemote: number;
  daysOnLeave: number;
  daysHoliday: number;
  daysOffDay: number;
  daysAbsentUnpaid: number;
  normalHours: number;
  totalHours: number;
  overtime15: number;
  overtime50: number;
  status: string;
  trend: string;
  details: Array<{
    date: string;
    status: string;
    in: string;
    out: string;
    total: string;
    type: string;
    leaveType?: string;
  }>;
}

// ========================================
// 🔧 SERVICE ATTENDANCE API
// ========================================

export const attendanceApi = {
  
  /**
   * ✅ CHECK-IN : Pointer l'entrée
   */
  checkIn: async (data: {
    employeeId: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }): Promise<AttendanceRecord> => {
    return api.post<AttendanceRecord>('/attendance/check-in', data);
  },

  /**
   * ✅ CHECK-OUT : Pointer la sortie
   */
  checkOut: async (data: {
    employeeId: string;
    latitude?: number;
    longitude?: number;
  }): Promise<AttendanceRecord> => {
    return api.post<AttendanceRecord>('/attendance/check-out', data);
  },

  /**
   * ✅ AUJOURD'HUI : Liste des pointages du jour
   */
  getToday: async (): Promise<AttendanceRecord[]> => {
    return api.get<AttendanceRecord[]>('/attendance/today');
  },

  /**
   * ✅ HISTORIQUE MENSUEL : Tous les employés + leurs pointages
   */
  getMonthly: async (params: {
    month: number;
    year: number;
  }): Promise<{
    employees: any[];
    attendances: AttendanceRecord[];
    dayStatuses: DayStatus[][];
  }> => {
    return api.get<any>(
      `/attendance?month=${params.month}&year=${params.year}`
    );
  },

  /**
   * ✅ RAPPORT MENSUEL : Synthèse par employé
   */
  getMonthlyReport: async (params: {
    month: number;
    year: number;
  }): Promise<MonthlyReportItem[]> => {
    return api.get<MonthlyReportItem[]>(
      `/attendance/report?month=${params.month}&year=${params.year}`
    );
  },

  /**
   * ✅ DÉTAILS EMPLOYÉ : Statuts jour par jour
   */
  getEmployeeAttendance: async (params: {
    employeeId: string;
    month: number;
    year: number;
  }): Promise<DayStatus[]> => {
    return api.get<DayStatus[]>(
      `/attendance/employee/${params.employeeId}?month=${params.month}&year=${params.year}`
    );
  },

  /**
   * ✅ GÉNÉRER GRILLE : Créer les jours du mois (Admin)
   */
  generateGrid: async (data: {
    month: number;
    year: number;
  }): Promise<{ success: boolean; generated: number; message: string }> => {
    return api.post<any>('/attendance/generate-grid', data);
  },

  /**
   * ✅ CRÉER OU RÉCUPÉRER : Obtenir l'attendance du jour (créer si inexistante)
   */
  getOrCreateAttendance: async (
    employeeId: string,
    date: string
  ): Promise<AttendanceRecord> => {
    return api.post<AttendanceRecord>('/attendance/get-or-create', {
      employeeId,
      date
    });
  },

  /**
   * ✅ CORRIGER : Modifier un pointage (Admin/RH)
   */
  // correctAttendance: async (
  //   attendanceId: string,
  //   data: {
  //     status?: string;
  //     checkIn?: Date;
  //     checkOut?: Date;
  //     totalHours?: number;
  //     reason: string;
  //   }

  correctAttendance: async (
  attendanceId: string,
  data: {
    status?: string;
    checkIn?: string;   // ← Date → string
    checkOut?: string;  // ← Date → string
    totalHours?: number;
    reason: string;
  }
  ): Promise<{
    success: boolean;
    attendance: AttendanceRecord;
    changes: Array<{ field: string; oldValue?: string; newValue: string }>;
  }> => {
    return api.put<any>(`/attendance/correct/${attendanceId}`, data);
  },

  /**
   * ✅ STATISTIQUES : Agrégations mensuelles (Admin/RH)
   */
  getMonthlyStats: async (params: {
    month: number;
    year: number;
  }): Promise<{
    totalEmployees: number;
    totalPresent: number;
    totalLate: number;
    totalRemote: number;
    totalAbsent: number;
    totalHours: number;
    totalOvertime: number;
    averagePresenceRate: number;
  }> => {
    return api.get<any>(
      `/attendance/stats?month=${params.month}&year=${params.year}`
    );
  }
};

// ========================================
// 🧪 UTILITAIRES (Helpers pour le frontend)
// ========================================

/**
 * Formater une date pour l'affichage
 */
export const formatAttendanceDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });
};

/**
 * Formater une heure pour l'affichage
 */
export const formatAttendanceTime = (date: Date | string | null | undefined): string => {
  if (!date) return '--:--';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Calculer la durée entre deux timestamps
 */
export const calculateDuration = (
  checkIn: Date | string, 
  checkOut: Date | string
): string => {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  const durationMs = end.getTime() - start.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

/**
 * Obtenir la couleur du statut
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'PRESENT': 'text-emerald-400',
    'LATE': 'text-orange-400',
    'REMOTE': 'text-sky-400',
    'ABSENT_UNPAID': 'text-red-400',
    'LEAVE': 'text-purple-400',
    'HOLIDAY': 'text-indigo-400',
    'OFF_DAY': 'text-slate-400'
  };
  return colors[status] || 'text-slate-400';
};

/**
 * Obtenir le label français du statut
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'PRESENT': 'Présent',
    'LATE': 'Retard',
    'REMOTE': 'Télétravail',
    'ABSENT_UNPAID': 'Absent',
    'LEAVE': 'Congé',
    'HOLIDAY': 'Férié',
    'OFF_DAY': 'Repos',
    'PENDING': 'En attente'
  };
  return labels[status] || status;
};