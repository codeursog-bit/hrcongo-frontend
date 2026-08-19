'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/generer/page.tsx
//
// Générateur de contrat — écran divisé : formulaire en 3 étapes à gauche,
// aperçu du contrat qui se construit en temps réel à droite. L'étape 2
// (rémunération) et une partie de l'étape 1 changent de forme selon le type
// choisi :
//  - CONTRAT_TRAVAIL (CDI/CDD) : décomposition brut → CNSS → ITS → TOL → net
//  - PRESTATION_SERVICES / CONSULTANT : tâches, horaires, émoluments + BNC
//  - STAGE : montant forfaitaire, durée en texte libre, renouvelable ou non
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileSignature, User, Wallet, Building2, ArrowRight, ArrowLeft,
  Plus, X, Loader2, CheckCircle2, Download, Eye, Sparkles,
  Briefcase, CalendarClock, ChevronDown, Info, PartyPopper, RefreshCcw,
  GraduationCap, ClipboardList, Clock, Percent,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useBasePath } from '@/hooks/useBasePath';

// ─── Types ──────────────────────────────────────────────────────────────────
type ContractKind = 'CONTRAT_TRAVAIL' | 'PRESTATION_SERVICES' | 'CONSULTANT' | 'STAGE';

interface LineItem { label: string; amount: number }

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  photoUrl?: string | null;
}

interface ContractForm {
  employeeId: string;
  employeeLabel: string;
  kind: ContractKind;
  contractDuration: 'INDETERMINEE' | 'DETERMINEE';
  startDate: string;
  endDate: string;
  trialPeriodMonths: number;

  civilite: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  situationMatrimoniale: string;
  nombreEnfants: number;
  nomPere: string;
  nomMere: string;
  adresseEmploye: string;
  telephoneEmploye: string;

  poste: string;
  categorie: string;
  lieuTravail: string;

  // ── CONTRAT_TRAVAIL ──────────────────────────────────────────────────────
  salaireBase: number;
  sursalaire: number;
  heuresSupplementaires: number;
  primes: LineItem[];
  transport: number;
  indemniteTransport: number;
  indemnites: LineItem[];

  // ── STAGE ─────────────────────────────────────────────────────────────────
  montantForfaitaire: number;
  dureeStageTexte: string;
  renouvelable: boolean;

  // ── PRESTATION_SERVICES / CONSULTANT ────────────────────────────────────
  taches: string;
  horaires: string;
  emoluments: number;
  tauxBnc: number;

  nomEntreprise: string;
  adresseEntreprise: string;
  telephoneEntreprise: string;
  formeJuridique: string;
  representantNom: string;
  representantFonction: string;
  villeSignature: string;
  dateSignature: string;
}

const EMPTY_FORM: ContractForm = {
  employeeId: '', employeeLabel: '',
  kind: 'CONTRAT_TRAVAIL',
  contractDuration: 'INDETERMINEE',
  startDate: '', endDate: '', trialPeriodMonths: 0,
  civilite: 'Monsieur', nom: '', prenom: '', dateNaissance: '', lieuNaissance: '',
  nationalite: 'Congolaise', situationMatrimoniale: 'célibataire', nombreEnfants: 0,
  nomPere: '', nomMere: '', adresseEmploye: '', telephoneEmploye: '',
  poste: '', categorie: '', lieuTravail: '',
  salaireBase: 0, sursalaire: 0, heuresSupplementaires: 0, primes: [],
  transport: 0, indemniteTransport: 0, indemnites: [],
  montantForfaitaire: 0, dureeStageTexte: '', renouvelable: true,
  taches: '', horaires: '', emoluments: 0, tauxBnc: 10,
  nomEntreprise: '', adresseEntreprise: '', telephoneEntreprise: '', formeJuridique: '',
  representantNom: '', representantFonction: '',
  villeSignature: '', dateSignature: new Date().toISOString().slice(0, 10),
};

