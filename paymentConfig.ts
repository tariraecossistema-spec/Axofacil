// Payment instruction configurations for Shay E-Commerce & Stores
import { loadPlatformSettings } from './platformConfig';
import { Establishment } from './types';

export interface PaymentAccountDetails {
  titular: string;
  numeroOuNib: string;
  numeroConta?: string;
  nib?: string;
  banco?: string;
  instrucoes: string[];
  isConfigured: boolean;
}

export interface StorePaymentConfig {
  mpesa: PaymentAccountDetails;
  emola: PaymentAccountDetails;
  banco: PaymentAccountDetails;
  hasAnyConfigured: boolean;
}

// Default Platform Accounts (Shay Tec & Serviços / Vicente João Germano Dias)
// Utilizados estritamente para pagamento de planos/subscrições da Axofácil!
export const DEFAULT_SHAY_PAYMENT_CONFIG: StorePaymentConfig = {
  mpesa: {
    titular: 'Shay Tec & Serviços Lda / Vicente Germano',
    numeroOuNib: '841234567',
    isConfigured: true,
    instrucoes: [
      'Marque *150# no seu telemóvel',
      'Selecione "Enviar Dinheiro"',
      'Insira o número de destino: [NUMERO]',
      'Insira o valor exato: [VALOR] MT',
      'Confirme com o seu PIN M-Pesa',
      'Confirme que o nome apresentado corresponde ao titular indicado',
      'Guarde o SMS de confirmação — precisará da referência da transação'
    ]
  },
  emola: {
    titular: 'vicente joao germano dias',
    numeroOuNib: '871425316',
    isConfigured: true,
    instrucoes: [
      'Marque *898# no seu telemóvel',
      'Selecione "Transferir"',
      'Insira o número: 871425316',
      'Insira o valor exato: [VALOR] MT',
      'Confirme com o seu PIN e-Mola',
      'Confirme que o nome apresentado corresponde ao titular indicado',
      'Guarde o SMS de confirmação — precisará da referência da transação'
    ]
  },
  banco: {
    banco: 'Millennium Bim',
    titular: 'vicente joao Germano Dias',
    numeroOuNib: '000100000017601998457',
    isConfigured: true,
    instrucoes: [
      'Efetue a transferência via Internet Banking, App BIM ou no caixa eletrónico (ATM)',
      'Insira o NIB de destino: 000100000017601998457',
      'Confirme o titular: vicente joao Germano Dias',
      'Insira o valor exato: [VALOR] MT',
      'Guarde o comprovativo bancário (talão ou foto/captura do ecrã)',
      'Nota: Transferências interbancárias podem levar até 1-2 dias úteis para validação'
    ]
  },
  hasAnyConfigured: true
};

// Specific configurations for featured stores (e.g., Doce Amor)
export const CUSTOM_STORE_PAYMENT_CONFIGS: Record<string, Partial<StorePaymentConfig>> = {
  'doce-amor': {
    mpesa: {
      titular: 'Lúcia Mone (Doce Amor Floraria)',
      numeroOuNib: '871425316',
      isConfigured: true,
      instrucoes: [
        'Marque *150# no seu telemóvel',
        'Selecione "Enviar Dinheiro"',
        'Insira o número da Floraria: 871425316',
        'Insira o valor do arranjo/buquê: [VALOR] MT',
        'Confirme com o seu PIN M-Pesa',
        'Confirme o nome da titular: Lúcia Mone',
        'Guarde a referência do SMS para validação no checkout'
      ]
    }
  }
};

// Constrói a configuração padrão da plataforma (contas Shay) a partir das
// definições editáveis no painel administrativo (AdminPlatformSettingsManager).
// USADO EXCLUSIVAMENTE para subscrições/planos da plataforma quando não há loja.
function getLivePlatformPaymentConfig(): StorePaymentConfig {
  const { paymentAccounts } = loadPlatformSettings();
  return {
    mpesa: {
      ...DEFAULT_SHAY_PAYMENT_CONFIG.mpesa,
      titular: paymentAccounts.mpesa.titular,
      numeroOuNib: paymentAccounts.mpesa.numero,
      isConfigured: true,
    },
    emola: {
      ...DEFAULT_SHAY_PAYMENT_CONFIG.emola,
      titular: paymentAccounts.emola.titular,
      numeroOuNib: paymentAccounts.emola.numero,
      isConfigured: true,
      instrucoes: DEFAULT_SHAY_PAYMENT_CONFIG.emola.instrucoes.map(line =>
        line.replace('871425316', paymentAccounts.emola.numero)
      ),
    },
    banco: {
      ...DEFAULT_SHAY_PAYMENT_CONFIG.banco,
      titular: paymentAccounts.banco.titular,
      numeroOuNib: paymentAccounts.banco.numero,
      banco: paymentAccounts.banco.banco || DEFAULT_SHAY_PAYMENT_CONFIG.banco.banco,
      isConfigured: true,
      instrucoes: DEFAULT_SHAY_PAYMENT_CONFIG.banco.instrucoes.map(line =>
        line
          .replace('000100000017601998457', paymentAccounts.banco.numero)
          .replace('vicente joao Germano Dias', paymentAccounts.banco.titular)
      ),
    },
    hasAnyConfigured: true,
  };
}

