import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Checkout } from './pages/Checkout';
import { Admin } from './pages/Admin';
import { UserProfile } from './pages/UserProfile';
import { Navigation } from './components/Navigation';
import { FoodItem, SelectedOption } from './types/store';
import { PushNotificationModal } from './components/PushNotificationModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductOptionsEditor } from './components/ProductOptionsEditor';
import { 
  X, ShoppingCart, Landmark, ShieldCheck, Tag, Info, AlertOctagon, 
  HelpCircle, Eye, Share2, ClipboardCheck, ChevronLeft, ChevronRight,
  Menu, Sparkles, Bell, User, Cpu, ShoppingBag, MapPin, ShieldAlert, RefreshCw,
  Search, ArrowRight, Download, Check
} from 'lucide-react';
import { SEOHead } from './components/SEOHead';
import { getCategoryColor } from './utils/categoryColors';

function AppContent() {
  const { cart, config, addToCart, isAdminAuthenticated, authenticateAdmin, logoutAdmin, currentUser, notifications, displayCurrency, toggleCurrency, isGlobalLoading } = useApp();

  // Cache-busting para el logo: fuerza recarga cuando cambia
  const logoUrl = useMemo(() => config.logo_url ? `${config.logo_url}?v=${encodeURIComponent(config.logo_url)}` : '', [config.logo_url]);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Route/Tab controllers
  const [tab, setTab] = useState<'home' | 'catalog' | 'cart' | 'admin' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Custom Overlays & Modals
  const [selectedProductDetails, setSelectedProductDetails] = useState<FoodItem | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [headerSearchInput, setHeaderSearchInput] = useState<string>('');

  useEffect(() => {
    setHeaderSearchInput(globalSearch);
  }, [globalSearch]);

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminUserInput, setAdminUserInput] = useState('');
  const [microModalQuantity, setMicroModalQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedProductOptions, setSelectedProductOptions] = useState<SelectedOption[]>([]);
  const [optionsTotal, setOptionsTotal] = useState(0);
  const [removedIngredients, setRemovedIngredients] = useState<Set<number>>(new Set());

  const resetAllFilters = () => {
    setSelectedCategory('');
    setGlobalSearch('');
  };

  // Auto reset image index on active detail change
  useEffect(() => {
    setActiveImageIdx(0);
    setMicroModalQuantity(1);
    setSelectedProductOptions([]);
    setOptionsTotal(0);
    setRemovedIngredients(new Set());
  }, [selectedProductDetails]);
  
  // Authentication trigger helper
  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await authenticateAdmin(adminUserInput, adminPasswordInput);
    if (success) {
      setTab('admin');
      setIsAdminLoginOpen(false);
      setAdminPasswordInput('');
      setAdminUserInput('');
    } else {
      alert('Credenciales incorrectas');
    }
  };

  const getWhatsAppPhone = () => { const active = config.sedes?.filter(s => s.activa); return active && active.length > 1 ? active[0].telefono : config.telefono_soporte; };

  const handleShareProduct = (part: FoodItem) => {
    const text = `🍏 *${part.nombre}* en *${config.site_nombre || 'nuestra tienda'}* por un precio de *$${part.precio_usd.toFixed(2)} USD*. ¡Pídelo directo al delivery express de ${config.site_nombre || 'nuestra tienda'}!`;
    const phone = getWhatsAppPhone().replace(/[+ ]/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalSearch(headerSearchInput);
    setTab('catalog');
  };

  // Header / Navigation helpers
  const navigateToCatalog = (filters?: { category?: string }) => {
    if (filters?.category !== undefined) setSelectedCategory(filters.category);
    setTab('catalog');
  };

  if (isGlobalLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="z-10 flex flex-col items-center">
          <style>{`
            @keyframes logoZoomIn {
              0% { transform: scale(0.2); opacity: 0; }
              60% { transform: scale(1.15); opacity: 1; }
              80% { transform: scale(0.95); }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes nameSlideUp {
              0% { transform: translateY(20px); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes pulseGlow {
              0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.3); }
              50% { box-shadow: 0 0 40px rgba(255,255,255,0.6); }
            }
          `}</style>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={config.site_nombre || 'Tienda'}
              className="w-28 h-28 object-contain rounded-3xl mb-5"
              style={{ animation: 'logoZoomIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, pulseGlow 2s ease-in-out infinite 0.8s' }}
            />
          ) : (
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center mb-5"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', animation: 'logoZoomIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards, pulseGlow 2s ease-in-out infinite 0.8s' }}
            >
              <ShoppingBag size={48} />
            </div>
          )}
          <h1
            className="text-3xl font-extrabold font-display tracking-tight"
            style={{ animation: 'nameSlideUp 0.6s ease-out 0.4s both' }}
          >
            {config.site_nombre || 'BurgerPop'}
          </h1>
          <p
            className="text-violet-200 font-mono text-xs uppercase tracking-widest mt-2"
            style={{ animation: 'nameSlideUp 0.6s ease-out 0.6s both' }}
          >
            Cargando menú...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 w-full flex justify-center">
      <SEOHead />
      <PushNotificationModal />

      {/* Main Grid Wrapper */}
      <div className="w-full bg-white flex flex-col min-h-screen relative">
         {/* A. COLLAPSIBLE LEFT SIDEBAR - Dynamic on Desktop/PC and Mobile */}
        {drawerOpen && (
          <aside className="hidden lg:flex w-[290px] bg-zinc-50 border-r border-zinc-200 flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto no-scrollbar select-none animate-fade-in">
            <div className="flex flex-col">
              {/* Logo e Identidad Visual with X Close Button */}
              <div className="px-5 py-4 border-b border-zinc-200 bg-white flex justify-between items-center select-none">
                <div 
                  onClick={() => { setTab('home'); resetAllFilters(); }}
                  className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={config.site_nombre} className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl border flex items-center justify-center shadow-sm transition-all shrink-0 group-hover:text-white" style={{ backgroundColor: `${config.theme_color || '#0f5d34'}15`, borderColor: `${config.theme_color || '#0f5d34'}25`, color: config.theme_color || '#0f5d34' }}>
                      <ShoppingBag size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="flex flex-col truncate">
                    <h1 className="text-sm font-extrabold tracking-tight text-zinc-900 font-display leading-tight line-clamp-1">
                      <span className="text-zinc-900 transition-colors duration-150" style={{ ['--tw-group-hover-color' as any]: config.theme_color || '#0f5d34' }}>{config.site_nombre}</span>
                    </h1>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-[0.22em] font-mono leading-none mt-1">
                      Delivery Express
                    </span>
                  </div>
                </div>

                {/* Close Button X for Desktop/PC */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="text-zinc-400 hover:text-violet-600 p-1.5 rounded-lg hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="Colapsar Menú"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Panel de Moneda Preferida */}
              <div className="p-4 border-b border-zinc-250 bg-violet-50/20 text-xs">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block mb-2 font-mono">Moneda de Visualización</span>
                <button
                  type="button"
                  onClick={toggleCurrency}
                  className="w-full flex items-center justify-between text-zinc-650 font-mono gap-1 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg hover:border-violet-300 transition-colors cursor-pointer active:scale-95 shadow-sm"
                >
                  <div className="flex items-center gap-2 font-bold text-zinc-800">
                    <RefreshCw size={13} style={{ color: config.theme_color || '#0f5d34' }} /> 
                    {displayCurrency === 'USD' ? 'Dólares (USD)' : 'Bolívares (Bs.)'}
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded uppercase" style={{ color: config.theme_color || '#0f5d34', backgroundColor: `${config.theme_color || '#0f5d34'}15` }}>Cambiar</span>
                </button>
              </div>

              {/* Listado de Secciones de Navegación Estática */}
              <div className="p-3.5 flex flex-col gap-1.5 pt-4">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider px-3 py-1 font-mono">Secciones</span>
                
                <button
                  type="button"
                  onClick={() => setTab('home')}
                  style={tab === 'home' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'home' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Inicio tienda
                </button>

                <button
                  type="button"
                  onClick={() => navigateToCatalog()}
                  style={tab === 'catalog' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'catalog' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Nuestro Menú
                </button>

                <button
                  type="button"
                  onClick={() => setTab('cart')}
                  style={tab === 'cart' ? { backgroundColor: config.theme_color || '#7c3aed' } : {}}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'cart' ? 'text-white shadow-md shadow-violet-500/10' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                >
                  Carrito de compras
                  {cart.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {cart.reduce((acc, ci) => acc + ci.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer ${tab === 'profile' ? 'text-white shadow-md' : 'text-zinc-750 hover:bg-zinc-200/50'}`}
                  style={tab === 'profile' ? { backgroundColor: config.theme_color || '#0f5d34' } : undefined}
                >
                  Mi Cuenta / Perfil
                </button>
              </div>

              {/* Accesos Rápidos de Utilidad */}
              <div className="p-3.5 border-t border-zinc-200 flex flex-col gap-1 pt-4">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider px-3 py-1 font-mono">Enlaces rápidos</span>
                
                <a
                  href={`https://wa.me/${getWhatsAppPhone().replace(/[+ ]/g, '')}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-xs hover:opacity-80 rounded-xl font-bold transition-all cursor-pointer"
                  style={{ color: config.theme_color || '#0f5d34' }}
                >
                  Soporte en WhatsApp
                </a>

                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-all cursor-pointer shadow-sm animate-pulse"
                  >
                    <Download size={14} /> Instalar {config.site_nombre || 'App'}
                  </button>
                )}
              </div>

              {/* Sede Física */}
              <div className="p-4 border-t border-zinc-200 flex flex-col gap-2 bg-zinc-100/20 text-xs">
                <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider font-mono">Nuestra Sede</span>
                <div className="flex gap-2 text-zinc-650 leading-relaxed font-sans mt-0.5 font-medium">
                  <MapPin size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-snug">{config.direccion_fisica}</p>
                </div>
              </div>
            </div>

            {/* Estado de la Sesión Administrativa */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-100/50 flex flex-col gap-3">
              {isAdminAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setTab('admin')}
                    className="w-full text-white text-[11px] py-2 px-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer animate-pulse hover:opacity-90"
                    style={{ backgroundColor: config.theme_color || '#0f5d34' }}
                  >
                    Panel de Admin
                  </button>
                  <button
                     type="button"
                     onClick={() => { logoutAdmin(); setTab('home'); }}
                     className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 text-[10px] py-1.5 rounded-lg font-semibold transition-all font-mono cursor-pointer"
                  >
                    Salir de Admin
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(true)}
                  className="w-full bg-zinc-200/70 hover:bg-zinc-200 text-zinc-850 border border-zinc-300 text-[10px] py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all font-mono cursor-pointer"
                >
                  <ShieldAlert size={12} className="text-yellow-600" />
                  Acceso Admin
                </button>
              )}
              <div className="text-[9px] text-zinc-400 font-mono text-center select-none">
                {config.site_nombre || 'App'} v1.0.1 DESKTOP
              </div>
            </div>
          </aside>
        )}

        {/* B. RIGHT VIEWS PANE - Adapts fluidly, takes remaining screen size */}
        <div className="flex-1 flex flex-col min-h-screen relative pb-20 lg:pb-8 overflow-x-hidden">
          <SEOHead />

          {/* 1. PREMIUM HEADER SYSTEM - Woolworths Inspired */}
          <div className="sticky top-0 z-40 flex flex-col w-full select-none shadow-sm">
            {/* A. Top Header Bar */}
            <div className="text-white py-2.5 px-4 flex items-center justify-between gap-3" style={{ background: `linear-gradient(135deg, ${config.theme_color || '#0f5d34'}, ${config.theme_color ? config.theme_color + 'cc' : '#1a8a5a'})` }}>
              {/* Menu Trigger & Brand Logo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="p-1.5 text-white hover:bg-violet-750 rounded-lg transition-all cursor-pointer flex items-center justify-center active:scale-95"
                  title="Toggle Menú"
                >
                  <Menu size={20} />
                </button>
                <div 
                  onClick={() => { setTab('home'); resetAllFilters(); }}
                  className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={config.site_nombre} className="w-8 h-8 object-contain rounded" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white transition-all">
                      <ShoppingBag size={18} />
                    </div>
                  )}
                  <span className="text-base font-extrabold tracking-tight text-white font-display hidden sm:inline-block">
                    {config.site_nombre}
                  </span>
                </div>
              </div>

              {/* Central Search Bar */}
              <form onSubmit={handleHeaderSearchSubmit} className="flex-1 max-w-lg relative flex items-center">
                <input
                  type="text"
                  value={headerSearchInput}
                  onChange={(e) => setHeaderSearchInput(e.target.value)}
                  placeholder="Buscar hamburguesas, pizzas, pastas..."
                  className="w-full bg-white/90 backdrop-blur-sm text-zinc-900 placeholder-zinc-400 rounded-xl pl-3.5 pr-10 py-1.5 text-xs shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-sans border border-white/20 outline-none focus:ring-2 transition-all"
                  style={{ ['--tw-ring-color' as any]: config.theme_color || '#0f5d34', ['--tw-ring-offset-color' as any]: 'transparent' } as React.CSSProperties}
                />
                <button
                  type="submit"
                  className="absolute right-0.5 top-0.5 bottom-0.5 px-3 text-white rounded-md transition-colors cursor-pointer flex items-center justify-center hover:opacity-90"
                  style={{ backgroundColor: config.theme_color ? `color-mix(in srgb, ${config.theme_color} 85%, black)` : '#0f5d34' }}
                >
                  <Search size={14} />
                </button>
              </form>

              {/* User Avatar & Cart summary */}
              <div className="flex items-center gap-2 shrink-0">
                {isAdminAuthenticated && (
                  <button
                    type="button"
                    onClick={() => setTab('admin')}
                    className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all border font-mono text-[11px] cursor-pointer active:scale-95 text-white font-bold shadow-sm hover:opacity-90"
                    style={{ backgroundColor: config.theme_color ? `color-mix(in srgb, ${config.theme_color} 80%, black)` : '#0a3d26', borderColor: config.theme_color ? `color-mix(in srgb, ${config.theme_color} 70%, black)` : '#0a3d26' }}
                    title="Panel de Administración"
                  >
                    <ShieldAlert size={13} />
                    <span className="hidden md:inline">Panel Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border font-mono text-xs cursor-pointer active:scale-95 ${
                    currentUser 
                      ? 'bg-white/20 text-white border-white/30 font-bold' 
                      : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20'
                  }`}
                  title={currentUser ? `Hola, ${currentUser.nombre}` : "Mi cuenta"}
                >
                  {currentUser ? (
                    <span className="uppercase text-[10px] font-black">{currentUser.nombre.charAt(0)}</span>
                  ) : (
                    <User size={14} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTab('cart')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold transition-all shadow-[0_2px_12px_rgba(0,0,0,0.15)] active:scale-95 cursor-pointer text-xs font-mono hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #F472B6, #A855F7)' }}
                >
                  <ShoppingCart size={15} />
                  <span className="hidden sm:inline text-[11px]">Carrito</span>
                  <span className="bg-black/15 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    {cart.reduce((acc, ci) => acc + ci.quantity, 0)}
                  </span>
                  <span className="border-l border-white/20 pl-1.5 hidden md:inline text-[11px]">
                    {displayCurrency === 'USD' 
                      ? `$${cart.reduce((acc, ci) => acc + (ci.item.precio_usd * ci.quantity), 0).toFixed(2)}` 
                      : `${(cart.reduce((acc, ci) => acc + (ci.item.precio_usd * ci.quantity), 0) * config.tasa_cambio).toFixed(2)} Bs`}
                  </span>
                </button>
              </div>
            </div>

            {/* B. Secondary Navigation Row */}
            <div className="bg-white border-b border-zinc-200 py-2 px-4 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="text-zinc-700 hover:text-violet-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Menu size={14} /> Ver Carta
                </button>
                <div className="h-4 w-px bg-zinc-200"></div>
                <button
                  type="button"
                  onClick={() => setTab('home')}
                  className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'home' ? '' : 'text-zinc-500 hover:text-zinc-800'}`}
                  style={tab === 'home' ? { color: config.theme_color || '#0f5d34' } : undefined}
                >
                  Inicio
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(''); setTab('catalog'); }}
                  className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'catalog' ? '' : 'text-zinc-500 hover:text-zinc-800'}`}
                  style={tab === 'catalog' ? { color: config.theme_color || '#0f5d34' } : undefined}
                >
                  Productos
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('catalog'); }}
                  className="text-xs font-bold cursor-pointer hover:opacity-80"
                  style={{ color: config.theme_color || '#0f5d34' }}
                >
                  Ofertas
                </button>
                {isAdminAuthenticated && (
                  <>
                    <div className="h-4 w-px bg-zinc-200"></div>
                    <button
                      type="button"
                      onClick={() => setTab('admin')}
                      className={`text-xs font-bold transition-colors cursor-pointer ${tab === 'admin' ? '' : 'text-zinc-500 hover:text-zinc-800'}`}
                      style={tab === 'admin' ? { color: config.theme_color || '#0f5d34' } : undefined}
                    >
                      Panel Admin
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 shrink-0 text-xs font-medium">
                <MapPin size={12} style={{ color: config.theme_color || '#0f5d34' }} />
                <span>{config.direccion_fisica ? config.direccion_fisica.split(',').slice(-2).join(',').trim() : 'Valencia • Sede Las Acacias'}</span>
              </div>
            </div>
          </div>

      {/* 2. BODY PAGES VIEW DELEGATOR */}
      <main className="flex-1 px-4 lg:px-8 pt-4 lg:pt-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {tab === 'home' && (
          <Home
            setTab={setTab}
            setSelectedCategory={setSelectedCategory}
            onViewProductDetails={setSelectedProductDetails}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            navigateToCatalog={navigateToCatalog}
            deferredPrompt={deferredPrompt}
            onInstallClick={handleInstallClick}
          />
        )}
 
        {tab === 'catalog' && (
          <Catalog
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onViewProductDetails={setSelectedProductDetails}
            passedSearchTerm={globalSearch}
            clearPassedSearchTerm={() => setGlobalSearch('')}
            resetGlobalFilters={resetAllFilters}
          />
        )}
 
        {tab === 'cart' && !showCheckoutModal && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <ShoppingBag size={48} className="text-pop-pink mb-4" />
            <h2 className="text-xl font-display font-bold text-zinc-900 mb-2">Tu Pedido</h2>
            <p className="text-zinc-500 text-sm mb-6">
              {cart.length === 0
                ? 'No has agregado nada al carrito aún.'
                : `Tienes ${cart.reduce((a, c) => a + c.quantity, 0)} artículos en tu pedido.`}
            </p>
            {cart.length > 0 ? (
              <button onClick={() => setShowCheckoutModal(true)}
                className="bg-pop-pink hover:bg-pink-600 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95 text-sm cursor-pointer shadow-xl"
              >
                Ir al Checkout
              </button>
            ) : (
              <button onClick={() => setTab('catalog')}
                className="bg-pop-orange hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-all active:scale-95 text-sm cursor-pointer"
              >
                Ver Menú
              </button>
            )}
          </div>
        )}

        {showCheckoutModal && (
          <CheckoutModal onClose={() => setShowCheckoutModal(false)} />
        )}
 
        {tab === 'admin' && (
          <Admin setTab={setTab} />
        )}
 
        {tab === 'profile' && (
          <UserProfile setTab={setTab} deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />
        )}

        {/* Global Footer with Tasa BCV */}
        <div className="w-full text-center py-6 mt-auto border-t border-zinc-200 bg-white">
          <p className="text-[10px] text-zinc-500 font-mono mb-1 tracking-widest uppercase font-bold">Tasa Cambiaria BCV</p>
          <p className="text-sm font-black text-zinc-800 font-mono tracking-tight">1 USD = {config.tasa_cambio.toFixed(2)} Bs.</p>
        </div>
      </main>

      {/* 3. MOBILE FIXED NAVIGATION CONTROLLERS */}
      <Navigation
        currentTab={tab}
        setTab={setTab}
        onTriggerAdminLogin={() => setIsAdminLoginOpen(true)}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      />

      {/* --------------------------------------------------------------------------------
      A. PRODUCT MODAL - Professional Food Delivery Style
      -------------------------------------------------------------------------------- */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <SEOHead 
            type="product" 
            product={selectedProductDetails} 
          />
          
          <div className="w-full max-w-4xl bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl relative max-h-[95vh] lg:max-h-[90vh] overflow-y-auto no-scrollbar text-zinc-900 animate-slide-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => { setSelectedProductDetails(null); setMicroModalQuantity(1); setSelectedProductOptions([]); setOptionsTotal(0); }}
              className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all cursor-pointer"
            >
              <X size={16} className="text-zinc-600" />
            </button>

            {/* IMAGE SECTION */}
            <div className="relative w-full aspect-[16/7] lg:aspect-[16/6] overflow-hidden bg-zinc-100">
              <img 
                src={selectedProductDetails.imagen_urls[activeImageIdx] || selectedProductDetails.imagen_urls[0]} 
                alt={selectedProductDetails.nombre} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              
              {/* Image Navigation */}
              {selectedProductDetails.imagen_urls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImageIdx(prev => (prev === 0 ? selectedProductDetails.imagen_urls.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageIdx(prev => (prev === selectedProductDetails.imagen_urls.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedProductDetails.imagen_urls.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${activeImageIdx === idx ? 'bg-white w-5' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                {selectedProductDetails.es_promo && (
                  <span className="px-3 py-1 bg-red-500 text-white text-[11px] font-black uppercase rounded-full shadow">Promo</span>
                )}
                {selectedProductDetails.es_nuevo && (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[11px] font-black uppercase rounded-full shadow">Nuevo</span>
                )}
                {selectedProductDetails.es_mas_vendido && !selectedProductDetails.es_promo && (
                  <span className="px-3 py-1 bg-orange-500 text-white text-[11px] font-black uppercase rounded-full shadow">Top</span>
                )}
              </div>
            </div>

            {/* CONTENT SECTION */}
            <div className="p-5 lg:p-8">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full" style={{ backgroundColor: getCategoryColor(selectedProductDetails.categoria).light, color: getCategoryColor(selectedProductDetails.categoria).textColor }}>
                      {selectedProductDetails.categoria}
                    </span>
                    {selectedProductDetails.delivery_gratis && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Delivery Gratis</span>
                    )}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 leading-tight">{selectedProductDetails.nombre}</h2>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{selectedProductDetails.descripcion}</p>
                </div>
                <div className="lg:text-right shrink-0">
                  <div className="text-3xl font-black" style={{ color: getCategoryColor(selectedProductDetails.categoria).primary }}>
                    ${(selectedProductDetails.precio_usd + optionsTotal).toFixed(2)}
                  </div>
                  <div className="text-sm text-zinc-400 font-mono">
                    {((selectedProductDetails.precio_usd + optionsTotal) * config.tasa_cambio).toFixed(2)} Bs
                  </div>
                  {optionsTotal > 0 && (
                    <div className="text-xs text-orange-500 font-semibold mt-1">+${optionsTotal.toFixed(2)} en extras</div>
                  )}
                </div>
              </div>

              {/* INGREDIENTS SECTION */}
              {selectedProductDetails.ingredientes && selectedProductDetails.ingredientes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[10px]">🧀</span>
                    Ingredientes
                    <span className="text-[10px] font-normal text-zinc-400 ml-1">(quita los que no quieras)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProductDetails.ingredientes.map((ing, idx) => {
                      const isRemoved = removedIngredients.has(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const newSet = new Set(removedIngredients);
                            if (newSet.has(idx)) newSet.delete(idx);
                            else newSet.add(idx);
                            setRemovedIngredients(newSet);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                            isRemoved 
                              ? 'bg-red-50 text-red-500 border-red-200 line-through opacity-60' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isRemoved ? <X size={12} /> : <Check size={12} />}
                          {ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EXTRAS / OPTIONS SECTION */}
              {selectedProductDetails.option_groups && selectedProductDetails.option_groups.length > 0 && (
                <div className="mb-6 pt-5 border-t border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-800 mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-[10px]">+</span>
                    Personaliza tu pedido
                  </h3>
                  <ProductOptionsEditor
                    optionGroups={selectedProductDetails.option_groups}
                    selectedOptions={selectedProductOptions}
                    onSelectionChange={(opts, total) => {
                      setSelectedProductOptions(opts);
                      setOptionsTotal(total);
                    }}
                    themeColor={config.theme_color || '#FF6B35'}
                  />
                </div>
              )}

              {/* QUANTITY + ADD TO CART */}
              <div className="flex items-center gap-4 pt-5 border-t border-zinc-100">
                <div className="flex items-center border-2 border-zinc-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMicroModalQuantity(prev => Math.max(1, prev - 1))}
                    className="w-11 h-11 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all text-lg font-bold cursor-pointer"
                  >
                    −
                  </button>
                  <span className="w-11 h-11 flex items-center justify-center text-base font-bold text-zinc-900 border-x-2 border-zinc-200">{microModalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setMicroModalQuantity(prev => prev + 1)}
                    className="w-11 h-11 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all text-lg font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const removedIngredientNames = Array.from(removedIngredients).map(idx => selectedProductDetails.ingredientes?.[idx]).filter(Boolean) as string[];
                    addToCart(selectedProductDetails, microModalQuantity, selectedProductOptions, optionsTotal, removedIngredientNames);
                    setSelectedProductDetails(null);
                    setMicroModalQuantity(1);
                    setSelectedProductOptions([]);
                    setOptionsTotal(0);
                    setRemovedIngredients(new Set());
                  }}
                  className="flex-1 h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] hover:opacity-90 shadow-lg"
                  style={{ background: getCategoryColor(selectedProductDetails.categoria).gradient, boxShadow: `0 4px 20px ${getCategoryColor(selectedProductDetails.categoria).primary}33` }}
                >
                  <ShoppingCart size={16} />
                  Agregar al Carrito · ${(selectedProductDetails.precio_usd * microModalQuantity + optionsTotal * microModalQuantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------------------
      C. ADMINISTRATIVE SECURITY PORTAL LOGIN MODAL
      -------------------------------------------------------------------------------- */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-lg p-5 relative shadow-2xl flex flex-col gap-4 text-zinc-900">
            <button
              type="button"
              onClick={() => setIsAdminLoginOpen(false)}
              className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 p-1 rounded-lg"
            >
              <X size={14} />
            </button>

            <div className="text-center flex flex-col items-center">
              <span className="text-2xl p-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-2xl mb-2">🔑</span>
              <h4 className="text-sm font-bold font-display text-zinc-800 uppercase tracking-wider">Acceso Administrativo Sólido</h4>
              <p className="text-[10px] text-zinc-500 mt-1 leading-normal max-w-[240px]">Para editar el inventario, cambiar la tasa del Bolívar ó ver ingresos de ventas, ingrese la contraseña.</p>
            </div>

            <form onSubmit={handleAdminVerifySubmit} className="flex flex-col gap-3.5 text-xs text-zinc-900">
              <div className="flex flex-col gap-1.5">
                <span>Correo Electrónico *</span>
                <input
                  type="email"
                  required
                  value={adminUserInput}
                  onChange={(e) => setAdminUserInput(e.target.value)}
                  placeholder="Ingrese correo electrónico..."
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-center text-sm tracking-wider font-mono text-blue-600 font-bold"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span>Contraseña *</span>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Ingrese clave..."
                  className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-center text-sm tracking-wider font-mono text-blue-600 font-bold"
                />
              </div>


              {/* Login Action */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(false)}
                  className="bg-zinc-100 hover:bg-zinc-200 py-2 rounded-lg text-zinc-800 border border-zinc-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold font-display tracking-wide uppercase cursor-pointer"
                >
                  INGRESAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