const KIND_META: Record<ContractKind, { label: string; icon: React.ElementType; hint: string }> = {
  CONTRAT_TRAVAIL: { label: 'Contrat CDI / CDD', icon: Briefcase, hint: 'Salarié — soumis CNSS & ITS' },
  PRESTATION_SERVICES: { label: 'Prestation de services', icon: FileSignature, hint: 'Indépendant — hors code du travail' },
  CONSULTANT: { label: 'Consultance', icon: ClipboardList, hint: 'Indépendant — émoluments sur facture' },
  STAGE: { label: 'Convention de stage', icon: GraduationCap, hint: 'Stagiaire — gratification forfaitaire' },
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

// ─── Calcul local — UNIQUEMENT pour Stage/Prestation (arithmétique directe,
// sans barème fiscal, donc fiable à 100% côté client). Pour le Contrat de
// travail, l'ITS suit un barème progressif : on ne le devine JAMAIS côté
// front — l'aperçu Brut/CNSS/ITS/TOL/Net est calculé par le serveur avec le
// même moteur que la paie (voir useServerBreakdown ci-dessous), pour éviter
// tout écart entre l'aperçu et le document réellement généré.
function useLocalBreakdown(form: ContractForm) {
  return useMemo(() => {
    if (form.kind === 'STAGE') {
      return { net: form.montantForfaitaire || 0, bnc: 0 };
    }
    const bnc = Math.round(((form.emoluments || 0) * (form.tauxBnc || 0)) / 100);
    return { net: form.emoluments || 0, bnc };
  }, [form]);
}

interface ServerBreakdown {
  totalGross: number; cnss: number; its: number; tol: number; net: number;
  primesTotal: number; indemnitesTotal: number;
}

/** Aperçu Brut/CNSS/ITS/TOL/Net calculé par le serveur (vrai barème ITS),
 * avec un léger debounce pour ne pas spammer l'API à chaque frappe. */
function useServerBreakdown(form: ContractForm, isTravail: boolean) {
  const [breakdown, setBreakdown] = useState<ServerBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isTravail || !form.employeeId || !form.salaireBase) {
      setBreakdown(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res: any = await api.post('/contracts/generation/preview-breakdown', {
          employeeId: form.employeeId,
          salaireBase: form.salaireBase,
          sursalaire: form.sursalaire,
          heuresSupplementaires: form.heuresSupplementaires,
          primes: form.primes.filter(p => p.label && p.amount),
          transport: form.transport,
          indemniteTransport: form.indemniteTransport,
          indemnites: form.indemnites.filter(i => i.label && i.amount),
          situationMatrimoniale: form.situationMatrimoniale,
          nombreEnfants: form.nombreEnfants,
        });
        setBreakdown({
          totalGross: res.totalGross, cnss: res.cnssDeduction, its: res.itsDeduction,
          tol: res.tolDeduction, net: res.netPay, primesTotal: res.primesTotal,
          indemnitesTotal: res.indemnitesTotal,
        });
      } catch {
        // silencieux : on garde le dernier aperçu valide plutôt que d'afficher une erreur intrusive
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [
    isTravail, form.employeeId, form.salaireBase, form.sursalaire, form.heuresSupplementaires,
    form.primes, form.transport, form.indemniteTransport, form.indemnites,
    form.situationMatrimoniale, form.nombreEnfants,
  ]);

  return { breakdown, loading };
}

// ─── Nombre animé ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, className = '' }: { value: number; className?: string }) {
  return (
    <motion.span key={value} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }} className={className}>
      {fmt(value)}
    </motion.span>
  );
}

