'use client';

// app/(dashboard)/cabinet/[cabinetId]/parametres/page.tsx
// REFONTE UX ONLY — Logique 100% originale, 2 saves séparés, preview sidebar, no Lucide

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:     '#0f1626', card: '#151e30', cardHover: '#1a2540', surface: '#1e2b42',
  border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.14)',
  text:   '#f1f5f9', muted: '#94a3b8', dim: '#475569',
  indigo: '#6366f1', indigoL: '#818cf8', violet: '#8b5cf6',
  cyan:   '#06b6d4',   // ← ajouté
  emerald: '#10b981', red: '#ef4444',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoSettings = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="2.5" stroke={color} strokeWidth="1.5"/>
    <path d="M9 1v2.5M9 14.5V17M1 9h2.5M14.5 9H17M3.4 3.4l1.8 1.8M12.8 12.8l1.8 1.8M3.4 14.6l1.8-1.8M12.8 5.2l1.8-1.8"
      stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoPalette = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.4"/>
    <circle cx="5" cy="5" r="1" fill={color}/>
    <circle cx="9" cy="5" r="1" fill={color}/>
    <circle cx="5" cy="9" r="1" fill={color}/>
    <circle cx="10" cy="9.5" r="1.5" fill={color}/>
  </svg>
);

const IcoSave = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M4 2v3h5V2M4 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoCheck = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M4.5 7l2 2 3-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoAlert = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L1 12h12L7 1.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7 6v3M7 10.5v.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoLoader = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
      strokeDasharray="28" strokeDashoffset="10" strokeLinecap="round"/>
  </svg>
);

const IcoGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 1.5c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6.5 1.5c1.5 1.5 2 3 2 5s-.5 3.5-2 5M1.5 6.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IcoBuilding = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1.5" y="4" width="10" height="7.5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4 4V3a2.5 2.5 0 015 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M5 8h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IcoMail = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="3" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 4l5.5 4L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoPhone = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M2 2h3l1.5 3L5 6.5a7 7 0 003.5 3.5L10 8.5l3 1.5v3A1 1 0 0112 14C5.37 14 0 8.63 0 2a1 1 0 011-1h3"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IcoImage = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="4" cy="4.5" r="1" fill="currentColor"/>
    <path d="M1 8l3-3 2 2 2-2 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoEye = ({ open }: { open: boolean }) => open ? (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
) : (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 2l8 8M4 4.3C2.5 5.2 1 6 1 6s2 4 5 4c1 0 2-.4 2.9-1M5.2 3.1C5.5 3 5.7 3 6 3c3 0 5 3 5 3s-.5.9-1.5 1.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ─── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'general' | 'branding';

export default function ParametresPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [tab,     setTab]     = useState<Tab>('general');
  const [cabinet, setCabinet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  const [user,    setUser]    = useState<any>(null);

  // Champs Général
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Champs Branding
  const [logo,           setLogo]           = useState('');
  const [primaryColor,   setPrimaryColor]   = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#8b5cf6');
  const [previewOpen,    setPreviewOpen]    = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }

    api.get(`/cabinet/${cabinetId}`)
      .then((r: any) => {
        setCabinet(r);
        setName(r.name   ?? '');
        setEmail(r.email ?? '');
        setPhone(r.phone ?? '');
        setLogo(r.logo             ?? '');
        setPrimaryColor(r.primaryColor    ?? '#6366f1');
        setSecondaryColor(r.secondaryColor ?? '#8b5cf6');
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const flash = (ok: boolean, msg = 'Erreur lors de la sauvegarde') => {
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else    { setError(msg);  setTimeout(() => setError(''), 4000); }
  };

  // ── Sauvegarder Général ───────────────────────────────────────────────────
  const saveGeneral = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const updated: any = await api.patch(`/cabinet/${cabinetId}`, {
        name:  name.trim()  || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setCabinet((p: any) => p ? { ...p, ...updated } : p);
      flash(true);
    } catch (e: any) { flash(false, e.message); }
    finally { setSaving(false); }
  };

  // ── Sauvegarder Branding ──────────────────────────────────────────────────
  const saveBranding = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const updated: any = await api.patch(`/cabinet/${cabinetId}/branding`, {
        logo:           logo           || undefined,
        primaryColor:   primaryColor   || undefined,
        secondaryColor: secondaryColor || undefined,
      });
      setCabinet((p: any) => p ? { ...p, ...updated } : p);
      flash(true);
    } catch (e: any) { flash(false, e.message); }
    finally { setSaving(false); }
  };

  const isDirtyGeneral = cabinet && (
    name !== (cabinet.name ?? '') ||
    email !== (cabinet.email ?? '') ||
    phone !== (cabinet.phone ?? '')
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="animate-spin">
        <circle cx="14" cy="14" r="11" stroke={T.indigo} strokeWidth="2"
          strokeDasharray="55" strokeDashoffset="20" strokeLinecap="round"/>
      </svg>
    </div>
  );

  const inputCls: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${T.border}`,
    borderRadius: 12, fontSize: 14,
    color: T.text, outline: 'none',
  };

  const cardStyle: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  };

  const Label = ({ icon, text, opt }: { icon: React.ReactNode; text: string; opt?: boolean }) => (
    <label className="flex items-center gap-1.5 text-sm mb-2" style={{ color: T.muted }}>
      <span style={{ color: T.dim }}>{icon}</span>
      {text}
      {opt && <span className="text-xs" style={{ color: T.dim }}>(optionnel)</span>}
    </label>
  );

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} />

      <main className="ml-56 p-8" style={{ maxWidth: 'calc(640px + 224px)' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: T.text }}>
            <span style={{ color: T.indigoL }}><IcoSettings /></span> Paramètres
          </h1>
          <p className="text-sm mt-1" style={{ color: T.muted }}>Cabinet et identité visuelle</p>
        </div>

        {/* ── KPI compteurs cabinet ─────────────────────────────────────────── */}
        {cabinet && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'PME gérées',    value: cabinet._count?.companies ?? 0 },
              { label: 'Gestionnaires', value: cabinet._count?.users     ?? 0 },
              {
                label: 'Membre depuis',
                value: cabinet.createdAt
                  ? new Date(cabinet.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                  : '—',
              },
            ].map(s => (
              <div key={s.label}
                style={{
                  ...cardStyle,
                  padding: '14px 16px',
                  borderTop: `2px solid ${T.indigo}`,
                }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: T.dim }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: T.text }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
             style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
          {([
            ['general',  'Général',  <IcoSettings />],
            ['branding', 'Branding', <IcoPalette />],
          ] as [Tab, string, JSX.Element][]).map(([k, l, icon]) => (
            <button key={k}
              onClick={() => { setTab(k); setSaved(false); setError(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: tab === k ? 'rgba(255,255,255,0.1)' : 'transparent',
                color:      tab === k ? T.text : T.muted,
                fontWeight: tab === k ? 600 : 400,
                border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ color: tab === k ? T.indigoL : T.dim }}>{icon}</span>
              {l}
            </button>
          ))}
        </div>

        {/* ── Feedback ──────────────────────────────────────────────────────── */}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
               style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <IcoCheck color={T.emerald} />
            <p className="text-sm font-medium" style={{ color: T.emerald }}>Sauvegardé</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <IcoAlert color={T.red} />
            <p className="text-sm" style={{ color: T.red }}>{error}</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ONGLET GÉNÉRAL
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'general' && (
          <div className="space-y-4">

            {/* Infos générales */}
            <div style={cardStyle}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <h2 className="font-semibold text-sm" style={{ color: T.text }}>Informations générales</h2>
              </div>
              <div className="p-5 space-y-4">

                <div>
                  <Label icon={<IcoBuilding />} text="Nom du cabinet" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Mon cabinet"
                    style={inputCls}
                    onFocus={e => (e.target.style.borderColor = T.indigo)}
                    onBlur={e  => (e.target.style.borderColor = T.border)}
                  />
                </div>

                <div>
                  <Label icon={<IcoMail />} text="Email de contact" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@cabinet.com"
                    style={inputCls}
                    onFocus={e => (e.target.style.borderColor = T.indigo)}
                    onBlur={e  => (e.target.style.borderColor = T.border)}
                  />
                </div>

                <div>
                  <Label icon={<IcoPhone />} text="Téléphone" opt />
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+242 06 000 0000"
                    style={inputCls}
                    onFocus={e => (e.target.style.borderColor = T.indigo)}
                    onBlur={e  => (e.target.style.borderColor = T.border)}
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveGeneral}
                    disabled={saving || !isDirtyGeneral}
                    className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      padding: '9px 18px',
                      background: saving || !isDirtyGeneral ? 'rgba(99,102,241,0.35)' : T.indigo,
                      color: '#fff', border: 'none',
                      cursor: saving || !isDirtyGeneral ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? <IcoLoader /> : <IcoSave />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sous-domaine */}
            {cabinet && (
              <div style={cardStyle}>
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <h2 className="font-semibold text-sm" style={{ color: T.text }}>Sous-domaine</h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 p-3 rounded-xl"
                       style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                    <span style={{ color: T.dim }}><IcoGlobe /></span>
                    <code className="text-sm font-mono ml-1" style={{ color: T.cyan }}>
                      {cabinet.subdomain}
                    </code>
                    <span className="text-sm" style={{ color: T.dim }}>.konza.app</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: T.dim }}>Le sous-domaine est définitif.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ONGLET BRANDING
        ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'branding' && (
          <div className="space-y-5">

            {/* Info white-label */}
            <div className="flex items-start gap-3 p-4 rounded-xl"
                 style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <span className="mt-0.5 shrink-0"><IcoPalette color={T.violet} /></span>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(196,181,253,0.85)' }}>
                Votre logo et vos couleurs seront affichés à vos clients PME.
                Ils ne verront jamais "Konza" — uniquement votre cabinet.
              </p>
            </div>

            <div style={cardStyle}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                <h2 className="font-semibold text-sm" style={{ color: T.text }}>Identité visuelle</h2>
              </div>

              <div className="p-5 space-y-5">

                {/* Logo URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs mb-1.5" style={{ color: T.muted }}>
                    <span style={{ color: T.dim }}><IcoImage /></span>
                    Logo (URL publique)
                  </label>
                  <input
                    value={logo}
                    onChange={e => setLogo(e.target.value)}
                    placeholder="https://votre-site.com/logo.png"
                    style={inputCls}
                    onFocus={e => (e.target.style.borderColor = T.violet)}
                    onBlur={e  => (e.target.style.borderColor = T.border)}
                  />
                  <p className="text-xs mt-1" style={{ color: T.dim }}>PNG transparent recommandé, hauteur 48px.</p>
                  {logo && (
                    <div className="mt-2 p-3 rounded-xl inline-flex items-center gap-2"
                         style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}>
                      <img src={logo} alt="Logo" className="h-8 object-contain"
                           onError={e => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xs" style={{ color: T.dim }}>Aperçu</span>
                    </div>
                  )}
                </div>

                {/* Couleurs */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Couleur principale',  val: primaryColor,   set: setPrimaryColor   },
                    { label: 'Couleur secondaire',   val: secondaryColor, set: setSecondaryColor },
                  ].map(c => (
                    <div key={c.label}>
                      <label className="block text-xs mb-1.5" style={{ color: T.muted }}>{c.label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer p-1 shrink-0"
                          style={{ border: `1px solid ${T.border}`, background: 'transparent' }} />
                        <input value={c.val} onChange={e => c.set(e.target.value)}
                          placeholder="#6366f1"
                          className="flex-1"
                          style={{ ...inputCls, width: 'auto' }}
                          onFocus={e => (e.target.style.borderColor = T.violet)}
                          onBlur={e  => (e.target.style.borderColor = T.border)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Toggle prévisualisation sidebar PME */}
                <div>
                  <button
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="flex items-center gap-1.5 text-xs mb-3 transition-all"
                    style={{ color: previewOpen ? T.muted : T.dim, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = previewOpen ? T.muted : T.dim)}
                  >
                    <IcoEye open={previewOpen} />
                    {previewOpen ? 'Masquer' : 'Voir'} l'aperçu sidebar PME
                  </button>

                  {previewOpen && (
                    <div className="rounded-2xl overflow-hidden"
                         style={{ height: 300, border: `1px solid ${T.border}` }}>
                      <div className="flex h-full">
                        {/* Mini sidebar simulée */}
                        <div className="w-48 flex flex-col"
                             style={{ background: 'rgba(0,0,0,0.4)', borderRight: `1px solid rgba(255,255,255,0.08)` }}>
                          <div className="p-3" style={{ borderBottom: 'rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2">
                              {logo ? (
                                <img src={logo} alt="" className="h-7 object-contain max-w-[100px]" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                     style={{ background: `${primaryColor}33`, border: `1px solid ${primaryColor}55` }}>
                                  <IcoBuilding />
                                </div>
                              )}
                              <span className="font-bold text-xs text-white truncate">{name || 'Cabinet'}</span>
                            </div>
                            <p className="text-[9px] mt-1.5" style={{ color: T.dim }}>Nom PME cliente</p>
                          </div>
                          <nav className="flex-1 p-2 space-y-0.5">
                            {[
                              { label: 'Tableau de bord', active: true  },
                              { label: 'Employés',        active: false },
                              { label: 'Présences',       active: false },
                              { label: 'Congés',          active: false },
                              { label: 'Bulletins',       active: false },
                            ].map(item => (
                              <div key={item.label}
                                className="px-2.5 py-2 rounded-lg text-[11px]"
                                style={item.active
                                  ? { background: `${primaryColor}20`, color: primaryColor, fontWeight: 600 }
                                  : { color: '#6b7280' }
                                }>
                                {item.label}
                              </div>
                            ))}
                          </nav>
                        </div>
                        {/* Zone contenu */}
                        <div className="flex-1 p-4" style={{ background: T.bg }}>
                          <div className="h-3 rounded-full w-36 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
                          <div className="grid grid-cols-2 gap-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="p-3 rounded-xl"
                                   style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="w-6 h-6 rounded-lg mb-2"
                                     style={{ background: `${primaryColor}22`, border: `1px solid ${primaryColor}44` }} />
                                <div className="h-2 rounded w-12 mb-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="h-2 rounded w-8"       style={{ background: 'rgba(255,255,255,0.03)' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bouton sauvegarder branding */}
                <button
                  onClick={saveBranding}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    padding: '9px 18px',
                    background: saving ? 'rgba(139,92,246,0.4)' : T.violet,
                    color: '#fff', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? <IcoLoader /> : <IcoSave />}
                  {saving ? 'Enregistrement...' : 'Sauvegarder le branding'}
                </button>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}