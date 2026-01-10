import { useState, useCallback } from 'react';
import { cloudinaryClient, CloudinaryUploadResult, UploadOptions } from '@/lib/cloudinary.client';
import { useAlert } from '@/components/providers/AlertProvider';

export interface UseImageUploadReturn {
  uploading: boolean;
  progress: number;
  preview: string | null;
  uploadedUrl: string | null;
  error: string | null;
  handleFileSelect: (file: File) => Promise<void>;
  handleBase64Upload: (base64: string) => Promise<void>;
  clearImage: () => void;
  reset: () => void;
}

export const useImageUpload = (options?: UploadOptions): UseImageUploadReturn => {
  const alert = useAlert();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Génère un aperçu local
   */
  const generatePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Gère la sélection d'un fichier
   */
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setError(null);
      setProgress(0);

      // Génération de l'aperçu local
      const previewUrl = await generatePreview(file);
      setPreview(previewUrl);

      // Upload vers Cloudinary
      setUploading(true);
      setProgress(30);

      const result = await cloudinaryClient.uploadImage(file, {
        folder: 'employees',
        maxSizeInMB: 5,
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        ...options
      });

      setProgress(100);
      setUploadedUrl(result.url);
      
      alert.success(
        'Image uploadée',
        `Image compressée : ${(result.bytes / 1024).toFixed(0)} KB`
      );
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
      alert.error('Erreur d\'upload', err.message);
    } finally {
      setUploading(false);
    }
  }, [alert, generatePreview, options]);

  /**
   * Upload à partir d'une string base64
   */
  const handleBase64Upload = useCallback(async (base64: string) => {
    try {
      setError(null);
      setProgress(0);
      setPreview(base64);

      setUploading(true);
      setProgress(30);

      const result = await cloudinaryClient.uploadBase64(base64, {
        folder: 'employees',
        ...options
      });

      setProgress(100);
      setUploadedUrl(result.url);
      
      alert.success('Image uploadée', 'Image envoyée avec succès');
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
      alert.error('Erreur d\'upload', err.message);
    } finally {
      setUploading(false);
    }
  }, [alert, options]);

  /**
   * Efface l'image
   */
  const clearImage = useCallback(() => {
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Reset complet
   */
  const reset = useCallback(() => {
    clearImage();
    setUploading(false);
  }, [clearImage]);

  return {
    uploading,
    progress,
    preview,
    uploadedUrl,
    error,
    handleFileSelect,
    handleBase64Upload,
    clearImage,
    reset,
  };
};