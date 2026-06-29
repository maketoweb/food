import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import { ArrowRight, ShoppingCart, Search, Sparkles, Flame, Zap, Bell, Smartphone, Clock, Star, X, ChefHat, MessageSquare } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductCard } from '../components/ProductCard';
import { getCategoryColor } from '../utils/categoryColors';

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
  const { foodItems, config, addToCart } = useApp();
  const themeColor = config.theme_color || '#E31837';
  const [activeBanner, setActiveBanner] = useState(0);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const activeItems = useMemo(() => foodItems.filter(p => p.activo !== false), [foodItems]);
  const promoItems = useMemo(() => activeItems.filter(p => p.es_promo), [activeItems]);
  const newItems = useMemo(() => activeItems.filter(p => p.es_nuevo), [activeItems]);
  const bestsellerItems = useMemo(() => activeItems.filter(p => p.es_mas_vendido), [activeItems]);

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
          <button onClick={() => setTab('catalog')}
            className="mt-3 text-white font-bold text-sm px-6 py-2.5 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
            style={{ backgroundColor: themeColor }}
          >
            Ordenar Ahora <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="px-4 -mt-5 relative z-20">
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3">
          <Search size={16} style={{ color: themeColor }} />
          <input ref={searchRef} type="text"
            placeholder="Buscar en el menú..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-zinc-400"
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

      {/* CATEGORIES */}
      <div className="px-4 mt-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-2">
          {(config.categories || []).slice(0, 8).map(catName => {
            const emoji = CATEGORY_EMOJIS[catName.toLowerCase()] || '🍽️';
            return (
              <button key={catName}
                onClick={() => { setSelectedCategory(catName); setTab('catalog'); }}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer border bg-white hover:shadow-sm"
                style={{ borderColor: themeColor + '30', color: themeColor }}
              >
                <span className="text-base">{emoji}</span>
                <span>{catName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROMOS */}
      {promoItems.length > 0 && (
        <CategorySection title="Promos" items={promoItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} isOffer setTab={setTab} icon={null} gradient="" />
      )}

      {/* NUEVOS */}
      {newItems.length > 0 && (
        <CategorySection title="Nuevos" items={newItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" />
      )}

      {/* MÁS PEDIDOS */}
      {bestsellerItems.length > 0 && (
        <CategorySection title="Más Pedidos" items={bestsellerItems} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" />
      )}

      {/* CATEGORÍAS */}
      {categorySections.map(section => (
        <CategorySection key={section.name} title={section.name} items={section.items} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} setTab={setTab} icon={null} gradient="" />
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
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, icon, gradient, items, config, onViewProductDetails, addToCart, isOffer, setTab }) => {
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
          {items.map(item => (
            <div key={item.id} className="shrink-0 w-[180px] sm:w-[200px] lg:w-auto snap-start">
              <ProductCard
                item={item}
                config={config}
                onViewProductDetails={onViewProductDetails}
                addToCart={(food) => addToCart(food)}
                isOffer={isOffer}
              />
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
