import type { ThemePreference } from '@/lib/theme';
export interface ColorChoice { accent: string; ambianceLight: string; ambianceDark: string }
export interface CompanyAppearance { colors: ColorChoice | null; allowEmployeeCustomization: boolean }
export interface UserAppearance { mode: ThemePreference; colors: ColorChoice | null }
export interface AppearanceActor { id: string; companyId: string; role: string }
export interface AppearanceSnapshot {
  company: CompanyAppearance; user: UserAppearance;
  effective: { colors: ColorChoice; mode: ThemePreference; source: 'USER' | 'COMPANY' | 'DEFAULT'; canCustomize: boolean };
}
export interface AppearanceAdapter {
  get(): Promise<AppearanceSnapshot>;
  saveUser(value: UserAppearance): Promise<void>;
  saveCompany(value: CompanyAppearance): Promise<void>;
}
