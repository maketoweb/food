import React, { useState } from 'react';
import {
  Home,
  Grid,
  ShoppingCart,
  Menu,
  X,
  PhoneCall,
  MapPin,
  ShieldAlert,
  User,
  MessageCircle,
  Utensils,
  Tag,
  Mail,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

interface NavigationProps {
  currentTab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile';
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
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
  const { cart, config, isAdminAuthenticated, logoutAdmin, currentUser, notifications } = useApp();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getWhatsAppPhone = () => {
    const active = config.sedes?.filter((s) => s.activa);
    return active && active.length > 1 ? active[0].telefono : config.telefono_soporte;
  };

  const unreadCount = currentUser
    ? notifications.filter(
        (n) =>
          !n.leida &&
          (n.tipo === 'todos' ||
            (n.tipo === 'personal' && n.destinatario_telefono?.trim() === currentUser.telefono.trim()))
      ).length
    : 0;

  const navLinks = [
    { label: 'Inicio', tab: 'home' as const, icon: Home },
    { label: 'Menú', tab: 'catalog' as const, icon: Grid },
    { label: 'Combos', tab: 'catalog' as const, icon: Tag },
    { label: 'Contacto', tab: 'profile' as const, icon: Mail },
  ];

  return (
    <>
      {/* DESKTOP TOP HEADER — lg and up */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-100 shadow-sm h-16">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6 h-full">
          {/* Left: Brand */}
          <button
            type="button"
            onClick={() => setTab('home')}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="text-2xl font-black tracking-tight text-zinc-900" style={{ fontFamily: 'var(--font-display)' }}>
              {config.site_nombre}
            </span>
          </button>

          {/* Center: Navigation Links */}
          <nav className="flex items-center gap-1 ml-12">
            {navLinks.map((link) => {
              const isActive = currentTab === link.tab && (
                link.tab === 'home'
                  ? currentTab === 'home'
                  : link.tab === 'catalog'
                    ? link.label === 'Menú'
                      ? currentTab === 'catalog'
                      : currentTab === 'catalog'
                    : currentTab === link.tab
              );
              return (
                <button
                  type="button"
                  key={link.label}
                  onClick={() => setTab(link.tab)}
                  className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Cart + WhatsApp */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <button
              type="button"
              onClick={() => setTab('cart')}
              className="relative p-2.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={20} className="text-zinc-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold px-1 leading-none">
                  {cartCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR — Pop Vibrant */}
      <nav
        id="bottom-bar"
        className="fixed bottom-0 left-0 right-0 z-50 h-[72px] bg-white border-t border-zinc-100 px-2 pb-2 flex items-start justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden safe-area-bottom"
      >
        {/* Nav: Inicio */}
        <button onClick={() => setTab('home')}
          className={`flex flex-col items-center justify-center flex-1 pt-2 transition-colors relative ${currentTab === 'home' ? 'text-pop-pink' : 'text-zinc-400'}`}
        >
          {currentTab === 'home' && <span className="absolute top-0 w-6 h-[3px] rounded-full bg-pop-pink" />}
          <Home size={20} strokeWidth={currentTab === 'home' ? 2.5 : 1.8} />
          <span className="text-[10px] mt-0.5 font-semibold">Inicio</span>
        </button>

        {/* Nav: Menú */}
        <button onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 pt-2 transition-colors relative ${currentTab === 'catalog' ? 'text-pop-pink' : 'text-zinc-400'}`}
        >
          <Grid size={20} strokeWidth={currentTab === 'catalog' ? 2.5 : 1.8} />
          <span className="text-[10px] mt-0.5 font-semibold">Menú</span>
        </button>

        {/* Nav: Carrito */}
        <button onClick={() => setTab('cart')}
          className={`flex flex-col items-center justify-center flex-1 pt-2 transition-colors relative ${currentTab === 'cart' ? 'text-pop-pink' : 'text-zinc-400'}`}
        >
          {currentTab === 'cart' && <span className="absolute top-0 w-6 h-[3px] rounded-full bg-pop-pink" />}
          <div className="relative">
            <ShoppingCart size={20} strokeWidth={currentTab === 'cart' ? 2.5 : 1.8} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-pop-pink text-white text-[9px] font-bold px-1 leading-none shadow-lg">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">Carrito</span>
        </button>

        {/* Nav: Perfil */}
        <button onClick={() => setTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 pt-2 transition-colors relative ${currentTab === 'profile' ? 'text-pop-pink' : 'text-zinc-400'}`}
        >
          {currentTab === 'profile' && <span className="absolute top-0 w-6 h-[3px] rounded-full bg-pop-pink" />}
          <div className="relative">
            <User size={20} strokeWidth={currentTab === 'profile' ? 2.5 : 1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-pop-red border-2 border-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">{currentUser ? 'Perfil' : 'Ingresar'}</span>
        </button>
      </nav>
      <div className="h-[72px] lg:hidden" />

      {/* MOBILE DRAWER PANEL */}
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
            <div className="flex flex-col">
              <span className="font-bold text-lg text-zinc-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {config.site_nombre}
              </span>
              <span className="text-[10px] text-orange-500 font-mono tracking-wider font-semibold">Delivery Express</span>
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
              <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest px-3 py-2">
                Navegar
              </span>

              <button
                type="button"
                onClick={() => { setTab('home'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'home' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Home size={16} /> Inicio
              </button>

              <button
                type="button"
                onClick={() => { setTab('catalog'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'catalog' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <Grid size={16} /> Nuestro Menú
              </button>

              <button
                type="button"
                onClick={() => { setTab('catalog'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer text-zinc-600 hover:bg-zinc-50`}
              >
                <Tag size={16} /> Combos
              </button>

              <button
                type="button"
                onClick={() => { setTab('cart'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'cart' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <ShoppingCart size={16} /> Mi Pedido
              </button>

              <button
                type="button"
                onClick={() => { setTab('profile'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium transition-all cursor-pointer ${
                  currentTab === 'profile' ? 'bg-orange-50 text-orange-600 font-semibold' : 'text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <User size={16} /> Mi Cuenta
              </button>
            </div>

            {/* Quick actions */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest px-3 py-2">
                Acciones Rápidas
              </span>

              <a
                href={`https://wa.me/${getWhatsAppPhone().replace(/[+ ]/g, '')}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-zinc-600 hover:bg-green-50 hover:text-green-600 rounded-lg font-medium transition-all"
              >
                <MessageCircle size={16} className="text-green-500" /> WhatsApp Directo
              </a>
            </div>

            {/* Store info */}
            <div className="mt-4 pt-3 border-t border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-widest px-3 py-2 block">
                Nuestro Local
              </span>
              <div className="flex gap-2 px-3 text-xs text-zinc-500 leading-relaxed">
                <MapPin size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                <p>{config.direccion_fisica}</p>
              </div>
            </div>
          </div>

          {/* Admin login */}
          <div className="p-3 border-t border-zinc-100">
            {isAdminAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] text-zinc-400 font-mono">Sesión Admin Activa</span>
                </div>
                <button
                  type="button"
                  onClick={() => { logoutAdmin(); setDrawerOpen(false); setTab('home'); }}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Cerrar Sesión Admin
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); onTriggerAdminLogin(); }}
                className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 text-xs py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldAlert size={14} className="text-zinc-400" />
                Acceso Administrativo
              </button>
            )}
            <div className="text-[9px] text-zinc-300 font-mono text-center mt-2">
              {config.site_nombre || 'BurgerPop'} v2.0.0
            </div>
          </div>
        </aside>
      </div>

    </>
  );
};
