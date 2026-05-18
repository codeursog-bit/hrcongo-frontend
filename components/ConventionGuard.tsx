// ============================================================================
// 📁 src/components/ConventionGuard.tsx
//
// Source de vérité unique pour la convention collective.
// — Affiche un modal bloquant si aucune convention n'est configurée
// — Affiche un badge discret une fois la convention active
// — Injecte le statut dans les enfants via ConventionContext
//
// Usage :
//   <ConventionGuard>
//     <ContractRupturePage />
//   </ConventionGuard>
//
//   Dans un enfant :
//   const { status, recheckStatus } = useConvention();
// ============================================================================

import { createContext, useContext, useState } from 'react';
import { useConventionGuard, ConventionStatus, PredefinedConvention } from '@/hooks/useConventionGuard';

// ─── Contexte — expose le statut aux enfants sans prop drilling ───────────────

interface ConventionContextValue {
  status:        ConventionStatus | null;
  recheckStatus: () => Promise<void>;
}

const ConventionContext = createContext<ConventionContextValue>({
  status:        null,
  recheckStatus: async () => {},
});

export function useConvention() {
  return useContext(ConventionContext);
}

// ─── Modal de sélection ───────────────────────────────────────────────────────

function ConventionSelectModal({
  predefined,
  activating,
  error,
  onSelect,
}: {
  predefined: PredefinedConvention[];
  activating: boolean;
  error:      string | null;
  onSelect:   (code: string) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState('');
  const [hovered,  setHovered]  = useState('');

  const selectedConv = predefined.find(c => c.code === selected);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#0d1117',
        borderRadius: 20,
        border: '1px solid #1e293b',
        padding: '36px 32px',
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 100px rgba(0,0,0,.6)',
      }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 20,
            background: '#fbbf2415', border: '1px solid #fbbf2430',
            marginBottom: 14,
          }}>
            <span>⚠️</span>
            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, letterSpacing: .5 }}>
              CONVENTION COLLECTIVE REQUISE
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e2e8f0', margin: '0 0 10px' }}>
            Choisissez votre convention collective
          </h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Le module de rupture de contrat applique automatiquement les barèmes légaux
            (indemnités, préavis, retraite) selon la convention de votre secteur d'activité.
            Ce paramètre s'applique à toute l'entreprise et peut être modifié dans{' '}
            <strong style={{ color: '#94a3b8' }}>Paramètres → Convention collective</strong>.
          </p>
        </div>

        {/* Grille des conventions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 10,
          marginBottom: 20,
        }}>
          {predefined.map(c => {
            const isSel = selected === c.code;
            const isHov = hovered  === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setSelected(c.code)}
                onMouseEnter={() => setHovered(c.code)}
                onMouseLeave={() => setHovered('')}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  cursor: 'pointer', transition: 'all .18s',
                  background: isSel ? '#1e1b4b' : isHov ? '#0f172a' : '#080c14',
                  border: `1px solid ${isSel ? '#6366f1' : isHov ? '#1e293b' : '#0f172a'}`,
                  boxShadow: isSel ? '0 0 24px #6366f125' : 'none',
                  outline: 'none',
                }}
              >
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 1,
                  color: isSel ? '#a5b4fc' : '#475569',
                  textTransform: 'uppercase', marginBottom: 6,
                }}>
                  {c.code}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: isSel ? '#e2e8f0' : '#64748b',
                  lineHeight: 1.4,
                }}>
                  {c.name.replace(` - ${c.code}`, '').replace(`${c.code} - `, '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Détail convention sélectionnée */}
        {selectedConv && (
          <div style={{
            padding: '14px 18px', borderRadius: 12, marginBottom: 20,
            background: '#1e1b4b30', border: '1px solid #6366f125',
            fontSize: 13,
          }}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 6 }}>
              {selectedConv.name}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>
              {selectedConv.description}
            </div>
            <div style={{ color: '#475569', fontSize: 11 }}>
              {selectedConv.categories.length} catégories professionnelles —{' '}
              {selectedConv.categories.filter(c => c.minSalary > 0).length} avec salaire minimum défini
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 16,
            background: '#ef444415', border: '1px solid #ef444430',
            fontSize: 13, color: '#fca5a5',
          }}>
            ❌ {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected || activating}
          style={{
            width: '100%', padding: 16, borderRadius: 12,
            cursor: selected && !activating ? 'pointer' : 'not-allowed',
            background: selected ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#1e293b',
            border: 'none',
            color: selected ? '#fff' : '#475569',
            fontSize: 15, fontWeight: 800, letterSpacing: -.3,
            boxShadow: selected ? '0 4px 32px #6366f140' : 'none',
            transition: 'all .3s',
            opacity: activating ? .7 : 1,
          }}
        >
          {activating
            ? '⏳ Activation en cours…'
            : selected
              ? `✓ Activer la convention ${selected}`
              : 'Sélectionnez une convention pour continuer'}
        </button>

        <p style={{
          textAlign: 'center', fontSize: 11, color: '#334155',
          margin: '12px 0 0', lineHeight: 1.5,
        }}>
          Vous pourrez modifier ce choix à tout moment dans{' '}
          <strong style={{ color: '#475569' }}>Paramètres → Convention collective</strong>
        </p>
      </div>
    </div>
  );
}

// ─── Badge convention active ──────────────────────────────────────────────────

function ConventionBadge({ code, name }: { code: string; name: string }) {
  const displayName = name
    .replace(' — République du Congo', '')
    .replace(' — Congo', '')
    .replace(` - ${code}`, '');

  return (
    <div style={{
      padding: '5px 16px',
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12,
    }}>
      <span style={{ color: '#475569' }}>Convention :</span>
      <span style={{
        padding: '2px 10px', borderRadius: 20,
        fontWeight: 700, letterSpacing: .5,
        background: '#1e1b4b', color: '#a5b4fc',
        border: '1px solid #6366f125',
        fontSize: 11, textTransform: 'uppercase',
      }}>
        {code}
      </span>
      <span style={{ color: '#64748b' }}>{displayName}</span>
    </div>
  );
}

// ─── Écran de chargement ──────────────────────────────────────────────────────

function ConventionLoading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0e1a', color: '#475569',
      fontSize: 14, gap: 10,
    }}>
      <span>⏳</span>
      Vérification de la convention collective…
    </div>
  );
}

// ─── Guard principal ──────────────────────────────────────────────────────────

export function ConventionGuard({ children }: { children: React.ReactNode }) {
  const {
    status,
    predefined,
    loading,
    showModal,
    activating,
    error,
    activateConvention,
    recheckStatus,
  } = useConventionGuard();

  if (loading) {
    return <ConventionLoading />;
  }

  return (
    <ConventionContext.Provider value={{ status, recheckStatus }}>

      {/* Modal bloquant si pas de convention — rendu avant children pour bloquer l'interaction */}
      {showModal && (
        <ConventionSelectModal
          predefined={predefined}
          activating={activating}
          error={error}
          onSelect={activateConvention}
        />
      )}

      {/* Badge discret uniquement si convention active et modal fermé */}
      {status?.hasConvention && status.conventionCode && !showModal && (
        <ConventionBadge
          code={status.conventionCode}
          name={status.conventionName ?? status.conventionCode}
        />
      )}

      {children}

    </ConventionContext.Provider>
  );
}