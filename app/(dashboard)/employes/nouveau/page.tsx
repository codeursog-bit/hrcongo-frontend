'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileSpreadsheet, UserPlus } from 'lucide-react';
import { EmployeeOnboardingStart } from '@/components/employees/create/EmployeeJourney';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import { useBasePath } from '@/hooks/useBasePath';
import '@/components/employees/employees.css';
import '@/components/employees/employee-workspace.css';
import '@/components/employees/employee-onboarding.css';

export default function NewEmployeePage() {
  const { bp } = useBasePath();
  const uiReduceMotion = useReducedMotion();
  return <ModulePageFrame kind="list"><MotionConfig reducedMotion="user"><div className="employee-module-page employee-method-page">
    <EmployeeOnboardingStart /><Link href={bp('/employes')} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6"><ArrowLeft size={16} strokeWidth={1.5} />Retour aux employés</Link>
    <header className="employee-method-heading"><h1>Ajouter des employés</h1><p>Un nouveau collègue à accueillir, une équipe à intégrer.<br />Choisissez le parcours qui vous convient.</p></header>
    <div data-guide="employes-methods" className="employee-method-options">
      <motion.article className="employee-method-individual" initial={uiReduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: uiReduceMotion ? 0 : .4 }}>
        <div className="employee-method-topline"><UserPlus size={24} strokeWidth={1.5} /><span>Un employé à la fois</span></div>
        <div className="employee-method-preview" aria-hidden="true"><div className="method-profile-shape"><UserPlus size={28} strokeWidth={1.5} /><div><span /><span /></div></div><div className="method-mini-steps">{['Identité','Contrat','Vérification'].map((label,i)=><span key={label}><b>{i+1}</b>{label}</span>)}</div></div>
        <h2>Créer un dossier</h2><p>On vous accompagne, de l’identité au contrat, jusqu’à la dernière vérification.</p>
        <Link data-guide="employes-formulaire" href={bp('/employes/nouveau/formulaire')} className="employee-method-primary">Commencer le dossier<ArrowRight size={16} strokeWidth={1.5} /></Link>
      </motion.article>
      <motion.article initial={uiReduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: uiReduceMotion ? 0 : .4, delay: uiReduceMotion ? 0 : .08 }}>
        <div className="employee-method-topline"><FileSpreadsheet size={24} strokeWidth={1.5} /><span>Plusieurs employés</span></div>
        <div className="employee-method-preview method-sheet-preview" aria-hidden="true"><div><span>Nom</span><span>Poste</span><span>Contrat</span></div>{[0,1,2].map(row=><div key={row}><i /><i /><i /></div>)}</div>
        <h2>Importer une équipe</h2><p>Partez de votre fichier Excel. Associez les colonnes, vérifiez les lignes, puis lancez l’import.</p>
        <Link data-guide="employes-import" href={bp('/employes/import')} className="mt-6">Choisir un fichier Excel<ArrowRight size={16} strokeWidth={1.5} /></Link>
      </motion.article>
    </div>
    <p className="employee-method-note">Vous gardez la main : relisez les informations avant de créer les dossiers. Vous pourrez les compléter ensuite.</p>
  </div></MotionConfig></ModulePageFrame>;
}
