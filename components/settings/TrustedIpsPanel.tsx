'use client';
// ============================================================================
// 📁 components/settings/TrustedIpsPanel.tsx  (NOUVEAU)
// Liste des IP publiques de confiance de l'entreprise (secours du GPS).
// ============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Wifi, Trash2, Plus, AlertTriangle, Check, Ban, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

interface TrustedIp { id: string; label: string; ip: string; isActive: boolean }
// IP apprise automatiquement (≥ quorum personnes différentes ont pointé au GPS depuis cette IP < 24 h)
interface LearnedIp { ip: string; people: number; lastSeenAt: string; blocked: boolean; active: boolean; quorum: number }

const fmtIp = (ip: string) => ip.replace('::/64', '… (réseau IPv6)');
const fmtAgo = (iso: string) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  return `il y a ${Math.round(min / 60)} h`;
};

export default function TrustedIpsPanel({ companyId }: { companyId: string | null }) {
  const alert = useAlert();
  const [items, setItems] = useState<TrustedIp[]>([]);
  const [learned, setLearned] = useState<LearnedIp[]>([]);
  const [myIp, setMyIp] = useState<{ ip: string | null; usable: boolean; recognized?: boolean; via?: 'ADMIN' | 'LEARNED' | null } | null>(null);
  const [label, setLabel] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [list, mine, auto]: any[] = await Promise.all([
        api.get(`/companies/${companyId}/trusted-ips`),
        api.get(`/companies/${companyId}/trusted-ips/my-ip`),
        api.get(`/companies/${companyId}/trusted-ips/learned`).catch(() => []),
      ]);
      setItems(list ?? []);
      setMyIp(mine ?? null);
      setLearned(auto ?? []);
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

  // Valider en permanent : l'IP apprise devient une IP de confiance saisie (n'expire plus)
  const promote = async (ip: string) => {
    if (!companyId) return;
    const name = window.prompt('Nom de ce wifi (ex. Siège) :', 'Wifi du site');
    if (!name || !name.trim()) return;
    try {
      await api.post(`/companies/${companyId}/trusted-ips/learned/promote`, { ip, label: name.trim() });
      await load();
      alert.success('IP validée', name.trim());
    } catch (e: any) { alert.error('Erreur', e.message || 'Impossible de valider cette IP.'); }
  };

  // Révoquer : l'IP apprise n'est plus acceptée tant qu'elle est vue
  const revoke = async (ip: string) => {
    if (!companyId || !confirm("Ne plus accepter cette IP apprise ? (ex. : c'était un forfait mobile)")) return;
    try {
      await api.post(`/companies/${companyId}/trusted-ips/learned/revoke`, { ip });
      await load();
    } catch (e: any) { alert.error('Erreur', e.message || 'Impossible de révoquer cette IP.'); }
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
        <br />
        <strong>Automatique :</strong> si l'IP de votre box change, elle est apprise toute seule dès que 3 personnes
        différentes ont pointé avec succès au GPS depuis cette même IP (valable 24 h, renouvelée à chaque pointage).
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
      {myIp?.usable && (
        myIp.recognized ? (
          <p className="text-xs text-emerald-600 flex items-center gap-1 mb-4">
            <Check size={12} className="shrink-0" />
            Cette connexion est reconnue comme wifi de l'entreprise
            {myIp.via === 'LEARNED' ? ' (apprise automatiquement)' : ' (enregistrée)'}.
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Cette connexion n'est pas encore reconnue. Si vous êtes sur le wifi du site, cliquez « Ajouter » pour l'enregistrer
            (utile surtout si l'IP de la box a changé après un redémarrage) — sinon elle sera apprise toute seule après 3 pointages GPS réussis.
            Rien d'obligatoire.
          </p>
        )
      )}
      {myIp && !myIp.usable && (
        <p className="text-xs text-amber-600 flex items-center gap-1 mb-4">
          <AlertTriangle size={12} className="shrink-0" />
          Cette adresse est privée/locale (proxy ?) : elle ne peut pas être enregistrée. Vérifiez TRUST_PROXY sur le serveur.
        </p>
      )}

      {/* 🆕 IP apprises automatiquement */}
      <div className="mb-5">
        <h4 className="text-sm font-bold text-[var(--text)] mb-2 flex items-center gap-2">
          <Sparkles size={15} className="text-amber-500" /> IP apprises automatiquement (24 dernières heures)
        </h4>
        {learned.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">Aucune pour l'instant — elles apparaissent après des pointages GPS réussis.</p>
        ) : (
          <div className="space-y-2">
            {learned.map(l => (
              <div key={l.ip} className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                <Wifi size={16} className={l.active ? 'text-emerald-500 shrink-0' : 'text-[var(--text-muted)] shrink-0'} />
                <span className="font-mono text-xs text-[var(--text)]">{fmtIp(l.ip)}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {l.people} personne{l.people > 1 ? 's' : ''} · {fmtAgo(l.lastSeenAt)}
                </span>
                <span className={`text-xs font-bold ${l.blocked ? 'text-red-500' : l.active ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {l.blocked ? 'Révoquée' : l.active ? 'Acceptée' : `En observation (${l.people}/${l.quorum})`}
                </span>
                {!l.blocked && (
                  <div className="ml-auto flex items-center gap-1">
                    <button type="button" onClick={() => promote(l.ip)} title="Valider en permanent"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10" aria-label="Valider en permanent">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => revoke(l.ip)} title="Ne plus accepter"
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" aria-label="Révoquer">
                      <Ban size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-[var(--text-muted)] mt-2">
          Si vous voyez une IP « Acceptée » qui n'est pas celle de votre wifi (par ex. des employés sur le même forfait mobile),
          révoquez-la. « Valider » la garde en permanence.
        </p>
      </div>

      <h4 className="text-sm font-bold text-[var(--text)] mb-2">IP enregistrées (permanentes)</h4>
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