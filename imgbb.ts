import { uploadToCloudinary, isCloudinaryConfigured } from './cloudinary';

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

export async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = getEnvVar('VITE_IMGBB_API_KEY');

  // If ImgBB key is configured, attempt upload to ImgBB
  if (apiKey && apiKey !== 'your_imgbb_key') {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.url) {
          return data.data.url;
        }
      }
    } catch (e) {
      console.warn('ImgBB upload error, falling back:', e);
    }
  }

  // If Cloudinary is configured, use Cloudinary
  if (isCloudinaryConfigured) {
    try {
      const result = await uploadToCloudinary(file, 'axofacil_uploads');
      if (result?.secure_url) {
        return result.secure_url;
      }
    } catch (e) {
      console.warn('Cloudinary upload error, falling back:', e);
    }
  }

  // Fallback: Read as base64 data URL so it displays and persists in local storage
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}
