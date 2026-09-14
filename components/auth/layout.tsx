// app/auth/layout.tsx
// Fond aligné sur AuthShell pour éviter tout flash blanc au chargement.

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050607]">
      {children}
    </div>
  );
}