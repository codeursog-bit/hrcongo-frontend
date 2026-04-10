'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/acces/page.tsx
// Cabinet configure l'accès portail PME et invite le dirigeant

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, Loader2, Send, CheckCircle2, AlertCircle,
  Building2, Users, RefreshCw, Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/services/api';

const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30 transition-colors";

export default function AccesPmePage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [link,     setLink]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);

  // Modules
  const [pmeEnabled, setPmeEnabled] = useState(false);
  const [empEnabled, setEmpEnabled] = useState(false);
  const [savingMod,  setSavingMod]  = useState(false);
  const [savedMod,   setSavedMod]   = useState(false);

  // Invitation
  const [email,      setEmail]     = useState('');
  const [firstName,  setFirstName] = useState('');
  const [lastName,   setLastName]  = useState('');
  const [inviting,   setInviting]  = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [inviteErr,  setInviteErr]  = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const cab: any = await api.get(`/cabinet/${cabinetId}`);
        const found = cab?.companies?.find((c: any) =>
          c.companyId === companyId || c.company?.id === companyId
        );
        if (found) {
          setLink(found);
          setPmeEnabled(found.pmePortalEnabled      ?? false);
          setEmpEnabled(found.employeeAccessEnabled  ?? false);
        }
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [cabinetId, companyId]);

  const saveModules = async () => {
    setSavingMod(true);
    try {
      await api.patch(`/cabinet/${cabinetId}/companies/${companyId}/access`, {
        pmePortalEnabled:      pmeEnabled,
        employeeAccessEnabled: empEnabled,
      });
      setSavedMod(true);
      setTimeout(() => setSavedMod(false), 2500);
    } catch {} finally { setSavingMod(false); }
  };

  const sendInvitation = async () => {
    if (!email || !firstName || !lastName) {
      setInviteErr('Tous les champs sont requis'); return;
    }
    setInviting(true); setInviteErr('');
    try {
      await api.post(`/cabinet/${cabinetId}/companies/${companyId}/invite-admin`, {
        email, firstName, lastName,
      });
      setInviteDone(true);
    } catch (e: any) {
      setInviteErr(e.message || "Erreur lors de l'envoi");
    } finally { setInviting(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-600" />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" /> Accès portail PME
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configurez ce que la PME peut voir et invitez le dirigeant
        </p>
      </div>

      {/* Modules */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Modules accessibles</h2>
          <p className="text-gray-500 text-xs mt-0.5">La paie reste exclusivement gérée par le cabinet</p>
        </div>
        <div className="p-5 space-y-4">
          {[
            {
              key: 'pme', checked: pmeEnabled, onChange: setPmeEnabled,
              icon: Building2, label: 'Portail administrateur PME',
              desc: 'Le dirigeant accède : dashboard, employés, présences (lecture), congés, bulletins (lecture), rapports, paramètres sans fiscal',
            },
            {
              key: 'emp', checked: empEnabled, onChange: setEmpEnabled,
              icon: Users, label: 'Accès employés',
              desc: 'Les employés peuvent : pointer, consulter leurs bulletins, leurs congés, leur profil',
            },
          ].map(m => (
            <label key={m.key} className="flex items-start gap-4 p-4 bg-white/3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
              <input type="checkbox" checked={m.checked} onChange={e => m.onChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-cyan-500" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <m.icon size={14} className="text-gray-400" />
                  <p className="text-sm font-medium text-white">{m.label}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{m.desc}</p>
              </div>
            </label>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={saveModules} disabled={savingMod}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
              {savingMod ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Sauvegarder
            </button>
            {savedMod && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 size={14} /> Sauvegardé</span>}
          </div>
        </div>
      </div>

      {/* Invitation dirigeant */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Inviter le dirigeant de la PME</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            L'email envoyé sera à votre nom et couleurs de cabinet — sans mention de Konza
          </p>
        </div>
        <div className="p-5">
          {inviteDone ? (
            <div className="text-center py-6">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Invitation envoyée !</p>
              <p className="text-gray-400 text-sm mb-4">{email} recevra un lien valable 7 jours</p>
              <button onClick={() => { setInviteDone(false); setEmail(''); setFirstName(''); setLastName(''); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mx-auto">
                <RefreshCw size={13} /> Envoyer une autre invitation
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Prénom *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nom *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dupont" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email du dirigeant *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="dirigeant@entreprise.com" className={inputClass} />
              </div>

              <div className="bg-white/3 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                <p className="text-gray-400 font-medium mb-1">L'email contiendra :</p>
                <p>· Votre logo et couleurs cabinet (white-label)</p>
                <p>· Un lien sécurisé valable 7 jours</p>
                <p>· Redirection vers l'interface PME après inscription</p>
              </div>

              {inviteErr && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{inviteErr}</p>
                </div>
              )}

              <button onClick={sendInvitation} disabled={inviting || !email || !firstName || !lastName}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
                {inviting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {inviting ? 'Envoi...' : 'Envoyer l\'invitation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}