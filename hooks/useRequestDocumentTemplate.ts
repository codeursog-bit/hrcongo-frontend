'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/lib/services/authService';
import { loadAdministrativeLayout, type SavedAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import { historicAdministrativePreset, type AdministrativeType } from '@/lib/document-engine/administrative';
import { isDocumentLayoutActive } from '@/lib/document-template';

export function useRequestDocumentTemplate(type: AdministrativeType, company?: { id?: string; documentTemplate?: string | null } | null) {
  const original = company?.documentTemplate;
  const id = company?.id;
  const sessionCompany = authService.getCurrentUser()?.companyId;
  const [result, setResult] = useState<{ type: AdministrativeType; companyId: string; layout: SavedAdministrativeLayout | null }>();
  useEffect(() => {
    if (!sessionCompany || id && sessionCompany !== id
      || !id && /^\/(pme|cabinet|portefeuille)\//.test(window.location.pathname)) return;
    let active = true;
    loadAdministrativeLayout(sessionCompany, type).then(layout => {
      if (active) setResult({ type, companyId: sessionCompany, layout });
    }).catch(() => { /* Le modèle de l’entreprise reste utilisable. */ });
    return () => { active = false; };
  }, [id, type, sessionCompany]);
  const layout = result?.type === type && result.companyId === sessionCompany && (!id || result.companyId === id)
    ? result.layout : null;
  if (!layout || !isDocumentLayoutActive(layout.config, original)) return original;
  if (!layout.config?.useOriginal) return 'CUSTOM';
  const historic = historicAdministrativePreset(layout.basePreset)?.template;
  return historic === 'ORCA' && original !== 'ORCA' ? original : historic ?? original;
}
