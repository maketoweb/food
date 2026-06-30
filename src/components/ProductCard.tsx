import React from 'react';
import { FoodItem, StoreConfig, ProductReview } from '../types/store';
import { ShoppingCart, Plus, Star, Users, Flame, Clock, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  item: FoodItem;
  config: StoreConfig;
  onViewProductDetails: (item: FoodItem) => void;
  addToCart: (item: FoodItem) => void;
  isOffer?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  config,
  onViewProductDetails,
  addToCart,
  isOffer,
  averageRating = 0,
  reviewCount = 0
}) => {
  const isAgotado = item.stock <= 0;
  const themeColor = config.theme_color || '#E31837';
  const isLowStock = item.stock > 0 && item.stock < (config.stock_alert_threshold || 5);
  const hasPromoEnd = item.promo_end_date && new Date(item.promo_end_date) > new Date();

  return (
    <div className="shrink-0 w-[170px] sm:w-[215px] flex flex-col bg-white rounded-xl overflow-hidden transition-all duration-300 group relative border border-zinc-100 hover:border-zinc-200 hover:shadow-lg cursor-pointer"
      onClick={() => onViewProductDetails(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-50">
        <img
          src={item.imagen_urls[0]}
          alt={item.nombre}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isAgotado ? 'grayscale opacity-50' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {item.es_promo && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              PROMO
            </span>
          )}
          {item.es_nuevo && !item.es_promo && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-900 text-white shadow-sm">
              NUEVO
            </span>
          )}
          {item.es_mas_vendido && !item.es_promo && !item.es_nuevo && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
              TOP
            </span>
          )}
          {isAgotado && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-zinc-800 text-white shadow-sm">
              AGOTADO
            </span>
          )}
          {isLowStock && !isAgotado && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-sm animate-pulse">
              ¡Solo quedan {item.stock}!
            </span>
          )}
          {hasPromoEnd && !isAgotado && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500 text-white shadow-sm">
              ⏰ Oferta limitada
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
          disabled={isAgotado}
          className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 hover:scale-110"
          style={{ backgroundColor: themeColor }}
        >
          <Plus size={16} className="text-white" />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h4 className="text-[13px] font-bold text-zinc-900 line-clamp-2 leading-tight min-h-[2rem]">
          {item.nombre}
        </h4>
        <p className="text-[10px] text-zinc-400 line-clamp-1 leading-tight">
          {item.descripcion}
        </p>
        
        {/* Social Proof Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
              <Star size={9} fill="currentColor" strokeWidth={0} />
              {averageRating.toFixed(1)}
              {reviewCount > 0 && <span className="text-zinc-400 font-normal">({reviewCount})</span>}
            </span>
          )}
          {item.order_count !== undefined && item.order_count > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
              <Users size={8} />
              {item.order_count} pedidos
            </span>
          )}
          {item.estimated_prep_time && (
            <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
              <Clock size={8} />
              ~{item.estimated_prep_time} min
            </span>
          )}
        </div>
        
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <span className="text-base font-black" style={{ color: themeColor }}>
            ${item.precio_usd.toFixed(2)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onViewProductDetails(item); }}
            className="text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
            style={{ color: themeColor }}
          >
            Personalizar
          </button>
        </div>
      </div>
    </div>
  );
};
