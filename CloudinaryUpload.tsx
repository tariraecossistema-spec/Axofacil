import React, { useState, useRef } from 'react';
import { uploadToCloudinary, isCloudinaryConfigured } from "./cloudinary";
import { Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

interface CloudinaryUploadProps {
  label?: string;
  acceptTypes?: string;
  folder?: string;
  onUploadSuccess: (url: string, fileDetails?: any) => void;
  currentUrl?: string;
  buttonText?: string;
}

export default function CloudinaryUpload({
  label = 'Upload de Imagem ou Documento PDF',
  acceptTypes = 'image/*,.pdf',
  folder = 'axofacil_portal',
  onUploadSuccess,
  currentUrl,
  buttonText = 'Carregar Ficheiro (PDF ou Imagem)'
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const res = await uploadToCloudinary(file, folder);
      setPreviewUrl(res.secure_url);
      setSuccessMsg(`Ficheiro "${file.name}" carregado com sucesso!`);
      onUploadSuccess(res.secure_url, res);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setError(err?.message || 'Falha ao realizar upload. Verifica as credenciais do Cloudinary.');
    } finally {
      setUploading(false);
    }
  };

  const isPdf = previewUrl.toLowerCase().includes('.pdf') || previewUrl.toLowerCase().includes('/raw/upload');

  return (
    <div className="space-y-2 text-xs">
      {label && <label className="block font-bold text-ink/75">{label}</label>}

      {!isCloudinaryConfigured && (
        <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Cloudinary em modo demonstração local. Para guardar na nuvem, adicione VITE_CLOUDINARY_CLOUD_NAME no .env</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs shrink-0"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              <span>A carregar no Cloudinary...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 text-amber-300" />
              <span>{buttonText}</span>
            </>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl && (
          <div className="flex items-center gap-2 bg-sand-2/40 border border-ink/12 p-2 rounded-xl flex-grow overflow-hidden">
            {isPdf ? (
              <FileText className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <ImageIcon className="w-5 h-5 text-indigo-brand shrink-0" />
            )}
            <span className="text-[11px] font-mono text-ink/80 truncate flex-1">{previewUrl}</span>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-paper rounded-lg text-indigo-deep transition-colors"
              title="Abrir ficheiro em novo separador"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setPreviewUrl('')}
              className="p-1 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
              title="Remover ficheiro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}

      {successMsg && (
        <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>{successMsg}</span>
        </p>
      )}
    </div>
  );
}
