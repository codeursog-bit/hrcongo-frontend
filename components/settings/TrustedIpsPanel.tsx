'use client';
// ============================================================================
// 📁 components/settings/TrustedIpsPanel.tsx  (NOUVEAU)
// Liste des IP publiques de confiance de l'entreprise (secours du GPS).
// ============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Wifi, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

interface TrustedIp { id: string; label: string; ip: string; isActive: boolean }

export default function TrustedIpsPanel({ companyId }: { companyId: string | null }) {
  const alert = useAlert();
  const [items, setItems] = useState<TrustedIp[]>([]);
  const [myIp, setMyIp] = useState<{ ip: string | null; usable: boolean } | null>(null);
  const [label, setLabel] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [list, mine]: any[] = await Promise.all([
        api.get(`/companies/${companyId}/trusted-ips`),
        api.get(`/companies/${companyId}/trusted-ips/my-ip`),
      ]);
      setItems(list ?? []);
      setMyIp(mine ?? null);
    } catch { /* section facultative : on n'empêche pas la page de s'afficher */ }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!companyId) return;
    if (!label.trim()) { alert.error('Libellé requis', 'Ex. : Siège, Atelier…'); return; }
    setBusy(true);
    try {
      await api.post(`/companies/${companyId}/trusted-ips`, {
        label: label.trim(),
        ...(manualIp.trim() ? { ip: manualIp.trim() } : {}),
      });
      setLabel(''); setManualIp('');
      await load();
      alert.success('IP enregistrée', label.trim());
    } catch (e: any) {
      alert.error('Erreur', e.message || "Impossible d'enregistrer l'IP.");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!companyId || !confirm('Supprimer cette IP de confiance ?')) return;
    try {
      await api.delete(`/companies/${companyId}/trusted-ips/${id}`);
      setItems(s => s.filter(x => x.id !== id));
    } catch (e: any) { alert.error('Erreur', e.message); }
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
      <h3 className="font-bold text-[var(--text)] mb-1 flex items-center gap-2">
        <Wifi size={18} className="text-emerald-500" /> Wifi de l'entreprise (IP de confiance)
      </h3>
      <p className="text-xs text-[var(--text-muted)] mb-4">
        Si le GPS d'un employé dit « trop loin » mais qu'il est connecté au wifi de l'entreprise, son pointage est accepté.
        Plusieurs wifi sur la même connexion internet ont la même IP : une seule entrée suffit.
        Sans effet en données mobiles (4G).
      </p>

      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Libellé (Siège, Atelier…)"
          className="flex-1 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]" />
        <input value={manualIp} onChange={e => setManualIp(e.target.value)} placeholder="IP (vide = mon IP actuelle)"
          className="flex-1 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]" />
        <button type="button" onClick={add} disabled={busy}
          className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        IP actuelle vue par le serveur : <span className="font-mono">{myIp?.ip ?? '—'}</span>
        {' '}· à ajouter <strong>depuis le wifi du site</strong>, pas en 4G.
      </p>
      {myIp && !myIp.usable && (
        <p className="text-xs text-amber-600 flex items-center gap-1 mb-4">
          <AlertTriangle size={12} className="shrink-0" />
          Cette adresse est privée/locale (proxy ?) : elle ne peut pas être enregistrée. Vérifiez TRUST_PROXY sur le serveur.
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Aucune IP enregistrée.</p>
      ) : (
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <Wifi size={16} className="text-emerald-500 shrink-0" />
              <span className="font-bold text-[var(--text)]">{i.label}</span>
              <span className="font-mono text-xs text-[var(--text-muted)]">{i.ip}</span>
              <button type="button" onClick={() => remove(i.id)} className="ml-auto text-red-500 p-1" aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}