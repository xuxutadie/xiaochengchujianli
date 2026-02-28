/**
 * Image Upload Service
 * Handles image compression and upload to backend server
 */

import { compressImage } from '../utils/imageUtils';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  message?: string;
}

class ImageUploadService {
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  async uploadImage(base64Image: string, filename?: string): Promise<UploadResult> {
    try {
      const blob = await this.base64ToBlob(base64Image);
      const formData = new FormData();
      const file = new File([blob], filename || `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
      formData.append('image', file);

      const response = await fetch(`${this.backendUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      return {
        success: true,
        url: data.url,
        filename: data.filename
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async compressAndUpload(
    base64Image: string,
    maxWidth: number = 1600,
    maxHeight: number = 1600,
    quality: number = 0.8
  ): Promise<UploadResult> {
    try {
      const compressedImage = await compressImage(base64Image, maxWidth, maxHeight, quality);
      return await this.uploadImage(compressedImage);
    } catch (error) {
      console.error('Compress and upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Compress and upload failed'
      };
    }
  }

  async uploadMultipleImages(base64Images: string[]): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const image of base64Images) {
      const result = await this.compressAndUpload(image);
      results.push(result);
    }
    return results;
  }

  private base64ToBlob(base64: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: mimeString }));
      } catch (error) {
        reject(error);
      }
    });
  }

  getImageUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    const backendUrl = this.backendUrl.replace(/\/$/, '');
    return `${backendUrl}${relativePath}`;
  }
}

export const imageUploadService = new ImageUploadService();