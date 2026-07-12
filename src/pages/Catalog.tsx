import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import { Search, X, ChevronLeft, Menu } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductCard } from '../components/ProductCard';

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onViewProductDetails: (part: FoodItem) => void;
  passedSearchTerm?: string;
  clearPassedSearchTerm?: () => void;
  resetGlobalFilters: () => void;
  setTab: (tab: 'home' | 'catalog' | 'cart' | 'admin' | 'profile' | 'checkout') => void;
  onOpenDrawer?: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  selectedCategory, setSelectedCategory,
  onViewProductDetails, passedSearchTerm, clearPassedSearchTerm, resetGlobalFilters, setTab, onOpenDrawer
}) => {
  const { foodItems, config, addToCart } = useApp();
  const themeColor = config.theme_color || '#E31837';
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (passedSearchTerm) {
      setSearchQuery(passedSearchTerm);
      clearPassedSearchTerm?.();
    }
  }, [passedSearchTerm, clearPassedSearchTerm]);

  const filtered = useMemo(() => {
    let list = foodItems.filter(p => p.activo !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      list = list.filter(p => p.categoria.toLowerCase() === selectedCategory.toLowerCase());
    }
    return list;
  }, [foodItems, searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col gap-4 pb-24 max-w-7xl mx-auto px-4">
      <SEOHead type="catalog" />

      {/* Mobile back button */}
      <div className="lg:hidden flex items-center gap-2 pt-1">
        <button
          onClick={() => setTab('home')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft size={18} className="text-zinc-700" />
        </button>
        <h2 className="text-lg font-bold text-zinc-900 flex-1 text-center pr-8">
          {selectedCategory || 'Menú'}
        </h2>
        {onOpenDrawer && (
          <button
            onClick={onOpenDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <Menu size={18} className="text-zinc-700" />
          </button>
        )}
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">
          {selectedCategory || 'Menú'}
        </h2>
        <span className="text-xs text-zinc-400">{filtered.length} productos</span>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input type="text" value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-full border border-zinc-200 rounded-lg pl-9 pr-8 py-2 text-sm outline-none focus:border-zinc-900 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
            <X size={14} />
          </button>
        )}
      </div>

      {!selectedCategory && (
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 w-max">
            <button onClick={() => resetGlobalFilters()}
              className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: themeColor }}
            >
              Todos
            </button>
            {(config.categories || []).slice(0, 10).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold border bg-white transition-colors hover:shadow-sm"
                style={{ borderColor: themeColor + '30', color: themeColor }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCategory && (
        <button onClick={() => { setSelectedCategory(''); resetGlobalFilters(); }}
          className="text-xs font-semibold w-fit px-3 py-1 rounded-lg border cursor-pointer hover:bg-zinc-50 transition-colors"
          style={{ borderColor: themeColor + '30', color: themeColor }}
        >
          ← Todas las categorías
        </button>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-2">
          <p className="text-sm text-zinc-500">No se encontraron productos</p>
          <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); resetGlobalFilters(); }}
            className="text-xs font-semibold px-4 py-2 rounded-lg text-white cursor-pointer"
            style={{ backgroundColor: themeColor }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(item => (
            <ProductCard key={item.id} item={item} config={config}
              onViewProductDetails={onViewProductDetails}
              addToCart={(food) => addToCart(food)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
