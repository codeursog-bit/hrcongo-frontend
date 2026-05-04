'use client';

// ============================================================================
// hooks/useBulletinTemplate.ts
// Hook partagé avec cache — 1 seul fetch par session, partagé entre toutes les pages
// ============================================================================

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BulletinTemplateConfig } from '@/types/bulletin-template';
import { TEMPLATE_DEFAULT } from '@/lib/bulletin-templates';

interface Result {
  template: BulletinTemplateConfig;
  isLoading: boolean;
  isDefault: boolean;
}

// Cache module-level — survit entre les navigations (pas de refetch inutile)
let _cache: BulletinTemplateConfig | null = null;
let _promise: Promise<BulletinTemplateConfig> | null = null;
let _isDefault = true;

async function loadTemplate(): Promise<BulletinTemplateConfig> {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = (api.get<{ config: BulletinTemplateConfig; isDefault: boolean }>('/companies/bulletin-template')
    .then(res => {
      const merged: BulletinTemplateConfig = {
        ...TEMPLATE_DEFAULT,
        ...res.config,
        style: { ...TEMPLATE_DEFAULT.style, ...(res.config?.style ?? {}) },
        blocks: res.config?.blocks?.length
          ? res.config.blocks
          : TEMPLATE_DEFAULT.blocks,
      };
      _cache = merged;
      _isDefault = res.isDefault ?? !res.config;
      return merged;
    })
    .catch(() => {
      _isDefault = true;
      return TEMPLATE_DEFAULT;
    })
  );

  return _promise;
}

/** À appeler après une sauvegarde pour forcer le rechargement */
export function invalidateBulletinTemplateCache() {
  _cache = null;
  _promise = null;
  _isDefault = true;
}

export function useBulletinTemplate(): Result {
  const [template, setTemplate] = useState<BulletinTemplateConfig>(_cache ?? TEMPLATE_DEFAULT);
  const [isLoading, setIsLoading] = useState(!_cache);
  const [isDefault, setIsDefault] = useState(_isDefault);

  useEffect(() => {
    if (_cache) {
      setTemplate(_cache);
      setIsDefault(_isDefault);
      setIsLoading(false);
      return;
    }
    loadTemplate().then(t => {
      setTemplate(t);
      setIsDefault(_isDefault);
      setIsLoading(false);
    });
  }, []);

  return { template, isLoading, isDefault };
}
