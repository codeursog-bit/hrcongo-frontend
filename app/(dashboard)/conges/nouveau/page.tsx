'use client';
import '@/components/leave-history/leave-workspace.css';
import { RequestForm, RequestSummaryCard, RequestSuccessScreen } from '@/components/requests';
import { LeaveModuleFrame as ModulePageFrame } from '@/components/leave-history/LeaveModuleFrame';
import { ModulePageSkeleton } from '@/components/requests/ModulePageFrame';
import { Button } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';

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
import { KonzaLoader } from '@/components/ui/KonzaLoader';

// ✅ CONGO : 26j/an = 2.1667j/mois (pas 2.5)
const CONGO_MONTHLY_RATE = (26 / 12).toFixed(2); // "2.17"

interface LeaveBalance {
  annualRemaining:    number;
  canTakeAnnualLeave: boolean;
  monthsUntilEligible: number;
  monthsWorked:       number;
}

export default function NewLeaveRequestPage() {
  const uiToast=useToast();
  const [uiStep,setUiStep]=useState(0);
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
  useEffect(()=>{if(showConfirmation)uiToast('success','Demande de congé envoyée');},[showConfirmation,uiToast]);
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
            // ✅ Un employé ne demande QUE un congé annuel anticipé : le congé
            // annuel suit le planning de l'entreprise (planifié par le RH).
            setFormData(prev => ({ ...prev, employeeId: emp.id, type: 'ANNUAL_ANTICIPATED' }));
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

  // ✅ Rôle EMPLOYEE : congé annuel complet bloqué (planifié par le RH),
  // seul l'anticipé est proposé.
  const isEmployeeRole = currentUser?.role === 'EMPLOYEE';
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
    <ModulePageFrame kind="list"><div className="max-w-3xl mx-auto py-8 px-4">

      {showConfirmation ? <div className="leave-request-success"><RequestSuccessScreen handler="Votre administration" next="Vous retrouverez la décision et les éventuels avis dans le suivi de votre demande." onView={()=>router.push(bp('/conges/mon-espace'))} onAnother={()=>{setShowConfirmation(false);setIsSubmitting(false);setUiStep(0);setDesiredDays('');setDaysAutoFilled(false);setReturnCalc(null);setFormData(value=>({...value,startDate:'',endDate:'',reason:''}));}} /></div> : null}

      <AnimatePresence>
        {showMotifPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.48)]  p-4"
          >
            <div className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full shadow-xl border border-[var(--border)]">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 shrink-0 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  rounded-full flex items-center justify-center text-[var(--warning-text)]">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text)]">Motif requis</h2>
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
                className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--focus)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">Ce texte complète directement « ...seront <strong>{motifDraft || '…'}</strong>. » sur la lettre — pas de phrase complète, juste la suite.</p>

              <div className="flex gap-2 mt-4">
                <Button variant="ghost"
                  type="button"
                  onClick={() => setShowMotifPrompt(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] font-semibold text-sm"
                >
                  Annuler
                </Button>
                <Button variant="ghost"
                  type="button"
                  onClick={handleConfirmMotif}
                  disabled={!motifDraft.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] font-semibold text-sm disabled:opacity-40"
                >
                  Confirmer et envoyer
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CongeSubNav userRole={currentUser?.role || ''} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </Button>
        <div>
          <span className="text-sm text-[var(--text-secondary)]">Retour</span>

        </div>
      </div>

      <div hidden={showConfirmation}><RequestForm title="Nouvelle demande de congé" description="Choisissez le congé, les dates et le motif, puis relisez avant envoi."
 step={uiStep} onStepChange={setUiStep} onNext={()=>setUiStep(value=>Math.min(3,value+1))}
 onSubmit={handleSubmit} onCancel={()=>router.push(bp('/conges/mon-espace'))}
 submitting={isSubmitting} submitDisabled={!canSubmit} nextDisabled={uiStep===0 ? !formData.employeeId || isLoadingEmployees : uiStep===1 ? !canSubmit : false}
 error={submitError || undefined} noValidate
 summary={<div className="template-stack"><RequestSummaryCard entries={[
 {label:'Demandeur',value:showEmployeeSelect ? employees.find(employee=>employee.id===formData.employeeId)?.firstName : displayName},
 {label:'Type',value:formData.type==='ANNUAL'?'Congé annuel':'Congé annuel anticipé'},
 {label:'Du',value:formData.startDate || 'À renseigner'}, {label:'Au',value:formData.endDate || 'À renseigner'},
 {label:'Motif',value:formData.reason || 'Non renseigné'}
 ]}/><div className="bg-[var(--brand-soft)] text-[var(--text)] p-6 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 mb-6 opacity-80">
              <Calculator size={20} />
              <span className="text-sm font-semibold uppercase tracking-wider">Simulation</span>
            </div>

            {calculationDetails ? (
              <div className="space-y-5">
                <div className="text-center">
                  <span className={`text-5xl font-extrabold ${calculationDetails.insufficientBalance ? 'text-[var(--danger-text)]' : ''}`}>
                    {calculationDetails.ouvrables}
                  </span>
                  <p className="text-sm text-[var(--text-muted)] font-medium mt-1">Jours ouvrables décomptés</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">(lun → sam, dimanches exclus)</p>
                </div>

                <div className="bg-[var(--surface)] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text)]">Durée totale</span>
                    <span className="font-semibold">{calculationDetails.totalDays} jours</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text)]">Dimanches exclus</span>
                    <span className="font-semibold text-[var(--action)]">−{calculationDetails.dimanchesDays} jour{calculationDetails.dimanchesDays > 1 ? 's' : ''}</span>
                  </div>
                  {selectedBalance?.canTakeAnnualLeave && ['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && (
                    <>
                      <div className="h-px bg-[var(--surface)]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text)]">Solde après</span>
                        <span className={`font-semibold ${calculationDetails.insufficientBalance ? 'text-[var(--danger-text)]' : 'text-[var(--action)]'}`}>
                          {Math.round(Number(selectedBalance.annualRemaining) - calculationDetails.ouvrables)}j
                        </span>
                      </div>
                    </>
                  )}
                  <div className="h-px bg-[var(--surface)]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text)] font-semibold">Impact Solde</span>
                    <span className={`font-semibold ${calculationDetails.insufficientBalance ? 'text-[var(--danger-text)]' : 'text-[var(--warning-text)]'}`}>
                      −{calculationDetails.ouvrables}j
                    </span>
                  </div>
                </div>

                {/* Info multi-cycle */}
                {calculationDetails.isMultiCycle && ['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && (
                  <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] rounded-xl p-3">
                    <p className="text-xs text-[var(--warning-text)] font-semibold mb-1">Congés sur plusieurs années</p>
                    <p className="text-xs text-[var(--warning-text)] leading-relaxed">
                      {calculationDetails.fullCycles} année{calculationDetails.fullCycles > 1 ? 's' : ''} complète{calculationDetails.fullCycles > 1 ? 's' : ''} (26j × {calculationDetails.fullCycles})
                      {calculationDetails.remainingDays > 0 && ` + ${Math.round(calculationDetails.remainingDays)}j`}.
                      L'indemnité sera calculée cycle par cycle selon la base de référence de chaque année.
                    </p>
                  </div>
                )}

                {/* Type info */}
                <div className="flex items-start gap-2 text-xs text-[var(--text-muted)] leading-relaxed">
                  <CheckCircle2 size={14} className="text-[var(--action)] mt-0.5 shrink-0" />
                  <p>
                    {formData.type === 'ANNUAL_ANTICIPATED'
                      ? 'Congé anticipé : déduit du solde, plafonné à ce qui est déjà accumulé à ce jour. Aucune indemnité n\'est payée à cette date — l\'indemnité du droit total est versée au départ en congé annuel planifié.'
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
          </div></div>}>
 <div className="leave-request-content">
 <div hidden={uiStep!==0} className="template-stack"><div className="bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  p-4 rounded-xl border border-[var(--border)]  flex gap-3 items-start">
            <Info className="text-[var(--action)] shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-[var(--action)] ">
              Droit congolais : <strong>{CONGO_MONTHLY_RATE} jours</strong> acquis par mois travaillé (26j/an). Seuls les jours ouvrés (Lun–Ven) sont décomptés.
            </p>
          </div>
{isLoadingEmployees ? (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-3">
              <KonzaLoader variant="inline" />
            </div>
          ) : loadError && showEmployeeSelect ? (
            <div className="p-4 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)] text-[var(--warning-text)]  text-sm">{loadError}</div>
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
            <div className="p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] text-[var(--danger-text)] text-sm">{loadError}</div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  text-[var(--action)] flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase font-semibold tracking-wider">Demandeur</p>
                <p className="font-semibold text-[var(--text)]">{displayName}</p>
              </div>
            </div>
          )}
{notEligible && selectedBalance && (
            <div className="flex items-start gap-3 p-4 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl">
              <Lock size={18} className="text-[var(--warning-text)] mt-0.5 shrink-0" />
              <p className="text-sm text-[var(--warning-text)] ">
                Les congés annuels sont normalement accessibles après <strong>12 mois</strong> d'ancienneté (Code du travail congolais). Ancienneté actuelle : <strong>{Math.round(selectedBalance.monthsWorked)} mois</strong>. Encore <strong>{Math.round(selectedBalance.monthsUntilEligible)} mois</strong> requis.
                {' '}Vous pouvez tout de même soumettre cette demande — le RH décidera à la validation.
              </p>
            </div>
          )}
{['ANNUAL', 'ANNUAL_ANTICIPATED'].includes(formData.type) && selectedBalance?.canTakeAnnualLeave && (
            <div className="flex items-center gap-3 p-3 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  border border-[var(--border)]  rounded-xl">
              <CheckCircle2 size={18} className="text-[var(--action)] shrink-0" />
              <p className="text-sm text-[var(--action)] ">
                Solde disponible : <strong>{Math.round(Number(selectedBalance.annualRemaining))} jours</strong>
              </p>
            </div>
          )}
<FancySelect
            label="Type de congé"
            value={formData.type}
            onChange={(v) => setFormData({ ...formData, type: v })}
            icon={Umbrella}
            options={[
              ...(isEmployeeRole ? [] : [{ value: 'ANNUAL', label: 'Congé Annuel (fin de cycle)', icon: Umbrella }]),
              { value: 'ANNUAL_ANTICIPATED', label: 'Congé Annuel Anticipé (avant fin de cycle)', icon: Zap },
            ]}
          />
{isEmployeeRole && (
            <div className="flex items-start gap-3 p-3 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  border border-[var(--border)]  rounded-xl">
              <Info size={16} className="text-[var(--action)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--action)] ">
                Le congé annuel suit le planning de l&apos;entreprise : c&apos;est le RH qui le planifie. Tu peux demander ici un congé annuel <strong>anticipé</strong> — il est déduit de ton solde et te laisse le reste à prendre à la date fixée par l&apos;entreprise.
              </p>
            </div>
          )}
<div className="flex items-start gap-3 p-3 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  border border-[var(--border)]  rounded-xl">
            <Info size={16} className="text-[var(--action)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--action)] ">
              Maladie, maternité, paternité, mariage, décès et autres événements se déclarent désormais depuis{' '}
              <Link href={bp('/presences/absences/nouveau')} className="font-semibold underline">le module Absences</Link>.
            </p>
          </div>
{formData.type === 'ANNUAL_ANTICIPATED' && (
            <div className="flex items-start gap-3 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl">
              <Zap size={16} className="text-[var(--warning-text)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--warning-text)] ">
                Congé pris avant la fin du cycle d'acquisition en cours — plafonné au solde déjà accumulé à ce jour. Le reste du solde sera disponible normalement à la date de fin de cycle.
              </p>
            </div>
          )}</div>
 <div hidden={uiStep!==1} className="template-stack"><div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--text-muted)]">Du (Inclus)</label>
              <input type="date" value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-[var(--text-muted)]">Au (Inclus)</label>
              <input type="date" value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-4 border border-[var(--border)] rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none font-medium" />
            </div>
          </div>
