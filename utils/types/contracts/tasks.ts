export type TaskScope = 'PERSONAL' | 'ASSIGNED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export interface FeatureActor { id: string; companyId: string; role: string; name: string; departmentId?: string }
export interface Task {
  id: string; companyId: string; ownerId: string; scope: TaskScope; title: string; description?: string; dueDate?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH'; status: TaskStatus; assignedBy?: { id: string; name: string };
  assigneeIds?: string[]; departmentId?: string; completedAt?: string; blockedReason?: string;
  comments: { id: string; authorId: string; text: string; createdAt: string }[];
}
export interface TasksAdapter {
  list: (view: 'me' | 'admin') => Promise<Task[]>;
  createPersonal: (title: string) => Promise<Task>;
  assign: (title: string, assigneeIds: string[], departmentId?: string) => Promise<Task>;
  update: (id: string, status: TaskStatus, blockedReason?: string) => Promise<void>;
  comment: (id: string, text: string) => Promise<void>;
}
