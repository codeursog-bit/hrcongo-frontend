'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Palette, Upload, X, Save, Eye, ArrowLeft, Loader2,
  Building2, Image as ImageIcon, Type, Sparkles, Plus, Trash2
} from 'lucide-react';
import { api } from '@/services/api';
import Image from 'next/image';

interface CareerPageSettings {
  careerPageBanner: string | null;
  careerPageLogo: string | null;
  careerPageColors: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  careerPageAbout: string | null;
  careerPageValues: string[] | null;
  careerPagePhotos: string[] | null;
}

export default function CustomizeCareerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const [settings, setSettings] = useState<CareerPageSettings>({
    careerPageBanner: null,
    careerPageLogo: null,
    careerPageColors: {
      primary: '#2563eb',
      secondary: '#1e40af',
      accent: '#06b6d4'
    },
    careerPageAbout: '',
    careerPageValues: [],
    careerPagePhotos: []
  });

  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get<{ settings: CareerPageSettings }>('/recruitment/company-career-page');
      if (data.settings) {
        setSettings({
          ...data.settings,
          careerPageColors: data.settings.careerPageColors || {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#06b6d4'
          }
        });
        setBannerPreview(data.settings.careerPageBanner);
      }
    } catch (error) {
      console.error('Erreur chargement settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop volumineuse (max 5MB)');
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddValue = () => {
    if (!newValue.trim()) return;
    setSettings(prev => ({
      ...prev,
      careerPageValues: [...(prev.careerPageValues || []), newValue.trim()]
    }));
    setNewValue('');
  };

  const handleRemoveValue = (index: number) => {
    setSettings(prev => ({
      ...prev,
      careerPageValues: prev.careerPageValues?.filter((_, i) => i !== index) || []
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Photo trop volumineuse (max 3MB)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('photo', file);

      // ✅ CORRECTION : Utiliser api.postFormData
      const data = await api.postFormData<{ photoUrl: string }>('/recruitment/company-career-page/photos', formData);
      
      setSettings(prev => ({
        ...prev,
        careerPagePhotos: [...(prev.careerPagePhotos || []), data.photoUrl]
      }));
    } catch (error) {
      const err = error as Error;
      alert(`Erreur lors de l'upload: ${err.message}`);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      await api.delete(`/recruitment/company-career-page/photos/${index}`);
      setSettings(prev => ({
        ...prev,
        careerPagePhotos: prev.careerPagePhotos?.filter((_, i) => i !== index) || []
      }));
    } catch (error) {
      alert('Erreur suppression photo');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const formData = new FormData();

      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      formData.append('colors', JSON.stringify(settings.careerPageColors));
      formData.append('about', settings.careerPageAbout || '');
      formData.append('values', JSON.stringify(settings.careerPageValues || []));

      // ✅ CORRECTION : Utiliser api.postFormData
      // Note: Le backend utilise @Put mais avec FormData on utilise POST
      await api.postFormData('/recruitment/company-career-page', formData);

      alert('✅ Page carrière mise à jour !');
      
      // Recharger les settings pour avoir les URLs des images uploadées
      await fetchSettings();
    } catch (error) {
      const err = error as Error;
      alert(`Erreur lors de la sauvegarde: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-20">
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Palette className="text-purple-400" size={32}/>
                <h1 className="text-3xl font-black text-white">Personnaliser Page Carrière</h1>
              </div>
              <p className="text-slate-400">Créez une page unique pour attirer les meilleurs talents</p>
            </div>
          </div>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl font-bold flex items-center gap-2"
          >
            <Eye size={20} />
            {showPreview ? 'Masquer' : 'Preview'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: SETTINGS */}
          <div className="space-y-6">
            
            {/* BANNER */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <ImageIcon className="text-blue-400"/>
                Bannière (1920x600px recommandé)
              </h3>
              
              {bannerPreview ? (
                <div className="relative group">
                  <Image 
                    src={bannerPreview} 
                    alt="Banner" 
                    width={800}
                    height={250}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPreview(null);
                      setBannerFile(null);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <label className="block w-full h-48 border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-blue-400 transition-colors">
                    <Upload size={40} className="mb-3" />
                    <p className="font-medium">Uploader une bannière</p>
                  </div>
                </label>
              )}
            </div>

            {/* COLORS */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Palette className="text-purple-400"/>
                Couleurs de la Marque
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Couleur Primaire</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white/10"
                      value={settings.careerPageColors?.primary || '#2563eb'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          primary: e.target.value
                        }
                      }))}
                    />
                    <input 
                      type="text" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      value={settings.careerPageColors?.primary || '#2563eb'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          primary: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Couleur Secondaire</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white/10"
                      value={settings.careerPageColors?.secondary || '#1e40af'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          secondary: e.target.value
                        }
                      }))}
                    />
                    <input 
                      type="text" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      value={settings.careerPageColors?.secondary || '#1e40af'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          secondary: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-300 mb-2 block">Couleur Accent</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white/10"
                      value={settings.careerPageColors?.accent || '#06b6d4'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          accent: e.target.value
                        }
                      }))}
                    />
                    <input 
                      type="text" 
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                      value={settings.careerPageColors?.accent || '#06b6d4'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        careerPageColors: {
                          ...prev.careerPageColors!,
                          accent: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ABOUT */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Building2 className="text-green-400"/>
                À Propos de l'Entreprise
              </h3>
              <textarea 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 min-h-[150px] text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 outline-none resize-none"
                placeholder="Décrivez votre entreprise, votre mission, votre culture..."
                value={settings.careerPageAbout || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, careerPageAbout: e.target.value }))}
              />
            </div>

            {/* VALUES */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="text-yellow-400"/>
                Valeurs de l'Entreprise
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Ex: Innovation, Collaboration..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddValue()}
                  />
                  <button
                    type="button"
                    onClick={handleAddValue}
                    className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {settings.careerPageValues?.map((value, idx) => (
                    <div key={idx} className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full flex items-center gap-2">
                      <span className="font-bold text-sm">{value}</span>
                      <button type="button" onClick={() => handleRemoveValue(idx)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* PHOTOS */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <ImageIcon className="text-pink-400"/>
                Galerie Photos (Max 6)
              </h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {settings.careerPagePhotos?.map((photo, idx) => (
                  <div key={idx} className="relative group">
                    <Image src={photo} alt={`Photo ${idx + 1}`} width={200} height={150} className="w-full h-32 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {(settings.careerPagePhotos?.length || 0) < 6 && (
                <label className="block w-full h-32 border-2 border-dashed border-white/20 hover:border-pink-500/50 rounded-xl cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 hover:text-pink-400 transition-colors">
                    <Plus size={32} />
                    <p className="text-sm mt-2">Ajouter une photo</p>
                  </div>
                </label>
              )}
            </div>

            {/* SAVE BUTTON */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-2xl"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les Modifications'}
            </button>
          </div>

          {/* RIGHT: PREVIEW */}
          {showPreview && (
            <div className="sticky top-8 h-fit">
              <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <div className="p-4 bg-slate-800 border-b border-white/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-4 text-xs text-slate-400 font-mono">Preview - Page Carrière</span>
                </div>

                <div className="h-[700px] overflow-y-auto custom-scrollbar">
                  {/* Banner */}
                  {bannerPreview && (
                    <div className="relative h-64">
                      <Image src={bannerPreview} alt="Banner" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                  )}

                  <div className="p-8 space-y-8">
                    {/* About */}
                    {settings.careerPageAbout && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: settings.careerPageColors?.primary }}>
                          À Propos
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {settings.careerPageAbout}
                        </p>
                      </div>
                    )}

                    {/* Values */}
                    {settings.careerPageValues && settings.careerPageValues.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: settings.careerPageColors?.primary }}>
                          Nos Valeurs
                        </h2>
                        <div className="flex flex-wrap gap-3">
                          {settings.careerPageValues.map((value, idx) => (
                            <div 
                              key={idx}
                              className="px-4 py-2 rounded-full font-bold text-sm"
                              style={{ 
                                backgroundColor: `${settings.careerPageColors?.accent}20`,
                                color: settings.careerPageColors?.accent
                              }}
                            >
                              {value}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photos */}
                    {settings.careerPagePhotos && settings.careerPagePhotos.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4" style={{ color: settings.careerPageColors?.primary }}>
                          La Vie chez Nous
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                          {settings.careerPagePhotos.map((photo, idx) => (
                            <Image key={idx} src={photo} alt={`Photo ${idx}`} width={200} height={150} className="w-full h-40 object-cover rounded-xl" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}