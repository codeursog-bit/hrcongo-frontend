'use client';

import React from 'react';
import { Hexagon, Shield, FileCheck } from 'lucide-react';

export default function PayslipFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 print:border-gray-300 space-y-4">
      {/* CERTIFICATIONS */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileCheck size={14} className="text-emerald-500 print:text-emerald-600" />
            <span>Document certifié conforme</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-sky-500 print:text-sky-600" />
            <span>Conforme Code du Travail RDC</span>
          </div>
        </div>
        <span className="font-medium">
          Généré le {new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
          })}
        </span>
      </div>

      {/* MENTIONS LÉGALES */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/30 print:bg-gray-50 rounded-lg text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 space-y-1">
        <p className="font-medium">📋 Mentions légales :</p>
        <ul className="space-y-0.5 ml-4">
          <li>• Ce bulletin doit être conservé sans limitation de durée (Art. L3243-4)</li>
          <li>• Les cotisations sociales sont versées mensuellement à la CNSS</li>
          <li>• L'impôt sur les traitements et salaires (ITS) est prélevé à la source</li>
        </ul>
      </div>

      {/* BRANDING */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 print:border-gray-300 opacity-70 print:opacity-100">
        <Hexagon size={16} className="text-sky-500 print:text-gray-700" />
        <span className="font-bold text-sm text-gray-600 dark:text-gray-400 print:text-gray-700 tracking-wide uppercase">
          Propulsé par HRCongo
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-600 print:text-gray-600">
          • SIRH Nouvelle Génération
        </span>
      </div>

      {/* FILIGRANE PRINT */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-2">
        <p>HRCongo.com - Gestion RH Cloud • Support: contact@hrcongo.com</p>
      </div>
    </div>
  );
}