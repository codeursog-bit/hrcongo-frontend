import type { Tone } from '@/components/design-system/primitives';
export type RequestGroup = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'all';
const statuses: Record<string, { label: string; tone: Tone; group: RequestGroup }> = {
  PENDING: { label: 'En attente', tone: 'warning', group: 'pending' }, PENDING_DG: { label: 'En attente', tone: 'warning', group: 'pending' },
  WAITING_OPINIONS: { label: 'En attente', tone: 'warning', group: 'pending' }, NEEDS_CONFIRMATION: { label: 'En attente', tone: 'warning', group: 'pending' },
  APPROVED: { label: 'Approuvée', tone: 'success', group: 'approved' }, ACTIVE: { label: 'Approuvée', tone: 'success', group: 'approved' },
  REJECTED: { label: 'Refusée', tone: 'danger', group: 'rejected' }, CANCELLED: { label: 'Annulée', tone: 'neutral', group: 'cancelled' },
  OPINION_GIVEN: { label: 'Avis donné', tone: 'neutral', group: 'all' }, PAID: { label: 'Soldée', tone: 'neutral', group: 'all' }, DEDUCTED: { label: 'Soldée', tone: 'neutral', group: 'all' },
};
/** Display only. Never pass these groups or labels back to the API. */
export function requestStatus(status?: string | null) { return statuses[status || ''] || { label: status || 'Statut non renseigné', tone: 'neutral' as Tone, group: 'all' as RequestGroup }; }
export const requestTabs: { id: RequestGroup; label: string }[] = [{ id: 'pending', label: 'En attente' }, { id: 'approved', label: 'Approuvées' }, { id: 'rejected', label: 'Refusées' }, { id: 'cancelled', label: 'Annulées' }, { id: 'all', label: 'Toutes' }];
