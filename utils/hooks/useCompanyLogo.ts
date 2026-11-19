'use client';

// hooks/useCompanyLogo.ts
// Logo (et nom) de l'entreprise de la personne connectée, pour la sidebar.
// - Par défaut : { logo: null } → la sidebar affiche le logo Konza.
// - Si l'entreprise a un logo : il est affiché à la place.
// Le dernier résultat est gardé en cache local pour éviter tout clignotement au chargement,
// puis revalidé auprès du serveur (GET /companies/mine). Aucune route nouvelle.
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

/** À émettre (window.dispatchEvent) après un changement de logo pour rafraîchir le menu. */
export const COMPANY_UPDATED_EVENT = 'konza:company-updated';

export interface CompanyBrand { logo: string | null; name: string | null }

const CACHE_PREFIX = 'konza:company-brand:';

const safeLogo = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return /^(https?:\/\/|\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(v) ? v : null;
};

const cacheKey = (): string | null => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.companyId ? CACHE_PREFIX + user.companyId : null;
  } catch { return null; }
};

export function useCompanyLogo(enabled = true): CompanyBrand {
  const [brand, setBrand] = useState<CompanyBrand>({ logo: null, name: null });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const key = cacheKey();
    if (key) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached) setBrand({ logo: safeLogo(cached.logo), name: typeof cached.name === 'string' ? cached.name : null });
      } catch { /* cache illisible : ignoré */ }
    }

    const load = async () => {
      try {
        const company: any = await api.get('/companies/mine');
        if (cancelled) return;
        const next: CompanyBrand = { logo: safeLogo(company?.logo), name: typeof company?.name === 'string' ? company.name : null };
        setBrand(next);
        const k = cacheKey();
        if (k) { try { localStorage.setItem(k, JSON.stringify(next)); } catch { /* stockage indisponible */ } }
      } catch { /* pas d'entreprise (ex. super admin) ou réseau : logo Konza par défaut */ }
    };

    void load();
    const onUpdate = () => { void load(); };
    window.addEventListener(COMPANY_UPDATED_EVENT, onUpdate);
    return () => { cancelled = true; window.removeEventListener(COMPANY_UPDATED_EVENT, onUpdate); };
  }, [enabled]);

  return brand;
}
