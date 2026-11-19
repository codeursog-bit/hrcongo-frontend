'use client';

import Link from 'next/link';
import { ArrowRight, BrainCircuit, Check, Sparkles, User, Zap } from 'lucide-react';
import { Badge, Card } from '@/components/design-system/primitives';
import { Modal } from '@/components/design-system/feedback';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModeSelectionModal({ isOpen, onClose }: ModeSelectionModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Créer une nouvelle offre">
      <div className="space-y-5">
        <p className="text-sm text-[var(--text-secondary)]">
          Choisissez le mode de traitement des candidatures pour cette campagne.
        </p>

        <div data-guide="recrutement-modes" className="grid items-stretch gap-4 md:grid-cols-2">
          <Link
            data-guide="recrutement-ia" href="/recrutement/ia/create"
            className="group rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4"
          >
            <Card className="flex h-full flex-col transition-transform ">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--text)]">Mode IA</h3>
                <Badge tone="info"><Sparkles size={13} strokeWidth={1.5} /> Assisté</Badge>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                L’intelligence artificielle analyse les CV, génère un test personnalisé et recommande les profils.
              </p>
              <ul className="my-5 space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Analyse des CV avec scoring</span></li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Test technique généré selon le poste</span></li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Recommandation avec justification</span></li>
              </ul>
              <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--brand-strong)]">
                <span>Créer en mode IA</span>
                <ArrowRight size={17} strokeWidth={1.5} className="transition-transform " />
              </div>
            </Card>
          </Link>

          <Link
            data-guide="recrutement-manuel" href="/recrutement/manuel/create"
            className="group rounded-[var(--radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4"
          >
            <Card className="flex h-full flex-col transition-transform ">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--text)]">Mode manuel</h3>
                <User size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Gardez la main sur chaque étape : tri des CV, création des tests et décision finale.
              </p>
              <ul className="my-5 space-y-3 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Évaluation personnalisée des profils</span></li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Questions adaptées au poste</span></li>
                <li className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[var(--success-text)]" strokeWidth={1.5} /><span>Décision selon vos critères</span></li>
              </ul>
              <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4 text-sm font-semibold text-[var(--text-secondary)]">
                <span>Créer en mode manuel</span>
                <ArrowRight size={17} strokeWidth={1.5} className="transition-transform " />
              </div>
            </Card>
          </Link>
        </div>

        <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-4 text-sm text-[var(--text-secondary)]">
          <Zap size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--brand-strong)]" />
          <span>Vous pourrez suivre et gérer les candidatures depuis le pipeline correspondant.</span>
        </p>
      </div>
    </Modal>
  );
}
