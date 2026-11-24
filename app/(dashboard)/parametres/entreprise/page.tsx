'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';
import Link from 'next/link';

import { AppearanceLink } from '@/components/appearance/AppearanceLink';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Phone, Calendar, BookOpen,
  Save, AlertTriangle, History,
  Check,
  Briefcase, Landmark, MapPin, Mail, Lock, Clock, Loader2,
  Navigation, Smartphone, Users, ShieldCheck, AlertCircle,
  HardHat, ShoppingCart, Factory, Flame, Truck,
  Utensils, Leaf, Wifi, HeartPulse, GraduationCap, Award,
  Banknote, Info,ImageIcon, Upload, X, Trash2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '@/components/providers/AlertProvider';
import { api } from '@/services/api';
import { authService } from '@/lib/services/authService';
import type { DocumentTemplate } from '@/lib/document-template';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { SettingsFrame as ModulePageFrame } from '@/components/settings/SettingsFrame';
import { EchelonSuggestionsPanel } from '@/components/settings/EchelonSuggestionsPanel'; // 🆕
import { ConventionPicker } from '@/components/conventions/ConventionPicker'; // 🆕
import { getConventionCatalogEntry } from '@/lib/conventions/conventions-catalog'; // 🆕
import GeofenceRadiusPreview, { computeMetersOffset } from '@/components/GeofenceRadiusPreview'; // 🆕
import TrustedIpsPanel from '@/components/settings/TrustedIpsPanel'; // 🆕
import { captureBestPosition } from '@/hooks/geoCapture'; // 🆕 mesure GPS fiable (meilleure lecture / moyenne)

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface CompanySettings {
  legalName:             string;
  tradeName:             string;
  rccmNumber:            string;
  cnssNumber:            string;
  taxNumber:             string;
  address:               string;
  city:                  string;
  phone:                 string;
  email:                 string;
  bankName:              string;
  bankAccount:           string;
  bankRib:               string;
  primaryColor:          string;
  secondaryColor:        string;
  latitude:              number;
  longitude:             number;
  allowedRadius:         number;
  gpsToleranceMeters:    number; // 🆕 marge GPS max (m), 0 = stricte
  appliesCnssEmployer:   boolean;
  appliesSeniorityLeaveBonus: boolean;
  echelonReminderEnabled?: boolean; // 🆕 Rappels de changement d'échelon (OFF par défaut)
  defaultAppliesIrpp:    boolean;
  defaultAppliesCnss:    boolean;
  collectiveAgreement?:  string;
  // 🆕 Calendrier de paie
  payrollPaymentDay:     number;
  payrollCloseDay:       number;
  // 🆕 Pied de page légal des documents imprimables (congé, absence, prêt...)
  documentFooterText?:   string;
  documentTemplate:      DocumentTemplate;
  // 🆕 Générateur de contrats — représentant légal & ville de signature par défaut
  contractRepresentativeName?: string;
  contractRepresentativeRole?: string;
  contractSignatureCity?:      string;
  legalForm?: string;
}

// 🆕 Multi-sites
interface CompanySite {
  id:        string;
  name:      string;
  latitude:  number;
  longitude: number;
  radius:    number;
  isActive:  boolean;
}

interface PayrollSettings {
  officialStartHour:    number;
  officialStartMinute:  number;
  lateToleranceMinutes: number;
  workDaysPerMonth:     number;
  workHoursPerDay:      number;
  workDays:             number[];
  fiscalMode:           'AUTO' | 'ITS_2026' | 'IRPP_LEGACY' | 'FORFAIT';
  forfaitItsRate:       number;
}

// ─── CNSS PATRONALE : 3 BRANCHES ─────────────────────────────────────────────

const CNSS_BRANCHES = [
  { key: 'pension',  label: 'Retraite & Pension',      rate: 8,    plafond: '1 200 000 FCFA', color: 'text-[var(--success-text)] ', bg: 'bg-[var(--brand-soft)] ',  border: 'border-[var(--border)] ' },
  { key: 'famille',  label: 'Prestations familiales',   rate: 10,   plafond: '600 000 FCFA',   color: 'text-[var(--warning-text)] ',   bg: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] ',      border: 'border-[var(--border)] '   },
  { key: 'accident', label: 'Accidents du travail',     rate: 2.25, plafond: '600 000 FCFA',   color: 'text-[var(--success-text)] ', bg: 'bg-[var(--brand-soft)] ', border: 'border-[var(--border)] ' },
];
const CNSS_EMPLOYER_TOTAL = 8 + 10 + 2.25;

// ─── CONVENTION CONFIG ────────────────────────────────────────────────────────
// 🆕 Remplacé par le catalogue partagé (lib/conventions/conventions-catalog.ts)
// — les anciens codes ci-dessus (TRANSPORTS, HYDROCARBURES, BANQUES,
// AGRICULTURE, TELECOMMUNICATIONS, SANTE, EDUCATION) n'existaient dans AUCUN
// registre backend : les choisir ne déclenchait jamais rien côté serveur.
// Le nouveau catalogue ne liste que les codes réellement supportés.

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────

const DEFAULT_COMPANY: CompanySettings = {
  legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '', taxNumber: '',
  address: '', city: '', phone: '', email: '',
  bankName: '', bankAccount: '', bankRib: '',
  primaryColor: '#0EA5E9', secondaryColor: '#10B981',
  latitude: 0, longitude: 0, allowedRadius: 100, gpsToleranceMeters: 30,
  appliesCnssEmployer: true,
  appliesSeniorityLeaveBonus: true,
  echelonReminderEnabled: false, // 🆕 OFF par défaut — aucun rappel tant que le RH ne l'active pas
  defaultAppliesIrpp:  true,
  defaultAppliesCnss:  true,
  collectiveAgreement: '',
  payrollPaymentDay:   10,  // valeur par défaut schema Prisma
  payrollCloseDay:     25,  // valeur par défaut schema Prisma
  documentFooterText:  '',
  documentTemplate:    'DEFAULT',
  contractRepresentativeName: '',
  contractRepresentativeRole: '',
  contractSignatureCity:      '',
  legalForm: '',
};

const DEFAULT_PAYROLL: PayrollSettings = {
  officialStartHour:    8,
  officialStartMinute:  0,
  lateToleranceMinutes: 0,
  workDaysPerMonth:     26,
  workHoursPerDay:      8,
  workDays:             [1, 2, 3, 4, 5],
  fiscalMode:           'AUTO',
  forfaitItsRate:       0.08,
};

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' }, { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' }, { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' }, { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }, // 🕐 dimanche = 0 (même convention que Paramètres → Paie et le serveur)
];

// ─── TYPE ONGLETS ─────────────────────────────────────────────────────────────

type TabId = 'general' | 'fiscal' | 'convention' | 'payroll_calendar' | 'location' | 'attendance' | 'contact' | 'sites';

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────

