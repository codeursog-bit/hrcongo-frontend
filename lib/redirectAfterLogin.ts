// src/lib/redirectAfterLogin.ts
// Déjà importé dans app/auth/login/page.tsx — créer ce fichier

export function getRedirectUrl(user: {
  role:             string;
  companyId?:       string | null;
  cabinetId?:       string | null;
  managedByCabinet?: boolean;
}): string {
  const { role, companyId, cabinetId, managedByCabinet } = user;

  // Super admin → panel admin
  if (role === 'SUPER_ADMIN') return '/admin';

  // Cabinet → dashboard cabinet
  if (role === 'CABINET_ADMIN' || role === 'CABINET_GESTIONNAIRE') {
    return cabinetId ? `/cabinet/${cabinetId}/dashboard` : '/auth/login';
  }

  // PME (admin ou employé d'une entreprise gérée par cabinet) → interface /pme/
  if (managedByCabinet && companyId) {
    // L'employé PME va directement à son espace
    if (role === 'EMPLOYEE') return `/pme/${companyId}/conges/mon-espace`;
    // L'admin PME va au dashboard PME
    return `/pme/${companyId}/dashboard`;
  }

  // Entreprise Konza normale
  if (companyId) return '/dashboard';

  // Admin sans entreprise → créer une entreprise
  if (role === 'ADMIN') return '/companies/create';

  return '/dashboard';
}