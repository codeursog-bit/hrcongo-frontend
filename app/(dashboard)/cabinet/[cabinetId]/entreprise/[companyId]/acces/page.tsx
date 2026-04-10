'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/acces/page.tsx
// MISE À JOUR : affiche le lien d'invitation à copier (fallback email non configuré)

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, Loader2, Send, CheckCircle2, AlertCircle,
  Building2, Users, RefreshCw, Copy, Check, Link2,
  Mail, ExternalLink,
} from 'lucide-react';
import { api } from '@/services/api';

const inputCls = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30 transition-colors";

// ─── Composant : bouton copie lien ────────────────────────────────────────────
function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback pour navigateurs anciens
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        copied
          ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
          : 'bg-white/8 hover:bg-white/12 border border-white/15 text-gray-300 hover:text-white'
      }`}
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Copié !' : 'Copier le lien'}
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AccesPmePage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [link,    setLink]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modules
  const [pmeEnabled, setPmeEnabled] = useState(false);
  const [empEnabled, setEmpEnabled] = useState(false);
  const [savingMod,  setSavingMod]  = useState(false);
  const [savedMod,   setSavedMod]   = useState(false);

  // Invitation
  const [email,      setEmail]      = useState('');
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [inviting,   setInviting]   = useState(false);
  const [inviteErr,  setInviteErr]  = useState('');

  // Résultat invitation — token + URL à copier
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    token: string;
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const cab: any = await api.get(`/cabinet/${cabinetId}`);
        const found = (cab?.companies ?? []).find(
          (c: any) => c.companyId === companyId || c.company?.id === companyId,
        );
        if (found) {
          setLink(found);
          setPmeEnabled(found.pmePortalEnabled      ?? false);
          setEmpEnabled(found.employeeAccessEnabled ?? false);
        }
      } catch {}
      finally { setLoading(false); }
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
    } catch {}
    finally { setSavingMod(false); }
  };

  const sendInvitation = async () => {
    if (!email || !firstName || !lastName) {
      setInviteErr('Tous les champs sont requis');
      return;
    }
    setInviting(true);
    setInviteErr('');
    try {
      const res: any = await api.post(
        `/cabinet/${cabinetId}/companies/${companyId}/invite-admin`,
        { email, firstName, lastName },
      );

      // Construction de l'URL à copier
      const appUrl  = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const token   = res.token as string;
      const inviteUrl = `${appUrl}/auth/accept-invitation/${token}`;

      setInviteResult({
        email,
        token,
        inviteUrl,
        expiresAt: res.expiresAt,
      });
    } catch (e: any) {
      setInviteErr(e.message || "Erreur lors de la génération du lien");
    } finally {
      setInviting(false);
    }
  };

  const resetInvitation = () => {
    setInviteResult(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setInviteErr('');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield size={20} className="text-cyan-400" />
          Accès portail PME
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configurez les modules accessibles et invitez le dirigeant
        </p>
      </div>

      {/* ── Section Modules ────────────────────────────────────────────────── */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Modules accessibles à la PME</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            La génération de paie reste exclusivement gérée par vous
          </p>
        </div>
        <div className="p-5 space-y-4">
          {[
            {
              key:  'pme',
              val:   pmeEnabled,
              set:  setPmeEnabled,
              icon: Building2,
              label:'Portail administrateur PME',
              desc: 'Dashboard, employés, présences, congés, bulletins (lecture), rapports, paramètres',
            },
            {
              key:  'emp',
              val:   empEnabled,
              set:  setEmpEnabled,
              icon: Users,
              label:'Accès app pour les employés',
              desc: 'Pointage, consultation bulletins et congés depuis l\'application mobile',
            },
          ].map(m => (
            <label
              key={m.key}
              className="flex items-start gap-4 p-4 bg-white/3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={m.val}
                onChange={e => m.set(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-cyan-500"
              />
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
            <button
              onClick={saveModules}
              disabled={savingMod}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
            >
              {savingMod ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Sauvegarder
            </button>
            {savedMod && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <CheckCircle2 size={14} /> Sauvegardé
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Invitation ─────────────────────────────────────────────── */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">
            Inviter le dirigeant de la PME
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Un lien sécurisé sera généré — à envoyer par email, SMS ou WhatsApp
          </p>
        </div>

        <div className="p-5">

          {/* ── Résultat : lien généré ─────────────────────────────────────── */}
          {inviteResult ? (
            <div className="space-y-4">

              {/* Succès header */}
              <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Lien généré avec succès</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Pour <span className="text-white">{inviteResult.email}</span> ·
                    Expire le {new Date(inviteResult.expiresAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* URL à copier */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">
                  Lien d'invitation — à envoyer manuellement au dirigeant
                </p>
                <div className="flex items-center gap-2 p-3 bg-black/30 border border-white/10 rounded-xl">
                  <Link2 size={14} className="text-gray-500 shrink-0" />
                  <code className="flex-1 text-xs text-cyan-400 font-mono truncate">
                    {inviteResult.inviteUrl}
                  </code>
                  <CopyLinkButton url={inviteResult.inviteUrl} />
                </div>
              </div>

              {/* Instructions d'envoi */}
              <div className="bg-white/3 rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-400 font-medium mb-3">
                  Comment envoyer ce lien :
                </p>
                {[
                  { icon: Mail,         label: 'Par email',    desc: 'Collez le lien dans votre messagerie (Gmail, Outlook...)' },
                  { icon: ExternalLink, label: 'Par WhatsApp', desc: 'Envoyez le lien directement au dirigeant' },
                  { icon: Copy,         label: 'Par SMS',      desc: 'Copiez et envoyez via votre téléphone' },
                ].map(opt => (
                  <div key={opt.label} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <opt.icon size={12} className="text-gray-500" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-300 font-medium">{opt.label} </span>
                      <span className="text-xs text-gray-500">— {opt.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bouton générer un autre */}
              <button
                onClick={resetInvitation}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
              >
                <RefreshCw size={13} />
                Générer un autre lien
              </button>
            </div>

          ) : (
            /* ── Formulaire invitation ──────────────────────────────────────── */
            <div className="space-y-4">

              {/* Formulaire */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Prénom *</label>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Jean"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Nom *</label>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Dupont"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email du dirigeant *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dirigeant@entreprise.com"
                  className={inputCls}
                />
              </div>

              {/* Info email optionnel */}
              <div className="flex items-start gap-2.5 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                <AlertCircle size={14} className="text-amber-500/70 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/70 leading-relaxed">
                  Si l'envoi email n'est pas configuré, un lien vous sera affiché à copier et envoyer manuellement.
                </p>
              </div>

              {/* Erreur */}
              {inviteErr && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{inviteErr}</p>
                </div>
              )}

              {/* Bouton */}
              <button
                onClick={sendInvitation}
                disabled={inviting || !email || !firstName || !lastName}
                className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors"
              >
                {inviting
                  ? <><Loader2 size={15} className="animate-spin" /> Génération...</>
                  : <><Send size={15} /> Générer le lien d'invitation</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}