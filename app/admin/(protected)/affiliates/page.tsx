'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, TrendingUp, Building2, Loader2, Check, X, Pencil } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Affiliate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  commissionRate: number;
  isActive: boolean;
  totalCompanies: number;
  totalCommissions: number;
  pendingCommissions: number;
  createdAt: string;
}

// ─── Formatage ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CG', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AffiliatesAdminPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edition du taux de commission
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<number>(10);
  const [savingRate, setSavingRate] = useState(false);

  // Toggle actif/inactif
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/admin/all`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setAffiliates(data);
    } catch {
      setError('Impossible de charger les affiliés.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  // ─── Modifier taux de commission ──────────────────────────────────────────

  const handleSaveRate = async (id: string) => {
    setSavingRate(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/admin/${id}/commission-rate`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ commissionRate: newRate }),
        },
      );
      if (!res.ok) throw new Error('Erreur mise à jour');
      setEditingId(null);
      await fetchAffiliates();
    } catch {
      // on pourrait afficher une erreur inline ici
    } finally {
      setSavingRate(false);
    }
  };

  // ─── Activer / Désactiver ─────────────────────────────────────────────────

  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/affiliate/admin/${id}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ isActive: !current }),
        },
      );
      if (!res.ok) throw new Error('Erreur toggle');
      await fetchAffiliates();
    } catch {
      // silencieux
    } finally {
      setTogglingId(null);
    }
  };

  // ─── KPIs globaux ────────────────────────────────────────────────────────

  const totalPending = affiliates.reduce((s, a) => s + a.pendingCommissions, 0);
  const totalCompanies = affiliates.reduce((s, a) => s + a.totalCompanies, 0);
  const activeCount = affiliates.filter((a) => a.isActive).length;

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🤝 Affiliés</h1>
        <p className="text-gray-400 text-sm mt-1">
          Gérez les partenaires affiliés et leurs taux de commission
        </p>
      </div>

      {/* KPIs résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-800 rounded-lg">
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Affiliés actifs</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '—' : `${activeCount} / ${affiliates.length}`}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-800 rounded-lg">
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Commissions en attente</p>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {loading ? '—' : fmt(totalPending)}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-800 rounded-lg">
              <Building2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Entreprises apportées</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {loading ? '—' : totalCompanies}
          </p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
        ) : affiliates.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun affilié pour l'instant.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Affilié</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Code</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Entreprises</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Commissions</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Taux</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-4 py-4 uppercase tracking-wider">Statut</th>
                  <th className="text-center text-xs text-gray-500 font-medium px-6 py-4 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`${i < affiliates.length - 1 ? 'border-b border-gray-800/50' : ''} hover:bg-gray-800/30 transition-colors`}
                  >
                    {/* Identité */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                      <p className="text-xs text-gray-700 mt-0.5">Inscrit le {fmtDate(a.createdAt)}</p>
                    </td>

                    {/* Code referral */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                        {a.referralCode}
                      </span>
                    </td>

                    {/* Entreprises */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-semibold text-white">{a.totalCompanies}</span>
                    </td>

                    {/* Commissions */}
                    <td className="px-4 py-4 text-right">
                      <p className="text-sm font-bold text-indigo-400">{fmt(a.totalCommissions)}</p>
                      {a.pendingCommissions > 0 && (
                        <p className="text-xs text-amber-500 mt-0.5">
                          {fmt(a.pendingCommissions)} en attente
                        </p>
                      )}
                    </td>

                    {/* Taux (éditable) */}
                    <td className="px-4 py-4 text-center">
                      {editingId === a.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={newRate}
                            onChange={(e) => setNewRate(Number(e.target.value))}
                            className="w-16 px-2 py-1.5 text-xs bg-gray-800 border border-indigo-600 rounded text-center text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-500">%</span>
                          <button
                            onClick={() => handleSaveRate(a.id)}
                            disabled={savingRate}
                            className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                            title="Valider"
                          >
                            {savingRate ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
                            title="Annuler"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(a.id);
                            setNewRate(a.commissionRate);
                          }}
                          className="group inline-flex items-center gap-1 text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors"
                        >
                          {a.commissionRate}%
                          <Pencil className="w-3 h-3 text-gray-600 group-hover:text-indigo-500 transition-colors" />
                        </button>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          a.isActive
                            ? 'bg-green-900/30 text-green-400 border-green-800/50'
                            : 'bg-gray-800/60 text-gray-500 border-gray-700'
                        }`}
                      >
                        {a.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggle(a.id, a.isActive)}
                        disabled={togglingId === a.id}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          a.isActive
                            ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50'
                            : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-900/50'
                        }`}
                      >
                        {togglingId === a.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        {a.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note bas de page */}
      <p className="text-xs text-gray-700 text-center pb-2">
        Modifier le taux d'un affilié n'affecte pas les commissions passées, uniquement les futures.
      </p>
    </div>
  );
}
