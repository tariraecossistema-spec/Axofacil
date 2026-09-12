import { Establishment, PromoDeal, PaymentRecord, AdminSubmission, DeliveryPartner, OrderRecord, CustomerRecord, FinancialTransaction, InventoryItem, StockMovementRecord, BarTable, OperatorLoginRecord } from './types';
import { recordOfflineChange } from './offlineSync';
import { ensureEstablishmentCatalog } from './establishmentCatalog';
import { syncEstablishmentToSupabase, syncOrderToSupabase, syncFinancialTxToSupabase, syncInventoryItemToSupabase, syncDeliveryPartnerToSupabase, syncManualPaymentRecordToSupabase, syncAdminSubmissionToSupabase } from './supabase';

export const initialInventoryItems: InventoryItem[] = [
  {
    id: 'inv-1',
    establishmentId: 'bar-1',
    name: 'Cerveja 2M 500ml Gelada',
    category: 'Cervejas',
    costPriceMT: 70,
    sellingPriceMT: 120,
    quantityInStock: 144,
    minStockThreshold: 24,
    unit: 'Garrafa',
    salesCount: 86,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-2',
    establishmentId: 'bar-1',
    name: 'Caipirinha Especial de Lima',
    category: 'Cocktails',
    costPriceMT: 80,
    sellingPriceMT: 250,
    quantityInStock: 80,
    minStockThreshold: 15,
    unit: 'Copo',
    salesCount: 64,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-3',
    establishmentId: 'bar-1',
    name: 'Tábua de Mariscos & Camarão Grelhado',
    category: 'Petiscos',
    costPriceMT: 600,
    sellingPriceMT: 1200,
    quantityInStock: 25,
    minStockThreshold: 5,
    unit: 'Porção',
    salesCount: 42,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-4',
    establishmentId: 'bar-1',
    name: 'Cerveja Laurentina Preta',
    category: 'Cervejas',
    costPriceMT: 75,
    sellingPriceMT: 130,
    quantityInStock: 96,
    minStockThreshold: 20,
    unit: 'Garrafa',
    salesCount: 51,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-5',
    establishmentId: 'bar-1',
    name: 'Gin Tónico com Zimbro & Rodela de Limão',
    category: 'Cocktails',
    costPriceMT: 110,
    sellingPriceMT: 300,
    quantityInStock: 40,
    minStockThreshold: 10,
    unit: 'Copo',
    salesCount: 38,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-6',
    establishmentId: 'bar-1',
    name: 'Whisky Johnnie Walker Red Label 1L',
    category: 'Destilados',
    costPriceMT: 1200,
    sellingPriceMT: 2200,
    quantityInStock: 12,
    minStockThreshold: 3,
    unit: 'Garrafa',
    salesCount: 15,
    isTopSeller: false,
    imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'inv-7',
    establishmentId: 'bar-1',
    name: 'Refrigerante Coca-Cola 330ml',
    category: 'Refrigerantes',
    costPriceMT: 30,
    sellingPriceMT: 60,
    quantityInStock: 120,
    minStockThreshold: 30,
    unit: 'Lata',
    salesCount: 75,
    isTopSeller: false
  },
  {
    id: 'inv-8',
    establishmentId: 'bar-1',
    name: 'Água Mineral Vumba 500ml',
    category: 'Refrigerantes',
    costPriceMT: 20,
    sellingPriceMT: 50,
    quantityInStock: 200,
    minStockThreshold: 50,
    unit: 'Garrafa',
    salesCount: 90,
    isTopSeller: false
  },

  // ESTALEIRO & MATERIAL DE CONSTRUÇÃO (c1 - Matola)
  {
    id: 'c1-inv-1',
    establishmentId: 'c1',
    name: 'Cimento Limpopo 42.5N (Saco 50kg)',
    category: 'Cimento & Cal',
    costPriceMT: 425,
    sellingPriceMT: 490,
    quantityInStock: 450,
    minStockThreshold: 50,
    unit: 'Saco (50kg)',
    salesCount: 320,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c1-inv-2',
    establishmentId: 'c1',
    name: 'Chapa de Zinco Canelada 0.40mm (Peça 3.6m)',
    category: 'Chapas & Varão de Aço',
    costPriceMT: 630,
    sellingPriceMT: 780,
    quantityInStock: 180,
    minStockThreshold: 30,
    unit: 'Chapa',
    salesCount: 140,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c1-inv-3',
    establishmentId: 'c1',
    name: 'Varão de Aço Nervurado 12mm (Vara 6m)',
    category: 'Chapas & Varão de Aço',
    costPriceMT: 410,
    sellingPriceMT: 520,
    quantityInStock: 280,
    minStockThreshold: 40,
    unit: 'Vara (6m)',
    salesCount: 190,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c1-inv-4',
    establishmentId: 'c1',
    name: 'Carrada de Areia Grossa de Rio (Camião 10m³)',
    category: 'Agregados (Areia/Brita)',
    costPriceMT: 6800,
    sellingPriceMT: 8500,
    quantityInStock: 12,
    minStockThreshold: 2,
    unit: 'Carrada (10m³)',
    salesCount: 28,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c1-inv-5',
    establishmentId: 'c1',
    name: 'Brita nº 1 de Pedreira (Metro Cúbico m³)',
    category: 'Agregados (Areia/Brita)',
    costPriceMT: 920,
    sellingPriceMT: 1250,
    quantityInStock: 75,
    minStockThreshold: 10,
    unit: 'Metro Cúbico (m³)',
    salesCount: 65,
    isTopSeller: false
  },
  {
    id: 'c1-inv-6',
    establishmentId: 'c1',
    name: 'Blocos de Cimento 15cm Vibrados (Centena 100 un)',
    category: 'Blocos & Artefactos',
    costPriceMT: 3900,
    sellingPriceMT: 4800,
    quantityInStock: 35,
    minStockThreshold: 5,
    unit: 'Centena (100 un)',
    salesCount: 42,
    isTopSeller: true
  },

  // ESTALEIRO ZIMPETO (c2)
  {
    id: 'c2-inv-1',
    establishmentId: 'c2',
    name: 'Blocos de Cimento 20cm Estruturais (Centena)',
    category: 'Blocos & Artefactos',
    costPriceMT: 4300,
    sellingPriceMT: 5400,
    quantityInStock: 50,
    minStockThreshold: 8,
    unit: 'Centena (100 un)',
    salesCount: 60,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c2-inv-2',
    establishmentId: 'c2',
    name: 'Areia Vermelha Camati (Carrada 10m³)',
    category: 'Agregados (Areia/Brita)',
    costPriceMT: 5400,
    sellingPriceMT: 6800,
    quantityInStock: 18,
    minStockThreshold: 3,
    unit: 'Carrada (10m³)',
    salesCount: 35,
    isTopSeller: true
  },

  // FERRAGENS CENTRAL BAIXA MAPUTO (c3)
  {
    id: 'c3-inv-1',
    establishmentId: 'c3',
    name: 'Tinta Acrílica Lavável Branca 20L',
    category: 'Tintas & Impermeabilização',
    costPriceMT: 2300,
    sellingPriceMT: 3200,
    quantityInStock: 40,
    minStockThreshold: 6,
    unit: 'Lata (20L)',
    salesCount: 55,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'c3-inv-2',
    establishmentId: 'c3',
    name: 'Rebarbadora Eléctrica 850W Bosch',
    category: 'Ferragens & Ferramentas',
    costPriceMT: 2900,
    sellingPriceMT: 4200,
    quantityInStock: 15,
    minStockThreshold: 3,
    unit: 'Unidade',
    salesCount: 22,
    isTopSeller: true
  },
  {
    id: 'c3-inv-3',
    establishmentId: 'c3',
    name: 'Tubo PVC Esgoto 110mm (Vara 6m)',
    category: 'Tubos PVC & Canalização',
    costPriceMT: 310,
    sellingPriceMT: 450,
    quantityInStock: 90,
    minStockThreshold: 15,
    unit: 'Vara (6m)',
    salesCount: 80,
    isTopSeller: false
  },

  // LOJA BAIXA TÊXTIL (l1)
  {
    id: 'l1-inv-1',
    establishmentId: 'l1',
    name: 'Capulana Estampada VIP (Peça 6 jardas)',
    category: 'Capulanas & Tecidos',
    costPriceMT: 580,
    sellingPriceMT: 850,
    quantityInStock: 120,
    minStockThreshold: 20,
    unit: 'Peça (6j)',
    barcode: '6009001001',
    sku: 'CAP-VIP-001',
    supplier: 'Importadora Têxtil Maputo',
    salesCount: 95,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l1-inv-2',
    establishmentId: 'l1',
    name: 'Fardo Capulanas Importadas (50 Peças)',
    category: 'Lotes a Grosso',
    costPriceMT: 19500,
    sellingPriceMT: 28000,
    quantityInStock: 15,
    minStockThreshold: 3,
    unit: 'Fardo (50 un)',
    barcode: '6009001002',
    sku: 'CAP-FARDO-50',
    supplier: 'Distribuidora Têxtil África do Sul',
    salesCount: 38,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l1-inv-3',
    establishmentId: 'l1',
    name: 'Tecido de Seda Africana (Metro)',
    category: 'Capulanas & Tecidos',
    costPriceMT: 290,
    sellingPriceMT: 450,
    quantityInStock: 250,
    minStockThreshold: 40,
    unit: 'Metro',
    barcode: '6009001003',
    sku: 'TEC-SEDA-01',
    supplier: 'Importadora Têxtil Maputo',
    salesCount: 140,
    isTopSeller: false,
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l1-inv-4',
    establishmentId: 'l1',
    name: 'Vestido de Gala Africano Bordado',
    category: 'Vestuário & Moda',
    costPriceMT: 2200,
    sellingPriceMT: 3500,
    quantityInStock: 22,
    minStockThreshold: 5,
    unit: 'Peça',
    barcode: '6009001004',
    sku: 'VEST-GALA-01',
    supplier: 'Atelier Baixa Têxtil',
    salesCount: 45,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l1-inv-5',
    establishmentId: 'l1',
    name: 'Conjunto Lenço & Turbante Tradicional',
    category: 'Acessórios & Lenços',
    costPriceMT: 250,
    sellingPriceMT: 450,
    quantityInStock: 60,
    minStockThreshold: 15,
    unit: 'Conjunto',
    barcode: '6009001005',
    sku: 'LENC-TURB-01',
    supplier: 'Atelier Baixa Têxtil',
    salesCount: 80,
    isTopSeller: false
  },

  // ATACADISTA BAIXA MODAS, FATOS & MEIAS (l9)
  {
    id: 'l9-inv-1',
    establishmentId: 'l9',
    name: 'Fato Masculino Executivo Italiano (3 Peças)',
    category: 'Fatos & Moda Masculina',
    costPriceMT: 3900,
    sellingPriceMT: 6500,
    quantityInStock: 35,
    minStockThreshold: 8,
    unit: 'Fato Completo',
    barcode: '6009009001',
    sku: 'FATO-IT-01',
    supplier: 'Fornecedor Confecções Baixa',
    salesCount: 52,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l9-inv-2',
    establishmentId: 'l9',
    name: 'Lote Grosso Meias & Peúgas de Algodão (24 Pares)',
    category: 'Meias & Lotes a Grosso',
    costPriceMT: 950,
    sellingPriceMT: 1800,
    quantityInStock: 80,
    minStockThreshold: 15,
    unit: 'Caixa (24 pares)',
    barcode: '6009009002',
    sku: 'MEIA-LOTE-24',
    supplier: 'Distribuidora Meias Maputo',
    salesCount: 110,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l9-inv-3',
    establishmentId: 'l9',
    name: 'Camisa Formal Executiva Manga Comprida',
    category: 'Fatos & Moda Masculina',
    costPriceMT: 750,
    sellingPriceMT: 1400,
    quantityInStock: 95,
    minStockThreshold: 20,
    unit: 'Unidade',
    barcode: '6009009003',
    sku: 'CAM-EXEC-01',
    supplier: 'Fornecedor Confecções Baixa',
    salesCount: 88,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l9-inv-4',
    establishmentId: 'l9',
    name: 'Gravata de Seda Slim com Alfinete & Lenço',
    category: 'Acessórios & Gravatas',
    costPriceMT: 280,
    sellingPriceMT: 550,
    quantityInStock: 70,
    minStockThreshold: 15,
    unit: 'Conjunto',
    barcode: '6009009004',
    sku: 'GRAV-SEDA-01',
    supplier: 'Fornecedor Confecções Baixa',
    salesCount: 65,
    isTopSeller: false
  },
  {
    id: 'l9-inv-5',
    establishmentId: 'l9',
    name: 'Cinto de Couro Genuíno com Fivela Automática',
    category: 'Acessórios & Gravatas',
    costPriceMT: 450,
    sellingPriceMT: 850,
    quantityInStock: 50,
    minStockThreshold: 10,
    unit: 'Unidade',
    barcode: '6009009005',
    sku: 'CINT-COU-01',
    supplier: 'Fornecedor Confecções Baixa',
    salesCount: 74,
    isTopSeller: false
  },

  // CALÇADOS & MEIAS BAIXA GROSSO (l10)
  {
    id: 'l10-inv-1',
    establishmentId: 'l10',
    name: 'Sapato Social de Couro Executivo Masculino',
    category: 'Sapatos & Calçado Social',
    costPriceMT: 1650,
    sellingPriceMT: 2800,
    quantityInStock: 45,
    minStockThreshold: 10,
    unit: 'Par',
    barcode: '6009010001',
    sku: 'SAP-SOC-01',
    supplier: 'Importadora Calçados Maputo',
    salesCount: 62,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l10-inv-2',
    establishmentId: 'l10',
    name: 'Ténis Desportivo Urbano Respirável (Vários Tamanhos)',
    category: 'Ténis & Desporto',
    costPriceMT: 1100,
    sellingPriceMT: 1950,
    quantityInStock: 60,
    minStockThreshold: 12,
    unit: 'Par',
    barcode: '6009010002',
    sku: 'TEN-DESP-01',
    supplier: 'Importadora Calçados Maputo',
    salesCount: 78,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l10-inv-3',
    establishmentId: 'l10',
    name: 'Lote Grosso Meias de Algodão (Caixa 24 Pares)',
    category: 'Meias a Grosso',
    costPriceMT: 850,
    sellingPriceMT: 1650,
    quantityInStock: 100,
    minStockThreshold: 20,
    unit: 'Caixa (24 pares)',
    barcode: '6009010003',
    sku: 'MEIA-CX-24',
    supplier: 'Distribuidora Meias Maputo',
    salesCount: 140,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'l10-inv-4',
    establishmentId: 'l10',
    name: 'Sandálias & Chinelos de Couro Confort',
    category: 'Sandálias & Chinelos',
    costPriceMT: 520,
    sellingPriceMT: 950,
    quantityInStock: 75,
    minStockThreshold: 15,
    unit: 'Par',
    barcode: '6009010004',
    sku: 'SAND-COU-01',
    supplier: 'Importadora Calçados Maputo',
    salesCount: 85,
    isTopSeller: false,
    imageUrl: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&q=80&w=400'
  },

  // LOJA EKONOMIA (l2)
  {
    id: 'l2-inv-1',
    establishmentId: 'l2',
    name: 'Smart TV LED 43" 4K HDR com Wi-Fi',
    category: 'Televisores & Áudio',
    costPriceMT: 14500,
    sellingPriceMT: 18900,
    quantityInStock: 18,
    minStockThreshold: 4,
    unit: 'Unidade',
    barcode: '6009002001',
    sku: 'TV-43-4K',
    supplier: 'Distribuidora Eletrónicos Moçambique',
    salesCount: 30,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400'
  },
  {
    id: 'l2-inv-2',
    establishmentId: 'l2',
    name: 'Smartphone Samsung Galaxy A15 128GB Dual SIM',
    category: 'Smartphones & Telemóveis',
    costPriceMT: 8200,
    sellingPriceMT: 10500,
    quantityInStock: 25,
    minStockThreshold: 5,
    unit: 'Unidade',
    barcode: '6009002002',
    sku: 'TEL-SAMS-A15',
    supplier: 'Distribuidora Mobile Maputo',
    salesCount: 54,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400'
  },
  {
    id: 'l2-inv-3',
    establishmentId: 'l2',
    name: 'Frigorífico Combinado 220L Frost Free Inox',
    category: 'Eletrodomésticos',
    costPriceMT: 19500,
    sellingPriceMT: 24900,
    quantityInStock: 8,
    minStockThreshold: 2,
    unit: 'Unidade',
    barcode: '6009002003',
    sku: 'FRIG-220L-IX',
    supplier: 'Distribuidora Eletrónicos Moçambique',
    salesCount: 16,
    isTopSeller: true
  },
  {
    id: 'l2-inv-4',
    establishmentId: 'l2',
    name: 'Coluna de Som Bluetooth Portátil 40W Extra Bass',
    category: 'Televisores & Áudio',
    costPriceMT: 1800,
    sellingPriceMT: 2800,
    quantityInStock: 40,
    minStockThreshold: 8,
    unit: 'Unidade',
    barcode: '6009002004',
    sku: 'SOM-BT-40W',
    supplier: 'Distribuidora Eletrónicos Moçambique',
    salesCount: 65,
    isTopSeller: false
  },

  // AUTO PEÇAS MAPUTO & MATOLA (auto-1 & auto-2)
  {
    id: 'auto1-inv-1',
    establishmentId: 'auto-1',
    name: 'Óleo Sintético Shell Helix Ultra 5W40 (5L)',
    category: 'Óleos & Lubrificantes',
    costPriceMT: 1900,
    sellingPriceMT: 2800,
    quantityInStock: 45,
    minStockThreshold: 10,
    unit: 'Garrafão (5L)',
    barcode: '6009080001',
    sku: 'OLEO-SHELL-5L',
    supplier: 'Vivo Energy / Shell Moçambique',
    salesCount: 72,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'auto1-inv-2',
    establishmentId: 'auto-1',
    name: 'Bateria Willard 12V 70Ah Reforçada (12 Meses Garantia)',
    category: 'Baterias 12V',
    costPriceMT: 4600,
    sellingPriceMT: 6500,
    quantityInStock: 20,
    minStockThreshold: 4,
    unit: 'Unidade',
    barcode: '6009080002',
    sku: 'BAT-WIL-70AH',
    supplier: 'Auto Baterias Moçambique',
    salesCount: 35,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'auto1-inv-3',
    establishmentId: 'auto-1',
    name: 'Jogo de Calços de Travão Frente Toyota Hilux / Fortuner',
    category: 'Travões & Discos',
    costPriceMT: 1200,
    sellingPriceMT: 1950,
    quantityInStock: 30,
    minStockThreshold: 6,
    unit: 'Jogo (4 un)',
    barcode: '6009080003',
    sku: 'CALC-HILUX-01',
    supplier: 'Distribuidora Peças Japonesas',
    salesCount: 58,
    isTopSeller: true
  },
  {
    id: 'auto2-inv-1',
    establishmentId: 'auto-2',
    name: 'Pneu Radial R15 195/65R15 para Viaturas Ligeiras',
    category: 'Pneus & Jantes',
    costPriceMT: 2900,
    sellingPriceMT: 4200,
    quantityInStock: 50,
    minStockThreshold: 10,
    unit: 'Pneu',
    barcode: '6009082001',
    sku: 'PNEU-R15-195',
    supplier: 'Moçambique Pneus & Frotas',
    salesCount: 68,
    isTopSeller: true,
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'auto2-inv-2',
    establishmentId: 'auto-2',
    name: 'Bateria Dixon 12V 65Ah para Táxis e Pickups',
    category: 'Baterias 12V',
    costPriceMT: 4100,
    sellingPriceMT: 5800,
    quantityInStock: 25,
    minStockThreshold: 5,
    unit: 'Unidade',
    barcode: '6009082002',
    sku: 'BAT-DIX-65AH',
    supplier: 'Auto Baterias Moçambique',
    salesCount: 42,
    isTopSeller: true
  },

  // SUPERMERCADO MAPUTO (super-1)
  {
    id: 'super1-inv-1',
    establishmentId: 'super-1',
    name: 'Fardo de Arroz Longo Grão Extra (Saco 25kg)',
    category: 'Mercearia & Fardos',
    costPriceMT: 1350,
    sellingPriceMT: 1750,
    quantityInStock: 150,
    minStockThreshold: 25,
    unit: 'Saco (25kg)',
    barcode: '6009050001',
    sku: 'ARR-25KG-01',
    supplier: 'Importadora Alimentar Moçambique',
    salesCount: 210,
    isTopSeller: true
  },
  {
    id: 'super1-inv-2',
    establishmentId: 'super-1',
    name: 'Caixa de Óleo Alimentar Girassol (12 x 1 Litro)',
    category: 'Mercearia & Fardos',
    costPriceMT: 1200,
    sellingPriceMT: 1580,
    quantityInStock: 90,
    minStockThreshold: 15,
    unit: 'Caixa (12L)',
    barcode: '6009050002',
    sku: 'OLEO-CX-12',
    supplier: 'Importadora Alimentar Moçambique',
    salesCount: 180,
    isTopSeller: true
  },
  {
    id: 'super1-inv-3',
    establishmentId: 'super-1',
    name: 'Fardo de Açúcar Nacional Castelo (10 x 1kg)',
    category: 'Mercearia & Fardos',
    costPriceMT: 580,
    sellingPriceMT: 750,
    quantityInStock: 110,
    minStockThreshold: 20,
    unit: 'Fardo (10kg)',
    barcode: '6009050003',
    sku: 'ACUC-FD-10',
    supplier: 'Açucareira de Moçambique',
    salesCount: 195,
    isTopSeller: true
  }
];

