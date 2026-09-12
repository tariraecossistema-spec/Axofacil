import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'empresa' | 'prestador' | 'cliente' | string;
  phone?: string;
  city?: string;
  created_at?: string;
}

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

// Environment variables for Supabase (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')
);

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  return clientInstance;
}

// Lazy client creation proxy to maintain backward compatibility
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? getSupabaseClient()
  : null;

/**
 * Password Recovery (Forgot Password flow)
 * Submits email and requests a password recovery link with #type=recovery redirect URL
 */
export const handleForgotPassword = async (emailToReset: string): Promise<string> => {
  const cleanEmail = emailToReset.trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Por favor, introduza o seu e-mail.');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');

  // Constrói o URL de retorno incluindo a âncora de recuperação
  const redirectUrl = `${window.location.origin}${window.location.pathname}#type=recovery`;

  const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: redirectUrl,
  });

  if (error) throw error;
  return 'Link de recuperação enviado com sucesso! Verifique a sua caixa de entrada e spam.';
};

/**
 * Password Update (Reset Password flow after clicking email link)
 * Updates the user's password in Supabase and cleans the URL hash
 */
export const handleUpdatePassword = async (newPassword: string, confirmPassword: string): Promise<string> => {
  if (newPassword.length < 6) {
    throw new Error('A palavra-passe deve ter pelo menos 6 caracteres.');
  }
  if (newPassword !== confirmPassword) {
    throw new Error('As palavras-passe não coincidem.');
  }

  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase não configurado.');

  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  // Limpa o hash da URL para evitar reabertura involuntária ao recarregar a página
  if (typeof window !== 'undefined' && window.history?.replaceState) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  return 'Palavra-passe atualizada com sucesso! A entrar no portal...';
};

/**
 * Normaliza contacto telefónico ou e-mail para um e-mail canónico válido exigido pelo Supabase GoTrue Auth.
 * Se for número moçambicano (ex: 841234567, +258841234567, 871425316), converte para formato canónico ${digits}@axofacil.mz.
 */
export function normalizeContactToEmail(contactOrEmail: string): string {
  if (!contactOrEmail) return '';
  const trimmed = contactOrEmail.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return `${trimmed}@axofacil.mz`;
  return `${digits}@axofacil.mz`;
}

/**
 * Authentication Helpers for Supabase
 */
export async function supabaseSignUp(email: string, pass: string, metadata: Record<string, any> = {}) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.');
  }

  const canonicalEmail = normalizeContactToEmail(email);
  const rawContact = email.trim();

  const userMeta = {
    ...metadata,
    name: metadata?.name || metadata?.full_name || rawContact.split('@')[0],
    full_name: metadata?.name || metadata?.full_name || rawContact.split('@')[0],
    role: metadata?.role || 'cliente',
    phone: metadata?.phone || rawContact,
    raw_contact: rawContact,
    company_name: metadata?.storeName || metadata?.companyName || '',
    subscription_plan: metadata?.subscriptionPlan || 'Gratuito',
    is_phone_account: !rawContact.includes('@')
  };

  const { data, error } = await client.auth.signUp({
    email: canonicalEmail,
    password: pass,
    options: {
      data: userMeta
    }
  });
  if (error) throw error;
  
  // Also sync profile record to public.profiles table
  if (data?.user) {
    await syncUserProfileToSupabase({
      id: data.user.id,
      emailOrPhone: rawContact,
      email: canonicalEmail,
      phone: rawContact,
      name: userMeta.name,
      displayName: userMeta.name,
      role: userMeta.role,
      storeName: userMeta.company_name,
      subscriptionPlan: userMeta.subscription_plan,
      isPremium: true
    }).catch(console.warn);
  }

  return data;
}

export async function supabaseSignIn(email: string, pass: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.');
  }

  const canonicalEmail = normalizeContactToEmail(email);
  const rawContact = email.trim();

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: canonicalEmail,
      password: pass
    });
    if (!error && data) return data;
    if (error && canonicalEmail === rawContact) throw error;
  } catch (firstErr) {
    if (rawContact !== canonicalEmail) {
      const { data, error } = await client.auth.signInWithPassword({
        email: rawContact,
        password: pass
      });
      if (error) throw error;
      return data;
    }
    throw firstErr;
  }
}

