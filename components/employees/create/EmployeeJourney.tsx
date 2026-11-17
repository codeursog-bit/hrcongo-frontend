'use client';
import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

const stages = [
  ['Identité', 'Les coordonnées du nouvel employé'],
  ['Famille', 'Situation familiale et retenues'],
  ['Contrat', 'Poste, dates et rémunération'],
  ['Compléments', 'Informations utiles, facultatives'],
  ['Vérification', 'Relire avant de créer le dossier'],
];
const messages = ['Identité vérifiée', 'Situation familiale vérifiée', 'Contrat vérifié', 'Compléments parcourus'];

export function EmployeeJourney({ currentStep }: { currentStep: number }) {
  useEffect(() => {
    if (currentStep > 1) {
      const content = document.getElementById('employee-step-content');
      content?.focus({ preventScroll: true });
      content?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [currentStep]);
  return <aside className="employee-journey" aria-label="Progression du dossier">
    <p className="journey-caption">Nouveau dossier</p>
    <ol>{stages.map(([title, description], index) => <li key={title} aria-current={currentStep === index + 1 ? 'step' : undefined} data-complete={currentStep > index + 1}>
      <span className="journey-number" aria-hidden="true">{currentStep > index + 1 ? <Check size={16} strokeWidth={1.5} /> : index + 1}</span>
      <div><strong>{title}</strong><span>{description}</span></div>
    </li>)}</ol>
    <p className="journey-note">Les champs marqués * sont obligatoires. Le dossier sera créé après votre vérification finale.</p>
  </aside>;
}

export function EmployeeStepFeedback({ show, step }: { show: boolean; step: number }) {
  const reduce = useReducedMotion();
  return <div className="journey-live" role="status" aria-live="polite" aria-atomic="true">
    <AnimatePresence>{show && <motion.div key={step} className="employee-step-feedback journey-feedback"
      initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}>
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
        <motion.path d="m9 16 5 5 9-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : .4 }} />
      </svg><div><strong>{messages[step - 1]}</strong><span>Étape {step} sur 5 terminée. On continue.</span></div>
      <div className="journey-feedback-track"><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : .6 }} /></div>
    </motion.div>}</AnimatePresence>
  </div>;
}
