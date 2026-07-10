import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import {
  ArrowRight, ShoppingCart, Search, MapPin, ChevronLeft, ChevronRight,
  Smartphone, Instagram, Twitter, Facebook, ChevronDown, ChevronUp,
  Crosshair, Clock, Users, Gift
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PremiumProductCard } from '../components/PremiumProductCard';

const CATEGORY_HERO_BG: Record<string, string> = {
  'hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
  'pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
  'pollo': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800',
  'bebidas': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
  'postres': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
  'papas & sides': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=800',
  'combos': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
  'entradas': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
};

interface HomeProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
  setSelectedCategory: (category: string) => void;
  onViewProductDetails: (food: FoodItem) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
  navigateToCatalog: (filters?: { category?: string }) => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  setTab, setSelectedCategory,
  onViewProductDetails, globalSearch: _globalSearch, setGlobalSearch: _setGlobalSearch,
  navigateToCatalog: _navigateToCatalog,
  deferredPrompt: _deferredPrompt, onInstallClick
}) => {
  const { foodItems, config, addToCart, getProductAverageRating, getProductReviews } = useApp();
  const themeColor = config.theme_color || '#E31837';

  const activeItems = useMemo(() => foodItems.filter(p => p.activo !== false), [foodItems]);
  const promoItems = useMemo(() => activeItems.filter(p => p.es_promo), [activeItems]);
  const newItems = useMemo(() => activeItems.filter(p => p.es_nuevo), [activeItems]);
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);

  const categorySections = useMemo(() => {
    return (config.categories || []).map(catName => {
      const items = activeItems.filter(p => p.categoria.toLowerCase() === catName.toLowerCase());
      return { name: catName, items };
    }).filter(s => s.items.length > 0);
  }, [activeItems, config.categories]);

  // Service selector state
  const [serviceMode, setServiceMode] = useState<'recoger' | 'domicilio'>('domicilio');
  const [locationSearch, setLocationSearch] = useState('');

  // Promo carousel state
  const promoCarouselRef = useRef<HTMLDivElement>(null);

  // Footer accordion state (mobile)
  const [openFooterSection, setOpenFooterSection] = useState<string | null>(null);

  const toggleFooterSection = (section: string) => {
    setOpenFooterSection(prev => prev === section ? null : section);
  };

  // Promo items for carousel (combine promo + new + bestseller)
  const carouselItems = useMemo(() => {
    const items: { title: string; description: string; image: string; action: string }[] = [];
    if (promoItems.length > 0) {
      items.push({
        title: 'Promociones Especiales',
        description: 'Descubre nuestros descuentos exclusivos en los favoritos de todos.',
        image: promoItems[0]?.imagen_urls?.[0] || config.banners?.[0] || CATEGORY_HERO_BG['hamburguesas'],
        action: 'Ver Promos',
      });
    }
    if (newItems.length > 0) {
      items.push({
        title: 'Novedades en el Menú',
        description: 'Prueba lo nuevo de nuestra cocina. Sabores que te sorprenderán.',
        image: newItems[0]?.imagen_urls?.[0] || config.banners?.[1] || CATEGORY_HERO_BG['pollo'],
        action: 'Descubrir',
      });
    }
    if (bestsellerItems.length > 0) {
      items.push({
        title: 'Lo Que Todos Piden',
        description: 'Los platos más populares entre nuestros clientes. ¡No te los pierdas!',
        image: bestsellerItems[0]?.imagen_urls?.[0] || config.banners?.[2] || CATEGORY_HERO_BG['pizzas'],
        action: 'Ordenar',
      });
    }
    // Always add a rewards card
    items.push({
      title: 'Únete a Recompensas',
      description: 'Acumula puntos con cada compra y canjéalos por comidas gratis.',
      image: config.banners?.[0] || CATEGORY_HERO_BG['combos'],
      action: 'Registrarse',
    });
    return items;
  }, [promoItems, newItems, bestsellerItems, config.banners]);

  const scrollPromo = (dir: 'left' | 'right') => {
    if (promoCarouselRef.current) {
      const scrollAmount = promoCarouselRef.current.offsetWidth * 0.8;
      promoCarouselRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col">
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO BANNER — Full-width with left-aligned text
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative w-full h-[340px] sm:h-[400px] md:h-[460px] lg:h-[520px] overflow-hidden bg-zinc-900">
        {/* Background Image */}
        {config.banners.length > 0 ? (
          <img
            src={config.banners[0]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800" />
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

        {/* Content — Left-aligned on PC, centered on mobile */}
        <div className="absolute inset-0 flex items-end md:items-center pb-20 sm:pb-16 md:pb-0">
          <div className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-12">
            <div className="max-w-lg">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                {config.hero_title || config.banner_texts?.[0] || config.site_nombre || 'La Comida que Te Encanta'}
              </h1>
              <p className="text-white/70 text-xs sm:text-sm md:text-base mt-3 md:mt-4 max-w-md leading-relaxed">
                {config.hero_subtitle || config.mensaje_bienvenida || 'Sabores auténticos preparados con los mejores ingredientes. Ordena ahora y recíbelo en tu puerta.'}
              </p>

              {/* Two CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-5 md:mt-6">
                <button
                  onClick={() => setTab('catalog')}
                  className="bg-white text-zinc-900 font-bold text-sm px-8 py-3.5 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all cursor-pointer active:scale-95"
                >
                  {config.hero_cta_text || 'ORDENAR AHORA'} <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
                  className="bg-transparent text-white font-bold text-sm px-8 py-3.5 min-h-[48px] rounded-full inline-flex items-center justify-center gap-2 border-2 border-white/40 hover:border-white/80 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                >
                  Ver Menú
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: SERVICE SELECTOR — Pickup/Delivery + Location Search
          ═══════════════════════════════════════════════════════════ */}
      <section className="w-full bg-white border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 bg-zinc-50 rounded-2xl p-2 border border-zinc-200">
            {/* Service Mode Tabs */}
            <div className="flex bg-white rounded-xl border border-zinc-200 overflow-hidden shrink-0">
              <button
                onClick={() => setServiceMode('recoger')}
                className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  serviceMode === 'recoger'
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                style={serviceMode === 'recoger' ? { backgroundColor: themeColor } : {}}
              >
                <Clock size={14} className="inline mr-1.5 -mt-0.5" />
                Recoger
              </button>
              <button
                onClick={() => setServiceMode('domicilio')}
                className={`px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-all cursor-pointer ${
                  serviceMode === 'domicilio'
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
                style={serviceMode === 'domicilio' ? { backgroundColor: themeColor } : {}}
              >
                <MapPin size={14} className="inline mr-1.5 -mt-0.5" />
                Domicilio
              </button>
            </div>

            {/* Location Search Input */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Ciudad, estado o código postal"
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-zinc-300 transition-all"
                />
              </div>
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setLocationSearch(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
                      () => setLocationSearch('Ubicación no disponible')
                    );
                  }
                }}
                className="p-2.5 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer shrink-0"
                title="Usar mi ubicación"
              >
                <Crosshair size={18} className="text-zinc-600" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: PROMOTIONAL BANNERS CAROUSEL
          ═══════════════════════════════════════════════════════════ */}
      {carouselItems.length > 0 && (
        <section className="w-full py-6 sm:py-8 md:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">Destacados</h2>
              {/* Desktop arrow controls */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scrollPromo('left')}
                  className="w-9 h-9 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} className="text-zinc-600" />
                </button>
                <button
                  onClick={() => scrollPromo('right')}
                  className="w-9 h-9 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} className="text-zinc-600" />
                </button>
              </div>
            </div>

            {/* Carousel */}
            <div
              ref={promoCarouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2 md:pb-0"
            >
              {carouselItems.map((item, idx) => (
                <div
                  key={idx}
                  className="shrink-0 w-[85vw] sm:w-[60vw] md:w-[calc(33.333%-11px)] snap-start group"
                >
                  <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-44 md:h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Text Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-sm font-bold text-zinc-900 mb-1">{item.title}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed flex-1">{item.description}</p>
                      <button
                        onClick={() => {
                          if (item.action === 'Registrarse') setTab('profile');
                          else setTab('catalog');
                        }}
                        className="mt-3 text-xs font-bold uppercase tracking-wide cursor-pointer transition-colors hover:underline"
                        style={{ color: themeColor }}
                      >
                        {item.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile dot indicators */}
            <div className="flex md:hidden justify-center gap-1.5 mt-4">
              {carouselItems.map((_, idx) => (
                <div
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-300"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: MENU HIGHLIGHTS GRID — Category Cards
          ═══════════════════════════════════════════════════════════ */}
      {categorySections.length > 0 && (
        <section className="w-full py-6 sm:py-8 md:py-12 bg-zinc-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">LO MÁS POPULAR</h2>
                <p className="text-xs text-zinc-500 mt-1">Explora nuestras categorías y ordena lo que más te guste</p>
              </div>
              <button
                onClick={() => setTab('catalog')}
                className="text-xs font-bold uppercase tracking-wide cursor-pointer hover:underline hidden sm:block"
                style={{ color: themeColor }}
              >
                Ver todo el menú →
              </button>
            </div>

            {/* Desktop: Grid / Mobile: Horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible pb-2 md:pb-0">
              {categorySections.map((section) => {
                const bgImage = config.categories_images?.[section.name] || CATEGORY_HERO_BG[section.name.toLowerCase()];
                return (
                  <div
                    key={section.name}
                    className="shrink-0 w-[75vw] sm:w-[45vw] md:w-auto snap-start group"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      {/* Category Image */}
                      <div className="relative h-40 md:h-44 overflow-hidden">
                        {bgImage ? (
                          <img
                            src={bgImage}
                            alt={section.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
                          >
                            🍽️
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      {/* Category Info + Order Button */}
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 capitalize">{section.name}</h3>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{section.items.length} productos</p>
                        </div>
                        <button
                          onClick={() => { setSelectedCategory(section.name); setTab('catalog'); }}
                          className="text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer hover:opacity-90 active:scale-95"
                          style={{ backgroundColor: themeColor }}
                        >
                          ORDENAR
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: REWARDS PROGRAM — Dark background, 2-column
          ═══════════════════════════════════════════════════════════ */}
      <section className="w-full py-8 sm:py-10 md:py-16" style={{ backgroundColor: '#2D0A00' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">

            {/* Left: Promotional Image */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={config.banners?.[0] || CATEGORY_HERO_BG['combos']}
                  alt="Rewards"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 to-transparent" />
                {/* Floating badge */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Gift size={18} style={{ color: themeColor }} />
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Puntos</p>
                      <p className="text-lg font-black text-zinc-900">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Text Content */}
            <div className="w-full md:w-1/2 text-white">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Únete a<br />
                <span style={{ color: themeColor }}>RECOMPENSAS</span>
              </h2>
              <p className="text-white/60 text-sm mt-3 max-w-md leading-relaxed">
                El programa de fidelización más delicioso. Acumula puntos con cada compra y canjéalos por comida gratis.
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-4 mt-6">
                {[
                  { icon: <Users size={16} />, title: 'Regístrate gratis', desc: 'Crea tu cuenta en segundos' },
                  { icon: <ShoppingCart size={16} />, title: 'Ordena y acumula', desc: 'Gana puntos con cada pedido' },
                  { icon: <Gift size={16} />, title: 'Canjea recompensas', desc: 'Intercambia puntos por comida gratis' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${themeColor}30`, color: themeColor }}>
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{step.title}</p>
                      <p className="text-xs text-white/50">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => setTab('profile')}
                  className="text-white font-bold text-sm px-8 py-3 rounded-full inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: themeColor }}
                >
                  ÚNETE AHORA
                </button>
                <button
                  onClick={() => setTab('profile')}
                  className="bg-transparent text-white font-bold text-sm px-8 py-3 rounded-full inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                >
                  INICIAR SESIÓN
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5.5: POPULAR ITEMS — Top ordered products
          ═══════════════════════════════════════════════════════════ */}
      {bestsellerItems.length > 0 && (
        <section className="w-full py-6 sm:py-8 md:py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">LO MÁS PEDIDO</h2>
                <p className="text-xs text-zinc-500 mt-1">Los favoritos de nuestros clientes</p>
              </div>
              <button
                onClick={() => setTab('catalog')}
                className="text-xs font-bold uppercase tracking-wide cursor-pointer hover:underline hidden sm:block"
                style={{ color: themeColor }}
              >
                Ver todo →
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
              {bestsellerItems.slice(0, 8).map((item, idx) => (
                <div key={item.id} className="shrink-0 w-[180px] sm:w-[220px] snap-start">
                  <PremiumProductCard
                    item={item}
                    config={config}
                    onViewProductDetails={onViewProductDetails}
                    addToCart={(food) => addToCart(food)}
                    averageRating={getProductAverageRating(item.id)}
                    reviewCount={getProductReviews(item.id).length}
                    index={idx}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: FOOTER — Social, App Download, Links, Copyright
          ═══════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-zinc-950 text-white">
        {/* Top Row: Social Icons + App Download */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40 font-semibold uppercase tracking-wider mr-2 hidden sm:inline">Síguenos</span>
              {[
                { icon: <Instagram size={18} />, href: '#', label: 'Instagram' },
                { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
                { icon: <Facebook size={18} />, href: '#', label: 'Facebook' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>

            {/* App Download */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 font-semibold uppercase tracking-wider hidden sm:inline">Descarga la App</span>
              <div className="flex gap-2">
                <button
                  onClick={onInstallClick || (() => alert('Abre esta página en Chrome y agrega a la pantalla de inicio.'))}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  <Smartphone size={14} />
                  <span className="hidden sm:inline">App Store</span>
                </button>
                <button
                  onClick={onInstallClick || (() => alert('Abre esta página en Chrome y agrega a la pantalla de inicio.'))}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  <Smartphone size={14} />
                  <span className="hidden sm:inline">Google Play</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body: 4-Column Links (PC) / Accordion (Mobile) */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="hidden md:grid md:grid-cols-4 gap-8">
            {/* Column 1: Corporate */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">Corporativo</h4>
              <ul className="flex flex-col gap-2.5">
                {['Sobre Nosotros', 'Carreras', 'Prensa', 'Inversores'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Customer Service */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">Servicio al Cliente</h4>
              <ul className="flex flex-col gap-2.5">
                {['Centro de Ayuda', 'Preguntas Frecuentes', 'Contacto', 'WhatsApp Soporte'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Values */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">Nuestros Valores</h4>
              <ul className="flex flex-col gap-2.5">
                {['Sostenibilidad', 'Nutrición', 'Calidad de Ingredientes', 'Comunidad'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5">
                {['Política de Privacidad', 'Términos de Uso', 'Accesibilidad', 'Cookies'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile: Accordion */}
          <div className="md:hidden flex flex-col divide-y divide-white/10">
            {[
              { title: 'Corporativo', links: ['Sobre Nosotros', 'Carreras', 'Prensa', 'Inversores'] },
              { title: 'Servicio al Cliente', links: ['Centro de Ayuda', 'Preguntas Frecuentes', 'Contacto', 'WhatsApp Soporte'] },
              { title: 'Nuestros Valores', links: ['Sostenibilidad', 'Nutrición', 'Calidad de Ingredientes', 'Comunidad'] },
              { title: 'Legal', links: ['Política de Privacidad', 'Términos de Uso', 'Accesibilidad', 'Cookies'] },
            ].map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleFooterSection(section.title)}
                  className="w-full flex items-center justify-between py-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white/80">{section.title}</span>
                  {openFooterSection === section.title ? (
                    <ChevronUp size={16} className="text-white/40" />
                  ) : (
                    <ChevronDown size={16} className="text-white/40" />
                  )}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFooterSection === section.title ? 'max-h-60 pb-4' : 'max-h-0'
                  }`}
                >
                  <ul className="flex flex-col gap-2.5 pl-2">
                    {section.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row: Copyright */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} {config.site_nombre || 'FoodPop'}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Privacidad</a>
              <a href="#" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Términos</a>
              <a href="#" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