<div className="p-4 bg-[color-mix(in_srgb,var(--brand)_12%,var(--surface))]  border border-[var(--border)]  rounded-xl space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[var(--action)] ">
                Vous ne connaissez pas la date de retour ?
              </label>
              <p className="text-xs text-[var(--action)]  mt-1">
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
                className="flex-1 p-3 border border-[var(--border)]  rounded-xl bg-[var(--surface)] text-[var(--text)] outline-none"
              />
              <Button variant="primary"
                type="button"
                onClick={handleCalculateReturn}
                disabled={isCalculatingReturn || !formData.employeeId || !formData.startDate || !desiredDays}
                className="px-4 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--text)] rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
              >
                {isCalculatingReturn ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                Calculer la date de reprise
              </Button>
            </div>
            {!formData.startDate && <p className="text-xs text-[var(--action)] ">Renseignez d'abord la date de départ ci-dessous, puis revenez ici.</p>}

            {returnCalc && (
              <div className="pt-3 border-t border-[var(--border)]  space-y-2">
                <p className="text-sm text-[var(--action)] ">
                  Date de reprise du travail : <strong>{new Date(returnCalc.returnDate).toLocaleDateString('fr-FR')}</strong>
                </p>
                {(returnCalc.excludedHolidays?.length > 0 || returnCalc.sundaysSkipped > 0) && (
                  <details className="text-xs text-[var(--action)] ">
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
{calculationDetails?.insufficientBalance && (
            <div className="flex items-start gap-3 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-xl">
              <AlertTriangle size={16} className="text-[var(--danger-text)] mt-0.5 shrink-0" />
              <p className="text-sm text-[var(--danger-text)] ">
                Solde insuffisant à ce jour : vous demandez <strong>{calculationDetails.ouvrables} jours</strong> mais il en reste <strong>{Math.round(Number(selectedBalance?.annualRemaining ?? 0))}</strong>. Vous pouvez tout de même soumettre — le RH décidera à la validation selon le solde réel à ce moment-là.
              </p>
            </div>
          )}</div>
 <div hidden={uiStep!==2} className="template-stack"><div>
            <label className="block text-sm font-semibold mb-2 text-[var(--text-muted)]">
              Motif & Commentaires
              {isReducedAnnual && <span className="text-[var(--warning-text)] ml-1">(obligatoire — congé réduit)</span>}
            </label>
            {isReducedAnnual && (
              <p className="text-xs text-[var(--warning-text)]  mb-2">
                Ce congé ({calculationDetails?.ouvrables}j) est inférieur au solde dû
                ({selectedBalance ? Math.round(Number(selectedBalance.annualRemaining)) : '—'}j) — le motif sera repris tel quel sur la lettre de départ (« ...seront <strong>{'{motif}'}</strong>. »), pas besoin de phrase complète.
              </p>
            )}
            <textarea value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className={`w-full p-4 border rounded-xl bg-[var(--surface)] text-[var(--text)] focus:ring-2 focus:ring-[var(--focus)] outline-none font-medium resize-none ${isReducedAnnual && !formData.reason?.trim() ? 'border-[var(--border)] ' : 'border-[var(--border)]'}`}
              rows={3} placeholder="Ex: Voyage prévu, RDV médical..." />
          </div></div>
 <div hidden={uiStep!==3} className="leave-request-review"><h2>Relire ma demande</h2><p>Vérifiez le bénéficiaire, les dates et le motif dans le récapitulatif. Les alertes de solde restent informatives ; votre RH prendra la décision.</p><p><strong>{formData.startDate || 'Date de départ à renseigner'} → {formData.endDate || 'Date de fin à renseigner'}</strong></p><p>{formData.reason || 'Aucun commentaire saisi.'}</p></div>
 </div>
 </RequestForm></div>
    </div></ModulePageFrame>
  );
}
