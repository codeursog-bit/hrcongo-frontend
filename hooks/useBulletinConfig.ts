'use client';

// ============================================================================
// hooks/useBulletinConfig.ts
//
// Hook universel — charge la config du bulletin (mode template OU mode canvas).
// Un seul fetch par session, partagé entre toutes les pages.
//
// Remplace useBulletinTemplate dans paie/[id] et ma-paie.
// Les deux hooks coexistent — useBulletinTemplate reste pour la compatibilité.
// ============================================================================

import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { BulletinTemplateConfig } from '@/types/bulletin-template';
import type { CanvasLayout } from '@/types/canvas-block';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { EMPTY_CANVAS } from '@/types/canvas-block';

export type BulletinMode = 'template' | 'canvas';

export interface BulletinConfig {
  mode:           BulletinMode;
  templateConfig: BulletinTemplateConfig;   // utilisé si mode === 'template'
  canvasLayout:   CanvasLayout;             // utilisé si mode === 'canvas'
}

const DEFAULT_CONFIG: BulletinConfig = {
  mode:           'template',
  templateConfig: getBaseTemplate('default'),
  canvasLayout:   { ...EMPTY_CANVAS },
};

// Cache module-level
let _cache: BulletinConfig | null = null;
let _promise: Promise<BulletinConfig> | null = null;

async function loadConfig(): Promise<BulletinConfig> {
  if (_cache)   return _cache;
  if (_promise) return _promise;

  _promise = api
    .get<{ config: any }>('/companies/bulletin-template')
    .then(res => {
      const saved = res?.config;
      if (!saved) return DEFAULT_CONFIG;

      // Mode canvas
      if (saved.mode === 'canvas' && saved.canvasLayout) {
        const config: BulletinConfig = {
          mode:           'canvas',
          templateConfig: getBaseTemplate('default'),
          canvasLayout:   saved.canvasLayout,
        };
        _cache = config;
        return config;
      }

      // Mode template (défaut)
      const base  = getBaseTemplate(saved.templateId ?? 'default');
      const config: BulletinConfig = {
        mode:           'template',
        templateConfig: {
          ...base, ...saved,
          style:  { ...base.style,  ...saved.style  },
          blocks: saved.blocks?.length ? saved.blocks : base.blocks,
        },
        canvasLayout: { ...EMPTY_CANVAS },
      };
      _cache = config;
      return config;
    })
    .catch(() => DEFAULT_CONFIG);

  return _promise;
}

export function invalidateBulletinConfigCache() {
  _cache   = null;
  _promise = null;
}

export function useBulletinConfig(): { config: BulletinConfig; isLoading: boolean } {
  const [config, setConfig]     = useState<BulletinConfig>(_cache ?? DEFAULT_CONFIG);
  const [isLoading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setConfig(_cache); setLoading(false); return; }
    loadConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  return { config, isLoading };
}

// Garde la compatibilité avec l'ancien hook useBulletinTemplate
export function useBulletinTemplate() {
  const { config, isLoading } = useBulletinConfig();
  return { template: config.templateConfig, isLoading };
}

export function invalidateBulletinTemplateCache() {
  invalidateBulletinConfigCache();
}
