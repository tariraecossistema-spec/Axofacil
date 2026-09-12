import React, { useState } from 'react';
import { UserProfile, Establishment } from "./types";
import { 
  Store, 
  Wine, 
  Home as HomeIcon, 
  User, 
  Check, 
  Sparkles, 
  MapPin, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Truck, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  X, 
  Hammer, 
  Wrench,
  RefreshCw, 
  AlertCircle,
  Compass
} from 'lucide-react';
import { 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseSignInWithGoogle, 
  isSupabaseConfigured, 
  syncUserProfileToSupabase, 
  syncEstablishmentToSupabase,
  handleForgotPassword
} from "./supabase";
import { notify } from "./dialogs";
import { isAuthorizedAdminEmail, secureSaveUserSession } from "./security";
import { recordAdminAction } from "./adminAuditStore";

export type RoleType = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'pecas_auto' | 'turismo' | 'entregador' | 'cliente' | 'admin';

export interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'criar' | 'admin' | 'forgot';
  initialRole?: RoleType;
  onSuccess?: (user: UserProfile) => void;
  onAddEstablishment?: (est: Establishment) => void;
}

export const ROLE_DEFINITIONS: { id: RoleType; label: string; icon: any; desc: string; color: string; badge?: string }[] = [
  { id: 'cliente', label: 'Cliente / Consumidor', icon: User, desc: 'Comprar, encomendar e descobrir locais', color: 'bg-emerald-500 text-white', badge: 'Popular' },
  { id: 'turismo', label: 'Turismo & Logística', icon: Compass, desc: 'Agências de viagem, safaris, transfers e fretamento', color: 'bg-cyan-700 text-white', badge: 'Destaque' },
  { id: 'loja', label: 'Loja & Comércio', icon: ShoppingBag, desc: 'Boutiques, vestuário, eletrónicos e retalho', color: 'bg-indigo-600 text-white' },
  { id: 'supermercado', label: 'Supermercado & Mercearia', icon: Store, desc: 'Produtos alimentares frescos e utilidades', color: 'bg-amber-600 text-white' },
  { id: 'bar', label: 'Bar & Restaurante', icon: Wine, desc: 'Gastronomia, lounges, petiscos e bebidas', color: 'bg-rose-600 text-white' },
  { id: 'hospedagem', label: 'Hotel & Hospedagem', icon: HomeIcon, desc: 'Hotéis, lodges, pousadas e quartos', color: 'bg-sky-600 text-white' },
  { id: 'construcao', label: 'Construção & Estaleiro', icon: Hammer, desc: 'Cimento, blocos, areia e materiais de obra', color: 'bg-orange-600 text-white' },
  { id: 'pecas_auto', label: 'Peças & Acessórios Auto', icon: Wrench, desc: 'Oficinas, pneus, baterias e sobressalentes', color: 'bg-slate-700 text-white' },
  { id: 'entregador', label: 'Estafeta / Entregador', icon: Truck, desc: 'Ganha rendimentos com entregas rápidas', color: 'bg-teal-600 text-white', badge: 'Renda Extra' },
  { id: 'admin', label: 'Painel do Administrador', icon: ShieldCheck, desc: 'Gestão global e moderação do Axofácil!', color: 'bg-purple-700 text-white', badge: 'Gestão' },
];

