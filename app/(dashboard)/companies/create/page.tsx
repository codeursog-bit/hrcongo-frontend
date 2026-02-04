'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, MapPin, Phone, Mail, Briefcase, Save, ArrowLeft,
  Loader2, AlertCircle, ShieldCheck, Check, Landmark, Lock
} from 'lucide-react';
import { api } from '@/services/api';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    // Identification
    legalName: '',
    tradeName: '',
    rccmNumber: '',
    cnssNumber: '',
    taxNumber: '',
    
    // Localisation
    address: '',
    city: '',
    phone: '',
    email: '',
    
    // Activité
    industry: '',
    
    // Configuration Fiscale
    appliesCnssEmployer: true,
    cnssEmployerRate: 16,
    defaultAppliesIrpp: true,
    defaultAppliesCnss: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Validation
    if (!formData.legalName.trim()) {
      setErrorMsg('Le nom de l\'entreprise est requis');
      setIsLoading(false);
      return;
    }

    if (!formData.address.trim() || !formData.city.trim()) {
      setErrorMsg('L\'adresse et la ville sont requises');
      setIsLoading(false);
      return;
    }

    if (!formData.phone.trim() || !formData.email.trim()) {
      setErrorMsg('Les coordonnées sont requises');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/companies', {
        legalName: formData.legalName,
        tradeName: formData.tradeName || undefined,
        rccmNumber: formData.rccmNumber || 'EN-COURS',
        cnssNumber: formData.cnssNumber || undefined,
        taxNumber: formData.taxNumber || undefined,
        address: formData.address,
        city: formData.city,
        country: 'CG',
        phone: formData.phone,
        email: formData.email,
        industry: formData.industry || 'Autre',
        
        // Configuration Fiscale
        appliesCnssEmployer: formData.appliesCnssEmployer,
        cnssEmployerRate: formData.appliesCnssEmployer ? Number(formData.cnssEmployerRate) : 0,
        defaultAppliesIrpp: formData.defaultAppliesIrpp,
        defaultAppliesCnss: formData.defaultAppliesCnss,
      });

      router.push('/dashboard');
    } catch (err: any) {
      console.error("Company creation error", err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la création de l'entreprise.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400"/>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer une entreprise</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Configurez votre structure RH</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: Identification */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-sky-500" /> Identification de l'entreprise
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Nom Légal de l'Entreprise *
                </label>
                <input 
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  required
                  placeholder="Ex: SARL INNOVATION TECH CONGO"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Nom Commercial (optionnel)
                </label>
                <input 
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="Ex: InnoTech"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Secteur d'Activité *
                </label>
                <input 
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Technologie, Commerce, Finance..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  N° RCCM (optionnel)
                </label>
                <input 
                  name="rccmNumber"
                  value={formData.rccmNumber}
                  onChange={handleChange}
                  placeholder="Ex: CG-BZV-01-2024-B12-00123"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  N° CNSS (optionnel)
                </label>
                <input 
                  name="cnssNumber"
                  value={formData.cnssNumber}
                  onChange={handleChange}
                  placeholder="Ex: 123456789"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  N° Fiscal - NIU (optionnel)
                </label>
                <input 
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder="Ex: M092500001234"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Localisation & Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <MapPin size={20} className="text-emerald-500" /> Localisation & Contact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Adresse Complète *
                </label>
                <input 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 123 Avenue de l'Indépendance"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Ville *
                </label>
                <input 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Brazzaville, Pointe-Noire..."
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Téléphone *
                </label>
                <input 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Ex: +242 06 123 45 67"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                  Email de Contact *
                </label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Ex: contact@entreprise.cg"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Configuration Fiscale */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck size={20} className="text-amber-500" /> Configuration Fiscale
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Définissez le régime fiscal de votre entreprise et les paramètres par défaut pour vos employés
            </p>
            
            <div className="space-y-5">
              {/* CNSS PATRONALE */}
              <label className="flex items-start gap-4 cursor-pointer p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all group">
                <input 
                  type="checkbox"
                  checked={formData.appliesCnssEmployer}
                  onChange={(e) => handleCheckboxChange('appliesCnssEmployer', e.target.checked)}
                  className="w-6 h-6 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-base font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    L'entreprise paie la CNSS patronale
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cochez si votre entreprise est immatriculée à la CNSS et doit payer les charges patronales (taux standard : 16%)
                  </p>
                </div>
              </label>

              {/* TAUX PERSONNALISÉ */}
              {formData.appliesCnssEmployer && (
                <div className="ml-10 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    Taux CNSS Patronale (%)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number"
                      name="cnssEmployerRate"
                      min="0"
                      max="50"
                      step="0.5"
                      value={formData.cnssEmployerRate}
                      onChange={handleChange}
                      className="w-32 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                    <span className="text-2xl font-bold text-gray-400">%</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Taux légal standard : <strong className="text-sky-600">16%</strong></p>
                  </div>
                </div>
              )}

              {/* SÉPARATEUR */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Configuration par défaut pour les employés
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Ces valeurs seront appliquées automatiquement lors de la création de nouveaux employés. Vous pourrez toujours les ajuster individuellement.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PAR DÉFAUT IRPP */}
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                    <input 
                      type="checkbox"
                      checked={formData.defaultAppliesIrpp}
                      onChange={(e) => handleCheckboxChange('defaultAppliesIrpp', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                        Soumis à l'IRPP/ITS
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Impôt sur le revenu</p>
                    </div>
                  </label>

                  {/* PAR DÉFAUT CNSS */}
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                    <input 
                      type="checkbox"
                      checked={formData.defaultAppliesCnss}
                      onChange={(e) => handleCheckboxChange('defaultAppliesCnss', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-0 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
                        Soumis à la CNSS salariale (4%)
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cotisation sociale employé</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* INFO */}
              <div className="p-4 bg-sky-50 dark:bg-sky-900/10 border border-sky-200 dark:border-sky-800 rounded-xl">
                <p className="text-sm text-sky-900 dark:text-sky-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <strong>Important :</strong> Ces paramètres peuvent être modifiés ultérieurement dans les paramètres de l'entreprise
                </p>
              </div>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Créer l'entreprise
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
}// 'use client';

// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   Building2, MapPin, Phone, Mail, Briefcase, Save, ArrowLeft,
//   Loader2, AlertCircle, ShieldCheck, Check, Landmark, Lock
// } from 'lucide-react';
// import { api } from '@/services/api';

// export default function CreateCompanyPage() {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState('');

//   const [formData, setFormData] = useState({
//     // Identification
//     legalName: '',
//     tradeName: '',
//     rccmNumber: '',
//     cnssNumber: '',
//     taxNumber: '',
    
//     // Localisation
//     address: '',
//     city: '',
//     phone: '',
//     email: '',
    
//     // Activité
//     industry: '',
    
//     // 🆕 Configuration Fiscale
//     appliesCnssEmployer: true,
//     cnssEmployerRate: 16,
//     defaultAppliesIrpp: true,
//     defaultAppliesCnss: true,
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleCheckboxChange = (name: string, checked: boolean) => {
//     setFormData(prev => ({ ...prev, [name]: checked }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorMsg('');

//     // Validation
//     if (!formData.legalName.trim()) {
//       setErrorMsg('Le nom de l\'entreprise est requis');
//       setIsLoading(false);
//       return;
//     }

//     if (!formData.address.trim() || !formData.city.trim()) {
//       setErrorMsg('L\'adresse et la ville sont requises');
//       setIsLoading(false);
//       return;
//     }

//     if (!formData.phone.trim() || !formData.email.trim()) {
//       setErrorMsg('Les coordonnées sont requises');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       await api.post('/companies', {
//         legalName: formData.legalName,
//         tradeName: formData.tradeName || undefined,
//         rccmNumber: formData.rccmNumber || 'EN-COURS',
//         cnssNumber: formData.cnssNumber || undefined,
//         taxNumber: formData.taxNumber || undefined,
//         address: formData.address,
//         city: formData.city,
//         country: 'CG',
//         phone: formData.phone,
//         email: formData.email,
//         industry: formData.industry || 'Autre',
        
//         // 🆕 Configuration Fiscale
//         appliesCnssEmployer: formData.appliesCnssEmployer,
//         cnssEmployerRate: formData.appliesCnssEmployer ? Number(formData.cnssEmployerRate) : 0,
//         defaultAppliesIrpp: formData.defaultAppliesIrpp,
//         defaultAppliesCnss: formData.defaultAppliesCnss,
//       });

//       router.push('/dashboard');
//     } catch (err: any) {
//       console.error("Company creation error", err);
//       setErrorMsg(err.message || "Une erreur est survenue lors de la création de l'entreprise.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
//       <div className="max-w-4xl mx-auto">
        
//         {/* Header */}
//         <div className="flex items-center gap-4 mb-8">
//           <button 
//             onClick={() => router.back()} 
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400"/>
//           </button>
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer une entreprise</h1>
//             <p className="text-gray-500 dark:text-gray-400 text-sm">Configurez votre structure RH</p>
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-8">
          
//           {/* SECTION 1: Identification */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <Building2 size={20} className="text-sky-500" /> Identification de l'entreprise
//             </h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Nom Légal de l'Entreprise *
//                 </label>
//                 <input 
//                   name="legalName"
//                   value={formData.legalName}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: SARL INNOVATION TECH CONGO"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Nom Commercial (optionnel)
//                 </label>
//                 <input 
//                   name="tradeName"
//                   value={formData.tradeName}
//                   onChange={handleChange}
//                   placeholder="Ex: InnoTech"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Secteur d'Activité *
//                 </label>
//                 <input 
//                   name="industry"
//                   value={formData.industry}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: Technologie, Commerce, Finance..."
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° RCCM (optionnel)
//                 </label>
//                 <input 
//                   name="rccmNumber"
//                   value={formData.rccmNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: CG-BZV-01-2024-B12-00123"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° CNSS (optionnel)
//                 </label>
//                 <input 
//                   name="cnssNumber"
//                   value={formData.cnssNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: 123456789"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   N° Fiscal - NIU (optionnel)
//                 </label>
//                 <input 
//                   name="taxNumber"
//                   value={formData.taxNumber}
//                   onChange={handleChange}
//                   placeholder="Ex: M092500001234"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 font-mono text-gray-900 dark:text-white"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* SECTION 2: Localisation & Contact */}
//           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
//               <MapPin size={20} className="text-emerald-500" /> Localisation & Contact
//             </h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Adresse Complète *
//                 </label>
//                 <input 
//                   name="address"
//                   value={formData.address}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: 123 Avenue de l'Indépendance"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Ville *
//                 </label>
//                 <input 
//                   name="city"
//                   value={formData.city}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: Brazzaville, Pointe-Noire..."
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Téléphone *
//                 </label>
//                 <input 
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: +242 06 123 45 67"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div className="md:col-span-2">
//                 <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
//                   Email de Contact *
//                 </label>
//                 <input 
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                   placeholder="Ex: contact@entreprise.cg"
//                   className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900 dark:text-white"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* 🆕 SECTION 3: Configuration Fiscale */}
//           <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6 md:p-8">
//             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
//               <ShieldCheck size={20} className="text-purple-500" /> Configuration Fiscale
//             </h3>
//             <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
//               Définissez le régime fiscal de votre entreprise et les paramètres par défaut pour vos employés
//             </p>
            
//             <div className="space-y-5">
//               {/* CNSS PATRONALE */}
//               <label className="flex items-start gap-4 cursor-pointer p-5 bg-white dark:bg-gray-900/50 rounded-xl border-2 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
//                 <input 
//                   type="checkbox"
//                   checked={formData.appliesCnssEmployer}
//                   onChange={(e) => handleCheckboxChange('appliesCnssEmployer', e.target.checked)}
//                   className="w-6 h-6 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
//                 />
//                 <div className="flex-1">
//                   <span className="text-base font-bold text-gray-900 dark:text-white block mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
//                     L'entreprise paie la CNSS patronale
//                   </span>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Cochez si votre entreprise est immatriculée à la CNSS et doit payer les charges patronales (taux standard : 16%)
//                   </p>
//                 </div>
//               </label>

//               {/* TAUX PERSONNALISÉ */}
//               {formData.appliesCnssEmployer && (
//                 <div className="ml-10 p-4 bg-white dark:bg-gray-900/50 border border-purple-200 dark:border-purple-700 rounded-lg">
//                   <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
//                     Taux CNSS Patronale (%)
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <input 
//                       type="number"
//                       name="cnssEmployerRate"
//                       min="0"
//                       max="50"
//                       step="0.5"
//                       value={formData.cnssEmployerRate}
//                       onChange={handleChange}
//                       className="w-32 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     />
//                     <span className="text-2xl font-bold text-gray-400">%</span>
//                     <p className="text-xs text-gray-500 dark:text-gray-400">Taux légal standard : <strong className="text-purple-600">16%</strong></p>
//                   </div>
//                 </div>
//               )}

//               {/* SÉPARATEUR */}
//               <div className="border-t border-purple-200 dark:border-purple-700 pt-5">
//                 <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
//                   Configuration par défaut pour les employés
//                 </h4>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
//                   Ces valeurs seront appliquées automatiquement lors de la création de nouveaux employés. Vous pourrez toujours les ajuster individuellement.
//                 </p>
                
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {/* PAR DÉFAUT IRPP */}
//                   <label className="flex items-start gap-3 cursor-pointer p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
//                     <input 
//                       type="checkbox"
//                       checked={formData.defaultAppliesIrpp}
//                       onChange={(e) => handleCheckboxChange('defaultAppliesIrpp', e.target.checked)}
//                       className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
//                     />
//                     <div>
//                       <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                         Soumis à l'IRPP/ITS
//                       </span>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">Impôt sur le revenu</p>
//                     </div>
//                   </label>

//                   {/* PAR DÉFAUT CNSS */}
//                   <label className="flex items-start gap-3 cursor-pointer p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all">
//                     <input 
//                       type="checkbox"
//                       checked={formData.defaultAppliesCnss}
//                       onChange={(e) => handleCheckboxChange('defaultAppliesCnss', e.target.checked)}
//                       className="w-5 h-5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 mt-0.5"
//                     />
//                     <div>
//                       <span className="text-sm font-bold text-gray-900 dark:text-white block mb-1">
//                         Soumis à la CNSS salariale (4%)
//                       </span>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">Cotisation sociale employé</p>
//                     </div>
//                   </label>
//                 </div>
//               </div>

//               {/* INFO */}
//               <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
//                 <p className="text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
//                   <AlertCircle size={16} />
//                   <strong>Important :</strong> Ces paramètres peuvent être modifiés ultérieurement dans les paramètres de l'entreprise
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* ERROR MESSAGE */}
//           {errorMsg && (
//             <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
//               <AlertCircle size={18} /> {errorMsg}
//             </div>
//           )}

//           {/* SUBMIT BUTTON */}
//           <div className="flex gap-4">
//             <button
//               type="button"
//               onClick={() => router.back()}
//               className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//             >
//               Annuler
//             </button>
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="flex-1 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="animate-spin" size={20} />
//                   Création en cours...
//                 </>
//               ) : (
//                 <>
//                   <Save size={20} />
//                   Créer l'entreprise
//                 </>
//               )}
//             </button>
//           </div>
//         </form>

//       </div>
//     </div>
//   );
// }