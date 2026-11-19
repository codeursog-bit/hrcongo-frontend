'use client';
import { useCallback, useEffect, useState } from 'react';
import { getTasks, tasksAvailable } from '@/lib/data/tasks';
import type { Task, TaskStatus } from '@/types/contracts/tasks';
export function useTasks(view: 'me' | 'admin' = 'me') {
  const [tasks, setTasks] = useState<Task[]>([]); const [loading, setLoading] = useState(tasksAvailable); const [error, setError] = useState('');
  const refresh = useCallback(async () => { if (!tasksAvailable) return; setLoading(true); try { setTasks(await getTasks().list(view)); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Chargement interrompu'); } finally { setLoading(false); } }, [view]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { tasks, loading, error, available: tasksAvailable, refresh,
    createPersonal: async (title: string) => { await getTasks().createPersonal(title); await refresh(); },
    assign: async (title: string, assignees: string[], departmentId?: string) => { await getTasks().assign(title, assignees, departmentId); await refresh(); },
    update: async (id: string, status: TaskStatus, reason?: string) => { await getTasks().update(id, status, reason); await refresh(); },
    comment: async (id: string, text: string) => { await getTasks().comment(id, text); await refresh(); },
  };
}
