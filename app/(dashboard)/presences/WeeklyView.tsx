import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { api } from '@/services/api';

interface WeeklyViewProps {
  userRole: string;
  userDepartment: string;
  date: Date;
}

export default function WeeklyView({ userRole, userDepartment, date }: WeeklyViewProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/attendance?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ✅ FIX : Utiliser dayStatuses comme MonthlyView et DailyView
  const calculateDepartmentStats = () => {
    if (!data?.employees || !data?.dayStatuses) return [];
    
    const deptMap = new Map();
    
    data.employees.forEach((emp: any, empIndex: number) => {
      const deptName = emp.department?.name || 'Non assigné';
      
      // ✅ Filtrer par département si MANAGER
      if (userRole === 'MANAGER' && userDepartment && deptName !== userDepartment) {
        return;
      }
      
      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, { 
          name: deptName, 
          present: 0, 
          late: 0, 
          absent: 0, 
          remote: 0, 
          leave: 0,
          total: 0 
        });
      }
      
      const dept = deptMap.get(deptName);
      const empDayStatuses = data.dayStatuses[empIndex] || [];
      
      empDayStatuses.forEach((dayStatus: any) => {
        // ✅ Exclure jours futurs, férié, repos
        if (dayStatus.status === 'FUTURE' || 
            dayStatus.status === 'HOLIDAY' || 
            dayStatus.status === 'OFF_DAY') {
          return;
        }
        
        dept.total++;
        
        // ✅ Comptabiliser les statuts
        if (dayStatus.status === 'PRESENT') dept.present++;
        else if (dayStatus.status === 'LATE') dept.late++;
        else if (dayStatus.status === 'ABSENT_UNPAID') dept.absent++;
        else if (dayStatus.status === 'REMOTE') dept.remote++;
        else if (dayStatus.status === 'LEAVE' || dayStatus.status === 'ON_LEAVE') dept.leave++;
      });
    });
    
    return Array.from(deptMap.values());
  };

  const departmentStats = calculateDepartmentStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-500 rounded-xl">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vue par Département</h3>
            <p className="text-sm text-gray-500">
              Statistiques de présence par équipe - {date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            {userRole === 'MANAGER' && userDepartment && (
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
                📊 Vue limitée au département : {userDepartment}
              </p>
            )}
          </div>
        </div>

        {departmentStats.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
          </div>
        ) : (
          <div className="space-y-4">
            {departmentStats.map(dept => {
              const presenceRate = dept.total > 0 ? ((dept.present / dept.total) * 100).toFixed(1) : '0';
              const lateRate = dept.total > 0 ? ((dept.late / dept.total) * 100).toFixed(1) : '0';
              const absentRate = dept.total > 0 ? ((dept.absent / dept.total) * 100).toFixed(1) : '0';
              const remoteRate = dept.total > 0 ? ((dept.remote / dept.total) * 100).toFixed(1) : '0';
              const leaveRate = dept.total > 0 ? ((dept.leave / dept.total) * 100).toFixed(1) : '0';
              
              return (
                <div key={dept.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{dept.name}</h4>
                      <p className="text-sm text-gray-500">{dept.total} pointages comptabilisés</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {presenceRate}%
                      </div>
                      <p className="text-xs text-gray-500">Taux de présence</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1 font-semibold">✅ Présents</p>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{dept.present}</p>
                      <p className="text-xs text-emerald-500 mt-1">{presenceRate}%</p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-semibold">⏰ Retards</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{dept.late}</p>
                      <p className="text-xs text-orange-500 mt-1">{lateRate}%</p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-1 font-semibold">❌ Absents</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{dept.absent}</p>
                      <p className="text-xs text-red-500 mt-1">{absentRate}%</p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-600 dark:text-purple-400 mb-1 font-semibold">🏠 Remote</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{dept.remote}</p>
                      <p className="text-xs text-purple-500 mt-1">{remoteRate}%</p>
                    </div>

                    <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-200 dark:border-sky-800">
                      <p className="text-xs text-sky-600 dark:text-sky-400 mb-1 font-semibold">🌴 Congés</p>
                      <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{dept.leave}</p>
                      <p className="text-xs text-sky-500 mt-1">{leaveRate}%</p>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-full h-4 overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="bg-emerald-500 transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${(dept.present/dept.total)*100}%`}}
                        title={`${dept.present} présents`}
                      >
                        {dept.present > 0 && dept.total > 0 && (dept.present/dept.total) > 0.1 && (
                          <span className="text-[10px] font-bold text-white">{dept.present}</span>
                        )}
                      </div>
                      <div 
                        className="bg-orange-500 transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${(dept.late/dept.total)*100}%`}}
                        title={`${dept.late} retards`}
                      >
                        {dept.late > 0 && dept.total > 0 && (dept.late/dept.total) > 0.1 && (
                          <span className="text-[10px] font-bold text-white">{dept.late}</span>
                        )}
                      </div>
                      <div 
                        className="bg-red-500 transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${(dept.absent/dept.total)*100}%`}}
                        title={`${dept.absent} absents`}
                      >
                        {dept.absent > 0 && dept.total > 0 && (dept.absent/dept.total) > 0.1 && (
                          <span className="text-[10px] font-bold text-white">{dept.absent}</span>
                        )}
                      </div>
                      <div 
                        className="bg-purple-500 transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${(dept.remote/dept.total)*100}%`}}
                        title={`${dept.remote} remote`}
                      >
                        {dept.remote > 0 && dept.total > 0 && (dept.remote/dept.total) > 0.1 && (
                          <span className="text-[10px] font-bold text-white">{dept.remote}</span>
                        )}
                      </div>
                      <div 
                        className="bg-sky-500 transition-all duration-500 flex items-center justify-center" 
                        style={{width: `${(dept.leave/dept.total)*100}%`}}
                        title={`${dept.leave} congés`}
                      >
                        {dept.leave > 0 && dept.total > 0 && (dept.leave/dept.total) > 0.1 && (
                          <span className="text-[10px] font-bold text-white">{dept.leave}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        {dept.present + dept.late + dept.remote > dept.absent ? 
                          '✅ Performance satisfaisante' : 
                          '⚠️ Nécessite attention'}
                      </span>
                      <span className="text-gray-500">
                        {((dept.present + dept.remote) / dept.total * 100).toFixed(0)}% effectifs productifs
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Résumé global */}
      {departmentStats.length > 1 && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-6">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-sky-500" />
            Résumé global
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                {departmentStats.length}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Départements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {departmentStats.reduce((sum, d) => sum + d.present, 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total présents</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {departmentStats.reduce((sum, d) => sum + d.late, 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total retards</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {departmentStats.reduce((sum, d) => sum + d.absent, 0)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Total absents</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}