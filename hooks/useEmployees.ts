// hooks/useEmployees.ts
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  [key: string]: any;
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await api.get('/employees');
        // ✅ api.get retourne directement les données, pas un objet avec .data
        setEmployees((response as Employee[]) || []);
      } catch (err: any) {
        console.error('Failed to fetch employees:', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  return { employees, loading, error };
}