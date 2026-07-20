import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem, Promotion } from '../types/store';
import {
  ArrowRight, ShoppingCart, Search, MapPin, ChevronLeft, ChevronRight,
  ChevronDown, Crosshair, Users, Gift
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PremiumProductCard } from '../components/PremiumProductCard';
import { PromotionBanner } from '../components/PromotionBanner';
import { Footer } from '../components/Footer';
import { FloatingCartButton } from '../components/FloatingCartButton';

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
  onAdminClick?: () => void;
  isAdminAuthenticated?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  setTab, setSelectedCategory,
  onViewProductDetails, globalSearch: _globalSearch, setGlobalSearch: _setGlobalSearch,
  navigateToCatalog: _navigateToCatalog,
  deferredPrompt: _deferredPrompt, onInstallClick, onAdminClick, isAdminAuthenticated
}) => {
  const { foodItems, config, cart, addToCart, getProductAverageRating, getProductReviews, promotions } = useApp();
  const themeColor = config.theme_color || '#E31837';

  const activePromotions = useMemo(() => {
    const now = new Date().toISOString();
    return (promotions || []).filter(p => 
      p.status === 'active' && 
      (!p.start_date || p.start_date <= now) && 
      (!p.end_date || p.end_date >= now)
    );
  }, [promotions]);

  const activeItems = useMemo(() => foodItems.filter(p => p.activo !== false), [foodItems]);
  const promoItems = useMemo(() => activeItems.filter(p => p.es_promo), [activeItems]);
  const newItems = useMemo(() => activeItems.filter(p => p.es_nuevo), [activeItems]);
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);

  const activeCombos = useMemo(() => {
    return (config.combos || []).filter(c => c.active);
  }, [config.combos]);

  const [recentlyViewed, setRecentlyViewed] = useState<FoodItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('foodapp_recently_viewed');
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        const items = ids
          .map(id => foodItems.find(p => p.id === id))
          .filter(Boolean) as FoodItem[];
        setRecentlyViewed(items.slice(0, 10));
      }
    } catch {}
  }, [foodItems]);

  const categorySections = useMemo(() => {
    return (config.categories || []).map(catName => {
      const items = activeItems.filter(p => p.categoria.toLowerCase() === catName.toLowerCase());
      return { name: catName, items };
    }).filter(s => s.items.length > 0);
  }, [activeItems, config.categories]);

  // Hero hover/touch state
  const [heroHovered, setHeroHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Hero mobile carousel state
  const [heroSlide, setHeroSlide] = useState(0);
  const heroBanners = config.banners.slice(0, 3);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  // Promo carousel state
  const promoCarouselRef = useRef<HTMLDivElement>(null);
  const comboCarouselRef = useRef<HTMLDivElement>(null);
  const offerCarouselRef = useRef<HTMLDivElement>(null);
  const recentCarouselRef = useRef<HTMLDivElement>(null);

  // Cart totals
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const extrasTotal = item.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
    return sum + (item.item.precio_usd + extrasTotal) * item.quantity;
  }, 0);

  // Promo items for carousel
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

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.offsetWidth * 0.8;
      ref.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const trackRecentlyViewed = (item: FoodItem) => {
    try {
      const stored = localStorage.getItem('foodapp_recently_viewed');
      const ids: string[] = stored ? JSON.parse(stored) : [];
      const filtered = ids.filter(id => id !== item.id);
      filtered.unshift(item.id);
      localStorage.setItem('foodapp_recently_viewed', JSON.stringify(filtered.slice(0, 20)));
    } catch {}
  };

  // Hero height class
  const heroHeightClass = config.hero_height === 'full' ? 'h-[100dvh]'
    : config.hero_height === '70vh' ? 'h-[70dvh]'
    : config.hero_height === '60vh' ? 'h-[60dvh]'
    : 'h-[380px] sm:h-[440px] md:h-[500px] lg:h-[560px]';

  // Hero text effect
  const heroTextClass = config.hero_effect === 'fade' ? 'animate-hero-fade'
    : config.hero_effect === 'typewriter' ? 'animate-hero-typewriter'
    : config.hero_effect === 'slide' ? 'animate-hero-slide'
    : '';

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO BANNER — Luminous Electric vertical carousel
          ═══════════════════════════════════════════════════════════ */}
      
      {/* MOBILE: Hero carousel */}
      <section className="md:hidden w-full" style={{ backgroundColor: '#f9f9fb' }}>
        <div 
          ref={heroRef}
          className="relative w-full h-[707px] overflow-hidden"
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
          onTouchStart={() => setHeroHovered(true)}
          onTouchEnd={() => setTimeout(() => setHeroHovered(false), 2000)}
        >
          {heroBanners.length > 0 ? (
            <div 
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${heroSlide * 100}%)` }}
            >
              {heroBanners.map((banner, idx) => (
                <div key={idx} className="relative w-full h-full shrink-0 flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${banner}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-12 left-4 right-4">
                    <span className="inline-block px-3 py-1 text-white text-[14px] font-semibold rounded-full mb-4"
                      style={{ backgroundColor: themeColor }}
                    >
                      NUEVO
                    </span>
                    <h2 className="text-[40px] font-extrabold text-white mb-2 leading-tight"
                      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}
                    >
                      {config.hero_title || config.site_nombre || 'FoodPop'}
                    </h2>
                    <p className="text-[16px] text-white/80 max-w-md">
                      {config.hero_subtitle || config.mensaje_bienvenida || 'La explosión de sabor que estabas esperando. ¡Pídela hoy!'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: '#eeeef0' }} />
          )}

          {/* Scroll Indicator Dots - Right side vertical */}
          {heroBanners.length > 1 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
              {heroBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroSlide(idx)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: idx === heroSlide ? '8px' : '8px',
                    height: idx === heroSlide ? '24px' : '8px',
                    backgroundColor: idx === heroSlide ? themeColor : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text content below banner */}
        <div className={`px-4 py-4 ${heroTextClass}`}>
          <button
            onClick={() => setTab('catalog')}
            className="mt-2 w-full font-bold text-xs px-4 py-3 min-h-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: themeColor, color: '#ffffff' }}
          >
            {config.hero_cta_text || 'ORDENAR AHORA'}
          </button>
        </div>
      </section>

      {/* DESKTOP: Fullscreen carousel */}
      <section
        ref={heroRef}
        className={`hidden md:block relative w-full ${heroHeightClass} overflow-hidden`}
        onMouseEnter={() => setHeroHovered(true)}
        onMouseLeave={() => setHeroHovered(false)}
      >
        {heroBanners.length > 0 ? (
          <div 
            className="absolute inset-0 flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${heroSlide * 100}%)` }}
          >
            {heroBanners.map((banner, idx) => (
              <img
                key={idx}
                src={banner}
                alt=""
                className="w-full h-full object-cover shrink-0"
                referrerPolicy="no-referrer"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: '#e2e2e4' }} />
        )}

        {/* Dynamic overlay opacity */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          style={{ opacity: (config.hero_overlay_opacity ?? 100) / 100 }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-7xl mx-auto px-8 lg:px-12 pb-16">
            <div className={`max-w-lg ${heroTextClass}`}>
              <span className="inline-block px-3 py-1 text-white text-[14px] font-semibold rounded-full mb-4"
                style={{ backgroundColor: themeColor }}
              >
                NUEVO
              </span>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                {config.hero_title || config.banner_texts?.[0] || config.site_nombre || 'La Comida que Te Encanta'}
              </h1>
              <p className="text-white/80 text-base mt-4 max-w-md leading-relaxed">
                {config.hero_subtitle || config.mensaje_bienvenida || 'Sabores auténticos preparados con los mejores ingredientes. Ordena ahora y recíbelo en tu puerta.'}
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setTab('catalog')}
                  className="text-white font-bold text-sm px-8 py-3.5 min-h-[48px] rounded-xl inline-flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  style={{ backgroundColor: themeColor }}
                >
                  {config.hero_cta_text || 'ORDENAR AHORA'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dots indicator */}
        {heroBanners.length > 1 && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroSlide(idx)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: idx === heroSlide ? '8px' : '8px',
                  height: idx === heroSlide ? '24px' : '8px',
                  backgroundColor: idx === heroSlide ? themeColor : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: ACTIVE PROMOTIONS CAROUSEL — Luminous Electric
          ═══════════════════════════════════════════════════════════ */}
      {activePromotions.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="flex items-center gap-1 mb-1" style={{ color: themeColor }}>
                  <span className="text-[20px]">⚡</span>
                  <span className="text-[14px] font-semibold" style={{ color: themeColor }}>TERMINA EN</span>
                </div>
                <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  Ofertas Flash
                </h3>
              </div>
              <button
                onClick={() => setTab('catalog')}
                className="text-[14px] font-semibold flex items-center gap-1 cursor-pointer"
                style={{ color: themeColor }}
              >
                Ver Todo →
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
              {activePromotions.map((promo) => (
                <div key={promo.id} className="shrink-0 w-[85vw] sm:w-[60vw] md:w-[calc(50%-8px)] snap-start">
                  <PromotionBanner
                    promotion={promo}
                    themeColor={themeColor}
                    onClick={() => setTab('catalog')}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION: COMBOS — Luminous Electric asymmetric grid
          ═══════════════════════════════════════════════════════════ */}
      {activeCombos.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                Combos Explosivos
              </h3>
              <div className="flex gap-2">
                <button onClick={() => scrollCarousel(comboCarouselRef, 'left')} className="w-10 h-10 rounded-full border border-[#e4beb1] flex items-center justify-center hover:bg-[#f3f3f5] transition-colors cursor-pointer active:scale-90">
                  <ChevronLeft size={18} className="text-[#1a1c1d]" />
                </button>
                <button onClick={() => scrollCarousel(comboCarouselRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer" style={{ backgroundColor: themeColor, color: '#ffffff' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div ref={comboCarouselRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar md:overflow-visible pb-2 md:pb-0">
              {activeCombos.map((combo) => {
                const comboProducts = combo.product_ids
                  .map(id => activeItems.find(p => p.id === id))
                  .filter(Boolean) as FoodItem[];
                const comboImage = combo.imagen_url || comboProducts[0]?.imagen_urls?.[0] || '';
                return (
                  <div key={combo.id} className="flex rounded-xl overflow-hidden h-40 snap-start" style={{ backgroundColor: '#e8e8ea' }}>
                    <div className="w-1/3">
                      {comboImage ? (
                        <img src={comboImage} alt={combo.nombre} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: themeColor }}>🎁</div>
                      )}
                    </div>
                    <div className="w-2/3 p-4 flex flex-col justify-center">
                      <h5 className="text-[16px] font-bold text-[#1a1c1d]">{combo.nombre}</h5>
                      <p className="text-[12px] text-[#5b4137] mt-1 leading-relaxed flex-1">{combo.descripcion}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[12px] text-[#5b4137]">{comboProducts.length} productos incluidos</span>
                        <span className="font-bold text-[16px]" style={{ color: themeColor }}>-{combo.discount_percent}%</span>
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
          SECTION: OFERTAS — Products on sale
          ═══════════════════════════════════════════════════════════ */}
      {promoItems.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  Ofertas
                </h3>
                <p className="text-[12px] text-[#8f7065] mt-1">Productos con descuento especial</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => scrollCarousel(offerCarouselRef, 'left')} className="w-10 h-10 rounded-full border border-[#e4beb1] flex items-center justify-center hover:bg-[#f3f3f5] transition-colors cursor-pointer active:scale-90">
                  <ChevronLeft size={18} className="text-[#1a1c1d]" />
                </button>
                <button onClick={() => scrollCarousel(offerCarouselRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer" style={{ backgroundColor: themeColor, color: '#ffffff' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div ref={offerCarouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
              {promoItems.slice(0, 10).map((item, idx) => (
                <div key={item.id} className="shrink-0 w-[180px] sm:w-[220px] snap-start">
                  <PremiumProductCard
                    item={item}
                    config={config}
                    onViewProductDetails={(food) => { trackRecentlyViewed(food); onViewProductDetails(food); }}
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
          SECTION: PROMOTIONAL BANNERS CAROUSEL — Luminous Electric
          ═══════════════════════════════════════════════════════════ */}
      {carouselItems.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                {config.section_highlights_title || 'Destacados'}
              </h3>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scrollPromo('left')}
                  className="w-10 h-10 rounded-full border border-[#e4beb1] flex items-center justify-center hover:bg-[#f3f3f5] transition-colors cursor-pointer active:scale-90"
                >
                  <ChevronLeft size={18} className="text-[#1a1c1d]" />
                </button>
                <button
                  onClick={() => scrollPromo('right')}
                  className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                  style={{ backgroundColor: themeColor, color: '#ffffff' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div
              ref={promoCarouselRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2 md:pb-0"
            >
              {carouselItems.map((item, idx) => (
                <div
                  key={idx}
                  className="shrink-0 w-[85vw] sm:w-[60vw] md:w-[calc(33.333%-11px)] snap-start group"
                >
                  <div className="rounded-xl overflow-hidden border border-[#e4beb1]/10 hover:shadow-lg transition-all duration-300 h-full flex flex-col" style={{ backgroundColor: '#ffffff' }}>
                    <div className="relative h-44 md:h-48 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-[14px] font-bold text-[#1a1c1d] mb-1">{item.title}</h3>
                      <p className="text-[12px] text-[#5b4137] leading-relaxed flex-1">{item.description}</p>
                      <button
                        onClick={() => {
                          if (item.action === 'Registrarse') setTab('profile');
                          else setTab('catalog');
                        }}
                        className="mt-3 text-[12px] font-bold uppercase tracking-wide cursor-pointer transition-colors hover:underline"
                        style={{ color: themeColor }}
                      >
                        {item.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex md:hidden justify-center gap-1.5 mt-4">
              {carouselItems.map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#e4beb1' }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: MENU HIGHLIGHTS GRID — Category Cards (Luminous Electric)
          ═══════════════════════════════════════════════════════════ */}
      {categorySections.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  {config.section_categories_title || 'LO MÁS POPULAR'}
                </h3>
                <p className="text-[12px] text-[#8f7065] mt-1">Explora nuestras categorías y ordena lo que más te guste</p>
              </div>
              <button
                onClick={() => setTab('catalog')}
                className="text-[14px] font-semibold cursor-pointer hidden sm:block"
                style={{ color: themeColor }}
              >
                Ver todo el menú →
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible pb-2 md:pb-0">
              {categorySections.map((section) => {
                const bgImage = config.categories_images?.[section.name] || CATEGORY_HERO_BG[section.name.toLowerCase()];
                return (
                  <div
                    key={section.name}
                    className="shrink-0 w-[75vw] sm:w-[45vw] md:w-auto snap-start group"
                  >
                    <div className="rounded-xl overflow-hidden border border-[#e4beb1]/10 hover:shadow-lg transition-all duration-300 h-full flex flex-col" style={{ backgroundColor: '#ffffff' }}>
                      <div className="relative h-40 md:h-44 overflow-hidden">
                        {bgImage ? (
                          <img
                            src={bgImage}
                            alt={section.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{ backgroundColor: '#eeeef0' }}
                          >
                            🍽️
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-[14px] font-bold text-[#1a1c1d] capitalize">{section.name}</h3>
                          <p className="text-[11px] text-[#8f7065] mt-0.5">{section.items.length} productos</p>
                        </div>
                        <button
                          onClick={() => { setSelectedCategory(section.name); setTab('catalog'); }}
                          className="text-white text-[12px] font-bold px-4 py-2 min-h-[40px] rounded-xl transition-all cursor-pointer hover:opacity-90 active:scale-95"
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
          SECTION 4: POPULAR ITEMS — Top ordered products (Luminous Electric)
          ═══════════════════════════════════════════════════════════ */}
      {bestsellerItems.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  {config.section_bestseller_title || 'LO MÁS PEDIDO'}
                </h3>
                <p className="text-[12px] text-[#8f7065] mt-1">Los favoritos de nuestros clientes</p>
              </div>
              <button
                onClick={() => setTab('catalog')}
                className="text-[14px] font-semibold cursor-pointer hidden sm:block"
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
                    onViewProductDetails={(food) => { trackRecentlyViewed(food); onViewProductDetails(food); }}
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
          SECTION: ÚLTIMOS VISTOS — Luminous Electric
          ═══════════════════════════════════════════════════════════ */}
      {recentlyViewed.length > 0 && (
        <section className="w-full py-10 md:py-12" style={{ backgroundColor: '#f9f9fb' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[32px] font-bold text-[#1a1c1d]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
                  Últimos Vistos
                </h3>
                <p className="text-[12px] text-[#8f7065] mt-1">Los productos que viste recientemente</p>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => scrollCarousel(recentCarouselRef, 'left')} className="w-10 h-10 rounded-full border border-[#e4beb1] flex items-center justify-center hover:bg-[#f3f3f5] transition-colors cursor-pointer active:scale-90">
                  <ChevronLeft size={18} className="text-[#1a1c1d]" />
                </button>
                <button onClick={() => scrollCarousel(recentCarouselRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer" style={{ backgroundColor: themeColor, color: '#ffffff' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div ref={recentCarouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
              {recentlyViewed.map((item, idx) => (
                <div key={item.id} className="shrink-0 w-[180px] sm:w-[220px] snap-start">
                  <PremiumProductCard
                    item={item}
                    config={config}
                    onViewProductDetails={(food) => { trackRecentlyViewed(food); onViewProductDetails(food); }}
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
          SECTION 5: REWARDS PROGRAM — Luminous Electric
          ═══════════════════════════════════════════════════════════ */}
      <section className="w-full py-10 md:py-16" style={{ backgroundColor: '#ff5c00' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={config.banners?.[0] || CATEGORY_HERO_BG['combos']}
                  alt="Rewards"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Gift size={18} style={{ color: '#ff5c00' }} />
                    <div>
                      <p className="text-[10px] text-[#8f7065] font-semibold uppercase tracking-wider">Puntos</p>
                      <p className="text-lg font-black text-[#1a1c1d]">0</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 text-white">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {config.section_rewards_title || 'Únete a'}<br />
                <span>RECOMPENSAS</span>
              </h2>
              <p className="text-white/70 text-sm mt-3 max-w-md leading-relaxed">
                {config.section_rewards_description || 'El programa de fidelización más delicioso. Acumula puntos con cada compra y canjéalos por comida gratis.'}
              </p>

              <div className="flex flex-col gap-4 mt-6">
                {[
                  { icon: <Users size={16} />, title: config.rewards_step1_title || 'Regístrate gratis', desc: config.rewards_step1_desc || 'Crea tu cuenta en segundos' },
                  { icon: <ShoppingCart size={16} />, title: config.rewards_step2_title || 'Ordena y acumula', desc: config.rewards_step2_desc || 'Gana puntos con cada pedido' },
                  { icon: <Gift size={16} />, title: config.rewards_step3_title || 'Canjea recompensas', desc: config.rewards_step3_desc || 'Intercambia puntos por comida gratis' },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/20 text-white">
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{step.title}</p>
                      <p className="text-xs text-white/60">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => setTab('profile')}
                  className="text-white font-bold text-sm px-8 py-3 min-h-[48px] rounded-xl inline-flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#1a1c1d' }}
                >
                  ÚNETE AHORA
                </button>
                <button
                  onClick={() => setTab('profile')}
                  className="bg-transparent text-white font-bold text-sm px-8 py-3 min-h-[48px] rounded-xl inline-flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                >
                  INICIAR SESIÓN
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER (incluye FAQ)
          ═══════════════════════════════════════════════════════════ */}
      <Footer config={config} onInstallClick={onInstallClick} onAdminClick={onAdminClick} isAdminAuthenticated={isAdminAuthenticated} />

      {/* ═══════════════════════════════════════════════════════════
          FLOATING CART BUTTON
          ═══════════════════════════════════════════════════════════ */}
      <FloatingCartButton
        itemCount={cartItemCount}
        total={cartTotal}
        onClick={() => setTab('checkout')}
        themeColor={themeColor}
      />
    </div>
  );
};
