'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/gestionnaires/page.tsx
// REFONTE UX — Gestion membres cabinet, design système cabinet-ui
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, TopBar, Card, SectionHeader, Badge,
  Avatar, Btn, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';

// ─── Types ────────────────────────────────────────────────────────────────────
type CabinetRole = 'CABINET_ADMIN' | 'CABINET_MEMBER';

interface CabinetMember {
  id: string; userId: string; role: CabinetRole;
  user: { id: string; email: string; firstName: string | null; lastName: string | null; role: string };
}

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<CabinetRole, { label: string; variant: any; icon: React.ReactNode }> = {
  CABINET_ADMIN:  { label: 'Administrateur', variant: 'warning', icon: <Ico.Crown  size={13} color={C.amber} /> },
  CABINET_MEMBER: { label: 'Membre',          variant: 'info',    icon: <Ico.Shield size={13} color={C.cyan}  /> },
};

function displayName(m: CabinetMember) {
  const { firstName, lastName, email } = m.user;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  return email;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GestionnairesPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [members,       setMembers]       = useState<CabinetMember[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showForm,      setShowForm]      = useState(false);
  const [invEmail,      setInvEmail]      = useState('');
  const [invRole,       setInvRole]       = useState<CabinetRole>('CABINET_MEMBER');
  const [submitting,    setSubmitting]    = useState(false);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [success,       setSuccess]       = useState('');

  const loadMembers = async () => {
    setLoading(true);
    try {
      const cabinet: any = await api.get(`/cabinet/${cabinetId}`);
      setMembers(cabinet.users ?? []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setCurrentUserId(JSON.parse(stored).id); } catch {} }
    loadMembers();
  }, [cabinetId]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api.post(`/cabinet/${cabinetId}/users`, { email: invEmail, role: invRole });
      setSuccess('Gestionnaire ajouté avec succès');
      setInvEmail(''); setShowForm(false);
      loadMembers();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const remove = async (memberId: string) => {
    if (!confirm('Retirer ce gestionnaire ?')) return;
    setDeleting(memberId);
    try {
      await api.delete(`/cabinet/${cabinetId}/users/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (e: any) { setError(e.message); }
    finally { setDeleting(null); }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <div className="ml-56">
        <TopBar
          title="Gestionnaires"
          subtitle={`${members.length} membre${members.length > 1 ? 's' : ''} dans ce cabinet`}
          breadcrumb="Cabinet"
          action={
            <Btn
              variant="primary"
              icon={<Ico.Plus size={14} color="#fff" />}
              onClick={() => setShowForm(!showForm)}
            >
              Ajouter
            </Btn>
          }
        />

        <div className="p-8 space-y-5">

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, color: '#f87171' }}>
              <Ico.Alert size={14} color="#f87171" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.2)`, color: '#34d399' }}>
              <Ico.Check size={14} color="#34d399" /> {success}
            </div>
          )}

          {/* ── Formulaire invitation ───────────────────────────────────── */}
          {showForm && (
            <Card accentColor={C.indigo} className="p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: C.textPrimary }}>
                Inviter un gestionnaire
              </p>
              <form onSubmit={invite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSecondary }}>
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={invEmail}
                    onChange={e => setInvEmail(e.target.value)}
                    placeholder="prenom@cabinet.com"
                    required
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e  => (e.target.style.borderColor = C.border)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSecondary }}>
                    Rôle
                  </label>
                  <select
                    value={invRole}
                    onChange={e => setInvRole(e.target.value as CabinetRole)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                  >
                    <option value="CABINET_MEMBER">Membre</option>
                    <option value="CABINET_ADMIN">Administrateur</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <Btn variant="primary" type="submit">
                    {submitting ? 'Envoi…' : 'Ajouter'}
                  </Btn>
                  <Btn variant="ghost" type="button" onClick={() => setShowForm(false)}>Annuler</Btn>
                </div>
              </form>
            </Card>
          )}

          {/* ── Liste membres ───────────────────────────────────────────── */}
          <Card>
            <SectionHeader title="Membres du cabinet" sub="Accès et rôles" />
            <div>
              {members.map((member, idx) => {
                const rc   = ROLE_CFG[member.role] ?? ROLE_CFG['CABINET_MEMBER'];
                const name = displayName(member);
                const isMe = member.userId === currentUserId;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors"
                    style={{ borderBottom: idx < members.length - 1 ? `1px solid ${C.border}` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.cardBgHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar name={name} size={36} index={idx} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{name}</p>
                        {isMe && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(99,102,241,0.15)', color: C.indigoL }}
                          >
                            Vous
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{member.user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {rc.icon}
                      <Badge label={rc.label} variant={rc.variant} />
                    </div>

                    {!isMe && (
                      <button
                        onClick={() => remove(member.id)}
                        disabled={deleting === member.id}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: C.textMuted }}
                        onMouseEnter={e => {
                          (e.currentTarget.style.background = 'rgba(239,68,68,0.1)');
                          (e.currentTarget.style.color) = '#f87171';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget.style.background = 'transparent');
                          (e.currentTarget.style.color) = C.textMuted;
                        }}
                      >
                        {deleting === member.id
                          ? <Ico.Loader size={16} />
                          : (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 3.5h10M5 3.5V2.5a1 1 0 012 0v1M5.5 6v5M8.5 6v5M3 3.5l.7 8.5a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}