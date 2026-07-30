import React from 'react';
import {
  ShieldCheck, Key, User, Network, Lock, AlertCircle,
  Smartphone, Briefcase, Check, Eye, EyeOff,
} from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

interface Step4UserAccountProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: any) => void;
  departments: any[];
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon size={13} className="text-gray-400 dark:text-gray-500" />
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
        {label}
      </span>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

const ROLES = [
  { value: 'EMPLOYEE',   label: 'Employé standard',   desc: 'Pointage, congés, bulletins de paie', icon: User },
  { value: 'MANAGER',    label: "Manager d'équipe",    desc: 'Validation congés, accès équipe',     icon: Briefcase },
  { value: 'HR_MANAGER', label: 'Manager RH',          desc: 'Gestion complète paie & congés',      icon: ShieldCheck },
  { value: 'ADMIN',      label: 'Administrateur',      desc: 'Accès complet au système',            icon: Key },
];

export const Step4UserAccount: React.FC<Step4UserAccountProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  departments,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));
    onSelectChange('userPassword', password);
  };

  return (
    <div className="space-y-6">

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Accès au système
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Créer un compte pour que{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {formData.firstName || 'l\'employé'}
          </span>{' '}
          puisse se connecter ?
        </p>
      </div>

      {/* Toggle principal */}
      <label className="flex items-start gap-4 p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 cursor-pointer group">
        {/* Custom checkbox */}
        <div className="mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={formData.createUserAccount}
            onChange={(e) => onSelectChange('createUserAccount', e.target.checked)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            formData.createUserAccount
              ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
          }`}>
            {formData.createUserAccount && (
              <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Smartphone size={15} className="text-gray-400" />
            Créer un compte utilisateur
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
            L'employé pourra se connecter pour pointer, consulter ses fiches de paie, demander des congés, etc.
          </p>
          <div className="flex gap-2 mt-2.5">
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-[11px] font-bold flex items-center gap-1">
              <Smartphone size={10} /> Mobile
            </span>
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-[11px] font-bold flex items-center gap-1">
              <User size={10} /> Web
            </span>
          </div>
        </div>
      </label>

      {/* Config compte */}
      <AnimatePresence>
        {formData.createUserAccount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Rôle */}
            <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-3">
              <SectionLabel icon={User} label="Rôle dans l'application" />

              <div className="space-y-2">
                {ROLES.map((role) => {
                  const RoleIcon  = role.icon;
                  const isSelected = formData.userRole === role.value;
                  return (
                    <label key={role.value}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                          : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <input type="radio" name="userRole" value={role.value}
                        checked={isSelected}
                        onChange={(e) => onSelectChange('userRole', e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'bg-gray-900 dark:bg-white' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <RoleIcon size={15} className={isSelected ? 'text-white dark:text-gray-900' : 'text-gray-400 dark:text-gray-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold transition-colors ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {role.label}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{role.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0">
                          <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Département si Manager */}
              <AnimatePresence>
                {formData.userRole === 'MANAGER' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-2 space-y-1.5"
                  >
                    <FancySelect
                      label="Département assigné"
                      value={formData.departmentId}
                      onChange={(v) => onSelectChange('departmentId', v)}
                      icon={Network}
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
                      placeholder="Choisir département…"
                    />
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <AlertCircle size={10} /> Le manager n'aura accès qu'aux employés de ce département
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mot de passe */}
            <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
              <SectionLabel icon={Key} label="Mot de passe provisoire" />

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="userPassword"
                    value={formData.userPassword}
                    onChange={onInputChange}
                    placeholder="Générer ou saisir…"
                    className="w-full pl-9 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button type="button" onClick={generatePassword}
                  className="px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl text-xs hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors shadow-md flex items-center gap-1.5 flex-shrink-0">
                  <Lock size={13} /> Générer
                </button>
              </div>

              <p className="text-[11px] text-gray-400">
                Minimum 6 caractères. L'employé sera invité à le modifier à la première connexion.
              </p>

              {formData.userPassword && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <AlertCircle size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Communiquez ce mot de passe à{' '}
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {formData.firstName || 'l\'employé'}
                    </span>.
                    Il devra le changer à sa première connexion.
                  </p>
                </motion.div>
              )}

              {/* Récap */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 text-xs">
                <p className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] mb-2">Récapitulatif du compte</p>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Email</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{formData.email || '—'}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Rôle</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {ROLES.find(r => r.value === formData.userRole)?.label || '—'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Mot de passe</span>
                  <span className="font-mono text-[11px] text-gray-500">
                    {formData.userPassword ? '••••••••••••' : '— Non défini'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message si pas de compte */}
      {!formData.createUserAccount && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <AlertCircle size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pas de problème. Vous pourrez créer le compte depuis la page{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-300">Gestion des utilisateurs</span> plus tard.
          </p>
        </motion.div>
      )}
    </div>
  );
};