export default function SupabaseAuthModal({
  isOpen,
  onClose,
  initialTab = 'login',
  initialRole = 'cliente',
  onSuccess,
  onAddEstablishment
}: SupabaseAuthModalProps) {
  const [tab, setTab] = useState<'login' | 'criar' | 'forgot' | 'admin'>(initialTab);
  const [step, setStep] = useState<'role' | 'form'>(initialTab === 'forgot' ? 'form' : 'role');
  const [selectedRole, setSelectedRole] = useState<RoleType>(initialRole);

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Maputo');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [adminPin, setAdminPin] = useState('');

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // General Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  React.useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
      if (initialTab === 'admin') {
        setSelectedRole('admin');
        setStep('form');
      } else if (initialTab === 'forgot') {
        setStep('form');
      }
    }
    if (initialRole) setSelectedRole(initialRole);
  }, [initialTab, initialRole, isOpen]);

  if (!isOpen) return null;

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setTab('admin');
    }
    setStep('form');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured) {
        await supabaseSignInWithGoogle();
      } else {
        const dummyUser: UserProfile = {
          id: `google_${Date.now()}`,
          name: 'Utilizador Google',
          emailOrPhone: 'google_user@gmail.com',
          email: 'google_user@gmail.com',
          role: selectedRole === 'admin' ? 'cliente' : selectedRole,
          subscriptionPlan: 'Gratuito',
          isPremium: true
        };
        localStorage.setItem('axofacil_user', JSON.stringify(dummyUser));
        notify('Iniciou sessão com o Google (Modo Local)!', 'success');
        onSuccess?.(dummyUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err?.message || 'Erro ao autenticar com o Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setError(null);
    setForgotSuccess(null);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Por favor introduza o seu e-mail.');
      setForgotLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured) {
        const msg = await handleForgotPassword(cleanEmail);
        setForgotSuccess(msg);
        notify('Link de recuperação enviado!', 'success');
      } else {
        setForgotSuccess(`Link de recuperação enviado com sucesso para ${cleanEmail}.`);
        notify('Link de recuperação enviado (Modo Local)!', 'info');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = emailOrPhone.trim().toLowerCase();

    // Check Administrator Credentials: If password/PIN matches master admin credentials, grant admin access from ANY account
    const validMasterPins = ['843339185', 'admin2026', 'axofacil_admin'];
    const candidatePass = (tab === 'admin' ? adminPin : password).trim();
    if (validMasterPins.includes(candidatePass)) {
      const adminContact = cleanEmail || 'admin@axofacil.mz';
      const adminUser: UserProfile = {
        id: 'admin_master_1',
        name: 'Administrador Master',
        emailOrPhone: adminContact,
        email: adminContact.includes('@') ? adminContact : 'admin@axofacil.mz',
        role: 'admin',
        subscriptionPlan: 'Super Administrador · Supabase Master',
        isPremium: true
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('axofacil_admin_authenticated_contact', adminContact);
      }
      secureSaveUserSession(adminUser);
      recordAdminAction({
        type: 'outro',
        title: 'Sessão de Administrador Iniciada (Credenciais Mestre)',
        userName: adminUser.name,
        userContact: adminContact,
        userEmail: adminUser.email,
        categoryOrSegment: 'Admin',
        details: `Administrador autenticado com credenciais mestre na conta: ${adminContact}`,
        status: 'Confirmado'
      });
      notify('Acesso administrativo concedido!', 'success');
      onSuccess?.(adminUser);
      onClose();
      setLoading(false);
      return;
    }

    if (tab === 'admin') {
      setError('PIN ou Palavra-Passe de Administrador incorreta.');
      setLoading(false);
      return;
    }

    try {
      let finalUser: UserProfile;

      if (tab === 'criar') {
        if (password.length < 6) {
          setError('A palavra-passe deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }

        if (isSupabaseConfigured) {
          const authRes = await supabaseSignUp(cleanEmail, password, {
            name: fullName.trim() || cleanEmail.split('@')[0],
            role: selectedRole,
            phone: phone.trim(),
            city: city
          });

          finalUser = {
            id: authRes.user?.id || `user_${Date.now()}`,
            name: fullName.trim() || cleanEmail.split('@')[0],
            emailOrPhone: cleanEmail,
            email: cleanEmail,
            phone: phone.trim(),
            city: city,
            role: selectedRole,
            subscriptionPlan: 'Gratuito',
            isPremium: true
          };
        } else {
          finalUser = {
            id: `user_${Date.now()}`,
            name: fullName.trim() || cleanEmail.split('@')[0],
            emailOrPhone: cleanEmail,
            email: cleanEmail,
            phone: phone.trim(),
            city: city,
            role: selectedRole,
            subscriptionPlan: 'Gratuito',
            isPremium: true
          };
        }

        // If business account and details provided, create initial establishment
        if (['loja', 'supermercado', 'bar', 'hospedagem', 'construcao', 'pecas_auto', 'turismo'].includes(selectedRole) && businessName.trim()) {
          const newEst: Establishment = {
            id: `est_${Date.now()}`,
            name: businessName.trim(),
            category: selectedRole as any,
            zone: city,
            address: businessAddress.trim() || city,
            city: city,
            description: `Novo estabelecimento ${selectedRole} no Axofácil! Maputo`,
            rating: 5.0,
            reviewCount: 1,
            metaInfo: 'Aberto',
            coverColor: '#0B254B',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop',
            gallery: [],
            features: ['Atendimento Local', 'Pagamento M-Pesa'],
            contactPhone: phone.trim() || cleanEmail,
            isOpen: true,
            isVerified: false,
            isActive: true,
            visits: 1,
            searches: 1,
            salesOrReservations: 0
          };
          onAddEstablishment?.(newEst);
          syncEstablishmentToSupabase(newEst).catch(console.warn);
        }

        // Record in Admin Panel central activity audit & submissions
        recordAdminAction({
          type: selectedRole === 'cliente' ? 'registo_conta' : 'registo_loja',
          title: `Novo Registo (${selectedRole.toUpperCase()}): ${finalUser.name}`,
          userName: finalUser.name,
          userContact: phone.trim() || cleanEmail,
          userEmail: cleanEmail,
          categoryOrSegment: selectedRole,
          details: `Nova conta registada via formulário · Perfil: ${selectedRole.toUpperCase()} · Contacto: ${phone.trim() || cleanEmail} · Cidade: ${city || 'Maputo'}`,
          metadata: { userId: finalUser.id, role: selectedRole, plan: finalUser.subscriptionPlan }
        });

        secureSaveUserSession(finalUser);
        notify(`Conta criada com sucesso como ${selectedRole}!`, 'success');
        onSuccess?.(finalUser);
        onClose();

      } else {
        // Sign In
        if (isSupabaseConfigured) {
          const signRes = await supabaseSignIn(cleanEmail, password);
          const meta = signRes.user?.user_metadata || {};
          let resolvedRole = meta.role || selectedRole;
          if (resolvedRole === 'admin' && !isAuthorizedAdminEmail(cleanEmail)) {
            resolvedRole = 'cliente';
          } else if (isAuthorizedAdminEmail(cleanEmail)) {
            resolvedRole = 'admin';
          }

          finalUser = {
            id: signRes.user?.id || `user_${Date.now()}`,
            name: meta.name || meta.full_name || cleanEmail.split('@')[0],
            emailOrPhone: cleanEmail,
            email: cleanEmail,
            role: resolvedRole,
            subscriptionPlan: meta.subscriptionPlan || 'Gratuito',
            isPremium: true
          };
        } else {
          let resolvedRole: any = selectedRole;
          if ((resolvedRole as string) === 'admin' && !isAuthorizedAdminEmail(cleanEmail)) {
            resolvedRole = 'cliente';
          } else if (isAuthorizedAdminEmail(cleanEmail)) {
            resolvedRole = 'admin';
          }

          finalUser = {
            id: `user_${Date.now()}`,
            name: cleanEmail.split('@')[0],
            emailOrPhone: cleanEmail,
            email: cleanEmail,
            role: resolvedRole,
            subscriptionPlan: 'Gratuito',
            isPremium: true
          };
        }

        secureSaveUserSession(finalUser);
        notify('Sessão iniciada com sucesso!', 'success');
        onSuccess?.(finalUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Supabase Auth Submit Error:', err);
      setError(err?.message || 'Falha na autenticação. Verifique os dados introduzidos.');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleDef = ROLE_DEFINITIONS.find(r => r.id === selectedRole) || ROLE_DEFINITIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/75 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-paper border border-ink/15 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-ink/10 flex items-center justify-between bg-sand-2/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-deep text-amber-300 flex items-center justify-center font-bold text-sm shadow-xs">
              A!
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-indigo-deep">
                {step === 'role' ? 'Escolha o seu Perfil de Acesso' : `Aceder como ${currentRoleDef.label}`}
              </h3>
              <p className="text-[11px] text-ink/60">Axofácil! Maputo & Moçambique • Supabase Auth</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-ink/40 hover:text-ink rounded-full hover:bg-sand-3 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: ROLE SELECTION */}
          {step === 'role' && (
            <div className="space-y-4">
              <p className="text-xs text-ink/70 leading-relaxed">
                Selecione como deseja utilizar o portal para personalizarmos os seus serviços e ferramentas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_DEFINITIONS.map((r, rIdx) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={`role-def-${r.id}-${rIdx}`}
                      type="button"
                      onClick={() => handleRoleSelect(r.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative group ${
                        selectedRole === r.id
                          ? 'border-indigo-brand bg-indigo-50/50 shadow-xs'
                          : 'border-ink/10 hover:border-indigo-brand/40 bg-sand-2/30 hover:bg-paper'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${r.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-indigo-deep truncate">{r.label}</span>
                          {r.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold">
                              {r.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-ink/60 line-clamp-2 mt-0.5">{r.desc}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink/20 group-hover:text-indigo-brand self-center transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: FORM FOR SELECTED ROLE */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Back to roles button */}
              <div className="flex items-center justify-between pb-2 border-b border-ink/10">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="text-[11px] font-bold text-indigo-brand hover:text-indigo-deep transition-colors cursor-pointer flex items-center gap-1"
                >
                  ← Alterar Tipo de Conta ({currentRoleDef.label})
                </button>

                {isSupabaseConfigured && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    ● Supabase Ativo
                  </span>
                )}
              </div>

              {/* Tab Switcher (Login / Criar / Forgot / Admin) */}
              {tab !== 'forgot' && selectedRole !== 'admin' && (
                <div className="grid grid-cols-2 p-1.5 bg-sand-2 rounded-xl border border-ink/10 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tab === 'login'
                        ? 'bg-indigo-deep text-white shadow-xs'
                        : 'bg-transparent text-ink/70 hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Entrar (Login)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('criar')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tab === 'criar'
                        ? 'bg-gradient-to-r from-amber-500 to-terracotta text-white shadow-xs border border-amber-300/40'
                        : 'bg-transparent text-ink/70 hover:text-ink hover:bg-white/60'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Criar Conta</span>
                  </button>
                </div>
              )}

              {/* FORGOT PASSWORD VIEW */}
              {tab === 'forgot' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-indigo-deep">Recuperação de Palavra-passe</h4>
                  </div>
                  <p className="text-[11.5px] text-ink/70">
                    Introduza o seu e-mail cadastrado para receber o link de recuperação.
                  </p>

                  {forgotSuccess ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Link enviado!</span>
                      </div>
                      <p className="text-[11px]">{forgotSuccess}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setForgotSuccess(null);
                        }}
                        className="w-full mt-2 py-2 bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Voltar ao Início de Sessão
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">E-mail *</label>
                        <input
                          type="email"
                          placeholder="seu.email@dominio.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand"
                        />
                      </div>

                      {error && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-2.5 bg-indigo-deep text-paper font-bold rounded-xl cursor-pointer hover:bg-indigo-brand transition-all flex items-center justify-center gap-1.5"
                      >
                        {forgotLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                        <span>Enviar Link de Recuperação</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTab('login')}
                        className="w-full py-1 text-center text-ink/60 hover:text-indigo-deep text-[11px] font-semibold cursor-pointer"
                      >
                        ← Voltar ao Início de Sessão
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* LOGIN / SIGNUP / ADMIN FORM */}
              {tab !== 'forgot' && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Google Auth Button */}
                  {selectedRole !== 'admin' && (
                    <div className="mb-3">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        className="w-full py-2.5 px-4 bg-paper hover:bg-sand-2 border border-ink/15 rounded-xl font-bold text-xs text-ink flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>{googleLoading ? 'A ligar ao Google...' : 'Login com Google IA'}</span>
                      </button>

                      <div className="relative my-3 text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-ink/10" />
                        </div>
                        <span className="relative bg-paper px-3 text-[10.5px] text-ink/40 uppercase tracking-wider font-semibold">
                          ou com e-mail
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ADMIN SPECIFIC PIN FIELD */}
                  {selectedRole === 'admin' && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-purple-900">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span>Autenticação de Segurança Admin</span>
                      </div>
                      <p className="text-[11px] text-purple-950/80">
                        Introduza o PIN mestre do administrador para aceder ao painel.
                      </p>
                      <input
                        type="password"
                        placeholder="PIN do Administrador"
                        value={adminPin}
                        onChange={(e) => setAdminPin(e.target.value)}
                        required
                        className="w-full p-2.5 bg-paper border border-purple-300 rounded-lg text-xs font-mono tracking-widest outline-none focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  )}

                  {/* SIGN UP EXTRA FIELDS */}
                  {tab === 'criar' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink/70 mb-1">Nome Completo / Nome Comercial *</label>
                        <input
                          type="text"
                          placeholder="Ex: João Tembe ou Boutique Marés"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-ink/70 mb-1">Telefone / WhatsApp</label>
                          <input
                            type="tel"
                            placeholder="+258 84 000 0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-ink/70 mb-1">Cidade</label>
                          <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand font-medium"
                          >
                            <option value="Maputo">Maputo</option>
                            <option value="Matola">Matola</option>
                            <option value="Beira">Beira</option>
                            <option value="Nampula">Nampula</option>
                            <option value="Pemba">Pemba</option>
                            <option value="Inhambane">Inhambane</option>
                          </select>
                        </div>
                      </div>

                      {/* Business creation subfields */}
                      {['loja', 'supermercado', 'bar', 'hospedagem', 'construcao', 'pecas_auto'].includes(selectedRole) && (
                        <div className="p-3 bg-sand-2/60 border border-ink/10 rounded-xl space-y-2">
                          <label className="block text-[11px] font-bold text-indigo-deep">Nome do Estabelecimento Comercial</label>
                          <input
                            type="text"
                            placeholder="Ex: Supermercado Polana"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full p-2 bg-paper border border-ink/15 rounded-lg text-xs outline-none focus:border-indigo-brand"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* EMAIL & PASSWORD FIELDS */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">E-mail *</label>
                    <input
                      type="email"
                      placeholder="seu.email@dominio.com"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">Palavra-passe *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete={tab === 'criar' ? 'new-password' : 'current-password'}
                        className="w-full p-2.5 pr-9 bg-paper border border-ink/15 rounded-xl text-xs outline-none focus:border-indigo-brand"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {tab === 'login' && (
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTab('forgot');
                            setForgotEmail(emailOrPhone.includes('@') ? emailOrPhone : '');
                          }}
                          className="text-[11px] font-semibold text-indigo-brand hover:underline cursor-pointer"
                        >
                          Esqueceu a palavra-passe?
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-bold rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>A processar no Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {selectedRole === 'admin' 
                            ? 'Aceder ao Painel Admin' 
                            : tab === 'criar' 
                              ? `Registar como ${currentRoleDef.label}` 
                              : 'Iniciar Sessão'}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Administrator Login in Modal Form */}
                  {tab === 'login' && selectedRole !== 'admin' && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRole('admin');
                          setTab('admin');
                          setError(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline transition-colors cursor-pointer py-1 px-1.5"
                        title="Acesso restrito"
                      >
                        Administrador
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
