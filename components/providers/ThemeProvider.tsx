'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppearanceProvider } from './AppearanceProvider';
import { appearanceAvailable } from '@/lib/data/appearance';

import { resolveTheme, type ThemePreference } from '@/lib/theme';
export type { ThemePreference } from '@/lib/theme';
type ResolvedTheme = 'light' | 'dark';
interface ThemeContextType {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const valid = (value: string | null): value is ThemePreference => value === 'light' || value === 'dark' || value === 'auto';
const personalModeKey = () => { try { const user=JSON.parse(localStorage.getItem('user')||'null');return user?.id?'konza:appearance:mode:'+user.id:null; } catch { return null; } };
const savedMode = () => { const key=appearanceAvailable?personalModeKey():null;const personal=key?localStorage.getItem(key):null;return valid(personal)?personal:localStorage.getItem('theme'); };

export function ThemeProvider({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname() || '';
  const legacy = /^\/(admin|cabinet|portefeuille|kiosk|ecran)(\/|$)/.test(pathname);
  const [preference, setChoice] = useState<ThemePreference>('auto');
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);
  useEffect(() => {
    try { const saved = savedMode(); if (valid(saved)) { setChoice(saved); setHasSavedChoice(true); } } catch { /* private browsing: keep auto */ }
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media?.matches ?? false);
    update(); media?.addEventListener('change', update); setMounted(true);
    const sync = (event: StorageEvent) => { if (event.key === 'theme' || event.key === personalModeKey()) { const saved=savedMode();setChoice(valid(saved) ? saved : 'auto'); setHasSavedChoice(valid(saved)); } };
    window.addEventListener('storage', sync);
    return () => { media?.removeEventListener('change', update); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(()=>{try{const saved=savedMode();if(valid(saved)){setChoice(saved);setHasSavedChoice(true);}}catch{/* retain the current personal mode */}},[pathname]);
  // Deferred zones keep the historical dark fallback until their own phase.
  const theme: ResolvedTheme = resolveTheme(preference, systemDark, legacy && !hasSavedChoice);
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark'); root.classList.add(theme);
    root.style.colorScheme = theme;
    root.dataset.themePreference = preference;
    document.body.classList.toggle('legacy-root', legacy);
  }, [theme, preference, mounted, legacy]);
  const setPreference = useCallback((value: ThemePreference) => {
    setChoice(value); setHasSavedChoice(true);
    try { localStorage.setItem('theme', value); const key=appearanceAvailable?personalModeKey():null;if(key)localStorage.setItem(key,value); } catch { /* keep in-memory choice */ }
    if(appearanceAvailable)window.dispatchEvent(new CustomEvent('konza:appearance:mode-changed',{detail:value}));
  }, []);
  const toggleTheme = useCallback(() => setPreference(theme === 'dark' ? 'light' : 'dark'), [theme, setPreference]);
  const restoreServerPreference = useCallback((mode: ThemePreference, userId: string) => {
    try {
      const key=personalModeKey();if(key!=='konza:appearance:mode:'+userId)return;
      localStorage.setItem(key,mode);localStorage.setItem('theme',mode);
    } catch { /* the authenticated preference still applies in memory */ }
    setChoice(mode);setHasSavedChoice(true);
  },[]);
  return <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme }}><AppearanceProvider theme={theme} preference={preference} onServerPreference={restoreServerPreference}>{children}</AppearanceProvider></ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('ThemeProvider requis'); return value; }