export const initialBarTables: BarTable[] = [
  {
    id: 'tbl-1',
    establishmentId: 'bar-1',
    tableNumber: 'Mesa 1 (Interior)',
    customerName: 'Mário & Amigos',
    operatorName: 'Mariamo Vendedora',
    status: 'ocupada',
    openedAt: '12:30',
    items: [
      { id: 'ti-1', productName: 'Cerveja 2M 500ml Gelada', unitPriceMT: 120, quantity: 4, addedAt: '12:35', delivered: true },
      { id: 'ti-2', productName: 'Tábua de Mariscos & Camarão Grelhado', unitPriceMT: 1200, quantity: 1, addedAt: '12:40', delivered: true }
    ],
    notes: 'Cliente pediu gelo extra'
  },
  {
    id: 'tbl-2',
    establishmentId: 'bar-1',
    tableNumber: 'Mesa 2 (Esplanada Vista Mar)',
    customerName: 'Dra. Ana Silva',
    operatorName: 'Carlos Gerente',
    status: 'conta_solicitada',
    openedAt: '11:45',
    items: [
      { id: 'ti-3', productName: 'Caipirinha Especial de Lima', unitPriceMT: 250, quantity: 2, addedAt: '11:50', delivered: true },
      { id: 'ti-4', productName: 'Gin Tónico com Zimbro', unitPriceMT: 300, quantity: 1, addedAt: '12:15', delivered: true }
    ],
    notes: 'Pagamento via M-Pesa'
  },
  {
    id: 'tbl-3',
    establishmentId: 'bar-1',
    tableNumber: 'Mesa 3 (Esplanada)',
    customerName: '',
    operatorName: 'Mariamo Vendedora',
    status: 'livre',
    items: []
  },
  {
    id: 'tbl-4',
    establishmentId: 'bar-1',
    tableNumber: 'Mesa 4 (Balcão VIP)',
    customerName: '',
    operatorName: 'Ana Atendente Balcão',
    status: 'livre',
    items: []
  },
  {
    id: 'tbl-5',
    establishmentId: 'bar-1',
    tableNumber: 'Mesa 5 (Lounges Sombra)',
    customerName: '',
    operatorName: 'Mariamo Vendedora',
    status: 'livre',
    items: []
  }
];

export const initialOperatorLogins: OperatorLoginRecord[] = [
  { id: 'log-1', establishmentId: 'bar-1', operatorName: 'Mariamo Vendedora', loginTime: '08:15', date: new Date().toISOString().split('T')[0], role: 'vendedor' },
  { id: 'log-2', establishmentId: 'bar-1', operatorName: 'Carlos Gerente', loginTime: '09:00', date: new Date().toISOString().split('T')[0], role: 'administrador' },
  { id: 'log-3', establishmentId: 'bar-1', operatorName: 'Ana Atendente Balcão', loginTime: '10:30', date: new Date().toISOString().split('T')[0], role: 'vendedor' }
];

