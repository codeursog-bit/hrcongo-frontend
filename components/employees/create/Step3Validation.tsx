import React from 'react';
import { User, Check } from 'lucide-react';

interface Step3ValidationProps {
  formData: any;
  departments: any[];
  imagePreview: string | null;
}

export const Step3Validation: React.FC<Step3ValidationProps> = ({
  formData,
  departments,
  imagePreview,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-10">
      {/* Photo de profil */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-700 shadow-xl mx-auto bg-gray-100 flex items-center justify-center">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <User size={64} className="text-gray-300" />
          )}
        </div>
        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-white dark:border-gray-800">
          <Check size={20} strokeWidth={3} />
        </div>
      </div>

      {/* Nom et badges */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formData.firstName} {formData.lastName}
        </h2>
        <div className="flex items-center justify-center gap-3">
          <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg font-bold text-sm">
            {formData.position || 'Poste non défini'}
          </span>
          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-bold text-sm">
            {formData.contractType}
          </span>
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
          <span className="text-gray-500">Département</span>
          <span className="font-bold">
            {departments.find((d) => d.id === formData.departmentId)?.name || '-'}
          </span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
          <span className="text-gray-500">Salaire</span>
          <span className="font-bold font-mono">
            {parseFloat(formData.baseSalary || '0').toLocaleString()} FCFA
          </span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
          <span className="text-gray-500">Situation familiale</span>
          <span className="font-bold">
            {formData.maritalStatus} - {formData.numberOfChildren} enfant(s)
          </span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
          <span className="text-gray-500">CNI</span>
          <span className="font-bold font-mono">
            {formData.nationalIdNumber || 'Non renseigné'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">CNSS</span>
          <span className="font-bold font-mono">
            {formData.cnssNumber || 'Non renseigné'}
          </span>
        </div>
      </div>
    </div>
  );
};