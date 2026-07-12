import React from 'react';
import { Home, UtensilsCrossed, ShoppingCart, User } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface BottomNavProps {
  currentTab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout';
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setTab }) => {
  const { cart, config } = useApp();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const themeColor = config.theme_color || '#E31837';

  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: Home },
    { id: 'catalog' as const, label: 'Menú', icon: UtensilsCrossed },
    { id: 'checkout' as const, label: 'Carrito', icon: ShoppingCart, badge: cartCount },
    { id: 'profile' as const, label: 'Cuenta', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tabItem) => {
          const isActive = tabItem.id === 'checkout' 
            ? currentTab === 'cart' || currentTab === 'checkout'
            : currentTab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full cursor-pointer relative"
            >
              <div className="relative">
                <tabItem.icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  className="transition-colors duration-200"
                  style={{ color: isActive ? themeColor : '#71717a' }}
                />
                {tabItem.badge !== undefined && tabItem.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[9px] font-bold px-1 leading-none text-white"
                    style={{ backgroundColor: themeColor }}
                  >
                    {tabItem.badge > 99 ? '99+' : tabItem.badge}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-semibold transition-colors duration-200"
                style={{ color: isActive ? themeColor : '#71717a' }}
              >
                {tabItem.label}
              </span>
              {isActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ backgroundColor: themeColor }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
