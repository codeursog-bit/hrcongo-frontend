
import { LucideIcon } from 'lucide-react';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  allowedRoles: UserRole[]; // Définit quels rôles peuvent voir cet élément
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  isOnline: boolean;
}

export interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
}
