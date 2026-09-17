'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Loader2, Info, CheckCircle2, Calculator,
  CalendarDays, User, Umbrella, Stethoscope, Baby, Ban, Star,
  AlertTriangle, Lock, Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { useBasePath } from '@/hooks/useBasePath';
import CongeSubNav from '@/components/CongeSubNav';

// ✅ CONGO : 26j/an = 2.1667j/mois (pas 2.5)
const CONGO_MONTHLY_RATE = (26 / 12).toFixed(2); // "2.17"

interface LeaveBalance {
  annualRemaining:    number;
  canTakeAnnualLeave: boolean;
  monthsUntilEligible: number;
  monthsWorked:       number;
}

export default function NewLeaveRequestPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myEmployee, setMyEmployee] = useState<any>(null);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [returnCalc, setReturnCalc] = useState<any>(null);
  const [desiredDays, setDesiredDays] = useState('');
  const [isCalculatingReturn, setIsCalculatingReturn] = useState(false);
  // 🆕 Popup motif obligatoire (congé ANNUAL réduit par rapport au solde dû)
  const [showMotifPrompt, setShowMotifPrompt] = useState(false);
  const [motifDraft, setMotifDraft] = useState('');
  // 🆕 Empêche l'auto-suggestion du solde d'écraser une saisie déjà faite
  // par le RH (on ne préremplit que la toute première fois par employé).
  const [daysAutoFilled, setDaysAutoFilled] = useState(false);

  const handleCalculateReturn = async () => {
    if (!formData.employeeId || !formData.startDate || !desiredDays) return;
    setIsCalculatingReturn(true);
    try {
      const result: any = await api.get(
        `/leaves/calculate-return-date?employeeId=${formData.employeeId}&startDate=${formData.startDate}&days=${desiredDays}`,
      );
      setFormData((f: any) => ({ ...f, endDate: result.lastLeaveDay }));
      setReturnCalc(result);
    } catch (e: any) {
      alert(e?.message || "Erreur lors du calcul de la date de retour");
    } finally {
      setIsCalculatingReturn(false);
    }
  };

  // 🆕 Auto-déclenche le calcul de la date de retour dès qu'on a une date de
  // départ ET un nombre de jours suggéré automatiquement (voir effet
  // ci-dessus) — le RH n'a plus à cliquer manuellement "Calculer la date de
  // reprise" dans le cas courant (droit connu à l'avance). S'il change la
  // date de départ ensuite, ce même effet recalcule tout seul.
  useEffect(() => {
    if (daysAutoFilled && formData.employeeId && formData.startDate && desiredDays && !formData.endDate) {
      handleCalculateReturn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysAutoFilled, formData.startDate, formData.employeeId]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) { router.push(bp('/login')); return; }
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        if (['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) {
          const data = await api.get<any[]>('/employees/simple');
          const list = Array.isArray(data) ? data : [];
          setEmployees(list);
          if (list.length > 0) setFormData(prev => ({ ...prev, employeeId: list[0].id }));
          else setLoadError("Aucun employé dans l'entreprise.");
        } else if (user.role === 'MANAGER') {
          const [emp, deptList] = await Promise.all([
            api.get<any>('/employees/me').catch(() => null),
            api.get<any[]>('/employees/simple').catch(() => [])
          ]);
          const list: any[] = Array.isArray(deptList) ? [...deptList] : [];
          if (emp?.id) {
            setMyEmployee(emp);
            if (!list.some((e: any) => e.id === emp.id)) list.unshift(emp);
            setFormData(prev => ({ ...prev, employeeId: emp.id }));
          } else if (list.length > 0) {
            setFormData(prev => ({ ...prev, employeeId: list[0].id }));
          }
          setEmployees(list);
        } else {
          const emp = await api.get<any>('/employees/me');
          if (emp?.id) {
            setMyEmployee(emp);
            setFormData(prev => ({ ...prev, employeeId: emp.id }));
          } else {
            setLoadError("Profil employé introuvable. Contactez votre RH.");
          }
        }
      } catch (err) {
        setLoadError("Erreur inattendue lors du chargement.");
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    loadData();
  }, [router]);

  // 🆕 Charger le solde de l'employé sélectionné
  useEffect(() => {
    if (!formData.employeeId) return;
    setDaysAutoFilled(false); // nouvel employé → on autorise un nouveau préremplissage
    const fetchBalance = async () => {
      try {
        const bal = await api.get<LeaveBalance>(
          `/leaves/balance/${formData.employeeId}`
        );
        setSelectedBalance(bal);
      } catch {
        setSelectedBalance(null);
      }
    };
    fetchBalance();
  }, [formData.employeeId]);

  // 🆕 Auto-suggestion du droit réel (26j + ancienneté) dès que le solde est
  // connu — le RH n'a plus besoin de connaître ce chiffre de tête (demande
  // explicite). Uniquement pour ANNUAL (l'anticipé est volontairement
  // partiel par nature, pas de suggestion pertinente). Ne s'exécute qu'une
  // fois par employé sélectionné : si le RH modifie ensuite la valeur à la
  // main, on ne l'écrase plus.
  useEffect(() => {
    if (
      formData.type === 'ANNUAL' &&
      selectedBalance &&
      !daysAutoFilled &&
      !desiredDays
    ) {
      setDesiredDays(String(Math.round(Number(selectedBalance.annualRemaining))));
      setDaysAutoFilled(true);
    }
  }, [formData.type, selectedBalance, daysAutoFilled, desiredDays]);

  const calculationDetails = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const start = new Date(formData.startDate);
    const end   = new Date(formData.endDate);
    if (end < start) return null;

    // ✅ Jours OUVRABLES Congo : lun-sam inclus, seul dimanche exclu
    // L'article Congo est explicite : base = jours ouvrables, pas jours ouvrés (lun-ven)
    let ouvrables = 0, dimanchesDays = 0, totalDays = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      totalDays++;
      if (day === 0) dimanchesDays++; // dimanche uniquement
      else ouvrables++;               // lun (1) à sam (6) = jours ouvrables
      cur.setDate(cur.getDate() + 1);
    }
    const businessDays = ouvrables; // alias pour compatibilité avec le reste du code

    // ✅ Détection multi-cycles : si l'employé n'a pas pris ses congés pendant plusieurs années,
    // le solde peut dépasser 26j. On informe visuellement de combien de cycles il consomme.
    const cyclesUsed   = selectedBalance ? Math.ceil(ouvrables / 26) : 1;
    const fullCycles   = selectedBalance ? Math.floor(ouvrables / 26) : 0;
    const remainingDays= ouvrables % 26;
    const isMultiCycle = fullCycles >= 1 && ouvrables > 26;

    // Vérification solde insuffisant — s'applique aux deux types (Annuel et
    // Anticipé) : les deux consomment le solde accumulé, l'Anticipé est
    // justement plafonné à ce qui est déjà accumulé à ce jour.
    const insufficientBalance = ['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && selectedBalance
      ? ouvrables > Number(selectedBalance.annualRemaining)
      : false;

    return { businessDays, ouvrables, dimanchesDays, totalDays, insufficientBalance, cyclesUsed, fullCycles, remainingDays, isMultiCycle };
  }, [formData.startDate, formData.endDate, formData.type, selectedBalance]);

  // 🆕 Congé ANNUAL demandé pour MOINS que le solde réellement dû — motif
  // obligatoire (voir popup plus bas), pour qu'il apparaisse sur la lettre
  // de départ. Jamais pour ANNUAL_ANTICIPATED (partiel par nature).
  const isReducedAnnual = !!(
    formData.type === 'ANNUAL' &&
    selectedBalance &&
    calculationDetails &&
    calculationDetails.ouvrables < Math.round(Number(selectedBalance.annualRemaining))
  );

  const submitLeave = async (reasonOverride?: string) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.post('/leaves', {
        employeeId: formData.employeeId,
        type:       formData.type,
        startDate:  formData.startDate,
        endDate:    formData.endDate,
        reason:     reasonOverride ?? formData.reason
      });
      setShowConfirmation(true);
      setTimeout(() => router.push(bp('/conges/mon-espace')), 2500);
    } catch (e: any) {
      setSubmitError(e?.message || "Erreur lors de la demande");
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isReducedAnnual && !formData.reason?.trim()) {
      setMotifDraft('');
      setShowMotifPrompt(true);
      return;
    }
    submitLeave();
  };

  const handleConfirmMotif = () => {
    if (!motifDraft.trim()) return;
    setFormData(f => ({ ...f, reason: motifDraft.trim() }));
    setShowMotifPrompt(false);
    submitLeave(motifDraft.trim());
  };

  const showEmployeeSelect = currentUser &&
    ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'].includes(currentUser.role);

  const displayName = myEmployee
    ? `${myEmployee.firstName} ${myEmployee.lastName}` : '—';

  // Vérification éligibilité congé annuel — l'anticipé existe précisément
  // pour déroger à cette règle des 12 mois, donc il n'est jamais bloqué ici.
  // ✅ CORRECTIF (demande explicite) : ce n'est plus jamais bloquant, même
  // pour un employé en auto-service — seulement informatif. La demande part
  // quand même vers le RH, qui tranche à la validation avec le solde réel
  // du moment (le backend ne bloque plus non plus — voir leaves.service.ts/create()).
  const notEligible = formData.type === 'ANNUAL' && selectedBalance &&
    !selectedBalance.canTakeAnnualLeave;

  const canSubmit = !isSubmitting && !showConfirmation &&
    !!calculationDetails && !!formData.employeeId;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-[var(--surface)] rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border border-[var(--border)]">
              <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                <Send size={40} />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Demande Envoyée !</h2>
              <p className="text-[var(--text-muted)] mb-4">
                Votre demande de <strong>{calculationDetails?.ouvrables} jours</strong> a été transmise.
              </p>
              <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMotifPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full shadow-xl border border-[var(--border)]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 shrink-0 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">Motif requis</h2>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Ce congé ({calculationDetails?.ouvrables}j) est inférieur au solde dû
                    ({selectedBalance ? Math.round(Number(selectedBalance.annualRemaining)) : '—'}j).
                    Précisez le motif de cette réduction — il apparaîtra sur la lettre de départ.
                  </p>
                </div>
              </div>
              <textarea
                autoFocus
                rows={3}
                value={motifDraft}
                onChange={e => setMotifDraft(e.target.value)}
                placeholder="Ex : récupérés après le rangement de la promotion d'Août 2026"
                className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">Ce texte complète directement « ...seront <strong>{motifDraft || '…'}</strong>. » sur la lettre — pas de phrase complète, juste la suite.</p>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowMotifPrompt(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMotif}
                  disabled={!motifDraft.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-40"
                >
                  Confirmer et envoyer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CongeSubNav userRole={currentUser?.role || ''} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Planifier une absence</h1>
          <p className="text-sm text-[var(--text-muted)]">Remplissez le formulaire pour soumettre votre demande.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 bg-[var(--surface)] p-8 rounded-2xl shadow-sm border border-[var(--border)]">

          {/* ✅ Loi congolaise — taux corrigé */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-3 items-start">
            <Info className="text-emerald-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Droit congolais : <strong>{CONGO_MONTHLY_RATE} jours</strong> acquis par mois travaillé (26j/an). Seuls les jours ouvrés (Lun–Ven) sont décomptés.
            </p>
          </div>

          {/* Sélection employé */}
          {isLoadingEmployees ? (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-3">
              <Loader2 className="animate-spin text-[var(--text-muted)]" size={20} />
              <span className="text-sm text-[var(--text-muted)]">Chargement...</span>
            </div>
          ) : loadError && showEmployeeSelect ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 dark:text-amber-300 text-sm">{loadError}</div>
          ) : showEmployeeSelect ? (
            <FancySelect
              label="Employé concerné"
              value={formData.employeeId}
              onChange={(v) => setFormData({ ...formData, employeeId: v })}
              icon={User}
              options={employees.map(emp => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}${emp.department?.name ? ` · ${emp.department.name}` : ''}`
              }))}
            />
          ) : loadError ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{loadError}</div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase font-bold tracking-wider">Demandeur</p>
                <p className="font-bold text-[var(--text)]">{displayName}</p>
              </div>
            </div>
          )}

          {/* 🆕 Alerte éligibilité — informative uniquement, n'empêche plus la soumission */}
          {notEligible && selectedBalance && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <Lock size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Les congés annuels sont normalement accessibles après <strong>12 mois</strong> d'ancienneté (Code du travail congolais). Ancienneté actuelle : <strong>{Math.round(selectedBalance.monthsWorked)} mois</strong>. Encore <strong>{Math.round(selectedBalance.monthsUntilEligible)} mois</strong> requis.
                {' '}Vous pouvez tout de même soumettre cette demande — le RH décidera à la validation.
              </p>
            </div>
          )}

          {/* 🆕 Solde disponible */}
          {['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && selectedBalance?.canTakeAnnualLeave && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Solde disponible : <strong>{Math.round(Number(selectedBalance.annualRemaining))} jours</strong>
              </p>
            </div>
          )}

          {/* Type de congé — restreint à Annuel / Annuel Anticipé depuis la restructuration.
              Maladie, Maternité, Paternité, Mariage, Décès, etc. passent par le module Absences. */}
          <FancySelect
            label="Type de congé"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            icon={Umbrella}
            options={[
              { value: 'ANNUAL',             label: 'Congé Annuel (fin de cycle)',              icon: Umbrella },
              { value: 'ANNUAL_ANTICIPATED', label: 'Congé Annuel Anticipé (avant fin de cycle)', icon: Zap },
            ]}
          />

          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
            <Info size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Maladie, maternité, paternité, mariage, décès et autres événements se déclarent désormais depuis{' '}
              <Link href={bp('/presences/absences/nouveau')} className="font-bold underline">le module Absences</Link>.
            </p>
          </div>

          {/* Note congé anticipé */}
          {formData.type === 'ANNUAL_ANTICIPATED' && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Congé pris avant la fin du cycle d'acquisition en cours — plafonné au solde déjà accumulé à ce jour. Le reste du solde sera disponible normalement à la date de fin de cycle.
              </p>
            </div>
          )}

          {/* 🆕 Calcul automatique de la date de retour */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Vous ne connaissez pas la date de retour ?
              </label>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Optionnel. En congé, on connaît souvent le <strong>solde de jours</strong> (affiché plus haut : "Solde
                disponible") avant de connaître la date exacte de retour — parce que ça dépend des dimanches et jours
                fériés compris dans la période. Indiquez ici le nombre de jours à consommer (ex: le solde affiché, ou une
                partie), on calcule la vraie date de reprise et on la remplit pour vous plus bas.
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Vous connaissez déjà les deux dates exactes (départ et retour) ? Ignorez ce bloc et remplissez-les directement ci-dessous.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number" min="1" step="0.5"
                placeholder="Ex : 26 jours"
                value={desiredDays}
                onChange={e => setDesiredDays(e.target.value)}
                className="flex-1 p-3 border border-emerald-200 dark:border-emerald-700 rounded-xl bg-[var(--surface)] text-[var(--text)] outline-none"
              />
              <button
                type="button"
                onClick={handleCalculateReturn}
                disabled={isCalculatingReturn || !formData.employeeId || !formData.startDate || !desiredDays}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
              >
                {isCalculatingReturn ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                Calculer la date de reprise
              </button>
            </div>
            {!formData.startDate && <p className="text-xs text-emerald-600 dark:text-emerald-400">Renseignez d'abord la date de départ ci-dessous, puis revenez ici.</p>}

            {returnCalc && (
              <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800 space-y-2">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Date de reprise du travail : <strong>{new Date(returnCalc.returnDate).toLocaleDateString('fr-FR')}</strong>
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-muted)]">Du (Inclus)</label>
              <input type="date" value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-muted)]">Au (Inclus)</label>
              <input type="date" value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium" />
            </div>
          </div>

          {/* 🆕 Alerte solde insuffisant — informative uniquement, n'empêche plus la soumission */}
          {calculationDetails?.insufficientBalance && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Solde insuffisant à ce jour : vous demandez <strong>{calculationDetails.ouvrables} jours</strong> mais il en reste <strong>{Math.round(Number(selectedBalance?.annualRemaining ?? 0))}</strong>. Vous pouvez tout de même soumettre — le RH décidera à la validation selon le solde réel à ce moment-là.
              </p>
            </div>
          )}

          {/* Motif */}
          <div>
            <label className="block text-sm font-bold mb-2 text-[var(--text-muted)]">
              Motif & Commentaires
              {isReducedAnnual && <span className="text-amber-600 ml-1">(obligatoire — congé réduit)</span>}
            </label>
            {isReducedAnnual && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                Ce congé ({calculationDetails?.ouvrables}j) est inférieur au solde dû
                ({selectedBalance ? Math.round(Number(selectedBalance.annualRemaining)) : '—'}j) — le motif sera repris tel quel sur la lettre de départ (« ...seront <strong>{'{motif}'}</strong>. »), pas besoin de phrase complète.
              </p>
            )}
            <textarea value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className={`w-full p-4 border rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium resize-none ${isReducedAnnual && !formData.reason?.trim() ? 'border-amber-400 dark:border-amber-600' : 'border-[var(--border)]'}`}
              rows={3} placeholder="Ex: Voyage prévu, RDV médical..." />
          </div>

          {/* Erreur */}
          {submitError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-600 dark:text-red-400">
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all transform hover:scale-[1.02]"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            Soumettre pour validation
          </button>
        </div>

        {/* Sidebar simulation */}
        <div className="lg:col-span-1">
          <div className="bg-[#050607] text-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Calculator size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Simulation</span>
            </div>

            {calculationDetails ? (
              <div className="space-y-5">
                <div className="text-center">
                  <span className={`text-5xl font-extrabold ${calculationDetails.insufficientBalance ? 'text-red-400' : ''}`}>
                    {calculationDetails.ouvrables}
                  </span>
                  <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Jours ouvrables décomptés</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">(lun → sam, dimanches exclus)</p>
                </div>

                <div className="bg-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Durée totale</span>
                    <span className="font-bold">{calculationDetails.totalDays} jours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Dimanches exclus</span>
                    <span className="font-bold text-emerald-400">−{calculationDetails.dimanchesDays} jour{calculationDetails.dimanchesDays > 1 ? 's' : ''}</span>
                  </div>
                  {selectedBalance?.canTakeAnnualLeave && ['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && (
                    <>
                      <div className="h-px bg-white/20" />
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Solde après</span>
                        <span className={`font-bold ${calculationDetails.insufficientBalance ? 'text-red-400' : 'text-emerald-300'}`}>
                          {Math.round(Number(selectedBalance.annualRemaining) - calculationDetails.ouvrables)}j
                        </span>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-white/20" />
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-bold">Impact Solde</span>
                    <span className={`font-bold ${calculationDetails.insufficientBalance ? 'text-red-400' : 'text-amber-400'}`}>
                      −{calculationDetails.ouvrables}j
                    </span>
                  </div>
                </div>

                {/* Info multi-cycle */}
                {calculationDetails.isMultiCycle && ['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                    <p className="text-xs text-amber-300 font-bold mb-1">Congés sur plusieurs années</p>
                    <p className="text-xs text-amber-200/80 leading-relaxed">
                      {calculationDetails.fullCycles} année{calculationDetails.fullCycles > 1 ? 's' : ''} complète{calculationDetails.fullCycles > 1 ? 's' : ''} (26j × {calculationDetails.fullCycles})
                      {calculationDetails.remainingDays > 0 && ` + ${Math.round(calculationDetails.remainingDays)}j`}.
                      L'indemnité sera calculée cycle par cycle selon la base de référence de chaque année.
                    </p>
                  </div>
                )}

                {/* Type info */}
                <div className="flex items-start gap-2 text-xs text-[var(--text-muted)] leading-relaxed">
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <p>
                    {formData.type === 'ANNUAL_ANTICIPATED'
                      ? 'Congé anticipé : payé et déduit du solde comme un congé annuel classique — plafonné à ce qui est déjà accumulé à ce jour.'
                      : 'Congé annuel : indemnité calculée sur la base brute de référence ÷ 26.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                <CalendarDays size={48} className="mb-4 opacity-20" />
                <p className="text-center text-sm">Sélectionnez vos dates pour voir la simulation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}