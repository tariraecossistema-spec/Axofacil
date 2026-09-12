import { getSupabaseClient } from './supabase';

/**
 * Cloudinary Upload Service for Images, PDFs and Documents
 */

function getEnvVar(key: string): string {
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch (_) {}
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key] || '';
    }
  } catch (_) {}
  return '';
}

export const CLOUD_NAME = getEnvVar('VITE_CLOUDINARY_CLOUD_NAME') || getEnvVar('CLOUDINARY_CLOUD_NAME');
export const UPLOAD_PRESET = getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET') || getEnvVar('CLOUDINARY_UPLOAD_PRESET') || 'axofacil_maputo_preset';

export const isCloudinaryConfigured = Boolean(CLOUD_NAME) && CLOUD_NAME !== 'your_cloud_name';

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  original_filename?: string;
}

/**
 * Uploads a file (PDF, JPG, PNG, WEBP) to Cloudinary and registers in Supabase media table
 */
export async function uploadToCloudinary(
  file: File, 
  folder: string = 'axofacil_uploads',
  userId?: string
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    // Fallback message or simulated upload for dev preview if keys are missing
    console.warn('Cloudinary keys missing. Falling back to Object URL for preview.');
    const previewUrl = URL.createObjectURL(file);
    return {
      url: previewUrl,
      secure_url: previewUrl,
      public_id: `local_${Date.now()}`,
      format: file.type.split('/')[1] || 'pdf',
      resource_type: file.type.startsWith('image/') ? 'image' : 'raw',
      bytes: file.size,
      original_filename: file.name
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const resourceType = file.type.includes('pdf') ? 'raw' : 'auto';
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'Erro ao carregar ficheiro no Cloudinary. Verifique se o Upload Preset está configurado como Unsigned no painel do Cloudinary.');
  }

  const result: CloudinaryUploadResult = await response.json();

  // Automatically register in Supabase media table if configured
  try {
    const supabase = getSupabaseClient();
    if (supabase && result.secure_url) {
      await supabase.from('media').insert({
        user_id: userId || null,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        public_url: result.secure_url,
        cloudinary_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        folder: folder
      });
    }
  } catch (syncErr) {
    console.warn('Supabase media sync note:', syncErr);
  }

  return result;
}

/**
 * Returns optimized URL for Cloudinary image with auto format & quality
 */
export function getOptimizedCloudinaryUrl(
  url: string, 
  options: { width?: number; height?: number; crop?: string; quality?: string | number } = {}
): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const transforms: string[] = ['f_auto', `q_${quality}`];

  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);

  const transformString = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

