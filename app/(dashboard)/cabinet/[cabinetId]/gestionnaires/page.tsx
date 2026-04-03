'use client';

// =============================================================================
// FICHIER : app/(dashboard)/cabinet/[cabinetId]/gestionnaires/page.tsx
// ACTION  : CRÉER (nouveau fichier)
// RÔLE    : Gestion des membres du cabinet (gestionnaires).
//           Appelle :
//           - GET  /cabinet/:cabinetId           → liste via findById (users inclus)
//           - POST /cabinet/:cabinetId/users      → AddCabinetUserDto { email, role }
//           - DELETE /cabinet/:cabinetId/users/:userId → retirer un gestionnaire
//           Accessible via la sidebar (item "Gestionnaires").
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users, UserPlus, Trash2, Loader2, AlertCircle,
  CheckCircle2, Crown, Shield, User,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

type CabinetRole = 'CABINET_ADMIN' | 'CABINET_MEMBER';

interface CabinetMember {
  id:     string; // id du CabinetUser (lien)
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

const roleConfig: Record<CabinetRole, { label: string; icon: any; color: string; bg: string }> = {
  CABINET_ADMIN:  { label: 'Administrateur', icon: Crown,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20'  },
  CABINET_MEMBER: { label: 'Membre',          icon: Shield, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'    },
};

function initials(first: string | null, last: string | null, email: string) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function GestionnairesPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [members,    setMembers]    = useState<CabinetMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Formulaire invitation
  const [showForm,   setShowForm]   = useState(false);
  const [invEmail,   setInvEmail]   = useState('');
  const [invRole,    setInvRole]    = useState<CabinetRole>('CABINET_MEMBER');
  const [inviting,   setInviting]   = useState(false);
  const [invError,   setInvError]   = useState('');
  const [invSuccess, setInvSuccess] = useState('');

  // Suppression en cours
  const [removing,   setRemoving]   = useState<string | null>(null);

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

  // ── Inviter un gestionnaire ───────────────────────────────────────────────

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
      // Le back renvoie un CabinetUser avec user inclus
      setMembers(prev => [...prev, newMember]);
      setInvSuccess(`${invEmail} a été ajouté comme ${roleConfig[invRole].label.toLowerCase()}.`);
      setInvEmail('');
      setShowForm(false);
      setTimeout(() => setInvSuccess(''), 4000);
    } catch (e: any) {
      setInvError(e.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  // ── Retirer un gestionnaire ───────────────────────────────────────────────

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
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  const adminCount = members.filter(m => m.role === 'CABINET_ADMIN').length;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} />

      <main className="ml-56 p-8 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users size={22} className="text-purple-400" />
              Gestionnaires
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {members.length} membre{members.length > 1 ? 's' : ''} dans ce cabinet
            </p>
          </div>

          <button
            onClick={() => { setShowForm(!showForm); setInvError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <UserPlus size={15} />
            Inviter un gestionnaire
          </button>
        </div>

        {/* Message succès */}
        {invSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <p className="text-emerald-400 text-sm">{invSuccess}</p>
          </div>
        )}

        {/* Erreur globale */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-5">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Formulaire invitation ── */}
        {showForm && (
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-5">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">Inviter un gestionnaire</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                L'utilisateur doit déjà avoir un compte Konza
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Adresse email</label>
                <input
                  type="email"
                  value={invEmail}
                  onChange={e => setInvEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && invite()}
                  placeholder="gestionnaire@cabinet.com"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CABINET_ADMIN', 'CABINET_MEMBER'] as CabinetRole[]).map(role => {
                    const conf = roleConfig[role];
                    const Icon = conf.icon;
                    const selected = invRole === role;
                    return (
                      <button
                        key={role}
                        onClick={() => setInvRole(role)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          selected
                            ? `${conf.bg} border-current ${conf.color}`
                            : 'bg-white/3 border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} className="mt-0.5 shrink-0" />
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
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{invError}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={invite}
                  disabled={inviting || !invEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {inviting ? 'Invitation...' : 'Inviter'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl text-sm transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Liste des membres ── */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">
              Membres du cabinet
            </h2>
            <span className="text-xs text-gray-500">{adminCount} admin · {members.length - adminCount} membre{members.length - adminCount > 1 ? 's' : ''}</span>
          </div>

          {members.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={28} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun gestionnaire</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {members.map(member => {
                const conf     = roleConfig[member.role];
                const RoleIcon = conf.icon;
                const isMe     = member.userId === currentUserId;
                const isLastAdmin = member.role === 'CABINET_ADMIN' && adminCount <= 1;
                const displayName = member.user.firstName
                  ? `${member.user.firstName} ${member.user.lastName ?? ''}`.trim()
                  : null;

                return (
                  <div key={member.userId}
                    className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors">

                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-purple-400 font-bold text-xs">
                          {initials(member.user.firstName, member.user.lastName, member.user.email)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm">
                            {displayName || member.user.email}
                          </p>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 border border-white/15 text-gray-400 rounded-full">
                              Vous
                            </span>
                          )}
                        </div>
                        {displayName && (
                          <p className="text-gray-500 text-xs">{member.user.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Badge rôle */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${conf.bg} ${conf.color}`}>
                        <RoleIcon size={11} />
                        {conf.label}
                      </span>

                      {/* Bouton retirer */}
                      {!isMe && !isLastAdmin && (
                        <button
                          onClick={() => remove(member)}
                          disabled={removing === member.userId}
                          className="p-1.5 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          title="Retirer du cabinet"
                        >
                          {removing === member.userId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                        </button>
                      )}

                      {/* Placeholder pour alignement si pas de bouton retirer */}
                      {(isMe || isLastAdmin) && <div className="w-7" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <AlertCircle size={13} className="text-blue-400 shrink-0 mt-0.5" />
          <p className="text-blue-400/70 text-xs leading-relaxed">
            Un cabinet doit toujours avoir au moins un administrateur. Vous ne pouvez pas
            vous retirer vous-même si vous êtes le seul admin.
          </p>
        </div>
      </main>
    </div>
  );
}