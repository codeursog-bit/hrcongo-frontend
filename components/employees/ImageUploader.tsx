import React, { useRef } from 'react';
import { Camera, Upload, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
  preview: string | null;
  uploading: boolean;
  progress: number;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  preview,
  uploading,
  progress,
  onFileSelect,
  onClear,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative group">
        {/* Zone de preview/upload */}
        <div
          onClick={handleClick}
          role="button" tabIndex={uploading ? -1 : 0} aria-label="Choisir la photo de l’employé" aria-disabled={uploading}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
          className={`
            w-32 h-32 rounded-full overflow-hidden border-4 transition-all cursor-pointer
            ${preview 
              ? 'border-[var(--border)] shadow-lg '
              : 'border-[var(--border)]  border-dashed bg-[var(--surface)]  hover:border-[var(--border)] hover:bg-[var(--brand-soft)] '
            }
            ${uploading ? 'cursor-wait opacity-75' : 'cursor-pointer'}
          `}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--action)] transition-colors">
              <Camera size={32} />
              <span className="text-xs mt-1 font-medium">Photo</span>
            </div>
          )}

          {/* Overlay de chargement */}
          <AnimatePresence>
            {uploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--surface-2)] flex items-center justify-center"
              >
                <div className="text-center text-[var(--text)]">
                  <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                  <span className="text-xs font-bold">{progress}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton d'action */}
        {!uploading && (
          <button type="button" aria-label={preview ? "Retirer la photo" : "Choisir une photo"}
            className={`
              absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-transform
              ${preview 
                ? 'bg-[var(--action)] hover:bg-[var(--action)] group-hover:scale-110'
                : 'bg-[var(--action)] hover:bg-[var(--action)] group-hover:scale-110'
              }
              text-[var(--on-brand)] cursor-pointer
            `}
            onClick={(e) => {
              e.stopPropagation();
              if (preview) {
                onClear();
              } else {
                handleClick();
              }
            }}
          >
            {preview ? <X size={16} /> : <Upload size={16} />}
          </button>
        )}

        {/* Badge de succès */}
        {preview && !uploading && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 text-[var(--green)]"
          >
            <Check size={16} strokeWidth={1.5} aria-hidden="true" />
          </motion.div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          disabled={uploading}
        />
      </div>

      {/* Informations */}
      <div className="text-center mt-3">
        <p className="text-xs text-[var(--text-secondary)] ">
          {uploading 
            ? 'Upload en cours...'
            : preview
              ? 'Image uploadée'
              : 'JPG, PNG ou WebP - Max 5 MB'
          }
        </p>
        {!preview && !uploading && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Optionnel
          </p>
        )}
      </div>
    </div>
  );
};
