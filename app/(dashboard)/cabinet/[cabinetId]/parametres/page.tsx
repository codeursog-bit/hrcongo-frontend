'use client';

// app/(dashboard)/cabinet/[cabinetId]/parametres/page.tsx
// REMPLACE l'existant — ajoute l'onglet Branding (logo, couleurs white-label)

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Settings, Save, Loader2, CheckCircle2, AlertCircle,
  Building2, Mail, Phone, Globe, Palette, Image as ImageIcon,
  Eye, EyeOff,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

type Tab = 'general' | 'branding';

const inputCls = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50 transition-colors";

export default function ParametresPage() {
  const params    = useParams();
  const cabinetId = params.cabinetId as string;

  const [tab,     setTab]    = useState<Tab>('general');
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
        setLogo(r.logo            ?? '');
        setPrimaryColor(r.primaryColor   ?? '#6366f1');
        setSecondaryColor(r.secondaryColor ?? '#8b5cf6');
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const flash = (ok: boolean, msg = 'Erreur lors de la sauvegarde') => {
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else    { setError(msg); setTimeout(() => setError(''), 4000); }
  };

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
    name !== (cabinet.name ?? '') || email !== (cabinet.email ?? '') || phone !== (cabinet.phone ?? '')
  );

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} />

      <main className="ml-56 p-8 max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={22} className="text-purple-400" /> Paramètres
          </h1>
          <p className="text-gray-500 text-sm mt-1">Cabinet et identité visuelle</p>
        </div>

        {/* Compteurs */}
        {cabinet && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'PME gérées',   value: cabinet._count?.companies ?? 0 },
              { label: 'Gestionnaires',value: cabinet._count?.users     ?? 0 },
              { label: 'Membre depuis',value: cabinet.createdAt
                ? new Date(cabinet.createdAt).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })
                : '—',
              },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-white/10 rounded-xl p-1 mb-6 w-fit">
          {([['general','Général',Settings],['branding','Branding',Palette]] as [Tab, string, any][]).map(([k, l, Icon]) => (
            <button key={k} onClick={() => { setTab(k); setSaved(false); setError(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${tab === k ? 'bg-white/10 text-white font-semibold' : 'text-gray-500 hover:text-white'}`}>
              <Icon size={13} /> {l}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <p className="text-emerald-400 text-sm font-medium">Sauvegardé</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-5">
            <AlertCircle size={15} className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* ── Onglet Général ─────────────────────────────────────────────────── */}
        {tab === 'general' && (
          <div className="space-y-4">
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white text-sm">Informations générales</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2"><Building2 size={13} /> Nom du cabinet</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Mon cabinet comptable" className={inputCls} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2"><Mail size={13} /> Email de contact</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@cabinet.com" className={inputCls} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-gray-400 mb-2"><Phone size={13} /> Téléphone <span className="text-gray-600 text-xs">(optionnel)</span></label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+242 06 000 0000" className={inputCls} />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={saveGeneral} disabled={saving || !isDirtyGeneral}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>

            {cabinet && (
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h2 className="font-semibold text-white text-sm">Sous-domaine</h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <Globe size={13} className="text-gray-500 mr-1" />
                    <code className="text-cyan-400 text-sm font-mono">{cabinet.subdomain}</code>
                    <span className="text-gray-600 text-sm">.konza.app</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-2">Le sous-domaine est définitif.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Branding ────────────────────────────────────────────────── */}
        {tab === 'branding' && (
          <div className="space-y-5">

            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl">
              <Palette size={16} className="text-purple-400 shrink-0 mt-0.5" />
              <p className="text-purple-400/80 text-sm leading-relaxed">
                Votre logo et vos couleurs seront affichés à vos clients PME.
                Ils ne verront jamais "Konza" — uniquement votre cabinet.
              </p>
            </div>

            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h2 className="font-semibold text-white text-sm">Identité visuelle</h2>
              </div>
              <div className="p-5 space-y-5">

                {/* Logo URL */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5"><ImageIcon size={12} /> Logo (URL publique)</label>
                  <input value={logo} onChange={e => setLogo(e.target.value)}
                    placeholder="https://votre-site.com/logo.png" className={inputCls} />
                  <p className="text-xs text-gray-600 mt-1">PNG transparent recommandé, hauteur 48px.</p>
                  {logo && (
                    <div className="mt-2 p-3 bg-white/3 border border-white/5 rounded-xl inline-flex items-center gap-2">
                      <img src={logo} alt="Logo" className="h-8 object-contain"
                           onError={e => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xs text-gray-500">Aperçu</span>
                    </div>
                  )}
                </div>

                {/* Couleurs */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Couleur principale',   val: primaryColor,   set: setPrimaryColor   },
                    { label: 'Couleur secondaire',    val: secondaryColor, set: setSecondaryColor },
                  ].map(c => (
                    <div key={c.label}>
                      <label className="block text-xs text-gray-400 mb-1.5">{c.label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer p-1 shrink-0" />
                        <input value={c.val} onChange={e => c.set(e.target.value)}
                          placeholder="#6366f1" className={`flex-1 ${inputCls}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Prévisualisation sidebar PME */}
                <div>
                  <button onClick={() => setPreviewOpen(!previewOpen)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors mb-3">
                    {previewOpen ? <EyeOff size={12} /> : <Eye size={12} />}
                    {previewOpen ? 'Masquer' : 'Voir'} l'aperçu sidebar PME
                  </button>

                  {previewOpen && (
                    <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 300 }}>
                      <div className="flex h-full">
                        {/* Mini sidebar simulée */}
                        <div className="w-48 bg-black/40 border-r border-white/8 flex flex-col">
                          <div className="p-3 border-b border-white/8">
                            <div className="flex items-center gap-2">
                              {logo ? (
                                <img src={logo} alt="" className="h-7 object-contain max-w-[100px]" />
                              ) : (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                     style={{ background: `${primaryColor}33`, border: `1px solid ${primaryColor}55` }}>
                                  <Building2 size={12} style={{ color: primaryColor }} />
                                </div>
                              )}
                              <span className="font-bold text-xs text-white truncate">{name || 'Cabinet'}</span>
                            </div>
                            <p className="text-[9px] text-gray-600 mt-1.5">Nom PME cliente</p>
                          </div>
                          <nav className="flex-1 p-2 space-y-0.5">
                            {[
                              { label: 'Tableau de bord', active: true },
                              { label: 'Employés',        active: false },
                              { label: 'Présences',       active: false },
                              { label: 'Congés',          active: false },
                              { label: 'Bulletins',       active: false },
                            ].map(item => (
                              <div key={item.label}
                                className="px-2.5 py-2 rounded-lg text-[11px] transition-colors"
                                style={item.active ? { background: `${primaryColor}20`, color: primaryColor, fontWeight: 600 } : { color: '#6b7280' }}>
                                {item.label}
                              </div>
                            ))}
                          </nav>
                        </div>
                        {/* Zone contenu */}
                        <div className="flex-1 bg-[#020617] p-4">
                          <div className="h-3 bg-white/5 rounded-full w-36 mb-4" />
                          <div className="grid grid-cols-2 gap-2">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3">
                                <div className="w-6 h-6 rounded-lg mb-2"
                                     style={{ background:`${primaryColor}22`, border:`1px solid ${primaryColor}44` }} />
                                <div className="h-2 bg-white/5 rounded w-12 mb-1" />
                                <div className="h-2 bg-white/3 rounded w-8" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={saveBranding} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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