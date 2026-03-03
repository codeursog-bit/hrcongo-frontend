'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette, Upload, X, Eye, EyeOff, ArrowLeft, Loader2,
  Building2, ImageIcon, Sparkles, Plus, Trash2, MapPin, Briefcase,
  Clock, ChevronRight, DollarSign, Check,
} from 'lucide-react';
import { api } from '@/services/api';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CareerPageSettings {
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: { primary: string; secondary: string; accent: string } | null;
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

// ─── PREVIEW : reproduit exactement la page /companies/[slug] ───
function CompanyPreview({ settings, bannerPreview, companyName }: {
  settings: CareerPageSettings;
  bannerPreview: string | null;
  companyName: string;
}) {
  const [tab, setTab] = useState<'jobs' | 'about'>('about');
  const colors = settings.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' };
  const logo = settings.careerPageLogo;
  const banner = bannerPreview || settings.careerPageBanner;

  // Faux jobs pour la preview
  const fakeJobs = [
    { title: 'Développeur Frontend', location: 'Brazzaville', type: 'CDI', salary: '450K – 700K XAF' },
    { title: 'Chef de projet', location: 'Pointe-Noire', type: 'CDI', salary: null },
  ];

  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 text-white text-xs">
      {/* Barre de navigateur simulée */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 bg-slate-800 rounded-md px-3 py-1 text-slate-500 font-mono text-[10px] ml-2">
          rhkonza.com/companies/{companyName.toLowerCase().replace(/\s+/g, '-') || 'mon-entreprise'}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[620px]">
        {/* Header mini */}
        <div className="bg-slate-950/90 border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between">
          <span className="font-black text-[11px]">RH<span className="text-cyan-400">Konza</span></span>
          <div className="flex gap-3 text-slate-500 text-[10px]">
            <span>Offres</span>
            <span className="text-white font-semibold border-b border-cyan-400">Entreprises</span>
          </div>
        </div>

        {/* Cover */}
        <div className="relative h-24 overflow-hidden bg-slate-800">
          {banner ? (
            <Image src={banner} alt="Banner" fill className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${colors.accent}25, transparent)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        </div>

        {/* Company header */}
        <div className="bg-slate-950 border-b border-slate-800/50 px-4">
          <div className="flex items-end gap-3 -mt-6 pb-0">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-slate-950 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
              {logo ? (
                <Image src={logo} alt="Logo" width={48} height={48} className="object-contain" />
              ) : (
                <Building2 size={18} className="text-slate-600" />
              )}
            </div>
            <div className="pb-3 flex-1">
              <p className="font-black text-white text-sm leading-tight">{companyName || 'Mon Entreprise'}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Brazzaville · Tech</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-1">
            {[
              { id: 'jobs' as const, label: 'Offres (2)' },
              { id: 'about' as const, label: 'À propos' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-[10px] font-bold border-b-2 transition-all ${
                  tab === t.id ? 'text-white border-cyan-400' : 'text-slate-500 border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu tabs */}
        <div className="px-4 py-4">

          {/* TAB OFFRES */}
          {tab === 'jobs' && (
            <div className="space-y-2">
              {fakeJobs.map((j, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="font-bold text-white text-[11px] mb-0.5">{j.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{j.location}</span>
                      <span>·</span>
                      <span>{j.type}</span>
                      {j.salary && <><span>·</span><span style={{ color: colors.accent }}>{j.salary}</span></>}
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-slate-700 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* TAB À PROPOS */}
          {tab === 'about' && (
            <div className="space-y-4">
              {/* About */}
              {settings.careerPageAbout && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <p className="font-bold text-white text-[11px] mb-1.5">À propos</p>
                  <p className="text-slate-400 text-[10px] leading-relaxed line-clamp-4">{settings.careerPageAbout}</p>
                </div>
              )}

              {/* Valeurs */}
              {settings.careerPageValues && settings.careerPageValues.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <p className="font-bold text-white text-[11px] mb-2">Nos valeurs</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {settings.careerPageValues.slice(0, 4).map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px]"
                        style={{ borderColor: `${colors.accent}30`, backgroundColor: `${colors.accent}08` }}
                      >
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-black shrink-0"
                          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-slate-300 truncate">{v}</span>
                      </div>
                    ))}
                    {settings.careerPageValues.length > 4 && (
                      <p className="text-slate-600 text-[9px] col-span-2 text-center">
                        +{settings.careerPageValues.length - 4} autres valeurs
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Photos */}
              {settings.careerPagePhotos && settings.careerPagePhotos.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                  <p className="font-bold text-white text-[11px] mb-2">La vie chez nous</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {settings.careerPagePhotos.slice(0, 6).map((p, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden">
                        <Image src={p} alt={`Photo ${i}`} width={80} height={80} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!settings.careerPageAbout && !settings.careerPageValues?.length && !settings.careerPagePhotos?.length && (
                <div className="text-center py-8 text-slate-600 text-[10px]">
                  <Building2 size={20} className="mx-auto mb-2 text-slate-800" />
                  Remplissez les champs pour voir la preview
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────

export default function CustomizeCareerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [settings, setSettings] = useState<CareerPageSettings>({
    careerPageBanner: null,
    careerPageLogo: null,
    careerPageColors: { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' },
    careerPageAbout: '',
    careerPageValues: [],
    careerPagePhotos: [],
  });
  const [newValue, setNewValue] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get<{ settings: CareerPageSettings; companyName?: string }>('/recruitment/company-career-page');
      if (data.settings) {
        setSettings({
          ...data.settings,
          careerPageColors: data.settings.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' },
          careerPageValues: data.settings.careerPageValues || [],
          careerPagePhotos: data.settings.careerPagePhotos || [],
        });
        setBannerPreview(data.settings.careerPageBanner);
        setLogoPreview(data.settings.careerPageLogo);
      }
      if (data.companyName) setCompanyName(data.companyName);
    } catch { } finally { setIsLoading(false); }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'banner' | 'logo',
    maxMb: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) { alert(`Fichier trop lourd (max ${maxMb}MB)`); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'banner') { setBannerPreview(reader.result as string); setBannerFile(file); }
      else { setLogoPreview(reader.result as string); setLogoFile(file); }
    };
    reader.readAsDataURL(file);
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    setSettings(p => ({ ...p, careerPageValues: [...(p.careerPageValues || []), newValue.trim()] }));
    setNewValue('');
  };

  const handleRemoveValue = (i: number) => {
    setSettings(p => ({ ...p, careerPageValues: p.careerPageValues?.filter((_, idx) => idx !== i) || [] }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert('Photo trop lourde (max 3MB)'); return; }
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const data = await api.postFormData<{ photoUrl: string }>('/recruitment/company-career-page/photos', fd);
      setSettings(p => ({ ...p, careerPagePhotos: [...(p.careerPagePhotos || []), data.photoUrl] }));
    } catch (err) { alert('Erreur upload photo'); }
  };

  const handleRemovePhoto = async (i: number) => {
    try {
      await api.delete(`/recruitment/company-career-page/photos/${i}`);
      setSettings(p => ({ ...p, careerPagePhotos: p.careerPagePhotos?.filter((_, idx) => idx !== i) || [] }));
    } catch { alert('Erreur suppression'); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fd = new FormData();
      if (bannerFile) fd.append('banner', bannerFile);
      if (logoFile) fd.append('logo', logoFile);
      fd.append('colors', JSON.stringify(settings.careerPageColors));
      fd.append('about', settings.careerPageAbout || '');
      fd.append('values', JSON.stringify(settings.careerPageValues || []));
      await api.postFormData('/recruitment/company-career-page', fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchSettings();
    } catch { alert('Erreur lors de la sauvegarde'); } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={40} />
      </div>
    );
  }

  // Preview settings avec le logo courant
  const previewSettings = {
    ...settings,
    careerPageBanner: bannerPreview || settings.careerPageBanner,
    careerPageLogo: logoPreview || settings.careerPageLogo,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl transition-colors"
            >
              <ArrowLeft size={18} className="text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <Palette size={22} className="text-purple-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">Page Carrière</h1>
              </div>
              <p className="text-sm text-slate-500">Personnalisez votre vitrine pour les candidats</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(v => !v)}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm transition-all"
            >
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPreview ? 'Masquer' : 'Aperçu'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition-all"
            >
              {isSaving ? <Loader2 className="animate-spin" size={15} /> : saved ? <Check size={15} /> : <Save size={15} />}
              {isSaving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* ── TOAST SUCCÈS ── */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-5 flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 font-medium"
            >
              <Check size={16} className="shrink-0" />
              Page carrière mise à jour avec succès ! Les candidats voient maintenant votre nouveau profil.
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── COLONNE GAUCHE : FORMULAIRE ── */}
          <div className="space-y-5">

            {/* BANNIÈRE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <ImageIcon size={15} className="text-blue-400" /> Bannière
              </h3>
              <p className="text-xs text-slate-500 mb-4">S'affiche en haut de votre page entreprise · 1920×450px recommandé</p>

              {bannerPreview ? (
                <div className="relative group rounded-xl overflow-hidden">
                  <Image src={bannerPreview} alt="Banner" width={800} height={200} className="w-full h-36 object-cover" />
                  <button
                    onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-red-500 border border-slate-700 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner', 5)} className="hidden" />
                  <Upload size={28} className="text-slate-600 mb-2" />
                  <p className="text-sm text-slate-500">Uploader la bannière</p>
                  <p className="text-xs text-slate-600 mt-0.5">PNG, JPG, WEBP · max 5MB</p>
                </label>
              )}
            </div>

            {/* LOGO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Building2 size={15} className="text-purple-400" /> Logo entreprise
              </h3>
              <p className="text-xs text-slate-500 mb-4">Apparaît sur votre profil et les cards d'offres</p>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {logoPreview ? (
                    <Image src={logoPreview} alt="Logo" width={80} height={80} className="object-contain w-full h-full" />
                  ) : (
                    <Building2 size={28} className="text-slate-600" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-sm cursor-pointer transition-colors">
                    <Upload size={14} /> Choisir un logo
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'logo', 3)} className="hidden" />
                  </label>
                  {logoPreview && (
                    <button
                      onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                      className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-400 text-sm transition-colors"
                    >
                      <X size={14} /> Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* COULEURS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Palette size={15} className="text-pink-400" /> Couleurs de la marque
              </h3>
              <p className="text-xs text-slate-500 mb-5">Utilisées pour les accents, valeurs et liens sur votre page</p>

              <div className="space-y-4">
                {([
                  ['primary', 'Couleur principale'],
                  ['secondary', 'Couleur secondaire'],
                  ['accent', 'Couleur accent (liens, badges)'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-4">
                    <input
                      type="color"
                      className="w-12 h-10 rounded-xl cursor-pointer border border-slate-700 bg-transparent shrink-0"
                      value={settings.careerPageColors?.[key] || '#06b6d4'}
                      onChange={e => setSettings(p => ({ ...p, careerPageColors: { ...p.careerPageColors!, [key]: e.target.value } }))}
                    />
                    <div className="flex-1">
                      <p className="text-xs text-slate-400 mb-1">{label}</p>
                      <input
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs font-mono outline-none focus:border-slate-500"
                        value={settings.careerPageColors?.[key] || '#06b6d4'}
                        onChange={e => setSettings(p => ({ ...p, careerPageColors: { ...p.careerPageColors!, [key]: e.target.value } }))}
                      />
                    </div>
                    <div className="w-8 h-8 rounded-lg shrink-0 border border-slate-700" style={{ backgroundColor: settings.careerPageColors?.[key] || '#06b6d4' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* À PROPOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Building2 size={15} className="text-green-400" /> Description de l'entreprise
              </h3>
              <p className="text-xs text-slate-500 mb-4">Visible dans l'onglet "À propos" de votre page</p>
              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:border-slate-500 outline-none resize-none min-h-[120px]"
                placeholder="Décrivez votre entreprise, votre mission, votre culture..."
                value={settings.careerPageAbout || ''}
                onChange={e => setSettings(p => ({ ...p, careerPageAbout: e.target.value }))}
              />
            </div>

            {/* VALEURS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" /> Valeurs de l'entreprise
              </h3>
              <p className="text-xs text-slate-500 mb-4">Affichées sous forme de cartes numérotées</p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ex: Innovation, Intégrité..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 outline-none focus:border-slate-500"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddValue()}
                />
                <button
                  onClick={handleAddValue}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>

              {(settings.careerPageValues || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {settings.careerPageValues?.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
                      <span className="text-amber-500 font-black text-[10px]">{i + 1}</span>
                      {v}
                      <button onClick={() => handleRemoveValue(i)} className="text-amber-500/60 hover:text-amber-300">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 text-center py-2">Aucune valeur ajoutée</p>
              )}
            </div>

            {/* PHOTOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <ImageIcon size={15} className="text-rose-400" /> Galerie photos
              </h3>
              <p className="text-xs text-slate-500 mb-4">Jusqu'à 6 photos · Section "La vie chez nous"</p>

              <div className="grid grid-cols-3 gap-3 mb-3">
                {settings.careerPagePhotos?.map((p, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden">
                    <Image src={p} alt="" width={150} height={150} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute top-1.5 right-1.5 p-1 bg-slate-950/80 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {(settings.careerPagePhotos?.length || 0) < 6 && (
                <label className="flex items-center justify-center gap-2 h-14 border-2 border-dashed border-slate-700 hover:border-rose-500/50 rounded-xl cursor-pointer transition-colors text-slate-500 hover:text-rose-400 text-sm">
                  <Plus size={18} /> Ajouter une photo (max 3MB)
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* BTN SAVE MOBILE */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/20 sm:hidden"
            >
              {isSaving ? <><Loader2 className="animate-spin" size={16} />Sauvegarde...</> : saved ? <><Check size={16} />Sauvegardé !</> : <><Save size={16} />Sauvegarder</>}
            </button>
          </div>

          {/* ── COLONNE DROITE : PREVIEW ── */}
          {showPreview && (
            <div className="hidden sm:block">
              <div className="sticky top-6">
                <div className="flex items-center gap-2 mb-3">
                  <Eye size={14} className="text-slate-500" />
                  <p className="text-xs text-slate-500 font-medium">Aperçu en temps réel · vue candidat</p>
                </div>
                <CompanyPreview
                  settings={previewSettings}
                  bannerPreview={bannerPreview}
                  companyName={companyName}
                />
                <p className="text-center text-[10px] text-slate-700 mt-3">
                  Ce que voient les candidats sur rhkonza.com/companies/…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export manquant pour l'icône Save
function Save({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}