// ─── Champ générique ────────────────────────────────────────────────────────
function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
        {label}{required && <span className="text-rose-400">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all";
const selectCls = inputCls + " appearance-none pr-8";
const textareaCls = inputCls + " resize-y min-h-[90px]";

// ─── Liste dynamique primes / indemnités ────────────────────────────────────
function LineItemEditor({
  title, items, onChange, colorClass, noticeText,
}: {
  title: string; items: LineItem[]; onChange: (items: LineItem[]) => void;
  colorClass: string; noticeText: string;
}) {
  const [showNotice, setShowNotice] = useState(false);

  const add = () => {
    onChange([...items, { label: '', amount: 0 }]);
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3200);
  };
  const update = (i: number, patch: Partial<LineItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        <button type="button" onClick={add}
          className={`flex items-center gap-1 text-xs font-bold ${colorClass} hover:opacity-70 transition-opacity`}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      <AnimatePresence>
        {showNotice && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-400 overflow-hidden">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {noticeText}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {items.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            className="flex gap-2">
            <input value={item.label} onChange={e => update(i, { label: e.target.value })}
              placeholder="Libellé (ex. Prime de logement)"
              className={inputCls + " flex-1"} />
            <input type="number" value={item.amount || ''} onChange={e => update(i, { amount: Number(e.target.value) })}
              placeholder="Montant"
              className={inputCls + " w-32"} />
            <button type="button" onClick={() => remove(i)}
              className="px-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
function GenerateContractInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bp } = useBasePath();
  const { error: showError } = useAlert();

  const preselectedEmployeeId = searchParams.get('employeeId') || '';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ContractForm>(EMPTY_FORM);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(0);
  const [result, setResult] = useState<{ id: string } | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [contractTypes, setContractTypes] = useState<{ key: string; label: string; kind: ContractKind }[]>([]);

  const isTravail = form.kind === 'CONTRAT_TRAVAIL';
  const isStage = form.kind === 'STAGE';
  const isPrestationLike = form.kind === 'PRESTATION_SERVICES' || form.kind === 'CONSULTANT';
  const localBreakdown = useLocalBreakdown(form);
  const { breakdown: serverBreakdown, loading: breakdownLoading } = useServerBreakdown(form, isTravail);

  useEffect(() => {
    api.get('/contracts/generation/types').then((r: any) => setContractTypes(r)).catch(() => {});
    api.get('/employees/simple').then((r: any) => setEmployees(r)).catch(() => {});
  }, []);

  const applyPrefill = useCallback(async (employeeId: string, label: string) => {
    setLoadingPrefill(true);
    try {
      const data: any = await api.get(`/contracts/generation/prefill/${employeeId}`);
      setForm(f => ({
        ...f,
        employeeId, employeeLabel: label,
        contractDuration: data.contractDuration || 'INDETERMINEE',
        startDate: data.startDate?.slice(0, 10) || '',
        endDate: data.endDate?.slice(0, 10) || '',
        civilite: data.civilite, nom: data.nom, prenom: data.prenom,
        dateNaissance: data.dateNaissance?.slice(0, 10) || '',
        lieuNaissance: data.lieuNaissance, nationalite: data.nationalite,
        situationMatrimoniale: data.situationMatrimoniale?.toLowerCase() === 'single' ? 'célibataire' : data.situationMatrimoniale,
        nombreEnfants: data.nombreEnfants || 0,
        nomPere: data.nomPere, nomMere: data.nomMere,
        adresseEmploye: data.adresseEmploye, telephoneEmploye: data.telephoneEmploye || '',
        poste: data.poste, categorie: data.categorie, lieuTravail: data.lieuTravail,
        salaireBase: Number(data.salaireBase) || 0,
        nomEntreprise: data.nomEntreprise, adresseEntreprise: data.adresseEntreprise,
        telephoneEntreprise: data.telephoneEntreprise || '', formeJuridique: data.formeJuridique || '',
        representantNom: data.representantNom, representantFonction: data.representantFonction,
        villeSignature: data.villeSignature, dateSignature: data.dateSignature?.slice(0, 10) || f.dateSignature,
      }));
    } catch (e: any) {
      showError('Pré-remplissage impossible', e.message || "Impossible de pré-remplir depuis cet employé");
    } finally {
      setLoadingPrefill(false);
    }
  }, [showError]);

  useEffect(() => {
    if (preselectedEmployeeId && employees.length) {
      const emp = employees.find(e => e.id === preselectedEmployeeId);
      if (emp) applyPrefill(emp.id, `${emp.firstName} ${emp.lastName}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedEmployeeId, employees.length]);

  const set = <K extends keyof ContractForm>(key: K, value: ContractForm[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  // ── Validité par étape, adaptée au type choisi ─────────────────────────────
  const canNextStep1 = form.employeeId && (isStage ? true : form.poste) && (isTravail ? form.lieuTravail : true);
  const canNextStep2 = isTravail ? form.salaireBase > 0 : isStage ? form.montantForfaitaire > 0 : form.emoluments > 0;
  const canGenerate = form.villeSignature && form.dateSignature;

  const goNext = () => setStep(s => Math.min(3, s + 1));
  const goBack = () => setStep(s => Math.max(1, s - 1));

  const handleGenerate = async () => {
    setGenerating(true);
    setGenPhase(0);
    const phases = [400, 700, 600];
    for (let i = 0; i < phases.length; i++) {
      await new Promise(r => setTimeout(r, phases[i]));
      setGenPhase(i + 1);
    }
    try {
      const payload: Record<string, any> = {
        employeeId: form.employeeId,
        kind: form.kind,
        contractDuration: form.contractDuration,
        startDate: form.startDate || undefined,
        endDate: form.contractDuration === 'DETERMINEE' ? form.endDate : undefined,
        trialPeriodMonths: isTravail ? (form.trialPeriodMonths || undefined) : undefined,
        civilite: form.civilite, nom: form.nom, prenom: form.prenom,
        dateNaissance: form.dateNaissance, lieuNaissance: form.lieuNaissance, nationalite: form.nationalite,
        situationMatrimoniale: form.situationMatrimoniale, nombreEnfants: form.nombreEnfants,
        nomPere: form.nomPere, nomMere: form.nomMere,
        adresseEmploye: form.adresseEmploye, telephoneEmploye: form.telephoneEmploye,
        poste: form.poste, categorie: form.categorie, lieuTravail: form.lieuTravail,
        nomEntreprise: form.nomEntreprise, adresseEntreprise: form.adresseEntreprise,
        telephoneEntreprise: form.telephoneEntreprise, formeJuridique: form.formeJuridique,
        representantNom: form.representantNom, representantFonction: form.representantFonction,
        villeSignature: form.villeSignature, dateSignature: form.dateSignature,
      };
      if (isTravail) {
        Object.assign(payload, {
          salaireBase: form.salaireBase, sursalaire: form.sursalaire,
          heuresSupplementaires: form.heuresSupplementaires,
          primes: form.primes.filter(p => p.label && p.amount),
          transport: form.transport, indemniteTransport: form.indemniteTransport,
          indemnites: form.indemnites.filter(i => i.label && i.amount),
        });
      } else if (isStage) {
        Object.assign(payload, {
          montantForfaitaire: form.montantForfaitaire,
          dureeStageTexte: form.dureeStageTexte,
          renouvelable: form.renouvelable,
        });
      } else {
        Object.assign(payload, {
          taches: form.taches,
          horaires: form.horaires,
          emoluments: form.emoluments,
          tauxBnc: form.tauxBnc,
        });
      }
      const created: any = await api.post('/contracts/generation', payload);
      setResult({ id: created.id });
    } catch (e: any) {
      showError('Erreur de génération', e.message || 'Erreur lors de la génération du contrat');
      setGenerating(false);
    }
  };

  const downloadDocx = async (id: string) => {
    setDownloadingDocx(true);
    try {
      const blob: any = await api.get(`/contracts/generation/${id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.prenom}-${form.nom}-contrat.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      showError('Téléchargement impossible', e.message || 'Erreur lors du téléchargement du document');
    } finally {
      setDownloadingDocx(false);
    }
  };

  const openPdf = async (id: string) => {
    setOpeningPdf(true);
    try {
      const blob: any = await api.get(`/contracts/generation/${id}/preview`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // L'URL blob reste valide le temps que l'onglet l'utilise ; on la libère après un délai raisonnable.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      showError('Prévisualisation impossible', e.message || 'Erreur lors de la génération du PDF');
    } finally {
      setOpeningPdf(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(employeeSearch.toLowerCase()));

  const STEP_LABELS = ['Employé & type', isTravail ? 'Rémunération' : isStage ? 'Gratification' : 'Prestation', 'Société & signature'];

  // ── Écran de succès ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-xl p-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 260 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5">
            <PartyPopper className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">Contrat généré !</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Le document de {form.prenom} {form.nom} est prêt.
          </p>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => openPdf(result.id)} disabled={openingPdf}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all">
              {openingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Prévisualiser (PDF)
            </button>
            <button onClick={() => downloadDocx(result.id)} disabled={downloadingDocx}
              className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors">
              {downloadingDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Télécharger (Word)
            </button>
            <button onClick={() => router.push(bp(`/contrats/employe/${form.employeeId}`))}
              className="w-full py-2.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Voir la fiche contrat de l'employé
            </button>
            <button onClick={() => { setResult(null); setForm(EMPTY_FORM); setStep(1); setGenerating(false); }}
              className="w-full py-2.5 text-sm text-slate-400 font-semibold flex items-center justify-center gap-1.5 hover:text-slate-600 dark:hover:text-slate-300">
              <RefreshCcw className="w-3.5 h-3.5" /> Générer un autre contrat
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Écran "génération en cours" ────────────────────────────────────────────
  if (generating) {
    const checklist = isTravail
      ? ['Calcul de la rémunération (brut, CNSS, ITS, TOL)', 'Remplissage du document', "Mise en page & logo de l'entreprise"]
      : isStage
      ? ['Vérification des informations du stage', 'Remplissage du document', "Mise en page & logo de l'entreprise"]
      : ['Calcul de la cotisation BNC', 'Remplissage du document', "Mise en page & logo de l'entreprise"];
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
          <FileSignature className="w-7 h-7 text-white" />
        </motion.div>
        <h2 className="font-black text-lg text-slate-900 dark:text-white mb-6">Génération du contrat…</h2>
        <div className="space-y-3 text-left">
          {checklist.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < genPhase ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </motion.div>
              ) : i === genPhase ? (
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 shrink-0" />
              )}
              <span className={`text-sm ${i <= genPhase ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── En-tête + fil d'ariane ───────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <button onClick={() => router.push(bp('/contrats'))} className="hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Contrats
          </button>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">Générer un contrat</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FileSignature className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Nouveau contrat</h1>
            <p className="text-xs text-slate-400">Étape {step} sur 3 — {STEP_LABELS[step - 1]}</p>
          </div>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            animate={{ width: `${(step / 3) * 100}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* ── Colonne formulaire ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* ═══ ÉTAPE 1 : Employé & type ═══════════════════════════════ */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Quel type de contrat ?</h2>
                  <p className="text-xs text-slate-400 mb-3">Choisissez le modèle de document à générer.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(contractTypes.length ? contractTypes : Object.entries(KIND_META).map(([key, m]) => ({ key, label: m.label, kind: key as ContractKind })))
                      .map(t => {
                        const meta = KIND_META[t.kind];
                        const Icon = meta?.icon || Briefcase;
                        const active = form.kind === t.kind;
                        return (
                          <button key={t.key} type="button" onClick={() => set('kind', t.kind)}
                            className={`text-left p-3.5 rounded-2xl border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                            <Icon className={`w-4 h-4 mb-2 ${active ? 'text-indigo-500' : 'text-slate-400'}`} />
                            <p className={`text-sm font-bold ${active ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{t.label}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{meta?.hint}</p>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Pré-remplir depuis un employé</h2>
                  <p className="text-xs text-slate-400 mb-3">Toutes les infos connues seront reprises automatiquement — vous pourrez les ajuster.</p>
                  <div className="relative">
                    <input value={form.employeeId ? form.employeeLabel : employeeSearch}
                      onChange={e => { setEmployeeSearch(e.target.value); if (form.employeeId) set('employeeId', ''); }}
                      placeholder="Rechercher un employé par nom ou matricule…"
                      className={inputCls} />
                    {loadingPrefill && <Loader2 className="w-4 h-4 animate-spin text-indigo-500 absolute right-3 top-1/2 -translate-y-1/2" />}
                  </div>
                  {employeeSearch && !form.employeeId && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredEmployees.slice(0, 8).map(emp => (
                        <button key={emp.id} type="button"
                          onClick={() => { applyPrefill(emp.id, `${emp.firstName} ${emp.lastName}`); setEmployeeSearch(''); }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{emp.position} · {emp.employeeNumber}</p>
                          </div>
                        </button>
                      ))}
                      {filteredEmployees.length === 0 && <p className="px-3.5 py-3 text-xs text-slate-400">Aucun employé trouvé</p>}
                    </div>
                  )}
                </div>

                {form.employeeId && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Field label={isStage ? 'Type de convention' : 'Type de contrat'}>
                        <div className="relative">
                          <select value={form.contractDuration} onChange={e => set('contractDuration', e.target.value as any)} className={selectCls}>
                            <option value="INDETERMINEE">{isTravail ? 'Indéterminée (CDI)' : 'Indéterminée'}</option>
                            <option value="DETERMINEE">{isTravail ? 'Déterminée (CDD)' : 'Déterminée'}</option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </Field>
                      <Field label="Date de début" required>
                        <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls} />
                      </Field>
                      {form.contractDuration === 'DETERMINEE' && (
                        <Field label="Date de fin" required>
                          <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputCls} />
                        </Field>
                      )}
                    </div>

                    {isTravail && (
                      <Field label="Période d'essai" hint="0 = pas de période d'essai (l'article correspondant est omis du document)">
                        <input type="number" min={0} value={form.trialPeriodMonths || ''} onChange={e => set('trialPeriodMonths', Number(e.target.value))}
                          placeholder="Nombre de mois" className={inputCls} />
                      </Field>
                    )}

                    <div className="grid sm:grid-cols-3 gap-3">
                      <Field label="Civilité">
                        <div className="relative">
                          <select value={form.civilite} onChange={e => set('civilite', e.target.value)} className={selectCls}>
                            <option>Monsieur</option><option>Madame</option><option>Mademoiselle</option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </Field>
                      <Field label="Nom" required><input value={form.nom} onChange={e => set('nom', e.target.value)} className={inputCls} /></Field>
                      <Field label="Prénom" required><input value={form.prenom} onChange={e => set('prenom', e.target.value)} className={inputCls} /></Field>
                      <Field label="Date de naissance" required><input type="date" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} className={inputCls} /></Field>
                      <Field label="Lieu de naissance" required><input value={form.lieuNaissance} onChange={e => set('lieuNaissance', e.target.value)} className={inputCls} /></Field>
                      <Field label="Nationalité" required><input value={form.nationalite} onChange={e => set('nationalite', e.target.value)} className={inputCls} /></Field>
                    </div>

                    {isTravail ? (
                      <div className="grid sm:grid-cols-4 gap-3">
                        <Field label="Situation matrimoniale">
                          <div className="relative">
                            <select value={form.situationMatrimoniale} onChange={e => set('situationMatrimoniale', e.target.value)} className={selectCls}>
                              <option value="célibataire">Célibataire</option><option value="marié(e)">Marié(e)</option>
                              <option value="divorcé(e)">Divorcé(e)</option><option value="veuf(ve)">Veuf(ve)</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </Field>
                        <Field label="Enfants à charge"><input type="number" min={0} value={form.nombreEnfants} onChange={e => set('nombreEnfants', Number(e.target.value))} className={inputCls} /></Field>
                        <Field label="Nom du père"><input value={form.nomPere} onChange={e => set('nomPere', e.target.value)} className={inputCls} /></Field>
                        <Field label="Nom de la mère"><input value={form.nomMere} onChange={e => set('nomMere', e.target.value)} className={inputCls} /></Field>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Field label="Situation matrimoniale">
                          <div className="relative">
                            <select value={form.situationMatrimoniale} onChange={e => set('situationMatrimoniale', e.target.value)} className={selectCls}>
                              <option value="célibataire">Célibataire</option><option value="marié(e)">Marié(e)</option>
                              <option value="divorcé(e)">Divorcé(e)</option><option value="veuf(ve)">Veuf(ve)</option>
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </Field>
                        <Field label="Téléphone"><input value={form.telephoneEmploye} onChange={e => set('telephoneEmploye', e.target.value)} className={inputCls} /></Field>
                      </div>
                    )}

                    <Field label="Adresse" required><input value={form.adresseEmploye} onChange={e => set('adresseEmploye', e.target.value)} className={inputCls} /></Field>

                    {isTravail && (
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Field label="Poste occupé" required><input value={form.poste} onChange={e => set('poste', e.target.value)} className={inputCls} /></Field>
                        <Field label="Catégorie (convention collective)" required><input value={form.categorie} onChange={e => set('categorie', e.target.value)} className={inputCls} /></Field>
                        <Field label="Lieu de travail" required><input value={form.lieuTravail} onChange={e => set('lieuTravail', e.target.value)} className={inputCls} /></Field>
                      </div>
                    )}
                    {isPrestationLike && (
                      <Field label="Qualification professionnelle" required hint="Ex. : Responsable livraison, Consultant SI...">
                        <input value={form.poste} onChange={e => set('poste', e.target.value)} className={inputCls} />
                      </Field>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══ ÉTAPE 2 : Rémunération / Gratification / Prestation ═════ */}
            {step === 2 && isTravail && (
              <motion.div key="step2-travail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Rémunération</h2>
                  <p className="text-xs text-slate-400">Le brut, l'ITS et le net se recalculent automatiquement à droite.</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <Field label="Salaire de base" required>
                    <input type="number" value={form.salaireBase || ''} onChange={e => set('salaireBase', Number(e.target.value))} className={inputCls} />
                  </Field>
                  <Field label="Sursalaire">
                    <input type="number" value={form.sursalaire || ''} onChange={e => set('sursalaire', Number(e.target.value))} className={inputCls} />
                  </Field>
                  <Field label="Heures supplémentaires forfaitaires">
                    <input type="number" value={form.heuresSupplementaires || ''} onChange={e => set('heuresSupplementaires', Number(e.target.value))} className={inputCls} />
                  </Field>
                </div>

                <LineItemEditor
                  title="Primes (augmentent le salaire brut)"
                  items={form.primes} onChange={items => set('primes', items)}
                  colorClass="text-indigo-600 dark:text-indigo-400"
                  noticeText="Cette prime sera ajoutée au salaire brut, avant le calcul de la CNSS et de l'ITS."
                />

                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Field label="Transport" hint="Entre dans le calcul du brut">
                    <input type="number" value={form.transport || ''} onChange={e => set('transport', Number(e.target.value))} className={inputCls} />
                  </Field>
                  <Field label="Indemnité de transport" hint="N'entre pas dans le brut, versée directement au net">
                    <input type="number" value={form.indemniteTransport || ''} onChange={e => set('indemniteTransport', Number(e.target.value))} className={inputCls} />
                  </Field>
                </div>

                <LineItemEditor
                  title="Indemnités (versées directement au net)"
                  items={form.indemnites} onChange={items => set('indemnites', items)}
                  colorClass="text-teal-600 dark:text-teal-400"
                  noticeText="Cette indemnité n'entre pas dans le salaire brut — elle s'ajoute directement au net à payer."
                />
              </motion.div>
            )}

            {step === 2 && isStage && (
              <motion.div key="step2-stage" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Gratification de stage</h2>
                  <p className="text-xs text-slate-400">Un stage n'est pas soumis à la CNSS ni à l'ITS — juste un montant forfaitaire.</p>
                </div>

                <Field label="Montant forfaitaire mensuel" required hint="Versé chaque fin de mois ou par période convenue">
                  <input type="number" value={form.montantForfaitaire || ''} onChange={e => set('montantForfaitaire', Number(e.target.value))} className={inputCls} />
                </Field>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Durée du stage (texte)" hint='Ex. : "six mois" — utilisé tel quel dans le document'>
                    <input value={form.dureeStageTexte} onChange={e => set('dureeStageTexte', e.target.value)} placeholder="six mois" className={inputCls} />
                  </Field>
                  <Field label="Renouvelable">
                    <div className="relative">
                      <select value={form.renouvelable ? '1' : '0'} onChange={e => set('renouvelable', e.target.value === '1')} className={selectCls}>
                        <option value="1">Renouvelable si nécessaire</option>
                        <option value="0">Non renouvelable</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </Field>
                </div>

                <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-700 dark:text-sky-400">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  La résiliation d'une convention de stage ne donne droit à aucune indemnité — c'est déjà prévu dans le document.
                </div>
              </motion.div>
            )}

            {step === 2 && isPrestationLike && (
              <motion.div key="step2-prestation" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Prestation</h2>
                  <p className="text-xs text-slate-400">Émoluments hors code du travail — la cotisation BNC est à la charge du prestataire.</p>
                </div>

                <Field label="Tâches à accomplir" hint="Une par ligne — reprises telles quelles dans le document">
                  <textarea value={form.taches} onChange={e => set('taches', e.target.value)}
                    placeholder={"- Acheminer les marchandises d'un point A à un point B ;\n- Sceller les marchandises ;\n- Préparer les expéditions ;"}
                    className={textareaCls} />
                </Field>

                <Field label="Horaires des prestations" hint="Ex. : 9h00 à 13h / 14h00 à 18h30">
                  <textarea value={form.horaires} onChange={e => set('horaires', e.target.value)}
                    placeholder={"9h00 à 13h\n14h00 à 18h30"} rows={2} className={textareaCls + " min-h-[60px]"} />
                </Field>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Émoluments mensuels" required hint="Versés sur facture">
                    <input type="number" value={form.emoluments || ''} onChange={e => set('emoluments', Number(e.target.value))} className={inputCls} />
                  </Field>
                  <Field label="Taux de cotisation BNC" hint="Bénéfice Non Commercial — à la charge du prestataire">
                    <div className="relative">
                      <input type="number" value={form.tauxBnc} onChange={e => set('tauxBnc', Number(e.target.value))} className={inputCls + " pr-8"} />
                      <Percent className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ═══ ÉTAPE 3 : Société & signature ═══════════════════════════ */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-6">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white mb-1">Société & signature</h2>
                  <p className="text-xs text-slate-400">Pré-rempli depuis les paramètres de l'entreprise — modifiable si besoin.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Nom de l'entreprise"><input value={form.nomEntreprise} onChange={e => set('nomEntreprise', e.target.value)} className={inputCls} /></Field>
                  <Field label="Adresse de l'entreprise"><input value={form.adresseEntreprise} onChange={e => set('adresseEntreprise', e.target.value)} className={inputCls} /></Field>
                  {isPrestationLike && (
                    <>
                      <Field label="Téléphone de l'entreprise"><input value={form.telephoneEntreprise} onChange={e => set('telephoneEntreprise', e.target.value)} className={inputCls} /></Field>
                      <Field label="Forme juridique"><input value={form.formeJuridique} onChange={e => set('formeJuridique', e.target.value)} placeholder="SARL, SA..." className={inputCls} /></Field>
                    </>
                  )}
                  <Field label="Nom du représentant" required><input value={form.representantNom} onChange={e => set('representantNom', e.target.value)} className={inputCls} /></Field>
                  <Field label="Fonction du représentant" required><input value={form.representantFonction} onChange={e => set('representantFonction', e.target.value)} className={inputCls} /></Field>
                  <Field label="Ville de signature" required><input value={form.villeSignature} onChange={e => set('villeSignature', e.target.value)} className={inputCls} /></Field>
                  <Field label="Date de signature" required><input type="date" value={form.dateSignature} onChange={e => set('dateSignature', e.target.value)} className={inputCls} /></Field>
                </div>

                {(!form.representantNom || !form.representantFonction) && (
                  <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-700 dark:text-sky-400">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Astuce : renseignez le représentant légal une fois dans Paramètres → Entreprise pour qu'il se pré-remplisse à chaque contrat.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={goBack} disabled={step === 1}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 disabled:opacity-0 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            {step < 3 ? (
              <button type="button" onClick={goNext}
                disabled={step === 1 ? !canNextStep1 : !canNextStep2}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleGenerate} disabled={!canGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                <Sparkles className="w-4 h-4" /> Générer le contrat
              </button>
            )}
          </div>
        </div>

        {/* ── Colonne aperçu (sticky) ────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-3xl p-5 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-white/50" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Aperçu</span>
            </div>
            <p className="font-black text-lg leading-tight">
              {form.prenom || form.nom ? `${form.civilite} ${form.prenom} ${form.nom}` : 'Employé non sélectionné'}
            </p>
            <p className="text-sm text-white/60 mt-0.5">{form.poste || '—'}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-bold">{KIND_META[form.kind].label}</span>
              {form.contractDuration === 'DETERMINEE' && <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold">Durée déterminée</span>}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {isTravail ? 'Rémunération' : isStage ? 'Gratification' : 'Émoluments'}
              </span>
            </div>

            {isTravail && (
              <div className="space-y-2 text-sm">
                <Row label="Salaire de base" value={form.salaireBase} />
                {form.sursalaire > 0 && <Row label="Sursalaire" value={form.sursalaire} />}
                {(serverBreakdown?.primesTotal ?? 0) > 0 && <Row label="Primes" value={serverBreakdown!.primesTotal} highlight="indigo" />}
                {form.transport > 0 && <Row label="Transport" value={form.transport} />}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                {serverBreakdown ? (
                  <>
                    <Row label="TOTAL BRUT" value={serverBreakdown.totalGross} bold />
                    <Row label="Retenues CNSS" value={-serverBreakdown.cnss} muted />
                    <Row label="Retenues ITS" value={-serverBreakdown.its} muted />
                    <Row label="TOL" value={-serverBreakdown.tol} muted />
                    {form.indemniteTransport > 0 && <Row label="Indemnité transport" value={form.indemniteTransport} highlight="teal" />}
                    {serverBreakdown.indemnitesTotal > 0 && <Row label="Indemnités" value={serverBreakdown.indemnitesTotal} highlight="teal" />}
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Net à payer</span>
                      <AnimatedNumber value={serverBreakdown.net} className="text-lg font-black text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 py-2">
                    {breakdownLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Calcul du brut/CNSS/ITS/net en cours…</>
                    ) : (
                      <><Info className="w-3 h-3" /> Renseignez le salaire de base pour voir le calcul.</>
                    )}
                  </p>
                )}
              </div>
            )}

            {isStage && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Montant mensuel</span>
                  <AnimatedNumber value={localBreakdown.net} className="text-lg font-black text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <Info className="w-3 h-3" /> Aucune retenue CNSS/ITS — montant forfaitaire net.
                </p>
              </div>
            )}

            {isPrestationLike && (
              <div className="space-y-2 text-sm">
                <Row label="Émoluments (facturés)" value={form.emoluments} bold />
                {localBreakdown.bnc > 0 && (
                  <Row label={`Cotisation BNC (${form.tauxBnc}%, à charge prestataire)`} value={localBreakdown.bnc} muted />
                )}
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {form.horaires ? form.horaires.split('\n')[0] : 'Horaires non renseignés'}
                </p>
              </div>
            )}
          </div>

          {form.nomEntreprise && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {isPrestationLike ? "Maître d'ouvrage" : 'Employeur'}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{form.nomEntreprise}</p>
              {form.representantNom && <p className="text-xs text-slate-400 mt-0.5">Représenté par {form.representantNom}{form.representantFonction ? `, ${form.representantFonction}` : ''}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted, highlight }: { label: string; value: number; bold?: boolean; muted?: boolean; highlight?: 'indigo' | 'teal' }) {
  const color = muted ? 'text-rose-400' : highlight === 'indigo' ? 'text-indigo-500' : highlight === 'teal' ? 'text-teal-500' : 'text-slate-700 dark:text-slate-300';
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? 'font-bold text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>{label}</span>
      <AnimatedNumber value={value} className={`text-xs tabular-nums ${bold ? 'font-black text-slate-900 dark:text-white text-sm' : `font-semibold ${color}`}`} />
    </div>
  );
}

export default function GenerateContractPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-6 h-6 text-indigo-500 animate-spin" /></div>}>
      <GenerateContractInner />
    </Suspense>
  );
}