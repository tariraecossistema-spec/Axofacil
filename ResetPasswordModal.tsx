import React, { useState } from 'react';
import { Key, Lock, Eye, EyeOff, X, Check, RefreshCw, AlertCircle, Sparkles, Mail } from 'lucide-react';
import { handleForgotPassword, handleUpdatePassword, isSupabaseConfigured } from "./supabase";
import { notify } from "./dialogs";

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'request' | 'update';
  defaultEmail?: string;
  onSuccess?: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  initialMode = 'request',
  defaultEmail = '',
  onSuccess
}: ResetPasswordModalProps) {
  const [mode, setMode] = useState<'request' | 'update'>(initialMode);
  
  // Request mode state
  const [email, setEmail] = useState(defaultEmail);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Update mode state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    if (defaultEmail) setEmail(defaultEmail);
  }, [initialMode, defaultEmail, isOpen]);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    setRequestSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setRequestError('Por favor introduza o seu e-mail.');
      return;
    }

    setRequestLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleForgotPassword(cleanEmail);
        setRequestSuccessMsg(msg);
        notify('Link de recuperação enviado com sucesso!', 'success');
      } else {
        setRequestSuccessMsg(`Link de recuperação simulado com sucesso para ${cleanEmail}. Em produção com Supabase, o e-mail será enviado.`);
        notify('Modo local: link gerado com sucesso.', 'info');
      }
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setRequestError(err?.message || 'Erro ao enviar o link de recuperação. Verifique o e-mail.');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccessMsg(null);

    if (newPassword.length < 6) {
      setUpdateError('A palavra-passe deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError('As palavras-passe não coincidem.');
      return;
    }

    setUpdateLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleUpdatePassword(newPassword, confirmPassword);
        setUpdateSuccessMsg(msg);
        notify('Palavra-passe atualizada com sucesso no Supabase!', 'success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      } else {
        setUpdateSuccessMsg('Palavra-passe atualizada com sucesso no modo local!');
        notify('Palavra-passe atualizada!', 'success');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      setUpdateError(err?.message || 'Erro ao atualizar a palavra-passe.');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-paper border border-ink/15 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink rounded-full hover:bg-sand-2 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 text-amber-900 flex items-center justify-center">
            {mode === 'request' ? <Key className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-indigo-deep">
              {mode === 'request' ? 'Recuperação de Palavra-passe' : 'Definir Nova Palavra-passe'}
            </h3>
            <span className="text-[11px] text-ink/60 font-medium">Axofácil! Maputo • Supabase Auth</span>
          </div>
        </div>

        {/* Mode switcher tabs */}
        <div className="grid grid-cols-2 p-1 bg-sand-2 rounded-xl border border-ink/10 mb-5 gap-1">
          <button
            type="button"
            onClick={() => setMode('request')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'request'
                ? 'bg-paper text-indigo-deep shadow-xs'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Pedir Link</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('update')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'update'
                ? 'bg-paper text-indigo-deep shadow-xs'
                : 'text-ink/60 hover:text-ink'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Nova Senha</span>
          </button>
        </div>

        {/* REQUEST LINK FORM */}
        {mode === 'request' && (
          <div>
            <p className="text-xs text-ink/70 mb-4 leading-relaxed">
              Introduza o seu e-mail cadastrado no Axofácil!. Enviaremos uma ligação segura para redefinir a sua palavra-passe.
            </p>

            {requestSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>E-mail de Recuperação Enviado</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-emerald-900">
                  {requestSuccessMsg}
                </p>
                <p className="text-[11px] text-emerald-800/80 italic pt-1 border-t border-emerald-200">
                  💡 Verifique a pasta de Entrada e Spam. Ao clicar no link do e-mail, será redirecionado para redefinir a palavra-passe.
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('update')}
                    className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                  >
                    Já tenho o Link / Código
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 bg-sand-2 hover:bg-sand-3 text-ink font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">O seu E-mail *</label>
                  <input
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                  />
                </div>

                {requestError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{requestError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {requestLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>A enviar solicitação...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 text-amber-300" />
                      <span>Enviar Link de Recuperação</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* UPDATE PASSWORD FORM */}
        {mode === 'update' && (
          <div>
            <p className="text-xs text-ink/70 mb-4 leading-relaxed">
              Defina uma nova palavra-passe forte com pelo menos 6 caracteres.
            </p>

            {updateSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Palavra-passe Redefinida!</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-emerald-900">
                  {updateSuccessMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Nova Palavra-passe *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full p-3 pr-10 bg-paper border border-ink/15 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Confirmar Nova Palavra-passe *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a palavra-passe"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full p-3 pr-10 bg-paper border border-ink/15 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {updateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{updateError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {updateLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>A gravar nova palavra-passe...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gravar Nova Palavra-passe</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
