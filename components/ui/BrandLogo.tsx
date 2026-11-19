'use client';
import React, { useState } from 'react';
import { KonzaMark } from './KonzaMark';
import './brand-logo.css';

export function BrandLogo({ src, name, size = 'sidebar' }: { src?: string | null; name?: string | null; size?: 'sidebar' | 'compact' | 'loader' }) {
  const [failed, setFailed] = useState<string | null>(null);
  const custom = !!src && src !== failed;
  return <span className={`konza-brand-logo konza-brand-logo--${size}${custom ? ' is-company' : ''}`}>
    {custom ? <img src={src} alt={name || 'Logo de l’entreprise'} onError={() => setFailed(src)} /> : size === 'compact' ? <KonzaMark size={32} /> : <>
      <img className="konza-brand-light" src="/logos/konza_logo_h_color.png" alt="Konza RH" width={507} height={240} />
      <img className="konza-brand-dark" src="/logos/konza_logo_h_white.png" alt="Konza RH" width={507} height={240} />
    </>}
  </span>;
}
