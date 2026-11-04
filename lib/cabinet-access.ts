export type CabinetRole = 'CABINET_ADMIN' | 'GESTIONNAIRE';
export interface CabinetAccess { cabinetId: string; role: CabinetRole; canAdminister: boolean }

const ADMIN_PAGES = new Set(['ajouter-pme', 'abonnement', 'gestionnaires', 'parametres', 'cloture']);
const MEMBER_PAGES = new Set(['dashboard', 'mes-pme']);
export function canAccessCabinetPath(role: CabinetRole, pathname: string, cabinetId: string): boolean {
  const parts = pathname.split(/[?#]/)[0].split('/').filter(Boolean);
  if (parts[0] !== 'cabinet' || parts[1] !== cabinetId) return false;
  if (!parts[2]) return true;
  if (ADMIN_PAGES.has(parts[2])) return role === 'CABINET_ADMIN';
  if (parts[2] === 'entreprise') {
    if (!parts[3]) return false;
    if (['acces', 'parametres'].includes(parts[4])) return role === 'CABINET_ADMIN';
    return role === 'CABINET_ADMIN' || role === 'GESTIONNAIRE';
  }
  return MEMBER_PAGES.has(parts[2]);
}
