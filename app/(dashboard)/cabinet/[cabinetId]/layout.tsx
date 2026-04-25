// app/(dashboard)/cabinet/[cabinetId]/layout.tsx
// Layout cabinet — ErrorBoundary autour de CabinetOnboardingChecklist
// pour éviter que son crash/loop bloque toutes les pages cabinet

'use client';

import React from 'react';
import CabinetOnboardingChecklist from '@/components/onboarding/CabinetOnboardingChecklist';

// ─── ErrorBoundary simple ─────────────────────────────────────────────────────
// Isole le CabinetOnboardingChecklist : s'il plante ou boucle,
// le reste de la page reste fonctionnel.

class ChecklistErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[CabinetOnboardingChecklist] Erreur isolée :', error.message);
  }

  render() {
    // Si le checklist plante → on l'ignore silencieusement
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ChecklistErrorBoundary>
        <CabinetOnboardingChecklist />
      </ChecklistErrorBoundary>
      {children}
    </>
  );
}