export function getPaymentConfigForEstablishment(
  estId?: string, 
  estName?: string, 
  establishmentObj?: Establishment | null
): StorePaymentConfig {
  // Se for compra de plano da plataforma (sem loja associada), usa as contas da plataforma
  if (!estId && !estName && !establishmentObj) {
    return getLivePlatformPaymentConfig();
  }

  // Tenta carregar o estabelecimento da memória / localStorage
  let est = establishmentObj || null;
  if (!est && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('axofacil_establishments');
      if (raw) {
        const list: Establishment[] = JSON.parse(raw);
        if (estId) {
          est = list.find(e => e.id === estId) || null;
        }
        if (!est && estName) {
          est = list.find(e => e.name.toLowerCase().trim() === estName.toLowerCase().trim()) || null;
        }
      }
    } catch {
      // ignore
    }
  }

  const custom = (estId && CUSTOM_STORE_PAYMENT_CONFIGS[estId]) ||
    (estName && estName.toLowerCase().includes('doce amor') ? CUSTOM_STORE_PAYMENT_CONFIGS['doce-amor'] : undefined);

  const fallbackHolder = est?.ownerName || est?.name || estName || 'Estabelecimento';

  // M-Pesa da loja
  const mpesaNum = (custom?.mpesa?.numeroOuNib || est?.mpesaNumber || '').trim();
  const mpesaHolder = (custom?.mpesa?.titular || est?.mpesaHolder || fallbackHolder).trim();
  const isMpesaConfigured = Boolean(mpesaNum);
  const mpesa: PaymentAccountDetails = {
    titular: mpesaHolder,
    numeroOuNib: mpesaNum,
    isConfigured: isMpesaConfigured,
    instrucoes: custom?.mpesa?.instrucoes || (isMpesaConfigured ? [
      'Marque *150# no seu telemóvel',
      'Selecione "Enviar Dinheiro"',
      `Insira o número da loja: ${mpesaNum}`,
      'Insira o valor exato da compra: [VALOR] MT',
      'Confirme com o seu PIN M-Pesa',
      `Confirme o nome do titular: ${mpesaHolder}`,
      'Guarde o SMS de confirmação — precisará da referência da transação'
    ] : [
      'Este estabelecimento ainda não configurou uma conta M-Pesa para recebimentos.'
    ])
  };

  // e-Mola da loja
  const emolaNum = (custom?.emola?.numeroOuNib || est?.emolaNumber || '').trim();
  const emolaHolder = (custom?.emola?.titular || est?.emolaHolder || fallbackHolder).trim();
  const isEmolaConfigured = Boolean(emolaNum);
  const emola: PaymentAccountDetails = {
    titular: emolaHolder,
    numeroOuNib: emolaNum,
    isConfigured: isEmolaConfigured,
    instrucoes: custom?.emola?.instrucoes || (isEmolaConfigured ? [
      'Marque *898# no seu telemóvel',
      'Selecione "Transferir"',
      `Insira o número da loja: ${emolaNum}`,
      'Insira o valor exato da compra: [VALOR] MT',
      'Confirme com o seu PIN e-Mola',
      `Confirme o nome do titular: ${emolaHolder}`,
      'Guarde o SMS de confirmação — precisará da referência da transação'
    ] : [
      'Este estabelecimento ainda não configurou uma conta e-Mola para recebimentos.'
    ])
  };

  // Conta bancária da loja
  const explicitAccount = (custom?.banco?.numeroConta || est?.bankAccount || '').trim();
  const explicitNib = (custom?.banco?.nib || est?.bankNib || '').trim();
  const bankNum = (custom?.banco?.numeroOuNib || explicitAccount || explicitNib || '').trim();
  const bankHolder = (custom?.banco?.titular || est?.bankHolder || fallbackHolder).trim();
  const bankName = custom?.banco?.banco || est?.bankName || 'Banco';
  const isBancoConfigured = Boolean(bankNum || explicitAccount || explicitNib);
  
  const bancoInstructions: string[] = isBancoConfigured ? [
    `Efetue a transferência via Internet Banking, App ${bankName} ou no caixa eletrónico (ATM)`,
    explicitAccount ? `Conta Bancária da Loja: ${explicitAccount}` : '',
    explicitNib ? `NIB da Loja: ${explicitNib}` : '',
    !explicitAccount && !explicitNib && bankNum ? `Conta/NIB da Loja: ${bankNum}` : '',
    `Confirme o titular: ${bankHolder}`,
    'Insira o valor exato da compra: [VALOR] MT',
    'Guarde o comprovativo bancário (talão ou captura do ecrã)',
    'Nota: Transferências interbancárias podem levar até 1-2 dias úteis para validação'
  ].filter(Boolean) : [
    'Este estabelecimento ainda não configurou uma conta bancária para recebimentos.'
  ];

  const banco: PaymentAccountDetails = {
    banco: bankName,
    titular: bankHolder,
    numeroOuNib: bankNum,
    numeroConta: explicitAccount,
    nib: explicitNib,
    isConfigured: isBancoConfigured,
    instrucoes: custom?.banco?.instrucoes || bancoInstructions
  };

  return {
    mpesa,
    emola,
    banco,
    hasAnyConfigured: isMpesaConfigured || isEmolaConfigured || isBancoConfigured
  };
}
