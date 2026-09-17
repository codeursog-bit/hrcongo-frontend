'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, BrainCircuit, User, ChevronRight, Sparkles } from 'lucide-react';

interface ModeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModeSelectionModal({ isOpen, onClose }: ModeSelectionModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-[var(--surface)] rounded-2xl p-8 w-full max-w-4xl shadow-2xl relative m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-3xl font-black text-[var(--text)] mb-2">
                  Créer une <span className="text-emerald-500">Nouvelle Offre</span>
                </h3>
                <p className="text-[var(--text-muted)]">Comment souhaitez-vous gérer cette campagne ?</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 hover:bg-[var(--surface-2)] rounded-2xl text-[var(--text-muted)] hover:text-[var(--text)] transition-all"
              >
                <X size={24}/>
              </button>
            </div>

            {/* Deux Cartes Côte à Côte */}
            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              
              {/* CARTE MODE IA */}
              <Link 
                href="/recrutement/ia/create"
                className="group relative bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500/60 rounded-2xl p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20 flex flex-col"
              >
                {/* Badge "Recommandé" */}
                <div className="absolute -top-3 -right-3 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5 z-10">
                  <Sparkles size={12} className="animate-pulse" />
                  NOUVELLE GÉNÉRATION
                </div>

                <div className="flex-1">
                  {/* Icône */}
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <BrainCircuit size={32} className="text-white" />
                  </div>

                  {/* Titre */}
                  <h4 className="text-2xl font-black text-[var(--text)] mb-3">
                    Mode IA
                  </h4>

                  {/* Description courte et percutante */}
                  <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                    L'intelligence artificielle analyse automatiquement chaque CV, génère un test personnalisé et recommande les meilleurs profils en quelques secondes.
                  </p>

                  {/* Features courtes */}
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Analyse instantanée</strong> des CV avec scoring objectif</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Test technique auto-généré</strong> adapté au poste</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span><strong>Recommandation intelligente</strong> avec justification</span>
                    </li>
                  </ul>

                  {/* Bénéfice principal */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                      <Zap size={12} /> Gagnez 70% de votre temps
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Traitez 100 candidatures en 2 minutes au lieu de 2 jours
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-emerald-500/20 mt-6">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Idéal pour tout volume</span>
                  <ChevronRight className="text-emerald-500 group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </Link>

              {/* CARTE MODE MANUEL */}
              <Link 
                href="/recrutement/manuel/create"
                className="group relative bg-[var(--surface-2)] border-2 border-[var(--border)] hover:border-[var(--text-muted)] rounded-2xl p-8 transition-all hover:scale-[1.02] hover:shadow-2xl flex flex-col"
              >
                <div className="flex-1">
                  {/* Icône */}
                  <div className="w-16 h-16 bg-[var(--text-muted)] rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                    <User size={32} className="text-white" />
                  </div>

                  {/* Titre */}
                  <h4 className="text-2xl font-black text-[var(--text)] mb-3">
                    Mode Manuel
                  </h4>

                  {/* Description courte et positive */}
                  <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                    Vous gardez le contrôle total sur chaque étape du processus : tri des CV, création des tests et décision finale selon votre intuition.
                  </p>

                  {/* Features courtes */}
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                      <span><strong>Évaluation personnalisée</strong> de chaque profil</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                      <span><strong>Questions sur-mesure</strong> adaptées au contexte</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <Check size={16} className="text-[var(--text-muted)] mt-0.5 flex-shrink-0" />
                      <span><strong>Détection du potentiel</strong> au-delà du CV</span>
                    </li>
                  </ul>

                  {/* Bénéfice principal */}
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                    <p className="text-xs font-bold text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      <User size={12} /> Flexibilité totale
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Parfait pour les postes stratégiques et profils atypiques
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] mt-6">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Approche classique</span>
                  <ChevronRight className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" size={20} />
                </div>
              </Link>

            </div>

            {/* Footer simplifié mais incitatif */}
            <div className="mt-8 p-5 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--text)] text-sm mb-1">
                    L'IA transforme votre recrutement
                  </p>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Plus besoin de passer des heures à trier des CV. Laissez l'IA faire le travail fastidieux pendant que vous vous concentrez sur les meilleurs talents. 
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> Essayez-la dès maintenant</span> et découvrez une nouvelle façon de recruter.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}