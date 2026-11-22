/**
 * Le support Konza est réservé aux administrateurs : un employé ou un manager
 * n'y a pas accès (ils passent par la messagerie interne avec leur RH).
 * Garder cette liste alignée avec `supportBlockedRoles` dans
 * src/support/support.service.ts (le serveur reste l'autorité).
 */
export const SUPPORT_BLOCKED_ROLES = ['EMPLOYEE', 'MANAGER'];

export const canUseSupport = (role?: string | null): boolean =>
  !role || !SUPPORT_BLOCKED_ROLES.includes(role);