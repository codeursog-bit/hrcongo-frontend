'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/absences/nouveau/page.tsx
// ✅ Espace employé — création d'une demande d'autorisation d'absence
// ✅ Aperçu imprimable en direct (AbsenceRequestPrintable) — "effet waou"
//    demandé : l'employé voit exactement le document qui partira au dossier.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope, Sparkles, Calendar, Send, Loader2,
  Paperclip, CheckCircle2, ArrowLeft, Wallet, Info, Search, Eye, EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { useImageUpload } from '@/hooks/useImageUpload';
import AbsenceRequestPrintable from '@/components/AbsenceRequestPrintable';
import StandardAbsenceRequestForm from '@/components/documents/standard/StandardAbsenceRequestForm';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';

const APPROVER_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

type AbsenceType = 'CONVENTIONNELLE' | 'EXCEPTIONNELLE';
type AbsenceSubType = 'MALADIE' | 'MATERNITE' | 'PATERNITE' | 'MARIAGE' | 'DECES' | 'NAISSANCE' | 'AUTRE';

const TYPE_OPTIONS: Array<{ value: AbsenceType; label: string; icon: any; hint: string }> = [
  { value: 'CONVENTIONNELLE', label: 'Conventionnelle', icon: Stethoscope, hint: 'Maladie, maternité, paternité' },
  { value: 'EXCEPTIONNELLE',  label: 'Exceptionnelle',  icon: Sparkles,    hint: 'Mariage, décès, naissance, autre' },
];

const SUBTYPE_OPTIONS: Record<AbsenceType, Array<{ value: AbsenceSubType; label: string }>> = {
  CONVENTIONNELLE: [
    { value: 'MALADIE',   label: 'Maladie' },
    { value: 'MATERNITE', label: 'Maternité' },
    { value: 'PATERNITE', label: 'Paternité' },
    { value: 'AUTRE',     label: 'Autre' },
  ],
  EXCEPTIONNELLE: [
    { value: 'MARIAGE',   label: 'Mariage' },
    { value: 'DECES',     label: 'Décès' },
    { value: 'NAISSANCE', label: 'Naissance' },
    { value: 'AUTRE',     label: 'Autre' },
  ],
};

function workingDaysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    if (cur.getDay() !== 0) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export default function NouvelleAbsencePage() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [employee, setEmployee] = useState<any>(null);
  const [company, setCompany]   = useState<any>(null);
  const [userRole, setUserRole] = useState('');

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [onBehalf, setOnBehalf] = useState(false);
  const isApprover = APPROVER_ROLES.includes(userRole);

  const [type, setType]           = useState<AbsenceType>('CONVENTIONNELLE');
  const [subType, setSubType]     = useState<AbsenceSubType>('MALADIE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [reason, setReason]       = useState('');
  const [isPaid, setIsPaid]       = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [showPreview, setShowPreview]   = useState(false);
  const [returnCalc, setReturnCalc] = useState<any>(null);
  const [desiredDays, setDesiredDays] = useState('');
  const [isCalculatingReturn, setIsCalculatingReturn] = useState(false);

  // ✅ Modèle STANDARD : catalogue de motifs conventionnels propre à
  // l'entreprise, avec un nombre de jours fixe (remplace le choix
  // type/sous-type/raison libre + double date de la version DEFAULT).
  const isStandard = company?.documentTemplate === 'STANDARD';
  const [motifCatalog, setMotifCatalog] = useState<any[]>([]);
  const [selectedMotifKey, setSelectedMotifKey] = useState('');

  useEffect(() => {
    if (!isStandard) return;
    (async () => {
      try {
        const list: any = await api.get('/absence-requests/motifs');
        setMotifCatalog(list || []);
      } catch (e) { console.error('Erreur chargement catalogue de motifs', e); }
    })();
  }, [isStandard]);

  const selectedMotif = motifCatalog.find(m => m.key === selectedMotifKey);
  const standardEndDate = useMemo(() => {
    if (!startDate || !selectedMotif) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + (selectedMotif.days - 1));
    return d.toISOString().slice(0, 10);
  }, [startDate, selectedMotif]);

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

  const handleCalculateReturn = async () => {
    if (!selectedTargetEmployee?.id || !startDate || !desiredDays) return;
    setIsCalculatingReturn(true);
    try {
      const result: any = await api.get(
        `/absence-requests/calculate-return-date?employeeId=${selectedTargetEmployee.id}&startDate=${startDate}&days=${desiredDays}`,
      );
      setEndDate(result.lastLeaveDay);
      setReturnCalc(result);
    } catch (e: any) {
      alert(e?.message || "Erreur lors du calcul de la date de retour");
    } finally {
      setIsCalculatingReturn(false);
    }
  };

  const { uploadedUrl, uploading, preview, handleFileSelect } = useImageUpload({ folder: 'absences' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
    (async () => {
      try {
        const emp: any = await api.get('/employees/me');
        setEmployee(emp);
      } catch (e) {
        console.error('Erreur chargement profil employé', e);
      }
      try {
        const me: any = await api.get('/auth/me');
        setCompany(me?.company ?? null);
      } catch {}
    })();
  }, []);

  const handleTypeChange = (t: AbsenceType) => {
    setType(t);
    setSubType(SUBTYPE_OPTIONS[t][0].value);
  };

  const workingDays = useMemo(() => workingDaysBetween(startDate, endDate), [startDate, endDate]);

  const canSubmit = isStandard
    ? !!selectedMotifKey && !!startDate && (!onBehalf || !!selectedEmployeeId) && !isSubmitting
    : type && subType && startDate && endDate && reason.trim().length >= 3 && workingDays > 0
      && (!onBehalf || !!selectedEmployeeId) && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/absence-requests', isStandard ? {
        employeeId: onBehalf ? selectedEmployeeId : undefined,
        motifKey: selectedMotifKey,
        startDate,
        isPaid,
        attachmentUrl: uploadedUrl || undefined,
      } : {
        employeeId: onBehalf ? selectedEmployeeId : undefined,
        type,
        subType,
        startDate,
        endDate,
        reason: reason.trim(),
        isPaid,
        attachmentUrl: uploadedUrl || undefined,
      });
      setIsDone(true);
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'envoi de la demande");
    } finally {
      setIsSubmitting(false);
    }
  };

  const standardPreviewData = {
    company: {
      legalName: company?.legalName,
      tradeName: company?.tradeName,
      logo: company?.logo,
      address: company?.address,
      city: company?.city,
      country: company?.country,
      phone: company?.phone,
      email: company?.email,
      cachetUrl: company?.cachetUrl,
      documentFooterText: company?.documentFooterText,
    },
    employee: {
      firstName: selectedTargetEmployee?.firstName || '',
      lastName: selectedTargetEmployee?.lastName || '',
      employeeNumber: selectedTargetEmployee?.employeeNumber,
      position: selectedTargetEmployee?.position,
    },
    catalog: motifCatalog,
    motifKey: selectedMotifKey || undefined,
    startDate: startDate || new Date(),
    endDate: standardEndDate || startDate || new Date(),
    status: 'PENDING',
    requestedAt: new Date(),
  };

  const previewData = {
    company: {
      legalName:  company?.legalName,
      tradeName:  company?.tradeName,
      logo:       company?.logo,
      rccmNumber: company?.rccmNumber,
      taxNumber:  company?.taxNumber,
      address:    company?.address,
      phone:      company?.phone,
      cachetUrl:  company?.cachetUrl,
    },
    employee: {
      firstName:       selectedTargetEmployee?.firstName || '',
      lastName:        selectedTargetEmployee?.lastName || '',
      position:        selectedTargetEmployee?.position,
      departmentName:  selectedTargetEmployee?.department?.name,
      responsableName: undefined,
    },
    type,
    subType,
    reason: reason || 'Motif de l\u2019absence…',
    isPaid,
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    workingDays: workingDays || '—',
    hasAttachment: !!uploadedUrl,
    status: 'PENDING' as const,
    requestedAt: new Date(),
  };

  if (isDone) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} />
        </motion.div>
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Demande envoyée</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          {onBehalf
            ? "La demande d'autorisation d'absence a été enregistrée pour l'employé sélectionné."
            : "Votre demande d'autorisation d'absence a été transmise. Vous serez notifié dès qu'elle sera traitée."}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(bp(onBehalf ? '/presences/absences' : '/presences/absences/mon-espace'))} className="px-5 py-2.5 bg-[var(--text)] text-[var(--bg)] rounded-xl font-semibold text-sm">
            {onBehalf ? 'Voir les demandes' : 'Voir mes demandes'}
          </button>
          <button onClick={() => { setIsDone(false); setStartDate(''); setEndDate(''); setReason(''); }} className="px-5 py-2.5 border border-[var(--border)] rounded-xl font-semibold text-sm text-[var(--text-muted)]">
            Nouvelle demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-6">
      <PresenceModuleSwitcher />
      <AbsenceSubNav userRole={userRole} />

      <div className="flex items-center gap-3">
        <button onClick={() => router.push(bp('/presences/absences'))} className="p-2 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text)]">Nouvelle demande d&apos;absence</h1>
          <p className="text-[var(--text-muted)] text-sm">Remplissez le formulaire{showPreview ? ' — l\u2019aperçu à droite se met à jour en direct' : ''}</p>
        </div>
        <button
          onClick={() => setShowPreview(s => !s)}
          className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shrink-0 border transition-colors ${
            showPreview
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
          }`}
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
        </button>
      </div>

      <div className={`grid grid-cols-1 ${showPreview ? 'xl:grid-cols-5' : ''} gap-6`}>
        {/* ── FORMULAIRE ── */}
        <div className={`${showPreview ? 'xl:col-span-2' : 'max-w-2xl mx-auto w-full'} space-y-5`}>

          {isApprover && (
            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Pour qui ?</label>
                <button
                  onClick={() => { setOnBehalf(!onBehalf); setSelectedEmployeeId(''); }}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${onBehalf ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${onBehalf ? 'left-5' : 'left-0.5'}`} />
                </button>
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
                      <button
                        key={e.id}
                        onClick={() => setSelectedEmployeeId(e.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedEmployeeId === e.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-semibold' : 'hover:bg-[var(--surface-2)]'}`}
                      >
                        {e.firstName} {e.lastName}
                        {e.department?.name && <span className="text-xs text-[var(--text-muted)]">{e.department.name}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isStandard ? (
            <>
              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">Motif de l&apos;absence</label>
                <p className="text-xs text-[var(--text-muted)] mb-3">Le nombre de jours est fixé par la convention de votre entreprise — pas besoin de le calculer.</p>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {motifCatalog.length === 0 && (
                    <p className="text-sm text-[var(--text-muted)] italic">Aucun motif configuré pour votre entreprise — contactez les RH.</p>
                  )}
                  {motifCatalog.map(m => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMotifKey(m.key)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl border-2 flex items-center justify-between transition-all ${
                        selectedMotifKey === m.key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <span className="text-sm font-medium text-[var(--text)]">{m.label}</span>
                      <span className="text-xs text-[var(--text-muted)] shrink-0 ml-2">{m.days} j.</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Date de départ</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                  </div>
                </div>
                {selectedMotif && startDate && (
                  <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg">
                    <Info size={14} /> Reprise le {new Date(standardEndDate).toLocaleDateString('fr-FR')} — {selectedMotif.days} jour{selectedMotif.days > 1 ? 's' : ''} conventionnel{selectedMotif.days > 1 ? 's' : ''}
                  </div>
                )}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-[var(--text-muted)]" />
                    <span className="text-sm font-medium text-[var(--text)]">Absence payée souhaitée</span>
                  </div>
                  <button
                    onClick={() => setIsPaid(!isPaid)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isPaid ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] -mt-2">Le statut définitif (payé / non-payé) est tranché par les RH à la validation.</p>
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Justificatif (optionnel)</label>
                  <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                    <Paperclip size={16} />
                    {uploading ? 'Envoi en cours…' : uploadedUrl ? 'Justificatif joint ✓' : 'Joindre un certificat / document'}
                    <input type="file" accept="image/*,.pdf" hidden onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 block">Type d&apos;absence</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text)]">{opt.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{opt.hint}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-4 mb-2 block">Motif précis</label>
            <div className="flex flex-wrap gap-2">
              {SUBTYPE_OPTIONS[type].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSubType(opt.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    subType === opt.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                Vous ne connaissez pas votre date de reprise ?
              </label>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Optionnel — utile si vous savez combien de jours vous voulez prendre, mais pas encore la date exacte de retour
                (ça dépend des dimanches et jours fériés entre les deux). Indiquez le nombre de jours ci-dessous, on calcule
                la date de reprise et on la remplit pour vous plus bas.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Vous connaissez déjà vos deux dates (ex: du 1er au 30) ? Ignorez ce bloc et remplissez directement les champs en bas.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="number" min="1" step="0.5"
                placeholder="Ex : 12 jours"
                value={desiredDays}
                onChange={e => setDesiredDays(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-[var(--surface)] text-sm"
              />
              <button
                type="button"
                onClick={handleCalculateReturn}
                disabled={isCalculatingReturn || !selectedTargetEmployee?.id || !startDate || !desiredDays}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-2 shrink-0"
              >
                {isCalculatingReturn ? <Loader2 size={16} className="animate-spin" /> : null}
                Calculer la date de reprise
              </button>
            </div>
            {!startDate && <p className="text-xs text-emerald-600 dark:text-emerald-400">Renseignez d'abord la date de départ ci-dessous, puis revenez ici.</p>}
            {returnCalc && (
              <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800 space-y-1.5">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Reprise du travail : <strong>{new Date(returnCalc.returnDate).toLocaleDateString('fr-FR')}</strong>
                </p>
                {(returnCalc.excludedHolidays?.length > 0 || returnCalc.sundaysSkipped > 0) && (
                  <details className="text-xs text-emerald-600 dark:text-emerald-400">
                    <summary className="cursor-pointer font-semibold">Détail du calcul (transparence)</summary>
                    <div className="mt-2 space-y-1 pl-2">
                      <p>{returnCalc.sundaysSkipped} dimanche(s) exclu(s) de la période</p>
                      {returnCalc.excludedHolidays?.length > 0 && (
                        <>
                          <p className="font-semibold mt-1">Jours fériés exclus :</p>
                          {returnCalc.excludedHolidays.map((h: any) => (
                            <p key={h.date}>— {new Date(h.date).toLocaleDateString('fr-FR')} : {h.name}</p>
                          ))}
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>

          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Date de départ</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Reprise du travail</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm" />
                </div>
              </div>
            </div>

            {workingDays > 0 && (
              <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg">
                <Info size={14} /> {workingDays} jour{workingDays > 1 ? 's' : ''} ouvrable{workingDays > 1 ? 's' : ''} d&apos;absence
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Motif de l&apos;absence</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Expliquez brièvement le motif de votre absence…"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text)]">Absence payée souhaitée</span>
              </div>
              <button
                onClick={() => setIsPaid(!isPaid)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isPaid ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] -mt-2">Le statut définitif (payé / non-payé) est tranché par les RH à la validation.</p>

            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Justificatif (optionnel)</label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)] cursor-pointer hover:border-emerald-400 hover:text-emerald-500 transition-colors">
                <Paperclip size={16} />
                {uploading ? 'Envoi en cours…' : uploadedUrl ? 'Justificatif joint ✓' : 'Joindre un certificat / document'}
                <input type="file" accept="image/*,.pdf" hidden onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </label>
            </div>
          </div>
            </>
          )}

          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {onBehalf ? 'Créer la demande' : 'Envoyer la demande'}
          </button>
        </div>

        {/* ── APERÇU IMPRIMABLE (masqué par défaut) ── */}
        {showPreview && (
        <div className="xl:col-span-3">
          <div className="sticky top-6">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Aperçu du document</p>
            <div className="bg-[var(--surface-2)] rounded-2xl p-4 overflow-auto max-h-[85vh] border border-[var(--border)]">
              <div className="scale-[0.62] origin-top -mb-[38%] shadow-2xl">
                {isStandard ? (
                  <StandardAbsenceRequestForm data={standardPreviewData as any} />
                ) : (
                  <AbsenceRequestPrintable data={previewData as any} />
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}