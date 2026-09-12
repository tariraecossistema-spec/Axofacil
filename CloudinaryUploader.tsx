import React, { useState, useRef } from 'react';
import { uploadToCloudinary, isCloudinaryConfigured, CLOUD_NAME, CloudinaryUploadResult } from "./cloudinary";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  Camera
} from 'lucide-react';
import { notify } from "./dialogs";

export interface CloudinaryUploaderProps {
  label?: string;
  helperText?: string;
  acceptTypes?: string;
  folder?: string;
  onUploadSuccess: (url: string, result?: CloudinaryUploadResult) => void;
  currentUrl?: string;
  buttonText?: string;
  userId?: string;
  allowCamera?: boolean;
}

export default function CloudinaryUploader({
  label = 'Carregar Ficheiro para Nuvem Cloudinary',
  helperText,
  acceptTypes = 'image/*,.pdf',
  folder = 'axofacil_uploads',
  onUploadSuccess,
  currentUrl,
  buttonText = 'Selecionar Ficheiro',
  userId,
  allowCamera = true
}: CloudinaryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentUrl || '');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('O ficheiro excede o tamanho máximo permitido de 10MB.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      const res = await uploadToCloudinary(file, folder, userId);
      setPreviewUrl(res.secure_url);
      setSuccessMsg(`Ficheiro "${file.name}" carregado com sucesso no Cloudinary!`);
      onUploadSuccess(res.secure_url, res);
      notify('Ficheiro carregado com sucesso para a Cloud!', 'success');
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      const errMsg = err?.message || 'Erro ao carregar no Cloudinary. Verifique as credenciais no .env';
      setError(errMsg);
      notify(errMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleCopy = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    notify('URL copiado para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const isPdf = previewUrl.toLowerCase().includes('.pdf') || previewUrl.toLowerCase().includes('/raw/upload');

  return (
    <div className="space-y-2.5 text-xs">
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="block font-bold text-ink/80">{label}</label>
        {isCloudinaryConfigured ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Cloudinary: {CLOUD_NAME}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Modo Local / Demo
          </span>
        )}
      </div>

      {helperText && <p className="text-[11px] text-ink/60">{helperText}</p>}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center gap-3 ${
          dragOver
            ? 'border-indigo-brand bg-indigo-50/50 scale-[1.01]'
            : 'border-ink/15 hover:border-indigo-brand/50 bg-sand-2/30'
        }`}
      >
        {/* Upload Buttons and Actions */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="py-2 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-xs shrink-0 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>A carregar no Cloudinary...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-amber-300" />
                <span>{buttonText}</span>
              </>
            )}
          </button>

          {allowCamera && (
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="py-2 px-3 bg-sand-2 hover:bg-sand-3 text-ink font-bold border border-ink/15 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
              title="Tirar foto com a câmera"
            >
              <Camera className="w-4 h-4 text-indigo-deep" />
              <span>Câmara</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-ink/50">
          Ou arraste e solte o ficheiro aqui (JPG, PNG, WEBP, PDF até 10MB)
        </p>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Preview Card */}
      {previewUrl && (
        <div className="flex items-center gap-3 bg-paper border border-ink/12 p-3 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
          {isPdf ? (
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-sand-2 border border-ink/10 overflow-hidden shrink-0">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-ink/50 block">URL Gerado</span>
            <p className="text-xs font-mono text-ink/80 truncate">{previewUrl}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 hover:bg-sand-2 rounded-lg text-ink/70 hover:text-ink transition-colors cursor-pointer"
              title="Copiar URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 hover:bg-sand-2 rounded-lg text-indigo-deep transition-colors cursor-pointer"
              title="Visualizar ficheiro original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                onUploadSuccess('');
              }}
              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="Remover ficheiro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error & Success notifications */}
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] font-medium text-red-700 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-medium text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
