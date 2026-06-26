// ============================================================================
// 📄 hooks/useDocumentUpload.ts
// ============================================================================

import { useState, useCallback } from 'react';

interface UploadState {
  isUploading:    boolean;
  uploadProgress: number;
  error:          string | null;
}

export function useDocumentUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading:    false,
    uploadProgress: 0,
    error:          null,
  });

  const uploadDocument = useCallback(async (
    file: File,
    meta: {
      name:           string;
      type:           string;
      employeeId:     string;
      description?:   string;
      documentNumber?: string;
      issuingBody?:   string;
      issuedAt?:      string;
      expiresAt?:     string;
    },
  ) => {
    setState({ isUploading: true, uploadProgress: 0, error: null });

    // Progression simulée pendant l'upload backend
    const interval = setInterval(() => {
      setState(s => ({
        ...s,
        uploadProgress: Math.min(s.uploadProgress + 6, 88),
      }));
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name',       meta.name);
      formData.append('type',       meta.type);
      formData.append('employeeId', meta.employeeId);
      if (meta.description)    formData.append('description',    meta.description);
      if (meta.documentNumber) formData.append('documentNumber', meta.documentNumber);
      if (meta.issuingBody)    formData.append('issuingBody',    meta.issuingBody);
      if (meta.issuedAt)       formData.append('issuedAt',       meta.issuedAt);
      if (meta.expiresAt)      formData.append('expiresAt',      meta.expiresAt);

      const token = typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ?? sessionStorage.getItem('access_token')
        : null;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? ''}/documents/upload`,
        {
          method:  'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body:    formData,
          // Pas de Content-Type : le navigateur le positionne automatiquement
          // avec le bon boundary pour multipart/form-data
        },
      );

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erreur inconnue' }));
        throw new Error(err.message ?? `Erreur ${res.status}`);
      }

      const data = await res.json();
      setState({ isUploading: false, uploadProgress: 100, error: null });
      return data;
    } catch (err: any) {
      clearInterval(interval);
      const msg = err?.message ?? 'Erreur lors de l\'upload';
      setState({ isUploading: false, uploadProgress: 0, error: msg });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, uploadProgress: 0, error: null });
  }, []);

  return {
    ...state,
    uploadDocument,
    reset,
  };
}


// ============================================================================
// 📄 AJOUT à votre services/api.ts — méthode uploadFile
// ============================================================================
//
// Ajouter cette méthode dans votre classe/objet api existant :
//
//   async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<T> {
//     const token = localStorage.getItem('access_token')
//       ?? sessionStorage.getItem('access_token');
//
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
//       method:  'POST',
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//       body:    formData,
//       // ⚠️ Ne PAS mettre Content-Type — le navigateur le gère avec le boundary
//     });
//
//     if (!res.ok) {
//       const err = await res.json().catch(() => ({}));
//       throw new Error(err.message ?? `Erreur ${res.status}`);
//     }
//
//     return res.json();
//   }
//
// ============================================================================


// ============================================================================
// 📄 Schema Prisma — MIGRATION À APPLIQUER (si pas encore fait)
//
// Ajouter dans model Document {} :
//
//   documentNumber  String?        @db.VarChar(100)
//   issuingBody     String?        @db.VarChar(255)
//   issuedAt        DateTime?      @db.Date
//   expiresAt       DateTime?      @db.Date
//   status          DocumentStatus @default(PENDING_REVIEW)
//   rejectionReason String?        @db.Text
//   verifiedById    String?        @db.Uuid
//   verifiedBy      User?          @relation("DocumentVerifiedBy", fields: [verifiedById], references: [id], onDelete: SetNull)
//   verifiedAt      DateTime?      @db.Timestamptz
//   version         Int            @default(1) @db.SmallInt
//   isArchived      Boolean        @default(false)
//   uploadedById    String?        @db.Uuid
//   uploadedBy      User?          @relation("DocumentUploadedBy", fields: [uploadedById], references: [id], onDelete: SetNull)
//
// Remplacer uploadedBy String? @db.Uuid par les lignes ci-dessus.
//
// Ajouter dans enum DocumentType :
//   PASSPORT
//   DRIVER_LICENSE
//   DIPLOMA
//   CERTIFICATION
//   TRAINING_CERT
//   MEDICAL_CERT
//   MEDICAL_VISIT
//   EMPLOYMENT_LETTER
//
// Ajouter l'enum DocumentStatus :
//   enum DocumentStatus {
//     PENDING_REVIEW
//     VERIFIED
//     REJECTED
//     EXPIRED
//     @@map("document_status")
//   }
//
// Ajouter dans model User les relations inverses :
//   documentsVerified  Document[] @relation("DocumentVerifiedBy")
//   documentsUploaded  Document[] @relation("DocumentUploadedBy")
//
// Ajouter les index :
//   @@index([expiresAt])
//   @@index([status])
//   @@index([isArchived])
//
// Puis :
//   npx prisma migrate dev --name enhance_document_module
//
// ============================================================================