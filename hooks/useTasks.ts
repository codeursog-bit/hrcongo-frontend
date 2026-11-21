'use client';
import { useCallback, useEffect, useState } from 'react';
import { getTasks, tasksAvailable } from '@/lib/data/tasks';
import type { Task, TaskStatus } from '@/types/contracts/tasks';

// `createPersonal` accepte désormais une échéance (YYYY-MM-DD) pour planifier une tâche « À venir ».
// Le contrat d'origine n'a qu'un paramètre : on l'élargit ici sans toucher aux types partagés.
type PlanningAdapter = { createPersonal: (title: string, dueDate?: string) => Promise<unknown> };

export function useTasks(view: 'me' | 'admin' = 'me') {
  const [tasks, setTasks] = useState<Task[]>([]); const [loading, setLoading] = useState(tasksAvailable); const [error, setError] = useState('');
  // `silent` : rafraîchit les données SANS repasser en « chargement » → la liste ne clignote plus et ne saute plus.
  const refresh = useCallback(async (silent?: unknown) => {
    if (!tasksAvailable) return;
    const quiet = silent === true;
    if (!quiet) setLoading(true);
    try { setTasks(await getTasks().list(view)); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { if (!quiet) setLoading(false); }
  }, [view]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { tasks, loading, error, available: tasksAvailable, refresh,
    createPersonal: async (title: string, dueDate?: string) => { await (getTasks() as unknown as PlanningAdapter).createPersonal(title, dueDate); await refresh(true); },
    assign: async (title: string, assignees: string[], departmentId?: string) => { await getTasks().assign(title, assignees, departmentId); await refresh(true); },
    // Mise à jour optimiste : la case change immédiatement, le serveur confirme ensuite ; en cas d'échec on revient à l'état réel.
    update: async (id: string, status: TaskStatus, reason?: string) => {
      setTasks(list => list.map(t => t.id === id ? { ...t, status, blockedReason: status === 'BLOCKED' ? reason : undefined } : t));
      try { await getTasks().update(id, status, reason); } catch (e) { await refresh(true); throw e; }
      void refresh(true);
    },
    comment: async (id: string, text: string) => { await getTasks().comment(id, text); await refresh(true); },
  };
}