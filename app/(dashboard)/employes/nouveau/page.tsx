'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, FileSpreadsheet, UserPlus } from 'lucide-react';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import { useBasePath } from '@/hooks/useBasePath';
import '@/components/employees/employees.css';
import '@/components/employees/employee-workspace.css';

export default function NewEmployeePage() {
  const { bp } = useBasePath();
  return <ModulePageFrame kind="list"><div className="employee-module-page employee-method-page">
    <Link href={bp('/employes')} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-6"><ArrowLeft size={16} strokeWidth={1.5} />Retour aux employés</Link>
    <header className="employee-method-heading"><h1>Ajouter des employés</h1><p>Un recrutement à intégrer ou une équipe entière à reprendre ? Choisissez votre point de départ.</p></header>
    <div className="employee-method-options">
      <article><UserPlus size={24} strokeWidth={1.5} className="text-[var(--employee-ink,var(--text))]" /><h2>Créer un dossier</h2>
        <p>Pour un nouvel employé, renseignez les informations au fil d’un parcours guidé.</p>
        <ol><li>Identité et coordonnées</li><li>Famille, contrat et rémunération</li><li>Vérification avant la création</li></ol>
        <Link href={bp('/employes/nouveau/formulaire')} className="employee-method-primary">Commencer le dossier<ArrowRight size={16} strokeWidth={1.5} /></Link>
      </article>
      <article><FileSpreadsheet size={24} strokeWidth={1.5} className="text-[var(--text-secondary)]" /><h2>Importer une équipe</h2>
        <p>Vous disposez d’un fichier Excel ? Retrouvez l’assistant d’import, la correspondance des colonnes et la vérification des données.</p>
        <p className="employee-method-note">Adapté à la reprise de plusieurs dossiers à la fois.</p>
        <Link href={bp('/employes/import')} className="mt-6">Choisir un fichier Excel<ArrowRight size={16} strokeWidth={1.5} /></Link>
      </article>
    </div>
    <p className="employee-method-note">Les informations du dossier pourront être complétées ou modifiées après la création.</p>
  </div></ModulePageFrame>;
}
