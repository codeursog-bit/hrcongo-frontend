import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Calendar, Edit3, Check, X, CheckCircle, XCircle, MapPin, History 
} from 'lucide-react';
import { api } from '@/services/api';

interface CorrectionsViewProps {
  data: any;
  userRole: string;
  userDepartment: string;
  onRefresh: () => void;
}

export default function CorrectionsView({ 
  data, 
  userRole, 
  userDepartment, 
  onRefresh 
}: CorrectionsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [correctionData, setCorrectionData] = useState({
    status: '', checkIn: '', checkOut: '', reason: ''
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    officialStartHour: 8,
    lateToleranceMinutes: 0,
    workDays: [1, 2, 3, 4, 5]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res: any = await api.get('/payroll-settings');
        setCompanySettings({
          officialStartHour: res.officialStartHour || 8,
          lateToleranceMinutes: res.lateToleranceMinutes || 0,
          workDays: res.workDays || [1, 2, 3, 4, 5]
        });
      } catch (e) {
        console.error('Erreur settings:', e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  useEffect(() => {
    if (editingId) {
      const element = document.getElementById(`edit-row-${editingId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [editingId]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res: any = await api.get('/attendance/logs');
      setHistoryLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const startEditing = (attendance: any) => {
    const attendanceDate = new Date(attendance.date);
    const now = new Date();
    
    const absenceThreshold = new Date(attendanceDate);
    absenceThreshold.setHours(
      companySettings.officialStartHour, 
      companySettings.lateToleranceMinutes, 
      0, 
      0
    );
    
    if (now < absenceThreshold) {
      const timeStr = `${String(companySettings.officialStartHour).padStart(2, '0')}h${String(companySettings.lateToleranceMinutes).padStart(2, '0')}`;
      alert(`⏰ Impossible de corriger avant ${timeStr}\n\nVous pourrez effectuer cette correction à partir de ${timeStr}.`);
      return;
    }
    
    setEditingId(attendance.id);
    setCorrectionData({
      status: attendance.status,
      checkIn: attendance.checkIn ? new Date(attendance.checkIn).toISOString().slice(0, 16) : '',
      checkOut: attendance.checkOut ? new Date(attendance.checkOut).toISOString().slice(0, 16) : '',
      reason: ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setCorrectionData({ status: '', checkIn: '', checkOut: '', reason: '' });
  };

  const saveCorrection = async (attendance: any) => {
    if (!correctionData.reason.trim()) {
      alert('⚠️ La justification est obligatoire');
      return;
    }

    if (!correctionData.status) {
      alert('⚠️ Veuillez sélectionner un statut');
      return;
    }

    try {
      const updates: any = { 
        reason: correctionData.reason.trim(),
        status: correctionData.status
      };

      if (correctionData.checkIn) {
        updates.checkIn = new Date(correctionData.checkIn).toISOString();
      }
      if (correctionData.checkOut) {
        updates.checkOut = new Date(correctionData.checkOut).toISOString();
      }

      if (attendance.isVirtual) {
        await api.post('/attendance/create-manual', {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: updates.status,
          checkIn: updates.checkIn || null,
          checkOut: updates.checkOut || null,
          notes: `Correction manuelle: ${updates.reason}`
        });
      } else {
        await api.put(`/attendance/correct/${attendance.id}`, updates);
      }
      
      cancelEditing();
      onRefresh();
      if (showHistory) fetchHistory();
      
      const impactMsg = 
        correctionData.status === 'PRESENT' ? '✅ Marqué PRÉSENT (payé)' :
        correctionData.status === 'ABSENT_PAID' ? '✅ Justifié (payé)' :
        correctionData.status === 'REMOTE' ? '✅ Télétravail (payé)' :
        correctionData.status === 'ABSENT_UNPAID' ? '❌ Non justifié (déduit)' : 
        '✅ Mis à jour';
      
      alert(`✅ Correction enregistrée\n\n${impactMsg}\n📋 Traçabilité OK`);
    } catch (error: any) {
      console.error('Erreur:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Impossible de corriger';
      alert(`❌ Erreur: ${errorMsg}`);
    }
  };

  const getAbsencesToCorrect = () => {
    if (!data?.dayStatuses || !data?.employees || !data?.attendances) return [];

    const now = new Date();
    const absencesToFix: any[] = [];
    
    data.employees.forEach((emp: any, empIndex: number) => {
      if (userRole === 'MANAGER' && userDepartment && emp.department?.name !== userDepartment) {
        return;
      }
      
      const empDayStatuses = data.dayStatuses[empIndex] || [];
      
      empDayStatuses.forEach((dayStatus: any) => {
        if (dayStatus.status === 'ABSENT_UNPAID') {
          const attendanceDate = new Date(dayStatus.date);
          
          const dayOfWeek = attendanceDate.getDay() === 0 ? 7 : attendanceDate.getDay();
          const isWorkingDay = companySettings.workDays.includes(dayOfWeek);
          
          if (!isWorkingDay) {
            return;
          }
          
          const absenceThreshold = new Date(attendanceDate);
          absenceThreshold.setHours(
            companySettings.officialStartHour, 
            companySettings.lateToleranceMinutes, 
            0, 
            0
          );
          
          if (now >= absenceThreshold) {
            let attendance = data.attendances.find((att: any) => 
              att.employeeId === emp.id && 
              att.date.split('T')[0] === dayStatus.date
            );

            if (!attendance) {
              attendance = {
                id: `virtual-${emp.id}-${dayStatus.date}`,
                employeeId: emp.id,
                date: dayStatus.date,
                status: 'ABSENT_UNPAID',
                checkIn: null,
                checkOut: null,
                isVirtual: true
              };
            }

            absencesToFix.push({
              ...attendance,
              employee: emp
            });
          }
        }
      });
    });

    return absencesToFix;
  };

  const filteredAttendances = getAbsencesToCorrect();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-purple-500/20 border border-sky-500/30 rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-sky-500 rounded-xl">
          <AlertCircle className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Corrections de pointage</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {userRole === 'MANAGER' 
              ? `Département : ${userDepartment} • ${filteredAttendances.length} absence(s) à traiter`
              : `${filteredAttendances.length} absence(s) non payée(s) détectée(s) ce mois`}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            ⏰ Les corrections sont possibles après {String(companySettings.officialStartHour).padStart(2, '0')}h{String(companySettings.lateToleranceMinutes).padStart(2, '0')}
          </p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
            showHistory 
              ? 'bg-sky-500 text-white shadow-lg' 
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600'
          }`}
        >
          <History size={18} />
          {showHistory ? 'Masquer' : 'Historique'}
        </button>
      </div>

      {showHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History size={20} className="text-sky-500" />
              Historique des modifications
            </h4>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
            {loadingHistory ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
              </div>
            ) : historyLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucune modification enregistrée
              </div>
            ) : (
              historyLogs.map((log: any, idx: number) => (
                <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xs font-bold text-sky-600">
                      {log.modifiedBy?.firstName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Modifié par : <span className="font-semibold">{log.modifiedBy?.firstName} {log.modifiedBy?.lastName}</span>
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2 text-xs space-y-1">
                        <p className="text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">Champs :</span> {log.field}
                        </p>
                        {log.oldValue && (
                          <p className="text-red-600 dark:text-red-400">
                            <span className="font-semibold">Ancien :</span> {log.oldValue}
                          </p>
                        )}
                        <p className="text-emerald-600 dark:text-emerald-400">
                          <span className="font-semibold">Nouveau :</span> {log.newValue}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 italic">
                          <span className="font-semibold">Raison :</span> {log.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]" style={{scrollbarWidth: 'thin', scrollbarColor: '#0ea5e9 transparent'}}>
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Employé</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                        <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">Aucune correction nécessaire</p>
                      <p className="text-sm text-gray-500">Tous les pointages sont conformes 🎉</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((att: any) => (
                  <tr 
                    key={att.id} 
                    id={`edit-row-${att.id}`}
                    className={`transition-colors ${editingId === att.id ? 'bg-sky-50 dark:bg-sky-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                          {att.employee.firstName[0]}{att.employee.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{att.employee.firstName} {att.employee.lastName}</p>
                          <p className="text-xs text-gray-500">{att.employee.department?.name || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(att.date).toLocaleDateString('fr-FR', {weekday: 'short', day: 'numeric', month: 'short'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === att.id ? (
                        <div className="space-y-3 max-w-md">
                          <select 
                            value={correctionData.status} 
                            onChange={(e) => setCorrectionData({...correctionData, status: e.target.value})} 
                            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm font-medium focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                          >
                            <option value="">-- Nouveau statut --</option>
                            <option value="PRESENT">✅ Présent</option>
                            <option value="ABSENT_PAID">💼 Justifié (payé)</option>
                            <option value="REMOTE">🏠 Télétravail</option>
                            <option value="LATE">⏰ Retard</option>
                            <option value="ABSENT_UNPAID">❌ Non justifié</option>
                            <option value="ON_LEAVE">🌴 Congé</option>
                          </select>

                          {(correctionData.status === 'PRESENT' || correctionData.status === 'LATE') && (
                            <div className="grid grid-cols-2 gap-2">
                              <input 
                                type="datetime-local" 
                                value={correctionData.checkIn} 
                                onChange={(e) => setCorrectionData({...correctionData, checkIn: e.target.value})} 
                                className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm font-mono focus:border-sky-500"
                                placeholder="Entrée"
                              />
                              <input 
                                type="datetime-local" 
                                value={correctionData.checkOut} 
                                onChange={(e) => setCorrectionData({...correctionData, checkOut: e.target.value})} 
                                className="px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm font-mono focus:border-sky-500"
                                placeholder="Sortie"
                              />
                            </div>
                          )}

                          <textarea
                            placeholder="Justification obligatoire...&#10;Ex: Oubli de pointage confirmé&#10;Ex: Certificat médical reçu"
                            value={correctionData.reason} 
                            onChange={(e) => setCorrectionData({...correctionData, reason: e.target.value})} 
                            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-sm resize-none focus:border-sky-500"
                            rows={3}
                          />
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          ❌ Absent non justifié
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === att.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => saveCorrection(att)} 
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                          >
                            <Check size={16} /> Valider
                          </button>
                          <button 
                            onClick={cancelEditing} 
                            className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-bold"
                          >
                            <X size={16} /> Annuler
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditing(att)} 
                          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/30 transition-all hover:scale-105"
                        >
                          <Edit3 size={16} /> Corriger
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Check size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-100">Oubli pointage</h4>
          </div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-2">Était présent mais a oublié</p>
          <div className="text-xs bg-emerald-200/50 dark:bg-emerald-900/40 rounded-lg p-2 font-mono">
            → PRESENT<br/>✅ Payé
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <AlertCircle size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100">Justifié</h4>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">Maladie, urgence</p>
          <div className="text-xs bg-blue-200/50 dark:bg-blue-900/40 rounded-lg p-2 font-mono">
            → ABSENT_PAID<br/>✅ Payé
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-200 dark:border-purple-800 rounded-2xl p-5 hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <MapPin size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-purple-900 dark:text-purple-100">Télétravail</h4>
          </div>
          <p className="text-sm text-purple-800 dark:text-purple-300 mb-2">Travail à distance</p>
          <div className="text-xs bg-purple-200/50 dark:bg-purple-900/40 rounded-lg p-2 font-mono">
            → REMOTE<br/>✅ Payé
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 hover:shadow-xl transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircle size={20} className="text-white" />
            </div>
            <h4 className="font-bold text-red-900 dark:text-red-100">Non justifié</h4>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300 mb-2">Pas de correction</p>
          <div className="text-xs bg-red-200/50 dark:bg-red-900/40 rounded-lg p-2 font-mono">
            → ABSENT_UNPAID<br/>❌ Déduit
          </div>
        </div>
      </div>
    </div>
  );
}