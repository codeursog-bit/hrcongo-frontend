// ============================================================================
// 📄 hooks/useDocumentUpload.ts - SIMPLIFIÉ (Upload via Backend)
// ============================================================================

import { useState } from 'react';

export const useDocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadDocument = async (
    file: File,
    documentData: {
      name: string;
      type: string;
      description?: string;
      employeeId: string;
    }
  ) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // ✅ Récupérer le token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      // ✅ Préparer FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentData.name);
      formData.append('type', documentData.type);
      formData.append('employeeId', documentData.employeeId);
      if (documentData.description) {
        formData.append('description', documentData.description);
      }

      // Simulation de progression
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log('📤 Envoi vers backend:', {
        fileName: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        employeeId: documentData.employeeId
      });

      // ✅ Upload via backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // ⚠️ NE PAS mettre Content-Type (auto avec FormData)
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de l\'upload');
      }

      const result = await response.json();
      
      console.log('✅ Document créé:', result);

      return result;
    } catch (err: any) {
      console.error('❌ Erreur upload:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { uploadDocument, isUploading, uploadProgress, error };
};