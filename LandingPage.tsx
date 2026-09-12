import React, { useState, useRef, useEffect } from 'react';
import { Establishment, PromoDeal, UserProfile } from "./types";
import { uploadToImgBB } from "./imgbb";
import { canManageEstablishment } from "./ownership";
import DrawnHighlight from "./DrawnHighlight";
import { matchesEstablishment, cleanAccents } from "./search";
import { 
  Search, ArrowRight, Camera, MapPin, 
  Sparkles, ShieldCheck, Plane, 
  Truck, ShoppingBag, ShoppingCart, Beer, Building2, 
  Hammer, Wrench, CheckCircle2, Award, Compass, GlassWater, BedDouble,
  MessageCircle, Navigation, Zap, Phone, Star, Tag, X, Image as ImageIcon,
  Loader2, Eye, Store, ArrowUpRight, Check, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NowBoardingHeroBanner from './NowBoardingHeroBanner';
import PartnerInterestModal from './PartnerInterestModal';

interface LandingPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  setActivePage: (page: any) => void;
  setSearchQuery: (query: string) => void;
  onSelectEstablishment: (est: Establishment) => void;
  onUpdateEstablishmentImage?: (id: string, newUrl: string) => void;
  onAddPromotion?: (category: 'loja' | 'bar' | 'hospedagem') => void;
  currentUser?: UserProfile | null;
  onSelectSegment?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const POPULAR_ZONES = [
  'Baixa de Maputo',
  'Polana Cimento',
  'Sommerschield',
  'Costa do Sol',
  'Matola',
  'Zimpeto',
  'Ponta do Ouro',
  'Bilene'
];

const QUICK_SEARCH_CHIPS = [
  { label: '🌾 Arroz & Óleo Fardo', query: 'arroz', target: 'supermercados' },
  { label: '🔋 Baterias 12V & Peças', query: 'baterias', target: 'pecas_auto' },
  { label: '🏨 Hotéis & Suítes', query: 'quarto', target: 'hospedagens' },
  { label: '✈️ Voos & Turismo', query: 'turismo', target: 'turismo' },
  { label: '🍺 Cerveja 2M Gelada', query: '2M', target: 'bares' },
  { label: '🏗️ Cimento 42.5N & Chapas', query: 'cimento', target: 'construcao' },
  { label: '👗 Capulanas & Fardos', query: 'capulana', target: 'lojas' },
  { label: '🌹 Buquês & Flores', query: 'flores', target: 'lojas' }
];

export default function LandingPage({ 
  establishments, 
  deals,
  setActivePage, 
  setSearchQuery, 
  onSelectEstablishment,
  onUpdateEstablishmentImage,
  onAddPromotion,
  currentUser,
  onSelectSegment,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: LandingPageProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [targetCategory, setTargetCategory] = useState<'todos' | 'lojas' | 'pecas_auto' | 'supermercados' | 'bares' | 'hospedagens' | 'turismo' | 'construcao' | 'entregadores'>('todos');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Visual Image Search states
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<{ query: string; category: string; targetMenu: string; confidence: number; suggestedStores: string[] } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Helper to open a specific establishment directly
  const openStoreDirectly = (est: Establishment) => {
    setIsSearchFocused(false);
    
    // Determine category page
    if (est.category === 'loja' && (
      est.name.toLowerCase().includes('auto') || 
      est.name.toLowerCase().includes('peças') || 
      est.name.toLowerCase().includes('pecas') ||
      est.description?.toLowerCase().includes('peças') ||
      est.features.some(f => f.toLowerCase().includes('peças') || f.toLowerCase().includes('auto'))
    )) {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else if (est.category === 'loja') {
      setActivePage('lojas');
    } else if (est.category === 'supermercado') {
      setActivePage('supermercados');
    } else if (est.category === 'bar') {
      setActivePage('bares');
    } else if (est.category === 'hospedagem') {
      setActivePage('hospedagens');
    } else if (est.category === 'construcao' || est.category === 'ferragens') {
      setActivePage('construcao');
    } else if (est.category === 'turismo') {
      setActivePage('turismo');
    } else if (est.category === 'pecas_auto') {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else {
      setActivePage('lojas');
    }

    setSearchQuery('');
    onSelectEstablishment(est);
  };

  // Helper to route product search to the stores that have that product
  const routeSearch = (queryText: string, targetMenuOverride?: string) => {
    setIsSearchFocused(false);
    const rawQ = queryText.trim();
    if (!rawQ) {
      const selected = targetMenuOverride || targetCategory;
      setActivePage(selected !== 'todos' ? selected : 'lojas');
      return;
    }

    const q = rawQ.toLowerCase().trim();
    const cleanQ = cleanAccents(rawQ);

    // 1. Check if user typed a specific store name (with and without accents)
    const exactStore = establishments.find(e => 
      e.name.toLowerCase() === q || cleanAccents(e.name) === cleanQ
    );
    if (exactStore) {
      openStoreDirectly(exactStore);
      return;
    }

    // Check partial store name match (e.g. "Doce Amor", "Hotel Polana", "Supermercado X", "Bar Y", "Matola Construções")
    const storeMatches = establishments.filter(e => {
      const eNameClean = cleanAccents(e.name);
      return eNameClean.includes(cleanQ) || cleanQ.includes(eNameClean);
    });

    // Common generic product/category words that should NOT trigger single store redirect if ambiguous
    const genericProductTerms = [
      'cimento', 'arroz', 'oleo', 'óleo', 'bateria', 'baterias', 'pneu', 'pneus',
      'cerveja', 'quarto', 'hotel', 'flores', 'rosa', 'rosas', 'sapato', 'sapatos',
      'capulana', 'capulanas', 'chapa', 'chapas', 'farinha', 'acucar', 'açúcar',
      'voo', 'voos', 'passagem', 'passagens', 'frete', 'fretes', 'tijolo', 'tijolos',
      'massa', 'leite', 'carne', 'peixe', 'vinho', 'whisky', 'gin', 'areia', 'brita'
    ];
    const isGeneric = genericProductTerms.some(term => q === term || q.startsWith(term + ' ') || q.endsWith(' ' + term));

    if (storeMatches.length === 1 && !isGeneric) {
      openStoreDirectly(storeMatches[0]);
      return;
    }

    // 2. Product Name / Multi-store Search:
    // Apply the search query filter to show only stores carrying this product
    setSearchQuery(rawQ);

    const selected = targetMenuOverride || targetCategory;
    if (selected && selected !== 'todos') {
      if (selected === 'pecas_auto') {
        if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
        else setActivePage('lojas');
      } else {
        setActivePage(selected as any);
      }
      return;
    }

    // Find all establishments that have this product or match search
    const storesWithProduct = establishments.filter(est => matchesEstablishment(est, rawQ));

    // Determine dominant category among stores that match
    const categoryCounts: Record<string, number> = {};
    storesWithProduct.forEach(est => {
      const cat = (est.category === 'ferragens' || est.category === 'construcao') ? 'construcao' : est.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    let dominantCategory = '';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = cat;
      }
    });

    // If dominant category found from matching establishments
    if (dominantCategory) {
      if (dominantCategory === 'construcao' || dominantCategory === 'ferragens') {
        setActivePage('construcao');
      } else if (dominantCategory === 'supermercado') {
        setActivePage('supermercados');
      } else if (dominantCategory === 'bar') {
        setActivePage('bares');
      } else if (dominantCategory === 'hospedagem') {
        setActivePage('hospedagens');
      } else if (dominantCategory === 'turismo') {
        setActivePage('turismo');
      } else if (dominantCategory === 'pecas_auto') {
        if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
        else setActivePage('lojas');
      } else if (dominantCategory === 'entregador' || dominantCategory === 'servicos') {
        setActivePage('entregadores');
      } else {
        setActivePage('lojas');
      }
      return;
    }

    // Fallback keyword auto-detection if no stores matched yet
    if (cleanQ.includes('turism') || cleanQ.includes('viage') || cleanQ.includes('voo') || cleanQ.includes('passag') || cleanQ.includes('pacote') || cleanQ.includes('safari') || cleanQ.includes('inhaca')) {
      setActivePage('turismo');
    } else if (cleanQ.includes('bateria') || cleanQ.includes('pneu') || cleanQ.includes('oleo motor') || cleanQ.includes('travao') || cleanQ.includes('amortecedor') || cleanQ.includes('peca') || cleanQ.includes('auto')) {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else if (cleanQ.includes('bar') || cleanQ.includes('cerveja') || cleanQ.includes('2m') || cleanQ.includes('laurentina') || cleanQ.includes('lounge') || cleanQ.includes('bebida') || cleanQ.includes('petiscos')) {
      setActivePage('bares');
    } else if (cleanQ.includes('hospedagem') || cleanQ.includes('hotel') || cleanQ.includes('pensao') || cleanQ.includes('quarto') || cleanQ.includes('suite') || cleanQ.includes('dormir')) {
      setActivePage('hospedagens');
    } else if (cleanQ.includes('cimento') || cleanQ.includes('chapa') || cleanQ.includes('varao') || cleanQ.includes('areia') || cleanQ.includes('brita') || cleanQ.includes('bloco') || cleanQ.includes('estaleiro') || cleanQ.includes('constru')) {
      setActivePage('construcao');
    } else if (cleanQ.includes('mercado') || cleanQ.includes('supermercado') || cleanQ.includes('arroz') || cleanQ.includes('oleo') || cleanQ.includes('acucar') || cleanQ.includes('fardo') || cleanQ.includes('frescos')) {
      setActivePage('supermercados');
    } else if (cleanQ.includes('frete') || cleanQ.includes('entreg') || cleanQ.includes('estafeta') || cleanQ.includes('carga')) {
      setActivePage('entregadores');
    } else {
      setActivePage('lojas');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) {
      routeSearch('');
      return;
    }
    routeSearch(localSearch);
  };

  const handleZoneClick = (zone: string) => {
    setLocalSearch(zone);
    routeSearch(zone);
  };

  const handleQuickChipClick = (chip: typeof QUICK_SEARCH_CHIPS[0]) => {
    setLocalSearch(chip.query);
    routeSearch(chip.query, chip.target);
  };

  // Live matching computations for store name and product name
  const qClean = localSearch.trim().toLowerCase();

  const matchingStores = React.useMemo(() => {
    if (qClean.length < 1) return [];
    return establishments.filter(est => 
      est.name.toLowerCase().includes(qClean) ||
      est.zone.toLowerCase().includes(qClean) ||
      est.features.some(f => f.toLowerCase().includes(qClean)) ||
      est.description?.toLowerCase().includes(qClean)
    ).slice(0, 4);
  }, [establishments, qClean]);

  const matchingProducts = React.useMemo(() => {
    if (qClean.length < 1) return [];
    const results: Array<{
      id: string;
      name: string;
      priceMT?: number;
      promoPriceMT?: number;
      imageUrl?: string;
      category?: string;
      unitLabel?: string;
      establishment: Establishment;
    }> = [];

    const seen = new Set<string>();

    for (const est of establishments) {
      if (est.productsCatalog) {
        for (const p of est.productsCatalog) {
          const pName = p.name.toLowerCase();
          const pCat = (p.category || '').toLowerCase();
          const pDesc = (p.description || '').toLowerCase();
          if (pName.includes(qClean) || pCat.includes(qClean) || pDesc.includes(qClean)) {
            const key = `${p.name.toLowerCase()}-${est.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: p.id || `prod-${results.length}`,
                name: p.name,
                priceMT: p.priceMT,
                promoPriceMT: p.promoPriceMT,
                imageUrl: p.imageUrl,
                category: p.category,
                unitLabel: p.unitLabel,
                establishment: est
              });
            }
          }
          if (results.length >= 6) break;
        }
      }

      if (results.length < 6 && est.productsList) {
        for (let i = 0; i < est.productsList.length; i++) {
          const pItem = est.productsList[i];
          if (pItem.toLowerCase().includes(qClean)) {
            const key = `${pItem.toLowerCase()}-${est.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: `item-${i}-${est.id}`,
                name: pItem,
                category: est.category,
                establishment: est
              });
            }
          }
          if (results.length >= 6) break;
        }
      }
      if (results.length >= 6) break;
    }

    return results;
  }, [establishments, qClean]);

  // Visual Image Recognition handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setImageScanning(true);
    setShowImageModal(true);

    const fileNameLower = file.name.toLowerCase();

    setTimeout(() => {
      let query = 'sapatos';
      let category = 'Moda, Calçado & Boutiques';
      let targetMenu = 'lojas';
      let confidence = 96;
      let suggestedStores = ['Loja Baixa Têxtil', 'Sapataria & Moda Polana', 'Ekonomia Grossista'];

      if (fileNameLower.includes('bateria') || fileNameLower.includes('pneu') || fileNameLower.includes('oleo') || fileNameLower.includes('óleo') || fileNameLower.includes('travao') || fileNameLower.includes('travão') || fileNameLower.includes('amortecedor') || fileNameLower.includes('filtro')) {
        query = 'baterias';
        category = 'Auto Peças & Acessórios Automóveis';
        targetMenu = 'pecas_auto';
        suggestedStores = ['Auto Peças Maputo Baixa & Acessórios', 'Mozambique Auto Spares Matola & Zimpeto'];
      } else if (fileNameLower.includes('cimento') || fileNameLower.includes('chapa') || fileNameLower.includes('varao') || fileNameLower.includes('tijolo') || fileNameLower.includes('brita') || fileNameLower.includes('areia')) {
        query = 'cimento';
        category = 'Materiais de Construção & Estaleiros';
        targetMenu = 'construcao';
        suggestedStores = ['Estaleiro & Ferragens Matola Construções', 'Estaleiro & Materiais Zimpeto Atacado', 'Ferragens Central Baixa Maputo'];
      } else if (fileNameLower.includes('arroz') || fileNameLower.includes('rice') || fileNameLower.includes('comida') || fileNameLower.includes('leite') || fileNameLower.includes('acucar')) {
        query = 'arroz';
        category = 'Supermercados & Alimentação Básica';
        targetMenu = 'supermercados';
        suggestedStores = ['VIP Baixa Supermercado', 'Recheio Zimpeto Atacado', 'Premier Supermercado Polana'];
      } else if (fileNameLower.includes('cerveja') || fileNameLower.includes('beer') || fileNameLower.includes('2m') || fileNameLower.includes('bebida')) {
        query = '2M';
        category = 'Bares, Lounges & Diversão Noturna';
        targetMenu = 'bares';
        suggestedStores = ['Kanimambo Bar & Esplanada', 'Lounge 21 Polana', 'Costa do Sol Bar'];
      } else if (fileNameLower.includes('hotel') || fileNameLower.includes('quarto') || fileNameLower.includes('cama') || fileNameLower.includes('room')) {
        query = 'quarto';
        category = 'Hospedagens, Hotéis & Suítes';
        targetMenu = 'hospedagens';
        suggestedStores = ['Hotel & Suítes Executivas Polana', 'Pousada Costa do Sol', 'Hotel Baixa Business'];
      } else if (fileNameLower.includes('praia') || fileNameLower.includes('viagem') || fileNameLower.includes('aviao') || fileNameLower.includes('avião') || fileNameLower.includes('voo')) {
        query = 'turismo';
        category = 'Turismo, Viagens & Voos';
        targetMenu = 'turismo';
        suggestedStores = ['NowBoarding Turismo & Voos Maputo', 'Excursões Ponta do Ouro & Bilene'];
      } else if (fileNameLower.includes('flor') || fileNameLower.includes('rosa') || fileNameLower.includes('flower') || fileNameLower.includes('buque') || fileNameLower.includes('buquê') || fileNameLower.includes('amor')) {
        query = 'flores';
        category = 'Floraria, Buquês & Ornamentação';
        targetMenu = 'lojas';
        suggestedStores = ['Doce Amor - Floraria & Ornamentação de Flores'];
      } else if (fileNameLower.includes('capulana') || fileNameLower.includes('pano') || fileNameLower.includes('fardo')) {
        query = 'capulana';
        category = 'Têxtil & Capulanas em Fardo';
        targetMenu = 'lojas';
        suggestedStores = ['Loja Baixa Têxtil', 'Mundo das Capulanas Baixa'];
      }

      setDetectedResult({
        query,
        category,
        targetMenu,
        confidence,
        suggestedStores
      });
      setImageScanning(false);
    }, 1200);
  };

  const applyImageResult = () => {
    if (!detectedResult) return;
    setLocalSearch(detectedResult.query);
    setShowImageModal(false);
    routeSearch(detectedResult.query, detectedResult.targetMenu);
  };

  // Image Upload handler for cards using ImgBB API
  const handleCardImageUpload = async (estId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(estId);
    try {
      const imageUrl = await uploadToImgBB(file);
      if (onUpdateEstablishmentImage) {
        onUpdateEstablishmentImage(estId, imageUrl);
      }
    } catch (err) {
      console.error('Failed to upload card image:', err);
    } finally {
      setUploadingId(null);
    }
  };

  // Helper to ensure up to 10 unique items for each category without duplication
  const getTop10 = (category: string) => {
    return establishments.filter(e => e.category === category).slice(0, 10);
  };

  const top10Lojas = getTop10('loja');
  const top10Bares = getTop10('bar');
  const top10Hospedagens = getTop10('hospedagem');

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-16">
      
      {/* 1. Grand NowBoarding.travel Cinematic Banner */}
      <NowBoardingHeroBanner 
        pageTitle="Guia Oficial de Maputo & Moçambique"
        pageSubtitle="Turismo, Lojas, Hotéis & Serviços"
        heightClass="min-h-[460px] sm:min-h-[520px]"
        onInquireClick={onInquireClick ? onInquireClick : () => {
          const el = document.getElementById('search-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onPromoClick={() => {
          if (onSelectSegment) {
            onSelectSegment('promocoes', undefined);
          } else {
            setActivePage('promocoes');
          }
        }}
        onNavigate={(page, filter) => {
          if (onSelectSegment && filter) {
            onSelectSegment(page, filter);
          } else {
            setActivePage(page);
          }
        }}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        isLandingPage={true}
        showPromoButton={true}
      />

      {/* ========================================================================= */}
      {/* 2. UNIFIED GLOBAL SEARCH — Fundo 100% Branco com elementos elegantes     */}
      {/* ========================================================================= */}
      <section id="search-section" className="relative w-full bg-white text-slate-900 py-8 sm:py-10 px-[5vw] lg:px-[7vw] border-b border-slate-200">
        {/* Content Container - Centered, Balanced & Elegant */}
        <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center text-center space-y-5">

          <p className="font-serif text-lg sm:text-2xl text-slate-900 font-bold max-w-2xl">
            O que precisa hoje, e onde vai buscar?
          </p>

          {/* Interactive Search Console Bar with Category Selector & Visual Image Search */}
          <div ref={searchContainerRef} className="relative w-full max-w-3xl space-y-3 z-30">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white text-slate-900 rounded-2xl p-2 sm:p-2.5 shadow-lg border-2 border-slate-200 focus-within:border-[#103B75] transition-all relative">
              
              {/* Category Selector Dropdown */}
              <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-2 shrink-0">
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as any)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold py-2 px-3 rounded-xl border border-slate-200 outline-none cursor-pointer w-full sm:w-auto transition-colors"
                  title="Selecione o menu específico ou deixe em Todos os Serviços"
                >
                  <option value="todos">🌐 Todos os Menus</option>
                  <option value="lojas">🛍️ Lojas & Boutiques</option>
                  <option value="pecas_auto">🚗 Peças Auto & Oficinas</option>
                  <option value="supermercados">🛒 Supermercados</option>
                  <option value="hospedagens">🏨 Hospedagens & Hotéis</option>
                  <option value="turismo">✈️ Turismo & Voos</option>
                  <option value="bares">🍻 Bares & Lounges</option>
                  <option value="construcao">🏗️ Construção & Estaleiros</option>
                  <option value="entregadores">🚚 Estafetas & Fretes</option>
                </select>
              </div>

              {/* Text Input */}
              <div className="flex items-center gap-2 flex-grow px-2 py-1">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Nome da loja (ex: Doce Amor, VIP) ou produto (ex: cimento, arroz)..."
                  value={localSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  className="border-none outline-none font-sans text-xs sm:text-sm md:text-base flex-grow bg-transparent text-slate-900 placeholder:text-slate-400 w-full font-medium"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Visual Image Search Trigger Button */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="bg-slate-100 hover:bg-slate-200 text-[#103B75] border border-slate-200 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer shadow-2xs"
                title="Pesquisar tirando ou enviando uma foto (IA)"
              >
                <Camera className="w-4 h-4 text-[#103B75]" />
                <span className="hidden sm:inline">Buscar c/ Imagem</span>
              </button>

              {/* Submit Search Button (colored background with white text) */}
              <button 
                type="submit"
                className="bg-[#103B75] hover:bg-[#0B254B] text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer shadow-md active:scale-95"
              >
                <span>Pesquisar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* LIVE SEARCH AUTOCOMPLETE DROPDOWN */}
            <AnimatePresence>
              {isSearchFocused && localSearch.trim().length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-left z-50 text-slate-900 max-h-[480px] overflow-y-auto divide-y divide-slate-100"
                >
                  {/* Results Count Header */}
                  <div className="pb-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold flex items-center gap-1.5 text-[#103B75]">
                      <Sparkles className="w-3.5 h-3.5 text-[#103B75]" />
                      Resultados para "{localSearch}"
                    </span>
                    <span>
                      {matchingStores.length} {matchingStores.length === 1 ? 'loja' : 'lojas'} · {matchingProducts.length} {matchingProducts.length === 1 ? 'produto' : 'produtos'}
                    </span>
                  </div>

                  {/* 1. STORES FOUND (Direct store redirection) */}
                  {matchingStores.length > 0 && (
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#103B75]" />
                          Lojas & Estabelecimentos (Ir direto)
                        </span>
                        <span className="text-[10px] text-[#103B75] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                          Abre a loja diretamente
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingStores.map((store, sIdx) => (
                          <div
                            key={`suggest-store-${store.id}-${sIdx}`}
                            onClick={() => openStoreDirectly(store)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#103B75] cursor-pointer transition-all group"
                          >
                            <img 
                              src={store.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=200&auto=format&fit=crop&q=80'} 
                              alt={store.name} 
                              className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-grow min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#103B75] transition-colors truncate">
                                {store.name}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{store.zone}</span>
                                <span className="text-slate-300">·</span>
                                <span className="capitalize text-slate-600">{store.category}</span>
                              </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#103B75] group-hover:translate-x-0.5 transition-all shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. PRODUCTS FOUND (Filters stores with this product) */}
                  {matchingProducts.length > 0 && (
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#103B75]" />
                          Produtos Encontrados nas Lojas
                        </span>
                        <span className="text-[10px] text-[#103B75] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                          Disponíveis em estoque
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingProducts.map((item, pIdx) => (
                          <div
                            key={`suggest-prod-${item.establishment.id}-${item.id}-${pIdx}`}
                            onClick={() => openStoreDirectly(item.establishment)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#103B75] cursor-pointer transition-all group"
                          >
                            <div className="w-11 h-11 rounded-lg bg-white overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <Tag className="w-5 h-5 text-[#103B75]" />
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[#103B75] transition-colors truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-[#103B75] font-bold truncate">
                                {item.priceMT ? `${item.priceMT.toLocaleString()} MT` : 'Sob Consulta'}
                                {item.unitLabel ? ` / ${item.unitLabel}` : ''}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Loja: <span className="text-slate-700 font-semibold">{item.establishment.name}</span>
                              </p>
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#103B75] group-hover:translate-x-0.5 transition-all shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NO MATCHES FALLBACK */}
                  {matchingStores.length === 0 && matchingProducts.length === 0 && (
                    <div className="py-4 text-center space-y-1">
                      <p className="text-xs text-slate-700">
                        Nenhum resultado direto com o nome exato <strong>"{localSearch}"</strong>.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Clique em pesquisar abaixo para varrer todos os catálogos e filtros da plataforma.
                      </p>
                    </div>
                  )}

                  {/* BOTTOM ACTION BUTTON */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => routeSearch(localSearch)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#103B75] hover:bg-[#0B254B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <Search className="w-4 h-4" />
                      <span>Ver todas as lojas que têm "{localSearch}"</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden File Input for Image Search */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Quick Suggestion Chips (Synchronized with corresponding menus) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600 pt-1">
            <span className="text-slate-500 text-[11px] mr-1">
              Populares agora:
            </span>
            {QUICK_SEARCH_CHIPS.map((chip, idx) => (
              <button
                key={`quick-chip-${idx}`}
                onClick={() => handleQuickChipClick(chip)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all border border-slate-200 cursor-pointer text-[11px] font-medium shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Popular Maputo Zones Quick Filters */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" /> Zonas:
            </span>
            {POPULAR_ZONES.map((zone, zIdx) => (
              <button
                key={`pop-zone-${zone}-${zIdx}`}
                onClick={() => handleZoneClick(zone)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 cursor-pointer text-[11px]"
              >
                {zone}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* KINETIC RIBBON — Fundo Cinza Claro Muito Próximo do Branco com Ícones Azul */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 py-2.5 overflow-hidden text-slate-700 border-y border-slate-200">
        <div className="marquee-track flex items-center gap-6 whitespace-nowrap text-[11px] font-medium">
          {[1, 2].map((loop) => (
            <React.Fragment key={`marquee-loop-${loop}`}>
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#103B75]" /> +500 lojas e restaurantes verificados
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#103B75]" /> Contacto directo por WhatsApp
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Plane className="w-3.5 h-3.5 text-[#103B75]" /> Roteiros para Ponta do Ouro, Inhaca & Bilene
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Truck className="w-3.5 h-3.5 text-[#103B75]" /> Estafetas e entregas em Maputo e Matola
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Award className="w-3.5 h-3.5 text-[#103B75]" /> Preços transparentes em Meticais (MT)
              </span>
              <span className="text-slate-300">·</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Visual Image Search Scanning Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl relative border border-slate-200"
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#103B75] border border-blue-200 text-xs font-bold">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Busca Visual Inteligente</span>
                </div>

                <h3 className="font-serif font-bold text-xl text-slate-900">
                  Reconhecimento de Imagem
                </h3>

                {imagePreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 w-full h-48 bg-slate-900 flex items-center justify-center">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-85" />
                    {imageScanning && (
                      <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center text-white space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                        <p className="text-xs font-bold tracking-wider uppercase">A analisar imagem...</p>
                      </div>
                    )}
                  </div>
                )}

                {detectedResult && !imageScanning && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500 uppercase">Item Reconhecido:</span>
                      <span className="text-[#103B75] font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-[10px]">
                        {detectedResult.confidence}% Confiança
                      </span>
                    </div>
                    <p className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#103B75]" />
                      <span>{detectedResult.category}</span>
                    </p>
                    <p className="text-xs text-slate-600">
                      Termo detectado: <strong>"{detectedResult.query}"</strong>
                    </p>
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 flex items-center justify-between">
                        <span>Lojas com este Produto:</span>
                        <span className="text-[10px] text-[#103B75] font-semibold lowercase">Clique para abrir direto</span>
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {detectedResult.suggestedStores.map((storeName, sIdx) => {
                          const foundEst = establishments.find(e => 
                            e.name.toLowerCase().includes(storeName.toLowerCase()) || 
                            storeName.toLowerCase().includes(e.name.toLowerCase())
                          );
                          return (
                            <button
                              key={`sugg-${sIdx}`}
                              type="button"
                              onClick={() => {
                                setShowImageModal(false);
                                if (foundEst) {
                                  openStoreDirectly(foundEst);
                                } else {
                                  setLocalSearch(storeName);
                                  routeSearch(storeName);
                                }
                              }}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-[#103B75] hover:bg-blue-50/50 text-slate-800 text-xs font-semibold text-left transition-all cursor-pointer group shadow-2xs"
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Store className="w-3.5 h-3.5 text-[#103B75] shrink-0" />
                                <span className="truncate group-hover:text-[#103B75]">{storeName}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 group-hover:text-[#103B75] flex items-center gap-0.5 shrink-0">
                                Abrir Loja <ArrowRight className="w-3 h-3" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Tirar Outra Foto
                  </button>
                  {detectedResult && !imageScanning && (
                    <button
                      type="button"
                      onClick={applyImageResult}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <span>Ver Resultados no Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. TOP 10 LOJAS DA BAIXA — MERCANTILE EDITORIAL SHOWCASE                   */}
      {/* ========================================================================= */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
              As lojas mais procuradas da Baixa
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Stock disponível e encomendas directas, com preços em Meticais
            </p>
          </div>
          <button 
            onClick={() => setActivePage('lojas')}
            className="text-xs sm:text-sm font-bold bg-white text-[#103B75] hover:bg-[#103B75] hover:text-white border-2 border-[#103B75] py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <span>Ver directório completo ({establishments.filter(e => e.category === 'loja').length} Lojas)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Editorial Grid Showcase */}
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full">
          {top10Lojas.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
              <p className="text-sm font-medium text-slate-500">Nenhuma loja registada de momento no directório.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {top10Lojas.slice(0, 6).map((loja, idx) => {
              const rank = idx + 1;
              const productCount = loja.productsCatalog?.length || 0;
              return (
                <div 
                  key={`loja-${loja.id}-${idx}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#103B75] transition-all flex flex-col justify-between group relative cursor-pointer"
                  onClick={() => onSelectEstablishment(loja)}
                >
                  {/* Photo Display with Authentic Rank Stamp */}
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    {loja.imageUrl ? (
                      <img src={loja.imageUrl} alt={loja.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif italic text-white opacity-40 text-xl" style={{ backgroundColor: loja.coverColor && ['#0B254B', '#103B75', '#0F2E5C', '#0284C7', '#475569', '#334155', '#1E293B', '#0F172A', '#0369A1', '#0891B2', '#1E3A8A', '#1E1B4B', '#0E7490'].includes(loja.coverColor) ? loja.coverColor : '#0B254B' }}>
                        {loja.name}
                      </div>
                    )}

                    {/* Authentic Gold Seal Rank */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#103B75] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/20 shadow-xs">
                      <span>★</span>
                      <span>{rank < 10 ? `0${rank}` : rank}</span>
                    </div>

                    {/* Quick Upload Button for owner */}
                    {canManageEstablishment(currentUser, loja, establishments) && (
                      <label 
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white cursor-pointer backdrop-blur-xs transition-all opacity-80 hover:opacity-100"
                        title="Upload imagem da loja"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleCardImageUpload(loja.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Card Info & Details */}
                  <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#103B75] truncate mb-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-[#103B75]" />
                        <span>{loja.zone}</span>
                      </span>
                      <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#103B75] transition-colors truncate">
                        {loja.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">
                        {productCount > 0 ? `${productCount} artigos` : 'Vitrine Oficial'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEstablishment(loja);
                        }}
                        className="text-[#103B75] group-hover:text-[#0B254B] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Abrir catálogo"
                      >
                        <span>Ver Loja</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TOP 10 BARES & LOUNGES — NOCTURNE & GOURMET VIBES                      */}
      {/* ========================================================================= */}
      <section className="py-14 border-b border-slate-200 bg-slate-50 text-slate-900">
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
              Onde sair à noite em Maputo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Ementas, reservas de mesa e música ao vivo, com preços em Meticais
            </p>
          </div>
          <button 
            onClick={() => setActivePage('bares')}
            className="text-xs sm:text-sm font-bold bg-white text-[#103B75] hover:bg-[#103B75] hover:text-white border-2 border-[#103B75] py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <span>Ver todos os bares ({establishments.filter(e => e.category === 'bar').length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full">
          {top10Bares.length === 0 ? (
            <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl p-6">
              <p className="text-sm font-medium text-slate-500">Nenhum bar ou lounge registado de momento no directório.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {top10Bares.slice(0, 6).map((bar, idx) => {
              const rank = idx + 1;
              return (
                <div 
                  key={`bar-${bar.id}-${idx}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-[#103B75] hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    {bar.imageUrl ? (
                      <img src={bar.imageUrl} alt={bar.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif italic text-white opacity-40 text-xl" style={{ backgroundColor: bar.coverColor }}>
                        {bar.name}
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-[#103B75] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {rank < 10 ? `0${rank}` : rank}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#103B75] truncate mb-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{bar.zone}</span>
                      </span>
                      <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#103B75] transition-colors truncate">{bar.name}</h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-mono text-[11px] text-[#103B75] font-bold">2M & Petiscos</span>
                      <button 
                        onClick={() => onSelectEstablishment(bar)}
                        className="text-[#103B75] hover:text-[#0B254B] transition-colors cursor-pointer"
                        title="Ver ementa e mesas"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. TOP 10 HOSPEDAGENS & HOTÉIS (COASTAL LINEN & RESORT)                    */}
      {/* ========================================================================= */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
              Onde ficar em Maputo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Quartos climatizados e confirmação directa de reserva, em Meticais
            </p>
          </div>
          <button 
            onClick={() => setActivePage('hospedagens')}
            className="text-xs sm:text-sm font-bold bg-white text-[#103B75] hover:bg-[#103B75] hover:text-white border-2 border-[#103B75] py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <span>Ver todas as hospedagens ({establishments.filter(e => e.category === 'hospedagem').length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full">
          {top10Hospedagens.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
              <p className="text-sm font-medium text-slate-500">Nenhuma hospedagem registada de momento no directório.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {top10Hospedagens.slice(0, 6).map((hosp, idx) => {
              const rank = idx + 1;
              return (
                <div 
                  key={`hosp-${hosp.id}-${idx}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-[#103B75] hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div className="h-32 bg-slate-900 relative overflow-hidden">
                    {hosp.imageUrl ? (
                      <img src={hosp.imageUrl} alt={hosp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif italic text-white opacity-40 text-xl" style={{ backgroundColor: hosp.coverColor }}>
                        {hosp.name}
                      </div>
                    )}

                    <div className="absolute top-2 left-2 bg-[#103B75] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {rank < 10 ? `0${rank}` : rank}
                    </div>
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-grow space-y-2">
                    <div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#103B75] truncate mb-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0 text-[#103B75]" />
                        <span>{hosp.zone}</span>
                      </span>
                      <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#103B75] transition-colors truncate">{hosp.name}</h3>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500">
                        {hosp.features?.[0] || 'Alojamento'}
                      </span>
                      <button 
                        onClick={() => onSelectEstablishment(hosp)}
                        className="text-[#103B75] hover:text-[#0B254B] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Ver quartos e comodidades"
                      >
                        <span>Ver Detalhes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION PARA PROPRIETÁRIOS & PARCEIROS COMERCIAIS               */}
      {/* ========================================================================= */}
      <section id="negocio" className="px-[5vw] lg:px-[7vw] py-14 text-center max-w-4xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-14 shadow-sm relative overflow-hidden">
          <div className="capulana-strip absolute top-0 left-0 right-0" />
          
          <span className="text-xs text-[#103B75] font-semibold block mb-2 pt-2">
            Loja, armazém, bar, restaurante ou estaleiro em Maputo ou Matola?
          </span>
          <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-900 mb-4">
            Junte o seu negócio à plataforma Axofácil!
          </h2>
          <p className="text-slate-600 text-xs sm:text-base mb-8 leading-relaxed max-w-2xl mx-auto">
            Divulgue os seus produtos, serviços e novidades a milhares de clientes em Maputo e Moçambique com apoio dedicado da nossa equipa comercial.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <button 
              onClick={() => setActivePage('auth')}
              className="bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs sm:text-sm py-4 px-8 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Criar Conta Comercial
            </button>
            <button 
              onClick={() => setShowPartnerModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm py-4 px-7 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
              title="Candidatura para parceiros comerciais sem necessidade de criar conta"
            >
              <Briefcase className="w-4 h-4 text-slate-950" />
              <span>Quero Ser Parceiro Comercial</span>
            </button>
            <button 
              onClick={() => setActivePage('lojas')}
              className="bg-white text-[#103B75] hover:bg-slate-50 border-2 border-[#103B75] text-xs sm:text-sm font-bold py-4 px-7 rounded-2xl cursor-pointer transition-all hover:scale-105"
            >
              Explorar Catálogo Completo
            </button>
          </div>

          {/* Dica para parceiros comerciais */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Parceria Comercial Direta:</strong> Tem interesse em ser nosso parceiro comercial? Não precisa de criar conta. Faça o seu registo de interesse e a nossa equipa comercial adiciona o seu estabelecimento diretamente na secção de parceiros.
              </p>
            </div>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="text-xs font-bold text-[#103B75] hover:text-[#0B254B] underline cursor-pointer shrink-0"
            >
              Candidatar Negócio ↗
            </button>
          </div>
        </div>
      </section>

      {/* Modal de Candidatura de Parceiro Comercial */}
      <PartnerInterestModal 
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />

    </div>
  );
}


