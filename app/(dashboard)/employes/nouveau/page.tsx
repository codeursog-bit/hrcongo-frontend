'use client';

import React from 'react';
import Link from 'next/link';
import { User, Upload, FileSpreadsheet, Zap, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBasePath } from '@/hooks/useBasePath';

export default function NewEmployeePage() {
  const { bp } = useBasePath();
  return (
    <div className="w-full flex justify-center items-center min-h-[calc(100vh-100px)] py-8 px-4">
      <div className="w-full max-w-5xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <User className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
            <span className="font-bold" style={{ color: 'var(--text)' }}>Nouvel Employé</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--text)' }}>
            Comment souhaitez-vous procéder ?
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            Choisissez la méthode la plus adaptée à votre situation
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* CARD 1: Import Excel */}
          <Link href={bp('/employes/import')}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Upload className="text-white" size={26} />
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <Zap size={11} /> Rapide
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  Import Excel
                  <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-emerald-500" size={20} />
                </h2>

                <p className="mb-6 leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>
                  Vous avez déjà une liste dans Excel ? Importez plusieurs employés en quelques clics avec notre assistant intelligent.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {[
                    'Importez 10, 50, 100+ employés simultanément',
                    'Détection automatique des colonnes',
                    'Validation des données avant import',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <span>Commencer l'import</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* CARD 2: Création Manuelle */}
          <Link href={bp('/employes/nouveau/formulaire')}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden h-full"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-amber-500 rounded-xl flex items-center justify-center">
                    <User className="text-white" size={26} />
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    <CheckCircle2 size={11} /> Complet
                  </span>
                </div>

                <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  Création Manuelle
                  <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-amber-500" size={20} />
                </h2>

                <p className="mb-6 leading-relaxed text-sm" style={{ color: 'var(--text-muted)' }}>
                  Créez un dossier RH complet avec notre formulaire guidé en plusieurs étapes simples. Idéal pour un ou quelques employés.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {[
                    'Formulaire guidé en plusieurs étapes intuitives',
                    'Tous les détails administratifs et contractuels',
                    'Upload de photo et validation finale',
                  ].map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <span>Créer manuellement</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </Link>

        </div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <Clock size={14} className="text-emerald-500" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              💡 Vous pourrez toujours modifier ou compléter les informations plus tard
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}