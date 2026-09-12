import React from 'react';
import { 
  Instagram, Linkedin, Mail, MapPin, ExternalLink, 
  Phone, Compass, ShoppingBag, Wrench, ShoppingCart, GlassWater, 
  BedDouble, Hammer, Truck, CreditCard, Sparkles, Send
} from 'lucide-react';
import { UserProfile } from "./types";

interface FooterProps {
  setActivePage: (page: any) => void;
  onOpenAuth?: (tab: 'login' | 'criar' | 'admin') => void;
  currentUser?: UserProfile | null;
  activePage?: string;
}

export default function Footer({ setActivePage, onOpenAuth, currentUser, activePage }: FooterProps) {
  const supportEmail = 'contacto@axofacil.mz';
  const linkedinUrl = 'https://www.linkedin.com/company/tarira-ecossystem';
  const instagramUrl = 'https://www.instagram.com/axofacil?stkn=bzhwNnZ6ZGt4bDJ4';
  const phoneContact = '+258 84 000 0000';

  const services = [
    {
      icon: Compass,
      title: 'Turismo & Viagens',
      desc: 'Voos, safaris, praias de Moçambique & passeios guiados',
      page: 'turismo'
    },
    {
      icon: ShoppingBag,
      title: 'Lojas & Comércio',
      desc: 'Vestuário, calçado, eletrónica & acessórios na Baixa',
      page: 'lojas'
    },
    {
      icon: Wrench,
      title: 'Peças & Auto',
      desc: 'Peças sobressalentes, oficinas, filtros & pneus',
      page: 'lojas'
    },
    {
      icon: BedDouble,
      title: 'Hotéis & Lodges',
      desc: 'Hospedagem executiva, pousadas & resorts com vista mar',
      page: 'hospedagens'
    },
    {
      icon: ShoppingCart,
      title: 'Supermercados',
      desc: 'Compras frescas do dia a dia, cabazes & atacado',
      page: 'supermercados'
    },
    {
      icon: GlassWater,
      title: 'Bares & Noite',
      desc: 'Gastronomia moçambicana, marisqueiras & diversão',
      page: 'bares'
    },
    {
      icon: Hammer,
      title: 'Construção Civil',
      desc: 'Cimento, ferragens, blocos, tintas & materiais de obra',
      page: 'construcao'
    },
    {
      icon: Truck,
      title: 'Entregas Express',
      desc: 'Moto-táxi, estafetas & fretes rápidos em Maputo e Matola',
      page: 'entregadores'
    }
  ];

  return (
    <footer id="main-footer" className="border-t border-blue-900/40 bg-[#0B254B] text-white pt-16 pb-12 px-[5vw] lg:px-[7vw] mt-16 relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-900/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10">
        
        {/* Top Section: Brand Identity & Large Social Channels */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-10 border-b border-white/15">
          
          {/* Brand Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div 
              onClick={() => {
                setActivePage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer group flex items-center gap-1.5"
            >
              <span className="font-black text-3xl sm:text-4xl text-white tracking-tight font-sans">
                AXOFÁCIL!
              </span>
              <span className="bg-white text-[#0B254B] text-xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-md">
                MOÇAMBIQUE
              </span>
            </div>
            
            <div className="sm:border-l sm:border-white/15 sm:pl-4 space-y-1">
              <p className="text-sm font-semibold text-slate-100">
                O Maior Portal de Comércio, Turismo & Serviços do País
              </p>
              <p className="text-xs text-blue-200 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                Maputo · Matola · Vilankulos · Ponta do Ouro · Pemba
              </p>
            </div>
          </div>

          {/* Social Channels with Large, High-Impact Icons */}
          <div className="flex flex-col items-center sm:items-end gap-2.5">
            <span className="text-xs uppercase font-bold tracking-widest text-blue-200">
              Siga-nos & Contactos Directos
            </span>
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                id="footer-instagram-btn"
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
                title="Instagram Oficial AXOFÁCIL! (@axofacil)"
                aria-label="Instagram Oficial AXOFÁCIL! (@axofacil)"
              >
                <Instagram className="w-6 h-6 text-white" />
              </a>

              {/* LinkedIn */}
              <a
                id="footer-linkedin-btn"
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
                title="LinkedIn (Tarira)"
                aria-label="LinkedIn Tarira"
              >
                <Linkedin className="w-6 h-6 text-white" />
              </a>

              {/* Email */}
              <a
                id="footer-email-btn"
                href={`mailto:${supportEmail}`}
                className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-[#0B254B] text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
                title={`Enviar e-mail para ${supportEmail}`}
                aria-label="E-mail de Apoio"
              >
                <Mail className="w-6 h-6 text-white" />
              </a>

              {/* Phone / WhatsApp */}
              <a
                id="footer-phone-btn"
                href="https://wa.me/258840000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
                title="WhatsApp / Apoio ao Cliente"
                aria-label="WhatsApp Apoio ao Cliente"
              >
                <Phone className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>

        </div>

        {/* Middle Section: Visual Showcase of All Services Offered by the Portal (Oculto no perfil do cliente/loja) */}
        {activePage !== 'dashboard' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
                Nossos Serviços & Categorias em Moçambique
              </h4>
              <span className="text-[11px] text-blue-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Cobertura Nacional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {services.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <div
                    key={`footer-srv-${srv.title}-${idx}`}
                    onClick={() => {
                      setActivePage(srv.page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 transition-all cursor-pointer group flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0B254B]/60 group-hover:bg-[#0B254B] text-blue-200 group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-blue-400/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-sm text-white group-hover:text-blue-200 transition-colors">
                        {srv.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {srv.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment & Trust Methods Bar */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CreditCard className="w-4 h-4 text-blue-300" />
            <span className="font-semibold">Meios de Pagamento Seguros & Integrados:</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold text-xs text-white flex-wrap justify-center">
            <span className="px-2.5 py-1 bg-red-600/30 border border-red-500/40 rounded-md text-red-300">
              M-PESA (Vodacom)
            </span>
            <span className="px-2.5 py-1 bg-orange-600/30 border border-orange-500/40 rounded-md text-orange-300">
              e-Mola (Movitel)
            </span>
            <span className="px-2.5 py-1 bg-blue-600/30 border border-blue-500/40 rounded-md text-blue-300">
              Cartão VISA / MasterCard
            </span>
            <span className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/40 rounded-md text-emerald-300">
              Pagamento na Entrega
            </span>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Management */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} AXOFÁCIL! Moçambique — Desenvolvido por <strong className="text-white">Tarira Studio</strong> (Tarira).</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActivePage('sobre');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Sobre Nós & Tarira Studio
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => {
                  setActivePage('sobre');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Contactos Oficiais
              </button>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
