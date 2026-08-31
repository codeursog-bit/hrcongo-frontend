import React from 'react';
import {
  HeartPulse, Users, GraduationCap, Car, Languages, Shirt, Check, AlertTriangle,
} from 'lucide-react';
import { FancySelect } from '@/components/ui/FancySelect';

interface Step5AdditionalProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: any) => void;
}

// ─── Input field component ────────────────────────────────────────────────────
function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 dark:focus:border-sky-500 transition-all ${className}`}
    />
  );
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

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const UNIFORM_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const Step5Additional: React.FC<Step5AdditionalProps> = ({
  formData,
  onInputChange,
  onSelectChange,
}) => {
  return (
    <div className="space-y-6">

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Informations complémentaires
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ces champs sont optionnels — issus de la fiche de renseignement RH
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Santé & Urgence ─────────────────────────────────────────────── */}
        <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
          <SectionLabel icon={HeartPulse} label="Santé & Urgence" />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Groupe sanguin">
              <FancySelect
                label=""
                value={formData.bloodType || ''}
                onChange={(v) => onSelectChange('bloodType', v)}
                icon={HeartPulse}
                placeholder="Non renseigné"
                options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))}
              />
            </Field>
          </div>

          <Field label="Pathologie / maladie habituelle" hint="Laisser vide si aucune">
            <textarea
              name="pathology"
              value={formData.pathology || ''}
              onChange={onInputChange}
              placeholder="Ex : Asthme, diabète…"
              rows={2}
              className="w-full px-3.5 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all resize-none"
            />
          </Field>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <AlertTriangle size={12} /> Personne à contacter en cas d'urgence
            </p>
            <Field label="Nom & prénom">
              <Input
                name="emergencyContactName"
                value={formData.emergencyContactName || ''}
                onChange={onInputChange}
                placeholder="Jean Mabiala"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Lien de parenté">
                <Input
                  name="emergencyContactRelation"
                  value={formData.emergencyContactRelation || ''}
                  onChange={onInputChange}
                  placeholder="Époux, frère…"
                />
              </Field>
              <Field label="Téléphone">
                <Input
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone || ''}
                  onChange={onInputChange}
                  placeholder="+242 06 123 45 67"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Filiation & Divers ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
            <SectionLabel icon={Users} label="Filiation" />
            <Field label="Nom & prénom(s) du père">
              <Input
                name="fatherName"
                value={formData.fatherName || ''}
                onChange={onInputChange}
                placeholder="—"
              />
            </Field>
            <Field label="Nom & prénom(s) de la mère">
              <Input
                name="motherName"
                value={formData.motherName || ''}
                onChange={onInputChange}
                placeholder="—"
              />
            </Field>
          </div>

          <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
            <SectionLabel icon={GraduationCap} label="Divers" />

            <Field label="Niveau d'études / diplôme le plus élevé">
              <Input
                name="educationLevel"
                value={formData.educationLevel || ''}
                onChange={onInputChange}
                placeholder="BEPC, BAC, Licence…"
              />
            </Field>

            <Field label="Langue étrangère">
              <div className="relative">
                <Languages size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <Input
                  name="foreignLanguages"
                  value={formData.foreignLanguages || ''}
                  onChange={onInputChange}
                  placeholder="Anglais, Lingala…"
                  className="pl-9"
                />
              </div>
            </Field>

            {/* Permis de conduire */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={!!formData.hasDrivingLicense}
                    onChange={(e) => onSelectChange('hasDrivingLicense', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    formData.hasDrivingLicense
                      ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    {formData.hasDrivingLicense && (
                      <Check size={11} strokeWidth={3} className="text-white dark:text-gray-900" />
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Car size={14} className="text-gray-400" /> Permis de conduire
                </span>
              </label>

              {formData.hasDrivingLicense && (
                <Input
                  name="drivingLicenseNumber"
                  value={formData.drivingLicenseNumber || ''}
                  onChange={onInputChange}
                  placeholder="N° du permis"
                  className="font-mono text-sm"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Taille de la tenue">
                <FancySelect
                  label=""
                  value={formData.uniformSize || ''}
                  onChange={(v) => onSelectChange('uniformSize', v)}
                  icon={Shirt}
                  placeholder="Non renseigné"
                  options={UNIFORM_SIZES.map((s) => ({ value: s, label: s }))}
                />
              </Field>
              <Field label="Pointure de chaussures">
                <Input
                  name="shoeSize"
                  value={formData.shoeSize || ''}
                  onChange={onInputChange}
                  placeholder="42"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};