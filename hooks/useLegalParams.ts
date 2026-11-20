'use client';

// ============================================================================
// 📁 hooks/useLegalParams.ts
// Règles légales EN VIGUEUR (CNSS, TUS, ITS, congés), pilotées par le super
// administrateur. Sert à AFFICHER les bons taux dans les écrans (lecture seule).
// Tant que la requête n'a pas répondu — ou si elle échoue — on affiche les
// valeurs d'origine (celles en vigueur avant le référentiel).
// ============================================================================

import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export interface LegalParamsView {
  fiscal: { abattementRate: number; partsMode: string; maxParts: number; regimeLabel: string };
  cnss: {
    salarialRate: number; pensionCeiling: number; socialCeiling: number;
    employerPensionRate: number; employerFamilyRate: number; employerAccidentRate: number;
  };
  tus: { dgiRate: number; cnssRate: number };
  leave: { annualDays: number; maxCumulYears: number; minMonthsBeforeLeave: number };
}

export const LEGAL_FALLBACK: LegalParamsView = {
  fiscal: { abattementRate: 0.2, partsMode: 'FAMILY_QUOTIENT', maxParts: 6.5, regimeLabel: 'ITS' },
  cnss: {
    salarialRate: 0.04, pensionCeiling: 1_200_000, socialCeiling: 600_000,
    employerPensionRate: 0.08, employerFamilyRate: 0.1003, employerAccidentRate: 0.0225,
  },
  tus: { dgiRate: 0.02025, cnssRate: 0.05475 },
  leave: { annualDays: 26, maxCumulYears: 3, minMonthsBeforeLeave: 12 },
};

/** 0.1003 → « 10,03 % » */
export const pctFr = (r: number) => `${(+(r * 100).toFixed(3)).toLocaleString('fr-FR')} %`;
/** 1200000 → « 1 200 000 » */
export const fcfaFr = (n: number) => Math.round(n).toLocaleString('fr-FR');

export function useLegalParams(): LegalParamsView {
  const [p, setP] = useState<LegalParamsView>(LEGAL_FALLBACK);
  useEffect(() => {
    let alive = true;
    api.get<any>('/legal-parameters/effective')
      .then((d) => { if (alive && d?.cnss && d?.tus) setP({ ...LEGAL_FALLBACK, ...d, leave: { ...LEGAL_FALLBACK.leave, ...(d.leave || {}) } }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return p;
}