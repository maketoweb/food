import React, { useState } from 'react';
import { Home, Grid, ShoppingCart, Menu, X, PhoneCall, MapPin, ShieldAlert, User } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface NavigationProps {
  currentTab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile';
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile') => void;
  onOpenScanner: () => void;
  onTriggerAdminLogin: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (value: boolean) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setTab,
  onOpenScanner,
  onTriggerAdminLogin,
  drawerOpen,
  setDrawerOpen
}) => {
  const { cart, config, isAdminAuthenticated, logoutAdmin, currentUser, notifications } = useApp();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const unreadCount = currentUser 
    ? notifications.filter(n => (!n.leida && (n.tipo === 'todos' || (n.tipo === 'personal' && n.destinatario_telefono?.trim() === currentUser.telefono.trim())))).length
    : 0;

  return (
    <>
      {/* FIXED BOTTOM NAVIGATION BAR */}
      <nav id="bottom-bar" className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t border-zinc-200 px-4 flex items-center justify-between md:max-w-md md:mx-auto md:rounded-t-2xl md:border-x shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-500 hover:text-orange-500 transition-colors relative"
        >
          <Menu size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Menú</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'home' ? 'text-orange-500 font-semibold' : 'text-zinc-500'}`}
        >
          {currentTab === 'home' && (
            <span className="absolute -top-1 w-6 h-[3px] rounded-full bg-orange-500" />
          )}
          <Home size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Inicio</span>
        </button>

        {isAdminAuthenticated && (
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'admin' ? 'text-orange-500 font-semibold' : 'text-zinc-500'}`}
          >
            <ShieldAlert size={20} />
            <span className="text-[10px] mt-0.5 font-semibold">Admin</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'catalog' ? 'text-orange-500 font-semibold' : 'text-zinc-500'}`}
        >
          {currentTab === 'catalog' && (
            <span className="absolute -top-1 w-6 h-[3px] rounded-full bg-orange-500" />
          )}
          <Grid size={20} />
          <span className="text-[10px] mt-0.5 font-semibold">Menú</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('cart')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'cart' ? 'text-orange-500 font-semibold' : 'text-zinc-500'}`}
        >
          {currentTab === 'cart' && (
            <span className="absolute -top-1 w-6 h-[3px] rounded-full bg-orange-500" />
          )}
          <div className="relative">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center bg-red-500 animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">Carrito</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors relative ${currentTab === 'profile' ? 'text-orange-500 font-semibold' : 'text-zinc-500'}`}
        >
          {currentTab === 'profile' && (
            <span className="absolute -top-1 w-6 h-[3px] rounded-full bg-orange-500" />
          )}
          <div className="relative">
            <User size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border border-white animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-semibold">
            {currentUser ? 'Perfil' : 'Ingresar'}
          </span>
        </button>
      </nav>

      {/* iOS-TYPE DRAWER PANEL */}
      <div 
        className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />

        <aside 
          className={`absolute top-0 bottom-0 left-0 w-[290px] bg-white border-r border-zinc-200 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out z-10 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="overflow-y-auto max-h-[85vh] no-scrollbar text-zinc-900">
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-zinc-900 tracking-tight flex items-center gap-1.5">
                  {config.site_nombre}
                </span>
                <span className="text-[9px] text-orange-500 font-mono tracking-wider font-bold">Delivery Express</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="text-zinc-500 hover:text-zinc-950 bg-zinc-100 p-1 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation links */}
            <div className="p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-3 py-1 block">NAVEGAR</span>
              
              <button
                type="button"
                onClick={() => { setTab('home'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${currentTab === 'home' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
              >
                <Home size={15} /> Inicio
              </button>

              <button
                type="button"
                onClick={() => { setTab('catalog'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${currentTab === 'catalog' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
              >
                <Grid size={15} /> Nuestro Menú
              </button>

              <button
                type="button"
                onClick={() => { setTab('cart'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${currentTab === 'cart' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
              >
                <ShoppingCart size={15} /> Mi Pedido
              </button>

              <button
                type="button"
                onClick={() => { setTab('profile'); setDrawerOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-xs rounded-xl font-semibold transition-all cursor-pointer ${currentTab === 'profile' ? 'bg-orange-50 text-orange-600 font-bold' : 'text-zinc-700 hover:bg-zinc-100'}`}
              >
                <User size={15} /> Mi Cuenta
              </button>
            </div>

            {/* Quick actions */}
            <div className="p-3 border-t border-zinc-200 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider px-3 py-1 block">ACCIONES RÁPIDAS</span>
              
              <button
                type="button"
                onClick={() => { onOpenScanner(); setDrawerOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 rounded-xl font-semibold transition-all cursor-pointer"
              >
                Escanear Código
              </button>

              <a
                href={`https://wa.me/${config.telefono_soporte.replace(/[+ ]/g, '')}`}
                target="_blank"
                referrerPolicy="no-referrer"
                className="flex items-center gap-3 w-full px-3 py-2 text-xs text-zinc-800 hover:bg-orange-50 hover:text-orange-600 rounded-xl font-semibold transition-all"
              >
                <PhoneCall size={15} className="text-orange-500" /> WhatsApp Directo
              </a>
            </div>

            {/* Store info */}
            <div className="p-4 border-t border-zinc-200 flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">NUESTRO LOCAL</span>
              
              <div className="flex gap-2 text-xs text-zinc-700 leading-relaxed">
                <MapPin size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p>{config.direccion_fisica}</p>
              </div>
            </div>
          </div>

          {/* Admin login */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50">
            {isAdminAuthenticated ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                  <span className="text-[11px] text-zinc-500 font-mono">Sesión Admin Activa</span>
                </div>
                <button
                  type="button"
                  onClick={() => { logoutAdmin(); setDrawerOpen(false); setTab('home'); }}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs py-2 rounded-xl font-semibold transition-all cursor-pointer"
                >
                  Cerrar Sesión Admin
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); onTriggerAdminLogin(); }}
                className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShieldAlert size={14} className="text-amber-500" />
                Acceso Administrativo
              </button>
            )}
            <div className="text-[9px] text-zinc-400 font-mono text-center mt-2">
              {config.site_nombre || 'FoodApp'} v2.0.0
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};
