'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/CorrectionsView.tsx
// ============================================================================
// 🔥 KONZA SUITE — Vue Corrections + Workflow Heures Sup
//
// Améliorations UX :
//   • Interface slide-over au lieu d'édition inline (moins compressée)
//   • Badges statut visuels clairs avec icônes
//   • Workflow overtime intégré (Oubli / HS / Approbation patron)
//   • Compteur temps réel pour pointages ouverts
//   • Historique redesigné avec timeline
//   • Toasts de confirmation (plus d'alert() natifs)
//   • Responsive mobile
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, Calendar, Edit3, Check, X, CheckCircle, XCircle,
  MapPin, History, Clock, ChevronRight, Timer, UserCheck,
  AlertTriangle, Loader2, RefreshCw, Filter, Search,
  ThumbsUp, ThumbsDown, HelpCircle, Info, Zap, Moon,
  ArrowRight, Eye, Shield
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OvertimePendingItem {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  pendingOvertimeHours: number;
  overtimeStatus: 'PENDING_EMPLOYEE' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'AUTO_CLOSED' | 'NONE';
  overtimeRequestedAt?: string;
  employee: {
    firstName: string;
    lastName: string;
    photoUrl?: string;
    department?: { name: string };
  };
}

interface CorrectionsViewProps {
  data: any;
  userRole: string;
  userDepartment: string;
  onRefresh: () => void;
}

