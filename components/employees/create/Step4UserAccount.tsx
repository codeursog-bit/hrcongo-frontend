import React from 'react';
import { ShieldCheck, Key, User, Network, Lock, AlertCircle, Smartphone,Briefcase } from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';
import { motion, AnimatePresence } from 'framer-motion';

interface Step4UserAccountProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: any) => void;
  departments: any[];
}

export const Step4UserAccount: React.FC<Step4UserAccountProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  departments,
}) => {
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onSelectChange('userPassword', password);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-100 dark:bg-cyan-900/30 rounded-full mb-4">
          <ShieldCheck size={40} className="text-cyan-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Accès au Système
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Créer un compte utilisateur pour que {formData.firstName || 'l\'employé'} puisse se connecter ?
        </p>
      </div>

      {/* TOGGLE PRINCIPAL */}
      <div className="max-w-2xl mx-auto">
        <label className="flex items-start gap-4 cursor-pointer glass-card p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all group">
          <input 
            type="checkbox"
            checked={formData.createUserAccount}
            onChange={(e) => onSelectChange('createUserAccount', e.target.checked)}
            className="w-7 h-7 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-0 mt-1"
          />
          <div className="flex-1">
            <span className="text-lg font-bold text-slate-900 dark:text-white block mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              <Smartphone size={20} /> Créer un compte utilisateur
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              L'employé pourra se connecter à l'application pour pointer, consulter ses fiches de paie, demander des congés, etc.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-bold flex items-center gap-1">
                <Smartphone size={12} /> Mobile
              </span>
              <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-lg text-xs font-bold flex items-center gap-1">
                <User size={12} /> Web
              </span>
            </div>
          </div>
        </label>

        {/* CONFIGURATION DU COMPTE */}
        <AnimatePresence>
          {formData.createUserAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 space-y-6"
            >
              <div className="glass-panel p-6 rounded-2xl space-y-6">
                
                {/* RÔLE */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={18} className="text-cyan-500" /> Rôle dans l'application
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { 
                        value: 'EMPLOYEE', 
                        label: 'Employé Standard', 
                        desc: 'Pointage, congés, bulletins de paie',
                        icon: User,
                      },
                      { 
                        value: 'MANAGER', 
                        label: 'Manager d\'Équipe', 
                        desc: 'Validation congés, accès équipe',
                        icon: Briefcase,
                      },
                      { 
                        value: 'HR_MANAGER', 
                        label: 'Manager RH', 
                        desc: 'Gestion complète paie & congés',
                        icon: ShieldCheck,
                      },
                      { 
                        value: 'ADMIN', 
                        label: 'Administrateur', 
                        desc: 'Accès complet au système',
                        icon: Key,
                      },
                    ].map((role) => (
                      <label 
                        key={role.value}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                          ${formData.userRole === role.value 
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 ring-2 ring-cyan-500/30' 
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}
                        `}
                      >
                        <input 
                          type="radio" 
                          name="userRole" 
                          value={role.value} 
                          checked={formData.userRole === role.value} 
                          onChange={(e) => onSelectChange('userRole', e.target.value)}
                          className="hidden"
                        />
                        <role.icon className={formData.userRole === role.value ? 'text-cyan-500' : 'text-slate-400'} size={24} />
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white">{role.label}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{role.desc}</div>
                        </div>
                        {formData.userRole === role.value && (
                          <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* DÉPARTEMENT POUR MANAGER */}
                {formData.userRole === 'MANAGER' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FancySelect 
                      label="Département assigné"
                      value={formData.departmentId} 
                      onChange={(v) => onSelectChange('departmentId', v)} 
                      icon={Network}
                      options={departments.map(d => ({ value: d.id, label: d.name }))}
                      placeholder="Choisir département..."
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Le manager n'aura accès qu'aux employés de ce département
                    </p>
                  </motion.div>
                )}

                {/* MOT DE PASSE */}
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Key size={18} className="text-cyan-500" /> Mot de passe provisoire
                  </h4>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        name="userPassword"
                        value={formData.userPassword}
                        onChange={onInputChange}
                        placeholder="Générer ou saisir..."
                        className="w-full p-4 glass-card border-2 border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono text-lg font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Lock size={18} /> Générer
                    </button>
                  </div>

                  {formData.userPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 glass-card p-4 rounded-lg"
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <strong>Important :</strong> Communiquez ce mot de passe à {formData.firstName || 'l\'employé'}. Il devra le changer à sa première connexion.
                      </p>
                    </motion.div>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Minimum 6 caractères. L'employé sera invité à le modifier à la première connexion.
                  </p>
                </div>
              </div>

              {/* RÉCAPITULATIF */}
              <div className="glass-card p-6 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800">
                <h4 className="font-bold text-cyan-700 dark:text-cyan-300 mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} /> Récapitulatif du compte
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Email de connexion</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formData.email || 'Non défini'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Rôle</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300">
                      {formData.userRole === 'EMPLOYEE' && 'Employé'}
                      {formData.userRole === 'MANAGER' && 'Manager'}
                      {formData.userRole === 'HR_MANAGER' && 'Manager RH'}
                      {formData.userRole === 'ADMIN' && 'Admin'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Mot de passe</span>
                    <span className="font-mono text-xs text-slate-500">
                      {formData.userPassword ? '••••••••••••' : 'Non défini'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MESSAGE SI PAS DE COMPTE */}
        {!formData.createUserAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 glass-card p-4 rounded-xl"
          >
            <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlertCircle size={16} />
              Pas de problème ! Vous pourrez créer le compte utilisateur plus tard depuis la page "Gestion des Utilisateurs".
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};