'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/permissions/nouveau/page.tsx
// ✅ Formulaire de demande de permission de sortie. Un employé le remplit
//    pour lui-même ; un RH/Admin/Manager peut aussi le remplir pour un
//    employé (sélecteur affiché uniquement pour ces rôles) — cas "mission
//    d'entreprise" décidée depuis le bureau RH.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Briefcase, HelpCircle, Send, Loader2, CheckCircle2,
  ArrowLeft, MapPin, Search, Eye,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import PermissionsSubNav from '@/components/PermissionsSubNav';
import PermissionTicketPrintable from '@/components/PermissionTicketPrintable';
import DocumentPreviewModal from '@/components/loans/DocumentPreviewModal';

type PermType = 'URGENCE' | 'MISSION' | 'AUTRE';

const TYPE_OPTIONS: Array<{ value: PermType; label: string; icon: any; hint: string }> = [
  { value: 'URGENCE', label: 'Urgence',              icon: Stethoscope, hint: 'Personnelle, médicale, familiale…' },
  { value: 'MISSION',  label: 'Mission d\u2019entreprise', icon: Briefcase,   hint: 'Prospection, recouvrement, SAV, réparation…' },
  { value: 'AUTRE',    label: 'Autre',                icon: HelpCircle,  hint: 'Cas particulier, à motiver' },
];

const MISSION_OPTIONS = [
  { value: 'PROSPECTION_CLIENT', label: 'Prospection client' },
  { value: 'RECOUVREMENT',       label: 'Recouvrement' },
  { value: 'SAV',                label: 'Service après-vente' },
  { value: 'REPARATION_EXTERNE', label: 'Réparation externe' },
  { value: 'AUTRE',              label: 'Autre mission' },
];

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

function nowLocal(offsetMinutes = 0) {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  d.setSeconds(0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function NouveauTicketPage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [onBehalf, setOnBehalf] = useState(false);

  const [type, setType] = useState<PermType>('URGENCE');
  const [missionType, setMissionType] = useState('PROSPECTION_CLIENT');
  const [reason, setReason] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState(nowLocal());
  const [expectedReturnTime, setExpectedReturnTime] = useState(nowLocal(120));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isApprover = APPROVER_ROLES.includes(userRole);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try { setEmployee(await api.get('/employees/me')); } catch {}
      try { const me: any = await api.get('/auth/me'); setCompany(me?.company ?? null); } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!onBehalf) return;
    (async () => {
      try {
        const list: any = await api.get('/employees/simple');
        setEmployeesList(list || []);
      } catch (e) { console.error('Erreur chargement employés', e); }
    })();
  }, [onBehalf]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employeesList.slice(0, 30);
    const q = employeeSearch.toLowerCase();
    return employeesList.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q)).slice(0, 30);
  }, [employeesList, employeeSearch]);

  const selectedTargetEmployee = onBehalf ? employeesList.find(e => e.id === selectedEmployeeId) : employee;

  const canSubmit = type && reason.trim().length >= 3 && departureTime && expectedReturnTime
    && new Date(expectedReturnTime) > new Date(departureTime)
    && (!onBehalf || !!selectedEmployeeId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/permission-tickets', {
        employeeId: onBehalf ? selectedEmployeeId : undefined,
        type,
        missionType: type === 'MISSION' ? missionType : undefined,
        reason: reason.trim(),
        destination: destination.trim() || undefined,
        departureTime: new Date(departureTime).toISOString(),
        expectedReturnTime: new Date(expectedReturnTime).toISOString(),
      });
      setIsDone(true);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi du ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewData = {
    reference: 'TK-XXXXXXXX',
    company: { legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: {
      firstName: selectedTargetEmployee?.firstName || '', lastName: selectedTargetEmployee?.lastName || '',
      employeeNumber: selectedTargetEmployee?.employeeNumber, department: selectedTargetEmployee?.department?.name,
    },
    type, missionType: type === 'MISSION' ? missionType : undefined,
    reason: reason || 'Motif de la sortie…', destination,
    departureTime, expectedReturnTime,
    status: (onBehalf || ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole)) ? 'APPROVED' : 'PENDING',
  };

  if (isDone) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </motion.div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ticket créé</h1>
        <p className="text-gray-400 text-sm mb-8">Le ticket de permission a été enregistré{onBehalf ? '' : ' et transmis pour validation'}.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(bp(onBehalf ? '/presences/permissions' : '/presences/permissions/mon-espace'))} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm">
            Voir les tickets
          </button>
          <button onClick={() => { setIsDone(false); setReason(''); setDestination(''); }} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300">
            Nouveau ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1300px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push(bp('/presences/permissions'))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau ticket de permission</h1>
          <p className="text-gray-400 text-sm">Urgence en cours de journée ou mission d&apos;entreprise à l&apos;extérieur</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        <div className="space-y-5">

          {isApprover && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pour qui ?</label>
                <button
                  onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${onBehalf ? 'bg-sky-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${onBehalf ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              {!onBehalf ? (
                <p className="text-sm text-gray-500">Pour moi-même</p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredEmployees.map(e => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEmployeeId(e.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedEmployeeId === e.id ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        {e.firstName} {e.lastName}
                        {e.department?.name && <span className="text-xs text-gray-400">{e.department.name}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Type de permission</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button key={opt.value} onClick={() => setType(opt.value)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-xs text-gray-400">{opt.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {type === 'MISSION' && (
              <select value={missionType} onChange={e => setMissionType(e.target.value)} className="w-full mt-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm">
                {MISSION_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Heure de sortie</label>
                <input type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Retour prévu</label>
                <input type="datetime-local" value={expectedReturnTime} onChange={e => setExpectedReturnTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Destination (optionnel)</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex : Hôpital, chez le client X…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Motif</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Détail de la sortie…" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm resize-none" />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</div>}

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all">
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {onBehalf ? 'Créer le ticket' : 'Envoyer la demande'}
            </button>
            <button onClick={() => setShowPreviewModal(true)} className="px-4 py-3.5 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 shrink-0">
              <Eye size={18} />
            </button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <PermissionTicketPrintable id="preview-ticket" data={previewData as any} />
      </DocumentPreviewModal>
    </div>
  );
}