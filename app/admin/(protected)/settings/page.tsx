// ============================================================================
// ⚙️ PAGE SETTINGS (MODIFIÉE - Connectée à l'API)
// ============================================================================
// Fichier: frontend/app/admin/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, Loader2 } from 'lucide-react';
import { SettingsTabs } from '@/components/admin/settings/SettingsTabs';
import { adminService } from '@/lib/services/adminService'; // ✅ AJOUT

export default function SettingsPage() {
  // ✅ AJOUT : State
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ AJOUT : Charger les paramètres
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getGlobalSettings();
      setSettings(data);
    } catch (err) {
      console.error('Erreur chargement settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ AJOUT : Sauvegarder
  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateGlobalSettings(settings);
      setSuccessMessage('Paramètres sauvegardés avec succès');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ AJOUT : Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">⚙️ Paramètres Plateforme</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configuration globale du système et des entreprises
          </p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-900/20 border border-green-900/50 rounded-xl p-4 text-green-400">
          {successMessage}
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
        <div>
          <div className="font-bold text-yellow-200 text-sm">Attention</div>
          <div className="text-xs text-yellow-400/80 mt-1">
            Les modifications ici affectent TOUTES les entreprises. Soyez prudent.
          </div>
        </div>
      </div>

      {/* ✅ MODIFIÉ : Passer les settings au composant */}
      <SettingsTabs settings={settings} onUpdate={setSettings} />
    </div>
  );
}
