import React from 'react';
import { Building2, Wallet, Smartphone } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';

interface Step2ContractProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  departments: any[];
}

export const Step2Contract: React.FC<Step2ContractProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  departments,
}) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* POSTE & AFFECTATION */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2">
            Poste & Affectation
          </h3>

          {/* Département */}
          <div>
            <FancySelect
              label="Département *"
              value={formData.departmentId}
              onChange={(v) => onSelectChange('departmentId', v)}
              icon={Building2}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Choisir un département..."
            />
            {departments.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">
                Aucun département. Créez-en un dans les paramètres.
              </p>
            )}
          </div>

          {/* Poste */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Intitulé du Poste <span className="text-red-500">*</span>
            </label>
            <input
              name="position"
              value={formData.position}
              onChange={onInputChange}
              placeholder="Comptable, Développeur, Manager..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          {/* Date d'embauche */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Date d'embauche <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="hireDate"
              value={formData.hireDate}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>

          {/* Type de contrat */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Type de Contrat <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['CDI', 'CDD', 'STAGE', 'CONSULTANT'].map((type) => (
                <div
                  key={type}
                  onClick={() => onSelectChange('contractType', type)}
                  className={`cursor-pointer p-4 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                    formData.contractType === type
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 shadow-md shadow-sky-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>

          {/* Salaire */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Salaire de Base Mensuel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="baseSalary"
                value={formData.baseSalary}
                onChange={onInputChange}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                FCFA
              </span>
            </div>
          </div>
        </div>

        {/* MODE DE PAIEMENT */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-2">
            <Wallet size={16} /> Mode de Paiement
          </h3>

          {/* Canal de versement */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Canal de versement
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectChange('paymentMethod', 'MOBILE_MONEY')}
                className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                  formData.paymentMethod === 'MOBILE_MONEY'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                Mobile Money
              </button>
              <button
                type="button"
                onClick={() => onSelectChange('paymentMethod', 'BANK_TRANSFER')}
                className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                  formData.paymentMethod === 'BANK_TRANSFER'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                Virement Bancaire
              </button>
              <button
                type="button"
                onClick={() => onSelectChange('paymentMethod', 'CASH')}
                className={`p-3 rounded-xl border-2 text-center text-xs font-bold transition-all ${
                  formData.paymentMethod === 'CASH'
                    ? 'border-gray-500 bg-gray-50 dark:bg-gray-700/20 text-gray-700 dark:text-gray-300'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                Espèces
              </button>
            </div>
          </div>

          {/* Virement Bancaire */}
          {formData.paymentMethod === 'BANK_TRANSFER' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
              <div className="mb-3">
                <FancySelect
                  label="Banque"
                  value={formData.bankName}
                  onChange={(v) => onSelectChange('bankName', v)}
                  icon={Building2}
                  options={[
                    { value: 'BGFI', label: 'BGFI Bank' },
                    { value: 'ECOBANK', label: 'Ecobank' },
                    { value: 'LCB', label: 'LCB Bank' },
                    { value: 'UBA', label: 'UBA' },
                    { value: 'SOCIETE_GENERALE', label: 'Société Générale' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Numéro de Compte (RIB)
                </label>
                <input
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={onInputChange}
                  placeholder="XXXXXXXXXXXXXXXXXXXXXXXX"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg font-mono"
                />
              </div>
            </div>
          )}

          {/* Mobile Money */}
          {formData.paymentMethod === 'MOBILE_MONEY' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 animate-in fade-in slide-in-from-top-2">
              <div className="mb-3">
                <FancySelect
                  label="Opérateur"
                  value={formData.mobileMoneyOperator}
                  onChange={(v) => onSelectChange('mobileMoneyOperator', v)}
                  icon={Smartphone}
                  options={[
                    { value: 'MTN', label: 'MTN Mobile Money' },
                    { value: 'AIRTEL', label: 'Airtel Money' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  name="mobileMoneyNumber"
                  value={formData.mobileMoneyNumber}
                  onChange={onInputChange}
                  placeholder="06..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg font-mono"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};