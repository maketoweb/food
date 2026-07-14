import React from 'react';
import {
  Home,
  ShoppingCart,
  Menu,
  X,
  MapPin,
  User,
  MessageCircle,
  Tag,
  LogOut,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

interface NavigationProps {
  currentTab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout';
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
  onTriggerAdminLogin: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setTab,
  onTriggerAdminLogin,
  drawerOpen,
  setDrawerOpen,
}) => {
  const { cart, config, currentUser, logoutUser } = useApp();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const logoUrl = config.logo_url || '';
  const themeColor = config.theme_color || '#E31837';

  // Hide mobile header on catalog page for native app feel
  const hideMobileHeader = currentTab === 'catalog';

  const getWhatsAppPhone = () => {
    const active = config.sedes?.filter((s) => s.activa);
    if (active && active.length > 0) {
      // Use per-store WhatsApp number if available, otherwise fall back to phone or global
      return active[0].whatsapp_numero || active[0].telefono || config.telefono_soporte;
    }
    return config.telefono_soporte;
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
          DESKTOP HEADER — Chipotle-style 3-column sticky bar
          ═══════════════════════════════════════════════════════════ */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 h-16 items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-8 h-full">

          {/* Left: Circular Logo */}
          <button
            type="button"
            onClick={() => setTab('home')}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={config.site_nombre}
                className="w-10 h-10 rounded-full object-cover border-2 border-zinc-200 group-hover:border-zinc-400 transition-colors"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center text-sm font-black font-display">
                {(config.site_nombre || 'F').charAt(0)}
              </div>
            )}
          </button>

          {/* Center: Navigation Links */}
          <nav className="flex items-center gap-2">
            {[
              { label: 'MENÚ', tab: 'catalog' as const },
              { label: 'UBICACIONES', tab: 'catalog' as const },
              { label: 'RECOMPENSAS', tab: 'profile' as const },
            ].map((link) => {
              const isActive = currentTab === link.tab;
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => setTab(link.tab)}
                  className={`px-5 py-2 text-[13px] font-bold tracking-wide uppercase transition-colors cursor-pointer rounded-full ${
                    isActive
                      ? 'text-zinc-900'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Sign In + Cart */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="text-[13px] font-bold tracking-wide uppercase text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  HOLA, {currentUser.nombre.split(' ')[0].toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => { logoutUser(); setTab('home'); }}
                  className="p-2 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTab('profile')}
                className="text-[13px] font-bold tracking-wide uppercase text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                INICIAR SESIÓN
              </button>
            )}

            <button
              type="button"
              onClick={() => setTab('checkout')}
              className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Carrito de compras"
            >
              <ShoppingCart size={22} className="text-zinc-800" strokeWidth={1.8} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1 leading-none" style={{ backgroundColor: themeColor }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE HEADER — Hidden on catalog for native app feel
          ═══════════════════════════════════════════════════════════ */}
      {!hideMobileHeader && (
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 h-14 flex items-center justify-between px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 -ml-1 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <Menu size={22} className="text-zinc-800" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setTab('home')}
            className="flex items-center gap-2 cursor-pointer"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={config.site_nombre}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <div className="w-9 h-9 bg-zinc-900 text-white flex items-center justify-center text-sm font-black font-display">
                {(config.site_nombre || 'F').charAt(0)}
              </div>
            )}
            <span className="text-sm font-extrabold text-zinc-900 tracking-tight font-display hidden sm:inline">
              {config.site_nombre}
            </span>
          </button>
        </div>

        {/* Right: Cart */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('checkout')}
            className="relative p-2 -mr-1 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
            aria-label="Carrito de compras"
          >
            <ShoppingCart size={22} className="text-zinc-800" strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1 leading-none" style={{ backgroundColor: themeColor }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MOBILE DRAWER PANEL — Slide-in side menu
          ═══════════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 lg:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />

        <aside
          className={`absolute top-0 bottom-0 left-0 w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out z-10 ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-zinc-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={config.site_nombre} className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-zinc-900 text-white flex items-center justify-center text-sm font-black font-display">
                  {(config.site_nombre || 'F').charAt(0)}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-900 tracking-tight font-display">
                  {config.site_nombre}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-wider">Delivery Rápido</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-3 px-3 no-scrollbar">
            <div className="flex flex-col gap-0.5">
              {[
                { label: 'Inicio', tab: 'home' as const, icon: Home },
                { label: 'Nuestro Menú', tab: 'catalog' as const, icon: Tag },
                { label: 'Mi Pedido', tab: 'checkout' as const, icon: ShoppingCart },
                { label: 'Mi Cuenta', tab: 'profile' as const, icon: User },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => { setTab(item.tab); setDrawerOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer ${
                    currentTab === item.tab ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <item.icon size={16} /> {item.label}
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col gap-0.5">
              <a
                href={`https://wa.me/${getWhatsAppPhone().replace(/[+ ]/g, '')}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-zinc-600 hover:bg-green-50 hover:text-green-600 rounded-lg font-medium transition-all"
              >
                <MessageCircle size={16} className="text-green-500" /> WhatsApp Directo
              </a>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => { logoutUser(); setTab('home'); setDrawerOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg font-medium transition-all cursor-pointer"
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              )}
            </div>

            {/* Store info */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <div className="flex gap-2 px-3 text-xs text-zinc-500 leading-relaxed">
                <MapPin size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                <p>{config.direccion_fisica}</p>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="p-3 border-t border-zinc-100">
            <div className="text-[9px] text-zinc-300 font-mono text-center">
              {config.site_nombre || 'FoodPop'} v2.0.0
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
