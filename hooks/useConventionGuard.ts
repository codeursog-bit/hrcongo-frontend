// ============================================================================
// 📁 src/hooks/useConventionGuard.ts
//
// Hook React — Vérifie si l'entreprise a une convention via
// GET /contract-rupture/convention-status
// Si hasConvention = false → déclenche le modal de sélection.
// La sélection appelle POST /conventions/activate (service existant).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export interface ConventionStatus {
  hasConvention:  boolean;
  conventionCode: string | null;
  conventionName: string | null;
  categories:     Array<{ code: string; label: string; minSalary: number }>;
}

export interface PredefinedConvention {
  code:        string;
  name:        string;
  description: string;
  categories:  Array<{ code: string; label: string; minSalary: number }>;
}

export function useConventionGuard() {
  const [status,      setStatus]      = useState<ConventionStatus | null>(null);
  const [predefined,  setPredefined]  = useState<PredefinedConvention[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [activating,  setActivating]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Vérifie si l'entreprise a une convention active
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/contract-rupture/convention-status', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Erreur réseau');
      const data: ConventionStatus = await res.json();
      setStatus(data);
      setShowModal(!data.hasConvention);
    } catch {
      setStatus({ hasConvention: false, conventionCode: null, conventionName: null, categories: [] });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charge les conventions disponibles pour le modal
  const loadPredefined = useCallback(async () => {
    try {
      const res = await fetch('/api/conventions/predefined', { credentials: 'include' });
      if (res.ok) setPredefined(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    checkStatus();
    loadPredefined();
  }, [checkStatus, loadPredefined]);

  // Active une convention — appelle POST /conventions/activate (service existant)
  const activateConvention = async (conventionCode: string): Promise<boolean> => {
    setActivating(true);
    setError(null);
    try {
      const res = await fetch('/api/conventions/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conventionCode }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message ?? 'Erreur lors de l\'activation');
        return false;
      }
      // Recharger le statut
      await checkStatus();
      return true;
    } catch {
      setError('Erreur réseau');
      return false;
    } finally {
      setActivating(false);
    }
  };

  return {
    status,
    predefined,
    loading,
    showModal,
    activating,
    error,
    activateConvention,
    recheckStatus: checkStatus,
  };
}