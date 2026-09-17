import React from 'react';
import { Clock, CalendarIcon, AlertTriangle, Umbrella, CheckCircle } from 'lucide-react';

interface EmployeeViewProps {
  myAttendances: any[];
  date: Date;
}

export default function EmployeeView({ myAttendances, date }: EmployeeViewProps) {
  
  // Filtrer pour afficher PRESENT, LATE et ON_LEAVE
  const displayedAttendances = myAttendances
    .filter(att => att.status === 'PRESENT' || att.status === 'LATE' || att.status === 'ON_LEAVE')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Fonction pour obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'LATE':
        return <AlertTriangle size={24} />;
      case 'ON_LEAVE':
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
      case 'ON_LEAVE':
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
                  </div>
                </div>
                
                {/* Afficher les heures seulement si ce n'est pas un congé */}
                {att.status !== 'ON_LEAVE' ? (
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
                    {att.totalHours && (
                      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-[var(--border)]">
                        <span className="text-[var(--text-muted)]">Durée:</span>
                        <span className="font-mono font-bold text-[var(--text)]">
                          {att.totalHours.toFixed(1)}h
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
              <span>Jours Présents</span>
              <span className="font-bold text-2xl">
                {myAttendances.filter(a => a.status === 'PRESENT').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-amber-300/30 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-200"/> Retards
              </span>
              <span className="font-bold text-2xl text-amber-100">
                {myAttendances.filter(a => a.status === 'LATE').length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <span>Heures Totales</span>
              <span className="font-bold text-2xl">
                {myAttendances
                  .filter(a => a.status !== 'ON_LEAVE')
                  .reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
                  .toFixed(1)}h
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Umbrella size={16} className="text-white/70"/> Congés pris
              </span>
              <span className="font-bold text-2xl text-white">
                {myAttendances.filter(a => a.status === 'ON_LEAVE').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}