// ─── Composant Toast ──────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-sky-500',
  };
  const icons = { success: <Check size={16} />, error: <X size={16} />, info: <Info size={16} /> };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-2xl shadow-black/30 ${colors[type]} animate-slide-up`}>
      <span className="p-1 bg-white/20 rounded-lg">{icons[type]}</span>
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

// ─── Compteur temps réel ──────────────────────────────────────────────────────
function LiveTimer({ checkIn }: { checkIn: string }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = Date.now() - new Date(checkIn).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${h}h${String(m).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [checkIn]);

  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono text-sm font-bold">
      <Timer size={13} className="animate-pulse" />
      {elapsed}
    </span>
  );
}

// ─── Badge statut overtime ────────────────────────────────────────────────────
function OvertimeBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    PENDING_EMPLOYEE: { label: 'En attente employé', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: <HelpCircle size={12} /> },
    PENDING_APPROVAL: { label: 'En attente patron',  class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',   icon: <Clock size={12} /> },
    APPROVED:         { label: 'Approuvé',            class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: <CheckCircle size={12} /> },
    REJECTED:         { label: 'Refusé',              class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',       icon: <XCircle size={12} /> },
    AUTO_CLOSED:      { label: 'Auto-clôturé',        class: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',      icon: <Shield size={12} /> },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${c.class}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Modal slide-over correction ─────────────────────────────────────────────
function CorrectionModal({
  attendance,
  onSave,
  onClose,
  companySettings,
}: {
  attendance: any;
  onSave: (att: any, data: any) => Promise<void>;
  onClose: () => void;
  companySettings: any;
}) {
  const [status, setStatus]     = useState(attendance.status || '');
  const [checkIn, setCheckIn]   = useState(
    attendance.checkIn ? new Date(attendance.checkIn).toISOString().slice(0, 16) : ''
  );
  const [checkOut, setCheckOut] = useState(
    attendance.checkOut ? new Date(attendance.checkOut).toISOString().slice(0, 16) : ''
  );
  const [reason, setReason]     = useState('');
  const [saving, setSaving]     = useState(false);

  const showHours = ['PRESENT', 'LATE', 'REMOTE'].includes(status);

  const handleSave = async () => {
    if (!reason.trim()) return;
    if (!status) return;
    setSaving(true);
    await onSave(attendance, { status, checkIn, checkOut, reason });
    setSaving(false);
  };

  const statusOptions = [
    { value: 'PRESENT',      label: '✅ Présent',           color: 'text-emerald-600' },
    { value: 'ABSENT_PAID',  label: '💼 Justifié (payé)',   color: 'text-blue-600' },
    { value: 'REMOTE',       label: '🏠 Télétravail',       color: 'text-purple-600' },
    { value: 'LATE',         label: '⏰ Retard',             color: 'text-amber-600' },
    { value: 'ABSENT_UNPAID',label: '❌ Non justifié',       color: 'text-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Corriger le pointage</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {attendance.employee.firstName} {attendance.employee.lastName} &bull;{' '}
              {new Date(attendance.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Statut */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Nouveau statut <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-semibold transition-all ${
                    status === opt.value
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`text-base ${status === opt.value ? '' : opt.color}`}>{opt.label}</span>
                  {status === opt.value && <Check size={16} className="ml-auto text-sky-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Horaires */}
          {showHours && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Entrée</label>
                <input
                  type="datetime-local"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Sortie</label>
                <input
                  type="datetime-local"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-mono focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* Justification */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Justification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                'Oubli de pointage confirmé',
                'Certificat médical reçu',
                'Mission externe validée',
                'Erreur système corrigée',
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setReason(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all text-left ${
                    reason === s
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Ou saisissez une justification personnalisée..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm resize-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-gray-400"
            />
            {!reason.trim() && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> Justification obligatoire
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!reason.trim() || !status || saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-sky-500/30 transition-all"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Valider la correction
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal approbation/refus heures sup (pour managers) ──────────────────────
function OvertimeApprovalModal({
  item,
  onApprove,
  onReject,
  onClose,
}: {
  item: OvertimePendingItem;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(item.id);
    setLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    await onReject(item.id, rejectReason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Zap size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Heures supplémentaires</h3>
              <p className="text-sm text-gray-500">Demande de validation</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Infos employé */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {item.employee.firstName[0]}{item.employee.lastName[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {item.employee.firstName} {item.employee.lastName}
              </p>
              <p className="text-xs text-gray-500">{item.employee.department?.name}</p>
            </div>
          </div>

          {/* Détail heures */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl text-center">
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {item.pendingOvertimeHours.toFixed(1)}h
              </p>
              <p className="text-xs text-sky-700 dark:text-sky-300 font-semibold">Heures sup déclarées</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Entrée : {new Date(item.checkIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {showRejectForm ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Motif du refus <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {['Heures non autorisées à l\'avance', 'Travail non confirmé', 'Erreur de déclaration'].map(r => (
                  <button key={r} onClick={() => setRejectReason(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 text-left transition-all ${
                      rejectReason === r ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >{r}</button>
                ))}
              </div>
              <textarea
                placeholder="Ou précisez un motif..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm resize-none focus:border-red-400"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowRejectForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
                  Retour
                </button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
                  Confirmer le refus
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectForm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-all">
                <ThumbsDown size={16} /> Refuser
              </button>
              <button onClick={handleApprove} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                Approuver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CorrectionsView({
  data,
  userRole,
  userDepartment,
  onRefresh,
}: CorrectionsViewProps) {
  const [editingAtt, setEditingAtt]           = useState<any | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<OvertimePendingItem | null>(null);
  const [showHistory, setShowHistory]         = useState(false);
  const [historyLogs, setHistoryLogs]         = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory]   = useState(false);
  const [pendingOvertimes, setPendingOvertimes] = useState<OvertimePendingItem[]>([]);
  const [activeTab, setActiveTab]             = useState<'absences' | 'overtime'>('absences');
  const [searchTerm, setSearchTerm]           = useState('');
  const [toast, setToast]                     = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [savingId, setSavingId]               = useState<string | null>(null);

  const [companySettings, setCompanySettings] = useState({
    officialStartHour: 8,
    lateToleranceMinutes: 0,
    workDays: [1, 2, 3, 4, 5],
  });

  const isAdmin = ['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'MANAGER'].includes(userRole);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res: any = await api.get('/payroll-settings');
        setCompanySettings({
          officialStartHour: res.officialStartHour || 8,
          lateToleranceMinutes: res.lateToleranceMinutes || 0,
          workDays: res.workDays || [1, 2, 3, 4, 5],
        });
      } catch (e) {
        console.error('Erreur settings:', e);
      }
    };
    fetchSettings();
    fetchPendingOvertimes();
  }, []);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const fetchPendingOvertimes = async () => {
    try {
      // Récupérer les pointages avec overtimeStatus en attente
      const res: any = await api.get('/attendance/today');
      if (Array.isArray(res)) {
        const pending = res.filter((a: any) =>
          ['PENDING_EMPLOYEE', 'PENDING_APPROVAL'].includes(a.overtimeStatus)
        );
        setPendingOvertimes(pending);
      }
    } catch (e) {
      console.error('Erreur pending overtimes:', e);
    }
  };

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

  const handleSaveCorrection = async (attendance: any, correctionData: any) => {
    setSavingId(attendance.id);
    try {
      if (attendance.isVirtual) {
        await api.post('/attendance/create-manual', {
          employeeId: attendance.employeeId,
          date: attendance.date,
          status: correctionData.status,
          checkIn: correctionData.checkIn ? new Date(correctionData.checkIn).toISOString() : null,
          checkOut: correctionData.checkOut ? new Date(correctionData.checkOut).toISOString() : null,
          notes: `Correction manuelle: ${correctionData.reason}`,
        });
      } else {
        await api.put(`/attendance/correct/${attendance.id}`, {
          status: correctionData.status,
          checkIn: correctionData.checkIn ? new Date(correctionData.checkIn).toISOString() : undefined,
          checkOut: correctionData.checkOut ? new Date(correctionData.checkOut).toISOString() : undefined,
          reason: correctionData.reason,
        });
      }

      setEditingAtt(null);
      onRefresh();
      if (showHistory) fetchHistory();
      showToast('✅ Correction enregistrée avec succès', 'success');
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.message || 'Erreur lors de la correction'}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleApproveOvertime = async (attendanceId: string) => {
    try {
      await api.post(`/attendance/approve-overtime/${attendanceId}`, {});
      setSelectedOvertime(null);
      fetchPendingOvertimes();
      onRefresh();
      showToast('✅ Heures supplémentaires validées', 'success');
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.message || 'Erreur'}`, 'error');
    }
  };

  const handleRejectOvertime = async (attendanceId: string, reason: string) => {
    try {
      await api.post(`/attendance/reject-overtime/${attendanceId}`, { reason });
      setSelectedOvertime(null);
      fetchPendingOvertimes();
      onRefresh();
      showToast('Heures supplémentaires refusées', 'info');
    } catch (err: any) {
      showToast(`❌ ${err?.response?.data?.message || 'Erreur'}`, 'error');
    }
  };

  // ─── Calcul des absences à corriger ────────────────────────────────────────
  const getAbsencesToCorrect = useCallback(() => {
    if (!data?.dayStatuses || !data?.employees || !data?.attendances) return [];

    const now = new Date();
    const results: any[] = [];

    data.employees.forEach((emp: any, empIndex: number) => {
      if (userRole === 'MANAGER' && userDepartment && emp.department?.name !== userDepartment) return;

      const empDayStatuses = data.dayStatuses[empIndex] || [];

      empDayStatuses.forEach((dayStatus: any) => {
        if (dayStatus.status !== 'ABSENT_UNPAID') return;

        const attDate = new Date(dayStatus.date);
        const dayOfWeek = attDate.getDay();
        if (!companySettings.workDays.includes(dayOfWeek)) return;

        const threshold = new Date(attDate);
        threshold.setHours(companySettings.officialStartHour, companySettings.lateToleranceMinutes, 0, 0);
        if (now < threshold) return;

        let att = data.attendances.find(
          (a: any) => a.employeeId === emp.id && a.date.split('T')[0] === dayStatus.date
        );

        if (!att) {
          att = {
            id: `virtual-${emp.id}-${dayStatus.date}`,
            employeeId: emp.id,
            date: dayStatus.date,
            status: 'ABSENT_UNPAID',
            checkIn: null,
            checkOut: null,
            isVirtual: true,
          };
        }

        results.push({ ...att, employee: emp });
      });
    });

    return results;
  }, [data, userRole, userDepartment, companySettings]);

  const absences = getAbsencesToCorrect();
  const filteredAbsences = searchTerm
    ? absences.filter((a: any) =>
        `${a.employee.firstName} ${a.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : absences;

  const filteredOvertimes = searchTerm
    ? pendingOvertimes.filter((o) =>
        `${o.employee.firstName} ${o.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : pendingOvertimes;

  return (
    <div className="space-y-5">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {editingAtt && (
        <CorrectionModal
          attendance={editingAtt}
          onSave={handleSaveCorrection}
          onClose={() => setEditingAtt(null)}
          companySettings={companySettings}
        />
      )}
      {selectedOvertime && (
        <OvertimeApprovalModal
          item={selectedOvertime}
          onApprove={handleApproveOvertime}
          onReject={handleRejectOvertime}
          onClose={() => setSelectedOvertime(null)}
        />
      )}

      {/* ── Header stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Absences à traiter', value: absences.length, icon: <AlertCircle size={18} />, color: 'from-red-500 to-rose-600', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
          { label: 'HS en attente', value: pendingOvertimes.filter(o => o.overtimeStatus === 'PENDING_APPROVAL').length, icon: <Clock size={18} />, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
          { label: 'Réponse employé', value: pendingOvertimes.filter(o => o.overtimeStatus === 'PENDING_EMPLOYEE').length, icon: <HelpCircle size={18} />, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
          { label: 'Corrections totales', value: historyLogs.length, icon: <History size={18} />, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border border-current/10 rounded-2xl p-4`}>
            <div className={`${stat.text} flex items-center gap-2 mb-2`}>
              {stat.icon}
              <span className="text-xs font-bold uppercase tracking-wide opacity-80">{stat.label}</span>
            </div>
            <p className={`text-3xl font-black ${stat.text}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Barre de contrôles ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('absences')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'absences'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <AlertCircle size={14} />
            Absences
            {absences.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">{absences.length}</span>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('overtime')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'overtime'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <Zap size={14} />
              Heures sup
              {pendingOvertimes.length > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-xs">{pendingOvertimes.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
          />
        </div>

        {/* Historique */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            showHistory
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-400'
          }`}
        >
          <History size={16} />
          <span className="hidden sm:inline">Historique</span>
        </button>

        {/* Refresh */}
        <button
          onClick={() => { onRefresh(); fetchPendingOvertimes(); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-sky-400 transition-all"
        >
          <RefreshCw size={16} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* ── Historique timeline ───────────────────────────────────────────── */}
      {showHistory && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-sky-500" />
              Historique des modifications
            </h4>
            {loadingHistory && <Loader2 size={16} className="animate-spin text-sky-500" />}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
            {historyLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Aucune modification enregistrée ce mois
              </div>
            ) : (
              historyLogs.map((log: any, idx: number) => (
                <div key={idx} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xs font-black text-sky-600 flex-shrink-0">
                      {log.modifiedBy?.firstName?.[0]}{log.modifiedBy?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {log.employee?.firstName} {log.employee?.lastName}
                        </span>
                        <ArrowRight size={12} className="text-gray-400" />
                        <span className="font-bold text-sm text-sky-600 dark:text-sky-400">{log.newValue}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Par <span className="font-semibold">{log.modifiedBy?.firstName} {log.modifiedBy?.lastName}</span>
                        {log.reason && <> · <span className="italic">{log.reason}</span></>}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      {activeTab === 'absences' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employé</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Statut</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                          <CheckCircle size={36} className="text-emerald-500" />
                        </div>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">Aucune correction nécessaire</p>
                        <p className="text-sm text-gray-500">Tous les pointages sont conformes 🎉</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {att.employee.photoUrl ? (
                            <img src={att.employee.photoUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-sm font-black text-white">
                              {att.employee.firstName[0]}{att.employee.lastName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">
                              {att.employee.firstName} {att.employee.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{att.employee.department?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Date(att.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(att.date).toLocaleDateString('fr-FR', { year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold">
                          <XCircle size={12} /> Absent non justifié
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setEditingAtt(att)}
                          disabled={savingId === att.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                          {savingId === att.id ? <Loader2 size={13} className="animate-spin" /> : <Edit3 size={13} />}
                          Corriger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab Heures sup ────────────────────────────────────────────────── */}
      {activeTab === 'overtime' && isAdmin && (
        <div className="space-y-3">
          {filteredOvertimes.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                  <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <p className="text-lg font-bold text-gray-800 dark:text-white">Aucune demande en attente</p>
                <p className="text-sm text-gray-500">Toutes les heures supplémentaires sont traitées</p>
              </div>
            </div>
          ) : (
            filteredOvertimes.map((item) => (
              <div key={item.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700 transition-all"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-base">
                      {item.employee.firstName[0]}{item.employee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {item.employee.firstName} {item.employee.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{item.employee.department?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-center px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400">{item.pendingOvertimeHours.toFixed(1)}h</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">heures sup</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Entrée</p>
                      <LiveTimer checkIn={item.checkIn} />
                    </div>

                    <OvertimeBadge status={item.overtimeStatus} />

                    {item.overtimeStatus === 'PENDING_APPROVAL' && (
                      <button
                        onClick={() => setSelectedOvertime(item)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all hover:-translate-y-0.5"
                      >
                        <Eye size={15} />
                        Traiter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Légende ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Check size={16} className="text-white" />, bg: 'bg-emerald-500', title: 'Oubli pointage', desc: 'Présent → Payé', tag: 'PRESENT' },
          { icon: <Shield size={16} className="text-white" />, bg: 'bg-blue-500', title: 'Justifié', desc: 'Maladie, urgence → Payé', tag: 'ABSENT_PAID' },
          { icon: <MapPin size={16} className="text-white" />, bg: 'bg-purple-500', title: 'Télétravail', desc: 'Distance → Payé', tag: 'REMOTE' },
          { icon: <XCircle size={16} className="text-white" />, bg: 'bg-red-500', title: 'Non justifié', desc: 'Sans correction → Déduit', tag: 'ABSENT_UNPAID' },
        ].map((item) => (
          <div key={item.tag} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
            <div className={`p-2 ${item.bg} rounded-xl flex-shrink-0`}>{item.icon}</div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CSS inline pour l'animation du toast */}
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
}