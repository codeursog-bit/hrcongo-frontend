'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, LayoutDashboard, Users, LifeBuoy, Map } from 'lucide-react';
import { ErrorLayout } from '@/components/ui/ErrorLayout';

const HR_TIPS = [
  "💡 Astuce : Saviez-vous que vous pouvez générer tous vos bulletins en 1 clic ?",
  "💡 Astuce : Les congés sont importants ! Vérifiez votre solde dans 'Mon Espace'.",
  "💡 Astuce : Mettez à jour votre photo de profil pour que l'équipe vous reconnaisse.",
  "💡 Astuce : Les heures supplémentaires doivent être validées avant le 25 du mois."
];

export default function NotFound() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    setTip(HR_TIPS[Math.floor(Math.random() * HR_TIPS.length)]);
  }, []);

  return (
    <ErrorLayout
      code="404"
      title="Oups ! Page introuvable"
      description="Il semblerait que cette page se soit mise en congé sans préavis 😄. Elle a peut-être été déplacée ou n'existe plus."
      icon={Map}
      gradient="from-sky-500 to-blue-600"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Que cherchez-vous ?" 
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all shadow-sm group-hover:shadow-md"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500" size={18} />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* ✅ CORRECTIF : lien cassé "/dashoard" (faute de frappe) → "/dashboard",
              et bouton renommé "Retour au Dashboard" — il n'a jamais mené à
              l'accueil public, seulement au tableau de bord. */}
          <Link href="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-500/20 hover:scale-105">
            <LayoutDashboard size={18} /> Retour au Dashboard
          </Link>
          <Link href="/employes" className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Users size={18} /> Voir mes employés
          </Link>
        </div>

        {/* Helper Links */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 mb-3">{tip}</p>
          <div className="flex items-center justify-between">
            <Link href="#" className="inline-flex items-center gap-1 text-sm text-sky-500 hover:underline font-medium">
              <LifeBuoy size={14} /> Contacter le support IT
            </Link>
            {/* Discret, non mis en avant — même traitement que app/error.tsx */}
            <Link href="/" className="text-xs text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-300">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </ErrorLayout>
  );
}