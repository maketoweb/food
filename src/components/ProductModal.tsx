import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus, AlertTriangle, Flame, ShoppingCart, Star, Clock, Users, Check, Zap, Utensils } from 'lucide-react';
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
  onGoToCheckout?: () => void;
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

const COMBO_ITEMS: Record<string, { included: string[]; icon: string }> = {
  'hamburguesas': { included: ['Papas fritas', 'Refresco 400ml'], icon: '🍔' },
  'pizzas': { included: ['Refresco 400ml'], icon: '🍕' },
  'pollo': { included: ['Papas fritas', 'Refresco 400ml'], icon: '🍗' },
};

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onGoToCheckout,
}) => {
  const { config, getActiveFlashSale, getProductAverageRating, getProductReviews, foodItems } = useApp();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [optionsTotal, setOptionsTotal] = useState(0);
  const [removedIngredients, setRemovedIngredients] = useState<Set<number>>(new Set());
  const [selectedSize, setSelectedSize] = useState<string>('');

  const themeColor = config.theme_color || '#E31837';
  const flashSale = product ? getActiveFlashSale(product.id) : null;

  const recommendedItems = useMemo(() => {
    if (!product?.related_ids?.length) return [];
    return foodItems
      .filter(p => product.related_ids!.includes(p.id) && p.id !== product.id && p.activo !== false)
      .slice(0, 4);
  }, [product, foodItems]);

  const isPizza = product?.categoria?.toLowerCase() === 'pizzas';
  const isComboCategory = ['hamburguesas', 'pizzas', 'pollo'].includes(product?.categoria?.toLowerCase() || '');
  const comboInfo = isComboCategory ? COMBO_ITEMS[product!.categoria.toLowerCase()] : null;

  const avgRating = product ? getProductAverageRating(product.id) : 0;
  const reviewCount = product ? getProductReviews(product.id).length : 0;

  useEffect(() => {
    if (product) {
      setActiveImageIdx(0);
      setQuantity(1);
      setSelectedOptions([]);
      setOptionsTotal(0);
      setRemovedIngredients(new Set());
      setSelectedSize(product.sizes?.[0]?.id || '');
    }
  }, [product?.id]);

  if (!product || !isOpen) return null;

  const isAgotado = product.stock <= 0;
  const activeSize = product.sizes?.find(s => s.id === selectedSize);
  const sizePrice = activeSize?.price_usd || 0;
  const basePrice = flashSale
    ? product.precio_usd * (1 - flashSale.discount_percent / 100)
    : product.precio_usd;
  const finalBasePrice = sizePrice > 0 ? sizePrice : basePrice;
  const totalPrice = finalBasePrice * quantity + optionsTotal * quantity;

  const handleAddToCart = () => {
    const ingredientNames = Array.from(removedIngredients).map(
      (idx: number) => product.ingredientes?.[idx] || ''
    ).filter(Boolean);
    const optsWithSize = [
      ...selectedOptions,
      ...(activeSize ? [{ group_name: 'Tamaño', option_name: activeSize.name, precio_usd: 0 }] : []),
    ];
    onAddToCart(product, quantity, optsWithSize.length > 0 ? optsWithSize : selectedOptions, optionsTotal, ingredientNames);
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

            {/* Rating, stats & calories */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
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
              {product.calorias !== undefined && product.calorias > 0 && (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">
                  <Zap size={11} /> {product.calorias} cal
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
                ${finalBasePrice.toFixed(2)}
              </span>
              {optionsTotal > 0 && (
                <span className="text-xs text-zinc-500">
                  +${optionsTotal.toFixed(2)} extras
                </span>
              )}
            </div>

            {/* Pizza Sizes */}
            {isPizza && product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <span className="text-xs font-bold text-zinc-700 block mb-2">📐 Elige tu tamaño</span>
                <div className="flex gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`flex-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                        selectedSize === size.id
                          ? 'border-current shadow-md'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                      style={selectedSize === size.id ? { borderColor: themeColor, backgroundColor: `${themeColor}08` } : {}}
                    >
                      <span className="text-xs font-bold block" style={selectedSize === size.id ? { color: themeColor } : {}}>{size.name}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">${size.price_usd.toFixed(2)}</span>
                      {size.description && <span className="text-[9px] text-zinc-400 block mt-0.5">{size.description}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Combo Info (included items) */}
            {comboInfo && (
              <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Incluye en tu combo</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {comboInfo.included.map((item, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-700">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                <span className="text-xs font-bold text-zinc-700 block mb-2">✨ Agrega tus extras</span>
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

            {/* Recommended Products */}
            {recommendedItems.length > 0 && (
              <div className="mb-5">
                <span className="text-xs font-bold text-zinc-700 block mb-3">🔥 Te puede gustar también</span>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {recommendedItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => { onClose(); setTimeout(() => { /* would need callback to open new modal */ }, 300); }}
                      className="shrink-0 w-[140px] bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all cursor-pointer"
                    >
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={item.imagen_urls[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-bold text-zinc-900 truncate">{item.nombre}</p>
                        <p className="text-[10px] font-black mt-0.5" style={{ color: themeColor }}>${item.precio_usd.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* Go to checkout */}
            {onGoToCheckout && (
              <button
                onClick={() => { handleAddToCart(); setTimeout(() => onGoToCheckout(), 200); }}
                disabled={isAgotado}
                className="h-12 px-5 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed border-2 bg-transparent"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                Ir a Caja →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
