import type { AnnouncementsAdapter } from '@/types/contracts/announcements';
import { api } from '@/services/api';
import type { Announcement } from '@/types/contracts/announcements';
// Live: GET /announcements, POST /announcements (ADMIN/HR_MANAGER).
export const announcementsApi: AnnouncementsAdapter = { list: () => api.get<Announcement[]>('/announcements'), create: (title,body) => api.post<Announcement>('/announcements',{title,body}) };
