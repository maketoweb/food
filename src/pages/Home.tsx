import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import { ArrowRight, ShoppingCart, Search, Sparkles, Flame, Zap, Bell, Smartphone, Clock, Star, X, ChefHat, MessageSquare, TrendingUp } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductCard } from '../components/ProductCard';
import { PremiumProductCard } from '../components/PremiumProductCard';
import { FlashSaleTimer } from '../components/FlashSaleTimer';
import { getCategoryColor } from '../utils/categoryColors';
import { FAQSection } from '../components/FAQSection';
import { AnimatedCounter } from '../components/AnimatedCounter';

const CATEGORY_EMOJIS: Record<string, string> = {
  'hamburguesas': '🍔',
  'pizzas': '🍕',
  'pollo': '🍗',
  'papas & sides': '🍟',
  'bebidas': '🥤',
  'postres': '🍰',
  'combos': '🎁',
  'entradas': '🥗',
};

const CATEGORY_HERO_BG: Record<string, string> = {
  'hamburguesas': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
  'pizzas': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
  'pollo': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=800',
  'bebidas': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
  'postres': 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=800',
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
  onViewProductDetails, globalSearch, setGlobalSearch,
  navigateToCatalog,
  deferredPrompt, onInstallClick
}) => {
  const { foodItems, config, addToCart, getProductAverageRating, getProductReviews, getActiveFlashSale } = useApp();
  const themeColor = config.theme_color || '#E31837';
  const [activeBanner, setActiveBanner] = useState(0);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeItems = useMemo(() => foodItems.filter(p => p.activo !== false), [foodItems]);
  const promoItems = useMemo(() => activeItems.filter(p => p.es_promo), [activeItems]);
  const newItems = useMemo(() => activeItems.filter(p => p.es_nuevo), [activeItems]);
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);
  
  // Top ordered items for social proof
  const topOrderedItems = useMemo(() => {
    return [...activeItems]
      .filter(p => (p.order_count || 0) > 0)
      .sort((a, b) => (b.order_count || 0) - (a.order_count || 0))
      .slice(0, 5);
  }, [activeItems]);
  
  // Active flash sales
  const activeFlashSales = useMemo(() => {
    return activeItems
      .map(p => {
        const fs = getActiveFlashSale(p.id);
        return fs ? { product: p, flashSale: fs } : null;
      })
      .filter(Boolean) as { product: FoodItem; flashSale: NonNullable<ReturnType<typeof getActiveFlashSale>> }[];
  }, [activeItems, getActiveFlashSale]);

  // Category sections (for display, skip empty ones)
  const categorySections = useMemo(() => {
    return (config.categories || []).map(catName => {
      const items = activeItems.filter(p => p.categoria.toLowerCase() === catName.toLowerCase());
      return { name: catName, items };
    }).filter(s => s.items.length > 0);
  }, [activeItems, config.categories]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % config.banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [config.banners.length]);

  useEffect(() => {
    if (globalSearch.trim().length > 1) {
      const filtered = activeItems
        .filter(p =>
          p.nombre.toLowerCase().includes(globalSearch.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(globalSearch.toLowerCase()) ||
          p.categoria.toLowerCase().includes(globalSearch.toLowerCase()) ||
          (p.ingredientes || []).some(i => i.toLowerCase().includes(globalSearch.toLowerCase()))
        )
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [globalSearch, activeItems]);

  return (
    <div className="flex flex-col gap-0 pb-28 max-w-7xl mx-auto">
      <SEOHead title={`${config.site_nombre || 'FoodPop'} - Tu Comida Favorita`} type="home" />

      {/* CLOSED BANNER */}
      {!config.esta_abierta && (
        <div className="sticky top-4 z-50 mx-4 mb-4">
          <div className="bg-pop-red text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <ChefHat size={20} />
            <div>
              <p className="font-bold text-sm">Cerrado por ahora</p>
              <p className="text-xs text-white/80">Estamos descansando. Vuelve pronto.</p>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="relative h-[240px] md:h-[340px] w-full overflow-hidden bg-zinc-900">
        {config.banners.length > 0 ? config.banners.map((url, index) => (
          <div key={url}
            className={`absolute inset-0 transition-all duration-700 ${index === activeBanner ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        )) : (
          <div className="w-full h-full bg-zinc-800" />
        )}

        {/* Banner dots */}
        {config.banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {config.banners.map((_, i) => (
              <button key={i} onClick={() => setActiveBanner(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeBanner ? 'w-5' : ''}`}
                style={{ backgroundColor: i === activeBanner ? themeColor : 'rgba(255,255,255,0.5)' }}
              />
            ))}
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5 z-10">
          <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight max-w-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {config.banner_texts?.[activeBanner] || 'La comida que te encanta'}
          </h2>

          {/* Social proof inmediato */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-white/90">
              <Star size={12} fill="#FBBF24" stroke="none" />
              <span className="text-[11px] font-bold">4.9</span>
            </div>
            <div className="w-px h-3 bg-white/30" />
            <div className="flex items-center gap-1 text-white/90">
              <TrendingUp size={11} />
              <span className="text-[11px] font-bold">
                <AnimatedCounter target={2847} duration={2000} /> pedidos
              </span>
            </div>
          </div>

          <button onClick={() => setTab('catalog')}
            className="mt-3 text-white font-bold text-sm px-6 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer animate-glow-pulse"
            style={{ backgroundColor: themeColor, boxShadow: `0 4px 20px ${themeColor}66` }}
          >
            Ordenar Ahora <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* SEARCH - Glassmorphism */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <Search size={16} style={{ color: themeColor }} />
          <input ref={searchRef} type="text"
            placeholder="¿Qué se te antoja hoy?"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-zinc-400 font-medium"
          />
          {globalSearch && (
            <button onClick={() => { setGlobalSearch(''); setSuggestions([]); }} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <X size={15} />
            </button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-4 right-4 bg-white border border-zinc-100 rounded-2xl mt-2 shadow-2xl z-30 overflow-hidden max-w-xl">
            {suggestions.map(p => (
              <button key={p.id}
                onClick={() => { onViewProductDetails(p); setShowSuggestions(false); setGlobalSearch(''); }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-100 last:border-0 cursor-pointer"
              >
                <img src={p.imagen_urls[0]} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{p.nombre}</p>
                  <p className="text-xs text-zinc-500">{p.categoria}</p>
                </div>
                <span className="font-bold text-sm" style={{ color: themeColor }}>${p.precio_usd.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORIES - Premium with images */}
      <div className="px-4 mt-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pb-2">
          {(config.categories || []).slice(0, 8).map((catName, idx) => {
            const emoji = CATEGORY_EMOJIS[catName.toLowerCase()] || '🍽️';
            const bgImage = config.categories_images?.[catName] || CATEGORY_HERO_BG[catName.toLowerCase()];
            return (
              <button key={catName}
                onClick={() => { setSelectedCategory(catName); setTab('catalog'); }}
                className="shrink-0 relative w-[100px] h-[100px] rounded-2xl overflow-hidden group transition-all active:scale-95 cursor-pointer"
                style={{
                  opacity: 0,
                  animation: `fadeInScale 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 60}ms forwards`,
                }}
              >
                {bgImage ? (
                  <>
                    <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }} />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-lg">{catName}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FLASH SALES */}
      {activeFlashSales.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-red-500 flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">Oferta Flash</h3>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full animate-pulse">AHORA</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeFlashSales.slice(0, 2).map(({ product, flashSale }) => (
              <FlashSaleTimer
                key={flashSale.id}
                endDate={flashSale.end_date}
                discountPercent={flashSale.discount_percent}
                productName={product.nombre}
                originalPrice={product.precio_usd}
                themeColor={themeColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* LO QUE TODOS PIDEN - Premium */}
      {topOrderedItems.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Flame size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Lo que todos piden</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Los favoritos de nuestros clientes</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth no-scrollbar lg:grid lg:overflow-visible lg:pb-0 lg:grid-cols-5">
            {topOrderedItems.map((item, idx) => (
              <div key={item.id} className="shrink-0 w-[180px] sm:w-[200px] lg:w-auto snap-start">
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
      )}

      {/* PROMOS - Premium */}
      {promoItems.length > 0 && (
        <CategorySection title="Promos" items={promoItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} isOffer setTab={setTab} icon={null} gradient="" getProductAverageRating={getProductAverageRating} getProductReviews={getProductReviews} usePremium />
      )}

      {/* NUEVOS - Premium */}
      {newItems.length > 0 && (
        <CategorySection title="Nuevos" items={newItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" getProductAverageRating={getProductAverageRating} getProductReviews={getProductReviews} usePremium />
      )}

      {/* MÁS PEDIDOS - Premium */}
      {bestsellerItems.length > 0 && (
        <CategorySection title="Más Pedidos" items={bestsellerItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" getProductAverageRating={getProductAverageRating} getProductReviews={getProductReviews} usePremium />
      )}

      {/* CATEGORÍAS */}
      {categorySections.map(section => (
        <CategorySection key={section.name} title={section.name} items={section.items} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" getProductAverageRating={getProductAverageRating} getProductReviews={getProductReviews} />
      ))}

      {/* PWA INSTALL */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl overflow-hidden relative bg-gradient-to-br from-zinc-900 to-zinc-800 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pop-pink/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <span className="text-pop-pink text-xs font-bold uppercase tracking-widest">App</span>
              <h3 className="text-white text-xl font-display font-bold mt-1">Lleva {config.site_nombre || 'FoodPop'} Siempre Contigo</h3>
              <p className="text-zinc-400 text-sm mt-1">Instala la app y recibe ofertas exclusivas.</p>
            </div>
            {deferredPrompt ? (
              <button onClick={onInstallClick}
                className="bg-pop-pink hover:bg-pink-600 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <Smartphone size={16} /> Descargar App
              </button>
            ) : (
              <button onClick={() => alert('Abre esta página en Chrome y agrega a la pantalla de inicio.')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95 cursor-pointer border border-white/20"
              >
                ¿Cómo Instalar?
              </button>
            )}
          </div>
        </div>
      </div>

      {/* EVENT REQUEST */}
      <div className="px-4 mt-6">
        <div className="rounded-2xl bg-gradient-to-br from-pop-orange-50 to-pop-yellow-50 border border-pop-orange/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={20} className="text-pop-orange" />
            <h3 className="font-bold text-lg text-zinc-900">¿Pedido para Evento?</h3>
          </div>
          <p className="text-zinc-600 text-sm mb-4">Cuéntanos cuántas personas y lo preparamos para ti.</p>
          <button onClick={() => setTab('profile')}
            className="bg-pop-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all active:scale-95 cursor-pointer w-full"
          >
            Solicitar Cotización
          </button>
        </div>
      </div>

      {/* FAQ */}
      {config.faq_items && config.faq_items.length > 0 && (
        <FAQSection items={config.faq_items} themeColor={themeColor} />
      )}

      {/* FOOTER */}
      <footer className="px-4 mt-8 pt-8 border-t border-zinc-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-zinc-500 mb-6">
          <div>
            <h4 className="font-bold text-zinc-800 mb-1 uppercase tracking-wider">{config.site_nombre || 'FoodPop'}</h4>
            <p className="leading-relaxed">{config.direccion_fisica}</p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-800 mb-1 uppercase tracking-wider">Categorías</h4>
            <ul className="space-y-1">
              {(config.categories || []).slice(0, 4).map(c => (
                <li key={c}>
                  <button onClick={() => { setSelectedCategory(c); setTab('catalog'); }}
                    className="hover:text-pop-pink transition-colors cursor-pointer">
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-zinc-800 mb-1 uppercase tracking-wider">Horario</h4>
            <p className="leading-relaxed">Lun - Sáb: 11am - 11pm<br />Dom: 12pm - 10pm</p>
          </div>
          <div>
            <h4 className="font-bold text-zinc-800 mb-1 uppercase tracking-wider">Contacto</h4>
            <p className="leading-relaxed">{config.telefono_soporte}</p>
          </div>
        </div>
        <p className="text-center text-zinc-400 text-xs pb-4 border-t border-zinc-100 pt-4">
          © {new Date().getFullYear()} {config.site_nombre || 'FoodPop'}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};

// ─── Category Section Component ───────────────────────────────────────────
interface CategorySectionProps {
  title: string;
  icon: React.ReactNode | null;
  gradient: string;
  items: FoodItem[];
  config: any;
  onViewProductDetails: (food: FoodItem) => void;
  addToCart: (item: FoodItem, qty?: number, opts?: any[], total?: number, removed?: string[]) => void;
  isOffer?: boolean;
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
  getProductAverageRating?: (productId: string) => number;
  getProductReviews?: (productId: string) => any[];
  usePremium?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, icon, gradient, items, config, onViewProductDetails, addToCart, isOffer, setTab, getProductAverageRating, getProductReviews, usePremium = false }) => {
  const themeColor = config.theme_color || '#E31837';
  const scrollId = `scroll-${title.replace(/\s+/g, '-')}`;

  const scroll = (dir: 'left' | 'right') => {
    const el = document.getElementById(scrollId);
    if (el) el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <div className="px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </h3>
        <button onClick={() => setTab('catalog')}
          className="text-xs font-semibold transition-colors cursor-pointer"
          style={{ color: themeColor }}
        >
          Ver todo →
        </button>
      </div>
      <div className="relative">
        <div id={scrollId}
          className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth no-scrollbar lg:grid lg:overflow-visible lg:pb-0 lg:grid-cols-4 xl:grid-cols-5"
        >
          {items.map((item, idx) => (
            <div key={item.id} className="shrink-0 w-[180px] sm:w-[200px] lg:w-auto snap-start">
              {usePremium ? (
                <PremiumProductCard
                  item={item}
                  config={config}
                  onViewProductDetails={onViewProductDetails}
                  addToCart={(food) => addToCart(food)}
                  averageRating={getProductAverageRating?.(item.id) || 0}
                  reviewCount={getProductReviews?.(item.id)?.length || 0}
                  index={idx}
                />
              ) : (
                <ProductCard
                  item={item}
                  config={config}
                  onViewProductDetails={onViewProductDetails}
                  addToCart={(food) => addToCart(food)}
                  isOffer={isOffer}
                  averageRating={getProductAverageRating?.(item.id) || 0}
                  reviewCount={getProductReviews?.(item.id)?.length || 0}
                  index={idx}
                />
              )}
            </div>
          ))}
        </div>
        <button onClick={() => scroll('left')}
          className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-zinc-200 rounded-full shadow-lg items-center justify-center hover:bg-zinc-50 transition-all cursor-pointer z-10"
        >
          ←
        </button>
        <button onClick={() => scroll('right')}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-zinc-200 rounded-full shadow-lg items-center justify-center hover:bg-zinc-50 transition-all cursor-pointer z-10"
        >
          →
        </button>
      </div>
    </div>
  );
};
