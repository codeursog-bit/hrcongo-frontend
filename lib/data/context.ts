import type { FeatureActor } from '@/types/contracts/tasks';
import { authService } from '@/lib/services/authService';
export function featureActor(): FeatureActor {
  const user = authService.getCurrentUser();
  return { id: user?.id || '', companyId: user?.companyId || '', role: user?.role || '', name: [user?.firstName, user?.lastName].filter(Boolean).join(' '), departmentId: user?.departmentId };
}
export function requireActor(actor: FeatureActor) { if (!actor.id || !actor.companyId) throw new Error('Session requise'); }
export const canAssign = (actor: FeatureActor) => ['ADMIN', 'HR_MANAGER'].includes(actor.role);
