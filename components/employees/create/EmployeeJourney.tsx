'use client';
import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const stages = [
  ['Identité', 'Les coordonnées du nouvel employé'],
  ['Famille', 'Situation familiale et retenues'],
  ['Contrat', 'Poste, dates et rémunération'],
  ['Compléments', 'Informations utiles, facultatives'],
  ['Vérification', 'Relire avant de créer le dossier'],
];
const messages = ['Identité vérifiée', 'Situation familiale vérifiée', 'Contrat vérifié', 'Compléments parcourus'];
const encouragements = ['Bien joué ! Le dossier prend forme.', 'Une étape de plus, vous avancez bien.', 'Les conditions sont posées. Presque au bout !', 'Tout est prêt pour votre dernière relecture.'];

/** The shell owns scrolling; entering a new onboarding page starts at its title. */
export function EmployeeOnboardingStart() {
  useEffect(() => { document.getElementById('konza-main')?.scrollTo({ top: 0, behavior: 'instant' }); }, []);
  return null;
}

export function EmployeeCelebration({ final = false }: { final?: boolean }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return <span className={`employee-celebration${final ? ' employee-celebration-final' : ''}`} aria-hidden="true">
    {Array.from({ length: final ? 12 : 6 }, (_, i) => <i key={i} style={{ '--petal': i, '--petal-count': final ? 12 : 6 } as React.CSSProperties} />)}
  </span>;
}

export function EmployeeProgress({ currentStep, steps = stages, completed = false }: { currentStep: number; steps?: readonly (readonly string[])[]; completed?: boolean }) {
  const reduce = useReducedMotion();
  return <nav className="employee-journey" aria-label="Progression du parcours">
    <div className="journey-heading"><span>Étape {currentStep} sur {steps.length}</span><span>{completed ? 'Parcours terminé' : steps[currentStep - 1]?.[1] || 'Avancez à votre rythme'}</span></div>
    <ol>{steps.map(([title, description], index) => <li key={title} aria-current={!completed && currentStep === index + 1 ? 'step' : undefined} data-complete={completed || currentStep > index + 1}>
      <span className="journey-number" aria-hidden="true">{completed || currentStep > index + 1 ? <motion.svg viewBox="0 0 24 24" fill="none" width="18" height="18"><motion.path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : .35 }} /></motion.svg> : index + 1}</span>
      <div><strong>{title}</strong><span>{description}</span></div>
    </li>)}</ol>
    <div className="journey-progress-track" aria-hidden="true"><motion.span initial={false} animate={{ scaleX: completed ? 1 : (currentStep - 1) / Math.max(1, steps.length - 1) }} transition={{ duration: reduce ? 0 : .4 }} /></div>
  </nav>;
}

export function EmployeeJourney({ currentStep }: { currentStep: number }) {
  useEffect(() => {
    if (currentStep > 1) {
      const content = document.getElementById('employee-step-content');
      content?.focus({ preventScroll: true });
      document.querySelector('.employee-create-rail')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }, [currentStep]);
  return <EmployeeProgress currentStep={currentStep} />;
}

export function EmployeeStepFeedback({ show, step }: { show: boolean; step: number }) {
  const reduce = useReducedMotion();
  return <div className="journey-live" role="status" aria-live="polite" aria-atomic="true">
    <AnimatePresence>{show && <motion.div key={step} className="employee-step-feedback journey-feedback"
      initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}>
      <span className="journey-feedback-mark"><EmployeeCelebration /><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
        <motion.path d="m9 16 5 5 9-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : .4 }} />
      </svg></span><div><strong>{messages[step - 1]}</strong><span>{encouragements[step - 1]}</span><small>Étape {step} sur 5 terminée</small></div>
      <div className="journey-feedback-track"><motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: reduce ? 0 : .6 }} /></div>
    </motion.div>}</AnimatePresence>
  </div>;
}
