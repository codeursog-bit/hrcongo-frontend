// 📁 EMPLACEMENT (projet frontend) : app/(dashboard)/presences/pointage-manuel/page.tsx
'use client';

import { AttendanceModuleFrame } from '@/components/attendance/AttendanceModuleFrame';
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
import { KonzaLoader } from '@/components/ui/KonzaLoader';

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

function PointageManuelPageContent() {
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

    // 🆕 Motif obligatoire : il est enregistré avec votre nom dans l'historique du pointage
    if (notes.trim().length < 3) {
      alert('Indiquez le motif de ce pointage manuel (obligatoire).');
      return;
    }
    // 🆕 Jour passé : entrée ET sortie (jamais « présent » sans heures)
    if (date < new Date().toISOString().split('T')[0] && !(recordCheckIn && recordCheckOut)) {
      alert('Pour un jour passé, renseignez l’heure d’entrée ET l’heure de sortie.');
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

      await attendanceApi.correctAttendance(
        attendanceRecord.id,
        {
          status: 'PRESENT',
          checkIn: checkInDateTime,
          checkOut: checkOutDateTime,
          // La durée, les heures sup et le retard sont calculés par le serveur.
          reason: notes.trim()
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
      <KonzaLoader variant="page" label="Vérification des accès…" />
    );
  }

  // ========================================
  // ✅ ACCÈS REFUSÉ
  // ========================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 attendance-page-header">
        <div className="max-w-md w-full bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  rounded-2xl p-8 border border-[var(--border)] text-center">
          <ShieldAlert size={64} className="text-[var(--danger-text)] mx-auto mb-4"/>
          <h1 className="text-2xl font-semibold text-[var(--text)] mb-2">Accès Refusé</h1>
          <p className="text-[var(--danger-text)] mb-6">
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
    <div className="attendance-manual-workspace">
<div className="attendance-workspace-nav">
          <PresenceSubNav userRole={currentUser?.role || ''} canRecordAttendanceForAll={!!currentUser?.canRecordAttendanceForAll} />
        </div>


      {/* Header */}


      <div className="attendance-manual-heading attendance-page-header">


        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border  bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]">
          <User size={12}/>
          Pointage Manuel
          {isManager && (
            <span className="ml-2 px-2 py-0.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] rounded-full text-[10px]">
              Département uniquement
            </span>
          )}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">
          Saisie Manuelle
        </h1>
        <p className="text-[var(--text-muted)] mt-2 text-lg">
          Enregistrez les présences avec heures personnalisées
          {isManager && ' (Votre département)'}
        </p>
      </div>

      <div className="attendance-manual-content space-y-6">

        {/* ══════════════════════════════════════════════════════
            🟢 BOUTON GPS SELF-CHECK — visible RH / Admin uniquement
            Placé bien en vue AVANT le formulaire principal
        ══════════════════════════════════════════════════════ */}
        {canSelfCheckGps && (
          <button
            onClick={() => router.push(bp('/presences/pointage'))}
            className="
              w-full group relative overflow-hidden
              bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]
              border border-[var(--border)] hover:border-[var(--border)]
              rounded-2xl p-5 transition-colors duration-300
              flex items-center gap-4
            "
          >
            {/* Glow pulse derrière l'icône */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[var(--brand)]  opacity-30 group-hover:opacity-60 transition-opacity rounded-full"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] border border-[var(--border)] flex items-center justify-center">
                <MapPin size={28} className="text-[var(--success-text)]  transition-transform" />
              </div>
            </div>

            {/* Texte */}
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold   text-[var(--success-text)] mb-0.5">
                Me pointer moi-même
              </p>
              <p className="text-lg font-semibold text-[var(--text)]">
                Ma Pointeuse GPS
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                {currentUser?.firstName} {currentUser?.lastName} — Pointer mon arrivée / départ via GPS
              </p>
            </div>

            {/* Flèche */}
            <ChevronRight size={22} className="text-[var(--success-text)]  transition-transform shrink-0" />
          </button>
        )}

        {/* Success */}
        {showSuccess && (
          <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl p-8 border border-[var(--border)] text-center ">
            <CheckCircle2 size={64} className="mx-auto text-[var(--success-text)] mb-4"/>
            <h2 className="text-2xl font-semibold text-[var(--text)]">Enregistré !</h2>
            <p className="text-sm text-[var(--success-text)] mt-2">Le pointage a été créé avec succès</p>
          </div>
        )}

        {!showSuccess && (
          <div className="bg-[var(--surface)]  rounded-2xl attendance-manual-form">

            <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl p-4 border border-[var(--border)] flex items-start gap-3 attendance-form-notice">
              <CheckCircle2 size={20} className="text-[var(--success-text)] shrink-0 mt-0.5"/>
              <div className="text-sm">
                <p className="font-semibold text-[var(--success-text)] mb-1"> Heures personnalisables</p>
                <p className="text-[var(--success-text)]">
                  Les heures saisies seront enregistrées exactement comme indiqué. Parfait pour les corrections rétroactives.
                </p>
              </div>
            </div>

            {isManager && (
              <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl p-4 border border-[var(--border)] flex items-start gap-3 attendance-form-notice">
                <User size={20} className="text-[var(--success-text)] shrink-0 mt-0.5"/>
                <div className="text-sm">
                  <p className="font-semibold text-[var(--success-text)] mb-1">Mode Manager</p>
                  <p className="text-[var(--success-text)]">
                    Vous ne pouvez pointer que les employés de votre département ({employees.length} employé{employees.length > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            )}

            {isSecretaryEmployee && (
              <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl p-4 border border-[var(--border)] flex items-start gap-3 attendance-form-notice">
                <User size={20} className="text-[var(--success-text)] shrink-0 mt-0.5"/>
                <div className="text-sm">
                  <p className="font-semibold text-[var(--success-text)] mb-1">Pointage pour tout le monde</p>
                  <p className="text-[var(--success-text)]">
                    Vous avez la permission de pointer manuellement n'importe quel employé de l'entreprise ({employees.length} employé{employees.length > 1 ? 's' : ''}).
                  </p>
                </div>
              </div>
            )}

            {/* Recherche Employé */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
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
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] font-semibold">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text)]">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {emp.employeeNumber} - {emp.position}
                            {emp.department && <span className="ml-2 text-[var(--success-text)]">• {emp.department.name}</span>}
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
                <div className="mt-4 p-4 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] flex items-center justify-center text-[var(--success-text)] font-semibold text-lg">
                      {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text)]">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                      <p className="text-xs text-[var(--success-text)]">
                        {selectedEmployee.employeeNumber}
                        {selectedEmployee.department && ` • ${selectedEmployee.department.name}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] rounded-full transition-colors" aria-label="Fermer">
                    <X size={20} className="text-[var(--danger-text)]"/>
                  </button>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                <Calendar size={16} className="inline mr-2"/>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              />
            </div>

            {/* Heures — chacune activable indépendamment */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-xl border transition-colors ${recordCheckIn ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]' : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'}`}>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)] mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordCheckIn}
                    onChange={(e) => setRecordCheckIn(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <Clock size={16} className="text-[var(--success-text)]"/>
                  Heure d'Entrée
                </label>
                <input
                  type="time"
                  value={checkInTime}
                  disabled={!recordCheckIn}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              <div className={`p-3 rounded-xl border transition-colors ${recordCheckOut ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]' : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'}`}>
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)] mb-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={recordCheckOut}
                    onChange={(e) => setRecordCheckOut(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <Clock size={16} className="text-[var(--warning-text)]"/>
                  Heure de Sortie
                </label>
                <input
                  type="time"
                  value={checkOutTime}
                  disabled={!recordCheckOut}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] disabled:opacity-40 disabled:cursor-not-allowed"
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
                <span className="text-lg font-semibold text-[var(--text)]">
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
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                Raison du pointage manuel
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Oubli de pointage, problème technique, correction..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)] resize-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedEmployee || employees.length === 0}
              className="w-full py-4 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-2xl shadow-lg  flex justify-center items-center gap-3 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-[var(--surface)]  rounded-2xl p-6 border border-[var(--border)]">
          <h3 className="text-xs font-semibold  text-[var(--text-muted)] mb-3 ">
             Information
          </h3>
          <p className="text-sm text-[var(--text-muted)] mb-2">
            Cette fonctionnalité utilise le système de correction pour enregistrer des pointages
            avec des heures personnalisées. Les timestamps seront enregistrés exactement comme saisis.
          </p>
          <p className="text-xs text-[var(--success-text)] italic mt-2">
             Les heures d'entrée et de sortie saisies seront respectées à la minute près.
          </p>
          {isManager && (
            <p className="text-xs text-[var(--warning-text)] italic mt-2">
               En tant que Manager, vous ne pouvez pointer que les employés de votre département.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default function PointageManuelPage() {
  return <AttendanceModuleFrame kind="detail"><PointageManuelPageContent /></AttendanceModuleFrame>;
}
