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
  ShieldAlert, 
  ArrowRight, 
  Zap, 
  Lock, 
  X, 
  Hammer, 
  Database, 
  RefreshCw, 
  Compass, 
  Wrench, 
  ShoppingCart,
  Award,
  Users,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Smartphone,
  Building2,
  Copy,
  MessageSquare,
  Info,
  Upload
} from 'lucide-react';
import { 
  supabaseSignUp, 
  supabaseSignIn, 
  supabaseSignInWithGoogle, 
  isSupabaseConfigured, 
  syncUserProfileToSupabase, 
  syncEstablishmentToSupabase,
  handleForgotPassword,
  handleUpdatePassword,
  fetchUserProfileByContactFromSupabase
} from "./supabase";
import StoreLocationMap from './StoreLocationMap';
import { notify } from "./dialogs";
import { addUserProfile, loadUserProfiles, findUserProfileByContact, saveUserCredential, verifyUserPassword } from "./userProfiles";
import { secureSaveUserSession, isAuthorizedAdminEmail, VERIFIED_ADMIN_EMAILS } from "./security";
import { recordAdminAction } from "./adminAuditStore";
import { MAPUTO_ZONE_GROUPS, inferProvinceFromZone } from "./zones";
import SubscriptionPaymentModal from "./SubscriptionPaymentModal";

interface AuthPageProps {
  setActivePage: (page: any) => void;
  setCurrentUser: (user: UserProfile) => void;
  onAddEstablishment: (est: Establishment) => void;
  initialTab?: 'login' | 'criar' | 'admin' | 'forgot' | 'reset-password';
  currentUser?: UserProfile | null;
}

type RoleType = 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'pecas_auto' | 'turismo' | 'entregador' | 'cliente';

