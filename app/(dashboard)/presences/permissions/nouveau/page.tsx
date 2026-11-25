'use client';
import { useRequestDocumentTemplate } from '@/hooks/useRequestDocumentTemplate';
import { AttendanceSelect } from '@/components/attendance/AttendanceSelect';
import { RequestForm, RequestSummaryCard, RequestSuccessScreen } from '@/components/requests';
import { useToast } from '@/components/design-system/feedback';
import { AttendanceModuleFrame as ModulePageFrame } from '@/components/attendance/AttendanceModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';

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
import { ExitPermissionDocument } from '@/components/documents/RequestDocuments';
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
  const [uiStep,setUiStep]=useState(0);
  const uiToast=useToast();
  const router = useRouter();
  const { bp } = useBasePath();

  const [userRole, setUserRole] = useState('');
  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const requestTemplate = useRequestDocumentTemplate('EXIT_PERMISSION', company);

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
  useEffect(()=>{if(isDone)uiToast('success','Permission enregistrée');},[isDone,uiToast]);
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
    company: { id: company?.id, city: company?.city, documentFooterText: company?.documentFooterText, legalName: company?.legalName, tradeName: company?.tradeName, logo: company?.logo, rccmNumber: company?.rccmNumber, taxNumber: company?.taxNumber, address: company?.address, phone: company?.phone },
    employee: {
      firstName: selectedTargetEmployee?.firstName || '', lastName: selectedTargetEmployee?.lastName || '',
      employeeNumber: selectedTargetEmployee?.employeeNumber, department: selectedTargetEmployee?.department?.name,
    },
    type, missionType: type === 'MISSION' ? missionType : undefined,
    reason: reason || 'Motif de la sortie…', destination,
    departureTime, expectedReturnTime,
    status: (onBehalf || ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole)) ? 'APPROVED' : 'PENDING',
  };

  if(isDone) return <ModulePageFrame><RequestSuccessScreen handler="Votre administration" confirmation={onBehalf ? 'Le ticket de permission a été enregistré.' : 'Le ticket de permission a été enregistré et transmis pour validation.'} next="Retrouvez la décision et le suivi du retour dans votre espace." onView={()=>router.push(bp(onBehalf ? '/presences/permissions' : '/presences/permissions/mon-espace'))} onAnother={()=>{setIsDone(false);setReason('');setDestination('');setUiStep(0);}} /></ModulePageFrame>;

  return (
    <ModulePageFrame kind="list"><div className="max-w-[1300px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <PermissionsSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <Button variant="ghost" aria-label="Retour aux permissions" onClick={() => router.push(bp('/presences/permissions'))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]">
          <ArrowLeft size={18} />
        </Button>
        <div>
          <span className="text-sm text-[var(--text-secondary)]">Retour aux permissions</span>
          <p className="text-[var(--text-muted)] text-sm">Urgence en cours de journée ou mission d&apos;entreprise à l&apos;extérieur</p>
        </div>
      </div>

      <RequestForm title="Nouvelle demande de permission" description="Précisez la sortie, les horaires et le motif, puis relisez avant envoi."
 step={uiStep} onStepChange={setUiStep} onNext={()=>setUiStep(value=>Math.min(3,value+1))} onSubmit={handleSubmit}
 onCancel={()=>router.push(bp('/presences/permissions'))} submitting={isSubmitting} submitDisabled={!canSubmit} noValidate
 nextDisabled={uiStep===0 ? !type || (onBehalf && !selectedEmployeeId) : uiStep===1 ? !departureTime || !expectedReturnTime || new Date(expectedReturnTime)<=new Date(departureTime) : reason.trim().length<3}
 error={error || undefined} summary={<RequestSummaryCard entries={[
 {label:'Bénéficiaire',value:selectedTargetEmployee ? [selectedTargetEmployee.firstName,selectedTargetEmployee.lastName].filter(Boolean).join(' ') : 'À sélectionner'},
 {label:'Type',value:TYPE_OPTIONS.find(option=>option.value===type)?.label},
 {label:'Sortie',value:departureTime || 'À renseigner'}, {label:'Retour prévu',value:expectedReturnTime || 'À renseigner'},
 {label:'Destination',value:destination || 'Non renseignée'},{label:'Motif',value:reason || 'À renseigner'}
 ]}/>}>
 <div className="leave-request-content">
 <div hidden={uiStep!==0} className="template-stack">{isApprover && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-[var(--text-muted)]  ">Pour qui ?</label>
                <Button variant="ghost"
                  onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }}
                  role="switch" aria-label="Créer pour un employé" aria-checked={onBehalf} className={`permission-beneficiary-switch w-11 h-6 rounded-full transition-colors relative shrink-0 ${onBehalf ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-[var(--surface)] rounded-full transition-colors ${onBehalf ? 'left-5' : 'left-0.5'}`} />
                </Button>
              </div>
              {!onBehalf ? (
                <p className="text-sm text-[var(--text-muted)]">Pour moi-même</p>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input value={employeeSearch} onChange={e => setEmployeeSearch(e.target.value)} placeholder="Rechercher un employé…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredEmployees.map(e => (
                      <Button variant="ghost"
                        key={e.id}
                        onClick={() => setSelectedEmployeeId(e.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedEmployeeId === e.id ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  text-[var(--success-text)]  font-semibold' : 'hover:bg-[var(--surface-2)]'}`}
                      >
                        {e.firstName} {e.lastName}
                        {e.department?.name && <span className="text-xs text-[var(--text-muted)]">{e.department.name}</span>}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}<div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
            <label className="text-xs font-semibold text-[var(--text-muted)]   mb-3 block">Type de permission</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <Button variant="ghost" key={opt.value} onClick={() => setType(opt.value)} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${active ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ' : 'border-[var(--border)] hover:border-[var(--text-muted)]'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-[var(--brand)] text-[var(--on-brand)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text)]">{opt.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{opt.hint}</p>
                    </div>
                  </Button>
                );
              })}
            </div>

            {type === 'MISSION' && (
              <AttendanceSelect value={missionType} onChange={e => setMissionType(e.target.value)} className="w-full mt-3 px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm">
                {MISSION_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </AttendanceSelect>
            )}
          </div></div>
 <div hidden={uiStep!==1} className="template-stack"><div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5 block">Heure de sortie</label>
                <input type="datetime-local" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5 block">Retour prévu</label>
                <input type="datetime-local" value={expectedReturnTime} onChange={e => setExpectedReturnTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
              </div>
            </div><div>
              <label className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5 block">Destination (optionnel)</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex : Hôpital, chez le client X…" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
              </div>
            </div></div>
 <div hidden={uiStep!==2} className="template-stack"><div>
              <label className="text-xs font-semibold text-[var(--text-muted)]   mb-1.5 block">Motif</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Détail de la sortie…" className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm resize-none" />
            </div></div>
 <div hidden={uiStep!==3} className="template-stack"><h2>Relire ma demande</h2><p className="text-sm text-[var(--text-secondary)]">Vérifiez le bénéficiaire, les heures et le motif dans le récapitulatif avant l’envoi.</p><Button variant="ghost" aria-label="Aperçu du ticket" onClick={() => setShowPreviewModal(true)} className="px-4 py-3.5 border border-dashed border-[var(--border)] text-[var(--text-muted)] font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--surface-2)] shrink-0">
              <Eye size={18} />
            </Button></div>
 </div></RequestForm>

      <DocumentPreviewModal open={showPreviewModal} onClose={() => setShowPreviewModal(false)}>
        <ExitPermissionDocument template={requestTemplate} id="preview-ticket" data={previewData as any} />
      </DocumentPreviewModal>
    </div></ModulePageFrame>
  );
}