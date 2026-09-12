import { PaymentOrderRecord } from './types';
import { recordOfflineChange } from './offlineSync';
import { syncPaymentOrderToSupabase, fetchPaymentOrdersFromSupabase } from './supabase';

const PAYMENT_ORDERS_KEY = 'axofacil_pedidos_pagamento';

export const INITIAL_PAYMENT_ORDERS: PaymentOrderRecord[] = [
  {
    id: 'pag-1001',
    customerName: 'Manuel Nhachungue',
    customerPhone: '849123456',
    customerEmail: 'm.nhachungue@gmail.com',
    targetType: 'loja',
    establishmentId: 'doce-amor',
    establishmentName: 'Doce Amor — Floraria',
    orderItemsSummary: 'Buquê Premium 24 Rosas Vermelhas (1x)',
    subtotalAmountMT: 3500,
    deliveryFeeMT: 200,
    totalAmountMT: 3700,
    paymentMethod: 'mpesa',
    referenceNumber: 'MP260807.1420.C89A',
    proofUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=600',
    status: 'confirmado',
    createdAt: '2026-08-07T14:20:00Z',
    confirmedAt: '2026-08-07T14:35:00Z',
    deliveryOption: 'estafeta_axofacil',
    deliveryAddress: 'Av. Julius Nyerere, nº 1200, Polana'
  },
  {
    id: 'pag-1002',
    customerName: 'Cláudia Macamo',
    customerPhone: '878899112',
    customerEmail: 'claudia.m@sapo.mz',
    targetType: 'shay',
    establishmentName: 'Plano Pro — Subscrição Anual Shay E-commerce',
    orderItemsSummary: 'Subscrição Anual Destaque Ouro + Loja Virtual',
    subtotalAmountMT: 12000,
    deliveryFeeMT: 0,
    totalAmountMT: 12000,
    paymentMethod: 'emola',
    referenceNumber: 'EML871425.9921',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
    status: 'pendente',
    createdAt: '2026-08-08T01:10:00Z',
    deliveryOption: 'pickup'
  },
  {
    id: 'pag-1003',
    customerName: 'Vicente Germano',
    customerPhone: '841234567',
    targetType: 'loja',
    establishmentId: 'loja-1',
    establishmentName: 'Boutique Elegance Maputo',
    orderItemsSummary: 'Vestido de Gala Seda Azul (1x)',
    subtotalAmountMT: 4500,
    deliveryFeeMT: 250,
    totalAmountMT: 4750,
    paymentMethod: 'transferencia_bancaria',
    referenceNumber: 'BIM-TAL-99482',
    proofUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=600',
    status: 'pendente',
    createdAt: '2026-08-08T01:45:00Z',
    deliveryOption: 'estafeta_axofacil',
    deliveryAddress: 'Av. 24 de Julho, Alto Maé'
  }
];

export function loadPaymentOrders(): PaymentOrderRecord[] {
  if (typeof localStorage === 'undefined') return INITIAL_PAYMENT_ORDERS;
  const stored = localStorage.getItem(PAYMENT_ORDERS_KEY);
  if (!stored) {
    savePaymentOrders(INITIAL_PAYMENT_ORDERS);
    return INITIAL_PAYMENT_ORDERS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_PAYMENT_ORDERS;
  }
}

export function savePaymentOrders(orders: PaymentOrderRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PAYMENT_ORDERS_KEY, JSON.stringify(orders));
  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
  // Sincroniza sempre com o Supabase — cobre tanto criação/atualização
  // individual como edições em lote (ex: AdminIncomingsCenter.tsx).
  orders.forEach(o => syncPaymentOrderToSupabase(o).catch(console.warn));
}

export function createPaymentOrder(order: Omit<PaymentOrderRecord, 'id' | 'createdAt' | 'status'>): PaymentOrderRecord {
  const all = loadPaymentOrders();
  const newOrder: PaymentOrderRecord = {
    ...order,
    id: `pag-${Date.now().toString().slice(-6)}`,
    status: 'pendente',
    createdAt: new Date().toISOString()
  };
  all.unshift(newOrder);
  savePaymentOrders(all);
  return newOrder;
}

/**
 * Busca os pedidos de pagamento gravados no Supabase e funde-os com os
 * registos locais (localStorage), para que o painel administrativo veja o
 * histórico completo mesmo quando o pedido foi criado noutro dispositivo.
 */
export async function hydratePaymentOrdersFromSupabase(): Promise<PaymentOrderRecord[]> {
  const local = loadPaymentOrders();
  try {
    const remote = await fetchPaymentOrdersFromSupabase();
    if (!remote || !Array.isArray(remote) || remote.length === 0) return local;

    const remoteMapped: PaymentOrderRecord[] = remote.map((r: any) => ({
      id: r.id,
      userId: r.user_id || undefined,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      customerEmail: r.customer_email || undefined,
      targetType: r.target_type,
      establishmentId: r.establishment_id || undefined,
      establishmentName: r.establishment_name,
      orderItemsSummary: r.order_items_summary,
      subtotalAmountMT: Number(r.subtotal_amount) || 0,
      deliveryFeeMT: Number(r.delivery_fee) || 0,
      totalAmountMT: Number(r.total_amount) || 0,
      paymentMethod: r.payment_method,
      referenceNumber: r.reference_number,
      proofUrl: r.proof_url || undefined,
      status: r.status,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at || undefined,
      rejectionReason: r.rejection_reason || undefined,
      adminNotes: r.admin_notes || undefined,
      deliveryOption: r.delivery_option || undefined,
      deliveryAddress: r.delivery_address || undefined
    }));

    const merged = new Map<string, PaymentOrderRecord>();
    [...remoteMapped, ...local].forEach(o => merged.set(o.id, o));
    const result = Array.from(merged.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    savePaymentOrders(result);
    return result;
  } catch (e) {
    console.warn('Não foi possível sincronizar pedidos de pagamento do Supabase:', e);
    return local;
  }
}

export function updatePaymentOrderStatus(
  orderId: string, 
  status: 'confirmado' | 'rejeitado', 
  notes?: string
): PaymentOrderRecord | null {
  const all = loadPaymentOrders();
  const index = all.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  all[index].status = status;
  if (status === 'confirmado') {
    all[index].confirmedAt = new Date().toISOString();
  }
  if (notes) {
    if (status === 'rejeitado') {
      all[index].rejectionReason = notes;
    }
    all[index].adminNotes = notes;
  }

  savePaymentOrders(all);
  return all[index];
}