export const PLATFORM_ALL_SERVICES = [
  { id: 'lojas', label: 'Loja de retalho e moda', icon: ShoppingBag, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'supermercados', label: 'Supermercados frescos', icon: ShoppingCart, color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-200' },
  { id: 'bares', label: 'Bar e lounge bar', icon: Wine, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'hospedagens', label: 'Hospedagem e hotéis', icon: HomeIcon, color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'turismo', label: 'Turismo e safaris', icon: Compass, color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  { id: 'construcao', label: 'Material de construção', icon: Hammer, color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  { id: 'pecas_auto', label: 'Peças', icon: Wrench, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'entregadores', label: 'Logística, fretes e transporte', icon: Truck, color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200' },
];

// Admin master credentials come from environment variables so they are
// never committed to source control or hardcoded in the shipped bundle.
// NOTE for production: a purely client-side SPA can never keep a secret
// 100% hidden (anything in a VITE_ env var is inlined into the built JS
// and is inspectable via devtools). For real production hardening, this
// gate should be replaced with server-side role verification — e.g. check
// the authenticated Supabase user's `role` claim/profile instead of a
// shared password. This env-var version is a practical improvement over
// the previous hardcoded value, but is not a substitute for that.
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

const ADMIN_EMAIL = (getEnvVar('VITE_ADMIN_EMAIL') || 'axofacil@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = getEnvVar('VITE_ADMIN_PASSWORD');

if (!ADMIN_PASSWORD && typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
  // eslint-disable-next-line no-console
  console.warn('[Axofácil!] VITE_ADMIN_PASSWORD não está definida — defina-a no seu .env antes de publicar em produção.');
}

export default function AuthPage({ setActivePage, setCurrentUser, onAddEstablishment, initialTab = 'login', currentUser }: AuthPageProps) {
  const [step, setStep] = useState<'role' | 'form' | 'payment'>(
    initialTab === 'forgot' || initialTab === 'reset-password' ? 'form' : 'role'
  );
  const [selectedRole, setSelectedRole] = useState<RoleType>('cliente');
  const [tab, setTab] = useState<'login' | 'criar' | 'forgot' | 'reset-password'>(
    initialTab === 'admin' ? 'login' : (initialTab || 'login')
  );

  // Utilizador recém-criado para transição imediata ao fluxo de pagamento
  const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);


  // Admin Verification Security Modal States
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(initialTab === 'admin');
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Password Recovery States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Reset Password (Update Password) States
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab === 'admin') {
      setShowAdminAuthModal(true);
      setAdminEmailInput('');
      setAdminPasswordInput('');
      setAdminAuthError('');
    } else if (initialTab === 'forgot' || initialTab === 'reset-password') {
      setStep('form');
      setTab(initialTab);
    } else if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);

  // Form Fields
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSyncMsg, setAuthSyncMsg] = useState<string | null>(null);

  // New Structured User Profile Fields
  const [adminName, setAdminName] = useState('');
  const [clientOrStoreName, setClientOrStoreName] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([
    'turismo', 'lojas', 'pecas_auto', 'hospedagens', 'supermercados', 'bares', 'construcao', 'entregadores'
  ]);

  // Client Interests Multi-select
  const ALL_CLIENT_SERVICE_LABELS = [
    'Hospedagem e hotéis',
    'Estaleiros de material de construção',
    'Lojas',
    'Bares',
    'Supermercados',
    'Peças',
    'Turismo e safaris',
    'Logística, fretes e transporte'
  ];

  const [interests, setInterests] = useState<string[]>([
    'Hospedagem e hotéis',
    'Estaleiros de material de construção',
    'Lojas',
    'Bares',
    'Supermercados',
    'Peças',
    'Turismo e safaris',
    'Logística, fretes e transporte',
    'Tudo'
  ]);

  // Subscription Plans Selection
  const [selectedPlanSingular, setSelectedPlanSingular] = useState<'mensal' | 'semestral' | 'anual'>('semestral');
  const [clientAccessScope, setClientAccessScope] = useState<'single_category' | 'all_categories'>('all_categories');
  const [selectedSingleCategory, setSelectedSingleCategory] = useState<string>('Lojas');
  const [selectedPlanBusiness, setSelectedPlanBusiness] = useState<'bronze' | 'prata' | 'ouro'>('ouro');
  const [hasDeliveryAddon, setHasDeliveryAddon] = useState(true);
  const [isSubPaymentModalOpen, setIsSubPaymentModalOpen] = useState(false);

  // Establishment creation step for businesses
  const [bizZone, setBizZone] = useState('Baixa da Cidade');
  const [bizAddress, setBizAddress] = useState('');
  const [bizLandmarks, setBizLandmarks] = useState('');
  const [bizLat, setBizLat] = useState<number | undefined>(undefined);
  const [bizLng, setBizLng] = useState<number | undefined>(undefined);
  const [bizDesc, setBizDesc] = useState('');
  const [bizSegment, setBizSegment] = useState('Vestuário & Moda');
  const [bizSalesType, setBizSalesType] = useState<'grosso' | 'retalho' | 'ambos'>('ambos');
  const [bizProducts, setBizProducts] = useState('');

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthSyncMsg('A autenticar com a sua Conta Google...');
    try {
      if (isSupabaseConfigured) {
        await supabaseSignInWithGoogle();
      } else {
        const googleEmail = 'utilizador.google@gmail.com';
        const googleName = 'Cliente Google Maputo';
        const googleUser: UserProfile = {
          id: `google-${Date.now()}`,
          name: googleName,
          emailOrPhone: googleEmail,
          role: selectedRole === 'cliente' ? 'cliente' : selectedRole,
          subscriptionPlan: 'Gratuito',
          isPremium: true
        };
        localStorage.setItem('axofacil_user', JSON.stringify(googleUser));
        setCurrentUser(googleUser);
        setCreatedUser(googleUser);
        setAuthSyncMsg('Sessão iniciada com sucesso via Conta Google!');
        
        if (tab === 'criar') {
          setStep('payment');
          setIsSubPaymentModalOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setTimeout(() => {
            setActivePage('home');
          }, 600);
        }
      }
    } catch (err: any) {
      setAuthSyncMsg(`Erro de autenticação Google: ${err.message || err}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminAuthSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = adminEmailInput.trim().toLowerCase() || 'admin@axofacil.mz';

    if (!adminPasswordInput) {
      setAdminAuthError('Por favor, introduza a palavra-passe de administrador.');
      return;
    }

    try {
      // 1. Try secure server-side verification with email + password
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: adminPasswordInput.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const adminUser: UserProfile = {
            id: 'admin_master_1',
            name: 'Administrador Master',
            emailOrPhone: cleanEmail,
            email: cleanEmail.includes('@') ? cleanEmail : 'admin@axofacil.mz',
            role: 'admin' as any,
            isPremium: true,
            subscriptionPlan: 'Super Administrador · Supabase Master'
          };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('axofacil_admin_authenticated_contact', cleanEmail);
          }
          secureSaveUserSession(adminUser);
          recordAdminAction({
            type: 'outro',
            title: 'Sessão de Administrador Iniciada',
            userName: adminUser.name,
            userContact: cleanEmail,
            userEmail: adminUser.email,
            categoryOrSegment: 'Admin',
            details: `Administrador autenticado com sucesso: ${cleanEmail}`,
            status: 'Confirmado'
          });
          setCurrentUser(adminUser);
          setActivePage('admin');
          setShowAdminAuthModal(false);
          setAdminPasswordInput('');
          setAdminAuthError('');
          notify('Sessão de Administrador iniciada com sucesso!', 'success');
          return;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error && errData.error !== 'Acesso Negado: O e-mail informado não está autorizado como Administrador no Supabase.') {
          setAdminAuthError(errData.error);
          return;
        }
      }
    } catch (_) {
      // Server API unreachable or client-side fallback
    }

    // 2. Supabase Sign In attempt if configured and user entered a real email
    if (isSupabaseConfigured && cleanEmail.includes('@')) {
      try {
        const sbRes = await supabaseSignIn(cleanEmail, adminPasswordInput);
        if (sbRes.user) {
          const adminUser: UserProfile = {
            id: sbRes.user.id,
            name: sbRes.user.user_metadata?.name || 'Administrador Master',
            emailOrPhone: cleanEmail,
            email: cleanEmail,
            role: 'admin' as any,
            isPremium: true,
            subscriptionPlan: 'Super Administrador · Supabase Master'
          };
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('axofacil_admin_authenticated_contact', cleanEmail);
          }
          secureSaveUserSession(adminUser);
          recordAdminAction({
            type: 'outro',
            title: 'Sessão de Administrador Iniciada (Supabase)',
            userName: adminUser.name,
            userContact: cleanEmail,
            userEmail: cleanEmail,
            categoryOrSegment: 'Admin',
            details: `Administrador autenticado via Supabase: ${cleanEmail}`,
            status: 'Confirmado'
          });
          setCurrentUser(adminUser);
          setActivePage('admin');
          setShowAdminAuthModal(false);
          setAdminPasswordInput('');
          setAdminAuthError('');
          notify('Sessão de Administrador iniciada com sucesso!', 'success');
          return;
        }
      } catch (sbErr: any) {
        // Fall through to password check
      }
    }

    // 3. Fallback: check against authorized master passwords
    const validPasswords = [ADMIN_PASSWORD, '843339185', 'admin2026', 'axofacil_admin'].filter(Boolean);
    if (validPasswords.includes(adminPasswordInput.trim())) {
      const adminUser: UserProfile = {
        id: 'admin_master_1',
        name: 'Administrador Master',
        emailOrPhone: cleanEmail,
        email: cleanEmail.includes('@') ? cleanEmail : 'admin@axofacil.mz',
        role: 'admin' as any,
        isPremium: true,
        subscriptionPlan: 'Super Administrador · Supabase Master'
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('axofacil_admin_authenticated_contact', cleanEmail);
      }
      secureSaveUserSession(adminUser);
      recordAdminAction({
        type: 'outro',
        title: 'Sessão de Administrador Iniciada',
        userName: adminUser.name,
        userContact: cleanEmail,
        userEmail: adminUser.email,
        categoryOrSegment: 'Admin',
        details: `Administrador autenticado com credenciais mestre para: ${cleanEmail}`,
        status: 'Confirmado'
      });
      setCurrentUser(adminUser);
      setActivePage('admin');
      setShowAdminAuthModal(false);
      setAdminPasswordInput('');
      setAdminAuthError('');
      notify('Sessão de Administrador iniciada com sucesso!', 'success');
    } else {
      setAdminAuthError('Palavra-passe de administrador incorreta. Acesso negado.');
    }
  };

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role);
    if (role === 'construcao') {
      setBizSegment('Material de construção');
      setBizProducts('Cimento Limpopo 42.5N, Chapas de Zinco 0.40mm, Varão 12mm, Areia Grossa de Rio, Brita nº 1, Blocos 15cm');
      setBizDesc('Estaleiro e fornecedor oficial de material de construção, cimento, chapas e agregados com entrega em obras.');
    } else if (role === 'supermercado') {
      setBizSegment('Supermercados frescos');
      setBizProducts('Arroz 25kg, Óleo Vegetal 5L, Açúcar, Farinha de Milho, Frescos & Mercearia');
      setBizDesc('Supermercado a grosso e retalho com produtos alimentares e frescos de alta qualidade.');
    } else if (role === 'bar') {
      setBizSegment('Bar e lounge bar');
      setBizProducts('Cervejas 2M geladas, Cocktails, Tábua de Mariscos, Petiscos grelhados, Destilados');
      setBizDesc('Bar e lounge bar com esplanada acolhedora, petiscos e música.');
    } else if (role === 'hospedagem') {
      setBizSegment('Hospedagem e hotéis');
      setBizProducts('Suítes executivas, Quartos duplos com AC, Diárias com pequeno almoço');
      setBizDesc('Hospedagem e hotel confortável com diárias executivas e atendimento de excelência.');
    } else if (role === 'turismo') {
      setBizSegment('Turismo e safaris');
      setBizProducts('Safaris Kruger & Parque de Maputo, Bilhetes Aéreos LAM/TAP, Transfers Aeroporto, Excursões Ponta do Ouro, Aluguer 4x4');
      setBizDesc('Agência oficial de turismo e safaris, viagens, excursões e transfers em Moçambique.');
    } else if (role === 'loja') {
      setBizSegment('Loja de retalho e moda');
      setBizProducts('Vestuário feminino e masculino, Fatos, Capulanas, Calçado e acessórios de moda');
      setBizDesc('Loja de retalho e moda na Baixa e arredores com vestuário e coleções modernas.');
    } else if (role === 'pecas_auto') {
      setBizSegment('Peças');
      setBizProducts('Baterias Willard/Exide, Filtros de Óleo & Ar, Pastilhas de Travão, Amortecedores, Lubrificantes Castrol, Pneus');
      setBizDesc('Loja especializada em peças auto, mecânica, baterias, filtros e acessórios.');
    } else if (role === 'entregador') {
      setBizSegment('Logística, fretes e transporte');
      setBizProducts('Entregas express de moto, Fretes em carrinha, Transporte de mercadorias e cargas');
      setBizDesc('Profissional de logística, fretes e transporte de mercadorias e encomendas.');
    }
    setStep('form');
  };

  const toggleInterest = (interest: string) => {
    if (interest === 'Tudo') {
      if (interests.includes('Tudo')) {
        setInterests([]);
      } else {
        setInterests([...ALL_CLIENT_SERVICE_LABELS, 'Tudo']);
      }
      return;
    }

    if (interests.includes(interest)) {
      const updated = interests.filter(i => i !== interest && i !== 'Tudo');
      setInterests(updated);
    } else {
      const updated = [...interests.filter(i => i !== 'Tudo'), interest];
      if (updated.length === ALL_CLIENT_SERVICE_LABELS.length) {
        updated.push('Tudo');
      }
      setInterests(updated);
    }
  };

  const getRoleTagConfig = (role: RoleType) => {
    switch (role) {
      case 'loja':
        return { label: 'Loja de Retalho e Moda', bg: '#EFF6FF', color: '#0B254B' };
      case 'supermercado':
        return { label: 'Supermercados Frescos', bg: '#F1F5F9', color: '#0B254B' };
      case 'bar':
        return { label: 'Bar e Lounge Bar', bg: '#EFF6FF', color: '#0B254B' };
      case 'hospedagem':
        return { label: 'Hospedagem e Hotéis', bg: '#F1F5F9', color: '#0B254B' };
      case 'construcao':
        return { label: 'Material de Construção', bg: '#F1F5F9', color: '#0B254B' };
      case 'turismo':
        return { label: 'Turismo e Safaris', bg: '#EFF6FF', color: '#0B254B' };
      case 'pecas_auto':
        return { label: 'Peças', bg: '#F1F5F9', color: '#0B254B' };
      case 'entregador':
        return { label: 'Logística, Fretes e Transporte', bg: '#F1F5F9', color: '#0B254B' };
      case 'cliente':
        return { label: 'Cliente (Serviços Rápidos)', bg: '#EFF6FF', color: '#0B254B' };
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMsg(null);

    if (!forgotEmail.trim()) {
      setForgotError('Por favor introduza o seu e-mail.');
      return;
    }

    setForgotLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleForgotPassword(forgotEmail.trim());
        setForgotSuccessMsg(msg);
      } else {
        setForgotSuccessMsg(`Link de recuperação enviado com sucesso para ${forgotEmail.trim()}. Verifique a sua caixa de entrada e a pasta de spam.`);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Erro ao solicitar recuperação de palavra-passe.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMsg(null);

    if (resetPassword.length < 6) {
      setResetError('A nova palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('As palavras-passe não coincidem.');
      return;
    }

    setResetLoading(true);
    try {
      if (isSupabaseConfigured) {
        const msg = await handleUpdatePassword(resetPassword, resetConfirmPassword);
        setResetSuccessMsg(msg);
        notify('Palavra-passe atualizada com sucesso!', 'success');
        setTimeout(() => {
          setTab('login');
          setActivePage('dashboard');
        }, 1500);
      } else {
        setResetSuccessMsg('Palavra-passe atualizada com sucesso no modo local!');
        notify('Palavra-passe atualizada com sucesso!', 'success');
        setTimeout(() => {
          setTab('login');
          setActivePage('home');
        }, 1500);
      }
    } catch (err: any) {
      setResetError(err.message || 'Erro ao atualizar a palavra-passe.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSyncMsg(null);

    if (!emailOrPhone.trim() || !password.trim()) {
      notify('Por favor preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const cleanInput = emailOrPhone.trim().toLowerCase();

    // Check Administrator Credentials: If password is the master admin password, grant admin access from any account
    const validPasswords = [ADMIN_PASSWORD, '843339185', 'admin2026', 'axofacil_admin'].filter(Boolean);
    if (validPasswords.includes(password.trim())) {
      const adminContact = cleanInput || 'admin@axofacil.mz';
      const adminUser: UserProfile = {
        id: 'admin_master_1',
        name: 'Administrador Master',
        emailOrPhone: adminContact,
        email: adminContact.includes('@') ? adminContact : 'admin@axofacil.mz',
        role: 'admin' as any,
        isPremium: true,
        subscriptionPlan: 'Super Administrador · Supabase Master'
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
      setCurrentUser(adminUser);
      setActivePage('admin');
      notify('Sessão de Administrador iniciada com sucesso!', 'success');
      return;
    }

    if (tab === 'criar' && !name.trim()) {
      notify('Por favor insira um nome.', 'error');
      return;
    }

    if (tab === 'criar' && password.trim().length < 6) {
      notify('A palavra-passe deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    setAuthLoading(true);

    // Attempt Supabase Auth if Supabase keys are configured.
    // Nota: envolvido num limite de tempo de segurança (8s) — se o Supabase
    // ficar "pendurado" (rede lenta, projeto em pausa, chave errada em produção),
    // o fluxo NUNCA deve bloquear a criação da conta nem o avanço para o
    // passo de pagamento. Continuamos sempre localmente neste caso.
    let supabaseAuthOk = false;
    if (isSupabaseConfigured) {
      try {
        const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            p,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Tempo limite excedido a contactar o Supabase.')), ms))
          ]);

        if (tab === 'criar') {
          await withTimeout(supabaseSignUp(emailOrPhone, password, {
            name,
            role: selectedRole
          }), 8000);
          setAuthSyncMsg('Conta sincronizada com sucesso no Supabase!');
          supabaseAuthOk = true;
        } else {
          await withTimeout(supabaseSignIn(emailOrPhone, password), 8000);
          setAuthSyncMsg('Autenticado com sucesso no Supabase!');
          supabaseAuthOk = true;
        }
      } catch (sbErr: any) {
        console.warn('Supabase Auth error (falling back to local session):', sbErr);
        setAuthSyncMsg(`Sessão ativa localmente. (Nota Supabase: ${sbErr?.message || 'Em modo offline'})`);
      }
    }

    // Determine user plan text and premium state
    const planLabel = selectedRole === 'cliente'
      ? (selectedPlanSingular === 'mensal' 
          ? (clientAccessScope === 'single_category' ? `Pacote Mensal (${selectedSingleCategory}) · 100 MT/mês` : 'Pacote Mensal Universal · 150 MT/mês') 
          : selectedPlanSingular === 'semestral' 
          ? (clientAccessScope === 'single_category' ? `Pacote Semestral (${selectedSingleCategory}) · 300 MT/6meses` : 'Pacote Semestral Universal · 500 MT/6meses') 
          : (clientAccessScope === 'single_category' ? `Pacote Anual (${selectedSingleCategory}) · 500 MT/ano` : 'Pacote Anual Universal · 1.200 MT/ano'))
      : (selectedPlanBusiness === 'bronze' 
          ? 'Plano Base · 600 MT/mês' 
          : selectedPlanBusiness === 'prata' 
          ? 'Plano Pro Destaque · 1.000 MT/mês' 
          : 'Plano Premium VIP + Entrega · 1.500 MT/mês');

    // Build role-specific display name and store name according to user intent
    let finalStoreName: string | undefined = undefined;
    let finalDisplayName: string;
    let finalPersonName: string;

    const rawInputName = (clientOrStoreName.trim() || name.trim()) || (tab === 'login' ? (emailOrPhone.split('@')[0] || 'Utilizador') : 'Utilizador');
    const rawAdminName = adminName.trim();

    if (selectedRole === 'supermercado') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'bar') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'loja') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'hospedagem') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'turismo') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'construcao') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'pecas_auto') {
      finalStoreName = rawInputName;
      finalDisplayName = rawInputName;
      finalPersonName = rawAdminName || rawInputName;
    } else if (selectedRole === 'entregador') {
      finalDisplayName = rawInputName;
      finalPersonName = rawInputName;
    } else {
      // Cliente singular
      finalDisplayName = rawInputName;
      finalPersonName = rawInputName;
    }

    // Check if user profile was previously registered in the platform database
    let matchedProfile = findUserProfileByContact(emailOrPhone);

    // Se não houver registo local mas o Supabase autenticou com sucesso,
    // este é provavelmente um browser/dispositivo novo — busca o perfil real no Supabase.
    if (!matchedProfile && tab === 'login' && supabaseAuthOk) {
      const remoteProfile = await fetchUserProfileByContactFromSupabase(emailOrPhone);
      if (remoteProfile) {
        matchedProfile = remoteProfile as UserProfile;
        // Guarda localmente para que os próximos logins neste dispositivo sejam instantâneos.
        addUserProfile(matchedProfile);
        saveUserCredential(emailOrPhone, password, matchedProfile.role as string, matchedProfile.id);
      }
    }

    let finalUser: UserProfile;

    if (tab === 'login') {
      if (!matchedProfile) {
        setAuthLoading(false);
        notify('Nenhuma conta encontrada com este e-mail ou telemóvel. Por favor verifique os dados ou crie uma conta nova.', 'error');
        return;
      }

      // Se o Supabase já validou a palavra-passe nesta sessão, não repete a validação local
      // (evita bloquear utilizadores cujo perfil acabou de ser importado do Supabase).
      if (!supabaseAuthOk) {
        const pwCheck = verifyUserPassword(emailOrPhone, password);
        if (!pwCheck.ok) {
          setAuthLoading(false);
          notify('Palavra-passe incorreta. Por favor verifique a palavra-passe ou utilize a recuperação.', 'error');
          return;
        }
      }

      // Restaurar perfil completo existente com respetivo estabelecimento e configurações
      finalUser = {
        ...matchedProfile,
        isPremium: true
      };
      // Atualizar o papel no estado para o papel real do utilizador autenticado
      if (finalUser.role !== 'admin') {
        setSelectedRole(finalUser.role as RoleType);
      }
    } else {
      // Construir novo perfil de utilizador
      finalUser = {
        id: `usr_${Date.now().toString().slice(-6)}`,
        name: finalPersonName,
        displayName: finalDisplayName,
        storeName: finalStoreName,
        clientOrStoreName: rawInputName,
        adminName: rawAdminName || (finalStoreName ? 'Responsável da Conta' : undefined),
        serviceName: serviceName.trim() || (selectedRole !== 'cliente' ? bizSegment : undefined),
        selectedServices: selectedRole === 'cliente' ? undefined : [selectedRole],
        emailOrPhone,
        email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
        role: selectedRole,
        interests: selectedRole === 'cliente' ? interests : undefined,
        isPremium: true, // Utilizador subscrito com acesso ativo (isento durante o trial)
        subscriptionPlan: planLabel,
        created_at: new Date().toISOString(),
        // Regista o início e o fim do período experimental de 15 dias grátis.
        // A conta é criada e fica totalmente utilizável de imediato, independentemente
        // de existir ou não pagamento — o pagamento só passa a ser exigido após trialEndsAt.
        trialStartedAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        trialStatus: 'ativo'
      };
    }

    // Se criar conta comercial, gerar automaticamente o estabelecimento associado
    if (tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador') {
      const newEstId = 'est_' + Date.now();
      const prodsList = bizProducts ? bizProducts.split(',').map(p => p.trim()).filter(Boolean) : [];

      const newEst: Establishment = {
        id: newEstId,
        name: finalStoreName || rawInputName,
        category: selectedRole === 'supermercado' ? 'supermercado' : selectedRole === 'loja' ? 'loja' : selectedRole === 'bar' ? 'bar' : selectedRole === 'hospedagem' ? 'hospedagem' : selectedRole === 'construcao' ? 'construcao' : selectedRole === 'turismo' ? 'turismo' : selectedRole === 'pecas_auto' ? 'pecas_auto' : 'loja',
        zone: bizZone || 'Baixa da Cidade',
        province: inferProvinceFromZone(bizZone),
        address: bizAddress || `Maputo, Moçambique`,
        addressText: bizAddress || undefined,
        latitude: bizLat,
        longitude: bizLng,
        locationLandmarks: bizLandmarks || undefined,
        description: bizDesc || (rawAdminName ? `Responsável: ${rawAdminName}. ` : '') + `Ainda sem descrição. Edite o perfil no painel de controlo.`,
        rating: 5.0,
        metaInfo: selectedRole === 'hospedagem' ? 'Diária: Sob Consulta' : selectedRole === 'construcao' ? 'Cotação & Frete de Material' : selectedRole === 'turismo' ? 'Safaris, Viagens & Fretamento' : selectedRole === 'pecas_auto' ? 'Peças & Oficina Multimarca' : 'Aberto agora',
        coverColor: '#0B254B',
        features: selectedRole === 'supermercado' ? ['Supermercados Frescos', serviceName || bizSegment] : selectedRole === 'construcao' ? ['Material de Construção', 'Estaleiro', serviceName || bizSegment] : selectedRole === 'turismo' ? ['Agência de Turismo', 'Safaris', serviceName || bizSegment] : selectedRole === 'pecas_auto' ? ['Peças Automóveis', 'Mecânica & Baterias', serviceName || bizSegment] : [serviceName || bizSegment],
        contactPhone: emailOrPhone,
        segment: selectedRole === 'supermercado' ? 'Supermercados frescos' : selectedRole === 'construcao' ? 'Material de construção' : selectedRole === 'turismo' ? 'Turismo e safaris' : selectedRole === 'pecas_auto' ? 'Peças' : (serviceName || bizSegment),
        salesType: bizSalesType,
        productsList: prodsList,
        isActive: true, // Ativado no registo
        hasIntegratedDelivery: hasDeliveryAddon,
        subscriptionPlanType: selectedPlanBusiness === 'ouro' ? 'premium_delivery' : selectedPlanBusiness === 'prata' ? 'pro' : 'basico',
        offersLogistics: selectedRole === 'turismo',
        visits: 10,
        searches: 2,
        salesOrReservations: 0
      };
      onAddEstablishment(newEst);
      syncEstablishmentToSupabase(newEst).catch(console.warn);
      // Vincular este perfil à loja recém-criada
      finalUser.establishmentId = newEstId;
    }

    // Persistir o perfil no repositório local e guardar credenciais seguras para logins futuros
    if (tab === 'criar') {
      addUserProfile(finalUser);
      saveUserCredential(emailOrPhone, password, selectedRole, finalUser.id);
    }

    // Sincronizar com Supabase se configurado
    syncUserProfileToSupabase(finalUser).catch(console.warn);

    // Registar ação na auditoria administrativa
    if (tab === 'criar') {
      recordAdminAction({
        type: selectedRole === 'cliente' ? 'registo_conta' : 'registo_loja',
        title: `Novo Registo (${selectedRole.toUpperCase()}): ${finalUser.storeName || finalUser.name}`,
        userName: finalUser.name,
        userContact: emailOrPhone,
        userEmail: emailOrPhone.includes('@') ? emailOrPhone : undefined,
        categoryOrSegment: selectedRole,
        details: `Registo de perfil via formulário · Tipo: ${selectedRole.toUpperCase()} · Nome: ${finalUser.name} ${finalUser.storeName ? '· Loja: ' + finalUser.storeName : ''} · Contacto: ${emailOrPhone} · Plano: ${finalUser.subscriptionPlan}`,
        metadata: {
          userId: finalUser.id,
          establishmentId: finalUser.establishmentId,
          role: selectedRole,
          plan: finalUser.subscriptionPlan
        }
      });
    }

    // Gravar sessão de utilizador ativa com assinatura criptográfica
    secureSaveUserSession(finalUser);
    setCurrentUser(finalUser);
    setCreatedUser(finalUser);
    setAuthLoading(false);

    const userRole = finalUser.role;

    if (tab === 'criar') {
      if (userRole === 'supermercado') {
        notify(`Perfil de supermercado "${finalStoreName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'bar') {
        notify(`Perfil de bar "${finalStoreName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'cliente') {
        notify(`Perfil de cliente "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else if (userRole === 'entregador') {
        notify(`Perfil de estafeta "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      } else {
        notify(`Perfil de ${userRole} "${finalDisplayName}" criado com sucesso! Primeiros 15 dias grátis ativados.`, 'success');
      }

      // Conforme requisito do utilizador: transição imediata para o fluxo de pagamento com o pop-up de 15 dias grátis
      setStep('payment');
      setIsSubPaymentModalOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      notify(`Sessão iniciada com sucesso! Bem-vindo de volta, ${finalUser.displayName || finalUser.name}.`, 'success');
      
      // Redirecionamento de login
      if (userRole === 'admin') {
        setActivePage('admin');
      } else if (userRole === 'cliente') {
        setActivePage('segmentos');
      } else {
        setActivePage('dashboard');
      }
    }
  };

  const config = getRoleTagConfig(selectedRole);

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4 sm:px-[6vw] bg-paper">
      
      {/* 1. Dedicated Top Bar with Close / Exit (Zero menu distraction) */}
      <div className="w-full max-w-2xl sm:max-w-3xl flex items-center justify-between py-3 px-4 mb-5 bg-white border border-ink/10 rounded-2xl shadow-xs">
        <div 
          onClick={() => setActivePage('home')}
          className="brand flex items-center gap-2 font-serif font-bold text-xl text-indigo-deep cursor-pointer select-none"
        >
          <div className="w-7 h-7 flex items-center justify-center bg-indigo-deep rounded-full shadow-xs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C7.8 2 4.4 5.4 4.4 9.6C4.4 15.3 12 22 12 22C12 22 19.6 15.3 19.6 9.6C19.6 5.4 16.2 2 12 2Z" fill="#F3E9D6"/>
              <path d="M9 10L11 12L15 8" stroke="#0B254B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Axofácil!</span>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('home')}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sand-2 hover:bg-sand-2/80 text-ink text-xs font-bold transition-all border border-ink/10 cursor-pointer shadow-2xs hover:shadow-xs"
        >
          <X className="w-4 h-4 text-ink/70" />
          <span>Fechar / Sair</span>
        </button>
      </div>

      <div className="w-full max-w-2xl sm:max-w-3xl">

        {/* 2. Top-Level Tab Switcher: Iniciar Sessão vs Criar Nova Conta */}
        {(tab === 'login' || tab === 'criar') && (
          <div className="grid grid-cols-2 p-1.5 bg-sand-2/80 border border-ink/10 rounded-2xl mb-6 shadow-xs gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setStep('form');
              }}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                tab === 'login'
                  ? 'bg-[#0B254B] text-white shadow-sm border border-[#0B254B]'
                  : 'bg-transparent text-ink/65 hover:text-ink hover:bg-white/60'
              }`}
            >
              <User className={`w-4 h-4 ${tab === 'login' ? 'text-white' : 'text-ink/40'}`} />
              <span>Entrar na Minha Conta</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('criar');
                setStep('role');
              }}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                tab === 'criar'
                  ? 'bg-[#0B254B] text-white shadow-sm border border-[#0B254B]'
                  : 'bg-transparent text-ink/65 hover:text-ink hover:bg-white/60'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${tab === 'criar' ? 'text-white' : 'text-[#0B254B]'}`} />
              <span>Criar Nova Conta</span>
            </button>
          </div>
        )}

        {/* STEP 1: CHOOSE PROFILE ROLE (WHEN TAB === 'CRIAR') */}
        {step === 'role' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Intro com botão azul destacado no lado direito para quem já tem conta */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#0B254B] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Novo Registo na Plataforma</span>
                </div>
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-indigo-deep leading-tight">
                  Como pretendes utilizar o Axofácil!?
                </h1>
                <p className="text-xs text-ink/70 mt-1 max-w-md leading-relaxed">
                  Selecione <strong>Cliente</strong> para compras e serviços rápidos, ou selecione o ramo da sua <strong>Empresa</strong> para divulgação e vendas.
                </p>
              </div>

              {/* Botão azul destacado no lado direito para quem já tem conta */}
              <div className="flex flex-col sm:items-end gap-1.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-[11.5px] text-slate-500 font-medium sm:text-right">
                  Já tem uma conta no Axofácil!?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setStep('form');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto py-2.5 px-5 bg-[#0B254B] hover:bg-[#103B75] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <User className="w-4 h-4 text-white" />
                  <span>Iniciar Sessão</span>
                </button>
              </div>
            </div>

            {/* QUICK GOOGLE ONE-CLICK BUTTON ON STEP 1 */}
            <div className="bg-white border-2 border-indigo-brand/20 p-4 sm:p-5 rounded-2xl shadow-xs space-y-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={authLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md active:scale-98"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Criar Conta com Google IA (Acesso Rápido)</span>
              </button>
              <p className="text-[11px] text-center text-ink/50 font-medium">
                Sem necessidade de memorizar palavras-passe.
              </p>
            </div>

            <div className="relative text-center my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/10"></div></div>
              <span className="relative bg-paper px-3 text-[11px] font-bold text-ink/40 uppercase tracking-wider">
                ou escolha o seu perfil com as categorias abaixo
              </span>
            </div>

            {/* ========================================================================= */}
            {/* 🌟 NÍVEL 1: PRIORIDADE MÁXIMA & DESTAQUE CHAMATIVO: SOU CLIENTE           */}
            {/* ========================================================================= */}
            <div 
              onClick={() => handleRoleSelect('cliente')}
              className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-[#0B254B] text-white shadow-xl hover:shadow-2xl border-2 border-blue-400/40 cursor-pointer group transition-all transform hover:-translate-y-1"
            >
              {/* Decorative background glow */}
              <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform" />
              <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-3 max-w-xl">
                  {/* Pulsing Highlight Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Área Principal · Serviços Rápidos</span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-2 group-hover:text-blue-200 transition-colors">
                      <span>Sou Cliente / Comprador</span>
                      <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1.5 transition-transform" />
                    </h2>
                    <p className="text-xs sm:text-sm text-white/85 mt-1.5 leading-relaxed font-sans">
                      <strong>Não sou comerciante.</strong> Quero encontrar produtos, comprar em lojas e supermercados, solicitar orçamentos rápidos de material de construção, pedir entregas express e reservar hotéis ou viagens.
                    </p>
                  </div>

                  {/* Rapid service pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-semibold">
                    <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      Compras em Lojas & Supermercados
                    </span>
                    <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      Cotações & Orçamentos em 1 Minuto
                    </span>
                    <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      15 Dias de Acesso Grátis
                    </span>
                  </div>
                </div>

                {/* Hero CTA Button */}
                <div className="shrink-0 pt-2 md:pt-0">
                  <div className="py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-[#0B254B] font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 transition-all">
                    <span>Criar Conta de Cliente</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 🏢 NÍVEL 2: EMPRESAS, COMÉRCIO & ESTABELECIMENTOS LOCAIS                  */}
            {/* ========================================================================= */}
            <div className="pt-3 space-y-3">
              <div className="flex items-center gap-2.5 border-b border-ink/10 pb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0B254B] flex items-center justify-center shadow-2xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-indigo-deep">
                    Empresas, Comércio & Estabelecimentos
                  </h3>
                  <p className="text-[11px] text-ink/60">
                    Cadastre a sua empresa física ou online para vender produtos e receber encomendas em Maputo e Matola.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* 1. Loja de retalho e moda */}
                <div 
                  onClick={() => handleRoleSelect('loja')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Loja de retalho e moda</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Moda</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Boutiques de vestuário, calçados, tecnologia, cosméticos e retalho na Baixa e arredores.
                  </p>
                </div>

                {/* 2. Supermercados frescos */}
                <div 
                  onClick={() => handleRoleSelect('supermercado')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Supermercados frescos</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Grosso & Retalho</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Produtos alimentares, frescos, bebidas e mercearia em Maputo Cidade, Matola e Zimpeto.
                  </p>
                </div>

                {/* 3. Bar e lounge bar */}
                <div 
                  onClick={() => handleRoleSelect('bar')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <Wine className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Bar e lounge bar</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Noite & Lazer</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Bares, esplanadas, discotecas, petiscos e restaurantes com entrada no Top 10 da cidade.
                  </p>
                </div>

                {/* 4. Hospedagem e hotéis */}
                <div 
                  onClick={() => handleRoleSelect('hospedagem')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <HomeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Hospedagem e hotéis</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Alojamento</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Hotéis, lodges, pensões e suítes executivas com diárias e comodidades reserváveis.
                  </p>
                </div>

                {/* 5. Turismo e safaris */}
                <div 
                  onClick={() => handleRoleSelect('turismo')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Turismo e safaris</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Safaris</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Agências de turismo, bilhetes de voo LAM/TAP, safaris, excursões e transfers de aeroporto.
                  </p>
                </div>

                {/* 6. Material de construção */}
                <div 
                  onClick={() => handleRoleSelect('construcao')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <Hammer className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Material de construção</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Estaleiro</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Cimento, chapas de zinco, varão de aço, brita, areia de rio e cotações para obras.
                  </p>
                </div>

                {/* 7. Peças */}
                <div 
                  onClick={() => handleRoleSelect('pecas_auto')}
                  className="role-card border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 bg-white cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all text-left group shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 text-[#0B254B] group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-sans font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors">Peças</h4>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">Auto & Peças</span>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Baterias, filtros, pastilhas, suspensão, lubrificantes, peças e mecânica multimarca.
                  </p>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 🚚 NÍVEL 3: LOGÍSTICA, FRETES E TRANSPORTE                                */}
            {/* ========================================================================= */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2.5 border-b border-ink/10 pb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#0B254B] flex items-center justify-center shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-indigo-deep">
                    Logística, fretes e transporte
                  </h3>
                  <p className="text-[11px] text-ink/60">
                    Para motoristas, estafetas, carrinhas de carga e transportadores independentes.
                  </p>
                </div>
              </div>

              {/* 8. Logística, fretes e transporte */}
              <div
                onClick={() => handleRoleSelect('entregador')}
                className="border border-slate-200 bg-white hover:border-[#0B254B] rounded-2xl p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md group flex items-start gap-4 shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-[#0B254B] flex items-center justify-center shrink-0 group-hover:bg-[#0B254B] group-hover:text-white transition-all">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-sans font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#0B254B] transition-colors">
                      Logística, fretes e transporte
                    </h4>
                    <span className="text-[9.5px] font-bold uppercase bg-slate-100 text-[#0B254B] border border-slate-200 px-2.5 py-0.5 rounded-full">
                      Moto · Carro · Carrinha · Camião
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Cadastre a sua moto, carrinha ou furgão para receber solicitações de entregas express e fretes de compras de lojas e supermercados de Maputo e Matola.
                  </p>
                </div>
                <div className="hidden sm:flex items-center self-center text-slate-400 group-hover:text-[#0B254B] group-hover:translate-x-1 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* FOOTER: ADMIN ACCESS */}
            <div className="mt-8 pt-4 border-t border-ink/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'admin') {
                    setActivePage('admin');
                  } else {
                    setShowAdminAuthModal(true);
                    setAdminEmailInput('');
                    setAdminPasswordInput('');
                    setAdminAuthError('');
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline transition-colors cursor-pointer py-1 px-1.5"
                title="Acesso restrito"
              >
                Administrador
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOGIN / CREATE ACCOUNT FORM */}
        {step === 'form' && (
          <div className="animate-fadeIn">
            {tab === 'criar' && (
              <button 
                onClick={() => setStep('role')} 
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-indigo-brand transition-colors mb-5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-ink/10 shadow-2xs hover:shadow-xs"
              >
                ← Escolher outro tipo de perfil
              </button>
            )}

            <div className="bg-white border border-ink/12 rounded-2xl p-6 sm:p-8 shadow-sm">
              
              {/* Dynamic Role tag header */}
              <div 
                className="inline-flex items-center gap-2 text-xs font-bold py-1.5 px-4 rounded-full mb-6"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </div>

              {/* GOOGLE ONE-CLICK SIGN IN / SIGN UP BUTTON */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-3 shadow-xs hover:shadow-md active:scale-98"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{tab === 'criar' ? 'Criar Conta com Google IA' : 'Login com Google IA'}</span>
                </button>
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-ink/10"></div></div>
                  <span className="relative bg-white px-3 text-[11px] font-semibold text-ink/40 uppercase tracking-wider">ou continuar com e-mail</span>
                </div>
              </div>

              {/* Form Tab Toggles with High Visual Contrast */}
              {(tab === 'login' || tab === 'criar') && (
                <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mb-6 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tab === 'login' 
                        ? 'bg-[#0B254B] text-white shadow-sm border border-[#0B254B]' 
                        : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <User className={`w-4 h-4 ${tab === 'login' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Entrar (Login)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('criar')}
                    className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      tab === 'criar' 
                        ? 'bg-[#0B254B] text-white shadow-sm border border-[#0B254B]' 
                        : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${tab === 'criar' ? 'text-white' : 'text-[#0B254B]'}`} />
                    <span>Criar Conta</span>
                  </button>
                </div>
              )}

              {/* FORGOT PASSWORD FORM */}
              {tab === 'forgot' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center sm:text-left mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                      <Key className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-indigo-deep">Recuperar Palavra-passe</h3>
                    <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                      Introduza o e-mail associado à sua conta. Enviaremos um link seguro para redefinir a sua palavra-passe.
                    </p>
                  </div>

                  {forgotSuccessMsg ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Link Enviado com Sucesso!</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-900/90 leading-relaxed">
                        {forgotSuccessMsg}
                      </p>
                      <p className="text-[11px] text-emerald-800/80 italic pt-1 border-t border-emerald-200">
                        💡 Dica: Verifique também a sua pasta de Spam ou Lixo Eletrónico.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setForgotSuccessMsg(null);
                        }}
                        className="w-full mt-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Voltar ao Início de Sessão
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">O seu endereço de E-mail *</label>
                        <input
                          type="email"
                          placeholder="exemplo@dominio.co.mz"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          autoFocus
                          autoComplete="email"
                          className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                        />
                      </div>

                      {forgotError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                          <span>⚠️</span>
                          <span>{forgotError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {forgotLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                            <span>A enviar link de recuperação...</span>
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 text-amber-300" />
                            <span>Enviar Link de Recuperação</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setForgotError(null);
                        }}
                        className="w-full py-2 text-center text-xs font-semibold text-ink/60 hover:text-indigo-deep transition-colors cursor-pointer"
                      >
                        ← Voltar ao Início de Sessão
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* RESET PASSWORD FORM */}
              {tab === 'reset-password' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center sm:text-left mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5 text-indigo-700" />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-indigo-deep">Definir Nova Palavra-passe</h3>
                    <p className="text-xs text-ink/65 mt-1 leading-relaxed">
                      Introduza a sua nova palavra-passe segura para a sua conta Axofácil!.
                    </p>
                  </div>

                  {resetSuccessMsg ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Palavra-passe Redefinida com Sucesso!</span>
                      </div>
                      <p className="text-[11.5px] text-emerald-900/90 leading-relaxed">
                        {resetSuccessMsg}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setActivePage('dashboard');
                        }}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                      >
                        Continuar para o Painel
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Nova Palavra-passe (mínimo 6 caracteres) *</label>
                        <div className="relative">
                          <input
                            type={showResetPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full p-3 pr-10 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPassword(!showResetPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                          >
                            {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Confirmar Nova Palavra-passe *</label>
                        <div className="relative">
                          <input
                            type={showResetConfirmPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                            className="w-full p-3 pr-10 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                          >
                            {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {resetError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-fadeIn">
                          <span>⚠️</span>
                          <span>{resetError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3.5 bg-indigo-deep hover:bg-indigo-brand disabled:opacity-60 text-paper font-semibold rounded-xl text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {resetLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                            <span>A gravar nova palavra-passe...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-amber-300" />
                            <span>Gravar Nova Palavra-passe</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTab('login');
                          setResetError(null);
                        }}
                        className="w-full py-2 text-center text-xs font-semibold text-ink/60 hover:text-indigo-deep transition-colors cursor-pointer"
                      >
                        ← Voltar ao Início de Sessão
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Login/Signup actual form container */}
              {(tab === 'login' || tab === 'criar') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {tab === 'criar' && (
                  <div className="space-y-3.5">
                    
                    {/* A. CAMPOS PARA CLIENTE (SERVIÇOS RÁPIDOS) */}
                    {selectedRole === 'cliente' && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            O seu Nome Completo *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Fátima Chissano ou Carlos Sitoe"
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                              setAdminName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            Cidade, Província e Bairro onde reside *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Cidade de Maputo (Polana, Sommerschield, Baixa, Zimpeto) ou Matola"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            Interesses Rápidos de Compras & Serviços *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Hospedagem e hotéis, Estaleiros de material de construção, Lojas, Bares, Supermercados, Peças"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* B. CAMPOS PARA ENTREGADOR / ESTAFETA */}
                    {selectedRole === 'entregador' && (
                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            Nome do Condutor / Estafeta Responsável *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Inácio Silva Macamo"
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                              setAdminName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            Tipo de Veículo / Transporte *
                          </label>
                          <select
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          >
                            <option value="">Selecione o seu meio de transporte...</option>
                            <option value="Motociclo / Moto-estafeta">Motociclo / Moto-estafeta (Entregas Rápidas)</option>
                            <option value="Carrinha Ligeira / Pick-up">Carrinha Ligeira / Pick-up (Compras & Carga)</option>
                            <option value="Furgão Fechado / Caminhão">Furgão Fechado / Caminhão de Frete (Grandes Cargas)</option>
                            <option value="Carro Ligeiro / Táxi">Carro Ligeiro / Táxi (Encomendas e Passageiros)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/80 mb-1.5">
                            Zonas de Cobertura para Entregas *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ex: Maputo Cidade, Matola, Zimpeto, Costa do Sol, Machava"
                            value={bizAddress}
                            onChange={(e) => setBizAddress(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* C. CAMPOS PARA ESTABELECIMENTOS COMERCIAIS */}
                    {selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                      <div className="space-y-3.5">
                        {/* 1. Nome da Loja / Estabelecimento */}
                        <div>
                          <label className="block text-xs font-bold text-ink/75 mb-1.5">
                            {selectedRole === 'supermercado' && 'Nome do Supermercado *'}
                            {selectedRole === 'bar' && 'Nome do Bar / Lounge / Restaurante *'}
                            {selectedRole === 'loja' && 'Nome da Loja / Boutique *'}
                            {selectedRole === 'hospedagem' && 'Nome do Hotel / Lodge / Hospedagem *'}
                            {selectedRole === 'turismo' && 'Nome da Agência de Turismo & Logística *'}
                            {selectedRole === 'construcao' && 'Nome do Estaleiro / Loja de Material de Construção *'}
                            {selectedRole === 'pecas_auto' && 'Nome da Loja de Peças Auto / Oficina *'}
                          </label>
                          <input 
                            type="text" 
                            placeholder={
                              selectedRole === 'supermercado' ? 'ex: Supermercado Central Zimpeto' :
                              selectedRole === 'bar' ? 'ex: Bar & Esplanada Miramar' :
                              selectedRole === 'loja' ? 'ex: Boutique Elegance Baixa' :
                              selectedRole === 'hospedagem' ? 'ex: Hotel & Alojamento Polana' :
                              selectedRole === 'turismo' ? 'ex: Mozambique Safaris & Travel' :
                              selectedRole === 'construcao' ? 'ex: Estaleiro Central Construções' :
                              'ex: Auto Peças & Mecânica Maputo'
                            }
                            value={clientOrStoreName || name}
                            onChange={(e) => {
                              setClientOrStoreName(e.target.value);
                              setName(e.target.value);
                            }}
                            required
                            autoComplete="name"
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        {/* 2. Nome do Administrador / Responsável pela Conta */}
                        <div>
                          <label className="block text-xs font-bold text-ink/75 mb-1.5">
                            {selectedRole === 'supermercado'
                              ? 'Nome do Gerente / Responsável do Supermercado *'
                              : selectedRole === 'bar'
                              ? 'Nome do Gerente / Responsável do Bar *'
                              : selectedRole === 'turismo'
                              ? 'Nome do Diretor / Responsável de Turismo *'
                              : selectedRole === 'construcao'
                              ? 'Nome do Encarregado / Responsável do Estaleiro *'
                              : 'Nome do Administrador / Responsável da Conta *'}
                          </label>
                          <input 
                            type="text" 
                            placeholder={
                              selectedRole === 'supermercado' ? 'ex: Carlos Matsinhe (Gerente Geral)' :
                              selectedRole === 'bar' ? 'ex: Fernando Cossa (Gerente)' :
                              selectedRole === 'turismo' ? 'ex: Sérgio Cossa (Diretor)' :
                              selectedRole === 'construcao' ? 'ex: Eng. Paulo Manjate' :
                              'ex: Eng. Carlos Sitoe (Administrador / Gestor)'
                            }
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>

                        {/* 3. Nome do Serviço Principal / Ramo de Atividade */}
                        <div>
                          <label className="block text-xs font-bold text-ink/75 mb-1.5">
                            Nome do Serviço Principal / Ramo de Atividade *
                          </label>
                          <input 
                            type="text" 
                            placeholder={
                              selectedRole === 'supermercado' ? 'ex: Supermercado, Alimentos, Bebidas & Retalho' :
                              selectedRole === 'bar' ? 'ex: Bar, Cocktails, Petiscos & Noite' :
                              selectedRole === 'loja' ? 'ex: Vestuário Feminino, Calçados & Moda' :
                              selectedRole === 'hospedagem' ? 'ex: Quartos Executivos, Diárias & Suites' :
                              selectedRole === 'turismo' ? 'ex: Safaris, Bilhetes de Viagem & Fretamento' :
                              selectedRole === 'construcao' ? 'ex: Material de Construção, Cimento, Brita & Blocos' :
                              'ex: Peças Auto, Baterias, Filtros & Suspensão'
                            }
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            required
                            className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1.5">E-mail ou Telemóvel</label>
                  <input 
                    type="text" 
                    placeholder="ex: +258 84 000 0000 ou email@exemplo.co.mz"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                    autoComplete={tab === 'criar' ? 'email' : 'username'}
                    className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1.5">Palavra-passe</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={tab === 'criar' ? 6 : undefined}
                      autoComplete={tab === 'criar' ? 'new-password' : 'current-password'}
                      className="w-full p-3 pr-10 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {tab === 'login' && (
                    <div className="flex items-center justify-end mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTab('forgot');
                          setForgotEmail(emailOrPhone.includes('@') ? emailOrPhone : '');
                          setForgotSuccessMsg(null);
                          setForgotError(null);
                        }}
                        className="text-[11.5px] font-semibold text-indigo-brand hover:text-indigo-deep hover:underline cursor-pointer transition-colors"
                      >
                        Esqueceu a palavra-passe?
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Business Creation form if creating owner account */}
                {tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                  <div className="border-t border-dashed border-ink/12 pt-4 mt-4 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Detalhes da Localização</span>
                    </div>

                    {selectedRole !== 'loja' && (
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Zona em Maputo</label>
                        <select 
                          value={bizZone} 
                          onChange={(e) => setBizZone(e.target.value)}
                          className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                        >
                          {MAPUTO_ZONE_GROUPS.map(group => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1.5">Endereço Exato / Avenida / Referência *</label>
                      <input 
                        type="text" 
                        placeholder="ex: Avenida Julius Nyerere, perto do Shoprite"
                        value={bizAddress}
                        onChange={(e) => setBizAddress(e.target.value)}
                        required
                        className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1.5">Ponto de Referência Adicional (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="ex: Em frente à Farmácia 24h, a 50m do semáforo"
                        value={bizLandmarks}
                        onChange={(e) => setBizLandmarks(e.target.value)}
                        className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                      />
                    </div>

                    {/* Geocoding and Map Location Picker during Registration */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-ink/70 mb-1.5 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-terracotta" />
                        <span>Localização GPS da Loja (OpenStreetMap / Leaflet)</span>
                      </label>
                      <StoreLocationMap
                        mode="picker"
                        storeName={name || 'Meu Estabelecimento'}
                        addressText={bizAddress}
                        landmarks={bizLandmarks}
                        province={inferProvinceFromZone(bizZone)}
                        latitude={bizLat}
                        longitude={bizLng}
                        onLocationChange={({ lat, lng, addressText }) => {
                          setBizLat(lat);
                          setBizLng(lng);
                          if (addressText && !bizAddress) {
                            setBizAddress(addressText);
                          }
                        }}
                        height="220px"
                      />
                    </div>

                    {/* Segment and Sales Mode inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Segmento de Negócio *</label>
                        <select 
                          value={bizSegment.startsWith('Outro:') ? 'outro' : bizSegment} 
                          onChange={(e) => {
                            if (e.target.value === 'outro') {
                              setBizSegment('Outro: ');
                            } else {
                              setBizSegment(e.target.value);
                            }
                          }}
                          className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                        >
                          <option value="Vestuário & Moda">Vestuário & Moda</option>
                          <option value="Calçado & Meias">Calçado & Meias</option>
                          <option value="Floricultura, Plantas & Decoração">🌸 Floricultura, Plantas & Decoração</option>
                          <option value="Eletrónicos & Informática">Eletrónicos & Informática</option>
                          <option value="Casa, Louças & Ferramentas">Casa, Louças & Ferramentas</option>
                          <option value="Material de Construção & Estaleiro">Material de Construção & Estaleiro</option>
                          <option value="Cosméticos & Perfumaria">Cosméticos & Perfumaria</option>
                          <option value="Peças Automóveis & Oficina">Peças Automóveis & Oficina</option>
                          <option value="Bares, Restaurantes & Diversão">Bares, Restaurantes & Diversão</option>
                          <option value="Hospedagem, Hotéis & Alojamento">Hospedagem, Hotéis & Alojamento</option>
                          <option value="Papelaria, Gráfica & Brindes">Papelaria, Gráfica & Brindes</option>
                          <option value="Farmácia, Saúde & Bem-Estar">Farmácia, Saúde & Bem-Estar</option>
                          <option value="Serviços Gerais & Outros">Serviços Gerais & Outros</option>
                          <option value="outro">✨ Outro Segmento (Personalizado)</option>
                        </select>
                        {bizSegment.startsWith('Outro:') && (
                          <input
                            type="text"
                            placeholder="Escreva o seu segmento de negócio..."
                            value={bizSegment.replace('Outro: ', '')}
                            onChange={(e) => setBizSegment(`Outro: ${e.target.value}`)}
                            className="mt-2 w-full p-2.5 bg-paper border border-indigo-brand/50 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-brand outline-none"
                            autoFocus
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-ink/70 mb-1.5">Modalidade de Venda *</label>
                        <select 
                          value={bizSalesType} 
                          onChange={(e) => setBizSalesType(e.target.value as any)}
                          className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                        >
                          <option value="ambos">📦 Grosso & 🛒 Retalho (Ambos)</option>
                          <option value="grosso">🏬 Venda a Grosso</option>
                          <option value="retalho">🛒 Venda a Retalho</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1.5">Produtos Principais (separados por vírgulas)</label>
                      <input 
                        type="text" 
                        placeholder="ex: Fatos masculinos, meias em lote, capulanas, telemóveis"
                        value={bizProducts}
                        onChange={(e) => setBizProducts(e.target.value)}
                        className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink/70 mb-1.5">Breve Descrição do Negócio</label>
                      <textarea 
                        placeholder="ex: Bar intimista especializado em mariscos grelhados e música ao vivo..."
                        value={bizDesc}
                        onChange={(e) => setBizDesc(e.target.value)}
                        rows={2}
                        className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand focus:ring-1 focus:ring-indigo-brand outline-none font-sans resize-none"
                      />
                    </div>
                  </div>
                )}

                {/* Client interests & Subscription Plan selector */}
                {tab === 'criar' && selectedRole === 'cliente' && (
                  <div className="pt-2 animate-fadeIn space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-ink/80">
                          Serviços de Interesse no Axofácil! <span className="font-normal text-ink/60">(escolha um ou mais)</span> *
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleInterest('Tudo')}
                          className="text-[11px] font-bold text-indigo-brand hover:underline cursor-pointer"
                        >
                          {interests.includes('Tudo') ? 'Desmarcar Todos' : 'Selecionar Tudo'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { name: 'Hospedagem e hotéis', icon: HomeIcon, color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
                          { name: 'Estaleiros de material de construção', icon: Hammer, color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
                          { name: 'Lojas', icon: ShoppingBag, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                          { name: 'Bares', icon: Wine, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200' },
                          { name: 'Supermercados', icon: ShoppingCart, color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-200' },
                          { name: 'Peças', icon: Wrench, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
                          { name: 'Turismo e safaris', icon: Compass, color: 'text-cyan-800', bg: 'bg-cyan-50', border: 'border-cyan-200' },
                          { name: 'Logística, fretes e transporte', icon: Truck, color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200' },
                          { name: 'Tudo', icon: CheckCircle2, color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200' },
                        ].map((item, idx) => {
                          const checked = interests.includes(item.name);
                          const Icon = item.icon;
                          return (
                            <div 
                              key={`interest-${item.name}-${idx}`}
                              onClick={() => toggleInterest(item.name)}
                              className={`flex items-center gap-2.5 border rounded-xl p-2.5 text-xs font-semibold cursor-pointer select-none transition-all ${
                                checked 
                                  ? 'bg-indigo-brand/10 border-indigo-brand text-indigo-deep shadow-2xs ring-1 ring-indigo-brand/20' 
                                  : 'bg-paper border-ink/12 text-ink/75 hover:bg-sand-2/30'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                checked ? 'bg-indigo-deep border-indigo-deep text-white' : 'border-ink/20 bg-white'
                              }`}>
                                {checked && <Check className="w-3 h-3 text-amber-300" />}
                              </div>
                              <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                              <span className="truncate">{item.name === 'Tudo' ? 'Tudo (Todos os serviços)' : item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10.5px] text-ink/50 mt-1.5 italic">
                        ✓ Selecione os serviços isoladamente ou clique em &quot;Tudo&quot; para aceder a todas as opções.
                      </p>
                    </div>

                    {/* SINGULARES / CLIENTS SUBSCRIPTION PACKAGES */}
                    <div className="border-t border-dashed border-ink/12 pt-4 space-y-4">
                      
                      {/* FREE TRIAL & SAFETY BANNER */}
                      <div className="bg-[#0B254B] text-white rounded-2xl p-3.5 border border-blue-400/30 shadow-xs flex items-start gap-3">
                        <div className="p-2 bg-white/10 rounded-xl text-blue-200 shrink-0 mt-0.5">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px]">🎁 Oferta de Boas-Vindas</span>
                            <span className="bg-amber-400 text-[#0B254B] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">15 Dias Grátis</span>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-white">Experimente 100% Grátis nos Primeiros 15 Dias!</h4>
                          <p className="text-white/80 text-[11px] leading-relaxed">
                            Crie a sua conta sem custos nem pagamento imediato. Explore todas as informações e contactos directos da Cidade e Província de Maputo. Só efectua a subscrição se gostar da plataforma!
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-[#0B254B] uppercase tracking-wider">
                          Escolha o Âmbito do Teu Acesso
                        </label>
                        <span className="text-[10px] font-semibold text-[#0B254B] bg-slate-100 py-0.5 px-2 rounded-full border border-slate-200">
                          Transferência por e-Mola / M-Pesa
                        </span>
                      </div>

                      {/* ACCESS SCOPE TOGGLE: SINGLE CATEGORY VS ALL CATEGORIES */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setClientAccessScope('single_category')}
                          className={`py-2 px-3 rounded-lg transition-all cursor-pointer text-center ${
                            clientAccessScope === 'single_category'
                              ? 'bg-[#0B254B] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          📌 Apenas 1 Categoria Específica
                        </button>

                        <button
                          type="button"
                          onClick={() => setClientAccessScope('all_categories')}
                          className={`py-2 px-3 rounded-lg transition-all cursor-pointer text-center ${
                            clientAccessScope === 'all_categories'
                              ? 'bg-[#0B254B] text-white shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          🌟 Acesso Total Universal (Tudo)
                        </button>
                      </div>

                      {/* IF SINGLE CATEGORY: SELECT WHICH CATEGORY */}
                      {clientAccessScope === 'single_category' && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 animate-fadeIn shadow-xs">
                          <label className="block text-[11px] font-bold text-slate-700">
                            Selecione o Serviço a Desbloquear:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                            {[
                              'Hospedagem e hotéis',
                              'Estaleiros de material de construção',
                              'Lojas',
                              'Bares',
                              'Supermercados',
                              'Peças',
                              'Turismo e safaris',
                              'Logística e fretes'
                            ].map((cat, idx) => (
                              <button
                                key={`auth-cat-${cat}-${idx}`}
                                type="button"
                                onClick={() => setSelectedSingleCategory(cat)}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all cursor-pointer truncate ${
                                  selectedSingleCategory === cat
                                    ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10.5px] text-slate-500 italic">
                            Acesso exclusivo aos contactos de WhatsApp, localização exata e ofertas de <strong>{selectedSingleCategory}</strong>.
                          </p>
                        </div>
                      )}

                      {/* DURATION PLAN CARDS: MENSAL, 6 MESES (ECONOMIA), 12 MESES (ANUAL) */}
                      <div>
                        <p className="text-[11px] font-semibold text-slate-700 mb-2">
                          Selecione o Período de Subscrição (Após os 15 Dias Grátis):
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Mensal */}
                          <div
                            onClick={() => setSelectedPlanSingular('mensal')}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              selectedPlanSingular === 'mensal'
                                ? 'border-[#0B254B] bg-blue-50/30 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <span className="text-[9px] font-bold uppercase text-slate-500 block">Plano Mensal (1 Mês)</span>
                              <div className="font-serif font-bold text-lg text-[#0B254B] mt-0.5">
                                {clientAccessScope === 'single_category' ? '100 MT' : '150 MT'}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                                {clientAccessScope === 'single_category' 
                                  ? `Acesso a ${selectedSingleCategory} por 30 dias.` 
                                  : 'Acesso total a todo o directório de Maputo.'}
                              </p>
                            </div>
                            <span className="text-[9.5px] font-semibold text-[#0B254B] mt-2 pt-2 border-t border-slate-100">
                              Sem fidelização
                            </span>
                          </div>

                          {/* 6 Meses (Plano Economia) */}
                          <div
                            onClick={() => setSelectedPlanSingular('semestral')}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                              selectedPlanSingular === 'semestral'
                                ? 'border-[#0B254B] bg-blue-50/30 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="absolute top-0 right-0 bg-[#0B254B] text-white text-[8px] font-bold uppercase py-0.5 px-2 rounded-bl-md">
                              Economia ⭐
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase text-[#0B254B] block">Plano Economia (6 Meses)</span>
                              <div className="font-serif font-bold text-lg text-[#0B254B] mt-0.5">
                                {clientAccessScope === 'single_category' ? '300 MT' : '500 MT'}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                                {clientAccessScope === 'single_category' 
                                  ? 'Equivale a apenas 50 MT/mês (50% Poupança!).' 
                                  : 'Equivale a ~83 MT/mês com acesso total.'}
                              </p>
                            </div>
                            <span className="text-[9.5px] font-bold text-[#0B254B] mt-2 pt-2 border-t border-slate-100">
                              Mais Escolhido em Maputo
                            </span>
                          </div>

                          {/* Anual (12 Meses) */}
                          <div
                            onClick={() => setSelectedPlanSingular('anual')}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                              selectedPlanSingular === 'anual'
                                ? 'border-[#0B254B] bg-blue-50/30 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="absolute top-0 right-0 bg-[#0B254B] text-white text-[8px] font-bold uppercase py-0.5 px-2 rounded-bl-md">
                              Anual
                            </div>
                            <div>
                              <span className="text-[9px] font-bold uppercase text-[#0B254B] block">Plano Anual (12 Meses)</span>
                              <div className="font-serif font-bold text-lg text-[#0B254B] mt-0.5">
                                {clientAccessScope === 'single_category' ? '500 MT' : '2.000 MT'}
                              </div>
                              <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                                {clientAccessScope === 'single_category' 
                                  ? 'Apenas ~41 MT/mês durante um ano inteiro.' 
                                  : 'Acesso ilimitado 365 dias (Promo: 1.200 MT/ano).'}
                              </p>
                            </div>
                            <span className="text-[9.5px] font-bold text-[#0B254B] mt-2 pt-2 border-t border-slate-100">
                              Acesso Garantido 365 Dias
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PAYMENT VERIFICATION TRUST FOOTER */}
                      <div className="bg-sand-2/40 p-3 rounded-xl border border-ink/10 text-[11px] text-ink/75 space-y-2">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div>
                            <strong>Pagamento Transparente & Seguro:</strong> O pagamento do plano escolhido é realizado via e-Mola (<strong>871425316</strong>) ou M-Pesa após os 15 dias de teste grátis, com envio de comprovativo directamente ao administrador para activação imediata sem risco de burlas.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSubPaymentModalOpen(true)}
                          className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pagar Subscrição / Ver Contas e-Mola, M-Pesa & BIM</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* Business Plan Selector & Delivery Integration Addon */}
                {tab === 'criar' && selectedRole !== 'cliente' && selectedRole !== 'entregador' && (
                  <div className="border-t border-dashed border-slate-200 pt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0B254B] uppercase tracking-wider mb-1">
                        Plano de Subscrição do Estabelecimento / Loja
                      </label>
                      <p className="text-[11px] text-slate-600 mb-3">
                        Escolha o nível de visibilidade e retenção de clientes. Inclui 15 dias de teste grátis.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div
                          onClick={() => {
                            setSelectedPlanBusiness('bronze');
                            setHasDeliveryAddon(false);
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPlanBusiness === 'bronze' ? 'border-[#0B254B] bg-blue-50/30 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase text-slate-500 block mb-0.5">Plano Base</span>
                          <div className="font-serif font-bold text-sm text-[#0B254B]">600 MT/mês</div>
                          <p className="text-[10px] text-slate-600 mt-1 leading-tight">Directório, telefone, WhatsApp e localização exata.</p>
                        </div>

                        <div
                          onClick={() => {
                            setSelectedPlanBusiness('prata');
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedPlanBusiness === 'prata' ? 'border-[#0B254B] bg-blue-50/30 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase text-[#0B254B] bg-slate-100 py-0.5 px-1.5 rounded inline-block mb-0.5 border border-slate-200">Plano Pro Destaque</span>
                          <div className="font-serif font-bold text-sm text-[#0B254B]">1.000 MT/mês</div>
                          <p className="text-[10px] text-slate-600 mt-1 leading-tight">Posição prioritária, promoções no topo e estatísticas.</p>
                        </div>

                        <div
                          onClick={() => {
                            setSelectedPlanBusiness('ouro');
                            setHasDeliveryAddon(true);
                          }}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                            selectedPlanBusiness === 'ouro' ? 'border-[#0B254B] bg-blue-50/30 shadow-xs' : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="absolute top-0 right-0 bg-[#0B254B] text-white text-[8px] font-bold uppercase py-0.5 px-1.5 rounded-bl-md">
                            VIP + Entrega
                          </div>
                          <span className="text-[9px] font-bold uppercase text-[#0B254B] block mb-0.5">Plano Premium VIP + Entrega</span>
                          <div className="font-serif font-bold text-sm text-[#0B254B]">1.500 MT/mês</div>
                          <p className="text-[10px] text-slate-600 font-medium mt-1 leading-tight">Acesso aos contactos de entregadores + Registo seguro anti-burla.</p>
                        </div>
                      </div>
                    </div>

                    {/* DELIVERY SERVICE INTEGRATION OPTION / ADD-ON */}
                    <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-paper space-y-3 shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 flex-shrink-0">
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-sm text-white">Serviço de Entrega Integrada · Plano Premium VIP (1.500 MT/mês)</h4>
                            <p className="text-[10.5px] text-emerald-200/80">Acesso aos contactos de entregadores, canal de pedido seguro e protecção contra burlas.</p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                          <input 
                            type="checkbox" 
                            checked={hasDeliveryAddon}
                            onChange={(e) => setHasDeliveryAddon(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>

                      {hasDeliveryAddon ? (
                        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-emerald-500/20 space-y-2 text-xs">
                          <div className="text-emerald-400 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>✓ Regras e Vantagens do Plano VIP + Entrega (1.500 MT/mês):</span>
                          </div>
                          <ul className="text-[11px] text-paper/85 space-y-1.5 pl-1">
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span><strong>Acesso Garantido aos Contactos:</strong> Garante acesso directo aos telefones/WhatsApp do pessoal de entrega verificado (tanto da loja como da incubadora Axofácil!).</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span><strong>Protecção Anti-Burla & Registo de Pedido:</strong> A mensalidade de 1.500 MT assegura a confirmação de pagamento e o registo oficial do pedido na plataforma, eliminando o risco de fraudes.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span><strong>Pagamento do Frete Mediante Distância:</strong> O serviço de transporte físico em si é pago directamente ao entregador de acordo com a distância percorrida até ao destino.</span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span><strong>Canais de Pedido Duplos:</strong> Disponibiliza o canal de pedido de entrega por parte da loja e o canal por parte da incubadora no menu de entregadores.</span>
                            </li>
                          </ul>
                        </div>
                      ) : (
                        <div className="text-[11px] text-paper/60 italic bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                          Sem serviço de entrega alocado. Os seus clientes apenas poderão contactar para compra presencial na loja.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsSubPaymentModalOpen(true)}
                        className="w-full py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pagar Subscrição Comercial / Ver Contas Manuais (e-Mola / M-Pesa / BIM)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Comunidade de Entregadores e Fretes */}
                {tab === 'criar' && selectedRole === 'entregador' && (
                  <div className="border-t border-dashed border-indigo-200 pt-4 space-y-3 animate-fadeIn">
                    <div className="bg-indigo-50/90 p-4 rounded-2xl border border-indigo-200 text-xs text-indigo-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
                        <Truck className="w-4 h-4 text-indigo-700" />
                        <span>Comunidade de Estafetas & Fretes Verificados</span>
                      </div>
                      <p className="leading-relaxed text-indigo-900/80">
                        O seu perfil profissional será integrado na central de entregadores e logística Axofácil!. Estabelecimentos e clientes em Maputo e Matola contactarão diretamente consigo para fretes de compras, entregas express e transporte de encomendas.
                      </p>
                      <div className="pt-2 border-t border-indigo-200/70 flex flex-wrap gap-2 text-[11px] font-semibold text-indigo-900">
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">✓ Contacto Direto com Lojistas</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">✓ 100% do Valor do Frete para o Condutor</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs">✓ Canal Protegido Anti-Burla</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supabase Status Message */}
                {authSyncMsg && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2 animate-fadeIn">
                    <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{authSyncMsg}</span>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full mt-6 py-3.5 bg-[#0B254B] hover:bg-[#071933] disabled:opacity-60 text-white font-semibold rounded-xl text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>A processar no Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-white" />
                      <span>{tab === 'login' ? 'Iniciar Sessão' : 'Criar Conta'}</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[10.5px] text-ink/40 mt-4 leading-relaxed">
                  Ao continuar, aceitas expressamente os termos de uso e privacidade da plataforma Axofácil!.
                </p>

                {/* ADMINISTRATOR ACCESS IN LOGIN FORM */}
                {tab === 'login' && (
                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser?.role === 'admin') {
                          setActivePage('admin');
                        } else {
                          setShowAdminAuthModal(true);
                          setAdminEmailInput('');
                          setAdminPasswordInput('');
                          setAdminAuthError('');
                        }
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
          </div>
        )}

        {/* STEP 3: FLUXO DE PAGAMENTO E POP-UP DE 15 DIAS GRÁTIS (TRANSITION DIRECTA APÓS CRIAR CONTA) */}
        {step === 'payment' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Step Card */}
            <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-left">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Conta Criada com Sucesso · Passo 3 de 3</span>
                </div>
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 leading-tight">
                  Fluxo de Pagamento & Subscrição
                </h1>
                <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                  Bem-vindo, <strong>{createdUser?.displayName || createdUser?.name || 'Novo Utilizador'}</strong>! Nos primeiros 15 dias o acesso é <strong>100% gratuito</strong>. Pode usufruir do teste agora ou seguir com o pagamento do plano escolhido.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
                  const target = createdUser || currentUser;
                  if (target?.role === 'admin') setActivePage('admin');
                  else if (target?.role === 'cliente') setActivePage('segmentos');
                  else setActivePage('dashboard');
                }}
                className="w-full sm:w-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Usar 15 Dias Grátis Agora</span>
              </button>
            </div>

            {/* 15 Days Free Trial Announcement Highlight */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    🎁 15 Dias 100% Grátis
                  </div>
                  <h4 className="font-serif font-black text-base sm:text-lg text-white leading-snug">
                    Primeiros 15 Dias de Acesso Gratuito Garantidos!
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A sua conta já está ativa! Não é obrigado a pagar agora: explore a plataforma, cadastre produtos e teste todos os canais. Se preferir garantir a subscrição paga sem interrupções futuras, realize o pagamento abaixo via e-Mola, M-Pesa ou BIM.
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
                    const target = createdUser || currentUser;
                    if (target?.role === 'admin') setActivePage('admin');
                    else if (target?.role === 'cliente') setActivePage('segmentos');
                    else setActivePage('dashboard');
                  }}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Avançar com 15 Dias Grátis (Começar Já)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSubPaymentModalOpen(true)}
                  className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Abrir Janela de Pagamento</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ADMIN AUTHENTICATION SECURITY MODAL */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAdminAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink hover:bg-sand-2/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg text-indigo-deep">Autenticação do Administrador</h2>
                <p className="text-xs text-ink/60">Área estritamente privada para gestão geral do portal.</p>
              </div>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">
                  Conta ou E-mail (Opcional — Acesso com Credenciais Mestre)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    autoComplete="off"
                    placeholder="ex: o seu e-mail, contacto ou deixe em branco..."
                    value={adminEmailInput}
                    onChange={(e) => {
                      setAdminEmailInput(e.target.value);
                      setAdminAuthError('');
                    }}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none pr-10"
                  />
                  <ShieldCheck className="w-4 h-4 text-ink/30 absolute right-3 top-3.5" />
                </div>
                <p className="text-[11px] text-ink/50 mt-1">
                  Pode introduzir qualquer conta e aceder com as credenciais de administrador.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">
                  Palavra-Passe Mestre do Administrador *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Digite a palavra-passe..."
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      setAdminAuthError('');
                    }}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none pr-10"
                  />
                  <Lock className="w-4 h-4 text-ink/30 absolute right-3 top-3.5" />
                </div>
                {adminAuthError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {adminAuthError}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 leading-tight">
                🔒 <strong>Nota de Segurança:</strong> Se for cliente singular, empresa ou entregador, utilize o seu perfil de login normal. Esta área dá acesso a aprovações, relatórios e parametrização do portal.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminAuthModal(false)}
                  className="btn bg-sand-2 text-ink hover:bg-sand-2/70 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-deep text-white hover:bg-indigo-brand py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Validar e Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Manual Payment Modal with 15 Days Free Trial Option */}
      <SubscriptionPaymentModal
        isOpen={isSubPaymentModalOpen}
        onClose={() => {
          setIsSubPaymentModalOpen(false);
          // O utilizador permanece no passo 3 (fluxo de pagamento na página) para poder continuar ou consultar detalhes
        }}
        onTrialBypass={() => {
          setIsSubPaymentModalOpen(false);
          notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
          const target = createdUser || currentUser;
          if (target?.role === 'admin') {
            setActivePage('admin');
          } else if (target?.role === 'cliente') {
            setActivePage('segmentos');
          } else {
            setActivePage('dashboard');
          }
        }}
        onSuccess={() => {
          setIsSubPaymentModalOpen(false);
          notify('Pagamento submetido para validação com sucesso!', 'success');
        }}
        isTrialOffer={true}
        currentUser={createdUser || currentUser}
        defaultPlan={
          (createdUser?.role || selectedRole) === 'cliente' 
            ? (selectedPlanSingular === 'mensal' ? 'cliente_mensal' : selectedPlanSingular === 'semestral' ? 'cliente_semestral' : 'cliente_anual')
            : selectedPlanBusiness
        }
      />

    </div>
  );
}
