'use client';

// app/admin/(protected)/portefeuilles/page.tsx
// Même thème que app/admin/(protected)/users/page.tsx (gray-900/800, accent rouge).

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Search, Building2, Plus, X, Loader2, AlertTriangle, CheckCircle,
  User, Mail, Trash2, ToggleLeft, ToggleRight, UserPlus,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface PortfolioUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  manageMultipleCompanies: boolean;
  maxCompanies: number;
  activeCompany: string | null;
  linkedCompaniesCount: number;
}

interface UserDetail extends PortfolioUserRow {
  companyId: string | null;
  companies: { id: string; name: string; isActive: boolean; isCurrent: boolean }[];
}

interface CompanyOption { id: string; name: string; }

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/15 text-red-300 border-red-500/25',
  ADMIN:       'bg-sky-500/15 text-sky-300 border-sky-500/25',
  HR_MANAGER:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

// ─── Sélecteur d'entreprise existante (recherche live) ────────────────────────

function CompanySearchPicker({ onPick, excludeIds = [] }: { onPick: (c: CompanyOption) => void; excludeIds?: string[] }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      adminService.getCompanies({ search: q })
        .then((list: any[]) => setResults((list ?? []).filter(c => !excludeIds.includes(c.id))))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, excludeIds]);

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher une entreprise..."
          className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600"
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-500" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => { onPick(c); setQ(''); setResults([]); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
            >
              <Building2 size={13} className="text-gray-500 shrink-0" /> {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panneau détail d'un user (compagnies, flag) ──────────────────────────────

function UserDetailPanel({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [maxCompanies, setMaxCompanies] = useState<number>(5);

  const load = useCallback(() => {
    setLoading(true);
    adminService.getPortfolioUserDetail(userId)
      .then((d: UserDetail) => { setDetail(d); setMaxCompanies(d.maxCompanies ?? 5); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      load();
      onChanged();
    } catch (e: any) {
      setError(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white">Gestion du portefeuille</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500"><X size={18} /></button>
        </div>

        {loading || !detail ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-red-500" /></div>
        ) : (
          <div className="px-6 py-5 space-y-5 overflow-y-auto">
            <div>
              <p className="text-sm font-semibold text-white">{detail.firstName} {detail.lastName}</p>
              <p className="text-xs text-gray-500">{detail.email}</p>
            </div>

            <div className="flex items-center justify-between bg-gray-800/60 rounded-xl p-4">
              <div>
                <p className="text-sm font-medium text-white">Multi-entreprises</p>
                <p className="text-xs text-gray-500">Accès au portefeuille et à ses pages dédiées</p>
              </div>
              <button
                onClick={() => runAction(() => adminService.togglePortfolioFlag(userId, !detail.manageMultipleCompanies, maxCompanies))}
                disabled={busy}
                className="shrink-0"
              >
                {detail.manageMultipleCompanies
                  ? <ToggleRight size={30} className="text-emerald-500" />
                  : <ToggleLeft size={30} className="text-gray-600" />}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 shrink-0">Quota max. entreprises</label>
              <input
                type="number"
                value={maxCompanies}
                onChange={e => setMaxCompanies(Number(e.target.value))}
                onBlur={() => runAction(() => adminService.togglePortfolioFlag(userId, detail.manageMultipleCompanies, maxCompanies))}
                className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-gray-600"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">
                Entreprises liées ({detail.companies.length})
              </p>
              <div className="space-y-1.5">
                {detail.companies.length === 0 ? (
                  <p className="text-xs text-gray-600 py-2">Aucune entreprise liée pour l'instant.</p>
                ) : detail.companies.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-800/60 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 size={13} className="text-gray-500 shrink-0" />
                      <span className="text-sm text-gray-200 truncate">{c.name}</span>
                      {c.isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 shrink-0">active</span>}
                      {!c.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 shrink-0">inactive</span>}
                    </div>
                    <button
                      onClick={() => runAction(() => adminService.detachCompanyFromUser(userId, c.id))}
                      disabled={busy}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Rattacher une entreprise existante</p>
              <CompanySearchPicker
                excludeIds={detail.companies.map(c => c.id)}
                onPick={c => runAction(() => adminService.attachCompanyToUser(userId, c.id))}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                <AlertTriangle size={13} className="shrink-0" /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal création d'un user multi-entreprises ────────────────────────────────

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maxCompanies, setMaxCompanies] = useState(5);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || !firstName || !lastName) { setError('Tous les champs sont obligatoires'); return; }
    if (companies.length === 0) { setError('Sélectionnez au moins une entreprise'); return; }
    setSaving(true);
    setError('');
    try {
      await adminService.createPortfolioUser({
        email, password, firstName, lastName,
        companyIds: companies.map(c => c.id),
        maxCompanies,
      });
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="text-sm font-bold text-white">Créer un user multi-entreprises</h3>
          {!saving && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500"><X size={18} /></button>}
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénom"
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600" />
            <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom"
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600" />
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe initial"
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 outline-none focus:border-gray-600" />

          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 shrink-0">Quota max. entreprises</label>
            <input type="number" value={maxCompanies} onChange={e => setMaxCompanies(Number(e.target.value))}
              className="w-20 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white outline-none focus:border-gray-600" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Entreprises à rattacher *</p>
            <CompanySearchPicker
              excludeIds={companies.map(c => c.id)}
              onPick={c => setCompanies(list => [...list, c])}
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {companies.map(c => (
                <span key={c.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200">
                  {c.name}
                  <button onClick={() => setCompanies(list => list.filter(x => x.id !== c.id))} className="text-gray-500 hover:text-red-400">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Créer le compte
          </button>
          <button onClick={onClose} disabled={saving} className="px-4 py-2.5 border border-gray-700 text-gray-400 rounded-xl text-sm hover:bg-gray-800 transition-colors">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PortfoliosAdminPage() {
  const [users, setUsers] = useState<PortfolioUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; s: string } | null>(null);

  const load = useCallback((q?: string) => {
    setLoading(true);
    adminService.searchPortfolioUsers(q)
      .then((list: PortfolioUserRow[]) => setUsers(list ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const portfolioCount = users.filter(u => u.manageMultipleCompanies).length;

  return (
    <div className="space-y-6">
      {openUserId && (
        <UserDetailPanel
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
          onChanged={() => { setMsg({ t: 'ok', s: 'Modifications enregistrées' }); load(search); }}
        />
      )}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); setMsg({ t: 'ok', s: 'Compte créé avec succès' }); load(search); }}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layers className="text-red-500" size={24} /> Portefeuilles multi-entreprises
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {portfolioCount} compte{portfolioCount > 1 ? 's' : ''} multi-entreprises sur {users.length} affiché{users.length > 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm transition-colors shadow-lg">
          <Plus size={16} /> Créer un user multi-entreprises
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium
          ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.t === 'ok' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />} {msg.s}
        </div>
      )}

      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un user par email, nom…"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder:text-gray-700 outline-none focus:border-gray-600 transition-colors" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-bold text-white">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-red-500" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <User size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setOpenUserId(u.id)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-red-400">
                    {(u.firstName?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-white">{u.firstName} {u.lastName}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ROLE_STYLE[u.role] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                      {u.role}
                    </span>
                    {u.manageMultipleCompanies && (
                      <span className="flex items-center gap-1 text-[10px] text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md">
                        <Layers size={9} /> Multi-entreprises
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Mail size={10} /> {u.email}
                    {u.activeCompany && <span className="ml-2 text-gray-700">· actif sur {u.activeCompany}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold text-white">{u.linkedCompaniesCount}</span>
                  <span className="text-[11px] text-gray-500">entreprise{u.linkedCompaniesCount > 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}