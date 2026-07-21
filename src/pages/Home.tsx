import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import {
  ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  Zap, Star, Plus, ShoppingCart, Clock,
  Smartphone, Instagram, Twitter, Facebook,
  MessageCircle, Download, Award, Sparkles,
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
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

const DEFAULT_FAQ = [
  { id: 'faq-1', question: '¿Cuánto tarda mi pedido en llegar?', answer: 'Nuestro tiempo promedio es de 15 a 25 minutos dependiendo de tu ubicación. Contamos con una flota propia optimizada para asegurar que tu comida llegue siempre caliente y fresca.' },
  { id: 'faq-2', question: '¿Tienen opciones vegetarianas o veganas?', answer: '¡Absolutamente! Contamos con la línea "Green Pop" que incluye burgers de NotCo, ensaladas gourmet con ingredientes orgánicos y opciones de sushi vegano.' },
  { id: 'faq-3', question: '¿Cómo puedo aplicar un código de descuento?', answer: 'Al finalizar tu compra en el carrito, verás un campo llamado "Código Promocional". Ingresa tu código ahí y el descuento se aplicará automáticamente al total de tu pedido.' },
  { id: 'faq-4', question: '¿Cuál es el pedido mínimo para delivery?', answer: 'El pedido mínimo para delivery es de $5.00. Para pedidos menores, puedes recoger gratis en nuestro local.' },
  { id: 'faq-5', question: '¿Puedo cambiar o cancelar mi pedido?', answer: 'Puedes cancelar o modificar tu pedido dentro de los primeros 5 minutos después de realizarlo. Después de ese tiempo, el pedido entra en preparación.' },
  { id: 'faq-6', question: '¿Aceptan tarjetas de crédito o débito?', answer: 'Sí, aceptamos todas las tarjetas de crédito y débito Visa, Mastercard y American Express. También aceptamos pagos móviles.' },
];

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
  onViewProductDetails, navigateToCatalog: _navigateToCatalog,
  onInstallClick, onAdminClick, isAdminAuthenticated
}) => {
  const { foodItems, config, cart, addToCart, getProductAverageRating, promotions, isDarkMode } = useApp();
  const tc = config.theme_color || '#FF6B35';

  const activeItems = useMemo(() => foodItems.filter(p => p.activo !== false), [foodItems]);
  const promoItems = useMemo(() => activeItems.filter(p => p.es_promo), [activeItems]);
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);
  const activeCombos = useMemo(() => (config.combos || []).filter(c => c.active), [config.combos]);
  const faqItems = useMemo(() => config.faq_items && config.faq_items.length > 0 ? config.faq_items : DEFAULT_FAQ, [config.faq_items]);
  const categorySections = useMemo(() => (config.categories || []).map(catName => ({
    name: catName, items: activeItems.filter(p => p.categoria.toLowerCase() === catName.toLowerCase()),
  })).filter(s => s.items.length > 0), [activeItems, config.categories]);

  const [heroSlide, setHeroSlide] = useState(0);
  const heroBanners = config.banners.slice(0, 3);
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const [flashTimer, setFlashTimer] = useState({ h: 2, m: 45, s: 12 });
  useEffect(() => {
    const t = setInterval(() => {
      setFlashTimer(p => {
        let { h, m, s } = p;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const heroScrollRef = useRef<HTMLDivElement>(null);

  const snapHeroTo = useCallback((idx: number) => {
    const el = heroScrollRef.current;
    if (!el || !el.children[idx]) return;
    const child = el.children[idx] as HTMLElement;
    el.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const t = setInterval(() => {
      setHeroSlide(p => {
        const next = (p + 1) % heroBanners.length;
        snapHeroTo(next);
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [heroBanners.length, snapHeroTo]);

  const handleHeroScroll = useCallback(() => {
    const el = heroScrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const idx = Math.round(scrollLeft / width);
    setHeroSlide(idx);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const bestRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (ref.current) {
      const amt = ref.current.offsetWidth * 0.75;
      ref.current.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: 'smooth' });
    }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => {
    const ex = i.selected_options?.reduce((e, o) => e + o.precio_usd, 0) || 0;
    return s + (i.item.precio_usd + ex) * i.quantity;
  }, 0);

  const getWhatsApp = () => {
    const a = config.sedes?.filter(s => s.activa);
    return a && a.length > 0 ? a[0].whatsapp_numero || a[0].telefono || config.telefono_soporte : config.telefono_soporte;
  };

  const bg = isDarkMode ? '#0f0f1a' : '#f9f9fb';
  const cardBg = isDarkMode ? '#1a1a2e' : '#ffffff';
  const cardBorder = isDarkMode ? 'rgba(42,42,74,0.6)' : 'rgba(228,190,177,0.15)';
  const text1 = isDarkMode ? '#e8e8f0' : '#1a1c1d';
  const text2 = isDarkMode ? '#a0a0b8' : '#5b4137';
  const surfaceContainer = isDarkMode ? '#16213e' : '#eeeef0';

  const renderStars = (rating: number, size = 12) => {
    const full = Math.floor(rating);
    return (
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} className={i < full ? 'text-amber-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'} fill={i < full ? 'currentColor' : 'none'} />
        ))}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: bg }}>
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* ═══ 1. HERO — Horizontal Swipe Carousel ═══ */}
      <section className="relative w-full overflow-hidden h-[75vh] min-h-[500px] max-h-[900px] md:h-[80vh] md:min-h-[600px] md:max-h-[800px]">
        <div
          ref={heroScrollRef}
          onScroll={handleHeroScroll}
          className="w-full h-full overflow-x-auto no-scrollbar snap-x snap-mandatory flex"
          style={{ scrollBehavior: 'smooth' }}
        >
          {heroBanners.length > 0 ? heroBanners.map((banner, idx) => (
            <div key={idx} className="relative w-full h-full shrink-0 snap-start">
              <img alt="" className="absolute inset-0 w-full h-full object-cover" src={banner} loading={idx === 0 ? 'eager' : 'lazy'} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
              <div className="absolute bottom-8 left-5 right-5 md:bottom-16 md:left-16 md:right-auto md:max-w-2xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-white font-bold text-[10px] uppercase tracking-widest mb-3"
                  style={{ backgroundColor: tc }}>
                  {idx === 0 ? 'NUEVO' : idx === 1 ? 'HOT' : 'BEST'}
                </span>
                <h2 className="text-white font-extrabold text-2xl md:text-5xl leading-[1.05] mb-3"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {config.hero_title || config.site_nombre || 'FoodPop'}
                </h2>
                <p className="text-white/75 text-sm md:text-lg mb-5 max-w-sm md:max-w-md leading-relaxed">
                  {config.hero_subtitle || config.mensaje_bienvenida || 'Tu comida favorita, más rápido que nunca.'}
                </p>
                <button onClick={() => setTab('catalog')} className="text-white font-bold text-sm md:text-base px-7 py-3 md:px-9 md:py-3.5 rounded-xl flex items-center gap-2 shadow-xl active:scale-95 transition-transform"
                  style={{ backgroundColor: tc, boxShadow: `0 8px 30px ${tc}50` }}>
                  {config.hero_cta_text || 'Ordenar Ahora'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )) : <div className="w-full h-full" style={{ backgroundColor: surfaceContainer }} />}
        </div>

        {heroBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {heroBanners.map((_: string, i: number) => (
              <button key={i} onClick={() => { setHeroSlide(i); snapHeroTo(i); }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === heroSlide ? '24px' : '8px',
                  height: '8px',
                  backgroundColor: i === heroSlide ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }} />
            ))}
          </div>
        )}

        {heroBanners.length > 1 && (
          <>
            <button onClick={() => { const prev = (heroSlide - 1 + heroBanners.length) % heroBanners.length; setHeroSlide(prev); snapHeroTo(prev); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-colors hidden md:flex">
              <ChevronLeft size={22} />
            </button>
            <button onClick={() => { const next = (heroSlide + 1) % heroBanners.length; setHeroSlide(next); snapHeroTo(next); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-colors hidden md:flex">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </section>

      {/* ═══ 2. CATEGORY PILLS ═══ */}
      <section className="py-3 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold" style={{ color: text1 }}>Explorar por categorías</h3>
          <div className="hidden md:flex gap-1.5">
            <button onClick={() => scroll(scrollRef, 'left')} className="w-8 h-8 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: cardBorder, color: text2 }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => scroll(scrollRef, 'right')} className="w-8 h-8 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: cardBorder, color: text2 }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {['Todas', ...(config.categories || [])].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); if (cat !== 'Todas') { setSelectedCategory(cat); setTab('catalog'); } }}
                className="px-5 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all shrink-0"
                style={{
                  backgroundColor: isActive ? tc : surfaceContainer,
                  color: isActive ? '#ffffff' : text2,
                  boxShadow: isActive ? `0 4px 12px ${tc}30` : 'none',
                }}>{cat}</button>
            );
          })}
        </div>
      </section>

      {/* ═══ 3. OFERTAS FLASH ═══ */}
      {promoItems.length > 0 && (
        <section className="py-4 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div className="flex justify-between items-end mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1" style={{ color: tc }}>
                <Zap size={14} className="animate-pulse" fill="currentColor" />
                <span className="font-semibold text-[11px] uppercase tracking-tight">
                  Termina en {String(flashTimer.h).padStart(2, '0')}:{String(flashTimer.m).padStart(2, '0')}:{String(flashTimer.s).padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-lg font-bold" style={{ color: text1 }}>Ofertas Flash</h3>
            </div>
            <button onClick={() => setTab('catalog')} className="font-semibold text-xs flex items-center gap-1 transition-all" style={{ color: tc }}>
              Ver Todo <ChevronRight size={14} />
            </button>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {promoItems.slice(0, 6).map((item) => {
              const discount = item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd
                ? Math.round(((item.precio_anterior_usd - item.precio_usd) / item.precio_anterior_usd) * 100) : 0;
              return (
                <div key={item.id} className="rounded-2xl border overflow-hidden group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  onClick={() => onViewProductDetails(item)}>
                  <div className="relative h-40 overflow-hidden">
                    <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {discount > 0 && <div className="absolute top-2 left-2 bg-red-500 text-white font-bold px-2 py-0.5 rounded-lg text-[10px]">-{discount}%</div>}
                    {item.estimated_prep_time && (
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                        <Clock size={10} /> {item.estimated_prep_time}min
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                      style={{ backgroundColor: tc, color: '#fff' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: text2 }}>{item.categoria}</p>
                    <h4 className="text-sm font-bold truncate mb-1" style={{ color: text1 }}>{item.nombre}</h4>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {renderStars(getProductAverageRating(item.id))}
                      <span className="text-[10px] font-medium" style={{ color: text2 }}>{getProductAverageRating(item.id).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                        {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                          <span className="line-through text-[11px]" style={{ color: `${text2}66` }}>${item.precio_anterior_usd.toFixed(2)}</span>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center md:hidden"
                        style={{ backgroundColor: surfaceContainer, color: tc }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Horizontal Carousel */}
          <div ref={offerRef} className="flex md:hidden gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {promoItems.slice(0, 8).map((item) => {
              const discount = item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd
                ? Math.round(((item.precio_anterior_usd - item.precio_usd) / item.precio_anterior_usd) * 100) : 0;
              return (
                <div key={item.id} className="min-w-[155px] rounded-xl border overflow-hidden shrink-0 cursor-pointer"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                  onClick={() => onViewProductDetails(item)}>
                  <div className="relative h-28">
                    <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover" />
                    {discount > 0 && <div className="absolute top-1.5 left-1.5 bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-md text-[9px]">-{discount}%</div>}
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center shadow"
                      style={{ backgroundColor: tc, color: '#fff' }}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[9px] uppercase tracking-wider mb-0.5 truncate" style={{ color: text2 }}>{item.categoria}</p>
                    <h4 className="text-xs font-bold truncate mb-0.5" style={{ color: text1 }}>{item.nombre}</h4>
                    <div className="flex items-center gap-0.5 mb-1">
                      {renderStars(getProductAverageRating(item.id), 9)}
                      <span className="text-[9px]" style={{ color: text2 }}>{getProductAverageRating(item.id).toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                      {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                        <span className="line-through text-[10px]" style={{ color: `${text2}66` }}>${item.precio_anterior_usd.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ 4. LO MÁS PEDIDO ═══ */}
      {bestsellerItems.length > 0 && (
        <section className="py-4 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold" style={{ color: text1 }}>
              {config.section_bestseller_title || 'Lo Más Pedido'}
            </h3>
            <button onClick={() => setTab('catalog')} className="font-semibold text-xs flex items-center gap-1" style={{ color: tc }}>
              Ver todo <ChevronRight size={14} />
            </button>
          </div>
          <div ref={bestRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {bestsellerItems.slice(0, 12).map((item) => (
              <div key={item.id} className="min-w-[145px] rounded-xl border p-2.5 shrink-0 cursor-pointer group transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                onClick={() => onViewProductDetails(item)}>
                <div className="relative h-24 mb-2 overflow-hidden rounded-lg">
                  <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                  {item.es_nuevo && <span className="absolute top-1 left-1 text-[8px] font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: tc }}>NEW</span>}
                </div>
                <p className="text-[9px] uppercase tracking-wider mb-0.5 truncate" style={{ color: text2 }}>{item.categoria}</p>
                <h4 className="text-xs font-bold truncate mb-1" style={{ color: text1 }}>{item.nombre}</h4>
                <div className="flex items-center gap-0.5 mb-1">
                  {renderStars(getProductAverageRating(item.id), 8)}
                  <span className="text-[8px]" style={{ color: text2 }}>{getProductAverageRating(item.id).toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: surfaceContainer, color: tc }}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 5. NUESTROS DESTACADOS — Bento Grid ═══ */}
      {categorySections.length > 0 && (
        <section className="py-4 px-4 md:px-8 w-full" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#ffffff' }}>
          <div className="max-w-[1440px] mx-auto">
            <h3 className="text-lg font-bold mb-3" style={{ color: text1 }}>Nuestros Destacados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {categorySections[0] && (
                <div className="md:col-span-2 h-44 md:h-56 relative rounded-2xl overflow-hidden group cursor-pointer"
                  onClick={() => { setSelectedCategory(categorySections[0].name); setTab('catalog'); }}>
                  <img src={config.categories_images?.[categorySections[0].name] || CATEGORY_HERO_BG[categorySections[0].name.toLowerCase()] || ''} alt={categorySections[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <h4 className="text-white font-bold text-lg">{categorySections[0].name}</h4>
                    <p className="text-white/60 text-xs">{categorySections[0].items.length} productos disponibles</p>
                  </div>
                </div>
              )}
              {categorySections[1] && (
                <div className="h-44 md:h-56 relative rounded-2xl overflow-hidden group cursor-pointer"
                  onClick={() => { setSelectedCategory(categorySections[1].name); setTab('catalog'); }}>
                  <img src={config.categories_images?.[categorySections[1].name] || CATEGORY_HERO_BG[categorySections[1].name.toLowerCase()] || ''} alt={categorySections[1].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ backgroundColor: `${tc}33`, backdropFilter: 'blur(2px)' }}>
                    <h4 className="text-white font-bold text-lg">{categorySections[1].name}</h4>
                    <p className="text-white/70 text-xs">{categorySections[1].items.length} productos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 6. COMBOS EXPLOSIVOS ═══ */}
      {activeCombos.length > 0 && (
        <section className="py-4 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold" style={{ color: text1 }}>Combos Explosivos</h3>
            <div className="flex gap-1.5">
              <button onClick={() => scroll(comboRef, 'left')} className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: cardBorder, color: text1 }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => scroll(comboRef, 'right')} className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow" style={{ backgroundColor: tc }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCombos.map((combo) => {
              const prods = combo.product_ids.map(id => activeItems.find(p => p.id === id)).filter(Boolean) as FoodItem[];
              const img = combo.imagen_url || prods[0]?.imagen_urls?.[0] || '';
              return (
                <div key={combo.id} className="flex rounded-2xl border overflow-hidden h-36 transition-all hover:-translate-y-1 group cursor-pointer"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                  <div className="w-1/3 relative overflow-hidden">
                    {img ? <img src={img} alt={combo.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: surfaceContainer }}>🎁</div>}
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-center">
                    <h5 className="text-sm font-bold mb-1 truncate" style={{ color: text1 }}>{combo.nombre}</h5>
                    <p className="text-[11px] mb-3 line-clamp-2" style={{ color: text2 }}>{combo.descripcion}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="font-bold text-base" style={{ color: tc }}>-{combo.discount_percent}%</span>
                      <button onClick={(e) => { e.stopPropagation(); setTab('catalog'); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:text-white"
                        style={{ backgroundColor: surfaceContainer, color: tc }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = surfaceContainer; e.currentTarget.style.color = tc; }}>
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile: Horizontal Carousel */}
          <div ref={comboRef} className="flex md:hidden gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
            {activeCombos.map((combo) => {
              const prods = combo.product_ids.map(id => activeItems.find(p => p.id === id)).filter(Boolean) as FoodItem[];
              const img = combo.imagen_url || prods[0]?.imagen_urls?.[0] || '';
              return (
                <div key={combo.id} className="flex min-w-[240px] rounded-xl border overflow-hidden h-32 shrink-0"
                  style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                  <div className="w-1/3">
                    {img ? <img src={img} alt={combo.nombre} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: surfaceContainer }}>🎁</div>}
                  </div>
                  <div className="w-2/3 p-3 flex flex-col justify-center">
                    <h5 className="text-sm font-bold mb-0.5 truncate" style={{ color: text1 }}>{combo.nombre}</h5>
                    <p className="text-[10px] mb-2 line-clamp-2" style={{ color: text2 }}>{combo.descripcion}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: tc }}>-{combo.discount_percent}%</span>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: surfaceContainer, color: tc }}>
                        <ShoppingCart size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ 7. BRAND EXPERIENCE ═══ */}
      <section className="py-12 md:py-16 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#2f3132' }}>
        <div className="absolute top-1/4 -right-16 w-80 h-80 rounded-full blur-[120px] opacity-10" style={{ backgroundColor: tc }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full blur-[100px] opacity-10" style={{ backgroundColor: tc }} />
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10">
          <div className="order-2 lg:order-1">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 relative group">
              <img src={config.banners?.[0] || CATEGORY_HERO_BG['combos']} alt="Brand"
                className="w-full h-full object-cover md:grayscale md:opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="absolute inset-0 group-hover:bg-transparent transition-all" style={{ backgroundColor: `${tc}10`, mixBlendMode: 'overlay' }} />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-white font-extrabold mb-6 text-2xl md:text-4xl leading-tight">
              {config.brand_section_title || 'Más que comida,'}<br /><span style={{ color: tc }}>{config.brand_section_subtitle || 'es una experiencia.'}</span>
            </h2>
            <p className="text-white/50 mb-8 text-sm md:text-base leading-relaxed max-w-md">
              Nacimos para romper las reglas de la comida rápida. Ingredientes de primera, tecnología de punta y una obsesión por la frescura absoluta en cada entrega.
            </p>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="font-extrabold leading-none mb-2 text-3xl md:text-5xl" style={{ color: tc }}>{config.brand_stat1_value || '15min'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{config.brand_stat1_label || 'Entrega Promedio'}</p>
              </div>
              <div>
                <p className="font-extrabold leading-none mb-2 text-3xl md:text-5xl" style={{ color: tc }}>{config.brand_stat2_value || '100%'}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{config.brand_stat2_label || 'Ingredientes Frescos'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-9 h-9 rounded-full border-2 border-gray-800 bg-gray-700" />
                <div className="w-9 h-9 rounded-full border-2 border-gray-800 bg-gray-600" />
                <div className="w-9 h-9 rounded-full border-2 border-gray-800 flex items-center justify-center text-[9px] font-bold text-white bg-gray-500">{config.brand_users_count || '+50k'}</div>
              </div>
              <p className="text-white/50 text-xs">Usuarios activos disfrutan de la app a diario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 8. PWA DOWNLOAD INVITATION ═══ */}
      <section className="py-6 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden" style={{ backgroundColor: tc }}>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-white/80 font-semibold text-[10px] uppercase tracking-widest">Exclusivo Móvil</span>
              </div>
              <h3 className="text-lg md:text-xl font-extrabold mb-2">
                Descarga la app en tu móvil
              </h3>
              <p className="text-white/75 mb-4 text-xs md:text-sm max-w-md">
                Instálala directamente desde tu navegador y estate al tanto de nuestras promociones exclusivas. Sin descargas pesadas, directo a tu pantalla de inicio.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={onInstallClick} className="h-10 bg-black text-white rounded-lg px-5 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-colors font-bold text-xs">
                  <Download size={16} />
                  Instalar App Web
                </button>
                <p className="text-[10px] text-white/60 flex items-center gap-1">
                  <Smartphone size={12} />
                  Funciona como una app nativa en tu celular
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-sm shrink-0">
              <Smartphone size={36} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. GANA Y ACUMULA PUNTOS ═══ */}
      <section className="py-6 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <div className="rounded-2xl p-6 md:p-8 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#2f3132' }}>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ backgroundColor: tc }} />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Award size={16} style={{ color: tc }} />
              <span className="font-semibold text-[10px] uppercase tracking-widest" style={{ color: tc }}>Programa de Fidelidad</span>
            </div>
            <h3 className="text-lg md:text-xl font-extrabold mb-2 text-white">
              Gana y acumula puntos por tu compra
            </h3>
            <p className="text-white/50 mb-6 text-xs md:text-sm max-w-lg">
              En cada pedido que realices acumularás puntos canjeables por comida gratis, descuentos exclusivos y beneficios especiales.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { icon: '🍔', title: '2x Puntos', desc: 'En tu primer pedido' },
                { icon: '⭐', title: 'Puntos Extra', desc: 'En días especiales' },
                { icon: '🎁', title: 'Canjea', desc: 'Por comida gratis' },
                { icon: '🚀', title: 'Niveles VIP', desc: 'Beneficios Premium' },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ backgroundColor: isDarkMode ? '#16213e' : 'rgba(255,255,255,0.08)' }}>
                  <span className="text-xl mb-1.5 block">{item.icon}</span>
                  <p className="text-white font-bold text-xs mb-0.5">{item.title}</p>
                  <p className="text-white/40 text-[10px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10. RECOMENDADOS PARA TI ═══ */}
      {bestsellerItems.length > 0 && (
        <section className="py-4 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
          <h3 className="text-lg font-bold mb-3" style={{ color: text1 }}>Recomendados para ti</h3>
          <div ref={recRef} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {bestsellerItems.slice(0, 8).map((item) => (
              <div key={item.id} className="min-w-[165px] h-20 rounded-xl flex items-center p-2 gap-2.5 shrink-0 cursor-pointer group transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: surfaceContainer }}
                onClick={() => onViewProductDetails(item)}>
                <div className="w-14 h-14 rounded-lg shrink-0 overflow-hidden">
                  <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold truncate mb-0.5" style={{ color: text1 }}>{item.nombre}</p>
                  <div className="flex items-center gap-1">
                    {renderStars(getProductAverageRating(item.id), 8)}
                    <span className="text-[8px]" style={{ color: text2 }}>{getProductAverageRating(item.id).toFixed(1)}</span>
                  </div>
                  <p className="text-xs font-bold mt-0.5" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isDarkMode ? '#0f0f1a' : '#ffffff', color: tc }}>
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 11. FAQ ACCORDION ═══ */}
      <section className="py-8 px-4 md:px-8 max-w-3xl mx-auto w-full">
        <h3 className="text-lg md:text-xl text-center mb-2 font-bold" style={{ color: text1 }}>Preguntas Frecuentes</h3>
        <p className="text-center mb-6 text-xs" style={{ color: text2 }}>Todo lo que necesitas saber sobre nuestro servicio.</p>
        <div className="space-y-2">
          {faqItems.map((item) => (
            <div key={item.id} className="rounded-xl border overflow-hidden transition-all"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <button className="w-full px-4 py-3 flex justify-between items-center text-left"
                onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                <span className="text-sm font-bold pr-3" style={{ color: text1 }}>{item.question}</span>
                <ChevronDown size={18} className="shrink-0 transition-transform duration-300" style={{ color: tc, transform: openFaq === item.id ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: openFaq === item.id ? '120px' : '0' }}>
                <div className="px-4 pb-3 pt-0" style={{ color: text2 }}>
                  <div className="border-t pt-2" style={{ borderColor: cardBorder }}>
                    <p className="leading-relaxed text-xs">{item.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 12. FOOTER ═══ */}
      <footer className="py-8 md:py-12 px-4 md:px-8 border-t" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#f3f3f5', borderColor: cardBorder }}>
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mb-8">
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            {config.logo_url ? <img src={config.logo_url} alt={config.site_nombre} className="h-7 w-auto mb-4" />
              : <h4 className="text-base font-extrabold mb-4" style={{ color: tc }}>{config.site_nombre || 'FOODPOP'}</h4>}
            <p className="text-[11px] leading-relaxed mb-4" style={{ color: text2 }}>
              {config.footer_about_text || 'Redefiniendo el delivery de comida rápida con calidad premium y tecnología de punta.'}
            </p>
            <div className="flex gap-2">
              {config.instagram_url && <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Instagram size={14} /></a>}
              {config.twitter_url && <a href={config.twitter_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Twitter size={14} /></a>}
              {config.facebook_url && <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Facebook size={14} /></a>}
            </div>
          </div>
          <div>
            <h5 className="font-bold mb-3 uppercase tracking-widest text-[10px]" style={{ color: text1 }}>Menú</h5>
            <ul className="space-y-2 text-[11px]" style={{ color: text2 }}>
              {(config.categories || []).slice(0, 5).map((cat) => (
                <li key={cat}><button onClick={() => { setSelectedCategory(cat); setTab('catalog'); }} className="hover:opacity-80 transition-colors">{cat}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-3 uppercase tracking-widest text-[10px]" style={{ color: text1 }}>Compañía</h5>
            <ul className="space-y-2 text-[11px]" style={{ color: text2 }}>
              <li><button onClick={() => setTab('profile')} className="hover:opacity-80 transition-colors">Sobre Nosotros</button></li>
              <li><button className="hover:opacity-80 transition-colors">Blog de Comida</button></li>
              <li><button className="hover:opacity-80 transition-colors">Sostenibilidad</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-3 uppercase tracking-widest text-[10px]" style={{ color: text1 }}>Soporte</h5>
            <ul className="space-y-2 text-[11px]" style={{ color: text2 }}>
              <li><a href={`https://wa.me/${getWhatsApp().replace(/[+ ]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-colors flex items-center gap-1.5"><MessageCircle size={11} className="text-green-500" /> WhatsApp</a></li>
              <li><button className="hover:opacity-80 transition-colors">Términos de Servicio</button></li>
              <li><button className="hover:opacity-80 transition-colors">Privacidad</button></li>
              {onAdminClick && <li><button onClick={onAdminClick} className="hover:opacity-80 transition-colors">{isAdminAuthenticated ? 'Admin ✓' : 'Admin'}</button></li>}
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto pt-4 border-t flex flex-col md:flex-row justify-between items-center gap-2 text-[10px]"
          style={{ borderColor: cardBorder, color: isDarkMode ? '#5a5a7a' : '#8f7065' }}>
          <p>© {new Date().getFullYear()} {config.footer_copyright || config.site_nombre || 'FOODPOP'}. Todos los derechos reservados.</p>
          <div className="flex gap-4"><span>{config.direccion_fisica || 'Bogotá • CDMX • Madrid'}</span></div>
        </div>
      </footer>

      {/* ═══ 13. FLOATING CART ═══ */}
      <FloatingCartButton itemCount={cartCount} total={cartTotal} onClick={() => setTab('checkout')} themeColor={tc} />
    </div>
  );
};
