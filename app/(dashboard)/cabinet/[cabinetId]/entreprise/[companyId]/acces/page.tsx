'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/acces/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Btn, Badge,
  PageHeader, SectionHeader, InputField,
  Banner, InfoNote, LoadingInline,
} from '@/components/cabinet/cabinet-ui';

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Btn
      variant={copied ? 'success' : 'ghost'}
      size="sm"
      icon={copied ? <Ico.Check size={13} color={C.emerald} /> : <Ico.Copy size={13} color={C.textSecondary} />}
      onClick={copy}
    >
      {copied ? 'Copié !' : 'Copier le lien'}
    </Btn>
  );
}

export default function AccesPmePage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const [link,        setLink]        = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [pmeEnabled,  setPmeEnabled]  = useState(false);
  const [empEnabled,  setEmpEnabled]  = useState(false);
  const [savingMod,   setSavingMod]   = useState(false);
  const [savedMod,    setSavedMod]    = useState(false);
  const [email,       setEmail]       = useState('');
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [inviting,    setInviting]    = useState(false);
  const [inviteErr,   setInviteErr]   = useState('');
  const [inviteResult, setInviteResult] = useState<{
    email: string; token: string; inviteUrl: string; expiresAt: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/cabinet/${cabinetId}`)
      .then((cab: any) => {
        const found = (cab?.companies ?? []).find(
          (c: any) => c.companyId === companyId || c.company?.id === companyId,
        );
        if (found) {
          setLink(found);
          setPmeEnabled(found.pmePortalEnabled      ?? false);
          setEmpEnabled(found.employeeAccessEnabled ?? false);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
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
      const appUrl    = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const token     = res.token as string;
      const inviteUrl = `${appUrl}/auth/accept-invitation/${token}`;
      setInviteResult({ email, token, inviteUrl, expiresAt: res.expiresAt });
    } catch (e: any) {
      setInviteErr(e.message || 'Erreur lors de la génération du lien');
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

  if (loading) return <LoadingInline />;

  const MODULE_OPTIONS = [
    {
      key: 'pme',
      val: pmeEnabled,
      set: setPmeEnabled,
      icon: <Ico.Building size={16} color={C.cyan} />,
      label: 'Portail administrateur PME',
      desc: 'Dashboard, employés, présences, congés, bulletins (lecture), rapports, paramètres',
    },
    {
      key: 'emp',
      val: empEnabled,
      set: setEmpEnabled,
      icon: <Ico.Users size={16} color={C.emerald} />,
      label: 'Accès app pour les employés',
      desc: 'Pointage, consultation bulletins et congés depuis l\'application mobile',
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-2xl" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Accès portail PME"
        sub="Configurez les modules accessibles et invitez le dirigeant"
        icon={<Ico.Shield size={18} color={C.cyan} />}
      />

      {/* ── Modules ── */}
      <Card>
        <SectionHeader
          title="Modules accessibles à la PME"
          sub="La génération de paie reste exclusivement gérée par vous"
        />
        <div className="p-5 space-y-3">
          {MODULE_OPTIONS.map(m => (
            <label
              key={m.key}
              className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderHover)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              <input
                type="checkbox"
                checked={m.val}
                onChange={e => m.set(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded"
                style={{ accentColor: C.cyan }}
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {m.icon}
                  <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{m.label}</p>
                  {m.val && <Badge label="Activé" variant="success" />}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.textSecondary }}>{m.desc}</p>
              </div>
            </label>
          ))}

          <div className="flex items-center gap-3 pt-1">
            <Btn
              variant="primary"
              icon={savingMod ? <Ico.Loader size={13} color="#fff" /> : <Ico.Check size={13} color="#fff" />}
              onClick={saveModules}
              disabled={savingMod}
            >
              Sauvegarder
            </Btn>
            {savedMod && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: C.emerald }}>
                <Ico.Check size={13} color={C.emerald} /> Sauvegardé
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── Invitation ── */}
      <Card>
        <SectionHeader
          title="Inviter le dirigeant de la PME"
          sub="Un lien sécurisé sera généré — à envoyer par email, SMS ou WhatsApp"
        />
        <div className="p-5">

          {inviteResult ? (
            /* ── Résultat ── */
            <div className="space-y-4">
              <Banner
                icon={<Ico.Check size={16} color={C.emerald} />}
                title="Lien généré avec succès"
                sub={`Pour ${inviteResult.email} · Expire le ${new Date(inviteResult.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                color={C.emerald}
              />

              <div>
                <p className="text-xs font-medium mb-2" style={{ color: C.textSecondary }}>
                  Lien d'invitation — à envoyer manuellement au dirigeant
                </p>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${C.border}` }}
                >
                  <Ico.Link size={13} color={C.textMuted} />
                  <code className="flex-1 text-xs truncate" style={{ color: C.cyan }}>
                    {inviteResult.inviteUrl}
                  </code>
                  <CopyLinkButton url={inviteResult.inviteUrl} />
                </div>
              </div>

              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}
              >
                <p className="text-xs font-medium mb-3" style={{ color: C.textSecondary }}>
                  Comment envoyer ce lien :
                </p>
                {[
                  { icon: <Ico.Mail size={12} color={C.textMuted} />,         label: 'Par email',    desc: 'Collez le lien dans votre messagerie (Gmail, Outlook...)' },
                  { icon: <Ico.ExternalLink size={12} color={C.textMuted} />, label: 'Par WhatsApp', desc: 'Envoyez le lien directement au dirigeant' },
                  { icon: <Ico.Copy size={12} color={C.textMuted} />,         label: 'Par SMS',      desc: 'Copiez et envoyez via votre téléphone' },
                ].map(opt => (
                  <div key={opt.label} className="flex items-start gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}` }}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: C.textSecondary }}>{opt.label} </span>
                      <span className="text-xs" style={{ color: C.textMuted }}>— {opt.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={resetInvitation}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: C.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
              >
                <Ico.Refresh size={13} color="currentColor" />
                Générer un autre lien
              </button>
            </div>

          ) : (
            /* ── Formulaire ── */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Prénom *" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jean" />
                <InputField label="Nom *"    value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Dupont" />
              </div>
              <InputField
                label="Email du dirigeant *"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="dirigeant@entreprise.com"
              />

              <InfoNote color={C.amber}>
                Si l'envoi email n'est pas configuré, un lien vous sera affiché à copier et envoyer manuellement.
              </InfoNote>

              {inviteErr && (
                <Banner
                  icon={<Ico.Alert size={14} color={C.red} />}
                  title={inviteErr}
                  color={C.red}
                />
              )}

              <Btn
                variant="primary"
                icon={inviting ? <Ico.Loader size={14} color="#fff" /> : <Ico.Send size={14} color="#fff" />}
                onClick={sendInvitation}
                disabled={inviting || !email || !firstName || !lastName}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {inviting ? 'Génération en cours…' : 'Générer le lien d\'invitation'}
              </Btn>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}