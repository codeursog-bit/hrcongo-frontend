//auth/layout

'use client';

import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-theme min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {children}
    </div>
  );
}