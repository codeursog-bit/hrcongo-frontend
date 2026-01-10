'use client';

import React from 'react';
import Link from 'next/link';
import { User, Upload, FileSpreadsheet, Zap, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewEmployeePage() {
  return (
    <div className="w-full flex justify-center items-center min-h-[calc(100vh-100px)] py-8 px-4">
      <div className="w-full max-w-5xl">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800/50 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-100 dark:border-white/5 mb-6">
            <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
              <User className="text-sky-600 dark:text-sky-400" size={20} />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Nouvel Employé</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Comment souhaitez-vous procéder ?
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Choisissez la méthode la plus adaptée à votre situation
          </p>
        </motion.div>

        {/* Cards Grid - 100% TON STYLE */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* CARD 1: Import Excel */}
          <Link href="/employes/import">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 border-2 border-gray-200 dark:border-white/10 hover:border-sky-500 dark:hover:border-sky-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-purple-500/5 dark:from-sky-400/10 dark:via-indigo-400/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Icon Circle */}
                <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-sky-500/20">
                  <Upload className="text-sky-600 dark:text-sky-400" size={32} />
                </div>
                
                {/* Badge "Rapide" */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-500 to-indigo-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Zap size={12} />
                  Rapide
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  Import Excel
                  <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-sky-600 dark:text-sky-400" size={24} />
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Vous avez déjà une liste dans Excel ? Importez plusieurs employés en quelques clics avec notre assistant intelligent.
                </p>

                {/* Features List - TON STYLE */}
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileSpreadsheet size={14} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <span>Importez 10, 50, 100+ employés simultanément</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>Détection automatique des colonnes</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Validation des données avant import</span>
                  </li>
                </ul>

                {/* CTA Badge */}
                <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
                  <span>Commencer l'import</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* CARD 2: Création Manuelle */}
          <Link href="/employes/nouveau/formulaire">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group relative bg-white dark:bg-gray-800/50 backdrop-blur-md rounded-3xl p-8 border-2 border-gray-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-xl cursor-pointer overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-400/10 dark:via-teal-400/10 dark:to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Icon Circle */}
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-emerald-500/20">
                  <User className="text-emerald-600 dark:text-emerald-400" size={32} />
                </div>

                {/* Badge "Complet" */}
                <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <CheckCircle2 size={12} />
                  Complet
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  Création Manuelle
                  <ChevronRight className="opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-emerald-600 dark:text-emerald-400" size={24} />
                </h2>
                
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Créez un dossier RH complet avec notre formulaire guidé en 3 étapes simples. Idéal pour un ou quelques employés.
                </p>

                {/* Features List - TON STYLE */}
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span>Formulaire guidé en 3 étapes intuitives</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileSpreadsheet size={14} className="text-sky-600 dark:text-sky-400" />
                    </div>
                    <span>Tous les détails administratifs et contractuels</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>Upload de photo et validation finale</span>
                  </li>
                </ul>

                {/* CTA Badge */}
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <span>Créer manuellement</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </Link>

        </div>

        {/* Help Text - TON STYLE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm px-5 py-3 rounded-full border border-gray-100 dark:border-white/5">
            <div className="w-5 h-5 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center">
              <Clock size={12} className="text-sky-600 dark:text-sky-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 Vous pourrez toujours modifier ou compléter les informations plus tard
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}