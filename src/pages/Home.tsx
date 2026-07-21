import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import {
  ArrowRight, ChevronLeft, ChevronRight, ChevronDown,
  Users, Gift, Star, Clock, Zap, Truck, ShieldCheck,
  Sparkles, Award, Flame, HelpCircle, MessageCircle,
  Instagram, Twitter, Facebook, MapPin, Smartphone,
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { PremiumProductCard } from '../components/PremiumProductCard';
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
  { id: 'faq-5', question: '¿Puedo cambiar o cancelar mi pedido?', answer: 'Puedes cancelar o modificar tu pedido dentro de los primeros 5 minutos después de realizarlo. Después de ese tiempo, el pedido entra en preparación y no es posible hacer cambios.' },
  { id: 'faq-6', question: '¿Aceptan tarjetas de crédito o débito?', answer: 'Sí, aceptamos todas las tarjetas de crédito y débito Visa, Mastercard y American Express. También aceptamos pagos móviles como Zelle y Pago Móvil.' },
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
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);
  const activeCombos = useMemo(() => (config.combos || []).filter(c => c.active), [config.combos]);
  const faqItems = useMemo(() => config.faq_items && config.faq_items.length > 0 ? config.faq_items : DEFAULT_FAQ, [config.faq_items]);

  const categorySections = useMemo(() => {
    return (config.categories || []).map(catName => {
      const items = activeItems.filter(p => p.categoria.toLowerCase() === catName.toLowerCase());
      return { name: catName, items };
    }).filter(s => s.items.length > 0);
  }, [activeItems, config.categories]);

  const [heroSlide, setHeroSlide] = useState(0);
  const heroBanners = config.banners.slice(0, 3);
  const [heroVerticalSlide, setHeroVerticalSlide] = useState(0);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length]);

  const [activeCategory, setActiveCategory] = useState('Todas');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const [flashTimer, setFlashTimer] = useState({ hours: 2, minutes: 45, seconds: 12 });
  useEffect(() => {
    const interval = setInterval(() => {
      setFlashTimer(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const heroCarouselRef = useRef<HTMLDivElement>(null);
  const offerCarouselRef = useRef<HTMLDivElement>(null);
  const comboCarouselRef = useRef<HTMLDivElement>(null);
  const productCarouselRef = useRef<HTMLDivElement>(null);
  const promoCarouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.offsetWidth * 0.8;
      ref.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const extrasTotal = item.selected_options?.reduce((e, opt) => e + opt.precio_usd, 0) || 0;
    return sum + (item.item.precio_usd + extrasTotal) * item.quantity;
  }, 0);

  const getWhatsAppPhone = () => {
    const active = config.sedes?.filter(s => s.activa);
    if (active && active.length > 0) return active[0].whatsapp_numero || active[0].telefono || config.telefono_soporte;
    return config.telefono_soporte;
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* ═══ HERO MOBILE — Vertical Carousel ═══ */}
      <section className="md:hidden w-full relative h-[700px] overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0f0f1a' : '#f9f9fb' }}>
        <div
          className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory"
          onScroll={(e) => {
            const idx = Math.round(e.currentTarget.scrollTop / e.currentTarget.clientHeight);
            setHeroVerticalSlide(idx);
          }}
        >
          {heroBanners.length > 0 ? heroBanners.map((banner, idx) => (
            <div key={idx} className="relative h-[700px] w-full shrink-0 snap-start">
              <img alt="" className="absolute inset-0 w-full h-full object-cover" src={banner} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-16 left-0 right-0 p-8">
                <span className="inline-flex items-center px-3 py-1 bg-primary-container text-white font-semibold text-[11px] uppercase tracking-widest rounded-full mb-4">
                  NUEVO
                </span>
                <h2 className="text-[44px] leading-none text-white mb-4 font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {config.hero_title || config.site_nombre || 'FoodPop'}
                </h2>
                <p className="text-white/80 max-w-xs mb-8 text-[16px]">
                  {config.hero_subtitle || config.mensaje_bienvenida || 'La explosión de sabor que estabas esperando.'}
                </p>
                <button
                  onClick={() => setTab('catalog')}
                  className="text-white font-bold px-8 py-4 rounded-xl flex items-center gap-2 shadow-xl"
                  style={{ backgroundColor: themeColor, boxShadow: `0 8px 24px ${themeColor}40` }}
                >
                  {config.hero_cta_text || 'Ordenar Ahora'} <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="h-[700px] w-full" style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0' }} />
          )}
        </div>
        {heroBanners.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
            {heroBanners.map((_: string, idx: number) => (
              <div key={idx} className="rounded-full transition-all duration-300" style={{
                width: '6px', height: idx === heroVerticalSlide ? '24px' : '6px',
                backgroundColor: idx === heroVerticalSlide ? themeColor : 'rgba(255,255,255,0.4)',
              }} />
            ))}
          </div>
        )}
      </section>

      {/* ═══ HERO DESKTOP — Full Width Image ═══ */}
      <section className="hidden md:block relative w-full h-[600px] overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0f0f1a' : '#f9f9fb' }}>
        {heroBanners.length > 0 ? (
          <div className="absolute inset-0 flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${heroSlide * 100}%)` }}>
            {heroBanners.map((banner: string, idx: number) => (
              <img key={idx} src={banner} alt="" className="w-full h-full object-cover shrink-0" loading={idx === 0 ? 'eager' : 'lazy'} />
            ))}
          </div>
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: isDarkMode ? '#16213e' : '#e2e2e4' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-16 lg:px-24 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/90 text-white font-semibold text-xs uppercase tracking-widest rounded-full">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Lo más nuevo
            </span>
            <span className="text-white/60 text-sm">Disponible solo esta semana</span>
          </div>
          <h1 className="text-white font-extrabold mb-6" style={{ fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.02em' }}>
            {config.hero_title || 'Bacon Bomb'}<br /><span style={{ color: themeColor }}>{config.hero_subtitle || 'Max Edition'}</span>
          </h1>
          <p className="text-white/80 max-w-lg mb-10 text-lg leading-relaxed">
            {config.mensaje_bienvenida || 'Experimenta la explosión definitiva de sabor con nuestra nueva creación. Ingredientes premium con un 20% de descuento por lanzamiento.'}
          </p>
          <div className="flex gap-4">
            <button onClick={() => setTab('catalog')} className="text-white font-bold px-10 py-5 rounded-2xl flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: themeColor }}>
              {config.hero_cta_text || 'Ordenar Ahora'} <ArrowRight size={20} />
            </button>
            <button onClick={() => setTab('catalog')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-bold hover:bg-white/20 transition-all">
              Ver Detalles
            </button>
          </div>
        </div>
        {heroBanners.length > 1 && (
          <div className="absolute right-12 bottom-12 flex flex-col gap-3">
            {heroBanners.map((_: string, idx: number) => (
              <div key={idx} className="rounded-full transition-all duration-300 cursor-pointer" style={{
                width: '8px', height: idx === heroSlide ? '40px' : '8px',
                backgroundColor: idx === heroSlide ? themeColor : 'rgba(255,255,255,0.3)',
              }} onClick={() => setHeroSlide(idx)} />
            ))}
          </div>
        )}
      </section>

      {/* ═══ CATEGORÍAS PILLS ═══ */}
      <section className="py-6 px-4 md:px-8 lg:px-16 max-w-[1440px] mx-auto w-full" style={{ backgroundColor: isDarkMode ? '#0f0f1a' : '#f9f9fb' }}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[24px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Explorar por categorías</h3>
          <div className="hidden md:flex gap-2">
            <button onClick={() => scrollCarousel(heroCarouselRef, 'left')} className="w-10 h-10 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: isDarkMode ? '#2a2a4a' : '#e4beb1', color: isDarkMode ? '#a0a0b8' : '#1a1c1d' }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scrollCarousel(heroCarouselRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div ref={heroCarouselRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 lg:grid-cols-6 md:overflow-visible">
          {['Todas', ...(config.categories || [])].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); if (cat !== 'Todas') { setSelectedCategory(cat); setTab('catalog'); } }}
                className="px-6 py-3 rounded-full font-semibold text-sm whitespace-nowrap transition-all shrink-0 md:w-auto"
                style={{
                  backgroundColor: isActive ? themeColor : (isDarkMode ? '#16213e' : '#eeeef0'),
                  color: isActive ? '#ffffff' : (isDarkMode ? '#a0a0b8' : '#5b4137'),
                  boxShadow: isActive ? `0 4px 12px ${themeColor}30` : 'none',
                }}>
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ MAIN CONTENT + SIDEBAR ═══ */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-12">

            {/* ═══ OFERTAS FLASH ═══ */}
            {promoItems.length > 0 && (
              <section>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1" style={{ color: themeColor }}>
                      <Zap size={20} className="animate-pulse" fill="currentColor" />
                      <span className="font-semibold text-sm uppercase tracking-tighter">
                        Termina en {String(flashTimer.hours).padStart(2, '0')}:{String(flashTimer.minutes).padStart(2, '0')}:{String(flashTimer.seconds).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="text-[28px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Ofertas Flash</h3>
                  </div>
                  <button onClick={() => setTab('catalog')} className="font-semibold flex items-center gap-1 transition-all hover:gap-2" style={{ color: themeColor }}>
                    Ver Todo <ChevronRight size={18} />
                  </button>
                </div>
                <div ref={offerCarouselRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar md:overflow-visible pb-2 md:pb-0">
                  {promoItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="shrink-0 w-[280px] sm:w-auto snap-start rounded-[2rem] overflow-hidden border transition-all hover:-translate-y-2 cursor-pointer group"
                      style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}
                      onClick={() => onViewProductDetails(item)}>
                      <div className="relative h-56 overflow-hidden">
                        <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                          <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-xl">
                            -{Math.round(((item.precio_anterior_usd - item.precio_usd) / item.precio_anterior_usd) * 100)}% OFF
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>{item.nombre}</h4>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-bold">{getProductAverageRating(item.id).toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-sm mb-4" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>{item.descripcion}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-2xl" style={{ color: themeColor }}>${item.precio_usd.toFixed(2)}</span>
                          {item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
                            <span className="line-through text-base" style={{ color: isDarkMode ? '#5a5a7a' : '#8f7065' }}>${item.precio_anterior_usd.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ COMBOS EXPLOSIVOS ═══ */}
            {activeCombos.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[28px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Combos Explosivos</h3>
                  <div className="flex gap-2">
                    <button onClick={() => scrollCarousel(comboCarouselRef, 'left')} className="w-10 h-10 rounded-full border flex items-center justify-center transition-all" style={{ borderColor: isDarkMode ? '#2a2a4a' : '#e4beb1', color: isDarkMode ? '#a0a0b8' : '#1a1c1d' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => scrollCarousel(comboCarouselRef, 'right')} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: themeColor }}>
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <div ref={comboCarouselRef} className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar md:overflow-visible pb-2 md:pb-0">
                  {activeCombos.map((combo) => {
                    const comboProducts = combo.product_ids.map(id => activeItems.find(p => p.id === id)).filter(Boolean) as FoodItem[];
                    const comboImage = combo.imagen_url || comboProducts[0]?.imagen_urls?.[0] || '';
                    return (
                      <div key={combo.id} className="flex rounded-2xl overflow-hidden h-48 snap-start border transition-all hover:-translate-y-2 group"
                        style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}>
                        <div className="w-2/5 relative overflow-hidden">
                          {comboImage ? (
                            <img src={comboImage} alt={combo.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl" style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0' }}>🎁</div>
                          )}
                        </div>
                        <div className="w-3/5 p-6 flex flex-col justify-center">
                          <h5 className="text-xl font-bold mb-2" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>{combo.nombre}</h5>
                          <p className="text-sm mb-4" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>{combo.descripcion}</p>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="font-bold text-2xl" style={{ color: themeColor }}>-{combo.discount_percent}%</span>
                            <button className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:text-white"
                              style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0', color: themeColor }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = themeColor; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDarkMode ? '#16213e' : '#eeeef0'; e.currentTarget.style.color = themeColor; }}>
                              <span className="material-symbols-outlined">add_shopping_cart</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ═══ PRODUCTOS DESTACADOS ═══ */}
            {bestsellerItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[28px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>
                      {config.section_bestseller_title || 'Lo Más Pedido'}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: isDarkMode ? '#a0a0b8' : '#8f7065' }}>Los favoritos de nuestros clientes</p>
                  </div>
                  <button onClick={() => setTab('catalog')} className="font-semibold hidden sm:block transition-all" style={{ color: themeColor }}>
                    Ver todo →
                  </button>
                </div>
                <div ref={productCarouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
                  {bestsellerItems.slice(0, 8).map((item, idx) => (
                    <div key={item.id} className="shrink-0 w-[180px] sm:w-[220px] snap-start">
                      <PremiumProductCard item={item} config={config} onViewProductDetails={onViewProductDetails} addToCart={(food) => addToCart(food)} averageRating={getProductAverageRating(item.id)} reviewCount={getProductReviews(item.id).length} index={idx} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ PROMOCIONES ═══ */}
            {activePromotions.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[28px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>
                    {config.section_promos_title || 'Promociones'}
                  </h3>
                </div>
                <div ref={promoCarouselRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pb-2">
                  {activePromotions.map((promo) => (
                    <div key={promo.id} className="shrink-0 w-[280px] sm:w-[320px] snap-start rounded-2xl overflow-hidden border cursor-pointer transition-all hover:-translate-y-1"
                      style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}
                      onClick={() => setTab('catalog')}>
                      <div className="relative h-40 overflow-hidden">
                        {promo.image_url && <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <span className="px-3 py-1 rounded-full text-white text-xs font-bold" style={{ backgroundColor: themeColor }}>{promo.discount_type === 'percent' ? `-${promo.discount_value}%` : `-$${promo.discount_value}`}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>{promo.title}</h4>
                        <p className="text-sm mt-1" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>{promo.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ═══ BENTO GRID DESTACADOS ═══ */}
            {categorySections.length > 0 && (
              <section className="rounded-[3rem] p-8 md:p-12" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#ffffff' }}>
                <h3 className="text-[28px] font-bold mb-8 text-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Nuestros Destacados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categorySections[0] && (
                    <div className="md:col-span-2 h-[350px] md:h-[450px] relative rounded-[2rem] overflow-hidden group cursor-pointer"
                      onClick={() => { setSelectedCategory(categorySections[0].name); setTab('catalog'); }}>
                      <img src={config.categories_images?.[categorySections[0].name] || CATEGORY_HERO_BG[categorySections[0].name.toLowerCase()] || ''} alt={categorySections[0].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                        <span className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: themeColor }}>Gourmet Selection</span>
                        <h4 className="text-white font-bold text-3xl md:text-4xl mb-3">{categorySections[0].name}</h4>
                        <p className="text-white/70 max-w-md">{categorySections[0].items.length} productos disponibles</p>
                      </div>
                    </div>
                  )}
                  {categorySections[1] && (
                    <div className="h-[350px] md:h-[450px] relative rounded-[2rem] overflow-hidden group cursor-pointer"
                      onClick={() => { setSelectedCategory(categorySections[1].name); setTab('catalog'); }}>
                      <img src={config.categories_images?.[categorySections[1].name] || CATEGORY_HERO_BG[categorySections[1].name.toLowerCase()] || ''} alt={categorySections[1].name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12" style={{ backgroundColor: `${themeColor}30`, backdropFilter: 'blur(2px)' }}>
                        <h4 className="text-white font-bold text-3xl md:text-4xl mb-3 leading-tight">{categorySections[1].name}</h4>
                        <p className="text-white/90">{categorySections[1].items.length} productos</p>
                        <button className="mt-6 self-start px-8 py-3 bg-white text-primary rounded-xl font-bold hover:opacity-90 transition-all" style={{ color: themeColor }}>Ver Menú</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ═══ SIDEBAR RIGHT — Sticky ═══ */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-8">

              {/* Recomendados */}
              <div className="rounded-[2rem] p-6 border" style={{ backgroundColor: isDarkMode ? '#12122a' : '#f3f3f5', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}>
                <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>
                  <Sparkles size={18} style={{ color: themeColor }} /> Recomendados para ti
                </h4>
                <div className="space-y-4">
                  {bestsellerItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewProductDetails(item)}>
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                        <img src={item.imagen_urls[0]} alt={item.nombre} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>{item.nombre}</p>
                        <p className="text-xs" style={{ color: themeColor }}>${item.precio_usd.toFixed(2)}</p>
                      </div>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: isDarkMode ? '#16213e' : '#ffffff', color: themeColor }}
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                        <span className="text-sm font-bold">+</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('catalog')} className="w-full mt-4 py-3 border-2 rounded-2xl font-semibold transition-all hover:opacity-80" style={{ borderColor: `${themeColor}30`, color: themeColor }}>
                  Ver Más Sugerencias
                </button>
              </div>

              {/* App Download Mini Banner */}
              <div className="rounded-[2rem] p-6 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#2f3132' }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: `${themeColor}20` }} />
                <h4 className="text-lg font-bold mb-3 relative z-10 text-white">Instala nuestra Web App</h4>
                <p className="text-white/60 text-sm mb-6 relative z-10">Acceso instantáneo y beneficios exclusivos.</p>
                <button onClick={onInstallClick} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 text-white relative z-10 transition-all hover:opacity-90"
                  style={{ backgroundColor: themeColor, boxShadow: `0 8px 20px ${themeColor}40` }}>
                  <Smartphone size={18} /> Instalar Web App
                </button>
                <div className="flex items-center gap-2 mt-3 relative z-10">
                  <Gift size={14} className="text-amber-400" />
                  <span className="text-xs text-white/80">+500 puntos de bienvenida</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BRAND EXPERIENCE SECTION ═══ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#2f3132' }}>
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full blur-[150px]" style={{ backgroundColor: `${themeColor}10` }} />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: `${themeColor}10` }} />
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 lg:px-16 grid grid-cols-1 lg:grid-cols-2 items-center gap-16 relative z-10">
          <div className="order-2 lg:order-1">
            <div className="aspect-square lg:aspect-[4/3] rounded-[3rem] overflow-hidden border border-white/10 relative group">
              <img src={config.banners?.[0] || CATEGORY_HERO_BG['combos']} alt="Brand" className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000" />
              <div className="absolute inset-0 group-hover:bg-transparent transition-all" style={{ backgroundColor: `${themeColor}10`, mixBlendMode: 'overlay' }} />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-white font-extrabold mb-8" style={{ fontSize: 'clamp(32px, 4vw, 64px)', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {config.brand_section_title || 'Más que comida,'}<br /><span style={{ color: themeColor }}>{config.brand_section_subtitle || 'es una experiencia.'}</span>
            </h2>
            <p className="text-white/50 mb-12 text-xl leading-relaxed max-w-xl">
              Nacimos para romper las reglas de la comida rápida. Ingredientes de primera, tecnología de punta y una obsesión por la frescura absoluta en cada entrega.
            </p>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <p className="font-extrabold leading-none mb-2" style={{ fontSize: '48px', color: themeColor }}>{config.brand_stat1_value || '15min'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{config.brand_stat1_label || 'Entrega Promedio'}</p>
              </div>
              <div>
                <p className="font-extrabold leading-none mb-2" style={{ fontSize: '48px', color: themeColor }}>{config.brand_stat2_value || '100%'}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{config.brand_stat2_label || 'Ingredientes Frescos'}</p>
              </div>
            </div>
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-700" />
                <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-600" />
                <div className="w-10 h-10 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold text-white bg-gray-500">{config.brand_users_count || '+50k'}</div>
              </div>
              <p className="text-white/60 text-sm">Usuarios activos disfrutan de la app a diario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ STANDALONE ═══ */}
      <section className="py-20 px-4 md:px-8 lg:px-16 max-w-4xl mx-auto w-full" style={{ backgroundColor: isDarkMode ? '#0f0f1a' : '#f9f9fb' }}>
        <h3 className="text-[32px] md:text-[40px] text-center mb-4 font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Preguntas Frecuentes</h3>
        <p className="text-center mb-12 max-w-lg mx-auto" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>Todo lo que necesitas saber sobre nuestro servicio premium de delivery.</p>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.id} className="rounded-2xl overflow-hidden border transition-all hover:shadow-md"
              style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}>
              <button className="w-full p-6 flex justify-between items-center text-left transition-colors"
                onClick={() => setOpenFaq(openFaq === item.id ? null : item.id)}>
                <span className="text-lg font-bold pr-4" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>{item.question}</span>
                <ChevronDown size={24} className="shrink-0 transition-transform duration-300" style={{
                  color: themeColor,
                  transform: openFaq === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                }} />
              </button>
              <div className="overflow-hidden transition-all duration-500 ease-in-out" style={{ maxHeight: openFaq === item.id ? '200px' : '0' }}>
                <div className="px-6 pb-6 pt-0" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>
                  <div className="border-t pt-4" style={{ borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}>
                    <p className="leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="py-16 px-4 md:px-8 lg:px-16 border-t" style={{ backgroundColor: isDarkMode ? '#0a0a14' : '#f3f3f5', borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)' }}>
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Col 1: Logo + About */}
          <div>
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_nombre} className="h-10 w-auto mb-6" />
            ) : (
              <h4 className="text-xl font-extrabold mb-6" style={{ color: themeColor }}>{config.site_nombre || 'FOODPOP'}</h4>
            )}
            <p className="text-sm leading-relaxed mb-6" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>
              {config.footer_about_text || `Redefiniendo el delivery de comida rápida con calidad premium y tecnología de punta. Tu comida favorita, en la puerta de tu casa.`}
            </p>
            <div className="flex gap-3">
              {config.instagram_url && <a href={config.instagram_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0', color: isDarkMode ? '#a0a0b8' : '#5b4137' }}><Instagram size={18} /></a>}
              {config.twitter_url && <a href={config.twitter_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0', color: isDarkMode ? '#a0a0b8' : '#5b4137' }}><Twitter size={18} /></a>}
              {config.facebook_url && <a href={config.facebook_url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all" style={{ backgroundColor: isDarkMode ? '#16213e' : '#eeeef0', color: isDarkMode ? '#a0a0b8' : '#5b4137' }}><Facebook size={18} /></a>}
            </div>
          </div>
          {/* Col 2: Menú */}
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Menú</h5>
            <ul className="space-y-3 text-sm" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>
              {(config.categories || []).slice(0, 5).map((cat) => (
                <li key={cat}><button onClick={() => { setSelectedCategory(cat); setTab('catalog'); }} className="hover:opacity-80 transition-colors">{cat}</button></li>
              ))}
            </ul>
          </div>
          {/* Col 3: Compañía */}
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Compañía</h5>
            <ul className="space-y-3 text-sm" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>
              <li><button onClick={() => setTab('profile')} className="hover:opacity-80 transition-colors">Sobre Nosotros</button></li>
              <li><button className="hover:opacity-80 transition-colors">Blog de Comida</button></li>
              <li><button className="hover:opacity-80 transition-colors">Sostenibilidad</button></li>
            </ul>
          </div>
          {/* Col 4: Soporte */}
          <div>
            <h5 className="font-bold mb-6 uppercase tracking-widest text-xs" style={{ color: isDarkMode ? '#e8e8f0' : '#1a1c1d' }}>Soporte</h5>
            <ul className="space-y-3 text-sm" style={{ color: isDarkMode ? '#a0a0b8' : '#5b4137' }}>
              <li><a href={`https://wa.me/${getWhatsAppPhone().replace(/[+ ]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-colors flex items-center gap-2"><MessageCircle size={14} className="text-green-500" /> WhatsApp</a></li>
              <li><button className="hover:opacity-80 transition-colors">Términos de Servicio</button></li>
              <li><button className="hover:opacity-80 transition-colors">Privacidad</button></li>
              {onAdminClick && (
                <li><button onClick={onAdminClick} className="hover:opacity-80 transition-colors">{isAdminAuthenticated ? 'Admin ✓' : 'Admin'}</button></li>
              )}
            </ul>
          </div>
        </div>
        <div className="max-w-[1440px] mx-auto pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs" style={{ borderColor: isDarkMode ? '#2a2a4a' : 'rgba(228,190,177,0.1)', color: isDarkMode ? '#5a5a7a' : '#8f7065' }}>
          <p>© {new Date().getFullYear()} {config.footer_copyright || config.site_nombre || 'FOODPOP'}. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <span>Bogotá • CDMX • Madrid</span>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING CART BUTTON ═══ */}
      <FloatingCartButton itemCount={cartItemCount} total={cartTotal} onClick={() => setTab('checkout')} themeColor={themeColor} />
    </div>
  );
};
