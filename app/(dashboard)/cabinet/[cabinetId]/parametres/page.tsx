'use client';

// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/parametres/page.tsx
// ACTION  : CRÉER (nouveau fichier)
// RÔLE    : Paramètres du cabinet — modifier nom, email, téléphone.
//           Appelle PATCH /cabinet/:cabinetId (UpdateCabinetDto)
//           La sidebar du dashboard pointe déjà vers cette route.
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Settings, Save, Loader2, CheckCircle2, AlertCircle,
  Building2, Mail, Phone, Globe,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

interface CabinetData {
  id:        string;
  name:      string;
  email:     string;
  phone:     string | null;
  subdomain: string;
  isActive:  boolean;
  createdAt: string;
  _count: {
    companies: number;
    users:     number;
  };
}

export default function ParametresPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [cabinet,  setCabinet]  = useState<CabinetData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [user,     setUser]     = useState<any>(null);

  // Champs du formulaire
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }

    api.get(`/cabinet/${cabinetId}`)
      .then((r: any) => {
        setCabinet(r);
        setName(r.name   ?? '');
        setEmail(r.email ?? '');
        setPhone(r.phone ?? '');
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated: any = await api.patch(`/cabinet/${cabinetId}`, {
        name:  name.trim()  || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setCabinet(prev => prev ? { ...prev, ...updated } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const isDirty = cabinet && (
    name  !== (cabinet.name  ?? '') ||
    email !== (cabinet.email ?? '') ||
    phone !== (cabinet.phone ?? '')
  );

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} />

      <main className="ml-56 p-8 max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={22} className="text-purple-400" />
            Paramètres
          </h1>
          <p className="text-gray-500 text-sm mt-1">Informations de votre cabinet</p>
        </div>

        {/* Infos readonly */}
        {cabinet && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">PME gérées</p>
              <p className="text-2xl font-bold text-white">{cabinet._count.companies}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gestionnaires</p>
              <p className="text-2xl font-bold text-white">{cabinet._count.users}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Membre depuis</p>
              <p className="text-sm font-bold text-white mt-1">
                {cabinet.createdAt
                  ? new Date(cabinet.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-white text-sm">Informations générales</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Nom */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                <Building2 size={13} /> Nom du cabinet
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mon cabinet comptable"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                <Mail size={13} /> Email de contact
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@cabinet.com"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
              />
            </div>

            {/* Téléphone */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
                <Phone size={13} /> Téléphone
                <span className="text-gray-600 text-xs ml-1">(optionnel)</span>
              </label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+242 06 000 0000"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Bouton save */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving || !isDirty}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saving
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Save size={14} />
                }
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>

              {saved && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle2 size={15} />
                  Modifications enregistrées
                </div>
              )}

              {!isDirty && !saved && (
                <p className="text-gray-600 text-xs">Aucune modification</p>
              )}
            </div>
          </div>
        </div>

        {/* Sous-domaine — lecture seule */}
        {cabinet && (
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mt-4">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">Sous-domaine</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={14} className="text-gray-500" />
                <span className="text-sm text-gray-400">Adresse du portail client</span>
              </div>
              <div className="flex items-center gap-1 p-3 bg-white/5 border border-white/10 rounded-xl">
                <code className="text-cyan-400 text-sm font-mono">{cabinet.subdomain}</code>
                <span className="text-gray-600 text-sm">.konza.app</span>
              </div>
              <p className="text-gray-600 text-xs mt-2">
                Le sous-domaine est définitif et ne peut pas être modifié après création.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}