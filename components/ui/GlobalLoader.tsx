import React from 'react';
import { Hexagon } from 'lucide-react';

export const GlobalLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] py-20">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse rounded-full" />
        <div className="relative animate-[spin_3s_linear_infinite]">
          <Hexagon size={64} className="text-emerald-500/80 stroke-[1.5]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-ping" />
        </div>
      </div>
      <p className="mt-8 text-sm font-mono font-bold text-emerald-500/80 tracking-[0.2em] animate-pulse uppercase">
        Chargement...
      </p>
    </div>
  );
};