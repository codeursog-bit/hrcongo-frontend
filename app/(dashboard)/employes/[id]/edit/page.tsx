'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, User, Briefcase, Heart, Shield,
  Wallet, AlertCircle, Phone, Mail, MapPin, Calendar,
  Building2, DollarSign, Smartphone, CreditCard, BookOpen,
  Award, Hash, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { FancySelect } from '@/components/ui/FancySelect';

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const alert = useAlert();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'identity' | 'family' | 'contract' | 'payment' | 'fiscal'>('identity');

  const [departments, setDepartments] = useState<any[]>([]);
  const [companyConvention, setCompanyConvention] = useState<string | null>(null);
  const [conventionCategories, setConventionCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', dateOfBirth: '', placeOfBirth: '',
    gender: 'MALE', phone: '', email: '', address: '', city: '',
    nationalIdNumber: '', cnssNumber: '',
    maritalStatus: 'SINGLE', numberOfChildren: 0,
    hireDate: '', contractType: 'CDI', position: '', departmentId: '',
    baseSalary: '', professionalCategory: '', echelon: '',
    paymentMethod: 'CASH', bankName: '', bankAccountNumber: '',
    mobileMoneyOperator: 'MTN', mobileMoneyNumber: '',
    isSubjectToIrpp: true, isSubjectToCnss: true, taxExemptionReason: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employee, depts, company] = await Promise.all([
          api.get<any>(`/employees/${params.id}`),
          api.get<any[]>('/departments'),
          api.get<any>('/companies/mine'),
        ]);

        setDepartments(depts || []);

        if (company?.collectiveAgreement) {
          setCompanyConvention(company.collectiveAgreement);
          try {
            const cats = await api.get<any[]>(`/conventions/categories/${company.collectiveAgreement}`);
            setConventionCategories(cats || []);
          } catch {}
        }

        setFormData({
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
          placeOfBirth: employee.placeOfBirth || '',
          gender: employee.gender || 'MALE',
          phone: employee.phone || '',
          email: employee.email || '',
          address: employee.address || '',
          city: employee.city || '',
          nationalIdNumber: employee.nationalIdNumber || '',
          cnssNumber: employee.cnssNumber || '',
          maritalStatus: employee.maritalStatus || 'SINGLE',
          numberOfChildren: employee.numberOfChildren || 0,
          hireDate: employee.hireDate?.split('T')[0] || '',
          contractType: employee.contractType || 'CDI',
          position: employee.position || '',
          departmentId: employee.departmentId || '',
          baseSalary: employee.baseSalary?.toString() || '',
          professionalCategory: employee.professionalCategory || '',
          echelon: employee.echelon || '',
          paymentMethod: employee.paymentMethod || 'CASH',
          bankName: employee.bankName || '',
          bankAccountNumber: employee.bankAccountNumber || '',
          mobileMoneyOperator: employee.mobileMoneyOperator || 'MTN',
          mobileMoneyNumber: employee.mobileMoneyNumber || '',
          isSubjectToIrpp: employee.isSubjectToIrpp ?? true,
          isSubjectToCnss: employee.isSubjectToCnss ?? true,
          taxExemptionReason: employee.taxExemptionReason || '',
        });
      } catch (e) {
        console.error(e);
        alert.error('Erreur', 'Impossible de charger les données');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [params.id, alert]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (code: string) => {
    handleSelect('professionalCategory', code);
    const cat = conventionCategories.find(c => c.code === code);
    if (cat?.minSalary && (!formData.baseSalary || parseFloat(formData.baseSalary) < cat.minSalary)) {
      handleSelect('baseSalary', cat.minSalary.toString());
      alert.info('Salaire ajusté', `Minimum conventionnel : ${cat.minSalary.toLocaleString()} FCFA`);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/employees/${params.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        nationalIdNumber: formData.nationalIdNumber || null,
        cnssNumber: formData.cnssNumber || null,
        maritalStatus: formData.maritalStatus,
        numberOfChildren: parseInt(formData.numberOfChildren as any) || 0,
        hireDate: formData.hireDate,
        contractType: formData.contractType,
        position: formData.position,
        departmentId: formData.departmentId,
        baseSalary: parseFloat(formData.baseSalary),
        professionalCategory: formData.professionalCategory || null,
        echelon: formData.echelon || null,
        paymentMethod: formData.paymentMethod,
        bankName: formData.bankName || null,
        bankAccountNumber: formData.bankAccountNumber || null,
        mobileMoneyOperator: formData.mobileMoneyOperator || null,
        mobileMoneyNumber: formData.mobileMoneyNumber || null,
        isSubjectToIrpp: formData.isSubjectToIrpp,
        isSubjectToCnss: formData.isSubjectToCnss,
        taxExemptionReason: formData.taxExemptionReason || null,
      });
      alert.success('Dossier mis à jour', 'Les modifications ont été enregistrées.');
      router.push(`/employes/${params.id}`);
    } catch (e: any) {
      alert.error('Erreur', e.message || 'Impossible de sauvegarder.');
    } finally {
      setIsSaving(false);
    }
  };

  const SECTIONS = [
    { id: 'identity', label: 'Identité', icon: User, color: 'text-sky-500' },
    { id: 'family', label: 'Famille & Fiscal', icon: Heart, color: 'text-pink-500' },
    { id: 'contract', label: 'Contrat', icon: Briefcase, color: 'text-purple-500' },
    { id: 'payment', label: 'Paiement', icon: Wallet, color: 'text-emerald-500' },
    { id: 'fiscal', label: 'Fiscalité', icon: Shield, color: 'text-amber-500' },
  ];

  const inputClass = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all";
  const labelClass = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2";

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={40} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-sky-500 transition-colors">
          <ArrowLeft size={16} /> Retour au profil
        </button>
        <button onClick={handleSave} disabled={isSaving}
          className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all">
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Modifier le dossier</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Mettez à jour les informations de l'employé</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 space-y-1 sticky top-6">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}>
                <s.icon size={16} className={activeSection === s.id ? (document.documentElement.classList.contains('dark') ? 'text-gray-900' : 'text-white') : s.color} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }}>

              {/* ====== IDENTITÉ ====== */}
              {activeSection === 'identity' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <User size={20} className="text-sky-500" /> Identité & Coordonnées
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Prénom <span className="text-red-500">*</span></label><input name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Nom <span className="text-red-500">*</span></label><input name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Date de naissance</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Lieu de naissance</label><input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className={inputClass} /></div>
                    <div>
                      <FancySelect label="Genre" value={formData.gender} onChange={(v) => handleSelect('gender', v)} icon={User}
                        options={[{ value: 'MALE', label: 'Homme' }, { value: 'FEMALE', label: 'Femme' }]} />
                    </div>
                    <div><label className={labelClass}><Phone size={13} className="inline mr-1 text-sky-500" />Téléphone</label><input name="phone" value={formData.phone} onChange={handleChange} className={inputClass} /></div>
                    <div className="md:col-span-2"><label className={labelClass}><Mail size={13} className="inline mr-1 text-sky-500" />Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}><MapPin size={13} className="inline mr-1 text-sky-500" />Adresse</label><input name="address" value={formData.address} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}>Ville</label><input name="city" value={formData.city} onChange={handleChange} className={inputClass} /></div>
                    <div><label className={labelClass}><Hash size={13} className="inline mr-1" />N° CNI / Passeport <span className="text-xs text-gray-400 font-normal">(optionnel)</span></label><input name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} placeholder="ID-12345" className={inputClass + ' font-mono text-sm'} /></div>
                    <div><label className={labelClass}><Shield size={13} className="inline mr-1" />N° CNSS <span className="text-xs text-gray-400 font-normal">(optionnel)</span></label><input name="cnssNumber" value={formData.cnssNumber} onChange={handleChange} placeholder="123456789" className={inputClass + ' font-mono text-sm'} /></div>
                  </div>
                </div>
              )}

              {/* ====== FAMILLE ====== */}
              {activeSection === 'family' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Heart size={20} className="text-pink-500" /> Situation Familiale
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <FancySelect label="Situation familiale" value={formData.maritalStatus} onChange={(v) => handleSelect('maritalStatus', v)} icon={Heart}
                        options={[{ value: 'SINGLE', label: 'Célibataire' }, { value: 'MARRIED', label: 'Marié(e)' }, { value: 'DIVORCED', label: 'Divorcé(e)' }, { value: 'WIDOWED', label: 'Veuf/Veuve' }]} />
                    </div>
                    <div>
                      <label className={labelClass}>Nombre d'enfants</label>
                      <input type="number" min="0" max="20" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-sky-500 outline-none text-2xl font-bold text-center transition-all" />
                      <p className="text-xs text-gray-400 mt-1">Impacte le quotient familial (IRPP)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== CONTRAT ====== */}
              {activeSection === 'contract' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase size={20} className="text-purple-500" /> Contrat & Poste
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className={labelClass}>Intitulé du Poste <span className="text-red-500">*</span></label><input name="position" value={formData.position} onChange={handleChange} className={inputClass} /></div>
                    <div>
                      <FancySelect label="Département" value={formData.departmentId} onChange={(v) => handleSelect('departmentId', v)} icon={Building2}
                        options={departments.map(d => ({ value: d.id, label: d.name }))} />
                    </div>
                    <div><label className={labelClass}><Calendar size={13} className="inline mr-1 text-purple-500" />Date d'embauche</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className={inputClass} /></div>
                    <div>
                      <label className={labelClass}>Type de contrat</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['CDI', 'CDD', 'STAGE', 'CONSULTANT'].map(type => (
                          <button key={type} type="button" onClick={() => handleSelect('contractType', type)}
                            className={`p-3 rounded-xl border text-sm font-bold text-center transition-all ${formData.contractType === type ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-sky-300'}`}>
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}><DollarSign size={13} className="inline mr-1 text-purple-500" />Salaire de base <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange}
                          className="w-full px-4 py-4 pr-20 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:border-sky-500 outline-none font-bold text-2xl transition-all" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">FCFA</span>
                      </div>
                    </div>

                    {/* Convention collective */}
                    {companyConvention && conventionCategories.length > 0 && (
                      <div className="md:col-span-2 p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Award size={18} className="text-purple-500" />
                          <h4 className="font-bold text-purple-900 dark:text-purple-100 text-sm">
                            Convention Collective : {companyConvention}
                          </h4>
                        </div>
                        <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-2">Catégorie Professionnelle</label>
                        <select value={formData.professionalCategory} onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full p-3 bg-white dark:bg-purple-900/20 border border-purple-300 dark:border-purple-600 rounded-xl font-medium text-gray-900 dark:text-white focus:border-purple-500 outline-none transition-all">
                          <option value="">Sélectionner une catégorie...</option>
                          {conventionCategories.map(cat => (
                            <option key={cat.code} value={cat.code}>
                              {cat.label} — {cat.minSalary.toLocaleString()} FCFA min.
                            </option>
                          ))}
                        </select>
                        {formData.professionalCategory && (
                          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                            <AlertCircle size={11} /> Le salaire minimum conventionnel a été appliqué automatiquement
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ====== PAIEMENT ====== */}
              {activeSection === 'payment' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet size={20} className="text-emerald-500" /> Mode de Paiement
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone }, { value: 'BANK_TRANSFER', label: 'Virement', icon: Building2 }, { value: 'CASH', label: 'Espèces', icon: CreditCard }].map(({ value, label, icon: Icon }) => (
                      <button key={value} type="button" onClick={() => handleSelect('paymentMethod', value)}
                        className={`p-4 rounded-xl border text-center transition-all ${formData.paymentMethod === value ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300'}`}>
                        <Icon className="mx-auto mb-1.5" size={20} />
                        <div className="text-xs font-bold">{label}</div>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {formData.paymentMethod === 'BANK_TRANSFER' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <FancySelect label="Banque" value={formData.bankName} onChange={(v) => handleSelect('bankName', v)} icon={Building2}
                          options={[{ value: 'BGFI', label: 'BGFI Bank' }, { value: 'ECOBANK', label: 'Ecobank' }, { value: 'LCB', label: 'LCB Bank' }, { value: 'UBA', label: 'UBA' }]} />
                        <div><label className={labelClass}>N° de compte (RIB)</label><input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className={inputClass + ' font-mono'} /></div>
                      </motion.div>
                    )}
                    {formData.paymentMethod === 'MOBILE_MONEY' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                        <FancySelect label="Opérateur" value={formData.mobileMoneyOperator} onChange={(v) => handleSelect('mobileMoneyOperator', v)} icon={Smartphone}
                          options={[{ value: 'MTN', label: 'MTN Mobile Money' }, { value: 'AIRTEL', label: 'Airtel Money' }]} />
                        <div><label className={labelClass}>Numéro de téléphone</label><input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={handleChange} className={inputClass + ' font-mono'} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ====== FISCALITÉ ====== */}
              {activeSection === 'fiscal' && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 space-y-5">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield size={20} className="text-amber-500" /> Régime Fiscal
                  </h2>
                  <label className="flex items-start gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all group">
                    <input type="checkbox" checked={formData.isSubjectToIrpp} onChange={(e) => handleSelect('isSubjectToIrpp', e.target.checked)} className="w-6 h-6 mt-0.5 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Soumis à l'IRPP / ITS</span>
                      <p className="text-sm text-gray-500">Retenue de l'impôt sur le revenu (barème progressif)</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all group">
                    <input type="checkbox" checked={formData.isSubjectToCnss} onChange={(e) => handleSelect('isSubjectToCnss', e.target.checked)} className="w-6 h-6 mt-0.5 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">Soumis à la CNSS salariale (4%)</span>
                      <p className="text-sm text-gray-500">Cotisation sociale employé</p>
                    </div>
                  </label>
                  <AnimatePresence>
                    {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-xl">
                        <label className="block text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-2 flex items-center gap-1">
                          <AlertCircle size={12} /> Raison de l'exemption
                        </label>
                        <select value={formData.taxExemptionReason} onChange={(e) => handleSelect('taxExemptionReason', e.target.value)}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none">
                          <option value="">Sélectionner une raison...</option>
                          <option value="Stagiaire académique non rémunéré">Stagiaire académique non rémunéré</option>
                          <option value="Consultant externe - Auto-entrepreneur">Consultant externe - Auto-entrepreneur</option>
                          <option value="Expatrié sous convention fiscale">Expatrié sous convention fiscale</option>
                          <option value="Bénévolat / Mission humanitaire">Bénévolat / Mission humanitaire</option>
                          <option value="Employé en période d'essai non rémunérée">Période d'essai non rémunérée</option>
                          <option value="Autre raison légale">Autre raison légale</option>
                        </select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} disabled={isSaving}
              className="px-8 py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all">
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


