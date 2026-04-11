'use client';

// app/(dashboard)/cabinet/[cabinetId]/ajouter-pme/page.tsx
// API INCHANGÉE — UX refactorisée + modal "fonctionnalité non disponible" pour Lier

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import { C, Ico, Btn, Card, InputField, Banner } from '@/components/cabinet/cabinet-ui';

type Mode = 'choose' | 'create';

// ─── Modal "fonctionnalité non disponible" ────────────────────────────────────

function UnavailableModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Carte modale */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 420, margin: '0 16px',
            background: C.cardBg,
            border: `1px solid ${C.border}`,
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            animation: 'modal-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Bande colorée en haut */}
          <div style={{
            height: 4,
            background: `linear-gradient(90deg, ${C.amber}, ${C.violet})`,
          }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Icône */}
            <div style={{
              width: 52, height: 52, borderRadius: 14, marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.25)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v5c0 6 4.5 9.8 10 11.5 5.5-1.7 10-5.5 10-11.5V7L12 2z"
                  stroke={C.amber} strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M12 8v5M12 15.5v.5" stroke={C.amber} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>

            {/* Titre */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>
              Fonctionnalité bientôt disponible
            </h2>

            {/* Corps */}
            <p style={{ fontSize: 14, lineHeight: 1.65, color: C.textSecondary, marginBottom: 8 }}>
              La liaison d'une PME existante à votre cabinet est en cours de développement.
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: C.textMuted, marginBottom: 24 }}>
              En attendant, vous pouvez <strong style={{ color: C.textSecondary }}>créer directement l'entreprise</strong> depuis votre espace cabinet — c'est rapide et vous aurez accès à toutes les fonctionnalités immédiatement.
            </p>

            {/* Badge "Bientôt" */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 999,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              marginBottom: 24,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.amber }}>
                Prévue dans une prochaine mise à jour
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: C.indigo, color: '#fff', border: 'none',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Créer une nouvelle PME
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${C.border}`,
                  color: C.textSecondary,
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation keyframe injectée une seule fois */}
      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AjouterPmePage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const [mode,           setMode]           = useState<Mode>('choose');
  const [showUnavailable,setShowUnavailable] = useState(false);
  const [done,           setDone]           = useState<{ name: string; companyId: string } | null>(null);

  // ── État formulaire création ─────────────────────────────────────────────
  const [creating,  setCreating]  = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [form, setForm] = useState({
    legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '',
    address: '', city: 'Pointe-Noire', phone: '', email: '',
    country: 'CG', startDate: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.legalName || !form.rccmNumber || !form.address || !form.city) {
      setCreateErr('Veuillez remplir les champs obligatoires (*)');
      return;
    }
    setCreating(true);
    setCreateErr('');
    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/companies/create`, {
        ...form,
        startDate: form.startDate || undefined,
      });
      const companyId = res.company?.id ?? res.id;
      setDone({ name: form.tradeName || form.legalName, companyId });
    } catch (e: any) {
      setCreateErr(e.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const resetAll = () => {
    setDone(null);
    setMode('choose');
    setForm({
      legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '',
      address: '', city: 'Pointe-Noire', phone: '', email: '',
      country: 'CG', startDate: '',
    });
    setCreateErr('');
  };

  // ── Succès ───────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: C.pageBg, color: C.textPrimary, display: 'flex' }}>
        <CabinetSidebar cabinetId={cabinetId} />
        <main style={{
          marginLeft: 224, flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 32,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            {/* Icône succès */}
            <div style={{
              width: 80, height: 80, borderRadius: 22, margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 0 40px rgba(16,185,129,0.12)',
            }}>
              <Ico.Check size={36} color={C.emerald} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>
              PME ajoutée avec succès !
            </h2>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 28, lineHeight: 1.6 }}>
              <strong style={{ color: C.textPrimary }}>{done.name}</strong> est maintenant gérée par votre cabinet.
              Vous pouvez commencer à configurer sa paie.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${done.companyId}/dashboard`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 13,
                  background: C.indigo, color: '#fff',
                  fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Ouvrir l'espace PME <Ico.ArrowRight size={14} color="#fff" />
              </button>
              <button
                onClick={resetAll}
                style={{
                  padding: '12px 20px', borderRadius: 13,
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${C.border}`,
                  color: C.textSecondary, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'background 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                Ajouter une autre PME
              </button>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: C.textMuted, transition: 'color 150ms', padding: '6px 0',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
                onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* Modal fonctionnalité non disponible */}
      {showUnavailable && (
        <UnavailableModal
          onClose={() => {
            setShowUnavailable(false);
            setMode('create'); // redirige vers création
          }}
        />
      )}

      <div style={{ minHeight: '100vh', background: C.pageBg, color: C.textPrimary, display: 'flex' }}>
        <CabinetSidebar cabinetId={cabinetId} />

        <main style={{ marginLeft: 224, flex: 1, padding: '32px 32px', maxWidth: 680 }}>

          {/* ── Breadcrumb + titre ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <button
              onClick={() => mode === 'choose' ? router.back() : setMode('choose')}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: C.textMuted, fontSize: 13, background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px 8px', borderRadius: 8,
                transition: 'color 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.textSecondary)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
            >
              <Ico.ArrowLeft size={14} color="currentColor" />
              {mode === 'choose' ? 'Retour' : 'Choisir le mode'}
            </button>

            <span style={{ color: C.border }}>·</span>

            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary }}>
                Ajouter une PME cliente
              </h1>
              <p style={{ fontSize: 13, color: C.textSecondary, marginTop: 2 }}>
                {mode === 'choose'
                  ? 'Créer une nouvelle entreprise ou lier une existante'
                  : 'Renseignez les informations de la nouvelle entreprise'}
              </p>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              MODE CHOOSE — cartes de sélection
              ══════════════════════════════════════════════ */}
          {mode === 'choose' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Créer une nouvelle PME */}
              <button
                onClick={() => setMode('create')}
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18, padding: 24,
                  textAlign: 'left', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => {
                  (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)');
                  (e.currentTarget.style.background) = C.cardBgHover;
                  (e.currentTarget.style.boxShadow) = `0 4px 20px rgba(99,102,241,0.1)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.borderColor) = C.border;
                  (e.currentTarget.style.background) = C.cardBg;
                  (e.currentTarget.style.boxShadow) = '0 2px 8px rgba(0,0,0,0.25)';
                }}
              >
                {/* Icône + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}>
                    <Ico.Plus size={22} color={C.indigo} />
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: C.indigoL,
                  }}>
                    Nouveau
                  </span>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
                  Créer une nouvelle PME
                </h3>
                <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.65, marginBottom: 16 }}>
                  L'entreprise n'existe pas encore sur la plateforme. Vous la créez directement depuis votre espace cabinet.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.indigoL }}>
                  Choisir <Ico.ArrowRight size={11} color="currentColor" />
                </div>
              </button>

              {/* Lier une PME existante — ouvre le modal */}
              <button
                onClick={() => setShowUnavailable(true)}
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18, padding: 24,
                  textAlign: 'left', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  transition: 'all 150ms',
                  position: 'relative',
                  opacity: 0.85,
                }}
                onMouseEnter={e => {
                  (e.currentTarget.style.borderColor) = 'rgba(245,158,11,0.3)';
                  (e.currentTarget.style.background) = C.cardBgHover;
                  (e.currentTarget.style.opacity) = '1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.borderColor) = C.border;
                  (e.currentTarget.style.background) = C.cardBg;
                  (e.currentTarget.style.opacity) = '0.85';
                }}
              >
                {/* Icône + badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.2)',
                  }}>
                    <Ico.Link size={22} color={C.cyan} />
                  </div>
                  {/* Badge "Bientôt" */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    color: C.amber,
                  }}>
                    Bientôt
                  </span>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>
                  Lier une PME existante
                </h3>
                <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.65, marginBottom: 16 }}>
                  L'entreprise a déjà un compte sur la plateforme. Rattachez-la à votre cabinet pour gérer sa paie.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.amber }}>
                  En cours de développement <Ico.Alert size={11} color="currentColor" />
                </div>
              </button>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              MODE CREATE — formulaire
              ══════════════════════════════════════════════ */}
          {mode === 'create' && (
            <div
              style={{
                background: C.cardBg,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
            >
              {/* Header section */}
              <div style={{
                padding: '18px 22px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <Ico.Building size={16} color={C.indigoL} />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
                    Informations de l'entreprise
                  </p>
                  <p style={{ fontSize: 12, color: C.textMuted }}>Les champs marqués * sont obligatoires</p>
                </div>
              </div>

              {/* Champs */}
              <div style={{ padding: '22px 22px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <InputField
                    label="Raison sociale *"
                    value={form.legalName}
                    onChange={e => set('legalName', e.target.value)}
                    placeholder="ACME SARL"
                  />
                  <InputField
                    label="Nom commercial"
                    value={form.tradeName}
                    onChange={e => set('tradeName', e.target.value)}
                    placeholder="Acme"
                  />
                  <InputField
                    label="N° RCCM *"
                    value={form.rccmNumber}
                    onChange={e => set('rccmNumber', e.target.value)}
                    placeholder="BZV-01-2024-B12-0001"
                  />
                  <InputField
                    label="N° CNSS"
                    value={form.cnssNumber}
                    onChange={e => set('cnssNumber', e.target.value)}
                    placeholder="12345678"
                  />
                  <InputField
                    label="Adresse *"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="Avenue de l'Indépendance"
                  />
                  <InputField
                    label="Ville *"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Pointe-Noire"
                  />
                  <InputField
                    label="Téléphone"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="+242 06 000 0000"
                  />
                  <InputField
                    label="Email entreprise"
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="contact@acme.cg"
                  />
                  <InputField
                    label="Date de début de gestion"
                    type="date"
                    value={form.startDate}
                    onChange={e => set('startDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Erreur */}
              {createErr && (
                <div style={{ padding: '0 22px 14px' }}>
                  <Banner
                    icon={<Ico.Alert size={14} color={C.red} />}
                    title={createErr}
                    color={C.red}
                  />
                </div>
              )}

              {/* Actions */}
              <div style={{
                padding: '18px 22px',
                borderTop: `1px solid ${C.border}`,
                display: 'flex', gap: 10, alignItems: 'center',
              }}>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '10px 22px', borderRadius: 12,
                    background: C.indigo, color: '#fff',
                    fontSize: 13, fontWeight: 600, border: 'none',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.65 : 1,
                    transition: 'opacity 150ms',
                  }}
                  onMouseEnter={e => { if (!creating) (e.currentTarget.style.opacity = '0.88'); }}
                  onMouseLeave={e => { if (!creating) (e.currentTarget.style.opacity = '1'); }}
                >
                  {creating ? <Ico.Loader size={14} color="#fff" /> : <Ico.Plus size={14} color="#fff" />}
                  {creating ? 'Création en cours…' : 'Créer et ajouter'}
                </button>

                <button
                  onClick={() => setMode('choose')}
                  style={{
                    padding: '10px 18px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${C.border}`,
                    color: C.textSecondary, fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}