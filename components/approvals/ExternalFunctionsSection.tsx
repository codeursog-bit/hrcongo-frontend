'use client';

// ============================================================================
// 📁 components/approvals/ExternalFunctionsSection.tsx
// ✅ Avis inter-entreprises — visible UNIQUEMENT pour un admin multi-entreprises.
//    Permet de donner à un utilisateur (ex. le comptable de l'entreprise A) une
//    fonction d'avis dans d'AUTRES entreprises du portefeuille (B, C…). Cette
//    personne ne se connecte pas à ces entreprises : elle reçoit et donne
//    seulement des avis (menu « Avis à donner »). Enregistrement immédiat.
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

type Fn = { code: string; canSign: boolean };
type Company = { id: string; name: string; functions: Fn[] };
type Catalog = { code: string; label: string; description: string }[];

export default function ExternalFunctionsSection({ userId }: { userId: string }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [catalog, setCatalog] = useState<Catalog>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ catalog: Catalog; companies: Company[] }>(`/approvals/functions/external/${userId}`);
      setCatalog(res.catalog || []);
      setCompanies(res.companies || []);
      setAvailable((res.companies || []).length > 0);
    } catch {
      // 403 (pas admin multi-entreprises) / backend ancien → section masquée.
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const save = async (companyId: string, next: Fn[]) => {
    setBusy(companyId);
    setError(null);
    try {
      await api.put(`/approvals/functions/external/${userId}`, { companyId, functions: next });
      setCompanies(prev => prev.map(c => (c.id === companyId ? { ...c, functions: next } : c)));
    } catch (e: any) {
      setError(e?.message || 'Enregistrement impossible');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="py-2"><Loader2 size={14} className="animate-spin text-[var(--text-muted)]" /></div>;
  if (!available) return null;

  return (
    <div>
      <label className="block text-sm font-bold mb-1 text-[var(--text)] flex items-center gap-1.5">
        <Globe size={14} /> Avis pour d&apos;autres entreprises
      </label>
      <p className="text-xs text-[var(--text-muted)] mb-3">
        Cette personne pourra donner son avis sur les demandes de ces entreprises, sans pouvoir s&apos;y connecter ni voir la paie. Chaque changement est enregistré immédiatement.
      </p>
      {error && <p className="text-xs font-semibold text-red-600 mb-2">{error}</p>}
      <div className="space-y-3">
        {companies.map(c => (
          <div key={c.id} className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-[var(--text)]">{c.name}</p>
              {busy === c.id && <Loader2 size={14} className="animate-spin text-emerald-500" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {catalog.map(fn => {
                const cur = c.functions.find(f => f.code === fn.code);
                return (
                  <button
                    key={fn.code}
                    type="button"
                    disabled={busy === c.id}
                    title={fn.description}
                    onClick={() => save(c.id, cur ? c.functions.filter(f => f.code !== fn.code) : [...c.functions, { code: fn.code, canSign: false }])}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${cur ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}
                  >
                    {fn.label}
                  </button>
                );
              })}
            </div>
            {c.functions.length > 0 && (
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={c.functions.some(f => f.canSign)}
                  disabled={busy === c.id}
                  onChange={e => save(c.id, c.functions.map(f => ({ ...f, canSign: e.target.checked })))}
                  className="w-4 h-4 accent-emerald-500"
                />
                <span className="text-xs font-medium text-[var(--text)]">Peut signer (sa signature figure sur les fiches de cette entreprise)</span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}