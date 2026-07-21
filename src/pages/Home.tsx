import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import {
  ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  Zap, Star, Users, Gift, Plus, ShoppingCart,
  Smartphone, MessageCircle, Instagram, Twitter, Facebook,
  Download, Star as StarIcon, Award, Sparkles,
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
  const { foodItems, config, cart, addToCart, getProductAverageRating, getProductReviews, promotions, isDarkMode } = useApp();
  const tc = config.theme_color || '#FF6B35';

  const activePromotions = useMemo(() => {
    const now = new Date().toISOString();
    return (promotions || []).filter(p => p.status === 'active' && (!p.start_date || p.start_date <= now) && (!p.end_date || p.end_date >= now));
  }, [promotions]);

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
  const [heroVerticalIdx, setHeroVerticalIdx] = useState(0);
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

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const t = setInterval(() => setHeroSlide(p => (p + 1) % heroBanners.length), 5000);
    return () => clearInterval(t);
  }, [heroBanners.length]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const offerRef = useRef<HTMLDivElement>(null);
  const comboRef = useRef<HTMLDivElement>(null);
  const bestRef = useRef<HTMLDivElement>(null);

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
  const cardBorder = isDarkMode ? 'rgba(42,42,74,0.6)' : 'rgba(228,190,177,0.1)';
  const text1 = isDarkMode ? '#e8e8f0' : '#1a1c1d';
  const text2 = isDarkMode ? '#a0a0b8' : '#5b4137';
  const surfaceContainer = isDarkMode ? '#16213e' : '#eeeef0';

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* ═══ HERO MOBILE — Vertical Scroll Carousel ═══ */}
      <section className="md:hidden relative h-[700px] overflow-hidden">
        <div className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory"
          onScroll={(e) => {
            const idx = Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight);
            setHeroVerticalIdx(idx);
          }}>
          {heroBanners.length > 0 ? heroBanners.map((banner, idx) => (
            <div key={idx} className="relative h-[700px] w-full shrink-0 snap-start">
              <img alt="" className="absolute inset-0 w-full h-full object-cover" src={banner} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-16 left-0 right-0 px-8">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-white font-semibold text-[11px] uppercase tracking-widest mb-4"
                  style={{ backgroundColor: tc }}>NUEVO</span>
                <h2 className="text-white font-extrabold text-[44px] leading-none mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {config.hero_title || config.site_nombre || 'FoodPop'}
                </h2>
                <p className="text-white/80 max-w-xs mb-8 text-base">
                  {config.hero_subtitle || config.mensaje_bienvenida || 'La explosión de sabor que estabas esperando.'}
                </p>
                <button onClick={() => setTab('catalog')} className="text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-xl"
                  style={{ backgroundColor: tc, boxShadow: `0 8px 24px ${tc}40` }}>
                  {config.hero_cta_text || 'Ordenar Ahora'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )) : <div className="h-[700px] w-full" style={{ backgroundColor: surfaceContainer }} />}
        </div>
        {heroBanners.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {heroBanners.map((_: string, i: number) => (
              <div key={i} className="rounded-full transition-all duration-300"
                style={{ width: '6px', height: i === heroVerticalIdx ? '24px' : '6px', backgroundColor: i === heroVerticalIdx ? tc : 'rgba(255,255,255,0.4)' }} />
            ))}
          </div>
        )}
      </section>

      {/* ═══ HERO DESKTOP — Carousel with rounded-[3rem] ═══ */}
      <section className="hidden md:block w-full px-16 py-10 max-w-[1440px] mx-auto">
        <div className="relative h-[600px] rounded-[3rem] overflow-hidden group shadow-2xl">
          {heroBanners.length > 0 ? (
            <div className="absolute inset-0 flex h-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
              {heroBanners.map((b: string, i: number) => (
                <img key={i} src={b} alt="" className="w-full h-full object-cover shrink-0 group-hover:scale-105 transition-transform duration-[2000ms]" loading={i === 0 ? 'eager' : 'lazy'} />
              ))}
            </div>
          ) : <div className="absolute inset-0" style={{ backgroundColor: surfaceContainer }} />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-20 max-w-3xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-semibold text-xs uppercase tracking-widest"
                style={{ backgroundColor: `${tc}e6` }}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Lo más nuevo
              </span>
              <span className="text-white/60 text-sm font-semibold">Disponible solo esta semana</span>
            </div>
            <h2 className="text-white font-extrabold mb-6" style={{ fontSize: '72px', lineHeight: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {config.hero_title || 'Bacon Bomb'}<br /><span style={{ color: tc }}>{config.hero_subtitle || 'Max Edition'}</span>
            </h2>
            <p className="text-white/80 max-w-lg mb-10 text-lg leading-relaxed">
              {config.mensaje_bienvenida || 'Experimenta la explosión definitiva de sabor con nuestra nueva creación. Ingredientes premium con un 20% de descuento por lanzamiento.'}
            </p>
            <div className="flex gap-4">
              <button onClick={() => setTab('catalog')} className="text-white font-bold px-10 py-5 rounded-2xl flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all"
                style={{ backgroundColor: tc }}>
                {config.hero_cta_text || 'Ordenar Ahora'} <ArrowRight size={20} />
              </button>
              <button onClick={() => setTab('catalog')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-bold hover:bg-white/20 transition-all">
                Ver Detalles
              </button>
            </div>
          </div>
          {heroBanners.length > 1 && (
            <div className="absolute right-12 bottom-12 flex flex-col gap-3">
              {heroBanners.map((_: string, i: number) => (
                <div key={i} className="rounded-full cursor-pointer transition-all duration-300"
                  style={{ width: '8px', height: i === heroSlide ? '40px' : '8px', backgroundColor: i === heroSlide ? tc : 'rgba(255,255,255,0.3)' }}
                  onClick={() => setHeroSlide(i)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ CATEGORIES — Pills Carousel ═══ */}
      <section className="py-8 px-4 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[24px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>Explorar por categorías</h3>
          <div className="hidden md:flex gap-2">
            <button onClick={() => scroll(scrollRef, 'left')} className="w-10 h-10 rounded-full border flex items-center justify-center transition-all opacity-50 cursor-not-allowed" style={{ borderColor: isDarkMode ? '#2a2a4a' : '#e4beb1', color: text2 }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(scrollRef, 'right')} className="w-10 h-10 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: isDarkMode ? '#2a2a4a' : '#e4beb1', color: text2 }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {['Todas', ...(config.categories || [])].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); if (cat !== 'Todas') { setSelectedCategory(cat); setTab('catalog'); } }}
                className="px-8 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all shrink-0"
                style={{
                  backgroundColor: isActive ? tc : surfaceContainer,
                  color: isActive ? '#ffffff' : text2,
                  boxShadow: isActive ? `0 8px 20px ${tc}30` : 'none',
                }}>{cat}</button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN 12-COL GRID ═══ */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-16 w-full grid grid-cols-12 gap-12 py-12">

        {/* LEFT: 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-16">

          {/* ═══ OFERTAS FLASH ═══ */}
          {promoItems.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2" style={{ color: tc }}>
                    <Zap size={20} className="animate-pulse" fill="currentColor" />
                    <span className="font-semibold text-sm uppercase tracking-tighter">
                      Termina en {String(flashTimer.h).padStart(2, '0')}:{String(flashTimer.m).padStart(2, '0')}:{String(flashTimer.s).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-[32px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>Ofertas Flash</h3>
                </div>
                <button onClick={() => setTab('catalog')} className="font-semibold flex items-center gap-2 hover:gap-3 transition-all" style={{ color: tc }}>
                  Ver Todo <ChevronRight size={18} />
                </button>
              </div>
              {/* Desktop: Grid 2 cols */}
              <div className="hidden md:grid grid-cols-2 gap-8">
                {promoItems.slice(0, 4).map((item) => {
                  const discount = item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd
                    ? Math.round(((item.precio_anterior_usd - item.precio_usd) / item.precio_anterior_usd) * 100) : 0;
                  return (
                    <div key={item.id} className="rounded-[2rem] border overflow-hidden group cursor-pointer transition-all hover:shadow-xl"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      onClick={() => onViewProductDetails(item)}>
                      <div className="relative h-64 overflow-hidden">
                        <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        {discount > 0 && <div className="absolute top-6 left-6 bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-xl">-{discount}% OFF</div>}
                        <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                          className="absolute bottom-6 right-6 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all transform translate-y-20 group-hover:translate-y-0 duration-300"
                          style={{ color: tc }}>
                          <ShoppingCart size={20} />
                        </button>
                      </div>
                      <div className="p-8">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold" style={{ color: text1 }}>{item.nombre}</h4>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={14} fill="currentColor" /><span className="text-xs font-bold">{getProductAverageRating(item.id).toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm mb-6" style={{ color: text2 }}>{item.descripcion}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-2xl" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                          {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                            <span className="line-through text-base font-medium" style={{ color: `${text2}66` }}>${item.precio_anterior_usd.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Mobile: Horizontal Carousel */}
              <div ref={offerRef} className="flex md:hidden gap-5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {promoItems.slice(0, 6).map((item) => {
                  const discount = item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd
                    ? Math.round(((item.precio_anterior_usd - item.precio_usd) / item.precio_anterior_usd) * 100) : 0;
                  return (
                    <div key={item.id} className="min-w-[260px] rounded-2xl border overflow-hidden shrink-0 cursor-pointer"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                      onClick={() => onViewProductDetails(item)}>
                      <div className="relative h-44">
                        <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover" />
                        {discount > 0 && <div className="absolute top-3 left-3 bg-red-600 text-white font-bold px-2 py-1 rounded-lg text-[11px] shadow-lg">-{discount}%</div>}
                      </div>
                      <div className="p-4">
                        <h4 className="text-[16px] font-bold mb-1 truncate" style={{ color: text1 }}>{item.nombre}</h4>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                          {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                            <span className="line-through text-xs font-medium" style={{ color: `${text2}66` }}>${item.precio_anterior_usd.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ═══ COMBOS EXPLOSIVOS ═══ */}
          {activeCombos.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[32px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>Combos Explosivos</h3>
                <div className="flex gap-2">
                  <button onClick={() => scroll(comboRef, 'left')} className="w-10 h-10 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: isDarkMode ? '#2a2a4a' : '#e4beb1', color: text1 }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => scroll(comboRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20" style={{ backgroundColor: tc }}>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              {/* Desktop: Grid 2 cols */}
              <div className="hidden md:grid grid-cols-2 gap-8">
                {activeCombos.map((combo) => {
                  const prods = combo.product_ids.map(id => activeItems.find(p => p.id === id)).filter(Boolean) as FoodItem[];
                  const img = combo.imagen_url || prods[0]?.imagen_urls?.[0] || '';
                  return (
                    <div key={combo.id} className="flex rounded-[2rem] border overflow-hidden h-52 transition-all hover:-translate-y-2 group cursor-pointer"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                      <div className="w-2/5 relative overflow-hidden">
                        {img ? <img src={img} alt={combo.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: surfaceContainer }}>🎁</div>}
                      </div>
                      <div className="w-3/5 p-8 flex flex-col justify-center">
                        <h5 className="text-xl font-bold mb-2" style={{ color: text1 }}>{combo.nombre}</h5>
                        <p className="text-sm mb-6" style={{ color: `${text2}cc` }}>{combo.descripcion}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-bold text-2xl" style={{ color: tc }}>-{combo.discount_percent}%</span>
                          <button onClick={(e) => { e.stopPropagation(); setTab('catalog'); }}
                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:text-white"
                            style={{ backgroundColor: surfaceContainer, color: tc }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = surfaceContainer; e.currentTarget.style.color = tc; }}>
                            <ShoppingCart size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Mobile: Horizontal Carousel */}
              <div ref={comboRef} className="flex md:hidden gap-5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4">
                {activeCombos.map((combo) => {
                  const prods = combo.product_ids.map(id => activeItems.find(p => p.id === id)).filter(Boolean) as FoodItem[];
                  const img = combo.imagen_url || prods[0]?.imagen_urls?.[0] || '';
                  return (
                    <div key={combo.id} className="flex min-w-[300px] rounded-2xl border overflow-hidden h-44 shrink-0"
                      style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                      <div className="w-1/3">
                        {img ? <img src={img} alt={combo.nombre} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: surfaceContainer }}>🎁</div>}
                      </div>
                      <div className="w-2/3 p-5 flex flex-col justify-center">
                        <h5 className="text-lg font-bold mb-1" style={{ color: text1 }}>{combo.nombre}</h5>
                        <p className="text-xs mb-3" style={{ color: `${text2}b3` }}>{combo.descripcion}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xl" style={{ color: tc }}>-{combo.discount_percent}%</span>
                          <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: surfaceContainer, color: tc }}>
                            <ShoppingCart size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ═══ RIGHT SIDEBAR — 4 cols Sticky ═══ */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 space-y-10">
            {/* Recomendados */}
            <div className="rounded-[2.5rem] p-8 border" style={{ backgroundColor: isDarkMode ? '#12122a' : '#f3f3f5', borderColor: cardBorder }}>
              <h4 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: text1 }}>
                <Gift size={20} style={{ color: tc }} /> Recomendados para ti
              </h4>
              <div className="space-y-6">
                {bestsellerItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 cursor-pointer group" onClick={() => onViewProductDetails(item)}>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                      <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: text1 }}>{item.nombre}</p>
                      <p className="text-xs" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:text-white"
                      style={{ backgroundColor: isDarkMode ? '#16213e' : '#ffffff', color: tc }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tc; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? '#16213e' : '#ffffff'; e.currentTarget.style.color = tc; }}>
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setTab('catalog')} className="w-full mt-8 py-4 border-2 rounded-2xl font-semibold transition-all hover:opacity-80"
                style={{ borderColor: `${tc}33`, color: tc }}>Ver Más Sugerencias</button>
            </div>

            {/* App Download */}
            <div className="rounded-[2.5rem] p-8 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#2f3132' }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: `${tc}20` }} />
              <h4 className="text-lg font-bold mb-4 relative z-10 text-white">Instala nuestra Web App</h4>
              <p className="text-white/60 text-sm mb-8 relative z-10">Acceso instantáneo y beneficios exclusivos. ¡Gana el doble de puntos!</p>
              <button onClick={onInstallClick} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-white relative z-10 transition-all hover:opacity-90"
                style={{ backgroundColor: tc, boxShadow: `0 8px 20px ${tc}40` }}>
                <Smartphone size={18} /> Instalar Web App
              </button>
              <div className="flex items-center gap-3 px-2 mt-4 relative z-10">
                <Star size={14} className="text-amber-400" fill="currentColor" />
                <span className="text-xs text-white/80">+500 puntos de bienvenida</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ LO MÁS PEDIDO — Carousel ═══ */}
      {bestsellerItems.length > 0 && (
        <section className="py-12 px-4 md:px-16 max-w-[1440px] mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[32px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>
              {config.section_bestseller_title || 'Lo Más Pedido'}
            </h3>
          </div>
          <div ref={bestRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {bestsellerItems.slice(0, 10).map((item) => (
              <div key={item.id} className="min-w-[160px] rounded-2xl p-4 border shrink-0 cursor-pointer group transition-all hover:-translate-y-1"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
                onClick={() => onViewProductDetails(item)}>
                <div className="h-32 mb-4 overflow-hidden">
                  <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h4 className="text-sm font-bold truncate" style={{ color: text1 }}>{item.nombre}</h4>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold" style={{ color: tc }}>${item.precio_usd.toFixed(2)}</span>
                  <button onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                    className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: surfaceContainer, color: tc }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ BENTO GRID DESTACADOS ═══ */}
      {categorySections.length > 0 && (
        <section className="py-12 px-4 md:px-16 w-full" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#ffffff' }}>
          <div className="max-w-[1440px] mx-auto">
            <h3 className="text-[32px] font-bold mb-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>Nuestros Destacados</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categorySections[0] && (
                <div className="md:col-span-2 h-72 relative rounded-[2rem] overflow-hidden group cursor-pointer"
                  onClick={() => { setSelectedCategory(categorySections[0].name); setTab('catalog'); }}>
                  <img src={config.categories_images?.[categorySections[0].name] || CATEGORY_HERO_BG[categorySections[0].name.toLowerCase()] || ''} alt={categorySections[0].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                    <h4 className="text-white font-bold text-[24px]">{categorySections[0].name}</h4>
                    <p className="text-white/70 text-[15px]">{categorySections[0].items.length} productos disponibles</p>
                  </div>
                </div>
              )}
              {categorySections[1] && (
                <div className="h-72 relative rounded-[2rem] overflow-hidden group cursor-pointer"
                  onClick={() => { setSelectedCategory(categorySections[1].name); setTab('catalog'); }}>
                  <img src={config.categories_images?.[categorySections[1].name] || CATEGORY_HERO_BG[categorySections[1].name.toLowerCase()] || ''} alt={categorySections[1].name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8" style={{ backgroundColor: `${tc}33`, backdropFilter: 'blur(2px)' }}>
                    <h4 className="text-white font-bold text-[24px]">{categorySections[1].name}</h4>
                    <p className="text-white/80 text-[15px]">{categorySections[1].items.length} productos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BRAND EXPERIENCE ═══ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#2f3132' }}>
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full blur-[150px]" style={{ backgroundColor: `${tc}10` }} />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: `${tc}10` }} />
        <div className="max-w-[1440px] mx-auto px-4 md:px-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-24 relative z-10">
          <div className="order-2 lg:order-1">
            <div className="aspect-[4/3] lg:aspect-square rounded-[4rem] overflow-hidden border border-white/10 relative group">
              <img src={config.banners?.[0] || CATEGORY_HERO_BG['combos']} alt="Brand"
                className="w-full h-full object-cover md:grayscale md:opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
              <div className="absolute inset-0 group-hover:bg-transparent transition-all" style={{ backgroundColor: `${tc}10`, mixBlendMode: 'overlay' }} />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-white font-extrabold mb-8" style={{ fontSize: 'clamp(32px, 4vw, 64px)', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {config.brand_section_title || 'Más que comida,'}<br /><span style={{ color: tc }}>{config.brand_section_subtitle || 'es una experiencia.'}</span>
            </h2>
            <p className="text-white/50 mb-12 text-xl leading-relaxed max-w-xl">
              Nacimos para romper las reglas de la comida rápida. Ingredientes de primera, tecnología de punta y una obsesión por la frescura absoluta en cada entrega.
            </p>
            <div className="grid grid-cols-2 gap-16">
              <div>
                <p className="font-extrabold leading-none mb-4" style={{ fontSize: '56px', color: tc }}>{config.brand_stat1_value || '15min'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{config.brand_stat1_label || 'Entrega Promedio'}</p>
              </div>
              <div>
                <p className="font-extrabold leading-none mb-4" style={{ fontSize: '56px', color: tc }}>{config.brand_stat2_value || '100%'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{config.brand_stat2_label || 'Ingredientes Frescos'}</p>
              </div>
            </div>
            <div className="mt-16 flex items-center gap-6">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-700" />
                <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-600" />
                <div className="w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white bg-gray-500">{config.brand_users_count || '+50k'}</div>
              </div>
              <p className="text-white/60 text-sm">Usuarios activos disfrutan de la app a diario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PWA DOWNLOAD INVITATION ═══ */}
      <section className="py-12 px-4 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden" style={{ backgroundColor: tc }}>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={20} className="text-white" />
                <span className="text-white/80 font-semibold text-xs uppercase tracking-widest">Exclusivo Móvil</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Descarga la app en tu móvil
              </h3>
              <p className="text-white/80 mb-6 text-sm md:text-base max-w-md">
                Instálala directamente desde tu navegador y estate al tanto de nuestras promociones exclusivas. Sin descargas pesadas, directo a tu pantalla de inicio.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onInstallClick} className="h-12 bg-black text-white rounded-xl px-6 flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-colors font-bold text-sm">
                  <Download size={18} />
                  Instalar App Web
                </button>
                <p className="text-[11px] text-white/60 flex items-center gap-1">
                  <Smartphone size={14} />
                  Funciona como una app nativa en tu celular
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center w-32 h-32 rounded-3xl bg-white/10 backdrop-blur-sm">
              <Smartphone size={48} className="text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GANA Y ACUMULA PUNTOS ═══ */}
      <section className="py-12 px-4 md:px-16 max-w-[1440px] mx-auto w-full">
        <div className="rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#2f3132' }}>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: `${tc}20` }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} style={{ color: tc }} />
              <span className="font-semibold text-xs uppercase tracking-widest" style={{ color: tc }}>Programa de Fidelidad</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3 text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Gana y acumula puntos por tu compra
            </h3>
            <p className="text-white/60 mb-8 text-sm md:text-base max-w-lg">
              En cada pedido que realices acumularás puntos canjeables por comida gratis, descuentos exclusivos y beneficios especiales. ¡Tu fidelidad tiene recompensa!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🍔', title: '2x Puntos', desc: 'En tu primer pedido' },
                { icon: '⭐', title: 'Puntos Extra', desc: 'En días especiales' },
                { icon: '🎁', title: 'Canjea', desc: 'Por comida gratis' },
                { icon: '🚀', title: 'Niveles VIP', desc: 'Beneficios Premium' },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl p-4 text-center" style={{ backgroundColor: isDarkMode ? '#16213e' : 'rgba(255,255,255,0.08)' }}>
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <p className="text-white font-bold text-sm mb-1">{item.title}</p>
                  <p className="text-white/50 text-[11px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ RECOMENDADOS PARA TI — Mobile ═══ */}
      {bestsellerItems.length > 0 && (
        <section className="py-12 px-4 md:px-16 max-w-[1440px] mx-auto w-full">
          <h3 className="text-[24px] font-bold mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>
            Recomendados para ti
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {bestsellerItems.slice(0, 6).map((item) => (
              <div key={item.id} className="min-w-[200px] h-24 rounded-2xl flex items-center p-3 gap-3 shrink-0 cursor-pointer group transition-all hover:-translate-y-1"
                style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#eeeef0' }}
                onClick={() => onViewProductDetails(item)}>
                <div className="w-16 h-16 rounded-xl bg-white shrink-0 overflow-hidden">
                  <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate" style={{ color: text1 }}>{item.nombre}</p>
                  <p className="text-xs" style={{ color: text2 }}>4.8 ★</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      <section className="py-20 px-4 md:px-16 max-w-4xl mx-auto w-full">
        <h3 className="text-[32px] md:text-[40px] text-center mb-4 font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: text1 }}>Preguntas Frecuentes</h3>
        <p className="text-center mb-16 max-w-lg mx-auto" style={{ color: text2 }}>Todo lo que necesitas saber sobre nuestro servicio premium de delivery.</p>
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.id} className="rounded-[2rem] border overflow-hidden transition-all hover:shadow-md"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <button className="w-full p-8 flex justify-between items-center text-left"
                onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                <span className="text-xl font-bold pr-4" style={{ color: text1 }}>{item.question}</span>
                <ChevronDown size={28} className="shrink-0 transition-transform duration-300" style={{ color: tc, transform: openFaq === item.id ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: openFaq === item.id ? '200px' : '0' }}>
                <div className="px-8 pb-8 pt-0" style={{ color: text2 }}>
                  <div className="border-t pt-4" style={{ borderColor: cardBorder }}>
                    <p className="leading-relaxed text-lg">{item.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER 4 COLUMNS ═══ */}
      <footer className="py-12 md:py-20 px-4 md:px-16 border-t" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#f3f3f5', borderColor: cardBorder }}>
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-16 mb-12 md:mb-20">
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            {config.logo_url ? <img src={config.logo_url} alt={config.site_nombre} className="h-8 md:h-10 w-auto mb-6" />
              : <h4 className="text-lg md:text-xl font-extrabold mb-6" style={{ color: tc }}>{config.site_nombre || 'FOODPOP'}</h4>}
            <p className="text-xs md:text-sm leading-relaxed mb-6" style={{ color: text2 }}>
              {config.footer_about_text || 'Redefiniendo el delivery de comida rápida con calidad premium y tecnología de punta.'}
            </p>
            <div className="flex gap-3">
              {config.instagram_url && <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Instagram size={16} /></a>}
              {config.twitter_url && <a href={config.twitter_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Twitter size={16} /></a>}
              {config.facebook_url && <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: surfaceContainer, color: text2 }}><Facebook size={16} /></a>}
            </div>
          </div>
          <div>
            <h5 className="font-bold mb-4 md:mb-8 uppercase tracking-widest text-[10px] md:text-xs" style={{ color: text1 }}>Menú</h5>
            <ul className="space-y-2.5 md:space-y-4 text-xs md:text-sm" style={{ color: text2 }}>
              {(config.categories || []).slice(0, 5).map((cat) => (
                <li key={cat}><button onClick={() => { setSelectedCategory(cat); setTab('catalog'); }} className="hover:opacity-80 transition-colors">{cat}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 md:mb-8 uppercase tracking-widest text-[10px] md:text-xs" style={{ color: text1 }}>Compañía</h5>
            <ul className="space-y-2.5 md:space-y-4 text-xs md:text-sm" style={{ color: text2 }}>
              <li><button onClick={() => setTab('profile')} className="hover:opacity-80 transition-colors">Sobre Nosotros</button></li>
              <li><button className="hover:opacity-80 transition-colors">Blog de Comida</button></li>
              <li><button className="hover:opacity-80 transition-colors">Sostenibilidad</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 md:mb-8 uppercase tracking-widest text-[10px] md:text-xs" style={{ color: text1 }}>Soporte</h5>
            <ul className="space-y-2.5 md:space-y-4 text-xs md:text-sm" style={{ color: text2 }}>
              <li><a href={`https://wa.me/${getWhatsApp().replace(/[+ ]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-colors flex items-center gap-2"><MessageCircle size={12} className="text-green-500" /> WhatsApp</a></li>
              <li><button className="hover:opacity-80 transition-colors">Términos de Servicio</button></li>
              <li><button className="hover:opacity-80 transition-colors">Privacidad</button></li>
              {onAdminClick && <li><button onClick={onAdminClick} className="hover:opacity-80 transition-colors">{isAdminAuthenticated ? 'Admin ✓' : 'Admin'}</button></li>}
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto pt-6 md:pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4 text-[10px] md:text-xs"
          style={{ borderColor: cardBorder, color: isDarkMode ? '#5a5a7a' : '#8f7065' }}>
          <p>© {new Date().getFullYear()} {config.footer_copyright || config.site_nombre || 'FOODPOP'}. Todos los derechos reservados.</p>
          <div className="flex gap-6"><span>Bogotá • CDMX • Madrid</span></div>
        </div>
      </footer>

      {/* ═══ FLOATING CART ═══ */}
      <FloatingCartButton itemCount={cartCount} total={cartTotal} onClick={() => setTab('checkout')} themeColor={tc} />
    </div>
  );
};
