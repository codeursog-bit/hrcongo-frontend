export interface AnniversaryNotification { id: string; companyId: string; recipientId: string; subjectId: string; message: string; read: boolean; createdAt: string }
export interface AnniversariesAdapter { list: () => Promise<AnniversaryNotification[]>; markRead: (id: string) => Promise<void> }
