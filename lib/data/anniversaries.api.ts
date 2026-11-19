import type { AnniversariesAdapter } from '@/types/contracts/anniversaries';
import { api } from '@/services/api';
import type { AnniversaryNotification } from '@/types/contracts/anniversaries';
// Live: GET /anniversaries/notifications, PATCH /anniversaries/notifications/:id/read.
// Backend owns employment-anniversary dates, milestones, text selection and delivery.
export const anniversariesApi: AnniversariesAdapter = { list: () => api.get<AnniversaryNotification[]>('/anniversaries/notifications'), markRead: async id => { await api.patch(`/anniversaries/notifications/${encodeURIComponent(id)}/read`,{}); } };
