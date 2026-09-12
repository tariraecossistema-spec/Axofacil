import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Establishment, UserProfile } from './types';
import { 
  Search, X, Store, ShoppingBag, MapPin, Phone, MessageSquare, 
  ExternalLink, Sparkles, CheckCircle2, Zap, ArrowRight, ShieldCheck, 
  Tag, Filter, Building2, Truck, Utensils, BedDouble, Wrench, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuickStoreNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishments: Establishment[];
  onSelectEstablishment: (est: Establishment) => void;
  onNavigateToCategory?: (category: string) => void;
  currentUser?: UserProfile | null;
  onOpenPOS?: (est: Establishment) => void;
  onOpenSubscriptionModal?: () => void;
}

export default function QuickStoreNavigatorModal({
  isOpen,
  onClose,
  establishments,
  onSelectEstablishment,
  onNavigateToCategory,
  currentUser,
  onOpenPOS,
  onOpenSubscriptionModal
}: QuickStoreNavigatorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todas');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('todas');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setSelectedCategoryFilter('todas');
      setSelectedZoneFilter('todas');
    }
  }, [isOpen]);

  // Categories configuration with icons & labels
  const categoriesList = [
    { id: 'todas', label: 'Todas as Lojas', icon: Store, count: establishments.length },
    { id: 'loja', label: 'Lojas & Retalho', icon: ShoppingBag, count: establishments.filter(e => e.category === 'loja').length },
    { id: 'supermercado', label: 'Supermercados', icon: Utensils, count: establishments.filter(e => e.category === 'supermercado').length },
    { id: 'bar', label: 'Bares & Lounge', icon: Utensils, count: establishments.filter(e => e.category === 'bar').length },
    { id: 'hospedagem', label: 'Hospedagens & Hotéis', icon: BedDouble, count: establishments.filter(e => e.category === 'hospedagem').length },
    { id: 'construcao', label: 'Material de Construção', icon: Building2, count: establishments.filter(e => e.category === 'construcao').length },
    { id: 'turismo', label: 'Turismo & Safaris', icon: Compass, count: establishments.filter(e => e.category === 'turismo').length },
    { id: 'pecas_auto', label: 'Auto Peças', icon: Wrench, count: establishments.filter(e => e.category === 'loja' && (e.name.toLowerCase().includes('peça') || e.name.toLowerCase().includes('auto') || (e.features && e.features.some(f => f.toLowerCase().includes('peça'))))).length },
    { id: 'entregadores', label: 'Entregadores & Fretes', icon: Truck, count: establishments.filter(e => e.category === 'turismo' || e.name.toLowerCase().includes('frete') || e.name.toLowerCase().includes('logística')).length }
  ];

  // Distinct zones/neighborhoods in Maputo & Matola
  const distinctZones = useMemo(() => {
    const zones = new Set<string>();
    establishments.forEach(e => {
      if (e.zone) zones.add(e.zone);
    });
    return Array.from(zones).sort();
  }, [establishments]);

  // Filter establishments in real time (Zero latency)
  const filteredEstablishments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return establishments.filter(est => {
      // Category filter
      if (selectedCategoryFilter !== 'todas') {
        if (selectedCategoryFilter === 'pecas_auto') {
          const isAuto = est.category === 'loja' && (
            est.name.toLowerCase().includes('peça') || 
            est.name.toLowerCase().includes('auto') || 
            est.description.toLowerCase().includes('peça') ||
            (est.features && est.features.some(f => f.toLowerCase().includes('peça')))
          );
          if (!isAuto) return false;
        } else if (selectedCategoryFilter === 'entregadores') {
          const isLogistics = est.category === 'turismo' || 
            est.name.toLowerCase().includes('frete') || 
            est.name.toLowerCase().includes('logística') || 
            est.description.toLowerCase().includes('entrega');
          if (!isLogistics) return false;
        } else if (est.category !== selectedCategoryFilter) {
          return false;
        }
      }

      // Zone filter
      if (selectedZoneFilter !== 'todas' && est.zone !== selectedZoneFilter) {
        return false;
      }

      // Text query
      if (q) {
        const matchName = est.name.toLowerCase().includes(q);
        const matchZone = (est.zone || '').toLowerCase().includes(q);
        const matchAddress = (est.address || '').toLowerCase().includes(q);
        const matchDesc = (est.description || '').toLowerCase().includes(q);
        const matchFeatures = est.features ? est.features.some(f => f.toLowerCase().includes(q)) : false;
        const matchProducts = est.products ? est.products.some(p => p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))) : false;

        if (!matchName && !matchZone && !matchAddress && !matchDesc && !matchFeatures && !matchProducts) {
          return false;
        }
      }

      return true;
    });
  }, [establishments, searchQuery, selectedCategoryFilter, selectedZoneFilter]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm font-sans">
        {/* Backdrop click to close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.18 }}
          className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Top Header & Search Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-[#15243f] text-white">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Zap className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h2 className="font-serif font-black text-base sm:text-lg text-white flex items-center gap-2">
                    <span>Central de Navegação Rápida entre Lojas</span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black uppercase px-2 py-0.5 rounded-full">
                      Zero Loadings
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    Alterne instantaneamente entre todas as lojas hospedadas em Maputo e Matola sem esperar recarregamento.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instant Search Field */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por loja, artigo (ex: cimento, peças, cerveja), bairro ou serviço..."
                className="w-full pl-10 pr-10 py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 focus:placeholder:text-slate-500 border border-white/20 focus:border-amber-400 rounded-2xl text-xs sm:text-sm font-medium outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-white/10 hover:bg-white/20 rounded-full p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Segment Category Filters */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {categoriesList.map((cat, cIdx) => {
              const isSelected = selectedCategoryFilter === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={`quick-cat-${cat.id}-${cIdx}`}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#15243f] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{cat.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secondary Sub-filter by Neighborhood / Zone */}
          <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 gap-2 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="font-bold text-[10.5px] uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Zona:
              </span>
              <button
                onClick={() => setSelectedZoneFilter('todas')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors shrink-0 ${
                  selectedZoneFilter === 'todas'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas as Zonas
              </button>
              {distinctZones.map((zone, zIdx) => (
                <button
                  key={`quick-zone-${zone}-${zIdx}`}
                  onClick={() => setSelectedZoneFilter(zone)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold cursor-pointer transition-colors shrink-0 ${
                    selectedZoneFilter === zone
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-bold text-slate-500 shrink-0 hidden sm:inline">
              {filteredEstablishments.length} {filteredEstablishments.length === 1 ? 'estabelecimento encontrado' : 'estabelecimentos'}
            </span>
          </div>

          {/* Results Grid - High Speed Scroller */}
          <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[58vh]">
            {filteredEstablishments.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Store className="w-7 h-7" />
                </div>
                <h3 className="font-serif font-bold text-base text-slate-800">
                  Nenhum estabelecimento encontrado
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente ajustar a sua pesquisa por nome, ou altere o filtro de categoria ou zona selecionada.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategoryFilter('todas');
                    setSelectedZoneFilter('todas');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEstablishments.map((est, eIdx) => {
                  const hasProducts = est.products && est.products.length > 0;
                  const isStoreManager = currentUser && (
                    currentUser.role === 'admin' || 
                    currentUser.establishmentId === est.id ||
                    currentUser.name.toLowerCase() === est.name.toLowerCase()
                  );

                  return (
                    <div
                      key={`quick-est-${est.id}-${eIdx}`}
                      className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-2xl transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Info Header */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-1 border border-amber-200/60">
                              {est.category === 'loja' ? 'Loja & Retalho' : est.category === 'supermercado' ? 'Supermercado' : est.category === 'bar' ? 'Bar & Lounge' : est.category === 'hospedagem' ? 'Hospedagem' : est.category === 'construcao' ? 'Material de Construção' : 'Turismo & Safaris'}
                            </span>
                            <h4 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#15243f] transition-colors line-clamp-1">
                              {est.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/50">
                              ★ {est.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Location & Meta info */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-2">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{est.zone || est.address}</span>
                          {est.metaInfo && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium truncate">{est.metaInfo}</span>
                            </>
                          )}
                        </div>

                        {/* Description / Promotion */}
                        <p className="text-[11.5px] text-slate-600 line-clamp-2 leading-relaxed mb-3">
                          {est.promotion ? (
                            <span className="text-amber-800 font-bold bg-amber-50/80 px-1 rounded">
                              🔥 {est.promotion}
                            </span>
                          ) : (
                            est.description
                          )}
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-1">
                          {est.contactPhone && (
                            <a
                              href={`https://wa.me/${est.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Olá ${est.name}, vi o vosso perfil no Axofácil! e gostaria de obter informações.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg transition-colors border border-emerald-200 text-xs font-bold inline-flex items-center gap-1"
                              title="Conversar no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden sm:inline">WhatsApp</span>
                            </a>
                          )}

                          {isStoreManager && onOpenPOS && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenPOS(est);
                              }}
                              className="p-1.5 text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-lg transition-colors border border-indigo-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Abrir Terminal de Caixa / PDV"
                            >
                              <Zap className="w-3 h-3" />
                              <span>PDV</span>
                            </button>
                          )}
                        </div>

                        {/* Primary Button to Open Establishment */}
                        <button
                          onClick={() => {
                            onClose();
                            onSelectEstablishment(est);
                          }}
                          className="px-3 py-1.5 bg-[#15243f] hover:bg-[#0A1E3F] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 ml-auto"
                        >
                          <span>Entrar na Loja</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer with Shortcuts & Quick Registration Link */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Hospedagem Multilojas Segura
              </span>
              <span className="hidden sm:inline text-slate-400">•</span>
              <span className="hidden sm:inline text-[11px] text-slate-500">
                Pressione <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700">ESC</kbd> para fechar
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSubscriptionModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSubscriptionModal();
                  }}
                  className="text-amber-800 hover:text-amber-950 font-bold text-[11.5px] hover:underline cursor-pointer"
                >
                  💳 Planos de Subscrição de Loja
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
