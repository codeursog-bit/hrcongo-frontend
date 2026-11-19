export type ThemePreference = 'light' | 'dark' | 'auto';
export function resolveTheme(preference: ThemePreference, systemDark: boolean, legacyFallback = false): 'light' | 'dark' {
  return preference === 'auto' ? (legacyFallback || systemDark ? 'dark' : 'light') : preference;
}
