import type { FeatureActor, Task, TasksAdapter } from '@/types/contracts/tasks';
import { canAssign, requireActor } from './context';
import { demoTasks } from '@/lib/demo/tasks';
const tasks: Task[] = structuredClone(demoTasks);
export function tasksDemo(actor: FeatureActor): TasksAdapter {
  const assignedToMe = (task: Task) => !!task.assigneeIds?.includes(actor.id) || !!(task.departmentId && task.departmentId === actor.departmentId);
  const visible = (task: Task) => task.companyId === actor.companyId && (task.scope === 'PERSONAL' ? task.ownerId === actor.id : assignedToMe(task) || canAssign(actor));
  const find = (id: string) => { requireActor(actor); const task = tasks.find(t => t.id === id && visible(t)); if (!task) throw new Error('Tâche inaccessible'); return task; };
  const create = (title: string, scope: Task['scope'], assigneeIds?: string[], departmentId?: string) => {
    requireActor(actor); if (!title.trim()) throw new Error('Précisez le titre');
    const task: Task = { id: crypto.randomUUID(), companyId: actor.companyId, ownerId: actor.id, scope, title: title.trim(), priority: 'NORMAL', status: 'TODO', comments: [], assigneeIds, departmentId, ...(scope === 'ASSIGNED' ? { assignedBy: { id: actor.id, name: actor.name } } : {}) };
    tasks.push(task); return structuredClone(task);
  };
  return {
    async list(view) { requireActor(actor); if (view === 'admin' && !canAssign(actor)) throw new Error('Accès réservé'); return structuredClone(tasks.filter(t => t.companyId === actor.companyId && (view === 'admin' ? t.scope === 'ASSIGNED' : t.scope === 'PERSONAL' ? t.ownerId === actor.id : assignedToMe(t)))); },
    async createPersonal(title) { return create(title, 'PERSONAL'); },
    async assign(title, ids, departmentId) { if (!canAssign(actor)) throw new Error('Accès réservé'); if (!ids.length && !departmentId) throw new Error('Choisissez un destinataire'); return create(title, 'ASSIGNED', ids, departmentId); },
    async update(id, status, reason) { const task = find(id); if (task.scope === 'ASSIGNED' && !assignedToMe(task)) throw new Error('Seul le destinataire peut modifier le statut'); if (status === 'BLOCKED' && !reason?.trim()) throw new Error('Précisez le blocage'); task.status = status; task.blockedReason = reason; task.completedAt = status === 'DONE' ? new Date().toISOString() : undefined; },
    async comment(id, text) { const task = find(id); if (!text.trim()) return; task.comments.push({ id: crypto.randomUUID(), authorId: actor.id, text: text.trim(), createdAt: new Date().toISOString() }); },
  };
}
