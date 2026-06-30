import React from 'react';
import { FoodItem, StoreConfig, ProductReview } from '../types/store';
import { ShoppingCart, Plus, Star, Users, Flame, Clock, Heart } from 'lucide-react';

interface PremiumProductCardProps {
  item: FoodItem;
  config: StoreConfig;
  onViewProductDetails: (item: FoodItem) => void;
  addToCart: (item: FoodItem) => void;
  averageRating?: number;
  reviewCount?: number;
}

export const PremiumProductCard: React.FC<PremiumProductCardProps> = ({
  item,
  config,
  onViewProductDetails,
  addToCart,
  averageRating = 0,
  reviewCount = 0
}) => {
  const isAgotado = item.stock <= 0;
  const themeColor = config.theme_color || '#E31837';
  const isLowStock = item.stock > 0 && item.stock < (config.stock_alert_threshold || 5);

  return (
    <div
      className="shrink-0 w-[170px] sm:w-[215px] flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 group relative border border-zinc-100 hover:border-zinc-200 hover:shadow-xl cursor-pointer"
      onClick={() => onViewProductDetails(item)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-50">
        <img
          src={item.imagen_urls[0]}
          alt={item.nombre}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-50' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {item.es_promo && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-sm bg-black/60"
              style={{ backgroundColor: `${themeColor}ee` }}
            >
              <Flame size={9} className="inline mr-0.5" /> PROMO
            </span>
          )}
          {item.es_nuevo && !item.es_promo && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500/90 text-white shadow-md backdrop-blur-sm">
              NUEVO
            </span>
          )}
          {item.es_mas_vendido && !item.es_promo && !item.es_nuevo && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-amber-500/90 text-white shadow-md backdrop-blur-sm">
              TOP
            </span>
          )}
          {isAgotado && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-zinc-800/90 text-white shadow-md backdrop-blur-sm">
              AGOTADO
            </span>
          )}
          {isLowStock && !isAgotado && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-orange-500/90 text-white shadow-md backdrop-blur-sm animate-pulse">
              Solo quedan {item.stock}
            </span>
          )}
        </div>

        {/* Quick add button */}
        <button
          onClick={(e) => { e.stopPropagation(); addToCart(item); }}
          disabled={isAgotado}
          className="absolute bottom-2 right-2 z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 hover:scale-110 hover:shadow-2xl disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          <Plus size={18} className="text-white" strokeWidth={2.5} />
        </button>

        {/* Prep time badge */}
        {item.estimated_prep_time && (
          <div className="absolute bottom-2 left-2 z-10 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
            <Clock size={10} />
            <span className="text-[10px] font-bold">~{item.estimated_prep_time} min</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h4 className="text-[13px] font-bold text-zinc-900 line-clamp-2 leading-tight min-h-[2rem] group-hover:text-zinc-700 transition-colors">
          {item.nombre}
        </h4>

        {/* Rating row */}
        <div className="flex items-center gap-2 flex-wrap">
          {averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500">
              <Star size={10} fill="currentColor" strokeWidth={0} />
              {averageRating.toFixed(1)}
              {reviewCount > 0 && <span className="text-zinc-400 font-normal">({reviewCount})</span>}
            </span>
          )}
          {item.order_count !== undefined && item.order_count > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
              <Users size={8} />
              {item.order_count} vendidos
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-zinc-100">
          <div className="flex flex-col">
            {item.es_promo && item.precio_anterior_usd && item.precio_anterior_usd > item.precio_usd && (
              <span className="text-[10px] text-zinc-400 line-through font-medium">
                ${item.precio_anterior_usd.toFixed(2)}
              </span>
            )}
            <span className="text-base font-black" style={{ color: themeColor }}>
              ${item.precio_usd.toFixed(2)}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onViewProductDetails(item); }}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer"
            style={{ color: themeColor }}
          >
            Ver
          </button>
        </div>
      </div>
    </div>
  );
};
