// ============================================================================
// 🏢 PAGE LISTE DES ENTREPRISES — Super Admin
// ============================================================================
// Fichier: frontend/app/admin/companies/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, Search, RefreshCw, Users, TrendingUp,
  ChevronRight, Loader2, CheckCircle2, XCircle, Archive,
  Ban, PlayCircle, ArchiveRestore,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const fmt     = (n: number) => n?.toLocaleString('fr-FR') ?? '0';
const fmtFcfa = (n: number) => `${fmt(n)} F`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR',
  { day: '2-digit', month: 'short', year: 'numeric' });

const PLAN_STYLE: Record<string, string> = {
  FREE:       'bg-slate-500/15 text-slate-300 border-slate-500/25',
  BASIC:      'bg-sky-500/15 text-sky-300 border-sky-500/25',
  PRO:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  ENTERPRISE: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
};

const STATUS_STYLE: Record<string, string> = {
  Active:    'bg-emerald-400',
  Suspended: 'bg-amber-400',
  Archived:  'bg-gray-600',
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [plan,      setPlan]      = useState('');
  const [busyId,    setBusyId]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getCompanies({
        status,
        plan,
        search,
        includeArchived: status === 'Archived',
      });
      setCompanies(Array.isArray(r) ? r : r?.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [status, plan, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const active    = companies.filter(c => c.status === 'Active').length;
  const suspended = companies.filter(c => c.status === 'Suspended').length;
  const totalMrr  = companies.reduce((s, c) => s + (c.mrr ?? 0), 0);

  const toggleStatus = async (e: React.MouseEvent, c: any) => {
    e.preventDefault();
    e.stopPropagation();
    const activating = c.status !== 'Active';
    const label = activating ? 'réactiver' : 'suspendre';
    if (!window.confirm(`Confirmer : ${label} "${c.name}" ?`)) return;
    setBusyId(c.id);
    try {
      await adminService.updateCompanyStatus(c.id, activating);
      await load();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const toggleArchive = async (e: React.MouseEvent, c: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (c.status === 'Archived') {
      if (!window.confirm(`Désarchiver "${c.name}" ?`)) return;
      setBusyId(c.id);
      try {
        await adminService.unarchiveCompany(c.id);
        await load();
      } catch (err: any) {
        alert(err.message || 'Erreur');
      } finally {
        setBusyId(null);
      }
      return;
    }
    const reason = window.prompt(`Archiver "${c.name}" — raison (optionnel) :`);
    if (reason === null) return; // annulé
    setBusyId(c.id);
    try {
      await adminService.archiveCompany(c.id, reason || undefined);
      await load();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-red-500" size={24} /> Gestion des Entreprises
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {companies.length} entreprise{companies.length > 1 ? 's' : ''} sur la plateforme
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Total',      v: fmt(companies.length), c: 'text-white',       I: Building2    },
          { l: 'Actives',    v: fmt(active),            c: 'text-emerald-400', I: CheckCircle2 },
          { l: 'Suspendues', v: fmt(suspended),         c: 'text-amber-400',   I: XCircle      },
          { l: 'MRR total',  v: fmtFcfa(totalMrr),      c: 'text-sky-400',     I: TrendingUp   },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <s.I size={14} className={s.c} />
              <span className="text-[11px] text-gray-600">{s.l}</span>
            </div>
            <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise…"
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-700 outline-none focus:border-gray-600 transition-colors" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:border-gray-600 transition-colors">
          <option value="">Tous les statuts</option>
          <option value="Active">Actives</option>
          <option value="Suspended">Suspendues</option>
          <option value="Archived">Archivées</option>
        </select>
        <select value={plan} onChange={e => setPlan(e.target.value)}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:border-gray-600 transition-colors">
          <option value="">Tous les plans</option>
          <option value="FREE">Free</option>
          <option value="BASIC">Basic</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-600">
            <Building2 size={36} className="mb-2 opacity-20" />
            <p className="text-sm">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 px-5 py-3 border-b border-gray-800">
              {['Entreprise','Plan','Employés','MRR','Inscrite le','Actions'].map((h, i) => (
                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-gray-800">
              {companies.map((c, i) => (
                <div key={i}
                  onClick={() => router.push(`/admin/companies/${c.id}`)}
                  className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_140px] gap-4 items-center px-5 py-4 hover:bg-gray-800/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/15 flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-sky-400">
                        {(c.name ?? '?')[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                      <p className="text-xs text-gray-600 truncate">{c.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PLAN_STYLE[c.plan] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {c.plan ?? '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-300">
                    <Users size={12} className="text-gray-600" />
                    {fmt(c.employees ?? 0)}
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">{fmtFcfa(c.mrr ?? 0)}</p>
                  <p className="text-xs text-gray-600">{c.joinedDate ? fmtDate(c.joinedDate) : '—'}</p>

                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    {busyId === c.id ? (
                      <Loader2 size={14} className="animate-spin text-gray-500" />
                    ) : (
                      <>
                        <div className={`w-2 h-2 rounded-full mr-1 ${STATUS_STYLE[c.status] ?? 'bg-gray-600'}`} title={c.status} />
                        {c.status !== 'Archived' && (
                          <button
                            onClick={e => toggleStatus(e, c)}
                            title={c.status === 'Active' ? 'Suspendre' : 'Réactiver'}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                            {c.status === 'Active' ? <Ban size={13} /> : <PlayCircle size={13} />}
                          </button>
                        )}
                        <button
                          onClick={e => toggleArchive(e, c)}
                          title={c.status === 'Archived' ? 'Désarchiver' : 'Archiver'}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                          {c.status === 'Archived' ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                        </button>
                        <ChevronRight size={14} className="text-gray-700" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}