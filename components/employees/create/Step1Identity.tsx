import React from 'react';
import { User, Mail, Phone, MapPin, FileText } from 'lucide-react';
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

// ─── Input field component ────────────────────────────────────────────────────
function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 text-sm leading-none">*</span>}
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

// ─── Section header ───────────────────────────────────────────────────────────
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

// ─── Main component ───────────────────────────────────────────────────────────
export const Step1Identity: React.FC<Step1IdentityProps> = ({
  formData,
  onInputChange,
  onSelectChange,
  imageUpload,
}) => {
  return (
    <div className="space-y-8">

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          Identité & Coordonnées
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Commençons par les informations de base
        </p>
      </div>

      {/* Photo */}
      <ImageUploader
        preview={imageUpload.preview}
        uploading={imageUpload.uploading}
        progress={imageUpload.progress}
        onFileSelect={imageUpload.handleFileSelect}
        onClear={imageUpload.clearImage}
      />

      {/* ── Section Identité civile ────────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
        <SectionLabel icon={User} label="Identité civile" />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Prénom" required>
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              placeholder="Jean"
            />
          </Field>
          <Field label="Nom" required>
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              placeholder="Dupont"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date de naissance" required>
            <Input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={onInputChange}
            />
          </Field>
          <Field label="Genre">
            <FancySelect
              label=""
              value={formData.gender}
              onChange={(v) => onSelectChange('gender', v)}
              icon={User}
              options={[
                { value: 'MALE', label: 'Homme' },
                { value: 'FEMALE', label: 'Femme' },
              ]}
            />
          </Field>
        </div>

        <Field label="Lieu de naissance" required>
          <Input
            name="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={onInputChange}
            placeholder="Brazzaville"
          />
        </Field>
      </div>

      {/* ── Section Coordonnées ────────────────────────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
        <SectionLabel icon={Phone} label="Coordonnées" />

        <Field label="Email" required>
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="jean.dupont@email.com"
              className="pl-9"
            />
          </div>
        </Field>

        <Field label="Téléphone" required>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              name="phone"
              value={formData.phone}
              onChange={onInputChange}
              placeholder="+242 06 123 45 67"
              className="pl-9"
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Adresse" required>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                name="address"
                value={formData.address}
                onChange={onInputChange}
                placeholder="Avenue de la Paix"
                className="pl-9"
              />
            </div>
          </Field>
          <Field label="Ville" required>
            <Input
              name="city"
              value={formData.city}
              onChange={onInputChange}
              placeholder="Brazzaville"
            />
          </Field>
        </div>
      </div>

      {/* ── Section Documents admin (optionnel) ───────────────────────────── */}
      <div className="p-5 bg-white dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-4">
        <SectionLabel icon={FileText} label="Documents administratifs · optionnel" />

        <Field
          label="Matricule"
          hint="Laissez vide pour une génération automatique (EMP-AAAA-XXX)"
        >
          <Input
            name="employeeNumber"
            value={formData.employeeNumber || ''}
            onChange={onInputChange}
            placeholder="Généré automatiquement"
            className="font-mono text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="N° CNI / Passeport">
            <Input
              name="nationalIdNumber"
              value={formData.nationalIdNumber}
              onChange={onInputChange}
              placeholder="ID-12345"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="N° CNSS">
            <Input
              name="cnssNumber"
              value={formData.cnssNumber}
              onChange={onInputChange}
              placeholder="123456789"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="NIU">
            <Input
              name="niu"
              value={formData.niu || ''}
              onChange={onInputChange}
              placeholder="NIU de l'employé"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="N° Fiscal">
            <Input
              name="taxNumber"
              value={formData.taxNumber || ''}
              onChange={onInputChange}
              placeholder="Numéro d'impôt individuel"
              className="font-mono text-sm"
            />
          </Field>
        </div>
      </div>
    </div>
  );
};