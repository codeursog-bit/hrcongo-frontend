'use client';

// =============================================================================
// app/(dashboard)/cabinet/[cabinetId]/gestionnaires/page.tsx
// REFONTE UX ONLY — Toute la logique originale préservée, zéro Lucide
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:          '#0f1626',
  card:        '#151e30',
  cardHover:   '#1a2540',
  surface:     '#1e2b42',
  border:      'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.14)',
  text:        '#f1f5f9',
  muted:       '#94a3b8',
  dim:         '#475569',
  indigo:      '#6366f1',
  indigoL:     '#818cf8',
  amber:       '#f59e0b',
  cyan:        '#06b6d4',
  emerald:     '#10b981',
  red:         '#ef4444',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoUsers = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 16c0-2.76 2.69-5 6-5s6 2.24 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 9a2.5 2.5 0 010 5M16 16a3.5 3.5 0 00-3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoUserPlus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 13c0-2.21 2.24-4 5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 9v4M10 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoCrown = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 9h10M1 9l1.5-5 3.5 2.5L6 2l2 4.5L11 4l-1.5 5H1z"
      stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
  </svg>
);

const IcoShield = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M6 1L2 3v4c0 2.5 1.8 3.7 4 4.3 2.2-.6 4-1.8 4-4.3V3L6 1z"
      stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M4 6l1.5 1.5L8 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoTrash = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 3.5h10M5 3.5V2.5a1 1 0 012 0v1M5.5 6v5M8.5 6v5M3 3.5l.7 8.5a1 1 0 001 .9h4.6a1 1 0 001-.9L11 3.5"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoAlert = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L1 12h12L7 1.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7 6v3M7 10.5v.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoCheck = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M4.5 7l2 2 3-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoLoader = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
      strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
type CabinetRole = 'CABINET_ADMIN' | 'CABINET_MEMBER';

interface CabinetMember {
  id:     string;
  userId: string;
  role:   CabinetRole;
  user: {
    id:        string;
    email:     string;
    firstName: string | null;
    lastName:  string | null;
    role:      string;
  };
}

