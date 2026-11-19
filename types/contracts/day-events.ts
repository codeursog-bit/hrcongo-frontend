export interface DayEvent {
  id: string; companyId: string; type: 'BIRTHDAY' | 'WELCOME' | 'ANNOUNCEMENT';
  subject?: { id: string; name: string; photoUrl?: string }; title?: string; body?: string;
  day: number; month: number; expiresAt: string;
  reactions: { emoji: string; count: number; mine: boolean; userNames?: string[] }[];
}
export interface DayEventsAdapter { list: () => Promise<DayEvent[]>; react: (eventId: string, emoji: string) => Promise<void> }