function CompanySettingsPage() {
  const alert    = useAlert();
  const router   = useRouter();
  const [savedDocumentTemplate, setSavedDocumentTemplate] = useState<DocumentTemplate>('DEFAULT');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [activeTab,    setActiveTab]    = useState<TabId>('general');
  const [companyData,  setCompanyData]  = useState<CompanySettings>(DEFAULT_COMPANY);
  // ✅ Mode "tester en marchant" — GPS actif seulement pendant que ce
  // toggle est vrai, jamais en arrière-plan sur cette page.
  const [walkTestActive, setWalkTestActive] = useState(false);
  const [walkTestOffset, setWalkTestOffset] = useState<{ east: number; north: number } | null>(null);

  useEffect(() => {
    if (!walkTestActive) { setWalkTestOffset(null); return; }
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!companyData.latitude || !companyData.longitude) return;
        setWalkTestOffset(
          computeMetersOffset(
            companyData.latitude, companyData.longitude,
            pos.coords.latitude, pos.coords.longitude,
          ),
        );
      },
      () => { /* silencieux : le badge "Localisation en cours..." suffit */ },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walkTestActive, companyData.latitude, companyData.longitude]);

  // 🆕 Convention telle que chargée depuis le serveur — sert à détecter un
  // VRAI changement au moment de sauvegarder, pour ne déclencher l'activation
  // (et donc la génération des règles + primes) que si l'utilisateur a
  // réellement changé de convention, pas à chaque sauvegarde de la page.
  const [loadedConvention, setLoadedConvention] = useState<string>('');
  const [payrollData,  setPayrollData]  = useState<PayrollSettings>(DEFAULT_PAYROLL);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [companyId,     setCompanyId]     = useState<string | null>(null);
  const [currentLogo,   setCurrentLogo]   = useState<string | null>(null);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [logoFile,      setLogoFile]      = useState<File | null>(null);
  const [currentCachet, setCurrentCachet] = useState<string | null>(null);
  const [cachetPreview, setCachetPreview] = useState<string | null>(null);
  const [cachetFile,    setCachetFile]    = useState<File | null>(null);
  const [cachetUploading, setCachetUploading] = useState(false);
  const cachetInputRef = React.useRef<HTMLInputElement>(null);

  // 🆕 Multi-sites
  const [sites,         setSites]         = useState<CompanySite[]>([]);
  const [siteForm,      setSiteForm]      = useState({ name: '', latitude: 0, longitude: 0, radius: 100 });
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteError,     setSiteError]     = useState<string | null>(null);

  // ✅ Même mécanisme que pour le site principal, mais pour le formulaire de
  // site multi-sites (siteForm) — état et effet séparés pour ne pas
  // interférer avec le test du site principal. Placé APRÈS la déclaration
  // de siteForm (sinon erreur TS "used before its declaration").
  const [siteWalkTestActive, setSiteWalkTestActive] = useState(false);
  const [siteWalkTestOffset, setSiteWalkTestOffset] = useState<{ east: number; north: number } | null>(null);

  useEffect(() => {
    if (!siteWalkTestActive) { setSiteWalkTestOffset(null); return; }
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!siteForm.latitude || !siteForm.longitude) return;
        setSiteWalkTestOffset(
          computeMetersOffset(
            siteForm.latitude, siteForm.longitude,
            pos.coords.latitude, pos.coords.longitude,
          ),
        );
      },
      () => { /* silencieux : le badge "Localisation en cours..." suffit */ },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteWalkTestActive, siteForm.latitude, siteForm.longitude]);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // ── Chargement ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSuperAdmin(authService.getCurrentUser()?.role === 'SUPER_ADMIN');
        const company: any = await api.get('/companies/mine');
        if (company) {
          setSavedDocumentTemplate(company.documentTemplate || 'DEFAULT');
          setCompanyData({
            legalName:            company.legalName           || '',
            tradeName:            company.tradeName           || '',
            rccmNumber:           company.rccmNumber          || '',
            cnssNumber:           company.cnssNumber          || '',
            taxNumber:            company.taxNumber           || '',
            address:              company.address             || '',
            city:                 company.city                || '',
            phone:                company.phone               || '',
            email:                company.email               || '',
            bankName:             company.bankName            || '',
            bankAccount:          company.bankAccount         || '',
            bankRib:              company.bankRib             || '',
            primaryColor:         company.primaryColor        || '#0EA5E9',
            secondaryColor:       company.secondaryColor      || '#10B981',
            latitude:             company.latitude            || 0,
            longitude:            company.longitude           || 0,
            allowedRadius:        company.allowedRadius       || 100,
            gpsToleranceMeters:   company.gpsToleranceMeters      ?? 0,
            appliesCnssEmployer:  company.appliesCnssEmployer ?? true,
            appliesSeniorityLeaveBonus: company.appliesSeniorityLeaveBonus ?? true,
            echelonReminderEnabled: company.echelonReminderEnabled ?? false, // 🆕
            defaultAppliesIrpp:   company.defaultAppliesIrpp  ?? true,
            defaultAppliesCnss:   company.defaultAppliesCnss  ?? true,
            collectiveAgreement:  company.collectiveAgreement || '',
            // 🆕 Calendrier de paie — valeurs BDD avec fallback schéma Prisma
            payrollPaymentDay:    company.payrollPaymentDay   ?? 10,
            payrollCloseDay:      company.payrollCloseDay     ?? 25,
            // 🆕 Pied de page légal libre affiché sur les documents imprimables (congé, absence, prêt...)
            documentFooterText:   company.documentFooterText  || '',
            documentTemplate:     company.documentTemplate    || 'DEFAULT',
            contractRepresentativeName: company.contractRepresentativeName || '',
            contractRepresentativeRole: company.contractRepresentativeRole || '',
            contractSignatureCity:      company.contractSignatureCity      || '',
            legalForm:                  company.legalForm                  || '',
          });
          setLoadedConvention(company.collectiveAgreement || ''); // 🆕
        }

        setCompanyId(company.id || null);
        setCurrentLogo(company.logo || null);
        setLogoPreview(company.logo || null);
        setCurrentCachet(company.cachetUrl || null);
        setCachetPreview(company.cachetUrl || null);

        // 🆕 Charger les sites multi-pointage
        try {
          const sitesData: any[] = await api.get(`/companies/${company.id}/sites`);
          setSites(sitesData ?? []);
        } catch { /* pas de sites encore — pas grave */ }

        const settings: any = await api.get('/payroll-settings');
        if (settings) {
          setPayrollData({
            officialStartHour:    settings.officialStartHour    ?? 8,
            officialStartMinute:  settings.officialStartMinute  ?? 0,
            lateToleranceMinutes: settings.lateToleranceMinutes ?? 0,
            workDaysPerMonth:     settings.workDaysPerMonth     ?? 26,
            workHoursPerDay:      settings.workHoursPerDay      ?? 8,
            workDays:             Array.from(new Set(((settings.workDays as number[]) || [1, 2, 3, 4, 5]).map((d: number) => (d === 7 ? 0 : d)))).sort((a, b) => a - b),
            fiscalMode:           settings.fiscalMode           ?? 'AUTO',
            forfaitItsRate:       settings.forfaitItsRate       ?? 0.08,
          });
        }
      } catch (e) {
        console.error('Erreur chargement paramètres', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCompanyChange = (field: keyof CompanySettings, value: any) =>
    setCompanyData(prev => ({ ...prev, [field]: value }));

  const handlePayrollChange = (field: keyof PayrollSettings, value: any) =>
    setPayrollData(prev => ({ ...prev, [field]: value }));

  const toggleWorkDay = (day: number) => {
    setPayrollData(prev => {
      const workDays = prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort((a, b) => a - b);
      return { ...prev, workDays };
    });
  };

  // 🆕 Mesure du CENTRE du site. Avant : une seule lecture GPS (la première, souvent une position
  // réseau décalée de centaines de mètres, ou la position IP d'un ordinateur) était enregistrée
  // telle quelle → tous les employés, même sur place, paraissaient à 800 m. Maintenant : on écoute le
  // GPS jusqu'à 30 s, on moyenne les meilleures lectures, et on REFUSE d'enregistrer si c'est trop flou.
  const [locating, setLocating] = useState<string | null>(null);
  const measureSitePosition = async (apply: (lat: number, lng: number) => void) => {
    if (!navigator.geolocation) {
      alert.error('Navigateur non compatible', "La géolocalisation n'est pas supportée.");
      return;
    }
    if (locating) return;
    setLocating('Mesure en cours…');
    const { fix, denied } = await captureBestPosition({
      maxWaitMs: 30_000, goodEnoughM: 12, average: true,
      onProgress: (acc, n) => setLocating(`Mesure… ±${Math.round(acc)} m (${n})`),
    });
    setLocating(null);
    if (!fix) {
      alert.error(
        denied ? 'Localisation refusée' : 'Position introuvable',
        denied ? 'Autorisez la localisation « précise » pour ce site, puis réessayez.'
               : "Impossible d'obtenir une position. Réessayez à l'extérieur.",
      );
      return;
    }
    const acc = Math.round(fix.accuracy);
    if (acc > 100) {
      alert.error(
        'Position trop imprécise',
        `±${acc} m : position NON enregistrée. Mesurez depuis un téléphone, à l'extérieur, avec la localisation « précise » activée (pas depuis un ordinateur).`,
      );
      return;
    }
    apply(fix.latitude, fix.longitude);
    alert.success(
      `Position enregistrée (±${acc} m)`,
      acc > 30 ? "Précision moyenne : refaites la mesure à l'extérieur pour plus de fiabilité." : 'Coordonnées GPS enregistrées.',
    );
  };

  const getCurrentLocation = () =>
    measureSitePosition((lat, lng) => setCompanyData(prev => ({ ...prev, latitude: lat, longitude: lng })));
  
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert.error('Fichier trop grand', 'Max 2 MB'); return; }
  setLogoFile(file);
  const reader = new FileReader();
  reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
  reader.readAsDataURL(file);
  e.target.value = '';
};

const handleLogoUpload = async () => {
  if (!logoFile || !companyId) return;
  setLogoUploading(true);
  try {
    const form = new FormData();
    form.append('logo', logoFile);

    // On utilise postFormData pour que le header Content-Type soit géré correctement
    const data = await api.postFormData<any>(`/companies/${companyId}/logo`, form);
    
    setCurrentLogo(data.logo);
    setLogoFile(null);
    window.dispatchEvent(new Event('konza:company-updated')); // rafraîchit le logo du menu
    alert.success('Logo enregistré', 'Apparaîtra sur vos bulletins de paie et dans le menu.');
  } catch (e: any) { 
    alert.error('Erreur upload logo', e.message); 
  } finally { 
    setLogoUploading(false); 
  }
};

const handleLogoDelete = async () => {
  if (!companyId) return;
  setLogoUploading(true);
  try {
    // Utilisation de la méthode delete standard du service
    await api.delete(`/companies/${companyId}/logo`);

    setCurrentLogo(null);
    setLogoPreview(null);
    setLogoFile(null);
    window.dispatchEvent(new Event('konza:company-updated')); // le menu repasse au logo Konza
    alert.success('Logo supprimé', '');
  } catch (e: any) { 
    alert.error('Erreur', e.message); 
  } finally { 
    setLogoUploading(false); 
  }
};

const cancelLogoSelection = () => { setLogoFile(null); setLogoPreview(currentLogo); };

const handleCachetSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert.error('Fichier trop grand', 'Max 2 MB'); return; }
  setCachetFile(file);
  const reader = new FileReader();
  reader.onload = (ev) => setCachetPreview(ev.target?.result as string);
  reader.readAsDataURL(file);
  e.target.value = '';
};

const handleCachetUpload = async () => {
  if (!cachetFile || !companyId) return;
  setCachetUploading(true);
  try {
    const form = new FormData();
    form.append('cachet', cachetFile);
    const data = await api.postFormData<any>(`/companies/${companyId}/cachet`, form);
    setCurrentCachet(data.cachetUrl);
    setCachetFile(null);
    alert.success('Cachet enregistré', "Apparaîtra sur les documents une fois la demande validée.");
  } catch (e: any) {
    alert.error('Erreur upload cachet', e.message);
  } finally {
    setCachetUploading(false);
  }
};

const handleCachetDelete = async () => {
  if (!companyId) return;
  setCachetUploading(true);
  try {
    await api.delete(`/companies/${companyId}/cachet`);
    setCurrentCachet(null);
    setCachetPreview(null);
    setCachetFile(null);
    alert.success('Cachet supprimé', '');
  } catch (e: any) {
    alert.error('Erreur', e.message);
  } finally {
    setCachetUploading(false);
  }
};

