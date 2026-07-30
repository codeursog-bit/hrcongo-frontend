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
          className={`
            w-32 h-32 rounded-full overflow-hidden border-4 transition-all cursor-pointer
            ${preview 
              ? 'border-sky-500 shadow-lg shadow-sky-500/20' 
              : 'border-gray-200 dark:border-gray-700 border-dashed bg-gray-50 dark:bg-gray-800 hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/10'
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
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-sky-500 transition-colors">
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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="text-center text-white">
                  <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                  <span className="text-xs font-bold">{progress}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton d'action */}
        {!uploading && (
          <div 
            className={`
              absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-transform
              ${preview 
                ? 'bg-red-500 hover:bg-red-600 group-hover:scale-110' 
                : 'bg-sky-500 hover:bg-sky-600 group-hover:scale-110'
              }
              text-white cursor-pointer
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
          </div>
        )}

        {/* Badge de succès */}
        {preview && !uploading && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800 shadow-lg"
          >
            <Check size={14} strokeWidth={3} />
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
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {uploading 
            ? 'Upload en cours...'
            : preview
              ? 'Image uploadée ✓'
              : 'JPG, PNG ou WebP - Max 5 MB'
          }
        </p>
        {!preview && !uploading && (
          <p className="text-xs text-gray-400 mt-1">
            Optionnel
          </p>
        )}
      </div>
    </div>
  );
};