'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Briefcase, X, Check } from 'lucide-react';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface JobOption {
  id: string;
  title: string;
  count: number;
}

interface JobFilterSelectProps {
  jobs: JobOption[];
  value: string;               // '' = toutes les offres
  onChange: (id: string) => void;
  totalCount: number;
  theme?: 'dark' | 'light';    // dark pour IA, light pour Manuel
}

// ─────────────────────────────────────────────
// COMPOSANT
// ─────────────────────────────────────────────

export function JobFilterSelect({
  jobs,
  value,
  onChange,
  totalCount,
  theme = 'dark',
}: JobFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = jobs.find((j) => j.id === value);
  const filtered = jobs.filter((j) =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  const isDark = theme === 'dark';

  // Couleur du badge count selon le nombre
  const countColor = (count: number) => {
    if (count === 0) return isDark
      ? 'bg-white/5 text-slate-500'
      : 'bg-gray-100 text-gray-400';
    if (count >= 10) return 'bg-emerald-500/15 text-emerald-400';
    if (count >= 5)  return 'bg-cyan-500/15 text-cyan-400';
    return isDark
      ? 'bg-white/10 text-slate-300'
      : 'bg-blue-50 text-blue-500';
  };

  return (
    <div ref={ref} className="relative min-w-[220px]">

      {/* ── TRIGGER ── */}
      <button
        onClick={() => { setOpen((o) => !o); setSearch(''); }}
        className={`
          w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl
          text-sm font-medium transition-all outline-none
          ${isDark
            ? `bg-white/5 border border-white/10 text-white
               hover:bg-white/8 hover:border-white/20
               ${open ? 'ring-2 ring-cyan-500/40 border-cyan-500/40' : ''}`
            : `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white
               hover:border-blue-400/50
               ${open ? 'ring-2 ring-blue-500/20 border-blue-400/50' : ''}`
          }
        `}
      >
        <Briefcase size={14} className={isDark ? 'text-cyan-400 shrink-0' : 'text-blue-500 shrink-0'} />

        <span className="flex-1 text-left truncate">
          {selected ? selected.title : 'Toutes les offres'}
        </span>

        {/* Badge count */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
          value === ''
            ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
            : countColor(selected?.count ?? 0)
        }`}>
          {value === '' ? totalCount : (selected?.count ?? 0)}
        </span>

        {/* Clear button si filtre actif */}
        {value !== '' && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className={`shrink-0 rounded-md p-0.5 transition-colors ${
              isDark ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X size={13} />
          </button>
        )}

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <ChevronDown size={15} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
        </motion.div>
      </button>

      {/* ── DROPDOWN ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`
              absolute top-full left-0 right-0 mt-2 z-50
              rounded-2xl border shadow-2xl overflow-hidden
              ${isDark
                ? 'bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-black/60'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-gray-200/60'
              }
            `}
            style={{ minWidth: '260px' }}
          >
            {/* Barre de recherche */}
            {jobs.length > 4 && (
              <div className={`p-2 border-b ${isDark ? 'border-white/5' : 'border-gray-100 dark:border-gray-800'}`}>
                <div className="relative">
                  <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Rechercher une offre..."
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`
                      w-full pl-8 pr-3 py-2 text-xs rounded-lg outline-none
                      ${isDark
                        ? 'bg-white/5 text-white placeholder:text-slate-600 focus:bg-white/8'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-gray-100'
                      }
                    `}
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="max-h-[280px] overflow-y-auto py-1.5">

              {/* Option "Toutes les offres" */}
              <button
                onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
                  ${value === ''
                    ? isDark
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : isDark
                      ? 'text-slate-300 hover:bg-white/5'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  value === ''
                    ? isDark ? 'bg-cyan-500/20' : 'bg-blue-100 dark:bg-blue-500/20'
                    : isDark ? 'bg-white/5' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Briefcase size={13} className={value === ''
                    ? isDark ? 'text-cyan-400' : 'text-blue-500'
                    : isDark ? 'text-slate-500' : 'text-gray-400'
                  } />
                </div>
                <span className="flex-1 text-left font-medium">Toutes les offres</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {totalCount}
                </span>
                {value === '' && <Check size={13} className={isDark ? 'text-cyan-400' : 'text-blue-500'} />}
              </button>

              {/* Séparateur */}
              {filtered.length > 0 && (
                <div className={`mx-3 my-1 border-t ${isDark ? 'border-white/5' : 'border-gray-100 dark:border-gray-800'}`} />
              )}

              {/* Liste des offres */}
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className={`text-xs ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                    Aucune offre trouvée
                  </p>
                </div>
              ) : (
                filtered.map((job) => {
                  const isSelected = value === job.id;
                  return (
                    <button
                      key={job.id}
                      onClick={() => { onChange(job.id); setOpen(false); setSearch(''); }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors
                        ${isSelected
                          ? isDark
                            ? 'bg-cyan-500/10 text-cyan-400'
                            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : isDark
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      {/* Avatar offre */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px] ${
                        isSelected
                          ? isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : isDark ? 'bg-white/5 text-slate-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                      }`}>
                        {job.title.charAt(0).toUpperCase()}
                      </div>

                      <span className="flex-1 text-left truncate font-medium">{job.title}</span>

                      {/* Badge count avec couleur dynamique */}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${countColor(job.count)}`}>
                        {job.count}
                      </span>

                      {isSelected && (
                        <Check size={13} className={isDark ? 'text-cyan-400' : 'text-blue-500'} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer si beaucoup d'offres */}
            {jobs.length > 4 && filtered.length > 0 && (
              <div className={`px-3 py-2 border-t text-center ${isDark ? 'border-white/5' : 'border-gray-100 dark:border-gray-800'}`}>
                <p className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-gray-400'}`}>
                  {filtered.length} offre{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}