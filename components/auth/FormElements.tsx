// ============================================================================
// 📁 components/auth/FormElements.tsx
// Primitives de formulaire partagées par login / register / forgot / reset.
// Un seul endroit à modifier pour que les 4 pages restent visuellement
// identiques : bordures ultra-fines, focus émeraude, micro-interactions.
// ============================================================================
'use client';

import React, { forwardRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Champ texte avec icône ───────────────────────────────────────────────────
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ icon: Icon, error, label, className = '', ...props }, ref) => {
    return (
      <div>
        {label && <label className="mb-1.5 block text-[13px] font-medium text-[#C9CBD1]">{label}</label>}
        <div className="group relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon
                size={16}
                className={`transition-colors ${error ? 'text-red-400' : 'text-[#5A5E66] group-focus-within:text-[#10B981]'}`}
              />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            className={`block w-full rounded-xl border bg-white/[0.03] py-3 text-[14px] text-[#FAFAFA] placeholder-[#5A5E66] outline-none transition-all focus:bg-white/[0.05] ${
              Icon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${
              error
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
                : 'border-white/[0.08] focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/20'
            } ${className}`}
          />
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-red-400">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }
);
TextField.displayName = 'TextField';

// ── Champ mot de passe (avec toggle visibilité) ──────────────────────────────
interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ icon: Icon, error, label, className = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div>
        {label && <label className="mb-1.5 block text-[13px] font-medium text-[#C9CBD1]">{label}</label>}
        <div className="group relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Icon
                size={16}
                className={`transition-colors ${error ? 'text-red-400' : 'text-[#5A5E66] group-focus-within:text-[#10B981]'}`}
              />
            </div>
          )}
          <input
            ref={ref}
            {...props}
            type={visible ? 'text' : 'password'}
            className={`block w-full rounded-xl border bg-white/[0.03] py-3 pr-11 text-[14px] text-[#FAFAFA] placeholder-[#5A5E66] outline-none transition-all focus:bg-white/[0.05] ${
              Icon ? 'pl-10' : 'pl-3.5'
            } ${
              error
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20'
                : 'border-white/[0.08] focus:border-[#10B981]/50 focus:ring-1 focus:ring-[#10B981]/20'
            } ${className}`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#5A5E66] transition-colors hover:text-[#FAFAFA]"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-red-400">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }
);
PasswordField.displayName = 'PasswordField';

// ── Bouton principal (identique au CTA "Démarrer gratuitement" de la landing) ─
export function PrimaryButton({
  children,
  loading,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl bg-[#FAFAFA] py-3.5 text-[14px] font-medium text-black transition-all hover:bg-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 size={17} className="animate-spin" /> : children}
    </button>
  );
}

// ── Bouton secondaire (bordure fine, fond transparent) ───────────────────────
export function SecondaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3.5 text-[14px] font-medium text-[#FAFAFA] transition-colors hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// ── Bannière d'erreur serveur ─────────────────────────────────────────────────
export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 text-[13px] text-red-300"
      >
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
        <span>{children}</span>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Bannière d'info neutre (ex: parrainage) ───────────────────────────────────
export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#10B981]/25 bg-[#10B981]/[0.08] px-3.5 py-3 text-[13px] text-[#8EE0C0]">
      {children}
    </div>
  );
}

// ── Critère de mot de passe (checklist) ───────────────────────────────────────
export function Criteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {met ? (
        <CheckCircle2 size={13} className="shrink-0 text-[#10B981]" />
      ) : (
        <div className="h-[13px] w-[13px] shrink-0 rounded-full border border-white/15" />
      )}
      <span className={met ? 'text-[#FAFAFA]' : 'text-[#5A5E66]'}>{text}</span>
    </div>
  );
}

// ── Barre de force du mot de passe ────────────────────────────────────────────
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#EAB308', '#10B981'];

export function PasswordStrength({ score }: { score: number }) {
  if (score === 0) return null;
  return (
    <div className="mt-2.5 flex items-center gap-3">
      <div className="flex h-1 flex-1 gap-1 overflow-hidden rounded-full bg-white/[0.08]">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-full flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i <= score ? STRENGTH_COLORS[score] : 'transparent' }}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}

// ── Séparateur "ou" ────────────────────────────────────────────────────────────
export function Divider({ children }: { children?: React.ReactNode }) {
  if (!children) return <div className="border-t border-white/[0.08]" />;
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/[0.08]" />
      <span className="text-[12px] text-[#5A5E66]">{children}</span>
      <div className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}