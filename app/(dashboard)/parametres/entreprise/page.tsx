'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, Palette, Phone, Calendar, BookOpen, 
  Save, AlertTriangle, History, Plus, Trash2, Upload, 
  Globe, Facebook, Linkedin, Twitter, Check, X,
  Briefcase, Landmark, MapPin, Mail, Lock, Clock, Loader2,
  Navigation, Smartphone, Users, ShieldCheck, AlertCircle,
  HardHat, ShoppingCart, Factory, Flame, Truck,
  Utensils, Leaf, Wifi, HeartPulse, GraduationCap, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/providers/AlertProvider';
import { api } from '@/services/api';

// ========================================
// 📦 TYPES
// ========================================

interface CompanySettings {
  legalName: string;
  tradeName: string;
  rccmNumber: string;
  cnssNumber: string;
  taxNumber: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankRib: string;
  primaryColor: string;
  secondaryColor: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
  
  // 🆕 CHAMPS FISCAUX
  appliesCnssEmployer: boolean;
  cnssEmployerRate: number;
  defaultAppliesIrpp: boolean;
  defaultAppliesCnss: boolean;

  // 🆕 CONVENTION COLLECTIVE
  collectiveAgreement?: string;
}

interface PayrollSettings {
  officialStartHour: number;
  lateToleranceMinutes: number;
  workDaysPerMonth: number;
  workHoursPerDay: number;
  workDays: number[];
}

// ========================================
// 📋 CONVENTION COLLECTIVE CONFIG
// ========================================

const CONVENTION_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  label: string;
  description: string;
}> = {
  BTP: {
    icon: HardHat,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'BTP',
    description: 'Bâtiment & Travaux Publics',
  },
  COMMERCE: {
    icon: ShoppingCart,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Commerce',
    description: 'Commerce & Distribution',
  },
  INDUSTRIE: {
    icon: Factory,
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-700/50',
    label: 'Industrie',
    description: 'Industrie & Manufacture',
  },
  HYDROCARBURES: {
    icon: Flame,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Hydrocarbures',
    description: 'Pétrole & Gaz',
  },
  BANQUES: {
    icon: Landmark,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Banques & Finances',
    description: 'Banques, Assurances & Finance',
  },
  TRANSPORTS: {
    icon: Truck,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Transports',
    description: 'Transports & Logistique',
  },
  HOTELLERIE: {
    icon: Utensils,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Hôtellerie',
    description: 'Hôtellerie & Restauration',
  },
  AGRICULTURE: {
    icon: Leaf,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    label: 'Agriculture',
    description: 'Agriculture & Sylviculture',
  },
  TELECOMMUNICATIONS: {
    icon: Wifi,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    label: 'Télécommunications',
    description: 'Télécoms & Technologies',
  },
  SANTE: {
    icon: HeartPulse,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    label: 'Santé',
    description: 'Santé & Pharmacie',
  },
  EDUCATION: {
    icon: GraduationCap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    label: 'Éducation',
    description: 'Enseignement & Formation',
  },
};

// ========================================
// 🏗️ DEFAULTS
// ========================================

const DEFAULT_COMPANY: CompanySettings = {
  legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '',
  address: '', city: '', phone: '', email: '',
  bankName: '', bankAccount: '', bankRib: '',
  primaryColor: '#0EA5E9', secondaryColor: '#10B981',
  latitude: 0, longitude: 0, allowedRadius: 100,
  
  // 🆕 VALEURS PAR DÉFAUT FISCALES
  appliesCnssEmployer: true,
  cnssEmployerRate: 16,
  defaultAppliesIrpp: true,
  defaultAppliesCnss: true,

  // 🆕 CONVENTION COLLECTIVE
  collectiveAgreement: '',
};

const DEFAULT_PAYROLL: PayrollSettings = {
  officialStartHour: 8,
  lateToleranceMinutes: 0,
  workDaysPerMonth: 26,
  workHoursPerDay: 8,
  workDays: [1, 2, 3, 4, 5]
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' }
];

// ========================================
// 🚀 COMPOSANT PRINCIPAL
// ========================================

