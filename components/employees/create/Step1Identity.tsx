import React from 'react';
import { User, Mail, Phone, MapPin } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { ImageUploader } from '@/components/employees/ImageUploader';

interface Step1IdentityProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  imageUpload: {
    preview: string | null;
    uploading: boolean;
    progress: number;
    handleFileSelect: (file: File) => void;
    clearImage: () => void;
  };
}

export const Step1Identity: React.FC<Step1IdentityProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  imageUpload,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Identité & Coordonnées
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Commençons par les informations de base
        </p>
      </div>

      {/* PHOTO UPLOAD */}
      <ImageUploader
        preview={imageUpload.preview}
        uploading={imageUpload.uploading}
        progress={imageUpload.progress}
        onFileSelect={imageUpload.handleFileSelect}
        onClear={imageUpload.clearImage}
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* IDENTITÉ */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">
            Identité Civile
          </h3>

          {/* Prénom */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              placeholder="Jean"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              placeholder="Dupont"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          {/* Date de naissance & Genre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Date Naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={onInputChange}
                className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            <div>
              <FancySelect
                label="Genre"
                value={formData.gender}
                onChange={(v) => onSelectChange('gender', v)}
                icon={User}
                options={[
                  { value: 'MALE', label: 'Homme' },
                  { value: 'FEMALE', label: 'Femme' },
                ]}
              />
            </div>
          </div>

          {/* Lieu de naissance */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Lieu de naissance <span className="text-red-500">*</span>
            </label>
            <input
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={onInputChange}
              placeholder="Brazzaville"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* CONTACT */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">
            Coordonnées
          </h3>

          {/* Email */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-cyan-500" />
                Email <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="jean.dupont@email.com"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-sky-500" />
                Téléphone <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={onInputChange}
              placeholder="+242 06 123 45 67"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-cyan-500" />
                Adresse <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              name="address"
              value={formData.address}
              onChange={onInputChange}
              placeholder="123 Avenue de la Paix"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          {/* Ville */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Ville <span className="text-red-500">*</span>
            </label>
            <input
              name="city"
              value={formData.city}
              onChange={onInputChange}
              placeholder="Brazzaville"
              className="w-full px-4 py-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* DOCUMENTS OPTIONNELS */}
      <div className="pt-6 border-t-2 border-slate-100 dark:border-slate-700">
        <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-4">
          Documents Administratifs (Optionnel)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              N° CNI / Passeport
              <span className="text-xs text-slate-400 ml-2 font-normal">(optionnel)</span>
            </label>
            <input
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={onInputChange}
              placeholder="ID-12345"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl glass-card dark:text-white focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              N° CNSS
              <span className="text-xs text-slate-400 ml-2 font-normal">(optionnel)</span>
            </label>
            <input
              name="cnssNumber"
              value={formData.cnssNumber}
              onChange={onInputChange}
              placeholder="123456789"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl glass-card dark:text-white focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};


// import React from 'react';
// import { User, Heart, Baby } from 'lucide-react';
// import { FancySelect } from '@/components/ui/FancySelect';
// import { ImageUploader } from '@/components/employees/ImageUploader';

// interface Step1IdentityProps {
//   formData: any;
//   onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
//   onSelectChange: (name: string, value: string) => void;
//   imageUpload: {
//     preview: string | null;
//     uploading: boolean;
//     progress: number;
//     handleFileSelect: (file: File) => void;
//     clearImage: () => void;
//   };
// }

// export const Step1Identity: React.FC<Step1IdentityProps> = ({
//   formData,
//   onInputChange,
//   onSelectChange,
//   imageUpload,
// }) => {
//   return (
//     <div className="space-y-8">
//       {/* PHOTO UPLOAD */}
//       <ImageUploader
//         preview={imageUpload.preview}
//         uploading={imageUpload.uploading}
//         progress={imageUpload.progress}
//         onFileSelect={imageUpload.handleFileSelect}
//         onClear={imageUpload.clearImage}
//         className="mb-8"
//       />

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* IDENTITÉ */}
//         <div className="space-y-4">
//           <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">
//             Identité
//           </h3>

//           {/* Prénom */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Prénom <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="firstName"
//               value={formData.firstName}
//               onChange={onInputChange}
//               placeholder="Jean"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Nom */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Nom <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="lastName"
//               value={formData.lastName}
//               onChange={onInputChange}
//               placeholder="Dupont"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Date de naissance & Genre */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//                 Date Naissance <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="date"
//                 name="dateOfBirth"
//                 value={formData.dateOfBirth}
//                 onChange={onInputChange}
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//               />
//             </div>

//             <div>
//               <FancySelect
//                 label="Genre"
//                 value={formData.gender}
//                 onChange={(v) => onSelectChange('gender', v)}
//                 icon={User}
//                 options={[
//                   { value: 'MALE', label: 'Homme' },
//                   { value: 'FEMALE', label: 'Femme' },
//                 ]}
//               />
//             </div>
//           </div>

//           {/* Lieu de naissance */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Lieu de naissance <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="placeOfBirth"
//               value={formData.placeOfBirth}
//               onChange={onInputChange}
//               placeholder="Brazzaville"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Situation familiale */}
//           <div>
//             <FancySelect
//               label="Situation Familiale"
//               value={formData.maritalStatus}
//               onChange={(v) => onSelectChange('maritalStatus', v)}
//               icon={Heart}
//               options={[
//                 { value: 'SINGLE', label: 'Célibataire' },
//                 { value: 'MARRIED', label: 'Marié(e)' },
//                 { value: 'DIVORCED', label: 'Divorcé(e)' },
//                 { value: 'WIDOWED', label: 'Veuf/Veuve' },
//               ]}
//             />
//           </div>

//           {/* Nombre d'enfants */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               <div className="flex items-center gap-2">
//                 <Baby size={16} className="text-sky-500" />
//                 Nombre d'enfants <span className="text-red-500">*</span>
//               </div>
//               <span className="text-xs text-gray-400 font-normal">
//                 (pour calcul fiscal IRPP)
//               </span>
//             </label>
//             <input
//               type="number"
//               min="0"
//               name="numberOfChildren"
//               value={formData.numberOfChildren}
//               onChange={onInputChange}
//               placeholder="0"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>
//         </div>

//         {/* CONTACT & ADMINISTRATIF */}
//         <div className="space-y-4">
//           <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">
//             Coordonnées & Administratif
//           </h3>

//           {/* Email */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={onInputChange}
//               placeholder="jean.dupont@email.com"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Téléphone */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Téléphone <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="phone"
//               value={formData.phone}
//               onChange={onInputChange}
//               placeholder="+242 06 123 45 67"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Adresse */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Adresse <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="address"
//               value={formData.address}
//               onChange={onInputChange}
//               placeholder="123 Avenue de la Paix"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* Ville */}
//           <div>
//             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//               Ville <span className="text-red-500">*</span>
//             </label>
//             <input
//               name="city"
//               value={formData.city}
//               onChange={onInputChange}
//               placeholder="Brazzaville"
//               className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
//             />
//           </div>

//           {/* CNI & CNSS (Optionnels) */}
//           <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//                 N° CNI / Passeport
//                 <span className="text-xs text-gray-400 ml-1 font-normal">(optionnel)</span>
//               </label>
//               <input
//                 name="nationalIdNumber"
//                 value={formData.nationalIdNumber}
//                 onChange={onInputChange}
//                 placeholder="ID-12345"
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-mono text-sm"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
//                 N° CNSS
//                 <span className="text-xs text-gray-400 ml-1 font-normal">(optionnel)</span>
//               </label>
//               <input
//                 name="cnssNumber"
//                 value={formData.cnssNumber}
//                 onChange={onInputChange}
//                 placeholder="123456789"
//                 className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-mono text-sm"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };