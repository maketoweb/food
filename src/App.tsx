import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Checkout } from './pages/Checkout';
import Admin from './pages/admin/index';
import { UserProfile } from './pages/UserProfile';
import { Navigation } from './components/Navigation';
import { BottomNav } from './components/BottomNav';
import { FoodItem } from './types/store';
import { PushNotificationModal } from './components/PushNotificationModal';
import { X, ShoppingBag } from 'lucide-react';
import { SEOHead } from './components/SEOHead';
import { OfflineBanner } from './components/OfflineBanner';
import { FreeDeliveryBar } from './components/FreeDeliveryBar';
import { ProductModal } from './components/ProductModal';
import { SplashScreen } from './components/SplashScreen';
import { SkeletonHome, SkeletonCatalog, SkeletonCheckout, SkeletonProfile } from './components/Skeletons';

function AppContent() {
  const { cart, config, addToCart, authenticateAdmin, isGlobalLoading, isAdminAuthenticated, currentUser, markUserAsPwaInstalled } = useApp();

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      localStorage.setItem('foodapp_pwa_installed', 'true');
      if (currentUser) {
        markUserAsPwaInstalled(currentUser.id);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [currentUser, markUserAsPwaInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Route/Tab controllers - si es admin autenticado, abrir directo en su panel
  const [tab, setTab] = useState<'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout'>(isAdminAuthenticated ? 'admin' : 'home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Custom Overlays & Modals
  const [selectedProductDetails, setSelectedProductDetails] = useState<FoodItem | null>(null);

  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminUserInput, setAdminUserInput] = useState('');

  const resetAllFilters = () => {
    setSelectedCategory('');
    setGlobalSearch('');
  };

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

  // Header / Navigation helpers
  const navigateToCatalog = (filters?: { category?: string }) => {
    if (filters?.category !== undefined) setSelectedCategory(filters.category);
    setTab('catalog');
  };

  if (isGlobalLoading) {
    const skeletonMap: Record<string, React.ReactNode> = {
      home: <SkeletonHome />,
      catalog: <SkeletonCatalog />,
      checkout: <SkeletonCheckout />,
      profile: <SkeletonProfile />,
      admin: <SkeletonHome />,
    };
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 w-full flex justify-center">
        <div className="w-full">
          {skeletonMap[tab] || <SkeletonHome />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 w-full flex justify-center">
      {showSplash && <SplashScreen config={config} onComplete={() => setShowSplash(false)} />}
      <SEOHead />
      <OfflineBanner />
      <PushNotificationModal />

      <div className="w-full bg-white flex flex-col min-h-screen relative">

        {/* ═══ HEADER DE TIENDA - oculto en panel admin ═══ */}
        {tab !== 'admin' && (
          <>
            <Navigation
              currentTab={tab}
              setTab={setTab}
              onTriggerAdminLogin={() => setIsAdminLoginOpen(true)}
              drawerOpen={drawerOpen}
              setDrawerOpen={setDrawerOpen}
              navigateToCatalog={navigateToCatalog}
            />
            <div className={tab === 'catalog' ? 'lg:h-16' : 'h-14 lg:h-16'} />
            <FreeDeliveryBar currentTotal={cart.reduce((sum, item) => sum + item.item.precio_usd * item.quantity, 0)} threshold={config.delivery_gratis_threshold || 0} themeColor={config.theme_color || '#FF2D95'} />
          </>
        )}

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className="flex-1 overflow-y-auto w-full pb-14 lg:pb-0">
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
              onAdminClick={() => setIsAdminLoginOpen(true)}
              isAdminAuthenticated={isAdminAuthenticated}
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
              setTab={setTab}
              onOpenDrawer={() => setDrawerOpen(true)}
            />
          )}

          {tab === 'checkout' && cart.length > 0 && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTab('home')} />
              <div className="relative w-full max-w-lg bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl max-h-[92vh] lg:max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-center pt-3 pb-1 lg:hidden"><div className="w-10 h-1 rounded-full bg-zinc-300" /></div>
                <button type="button" onClick={() => setTab('home')} className="absolute top-3 right-3 z-20 w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center cursor-pointer"><X size={14} className="text-zinc-500" /></button>
                <Checkout setTab={setTab} onClose={() => setTab('home')} />
              </div>
            </div>
          )}
          {tab === 'checkout' && cart.length === 0 && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center lg:p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTab('home')} />
              <div className="relative w-full max-w-sm bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl p-8 text-center">
                <button type="button" onClick={() => setTab('home')} className="absolute top-3 right-3 z-20 w-8 h-8 bg-zinc-100 hover:bg-zinc-200 rounded-full flex items-center justify-center cursor-pointer"><X size={14} className="text-zinc-500" /></button>
                <ShoppingBag size={40} className="text-zinc-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-zinc-900 mb-1">Carrito Vacío</h3>
                <p className="text-xs text-zinc-500 mb-4">Agrega productos para continuar.</p>
                <button onClick={() => setTab('catalog')} className="w-full text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer" style={{ backgroundColor: config.theme_color || '#0f5d34' }}>Ver Menú</button>
              </div>
            </div>
          )}

          {tab === 'admin' && (
            <Admin setTab={setTab} />
          )}

          {tab === 'profile' && (
            <UserProfile setTab={setTab} deferredPrompt={deferredPrompt} onInstallClick={handleInstallClick} />
          )}
        </main>

        {/* ═══ MOBILE BOTTOM NAV - oculto en panel admin ═══ */}
        {tab !== 'admin' && <BottomNav currentTab={tab} setTab={setTab} />}

        {/* ═══ PRODUCT MODAL ═══ */}
        <ProductModal
          product={selectedProductDetails}
          isOpen={!!selectedProductDetails}
          onClose={() => { setSelectedProductDetails(null); }}
          onAddToCart={(item, qty, opts, total, removed) => {
            addToCart(item, qty || 1, opts || [], total || 0, removed || []);
            setSelectedProductDetails(null);
          }}
          onGoToCheckout={() => { setSelectedProductDetails(null); setTab('checkout'); }}
        />

        {/* ═══ ADMIN LOGIN MODAL ═══ */}
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
                <h4 className="text-sm font-bold font-display text-zinc-800 uppercase tracking-wider">Acceso Administrativo</h4>
                <p className="text-[10px] text-zinc-500 mt-1 leading-normal max-w-[240px]">Ingresa las credenciales para acceder al panel de administración.</p>
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
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