export function getDeletedInventoryItemKeys(): Set<string> {
  try {
    const raw = localStorage.getItem('axofacil_deleted_inventory_items');
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markInventoryItemDeleted(itemId: string, establishmentId?: string, itemName?: string) {
  try {
    const keys = getDeletedInventoryItemKeys();
    if (itemId) keys.add(itemId);
    if (establishmentId && itemName) {
      keys.add(`${establishmentId}:${itemName.toLowerCase().trim()}`);
    }
    localStorage.setItem('axofacil_deleted_inventory_items', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao marcar artigo de inventário como excluído:', e);
  }
}

export function isInventoryItemDeleted(itemId: string, establishmentId?: string, itemName?: string): boolean {
  const keys = getDeletedInventoryItemKeys();
  if (itemId && keys.has(itemId)) return true;
  if (establishmentId && itemName && keys.has(`${establishmentId}:${itemName.toLowerCase().trim()}`)) return true;
  return false;
}

export function loadInventoryItems(): InventoryItem[] {
  const saved = localStorage.getItem('axofacil_inventory_items');
  const deletedKeys = getDeletedInventoryItemKeys();

  if (!saved) {
    return initialInventoryItems.filter(i => 
      !deletedKeys.has(i.id) && 
      !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`)
    );
  }
  try {
    const parsed: InventoryItem[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return initialInventoryItems.filter(i => 
        !deletedKeys.has(i.id) && 
        !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`)
      );
    }

    // Filter out any items that have been explicitly deleted by user
    const activeParsed = parsed.filter(i => 
      !deletedKeys.has(i.id) && 
      !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`)
    );

    // Merge any missing initial items, BUT only if they were NEVER deleted by the user
    const existingIds = new Set(activeParsed.map(i => i.id));
    const missing = initialInventoryItems.filter(i => 
      !existingIds.has(i.id) && 
      !deletedKeys.has(i.id) &&
      !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`)
    );

    if (missing.length > 0 || activeParsed.length !== parsed.length) {
      const merged = [...activeParsed, ...missing];
      localStorage.setItem('axofacil_inventory_items', JSON.stringify(merged));
      return merged;
    }
    return activeParsed;
  } catch {
    return initialInventoryItems.filter(i => 
      !deletedKeys.has(i.id) && 
      !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`)
    );
  }
}

export function deleteInventoryItem(itemId: string, establishmentId?: string, itemName?: string): InventoryItem[] {
  markInventoryItemDeleted(itemId, establishmentId, itemName);
  const current = loadInventoryItems();
  const updated = current.filter(i => {
    if (i.id === itemId) return false;
    if (establishmentId && itemName && (i.establishmentId === establishmentId || i.establishmentId === (establishmentId || '').trim()) && i.name.toLowerCase().trim() === itemName.toLowerCase().trim()) {
      return false;
    }
    return true;
  });
  saveInventoryItems(updated);
  return updated;
}

export function saveInventoryItems(items: InventoryItem[]) {
  localStorage.setItem('axofacil_inventory_items', JSON.stringify(items));
  recordOfflineChange();
  items.forEach(item => syncInventoryItemToSupabase(item).catch(console.warn));
}

export const initialStockMovements: StockMovementRecord[] = [
  {
    id: 'mov-1',
    establishmentId: 'bar-1',
    inventoryItemId: 'inv-1',
    productName: 'Cerveja 2M 330ml (Preta / Clara)',
    type: 'entrada_compra',
    quantity: 48,
    unitCostMT: 60,
    unitSellingPriceMT: 100,
    totalCostMT: 2880,
    totalSellingPriceMT: 4800,
    invoiceOrDocNumber: 'FT-CDM-2026/089',
    supplierName: 'CDM Cervejas de Moçambique',
    reasonOrNotes: 'Reposição de fim de semana',
    operatorName: 'Carlos Gerente',
    date: new Date().toISOString().split('T')[0],
    time: '09:30',
    postToFinancialCashier: true
  },
  {
    id: 'mov-2',
    establishmentId: 'c1',
    inventoryItemId: 'c1-inv-1',
    productName: 'Blocos de Cimento 15cm Vibrados (Centena 100 un)',
    type: 'entrada_compra',
    quantity: 20,
    unitCostMT: 3900,
    unitSellingPriceMT: 4800,
    totalCostMT: 78000,
    totalSellingPriceMT: 96000,
    invoiceOrDocNumber: 'GUIA-PROD-401',
    supplierName: 'Produção Própria Estaleiro',
    reasonOrNotes: 'Lote de cura terminado para venda',
    operatorName: 'Mestre Silva',
    date: new Date().toISOString().split('T')[0],
    time: '08:15',
    postToFinancialCashier: false
  }
];

export function loadStockMovements(): StockMovementRecord[] {
  const saved = localStorage.getItem('axofacil_stock_movements');
  return saved ? JSON.parse(saved) : initialStockMovements;
}

export function saveStockMovements(movements: StockMovementRecord[]) {
  localStorage.setItem('axofacil_stock_movements', JSON.stringify(movements));
  recordOfflineChange();
}

export function loadBarTables(): BarTable[] {
  const saved = localStorage.getItem('axofacil_bar_tables');
  return saved ? JSON.parse(saved) : initialBarTables;
}

export function saveBarTables(tables: BarTable[]) {
  localStorage.setItem('axofacil_bar_tables', JSON.stringify(tables));
  recordOfflineChange();
}

export function loadOperatorLogins(): OperatorLoginRecord[] {
  const saved = localStorage.getItem('axofacil_operator_logins');
  return saved ? JSON.parse(saved) : initialOperatorLogins;
}

export function saveOperatorLogins(logins: OperatorLoginRecord[]) {
  localStorage.setItem('axofacil_operator_logins', JSON.stringify(logins));
  recordOfflineChange();
}

export function getProductFallbackImage(name: string, category?: string): string {
  const n = (name + ' ' + (category || '')).toLowerCase();
  
  // TURISMO, SAFARIS, VOOS, VIAGENS & LOGÍSTICA
  if (n.includes('turismo') || n.includes('safari') || n.includes('voo') || n.includes('voos') || n.includes('passagem') || n.includes('aeroporto') || n.includes('bilhete') || n.includes('reserva') || n.includes('excursão') || n.includes('excursao') || n.includes('ponta do ouro') || n.includes('kruger') || n.includes('praia') || n.includes('fretamento') || n.includes('logística') || n.includes('logistica') || n.includes('carga') || n.includes('frete')) {
    if (n.includes('safari') || n.includes('kruger') || n.includes('parque')) {
      return 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('voo') || n.includes('passagem') || n.includes('aéreo') || n.includes('aereo') || n.includes('lam')) {
      return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('praia') || n.includes('ponta do ouro') || n.includes('bilene') || n.includes('barco') || n.includes('mergulho')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=85';
  }

  // BAR / RESTAURANTE / BEBIDAS / MARISCOS / PETISCOS
  if (n.includes('bar') || n.includes('cerveja') || n.includes('2m') || n.includes('laurentina') || n.includes('txilar') || n.includes('bebe') || n.includes('bebida') || n.includes('coquetel') || n.includes('cocktail') || n.includes('whisky') || n.includes('vodka') || n.includes('gin') || n.includes('rum') || n.includes('vinho') || n.includes('espumante') || n.includes('churrasco') || n.includes('petisco') || n.includes('tábua') || n.includes('marisco') || n.includes('camarão') || n.includes('lula') || n.includes('lagosta') || n.includes('peixe') || n.includes('dose') || n.includes('menu') || n.includes('prato') || n.includes('zambeziana') || n.includes('picanha') || n.includes('caldeirada') || n.includes('refeição') || n.includes('refeicao')) {
    if (n.includes('cerveja') || n.includes('2m') || n.includes('laurentina') || n.includes('txilar')) {
      return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('whisky') || n.includes('vodka') || n.includes('destilado') || n.includes('rum') || n.includes('gin')) {
      return 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('cocktail') || n.includes('caipirinha') || n.includes('mojito') || n.includes('coquetel')) {
      return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('marisco') || n.includes('camarão') || n.includes('lagosta') || n.includes('peixe') || n.includes('lula')) {
      return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('churrasco') || n.includes('carne') || n.includes('picanha') || n.includes('petisco') || n.includes('tábua')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=85';
  }

  // AUTO PEÇAS & ACESSÓRIOS AUTOMÓVEIS
  if (n.includes('peça') || n.includes('peca') || n.includes('auto') || n.includes('carro') || n.includes('motor') || n.includes('filtro') || n.includes('travão') || n.includes('travao') || n.includes('pastilha') || n.includes('pneu') || n.includes('bateria') || n.includes('vela') || n.includes('amortecedor') || n.includes('embraiagem') || n.includes('correia') || n.includes('óleo') || n.includes('oleo') || n.includes('lubrificante') || n.includes('janta') || n.includes('disco') || n.includes('suspensão')) {
    if (n.includes('pneu') || n.includes('roda') || n.includes('janta')) {
      return 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('bateria')) {
      return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('travão') || n.includes('travao') || n.includes('pastilha') || n.includes('disco') || n.includes('calço')) {
      return 'https://images.unsplash.com/photo-1600706432520-256f66eeaf4c?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('motor') || n.includes('correia') || n.includes('vela') || n.includes('embraiagem') || n.includes('amortecedor')) {
      return 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=85';
  }

  // MATERIAL DE CONSTRUÇÃO & FERRAGENS & ESTALEIRO
  if (n.includes('cimento') || n.includes('chapa') || n.includes('zinco') || n.includes('varão') || n.includes('varao') || n.includes('aço') || n.includes('aco') || n.includes('areia') || n.includes('brita') || n.includes('bloco') || n.includes('construção') || n.includes('construcao') || n.includes('estaleiro') || n.includes('cobertura') || n.includes('estrutura')) {
    if (n.includes('cimento')) {
      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('chapa') || n.includes('zinco') || n.includes('cobertura')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('varão') || n.includes('aço') || n.includes('estrutura')) {
      return 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=85';
  }

  // HOSPEDAGEM & HOTELARIA
  if (n.includes('quarto') || n.includes('suíte') || n.includes('suite') || n.includes('hotel') || n.includes('pousada') || n.includes('hospedagem') || n.includes('alojamento') || n.includes('diária') || n.includes('diaria') || n.includes('cama') || n.includes('jacuzzi')) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=85';
  }

  // SUPERMERCADO & MERCEARIA & ALIMENTOS
  if (n.includes('arroz') || n.includes('óleo') || n.includes('oleo') || n.includes('açúcar') || n.includes('acucar') || n.includes('farinha') || n.includes('massa') || n.includes('feijão') || n.includes('feijao') || n.includes('frango') || n.includes('carne') || n.includes('leite') || n.includes('iogurte') || n.includes('queijo') || n.includes('pão') || n.includes('pao') || n.includes('bolacha') || n.includes('biscoito') || n.includes('supermercado') || n.includes('mercearia') || n.includes('fruta') || n.includes('legume')) {
    if (n.includes('arroz') || n.includes('feijão') || n.includes('massa') || n.includes('farinha')) {
      return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('frango') || n.includes('carne') || n.includes('talho')) {
      return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('fruta') || n.includes('legume') || n.includes('maçã') || n.includes('banana')) {
      return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85';
  }

  if (n.includes('rosa') || n.includes('flor') || n.includes('buquê') || n.includes('buque') || n.includes('ornamenta') || n.includes('arranjo') || n.includes('orquídea') || n.includes('margarida')) {
    return 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=85';
  }

  // ROUPAS & FASHION / VESTUÁRIO / SAPATOS
  if (n.includes('camisa') || n.includes('camiseta') || n.includes('t-shirt') || n.includes('polo') || n.includes('fato') || n.includes('terno') || n.includes('vestido') || n.includes('saia') || n.includes('calça') || n.includes('calca') || n.includes('jeans') || n.includes('sapato') || n.includes('sapatilha') || n.includes('ténis') || n.includes('tenis') || n.includes('sandália') || n.includes('meia') || n.includes('gravata') || n.includes('capulana') || n.includes('bolsa') || n.includes('mala') || n.includes('mochila') || n.includes('óculos') || n.includes('relógio') || n.includes('vestuário') || n.includes('moda') || n.includes('loja')) {
    if (n.includes('sapato') || n.includes('sapatilha') || n.includes('ténis') || n.includes('mocassim')) {
      return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('fato') || n.includes('terno')) {
      return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('vestido')) {
      return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=85';
  }

  // DEFAULT FALLBACK: Clean store counter display
  return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=85';
}


export const initialEstablishments: Establishment[] = [
  {
    id: 'c1',
    name: 'Estaleiro & Ferragens Matola Construções',
    category: 'construcao',
    zone: 'Matola & Arredores',
    address: 'Estrada Nacional N1, Matola Rio, próximo ao Malhampsene, Província de Maputo',
    locationLandmarks: 'A 200m da Paragem de Autocarro de Malhampsene, defronte à bombas da Total e ao lado do Mercado da Matola Rio.',
    description: 'Estaleiro líder e distribuidor oficial de cimento Limpopo e Mozal, chapas de zinco e caneladas, varão de aço reforçado, areia grossa de rio, brita por carrada, blocos de cimento de 15cm e 20cm com entrega em obras em toda a Província e Cidade de Maputo.',
    rating: 4.9,
    metaInfo: 'Venda a Grosso & Retalho · Entrega com Camião na Obra',
    promotion: 'Desconto no cimento a partir de 50 sacos e frete grátis para a Matola',
    coverColor: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    salesType: 'ambos',
    segment: 'Cimento, Chapas, Varão & Estaleiro',
    productsList: ['Cimento Limpopo 42.5N', 'Chapa de Zinco 0.40mm', 'Varão de Aço 12mm', 'Areia Grossa de Rio (Carrada)', 'Brita nº 1 (Metro cúbico)', 'Blocos de Cimento 15cm'],
    productsCatalog: [
      { id: 'pc1', name: 'Cimento Limpopo 42.5N (Saco 50kg)', priceMT: 490, promoPriceMT: 465, isPromo: true, category: 'Cimento', description: 'Cimento de alta resistência ideal para betão armado e fundações sólidas.', imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80' },
      { id: 'pc2', name: 'Chapa de Zinco Canelada 0.40mm (Peça 3.6m)', priceMT: 780, promoPriceMT: 720, isPromo: true, category: 'Cobertura', description: 'Chapa galvanizada reforçada contra ferrugem e intempéries.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80' },
      { id: 'pc3', name: 'Varão de Aço Nervurado 12mm (Vara 6m)', priceMT: 520, category: 'Estruturas', description: 'Aço de construção estrutural certificado para vigas e pilares.', imageUrl: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=400&q=80' },
      { id: 'pc4', name: 'Carrada de Areia Grossa de Rio (Camião 10m³)', priceMT: 8500, category: 'Agregados', description: 'Areia limpa para assentamento de blocos e betonagem de placas.', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80' }
    ],
    operatorsList: ['Eng. Tomás Gerente de Obra', 'Sr. Mateus Atendimento Estaleiro'],
    features: ['Venda a Grosso', 'Venda a Retalho', 'Estaleiro de Materiais', 'Entrega na Obra', 'Cimento', 'Chapas & Varão', 'Matola'],
    contactPhone: '+258 84 999 1122',
    whatsappLink: 'https://wa.me/258849991122?text=Olá,%20gostaria%20de%20orçamento%20de%20cimento,%20chapas%20e%20varão%20de%20aço%20com%20entrega%20na%20minha%20obra',
    visits: 2450,
    searches: 1120,
    salesOrReservations: 580
  },

  {
    id: 'c2',
    name: 'Estaleiro & Materiais Zimpeto Atacado',
    category: 'construcao',
    zone: 'Zimpeto & Magoanine',
    address: 'Av. de Moçambique, Zimpeto (próximo ao Terminal Rodoviário e Estádio Nacional)',
    locationLandmarks: 'A 100m da entrada principal do Terminal do Zimpeto, junto ao entroncamento do Anel Viário de Maputo.',
    description: 'Atacadista especializado em fornecimento de grandes volumes para construtores e pequenas lojas de ferragens. Fornecemos blocos de cimento de 15cm e 20cm vibrados, areia vermelha e grossa, brita, tubo PVC de esgoto, redes de vedação e arame queimado.',
    rating: 4.8,
    metaInfo: 'Preço de Fábrica & Atacado · Estaleiro Aberto',
    promotion: 'Desconto acumulativo em encomendas acima de 500 blocos e 2 carradas de areia',
    coverColor: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80',
    salesType: 'grosso',
    segment: 'Estaleiro, Blocos, Areia & Brita',
    productsList: ['Blocos de Cimento 15cm (Centena)', 'Blocos de Cimento 20cm (Centena)', 'Carrada de Brita nº 1', 'Areia Vermelha Camati', 'Rede de Vedação Galvanizada 25m'],
    productsCatalog: [
      { id: 'c2-p1', name: 'Blocos de Cimento 15cm Vibrados (Centena)', priceMT: 4500, promoPriceMT: 4100, isPromo: true, category: 'Blocos', description: 'Blocos de cimento industriais prensados e vibrados para alvenaria.', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80' },
      { id: 'c2-p2', name: 'Blocos de Cimento 20cm Estruturais (Centena)', priceMT: 5400, promoPriceMT: 4900, isPromo: true, category: 'Blocos', description: 'Blocos de alta resistência para muros de vedação e estruturas.', imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=400&q=80' },
      { id: 'c2-p3', name: 'Areia Vermelha Camati (Carrada 10m³)', priceMT: 6800, category: 'Agregados', description: 'Areia vermelha de aterro e assentamento. Preço por carrada.', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80' },
      { id: 'c2-p4', name: 'Brita nº 1 para Betonagem (Carrada 10m³)', priceMT: 9200, category: 'Agregados', description: 'Brita lavada para preparação de betão armado e fundações.', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Venda a Grosso', 'Estaleiro', 'Blocos de Cimento', 'Zimpeto', 'Areia & Brita'],
    contactPhone: '+258 82 888 3344',
    whatsappLink: 'https://wa.me/258828883344?text=Olá,%20gostaria%20de%20comprar%20blocos,%20areia%20e%20brita%20a%20grosso%20no%20Zimpeto',
    visits: 1980,
    searches: 890,
    salesOrReservations: 420
  },

  {
    id: 'auto-1',
    name: 'Auto Peças Maputo Baixa & Acessórios',
    category: 'pecas_auto',
    zone: 'Baixa da Cidade',
    province: 'Cidade de Maputo',
    address: 'Av. Mao Tse Tung, cruzamento com Av. Karl Marx, Baixa, Maputo',
    locationLandmarks: 'A 40m do BCI da Karl Marx, em frente ao Posto de Combustível da Galp e próximo à oficina central.',
    description: 'Especialistas em peças de reposição automóvel para Toyota, Nissan, Ford, Isuzu, Hyundai e Kia. Venda de calços de travão, discos, amortecedores Monroe, óleos sintéticos Shell/Castrol, baterias 12V 70Ah e filtros.',
    rating: 4.9,
    metaInfo: 'Aberto agora · Venda a Grosso & Retalho',
    promotion: 'Desconto de 15% na troca de óleo com filtro de oferta para táxis e particulares',
    coverColor: '#1E293B',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80',
    salesType: 'ambos',
    segment: 'Auto Peças & Acessórios Automóveis',
    productsList: ['Calços de travão', 'Amortecedores Monroe', 'Óleo 10W40 Shell', 'Baterias 12V 70Ah', 'Filtros de óleo e ar', 'Lâmpadas LED Auto'],
    productsCatalog: [
      { id: 'ap1', name: 'Óleo Sintético Shell Helix Ultra 5W40 (5L)', priceMT: 2800, promoPriceMT: 2450, isPromo: true, category: 'Lubrificantes', description: 'Óleo sintético premium para motor a gasolina ou diesel com proteção antidesgaste.', imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80' },
      { id: 'ap2', name: 'Bateria Willard 12V 70Ah Reforçada (Com Garantia 12 Meses)', priceMT: 6500, promoPriceMT: 5800, isPromo: true, category: 'Baterias', description: 'Bateria selada sem manutenção, partida a frio de alta capacidade para carros e pickups.', imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=400&q=80' },
      { id: 'ap3', name: 'Jogo de Calços de Travão Frente Toyota Hilux / Fortuner', priceMT: 1950, category: 'Travões', description: 'Calços cerâmicos de alto desempenho silenciosos sem poeira.', imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Auto Peças', 'Baixa da Cidade', 'Óleos & Lubrificantes', 'Baterias 12V', 'Travões & Suspensão', 'Venda a Grosso', 'Venda a Retalho'],
    contactPhone: '+258 84 444 8899',
    whatsappLink: 'https://wa.me/258844448899?text=Olá,%20gostaria%20de%20consultar%20preços%20de%20peças%20automóveis%20em%20Maputo',
    visits: 1650,
    searches: 820,
    salesOrReservations: 390
  },

  {
    id: 'auto-2',
    name: 'Mozambique Auto Spares Matola & Zimpeto',
    category: 'pecas_auto',
    zone: 'Matola & Zimpeto',
    province: 'Província de Maputo (Matola/Zimpeto/Boane)',
    address: 'Estrada Nacional N1, Nó de Zimpeto / Matola, Província de Maputo',
    locationLandmarks: 'Ao lado do Terminal do Zimpeto e defronte à bombas da Total Matola.',
    description: 'Distribuidor atacadista de peças automóveis, pneus para viaturas ligeiras e pesadas, jantes especiais, kits de embraiagem, correias de distribuição e faróis com entregas directas em oficinas.',
    rating: 4.8,
    metaInfo: 'Fornecedor de Oficinas & Garagens · Aberto até às 18h',
    promotion: 'Preço de lote em pneus R15/R16 e baterias para frotas de transporte e entregadores',
    coverColor: '#0F172A',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80',
    salesType: 'grosso',
    segment: 'Pneus, Baterias & Componentes Auto',
    productsList: ['Pneus R14, R15, R16, R17', 'Baterias Willard & Dixon 12V', 'Kits de Embraiagem LUK', 'Faróis LED & Piscas', 'Correia de Distribuição Gates'],
    productsCatalog: [
      { id: 'auto2-p1', name: 'Pneu Radial R15 195/65R15 para Viaturas Ligeiras', priceMT: 4200, promoPriceMT: 3750, isPromo: true, category: 'Pneus', description: 'Pneu reforçado com alta aderência em pisos secos e molhados.', imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80' },
      { id: 'auto2-p2', name: 'Bateria Dixon 12V 65Ah para Transporte e Táxis', priceMT: 5800, category: 'Baterias', description: 'Bateria de alta durabilidade com garantia estendida de fábrica.', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Venda a Grosso', 'Auto Peças', 'Pneus', 'Baterias', 'Zimpeto & Matola', 'Atacado Auto'],
    contactPhone: '+258 82 777 0011',
    whatsappLink: 'https://wa.me/258827770011?text=Olá,%20gostaria%20de%20orçamento%20de%20pneus%20e%20baterias%20a%20grosso',
    visits: 1420,
    searches: 710,
    salesOrReservations: 310
  },

  {
    id: 'l1',
    name: 'Loja Baixa Têxtil',
    category: 'loja',
    zone: 'Baixa da Cidade',
    address: 'Av. 25 de Setembro, Baixa, Maputo',
    locationLandmarks: 'A 50m da Paragem de Autocarro do Museu, em frente ao Banco Millenium BIM e ao lado da Farmácia Baixa.',
    description: 'Especialista em capulanas importadas, capulanas em fardos para revenda, tecidos finos africanos, vestidos e confecção personalizada.',
    rating: 4.7,
    metaInfo: 'Aberto agora · Fecha às 18h',
    promotion: '−20% em capulanas estampadas e fardos esta semana',
    coverColor: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80'
    ],
    salesType: 'ambos',
    productsList: ['Capulanas', 'Capulanas em fardo', 'Tecidos', 'Vestidos de noiva', 'Fardas', 'Moda africana'],
    productsCatalog: [
      { id: 'p1', name: 'Capulana Estampada VIP (Peça 6 jardas)', priceMT: 850, promoPriceMT: 680, isPromo: true, category: 'Capulanas', description: 'Capulana de alta qualidade 100% algodão com estampas exclusivas.', imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=400&q=80' },
      { id: 'p2', name: 'Fardo Capulanas Importadas (50 Peças)', priceMT: 28000, promoPriceMT: 24500, isPromo: true, category: 'Lote Grosso', description: 'Lote fechado para revendedores e comerciantes da Baixa e províncias.', imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80' },
      { id: 'p3', name: 'Tecido de Seda Africana (Metro)', priceMT: 450, category: 'Tecidos', description: 'Tecido fino para confecção de vestidos de festa e casamentos.', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80' }
    ],
    operatorsList: ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'],
    features: ['Têxtil e moda', 'Baixa da Cidade', 'Capulanas', 'Venda a Grosso', 'Venda a Retalho', 'Capulanas em fardo'],
    contactPhone: '+258 84 123 4567',
    whatsappLink: 'https://wa.me/258841234567?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20as%20capulanas%20a%20grosso%20e%20retalho',
    visits: 1240,
    searches: 410,
    salesOrReservations: 312
  },

  {
    id: 'l-doce-amor',
    name: 'Doce Amor - Floraria & Ornamentação de Flores',
    category: 'loja',
    zone: 'Polana & Baixa da Cidade',
    address: 'Av. Julius Nyerere nº 1420, Polana Cimento / Baixa, Maputo',
    locationLandmarks: 'A 50m do Hotel Polana, em frente à Pastelaria Mimos e próximo ao Jardim Tunduru.',
    description: 'A floraria de luxo e atelier de ornamentação mais romântico de Maputo. Criamos buquês exclusivos de rosas vermelhas e importadas, caixas surpresa com flores e chocolates finos, arranjos de mesa para casamentos, ornamentação para eventos e serviço especial de delivery expresso de rosas com mensagem personalizada.',
    rating: 4.9,
    metaInfo: 'Atelier Floral & Delivery de Rosas Expresso · Aberto agora',
    promotion: '🌹 −15% em Buquês de Rosas Vermelhas e Caixas "Doce Amor" com Ferrero Rocher nesta semana!',
    coverColor: '#0F2E5C',
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80'
    ],
    salesType: 'ambos',
    segment: 'Floraria, Ornamentação de Eventos & Delivery de Rosas',
    productsList: [
      'Rosas Vermelhas Importadas',
      'Buquê Clássico de Rosas "Doce Amor"',
      'Caixa Romântica de Rosas & Chocolates',
      'Buquê Gigante de 50 Rosas',
      'Ornamentação de Casamentos & Eventos',
      'Arranjo de Flores Tropicais & Orquídeas'
    ],
    productsCatalog: [
      {
        id: 'da-p1',
        name: 'Buquê Clássico 12 Rosas Vermelhas "Doce Amor"',
        priceMT: 1800,
        promoPriceMT: 1500,
        isPromo: true,
        category: 'Buquês de Rosas',
        description: '12 rosas vermelhas frescas de haste longa embaladas em papel Kraft aveludado com laço de cetim e cartão de mensagem.',
        imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'da-p2',
        name: 'Caixa Luxo "Doce Amor" (24 Rosas + Bombons Ferrero Rocher)',
        priceMT: 3500,
        promoPriceMT: 2990,
        isPromo: true,
        category: 'Caixas de Flores',
        description: 'Caixa rígida personalizada em formato de coração com 24 rosas aveludadas e bombons finos de chocolate.',
        imageUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'da-p3',
        name: 'Buquê Gigante 50 Rosas "Amor Eterno"',
        priceMT: 5800,
        promoPriceMT: 4900,
        isPromo: true,
        category: 'Buquês de Rosas',
        description: 'Impressionante buquê imperial com 50 rosas vermelhas e brancas selecionadas para pedidos de casamento e aniversários.',
        imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'da-p4',
        name: 'Arranjo de Mesa com Orquídeas & Lírios Brancos',
        priceMT: 2200,
        category: 'Arranjos & Vasos',
        description: 'Arranjo sofisticado em vaso de vidro para decoração de escritórios, recepções e jantares de gala.',
        imageUrl: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'da-p5',
        name: 'Serviço de Ornamentação Floral para Casamento & Festas',
        priceMT: 25000,
        promoPriceMT: 20000,
        isPromo: true,
        category: 'Ornamentação de Eventos',
        description: 'Ornamentação completa com arco de flores na entrada, arranjos de mesa para convidados, painel instagramável e bouquet da noiva.',
        imageUrl: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'da-p6',
        name: 'Taxa de Delivery de Rosas Expresso (Maputo & Matola)',
        priceMT: 500,
        category: 'Delivery',
        description: 'Entrega surpresa no local de trabalho ou residência com estafeta caracterizado e entrega formal em mãos.',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80'
      }
    ],
    operatorsList: ['Dra. Carmen Florista Principal', 'Sr. Sérgio Atendimento & Delivery Doce Amor'],
    features: [
      'Flores',
      'Rosas',
      'Floraria',
      'Doce Amor',
      'Buquês de Rosas',
      'Ornamentação de Flores',
      'Delivery de Rosas',
      'Caixa de Rosas e Chocolates',
      'Polana & Baixa',
      'Eventos e Casamentos'
    ],
    contactPhone: '+258 84 590 7836',
    whatsappLink: 'https://wa.me/258845907836?text=Olá%20Doce%20Amor!%20Gostaria%20de%20encomendar%20um%20buquê%20de%20rosas/ornamentação',
    visits: 3120,
    searches: 1840,
    salesOrReservations: 820
  },

  {
    id: 'b1',
    name: 'Kanimambo Bar & Jazz Lounge',
    category: 'bar',
    zone: 'Polana · Av. Julius Nyerere',
    address: 'Av. Julius Nyerere, Polana, Maputo',
    locationLandmarks: 'A 100m do Polana Shopping, em frente ao Consulado de Portugal, paragem de minibus Polana.',
    description: 'O verdadeiro ponto de encontro para os amantes da música moçambicana e internacional ao vivo, jazz, e petiscos tradicionais acompanhados pela nossa famosa cerveja gelada.',
    rating: 4.8,
    metaInfo: 'Aberto até 2h · Música ao Vivo',
    promotion: 'Happy hour hoje em dose dupla de cerveja 2M das 18h às 20h',
    coverColor: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    productsList: ['Cerveja 2M 500ml', 'Laurentina Preta', 'Caipirinha Especial', 'Tábua de Mariscos', 'Picanha na Chapa'],
    productsCatalog: [
      { id: 'b1-p1', name: 'Cerveja 2M Garrafa 500ml Estúpida de Gelada', priceMT: 120, promoPriceMT: 100, isPromo: true, category: 'Cervejas', description: 'Cerveja moçambicana servida na temperatura ideal.', imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' },
      { id: 'b1-p2', name: 'Tábua de Mariscos & Camarão Grelhado na Brasa', priceMT: 1200, promoPriceMT: 990, isPromo: true, category: 'Petiscos', description: 'Camarões do Índico, lulas grelhadas e batata frita.', imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&q=80' },
      { id: 'b1-p3', name: 'Caipirinha de Lima & Hortelã Fresca', priceMT: 250, category: 'Cocktails', description: 'Cocktail refrescante preparado na hora por barman qualificado.', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Música ao vivo', 'Petiscos', 'Cerveja gelada', 'Happy hour'],
    contactPhone: '+258 84 555 1212',
    whatsappLink: 'https://wa.me/258845551212?text=Olá,%20gostaria%20de%20reservar%20mesa%20no%20Kanimambo%20Bar',
    visits: 1510,
    searches: 655,
    salesOrReservations: 410
  },

  {
    id: 'b2',
    name: 'Bar Costa do Sol Marginal',
    category: 'bar',
    zone: 'Costa do Sol · Marginal',
    address: 'Avenida Marginal, Costa do Sol, Maputo',
    locationLandmarks: 'Junto à praia da Costa do Sol, ao lado do Restaurante Marítimo, a 200m da rotunda da Marginal.',
    description: 'Um clássico icónico de Maputo situado à beira-mar. Desfrute de mariscos frescos e as nossas famosas caipirinhas com uma vista deslumbrante e brisa fresca do Índico.',
    rating: 4.7,
    metaInfo: 'Aberto até 23h · Esplanada à Beira-Mar',
    promotion: 'Happy hour hoje com desconto em caipirinhas até ao pôr-do-sol',
    coverColor: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    productsList: ['Prato de Lulas & Camarão', 'Cocktails Tropical', 'Balde de Cervejas 2M', 'Tábua de Petiscos'],
    productsCatalog: [
      { id: 'b2-p1', name: 'Prato Especial Lulas & Camarão à Costa do Sol', priceMT: 1400, promoPriceMT: 1200, isPromo: true, category: 'Especiais', description: 'Prato do dia com frutos do mar frescos e molho de alho.', imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=400&q=80' },
      { id: 'b2-p2', name: 'Balde com 6 Cervejas 2M / Manica Geladas', priceMT: 650, promoPriceMT: 580, isPromo: true, category: 'Cervejas', description: 'Balde de gelo com 6 cervejas de 500ml para partilhar.', imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Vista para o mar', 'Mariscos', 'Cocktails', 'Esplanada'],
    contactPhone: '+258 82 444 3333',
    whatsappLink: 'https://wa.me/258824443333?text=Olá,%20gostaria%20de%20saber%20sobre%20o%20menu%20de%20mariscos',
    visits: 1890,
    searches: 720,
    salesOrReservations: 530
  },

  {
    id: 'h1',
    name: 'Hotel Baixa Executive Suites',
    category: 'hospedagem',
    zone: 'Baixa da Cidade',
    address: 'Av. 25 de Setembro, Baixa, Maputo',
    locationLandmarks: 'A 100 metros da Praça dos Trabalhadores, em frente ao Banco de Moçambique e próximo à Estação CFM.',
    description: 'Suítes executivas modernas no coração financeiro e comercial de Maputo. Wi-Fi ultrarrápido, pequeno-almoço buffet incluído e salas de reuniões completas.',
    rating: 4.8,
    metaInfo: 'Diária a partir de 3.500 MT · Pequeno-Almoço Grátis',
    promotion: '−20% de desconto em estadias superiores a 3 noites',
    coverColor: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    productsList: ['Suíte Executiva King', 'Quarto Duplo Standard', 'Diária com Pequeno-Almoço', 'Transfer Executivo Aeroporto'],
    productsCatalog: [
      { id: 'h1-p1', name: 'Suíte Executiva com Cama King & Vista Cidade/Mar (Diária)', priceMT: 3500, promoPriceMT: 2900, isPromo: true, category: 'Suítes & Diárias', description: 'Suíte climatizada com mesa de trabalho, Wi-Fi de alta velocidade e pequeno-almoço incluso.', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80' },
      { id: 'h1-p2', name: 'Quarto Duplo Standard com Ar Condicionado & TV (Diária)', priceMT: 2800, category: 'Quartos', description: 'Quarto aconchegante ideal para viagens de negócios ou casais.', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Quartos executivos', 'Pequeno-almoço', 'Wi-Fi rápido', 'Salas de reunião'],
    contactPhone: '+258 84 100 2000',
    whatsappLink: 'https://wa.me/258841002000?text=Olá,%20gostaria%20de%20reservar%20um%20quarto%20no%20Hotel%20Baixa%20Executive',
    visits: 2100,
    searches: 890,
    salesOrReservations: 640
  },

  {
    id: 'h2',
    name: 'Pousada Polana Sol Familiar',
    category: 'hospedagem',
    zone: 'Polana · Av. Mao Tse Tung',
    address: 'Av. Mao Tse Tung, Polana, Maputo',
    locationLandmarks: 'Esquina com a Av. Vladimir Lenine, a 50m do Jardim dos Cronistas, paragem do chapa Mao Tse Tung.',
    description: 'Ambiente acolhedor e familiar na prestigiada zona da Polana. Quartos climatizados, jardim relaxante e estacionamento privativo seguro 24h.',
    rating: 4.7,
    metaInfo: 'Diária a partir de 2.200 MT · Jardim Relaxante',
    promotion: 'Pequeno-almoço tropical gratuito para reservas diretas via WhatsApp',
    coverColor: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    productsList: ['Quarto Sol de Verão', 'Suíte Familiar Polana', 'Pequeno-Almoço Tropical'],
    productsCatalog: [
      { id: 'h2-p1', name: 'Quarto Sol Aconchegante com Cama Casal (Diária)', priceMT: 2200, promoPriceMT: 1950, isPromo: true, category: 'Quartos', description: 'Ambiente tranquilo com vista para o jardim e casa de banho privativa.', imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=400&q=80' }
    ],
    features: ['Ambiente familiar', 'Jardim', 'Ar condicionado', 'Estacionamento 24h'],
    contactPhone: '+258 82 300 4000',
    whatsappLink: 'https://wa.me/258823004000?text=Olá,%20gostaria%20de%20verificar%20disponibilidade%20na%20Pousada%20Polana%20Sol',
    visits: 1320,
    searches: 510,
    salesOrReservations: 380
  },

  {
    id: 's1',
    name: 'Supermercado VIP Baixa',
    category: 'supermercado',
    zone: 'Baixa da Cidade (Av. 25 de Setembro)',
    province: 'Cidade de Maputo',
    address: 'Av. 25 de Setembro, Baixa de Maputo, Edifício VIP',
    locationLandmarks: 'A 100m da Praça dos Trabalhadores e do Mercado Central',
    description: 'Supermercado completo na Baixa de Maputo com grande variedade de frescos, mercearia, bebidas a grosso e retalho, congelados e produtos importados.',
    rating: 4.9,
    metaInfo: 'Aberto de Segunda a Sábado: 08h00 - 20h00 · Domingo: 08h00 - 14h00',
    promotion: 'Desconto de 10% em cabazes de compras de valor superior a 3.000 MT',
    coverColor: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    features: ['Mercearia', 'Bebidas a Grosso', 'Hortifrúti', 'Entrega ao Domicílio com Moto-Táxi'],
    contactPhone: '+258 84 311 0000',
    whatsappLink: 'https://wa.me/258843110000?text=Olá,%20gostaria%20de%20fazer%20uma%20encomenda%20no%20Supermercado%20VIP%20Baixa',
    salesType: 'ambos',
    segment: 'Supermercado & Alimentação',
    productsList: ['Arroz fardo 25kg', 'Óleo alimentar', 'Açúcar', 'Lacticínios', 'Bebidas caixa'],
    productsCatalog: [
      { id: 's1-p1', name: 'Tomate Fresco Redondo de Chókwè', priceMT: 120, promoPriceMT: 95, isPromo: true, unitLabel: 'Kg', isAvailable: true, category: 'Hortifrúti', description: 'Tomates vermelhos e rijos para salada e molhos. Preço por Quilo (Kg).', imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p2', name: 'Cebola Roxa Nacional', priceMT: 90, promoPriceMT: 75, isPromo: true, unitLabel: 'Kg', isAvailable: true, category: 'Hortifrúti', description: 'Cebolas roxas secas e saborosas da colheita nacional. Preço por Quilo (Kg).', imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p3', name: 'Batata RENAM Seleccionada', priceMT: 85, unitLabel: 'Kg', isAvailable: true, category: 'Hortifrúti', description: 'Batata para fritar e cozer de primeira qualidade. Preço por Quilo (Kg).', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p4', name: 'Arroz Imperial Fardo 25kg (Agulha)', priceMT: 1350, promoPriceMT: 1250, isPromo: true, unitLabel: 'Saco 25kg', isAvailable: true, category: 'Cereais & Fardos', description: 'Saco de arroz agulha solto de 25 quilos.', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p5', name: 'Óleo Alimentar Leve Garrafa 5 Litros', priceMT: 520, promoPriceMT: 480, isPromo: true, unitLabel: 'Garrafa 5L', isAvailable: true, category: 'Óleos & Condimentos', description: 'Óleo vegetal puro enriquecido com Vitamina A.', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p6', name: 'Frango Fresco Inteiro Abatido', priceMT: 220, unitLabel: 'Kg', isAvailable: true, category: 'Talho & Aves', description: 'Frango fresco limpo e embalado. Preço por Quilo (Kg).', imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=400&q=80' },
      { id: 's1-p7', name: 'Carne de Vaca para Grelhar (Lombo)', priceMT: 480, promoPriceMT: 450, isPromo: true, unitLabel: 'Kg', isAvailable: true, category: 'Talho & Aves', description: 'Corte nobre de vaca macia para bife ou churrasco. Preço por Quilo (Kg).', imageUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=400&q=80' }
    ],
    isActive: true,
    visits: 2100,
    searches: 890,
    salesOrReservations: 430
  },

  {
    id: 's2',
    name: 'Recheio Cash & Carry Zimpeto',
    category: 'supermercado',
    zone: 'Zimpeto (Próximo à Estação)',
    province: 'Província de Maputo (Matola/Zimpeto/Boane)',
    address: 'Estrada Nacional N1, Nó do Zimpeto, Maputo Província',
    locationLandmarks: 'Próximo ao Estádio do Zimpeto e Terminal Rodoviário',
    description: 'Grande centro atacadista e supermercado para famílias, lojas de bairro e revendedores. Produtos de grande consumo em fardo e caixas a preço de fábrica.',
    rating: 4.8,
    metaInfo: 'Venda a Grosso & Retalho · Estacionamento Gratuito para 100 Viaturas',
    promotion: 'Preço especial em caixas de óleo, arroz e detergentes para revendedores da Província',
    coverColor: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    features: ['Venda a Grosso', 'Acessível para Camionetas', 'Açougue Fresco', 'Parceria com Fretes'],
    contactPhone: '+258 82 555 9999',
    whatsappLink: 'https://wa.me/258825559999?text=Olá,%20gostaria%20de%20consultar%20a%20tabela%20de%20preços%20a%20grosso%20do%20Recheio%20Zimpeto',
    salesType: 'grosso',
    segment: 'Supermercado & Atacado',
    productsList: ['Fardos de feijão', 'Caixas de sabão', 'Caixas de massa', 'Bebidas em palete'],
    productsCatalog: [
      { id: 's2-p1', name: 'Fardo de Feijão Manteiga (10x1kg)', priceMT: 1150, promoPriceMT: 990, isPromo: true, category: 'Fardos & Atacado', description: 'Feijão graúdo seleccionado em fardo com 10 pacotes.', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
      { id: 's2-p2', name: 'Caixa de Sabão em Barra Azul (20 Unidades)', priceMT: 890, category: 'Higiene & Limpeza', description: 'Caixa de sabão de lavar roupa de alto rendimento.', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&q=80' }
    ],
    isActive: true,
    visits: 1850,
    searches: 720,
    salesOrReservations: 390
  },

  {
    id: 't1',
    name: 'Turismo e Logística — Escritório Central & Balcão Oficial',
    category: 'turismo',
    zone: 'Baixa da Cidade',
    city: 'Maputo',
    province: 'Cidade de Maputo',
    address: 'Av. 24 de Julho, Baixa, Maputo',
    locationLandmarks: 'Próximo à Estação de Caminhos de Ferro (CFM), a 100m da Praça dos Trabalhadores.',
    description: 'Agência oficial de Turismo e Logística com equipa própria de acolhimento e transfer no Aeroporto Internacional de Maputo, frota climatizada própria, bilhetes aéreos, viagens internacionais, roteiros domésticos, turismo religioso e a rede de logística expressa que liga e abastece todas as lojas parceiras.',
    rating: 4.8,
    reviewCount: 96,
    metaInfo: 'Pacotes a partir de 4.500 MT · Receptivo Aeroporto Incluído',
    promotion: '✈️ 10% de desconto em grupos de 6 ou mais pessoas nos roteiros domésticos',
    coverColor: '#0E7490',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1591192969450-4e5a5d8b1a1f?auto=format&fit=crop&w=800&q=80'
    ],
    productsList: [
      'Roteiro Praias de Ponta do Ouro & Farol',
      'Excursão Ilha de Inhaca, Farol & Santa Maria',
      'Roteiro Lagoas de Bilene & Macaneta',
      'Circuito Histórico & Religioso de Maputo e Namaacha',
      'Safari Reserva Especial de Maputo & Gorongosa',
      'Peregrinação ao Vaticano & Roma (Turismo Religioso)',
      'Bilhete Aéreo Maputo–Joanesburgo–Roma / Nacionais',
      'Serviço de Logística — Entregas entre Lojas e Mercados'
    ],
    productsCatalog: [
      {
        id: 't1-p1',
        name: 'Roteiro Ponta do Ouro & Farol — Fim de Semana (3 dias / 2 noites)',
        priceMT: 8500,
        category: 'Turismo Doméstico',
        description: 'Praias tropicais de Moçambique, dunas virgens, visita ao histórico Farol da Ponta do Ouro, mergulho com golfinhos e alojamento à beira-mar com transporte climatizado incluído.',
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Ponta do Ouro & Farol, Moçambique',
        originCity: 'Maputo',
        durationLabel: '3 dias / 2 noites',
        minGroupSize: 4,
        maxGroupSize: 30,
        includesTransport: true,
        includesLodging: true,
        includesMeals: false,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 50
      },
      {
        id: 't1-p2',
        name: 'Excursão Ilha de Inhaca, Farol Histórico & Santa Maria — 2 dias',
        priceMT: 9800,
        category: 'Turismo Doméstico',
        description: 'Travessia de barco pela Baía de Maputo, visita ao Farol de Inhaca, recifes de coral da Ponta de Santa Maria e Ilha dos Portugueses com guia local e refeições de marisco fresco.',
        imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Ilha de Inhaca & Farol, Baía de Maputo',
        originCity: 'Porto de Maputo',
        durationLabel: '2 dias / 1 noite',
        minGroupSize: 4,
        maxGroupSize: 25,
        includesTransport: true,
        includesLodging: true,
        includesMeals: true,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 50
      },
      {
        id: 't1-p3',
        name: 'Roteiro Lagoas de Bilene & Praias de Macaneta — 3 dias / 2 noites',
        priceMT: 7200,
        category: 'Turismo Doméstico',
        description: 'Águas calmas e azul-turquesa da Lagoa Uembje em Bilene, desportos náuticos, dunas de Macaneta e passagem pela Costa do Sol com transporte próprio e assistência contínua.',
        imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Bilene, Macaneta & Gaza, Moçambique',
        durationLabel: '3 dias / 2 noites',
        minGroupSize: 4,
        maxGroupSize: 30,
        includesTransport: true,
        includesLodging: true,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 40
      },
      {
        id: 't1-p4',
        name: 'Circuito Religioso de Maputo & Peregrinação a Namaacha — 1 dia',
        priceMT: 3500,
        category: 'Turismo Religioso',
        description: 'Visita aos principais pontos de fé e património histórico de Moçambique: Sé Catedral de Maputo (Nossa Senhora da Conceição), Igreja de Santo António da Polana e Peregrinação ao Santuário de Nossa Senhora de Fátima em Namaacha com almoço comunitário.',
        imageUrl: 'https://images.unsplash.com/photo-1548625361-165b48cb943d?auto=format&fit=crop&w=600&q=80',
        tourismType: 'religioso',
        destination: 'Catedral de Maputo, Polana & Santuário de Namaacha',
        originCity: 'Maputo / Matola',
        durationLabel: '1 dia (07:30 – 18:00)',
        minGroupSize: 6,
        maxGroupSize: 40,
        includesTransport: true,
        includesMeals: true,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 50
      },
      {
        id: 't1-p5',
        name: 'Safari Reserva Especial de Maputo & Vida Selvagem Africana — 2 dias',
        priceMT: 12500,
        category: 'Turismo Doméstico',
        description: 'Aventura 4x4 na Reserva Especial de Maputo (antiga Reserva de Elefantes de Matutuíne) com observação de manadas de elefantes, aves costeiras, lagoas selvagens e safaris na savana moçambicana.',
        imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Reserva Especial de Maputo & Matutuíne',
        originCity: 'Maputo',
        durationLabel: '2 dias / 1 noite',
        minGroupSize: 4,
        maxGroupSize: 18,
        includesTransport: true,
        includesLodging: true,
        includesMeals: true,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 50
      },
      {
        id: 't1-p6',
        name: 'Peregrinação Internacional ao Vaticano & Roma — 10 dias / 9 noites',
        priceMT: 245000,
        category: 'Turismo Religioso',
        description: 'Grande roteiro católico internacional com audiência papal na Praça de São Pedro, Basílica de São Pedro, Museus do Vaticano, Catacumbas e locais sagrados da cristandade. Voos, hotéis parceiros e acompanhamento pastoral.',
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
        tourismType: 'religioso',
        destination: 'Vaticano & Roma, Itália',
        originCity: 'Maputo (Aeroporto Internacional)',
        durationLabel: '10 dias / 9 noites',
        minGroupSize: 8,
        maxGroupSize: 25,
        includesTransport: true,
        includesLodging: true,
        includesMeals: true,
        includesGuide: true,
        includesAirportPickup: true,
        allowSchedule: true,
        upfrontPercentage: 30
      },
      {
        id: 't1-p7',
        name: 'Bilhetes Aéreos Nacionais & Internacionais (Emissão IATA)',
        priceMT: 92000,
        category: 'Bilhetes & Reservas',
        description: 'Gestão, emissão e suporte de passagens aéreas nacionais (Maputo, Beira, Nampula, Pemba) e rotas internacionais (Joanesburgo, Lisboa, Roma, Dubai). Inclui assistência no check-in e escolha de assentos.',
        imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
        tourismType: 'bilhete',
        destination: 'Rotas Domésticas & Internacionais',
        originCity: 'Maputo',
        allowBuyNow: true
      },
      {
        id: 't1-p8',
        name: 'Serviço de Logística — Entrega Rápida entre Lojas e Mercados (Maputo & Matola)',
        priceMT: 450,
        unitLabel: 'Por corrida/entrega',
        category: 'Logística & Entregas',
        description: 'Serviço de recolha, transbordo e entrega expressa de mercadorias, caixas, fardos e encomendas entre lojas, supermercados, bares e estaleiros em Maputo e Matola, operado com motoristas credenciados.',
        imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
        tourismType: 'logistica',
        destination: 'Maputo, Matola, Boane & Zimpeto',
        originCity: 'Maputo',
        includesTransport: true,
        allowBuyNow: true,
        allowSchedule: true
      },
      {
        id: 't1-p9',
        name: 'Serviço de Logística — Rota Fixa Diária Abastecimento Baixa ↔ Matola',
        priceMT: 6500,
        unitLabel: 'Por mês (plano empresarial)',
        category: 'Logística & Entregas',
        description: 'Contrato corporativo de distribuição regular diária para abastecimento e transferência de stock entre armazéns da Baixa, centros comerciais da Matola e estaleiros.',
        imageUrl: 'https://images.unsplash.com/photo-1618582948377-cd7eb0e8cb14?auto=format&fit=crop&w=600&q=80',
        tourismType: 'logistica',
        destination: 'Baixa de Maputo ↔ Matola Rio / Machava',
        includesTransport: true,
        allowSchedule: true,
        upfrontPercentage: 50
      }
    ],
    features: ['Receptivo no Aeroporto', 'Transporte Próprio', 'Guias Turísticos Próprios', 'Bilhetes Aéreos', 'Turismo Religioso', 'Logística & Entregas entre Lojas', 'internacional', 'domestico', 'religioso', 'bilhete', 'logistica', 'Balcão Oficial'],
    ownFleet: [{ vehicleType: 'Minibus Climatizado', capacity: 30, plateNumber: 'MP-45-AC' }, { vehicleType: 'Carrinha de Carga Expresso', capacity: 1500, plateNumber: 'MP-12-LG' }],
    hasOwnGuides: true,
    sellsFlightTickets: true,
    offersLogistics: true,
    logisticsCoverageZones: ['Maputo Cidade', 'Matola', 'Boane', 'Zimpeto', 'Costa do Sol'],
    deliveryFleetSize: 4,
    partnerLodgesHotels: ['Hotel Baixa Executive Suites', 'Pousada Polana Sol Familiar', 'Lodge Ponta Malongane', 'Complexo Turístico Bilene'],
    contactPhone: '+258 84 300 5000',
    whatsappLink: 'https://wa.me/258843005000?text=Olá,%20gostaria%20de%20informações%20sobre%20os%20serviços%20de%20Turismo%20e%20Logística',
    isVerified: true,
    visits: 1240,
    searches: 620,
    salesOrReservations: 118
  },

  {
    id: 'entregas-logistica-maputo',
    name: 'Axofácil! Logística, Fretes & Furgões Maputo',
    category: 'entregador',
    zone: 'Baixa & Grande Maputo',
    city: 'Maputo',
    province: 'Cidade de Maputo',
    address: 'Av. Samora Machel, Terminal de Cargas & Distribuição, Maputo',
    locationLandmarks: 'Próximo à Praça dos Trabalhadores e Estação Central de Maputo.',
    description: 'Frota oficial de fretes, carrinhas de carga, furgões climatizados e moto-estafetas para entregas expressas de lojas, supermercados, materiais de construção e mudanças completas em Maputo e Matola.',
    rating: 4.9,
    reviewCount: 112,
    metaInfo: 'Fretes a partir de 150 MT · Rastreio Directo e Equipa Confiável',
    promotion: '🚚 25% de desconto no 1º frete de mudanças ou carrinha de carga para Maputo e Matola',
    coverColor: '#0F2E5C',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    features: [
      'Frota Própria de Carrinhas & Furgões',
      'Entregas Expressas Porta-a-Porta',
      'Rastreio em Tempo Real',
      'Descarregamento com Equipa Inclusa',
      'Pagamentos M-Pesa & e-Mola'
    ],
    gallery: [
      'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
    ],
    productsList: [
      'Frete Carrinha 1.5T Mudanças & Carga Geral (Maputo ↔ Matola)',
      'Moto-Entregador Expresso Baixa / Polana / Sommerschield',
      'Furgão Fechado para Mercadorias & Produtos Frágeis',
      'Transporte Pesado para Cimento & Materiais de Construção',
      'Distribuição Diária Programada para Lojas & Mercados'
    ],
    productsCatalog: [
      {
        id: 'frete-carrinha-1',
        name: 'Frete Carrinha 1.5T Carga & Mudanças (Maputo ↔ Matola)',
        priceMT: 2200,
        promoPriceMT: 1650,
        isPromo: true,
        unitLabel: 'Por serviço',
        category: 'Fretes & Carrinhas',
        description: 'Carrinha de 1.5 toneladas com motorista e ajudante para mudanças residenciais e mercadorias comerciais.',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'frete-moto-1',
        name: 'Moto-Estafeta Rápido Porta-a-Porta (Baixa / Polana / Central)',
        priceMT: 200,
        promoPriceMT: 150,
        isPromo: true,
        unitLabel: 'Por entrega',
        category: 'Moto Expresso',
        description: 'Entrega imediata em menos de 45 minutos de compras, documentos e encomendas urgentes.',
        imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'frete-furgao-1',
        name: 'Furgão Fechado Climatizado para Supermercados & Lojas',
        priceMT: 2800,
        promoPriceMT: 2100,
        isPromo: true,
        unitLabel: 'Por dia',
        category: 'Furgões Comerciais',
        description: 'Transporte seguro e protegido contra chuva e sol para caixas de frescos, bebidas e roupas.',
        imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'frete-obra-1',
        name: 'Carga de Cimento, Varão de Ferro & Material de Obra',
        priceMT: 3200,
        promoPriceMT: 2500,
        isPromo: true,
        unitLabel: 'Por viagem',
        category: 'Obras & Construção',
        description: 'Transporte de materiais pesados do estaleiro diretamente para o lote ou obra com descarga inclusa.',
        imageUrl: 'https://images.unsplash.com/photo-1618582948377-cd7eb0e8cb14?auto=format&fit=crop&w=600&q=80'
      }
    ],
    contactPhone: '+258 84 990 0112',
    whatsappLink: 'https://wa.me/258849900112?text=Olá!%20Gostaria%20de%20solicitar%20um%20frete%20ou%20entrega%20expressa%20pelo%20Axofácil!',
    isVerified: true,
    visits: 1850,
    searches: 940,
    salesOrReservations: 310
  },

  {
    id: 't2',
    name: 'Safaris Moçambique & Excursões Maputo',
    category: 'turismo',
    zone: 'Polana & Costa do Sol',
    city: 'Maputo',
    province: 'Cidade de Maputo',
    address: 'Av. Marginal nº 3200, Frente ao Mar, Costa do Sol, Maputo',
    locationLandmarks: 'Próximo ao Clube Marítimo e ao Restaurante Mar na Brasa.',
    description: 'Operadora especializada em safaris ecológicos na Reserva Especial de Maputo, avistamento de elefantes e baleias, roteiros de mergulho em Santa Maria e transfers náuticos exclusivos.',
    rating: 4.9,
    reviewCount: 78,
    metaInfo: 'Safaris & Excursões Náuticas · Guias Credenciados',
    promotion: '🦁 15% de desconto em reservas antecipadas de Safari Familiar',
    coverColor: '#0F766E',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    ],
    productsList: [
      'Safari Fotográfico Reserva de Elefantes (1 dia)',
      'Travessia Privada de Lancha Ilha dos Portugueses',
      'Mergulho & Snorkeling nos Recifes da Inhaca',
      'Expedição 4x4 Dunas e Lagoas da Ponta do Ouro'
    ],
    productsCatalog: [
      {
        id: 't2-p1',
        name: 'Safari Reserva Especial de Maputo — Dia Inteiro com Almoço',
        priceMT: 6200,
        category: 'Turismo Doméstico',
        description: 'Excursão guiada em veículo 4x4 aberto com guia experiente, taxas de entrada no parque, almoço piquenique e observação de manadas de elefantes e antílopes.',
        imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Reserva Especial de Maputo',
        originCity: 'Maputo',
        durationLabel: '1 dia (8h - 18h)',
        minGroupSize: 2,
        maxGroupSize: 12,
        includesTransport: true,
        includesGuide: true,
        includesMeals: true,
        allowSchedule: true,
        upfrontPercentage: 50
      },
      {
        id: 't2-p2',
        name: 'Travessia de Barco & Snorkeling na Ilha dos Portugueses',
        priceMT: 4500,
        category: 'Turismo Doméstico',
        description: 'Passeio náutico em barco a motor seguro, paragem em bancos de areia e águas cristalinas para mergulho com equipamento incluído.',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        tourismType: 'domestico',
        destination: 'Ilha dos Portugueses, Baía de Maputo',
        originCity: 'Escola Náutica de Maputo',
        durationLabel: '6 horas',
        minGroupSize: 4,
        maxGroupSize: 20,
        includesTransport: true,
        includesGuide: true,
        allowSchedule: true,
        upfrontPercentage: 50
      }
    ],
    features: ['Safaris 4x4', 'Passeios de Barco', 'Snorkeling', 'Guias Oficiais', 'Turismo Ecológico'],
    contactPhone: '+258 84 777 6655',
    whatsappLink: 'https://wa.me/258847776655?text=Olá!%20Gostaria%20de%20reservar%20um%20safari%20ou%20excursão%20náutica',
    isVerified: true,
    visits: 980,
    searches: 410,
    salesOrReservations: 85
  },

  {
    id: 'entregas-express-matola',
    name: 'Moto Express & Cargas Rápidas Matola',
    category: 'entregador',
    zone: 'Matola & Machava',
    city: 'Matola',
    province: 'Província de Maputo (Matola/Zimpeto/Boane)',
    address: 'Av. da União Africana, Edifício Matola Center, Loja 4, Matola',
    locationLandmarks: 'Ao lado do Banco BIM da Matola e próximo à Praça da Liberdade.',
    description: 'Serviço pontual e dedicado de motoboys e carrinhas rápidas para entregas comerciais, recolha de documentos, compras de supermercado e pequenas mercadorias com rastreio em tempo real.',
    rating: 4.8,
    reviewCount: 64,
    metaInfo: 'Entregas Expressas em menos de 40 minutos na Matola e Maputo',
    promotion: '🚀 10% de desconto em contratos semanais para lojas e restaurantes',
    coverColor: '#1E293B',
    imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
    productsList: [
      'Entrega Moto-Expresso Matola ↔ Maputo',
      'Carrinha Pick-up 1 Tonelada Carga Rápida',
      'Estafeta de Documentos e Faturação'
    ],
    productsCatalog: [
      {
        id: 'frete-moto-matola',
        name: 'Corrida Moto-Expresso (Matola ↔ Cidade de Maputo)',
        priceMT: 250,
        promoPriceMT: 200,
        isPromo: true,
        unitLabel: 'Por corrida',
        category: 'Moto Expresso',
        description: 'Entrega rápida porta-a-porta de pacotes até 10kg com segurança e pontualidade.',
        imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'frete-pickup-matola',
        name: 'Pick-up 1 Tonelada Carga Comercial Rápida',
        priceMT: 1800,
        promoPriceMT: 1500,
        isPromo: true,
        unitLabel: 'Por viagem',
        category: 'Fretes Comerciais',
        description: 'Carrinha aberta para mercadorias, grades de bebidas e caixas de peças auto.',
        imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80'
      }
    ],
    contactPhone: '+258 84 888 2211',
    whatsappLink: 'https://wa.me/258848882211?text=Olá!%20Preciso%20de%20uma%20entrega%20expressa%20pela%20Moto%20Express',
    features: ['Moto Expresso', 'Pick-up Carga', 'Matola e Maputo', 'Entregas Rápidas'],
    isVerified: true,
    visits: 1420,
    searches: 710,
    salesOrReservations: 240
  }
];

export const initialDeals: PromoDeal[] = [
  {
    id: 'd-auto-pecas',
    establishmentId: 'auto-1',
    title: 'Top 1 · Auto Peças Maputo Baixa',
    subtitle: 'Filtros D4D, Pastilhas Cerâmicas, Baterias Willard & Óleos Sintéticos com Entrega Rápida',
    category: 'pecas_auto',
    rank: 1,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-auto-pecas-2',
    establishmentId: 'auto-2',
    title: 'Top 2 · Mozambique Auto Spares Matola',
    subtitle: 'Pneus R15/R16, Baterias Dixon 65Ah & Kits de Embraiagem com Preços de Lote',
    category: 'pecas_auto',
    rank: 2,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-construcao-cimento',
    establishmentId: 'c1',
    title: 'Top 1 · Estaleiro Matola Construções',
    subtitle: 'Cimento Limpopo 42.5N, Varões de Ferro 12mm, Brita & Areia com Frete Grátis na Obra',
    category: 'construcao',
    rank: 1,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-construcao-zimpeto',
    establishmentId: 'c2',
    title: 'Top 2 · Estaleiro Zimpeto Atacado',
    subtitle: 'Blocos de Cimento Vibrados, Areia Vermelha Camati & Redes de Vedação a Preço de Fábrica',
    category: 'construcao',
    rank: 2,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-supermercado-cabaz',
    establishmentId: 's1',
    title: 'Top 1 · Supermercado VIP Baixa',
    subtitle: 'Cabaz Familiar Fresco: Tomate Chókwè, Cebola Roxa, Batata RENAM e Arroz Imperial 25kg',
    category: 'supermercado',
    rank: 1,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-supermercado-recheio',
    establishmentId: 's2',
    title: 'Top 2 · Recheio Cash & Carry Zimpeto',
    subtitle: 'Fardos de Feijão Manteiga, Caixas de Sabão e Alimentos a Grosso e Retalho',
    category: 'supermercado',
    rank: 2,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-turismo-safari',
    establishmentId: 't1',
    title: 'Top 1 · Axofácil! Turismo & Viagens',
    subtitle: 'Roteiros Ponta do Ouro, Bilhetes Aéreos LAM/TAP e Circuito Histórico de Maputo',
    category: 'turismo',
    rank: 1,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-turismo-maritimo',
    establishmentId: 't2',
    title: 'Top 2 · Safaris Moçambique & Excursões',
    subtitle: 'Safari Reserva Especial de Elefantes & Travessia Náutica à Ilha dos Portugueses',
    category: 'turismo',
    rank: 2,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-hospedagem-suite',
    establishmentId: 'h1',
    title: 'Top 1 · Hotel Baixa Executive Suites',
    subtitle: 'Suíte Executiva com Vista Baía de Maputo, Wi-Fi Fibra e Pequeno-Almoço Incluso',
    category: 'hospedagem',
    rank: 1,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-hospedagem-pousada',
    establishmentId: 'h2',
    title: 'Top 2 · Pousada Polana Sol Familiar',
    subtitle: 'Quartos Aconchegantes com Ar Condicionado e Jardim no Coração da Polana',
    category: 'hospedagem',
    rank: 2,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-bar-petiscos',
    establishmentId: 'b1',
    title: 'Top 1 · Kanimambo Bar & Jazz Lounge',
    subtitle: 'Happy Hour: Cerveja 2M Gelada + Tábua de Mariscos & Camarão Grelhado na Brasa',
    category: 'bar',
    rank: 1,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-bar-costa',
    establishmentId: 'b2',
    title: 'Top 2 · Bar Costa do Sol Marginal',
    subtitle: 'Vista Mar Panorâmica, Lulas à Costa do Sol e Balde de Manica com Música ao Vivo',
    category: 'bar',
    rank: 2,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-doce-amor',
    establishmentId: 'l-doce-amor',
    title: 'Top 1 · Doce Amor Floraria & Decoração',
    subtitle: 'Rosas Vermelhas, Caixas Elegantes com Chocolates & Ornamentação Floral de Eventos',
    category: 'loja',
    rank: 1,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd1',
    establishmentId: 'l1',
    title: 'Top 2 · Loja Baixa Têxtil & Capulanas',
    subtitle: 'Capulanas Tradicionais de Moçambique, Fardos Importados e Tecidos de Seda com Desconto',
    category: 'loja',
    rank: 2,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-entregas-expresso',
    establishmentId: 'entregas-logistica-maputo',
    title: 'Top 1 · Axofácil! Logística & Fretes',
    subtitle: 'Carrinhas 1.5T, Moto-Estafetas e Furgões Comerciais para Lojas em Maputo e Matola',
    category: 'entregador',
    rank: 1,
    color: '#103B75',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=85'
  },
  {
    id: 'd-entregas-matola',
    establishmentId: 'entregas-express-matola',
    title: 'Top 2 · Moto Express & Cargas Matola',
    subtitle: 'Entregas Expressas Porta-a-Porta em menos de 40 minutos com Segurança',
    category: 'entregador',
    rank: 2,
    color: '#0B254B',
    imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=85'
  }
];

export const initialDeliveryPartners: DeliveryPartner[] = [
  {
    id: 'cour-1',
    name: 'Sérgio Cossa',
    vehicleType: 'moto',
    plateNumber: 'AAG 842 MP',
    residenceZone: 'Alto Maé / Baixa da Cidade',
    phone: '+258 84 777 1234',
    whatsappLink: 'https://wa.me/258847771234?text=Olá%20Sérgio,%20preciso%20de%20um%20serviço%20de%20entrega%20de%20encomenda%20da%20Baixa',
    baseRate: '150 - 250 MT (Baixa / Polana / Sommerschield)',
    rating: 4.9,
    isAvailable: true,
    subscriptionPaid: true,
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'cour-2',
    name: 'Alberto Mabote',
    vehicleType: 'carro',
    plateNumber: 'ABH 319 MP',
    residenceZone: 'Matola 700 / Baixa',
    phone: '+258 82 444 8888',
    whatsappLink: 'https://wa.me/258824448888?text=Olá%20Alberto,%20preciso%20de%20transporte%20de%20produtos%20da%20Baixa%20para%20a%20Matola',
    baseRate: '400 - 800 MT (Maputo Cidade -> Matola / Zimpeto)',
    rating: 4.8,
    isAvailable: true,
    subscriptionPaid: true,
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'cour-3',
    name: 'Salomão Sitoe',
    vehicleType: 'furgão',
    plateNumber: 'A312 MP',
    residenceZone: 'Zimpeto / Xipamanine',
    phone: '+258 85 999 0000',
    whatsappLink: 'https://wa.me/258859990000?text=Olá%20Salomão,%20preciso%20de%20furgão%20para%20fardos%20e%20caixas%20a%20grosso',
    baseRate: '1.200 MT (Cargas pesadas / Fardos / Províncias)',
    rating: 5.0,
    isAvailable: true,
    subscriptionPaid: true,
    imageUrl: 'https://images.unsplash.com/photo-1586191582056-a15cd3db9238?auto=format&fit=crop&w=800&q=80'
  }
];

export const initialPayments: PaymentRecord[] = [];
export const initialSubmissions: AdminSubmission[] = [];

// INITIAL SAMPLE ORDERS & BOOKINGS (LOJAS, SUPERMERCADOS, BARES, HOSPEDAGENS)
export const initialOrders: OrderRecord[] = [
  {
    id: 'ord-101',
    establishmentId: 's6',
    establishmentName: 'Shoprite Centre Alto Maé',
    category: 'supermercado',
    customerName: 'Manuel Mabote',
    customerPhone: '+258 84 111 2233',
    customerEmail: 'mabote.m@gmail.com',
    orderType: 'pedido_compra',
    itemsOrService: '2x Arroz Fardo 25kg, 1x Caixas de Óleo 12L, 2x Açúcar 5kg',
    totalAmount: 5850,
    paymentMethod: 'M-Pesa',
    status: 'Confirmado',
    date: '2026-07-28',
    time: '10:30',
    deliveryOption: 'estafeta_axofacil',
    deliveryAddress: 'Bairro do Alto Maé, Rua do Bagamoyo nº 140',
    notes: 'Entregar com o estafeta Sérgio Cossa.'
  },
  {
    id: 'ord-102',
    establishmentId: 'l1',
    establishmentName: 'Loja Baixa Têxtil',
    category: 'loja',
    customerName: 'Alzira Nhantumbo',
    customerPhone: '+258 82 444 9911',
    orderType: 'pedido_compra',
    itemsOrService: '1x Fardo Capulanas Importadas (50 unidades), 2x Vestidos Africanos',
    totalAmount: 14200,
    paymentMethod: 'Transferência BCI/BIM',
    status: 'Concluído',
    date: '2026-07-27',
    time: '15:10',
    deliveryOption: 'propria_loja',
    deliveryAddress: 'Baixa da Cidade, Av. 25 de Setembro',
    notes: 'Cliente Frequente - Fornecedora de Revenda.'
  },
  {
    id: 'ord-103',
    establishmentId: 'h1',
    establishmentName: 'Hotel Baixa Executive',
    category: 'hospedagem',
    customerName: 'Dr. Carlos Tembe',
    customerPhone: '+258 84 999 5544',
    customerEmail: 'carlos.tembe@empresa.co.mz',
    orderType: 'agendamento_reserva',
    itemsOrService: 'Reserva Suíte Executiva VIP (2 Noites) + Pequeno-Almoço',
    totalAmount: 7000,
    paymentMethod: 'POS Cartão',
    status: 'Confirmado',
    date: '2026-07-28',
    time: '09:00',
    bookingStartDate: '2026-08-01',
    bookingEndDate: '2026-08-03',
    deliveryOption: 'pickup',
    notes: 'Check-in antecipado solicitado para as 12h.'
  },
  {
    id: 'ord-104',
    establishmentId: 'b1',
    establishmentName: 'Kanimambo Bar',
    category: 'bar',
    customerName: 'Sónia Langa',
    customerPhone: '+258 85 222 3344',
    orderType: 'agendamento_reserva',
    itemsOrService: 'Reserva de Mesa Esplanada VIP (6 Pessoas) + Tábua de Mariscos e Cervejas',
    totalAmount: 3800,
    paymentMethod: 'e-Mola',
    status: 'Pendente',
    date: '2026-07-28',
    time: '18:45',
    bookingStartDate: '2026-07-31',
    notes: 'Comemoração de aniversário.'
  }
];

// INITIAL SAMPLE CUSTOMERS (CRM)
export const initialCustomers: CustomerRecord[] = [
  {
    id: 'cust-1',
    establishmentId: 's6',
    name: 'Manuel Mabote',
    phone: '+258 84 111 2233',
    email: 'mabote.m@gmail.com',
    totalOrdersCount: 4,
    totalSpentMT: 22400,
    lastOrderDate: '2026-07-28',
    notes: 'Cliente assíduo de compras em fardo para cantina no Alto Maé.',
    tags: ['VIP', 'Comprador Atacadista', 'Frequente']
  },
  {
    id: 'cust-2',
    establishmentId: 'l1',
    name: 'Alzira Nhantumbo',
    phone: '+258 82 444 9911',
    totalOrdersCount: 8,
    totalSpentMT: 89500,
    lastOrderDate: '2026-07-27',
    notes: 'Compradora de capulanas a grosso para revenda na Matola.',
    tags: ['VIP', 'Revendedora', 'Desconto Especial']
  },
  {
    id: 'cust-3',
    establishmentId: 'h1',
    name: 'Dr. Carlos Tembe',
    phone: '+258 84 999 5544',
    email: 'carlos.tembe@empresa.co.mz',
    totalOrdersCount: 3,
    totalSpentMT: 24500,
    lastOrderDate: '2026-07-28',
    notes: 'Hóspede corporativo recorrente em viagens de negócios.',
    tags: ['Corporativo', 'Hóspede Recorrente']
  }
];

// INITIAL SAMPLE FINANCIAL TRANSACTIONS (LIVRO CAIXA & FLUXO DE CAIXA)
export const initialFinancialTransactions: FinancialTransaction[] = [
  {
    id: 'fin-01',
    establishmentId: 's6',
    date: '2026-07-28',
    type: 'receita',
    category: 'Vendas de Produtos',
    description: 'Venda de fardos de arroz e óleo - Manuel Mabote',
    amountMT: 5850,
    paymentMethod: 'M-Pesa',
    status: 'Pago',
    referenceOrderNumber: 'ord-101',
    customerName: 'Manuel Mabote'
  },
  {
    id: 'fin-02',
    establishmentId: 's6',
    date: '2026-07-27',
    type: 'receita',
    category: 'Vendas de Produtos',
    description: 'Venda balcão de mercearia diária',
    amountMT: 18400,
    paymentMethod: 'Dinheiro',
    status: 'Pago'
  },
  {
    id: 'fin-03',
    establishmentId: 's6',
    date: '2026-07-26',
    type: 'despesa',
    category: 'Reposição de Stock / Mercadoria',
    description: 'Pagamento de reposição de fardos à fábrica Cervejas & Alimentos',
    amountMT: 12500,
    paymentMethod: 'Transferência BCI/BIM',
    status: 'Pago'
  },
  {
    id: 'fin-04',
    establishmentId: 's6',
    date: '2026-07-25',
    type: 'despesa',
    category: 'Electricidade & Água',
    description: 'Fatura Credelec e FIPAG do estabelecimento',
    amountMT: 3200,
    paymentMethod: 'M-Pesa',
    status: 'Pago'
  },
  {
    id: 'fin-05',
    establishmentId: 'l1',
    date: '2026-07-27',
    type: 'receita',
    category: 'Vendas de Produtos',
    description: 'Venda de fardo de capulanas - Alzira Nhantumbo',
    amountMT: 14200,
    paymentMethod: 'Transferência BCI/BIM',
    status: 'Pago',
    referenceOrderNumber: 'ord-102',
    customerName: 'Alzira Nhantumbo'
  },
  {
    id: 'fin-06',
    establishmentId: 'h1',
    date: '2026-07-28',
    type: 'receita',
    category: 'Diárias de Hospedagem',
    description: 'Reserva Suíte Executiva - Dr. Carlos Tembe',
    amountMT: 7000,
    paymentMethod: 'POS Cartão',
    status: 'Pago',
    referenceOrderNumber: 'ord-103',
    customerName: 'Dr. Carlos Tembe'
  }
];

// Storage Helpers
export function loadOrders(): OrderRecord[] {
  const data = localStorage.getItem('axofacil_orders');
  return data ? JSON.parse(data) : initialOrders;
}

export function saveOrders(orders: OrderRecord[]) {
  localStorage.setItem('axofacil_orders', JSON.stringify(orders));
  recordOfflineChange();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('axofacil_orders_updated'));
  }
  orders.forEach(o => syncOrderToSupabase(o).catch(console.warn));
}

export function loadCustomers(): CustomerRecord[] {
  const data = localStorage.getItem('axofacil_customers');
  return data ? JSON.parse(data) : initialCustomers;
}

export function saveCustomers(customers: CustomerRecord[]) {
  localStorage.setItem('axofacil_customers', JSON.stringify(customers));
  recordOfflineChange();
}

export function loadFinancialTransactions(): FinancialTransaction[] {
  const data = localStorage.getItem('axofacil_financial_transactions');
  return data ? JSON.parse(data) : initialFinancialTransactions;
}

export function saveFinancialTransactions(txs: FinancialTransaction[]) {
  localStorage.setItem('axofacil_financial_transactions', JSON.stringify(txs));
  recordOfflineChange();
  txs.forEach(tx => syncFinancialTxToSupabase(tx).catch(console.warn));
}

export function markEstablishmentDeleted(id: string) {
  try {
    const deletedRaw = localStorage.getItem('axofacil_deleted_establishments');
    const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('axofacil_deleted_establishments', JSON.stringify(deletedIds));
    }
  } catch (e) {
    console.warn('Erro ao guardar ID de loja eliminada:', e);
  }
}

export function markAllEstablishmentsDeleted(ids: string[]) {
  try {
    const deletedRaw = localStorage.getItem('axofacil_deleted_establishments');
    const existing: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem('axofacil_deleted_establishments', JSON.stringify(merged));
  } catch (e) {
    console.warn('Erro ao guardar IDs de lojas eliminadas:', e);
  }
}

export function loadData() {
  const ests = localStorage.getItem('axofacil_establishments');
  const deals = localStorage.getItem('axofacil_deals');
  const payments = localStorage.getItem('axofacil_payments');
  const submissions = localStorage.getItem('axofacil_submissions');
  const couriers = localStorage.getItem('axofacil_couriers');

  const deletedRaw = localStorage.getItem('axofacil_deleted_establishments');
  const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
  const deletedSet = new Set(deletedIds);

  let establishmentsList: Establishment[] = ests ? JSON.parse(ests) : initialEstablishments;
  // Filter out any explicitly deleted establishment
  establishmentsList = establishmentsList.filter(e => !deletedSet.has(e.id));

  // One-time automatic cleanup: retain strictly 2 examples per category + any user-created establishments
  const cleanedKey = 'axofacil_mockups_cleaned_2percat_v1';
  if (!localStorage.getItem(cleanedKey) && ests) {
    const keepIds = new Set(initialEstablishments.map(e => e.id));
    const isOldMock = (id: string) => {
      if (keepIds.has(id)) return false;
      return /^(c|s|b|h|l|pa)\d+$/.test(id);
    };
    establishmentsList = establishmentsList.filter(e => !isOldMock(e.id));
    localStorage.setItem(cleanedKey, 'true');
    saveEstablishments(establishmentsList);
    saveDeals(initialDeals);
  }
  
  // Merge newly defined initial establishments only if they were never deleted and storage wasn't initialized yet
  const existingIds = new Set(establishmentsList.map(e => e.id));
  let updated = false;
  if (!ests) {
    for (const initEst of initialEstablishments) {
      if (!existingIds.has(initEst.id) && !deletedSet.has(initEst.id)) {
        establishmentsList.push(initEst);
        updated = true;
      }
    }
  }

  // Ensure every establishment has product catalog stock and location coordinates
  establishmentsList = establishmentsList.map(ensureEstablishmentCatalog);

  if (updated || !ests) {
    saveEstablishments(establishmentsList);
  }

  let dealsList: PromoDeal[] = deals ? JSON.parse(deals) : initialDeals;
  const existingDealIds = new Set(dealsList.map(d => d.id));
  let dealsUpdated = false;
  for (const initDeal of initialDeals) {
    if (!existingDealIds.has(initDeal.id)) {
      dealsList.push(initDeal);
      dealsUpdated = true;
    } else {
      const idx = dealsList.findIndex(d => d.id === initDeal.id);
      if (idx >= 0 && (!dealsList[idx].imageUrl || dealsList[idx].imageUrl.includes('&q=80'))) {
        dealsList[idx].imageUrl = initDeal.imageUrl;
        dealsList[idx].title = initDeal.title;
        dealsList[idx].subtitle = initDeal.subtitle;
        dealsUpdated = true;
      }
    }
  }

  if (dealsUpdated || !deals) {
    saveDeals(dealsList);
  }

  return {
    establishments: establishmentsList,
    deals: dealsList,
    payments: payments ? JSON.parse(payments) : initialPayments,
    submissions: submissions ? JSON.parse(submissions) : initialSubmissions,
    couriers: couriers ? JSON.parse(couriers) : initialDeliveryPartners,
    orders: loadOrders(),
    customers: loadCustomers(),
    financialTransactions: loadFinancialTransactions()
  };
}

export function saveEstablishments(establishments: Establishment[]) {
  localStorage.setItem('axofacil_establishments', JSON.stringify(establishments));
  recordOfflineChange();
  establishments.forEach(est => syncEstablishmentToSupabase(est).catch(console.warn));
  try {
    window.dispatchEvent(new CustomEvent('axofacil_establishments_changed', { detail: establishments }));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Sincronização em tempo real entre dispositivos (Supabase Realtime)
// ---------------------------------------------------------------------------
// As funções abaixo actualizam apenas a cópia local (localStorage + evento na
// janela) SEM voltar a escrever no Supabase. São usadas quando a mudança já
// chegou de outro dispositivo (via Realtime ou via um fetch inicial ao
// servidor), para não criar um ciclo infinito de escritas
// (dispositivo A grava -> Supabase -> dispositivo B recebe -> B reescreve ->
// Supabase -> A recebe -> ...).

function readLocalEstablishments(): Establishment[] {
  const ests = localStorage.getItem('axofacil_establishments');
  return ests ? JSON.parse(ests) : [];
}

// Substitui por completo a lista local de estabelecimentos pela versão
// autoritativa vinda do Supabase (usado na carga inicial da app).
export function applyEstablishmentsFromRemote(establishments: Establishment[]) {
  localStorage.setItem('axofacil_establishments', JSON.stringify(establishments));
  try {
    window.dispatchEvent(new CustomEvent('axofacil_establishments_changed', { detail: establishments }));
  } catch {
    // ignore
  }
}

// Aplica uma criação/edição pontual recebida em tempo real de outro dispositivo.
export function upsertEstablishmentFromRemote(establishment: Establishment) {
  const list = readLocalEstablishments();
  const idx = list.findIndex(e => e.id === establishment.id);
  const updated = idx >= 0
    ? list.map((e, i) => (i === idx ? { ...e, ...establishment } : e))
    : [establishment, ...list];
  applyEstablishmentsFromRemote(updated);
}

// Aplica uma eliminação recebida em tempo real de outro dispositivo, e marca
// o id como eliminado para que não volte a aparecer nas mesclagens com os
// dados de demonstração iniciais.
export function removeEstablishmentFromRemote(id: string) {
  const list = readLocalEstablishments().filter(e => e.id !== id);
  markEstablishmentDeleted(id);
  applyEstablishmentsFromRemote(list);
}

export function saveDeals(deals: PromoDeal[]) {
  localStorage.setItem('axofacil_deals', JSON.stringify(deals));
  recordOfflineChange();
  try {
    window.dispatchEvent(new CustomEvent('axofacil_deals_changed', { detail: deals }));
  } catch {
    // ignore
  }
}

export function savePayments(payments: PaymentRecord[]) {
  localStorage.setItem('axofacil_payments', JSON.stringify(payments));
  recordOfflineChange();
  payments.forEach(p => syncManualPaymentRecordToSupabase(p).catch(console.warn));
}

export function saveSubmissions(submissions: AdminSubmission[]) {
  localStorage.setItem('axofacil_submissions', JSON.stringify(submissions));
  recordOfflineChange();
  submissions.forEach(s => syncAdminSubmissionToSupabase(s).catch(console.warn));
}

export function saveDeliveryPartners(couriers: DeliveryPartner[]) {
  localStorage.setItem('axofacil_couriers', JSON.stringify(couriers));
  recordOfflineChange();
  couriers.forEach(c => syncDeliveryPartnerToSupabase(c).catch(console.warn));
}
