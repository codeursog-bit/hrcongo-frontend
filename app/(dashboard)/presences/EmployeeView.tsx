import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { Clock, CalendarIcon, AlertTriangle, Umbrella, CheckCircle } from 'lucide-react';

interface EmployeeViewProps {
  myAttendances: any[];
  date: Date;
  employeeId?: string; // 🆕 pour retrouver MA ligne dans le rapport mensuel
}

export default function EmployeeView({ myAttendances, date, employeeId }: EmployeeViewProps) {

  // 🆕 Même source que la page Résumé (rapport mensuel) : compteurs et jours de congé fiables,
  // y compris un pointage fait un jour de repos / férié / pendant un congé.
  const [report, setReport] = useState<any | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res: any = await api.get(`/attendance/report?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
        const items: any[] = Array.isArray(res) ? res : [];
        const mine = (employeeId && items.find((i) => i.employeeId === employeeId)) || (items.length === 1 ? items[0] : null);
        if (!cancelled) setReport(mine);
      } catch { if (!cancelled) setReport(null); }
    })();
    return () => { cancelled = true; };
  }, [date, employeeId]);

  const detailByDate = useMemo(
    () => new Map<string, any>((report?.details ?? []).map((d: any) => [d.date, d])),
    [report],
  );

  // Jours où j'ai vraiment pointé (quel que soit le statut du calendrier) + jours de congé sans pointage
  const punchRows = myAttendances.filter((att: any) => att.checkIn);
  const punchDates = new Set(punchRows.map((a: any) => a.date));
  const leaveRows = (report?.details ?? [])
    .filter((d: any) => d.status === 'LEAVE' && !punchDates.has(d.date))
    .map((d: any) => ({ date: d.date, status: 'LEAVE', leaveType: d.leaveType }));
  const displayedAttendances = [...punchRows, ...leaveRows]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compteurs : rapport mensuel si disponible, sinon repli sur les pointages chargés
  const daysWorked = report?.daysWorked ?? punchRows.length;
  const daysLate = report?.daysLate ?? punchRows.filter((a: any) => a.status === 'LATE').length;
  const hoursTotal = report?.totalHours ?? punchRows.reduce((acc: number, a: any) => acc + (Number(a.totalHours) || 0), 0);
  const daysLeave = report?.daysOnLeave ?? leaveRows.length;

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'LATE':
        return <AlertTriangle size={24} />;
      case 'LEAVE':
        return <Umbrella size={24} />;
      default:
        return <CheckCircle size={24} />;
    }
  };

  // Fonction pour obtenir les styles selon le statut
  const getStatusStyles = (status: string) => {
    switch(status) {
      case 'LATE':
        return {
          bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          label: 'Arrivée tardive',
          textColor: 'text-amber-600 dark:text-amber-400'
        };
      case 'LEAVE':
        return {
          bg: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
          label: 'En congé',
          textColor: 'text-[var(--text-muted)]'
        };
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
          label: 'Présence validée',
          textColor: 'text-emerald-600 dark:text-emerald-400'
        };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
          <Clock size={20} className="text-emerald-500" /> 
          Mon Historique ({date.toLocaleString('fr-FR', { month: 'long' })})
        </h2>
        
        {displayedAttendances.length === 0 ? (
          <div className="p-10 text-center bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
            <p className="text-[var(--text-muted)]">Aucun pointage ce mois-ci.</p>
          </div>
        ) : (
          displayedAttendances.map((att: any) => {
            const styles = getStatusStyles(att.status);
            
            return (
              <div key={att.date} className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.bg}`}>
                    {getStatusIcon(att.status)}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text)] capitalize text-lg">
                      {new Date(att.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
                    </p>
                    <p className={`text-sm font-bold ${styles.textColor}`}>
                      {styles.label}
                    </p>
                    {detailByDate.get(att.date)?.note && (
                      <p className="text-[11px] font-semibold text-amber-600">{detailByDate.get(att.date).note}</p>
                    )}
                  </div>
                </div>
                
                {/* Afficher les heures seulement si ce n'est pas un congé */}
                {att.status !== 'LEAVE' ? (
                  <div className="text-right text-sm bg-[var(--surface-2)] p-3 rounded-lg">
                    <div className="flex justify-between gap-4 mb-1">
                      <span className="text-[var(--text-muted)]">Arrivée:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {att.checkIn ? new Date(att.checkIn).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[var(--text-muted)]">Départ:</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {att.checkOut ? new Date(att.checkOut).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                      </span>
                    </div>
                    {(att as any).pause?.endedAt && (
                      <div className="flex justify-between gap-4">
                        <span>Pause:</span>
                        <span className="font-mono">
                          {new Date((att as any).pause.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' → '}
                          {new Date((att as any).pause.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {(att as any).pause.minutes != null ? ` (${(att as any).pause.minutes} min)` : ''}
                        </span>
                      </div>
                    )}
                    {Number((att as any).extraHoursInfo) > 0 && (
                      <div className="flex justify-between gap-4 text-sky-600">
                        <span>Au-delà de l&apos;horaire:</span>
                        <span className="font-mono font-bold" title="Information : ces heures ne sont pas comptées dans la paie">
                          +{parseFloat(Number((att as any).extraHoursInfo).toFixed(2))}h (info)
                        </span>
                      </div>
                    )}
                    {att.totalHours && (
                      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Durée:</span>
                        <span className="font-mono font-bold text-[var(--text)]">
                          {parseFloat(Number(att.totalHours).toFixed(2))}h
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-right text-sm bg-[var(--surface-2)] p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] font-bold">
                      <Umbrella size={16} />
                      <span>Jour de congé</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div className="lg:col-span-1">
        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-xl sticky top-24">
          <h3 className="font-bold text-lg mb-4 opacity-90">Résumé Mensuel</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span>
                Jours travaillés
                {(report?.daysWorkedOnRest ?? 0) > 0 && (
                  <span className="block text-[11px] text-white/70 font-normal">dont {report.daysWorkedOnRest} jour(s) de repos / férié</span>
                )}
              </span>
              <span className="font-bold text-2xl">{daysWorked}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-amber-300/30 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-200"/> Retards
              </span>
              <span className="font-bold text-2xl text-amber-100">{daysLate}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span>Heures travaillées</span>
              <span className="font-bold text-2xl">{parseFloat(Number(hoursTotal).toFixed(2))}h</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Umbrella size={16} className="text-white/70"/>
                <span>
                  Congés pris
                  {(report?.daysWorkedDuringLeave ?? 0) > 0 && (
                    <span className="block text-[11px] text-white/70 font-normal">+ {report.daysWorkedDuringLeave} jour(s) travaillé(s) pendant le congé</span>
                  )}
                </span>
              </span>
              <span className="font-bold text-2xl text-white">{daysLeave}</span>
            </div>
            {((report?.daysAbsentUnpaid ?? 0) + (report?.daysAbsentPaid ?? 0)) > 0 && (
              <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                <span>
                  Absences
                  {(report?.daysAbsentUnpaid ?? 0) > 0 && (
                    <span className="block text-[11px] text-white/70 font-normal">dont {report.daysAbsentUnpaid} non justifiée(s)</span>
                  )}
                </span>
                <span className="font-bold text-2xl text-white">{(report?.daysAbsentUnpaid ?? 0) + (report?.daysAbsentPaid ?? 0)}</span>
              </div>
            )}
            <p className="text-[11px] text-white/70 leading-relaxed pt-1">
              « Jours travaillés » = les jours où vous avez pointé, y compris un jour de repos, un jour férié ou un jour de congé.
              Les congés pris sont les jours de congé sans pointage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}