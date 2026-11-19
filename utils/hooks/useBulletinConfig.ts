'use client';

// ============================================================================
// hooks/useBulletinConfig.ts
//
// Hook universel — charge la config bulletin (template ou canvas).
//
// ARCHITECTURE :
//   • Sauvegarde écrit dans localStorage + invalide le cache API
//   • Chaque page lit depuis localStorage au montage si le cache API est vide
//   • Après invalidation, le hook recharge depuis l'API au prochain montage
//   • Utilise un CustomEvent pour notifier les composants déjà montés
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import type { BulletinTemplateConfig } from '@/types/bulletin-template';
import type { CanvasLayout } from '@/types/canvas-block';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import { EMPTY_CANVAS } from '@/types/canvas-block';

export type BulletinMode = 'template' | 'canvas';

export interface BulletinConfig {
  mode:           BulletinMode;
  templateConfig: BulletinTemplateConfig;
  canvasLayout:   CanvasLayout;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const LS_KEY   = 'konzarh_bulletin_config_v2';
const EV_NAME  = 'konzarh:bulletin-updated';

const DEFAULT_CONFIG: BulletinConfig = {
  mode:           'template',
  templateConfig: getBaseTemplate('default'),
  canvasLayout:   { ...EMPTY_CANVAS },
};

// Cache module-level — partagé dans la même session
let _cache:   BulletinConfig | null          = null;
let _loading: Promise<BulletinConfig> | null = null;

// ─── Helpers localStorage ─────────────────────────────────────────────────────

function lsRead(): BulletinConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as BulletinConfig) : null;
  } catch { return null; }
}

function lsWrite(c: BulletinConfig) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch {}
}

function lsClear() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ─── Parser réponse API ───────────────────────────────────────────────────────

function parse(saved: any): BulletinConfig {
  if (!saved) return DEFAULT_CONFIG;

  if (saved.mode === 'canvas' && saved.canvasLayout) {
    return {
      mode:           'canvas',
      templateConfig: getBaseTemplate('default'),
      canvasLayout:   saved.canvasLayout,
    };
  }

  const base = getBaseTemplate(saved.templateId ?? 'default');
  return {
    mode: 'template',
    templateConfig: {
      ...base, ...saved,
      style:  { ...base.style,  ...saved.style  },
      blocks: saved.blocks?.length ? saved.blocks : base.blocks,
    },
    canvasLayout: { ...EMPTY_CANVAS },
  };
}

// ─── Chargement depuis API ────────────────────────────────────────────────────

async function fetchConfig(): Promise<BulletinConfig> {
  if (_cache)   return _cache;
  if (_loading) return _loading;

  _loading = api
    .get<{ config: any }>('/companies/bulletin-template')
    .then(res => {
      const config = parse(res?.config);
      _cache   = config;
      _loading = null;
      lsWrite(config);
      return config;
    })
    .catch(() => {
      _loading = null;
      const local = lsRead();
      if (local) { _cache = local; return local; }
      return DEFAULT_CONFIG;
    });

  return _loading;
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

export function invalidateBulletinConfigCache() {
  _cache   = null;
  _loading = null;
  lsClear();
  // Notifier tous les composants montés
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EV_NAME));
  }
}

export function invalidateBulletinTemplateCache() {
  invalidateBulletinConfigCache();
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useBulletinConfig(): { config: BulletinConfig; isLoading: boolean } {
  // Init depuis mémoire ou localStorage pour éviter le flash
  const [config, setConfig]     = useState<BulletinConfig>(_cache ?? lsRead() ?? DEFAULT_CONFIG);
  const [isLoading, setLoading] = useState<boolean>(!_cache);

  const reload = useCallback(() => {
    setLoading(true);
    fetchConfig().then(c => {
      setConfig(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Charger au montage si pas de cache
    if (!_cache) {
      reload();
    }

    // Écouter les invalidations (ex : après sauvegarde depuis Paramètres)
    window.addEventListener(EV_NAME, reload);
    return () => window.removeEventListener(EV_NAME, reload);
  }, [reload]);

  return { config, isLoading };
}

export function useBulletinTemplate() {
  const { config, isLoading } = useBulletinConfig();
  return { template: config.templateConfig, isLoading };
}
