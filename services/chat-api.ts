// ============================================================================
// 📁 services/chat-api.ts — client de la messagerie interne
// ============================================================================
import { api } from '@/services/api';

export type ChatRole = 'ADMIN' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface ChatContact {
  id: string;
  name: string;
  role: ChatRole;
  department: string | null;
  photoUrl?: string | null;
}

export interface ChatConversation {
  id: string;
  other: ChatContact;
  lastMessageAt: string | null;
  lastPreview: string | null;
  lastFromMe: boolean;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  seq: number;
  mine: boolean;
  body: string;
  createdAt: string;
  /** état local uniquement (envoi optimiste) */
  status?: 'sending' | 'failed';
  clientId?: string;
}

export interface ChatPoll {
  v: string;
  changed: boolean;
  serverTime: string;
  unreadTotal?: number;
  conversations?: { id: string; unreadCount: number }[];
}

export const CHAT_ROLES: ChatRole[] = ['ADMIN', 'HR_MANAGER', 'MANAGER', 'EMPLOYEE'];
export const MAX_MESSAGE_LENGTH = 2000;

const qs = (p: Record<string, string | number | undefined>) => {
  const s = Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return s ? `?${s}` : '';
};

export const chatApi = {
  contacts: (q?: string) => api.get<ChatContact[]>(`/chat/contacts${qs({ q, limit: 30 })}`),
  conversations: () => api.get<ChatConversation[]>('/chat/conversations'),
  open: (userId: string) =>
    api.post<{ id: string; other: ChatContact }>('/chat/conversations', { userId }),
  messages: (id: string, p: { before?: number; after?: number; limit?: number } = {}) =>
    api.get<{ messages: ChatMessage[]; hasMore: boolean }>(
      `/chat/conversations/${id}/messages${qs(p)}`,
    ),
  send: (id: string, body: string, clientId: string) =>
    api.post<ChatMessage>(`/chat/conversations/${id}/messages`, { body, clientId }),
  markRead: (id: string) => api.post<{ ok: true }>(`/chat/conversations/${id}/read`, {}),
  poll: (v?: string, since?: string) => api.get<ChatPoll>(`/chat/poll${qs({ v, since })}`),
  /** Prévient le serveur que l'onglet passe en arrière-plan (le push hors-app reprend). */
  away: () => api.post<{ ok: true }>('/chat/away', {}).catch(() => {}),
};