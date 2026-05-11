// ============================================================================
// 📁 src/hooks/useConventionGuard.ts
//
// Hook React — Vérifie si l'entreprise a une convention via
// GET /conventions/status (Route corrigée pour correspondre au backend)
// Utilise le service centralisé pour l'authentification et l'URL Render.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api'; // Pointage vers ton service de gestion API

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

  // 1️⃣ Vérifie si l'entreprise a une convention active
  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      // Correction de la route : /conventions/status au lieu de contract-rupture/...
      const data = await api.get<ConventionStatus>('/conventions/status');
      
      setStatus(data);
      // On affiche le modal uniquement si hasConvention est explicitement false
      setShowModal(!data.hasConvention);
    } catch (err) {
      console.error("Erreur lors de la vérification du statut:", err);
      setStatus({ hasConvention: false, conventionCode: null, conventionName: null, categories: [] });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2️⃣ Charge les conventions disponibles pour le modal
  const loadPredefined = useCallback(async () => {
    try {
      const data = await api.get<PredefinedConvention[]>('/conventions/predefined');
      setPredefined(data);
    } catch (err) {
      console.error("Erreur lors du chargement des conventions prédéfinies:", err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    loadPredefined();
  }, [checkStatus, loadPredefined]);

  // 3️⃣ Active une convention — appelle POST /conventions/activate
  const activateConvention = async (conventionCode: string): Promise<boolean> => {
    setActivating(true);
    setError(null);
    try {
      // Utilisation du service API pour injecter automatiquement le token
      await api.post('/conventions/activate', { conventionCode });
      
      // Recharger le statut après activation pour mettre à jour l'UI
      await checkStatus();
      return true;
    } catch (err: any) {
      console.error("Erreur activation convention:", err);
      setError(err.message || 'Erreur lors de l\'activation');
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