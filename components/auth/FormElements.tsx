// ============================================================================
// 📁 components/auth/FormElements.tsx
// Primitives de formulaire partagées par toutes les pages auth.
// Un seul endroit à modifier pour que login / register / forgot / reset /
// invitations restent identiques et alignés sur le design system de l'app.
// Styles : components/auth/auth.css (tokens uniquement).
// ============================================================================
'use client';

import React, { forwardRef, useEffect, useId, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './auth.css';

// ── Message d'erreur sous un champ ───────────────────────────────────────────
function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="au-error" role="alert">
      <AlertCircle size={13} /> {children}
    </p>
  );
}

// ── Champ texte avec icône ───────────────────────────────────────────────────
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ icon: Icon, error, label, className = '', id, ...props }, ref) => {
    const generated = useId();
    const fieldId = id || generated;
    return (
      <div>
        {label && <label htmlFor={fieldId} className="au-label">{label}</label>}
        <div className={`au-input-wrap ${Icon ? 'au-has-icon' : ''} ${error ? 'au-invalid' : ''}`}>
          {Icon && <span className="au-input-icon"><Icon size={17} /></span>}
          <input
            ref={ref}
            {...props}
            id={fieldId}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={`au-input ${className}`}
          />
        </div>
        {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
      </div>
    );
  }
);
TextField.displayName = 'TextField';

// ── Champ mot de passe (avec bouton afficher / masquer) ──────────────────────
interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ icon: Icon, error, label, className = '', id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const generated = useId();
    const fieldId = id || generated;
    return (
      <div>
        {label && <label htmlFor={fieldId} className="au-label">{label}</label>}
        <div className={`au-input-wrap au-has-toggle ${Icon ? 'au-has-icon' : ''} ${error ? 'au-invalid' : ''}`}>
          {Icon && <span className="au-input-icon"><Icon size={17} /></span>}
          <input
            ref={ref}
            {...props}
            id={fieldId}
            type={visible ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            className={`au-input ${className}`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            className="au-eye"
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
        {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
      </div>
    );
  }
);
PasswordField.displayName = 'PasswordField';

// ── Bouton principal ─────────────────────────────────────────────────────────
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
      aria-busy={loading || undefined}
      className={`au-btn au-btn-primary ${className}`}
    >
      {loading ? <Loader2 size={18} className="au-spin" aria-label="Chargement" /> : children}
    </button>
  );
}

// ── Bouton secondaire ────────────────────────────────────────────────────────
export function SecondaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`au-btn au-btn-secondary ${className}`}>
      {children}
    </button>
  );
}

// ── Bannière d'erreur serveur ────────────────────────────────────────────────
export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        style={{ overflow: 'hidden' }}
      >
        <div className="au-banner au-banner-error">
          <AlertCircle size={16} />
          <span>{children}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Bannière d'info neutre (ex : parrainage) ─────────────────────────────────
export function InfoBanner({ children }: { children: React.ReactNode }) {
  return <div className="au-banner au-banner-info">{children}</div>;
}

// ── Bannière d'avertissement (ex : changement de mot de passe obligatoire) ───
export function WarningBanner({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="au-banner au-banner-warning">
      <AlertCircle size={17} />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  );
}

// ── Critère de mot de passe (checklist) ──────────────────────────────────────
export function Criteria({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`au-crit ${met ? 'is-met' : ''}`}>
      {met ? <CheckCircle2 size={14} className="shrink-0" /> : <span className="au-crit-dot" />}
      <span>{text}</span>
    </div>
  );
}

// ── Barre de force du mot de passe ───────────────────────────────────────────
const STRENGTH_LABELS = ['', 'Faible', 'Moyen', 'Bon', 'Excellent'];
const STRENGTH_BARS = ['', 'var(--danger)', 'var(--accent-2)', 'var(--lime)', 'var(--green)'];
const STRENGTH_TEXT = ['', 'var(--danger-text)', 'var(--warning-text)', 'var(--warning-text)', 'var(--success-text)'];

export function PasswordStrength({ score }: { score: number }) {
  if (score === 0) return null;
  return (
    <div className="au-strength" aria-live="polite">
      <div className="au-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} style={i <= score ? { backgroundColor: STRENGTH_BARS[score] } : undefined} />
        ))}
      </div>
      <span className="au-strength-label" style={{ color: STRENGTH_TEXT[score] }}>
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}

// ── Séparateur « ou » ────────────────────────────────────────────────────────
export function Divider({ children }: { children?: React.ReactNode }) {
  if (!children) return <div className="au-divider-plain" />;
  return <div className="au-divider">{children}</div>;
}

// ── Fenêtre modale (2FA, changement de mot de passe…) ────────────────────────
// Panneau flottant sur ordinateur, « bottom sheet » sur mobile.
// onClose (optionnel) : appelé avec la touche Échap.
export function AuthModal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="au-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className="au-modal"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}