'use client';

// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/ajouter-pme/page.tsx
// ACTION  : CRÉER (nouveau fichier)
// RÔLE    : Permet au cabinet d'associer une PME existante à son compte.
//           Appelle POST /cabinet/:cabinetId/companies
//           Le dashboard pointe déjà vers cette route via le bouton "Ajouter une PME".
// =============================================================================

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2, Search, Plus, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle, Link2,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

interface CompanyResult {
  id: string;
  legalName: string;
  tradeName: string | null;
  city: string;
  siret?: string;
  isActive: boolean;
}

export default function AjouterPmePage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  // Étape 1 : recherche
  const [query,          setQuery]          = useState('');
  const [searching,      setSearching]      = useState(false);
  const [results,        setResults]        = useState<CompanyResult[] | null>(null);
  const [searchError,    setSearchError]    = useState('');

  // Étape 2 : confirmation
  const [selected,       setSelected]       = useState<CompanyResult | null>(null);
  const [startDate,      setStartDate]      = useState('');
  const [adding,         setAdding]         = useState(false);
  const [addError,       setAddError]       = useState('');
  const [done,           setDone]           = useState(false);

  // Recherche de PME par nom ou UUID
  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResults(null);

    try {
      // Deux cas : UUID complet → cherche directement, sinon → recherche par nom
      const isUuid = /^[0-9a-f-]{36}$/i.test(query.trim());
      const endpoint = isUuid
        ? `/companies/${query.trim()}`
        : `/companies?search=${encodeURIComponent(query.trim())}&limit=10`;

      const res: any = await api.get(endpoint);
      // L'API retourne soit un objet unique (UUID) soit { data: [] }
      if (isUuid) {
        setResults(res ? [res] : []);
      } else {
        setResults(res?.data ?? res ?? []);
      }
    } catch (e: any) {
      setSearchError(e.message || 'Erreur de recherche');
    } finally {
      setSearching(false);
    }
  };

  const confirm = async () => {
    if (!selected) return;
    setAdding(true);
    setAddError('');

    try {
      await api.post(`/cabinet/${cabinetId}/companies`, {
        companyId: selected.id,
        startDate: startDate || undefined,
      });
      setDone(true);
    } catch (e: any) {
      setAddError(e.message || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  // ── Rendu : succès ────────────────────────────────────────────────────────

  if (done && selected) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <CabinetSidebar cabinetId={cabinetId} />
        <main className="ml-56 flex items-center justify-center min-h-screen p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={30} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">PME ajoutée avec succès</h1>
            <p className="text-gray-400 text-sm mb-6">
              <span className="text-white font-medium">{selected.tradeName || selected.legalName}</span> est
              maintenant gérée par votre cabinet.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${selected.id}/paie`)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Building2 size={15} />
                Accéder à la saisie paie
              </button>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-sm transition-colors"
              >
                Retour au tableau de bord
              </button>
              <button
                onClick={() => { setSelected(null); setResults(null); setQuery(''); setDone(false); }}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors mt-1"
              >
                Ajouter une autre PME
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Rendu : formulaire ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} />

      <main className="ml-56 p-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Retour
          </button>
          <span className="text-white/20">/</span>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus size={20} className="text-purple-400" />
              Ajouter une PME cliente
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Associez une entreprise existante à votre cabinet
            </p>
          </div>
        </div>

        {/* Note explicative */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl mb-6">
          <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-blue-400/80 text-sm leading-relaxed">
            La PME doit avoir un compte Konza existant. Recherchez-la par nom ou entrez
            directement son identifiant (UUID). Une fois ajoutée, vous pourrez saisir
            ses variables de paie et générer ses bulletins.
          </p>
        </div>

        {/* ── Étape 1 : Recherche ── */}
        {!selected && (
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">Rechercher l'entreprise</h2>
              <p className="text-gray-500 text-xs mt-0.5">Par nom, ou collez l'UUID directement</p>
            </div>

            <div className="p-5">
              <div className="flex gap-2 mb-5">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && search()}
                    placeholder="Nom de l'entreprise ou UUID..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
                <button
                  onClick={search}
                  disabled={searching || !query.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Rechercher
                </button>
              </div>

              {/* Erreur recherche */}
              {searchError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <AlertCircle size={14} className="text-red-400" />
                  <p className="text-red-400 text-sm">{searchError}</p>
                </div>
              )}

              {/* Résultats */}
              {results !== null && (
                results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Aucune entreprise trouvée pour "{query}"
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-3">{results.length} résultat{results.length > 1 ? 's' : ''}</p>
                    {results.map(company => (
                      <button
                        key={company.id}
                        onClick={() => setSelected(company)}
                        className="w-full flex items-center justify-between p-4 bg-white/3 hover:bg-white/[0.07] border border-white/10 hover:border-purple-500/30 rounded-xl transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
                            <span className="text-cyan-400 font-bold text-xs">
                              {company.legalName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {company.tradeName || company.legalName}
                            </p>
                            {company.tradeName && (
                              <p className="text-gray-600 text-xs">{company.legalName}</p>
                            )}
                            <p className="text-gray-500 text-xs">{company.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!company.isActive && (
                            <span className="text-xs text-amber-400 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                              Inactive
                            </span>
                          )}
                          <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-1">
                            <Link2 size={12} /> Sélectionner
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Confirmation ── */}
        {selected && (
          <div className="space-y-4">
            {/* Récap entreprise sélectionnée */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white text-sm">Entreprise sélectionnée</h2>
                <button
                  onClick={() => { setSelected(null); setAddError(''); }}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Changer
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-cyan-400 font-bold text-sm">
                    {selected.legalName.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selected.tradeName || selected.legalName}</p>
                  {selected.tradeName && (
                    <p className="text-gray-500 text-xs">{selected.legalName}</p>
                  )}
                  <p className="text-gray-500 text-xs">{selected.city}</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <h2 className="font-semibold text-white text-sm mb-4">Options</h2>

              <div className="mb-5">
                <label className="block text-sm text-gray-400 mb-2">
                  Date de début de gestion
                  <span className="text-gray-600 text-xs ml-1">(optionnel — aujourd'hui par défaut)</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              {/* Résumé de ce qui va se passer */}
              <div className="space-y-2 p-3 bg-white/3 rounded-xl mb-5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ce qui sera activé</p>
                {[
                  'Accès à la saisie des variables de paie',
                  'Génération des bulletins de salaire',
                  'Export des déclarations (CNSS, TUS, ITS)',
                  'Import depuis Excel / CSV',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Erreur */}
              {addError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{addError}</p>
                </div>
              )}

              <button
                onClick={confirm}
                disabled={adding}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {adding
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Plus size={15} />
                }
                {adding ? 'Ajout en cours...' : 'Confirmer l\'ajout'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}