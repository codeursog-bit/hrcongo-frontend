// ============================================================================
// 📁 lib/route-access.ts
// ✅ Politique d'accès aux PAGES par rôle — source unique, alignée sur la
//    Sidebar et les sous-navigations (PresenceSubNav, CongeSubNav, FinanceSubNav…).
//    Sert au <RouteGuard> : un employé qui tape une URL à la main n'a plus
//    accès au contenu (la page n'est même pas montée → aucun appel API lancé).
//
//    ⚠️ C'est une protection d'interface. La vraie barrière reste le backend
//    (@Roles / contrôles dans les services) — les deux vont ensemble.
//
//    Règle : la PREMIÈRE règle qui correspond gagne → toujours du plus
//    spécifique au plus général. Une route sans règle reste ouverte.
// ============================================================================

export const HR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'];
export const HR_AND_MANAGER = [...HR_ROLES, 'MANAGER'];
const ALL = '*' as const;

interface Rule {
  re: RegExp;
  roles: string[] | typeof ALL;
  /** Un employé disposant du droit « pointage pour tous » (secrétaire) passe aussi */
  attendanceAll?: boolean;
}

const RULES: Rule[] = [
  // ── Espaces personnels : ouverts à tous les rôles ────────────────────────
  { re: /^\/loans\/(mon-espace|nouveau)(\/|$)/, roles: ALL },
  { re: /^\/conges\/(mon-espace|nouveau|programme)(\/|$)/, roles: ALL },
  { re: /^\/presences\/(absences|permissions)\/(mon-espace|nouveau)(\/|$)/, roles: ALL },
  { re: /^\/presences\/(pointage|resume)(\/|$)/, roles: ALL },
  { re: /^\/performance\/(mon-espace|fiche)(\/|$)/, roles: ALL },

  // ── Présences ────────────────────────────────────────────────────────────
  { re: /^\/presences\/ecrans(\/|$)/, roles: HR_ROLES },
  { re: /^\/presences\/absences(\/|$)/, roles: HR_ROLES },       // gestion, suivi, historique, rapport
  { re: /^\/presences\/permissions(\/|$)/, roles: HR_ROLES },    // gestion, suivi, validations, historique, rapport
  { re: /^\/presences\/pointage-manuel(\/|$)/, roles: HR_AND_MANAGER, attendanceAll: true },
  { re: /^\/presences\/(shifts|tablettes)(\/|$)/, roles: HR_AND_MANAGER },

  // ── Congés ───────────────────────────────────────────────────────────────
  { re: /^\/conges$/, roles: HR_AND_MANAGER },                   // vue équipe du manager
  { re: /^\/conges\/(gestion|planning|calendrier|soldes|historique|diagrammes|provision|analyse)(\/|$)/, roles: HR_ROLES },

  // ── Prêts & avances ──────────────────────────────────────────────────────
  { re: /^\/loans(\/|$)/, roles: HR_ROLES },                     // gestion, suivi dettes, relevé, validations, rapport

  // ── Employés ─────────────────────────────────────────────────────────────
  { re: /^\/employes\/(nouveau|import)(\/|$)/, roles: HR_ROLES },
  { re: /^\/employes\/[^/]+\/(edit|primes)(\/|$)/, roles: HR_ROLES },
  { re: /^\/employes(\/|$)/, roles: HR_AND_MANAGER },            // « Mon équipe » côté manager

  // ── Performance ──────────────────────────────────────────────────────────
  { re: /^\/performance(\/|$)/, roles: HR_AND_MANAGER },

  // ── Documents ────────────────────────────────────────────────────────────
  { re: /^\/documents\/(generate|legal)(\/|$)/, roles: HR_ROLES },

  // ── Modules réservés à l'administration / RH ─────────────────────────────
  { re: /^\/(demandes|paie|recrutement|materiel|parametres|rapports|audit|cnss-declaration|contrats|primes|rh-blog)(\/|$)/, roles: HR_ROLES },
];

/** Retire le préfixe PME (/pme/<id>), la query, le hash et le slash final */
export function normalizePath(pathname: string): string {
  let p = (pathname || '/').split('?')[0].split('#')[0];
  p = p.replace(/^\/pme\/[^/]+/, '');
  p = p.replace(/\/+$/, '');
  return p || '/';
}

export function findRule(pathname: string): Rule | undefined {
  const p = normalizePath(pathname);
  return RULES.find(r => r.re.test(p));
}

/** Les comptes cabinet pilotent les PME de leur portefeuille : même niveau qu'un admin dans /pme/<id> */
const isCabinet = (role: string) => role === 'CABINET_ADMIN' || role === 'CABINET_GESTIONNAIRE';

export function canAccessPath(role: string | null | undefined, pathname: string, opts?: { attendanceAll?: boolean }): boolean {
  if (!role) return false;
  if (isCabinet(role)) return true;
  const rule = findRule(pathname);
  if (!rule || rule.roles === ALL) return true;
  if (rule.roles.includes(role)) return true;
  return !!(rule.attendanceAll && role === 'EMPLOYEE' && opts?.attendanceAll);
}

/** La route demande-t-elle de vérifier le droit « pointage pour tous » ? */
export const ruleNeedsAttendanceAll = (pathname: string) => !!findRule(pathname)?.attendanceAll;

/** Page d'accueil « sûre » selon le rôle (cible du bouton Retour) */
export function homeFor(role: string | null | undefined): string {
  return role === 'EMPLOYEE' ? '/dashboard' : '/dashboard';
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Administrateur', ADMIN: 'Administrateur', HR_MANAGER: 'RH manager', MANAGER: 'Manager', EMPLOYEE: 'Employé',
};
