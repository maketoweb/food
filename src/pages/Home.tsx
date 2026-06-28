import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Producto } from '../types/store';
import { Utensils, Coffee, IceCreamCone, Pizza, Cake, Wine, Beer, Salad, ShieldCheck, Zap, ArrowRight, ShoppingCart, Bell, Sparkles, Flame, MessageSquare, Search, Smartphone, AlertTriangle, ChefHat, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { SEOHead } from '../components/SEOHead';
import { BentoGrid } from '../components/BentoGrid';
import { ProductCard } from '../components/ProductCard';
import { getCategoryColor } from '../utils/categoryColors';

interface HomeProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
  setSelectedCategory: (category: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedEngine: string;
  setSelectedEngine: (engine: string) => void;
  onViewProductDetails: (part: Producto) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
  navigateToCatalog: (filters?: { category?: string; brand?: string; model?: string; year?: string; engine?: string }) => void;
  deferredPrompt?: any;
  onInstallClick?: () => void;
}

export const Home: React.FC<HomeProps> = ({ 
  setTab, setSelectedCategory, 
  selectedBrand, setSelectedBrand, 
  selectedModel, setSelectedModel, 
  selectedYear, setSelectedYear,
  selectedEngine, setSelectedEngine,
  onViewProductDetails, globalSearch, setGlobalSearch,
  navigateToCatalog,
  deferredPrompt,
  onInstallClick
}) => {
  const { parts, config, addToCart, currentUser, requestPart } = useApp();

  const getWhatsAppPhone = () => { const active = config.sedes?.filter(s => s.activa); return active && active.length > 1 ? active[0].telefono : config.telefono_soporte; };
  const [activeBanner, setActiveBanner] = useState(0);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [suggestions, setSuggestions] = useState<Producto[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };
    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowNotificationPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleRequestPermissionHome = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        if (res === 'granted') {
          new Notification('Notificaciones Habilitadas', {
            body: 'Recibe alertas de tus pedidos y promociones de BurgerPop.',
            icon: '/icon.png',
            tag: 'welcome-burgerpop'
          });
        }
        setShowNotificationPrompt(false);
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % config.banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [config.banners.length]);

  const CATEGORY_EMOJIS: Record<string, string> = {
    'hamburguesas': '🍔',
    'papas & sides': '🍟',
    'combos': '🎁',
    'bebidas': '🥤',
    'postres': '🍰',
    'nuggets & tenders': '🍗',
  };

  const CATEGORIES = useMemo(() => {
    return (config.categories || []).map(catName => {
      const nameLower = catName.toLowerCase();
      const emoji = CATEGORY_EMOJIS[nameLower] || '🍽️';
      let icon = Utensils;
      if (nameLower.includes('hamburguesa') || nameLower.includes('burger')) icon = Utensils;
      else if (nameLower.includes('pasta') || nameLower.includes('espagueti')) icon = Utensils;
      else if (nameLower.includes('pizza')) icon = Pizza;
      else if (nameLower.includes('postre') || nameLower.includes('pastel') || nameLower.includes('torta')) icon = Cake;
      else if (nameLower.includes('bebida') || nameLower.includes('jugo') || nameLower.includes('refresco')) icon = Coffee;
      else if (nameLower.includes('cerveza') || nameLower.includes('birra')) icon = Beer;
      else if (nameLower.includes('cocktail') || nameLower.includes('coctel') || nameLower.includes('licor')) icon = Wine;
      else if (nameLower.includes('ensalada') || nameLower.includes('verdura')) icon = Salad;
      else if (nameLower.includes('helado') || nameLower.includes('nieve')) icon = IceCreamCone;
      else if (nameLower.includes('entrada') || nameLower.includes('aperitivo')) icon = Sparkles;
      return { name: catName, label: catName, icon, emoji, color: 'border-orange-100 bg-white hover:bg-orange-50' };
    });
  }, [config.categories]);

  const activeParts = useMemo(() => parts.filter(p => p.activo !== false), [parts]);
  const promoParts = parts.filter(p => p.es_promo && p.stock > 0 && p.activo !== false);
  const newParts = parts.filter(p => p.es_nuevo && p.stock > 0 && p.activo !== false);
  const bestsellerParts = parts.filter(p => p.es_mas_vendido && p.stock > 0 && p.activo !== false);
  const dailyDeal = useMemo(() => promoParts[0], [promoParts]);

  useEffect(() => {
    if (globalSearch.trim().length > 1) {
      const filtered = parts
        .filter(p => 
          p.activo !== false && 
          (p.nombre.toLowerCase().includes(globalSearch.toLowerCase()) || 
           p.descripcion.toLowerCase().includes(globalSearch.toLowerCase()) ||
           p.categoria.toLowerCase().includes(globalSearch.toLowerCase()) ||
           p.seccion.toLowerCase().includes(globalSearch.toLowerCase()))
        )
        .slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [globalSearch, parts]);

  const handleCategoryClick = (catName: string) => {
    navigateToCatalog({ category: catName });
  };

  const handleAddDailyDeal = () => {
    if (dailyDeal) {
      addToCart(dailyDeal);
      if (typeof (window as any).confetti === 'function') {
        (window as any).confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B35', '#FFB703', '#E63946', '#2EC4B6'],
          shapes: ['star', 'circle']
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* AVISO CERRADO */}
      {!config.esta_abierta && (
        <div className="sticky top-4 z-[60] mx-1">
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-red-400 animate-in slide-in-from-top-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-sm uppercase">Cerrado por ahora</h4>
              <p className="text-xs text-white/90">Estamos descansando. Puedes ver el menú, pero los pedidos están pausados.</p>
            </div>
          </div>
        </div>
      )}
      <SEOHead title="BurgerPop - Hamburguesería Valencia" type="home" />
      <h1 className="sr-only">BurgerPop - Las Mejores Smash Burgers de Valencia</h1>

      {/* Tasa de Cambio */}
      <div className="flex justify-end px-1 -mb-4">
        <div className="border border-orange-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-tighter shadow-sm bg-orange-50 text-orange-600 animate-pulse">
          Tasa BCV: {config.tasa_cambio.toFixed(2)} Bs.
        </div>
      </div>

      {/* PREMIUM BANNER */}
      <div className="relative h-[200px] md:h-[280px] w-full bg-zinc-200 rounded-2xl overflow-hidden border-2 border-orange-300 shadow-xl select-none">
        {config.banners.map((url, index) => (
          <div
            key={url}
            className={`absolute inset-0 transition-opacity duration-800 ${index === activeBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            <img
              src={url}
              alt={`Promoción ${index + 1}`}
              className="w-full h-full object-cover opacity-85"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

            <div className="absolute left-6 bottom-6 z-20 flex flex-col items-start gap-1.5">
              <span className="text-[11px] uppercase font-bold tracking-wider text-white border px-2.5 py-1 rounded-lg bg-orange-500 border-orange-400">
                🍔 {config.site_nombre || 'BurgerPop'}
              </span>
              <h2 className="text-xl md:text-3xl font-bold font-display text-white mt-1.5 max-w-sm drop-shadow-lg leading-tight">
                {config.banner_texts?.[index] || (index === 0 ? 'Las Mejores Smash de Valencia 🔥' : index === 1 ? 'Combos que Enloquecen 🔥' : 'Promos Exclusivas Solo en BurgerPop')}
              </h2>
              <button
                type="button"
                onClick={() => setTab('catalog')}
                className="mt-3 text-white text-[12px] font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #E63946, #FFB703)' }}
              >
                Ordenar Ahora 🔥 <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        <div className="absolute right-4 bottom-4 z-25 flex gap-1.5">
          {config.banners.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setActiveBanner(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${i === activeBanner ? 'w-6 bg-orange-500' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative mx-1">
        <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all">
          <span className="mr-2 text-base">🍔</span>
          <Search size={18} className="text-orange-500 mr-3" />
          <input
            type="text"
            placeholder="Buscar burgers, papas, combos..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-zinc-400"
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="text-zinc-400 hover:text-zinc-600 text-xs">✕</button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-zinc-200 rounded-xl mt-2 shadow-xl z-30 overflow-hidden">
            {suggestions.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onViewProductDetails(p); setShowSuggestions(false); setGlobalSearch(''); }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-orange-50 transition-colors text-left"
              >
                <img src={p.imagen_urls[0]} alt="" className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 truncate">{p.nombre}</p>
                  <p className="text-[10px] text-zinc-500">{p.categoria} • ${p.precio_usd.toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CATEGORIES CAROUSEL */}
      <div className="w-full flex flex-col gap-2.5 mt-1 px-1">
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth no-scrollbar select-none">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const catColor = getCategoryColor(cat.name);
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setTab('catalog');
                }}
                className="shrink-0 snap-start flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                style={{
                  borderColor: catColor.primary + '40',
                  backgroundColor: catColor.light,
                  color: catColor.textColor,
                }}
              >
                <span className="text-sm shrink-0">{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTIFICATION PROMPT */}
      {showNotificationPrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-orange-200 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 text-xs gap-3 animate-fade-in shadow-sm mx-1">
          <div className="flex gap-2.5 items-start sm:items-center">
            <span className="p-2 rounded-xl shrink-0 bg-orange-500 text-white">
              <Bell size={16} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-zinc-900 text-xs">Activar Notificaciones</span>
              <span className="text-[11px] text-zinc-500 leading-normal">Recibe alertas de tus pedidos y promociones de BurgerPop.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 md:justify-end">
            <button type="button" onClick={() => setShowNotificationPrompt(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors uppercase font-mono font-bold text-[10px] px-2 py-1.5 cursor-pointer">
              Cerrar
            </button>
            <button type="button" onClick={handleRequestPermissionHome} className="text-white font-extrabold max-sm:w-full uppercase tracking-wider px-5 py-2.5 rounded-xl text-[11px] transition-all cursor-pointer bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md">
              Habilitar
            </button>
          </div>
        </div>
      )}

      {/* PROMOS DEL DÍA */}
      {promoParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #FF6B35, #FFB703)' }}><Zap size={16} className="text-white" /></span> 🔥 Promos del Día
            </h3>
            <button type="button" onClick={() => { setSelectedCategory(''); setTab('catalog'); }} className="text-[13px] font-extrabold cursor-pointer transition-colors" style={{ color: '#FF6B35' }}>
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {promoParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} isOffer={true} />
            ))}
          </div>
        </div>
      )}

      {/* NUEVOS EN EL MENÚ */}
      {newParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}><Sparkles size={16} className="text-white" /></span> ✨ Nuevos en el Menú
            </h3>
            <button type="button" onClick={() => { setSelectedCategory(''); setTab('catalog'); }} className="text-[13px] font-extrabold cursor-pointer transition-colors" style={{ color: '#F59E0B' }}>
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {newParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} />
            ))}
          </div>
        </div>
      )}

      {/* LO MÁS PEDIDO */}
      {bestsellerParts.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg, #E63946, #FF6B6B)' }}><Flame size={16} className="text-white" /></span> 🏆 Lo Más Pedido
            </h3>
            <button type="button" onClick={() => { setSelectedCategory(''); setTab('catalog'); }} className="text-[13px] font-extrabold cursor-pointer transition-colors" style={{ color: '#E63946' }}>
              Ver todo
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 px-4 -mx-4 snap-x snap-mandatory scroll-smooth no-scrollbar">
            {bestsellerParts.map((part) => (
              <ProductCard key={part.id} part={part} config={config} onViewProductDetails={onViewProductDetails} addToCart={addToCart} />
            ))}
          </div>
        </div>
      )}

      {/* PEDIDO ESPECIAL / EVENTOS */}
      <div className="flex flex-col gap-4 p-5 border border-orange-100 rounded-2xl bg-orange-50/50 shadow-sm relative overflow-hidden mx-1">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
          <MessageSquare size={20} className="text-orange-500" /> 🍔 ¿Pedido para Evento o Fiesta?
        </h3>
        <p className="text-[13px] text-orange-800/80 leading-relaxed font-medium">Cuéntanos cuántas burgers necesitas y las preparamos para ti.</p>
        <div className="flex flex-col gap-3 z-10">
          <input 
            type="text"
            id="req-phone"
            defaultValue={currentUser?.telefono || ''}
            className="w-full text-xs p-3.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-[13px]" 
            placeholder="Tu número (Ej: +584120001122)"
          />
          <textarea 
            className="w-full text-xs p-3.5 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-[13px]" 
            placeholder="Ej: 30 smash burgers, papas para evento, combo familiar..."
            id="req-desc"
            rows={3}
          />
          <button
            onClick={async () => {
              const descEl = document.getElementById('req-desc') as HTMLTextAreaElement;
              const phoneEl = document.getElementById('req-phone') as HTMLInputElement;
              const desc = descEl?.value;
              const phone = phoneEl?.value;
              if (desc?.trim() && phone?.trim()) {
                const success = await requestPart(currentUser?.nombre || 'Invitado', phone.trim(), desc.trim());
                if (success) {
                  descEl.value = '';
                  alert('¡Solicitud enviada! Nuestro equipo te contactará pronto.');
                } else {
                  alert('Error al enviar solicitud.');
                }
              } else {
                alert('Por favor, ingresa tu teléfono y tu solicitud.');
              }
            }}
            className="text-white rounded-xl py-3.5 font-bold text-xs cursor-pointer shadow-md transition-all active:scale-[0.98] text-[13px] bg-orange-500 hover:bg-orange-600"
          >
            Enviar Solicitud
          </button>
        </div>
        <a 
          href={`https://wa.me/${getWhatsAppPhone().replace(/[^0-9]/g, '')}`}
          target="_blank"
          className="text-center text-xs font-semibold text-orange-600 underline mt-1 cursor-pointer hover:text-orange-700 text-[13px]"
        >
          O contactar vía WhatsApp
        </a>
      </div>

      <BentoGrid />

      {/* PWA INSTALL BANNER */}
      <div className="w-full bg-zinc-900 text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden min-h-[240px] flex flex-col justify-center border border-zinc-800 select-none bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center mx-1">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className="text-[10px] uppercase font-black tracking-widest text-white px-2.5 py-1 rounded-lg bg-orange-500">{config.site_nombre || 'BurgerPop'} App</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-300">Instalación Express</span>
            </div>
            <h3 className="text-2xl font-black font-display mt-2 leading-tight max-w-xs">Tu BurgerPop favorita siempre contigo</h3>
            <p className="text-[12px] text-zinc-200 leading-relaxed mt-2 max-w-sm font-medium">
              Instala la app y recibe notificaciones en tiempo real, seguimiento de delivery y ofertas exclusivas en burgers, combos y más.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
            {deferredPrompt ? (
              <button
                type="button"
                onClick={onInstallClick}
                className="bg-white hover:bg-zinc-100 text-zinc-900 font-black font-display uppercase tracking-wider px-8 py-4 rounded-xl text-[11px] transition-all cursor-pointer shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <Smartphone size={16} /> <span>Descargar App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (isiOS) {
                    alert("Para instalar en iPhone: 1. Abre Safari. 2. Presiona 'Compartir'. 3. Selecciona 'Agregar a inicio'.");
                  } else {
                    alert("Para instalar en Android: 1. Abre Chrome. 2. Presiona los 3 puntos. 3. Selecciona 'Instalar aplicación'.");
                  }
                }}
                className="text-white border border-orange-400 font-bold font-display uppercase tracking-wider px-6 py-3 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <span>¿Cómo instalar?</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-zinc-200 pt-8 pb-4 px-1 text-zinc-600">
        <h2 className="text-sm font-black font-display text-zinc-900 uppercase tracking-widest mb-3">
          🍔 La Mejor Hamburguesería de Valencia
        </h2>
        <p className="text-xs leading-relaxed text-zinc-500 mb-3 font-sans">
          ¿Buscas la mejor smash burger de Valencia? <strong>{config.site_nombre || 'BurgerPop'}</strong> es tu hamburguesería favorita. Smash burgers artesanales, papas & wings, combos, nuggets y más. Ingredientes frescos del día y recetas originales.
        </p>
        <p className="text-xs leading-relaxed text-zinc-500 mb-4 font-sans">
          Delivery rápido en minutos. Seguimiento en tiempo real de tu pedido. Aceptamos pagos en dólares, Zelle, Pago Móvil y efectivo. Tu smash burger caliente y fresca en la puerta de tu casa.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono border-t border-zinc-100 pt-4 text-zinc-400">
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Smash Burgers</h3>
            <p>Carne smash a la plancha, vegetales frescos, salsas artesanales.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Papas & Wings</h3>
            <p>Papas crocantes, alitas BBQ, wings de buffalo.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Combos</h3>
            <p>Combos individuales, familiares y para evento.</p>
          </div>
          <div>
            <h3 className="font-bold text-zinc-700 uppercase mb-1">Delivery Express</h3>
            <p>Tu smash burger caliente en minutos. Seguimiento en vivo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