const cancelCachetSelection = () => { setCachetFile(null); setCachetPreview(currentCachet); };

  // ── Multi-sites handlers ────────────────────────────────────────────────────
  const getSiteCurrentLocation = () =>
    measureSitePosition((lat, lng) => setSiteForm(f => ({ ...f, latitude: lat, longitude: lng })));

  const handleSaveSite = async () => {
    setSiteError(null);
    if (!siteForm.name.trim()) { setSiteError('Le nom du site est obligatoire.'); return; }
    if (siteForm.radius < 1)   { setSiteError('Le rayon doit être d\'au moins 1 mètre.'); return; }
    if (!companyId)            return;
    try {
      if (editingSiteId) {
       const updated = await api.patch<CompanySite>(`/companies/${companyId}/sites/${editingSiteId}`, siteForm);
setSites(s => s.map(x => x.id === editingSiteId ? updated : x));
        alert.success('Site modifié', siteForm.name);
      } else {
const created = await api.post<CompanySite>(`/companies/${companyId}/sites`, siteForm);
setSites(s => [...s, created]);
        alert.success('Site ajouté', siteForm.name);
      }
      setSiteForm({ name: '', latitude: 0, longitude: 0, radius: 100 });
      setEditingSiteId(null);
      setSiteWalkTestActive(false); // ✅ le formulaire est vidé, plus besoin de suivre le GPS
    } catch (e: any) { setSiteError(e.message ?? 'Erreur'); }
  };

  const handleEditSite = (site: CompanySite) => {
    setSiteWalkTestActive(false); // ✅ on change de site : l'ancien test n'a plus de sens
    setEditingSiteId(site.id);
    setSiteForm({ name: site.name, latitude: site.latitude, longitude: site.longitude, radius: site.radius });
  };

  const handleDeleteSite = async (siteId: string) => {
    if (!companyId) return;
    if (!confirm('Supprimer ce site ?')) return;
    try {
      await api.delete(`/companies/${companyId}/sites/${siteId}`);
      setSites(s => s.filter(x => x.id !== siteId));
      alert.success('Site supprimé', '');
    } catch (e: any) { alert.error('Erreur', e.message); }
  };

  const handleToggleSite = async (site: CompanySite) => {
    if (!companyId) return;
    try {
const updated = await api.patch<CompanySite>(`/companies/${companyId}/sites/${site.id}`, { isActive: !site.isActive });
setSites(s => s.map(x => x.id === site.id ? updated : x));
    } catch (e: any) { alert.error('Erreur', e.message); }
  };
  // ── Sauvegarde ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    // Validation minimale date de paie
    if (companyData.payrollPaymentDay < 1 || companyData.payrollPaymentDay > 31) {
      alert.error('Valeur invalide', 'Le jour de paiement doit être entre 1 et 31.');
      return;
    }
    if (companyData.payrollCloseDay < 1 || companyData.payrollCloseDay > 31) {
      alert.error('Valeur invalide', 'Le jour de clôture doit être entre 1 et 31.');
      return;
    }

    setIsSaving(true);
    try {
      // 🆕 SYNCHRONISATION CONVENTION — si l'utilisateur a réellement changé
      // de convention (pas juste rouvert la page), on passe par les vrais
      // endpoints /conventions/activate ou /conventions/deactivate AVANT le
      // patch générique. C'est ça qui déclenche la génération des règles
      // (CollectiveAgreementRule) et des primes suggérées (BonusTemplate) —
      // un simple PATCH /companies ne le fait pas, il ne fait que stocker le
      // code choisi sans rien automatiser derrière.
      const conventionChanged = companyData.collectiveAgreement !== loadedConvention;
      let conventionFeedback = '';

      if (conventionChanged) {
        if (companyData.collectiveAgreement) {
          const res: any = await api.post('/conventions/activate', {
            conventionCode: companyData.collectiveAgreement,
          });
          const parts: string[] = [];
          if (res?.rulesCount) parts.push(`${res.rulesCount} règle(s)`);
          if (res?.bonusTemplatesImported) parts.push(`${res.bonusTemplatesImported} prime(s) suggérée(s)`);
          if (parts.length > 0) conventionFeedback = ` (${parts.join(' + ')} générée(s) automatiquement)`;
        } else {
          await api.post('/conventions/deactivate', {});
        }
        setLoadedConvention(companyData.collectiveAgreement || '');
      }

      // payrollPaymentDay + payrollCloseDay + echelonReminderEnabled, etc. → PATCH /companies
      await api.patch('/companies', {
        ...companyData,
        documentTemplate: companyData.documentTemplate === savedDocumentTemplate ? undefined : companyData.documentTemplate,
        collectiveAgreement: companyData.collectiveAgreement || null,
      });

      // fiscalMode, workDays, etc. → PATCH /payroll-settings
      setSavedDocumentTemplate(companyData.documentTemplate);
      await api.patch('/payroll-settings', payrollData);

      setShowConfirm(false);
      alert.success(
        'Paramètres enregistrés',
        `Les modifications ont été appliquées.${conventionFeedback}`,
      );
      // Le guide « Premiers pas » attend cet enregistrement pour passer à l'étape suivante.
      window.dispatchEvent(new CustomEvent('konza:guide:saved'));
    } catch (e: any) {
      alert.error("Erreur d'enregistrement", e.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateLateTime = () => {
    const total = payrollData.officialStartHour * 60 + payrollData.officialStartMinute + payrollData.lateToleranceMinutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };
  const calculateNextMinute = () => {
    const total = payrollData.officialStartHour * 60 + payrollData.officialStartMinute + payrollData.lateToleranceMinutes + 1;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  // Aperçu du calendrier de paie
  const getPayrollCalendarPreview = () => {
    const closeDay   = companyData.payrollCloseDay;
    const paymentDay = companyData.payrollPaymentDay;
    const now        = new Date();
    const month      = now.toLocaleString('fr-FR', { month: 'long' });
    const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      .toLocaleString('fr-FR', { month: 'long' });
    return {
      closeLabel:   `${closeDay} ${month}`,
      paymentLabel: `${paymentDay} ${nextMonth}`,
      daysGap:      paymentDay + (31 - closeDay), // approximation
    };
  };

  // ── Tab button ───────────────────────────────────────────────────────────────
  const TabButton = ({ id, label, icon: Icon }: { id: TabId; label: string; icon: React.ElementType }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${
        activeTab === id
          ? 'bg-[var(--text)] text-[var(--bg)] shadow-lg'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
      }`}
    >
      <Icon size={18} /> {label}
    </button>
  );

  // ── Chargement initial ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <KonzaLoader variant="page" />
    );
  }

  const calPreview = getPayrollCalendarPreview();

  // ── RENDU ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1200px] mx-auto pb-24 px-4 relative">

      <AppearanceLink company />
      {/* HEADER */}
      <div className="settings-page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 mt-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
            <ArrowLeft size={20} className="text-[var(--text-muted)]" />
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--text)] tracking-tight">
              Paramètres Entreprise
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Configuration complète : identité, fiscalité et politiques RH.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TABS — 4 principaux en haut (centrés, grands)
                 3 secondaires en bas (plus discrets)
      ══════════════════════════════════════════════ */}

      {/* Ligne 1 — 4 onglets principaux, centrés */}
      <div role="tablist" aria-label="Rubriques des paramètres" className="settings-local-tabs flex justify-center gap-2 mb-2">
        {([
          { id: 'general',    label: 'Général',        icon: Building2,   desc: 'Identité légale' },
          { id: 'fiscal',     label: 'Fiscalité',      icon: ShieldCheck, desc: 'CNSS & Impôts'   },
          { id: 'convention', label: 'Convention',     icon: BookOpen,    desc: 'Barème collectif' },
          { id: 'attendance', label: 'Pointage',       icon: Clock,       desc: 'Horaires & GPS'  },
        ] as { id: TabId; label: string; icon: React.ElementType; desc: string }[]).map(tab => (
          <button role="tab" aria-selected={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-semibold text-sm transition-colors min-w-[110px] ${
              activeTab === tab.id
                ? 'bg-[var(--text)] text-[var(--bg)] shadow-lg scale-[1.03]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:scale-[1.01]'
            }`}
          >
            <tab.icon size={20} />
            <span className="font-semibold">{tab.label}</span>
            <span className={`text-[10px] font-normal ${activeTab === tab.id ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Ligne 2 — 3 onglets secondaires, centrés, plus petits */}
      <div role="tablist" aria-label="Rubriques des paramètres" className="settings-local-tabs flex justify-center gap-2 mb-6">
        {([
          { id: 'payroll_calendar', label: 'Calendrier de paie', icon: Banknote },
          { id: 'location',         label: 'Localisation GPS',   icon: MapPin   },
          { id: 'sites',            label: 'Sites de pointage',  icon: Navigation },
          { id: 'contact',          label: 'Coordonnées',        icon: Phone    },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(tab => (
          <button role="tab" aria-selected={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[var(--text)] text-[var(--bg)] shadow-md'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-two-column grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════
                ONGLET GÉNÉRAL
            ══════════════════════════════════════════════ */}
            {activeTab === 'general' && (
              <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Briefcase size={20} className="text-[var(--success-text)]" /> Identification
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { field: 'legalName',  label: 'Nom Légal*',      mono: false },
                      { field: 'tradeName',  label: 'Nom Commercial',  mono: false },
                      { field: 'rccmNumber', label: 'N° RCCM*',        mono: true  },
                      { field: 'cnssNumber', label: 'N° CNSS*',        mono: true  },
                      { field: 'taxNumber',  label: 'N° Fiscal (NIU)', mono: true  },
                    ].map(({ field, label, mono }) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">{label}</label>
                        <input
                          type="text"
                          value={(companyData as any)[field]}
                          onChange={e => handleCompanyChange(field as any, e.target.value)}
                          className={`w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] ${mono ? 'font-mono' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Landmark size={20} className="text-[var(--success-text)]" /> Banque Principale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Banque</label>
                      <ModuleSelect value={companyData.bankName} onChange={e => handleCompanyChange('bankName', e.target.value)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]">
                        <option value="">Sélectionner...</option>
                        <option>BGFI Bank</option><option>Ecobank</option>
                        <option>LCB</option><option>UBA</option>
                      </ModuleSelect>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Numéro de Compte</label>
                      <input value={companyData.bankAccount} onChange={e => handleCompanyChange('bankAccount', e.target.value)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">RIB / IBAN</label>
                      <input value={companyData.bankRib} onChange={e => handleCompanyChange('bankRib', e.target.value)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]" />
                    </div>
                  </div>
                </div>

                              {/* ── Logo entreprise ── */}
<div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
    <ImageIcon size={20} className="text-[var(--success-text)]" /> Logo entreprise
  </h3>
  <p className="text-xs text-[var(--text-muted)] mb-5">
    Ce logo s'affichera sur vos bulletins de paie et dans le menu de l'application. Format JPG, PNG, WEBP ou SVG — max 2 MB.
  </p>
  <div className="flex items-start gap-6">
    {/* Preview */}
    <div className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden flex items-center justify-center bg-[var(--surface-2)]">
      {logoPreview
        ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
        : <ImageIcon size={32} className="text-[var(--text-muted)]" />
      }
    </div>
    {/* Actions */}
    <div className="flex-1 space-y-3">
      {!logoFile ? (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => logoInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-soft)]  text-[var(--success-text)]  border border-[var(--border)]  rounded-xl text-sm font-semibold hover:bg-[var(--brand-soft)] transition-colors">
            <Upload size={15} /> Choisir un logo
          </button>
          {currentLogo && (
            <button onClick={handleLogoDelete} disabled={logoUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  border border-[var(--border)]  rounded-xl text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] transition-colors disabled:opacity-50">
              {logoUploading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Supprimer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">Fichier sélectionné : <strong>{logoFile.name}</strong></p>
          <div className="flex gap-2">
            <button onClick={handleLogoUpload} disabled={logoUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {logoUploading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {logoUploading ? 'Upload...' : 'Enregistrer'}
            </button>
            <button onClick={cancelLogoSelection}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-2)] transition-colors">
              <X size={15} /> Annuler
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)]">Recommandé : fond transparent (PNG/SVG), dimensions min. 200×200 px</p>
    </div>
  </div>
  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
    className="hidden" onChange={handleLogoSelect} />
</div>

              {/* ── Cachet & signature ── */}
<div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
    <ImageIcon size={20} className="text-[var(--success-text)]" /> Cachet &amp; signature
  </h3>
  <p className="text-xs text-[var(--text-muted)] mb-5">
    S'affiche automatiquement sur les documents imprimables (congé, absence, prêt...) une fois la demande validée par le RH. Format JPG, PNG ou WEBP — max 2 MB.
  </p>
  <div className="flex items-start gap-6">
    <div className="w-24 h-24 flex-shrink-0 rounded-xl border-2 border-dashed border-[var(--border)] overflow-hidden flex items-center justify-center bg-[var(--surface-2)]">
      {cachetPreview
        ? <img src={cachetPreview} alt="Cachet" className="w-full h-full object-contain p-1" />
        : <ImageIcon size={32} className="text-[var(--text-muted)]" />
      }
    </div>
    <div className="flex-1 space-y-3">
      {!cachetFile ? (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => cachetInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-soft)]  text-[var(--success-text)]  border border-[var(--border)]  rounded-xl text-sm font-semibold hover:bg-[var(--brand-soft)] transition-colors">
            <Upload size={15} /> Choisir un cachet
          </button>
          {currentCachet && (
            <button onClick={handleCachetDelete} disabled={cachetUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  border border-[var(--border)]  rounded-xl text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] transition-colors disabled:opacity-50">
              {cachetUploading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              Supprimer
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">Fichier sélectionné : <strong>{cachetFile.name}</strong></p>
          <div className="flex gap-2">
            <button onClick={handleCachetUpload} disabled={cachetUploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {cachetUploading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {cachetUploading ? 'Upload...' : 'Enregistrer'}
            </button>
            <button onClick={cancelCachetSelection}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl text-sm font-semibold hover:bg-[var(--surface-2)] transition-colors">
              <X size={15} /> Annuler
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)]">Recommandé : fond transparent (PNG), cachet + signature scannés ensemble</p>
    </div>
  </div>
  <input ref={cachetInputRef} type="file" accept="image/jpeg,image/png,image/webp"
    className="hidden" onChange={handleCachetSelect} />
</div>

              {/* ── Modèle de document ── */}
<div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
    <FileText size={20} className="text-[var(--success-text)]" /> Modèle de document
  </h3>
  <p className="text-xs text-[var(--text-muted)] mb-4">
    Mise en page utilisée pour les documents imprimables (congé, absence, prêt, avance...).
  </p>
  <ModuleSelect
    aria-label="Modèle de document"
    value={companyData.documentTemplate}
    onChange={(e) => setCompanyData({ ...companyData, documentTemplate: e.target.value as DocumentTemplate })}
    className="w-full md:w-72 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
  >
    {(savedDocumentTemplate === 'DEFAULT' || savedDocumentTemplate === 'MODERN') && (
      <option value={savedDocumentTemplate}>Modèle actuel (ancien)</option>
    )}
    <option value="STANDARD">Modèle Standard</option>
    <option value="CUSTOM">Mes modèles</option>
    {(savedDocumentTemplate === 'ORCA' || isSuperAdmin) && (
      <option value="ORCA">Modèle Orca</option>
    )}
  </ModuleSelect>
  <Link href="/parametres/documents" className="mt-3 inline-block text-sm underline">Ouvrir la galerie Documents</Link>
</div>

              {/* ── Pied de page légal des documents ── */}
<div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
    <FileText size={20} className="text-[var(--success-text)]" /> Pied de page des documents
  </h3>
  <p className="text-xs text-[var(--text-muted)] mb-4">
    Texte affiché en bas des documents imprimables (congé, absence, prêt...). Laissez vide pour une composition automatique à partir de la raison sociale, du RCCM, du NIU, de l'adresse et du téléphone ci-dessus.
  </p>
  <textarea
    value={companyData.documentFooterText}
    onChange={(e) => setCompanyData({ ...companyData, documentFooterText: e.target.value })}
    rows={4}
    placeholder={"Ex. : KONZA TECH S.A.\nSociété Anonyme au capital de 10 000 000 FCFA\nRCCM CG/XXX/00 B 0000 · NIU : M0000 000000000 · Tél : +242 00 000 00 00\nSiège social : Avenue de l’Indépendance, Pointe-Noire"}
    className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] resize-y"
  />
</div>

              {/* 🆕 ── Générateur de contrats : représentant légal & lieu de signature ── */}
<div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
    <FileText size={20} className="text-[var(--success-text)]" /> Générateur de contrats
  </h3>
  <p className="text-xs text-[var(--text-muted)] mb-4">
    Ces informations sont pré-remplies automatiquement à chaque génération de contrat (CDI/CDD, prestation de services, stage).
  </p>
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Forme juridique</label>
      <input
        value={companyData.legalForm || ''}
        onChange={(e) => setCompanyData({ ...companyData, legalForm: e.target.value })}
        placeholder="Ex. : Société Anonyme à Responsabilité Limitée (SARL)"
        className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Nom du représentant</label>
      <input
        value={companyData.contractRepresentativeName || ''}
        onChange={(e) => setCompanyData({ ...companyData, contractRepresentativeName: e.target.value })}
        placeholder="Ex. : Monsieur HUSSEIN Ayman"
        className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Fonction du représentant</label>
      <input
        value={companyData.contractRepresentativeRole || ''}
        onChange={(e) => setCompanyData({ ...companyData, contractRepresentativeRole: e.target.value })}
        placeholder="Ex. : Directeur Gérant"
        className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
      />
    </div>
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">Ville de signature</label>
      <input
        value={companyData.contractSignatureCity || ''}
        onChange={(e) => setCompanyData({ ...companyData, contractSignatureCity: e.target.value })}
        placeholder="Ex. : Pointe-Noire"
        className="w-full p-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)]"
      />
    </div>
  </div>
</div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET FISCALITÉ
            ══════════════════════════════════════════════ */}
            {activeTab === 'fiscal' && (
              <motion.div key="fiscal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* CNSS PATRONALE */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[var(--success-text)]" /> CNSS Patronale
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-5">
                    La CNSS patronale est composée de <strong>3 branches distinctes</strong> avec des plafonds différents, conformément au Décret 2009-392.
                  </p>

                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-[var(--brand-soft)]  rounded-xl border-2 border-[var(--border)]  hover:border-[var(--border)] transition-colors group mb-4">
                    <input type="checkbox" checked={companyData.appliesCnssEmployer}
                      onChange={e => handleCompanyChange('appliesCnssEmployer', e.target.checked)}
                      className="w-5 h-5 rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)] mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-[var(--text)] block mb-1">
                        L'entreprise est assujettie à la CNSS patronale
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Décochez si votre structure n'est pas encore immatriculée à la CNSS.
                      </p>
                    </div>
                  </label>

                  <AnimatePresence>
                    {companyData.appliesCnssEmployer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <div className="space-y-3 mb-4">
                          {CNSS_BRANCHES.map(branch => (
                            <div key={branch.key}
                              className={`flex items-center justify-between p-4 rounded-xl border ${branch.bg} ${branch.border}`}>
                              <div>
                                <p className={`font-semibold text-sm ${branch.color}`}>{branch.label}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Plafond : {branch.plafond}</p>
                              </div>
                              <span className={`text-2xl font-semibold font-mono ${branch.color}`}>{branch.rate}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] dark:bg-[rgb(0_0_0_/.5)] rounded-xl">
                          <div>
                            <p className="text-[var(--text)] font-semibold text-sm">Total CNSS patronale</p>
                            <p className="text-[var(--text-muted)] text-xs mt-0.5">Taux combiné (bases plafonnées respectives)</p>
                          </div>
                          <span className="text-2xl font-semibold font-mono text-[var(--text)]">{CNSS_EMPLOYER_TOTAL}%</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-[var(--warning-text)] shrink-0" />
                          Ces taux sont <strong>fixés par la loi congolaise</strong> et ne sont pas modifiables.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* PARAMÈTRES PAR DÉFAUT — NOUVEAUX EMPLOYÉS */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-[var(--success-text)]" /> Paramètres par défaut — Nouveaux employés
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-5">
                    Ces valeurs seront pré-remplies à la création d'un nouvel employé.
                  </p>

                  <div className="p-4 bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-xl mb-5">
                    <p className="text-sm font-semibold text-[var(--success-text)]  mb-1 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" /> Réforme fiscale 2026 — ITS (ex-IRPP)
                    </p>
                    <p className="text-xs text-[var(--success-text)]  leading-relaxed">
                      Depuis le 1er janvier 2026, l'IRPP est remplacé par l'<strong>ITS</strong>. L'abattement passe de <strong>30% plafonné</strong> à <strong>20% sans plafond</strong>. Quotient familial supprimé — 1 part unique. Le système bascule automatiquement selon l'année du bulletin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] transition-colors">
                      <input type="checkbox" checked={companyData.defaultAppliesIrpp}
                        onChange={e => handleCompanyChange('defaultAppliesIrpp', e.target.checked)}
                        className="w-5 h-5 rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)]" />
                      <div>
                        <span className="text-sm font-semibold text-[var(--text)] block mb-0.5">Par défaut, soumis à l'ITS</span>
                        <p className="text-xs text-[var(--text-muted)]">Barème 1% / 10% / 25% / 40%</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:border-[var(--border)] transition-colors">
                      <input type="checkbox" checked={companyData.defaultAppliesCnss}
                        onChange={e => handleCompanyChange('defaultAppliesCnss', e.target.checked)}
                        className="w-5 h-5 rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)]" />
                      <div>
                        <span className="text-sm font-semibold text-[var(--text)] block mb-0.5">Par défaut, soumis à la CNSS</span>
                        <p className="text-xs text-[var(--text-muted)]">4% salarié · plafond 1 200 000 F</p>
                      </div>
                    </label>
                  </div>

                  {/* Mode calcul ITS */}
                  <div className="mt-6 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                    <h4 className="font-semibold text-[var(--text)] mb-1 flex items-center gap-2 text-sm">
                      <ShieldCheck size={16} className="text-[var(--success-text)]" /> Mode de calcul ITS / IRPP
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mb-4">
                      Choisissez comment l'impôt sur salaires est calculé pour tous les bulletins.
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { value: 'AUTO',        color: 'indigo', label: 'Automatique',               badge: 'Recommandé', desc: 'Bulletins < 2026 → IRPP (30%) · Bulletins ≥ 2026 → ITS (20%)' },
                        { value: 'ITS_2026',    color: 'violet', label: 'ITS 2026 (nouveau régime)', badge: null,         desc: 'Barème progressif · Abattement 20% sans plafond · 1 part' },
                        { value: 'IRPP_LEGACY', color: 'amber',  label: 'IRPP (avant 2026)',         badge: null,         desc: 'Barème progressif · Abattement 30% plafonné 75 000 F/mois · Quotient familial' },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-colors ${
                          payrollData.fiscalMode === opt.value
                            ? 'border-[var(--action)] bg-[var(--brand-soft)]'
                            : 'border-[var(--border)] hover:border-[var(--action)]'
                        }`}>
                          <input type="radio" name="fiscalMode" value={opt.value}
                            checked={payrollData.fiscalMode === opt.value}
                            onChange={() => handlePayrollChange('fiscalMode', opt.value)}
                            className={'mt-1 accent-[var(--brand)]'} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-[var(--text)]">{opt.label}</span>
                              {opt.badge && (
                                <span className={'text-xs bg-[var(--brand-soft)] text-[var(--action)] px-2 py-0.5 rounded-full font-medium'}>
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">{opt.desc}</p>
                          </div>
                        </label>
                      ))}

                      {/* Forfait */}
                      <label className={`flex items-start gap-4 cursor-pointer p-4 rounded-xl border-2 transition-colors ${
                        payrollData.fiscalMode === 'FORFAIT'
                          ? 'border-[var(--border)] bg-[var(--brand-soft)] '
                          : 'border-[var(--border)] hover:border-[var(--border)]'
                      }`}>
                        <input type="radio" name="fiscalMode" value="FORFAIT"
                          checked={payrollData.fiscalMode === 'FORFAIT'}
                          onChange={() => handlePayrollChange('fiscalMode', 'FORFAIT')}
                          className="mt-1 text-[var(--success-text)]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[var(--text)]">Taux forfaitaire</span>
                            <span className="text-xs bg-[var(--brand-soft)]  text-[var(--success-text)]  px-2 py-0.5 rounded-full font-medium">Pratique terrain</span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mb-3">
                            ITS = brut fiscal × taux fixe. Non conforme CGI mais compatible anciens bulletins.
                          </p>
                          {payrollData.fiscalMode === 'FORFAIT' && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                              <label className="text-xs font-semibold text-[var(--text)] whitespace-nowrap">Taux ITS :</label>
                              <div className="flex items-center gap-2">
                                <input type="number" min="1" max="40" step="0.5"
                                  value={Math.round(payrollData.forfaitItsRate * 100)}
                                  onChange={e => handlePayrollChange('forfaitItsRate', parseFloat(e.target.value) / 100 || 0.08)}
                                  className="w-20 text-center border border-[var(--border)]  rounded-lg px-2 py-1.5 text-sm font-semibold bg-[var(--surface)] text-[var(--success-text)] focus:ring-2 focus:ring-[var(--focus)]" />
                                <span className="text-sm font-semibold text-[var(--success-text)]">%</span>
                                <div className="flex gap-2 ml-2">
                                  {[6, 8, 10].map(pct => (
                                    <button key={pct} type="button"
                                      onClick={() => handlePayrollChange('forfaitItsRate', pct / 100)}
                                      className={`text-xs px-2 py-1 rounded-lg font-semibold border transition-colors ${
                                        Math.round(payrollData.forfaitItsRate * 100) === pct
                                          ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]'
                                          : 'border-[var(--border)] text-[var(--success-text)] hover:bg-[var(--brand-soft)]'
                                      }`}>{pct}%</button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET CONVENTION COLLECTIVE
            ══════════════════════════════════════════════ */}
            {activeTab === 'convention' && (
              <motion.div key="convention" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 md:p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2 mb-1">
                      <BookOpen size={20} className="text-[var(--success-text)]" /> Convention Collective
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      La convention collective détermine les catégories professionnelles et salaires minimums appliqués à vos employés.
                    </p>
                  </div>

                  <ConventionPicker
                    selected={companyData.collectiveAgreement || ''}
                    onSelect={(code) => handleCompanyChange('collectiveAgreement', code)}
                    variant="light"
                  />

                  <AnimatePresence>
                    {companyData.collectiveAgreement && getConventionCatalogEntry(companyData.collectiveAgreement) && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mt-4 p-4 bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-xl flex items-start gap-3">
                        <Award size={18} className="text-[var(--success-text)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-[var(--success-text)] ">
                            Convention {getConventionCatalogEntry(companyData.collectiveAgreement)?.label} active
                          </p>
                          <p className="text-xs text-[var(--success-text)]  mt-0.5">
                            Les nouveaux employés bénéficieront automatiquement des catégories et salaires minimums de cette convention.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!companyData.collectiveAgreement && (
                    <div className="mt-4 p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl">
                      <p className="text-xs text-[var(--warning-text)]  flex items-center gap-2">
                        <AlertCircle size={13} />
                        Aucune convention sélectionnée — les catégories ne seront pas pré-remplies.
                      </p>
                    </div>
                  )}
                </div>

                {/* 🆕 JOURS DE CONGÉ SUPPLÉMENTAIRES D'ANCIENNETÉ */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 md:p-8">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2 mb-1">
                      <Award size={20} className="text-[var(--success-text)]" /> Congé supplémentaire d'ancienneté
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Certaines conventions accordent des jours de congé additionnels selon l'ancienneté de l'employé, en plus des 26 jours de base. Certaines entreprises choisissent de ne pas les appliquer.
                    </p>
                  </div>

                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-[var(--brand-soft)]  rounded-xl border-2 border-[var(--border)]  hover:border-[var(--border)] transition-colors group">
                    <input type="checkbox" checked={companyData.appliesSeniorityLeaveBonus}
                      onChange={e => handleCompanyChange('appliesSeniorityLeaveBonus', e.target.checked)}
                      className="w-5 h-5 rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)] mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-[var(--text)] block mb-1">
                        Accorder les jours de congé supplémentaires d'ancienneté
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Coché : les employés éligibles reçoivent 26j + leurs jours d'ancienneté (selon la convention sélectionnée), et le bulletin de paie affiche une ligne "Congé supplémentaire" séparée. Décoché : tous les employés n'acquièrent que les 26 jours de base, quelle que soit leur ancienneté.
                      </p>
                    </div>
                  </label>
                </div>

                {/* 🆕 RAPPELS DE CHANGEMENT D'ÉCHELON */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 md:p-8">
                  <div className="mb-5">
                    <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2 mb-1">
                      <Award size={20} className="text-[var(--success-text)]" /> Rappels de changement d'échelon
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Certaines conventions font progresser l'échelon d'un employé selon son ancienneté.
                      Rien ne change automatiquement : si vous activez cette option, Konza RH vous
                      signale simplement (par notification, étalée dans le mois) qu'un employé a
                      atteint le seuil suivant — c'est toujours vous qui validez ou refusez.
                    </p>
                  </div>

                  <label className="flex items-start gap-4 cursor-pointer p-4 bg-[var(--brand-soft)]  rounded-xl border-2 border-[var(--border)]  hover:border-[var(--border)] transition-colors group">
                    <input type="checkbox" checked={!!companyData.echelonReminderEnabled}
                      onChange={e => handleCompanyChange('echelonReminderEnabled', e.target.checked)}
                      className="w-5 h-5 rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)] mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-[var(--text)] block mb-1">
                        Activer les rappels de changement d'échelon
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        Décoché (défaut) : aucun rappel, l'échelon reste tel que saisi sur la fiche
                        employé. Coché : vous recevez une notification par employé concerné, jamais
                        toutes le même jour — et vous gardez toujours la décision finale.
                      </p>
                    </div>
                  </label>

                  {companyData.echelonReminderEnabled && (
                    <div className="mt-6">
                      <EchelonSuggestionsPanel />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                🆕 ONGLET CALENDRIER DE PAIE
            ══════════════════════════════════════════════ */}
            {activeTab === 'payroll_calendar' && (
              <motion.div key="payroll_calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* Bannière info */}
                <div className="p-4 bg-[var(--brand-soft)]  border border-[var(--border)]  rounded-2xl flex gap-3 items-start">
                  <Info size={20} className="text-[var(--success-text)]  shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--success-text)] ">Impact sur le suivi des impayés</p>
                    <p className="text-xs text-[var(--success-text)]  mt-0.5 leading-relaxed">
                      Ces deux dates configurent l'échéance réelle calculée par le service <strong>UnpaidSalaryService</strong>. Le salaire du mois M est considéré <strong>en retard</strong> si non payé après le <strong>jour {companyData.payrollPaymentDay} du mois M+1</strong>.
                    </p>
                  </div>
                </div>

                {/* Aperçu calendrier */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-[var(--success-text)]" /> Aperçu du cycle de paie
                  </h3>

                  {/* Timeline visuelle */}
                  <div className="relative flex items-center justify-between gap-2 mb-8 px-2">
                    {/* Ligne de connexion */}
                    <div className="absolute left-0 right-0 top-6 h-0.5 bg-[var(--brand-soft)]  z-0" />

                    {[
                      { day: '1er', label: 'Début du mois', sub: 'Mois de travail', color: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Calendar },
                      { day: `${companyData.payrollCloseDay}`, label: 'Clôture bulletins', sub: 'Mois courant', color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)] ', icon: FileText },
                      { day: `${companyData.payrollPaymentDay}`, label: 'Date de paiement', sub: 'Mois suivant', color: 'bg-[var(--brand-soft)]  text-[var(--success-text)] ', icon: Banknote },
                    ].map((step, i) => (
                      <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg ${step.color}`}>
                          <step.icon size={18} strokeWidth={1.5} aria-hidden="true" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-[var(--text)]">Jour {step.day}</p>
                          <p className="text-xs font-semibold text-[var(--text)]">{step.label}</p>
                          <p className="text-xs text-[var(--text-muted)]">{step.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Résumé en box */}
                  <div className="p-4 bg-[var(--brand-soft)]  rounded-xl border border-[var(--border)] ">
                    <p className="text-sm text-[var(--success-text)] ">
                      Le salaire de <strong className="font-semibold">mois M</strong> est clôturé le{' '}
                      <strong className="font-semibold">{calPreview.closeLabel}</strong> et doit être payé
                      avant le <strong className="font-semibold">{calPreview.paymentLabel}</strong>.
                    </p>
                    <p className="text-xs text-[var(--success-text)]  mt-1">
                      Délai entre clôture et paiement : environ <strong>{calPreview.daysGap} jours</strong>.
                    </p>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
                    <Banknote size={20} className="text-[var(--success-text)]" /> Jours de référence
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-6">
                    Ces valeurs sont stockées sur votre entreprise et utilisées automatiquement pour calculer les retards de paie.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Jour de clôture */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 tracking-wider">
                        Jour de clôture des bulletins
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={companyData.payrollCloseDay}
                          onChange={e => handleCompanyChange('payrollCloseDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full p-3 pr-16 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-2xl font-semibold text-[var(--warning-text)]  text-center focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] uppercase">du mois</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        Jour jusqu'auquel les pointages et absences sont comptabilisés dans les bulletins du mois.
                      </p>
                      {/* Sélecteurs rapides */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[20, 25, 28, 31].map(d => (
                          <button key={d} type="button"
                            onClick={() => handleCompanyChange('payrollCloseDay', d)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                              companyData.payrollCloseDay === d
                                ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--text)] border-[var(--border)]'
                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--warning-text)]'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Jour de paiement */}
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 tracking-wider">
                        Jour de paiement des salaires
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={companyData.payrollPaymentDay}
                          onChange={e => handleCompanyChange('payrollPaymentDay', Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                          className="w-full p-3 pr-16 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-2xl font-semibold text-[var(--success-text)]  text-center focus:ring-2 focus:ring-[var(--focus)] focus:border-transparent"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--text-muted)] uppercase">du M+1</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        Jour du mois <strong>suivant</strong> auquel les salaires doivent être versés. Tout retard au-delà déclenche une alerte.
                      </p>
                      {/* Sélecteurs rapides */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {[5, 10, 15, 20].map(d => (
                          <button key={d} type="button"
                            onClick={() => handleCompanyChange('payrollPaymentDay', d)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                              companyData.payrollPaymentDay === d
                                ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]'
                                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--success-text)]'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avertissement cohérence */}
                  {companyData.payrollCloseDay >= companyData.payrollPaymentDay && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-5 p-4 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  rounded-xl flex items-start gap-3">
                      <AlertTriangle size={18} className="text-[var(--warning-text)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--warning-text)] ">Attention — cohérence des dates</p>
                        <p className="text-xs text-[var(--warning-text)]  mt-0.5">
                          Le jour de clôture ({companyData.payrollCloseDay}) est ≥ au jour de paiement ({companyData.payrollPaymentDay}).
                          Le paiement se fait le mois <strong>suivant</strong> la clôture, donc c'est correct si vous payez en M+1.
                          Si vous payez dans le même mois, vérifiez vos valeurs.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Note légale Code du Travail */}
                  <div className="mt-5 p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      📋 Art. 95 Code du Travail Congo
                    </p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      Les salaires doivent être payés à <strong>intervalles réguliers</strong> et à <strong>date fixe convenue</strong>. Un retard de 3 mois ou plus permet à l'employé de saisir l'Inspection du Travail.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET LOCALISATION
            ══════════════════════════════════════════════ */}
            {activeTab === 'location' && (
              <motion.div key="location" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)]  p-4 rounded-2xl flex gap-3 items-start">
                  <Smartphone className="text-[var(--warning-text)] shrink-0 mt-1" size={20} />
                  <p className="text-xs text-[var(--warning-text)] ">
                    Pour la précision GPS optimale, effectuez cette manipulation <strong>depuis un smartphone au bureau</strong>.
                  </p>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
                      <Navigation size={20} className="text-[var(--success-text)]" /> Géolocalisation du Site
                    </h3>
                    <button onClick={getCurrentLocation} disabled={!!locating}
                      className="text-xs bg-[var(--brand-soft)]  text-[var(--success-text)]  px-3 py-1.5 rounded-lg border border-[var(--border)]  hover:bg-[var(--brand-soft)] font-semibold flex items-center gap-1">
                      {locating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} {locating ?? 'Ma position'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Latitude</label>
                        <input type="number" step="0.000001" value={companyData.latitude}
                          onChange={e => handleCompanyChange('latitude', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]" />
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Longitude</label>
                        <input type="number" step="0.000001" value={companyData.longitude}
                          onChange={e => handleCompanyChange('longitude', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]" />
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Rayon autorisé (mètres)</label>
                        <input type="number" value={companyData.allowedRadius}
                          onChange={e => handleCompanyChange('allowedRadius', parseFloat(e.target.value) || 0)}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-semibold text-[var(--text)]" />
                        <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                          <AlertTriangle size={12} className="text-[var(--warning-text)] shrink-0" />
                          Les employés ne pourront pointer que dans ce rayon.
                        </p>
                        {companyData.allowedRadius > 0 && companyData.allowedRadius < 30 && (
                          <p className="text-xs text-[var(--warning-text)]  mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} className="shrink-0" />
                            Rayon très serré : le GPS d'un téléphone se trompe souvent de 15 à 50 m. Conseillé : 30 m minimum
                            (ou gardez la marge GPS ci-dessous activée).
                          </p>
                        )}
                        {/* ✅ Incertitude GPS rendue explicite, comme demandé */}
                        <p className="text-xs text-[var(--warning-text)]  mt-1 flex items-center gap-1">
                          <AlertTriangle size={12} className="shrink-0" />
                          Le GPS d'un smartphone a une marge d'erreur d'environ ±10m (parfois plus en intérieur).
                          Un rayon trop petit peut refuser des employés pourtant bien sur place.
                        </p>
                      </div>
                    </div>

                    {/* ✅ Aperçu visuel interactif du cercle (mis à jour en direct) */}
                    <div className="flex flex-col items-center justify-center bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)]">
                      <GeofenceRadiusPreview
                        radius={companyData.allowedRadius}
                        siteName="Site principal"
                        userOffset={walkTestOffset}
                      />
                      {/* ✅ Bouton "tester en marchant" : n'active le GPS en
                          continu QUE pendant que ce mode est actif — pas de
                          watchPosition qui tourne en permanence sur cette page. */}
                      <button
                        type="button"
                        onClick={() => setWalkTestActive(v => !v)}
                        className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                          walkTestActive
                            ? 'bg-[var(--brand-soft)]  text-[var(--success-text)]  border-[var(--border)] '
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        {walkTestActive ? '⏹ Arrêter le test' : '🚶 Tester en marchant'}
                      </button>
                      {walkTestActive && !walkTestOffset && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Localisation en cours...</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET SITES DE POINTAGE MULTI-SITES
            ══════════════════════════════════════════════ */}
            {activeTab === 'sites' && (
              <motion.div key="sites" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                {/* Info */}
                <div className="bg-[var(--brand-soft)]  border border-[var(--border)]  p-4 rounded-2xl flex gap-3 items-start">
                  <Navigation className="text-[var(--success-text)] shrink-0 mt-1" size={20} />
                  <p className="text-xs text-[var(--success-text)] ">
                    Ajoutez tous vos sites (bureaux, chantiers, entrepôts…). Un employé pourra pointer dès qu'il est dans le rayon de <strong>l'un</strong> des sites actifs. Pas besoin de lui assigner un site spécifique.
                  </p>
                </div>

                {/* Formulaire ajout / modification */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                    <MapPin size={18} className="text-[var(--success-text)]" />
                    {editingSiteId ? 'Modifier le site' : 'Ajouter un site'}
                  </h3>

                  {siteError && (
                    <div className="mb-4 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)]  rounded-xl text-xs flex items-center gap-2">
                      <AlertTriangle size={14} /> {siteError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Nom du site *</label>
                      <input
                        type="text"
                        placeholder="Ex: Siège Brazzaville, Chantier Pointe-Noire…"
                        value={siteForm.name}
                        onChange={e => setSiteForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Latitude</label>
                        <input
                          type="number" step="0.000001"
                          value={siteForm.latitude}
                          onChange={e => setSiteForm(f => ({ ...f, latitude: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Longitude</label>
                        <input
                          type="number" step="0.000001"
                          value={siteForm.longitude}
                          onChange={e => setSiteForm(f => ({ ...f, longitude: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-mono text-[var(--text)]"
                        />
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Rayon (mètres) — min 1m</label>
                        <input
                          type="number" min="1"
                          value={siteForm.radius}
                          onChange={e => setSiteForm(f => ({ ...f, radius: Math.max(1, parseInt(e.target.value) || 1) }))}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-semibold text-[var(--text)]"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">1m = entrée précise · 50m = bureau · 500m = chantier large</p>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={getSiteCurrentLocation}
                          disabled={!!locating}
                          className="w-full p-3 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  border border-[var(--border)]  rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] transition-colors"
                        >
                          {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />} {locating ?? 'Utiliser ma position GPS'}
                        </button>
                      </div>
                    </div>

                    {/* ✅ Même aperçu visuel + test en marchant que pour le
                        site principal, branché ici sur le site en cours
                        d'édition (siteForm) plutôt que companyData. */}
                    <div className="flex flex-col items-center justify-center bg-[var(--surface-2)] rounded-2xl p-4 border border-[var(--border)]">
                      <GeofenceRadiusPreview
                        radius={siteForm.radius}
                        siteName={siteForm.name || 'Ce site'}
                        userOffset={siteWalkTestOffset}
                      />
                      <button
                        type="button"
                        onClick={() => setSiteWalkTestActive(v => !v)}
                        className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${
                          siteWalkTestActive
                            ? 'bg-[var(--brand-soft)]  text-[var(--success-text)]  border-[var(--border)] '
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        {siteWalkTestActive ? '⏹ Arrêter le test' : '🚶 Tester en marchant'}
                      </button>
                      {siteWalkTestActive && !siteWalkTestOffset && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">Localisation en cours...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={handleSaveSite}
                      className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Check size={16} /> {editingSiteId ? 'Enregistrer les modifications' : 'Ajouter ce site'}
                    </button>
                    {editingSiteId && (
                      <button
                        onClick={() => { setEditingSiteId(null); setSiteForm({ name: '', latitude: 0, longitude: 0, radius: 100 }); setSiteError(null); setSiteWalkTestActive(false); }}
                        className="px-5 py-3 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>

                {/* Liste des sites */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
                    <Navigation size={18} className="text-[var(--success-text)]" />
                    Sites configurés
                    <span className="ml-auto text-xs font-normal text-[var(--text-muted)]">{sites.filter(s => s.isActive).length} actif(s) sur {sites.length}</span>
                  </h3>

                  {sites.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                      <Navigation size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Aucun site configuré.</p>
                      <p className="text-xs mt-1">Ajoutez votre premier site ci-dessus.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sites.map(site => (
                        <div
                          key={site.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                            site.isActive
                              ? 'border-[var(--border)]  bg-[var(--brand-soft)] '
                              : 'border-[var(--border)] bg-[var(--surface-2)] opacity-60'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${site.isActive ? 'bg-[var(--brand)]' : 'bg-[var(--text-muted)]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[var(--text)] truncate">{site.name}</p>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                              {Number(site.latitude).toFixed(6)}, {Number(site.longitude).toFixed(6)} · rayon {site.radius}m
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Toggle actif/inactif */}
                            <button
                              onClick={() => handleToggleSite(site)}
                              title={site.isActive ? 'Désactiver' : 'Activer'}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                site.isActive
                                  ? 'bg-[var(--brand-soft)]  text-[var(--success-text)]  hover:bg-[var(--brand-soft)]'
                                  : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
                              }`}
                            >
                              {site.isActive ? 'Actif' : 'Inactif'}
                            </button>
                            {/* Modifier */}
                            <button
                              onClick={() => handleEditSite(site)}
                              className="p-2 rounded-lg bg-[var(--brand-soft)]  text-[var(--success-text)]  hover:bg-[var(--brand-soft)] transition-colors"
                              title="Modifier"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {/* Supprimer */}
                            <button
                              onClick={() => handleDeleteSite(site.id)}
                              className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* 🆕 Marge de précision GPS */}
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-1 flex items-center gap-2">
                    <Navigation size={18} className="text-[var(--success-text)]" /> Marge de précision GPS (mètres)
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Le GPS d'un téléphone se trompe de 10 à 50 m, surtout en intérieur ou à l'étage.
                    Avec une marge, un employé est accepté si la zone d'incertitude de son GPS touche le rayon.
                    Distance maximale acceptée = rayon + marge. 0 = strict.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { label: 'Strict', value: 0, hint: 'aucune marge' },
                      { label: 'Standard', value: 30, hint: 'conseillé' },
                      { label: 'Souple', value: 60, hint: 'GPS difficile / intérieur' },
                    ].map(p => {
                      const active = (companyData.gpsToleranceMeters ?? 0) === p.value;
                      return (
                        <button key={p.label} type="button"
                          onClick={() => handleCompanyChange('gpsToleranceMeters', p.value)}
                          className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                            active
                              ? 'bg-[var(--brand)] text-[var(--on-brand)] border-[var(--border)]'
                              : 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:border-[var(--border)]'
                          }`}>
                          {p.label} · {p.value} m
                          <span className={`block text-[10px] font-normal ${active ? 'text-[var(--on-brand)]' : 'text-[var(--text-muted)]'}`}>{p.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mb-2">
                    Si le GPS du téléphone est trop flou (précision pire que le double de la marge, soit {Math.round((companyData.gpsToleranceMeters ?? 0) * 2)} m),
                    la marge n'est pas appliquée : l'employé doit alors être dans le rayon exact ou connecté au wifi de l'entreprise (IP de confiance).
                  </p>
                  <input type="number" min={0} max={200} value={companyData.gpsToleranceMeters ?? 0}
                    onChange={e => handleCompanyChange('gpsToleranceMeters', Math.max(0, Math.min(200, parseFloat(e.target.value) || 0)))}
                    className="w-full md:w-48 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-semibold text-[var(--text)]" />
                </div>

                {/* 🆕 IP de confiance (wifi de l'entreprise) */}
                <TrustedIpsPanel companyId={companyId} />
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET HORAIRES & POINTAGE
            ══════════════════════════════════════════════ */}
            {activeTab === 'attendance' && (
              <motion.div key="attendance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-[var(--success-text)]" /> Horaires de Travail
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Heure de début</label>
                      <div className="flex items-center gap-2">
                        <input type="number" inputMode="numeric" min={0} max={23} aria-label="Heure de début"
                          value={payrollData.officialStartHour}
                          onChange={e => handlePayrollChange('officialStartHour', Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-lg font-semibold text-center text-[var(--text)]" />
                        <span className="font-semibold text-[var(--text-muted)]">h</span>
                        <input type="number" inputMode="numeric" min={0} max={59} aria-label="Minute de début"
                          value={payrollData.officialStartMinute}
                          onChange={e => handlePayrollChange('officialStartMinute', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-lg font-semibold text-center text-[var(--text)]" />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                        Ex. 8 h et 30 pour 08h30. Le rappel « avant le début » suit cette heure exacte.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Tolérance (minutes)</label>
                      <input type="number" min="0" max="120" step="5" value={payrollData.lateToleranceMinutes}
                        onChange={e => handlePayrollChange('lateToleranceMinutes', parseInt(e.target.value) || 0)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-lg font-semibold text-[var(--text)]" />
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-[var(--brand-soft)]  rounded-xl border-2 border-[var(--border)] ">
                    <p className="text-sm font-semibold text-[var(--success-text)]  mb-1">Aperçu de la règle</p>
                    <p className="text-sm text-[var(--success-text)] ">
                      En retard après <strong>{calculateLateTime()}</strong>
                      {' · '}Pointage à {calculateNextMinute()} → retard
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
                      <Users size={20} className="text-[var(--warning-text)]" /> Jours de Travail
                    </h3>
                    <button onClick={() => setPayrollData(p => ({ ...p, workDays: [1, 2, 3, 4, 5, 6, 0] }))}
                      className="text-xs bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  text-[var(--warning-text)]  px-3 py-1.5 rounded-lg border border-[var(--border)]  hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] font-semibold">
                      Tout sélectionner
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map(day => (
                      <button key={day.value} onClick={() => toggleWorkDay(day.value)}
                        className={`p-3 rounded-xl font-semibold text-sm transition-colors border-2 ${
                          payrollData.workDays.includes(day.value)
                            ? 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--text)] border-[var(--border)] shadow-lg '
                            : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border)]'
                        }`}
                      >{day.label}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Calendar size={20} className="text-[var(--success-text)]" /> Temps de Travail Mensuel
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Jours ouvrés / mois</label>
                      <input type="number" min="20" max="31" value={payrollData.workDaysPerMonth}
                        onChange={e => handlePayrollChange('workDaysPerMonth', parseInt(e.target.value) || 26)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-lg font-semibold text-[var(--text)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Heures normales / jour</label>
                      <input type="number" min="6" max="12" step="0.5" value={payrollData.workHoursPerDay}
                        onChange={e => handlePayrollChange('workHoursPerDay', parseFloat(e.target.value) || 8)}
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-lg font-semibold text-[var(--text)]" />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)]">
                      Heures mensuelles :{' '}
                      <span className="text-2xl font-semibold text-[var(--success-text)] ">
                        {(payrollData.workDaysPerMonth * payrollData.workHoursPerDay).toFixed(1)}
                      </span> h
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                ONGLET COORDONNÉES
            ══════════════════════════════════════════════ */}
            {activeTab === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <MapPin size={20} className="text-[var(--success-text)]" /> Adresse Postale
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Adresse Complète</label>
                      <input value={companyData.address} onChange={e => handleCompanyChange('address', e.target.value)}
                        placeholder="123 Avenue de la République"
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Ville</label>
                      <input value={companyData.city} onChange={e => handleCompanyChange('city', e.target.value)}
                        placeholder="Pointe-Noire"
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]" />
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6">
                  <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
                    <Phone size={20} className="text-[var(--success-text)]" /> Contacts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Téléphone</label>
                      <input value={companyData.phone} onChange={e => handleCompanyChange('phone', e.target.value)}
                        placeholder="+242 06 123 45 67"
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Email</label>
                      <input type="email" value={companyData.email} onChange={e => handleCompanyChange('email', e.target.value)}
                        placeholder="contact@entreprise.cg"
                        className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ══════════════════════════════════════════════
            SIDEBAR ACTIONS
        ══════════════════════════════════════════════ */}
        <div className="settings-policy-summary lg:col-span-1 space-y-6">
          <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-6 sticky top-6">
            <h3 className="font-semibold text-[var(--text)] mb-6 flex items-center gap-2">
              <History size={20} className="text-[var(--text-muted)]" /> Actions
            </h3>
            <button onClick={() => setShowConfirm(true)}
              className="w-full py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl shadow-lg  transition-colors flex items-center justify-center gap-2">
              <Save size={18} /> Enregistrer
            </button>

            {/* Résumé calendrier de paie dans la sidebar */}
            <div className="mt-6 p-4 bg-[var(--brand-soft)]  rounded-xl border border-[var(--border)] ">
              <p className="text-xs font-semibold text-[var(--success-text)]  uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Banknote size={12} /> Calendrier de paie
              </p>
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">
                  Clôture : <strong className="text-[var(--warning-text)] ">jour {companyData.payrollCloseDay}</strong>
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Paiement : <strong className="text-[var(--success-text)] ">jour {companyData.payrollPaymentDay} (M+1)</strong>
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-[var(--surface-2)] rounded-xl">
              <p className="text-xs text-[var(--text-muted)]">
                <strong className="text-[var(--text)]">Important :</strong> Ces paramètres affectent toute l'entreprise. Les modifications prennent effet immédiatement.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MODAL DE CONFIRMATION
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(0_0_0_/.5)]  p-4"
            onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[var(--brand-soft)]  text-[var(--success-text)] rounded-full flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[var(--text)]">Confirmer les changements</h3>
                  <p className="text-sm text-[var(--text-muted)]">Ces modifications impacteront toute l'entreprise.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex-1 py-3 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] font-semibold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors">
                  {isSaving ? <><Loader2 className="animate-spin" size={20} /> Sauvegarde...</> : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


export default function CompanySettingsPageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <CompanySettingsPage />
    </ModulePageFrame>
  );
}
