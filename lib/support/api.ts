import { api } from "@/services/api";
export type SupportStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: SupportStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  unread: boolean;
  lastPreview?: string | null;
  requesterName?: string;
  requesterEmail?: string;
  companyLabel?: string | null;
  source?: "CONTACT" | "APP";
  assigneeId?: string | null;
  assignee?: { id: string; name: string } | null;
}
export interface SupportMessage {
  id: string;
  seq: number;
  body: string;
  side: "CUSTOMER" | "STAFF";
  internal: boolean;
  createdAt: string;
  clientId: string;
  authorName?: string;
  notificationSent?: boolean;
}
export interface SupportPage {
  pendingContacts?: number;
  unreadTotal?: number;
  tickets: SupportTicket[];
  total: number;
  offset: number;
  limit: number;
}
export interface SupportThread {
  ticket: SupportTicket;
  messages: SupportMessage[];
  hasMore: boolean;
}
export interface SupportAgent {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  isActive: boolean;
}
export interface GuestAccess {
  id: string;
  token: string;
}
export const supportApi = {
  resendGuestLink: (id: string) =>
    api.post<{ sent: boolean }>(
      "/admin/support/tickets/" + encodeURIComponent(id) + "/guest-link",
      {},
    ),
  list: (staff = false, offset = 0, status = "") =>
    api.get<SupportPage>(
      (staff ? "/admin" : "") +
        "/support/tickets?" +
        new URLSearchParams({
          offset: String(offset),
          ...(status ? { status } : {}),
        }),
    ),
  create: (data: {
    subject: string;
    category: string;
    body: string;
    clientId: string;
  }) => api.post<{ id: string }>("/support/tickets", data),
  messages: (
    id: string,
    staff = false,
    query: { after?: number; before?: number } = {},
    guest?: GuestAccess,
  ) =>
    guest
      ? api.post<SupportThread>("/support/guest/read", { ...guest, ...query })
      : api.get<SupportThread>(
          (staff ? "/admin" : "") +
            "/support/tickets/" +
            encodeURIComponent(id) +
            "/messages?" +
            new URLSearchParams(
              Object.entries(query).map(([k, v]) => [k, String(v)]),
            ),
        ),
  send: (
    id: string,
    data: { body: string; clientId: string; internal?: boolean },
    staff = false,
    guest?: GuestAccess,
  ) =>
    guest
      ? api.post<SupportMessage>("/support/guest/messages", {
          ...guest,
          ...data,
          internal: undefined,
        })
      : api.post<SupportMessage>(
          (staff ? "/admin" : "") +
            "/support/tickets/" +
            encodeURIComponent(id) +
            "/messages",
          data,
        ),
  update: (
    id: string,
    data: {
      status?: SupportStatus;
      priority?: string;
      assigneeId?: string | null;
    },
  ) =>
    api.patch<SupportTicket>(
      "/admin/support/tickets/" + encodeURIComponent(id),
      data,
    ),
  agents: () => api.get<SupportAgent[]>("/admin/support/agents"),
  createAgent: (data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => api.post<SupportAgent>("/admin/support/agents", data),
  updateAgent: (id: string, isActive: boolean) =>
    api.patch("/admin/support/agents/" + encodeURIComponent(id), { isActive }),
};
