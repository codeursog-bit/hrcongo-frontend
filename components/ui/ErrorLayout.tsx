'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ErrorLayoutProps {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  /** Conservé pour compatibilité avec les anciens appels ; ignoré (le rendu utilise les tokens). */
  gradient?: string;
}

export const ErrorLayout: React.FC<ErrorLayoutProps> = ({
  code,
  title,
  description,
  icon: Icon,
  children,
}) => {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <motion.div
        initial={reduceMotion ? false : { y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-xl text-center px-6 py-10 sm:px-10 sm:py-12"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-card, 20px)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
          aria-hidden="true"
        >
          <Icon size={30} strokeWidth={1.5} />
        </div>

        <span
          className="inline-block mb-4 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          {code}
        </span>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3" style={{ color: 'var(--text)' }}>
          {title}
        </h1>
        <p className="text-base leading-relaxed mx-auto mb-8 max-w-md" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>

        {children && <div className="flex flex-col items-center gap-4">{children}</div>}
      </motion.div>
    </div>
  );
};
