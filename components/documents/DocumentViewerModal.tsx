'use client';

// ============================================================================
// 📄 components/documents/DocumentViewerModal.tsx
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, FileText, Calendar, Hash,
  Building2, User, Clock, CheckCircle2,
  XCircle, TrendingDown, AlertTriangle, Shield,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  mimeType?: string;
  fileSize?: number;
  documentNumber?: string;
  issuingBody?: string;
  issuedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  version: number;
  isArchived: boolean;
  createdAt: string;
  verifiedAt?: string;
  description?: string;
  employee?: { firstName: string; lastName: string; position?: string };
}

const TYPE_LABELS: Record<string, string> = {
  ID_CARD: 'Carte d\'identité', PASSPORT: 'Passeport',
  DRIVER_LICENSE: 'Permis de conduire', PAYSLIP: 'Bulletin de paie',
  CONTRACT: 'Contrat de travail', WORK_CERTIFICATE: 'Attestation de travail',
  SALARY_ATTESTATION: 'Attestation de salaire', EMPLOYMENT_LETTER: 'Lettre d\'embauche',
  DIPLOMA: 'Diplôme', CERTIFICATION: 'Certification / HSE',
  TRAINING_CERT: 'Attestation de formation', MEDICAL_CERT: 'Certificat médical',
  MEDICAL_VISIT: 'Visite médicale', RESUME: 'CV', OTHER: 'Autre',
};

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'En attente de vérification', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', Icon: Clock },
  VERIFIED:       { label: 'Vérifié et validé',          color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', Icon: CheckCircle2 },
  REJECTED:       { label: 'Rejeté',                     color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', Icon: XCircle },
  EXPIRED:        { label: 'Expiré',                     color: 'text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700', Icon: TrendingDown },
};

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const formatSize = (b?: number) =>
  b ? (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} Mo` : `${(b / 1024).toFixed(0)} Ko`) : '—';

const daysUntil = (d?: string) => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
};

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={13} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

interface Props {
  document: Document;
  onClose: () => void;
  onDownload: (doc: Document) => void;
}

export function DocumentViewerModal({ document: doc, onClose, onDownload }: Props) {
  const days   = daysUntil(doc.expiresAt);
  const cfg    = STATUS_CONFIG[doc.status];
  const { Icon: StatusIcon } = cfg;

  const isCritical    = days !== null && days <= 7  && days > 0 && doc.status === 'VERIFIED';
  const isWarnExpiry  = days !== null && days <= 30 && days > 0 && doc.status === 'VERIFIED';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1,    opacity: 1, y: 0 }}
          exit={{ scale: 0.96,    opacity: 0, y: 8 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-sky-50 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-sky-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{doc.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {TYPE_LABELS[doc.type] ?? doc.type}
                  {doc.version > 1 && <span className="ml-2 text-sky-500 font-semibold">v{doc.version}</span>}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Statut */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${cfg.color}`}>
              <StatusIcon size={16} />
              <span className="font-semibold text-sm">{cfg.label}</span>
              {doc.verifiedAt && (
                <span className="ml-auto text-xs opacity-70">{formatDate(doc.verifiedAt)}</span>
              )}
            </div>

            {/* Rejet motif */}
            {doc.status === 'REJECTED' && doc.rejectionReason && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-xs font-semibold text-red-600 mb-1">Motif de rejet :</p>
                <p className="text-sm text-red-700 dark:text-red-400">{doc.rejectionReason}</p>
              </div>
            )}

            {/* Alerte expiration */}
            {(isCritical || isWarnExpiry) && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm
                ${isCritical
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                }`}
              >
                <AlertTriangle size={15} />
                <span className="font-medium">
                  {isCritical
                    ? `⚠ Expire dans ${days} jour${days !== 1 ? 's' : ''} — action urgente`
                    : `Expire dans ${days} jours — pensez au renouvellement`}
                </span>
              </div>
            )}

            {/* Infos document */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Informations</p>
              <InfoRow icon={User}      label="Employé"         value={doc.employee ? `${doc.employee.firstName} ${doc.employee.lastName}${doc.employee.position ? ` · ${doc.employee.position}` : ''}` : undefined} />
              <InfoRow icon={Hash}      label="Numéro"          value={doc.documentNumber} />
              <InfoRow icon={Building2} label="Organisme"       value={doc.issuingBody} />
              <InfoRow icon={Calendar}  label="Émis le"         value={formatDate(doc.issuedAt)} />
              <InfoRow icon={Calendar}  label="Expire le"       value={formatDate(doc.expiresAt)} />
              <InfoRow icon={Clock}     label="Ajouté le"       value={formatDate(doc.createdAt)} />
              <InfoRow icon={Shield}    label="Taille"          value={formatSize(doc.fileSize)} />
              {doc.description && (
                <InfoRow icon={FileText} label="Commentaire"   value={doc.description} />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Fermer
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download size={15} />
              Télécharger
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}