export async function supabaseSignInWithGoogle() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis de ambiente.');
  }
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${window.location.pathname}`
    }
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function supabaseResetPassword(email: string) {
  return handleForgotPassword(email);
}

/**
 * Portal Form & Data Synchronization Functions for Supabase
 */

export async function syncUserProfileToSupabase(user: any) {
  const client = getSupabaseClient();
  if (!client || !user) return;
  try {
    const rawContact = (user.emailOrPhone || user.email || user.phone || '').trim();
    const canonicalEmail = normalizeContactToEmail(rawContact);
    const fullName = user.name || user.displayName || user.full_name || rawContact.split('@')[0];
    const role = user.role || 'cliente';
    const storeName = user.storeName || user.clientOrStoreName || user.company_name || null;
    const plan = user.subscriptionPlan || user.subscription_plan || 'Gratuito';

    const isUUID = user.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    
    // Obter UID atual de autenticação no Supabase se disponível
    let targetId = isUUID ? user.id : null;
    if (!targetId) {
      try {
        const { data: authUser } = await client.auth.getUser();
        if (authUser?.user?.id) {
          targetId = authUser.user.id;
        }
      } catch (e) {
        // ignore
      }
    }

    // Se ainda não temos UUID, verificar se existe perfil já gravado com este email ou contacto
    if (!targetId && (canonicalEmail || rawContact)) {
      try {
        const { data: existing } = await client
          .from('profiles')
          .select('id')
          .or(`email.eq.${canonicalEmail},email.eq.${rawContact},phone.eq.${rawContact}`)
          .maybeSingle();
        if (existing?.id) {
          targetId = existing.id;
        }
      } catch (e) {
        // ignore
      }
    }

    const payload: Record<string, any> = {
      full_name: fullName,
      email: canonicalEmail,
      phone: user.phone || rawContact,
      role: role,
      company_name: storeName,
      subscription_plan: plan,
      is_premium: Boolean(user.isPremium ?? true),
      trial_started_at: user.trialStartedAt || null,
      trial_ends_at: user.trialEndsAt || null,
      trial_status: user.trialStatus || null,
      updated_at: new Date().toISOString()
    };

    if (targetId) {
      payload.id = targetId;
      const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) console.warn('Supabase profile upsert note:', error.message);
    } else {
      const { error } = await client.from('profiles').upsert(payload, { onConflict: 'email' });
      if (error) {
        await client.from('profiles').update(payload).eq('email', canonicalEmail);
      }
    }
  } catch (err) {
    console.warn('Supabase profile sync error:', err);
  }
}

/**
 * Busca o perfil do utilizador diretamente na tabela public.profiles do Supabase,
 * suportando tanto e-mail tradicional quanto número de telemóvel moçambicano.
 */
export async function fetchUserProfileByContactFromSupabase(emailOrPhone: string): Promise<any | null> {
  const client = getSupabaseClient();
  if (!client || !emailOrPhone) return null;
  try {
    const raw = emailOrPhone.trim().toLowerCase();
    const canonical = normalizeContactToEmail(raw);

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .or(`email.ilike.${raw},email.ilike.${canonical},phone.ilike.${raw}`)
      .maybeSingle();

    if (error) {
      console.warn('Supabase profile fetch note:', error.message);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id,
      name: data.full_name || data.name || raw.split('@')[0],
      displayName: data.full_name || data.name,
      emailOrPhone: data.phone || raw,
      email: data.email || canonical,
      phone: data.phone || raw,
      role: data.role || 'cliente',
      storeName: data.company_name,
      clientOrStoreName: data.company_name,
      subscriptionPlan: data.subscription_plan || 'Gratuito',
      isPremium: Boolean(data.is_premium),
      isVerified: Boolean(data.is_verified),
      trialStartedAt: data.trial_started_at || undefined,
      trialEndsAt: data.trial_ends_at || undefined,
      trialStatus: data.trial_status || undefined,
      created_at: data.created_at
    };
  } catch (err) {
    console.warn('Supabase profile fetch error:', err);
    return null;
  }
}

/**
 * Persistent Deletion Handlers for Supabase
 */
export async function deleteEstablishmentFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client || !id) return;
  try {
    const { error } = await client.from('establishments').delete().eq('id', id);
    if (error) console.warn('Supabase delete establishment note:', error.message);
  } catch (err) {
    console.warn('Supabase delete establishment error:', err);
  }
}

export async function deleteProductFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client || !id) return;
  try {
    const { error } = await client.from('products').delete().eq('id', id);
    if (error) console.warn('Supabase delete product note:', error.message);
  } catch (err) {
    console.warn('Supabase delete product error:', err);
  }
}

export async function deleteUserProfileFromSupabase(id: string, emailOrPhone?: string) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      await client.from('profiles').delete().eq('id', id);
    } else if (emailOrPhone) {
      const raw = emailOrPhone.trim().toLowerCase();
      const canonical = normalizeContactToEmail(raw);
      await client.from('profiles').delete().or(`email.eq.${raw},email.eq.${canonical},phone.eq.${raw}`);
    }
  } catch (err) {
    console.warn('Supabase delete profile error:', err);
  }
}

export async function syncEstablishmentToSupabase(est: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const payload: Record<string, any> = {
      id: est.id,
      name: est.name,
      category: est.category,
      zone: est.zone,
      province: est.province,
      address: est.address,
      endereco_texto: est.addressText || est.address,
      latitude: est.latitude ?? null,
      longitude: est.longitude ?? null,
      location_landmarks: est.locationLandmarks ?? null,
      description: est.description,
      contact_phone: est.contactPhone,
      sales_type: est.salesType,
      is_active: est.isActive,
      allow_guest_cart: est.allowGuestCart !== undefined ? est.allowGuestCart : true,
      is_plan_billing_active: est.isPlanBillingActive !== undefined ? est.isPlanBillingActive : true,
      updated_at: new Date().toISOString(),
      raw_json: est
    };

    const { error } = await client.from('establishments').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Se a coluna ainda não foi migrada no Supabase, tenta upsert sem as novas colunas específicas (mantendo-as intactas no raw_json)
      if (error.message && (error.message.includes('allow_guest_cart') || error.message.includes('is_plan_billing_active'))) {
        delete payload.allow_guest_cart;
        delete payload.is_plan_billing_active;
        await client.from('establishments').upsert(payload, { onConflict: 'id' });
      } else {
        console.warn('Supabase establishment sync note:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase establishment sync error:', err);
  }
}

export async function syncDeliveryPartnerToSupabase(partner: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('delivery_partners').upsert({
      id: partner.id,
      name: partner.name,
      vehicle_type: partner.vehicleType,
      plate_number: partner.plateNumber,
      residence_zone: partner.residenceZone,
      phone: partner.phone,
      base_rate: partner.baseRate,
      is_available: partner.isAvailable,
      latitude: partner.latitude ?? null,
      longitude: partner.longitude ?? null,
      updated_at: new Date().toISOString(),
      raw_json: partner
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase delivery partner sync note:', error.message);
  } catch (err) {
    console.warn('Supabase delivery partner sync error:', err);
  }
}

export async function syncOrderToSupabase(order: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('orders').upsert({
      id: order.id,
      user_id: order.userId || null,
      establishment_id: order.establishmentId || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      items: order.itemsOrService ? [{ summary: order.itemsOrService }] : [],
      total_amount: order.totalAmount ?? 0,
      payment_method: order.paymentMethod || 'm-pesa',
      payment_status: order.status === 'Concluído' || order.status === 'Confirmado' ? 'confirmado' : (order.status === 'Cancelado' ? 'rejeitado' : 'pendente'),
      order_status: order.status || 'novo',
      delivery_address: order.deliveryAddress || 'A combinar',
      created_at: order.date ? new Date(order.date).toISOString() : new Date().toISOString(),
      raw_json: order
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase order sync note:', error.message);
  } catch (err) {
    console.warn('Supabase order sync error:', err);
  }
}

export async function syncFinancialTxToSupabase(tx: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('financial_transactions').upsert({
      id: tx.id,
      establishment_id: tx.establishmentId || null,
      type: tx.type === 'despesa' ? 'despesa' : 'receita',
      amount: tx.amountMT ?? tx.amount ?? 0,
      category: tx.category || null,
      description: tx.description,
      payment_gateway: tx.paymentMethod || 'm-pesa',
      reference_code: tx.referenceOrderNumber || null,
      status: tx.status || 'concluido',
      created_at: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
      raw_json: tx
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase transaction sync note:', error.message);
  } catch (err) {
    console.warn('Supabase transaction sync error:', err);
  }
}

/**
 * Pedidos de Pagamento (comprovativos manuais de M-Pesa/e-Mola/Transferência
 * Bancária, incluindo subscrições de planos e compras em lojas). Antes desta
 * função, estes registos existiam apenas em localStorage (ver paymentStore.ts)
 * e não ficavam disponíveis no Supabase nem visíveis fora do navegador que
 * criou o pedido.
 */
export async function syncPaymentOrderToSupabase(order: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('payment_orders').upsert({
      id: order.id,
      user_id: order.userId || null,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      customer_email: order.customerEmail || null,
      target_type: order.targetType,
      establishment_id: order.establishmentId || null,
      establishment_name: order.establishmentName,
      order_items_summary: order.orderItemsSummary,
      subtotal_amount: order.subtotalAmountMT,
      delivery_fee: order.deliveryFeeMT,
      total_amount: order.totalAmountMT,
      payment_method: order.paymentMethod,
      reference_number: order.referenceNumber,
      proof_url: order.proofUrl || null,
      status: order.status,
      created_at: order.createdAt || new Date().toISOString(),
      confirmed_at: order.confirmedAt || null,
      rejection_reason: order.rejectionReason || null,
      admin_notes: order.adminNotes || null,
      delivery_option: order.deliveryOption || null,
      delivery_address: order.deliveryAddress || null,
      raw_json: order
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase payment order sync note:', error.message);
  } catch (err) {
    console.warn('Supabase payment order sync error:', err);
  }
}

export async function fetchPaymentOrdersFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('payment_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Error fetching payment orders from Supabase:', err);
    return null;
  }
}

/**
 * Registos manuais de pagamento (tabela "Faturamento" do painel admin —
 * PaymentRecord). Antes desta função, savePayments() em data.ts só gravava
 * em localStorage; agora cada registo fica também na tabela
 * financial_transactions do Supabase.
 */
export async function syncManualPaymentRecordToSupabase(payment: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const numericAmount = typeof payment.amount === 'string'
      ? parseFloat(payment.amount.replace(/[^0-9.]/g, '')) || 0
      : (payment.amount || 0);
    const status = payment.status === 'Aprovado' ? 'concluido'
      : payment.status === 'Isento (15 Dias)' ? 'isento_trial'
      : 'pendente';

    const { error } = await client.from('financial_transactions').upsert({
      id: payment.id,
      type: 'receita',
      amount: numericAmount,
      category: 'Subscrição / Faturamento Manual',
      description: `Pagamento — ${payment.establishmentName}`,
      payment_gateway: payment.method,
      reference_code: payment.referenceNumber || null,
      status,
      created_at: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString(),
      raw_json: payment
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase manual payment sync note:', error.message);
  } catch (err) {
    console.warn('Supabase manual payment sync error:', err);
  }
}

/**
 * Submissões administrativas (candidaturas de parceiros, promoções, novos
 * estafetas, etc. — tabela admin_submissions, já existia no schema mas
 * nunca tinha sido ligada ao código).
 */
export async function syncAdminSubmissionToSupabase(submission: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const statusMap: Record<string, string> = { 'Aprovado': 'aprovado', 'Pendente': 'pendente', 'Rejeitado': 'rejeitado' };
    const { error } = await client.from('admin_submissions').upsert({
      id: submission.id,
      type: submission.type,
      applicant_name: submission.name,
      applicant_contact: submission.contact,
      data: { details: submission.details, imageUrl: submission.imageUrl, date: submission.date },
      status: statusMap[submission.status] || 'pendente',
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase submission sync note:', error.message);
  } catch (err) {
    console.warn('Supabase submission sync error:', err);
  }
}

export async function syncInventoryItemToSupabase(item: any) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const { error } = await client.from('inventory_items').upsert({
      id: item.id,
      establishment_id: item.establishmentId || null,
      name: item.name,
      category: item.category || 'geral',
      price: item.sellingPriceMT ?? item.price ?? 0,
      stock_quantity: item.quantityInStock ?? item.stock_quantity ?? 0,
      unit: item.unit || 'unidade',
      image_url: item.imageUrl || null,
      updated_at: new Date().toISOString(),
      raw_json: item
    }, { onConflict: 'id' });
    if (error) console.warn('Supabase inventory sync note:', error.message);
  } catch (err) {
    console.warn('Supabase inventory sync error:', err);
  }
}

/**
 * Definições da Plataforma (Contas de Recebimento M-Pesa/e-Mola/Banco &
 * Planos de Subscrição). Guardadas num único registo ("default") na tabela
 * public.platform_settings, para que fiquem disponíveis em qualquer
 * dispositivo/sessão de administração — não apenas no localStorage local.
 */
export async function syncPlatformSettingsToSupabase(settings: {
  paymentAccounts: any;
  businessPlans: any;
  clientPlans: any;
  globalClientBillingFlowActive?: boolean;
  profilePolicies?: any;
}) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    const payload: Record<string, any> = {
      id: 'default',
      payment_accounts: settings.paymentAccounts,
      business_plans: settings.businessPlans,
      client_plans: settings.clientPlans,
      global_client_billing_flow_active: settings.globalClientBillingFlowActive,
      profile_policies: settings.profilePolicies,
      updated_at: new Date().toISOString()
    };

    const { error } = await client.from('platform_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      if (error.message && (error.message.includes('global_client_billing_flow_active') || error.message.includes('profile_policies'))) {
        delete payload.global_client_billing_flow_active;
        delete payload.profile_policies;
        await client.from('platform_settings').upsert(payload, { onConflict: 'id' });
      } else {
        console.warn('Supabase platform_settings sync note:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase platform_settings sync error:', err);
  }
}

export async function fetchPlatformSettingsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('platform_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      paymentAccounts: data.payment_accounts,
      businessPlans: data.business_plans,
      clientPlans: data.client_plans,
      globalClientBillingFlowActive: data.global_client_billing_flow_active,
      profilePolicies: data.profile_policies,
    };
  } catch (err) {
    console.warn('Error fetching platform_settings from Supabase:', err);
    return null;
  }
}

/**
 * Fetch functions from Supabase tables with fallback
 */

// Converte uma linha crua da tabela `establishments` do Supabase para o formato
// usado no resto da aplicação (mesma forma usada tanto na leitura inicial como
// nos eventos em tempo real do Realtime, para nunca haver divergência entre os dois).
export function mapSupabaseRowToEstablishment(row: any): any {
  const raw = row.raw_json || {};
  return {
    ...raw,
    id: row.id,
    name: row.name || raw.name,
    category: row.category || raw.category,
    zone: row.zone || raw.zone,
    address: row.address || raw.address,
    isActive: row.is_active !== undefined ? row.is_active : (raw.isActive !== undefined ? raw.isActive : true),
    allowGuestCart: row.allow_guest_cart !== undefined ? row.allow_guest_cart : (raw.allowGuestCart !== undefined ? raw.allowGuestCart : true),
    isPlanBillingActive: row.is_plan_billing_active !== undefined ? row.is_plan_billing_active : (raw.isPlanBillingActive !== undefined ? raw.isPlanBillingActive : true),
  };
}

export async function fetchEstablishmentsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('establishments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return null;
    return data.map(mapSupabaseRowToEstablishment);
  } catch (err) {
    console.warn('Error fetching establishments from Supabase:', err);
    return null;
  }
}

/**
 * Subscreve às alterações em tempo real (INSERT/UPDATE/DELETE) da tabela
 * `establishments` no Supabase Realtime. Isto é o que garante que, quando um
 * administrador elimina/edita/cria um estabelecimento num dispositivo, todos
 * os outros dispositivos com a app aberta (telemóvel, tablet, outro browser)
 * vejam a mudança em tempo real, sem precisar recarregar a página.
 *
 * Retorna o canal (para poder cancelar a subscrição no cleanup do useEffect)
 * ou null se o Supabase não estiver configurado.
 */
export function subscribeToEstablishmentsRealtime(
  onChange: (eventType: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void
) {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const channel = client
      .channel('realtime:public:establishments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'establishments' },
        (payload: any) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const row = eventType === 'DELETE' ? payload.old : payload.new;
          if (row) onChange(eventType, row);
        }
      )
      .subscribe();
    return channel;
  } catch (err) {
    console.warn('Erro ao subscrever Supabase Realtime (establishments):', err);
    return null;
  }
}

export async function fetchOrdersFromSupabase(userId?: string) {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    let query = client.from('orders').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Error fetching orders from Supabase:', err);
    return null;
  }
}

export async function fetchUserProfileFromSupabase(userId: string) {
  const client = getSupabaseClient();
  if (!client || !userId) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch (err) {
    console.warn('Error fetching profile from Supabase:', err);
    return null;
  }
}

/**
 * Image Upload Synchronization to Supabase Storage & Media Table
 */
export async function uploadImageToSupabaseStorage(file: File, imgbbUrl?: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload binary file to Supabase Storage bucket 'images' or 'uploads'
    const { data, error } = await client.storage
      .from('images')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    let supabasePublicUrl = '';
    if (!error && data) {
      const { data: urlData } = client.storage.from('images').getPublicUrl(filePath);
      supabasePublicUrl = urlData?.publicUrl || '';
    }

    // Also insert record into Supabase 'media' or 'image_uploads' table
    try {
      await client.from('media').insert({
        file_name: fileName,
        file_size: file.size,
        mime_type: file.type,
        imgbb_url: imgbbUrl || '',
        supabase_url: supabasePublicUrl,
        created_at: new Date().toISOString()
      });
    } catch (mErr) {
      console.warn('Supabase media table insert note:', mErr);
    }

    return supabasePublicUrl || null;
  } catch (err) {
    console.warn('Supabase storage upload error:', err);
    return null;
  }
}

