'use client';

// ============================================================================
// 📁 components/SlideOver.tsx
// ✅ Panneau latéral générique (overlay + animation) réutilisé par les
//    sidebars de détail (employé du jour, département) dans le module
//    Présences. Pas de logique métier ici — juste la coquille.
// ============================================================================

import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SlideOver({
  open, onClose, title, subtitle, children, widthClass = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed top-0 right-0 h-full w-full ${widthClass} bg-white dark:bg-gray-800 z-50 shadow-2xl overflow-y-auto`}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-5 flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h3>
                {subtitle && <p className="text-sm text-gray-400 truncate">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
