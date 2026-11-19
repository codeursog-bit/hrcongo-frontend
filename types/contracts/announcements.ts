export interface Announcement { id: string; companyId: string; title: string; body: string; createdAt: string }
export interface AnnouncementsAdapter { list: () => Promise<Announcement[]>; create: (title: string, body: string) => Promise<Announcement> }
