'use client';

// app/(dashboard)/cabinet/[cabinetId]/ajouter-pme/page.tsx
// REMPLACE l'existant — 2 modes : Créer une nouvelle PME OU Lier une PME existante

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2, Search, Plus, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle, Link2, ArrowRight,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

type Mode = 'choose' | 'create' | 'link';

const inputCls = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors";

export default function AjouterPmePage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const [mode, setMode] = useState<Mode>('choose');
  const [done, setDone] = useState<{ name: string; companyId: string } | null>(null);

  // ── MODE CRÉER ──────────────────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [form, setForm] = useState({
    legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '',
    address: '', city: 'Pointe-Noire', phone: '', email: '',
    country: 'CG', startDate: '',
  });

  const handleCreate = async () => {
    if (!form.legalName || !form.rccmNumber || !form.address || !form.city) {
      setCreateErr('Veuillez remplir les champs obligatoires (*)'); return;
    }
    setCreating(true); setCreateErr('');
    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/companies/create`, {
        ...form,
        startDate: form.startDate || undefined,
      });
      const companyId = res.company?.id ?? res.id;
      const name      = form.tradeName || form.legalName;
      setDone({ name, companyId });
    } catch (e: any) {
      setCreateErr(e.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  // ── MODE LIER ───────────────────────────────────────────────────────────────
  const [query,     setQuery]     = useState('');
  const [searching, setSearching] = useState(false);
  const [results,   setResults]   = useState<any[] | null>(null);
  const [searchErr, setSearchErr] = useState('');
  const [selected,  setSelected]  = useState<any | null>(null);
  const [startDate, setStartDate] = useState('');
  const [adding,    setAdding]    = useState(false);
  const [addErr,    setAddErr]    = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchErr(''); setResults(null); setSelected(null);
    try {
      // Essai via endpoint recherche cabinet, fallback sur /companies search
      let list: any[] = [];
      try {
        const res: any = await api.get(
          `/cabinet/${cabinetId}/companies/search?q=${encodeURIComponent(query.trim())}&limit=10`
        );
        list = res?.data ?? res ?? [];
      } catch {
        const res: any = await api.get(`/companies?search=${encodeURIComponent(query.trim())}&limit=10`);
        list = res?.data ?? res ?? [];
      }
      setResults(list);
    } catch (e: any) {
      setSearchErr(e.message || 'Erreur de recherche');
    } finally {
      setSearching(false);
    }
  };

  const handleLink = async () => {
    if (!selected) return;
    setAdding(true); setAddErr('');
    try {
      await api.post(`/cabinet/${cabinetId}/companies`, {
        companyId: selected.id,
        startDate: startDate || undefined,
      });
      setDone({ name: selected.tradeName || selected.legalName, companyId: selected.id });
    } catch (e: any) {
      setAddErr(e.message || 'Erreur lors de la liaison');
    } finally {
      setAdding(false);
    }
  };

  // ── SUCCÈS ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <CabinetSidebar cabinetId={cabinetId} />
        <main className="ml-56 flex items-center justify-center min-h-screen p-8">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">PME ajoutée !</h2>
            <p className="text-gray-400 mb-8">
              <span className="text-white font-semibold">{done.name}</span>{' '}
              est maintenant gérée par votre cabinet.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${done.companyId}/dashboard`)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Ouvrir l'espace PME <ArrowRight size={15} />
              </button>
              <button
                onClick={() => { setDone(null); setMode('choose'); setForm({ legalName:'',tradeName:'',rccmNumber:'',cnssNumber:'',address:'',city:'Pointe-Noire',phone:'',email:'',country:'CG',startDate:'' }); setQuery(''); setResults(null); setSelected(null); }}
                className="w-full px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Ajouter une autre PME
              </button>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} />

      <main className="ml-56 p-8 max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => mode === 'choose' ? router.back() : setMode('choose')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-sm">
            <ArrowLeft size={15} />
            {mode === 'choose' ? 'Retour' : 'Choisir le mode'}
          </button>
          <span className="text-white/20">/</span>
          <div>
            <h1 className="text-xl font-bold text-white">Ajouter une PME cliente</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {mode === 'choose'   ? 'Créer une nouvelle entreprise ou lier une existante'
              : mode === 'create'  ? 'Créer une nouvelle entreprise'
              :                      'Lier une entreprise existante'}
            </p>
          </div>
        </div>

        {/* ── Choix du mode ──────────────────────────────────────────────────── */}
        {mode === 'choose' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                key: 'create' as Mode,
                icon: Plus,
                title: 'Créer une nouvelle PME',
                desc: 'L\'entreprise n\'existe pas encore sur Konza. Vous la créez directement depuis votre espace cabinet.',
                color: '#8b5cf6',
                badge: 'Nouveau',
              },
              {
                key: 'link' as Mode,
                icon: Link2,
                title: 'Lier une PME existante',
                desc: 'L\'entreprise a déjà un compte Konza. Vous la rattachez à votre cabinet pour gérer sa paie.',
                color: '#0ea5e9',
                badge: 'Existante',
              },
            ].map(opt => (
              <button key={opt.key} onClick={() => setMode(opt.key)}
                className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-2xl p-6 text-left transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                       style={{ background: `${opt.color}22`, border: `1px solid ${opt.color}44` }}>
                    <opt.icon size={22} style={{ color: opt.color }} />
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${opt.color}20`, color: opt.color, border: `1px solid ${opt.color}40` }}>
                    {opt.badge}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm mb-2">{opt.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs font-medium"
                     style={{ color: opt.color }}>
                  Choisir <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Formulaire Créer ────────────────────────────────────────────────── */}
        {mode === 'create' && (
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">Informations de l'entreprise</h2>
              <p className="text-gray-500 text-xs mt-0.5">Les champs marqués * sont obligatoires</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Raison sociale *</label>
                  <input value={form.legalName} onChange={e => setForm({...form, legalName: e.target.value})} placeholder="ACME SARL" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nom commercial</label>
                  <input value={form.tradeName} onChange={e => setForm({...form, tradeName: e.target.value})} placeholder="Acme" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">N° RCCM *</label>
                  <input value={form.rccmNumber} onChange={e => setForm({...form, rccmNumber: e.target.value})} placeholder="BZV-01-2024-B12-0001" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">N° CNSS</label>
                  <input value={form.cnssNumber} onChange={e => setForm({...form, cnssNumber: e.target.value})} placeholder="12345678" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Adresse *</label>
                  <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Avenue de l'Indépendance" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Ville *</label>
                  <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Pointe-Noire" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Téléphone</label>
                  <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+242 06 000 0000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email entreprise</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="contact@acme.cg" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Date de début de gestion</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className={inputCls} />
                </div>
              </div>

              {createErr && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{createErr}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {creating ? 'Création...' : 'Créer et ajouter'}
                </button>
                <button onClick={() => setMode('choose')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-sm transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mode Lier ───────────────────────────────────────────────────────── */}
        {mode === 'link' && (
          <div className="space-y-4">
            {/* Recherche */}
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white text-sm">Rechercher une entreprise</h2>
                <p className="text-gray-500 text-xs mt-0.5">Par nom, RCCM ou ID</p>
              </div>
              <div className="p-5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && search()}
                      placeholder="Nom de l'entreprise..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                  <button onClick={search} disabled={searching || !query.trim()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap">
                    {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    {searching ? '...' : 'Rechercher'}
                  </button>
                </div>

                {searchErr && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{searchErr}</p>
                  </div>
                )}

                {results !== null && (
                  <div className="mt-4 space-y-2">
                    {results.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">Aucun résultat</p>
                    ) : (
                      results.map((r: any) => (
                        <button key={r.id} onClick={() => setSelected(r)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                            selected?.id === r.id
                              ? 'bg-purple-500/15 border-purple-500/40 text-white'
                              : 'bg-white/3 border-white/8 hover:border-white/20 text-gray-300'
                          }`}>
                          <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-gray-400">
                              {(r.tradeName || r.legalName).slice(0,2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{r.tradeName || r.legalName}</p>
                            <p className="text-xs text-gray-500">{r.city}</p>
                          </div>
                          {selected?.id === r.id && (
                            <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Confirmation liaison */}
            {selected && (
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Link2 size={16} className="text-purple-400" />
                  <p className="font-semibold text-white text-sm">
                    Lier <span className="text-purple-400">{selected.tradeName || selected.legalName}</span> à votre cabinet
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Date de début de gestion</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
                </div>
                {addErr && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{addErr}</p>
                  </div>
                )}
                <button onClick={handleLink} disabled={adding}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {adding ? <Loader2 size={15} className="animate-spin" /> : <Link2 size={15} />}
                  {adding ? 'Liaison...' : 'Confirmer la liaison'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}