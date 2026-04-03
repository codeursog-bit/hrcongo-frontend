// =============================================================================
// FICHIER : lib/redirectAfterLogin.ts
// ACTION  : REMPLACER le fichier existant lib/redirectAfterLogin.ts
//           (le fichier existe déjà dans votre projet mais sans les rôles cabinet)
// =============================================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'CABINET_ADMIN'
  | 'CABINET_GESTIONNAIRE';

interface AuthUser {
  id:        string;
  email:     string;
  role:      UserRole;
  companyId?: string | null;
  cabinetId?: string | null;
}

export function getRedirectUrl(user: AuthUser): string {
  switch (user.role) {
    case 'CABINET_ADMIN':
    case 'CABINET_GESTIONNAIRE':
      if (!user.cabinetId) return '/auth/login';
      return `/cabinet/${user.cabinetId}/dashboard`;

    case 'ADMIN':
    case 'HR_MANAGER':
    case 'MANAGER':
      return '/dashboard';

    case 'EMPLOYEE':
      return '/ma-paie';

    case 'SUPER_ADMIN':
      return '/admin';

    default:
      return '/dashboard';
  }
}