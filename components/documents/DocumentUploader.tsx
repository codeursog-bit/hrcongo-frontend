// ============================================================================
// 5️⃣ FRONTEND - components/documents/DocumentUploader.tsx
// ============================================================================

'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface DocumentUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onRemove: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFileSelect,
  selectedFile,
  onRemove,
  isUploading,
  uploadProgress = 0,
  error
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  if (selectedFile) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-4xl">{getFileIcon(selectedFile.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {selectedFile.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFile.size)} MB
            </p>
          </div>
          {!isUploading && (
            <button
              onClick={onRemove}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Upload en cours...
              </span>
              <span className="font-bold text-sky-600">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl">
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => inputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging 
          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20' 
          : 'border-gray-300 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-600'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        onChange={handleFileInput}
      />
      <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Upload size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        Glissez un fichier ici
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        ou cliquez pour parcourir
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        PDF, Word, Excel • Max 10MB
      </p>
    </div>
  );
};
