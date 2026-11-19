import type { DayEventsAdapter } from '@/types/contracts/day-events';
import { api } from '@/services/api';
import type { DayEvent } from '@/types/contracts/day-events';
// Live: GET /day-events, POST /day-events/:id/reactions { emoji }.
export const dayEventsApi: DayEventsAdapter = { list: () => api.get<DayEvent[]>('/day-events'), react: async(eventId,emoji) => { await api.post(`/day-events/${encodeURIComponent(eventId)}/reactions`,{emoji}); } };
