'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Check, ChevronRight, Eye, EyeOff, ImageIcon,
  MapPin, Palette, Plus, Sparkles, Trash2, Upload, X,
} from 'lucide-react';
import { api } from '@/services/api';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { Badge, Button, Card, EmptyState, Input, Textarea } from '@/components/design-system/primitives';
import { RecruitmentFrame as ModulePageFrame } from '@/components/recruitment/RecruitmentFrame';

interface CareerPageSettings {
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: { primary: string; secondary: string; accent: string } | null;
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

function CompanyPreview({ settings, bannerPreview, companyName }: {
  settings: CareerPageSettings;
  bannerPreview: string | null;
  companyName: string;
}) {
  const [tab, setTab] = useState<'jobs' | 'about'>('about');
  const colors = settings.careerPageColors || { primary: '#06b6d4', secondary: '#0284c7', accent: '#06b6d4' };
  const banner = bannerPreview || settings.careerPageBanner;
  const fakeJobs = [
    { title: 'Développeur Frontend', location: 'Brazzaville', type: 'CDI' },
    { title: 'Chef de projet', location: 'Pointe-Noire', type: 'CDI' },
  ];

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--text)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-soft)]" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded bg-[var(--surface-2)] px-3 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
          rhkonza.com/companies/{companyName.toLowerCase().replace(/\s+/g, '-') || 'mon-entreprise'}
        </span>
      </div>
      <div className="max-h-[620px] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <strong>RH<span style={{ color: colors.accent }}>Konza</span></strong>
          <span className="text-[var(--text-secondary)]">Offres · Entreprises</span>
        </div>
        <div className="relative h-24 overflow-hidden bg-[var(--surface-2)]">
          {banner ? <Image src={banner} alt="" fill className="object-cover" /> : <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${colors.accent}40, transparent)` }} />}
          <div className="absolute inset-0 bg-[var(--brand)]  to-transparent" />
        </div>
        <div className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4">
          <div className="flex items-end gap-3">
            <div className="-mt-6 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)]">
              {settings.careerPageLogo ? <Image src={settings.careerPageLogo} alt="" width={48} height={48} className="h-full w-full object-contain" /> : <Building2 size={18} className="text-[var(--text-secondary)]" />}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <p className="truncate text-sm font-semibold">{companyName || 'Mon Entreprise'}</p>
              <p className="mt-0.5 text-[10px] text-[var(--text-secondary)]">Brazzaville · Tech</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            {([{ id: 'jobs', label: 'Offres (2)' }, { id: 'about', label: 'À propos' }] as const).map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={`border-b-2 px-3 py-2 text-[10px] font-semibold ${tab === item.id ? 'text-[var(--text)]' : 'border-transparent text-[var(--text-secondary)]'}`}
                style={tab === item.id ? { borderColor: colors.accent } : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 px-4 py-4">
          {tab === 'jobs' ? fakeJobs.map(job => (
            <div key={job.title} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3">
              <div>
                <p className="font-semibold">{job.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-secondary)]"><MapPin size={11} />{job.location} · {job.type}</p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-[var(--text-secondary)]" />
            </div>
          )) : (
            <>
              {settings.careerPageAbout && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><strong>À propos</strong><p className="mt-2 line-clamp-4 leading-relaxed text-[var(--text-secondary)]">{settings.careerPageAbout}</p></div>}
              {!!settings.careerPageValues?.length && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><strong>Nos valeurs</strong><div className="mt-2 flex flex-wrap gap-2">{settings.careerPageValues.slice(0, 4).map((value, index) => <Badge key={`${value}-${index}`} tone="info">{value}</Badge>)}</div></div>}
              {!!settings.careerPagePhotos?.length && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"><strong>La vie chez nous</strong><div className="mt-2 grid grid-cols-3 gap-2">{settings.careerPagePhotos.slice(0, 6).map((photo, index) => <Image key={`${photo}-${index}`} src={photo} alt={`Photo ${index + 1}`} width={80} height={80} className="aspect-square w-full rounded-lg object-cover" />)}</div></div>}
              {!settings.careerPageAbout && !settings.careerPageValues?.length && !settings.careerPagePhotos?.length && <p className="py-8 text-center text-[var(--text-secondary)]">Remplissez les champs pour voir l’aperçu.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomizeCareerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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

  useEffect(() => { void fetchSettings(); }, []);

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
      setLoadError(false);
    } catch (error) {
      console.error('Failed to load career page settings', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo', maxMb: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      alert(`Fichier trop lourd (max ${maxMb}MB)`);
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') return;
      if (type === 'banner') { setBannerPreview(reader.result); setBannerFile(file); }
      else { setLogoPreview(reader.result); setLogoFile(file); }
    };
    reader.readAsDataURL(file);
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    setSettings(previous => ({ ...previous, careerPageValues: [...(previous.careerPageValues || []), newValue.trim()] }));
    setNewValue('');
  };

  const handleRemoveValue = (index: number) => {
    setSettings(previous => ({ ...previous, careerPageValues: previous.careerPageValues?.filter((_, itemIndex) => itemIndex !== index) || [] }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Photo trop lourde (max 3MB)');
      event.target.value = '';
      return;
    }
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const data = await api.postFormData<{ photoUrl: string }>('/recruitment/company-career-page/photos', formData);
      setSettings(previous => ({ ...previous, careerPagePhotos: [...(previous.careerPagePhotos || []), data.photoUrl] }));
    } catch (error) {
      console.error('Failed to upload career page photo', error);
      alert('Erreur upload photo');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      await api.delete(`/recruitment/company-career-page/photos/${index}`);
      setSettings(previous => ({ ...previous, careerPagePhotos: previous.careerPagePhotos?.filter((_, itemIndex) => itemIndex !== index) || [] }));
    } catch (error) {
      console.error('Failed to remove career page photo', error);
      alert('Erreur suppression');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      if (bannerFile) formData.append('banner', bannerFile);
      if (logoFile) formData.append('logo', logoFile);
      formData.append('colors', JSON.stringify(settings.careerPageColors));
      formData.append('about', settings.careerPageAbout || '');
      formData.append('values', JSON.stringify(settings.careerPageValues || []));
      await api.postFormData('/recruitment/company-career-page', formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save career page settings', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <KonzaLoader variant="page" />;
  if (loadError) {
    return (
      <ModulePageFrame kind="detail">
        <EmptyState title="Impossible de charger la page carrière" icon={Building2} action={<Button variant="secondary" onClick={() => { setIsLoading(true); void fetchSettings(); }}>Réessayer</Button>}>
          Vérifiez votre connexion, puis réessayez. Les paramètres doivent être chargés avant toute modification.
        </EmptyState>
      </ModulePageFrame>
    );
  }

  const previewSettings = { ...settings, careerPageBanner: bannerPreview || settings.careerPageBanner, careerPageLogo: logoPreview || settings.careerPageLogo };

  return (
    <ModulePageFrame kind="detail">
      <div className="mx-auto max-w-7xl space-y-8 pb-20">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <Button type="button" variant="secondary" onClick={() => router.back()} className="!w-11 !p-0" aria-label="Retour"><ArrowLeft size={18} /></Button>
            <div>
              <div className="flex items-center gap-2.5"><Palette size={22} className="text-[var(--brand-strong)]" /><h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Page Carrière</h1></div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Personnalisez votre vitrine pour les candidats.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowPreview(value => !value)} className="inline-flex">
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}{showPreview ? 'Masquer l’aperçu' : 'Afficher l’aperçu'}
            </Button>
            <Button onClick={handleSave} loading={isSaving}>{!isSaving && (saved ? <Check size={16} /> : <Check size={16} />)}{isSaving ? 'Sauvegarde…' : saved ? 'Sauvegardé' : 'Sauvegarder'}</Button>
          </div>
        </header>

        {saved && <p role="status" className="rounded-[var(--radius-control)] border border-[var(--success-text)]/30 bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--success-text)]">Page carrière mise à jour. Les candidats voient maintenant votre nouveau profil.</p>}

        <div className="recruitment-career-layout">
          <div className="space-y-5">
            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><ImageIcon size={17} className="text-[var(--brand-strong)]" />Bannière</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">S’affiche en haut de votre page entreprise · 1920×450 px recommandé.</p>
              {bannerPreview ? (
                <div className="relative overflow-hidden rounded-[var(--radius-control)]">
                  <Image src={bannerPreview} alt="Aperçu de la bannière" width={800} height={200} className="h-36 w-full object-cover" />
                  <Button type="button" variant="secondary" onClick={() => { setBannerPreview(null); setBannerFile(null); }} className="absolute right-2 top-2 !min-h-9 !w-9 !p-0" aria-label="Supprimer la bannière"><X size={15} /></Button>
                </div>
              ) : (
                <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-control)] border-2 border-dashed border-[var(--border)] text-center transition-colors hover:border-[var(--brand-strong)]">
                  <input type="file" accept="image/*" onChange={event => handleFileChange(event, 'banner', 5)} className="sr-only" />
                  <Upload size={24} className="mb-2 text-[var(--text-secondary)]" /><span className="text-sm font-medium">Uploader la bannière</span><span className="mt-1 text-xs text-[var(--text-secondary)]">PNG, JPG, WEBP · max 5 MB</span>
                </label>
              )}
            </Card>

            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><Building2 size={17} className="text-[var(--brand-strong)]" />Logo entreprise</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">Apparaît sur votre profil et les cartes d’offres.</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)]">
                  {logoPreview ? <Image src={logoPreview} alt="Logo entreprise" width={80} height={80} className="h-full w-full object-contain" /> : <Building2 size={26} className="text-[var(--text-secondary)]" />}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="k-button k-button-secondary cursor-pointer"><Upload size={15} />Choisir un logo<input type="file" accept="image/*" onChange={event => handleFileChange(event, 'logo', 3)} className="sr-only" /></label>
                  {logoPreview && <Button variant="ghost" onClick={() => { setLogoPreview(null); setLogoFile(null); }}><X size={15} />Supprimer</Button>}
                </div>
              </div>
            </Card>

            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><Palette size={17} className="text-[var(--accent-2)]" />Couleurs de la marque</h2>
              <p className="mb-5 text-sm text-[var(--text-secondary)]">Utilisées pour les accents, valeurs et liens sur votre page.</p>
              <div className="space-y-4">
                {([
                  ['primary', 'Couleur principale'],
                  ['secondary', 'Couleur secondaire'],
                  ['accent', 'Couleur accent (liens, badges)'],
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-end gap-3">
                    <label className="k-field"><span>{label}</span><input type="color" aria-label={label} className="h-11 w-14 cursor-pointer rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] p-1" value={settings.careerPageColors?.[key] || '#06b6d4'} onChange={event => setSettings(previous => ({ ...previous, careerPageColors: { ...previous.careerPageColors!, [key]: event.target.value } }))} /></label>
                    <Input label={`${label} · code hexadécimal`} type="text" className="font-mono text-xs" value={settings.careerPageColors?.[key] || '#06b6d4'} onChange={event => setSettings(previous => ({ ...previous, careerPageColors: { ...previous.careerPageColors!, [key]: event.target.value } }))} />
                    <span className="mb-1 h-9 w-9 shrink-0 rounded-[var(--radius-control)] border border-[var(--border)]" style={{ backgroundColor: settings.careerPageColors?.[key] || '#06b6d4' }} aria-hidden="true" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><Building2 size={17} className="text-[var(--success-text)]" />Description de l’entreprise</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">Visible dans l’onglet « À propos » de votre page.</p>
              <Textarea label="Description" rows={5} className="resize-y" placeholder="Décrivez votre entreprise, votre mission, votre culture…" value={settings.careerPageAbout || ''} onChange={event => setSettings(previous => ({ ...previous, careerPageAbout: event.target.value }))} />
            </Card>

            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><Sparkles size={17} className="text-[var(--accent-2)]" />Valeurs de l’entreprise</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">Affichées sous forme de cartes numérotées.</p>
              <div className="mb-4 flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1"><Input label="Ajouter une valeur" type="text" placeholder="Ex. Innovation, intégrité…" value={newValue} onChange={event => setNewValue(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); handleAddValue(); } }} /></div>
                <Button type="button" variant="secondary" onClick={handleAddValue} aria-label="Ajouter une valeur"><Plus size={17} /></Button>
              </div>
              {(settings.careerPageValues || []).length ? (
                <ul className="flex flex-wrap gap-2">{settings.careerPageValues?.map((value, index) => <li key={`${value}-${index}`} className="flex items-center gap-1"><Badge tone="info">{index + 1}. {value}</Badge><Button type="button" variant="ghost" className="!min-h-9 !w-9 !p-0" aria-label={`Supprimer la valeur ${value}`} onClick={() => handleRemoveValue(index)}><X size={14} /></Button></li>)}</ul>
              ) : <p className="py-2 text-sm text-[var(--text-secondary)]">Aucune valeur ajoutée.</p>}
            </Card>

            <Card className="!p-6">
              <h2 className="mb-1 flex items-center gap-2 text-base font-semibold"><ImageIcon size={17} className="text-[var(--accent-2)]" />Galerie photos</h2>
              <p className="mb-4 text-sm text-[var(--text-secondary)]">Jusqu’à 6 photos · section « La vie chez nous ».</p>
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{settings.careerPagePhotos?.map((photo, index) => <div key={`${photo}-${index}`} className="group relative aspect-square overflow-hidden rounded-[var(--radius-control)]"><Image src={photo} alt={`Photo d’entreprise ${index + 1}`} width={150} height={150} className="h-full w-full object-cover" /><Button type="button" variant="secondary" onClick={() => handleRemovePhoto(index)} className="absolute right-2 top-2 !min-h-9 !w-9 !p-0" aria-label={`Supprimer la photo ${index + 1}`}><Trash2 size={14} /></Button></div>)}</div>
              {(settings.careerPagePhotos?.length || 0) < 6 && <label className="k-button k-button-secondary w-full cursor-pointer"><Plus size={17} />Ajouter une photo (max 3 MB)<input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" /></label>}
            </Card>
            <Button onClick={handleSave} loading={isSaving} className="w-full sm:hidden">{!isSaving && <Check size={16} />}{isSaving ? 'Sauvegarde…' : saved ? 'Sauvegardé' : 'Sauvegarder'}</Button>
          </div>

          {showPreview && <aside><div className="sticky top-6"><div className="mb-3 flex items-center gap-2"><Eye size={15} className="text-[var(--text-secondary)]" /><p className="text-sm font-medium text-[var(--text-secondary)]">Aperçu en temps réel · vue candidat</p></div><CompanyPreview settings={previewSettings} bannerPreview={bannerPreview} companyName={companyName} /><p className="mt-3 text-center text-xs text-[var(--text-secondary)]">Ce que voient les candidats sur rhkonza.com/companies/…</p></div></aside>}
        </div>
      </div>
    </ModulePageFrame>
  );
}
