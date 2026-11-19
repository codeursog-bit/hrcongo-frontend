import type { Task } from '@/types/contracts/tasks';
export const demoTasks: Task[] = [
  { id: 'demo-task-personal', companyId: 'demo-company', ownerId: 'demo-user', scope: 'PERSONAL', title: 'Préparer mes documents pour mon dossier', priority: 'NORMAL', status: 'TODO', comments: [] },
  { id: 'demo-task-assigned', companyId: 'demo-company', ownerId: 'demo-supervisor', scope: 'ASSIGNED', title: 'Vérifier les coordonnées de mon profil', priority: 'NORMAL', status: 'TODO', assignedBy: { id: 'demo-supervisor', name: 'Sandrine Mvoula' }, assigneeIds: ['demo-user'], comments: [] },
];
