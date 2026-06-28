import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { FoodItem } from '../types/store';
import { Search, SlidersHorizontal, RefreshCcw, FilterX, Carrot } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { ProductCard } from '../components/ProductCard';

const SkeletonCard: React.FC = () => (
  <div className="border border-zinc-200/80 rounded-xl bg-white p-3.5 flex flex-col justify-between h-[340px] animate-pulse">
    <div className="flex flex-col gap-2">
      {/* Shimmer Image */}
      <div className="w-full aspect-[4/3] bg-zinc-100 rounded-lg"></div>
      
      {/* Brand & SKU bar */}
      <div className="flex justify-between items-center mt-2">
        <div className="w-16 h-3 bg-zinc-100 rounded"></div>
        <div className="w-12 h-3 bg-zinc-50 rounded"></div>
      </div>
      
      {/* Title block */}
      <div className="w-full h-3.5 bg-zinc-100 rounded mt-2"></div>
      <div className="w-4/5 h-3.5 bg-zinc-100 rounded mt-1"></div>
      
      {/* Category tag */}
      <div className="w-20 h-4 bg-zinc-50 rounded mt-2.5"></div>
    </div>
    
    {/* Bottom block */}
    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="w-16 h-4 bg-zinc-100 rounded"></div>
      </div>
      <div className="w-9 h-9 bg-zinc-100 rounded-full shrink-0"></div>
    </div>
  </div>
);

interface CatalogProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onViewProductDetails: (part: FoodItem) => void;
  passedSearchTerm?: string;
  clearPassedSearchTerm?: () => void;
  resetGlobalFilters: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  selectedCategory,
  setSelectedCategory,
  onViewProductDetails,
  passedSearchTerm,
  clearPassedSearchTerm,
  resetGlobalFilters
}) => {
  const { foodItems, config, addToCart, searchItems, displayCurrency } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 16;

  // Sync passed search term
  useEffect(() => {
    if (passedSearchTerm) {
      setSearchQuery(passedSearchTerm);
      clearPassedSearchTerm?.();
    }
  }, [passedSearchTerm, clearPassedSearchTerm]);

  // Shimmer skeleton reactiveness
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, currentPage]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let list = searchItems(searchQuery);

    if (selectedCategory) {
      list = list.filter(p => p.categoria.toLowerCase() === selectedCategory.toLowerCase());
    }

    return list;
  }, [foodItems, searchQuery, selectedCategory, searchItems]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);

  const handleResetFilters = () => {
    setSearchQuery('');
    resetGlobalFilters();
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <SEOHead 
        type="catalog" 
      />

      <div className="flex justify-between items-center text-zinc-900">
        <div>
          <span className="text-[11px] font-mono text-orange-500 font-bold uppercase tracking-wider">Delivery Express</span>
          <h2 className="text-[21px] font-bold font-display text-zinc-900">Buscar en el Menú</h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg">
          {filteredProducts.length} articulos
        </span>
      </div>

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-3 text-zinc-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca platos, bebidas, ingredientes..."
            className="w-full bg-zinc-50 hover:bg-zinc-100 focus:bg-white border border-zinc-200 rounded-lg pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`border p-2.5 rounded-lg transition-all cursor-pointer ${showFilters ? 'bg-violet-600 text-white border-violet-600' : 'bg-transparent text-zinc-800 border-zinc-200 hover:bg-zinc-50'}`}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className={`p-4 border border-zinc-200 rounded-lg bg-zinc-50/50 flex flex-col gap-3 transition-all ${showFilters ? 'block' : 'hidden md:flex'} text-zinc-900 shadow-sm`}>
        <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
          <span className="text-[11px] uppercase font-mono font-bold text-zinc-800 tracking-wider flex items-center gap-1.5">
            <Carrot size={13} className="text-orange-500" /> Categorías
          </span>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-mono text-zinc-400 hover:text-violet-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCcw size={10} /> Restablecer filtros
          </button>
        </div>

        <div className="flex flex-col gap-1 max-w-xs">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Departamento</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 font-sans outline-none focus:border-violet-500 transition-all text-xs font-bold"
          >
            <option value="">Todos los Departamentos</option>
            {(config.categories || []).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-lg p-6 bg-zinc-50/50">
          <FilterX size={40} className="text-zinc-400 mb-2" />
          <h4 className="text-sm font-bold font-display text-zinc-800">No se encontraron artículos</h4>
          <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-relaxed">
            No encontramos coincidencias en {selectedCategory || 'el catálogo'} para tu búsqueda. Haz clic en limpiar filtros para restablecer.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-4 bg-zinc-100 text-xs font-bold font-display px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-200 text-zinc-800 transition-colors cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {paginatedProducts.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                config={config}
                onViewProductDetails={onViewProductDetails}
                addToCart={(item) => {
                  addToCart(item);
                  setToastMessage(item.nombre);
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-zinc-105 text-zinc-800 rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <span className="text-xs text-zinc-500 font-mono">
                Pag {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-zinc-950/95 border border-zinc-800 px-4 py-3.5 rounded-xl flex items-center justify-between shadow-2xl backdrop-blur-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <span className="text-violet-400 text-sm font-bold">✓</span>
            <div>
              <p className="text-[11px] font-bold text-white leading-tight">Agregado al Carrito</p>
              <p className="text-[9px] text-zinc-400 mt-0.5 max-w-[180px] line-clamp-1">{toastMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-zinc-300 hover:text-white text-[10px] font-mono font-bold uppercase cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};