export default function CompanySettingsPage() {
  const alert = useAlert();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'fiscal' | 'convention' | 'location' | 'attendance' | 'contact'>('general');
  const [companyData, setCompanyData] = useState<CompanySettings>(DEFAULT_COMPANY);
  const [payrollData, setPayrollData] = useState<PayrollSettings>(DEFAULT_PAYROLL);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const company: any = await api.get('/companies/mine');
        if (company) {
          setCompanyData({
            legalName: company.legalName || '',
            tradeName: company.tradeName || '',
            rccmNumber: company.rccmNumber || '',
            cnssNumber: company.cnssNumber || '',
            taxNumber: company.taxNumber || '',
            address: company.address || '',
            city: company.city || '',
            phone: company.phone || '',
            email: company.email || '',
            bankName: company.bankName || '',
            bankAccount: company.bankAccount || '',
            bankRib: company.bankRib || '',
            primaryColor: company.primaryColor || '#0EA5E9',
            secondaryColor: company.secondaryColor || '#10B981',
            latitude: company.latitude || 0,
            longitude: company.longitude || 0,
            allowedRadius: company.allowedRadius || 100,
            
            // 🆕 CHAMPS FISCAUX
            appliesCnssEmployer: company.appliesCnssEmployer ?? true,
            cnssEmployerRate: company.cnssEmployerRate ?? 16,
            defaultAppliesIrpp: company.defaultAppliesIrpp ?? true,
            defaultAppliesCnss: company.defaultAppliesCnss ?? true,

            // 🆕 CONVENTION COLLECTIVE
            collectiveAgreement: company.collectiveAgreement || '',
          });
        }

        const settings: any = await api.get('/payroll-settings');
        if (settings) {
          setPayrollData({
            officialStartHour: settings.officialStartHour ?? 8,
            lateToleranceMinutes: settings.lateToleranceMinutes ?? 0,
            workDaysPerMonth: settings.workDaysPerMonth ?? 26,
            workHoursPerDay: settings.workHoursPerDay ?? 8,
            workDays: settings.workDays || [1, 2, 3, 4, 5]
          });
        }
      } catch (e) {
        console.error("Erreur chargement paramètres", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCompanyChange = (field: keyof CompanySettings, value: any) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const handlePayrollChange = (field: keyof PayrollSettings, value: any) => {
    setPayrollData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWorkDay = (day: number) => {
    setPayrollData(prev => {
      const workDays = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort();
      return { ...prev, workDays };
    });
  };

  const selectAllDays = () => {
    setPayrollData(prev => ({ ...prev, workDays: [1, 2, 3, 4, 5, 6, 7] }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCompanyData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          
          if (position.coords.accuracy > 100) {
            alert.warning(
              'Précision GPS faible',
              `Précision actuelle : ${Math.round(position.coords.accuracy)}m. Configurez depuis un smartphone au bureau pour plus de précision.`
            );
          } else {
            alert.success(
              'Position récupérée',
              'Les coordonnées GPS ont été enregistrées avec succès.'
            );
          }
        },
        (error) => {
          alert.error(
            'Géolocalisation impossible',
            error.message || 'Impossible d\'accéder à votre position.'
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert.error(
        'Navigateur non compatible',
        'La géolocalisation n\'est pas supportée par votre navigateur.'
      );
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/companies', {
        legalName: companyData.legalName,
        tradeName: companyData.tradeName,
        rccmNumber: companyData.rccmNumber,
        cnssNumber: companyData.cnssNumber,
        taxNumber: companyData.taxNumber,
        address: companyData.address,
        city: companyData.city,
        phone: companyData.phone,
        email: companyData.email,
        bankName: companyData.bankName,
        bankAccount: companyData.bankAccount,
        bankRib: companyData.bankRib,
        primaryColor: companyData.primaryColor,
        secondaryColor: companyData.secondaryColor,
        latitude: companyData.latitude,
        longitude: companyData.longitude,
        allowedRadius: companyData.allowedRadius,
        
        // 🆕 CHAMPS FISCAUX
        appliesCnssEmployer: companyData.appliesCnssEmployer,
        cnssEmployerRate: companyData.cnssEmployerRate,
        defaultAppliesIrpp: companyData.defaultAppliesIrpp,
        defaultAppliesCnss: companyData.defaultAppliesCnss,

        // 🆕 CONVENTION COLLECTIVE
        collectiveAgreement: companyData.collectiveAgreement || null,
      });

      await api.patch('/payroll-settings', {
        officialStartHour: payrollData.officialStartHour,
        lateToleranceMinutes: payrollData.lateToleranceMinutes,
        workDaysPerMonth: payrollData.workDaysPerMonth,
        workHoursPerDay: payrollData.workHoursPerDay,
        workDays: payrollData.workDays
      });

      setShowConfirm(false);
      alert.success(
        'Paramètres enregistrés', 
        'Les modifications ont été appliquées avec succès.'
      );
    } catch (e: any) {
      console.error("Erreur sauvegarde", e);
      alert.error(
        'Erreur d\'enregistrement', 
        e.message || 'Impossible de sauvegarder les modifications.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================
  // 🧮 CALCULS DYNAMIQUES
  // ========================================

  const calculateLateTime = () => {
    const totalMinutes = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateNextMinute = () => {
    const totalMinutes = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes + 1;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const calculateMonthlyHours = () => {
    return (payrollData.workDaysPerMonth * payrollData.workHoursPerDay).toFixed(1);
  };

  // ========================================
  // 🎨 COMPOSANTS
  // ========================================

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap
        ${activeTab === id 
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
      `}
    >
      <Icon size={18} /> {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-24 px-4 relative">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Paramètres Entreprise</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Configuration complète : identité, fiscalité et politiques RH.</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
        <TabButton id="general"    label="Général"            icon={Building2}  />
        <TabButton id="fiscal"     label="Fiscalité"          icon={ShieldCheck} />
        <TabButton id="convention" label="Convention"         icon={BookOpen}   />
        <TabButton id="location"   label="Localisation"       icon={MapPin}     />
        <TabButton id="attendance" label="Horaires & Pointage" icon={Clock}     />
        <TabButton id="contact"    label="Coordonnées"        icon={Phone}      />
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* ==================== ONGLET GÉNÉRAL ==================== */}
            {activeTab === 'general' && (
              <motion.div 
                key="general"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Briefcase size={20} className="text-sky-500" /> Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Légal*</label>
                      <input 
                        value={companyData.legalName} 
                        onChange={e => handleCompanyChange('legalName', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Commercial</label>
                      <input 
                        value={companyData.tradeName} 
                        onChange={e => handleCompanyChange('tradeName', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° RCCM*</label>
                      <input 
                        value={companyData.rccmNumber} 
                        onChange={e => handleCompanyChange('rccmNumber', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° CNSS*</label>
                      <input 
                        value={companyData.cnssNumber} 
                        onChange={e => handleCompanyChange('cnssNumber', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° Fiscal (NIU)</label>
                      <input 
                        value={companyData.taxNumber} 
                        onChange={e => handleCompanyChange('taxNumber', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Landmark size={20} className="text-emerald-500" /> Banque Principale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banque</label>
                      <select 
                        value={companyData.bankName} 
                        onChange={e => handleCompanyChange('bankName', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="BGFI Bank">BGFI Bank</option>
                        <option value="Ecobank">Ecobank</option>
                        <option value="LCB">LCB</option>
                        <option value="UBA">UBA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro de Compte</label>
                      <input 
                        value={companyData.bankAccount} 
                        onChange={e => handleCompanyChange('bankAccount', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RIB / IBAN</label>
                      <input 
                        value={companyData.bankRib} 
                        onChange={e => handleCompanyChange('bankRib', e.target.value)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== 🆕 ONGLET FISCALITÉ ==================== */}
            {activeTab === 'fiscal' && (
              <motion.div 
                key="fiscal"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-purple-500" /> Configuration Fiscale Entreprise
                  </h3>
                  
                  <div className="space-y-5">
                    {/* CNSS PATRONALE */}
                    <label className="flex items-start gap-4 cursor-pointer p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
                      <input 
                        type="checkbox"
                        checked={companyData.appliesCnssEmployer}
                        onChange={(e) => handleCompanyChange('appliesCnssEmployer', e.target.checked)}
                        className="w-6 h-6 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="text-base font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          L'entreprise paie la CNSS patronale (16%)
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Décochez si votre structure n'est pas encore immatriculée à la CNSS. Les charges patronales ne seront pas calculées sur les bulletins de paie.
                        </p>
                      </div>
                    </label>

                    {/* TAUX PERSONNALISÉ */}
                    <AnimatePresence>
                      {companyData.appliesCnssEmployer && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="ml-10 p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg"
                        >
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                            Taux CNSS Patronale (%)
                          </label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="number"
                              min="0"
                              max="50"
                              step="0.5"
                              value={companyData.cnssEmployerRate}
                              onChange={(e) => handleCompanyChange('cnssEmployerRate', parseFloat(e.target.value) || 16)}
                              className="w-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <span className="text-2xl font-bold text-gray-400">%</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                              Taux standard au Congo : <strong className="text-purple-600">16%</strong>
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                        Configuration par défaut pour nouveaux employés
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Ces valeurs seront appliquées automatiquement lors de la création de nouveaux employés. Vous pourrez les ajuster individuellement par la suite.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PAR DÉFAUT IRPP */}
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
                          <input 
                            type="checkbox"
                            checked={companyData.defaultAppliesIrpp}
                            onChange={(e) => handleCompanyChange('defaultAppliesIrpp', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                              Par défaut, soumis à l'IRPP/ITS
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Impôt sur le revenu</p>
                          </div>
                        </label>

                        {/* PAR DÉFAUT CNSS */}
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
                          <input 
                            type="checkbox"
                            checked={companyData.defaultAppliesCnss}
                            onChange={(e) => handleCompanyChange('defaultAppliesCnss', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                          />
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                              Par défaut, soumis à la CNSS (4%)
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Cotisation sociale salariale</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* APERÇU */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <strong>Exemple :</strong> Un nouvel employé créé sera automatiquement configuré avec ces paramètres fiscaux
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== 🆕 ONGLET CONVENTION COLLECTIVE ==================== */}
            {activeTab === 'convention' && (
              <motion.div
                key="convention"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
                  
                  {/* En-tête */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                      <BookOpen size={20} className="text-purple-500" /> Convention Collective
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      La convention collective détermine les catégories professionnelles et les salaires minimums appliqués à vos employés lors de leur création.
                    </p>
                  </div>

                  {/* Grille de conventions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {Object.entries(CONVENTION_CONFIG).map(([code, config]) => {
                      const Icon = config.icon;
                      const isSelected = companyData.collectiveAgreement === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleCompanyChange(
                            'collectiveAgreement',
                            isSelected ? '' : code
                          )}
                          className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                          }`}
                        >
                          <div className={`w-10 h-10 ${isSelected ? 'bg-purple-100 dark:bg-purple-900/40' : config.bg} rounded-xl flex items-center justify-center shrink-0 transition-all`}>
                            <Icon size={20} className={isSelected ? 'text-purple-600 dark:text-purple-400' : config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                              {config.label}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{config.description}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confirmation convention sélectionnée */}
                  <AnimatePresence>
                    {companyData.collectiveAgreement && CONVENTION_CONFIG[companyData.collectiveAgreement] && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl flex items-start gap-3"
                      >
                        <Award size={18} className="text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                            Convention {CONVENTION_CONFIG[companyData.collectiveAgreement].label} active
                          </p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                            Les nouveaux employés créés bénéficieront automatiquement des catégories professionnelles et salaires minimums de cette convention.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Avertissement si aucune convention */}
                  {!companyData.collectiveAgreement && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl">
                      <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        <AlertCircle size={13} />
                        Aucune convention sélectionnée — les catégories professionnelles ne seront pas pré-remplies pour les nouveaux employés.
                      </p>
                    </div>
                  )}

                  {/* Note impact */}
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wide">Impact de ce paramètre</p>
                    <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>Lors de la <strong className="text-gray-700 dark:text-gray-300">création d'un employé</strong>, les catégories et salaires minimums de la convention s'afficheront automatiquement dans Step3Contract.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>Sur les <strong className="text-gray-700 dark:text-gray-300">bulletins de paie</strong>, la convention collective sera affichée dans l'en-tête employé.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>Les <strong className="text-gray-700 dark:text-gray-300">employés existants</strong> ne sont pas affectés par ce changement.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== ONGLET LOCALISATION ==================== */}
            {activeTab === 'location' && (
              <motion.div 
                key="location"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-4 rounded-2xl flex gap-3 items-start">
                  <Smartphone className="text-orange-500 shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Conseil de précision</h4>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Pour enregistrer la position exacte de votre bureau, il est recommandé de faire cette manipulation <strong>depuis un smartphone connecté au WiFi du bureau</strong>, ou de copier les coordonnées exactes depuis Google Maps Satellite.
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Navigation size={20} className="text-red-500" /> Géolocalisation du Site
                    </h3>
                    <button 
                      onClick={getCurrentLocation}
                      className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100 font-bold flex items-center gap-1"
                    >
                      <MapPin size={12}/> Utiliser ma position
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                      <input 
                        type="number"
                        step="0.000001"
                        value={companyData.latitude} 
                        onChange={e => handleCompanyChange('latitude', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                      <input 
                        type="number"
                        step="0.000001"
                        value={companyData.longitude} 
                        onChange={e => handleCompanyChange('longitude', parseFloat(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rayon autorisé (Mètres)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={companyData.allowedRadius} 
                          onChange={e => handleCompanyChange('allowedRadius', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-900 dark:text-white"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">m</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-orange-500"/>
                        Les employés ne pourront pointer que s'ils se trouvent dans ce rayon.
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== ONGLET HORAIRES & POINTAGE ==================== */}
            {activeTab === 'attendance' && (
              <motion.div 
                key="attendance"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                
                {/* HORAIRES DE TRAVAIL */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" /> Horaires de Travail
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure de début officielle</label>
                      <select 
                        value={payrollData.officialStartHour}
                        onChange={e => handlePayrollChange('officialStartHour', parseInt(e.target.value))}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
                          <option key={hour} value={hour}>
                            {String(hour).padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Heure à laquelle les employés doivent commencer</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tolérance de retard (minutes)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        step="5"
                        value={payrollData.lateToleranceMinutes}
                        onChange={e => handlePayrollChange('lateToleranceMinutes', parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Délai accordé avant de marquer comme retard</p>
                    </div>
                  </div>

                  {/* APERÇU DE LA RÈGLE */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          Aperçu de la règle
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Un employé sera marqué <span className="font-bold">en retard</span> s'il pointe après{' '}
                          <span className="font-bold text-blue-900 dark:text-blue-100">{calculateLateTime()}</span>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Exemple : Pointage à {calculateLateTime()} → ✅ À l'heure | 
                          Pointage à {calculateNextMinute()} → ⏰ En retard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* JOURS DE TRAVAIL */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Users size={20} className="text-purple-500" /> Jours de Travail
                    </h3>
                    <button
                      onClick={selectAllDays}
                      className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 font-bold"
                    >
                      Tout sélectionner
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.value}
                        onClick={() => toggleWorkDay(day.value)}
                        className={`
                          p-3 rounded-xl font-bold text-sm transition-all border-2
                          ${payrollData.workDays.includes(day.value)
                            ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-gray-50 dark:bg-gray-750 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
                          }
                        `}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-purple-500"/>
                    Seuls les jours sélectionnés seront considérés comme jours ouvrables. Les employés ne seront pas marqués absents les autres jours.
                  </p>
                </div>

                {/* TEMPS DE TRAVAIL MENSUEL */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-emerald-500" /> Temps de Travail Mensuel
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jours ouvrés par mois</label>
                      <input
                        type="number"
                        min="20"
                        max="31"
                        value={payrollData.workDaysPerMonth}
                        onChange={e => handlePayrollChange('workDaysPerMonth', parseInt(e.target.value) || 26)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Nombre de jours de travail standard par mois</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heures normales par jour</label>
                      <input
                        type="number"
                        min="6"
                        max="12"
                        step="0.5"
                        value={payrollData.workHoursPerDay}
                        onChange={e => handlePayrollChange('workHoursPerDay', parseFloat(e.target.value) || 8)}
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Durée quotidienne avant heures supplémentaires</p>
                    </div>
                  </div>

                  {/* CALCUL AUTOMATIQUE */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">Heures mensuelles calculées :</span>{' '}
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {calculateMonthlyHours()}
                      </span> heures
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Cette valeur est utilisée pour calculer les heures supplémentaires et les absences
                    </p>
                  </div>
                </div>

              </motion.div>
            )}

            {/* ==================== ONGLET COORDONNÉES ==================== */}
            {activeTab === 'contact' && (
              <motion.div 
                key="contact"
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-6"
              >
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-indigo-500" /> Adresse Postale
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresse Complète</label>
                      <input 
                        value={companyData.address} 
                        onChange={e => handleCompanyChange('address', e.target.value)}
                        placeholder="123 Avenue de la République"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ville</label>
                      <input 
                        value={companyData.city} 
                        onChange={e => handleCompanyChange('city', e.target.value)}
                        placeholder="Pointe-Noire"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Phone size={20} className="text-green-500" /> Contacts
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
                      <input 
                        value={companyData.phone} 
                        onChange={e => handleCompanyChange('phone', e.target.value)}
                        placeholder="+242 06 123 45 67"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Général</label>
                      <input 
                        type="email"
                        value={companyData.email} 
                        onChange={e => handleCompanyChange('email', e.target.value)}
                        placeholder="contact@entreprise.cg"
                        className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ==================== SIDEBAR ACTIONS ==================== */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <History size={20} className="text-gray-400" /> Actions
            </h3>
            
            <button 
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} /> Enregistrer
            </button>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-300">Important :</strong> Ces paramètres affectent toute l'entreprise. Les modifications prendront effet immédiatement pour tous les employés.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* ==================== MODAL DE CONFIRMATION ==================== */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmer les changements</h3>
                  <p className="text-sm text-gray-500">Ces modifications impacteront toute l'entreprise.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirm(false)} 
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? <><Loader2 className="animate-spin" size={20}/> Sauvegarde...</> : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Building2, Palette, Phone, Calendar, BookOpen, 
//   Save, AlertTriangle, History, Plus, Trash2, Upload, 
//   Globe, Facebook, Linkedin, Twitter, Check, X,
//   Briefcase, Landmark, MapPin, Mail, Lock, Clock, Loader2,
//   Navigation, Smartphone, Users, ShieldCheck, AlertCircle
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useAlert } from '@/components/providers/AlertProvider';
// import { api } from '@/services/api';

// // ========================================
// // 📦 TYPES
// // ========================================

// interface CompanySettings {
//   legalName: string;
//   tradeName: string;
//   rccmNumber: string;
//   cnssNumber: string;
//   taxNumber: string;
//   address: string;
//   city: string;
//   phone: string;
//   email: string;
//   bankName: string;
//   bankAccount: string;
//   bankRib: string;
//   primaryColor: string;
//   secondaryColor: string;
//   latitude: number;
//   longitude: number;
//   allowedRadius: number;
  
//   // 🆕 NOUVEAUX CHAMPS FISCAUX
//   appliesCnssEmployer: boolean;
//   cnssEmployerRate: number;
//   defaultAppliesIrpp: boolean;
//   defaultAppliesCnss: boolean;
// }

// interface PayrollSettings {
//   officialStartHour: number;
//   lateToleranceMinutes: number;
//   workDaysPerMonth: number;
//   workHoursPerDay: number;
//   workDays: number[];
// }

// const DEFAULT_COMPANY: CompanySettings = {
//   legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '',
//   address: '', city: '', phone: '', email: '',
//   bankName: '', bankAccount: '', bankRib: '',
//   primaryColor: '#0EA5E9', secondaryColor: '#10B981',
//   latitude: 0, longitude: 0, allowedRadius: 100,
  
//   // 🆕 VALEURS PAR DÉFAUT FISCALES
//   appliesCnssEmployer: true,
//   cnssEmployerRate: 16,
//   defaultAppliesIrpp: true,
//   defaultAppliesCnss: true,
// };

// const DEFAULT_PAYROLL: PayrollSettings = {
//   officialStartHour: 8,
//   lateToleranceMinutes: 0,
//   workDaysPerMonth: 26,
//   workHoursPerDay: 8,
//   workDays: [1, 2, 3, 4, 5]
// };

// const DAYS_OF_WEEK = [
//   { value: 1, label: 'Lundi' },
//   { value: 2, label: 'Mardi' },
//   { value: 3, label: 'Mercredi' },
//   { value: 4, label: 'Jeudi' },
//   { value: 5, label: 'Vendredi' },
//   { value: 6, label: 'Samedi' },
//   { value: 7, label: 'Dimanche' }
// ];

// export default function CompanySettingsPage() {
//   const alert = useAlert();
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState<'general' | 'fiscal' | 'location' | 'attendance' | 'contact'>('general');
//   const [companyData, setCompanyData] = useState<CompanySettings>(DEFAULT_COMPANY);
//   const [payrollData, setPayrollData] = useState<PayrollSettings>(DEFAULT_PAYROLL);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const company: any = await api.get('/companies/mine');
//         if (company) {
//           setCompanyData({
//             legalName: company.legalName || '',
//             tradeName: company.tradeName || '',
//             rccmNumber: company.rccmNumber || '',
//             cnssNumber: company.cnssNumber || '',
//             taxNumber: company.taxNumber || '',
//             address: company.address || '',
//             city: company.city || '',
//             phone: company.phone || '',
//             email: company.email || '',
//             bankName: company.bankName || '',
//             bankAccount: company.bankAccount || '',
//             bankRib: company.bankRib || '',
//             primaryColor: company.primaryColor || '#0EA5E9',
//             secondaryColor: company.secondaryColor || '#10B981',
//             latitude: company.latitude || 0,
//             longitude: company.longitude || 0,
//             allowedRadius: company.allowedRadius || 100,
            
//             // 🆕 CHAMPS FISCAUX
//             appliesCnssEmployer: company.appliesCnssEmployer ?? true,
//             cnssEmployerRate: company.cnssEmployerRate ?? 16,
//             defaultAppliesIrpp: company.defaultAppliesIrpp ?? true,
//             defaultAppliesCnss: company.defaultAppliesCnss ?? true,
//           });
//         }

//         const settings: any = await api.get('/payroll-settings');
//         if (settings) {
//           setPayrollData({
//             officialStartHour: settings.officialStartHour ?? 8,
//             lateToleranceMinutes: settings.lateToleranceMinutes ?? 0,
//             workDaysPerMonth: settings.workDaysPerMonth ?? 26,
//             workHoursPerDay: settings.workHoursPerDay ?? 8,
//             workDays: settings.workDays || [1, 2, 3, 4, 5]
//           });
//         }
//       } catch (e) {
//         console.error("Erreur chargement paramètres", e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleCompanyChange = (field: keyof CompanySettings, value: any) => {
//     setCompanyData(prev => ({ ...prev, [field]: value }));
//   };

//   const handlePayrollChange = (field: keyof PayrollSettings, value: any) => {
//     setPayrollData(prev => ({ ...prev, [field]: value }));
//   };

//   const toggleWorkDay = (day: number) => {
//     setPayrollData(prev => {
//       const workDays = prev.workDays.includes(day)
//         ? prev.workDays.filter(d => d !== day)
//         : [...prev.workDays, day].sort();
//       return { ...prev, workDays };
//     });
//   };

//   const selectAllDays = () => {
//     setPayrollData(prev => ({ ...prev, workDays: [1, 2, 3, 4, 5, 6, 7] }));
//   };

//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setCompanyData(prev => ({
//             ...prev,
//             latitude: position.coords.latitude,
//             longitude: position.coords.longitude
//           }));
          
//           if (position.coords.accuracy > 100) {
//             alert.warning(
//               'Précision GPS faible',
//               `Précision actuelle : ${Math.round(position.coords.accuracy)}m. Configurez depuis un smartphone au bureau pour plus de précision.`
//             );
//           } else {
//             alert.success(
//               'Position récupérée',
//               'Les coordonnées GPS ont été enregistrées avec succès.'
//             );
//           }
//         },
//         (error) => {
//           alert.error(
//             'Géolocalisation impossible',
//             error.message || 'Impossible d\'accéder à votre position.'
//           );
//         },
//         { enableHighAccuracy: true }
//       );
//     } else {
//       alert.error(
//         'Navigateur non compatible',
//         'La géolocalisation n\'est pas supportée par votre navigateur.'
//       );
//     }
//   };

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       await api.patch('/companies', {
//         legalName: companyData.legalName,
//         tradeName: companyData.tradeName,
//         rccmNumber: companyData.rccmNumber,
//         cnssNumber: companyData.cnssNumber,
//         taxNumber: companyData.taxNumber,
//         address: companyData.address,
//         city: companyData.city,
//         phone: companyData.phone,
//         email: companyData.email,
//         bankName: companyData.bankName,
//         bankAccount: companyData.bankAccount,
//         bankRib: companyData.bankRib,
//         primaryColor: companyData.primaryColor,
//         secondaryColor: companyData.secondaryColor,
//         latitude: companyData.latitude,
//         longitude: companyData.longitude,
//         allowedRadius: companyData.allowedRadius,
        
//         // 🆕 CHAMPS FISCAUX
//         appliesCnssEmployer: companyData.appliesCnssEmployer,
//         cnssEmployerRate: companyData.cnssEmployerRate,
//         defaultAppliesIrpp: companyData.defaultAppliesIrpp,
//         defaultAppliesCnss: companyData.defaultAppliesCnss,
//       });

//       await api.patch('/payroll-settings', {
//         officialStartHour: payrollData.officialStartHour,
//         lateToleranceMinutes: payrollData.lateToleranceMinutes,
//         workDaysPerMonth: payrollData.workDaysPerMonth,
//         workHoursPerDay: payrollData.workHoursPerDay,
//         workDays: payrollData.workDays
//       });

//       setShowConfirm(false);
//       alert.success(
//         'Paramètres enregistrés', 
//         'Les modifications ont été appliquées avec succès.'
//       );
//     } catch (e: any) {
//       console.error("Erreur sauvegarde", e);
//       alert.error(
//         'Erreur d\'enregistrement', 
//         e.message || 'Impossible de sauvegarder les modifications.'
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // ========================================
//   // 🧮 CALCULS DYNAMIQUES
//   // ========================================

//   const calculateLateTime = () => {
//     const totalMinutes = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes;
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
//     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
//   };

//   const calculateNextMinute = () => {
//     const totalMinutes = payrollData.officialStartHour * 60 + payrollData.lateToleranceMinutes + 1;
//     const hours = Math.floor(totalMinutes / 60);
//     const minutes = totalMinutes % 60;
//     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
//   };

//   const calculateMonthlyHours = () => {
//     return (payrollData.workDaysPerMonth * payrollData.workHoursPerDay).toFixed(1);
//   };

//   // ========================================
//   // 🎨 COMPOSANTS
//   // ========================================

//   const TabButton = ({ id, label, icon: Icon }: any) => (
//     <button
//       onClick={() => setActiveTab(id)}
//       className={`
//         px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap
//         ${activeTab === id 
//           ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
//           : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}
//       `}
//     >
//       <Icon size={18} /> {label}
//     </button>
//   );

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen">
//         <Loader2 className="animate-spin text-sky-500" size={48} />
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-[1200px] mx-auto pb-24 px-4 relative">
      
//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6">
//         <div className="flex items-center gap-4">
//           <button 
//             onClick={() => router.back()} 
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-500" />
//           </button>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Paramètres Entreprise</h1>
//             <p className="text-gray-500 dark:text-gray-400 text-sm">Configuration complète : identité, fiscalité et politiques RH.</p>
//           </div>
//         </div>
//       </div>

//       {/* TABS */}
//       <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
//         <TabButton id="general" label="Général" icon={Building2} />
//         <TabButton id="fiscal" label="Fiscalité" icon={ShieldCheck} />
//         <TabButton id="location" label="Localisation" icon={MapPin} />
//         <TabButton id="attendance" label="Horaires & Pointage" icon={Clock} />
//         <TabButton id="contact" label="Coordonnées" icon={Phone} />
//       </div>

//       {/* CONTENT */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
//         <div className="lg:col-span-2 space-y-6">
//           <AnimatePresence mode="wait">
            
//             {/* ==================== ONGLET GÉNÉRAL ==================== */}
//             {activeTab === 'general' && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 exit={{ opacity: 0, y: -10 }} 
//                 className="space-y-6"
//               >
                
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Briefcase size={20} className="text-sky-500" /> Identification
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Légal*</label>
//                       <input 
//                         value={companyData.legalName} 
//                         onChange={e => handleCompanyChange('legalName', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom Commercial</label>
//                       <input 
//                         value={companyData.tradeName} 
//                         onChange={e => handleCompanyChange('tradeName', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° RCCM*</label>
//                       <input 
//                         value={companyData.rccmNumber} 
//                         onChange={e => handleCompanyChange('rccmNumber', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° CNSS*</label>
//                       <input 
//                         value={companyData.cnssNumber} 
//                         onChange={e => handleCompanyChange('cnssNumber', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">N° Fiscal (NIU)</label>
//                       <input 
//                         value={companyData.taxNumber} 
//                         onChange={e => handleCompanyChange('taxNumber', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Landmark size={20} className="text-emerald-500" /> Banque Principale
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Banque</label>
//                       <select 
//                         value={companyData.bankName} 
//                         onChange={e => handleCompanyChange('bankName', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       >
//                         <option value="">Sélectionner...</option>
//                         <option value="BGFI Bank">BGFI Bank</option>
//                         <option value="Ecobank">Ecobank</option>
//                         <option value="LCB">LCB</option>
//                         <option value="UBA">UBA</option>
//                       </select>
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro de Compte</label>
//                       <input 
//                         value={companyData.bankAccount} 
//                         onChange={e => handleCompanyChange('bankAccount', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">RIB / IBAN</label>
//                       <input 
//                         value={companyData.bankRib} 
//                         onChange={e => handleCompanyChange('bankRib', e.target.value)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                   </div>
//                 </div>

//               </motion.div>
//             )}

//             {/* ==================== 🆕 ONGLET FISCALITÉ ==================== */}
//             {activeTab === 'fiscal' && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 exit={{ opacity: 0, y: -10 }} 
//                 className="space-y-6"
//               >
                
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <ShieldCheck size={20} className="text-purple-500" /> Configuration Fiscale Entreprise
//                   </h3>
                  
//                   <div className="space-y-5">
//                     {/* CNSS PATRONALE */}
//                     <label className="flex items-start gap-4 cursor-pointer p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
//                       <input 
//                         type="checkbox"
//                         checked={companyData.appliesCnssEmployer}
//                         onChange={(e) => handleCompanyChange('appliesCnssEmployer', e.target.checked)}
//                         className="w-6 h-6 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
//                       />
//                       <div className="flex-1">
//                         <span className="text-base font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
//                           L'entreprise paie la CNSS patronale (16%)
//                         </span>
//                         <p className="text-sm text-gray-600 dark:text-gray-400">
//                           Décochez si votre structure n'est pas encore immatriculée à la CNSS. Les charges patronales ne seront pas calculées sur les bulletins de paie.
//                         </p>
//                       </div>
//                     </label>

//                     {/* TAUX PERSONNALISÉ */}
//                     <AnimatePresence>
//                       {companyData.appliesCnssEmployer && (
//                         <motion.div 
//                           initial={{ opacity: 0, height: 0 }}
//                           animate={{ opacity: 1, height: 'auto' }}
//                           exit={{ opacity: 0, height: 0 }}
//                           className="ml-10 p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg"
//                         >
//                           <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
//                             Taux CNSS Patronale (%)
//                           </label>
//                           <div className="flex items-center gap-4">
//                             <input 
//                               type="number"
//                               min="0"
//                               max="50"
//                               step="0.5"
//                               value={companyData.cnssEmployerRate}
//                               onChange={(e) => handleCompanyChange('cnssEmployerRate', parseFloat(e.target.value) || 16)}
//                               className="w-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                             />
//                             <span className="text-2xl font-bold text-gray-400">%</span>
//                             <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
//                               Taux standard au Congo : <strong className="text-purple-600">16%</strong>
//                             </p>
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>

//                     <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
//                       <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
//                         Configuration par défaut pour nouveaux employés
//                       </h4>
//                       <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
//                         Ces valeurs seront appliquées automatiquement lors de la création de nouveaux employés. Vous pourrez les ajuster individuellement par la suite.
//                       </p>
                      
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         {/* PAR DÉFAUT IRPP */}
//                         <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
//                           <input 
//                             type="checkbox"
//                             checked={companyData.defaultAppliesIrpp}
//                             onChange={(e) => handleCompanyChange('defaultAppliesIrpp', e.target.checked)}
//                             className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
//                           />
//                           <div>
//                             <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                               Par défaut, soumis à l'IRPP/ITS
//                             </span>
//                             <p className="text-xs text-gray-500 dark:text-gray-400">Impôt sur le revenu</p>
//                           </div>
//                         </label>

//                         {/* PAR DÉFAUT CNSS */}
//                         <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all">
//                           <input 
//                             type="checkbox"
//                             checked={companyData.defaultAppliesCnss}
//                             onChange={(e) => handleCompanyChange('defaultAppliesCnss', e.target.checked)}
//                             className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
//                           />
//                           <div>
//                             <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                               Par défaut, soumis à la CNSS (4%)
//                             </span>
//                             <p className="text-xs text-gray-500 dark:text-gray-400">Cotisation sociale salariale</p>
//                           </div>
//                         </label>
//                       </div>
//                     </div>

//                     {/* APERÇU */}
//                     <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
//                       <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
//                         <AlertCircle size={16} />
//                         <strong>Exemple :</strong> Un nouvel employé créé sera automatiquement configuré avec ces paramètres fiscaux
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//               </motion.div>
//             )}

//             {/* ==================== ONGLET LOCALISATION ==================== */}
//             {activeTab === 'location' && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 exit={{ opacity: 0, y: -10 }} 
//                 className="space-y-6"
//               >
                
//                 <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 p-4 rounded-2xl flex gap-3 items-start">
//                   <Smartphone className="text-orange-500 shrink-0 mt-1" size={20} />
//                   <div>
//                     <h4 className="font-bold text-orange-800 dark:text-orange-300 text-sm">Conseil de précision</h4>
//                     <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
//                       Pour enregistrer la position exacte de votre bureau, il est recommandé de faire cette manipulation <strong>depuis un smartphone connecté au WiFi du bureau</strong>, ou de copier les coordonnées exactes depuis Google Maps Satellite.
//                     </p>
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                       <Navigation size={20} className="text-red-500" /> Géolocalisation du Site
//                     </h3>
//                     <button 
//                       onClick={getCurrentLocation}
//                       className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100 font-bold flex items-center gap-1"
//                     >
//                       <MapPin size={12}/> Utiliser ma position
//                     </button>
//                   </div>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
//                       <input 
//                         type="number"
//                         step="0.000001"
//                         value={companyData.latitude} 
//                         onChange={e => handleCompanyChange('latitude', parseFloat(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
//                       <input 
//                         type="number"
//                         step="0.000001"
//                         value={companyData.longitude} 
//                         onChange={e => handleCompanyChange('longitude', parseFloat(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-mono text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rayon autorisé (Mètres)</label>
//                       <div className="relative">
//                         <input 
//                           type="number"
//                           value={companyData.allowedRadius} 
//                           onChange={e => handleCompanyChange('allowedRadius', parseFloat(e.target.value) || 0)}
//                           className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-900 dark:text-white"
//                         />
//                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">m</span>
//                       </div>
//                       <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
//                         <AlertTriangle size={12} className="text-orange-500"/>
//                         Les employés ne pourront pointer que s'ils se trouvent dans ce rayon.
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//               </motion.div>
//             )}

//             {/* ==================== ONGLET HORAIRES & POINTAGE ==================== */}
//             {activeTab === 'attendance' && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 exit={{ opacity: 0, y: -10 }} 
//                 className="space-y-6"
//               >
                
//                 {/* HORAIRES DE TRAVAIL */}
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Clock size={20} className="text-blue-500" /> Horaires de Travail
//                   </h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heure de début officielle</label>
//                       <select 
//                         value={payrollData.officialStartHour}
//                         onChange={e => handlePayrollChange('officialStartHour', parseInt(e.target.value))}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
//                       >
//                         {Array.from({ length: 15 }, (_, i) => i + 6).map(hour => (
//                           <option key={hour} value={hour}>
//                             {String(hour).padStart(2, '0')}:00
//                           </option>
//                         ))}
//                       </select>
//                       <p className="text-xs text-gray-400 mt-1">Heure à laquelle les employés doivent commencer</p>
//                     </div>

//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tolérance de retard (minutes)</label>
//                       <input
//                         type="number"
//                         min="0"
//                         max="120"
//                         step="5"
//                         value={payrollData.lateToleranceMinutes}
//                         onChange={e => handlePayrollChange('lateToleranceMinutes', parseInt(e.target.value) || 0)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
//                       />
//                       <p className="text-xs text-gray-400 mt-1">Délai accordé avant de marquer comme retard</p>
//                     </div>
//                   </div>

//                   {/* APERÇU DE LA RÈGLE */}
//                   <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
//                     <div className="flex items-start gap-3">
//                       <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
//                       <div className="flex-1">
//                         <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
//                           Aperçu de la règle
//                         </p>
//                         <p className="text-sm text-blue-700 dark:text-blue-300">
//                           Un employé sera marqué <span className="font-bold">en retard</span> s'il pointe après{' '}
//                           <span className="font-bold text-blue-900 dark:text-blue-100">{calculateLateTime()}</span>
//                         </p>
//                         <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
//                           Exemple : Pointage à {calculateLateTime()} → ✅ À l'heure | 
//                           Pointage à {calculateNextMinute()} → ⏰ En retard
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* JOURS DE TRAVAIL */}
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <div className="flex justify-between items-center mb-6">
//                     <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                       <Users size={20} className="text-purple-500" /> Jours de Travail
//                     </h3>
//                     <button
//                       onClick={selectAllDays}
//                       className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-purple-100 font-bold"
//                     >
//                       Tout sélectionner
//                     </button>
//                   </div>

//                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                     {DAYS_OF_WEEK.map(day => (
//                       <button
//                         key={day.value}
//                         onClick={() => toggleWorkDay(day.value)}
//                         className={`
//                           p-3 rounded-xl font-bold text-sm transition-all border-2
//                           ${payrollData.workDays.includes(day.value)
//                             ? 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'
//                             : 'bg-gray-50 dark:bg-gray-750 text-gray-400 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-500'
//                           }
//                         `}
//                       >
//                         {day.label}
//                       </button>
//                     ))}
//                   </div>

//                   <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
//                     <AlertTriangle size={12} className="text-purple-500"/>
//                     Seuls les jours sélectionnés seront considérés comme jours ouvrables. Les employés ne seront pas marqués absents les autres jours.
//                   </p>
//                 </div>

//                 {/* TEMPS DE TRAVAIL MENSUEL */}
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Calendar size={20} className="text-emerald-500" /> Temps de Travail Mensuel
//                   </h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jours ouvrés par mois</label>
//                       <input
//                         type="number"
//                         min="20"
//                         max="31"
//                         value={payrollData.workDaysPerMonth}
//                         onChange={e => handlePayrollChange('workDaysPerMonth', parseInt(e.target.value) || 26)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
//                       />
//                       <p className="text-xs text-gray-400 mt-1">Nombre de jours de travail standard par mois</p>
//                     </div>

//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Heures normales par jour</label>
//                       <input
//                         type="number"
//                         min="6"
//                         max="12"
//                         step="0.5"
//                         value={payrollData.workHoursPerDay}
//                         onChange={e => handlePayrollChange('workHoursPerDay', parseFloat(e.target.value) || 8)}
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-lg font-semibold text-gray-900 dark:text-white"
//                       />
//                       <p className="text-xs text-gray-400 mt-1">Durée quotidienne avant heures supplémentaires</p>
//                     </div>
//                   </div>

//                   {/* CALCUL AUTOMATIQUE */}
//                   <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
//                     <p className="text-sm text-gray-600 dark:text-gray-300">
//                       <span className="font-semibold text-gray-800 dark:text-gray-100">Heures mensuelles calculées :</span>{' '}
//                       <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
//                         {calculateMonthlyHours()}
//                       </span> heures
//                     </p>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                       Cette valeur est utilisée pour calculer les heures supplémentaires et les absences
//                     </p>
//                   </div>
//                 </div>

//               </motion.div>
//             )}

//             {/* ==================== ONGLET COORDONNÉES ==================== */}
//             {activeTab === 'contact' && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10 }} 
//                 animate={{ opacity: 1, y: 0 }} 
//                 exit={{ opacity: 0, y: -10 }} 
//                 className="space-y-6"
//               >
                
//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <MapPin size={20} className="text-indigo-500" /> Adresse Postale
//                   </h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="md:col-span-2">
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adresse Complète</label>
//                       <input 
//                         value={companyData.address} 
//                         onChange={e => handleCompanyChange('address', e.target.value)}
//                         placeholder="123 Avenue de la République"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ville</label>
//                       <input 
//                         value={companyData.city} 
//                         onChange={e => handleCompanyChange('city', e.target.value)}
//                         placeholder="Pointe-Noire"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
//                   <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                     <Phone size={20} className="text-green-500" /> Contacts
//                   </h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Téléphone</label>
//                       <input 
//                         value={companyData.phone} 
//                         onChange={e => handleCompanyChange('phone', e.target.value)}
//                         placeholder="+242 06 123 45 67"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Général</label>
//                       <input 
//                         type="email"
//                         value={companyData.email} 
//                         onChange={e => handleCompanyChange('email', e.target.value)}
//                         placeholder="contact@entreprise.cg"
//                         className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white"
//                       />
//                     </div>
//                   </div>
//                 </div>

//               </motion.div>
//             )}

//           </AnimatePresence>
//         </div>

//         {/* ==================== SIDEBAR ACTIONS ==================== */}
//         <div className="lg:col-span-1 space-y-6">
          
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-6">
//             <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <History size={20} className="text-gray-400" /> Actions
//             </h3>
            
//             <button 
//               onClick={() => setShowConfirm(true)}
//               className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
//             >
//               <Save size={18} /> Enregistrer
//             </button>

//             <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
//               <p className="text-xs text-gray-500 dark:text-gray-400">
//                 <strong className="text-gray-700 dark:text-gray-300">Important :</strong> Ces paramètres affectent toute l'entreprise. Les modifications prendront effet immédiatement pour tous les employés.
//               </p>
//             </div>
//           </div>

//         </div>

//       </div>

//       {/* ==================== MODAL DE CONFIRMATION ==================== */}
//       <AnimatePresence>
//         {showConfirm && (
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }} 
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
//             onClick={() => setShowConfirm(false)}
//           >
//             <motion.div 
//               initial={{ scale: 0.9 }} 
//               animate={{ scale: 1 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
//             >
//               <div className="flex items-center gap-4 mb-6">
//                 <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-500 rounded-full flex items-center justify-center">
//                   <Lock size={24} />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirmer les changements</h3>
//                   <p className="text-sm text-gray-500">Ces modifications impacteront toute l'entreprise.</p>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => setShowConfirm(false)} 
//                   className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//                 >
//                   Annuler
//                 </button>
//                 <button 
//                   onClick={handleSave} 
//                   disabled={isSaving}
//                   className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {isSaving ? <><Loader2 className="animate-spin" size={20}/> Sauvegarde...</> : 'Confirmer'}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }

