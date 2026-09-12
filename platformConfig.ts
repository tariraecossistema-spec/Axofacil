// Configurações globais e editáveis da plataforma Axofácil!
// - Contas de recebimento (M-Pesa, e-Mola, Transferência Bancária)
// - Planos de assinatura (Empresas/Lojas e Clientes)
//
// Estes valores são a fonte única de verdade usada por:
//   - paymentConfig.ts (instruções de pagamento por loja)
//   - SubscriptionPaymentModal.tsx (checkout de planos)
//   - AdminPlatformSettingsManager.tsx (ecrã de administração)
//
// São persistidos em localStorage para que o admin possa alterá-los
// no painel administrativo sem precisar de alterar código.

const STORAGE_KEY = 'axofacil_platform_settings';

import { syncPlatformSettingsToSupabase, fetchPlatformSettingsFromSupabase } from './supabase';


export interface PlatformPaymentAccount {
  titular: string;
  numero: string; // número de telefone (M-Pesa/e-Mola) ou NIB (banco)
  banco?: string; // nome do banco, aplicável apenas à transferência bancária
}

export interface PlatformPaymentAccounts {
  mpesa: PlatformPaymentAccount;
  emola: PlatformPaymentAccount;
  banco: PlatformPaymentAccount;
}

export interface SubscriptionPlanDetails {
  name: string;
  priceMT: number;
}

export interface BusinessPlans {
  bronze: SubscriptionPlanDetails;
  prata: SubscriptionPlanDetails;
  ouro: SubscriptionPlanDetails;
}

export interface ClientPlans {
  mensal: SubscriptionPlanDetails;
  semestral: SubscriptionPlanDetails;
  anual: SubscriptionPlanDetails;
}

export interface ServiceProfilePolicy {
  allowGuestCart: boolean; // Se true, clientes podem comprar sem criar conta prévia
  isPlanBillingActive: boolean; // Se true, cobrança de planos e subscrições está ativa
}

export interface PlatformSettings {
  paymentAccounts: PlatformPaymentAccounts;
  businessPlans: BusinessPlans;
  clientPlans: ClientPlans;
  globalClientBillingFlowActive: boolean; // Ativa/desativa fluxo de cobrança de planos para clientes normais / utilizadores de consumo
  profilePolicies: Record<string, ServiceProfilePolicy>; // Políticas por categoria/perfil ('bar', 'supermercado', 'loja', etc.)
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  paymentAccounts: {
    mpesa: {
      titular: 'Shay Tec & Serviços Lda / Vicente Germano',
      numero: '841234567',
    },
    emola: {
      titular: 'vicente joao germano dias',
      numero: '871425316',
    },
    banco: {
      titular: 'vicente joao Germano Dias',
      numero: '000100000017601998457',
      banco: 'Millennium Bim',
    },
  },
  businessPlans: {
    bronze: { name: 'Plano Base — Loja no Directório', priceMT: 600 },
    prata: { name: 'Plano Pro Destaque — Loja Prioritária', priceMT: 1000 },
    ouro: { name: 'Plano VIP Premium + Entrega Integrada', priceMT: 1500 },
  },
  clientPlans: {
    mensal: { name: 'Acesso Cliente — Mensal Universal', priceMT: 150 },
    semestral: { name: 'Acesso Cliente — Plano Economia (6 Meses)', priceMT: 500 },
    anual: { name: 'Acesso Cliente — Plano Anual Total (12 Meses)', priceMT: 1200 },
  },
  globalClientBillingFlowActive: true,
  profilePolicies: {
    bar: { allowGuestCart: true, isPlanBillingActive: false },
    supermercado: { allowGuestCart: true, isPlanBillingActive: true },
    loja: { allowGuestCart: false, isPlanBillingActive: true },
    hospedagem: { allowGuestCart: false, isPlanBillingActive: true },
    construcao: { allowGuestCart: true, isPlanBillingActive: true },
    pecas_auto: { allowGuestCart: true, isPlanBillingActive: true },
    ferragens: { allowGuestCart: true, isPlanBillingActive: true },
    turismo: { allowGuestCart: false, isPlanBillingActive: true },
    entregador: { allowGuestCart: false, isPlanBillingActive: true }
  }
};

