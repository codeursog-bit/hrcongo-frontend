'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, User, Calendar, Save, X, ArrowLeft, Loader2, Search, 
  CheckCircle2, AlertCircle, ShieldAlert, MapPin, Fingerprint, ChevronRight
} from 'lucide-react';
import { api } from '@/services/api';
import { attendanceApi } from '@/services/attendance-api';
import { useNotification } from '@/components/providers/NotificationProvider';
import PresenceSubNav from '@/components/PresenceSubNav';
 import { useBasePath } from '@/hooks/useBasePath';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  photoUrl?: string;
  department?: {
    id: string;
    name: string;
  };
}

interface CurrentUser {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
  canRecordAttendanceForAll?: boolean; // 🆕 permission "secrétaire" : pointage manuel pour tout le monde
}

export default function PointageManuelPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const { addNotification } = useNotification();
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  // ✅ Chaque heure a maintenant son propre interrupteur : on peut
  // enregistrer l'entrée seule (l'employé vient d'arriver, on ne connaît
  // pas encore sa sortie), la sortie seule (complément plus tard dans la
  // journée), ou les deux si besoin d'une correction complète.
  const [recordCheckIn, setRecordCheckIn] = useState(true);
  const [recordCheckOut, setRecordCheckOut] = useState(false);
  // ✅ Heure "à l'instant T" plutôt qu'une heure fixe arbitraire — plus
  // pertinent pour l'usage réel (un RH enregistre souvent l'entrée d'un
  // employé qui vient d'arriver, pas une heure théorique de 8h).
  const nowHM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const [checkInTime, setCheckInTime] = useState(nowHM());
  const [checkOutTime, setCheckOutTime] = useState(nowHM());
  const [notes, setNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ========================================
  // ✅ VÉRIFICATION DES DROITS D'ACCÈS
  // ========================================
  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push(bp('/login'));
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'];
      // 🆕 EMPLOYEE avec la permission "secrétaire" a aussi accès
      if (!allowedRoles.includes(user.role) && !user.canRecordAttendanceForAll) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur vérification autorisation:', error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  };

  // ========================================
  // ✅ CHARGEMENT EMPLOYÉS
  // ========================================
  const loadEmployees = async () => {
    try {
      const data: Employee[] = await api.get('/attendance/employees-for-manual');
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error) {
      console.error('Erreur chargement employés:', error);
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEmployees(
        employees.filter(emp =>
          (emp.firstName || '').toLowerCase().includes(query) ||
          (emp.lastName || '').toLowerCase().includes(query) ||
          (emp.employeeNumber || '').toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, employees]);

  // ========================================
  // ✅ SOUMISSION POINTAGE MANUEL
  // ========================================
  const handleSubmit = async () => {
    if (!selectedEmployee) {
      alert('Veuillez sélectionner un employé');
      return;
    }

    if (!recordCheckIn && !recordCheckOut) {
      alert('Veuillez activer au moins une heure (entrée ou sortie)');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedDate = date;

      const attendanceRecord = await attendanceApi.getOrCreateAttendance(
        selectedEmployee.id,
        selectedDate
      );

      const checkInDateTime = recordCheckIn && checkInTime
        ? new Date(`${selectedDate}T${checkInTime}:00`).toISOString()
        : undefined;

      const checkOutDateTime = recordCheckOut && checkOutTime
        ? new Date(`${selectedDate}T${checkOutTime}:00`).toISOString()
        : undefined;

      let totalHours: number | undefined;
      if (checkInDateTime && checkOutDateTime) {
        const durationMs = new Date(checkOutDateTime).getTime() - new Date(checkInDateTime).getTime();
        totalHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
      }

      await attendanceApi.correctAttendance(
        attendanceRecord.id,
        {
          status: 'PRESENT',
          checkIn: checkInDateTime,
          checkOut: checkOutDateTime,
          totalHours,
          reason: notes || 'Pointage manuel saisi par RH'
        }
      );

      setShowSuccess(true);

      addNotification({
        type: 'SUCCESS',
        title: 'Pointage Enregistré',
        message: `Pointage manuel pour ${selectedEmployee.firstName} ${selectedEmployee.lastName} le ${selectedDate}`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        setSelectedEmployee(null);
        setRecordCheckIn(true);
        setRecordCheckOut(false);
        setCheckInTime(nowHM());
        setCheckOutTime(nowHM());
        setNotes('');
        setDate(new Date().toISOString().split('T')[0]);
      }, 2000);

    } catch (error: any) {
      console.error('Erreur pointage manuel:', error);
      alert(`Erreur: ${error.message || 'Erreur lors du pointage'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // ✅ LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={48}/>
          <p className="text-[var(--text-muted)]">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // ✅ ACCÈS REFUSÉ
  // ========================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-md w-full bg-red-500/10 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 text-center">
          <ShieldAlert size={64} className="text-red-500 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Accès Refusé</h1>
          <p className="text-red-500 mb-6">
            Vous n'avez pas les droits nécessaires pour accéder au pointage manuel.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Cette fonctionnalité est réservée aux administrateurs, RH et managers.
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--text)] rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20}/>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const isManager = currentUser?.role === 'MANAGER' && !currentUser?.canRecordAttendanceForAll;
  // 🆕 EMPLOYEE avec la permission "secrétaire" (affichage informatif uniquement)
  const isSecretaryEmployee = currentUser?.role === 'EMPLOYEE' && !!currentUser?.canRecordAttendanceForAll;
  // RH et Admin peuvent se pointer eux-mêmes via GPS
  const canSelfCheckGps = ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '');

  // ========================================
  // ✅ INTERFACE PRINCIPALE
  // ========================================
  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/50 to-[var(--bg)]"></div>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-[var(--surface)] border border-[var(--border)] backdrop-blur-md rounded-full hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={24} className="text-[var(--text)]"/>
        </button>
      </div>

      <div className="w-full pt-12 pb-4 text-center relative z-10">
        <div className="max-w-2xl mx-auto px-4 mb-6 text-left">
          <PresenceSubNav userRole={currentUser?.role || ''} canRecordAttendanceForAll={!!currentUser?.canRecordAttendanceForAll} />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
          <User size={12}/>
          Pointage Manuel
          {isManager && (
            <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full text-[10px]">
              Département uniquement
            </span>
          )}
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--text)]">
          Saisie Manuelle
        </h1>
        <p className="text-[var(--text-muted)] mt-2 text-lg">
          Enregistrez les présences avec heures personnalisées
          {isManager && ' (Votre département)'}
        </p>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 relative z-10 space-y-6">

        {/* ══════════════════════════════════════════════════════
            🟢 BOUTON GPS SELF-CHECK — visible RH / Admin uniquement
            Placé bien en vue AVANT le formulaire principal
        ══════════════════════════════════════════════════════ */}
        {canSelfCheckGps && (
          <button
            onClick={() => router.push(bp('/presences/pointage'))}
            className="
              w-full group relative overflow-hidden
              bg-emerald-500/10 hover:bg-emerald-500/20
              border border-emerald-500/40 hover:border-emerald-400/60
              rounded-2xl p-5 transition-colors duration-300
              flex items-center gap-4
            "
          >
            {/* Glow pulse derrière l'icône */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-30 group-hover:opacity-60 transition-opacity rounded-full"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                <MapPin size={28} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Texte */}
            <div className="flex-1 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 mb-0.5">
                Me pointer moi-même
              </p>
              <p className="text-lg font-bold text-[var(--text)]">
                Ma Pointeuse GPS
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {currentUser?.firstName} {currentUser?.lastName} — Pointer mon arrivée / départ via GPS
              </p>
            </div>

            {/* Flèche */}
            <ChevronRight size={22} className="text-emerald-400/60 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>
        )}
        
        {/* Success */}
        {showSuccess && (
          <div className="bg-emerald-500/20 backdrop-blur-xl rounded-2xl p-8 border border-emerald-500/30 text-center animate-pulse">
            <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4"/>
            <h2 className="text-2xl font-bold text-[var(--text)]">Enregistré !</h2>
            <p className="text-sm text-emerald-300 mt-2">Le pointage a été créé avec succès</p>
          </div>
        )}

        {!showSuccess && (
          <div className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-[var(--border)] space-y-6">
            
            <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
              <div className="text-sm">
                <p className="font-bold text-emerald-500 mb-1">✨ Heures personnalisables</p>
                <p className="text-emerald-500/90">
                  Les heures saisies seront enregistrées exactement comme indiqué. Parfait pour les corrections rétroactives.
                </p>
              </div>
            </div>

            {isManager && (
              <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex items-start gap-3">
                <User size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
                <div className="text-sm">
                  <p className="font-bold text-emerald-500 mb-1">Mode Manager</p>
                  <p className="text-emerald-500/90">
                    Vous ne pouvez pointer que les employés de votre département ({employees.length} employé{employees.length > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            )}

            {isSecretaryEmployee && (
              <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 flex items-start gap-3">
                <User size={20} className="text-emerald-500 shrink-0 mt-0.5"/>
                <div className="text-sm">
                  <p className="font-bold text-emerald-500 mb-1">Pointage pour tout le monde</p>
                  <p className="text-emerald-500/90">
                    Vous avez la permission de pointer manuellement n'importe quel employé de l'entreprise ({employees.length} employé{employees.length > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            )}

            {/* Recherche Employé */}
            <div>
              <label className="block text-sm font-bold text-[var(--text)] mb-2">
                <User size={16} className="inline mr-2"/>
                Employé
                {isManager && <span className="ml-2 text-xs text-[var(--text-muted)]">(Votre département)</span>}
              </label>
              
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/>
                <input
                  type="text"
                  placeholder={employees.length === 0 ? "Aucun employé accessible" : "Rechercher un employé..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={employees.length === 0}
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {searchQuery && (
                <div className="mt-2 max-h-60 overflow-y-auto bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => { setSelectedEmployee(emp); setSearchQuery(''); }}
                        className="w-full p-3 hover:bg-[var(--border)] transition-colors text-left flex items-center gap-3 border-b border-[var(--border)] last:border-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] font-bold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text)]">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {emp.employeeNumber} - {emp.position}
                            {emp.department && <span className="ml-2 text-emerald-500">• {emp.department.name}</span>}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-4 text-center text-[var(--text-muted)] text-sm">Aucun employé trouvé</p>
                  )}
                </div>
              )}

              {selectedEmployee && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-lg">
                      {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text)]">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p className="text-xs text-emerald-500">
                        {selectedEmployee.employeeNumber}
                        {selectedEmployee.department && ` • ${selectedEmployee.department.name}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors">
                    <X size={20} className="text-red-500"/>
                  </button>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-[var(--text)] mb-2">
                <Calendar size={16} className="inline mr-2"/>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Heures — chacune activable indépendamment */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-xl border transition-colors ${recordCheckIn ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'}`}>
                <label className="flex items-center gap-2 text-sm font-bold text-[var(--text)] mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordCheckIn}
                    onChange={(e) => setRecordCheckIn(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <Clock size={16} className="text-emerald-500"/>
                  Heure d'Entrée
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  disabled={!recordCheckIn}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              <div className={`p-3 rounded-xl border transition-colors ${recordCheckOut ? 'border-amber-500/40 bg-amber-500/5' : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'}`}>
                <label className="flex items-center gap-2 text-sm font-bold text-[var(--text)] mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordCheckOut}
                    onChange={(e) => setRecordCheckOut(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <Clock size={16} className="text-amber-500"/>
                  Heure de Sortie
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  disabled={!recordCheckOut}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] -mt-2">
              Astuce : activez seulement "Entrée" si l'employé vient d'arriver et que sa sortie n'est pas encore connue — vous pourrez revenir compléter la sortie plus tard sur ce même pointage.
            </p>

            {/* Aperçu durée — uniquement si les deux sont activées */}
            {recordCheckIn && recordCheckOut && checkInTime && checkOutTime && (
              <div className="bg-[var(--surface-2)] rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-[var(--text-muted)]">Durée totale</span>
                <span className="text-lg font-bold text-[var(--text)]">
                  {(() => {
                    const start = new Date(`2000-01-01T${checkInTime}:00`);
                    const end = new Date(`2000-01-01T${checkOutTime}:00`);
                    const diffMs = end.getTime() - start.getTime();
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h${minutes.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-[var(--text)] mb-2">
                Raison du pointage manuel
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Oubli de pointage, problème technique, correction..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedEmployee || employees.length === 0}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/25 flex justify-center items-center gap-3 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
              {isSubmitting
                ? 'Enregistrement...'
                : recordCheckIn && recordCheckOut
                  ? "Enregistrer l'Entrée et la Sortie"
                  : recordCheckIn
                    ? "Enregistrer l'Entrée seule"
                    : "Enregistrer la Sortie seule"}
            </button>

          </div>
        )}

        {/* Info Box */}
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-2xl p-6 border border-[var(--border)]">
          <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3 tracking-widest">
            ℹ️ Information
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Cette fonctionnalité utilise le système de correction pour enregistrer des pointages
            avec des heures personnalisées. Les timestamps seront enregistrés exactement comme saisis.
          </p>
          <p className="text-xs text-emerald-500 italic mt-2">
            ✅ Les heures d'entrée et de sortie saisies seront respectées à la minute près.
          </p>
          {isManager && (
            <p className="text-xs text-amber-500 italic mt-2">
              👤 En tant que Manager, vous ne pouvez pointer que les employés de votre département.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}