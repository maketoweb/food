import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus, AlertTriangle, Flame, ShoppingCart, Star, Clock, Users, Check } from 'lucide-react';
import { FoodItem, StoreConfig, SelectedOption } from '../types/store';
import { ProductOptionsEditor } from './ProductOptionsEditor';
import { ProductReviews } from './ProductReviews';
import { RippleButton } from './RippleButton';
import { useApp } from '../store/AppContext';

interface ProductModalProps {
  product: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: FoodItem, qty?: number, opts?: SelectedOption[], total?: number, removed?: string[]) => void;
}

const ALLERGEN_COLORS: Record<string, string> = {
  'Gluten': '#F59E0B',
  'Lácteos': '#3B82F6',
  'Frutos secos': '#8B5CF6',
  'Mariscos': '#EF4444',
  'Soja': '#10B981',
  'Huevos': '#F97316',
  'Apio': '#84CC16',
  'Mostaza': '#EAB308',
  'Sésamo': '#A855F7',
  'Sulfitos': '#EC4899',
  'Cacahuetes': '#D97706',
  'Moluscos': '#06B6D4',
  'Crustáceos': '#DC2626',
  'Altramuces': '#7C3AED',
};

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const { config, getActiveFlashSale, getProductAverageRating, getProductReviews } = useApp();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [optionsTotal, setOptionsTotal] = useState(0);
  const [removedIngredients, setRemovedIngredients] = useState<Set<number>>(new Set());
  const [activeComboTab, setActiveComboTab] = useState<'info' | 'combos'>('info');

  const themeColor = config.theme_color || '#E31837';
  const flashSale = product ? getActiveFlashSale(product.id) : null;
  const combos = config.combos?.filter(c =>
    c.active && product?.combo_ids?.includes(c.id)
  ) || [];
  const avgRating = product ? getProductAverageRating(product.id) : 0;
  const reviewCount = product ? getProductReviews(product.id).length : 0;

  useEffect(() => {
    if (product) {
      setActiveImageIdx(0);
      setQuantity(1);
      setSelectedOptions([]);
      setOptionsTotal(0);
      setRemovedIngredients(new Set());
      setActiveComboTab('info');
    }
  }, [product?.id]);

  if (!product || !isOpen) return null;

  const isAgotado = product.stock <= 0;
  const basePrice = flashSale
    ? product.precio_usd * (1 - flashSale.discount_percent / 100)
    : product.precio_usd;
  const totalPrice = basePrice * quantity + optionsTotal * quantity;

  const handleAddToCart = () => {
    const ingredientNames = Array.from(removedIngredients).map(
      (idx: number) => product.ingredientes?.[idx] || ''
    ).filter(Boolean);
    onAddToCart(product, quantity, selectedOptions, optionsTotal, ingredientNames);
    onClose();
  };

  const toggleIngredient = (idx: number) => {
    setRemovedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full lg:max-w-4xl max-h-[90vh] bg-white rounded-t-2xl lg:rounded-2xl overflow-hidden animate-slide-up flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center hover:bg-white transition-colors"
        >
          <X size={16} className="text-zinc-600" />
        </button>

        <div className="flex-1 overflow-y-auto">
          {/* Image carousel */}
          <div className="relative aspect-[16/7] lg:aspect-[16/6] bg-zinc-100">
            {product.imagen_urls.map((url, idx) => (
              <div
                key={url}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  idx === activeImageIdx ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {product.imagen_urls.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIdx(prev => prev > 0 ? prev - 1 : product.imagen_urls.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setActiveImageIdx(prev => prev < product.imagen_urls.length - 1 ? prev + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {product.imagen_urls.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === activeImageIdx ? 'w-4' : 'bg-white/50'
                      }`}
                      style={idx === activeImageIdx ? { backgroundColor: themeColor } : {}}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              {product.es_promo && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-sm"
                  style={{ backgroundColor: `${themeColor}dd` }}>
                  <Flame size={10} className="inline mr-1" /> PROMO
                </span>
              )}
              {flashSale && (
                <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500 text-white shadow-lg">
                  -{flashSale.discount_percent}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Category & delivery */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
                {product.categoria}
              </span>
              {product.delivery_gratis && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  🚚 Delivery Gratis
                </span>
              )}
            </div>

            {/* Name & description */}
            <h2 className="text-xl font-black text-zinc-900 mb-1">{product.nombre}</h2>
            <p className="text-sm text-zinc-500 mb-3">{product.descripcion}</p>

            {/* Rating & stats */}
            <div className="flex items-center gap-4 mb-4">
              {avgRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} fill="#F59E0B" stroke="none" />
                  <span className="text-sm font-bold text-zinc-800">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-zinc-400">({reviewCount})</span>
                </div>
              )}
              {product.estimated_prep_time && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock size={12} /> ~{product.estimated_prep_time} min
                </div>
              )}
              {product.order_count !== undefined && product.order_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Users size={12} /> {product.order_count} pedidos
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-5">
              {flashSale && (
                <span className="text-lg text-zinc-400 line-through font-medium">
                  ${product.precio_usd.toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-black" style={{ color: themeColor }}>
                ${basePrice.toFixed(2)}
              </span>
              {optionsTotal > 0 && (
                <span className="text-xs text-zinc-500">
                  +${optionsTotal.toFixed(2)} extras
                </span>
              )}
            </div>

            {/* Tabs: Info / Combos */}
            {combos.length > 0 && (
              <div className="flex gap-2 mb-4 border-b border-zinc-100 pb-2">
                <button
                  onClick={() => setActiveComboTab('info')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    activeComboTab === 'info'
                      ? 'text-white'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                  style={activeComboTab === 'info' ? { backgroundColor: themeColor } : {}}
                >
                  Detalles
                </button>
                <button
                  onClick={() => setActiveComboTab('combos')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    activeComboTab === 'combos'
                      ? 'text-white'
                      : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                  style={activeComboTab === 'combos' ? { backgroundColor: themeColor } : {}}
                >
                  🎁 Combos ({combos.length})
                </button>
              </div>
            )}

            {activeComboTab === 'info' ? (
              <>
                {/* Allergens */}
                {product.alergenos && product.alergenos.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span className="text-xs font-bold text-zinc-700">Alérgenos</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.alergenos.map((alergeno) => (
                        <span
                          key={alergeno}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                          style={{ backgroundColor: ALLERGEN_COLORS[alergeno] || '#6B7280' }}
                        >
                          {alergeno}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ingredients */}
                {product.ingredientes && product.ingredientes.length > 0 && (
                  <div className="mb-5">
                    <span className="text-xs font-bold text-zinc-700 block mb-2">🧾 Ingredientes</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.ingredientes.map((ing, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleIngredient(idx)}
                          className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                            removedIngredients.has(idx)
                              ? 'bg-red-50 border-red-200 text-red-600 line-through'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          {removedIngredients.has(idx) ? (
                            <span className="flex items-center gap-1"><X size={10} /> {ing}</span>
                          ) : (
                            <span className="flex items-center gap-1"><Check size={10} /> {ing}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options / Extras */}
                {product.option_groups && product.option_groups.length > 0 && (
                  <div className="mb-5">
                    <span className="text-xs font-bold text-zinc-700 block mb-2">✨ Personaliza tu pedido</span>
                    <ProductOptionsEditor
                      optionGroups={product.option_groups}
                      selectedOptions={selectedOptions}
                      onSelectionChange={(opts, total) => {
                        setSelectedOptions(opts);
                        setOptionsTotal(total);
                      }}
                      themeColor={themeColor}
                    />
                  </div>
                )}

                {/* Reviews */}
                <div className="mb-5">
                  <ProductReviews
                    productId={product.id}
                    productName={product.nombre}
                    themeColor={themeColor}
                    reviews={getProductReviews(product.id)}
                    averageRating={getProductAverageRating(product.id)}
                    totalReviews={getProductReviews(product.id).length}
                  />
                </div>
              </>
            ) : (
              /* Combos tab */
              <div className="flex flex-col gap-3 mb-5">
                {combos.map((combo) => {
                  const comboProducts = combo.product_ids
                    .map(id => config.combos?.length ? null : null) // Would need foodItems from context
                    .filter(Boolean);
                  const comboOriginalPrice = basePrice * 1.5; // Estimate
                  const comboDiscountedPrice = comboOriginalPrice * (1 - combo.discount_percent / 100);

                  return (
                    <div
                      key={combo.id}
                      className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
                      style={{ borderColor: `${themeColor}30` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{combo.nombre}</h4>
                          <p className="text-xs text-zinc-500">{combo.descripcion}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                          -{combo.discount_percent}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black" style={{ color: themeColor }}>
                            ${comboDiscountedPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-zinc-400 line-through">
                            ${comboOriginalPrice.toFixed(2)}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            // Add combo to cart logic
                            onClose();
                          }}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: themeColor }}
                        >
                          Agregar Combo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-zinc-100 p-4 bg-white">
          <div className="flex items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-zinc-100 rounded-xl px-2 py-1">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center font-bold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add to cart */}
            <RippleButton
              onClick={handleAddToCart}
              disabled={isAgotado}
              className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{
                backgroundColor: themeColor,
                boxShadow: `0 8px 24px ${themeColor}44`,
              }}
            >
              <ShoppingCart size={16} />
              Agregar · ${totalPrice.toFixed(2)}
            </RippleButton>
          </div>
        </div>
      </div>
    </div>
  );
};
