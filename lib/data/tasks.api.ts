import type { TasksAdapter } from '@/types/contracts/tasks';
import { api } from '@/services/api';
import type { Task } from '@/types/contracts/tasks';
// Live: GET /tasks/me, GET /tasks/admin, POST /tasks, POST /tasks/assign,
// PATCH /tasks/:id, POST /tasks/:id/comments.
export const tasksApi: TasksAdapter = {
  list: view => api.get<Task[]>(view === 'admin' ? '/tasks/admin' : '/tasks/me'),
  createPersonal: title => api.post<Task>('/tasks', {title}),
  assign: (title,assigneeIds,departmentId) => api.post<Task>('/tasks/assign',{title,assigneeIds,departmentId}),
  update: async(id,status,blockedReason) => { await api.patch(`/tasks/${encodeURIComponent(id)}`,{status,blockedReason}); },
  comment: async(id,text) => { await api.post(`/tasks/${encodeURIComponent(id)}/comments`,{text}); },
};
