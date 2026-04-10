'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/parametres/page.tsx
// REFONTE UX — Paramètres cabinet, onglets Général + Branding
// ============================================================================

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, TopBar, Card, SectionHeader, Btn, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';

type Tab = 'general' | 'branding';

export default function ParametresPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [tab,     setTab]    = useState<Tab>('general');
  const [cabinet, setCabinet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  const [name,           setName]           = useState('');
  const [email,          setEmail]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [logo,           setLogo]           = useState('');
  const [primaryColor,   setPrimaryColor]   = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');

  useEffect(() => {
    api.get(`/cabinet/${cabinetId}`)
      .then((r: any) => {
        setCabinet(r);
        setName(r.name ?? ''); setEmail(r.email ?? ''); setPhone(r.phone ?? '');
        setLogo(r.logo ?? ''); setPrimaryColor(r.primaryColor ?? '#6366f1'); setSecondaryColor(r.secondaryColor ?? '#8b5cf6');
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload = tab === 'general'
        ? { name, email, phone }
        : { logo, primaryColor, secondaryColor };
      await api.patch(`/cabinet/${cabinetId}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingScreen />;

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${C.border}`,
    color: C.textPrimary,
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all';

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: C.textSecondary }}>{label}</label>
      {children}
    </div>
  );

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general',  label: 'Général',  icon: <Ico.Settings size={14} color={tab === 'general'  ? '#fff' : C.textSecondary} /> },
    { id: 'branding', label: 'Branding', icon: <Ico.Palette  size={14} color={tab === 'branding' ? '#fff' : C.textSecondary} /> },
  ];

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <div className="ml-56">
        <TopBar
          title="Paramètres"
          subtitle={cabinet?.name ?? 'Mon cabinet'}
          breadcrumb="Cabinet"
          action={
            <Btn variant="primary" icon={<Ico.Check size={14} color="#fff" />} onClick={save}>
              {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
            </Btn>
          }
        />

        <div className="p-8 space-y-5">

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                 style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, color: '#f87171' }}>
              <Ico.Alert size={14} color="#f87171" /> {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl w-fit"
               style={{ background: C.cardBg, border: `1px solid ${C.border}` }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: tab === t.id ? C.indigo : 'transparent',
                  color: tab === t.id ? '#fff' : C.textSecondary,
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Général */}
          {tab === 'general' && (
            <Card accentColor={C.indigo} className="p-6">
              <p className="text-sm font-semibold mb-5" style={{ color: C.textPrimary }}>
                Informations générales
              </p>
              <div className="space-y-4">
                <Field label="Nom du cabinet">
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Cabinet Expertise Comptable" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e  => (e.target.style.borderColor = C.border)} />
                </Field>
                <Field label="Email de contact">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="contact@cabinet.com" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e  => (e.target.style.borderColor = C.border)} />
                </Field>
                <Field label="Téléphone">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+242 06 000 0000" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = C.indigo)}
                    onBlur={e  => (e.target.style.borderColor = C.border)} />
                </Field>
              </div>
            </Card>
          )}

          {/* Branding */}
          {tab === 'branding' && (
            <Card accentColor={C.violet} className="p-6">
              <p className="text-sm font-semibold mb-5" style={{ color: C.textPrimary }}>
                Identité visuelle (White-label)
              </p>
              <div className="space-y-5">
                <Field label="URL du logo">
                  <input type="url" value={logo} onChange={e => setLogo(e.target.value)}
                    placeholder="https://votre-cabinet.com/logo.png" className={inputCls} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = C.violet)}
                    onBlur={e  => (e.target.style.borderColor = C.border)} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Couleur principale">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-lg border"
                        style={{ background: primaryColor, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                        onClick={() => document.getElementById('pc')?.click()}
                      />
                      <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        className={inputCls} style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => (e.target.style.borderColor = C.violet)}
                        onBlur={e  => (e.target.style.borderColor = C.border)} />
                      <input type="color" id="pc" value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)} style={{ display: 'none' }} />
                    </div>
                  </Field>
                  <Field label="Couleur secondaire">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-lg"
                        style={{ background: secondaryColor, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                        onClick={() => document.getElementById('sc')?.click()}
                      />
                      <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                        className={inputCls} style={{ ...inputStyle, flex: 1 }}
                        onFocus={e => (e.target.style.borderColor = C.violet)}
                        onBlur={e  => (e.target.style.borderColor = C.border)} />
                      <input type="color" id="sc" value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)} style={{ display: 'none' }} />
                    </div>
                  </Field>
                </div>
                {/* Preview */}
                {(primaryColor || logo) && (
                  <div className="pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                    <p className="text-xs mb-3" style={{ color: C.textMuted }}>Aperçu</p>
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {logo && <img src={logo} alt="logo" className="h-8 w-auto rounded object-contain" onError={e => (e.currentTarget.style.display = 'none')} />}
                      <div
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ background: primaryColor }}
                      >
                        Bouton exemple
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ background: secondaryColor }}
                      >
                        Secondaire
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}