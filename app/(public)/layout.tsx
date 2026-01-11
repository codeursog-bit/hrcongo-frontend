import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-sky-500 selection:text-white">
      {/* Navbar publique possible ici plus tard */}
      {children}
      {/* Footer public possible ici plus tard */}
    </div>
  );
}
