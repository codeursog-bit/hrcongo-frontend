'use client';

// app/(dashboard)/portefeuille/equipe/page.tsx

import React, { useEffect, useState } from 'react';
import {
  Users, Plus, X, Loader2, AlertCircle, CheckCircle2, Clock, Copy, Check,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!email || !firstName || !lastName) { setError('Tous les champs sont obligatoires'); return; }
    setSaving(true);
    setError('');
    try {
      const res: any = await api.post('/portfolio/team/invite', { email, firstName, lastName });
      const url = `${window.location.origin}/auth/accept-portfolio-invitation/${res.token}`;
      setLink(url);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'invitation");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && (link ? onCreated() : onClose())} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Inviter un co-admin</h2>
          {!saving && <button onClick={() => (link ? onCreated() : onClose())} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>}
        </div>

        {link ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              Invitation envoyée à {email}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Si l'email n'est pas configuré ou n'arrive pas, partagez ce lien directement :
            </p>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className={inputCls} style={{ color: 'var(--text)' }} />
              <button onClick={copyLink} className="p-2.5 rounded-xl shrink-0 hover:bg-[var(--surface-2)]" style={{ border: '1px solid var(--border)', color: 'var(--text)' }}>
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
            <button onClick={onCreated} className="w-full px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
              Terminé
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                La personne invitée aura les mêmes droits que vous : accès à toutes les entreprises actuelles de votre portefeuille.
              </p>
              <Field label="Prénom *">
                <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
              <Field label="Nom *">
                <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
              <Field label="Email *">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} style={{ color: 'var(--text)' }} />
              </Field>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertCircle size={14} className="shrink-0" />{error}
              </div>
            )}

            <div className="flex items-center gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? 'Envoi…' : "Envoyer l'invitation"}
              </button>
              <button onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PortfolioTeamPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Invitation[]>('/portfolio/team')
      .then(list => setInvitations(list ?? []))
      .catch(() => setInvitations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onCreated={() => { setShowInvite(false); load(); }} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Équipe</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Les personnes que vous invitez ont les mêmes droits que vous sur votre portefeuille
          </p>
        </div>
        <button onClick={() => setShowInvite(true)} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2">
          <Plus size={18} /> Inviter un co-admin
        </button>
      </div>

      {invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <Users size={24} style={{ color: 'var(--text-muted)' }} className="mb-3" />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Aucune invitation envoyée</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Invitez un associé ou un collègue à co-gérer vos entreprises.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="grid px-4 py-3" style={{ gridTemplateColumns: '1fr 150px 150px', gap: 12, borderBottom: '1px solid var(--border)' }}>
            {['Email', 'Statut', 'Envoyée le'].map((h, i) => (
              <p key={i} className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</p>
            ))}
          </div>
          {invitations.map(inv => {
            const expired = !inv.accepted && new Date(inv.expiresAt) < new Date();
            return (
              <div key={inv.id} className="grid items-center px-4 py-3" style={{ gridTemplateColumns: '1fr 150px 150px', gap: 12, borderBottom: '1px solid var(--border)' }}>
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{inv.email}</p>
                {inv.accepted ? (
                  <span className="inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 size={11} /> Acceptée
                  </span>
                ) : expired ? (
                  <span className="inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    Expirée
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock size={11} /> En attente
                  </span>
                )}
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}