// Faz merge profundo com os valores por defeito, para que configurações
// antigas/parciais guardadas em localStorage nunca quebrem o ecrã caso
// novos campos sejam adicionados no futuro.
function mergeWithDefaults(saved: Partial<PlatformSettings> | null): PlatformSettings {
  if (!saved) return DEFAULT_PLATFORM_SETTINGS;
  return {
    paymentAccounts: {
      mpesa: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.mpesa, ...(saved.paymentAccounts?.mpesa || {}) },
      emola: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.emola, ...(saved.paymentAccounts?.emola || {}) },
      banco: { ...DEFAULT_PLATFORM_SETTINGS.paymentAccounts.banco, ...(saved.paymentAccounts?.banco || {}) },
    },
    businessPlans: {
      bronze: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.bronze, ...(saved.businessPlans?.bronze || {}) },
      prata: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.prata, ...(saved.businessPlans?.prata || {}) },
      ouro: { ...DEFAULT_PLATFORM_SETTINGS.businessPlans.ouro, ...(saved.businessPlans?.ouro || {}) },
    },
    clientPlans: {
      mensal: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.mensal, ...(saved.clientPlans?.mensal || {}) },
      semestral: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.semestral, ...(saved.clientPlans?.semestral || {}) },
      anual: { ...DEFAULT_PLATFORM_SETTINGS.clientPlans.anual, ...(saved.clientPlans?.anual || {}) },
    },
    globalClientBillingFlowActive: saved.globalClientBillingFlowActive !== undefined
      ? saved.globalClientBillingFlowActive 
      : DEFAULT_PLATFORM_SETTINGS.globalClientBillingFlowActive,
    profilePolicies: {
      ...DEFAULT_PLATFORM_SETTINGS.profilePolicies,
      ...(saved.profilePolicies || {})
    }
  };
}

export function loadPlatformSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_SETTINGS;
    return mergeWithDefaults(JSON.parse(raw));
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export function savePlatformSettings(settings: PlatformSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  // Sincroniza em segundo plano com o Supabase (se configurado), para que a
  // alteração feita por um admin fique disponível em qualquer dispositivo.
  // "Fire-and-forget": nunca bloqueia nem quebra o ecrã se falhar/offline.
  syncPlatformSettingsToSupabase({
    paymentAccounts: settings.paymentAccounts,
    businessPlans: settings.businessPlans,
    clientPlans: settings.clientPlans,
    globalClientBillingFlowActive: settings.globalClientBillingFlowActive,
    profilePolicies: settings.profilePolicies,
  } as any).catch(() => {});
}

/**
 * Verifica se uma loja/estabelecimento permite Carrinho Livre sem criar conta.
 * Hierarquia de decisão:
 * 1. Configuração específica da loja (`est.allowGuestCart`)
 * 2. Política por perfil/categoria de serviço (`profilePolicies[est.category].allowGuestCart`)
 * 3. Predefinição (true para bar e supermercado, true como fallback seguro)
 */
export function isGuestCartAllowedForEstablishment(est?: { allowGuestCart?: boolean; category?: string } | null): boolean {
  if (!est) return true;
  if (typeof est.allowGuestCart === 'boolean') {
    return est.allowGuestCart;
  }
  const settings = loadPlatformSettings();
  if (est.category && settings.profilePolicies?.[est.category]) {
    return settings.profilePolicies[est.category].allowGuestCart;
  }
  // Bares e supermercados têm carrinho livre por padrão
  if (est.category === 'bar' || est.category === 'supermercado') {
    return true;
  }
  return true;
}

/**
 * Verifica se o fluxo de cobrança de plano está ativo para uma loja ou utilizadores de consumo.
 * Hierarquia de decisão:
 * 1. Configuração individual da loja (`est.isPlanBillingActive`)
 * 2. Política por perfil/categoria (`profilePolicies[est.category].isPlanBillingActive`)
 * 3. Master switch global da plataforma
 */
export function isPlanBillingActiveForEstablishment(est?: { isPlanBillingActive?: boolean; category?: string } | null): boolean {
  if (!est) {
    const settings = loadPlatformSettings();
    return settings.globalClientBillingFlowActive !== false;
  }
  if (typeof est.isPlanBillingActive === 'boolean') {
    return est.isPlanBillingActive;
  }
  const settings = loadPlatformSettings();
  if (est.category && settings.profilePolicies?.[est.category]) {
    return settings.profilePolicies[est.category].isPlanBillingActive;
  }
  return settings.globalClientBillingFlowActive !== false;
}

/**
 * Vai buscar as definições mais recentes ao Supabase (se configurado) e
 * atualiza a cópia local em localStorage, para que qualquer ecrã que leia
 * loadPlatformSettings() de forma síncrona (paymentConfig.ts,
 * SubscriptionPaymentModal.tsx) passe a usar os valores mais recentes assim
 * que a resposta chegar. Deve ser chamada uma vez no arranque da aplicação
 * (App.tsx) e sempre que se abre o ecrã de administração das definições.
 * Se o Supabase não estiver configurado, ou a tabela ainda não tiver dados,
 * simplesmente devolve o que já está guardado localmente.
 */
export async function hydratePlatformSettingsFromSupabase(): Promise<PlatformSettings> {
  try {
    const remote = await fetchPlatformSettingsFromSupabase();
    if (remote) {
      const merged = mergeWithDefaults(remote as Partial<PlatformSettings>);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // Offline ou Supabase não configurado — mantém o que já está em localStorage.
  }
  return loadPlatformSettings();
}
