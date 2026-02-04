'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Save, Loader2, Building2, Upload, X, Calendar, ImageIcon, Eye, EyeOff } from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import Image from 'next/image';

interface Department {
  id: string;
  name: string;
}

interface JobData {
  title: string;
  departmentId: string;
  location: string;
  type: string;
  description: string;
  requirements?: string;
  imageUrl?: string;
  expirationDate?: string;
  status: string;
  isExpired: boolean;
}

interface FormData {
  title: string;
  departmentId: string;
  location: string;
  contractType: string;
  salaryRange: string;
  description: string;
  requirements: string;
  expirationDate: string;
  status: string;
}

export default function EditJobOfferPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    departmentId: '',
    location: 'Brazzaville, Siège',
    contractType: 'CDI',
    salaryRange: '',
    description: '',
    requirements: '',
    expirationDate: '',
    status: 'PUBLISHED'
  });

  useEffect(() => {
    const init = async () => {
      try {
        const [jobData, deptData] = await Promise.all([
          api.get(`/recruitment/jobs/${params.id}`),
          api.get('/departments')
        ]);
        
        setDepartments(deptData as Department[]);
        
        const job = jobData as JobData;
        
        if (job.imageUrl) {
          setExistingImageUrl(job.imageUrl);
          setImagePreview(job.imageUrl);
        }
        
        let formattedDate = '';
        if (job.expirationDate) {
          const date = new Date(job.expirationDate);
          formattedDate = date.toISOString().split('T')[0];
        }
        
        setFormData({
          title: job.title,
          departmentId: job.departmentId,
          location: job.location,
          contractType: job.type,
          salaryRange: '',
          description: job.description,
          requirements: job.requirements || '',
          expirationDate: formattedDate,
          status: job.status
        });
      } catch (e) {
        console.error(e);
        alert("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [params.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image trop volumineuse (max 2MB)');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format non supporté (JPG, PNG, WEBP uniquement)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setExistingImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('departmentId', formData.departmentId);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('contractType', formData.contractType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('requirements', formData.requirements || '');
      formDataToSend.append('status', formData.status); // ✅ Envoyer le statut
      
      if (formData.expirationDate) {
        const isoDate = new Date(formData.expirationDate).toISOString();
        formDataToSend.append('expirationDate', isoDate);
      }
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (!existingImageUrl && !imagePreview) {
        formDataToSend.append('removeImage', 'true');
      }
      
      await api.putFormData(`/recruitment/jobs/${params.id}`, formDataToSend);
      
      alert("Offre mise à jour avec succès !");
      router.push('/recrutement');
    } catch (e) {
      console.error("Erreur détaillée:", e);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={32}/>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-6 relative">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'offre d'emploi</h1>
          <p className="text-sm text-gray-500">Mettez à jour les informations du poste.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
        
        {/* ✅ NOUVEAU : STATUT DE L'OFFRE */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Statut de l'offre</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formData.status === 'PUBLISHED' ? 'Visible par les candidats' : 'Cachée du portail'}
              </p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.status === 'PUBLISHED'}
                onChange={(e) => setFormData({
                  ...formData, 
                  status: e.target.checked ? 'PUBLISHED' : 'DRAFT'
                })}
              />
              <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              <span className="ml-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {formData.status === 'PUBLISHED' ? (
                  <><Eye size={18} className="text-green-500"/> Publié</>
                ) : (
                  <><EyeOff size={18} className="text-gray-400"/> Brouillon</>
                )}
              </span>
            </label>
          </div>
        </div>

        {/* IMAGE UPLOAD */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ImageIcon size={16}/> Image de l'offre
          </label>
          
          {imagePreview ? (
            <div className="relative group">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                width={800}
                height={400}
                className="w-full h-64 object-cover rounded-2xl border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-4 right-4 p-3 bg-red-500/90 hover:bg-red-600 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="block w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900/50">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-sky-500 transition-colors">
                <Upload size={48} className="mb-4" />
                <p className="font-bold text-lg">Cliquez pour uploader une image</p>
                <p className="text-sm mt-2">JPG, PNG, WEBP (max 2MB)</p>
              </div>
            </label>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase size={20} className="text-sky-500"/> Détails du poste
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Titre de l'offre</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-lg font-medium" placeholder="Ex: Développeur Fullstack Senior" />
            </div>

            <div>
              <FancySelect 
                label="Département"
                value={formData.departmentId}
                onChange={(v) => setFormData({...formData, departmentId: v})}
                icon={Building2}
                options={departments.map(d => ({ value: d.id, label: d.name }))}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type de contrat</label>
              <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none appearance-none cursor-pointer">
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="CONSULTANT">Consultant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lieu</label>
              <div className="relative">
                <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" />
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fourchette Salaire (Optionnel)</label>
              <div className="relative">
                <input value={formData.salaryRange} onChange={e => setFormData({...formData, salaryRange: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" placeholder="Ex: 800k - 1.2M" />
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar size={16}/> Date d'expiration
              </label>
              <input 
                type="date" 
                value={formData.expirationDate} 
                onChange={e => setFormData({...formData, expirationDate: e.target.value})} 
                className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20" 
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Description & Pré-requis</h3>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description du poste</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[150px] resize-y" placeholder="Détaillez les missions..." />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Compétences requises</label>
            <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[100px] resize-y" placeholder="Liste des compétences..." />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
          <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} Enregistrer
          </button>
        </div>

      </form>
    </div>
  );
}





// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { ArrowLeft, Briefcase, MapPin, DollarSign, Save, Loader2, Building2, Upload, X, Calendar, ImageIcon } from 'lucide-react';
// import { api } from '@/services/api';
// import { FancySelect } from '@/components/ui/FancySelect';
// import Image from 'next/image';

// interface Department {
//   id: string;
//   name: string;
// }

// interface JobData {
//   title: string;
//   departmentId: string;
//   location: string;
//   type: string;
//   description: string;
//   requirements?: string;
//   imageUrl?: string;
//   expirationDate?: string;
// }

// interface FormData {
//   title: string;
//   departmentId: string;
//   location: string;
//   contractType: string;
//   salaryRange: string;
//   description: string;
//   requirements: string;
//   expirationDate: string;
// }

// export default function EditJobOfferPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

//   const [formData, setFormData] = useState<FormData>({
//     title: '',
//     departmentId: '',
//     location: 'Brazzaville, Siège',
//     contractType: 'CDI',
//     salaryRange: '',
//     description: '',
//     requirements: '',
//     expirationDate: ''
//   });

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const [jobData, deptData] = await Promise.all([
//           api.get(`/recruitment/jobs/${params.id}`),
//           api.get('/departments')
//         ]);
        
//         setDepartments(deptData as Department[]);
        
//         const job = jobData as JobData;
        
//         // Gérer l'image existante
//         if (job.imageUrl) {
//           setExistingImageUrl(job.imageUrl);
//           setImagePreview(job.imageUrl);
//         }
        
//         // Formater la date pour l'input type="date"
//         let formattedDate = '';
//         if (job.expirationDate) {
//           const date = new Date(job.expirationDate);
//           formattedDate = date.toISOString().split('T')[0];
//         }
        
//         setFormData({
//           title: job.title,
//           departmentId: job.departmentId,
//           location: job.location,
//           contractType: job.type,
//           salaryRange: '',
//           description: job.description,
//           requirements: job.requirements || '',
//           expirationDate: formattedDate
//         });
//       } catch (e) {
//         console.error(e);
//         alert("Erreur de chargement");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     init();
//   }, [params.id]);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > 2 * 1024 * 1024) {
//       alert('Image trop volumineuse (max 2MB)');
//       return;
//     }

//     if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
//       alert('Format non supporté (JPG, PNG, WEBP uniquement)');
//       return;
//     }

//     setImageFile(file);
//     const reader = new FileReader();
//     reader.onloadend = () => setImagePreview(reader.result as string);
//     reader.readAsDataURL(file);
//   };

//   const handleRemoveImage = () => {
//     setImagePreview(null);
//     setImageFile(null);
//     setExistingImageUrl(null);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     try {
//       const formDataToSend = new FormData();
      
//       // Champs de base
//       formDataToSend.append('title', formData.title);
//       formDataToSend.append('departmentId', formData.departmentId);
//       formDataToSend.append('location', formData.location);
//       formDataToSend.append('contractType', formData.contractType);
//       formDataToSend.append('description', formData.description);
//       formDataToSend.append('requirements', formData.requirements || '');
      
//       // Date d'expiration en ISO 8601
//       if (formData.expirationDate) {
//         const isoDate = new Date(formData.expirationDate).toISOString();
//         formDataToSend.append('expirationDate', isoDate);
//       }
      
//       // Gestion de l'image
//       if (imageFile) {
//         // Nouvelle image uploadée
//         formDataToSend.append('image', imageFile);
//       } else if (!existingImageUrl && !imagePreview) {
//         // L'image a été supprimée
//         formDataToSend.append('removeImage', 'true');
//       }
      
//       // ✅ CORRECTION CRITIQUE : Utiliser putFormData au lieu de put
//       await api.putFormData(`/recruitment/jobs/${params.id}`, formDataToSend);
      
//       alert("Offre mise à jour avec succès !");
//       router.push('/recrutement');
//     } catch (e) {
//       console.error("Erreur détaillée:", e);
//       alert("Erreur lors de la mise à jour.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="animate-spin text-sky-500" size={32}/>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto pb-20 pt-6 relative">
//       <div className="flex items-center gap-4 mb-8">
//         <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
//           <ArrowLeft size={20} className="text-gray-500" />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'offre d'emploi</h1>
//           <p className="text-sm text-gray-500">Mettez à jour les informations du poste.</p>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 space-y-8">
        
//         {/* IMAGE UPLOAD */}
//         <div className="space-y-3">
//           <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
//             <ImageIcon size={16}/> Image de l'offre
//           </label>
          
//           {imagePreview ? (
//             <div className="relative group">
//               <Image 
//                 src={imagePreview} 
//                 alt="Preview" 
//                 width={800}
//                 height={400}
//                 className="w-full h-64 object-cover rounded-2xl border border-gray-200 dark:border-gray-700"
//               />
//               <button
//                 type="button"
//                 onClick={handleRemoveImage}
//                 className="absolute top-4 right-4 p-3 bg-red-500/90 hover:bg-red-600 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//           ) : (
//             <label className="block w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-sky-500 dark:hover:border-sky-500 rounded-2xl cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900/50">
//               <input
//                 type="file"
//                 accept="image/jpeg,image/png,image/webp"
//                 onChange={handleImageChange}
//                 className="hidden"
//               />
//               <div className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-sky-500 transition-colors">
//                 <Upload size={48} className="mb-4" />
//                 <p className="font-bold text-lg">Cliquez pour uploader une image</p>
//                 <p className="text-sm mt-2">JPG, PNG, WEBP (max 2MB)</p>
//               </div>
//             </label>
//           )}
//         </div>

//         <div className="space-y-6">
//           <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
//             <Briefcase size={20} className="text-sky-500"/> Détails du poste
//           </h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="md:col-span-2">
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Titre de l'offre</label>
//               <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 text-lg font-medium" placeholder="Ex: Développeur Fullstack Senior" />
//             </div>

//             <div>
//               <FancySelect 
//                 label="Département"
//                 value={formData.departmentId}
//                 onChange={(v) => setFormData({...formData, departmentId: v})}
//                 icon={Building2}
//                 options={departments.map(d => ({ value: d.id, label: d.name }))}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type de contrat</label>
//               <select value={formData.contractType} onChange={e => setFormData({...formData, contractType: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none appearance-none cursor-pointer">
//                 <option value="CDI">CDI</option>
//                 <option value="CDD">CDD</option>
//                 <option value="STAGE">Stage</option>
//                 <option value="CONSULTANT">Consultant</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Lieu</label>
//               <div className="relative">
//                 <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" />
//                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fourchette Salaire (Optionnel)</label>
//               <div className="relative">
//                 <input value={formData.salaryRange} onChange={e => setFormData({...formData, salaryRange: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none" placeholder="Ex: 800k - 1.2M" />
//                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
//                 <Calendar size={16}/> Date d'expiration
//               </label>
//               <input 
//                 type="date" 
//                 value={formData.expirationDate} 
//                 onChange={e => setFormData({...formData, expirationDate: e.target.value})} 
//                 className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20" 
//               />
//             </div>
//           </div>
//         </div>

//         <div className="h-px bg-gray-100 dark:bg-gray-700 w-full"></div>

//         <div className="space-y-6">
//           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Description & Pré-requis</h3>
          
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description du poste</label>
//             <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[150px] resize-y" placeholder="Détaillez les missions..." />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Compétences requises</label>
//             <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none min-h-[100px] resize-y" placeholder="Liste des compétences..." />
//           </div>
//         </div>

//         <div className="pt-4 flex justify-end gap-3">
//           <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Annuler</button>
//           <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2">
//             {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />} Enregistrer
//           </button>
//         </div>

//       </form>
//     </div>
//   );
// }