'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Loader2, AlertTriangle, User, 
  Briefcase, ShieldCheck, MapPin, Calendar, Building2,
  Wallet, Trash2, AlertOctagon, Smartphone, Heart, Users
} from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

interface Department {
  id: string;
  name: string;
}

export default function EditEmployeePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    numberOfChildren: 0,
    dateOfBirth: '',
    placeOfBirth: '',
    
    nationalIdNumber: '',
    cnssNumber: '',
    
    position: '',
    departmentId: '',
    contractType: 'CDI',
    hireDate: '',
    baseSalary: 0,

    // Paiement
    paymentMethod: 'CASH', 
    bankName: '',
    bankAccountNumber: '', 
    mobileMoneyOperator: 'MTN',
    mobileMoneyNumber: '',

    // Fiscalité
    isSubjectToIrpp: true,
    isSubjectToCnss: true,
    taxExemptionReason: '',
  });

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [emp, depts] = await Promise.all([
                api.get<any>(`/employees/${params.id}`),
                api.get<Department[]>('/departments')
            ]);

            setDepartments(depts);

            const formatDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

            setFormData({
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                phone: emp.phone,
                address: emp.address,
                gender: emp.gender,
                maritalStatus: emp.maritalStatus,
                numberOfChildren: emp.numberOfChildren || 0,
                dateOfBirth: formatDate(emp.dateOfBirth),
                placeOfBirth: emp.placeOfBirth,
                
                nationalIdNumber: emp.nationalIdNumber,
                cnssNumber: emp.cnssNumber || '',
                
                position: emp.position,
                departmentId: emp.departmentId,
                contractType: emp.contractType,
                hireDate: formatDate(emp.hireDate),
                baseSalary: emp.baseSalary,

                paymentMethod: emp.paymentMethod || 'CASH',
                bankName: emp.bankName || '',
                bankAccountNumber: emp.bankAccountNumber || '',
                mobileMoneyOperator: emp.mobileMoneyOperator || 'MTN',
                mobileMoneyNumber: emp.mobileMoneyNumber || '',

                // Fiscalité (avec valeurs par défaut si absentes)
                isSubjectToIrpp: emp.isSubjectToIrpp !== undefined ? emp.isSubjectToIrpp : true,
                isSubjectToCnss: emp.isSubjectToCnss !== undefined ? emp.isSubjectToCnss : true,
                taxExemptionReason: emp.taxExemptionReason || '',
            });
        } catch (e) {
            console.error("Failed to fetch data", e);
            alert("Impossible de charger les données de l'employé.");
            router.push('/employes');
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [params.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = {
            ...formData,
            baseSalary: Number(formData.baseSalary),
            numberOfChildren: Number(formData.numberOfChildren),
            cnssNumber: formData.cnssNumber || undefined,
            taxExemptionReason: formData.taxExemptionReason || null,
        };

        await api.put(`/employees/${params.id}`, payload);
        router.push(`/employes/${params.id}`);
    } catch (e: any) {
        console.error("Save failed", e);
        alert(e.message || "Erreur lors de la sauvegarde des modifications");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
      setIsDeleting(true);
      try {
          await api.delete(`/employees/${params.id}`);
          router.push('/employes');
      } catch (e: any) {
          alert("Erreur lors de la suppression. Vérifiez que l'employé n'a pas de bulletins de paie liés.");
      } finally {
          setIsDeleting(false);
          setShowDeleteModal(false);
      }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 pb-24">
       
       {/* En-tête */}
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400"/>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le dossier</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mise à jour des informations de {formData.firstName} {formData.lastName}</p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
            Enregistrer
          </button>
       </div>

       {/* Formulaire Grid */}
       <div className="grid grid-cols-1 gap-8">
          
          {/* SECTION 1: Identité & Contact */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User size={20} className="text-sky-500" /> Identité & Coordonnées
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Prénom</label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Nom</label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Téléphone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Adresse</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
                
                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Date de Naissance</label>
                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Lieu de Naissance</label>
                        <input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                        <FancySelect
                            label="Genre"
                            value={formData.gender}
                            onChange={(v) => handleSelectChange('gender', v)}
                            icon={User}
                            options={[
                                { value: 'MALE', label: 'Masculin' },
                                { value: 'FEMALE', label: 'Féminin' }
                            ]}
                        />
                    </div>
                    <div>
                        <FancySelect
                            label="État Civil"
                            value={formData.maritalStatus}
                            onChange={(v) => handleSelectChange('maritalStatus', v)}
                            icon={Heart}
                            options={[
                                { value: 'SINGLE', label: 'Célibataire' },
                                { value: 'MARRIED', label: 'Marié(e)' },
                                { value: 'DIVORCED', label: 'Divorcé(e)' },
                                { value: 'WIDOWED', label: 'Veuf/Veuve' }
                            ]}
                        />
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Nombre d'enfants (pour calcul IRPP)</label>
                    <input type="number" min="0" name="numberOfChildren" value={formData.numberOfChildren} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
                </div>
             </div>
          </div>

          {/* SECTION 2: Fiscalité */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-cyan-500" /> Régime Fiscal
             </h3>
             <div className="space-y-4">
                {/* IRPP Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-400 transition-all group">
                  <input 
                    type="checkbox"
                    checked={formData.isSubjectToIrpp}
                    onChange={(e) => handleSelectChange('isSubjectToIrpp', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                      Soumis à l'IRPP/ITS
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Retenue de l'impôt sur le revenu (barème progressif)
                    </p>
                  </div>
                </label>

                {/* CNSS Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cyan-400 transition-all group">
                  <input 
                    type="checkbox"
                    checked={formData.isSubjectToCnss}
                    onChange={(e) => handleSelectChange('isSubjectToCnss', e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                      Soumis à la CNSS salariale (4%)
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Cotisation sociale employé
                    </p>
                  </div>
                </label>

                {/* Raison d'exemption */}
                {(!formData.isSubjectToIrpp || !formData.isSubjectToCnss) && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2">
                      Raison de l'exemption fiscale
                    </label>
                    <select 
                      value={formData.taxExemptionReason}
                      onChange={(e) => handleSelectChange('taxExemptionReason', e.target.value)}
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                      <option value="">Sélectionner une raison...</option>
                      <option value="Stagiaire académique non rémunéré">Stagiaire académique non rémunéré</option>
                      <option value="Consultant externe - Auto-entrepreneur">Consultant externe - Auto-entrepreneur</option>
                      <option value="Expatrié sous convention fiscale">Expatrié sous convention fiscale</option>
                      <option value="Bénévolat / Mission humanitaire">Bénévolat / Mission humanitaire</option>
                      <option value="Employé en période d'essai non rémunérée">Période d'essai non rémunérée</option>
                      <option value="Autre raison légale">Autre raison légale</option>
                    </select>
                  </div>
                )}
             </div>
          </div>

          {/* SECTION 3: Professionnel */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Briefcase size={20} className="text-purple-500" /> Contrat & Poste
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <FancySelect
                        label="Département"
                        value={formData.departmentId}
                        onChange={(v) => handleSelectChange('departmentId', v)}
                        icon={Building2}
                        options={departments.map(d => ({ value: d.id, label: d.name }))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Intitulé du Poste</label>
                    <input name="position" value={formData.position} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"/>
                </div>
                <div>
                    <FancySelect
                        label="Type de Contrat"
                        value={formData.contractType}
                        onChange={(v) => handleSelectChange('contractType', v)}
                        icon={Briefcase}
                        options={[
                            { value: 'CDI', label: 'CDI' },
                            { value: 'CDD', label: 'CDD' },
                            { value: 'STAGE', label: 'Stage' },
                            { value: 'CONSULTANT', label: 'Consultant' }
                        ]}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Date d'embauche</label>
                    <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Salaire de Base Mensuel</label>
                    <div className="relative">
                        <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"/>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">FCFA</span>
                    </div>
                </div>
             </div>
          </div>

          {/* SECTION 4: Paiement */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Wallet size={20} className="text-orange-500" /> Préférences de Paiement
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Moyen de paiement principal</label>
                    <div className="grid grid-cols-3 gap-3">
                        <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'MOBILE_MONEY'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Mobile Money</button>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'BANK_TRANSFER'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Virement Bancaire</button>
                        <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'CASH'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'CASH' ? 'border-gray-500 bg-gray-100 text-gray-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Espèces</button>
                    </div>
                </div>

                {formData.paymentMethod === 'MOBILE_MONEY' && (
                    <>
                        <div>
                            <FancySelect
                                label="Opérateur"
                                value={formData.mobileMoneyOperator}
                                onChange={(v) => handleSelectChange('mobileMoneyOperator', v)}
                                icon={Smartphone}
                                options={[
                                    { value: 'MTN', label: 'MTN Mobile Money' },
                                    { value: 'AIRTEL', label: 'Airtel Money' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro Mobile Money</label>
                            <input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"/>
                        </div>
                    </>
                )}

                {formData.paymentMethod === 'BANK_TRANSFER' && (
                    <>
                        <div>
                            <FancySelect
                                label="Nom de la Banque"
                                value={formData.bankName}
                                onChange={(v) => handleSelectChange('bankName', v)}
                                icon={Building2}
                                options={[
                                    { value: 'BGFI', label: 'BGFI Bank' },
                                    { value: 'ECOBANK', label: 'Ecobank' },
                                    { value: 'LCB', label: 'LCB Bank' },
                                    { value: 'UBA', label: 'UBA' },
                                    { value: 'SOCIETE_GENERALE', label: 'Société Générale' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">RIB / Compte</label>
                            <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none font-mono"/>
                        </div>
                    </>
                )}
             </div>
          </div>

          {/* SECTION 5: Administratif */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" /> Administratif & Légal
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro CNI (Identité)</label>
                    <input name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"/>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro CNSS</label>
                    <input name="cnssNumber" value={formData.cnssNumber} onChange={handleChange} placeholder="Non immatriculé" className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"/>
                </div>
             </div>
          </div>

          {/* SECTION DANGER ZONE */}
          <div className="bg-red-50 dark:bg-red-900/10 p-6 md:p-8 rounded-2xl border border-red-100 dark:border-red-900/30">
             <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <AlertOctagon size={20} /> Zone de Danger
             </h3>
             <p className="text-sm text-red-500 dark:text-red-300 mb-6">
                La suppression d'un employé est irréversible. Toutes les données associées (bulletins, congés, pointages) seront archivées ou supprimées selon la politique de rétention.
             </p>
             <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl border border-red-200 transition-colors flex items-center gap-2"
             >
                <Trash2 size={18} /> Supprimer cet employé
             </button>
          </div>

       </div>

       {/* DELETE CONFIRMATION MODAL */}
       {showDeleteModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
                   <div className="flex flex-col items-center text-center">
                       <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                           <AlertTriangle size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Êtes-vous sûr ?</h3>
                       <p className="text-gray-500 dark:text-gray-400 mb-6">
                           Vous êtes sur le point de supprimer <strong>{formData.firstName} {formData.lastName}</strong>. Cette action est irréversible.
                       </p>
                       <div className="flex gap-3 w-full">
                           <button 
                               onClick={() => setShowDeleteModal(false)}
                               className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                           >
                               Annuler
                           </button>
                           <button 
                               onClick={handleDelete}
                               disabled={isDeleting}
                               className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                           >
                               {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                               Confirmer
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}



// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Save, Loader2, AlertTriangle, User, 
//   Briefcase, ShieldCheck, MapPin, Calendar, Building2,
//   Wallet, Trash2, AlertOctagon, Smartphone, Heart, Users
// } from 'lucide-react';
// import { api } from '@/services/api';
// import { FancySelect } from '@/components/ui/FancySelect';

// interface Department {
//   id: string;
//   name: string;
// }

// export default function EditEmployeePage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [departments, setDepartments] = useState<Department[]>([]);
  
//   // État initial vide, sera rempli par l'API
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     address: '',
//     gender: 'MALE',
//     maritalStatus: 'SINGLE',
//     dateOfBirth: '',
//     placeOfBirth: '',
    
//     nationalIdNumber: '',
//     cnssNumber: '',
    
//     position: '',
//     departmentId: '',
//     contractType: 'CDI',
//     hireDate: '',
//     baseSalary: 0,

//     // Paiement
//     paymentMethod: 'CASH', 
//     bankName: '',
//     bankAccountNumber: '', 
//     mobileMoneyOperator: 'MTN', // Renommé pour BDD
//     mobileMoneyNumber: '',
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//         try {
//             // Chargement parallèle de l'employé et des départements
//             const [emp, depts] = await Promise.all([
//                 api.get<any>(`/employees/${params.id}`),
//                 api.get<Department[]>('/departments')
//             ]);

//             setDepartments(depts);

//             // Formatage des dates pour les inputs HTML (YYYY-MM-DD)
//             const formatDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';

//             setFormData({
//                 firstName: emp.firstName,
//                 lastName: emp.lastName,
//                 email: emp.email,
//                 phone: emp.phone,
//                 address: emp.address,
//                 gender: emp.gender,
//                 maritalStatus: emp.maritalStatus,
//                 dateOfBirth: formatDate(emp.dateOfBirth),
//                 placeOfBirth: emp.placeOfBirth,
                
//                 nationalIdNumber: emp.nationalIdNumber,
//                 cnssNumber: emp.cnssNumber || '',
                
//                 position: emp.position,
//                 departmentId: emp.departmentId,
//                 contractType: emp.contractType,
//                 hireDate: formatDate(emp.hireDate),
//                 baseSalary: emp.baseSalary,

//                 paymentMethod: emp.paymentMethod || 'CASH',
//                 bankName: emp.bankName || '',
//                 bankAccountNumber: emp.bankAccountNumber || '',
//                 mobileMoneyOperator: emp.mobileMoneyOperator || 'MTN', // Mapping API
//                 mobileMoneyNumber: emp.mobileMoneyNumber || ''
//             });
//         } catch (e) {
//             console.error("Failed to fetch data", e);
//             alert("Impossible de charger les données de l'employé.");
//             router.push('/employes');
//         } finally {
//             setIsLoading(false);
//         }
//     };
//     fetchData();
//   }, [params.id, router]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSelectChange = (name: string, value: string) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//  const handleSave = async () => {
//   setIsSaving(true);
//   try {
//       // Conversion des types avant envoi
//       const payload = {
//           ...formData,
//           baseSalary: Number(formData.baseSalary),
//           cnssNumber: formData.cnssNumber || undefined 
//       };

//       // ✅ CORRECTION : Utilise PUT au lieu de PATCH
//       await api.put(`/employees/${params.id}`, payload);
      
//       // Redirection vers le profil
//       router.push(`/employes/${params.id}`);
//   } catch (e: any) {
//       console.error("Save failed", e);
//       alert(e.message || "Erreur lors de la sauvegarde des modifications");
//   } finally {
//       setIsSaving(false);
//   }
// }

//   const handleDelete = async () => {
//       setIsDeleting(true);
//       try {
//           await api.delete(`/employees/${params.id}`);
//           router.push('/employes');
//       } catch (e: any) {
//           alert("Erreur lors de la suppression. Vérifiez que l'employé n'a pas de bulletins de paie liés.");
//       } finally {
//           setIsDeleting(false);
//           setShowDeleteModal(false);
//       }
//   };

//   if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;

//   return (
//     <div className="max-w-4xl mx-auto py-8 space-y-8 pb-24">
       
//        {/* En-tête */}
//        <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//                 <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400"/>
//             </button>
//             <div>
//                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le dossier</h1>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">Mise à jour des informations de {formData.firstName} {formData.lastName}</p>
//             </div>
//           </div>
//           <button 
//             onClick={handleSave} 
//             disabled={isSaving} 
//             className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
//           >
//             {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} 
//             Enregistrer
//           </button>
//        </div>

//        {/* Formulaire Grid */}
//        <div className="grid grid-cols-1 gap-8">
          
//           {/* SECTION 1: Identité & Contact */}
//           <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
//              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                 <User size={20} className="text-sky-500" /> Identité & Coordonnées
//              </h3>
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Prénom</label>
//                     <input name="firstName" value={formData.firstName} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Nom</label>
//                     <input name="lastName" value={formData.lastName} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Email</label>
//                     <input name="email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Téléphone</label>
//                     <input name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                 </div>
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Adresse</label>
//                     <input name="address" value={formData.address} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-4 md:col-span-2">
//                     <div>
//                         <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Date de Naissance</label>
//                         <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                     </div>
//                     <div>
//                         <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Lieu de Naissance</label>
//                         <input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20"/>
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 md:col-span-2">
//                     <div>
//                         <FancySelect
//                             label="Genre"
//                             value={formData.gender}
//                             onChange={(v) => handleSelectChange('gender', v)}
//                             icon={User}
//                             options={[
//                                 { value: 'MALE', label: 'Masculin' },
//                                 { value: 'FEMALE', label: 'Féminin' }
//                             ]}
//                         />
//                     </div>
//                     <div>
//                         <FancySelect
//                             label="État Civil"
//                             value={formData.maritalStatus}
//                             onChange={(v) => handleSelectChange('maritalStatus', v)}
//                             icon={Heart}
//                             options={[
//                                 { value: 'SINGLE', label: 'Célibataire' },
//                                 { value: 'MARRIED', label: 'Marié(e)' },
//                                 { value: 'DIVORCED', label: 'Divorcé(e)' },
//                                 { value: 'WIDOWED', label: 'Veuf/Veuve' }
//                             ]}
//                         />
//                     </div>
//                 </div>
//              </div>
//           </div>

//           {/* SECTION 2: Professionnel */}
//           <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
//              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                 <Briefcase size={20} className="text-purple-500" /> Contrat & Poste
//              </h3>
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                     <FancySelect
//                         label="Département"
//                         value={formData.departmentId}
//                         onChange={(v) => handleSelectChange('departmentId', v)}
//                         icon={Building2}
//                         options={departments.map(d => ({ value: d.id, label: d.name }))}
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Intitulé du Poste</label>
//                     <input name="position" value={formData.position} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"/>
//                 </div>
//                 <div>
//                     <FancySelect
//                         label="Type de Contrat"
//                         value={formData.contractType}
//                         onChange={(v) => handleSelectChange('contractType', v)}
//                         icon={Briefcase}
//                         options={[
//                             { value: 'CDI', label: 'CDI' },
//                             { value: 'CDD', label: 'CDD' },
//                             { value: 'STAGE', label: 'Stage' },
//                             { value: 'CONSULTANT', label: 'Consultant' }
//                         ]}
//                     />
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Date d'embauche</label>
//                     <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20"/>
//                 </div>
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Salaire de Base Mensuel</label>
//                     <div className="relative">
//                         <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"/>
//                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">FCFA</span>
//                     </div>
//                 </div>
//              </div>
//           </div>

//           {/* SECTION 3: Paiement */}
//           <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
//              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                 <Wallet size={20} className="text-orange-500" /> Préférences de Paiement
//              </h3>
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="md:col-span-2">
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Moyen de paiement principal</label>
//                     <div className="grid grid-cols-3 gap-3">
//                         <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'MOBILE_MONEY'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'MOBILE_MONEY' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Mobile Money</button>
//                         <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'BANK_TRANSFER'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'BANK_TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Virement Bancaire</button>
//                         <button type="button" onClick={() => setFormData(prev => ({...prev, paymentMethod: 'CASH'}))} className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${formData.paymentMethod === 'CASH' ? 'border-gray-500 bg-gray-100 text-gray-700' : 'border-gray-200 dark:border-gray-700 dark:text-gray-300'}`}>Espèces</button>
//                     </div>
//                 </div>

//                 {formData.paymentMethod === 'MOBILE_MONEY' && (
//                     <>
//                         <div>
//                             <FancySelect
//                                 label="Opérateur"
//                                 value={formData.mobileMoneyOperator}
//                                 onChange={(v) => handleSelectChange('mobileMoneyOperator', v)}
//                                 icon={Smartphone}
//                                 options={[
//                                     { value: 'MTN', label: 'MTN Mobile Money' },
//                                     { value: 'AIRTEL', label: 'Airtel Money' }
//                                 ]}
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro Mobile Money</label>
//                             <input name="mobileMoneyNumber" value={formData.mobileMoneyNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none"/>
//                         </div>
//                     </>
//                 )}

//                 {formData.paymentMethod === 'BANK_TRANSFER' && (
//                     <>
//                         <div>
//                             <FancySelect
//                                 label="Nom de la Banque"
//                                 value={formData.bankName}
//                                 onChange={(v) => handleSelectChange('bankName', v)}
//                                 icon={Building2}
//                                 options={[
//                                     { value: 'BGFI', label: 'BGFI Bank' },
//                                     { value: 'ECOBANK', label: 'Ecobank' },
//                                     { value: 'LCB', label: 'LCB Bank' },
//                                     { value: 'UBA', label: 'UBA' },
//                                     { value: 'SOCIETE_GENERALE', label: 'Société Générale' }
//                                 ]}
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">RIB / Compte</label>
//                             <input name="bankAccountNumber" value={formData.bankAccountNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none font-mono"/>
//                         </div>
//                     </>
//                 )}
//              </div>
//           </div>

//           {/* SECTION 4: Administratif */}
//           <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
//              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//                 <ShieldCheck size={20} className="text-emerald-500" /> Administratif & Légal
//              </h3>
//              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro CNI (Identité)</label>
//                     <input name="nationalIdNumber" value={formData.nationalIdNumber} onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"/>
//                 </div>
//                 <div>
//                     <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Numéro CNSS</label>
//                     <input name="cnssNumber" value={formData.cnssNumber} onChange={handleChange} placeholder="Non immatriculé" className="w-full p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"/>
//                 </div>
//              </div>
//           </div>

//           {/* SECTION DANGER ZONE */}
//           <div className="bg-red-50 dark:bg-red-900/10 p-6 md:p-8 rounded-2xl border border-red-100 dark:border-red-900/30">
//              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
//                 <AlertOctagon size={20} /> Zone de Danger
//              </h3>
//              <p className="text-sm text-red-500 dark:text-red-300 mb-6">
//                 La suppression d'un employé est irréversible. Toutes les données associées (bulletins, congés, pointages) seront archivées ou supprimées selon la politique de rétention.
//              </p>
//              <button 
//                 onClick={() => setShowDeleteModal(true)}
//                 className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl border border-red-200 transition-colors flex items-center gap-2"
//              >
//                 <Trash2 size={18} /> Supprimer cet employé
//              </button>
//           </div>

//        </div>

//        {/* DELETE CONFIRMATION MODAL */}
//        {showDeleteModal && (
//            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700">
//                    <div className="flex flex-col items-center text-center">
//                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
//                            <AlertTriangle size={32} />
//                        </div>
//                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Êtes-vous sûr ?</h3>
//                        <p className="text-gray-500 dark:text-gray-400 mb-6">
//                            Vous êtes sur le point de supprimer <strong>{formData.firstName} {formData.lastName}</strong>. Cette action est irréversible.
//                        </p>
//                        <div className="flex gap-3 w-full">
//                            <button 
//                                onClick={() => setShowDeleteModal(false)}
//                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//                            >
//                                Annuler
//                            </button>
//                            <button 
//                                onClick={handleDelete}
//                                disabled={isDeleting}
//                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
//                            >
//                                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
//                                Confirmer
//                            </button>
//                        </div>
//                    </div>
//                </div>
//            </div>
//        )}
//     </div>
//   );
// }
