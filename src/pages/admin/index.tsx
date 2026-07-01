import React, { Suspense, lazy, useState, useCallback } from 'react';
import { useApp } from '../../store/AppContext';
import { useAdminStore } from '../../store/stores/adminStore';
import { Order, FoodItem } from '../../types/store';
import {
  BarChart3, ShoppingBag, Utensils, Grid, User, Ticket, Settings,
  Menu, X, Bell, MessageSquare, Megaphone, Package
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';

const DashboardSection = lazy(() => import('./sections/DashboardSection'));
const OrdersSection = lazy(() => import('./sections/OrdersSection'));
const InventorySection = lazy(() => import('./sections/InventorySection'));
const TablesSection = lazy(() => import('./sections/TablesSection'));
const CustomersSection = lazy(() => import('./sections/CustomersSection'));
const CouponsSection = lazy(() => import('./sections/CouponsSection'));
const SettingsSection = lazy(() => import('./sections/SettingsSection'));
const NotificationsSection = lazy(() => import('./sections/NotificationsSection'));
const ChatSection = lazy(() => import('./sections/ChatSection'));
const PromosSection = lazy(() => import('./sections/PromosSection'));
const CombosSection = lazy(() => import('./sections/CombosSection'));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Cargando sección...</p>
    </div>
  </div>
);

interface AdminIndexProps {
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin') => void;
}

const ADMIN_SECTIONS = [
  { id: 'reports', label: 'Dashboard', icon: BarChart3 },
  { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
  { id: 'inventory', label: 'Menú', icon: Utensils },
  { id: 'promos', label: 'Promociones', icon: Megaphone },
  { id: 'combos', label: 'Combos', icon: Package },
  { id: 'tables', label: 'Mesas', icon: Grid },
  { id: 'customers', label: 'Clientes', icon: User },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'chat', label: 'Mensajes', icon: MessageSquare },
  { id: 'coupons', label: 'Cupónes', icon: Ticket },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export default function AdminIndex({ setTab }: AdminIndexProps) {
  const { config } = useApp();
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen } = useAdminStore();
  const themeColor = config.theme_color || '#7c3aed';

  const [openOrderDetailIds, setOpenOrderDetailIds] = useState<string[]>([]);
  const [editingOrderItems, setEditingOrderItems] = useState<Order | null>(null);
  const [openEditor, setOpenEditor] = useState<FoodItem | null>(null);
  const [sendMsgTitle, setSendMsgTitle] = useState('');
  const [sendMsgBody, setSendMsgBody] = useState('');
  const [sendMsgModal, setSendMsgModal] = useState<{ user: unknown } | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const toggleOrderDetail = useCallback((orderId: string) => {
    setOpenOrderDetailIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const handleStatusAdvance = useCallback((_order: Order) => {
    // Status advance is handled by the OrdersSection component
  }, []);

  const sidebarSections = ADMIN_SECTIONS.filter(s => s.id !== 'tables' || config.tiene_mesas);

  const sectionLabel = sidebarSections.find(s => s.id === activeSection)?.label || 'Dashboard';

  const renderSection = () => {
    switch (activeSection) {
      case 'reports': return <DashboardSection />;
      case 'orders': return (
        <OrdersSection
          openOrderDetailIds={openOrderDetailIds}
          toggleOrderDetail={toggleOrderDetail}
          editingOrderItems={editingOrderItems}
          setEditingOrderItems={setEditingOrderItems}
          setPrintingOrder={setPrintingOrder}
          handleStatusAdvance={handleStatusAdvance}
        />
      );
      case 'inventory': return <InventorySection openEditor={setOpenEditor} config={config} />;
      case 'tables': return (
        <TablesSection
          openOrderDetailIds={openOrderDetailIds}
          toggleOrderDetail={toggleOrderDetail}
        />
      );
      case 'customers': return (
        <CustomersSection
          setSendMsgTitle={setSendMsgTitle}
          setSendMsgBody={setSendMsgBody}
          setSendMsgModal={setSendMsgModal}
        />
      );
      case 'coupons': return <CouponsSection />;
      case 'settings': return <SettingsSection setTab={setTab} />;
      case 'notifications': return <NotificationsSection />;
      case 'chat': return <ChatSection />;
      case 'promos': return <PromosSection />;
      case 'combos': return <CombosSection />;
      default: return <DashboardSection />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <SEOHead title={`Admin - ${config.site_nombre || 'Panel'}`} type="admin" />

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.site_nombre} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: themeColor }}>
              {config.site_nombre?.[0] || 'A'}
            </div>
          )}
          <span className="font-bold text-sm text-slate-900 truncate">{config.site_nombre || 'Admin'}</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 text-slate-400 hover:text-slate-600 rounded"><X size={18} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sidebarSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveSection(section.id as never); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={isActive ? { backgroundColor: themeColor } : {}}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button onClick={() => setTab('home')} className="w-full text-xs text-slate-500 hover:text-slate-800 py-2 transition-colors cursor-pointer">
            ← Volver a la tienda
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-bold text-slate-900">{sectionLabel}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Suspense fallback={<SectionLoader />}>
            {renderSection()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
