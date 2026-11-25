'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import DocumentRenderer from '@/components/DocumentRenderer';
import { authService } from '@/lib/services/authService';
import { loadAdministrativeLayout } from '@/lib/document-engine/administrative-api';
import { createAdministrativeLayout, isAdministrativePreset, type AdministrativeInput } from '@/lib/document-engine/administrative';
import type { DocLayout } from '@/types/document-layout';
import { buildContext } from '@/lib/document-engine/registry';

export default function EngineRequestDocument({ request, id }: { request: AdministrativeInput; id?: string }) {
  const [layout, setLayout] = useState<DocLayout>();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const { docType, input } = request;
  const fallbackId = useId();
  const declared = 'id' in input.company ? input.company.id : undefined;
  const data = useMemo(() => buildContext(request), [request]);

  useEffect(() => {
    let active = true;
    setLayout(undefined);
    const sessionCompany = authService.getCurrentUser()?.companyId;
    if (!sessionCompany || (declared && declared !== sessionCompany)
      || (!declared && /^\/(pme|cabinet|portefeuille)\//.test(window.location.pathname))) {
      setLayout(createAdministrativeLayout(docType));
      return;
    }
    loadAdministrativeLayout(sessionCompany, docType).then(saved => {
      if (active) setLayout(saved?.config?.docType === docType ? saved.config
        : createAdministrativeLayout(docType, isAdministrativePreset(saved?.basePreset) ? saved.basePreset : undefined));
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [docType, declared, attempt]);

  return <div id={id ?? fallbackId} data-engine-request={docType} data-absence-print-root={docType === 'ABSENCE' ? 'true' : undefined}
    data-document-pending={layout ? undefined : ''}>
    {layout
      ? <DocumentRenderer docType={docType} layout={layout} data={data} />
      : failed
        ? <p role="alert">Le modèle n’a pas pu être chargé. <button type="button" className="underline" onClick={() => {
          setFailed(false); setAttempt(value => value + 1);
        }}>Réessayer</button></p>
        : <p role="status">Chargement du modèle…</p>}
  </div>;
}
