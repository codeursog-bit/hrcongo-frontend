// frontend/src/lib/cloudinary.client.ts
// ✅ Extension .client.ts = clairement un fichier FRONTEND

/**
 * Client Cloudinary pour upload DIRECT depuis le navigateur
 * NE PAS utiliser dans NestJS !
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadOptions {
  maxSizeInMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  folder?: string;
}

class CloudinaryClient {
  private readonly CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  private readonly UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  private readonly API_URL = `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;

  private validateConfig(): void {
    if (!this.CLOUD_NAME || !this.UPLOAD_PRESET) {
      throw new Error(
        'Configuration Cloudinary manquante. Vérifiez NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME et NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET dans .env.local'
      );
    }
  }

  private async compressImage(file: File, options: UploadOptions = {}): Promise<Blob> {
    const { maxWidth = 800, maxHeight = 800, quality = 0.85 } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Échec de la compression'));
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => reject(new Error('Échec du chargement de l\'image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Échec de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File, options: UploadOptions = {}): void {
    const { maxSizeInMB = 5 } = options;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    if (file.size > maxSizeInBytes) {
      throw new Error(`L'image ne doit pas dépasser ${maxSizeInMB} MB`);
    }

    const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP');
    }
  }

  /**
   * Upload une image DIRECTEMENT sur Cloudinary depuis le navigateur
   */
  async uploadImage(file: File, options: UploadOptions = {}): Promise<CloudinaryUploadResult> {
    try {
      this.validateConfig();
      this.validateFile(file, options);

      const compressedBlob = await this.compressImage(file, options);

      const formData = new FormData();
      formData.append('file', compressedBlob, file.name);
      formData.append('upload_preset', this.UPLOAD_PRESET!);
      
      if (options.folder) {
        formData.append('folder', options.folder);
      }

      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Échec de l\'upload');
      }

      const data = await response.json();

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
      };
    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error);
      throw error;
    }
  }

  async uploadBase64(base64String: string, options: UploadOptions = {}): Promise<CloudinaryUploadResult> {
    try {
      this.validateConfig();

      const response = await fetch(base64String);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

      return this.uploadImage(file, options);
    } catch (error) {
      console.error('❌ Erreur upload base64:', error);
      throw error;
    }
  }
}

export const cloudinaryClient = new CloudinaryClient();