const roleConfig: Record<CabinetRole, { label: string; iconEl: JSX.Element; color: string; bgColor: string; borderColor: string }> = {
  CABINET_ADMIN:  {
    label: 'Administrateur',
    iconEl: <IcoCrown color="#f59e0b" />,
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  CABINET_MEMBER: {
    label: 'Membre',
    iconEl: <IcoShield color="#06b6d4" />,
    color: '#06b6d4',
    bgColor: 'rgba(6,182,212,0.1)',
    borderColor: 'rgba(6,182,212,0.25)',
  },
};

function initials(first: string | null, last: string | null, email: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_GRADIENTS = [
  ['#4f46e5','#818cf8'],
  ['#0891b2','#67e8f9'],
  ['#059669','#6ee7b7'],
  ['#d97706','#fcd34d'],
  ['#db2777','#f9a8d4'],
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GestionnairesPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [members,       setMembers]       = useState<CabinetMember[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Formulaire invitation
  const [showForm,    setShowForm]   = useState(false);
  const [invEmail,    setInvEmail]   = useState('');
  const [invRole,     setInvRole]    = useState<CabinetRole>('CABINET_MEMBER');
  const [inviting,    setInviting]   = useState(false);
  const [invError,    setInvError]   = useState('');
  const [invSuccess,  setInvSuccess] = useState('');

  // Suppression en cours
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setCurrentUserId(JSON.parse(stored).id); } catch {}
    }

    api.get(`/cabinet/${cabinetId}`)
      .then((r: any) => setMembers(r.users ?? []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  // ── Inviter ───────────────────────────────────────────────────────────────
  const invite = async () => {
    if (!invEmail.trim()) return;
    setInviting(true);
    setInvError('');
    setInvSuccess('');

    try {
      const newMember: any = await api.post(`/cabinet/${cabinetId}/users`, {
        email: invEmail.trim(),
        role:  invRole,
      });
      setMembers(prev => [...prev, newMember]);
      setInvSuccess(`${invEmail} a été ajouté comme ${roleConfig[invRole].label.toLowerCase()}.`);
      setInvEmail('');
      setShowForm(false);
      setTimeout(() => setInvSuccess(''), 4000);
    } catch (e: any) {
      setInvError(e.message || "Erreur lors de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  // ── Retirer ───────────────────────────────────────────────────────────────
  const remove = async (member: CabinetMember) => {
    const name = member.user.firstName
      ? `${member.user.firstName} ${member.user.lastName ?? ''}`
      : member.user.email;
    if (!confirm(`Retirer ${name} du cabinet ?`)) return;

    setRemoving(member.userId);
    try {
      await api.delete(`/cabinet/${cabinetId}/users/${member.userId}`);
      setMembers(prev => prev.filter(m => m.userId !== member.userId));
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="animate-spin">
        <circle cx="14" cy="14" r="11" stroke={T.indigo} strokeWidth="2"
          strokeDasharray="55" strokeDashoffset="20" strokeLinecap="round"/>
      </svg>
    </div>
  );

  const adminCount = members.filter(m => m.role === 'CABINET_ADMIN').length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${T.border}`,
    borderRadius: 12, fontSize: 14,
    color: T.text, outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <main className="ml-56 p-8" style={{ maxWidth: 'calc(760px + 224px)' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: T.text }}>
              <span style={{ color: T.indigoL }}><IcoUsers /></span>
              Gestionnaires
            </h1>
            <p className="text-sm mt-1" style={{ color: T.muted }}>
              {members.length} membre{members.length > 1 ? 's' : ''} dans ce cabinet
            </p>
          </div>

          <button
            onClick={() => { setShowForm(!showForm); setInvError(''); }}
            className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              padding: '10px 18px',
              background: T.indigo, color: '#fff', border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4f46e5')}
            onMouseLeave={e => (e.currentTarget.style.background = T.indigo)}
          >
            <IcoUserPlus />
            Inviter un gestionnaire
          </button>
        </div>

        {/* ── Feedback succès ───────────────────────────────────────────────── */}
        {invSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
               style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <IcoCheck color={T.emerald} />
            <p className="text-sm" style={{ color: T.emerald }}>{invSuccess}</p>
          </div>
        )}

        {/* ── Erreur globale ────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <IcoAlert color={T.red} />
            <p className="text-sm" style={{ color: T.red }}>{error}</p>
          </div>
        )}

        {/* ── Formulaire invitation ─────────────────────────────────────────── */}
        {showForm && (
          <div className="rounded-2xl overflow-hidden mb-5"
               style={{
                 background: T.card,
                 border: `1px solid ${T.border}`,
                 borderTop: `2px solid ${T.indigo}`,
                 boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
               }}>
            <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <h2 className="font-semibold text-sm" style={{ color: T.text }}>Inviter un gestionnaire</h2>
              <p className="text-xs mt-0.5" style={{ color: T.muted }}>
                L'utilisateur doit déjà avoir un compte Konza
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm mb-2" style={{ color: T.muted }}>Adresse email</label>
                <input
                  type="email"
                  value={invEmail}
                  onChange={e => setInvEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && invite()}
                  placeholder="gestionnaire@cabinet.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = T.indigo)}
                  onBlur={e  => (e.target.style.borderColor = T.border)}
                />
              </div>

              {/* Rôle — 2 cartes sélectionnables */}
              <div>
                <label className="block text-sm mb-2" style={{ color: T.muted }}>Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CABINET_ADMIN', 'CABINET_MEMBER'] as CabinetRole[]).map(role => {
                    const conf     = roleConfig[role];
                    const selected = invRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setInvRole(role)}
                        className="flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background:   selected ? conf.bgColor   : 'rgba(255,255,255,0.03)',
                          border:       `1px solid ${selected ? conf.borderColor : T.border}`,
                          color:        selected ? conf.color      : T.muted,
                        }}
                      >
                        <span className="mt-0.5 shrink-0">{conf.iconEl}</span>
                        <div>
                          <p className="font-medium text-sm">{conf.label}</p>
                          <p className="text-xs opacity-70 mt-0.5">
                            {role === 'CABINET_ADMIN'
                              ? 'Accès complet, peut gérer les membres'
                              : 'Accès aux PME, ne peut pas gérer les membres'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Erreur invitation */}
              {invError && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                     style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <IcoAlert color={T.red} />
                  <p className="text-sm" style={{ color: T.red }}>{invError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={invite}
                  disabled={inviting || !invEmail.trim()}
                  className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    padding: '9px 18px',
                    background: inviting || !invEmail.trim() ? 'rgba(99,102,241,0.4)' : T.indigo,
                    color: '#fff', border: 'none', cursor: inviting ? 'wait' : 'pointer',
                  }}
                >
                  {inviting ? <IcoLoader /> : <IcoUserPlus />}
                  {inviting ? 'Invitation...' : 'Inviter'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${T.border}`,
                    color: T.muted,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Liste des membres ─────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
             style={{
               background: T.card,
               border: `1px solid ${T.border}`,
               boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
             }}>
          <div className="px-5 py-4 flex items-center justify-between"
               style={{ borderBottom: `1px solid ${T.border}` }}>
            <h2 className="font-semibold text-sm" style={{ color: T.text }}>Membres du cabinet</h2>
            <span className="text-xs" style={{ color: T.dim }}>
              {adminCount} admin · {members.length - adminCount} membre{members.length - adminCount > 1 ? 's' : ''}
            </span>
          </div>

          {members.length === 0 ? (
            <div className="p-12 text-center">
              <span style={{ color: T.dim, display: 'block', marginBottom: 12 }}><IcoUsers /></span>
              <p className="text-sm" style={{ color: T.muted }}>Aucun gestionnaire</p>
            </div>
          ) : (
            <div>
              {members.map((member, idx) => {
                const conf        = roleConfig[member.role];
                const isMe        = member.userId === currentUserId;
                const isLastAdmin = member.role === 'CABINET_ADMIN' && adminCount <= 1;
                const displayName = member.user.firstName
                  ? `${member.user.firstName} ${member.user.lastName ?? ''}`.trim()
                  : null;
                const [gFrom, gTo] = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                const init = initials(member.user.firstName, member.user.lastName, member.user.email);

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between px-5 py-4 transition-colors"
                    style={{ borderBottom: idx < members.length - 1 ? `1px solid ${T.border}` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.cardHover)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs text-white"
                        style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                      >
                        {init}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm" style={{ color: T.text }}>
                            {displayName || member.user.email}
                          </p>
                          {isMe && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.08)', color: T.muted, border: `1px solid ${T.border}` }}
                            >
                              Vous
                            </span>
                          )}
                        </div>
                        {displayName && (
                          <p className="text-xs mt-0.5" style={{ color: T.muted }}>{member.user.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Badge rôle */}
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: conf.bgColor,
                          border: `1px solid ${conf.borderColor}`,
                          color: conf.color,
                        }}
                      >
                        {conf.iconEl}
                        {conf.label}
                      </span>

                      {/* Bouton retirer */}
                      {!isMe && !isLastAdmin ? (
                        <button
                          onClick={() => remove(member)}
                          disabled={removing === member.userId}
                          className="p-2 rounded-lg transition-all"
                          style={{ color: T.dim, background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Retirer du cabinet"
                          onMouseEnter={e => {
                            (e.currentTarget.style.background = 'rgba(239,68,68,0.1)');
                            (e.currentTarget.style.color = T.red);
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget.style.background = 'transparent');
                            (e.currentTarget.style.color = T.dim);
                          }}
                        >
                          {removing === member.userId ? <IcoLoader /> : <IcoTrash />}
                        </button>
                      ) : (
                        <div style={{ width: 30 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Note info */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl"
             style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <span className="mt-0.5 shrink-0"><IcoAlert color="rgba(129,140,248,0.8)" /></span>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(129,140,248,0.7)' }}>
            Un cabinet doit toujours avoir au moins un administrateur. Vous ne pouvez pas
            vous retirer vous-même si vous êtes le seul admin.
          </p>
        </div>

      </main>
    </div>
  );
}