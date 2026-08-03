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
  Paperclip, CheckCircle2, ArrowLeft, Wallet, Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { useImageUpload } from '@/hooks/useImageUpload';
import AbsenceRequestPrintable from '@/components/AbsenceRequestPrintable';
import PresenceModuleSwitcher from '@/components/PresenceModuleSwitcher';
import AbsenceSubNav from '@/components/AbsenceSubNav';

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

  const [type, setType]           = useState<AbsenceType>('CONVENTIONNELLE');
  const [subType, setSubType]     = useState<AbsenceSubType>('MALADIE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');
  const [reason, setReason]       = useState('');
  const [isPaid, setIsPaid]       = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone]             = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [returnCalc, setReturnCalc] = useState<any>(null);
  const [desiredDays, setDesiredDays] = useState('');
  const [isCalculatingReturn, setIsCalculatingReturn] = useState(false);

  const handleCalculateReturn = async () => {
    if (!employee?.id || !startDate || !desiredDays) return;
    setIsCalculatingReturn(true);
    try {
      const result: any = await api.get(
        `/absence-requests/calculate-return-date?employeeId=${employee.id}&startDate=${startDate}&days=${desiredDays}`,
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

  const canSubmit = type && subType && startDate && endDate && reason.trim().length >= 3 && workingDays > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/absence-requests', {
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

  const previewData = {
    company: {
      legalName:  company?.legalName,
      tradeName:  company?.tradeName,
      logo:       company?.logo,
      rccmNumber: company?.rccmNumber,
      taxNumber:  company?.taxNumber,
      address:    company?.address,
      phone:      company?.phone,
    },
    employee: {
      firstName:       employee?.firstName || '',
      lastName:        employee?.lastName || '',
      position:        employee?.position,
      departmentName:  employee?.department?.name,
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Demande envoyée</h1>
        <p className="text-gray-400 text-sm mb-8">
          Votre demande d&apos;autorisation d&apos;absence a été transmise. Vous serez notifié dès qu&apos;elle sera traitée.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(bp('/presences/absences/mon-espace'))} className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm">
            Voir mes demandes
          </button>
          <button onClick={() => { setIsDone(false); setStartDate(''); setEndDate(''); setReason(''); }} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm text-gray-600 dark:text-gray-300">
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
        <button onClick={() => router.push(bp('/presences/absences'))} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle demande d&apos;absence</h1>
          <p className="text-gray-400 text-sm">Remplissez le formulaire — l&apos;aperçu à droite se met à jour en direct</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── FORMULAIRE ── */}
        <div className="xl:col-span-2 space-y-5">

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Type d&apos;absence</label>
            <div className="grid grid-cols-1 gap-2">
              {TYPE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeChange(opt.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200'
                    }`}
                  >
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

            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 block">Motif précis</label>
            <div className="flex flex-wrap gap-2">
              {SUBTYPE_OPTIONS[type].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSubType(opt.value)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    subType === opt.value
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800 rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
              Calculer la date de reprise automatiquement
            </label>
            <div className="flex gap-2">
              <input
                type="number" min="1" step="0.5"
                placeholder="Nombre de jours"
                value={desiredDays}
                onChange={e => setDesiredDays(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-sky-200 dark:border-sky-700 dark:bg-gray-900 text-sm"
              />
              <button
                type="button"
                onClick={handleCalculateReturn}
                disabled={isCalculatingReturn || !employee?.id || !startDate || !desiredDays}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-2 shrink-0"
              >
                {isCalculatingReturn ? <Loader2 size={16} className="animate-spin" /> : null}
                Calculer
              </button>
            </div>
            {!startDate && <p className="text-xs text-sky-600 dark:text-sky-400">Renseignez d'abord la date de départ ci-dessous.</p>}
            {returnCalc && (
              <div className="pt-2 border-t border-sky-100 dark:border-sky-800 space-y-1.5">
                <p className="text-sm text-sky-700 dark:text-sky-300">
                  Reprise du travail : <strong>{new Date(returnCalc.returnDate).toLocaleDateString('fr-FR')}</strong>
                </p>
                {(returnCalc.excludedHolidays?.length > 0 || returnCalc.sundaysSkipped > 0) && (
                  <details className="text-xs text-sky-600 dark:text-sky-400">
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

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Date de départ</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Reprise du travail</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm" />
                </div>
              </div>
            </div>

            {workingDays > 0 && (
              <div className="flex items-center gap-2 text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 px-3 py-2 rounded-lg">
                <Info size={14} /> {workingDays} jour{workingDays > 1 ? 's' : ''} ouvrable{workingDays > 1 ? 's' : ''} d&apos;absence
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Motif de l&apos;absence</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="Expliquez brièvement le motif de votre absence…"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Absence payée souhaitée</span>
              </div>
              <button
                onClick={() => setIsPaid(!isPaid)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${isPaid ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">Le statut définitif (payé / non-payé) est tranché par les RH à la validation.</p>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Justificatif (optionnel)</label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 cursor-pointer hover:border-sky-400 hover:text-sky-500 transition-colors">
                <Paperclip size={16} />
                {uploading ? 'Envoi en cours…' : uploadedUrl ? 'Justificatif joint ✓' : 'Joindre un certificat / document'}
                <input type="file" accept="image/*,.pdf" hidden onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              </label>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 transition-all"
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Envoyer la demande
          </button>
        </div>

        {/* ── APERÇU IMPRIMABLE ── */}
        <div className="xl:col-span-3">
          <div className="sticky top-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Aperçu du document</p>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-4 overflow-auto max-h-[85vh] border border-gray-200 dark:border-gray-700">
              <div className="scale-[0.62] origin-top -mb-[38%] shadow-2xl">
                <AbsenceRequestPrintable data={previewData as any} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}