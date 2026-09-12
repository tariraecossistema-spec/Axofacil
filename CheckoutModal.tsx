import React, { useState, useEffect } from 'react';
import { UserProfile, CartItem, PaymentOrderRecord, OrderRecord } from "./types";
import { getPaymentConfigForEstablishment } from "./paymentConfig";
import { createPaymentOrder } from "./paymentStore";
import { loadOrders, saveOrders } from "./data";
import { recordAdminAction } from "./adminAuditStore";
import CloudinaryUpload from './CloudinaryUpload';
import { 
  X, CheckCircle2, Copy, Check, AlertTriangle, Clock, Smartphone, 
  Building2, FileText, ArrowRight, ShieldCheck, ChevronRight,
  User, Phone, MapPin, Mail, Sparkles, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notify } from "./dialogs";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotalMT: number;
  deliveryFeeMT: number;
  deliveryOption: 'pickup' | 'estafeta_axofacil' | 'propria_loja';
  deliveryAddress: string;
  establishmentId?: string;
  establishmentName: string;
  targetType: 'shay' | 'loja';
  currentUser?: UserProfile | null;
  onSuccessSubmitted?: (order: PaymentOrderRecord) => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  subtotalMT,
  deliveryFeeMT,
  deliveryOption,
  deliveryAddress,
  establishmentId,
  establishmentName,
  targetType,
  currentUser,
  onSuccessSubmitted
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'emola' | 'transferencia_bancaria'>('mpesa');
  
  // Customer personal details for purchase validation (mandatory for both guest and authenticated users)
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || currentUser?.emailOrPhone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerCityOrNeighborhood, setCustomerCityOrNeighborhood] = useState(currentUser?.city || 'Maputo');
  const [deliveryAddressInput, setDeliveryAddressInput] = useState(deliveryAddress || '');
  const [customerNuit, setCustomerNuit] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  
  // Payment confirmation details
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [copySuccessField, setCopySuccessField] = useState<string | null>(null);

  // Flow State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<PaymentOrderRecord | null>(null);

  // Synchronize delivery address if changed upstream
  useEffect(() => {
    if (deliveryAddress && !deliveryAddressInput) {
      setDeliveryAddressInput(deliveryAddress);
    }
  }, [deliveryAddress]);

  if (!isOpen) return null;

  const totalAmountMT = subtotalMT + deliveryFeeMT;
  const paymentConfig = getPaymentConfigForEstablishment(establishmentId, establishmentName);

  // Compute available methods for this store or platform
  const isMpesaAvailable = targetType === 'shay' || paymentConfig.mpesa.isConfigured;
  const isEmolaAvailable = targetType === 'shay' || paymentConfig.emola.isConfigured;
  const isBancoAvailable = targetType === 'shay' || paymentConfig.banco.isConfigured;
  const hasAnyPaymentMethod = targetType === 'shay' || paymentConfig.hasAnyConfigured;

  // Auto-switch selectedMethod if current selection is not available
  useEffect(() => {
    if (targetType === 'loja') {
      if (selectedMethod === 'mpesa' && !isMpesaAvailable) {
        if (isEmolaAvailable) setSelectedMethod('emola');
        else if (isBancoAvailable) setSelectedMethod('transferencia_bancaria');
      } else if (selectedMethod === 'emola' && !isEmolaAvailable) {
        if (isMpesaAvailable) setSelectedMethod('mpesa');
        else if (isBancoAvailable) setSelectedMethod('transferencia_bancaria');
      } else if (selectedMethod === 'transferencia_bancaria' && !isBancoAvailable) {
        if (isMpesaAvailable) setSelectedMethod('mpesa');
        else if (isEmolaAvailable) setSelectedMethod('emola');
      }
    }
  }, [targetType, isMpesaAvailable, isEmolaAvailable, isBancoAvailable, selectedMethod]);

  // Copy helper
  const handleCopy = (text: string, fieldLabel: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessField(fieldLabel);
    setTimeout(() => setCopySuccessField(null), 2500);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = customerName.trim();
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const trimmedAddress = deliveryAddressInput.trim();
    const trimmedRef = referenceNumber.trim();

    // Validação estrita dos dados pessoais do cliente para validar a compra
    if (!trimmedName || trimmedName.length < 3) {
      notify('Por favor preencha o seu Nome Completo (mínimo 3 caracteres) para validar a compra.', 'error');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      notify('Por favor insira um contacto telefónico/WhatsApp válido (ex: 841234567 ou 871425316).', 'error');
      return;
    }

    if (deliveryOption !== 'pickup' && (!trimmedAddress || trimmedAddress.length < 4)) {
      notify('Por favor preencha o endereço ou ponto de referência completo para a entrega.', 'error');
      return;
    }

    if (!trimmedRef || trimmedRef.length < 3) {
      notify('Por favor insira a referência ou código da transação/talão de pagamento.', 'error');
      return;
    }

    setIsSubmitting(true);

    const itemsSummary = items.length > 0 
      ? items.map(i => `${i.productName} (${i.quantity}x)`).join(' + ')
      : 'Serviço/Subscrição Axofácil';

    setTimeout(() => {
      const userIdent = currentUser?.id || (currentUser ? currentUser.emailOrPhone : undefined);
      const isGuest = !currentUser;

      const newOrder = createPaymentOrder({
        userId: userIdent,
        customerName: trimmedName,
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerNuit: customerNuit.trim() || undefined,
        customerCityOrNeighborhood: customerCityOrNeighborhood.trim() || undefined,
        isGuestCheckout: isGuest,
        orderNotes: orderNotes.trim() || undefined,
        targetType,
        establishmentId,
        establishmentName,
        orderItemsSummary: itemsSummary,
        itemsDetail: items,
        subtotalAmountMT: subtotalMT,
        deliveryFeeMT,
        totalAmountMT,

        paymentMethod: selectedMethod,
        referenceNumber: trimmedRef,
        proofUrl: proofUrl || undefined,
        deliveryOption,
        deliveryAddress: trimmedAddress || undefined
      });

      // Also persist to store orders
      try {
        const allDirectOrders = loadOrders();
        const newDirectOrder: OrderRecord = {
          id: `ord-${Date.now().toString().slice(-6)}`,
          userId: userIdent,
          establishmentId: establishmentId || 'geral',
          establishmentName: establishmentName || 'Axofácil Moçambique',
          category: (targetType === 'loja' ? 'loja' : 'servico') as any,
          customerName: trimmedName,
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
          customerNuit: customerNuit.trim() || undefined,
          customerCityOrNeighborhood: customerCityOrNeighborhood.trim() || undefined,
          isGuestCheckout: isGuest,
          orderType: 'pedido_compra',
          itemsOrService: itemsSummary,
          totalAmount: totalAmountMT,
          paymentMethod: selectedMethod === 'transferencia_bancaria' ? 'Transferência BCI/BIM' : (selectedMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'),
          status: 'Pendente',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
          deliveryOption,
          deliveryAddress: trimmedAddress || undefined,
          notes: `Ref. Pagamento: ${trimmedRef}${orderNotes ? ' · Obs: ' + orderNotes.trim() : ''}${customerNuit ? ' · NUIT: ' + customerNuit.trim() : ''}${isGuest ? ' [Cliente Convidado - Carrinho Livre]' : ''}`
        };
        allDirectOrders.unshift(newDirectOrder);
        saveOrders(allDirectOrders);
      } catch (e) {
        console.warn('Erro ao guardar pedido nas encomendas da loja:', e);
      }

      // Record in Admin Panel Central Activity & Audit Log
      recordAdminAction({
        type: 'pedido_compra',
        title: `Novo Pedido / Compra: ${establishmentName} · ${totalAmountMT.toLocaleString()} MT ${isGuest ? '(Cliente Convidado)' : ''}`,
        userName: trimmedName,
        userContact: customerPhone.trim(),
        userEmail: customerEmail.trim() || undefined,
        categoryOrSegment: targetType === 'loja' ? 'loja' : 'servico',
        amountMT: totalAmountMT,
        details: `Novo pedido de compra online · Estabelecimento: ${establishmentName} · Artigos: ${itemsSummary} · Total: ${totalAmountMT.toLocaleString()} MT (Taxa Entrega: ${deliveryFeeMT} MT) · Modo: ${selectedMethod.toUpperCase()} · Ref: ${trimmedRef} · Entrega: ${deliveryOption} ${trimmedAddress ? '· Destino: ' + trimmedAddress : ''}${customerNuit ? ' · NUIT: ' + customerNuit : ''} · Tipo: ${isGuest ? 'Cliente Convidado (Sem Conta)' : 'Cliente Registado'}`,
        status: 'Pendente',
        metadata: {
          orderId: newOrder.id,
          establishmentId,
          establishmentName,
          referenceNumber: trimmedRef,
          proofUrl: proofUrl || undefined,
          totalAmountMT,
          itemsCount: items.length,
          isGuestCheckout: isGuest,
          customerCityOrNeighborhood: customerCityOrNeighborhood.trim() || undefined,
          customerNuit: customerNuit.trim() || undefined,
          orderNotes: orderNotes.trim() || undefined
        }
      });

      setIsSubmitting(false);
      setSubmittedOrder(newOrder);
      if (onSuccessSubmitted) onSuccessSubmitted(newOrder);
    }, 800);
  };

  // Selected method config
  const methodData = paymentConfig[selectedMethod === 'transferencia_bancaria' ? 'banco' : selectedMethod];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/70 backdrop-blur-xs overflow-y-auto font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-paper w-full max-w-2xl rounded-3xl shadow-2xl border border-ink/10 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-deep text-white p-5 sm:p-6 flex justify-between items-center shrink-0 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 text-xs font-bold py-1 px-3 rounded-full border border-indigo-400/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser ? 'Pagamento Manual Assistido' : 'Compra Imediata · Validação Obrigatória'}</span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Finalizar Pedido — {establishmentName}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-paper/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-ink">
          {submittedOrder ? (
            /* SUCCESS STATE SCREEN */
            <div className="text-center py-6 space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Estado: Pagamento em Verificação
                </span>
                <h3 className="font-serif font-bold text-2xl text-ink">
                  O seu comprovativo foi enviado com sucesso!
                </h3>
                <p className="text-sm text-ink/70 max-w-lg mx-auto leading-relaxed">
                  Referência registada: <strong className="text-indigo-deep font-mono">{submittedOrder.referenceNumber}</strong>.<br/>
                  O operador de <strong>{establishmentName}</strong> validará a transferência e entrará em contacto pelo WhatsApp/telefone registado.
                </p>
              </div>

              {/* Verified Personal Details Summary Box */}
              <div className="bg-sand-1/60 p-4 sm:p-5 rounded-2xl border border-ink/10 max-w-lg mx-auto text-left text-xs space-y-3">
                <div className="font-bold text-ink flex items-center justify-between border-b border-ink/10 pb-2">
                  <span className="flex items-center gap-1.5 text-indigo-deep">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dados Pessoais Registados para Validação:</span>
                  </span>
                  {submittedOrder.isGuestCheckout ? (
                    <span className="text-[10.5px] bg-emerald-100 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Carrinho Livre
                    </span>
                  ) : (
                    <span className="text-[10.5px] bg-indigo-100 text-indigo-900 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Cliente Registado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-ink/80 text-[11.5px]">
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase font-bold">Nome do Cliente</span>
                    <span className="font-bold text-ink text-xs">{submittedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-ink/50 block text-[10px] uppercase font-bold">Telefone / WhatsApp</span>
                    <span className="font-mono font-bold text-indigo-deep text-xs">{submittedOrder.customerPhone}</span>
                  </div>
                  {submittedOrder.deliveryAddress && (
                    <div className="sm:col-span-2">
                      <span className="text-ink/50 block text-[10px] uppercase font-bold">
                        {submittedOrder.deliveryOption === 'pickup' ? 'Local / Ponto de Levantamento' : 'Endereço de Entrega'}
                      </span>
                      <span className="font-medium text-ink">{submittedOrder.deliveryAddress}</span>
                    </div>
                  )}
                  {submittedOrder.customerNuit && (
                    <div>
                      <span className="text-ink/50 block text-[10px] uppercase font-bold">NUIT Fiscal</span>
                      <span className="font-mono font-bold text-ink">{submittedOrder.customerNuit}</span>
                    </div>
                  )}
                  {submittedOrder.customerEmail && (
                    <div>
                      <span className="text-ink/50 block text-[10px] uppercase font-bold">E-mail</span>
                      <span className="text-ink">{submittedOrder.customerEmail}</span>
                    </div>
                  )}
                  {submittedOrder.orderNotes && (
                    <div className="sm:col-span-2">
                      <span className="text-ink/50 block text-[10px] uppercase font-bold">Observações do Pedido</span>
                      <span className="text-ink italic">{submittedOrder.orderNotes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimate times */}
              <div className="bg-sand-1/60 p-4 rounded-2xl border border-ink/10 max-w-lg mx-auto text-left text-xs space-y-2">
                <div className="font-bold text-ink flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-brand" />
                  <span>Prazos médios de confirmação:</span>
                </div>
                <ul className="text-ink/70 space-y-1 list-disc list-inside">
                  <li><strong>M-Pesa / e-Mola:</strong> Instantâneo a poucas horas.</li>
                  <li><strong>Transferência Bancária:</strong> Até 1 a 2 dias úteis.</li>
                </ul>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={onClose}
                  className="py-3 px-8 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Concluir & Voltar à Loja
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={handleConfirmSubmit} className="space-y-6">
              
              {/* Order Summary Box */}
              <div className="bg-sand-1/50 p-4 sm:p-5 rounded-2xl border border-ink/10 space-y-3">
                <div className="flex justify-between items-center border-b border-ink/10 pb-2.5">
                  <span className="text-xs font-bold text-ink/60 uppercase tracking-wider">Resumo da Compra</span>
                  <span className="text-xs bg-indigo-deep/10 text-indigo-deep font-bold px-2.5 py-0.5 rounded-full">
                    {items.length} item(ns)
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs pr-1">
                  {items.map((item, idx) => (
                    <div key={`${item.id || 'chk'}-${idx}`} className="flex justify-between items-center text-ink/80">
                      <span className="font-medium truncate max-w-[280px]">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-bold text-ink">{item.unitPriceMT * item.quantity} MT</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink/10 pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-ink/70">
                    <span>Subtotal Produtos (c/ IVA 16%):</span>
                    <span>{subtotalMT} MT</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 text-[11px] font-medium pl-2 border-l-2 border-emerald-500">
                    <span>↳ Imposto IVA (16% incluso):</span>
                    <span>{subtotalMT - Math.round(subtotalMT / 1.16)} MT</span>
                  </div>
                  <div className="flex justify-between text-ink/70">
                    <span>Opção de Entrega ({deliveryOption === 'pickup' ? 'Levantamento' : 'Estafeta'}):</span>
                    <span>{deliveryFeeMT > 0 ? `${deliveryFeeMT} MT` : 'Grátis'}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-indigo-deep pt-1.5 border-t border-ink/10">
                    <span>Total Final a Pagar em MZN:</span>
                    <span className="text-xl font-serif text-terracotta">{totalAmountMT} MT</span>
                  </div>
                </div>
              </div>

              {/* Customer Personal Details Validation Card */}
              <div className="bg-sand-1/40 border border-ink/15 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-ink/10 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-deep flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-brand" />
                      <span>1. Dados Pessoais para Validação da Compra</span>
                    </h4>
                    <p className="text-[11px] text-ink/65 mt-0.5">
                      Identificação obrigatória do comprador para emissão de comprovativo, contacto e entrega.
                    </p>
                  </div>

                  {!currentUser ? (
                    <span className="self-start sm:self-auto bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10.5px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Carrinho Livre (Sem Conta)</span>
                    </span>
                  ) : (
                    <span className="self-start sm:self-auto bg-indigo-100 text-indigo-950 border border-indigo-200 text-[10.5px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Conta Registada</span>
                    </span>
                  )}
                </div>

                {!currentUser && (
                  <div className="bg-emerald-50/90 border border-emerald-200 text-emerald-950 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1 text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Compra Imediata Sem Registo:</span>
                    </p>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                      Não precisas de criar conta ou definir palavra-passe. No entanto, <strong>o teu nome completo, número de telefone/WhatsApp e endereço</strong> são obrigatórios para validar a encomenda e permitir que a loja processe a entrega.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-deep" />
                        <span>Nome Completo do Comprador *</span>
                      </span>
                      <span className="text-[10px] text-terracotta font-semibold">Obrigatório</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vicente Germano"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* Contacto Telefónico */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-indigo-deep" />
                        <span>Contacto WhatsApp / Telemóvel *</span>
                      </span>
                      <span className="text-[10px] text-terracotta font-semibold">Obrigatório</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 84 123 4567 ou 87 142 5316"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* Cidade / Província / Bairro */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-deep" />
                        <span>Cidade / Bairro *</span>
                      </span>
                      <span className="text-[10px] text-terracotta font-semibold">Obrigatório</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Maputo, Bairro Central, Polana, Matola..."
                      value={customerCityOrNeighborhood}
                      onChange={(e) => setCustomerCityOrNeighborhood(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* Endereço Completo de Entrega / Local */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-deep" />
                        <span>
                          {deliveryOption === 'pickup'
                            ? 'Local de Consumo / Ponto de Recolha'
                            : 'Endereço de Entrega & Ponto de Ref. *'}
                        </span>
                      </span>
                      {deliveryOption !== 'pickup' && (
                        <span className="text-[10px] text-terracotta font-semibold">Obrigatório</span>
                      )}
                    </label>
                    <input
                      type="text"
                      required={deliveryOption !== 'pickup'}
                      placeholder={
                        deliveryOption === 'pickup'
                          ? 'Ex: Mesa 4, Balcão principal ou Levantamento na loja'
                          : 'Ex: Av. 24 de Julho nº 450, junto à Farmácia'
                      }
                      value={deliveryAddressInput}
                      onChange={(e) => setDeliveryAddressInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* E-mail (Opcional) */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-ink/50" />
                      <span>E-mail do Cliente (Opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Ex: cliente@exemplo.mz (para cópia do recibo)"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* NUIT (Opcional) */}
                  <div>
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-ink/50" />
                      <span>NUIT / Documento (Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 400123456 (para fatura com NUIT)"
                      value={customerNuit}
                      onChange={(e) => setCustomerNuit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>

                  {/* Observações / Notas */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-ink/80 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-ink/50" />
                      <span>Observações ou Instruções Especiais para o Pedido (Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Ligar ao chegar à portaria, bebidas bem frias, etc."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  2. Selecione o Método de Pagamento Manual
                </h4>

                {!hasAnyPaymentMethod && targetType === 'loja' ? (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-center space-y-2">
                    <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-amber-950 text-sm">
                      Contas de Pagamento Direto Não Configuradas
                    </h4>
                    <p className="text-xs text-amber-900/80 max-w-md mx-auto leading-relaxed">
                      O estabelecimento <strong>{establishmentName}</strong> ainda não adicionou contas ativas (M-Pesa, e-Mola ou Bancária) no perfil da loja para receber pagamentos de compras.
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Por favor contacte o responsável da loja por telefone para combinar a entrega e o pagamento.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* M-Pesa Button */}
                    {isMpesaAvailable && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('mpesa')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-2 ${
                          selectedMethod === 'mpesa'
                            ? 'border-[#E60000] bg-red-50/50 shadow-sm'
                            : 'border-ink/10 bg-paper hover:bg-sand-1/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-[#E60000] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            M
                          </span>
                          {selectedMethod === 'mpesa' && (
                            <CheckCircle2 className="w-5 h-5 text-[#E60000]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-ink">M-Pesa Vodacom</div>
                          <div className="text-[11px] text-ink/60">Transferência via *150#</div>
                        </div>
                      </button>
                    )}

                    {/* e-Mola Button */}
                    {isEmolaAvailable && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('emola')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-2 ${
                          selectedMethod === 'emola'
                            ? 'border-[#FF6600] bg-orange-50/50 shadow-sm'
                            : 'border-ink/10 bg-paper hover:bg-sand-1/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            eM
                          </span>
                          {selectedMethod === 'emola' && (
                            <CheckCircle2 className="w-5 h-5 text-[#FF6600]" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-ink">e-Mola Movitel</div>
                          <div className="text-[11px] text-ink/60">Transferência via *898#</div>
                        </div>
                      </button>
                    )}

                    {/* Transferência Bancária Button */}
                    {isBancoAvailable && (
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('transferencia_bancaria')}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between space-y-2 ${
                          selectedMethod === 'transferencia_bancaria'
                            ? 'border-indigo-brand bg-indigo-50/50 shadow-sm'
                            : 'border-ink/10 bg-paper hover:bg-sand-1/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-indigo-deep text-paper flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                            <Building2 className="w-4 h-4" />
                          </span>
                          {selectedMethod === 'transferencia_bancaria' && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-brand" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-ink">Banco BIM / NIB</div>
                          <div className="text-[11px] text-ink/60">Transferência bancária</div>
                        </div>
                      </button>
                    )}

                  </div>
                )}
              </div>

              {/* Method Detailed Instructions Box */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedMethod}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-paper p-4 sm:p-5 rounded-2xl border-2 border-indigo-brand/20 space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                    <span className="font-bold text-sm text-indigo-deep flex items-center gap-2">
                      {selectedMethod === 'mpesa' && <span className="w-3 h-3 rounded-full bg-[#E60000]"></span>}
                      {selectedMethod === 'emola' && <span className="w-3 h-3 rounded-full bg-[#FF6600]"></span>}
                      {selectedMethod === 'transferencia_bancaria' && <Building2 className="w-4 h-4 text-indigo-brand" />}
                      Instruções para {selectedMethod === 'mpesa' ? 'M-Pesa' : selectedMethod === 'emola' ? 'e-Mola' : 'Transferência Bancária'}
                    </span>
                    <span className="text-xs text-ink/60 font-semibold">Passo a passo</span>
                  </div>

                  {/* Dynamic Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-sand-1/60 p-3.5 rounded-xl text-xs border border-ink/5">
                    {methodData.banco && (
                      <div className="col-span-full">
                        <span className="text-ink/60 font-medium">Instituição Bancária:</span>
                        <div className="font-bold text-ink text-sm">{methodData.banco}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-ink/60 font-medium">Titular da Conta:</span>
                      <div className="font-bold text-ink text-sm uppercase">{methodData.titular}</div>
                    </div>
                    {selectedMethod === 'transferencia_bancaria' ? (
                      <>
                        {methodData.numeroConta && (
                          <div>
                            <span className="text-ink/60 font-medium">Nº de Conta Bancária:</span>
                            <div className="flex items-center gap-2 font-mono font-bold text-sm text-indigo-deep">
                              <span>{methodData.numeroConta}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(methodData.numeroConta!, 'Conta')}
                                className="px-2 py-0.5 bg-paper hover:bg-sand-2 text-ink text-[11px] font-bold rounded border border-ink/10 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {copySuccessField === 'Conta' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copySuccessField === 'Conta' ? 'Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {methodData.nib && (
                          <div>
                            <span className="text-ink/60 font-medium">NIB (Interbancário):</span>
                            <div className="flex items-center gap-2 font-mono font-bold text-sm text-indigo-deep">
                              <span>{methodData.nib}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(methodData.nib!, 'NIB')}
                                className="px-2 py-0.5 bg-paper hover:bg-sand-2 text-ink text-[11px] font-bold rounded border border-ink/10 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {copySuccessField === 'NIB' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copySuccessField === 'NIB' ? 'Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {!methodData.numeroConta && !methodData.nib && (
                          <div>
                            <span className="text-ink/60 font-medium">Conta / NIB de Destino:</span>
                            <div className="flex items-center gap-2 font-mono font-bold text-sm text-indigo-deep">
                              <span>{methodData.numeroOuNib}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(methodData.numeroOuNib, 'Número')}
                                className="px-2 py-0.5 bg-paper hover:bg-sand-2 text-ink text-[11px] font-bold rounded border border-ink/10 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                {copySuccessField === 'Número' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span>{copySuccessField === 'Número' ? 'Copiado!' : 'Copiar'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <span className="text-ink/60 font-medium">Número de Destino:</span>
                        <div className="flex items-center gap-2 font-mono font-bold text-sm text-indigo-deep">
                          <span>{methodData.numeroOuNib}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(methodData.numeroOuNib, 'Número')}
                            className="px-2 py-0.5 bg-paper hover:bg-sand-2 text-ink text-[11px] font-bold rounded border border-ink/10 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            {copySuccessField === 'Número' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copySuccessField === 'Número' ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="col-span-full border-t border-ink/10 pt-2 flex justify-between items-center">
                      <span className="text-ink/70 font-medium">Valor Exato a Transferir:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-serif text-base text-terracotta">{totalAmountMT} MT</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(totalAmountMT.toString(), 'Valor')}
                          className="px-2 py-0.5 bg-paper hover:bg-sand-2 text-ink text-[11px] font-bold rounded border border-ink/10 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          {copySuccessField === 'Valor' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copySuccessField === 'Valor' ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step by step list */}
                  <div className="space-y-1.5 text-xs text-ink/80">
                    <span className="font-bold text-ink">Como efetuar o pagamento:</span>
                    <ol className="list-decimal list-inside space-y-1 pl-1 text-[11.5px] leading-relaxed">
                      {methodData.instrucoes.map((step, idx) => {
                        const formattedStep = step
                          .replace('[NUMERO]', methodData.numeroOuNib)
                          .replace('[VALOR]', totalAmountMT.toString());
                        return <li key={`pmt-step-${idx}`}>{formattedStep}</li>;
                      })}
                    </ol>
                  </div>

                  {/* ALWAYS PRESENT YELLOW WARNING BOX */}
                  <div className="bg-amber-50 text-amber-900 border border-amber-300 p-3 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold text-amber-950">Aviso Importante:</strong> Guarde sempre o SMS de confirmação ou talão bancário da transação. Irá necessitar da referência abaixo para validar a compra.
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Confirmation Fields */}
              <div className="space-y-4 border-t border-ink/10 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/70">
                  3. Confirmação e Envio do Comprovativo
                </h4>

                <div>
                  <label className="block text-xs font-bold text-ink/80 mb-1">
                    {selectedMethod === 'transferencia_bancaria'
                      ? 'Número / Referência da Transferência Bancária *'
                      : 'Referência da Transação M-Pesa / e-Mola (SMS) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      selectedMethod === 'transferencia_bancaria'
                        ? 'Ex: BIM-TAL-99482'
                        : 'Ex: MP260807.1420.C89A'
                    }
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink font-mono font-semibold focus:outline-none focus:border-indigo-brand uppercase"
                  />
                  <p className="text-[11px] text-ink/60 mt-1">
                    Insira o código enviado por SMS pela operadora ou impresso no talão.
                  </p>
                </div>

                {/* Optional Screenshot / Proof Upload */}
                <div>
                  <label className="block text-xs font-bold text-ink/80 mb-1">
                    Comprovativo ou Screenshot (Opcional)
                  </label>
                  <CloudinaryUpload
                    onUploadSuccess={(url) => setProofUrl(url)}
                    currentUrl={proofUrl}
                    folder="comprovativos_pagamento"
                  />

                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting || (!hasAnyPaymentMethod && targetType === 'loja')}
                  className={`w-full py-3.5 px-6 font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 ${
                    !hasAnyPaymentMethod && targetType === 'loja'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <span>A submeter comprovativo...</span>
                  ) : !hasAnyPaymentMethod && targetType === 'loja' ? (
                    <span>Pagamento Indisponível (Contacte a Loja)</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirmar Pagamento Enviado</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
