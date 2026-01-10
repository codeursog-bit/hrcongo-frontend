
'use client';

import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-sky-500 selection:text-white">
      {/* Ici on pourrait mettre une Navbar commune à toutes les pages publiques si on l'extrait de la LandingPage */}
      {children}
      {/* Ici on pourrait mettre un Footer commun */}
    </div>
  );
}
