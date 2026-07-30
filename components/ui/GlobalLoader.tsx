
import React from 'react';
import { Hexagon } from 'lucide-react';

export const GlobalLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[60vh] py-20">
      <div className="relative">
        {/* Effet de lueur derrière */}
        <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
        
        {/* Hexagone rotatif */}
        <div className="relative animate-[spin_3s_linear_infinite]">
          <Hexagon size={64} className="text-cyan-500/80 stroke-[1.5]" />
        </div>
        
        {/* Hexagone central fixe ou contre-rotatif pour effet complexe */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-ping"></div>
        </div>
      </div>
      
      <p className="mt-8 text-sm font-mono font-bold text-cyan-500/80 tracking-[0.2em] animate-pulse uppercase">
        Chargement...
      </p>
    </div>
  );
};
