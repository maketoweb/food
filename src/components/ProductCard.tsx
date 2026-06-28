import React from 'react';
import { FoodItem, StoreConfig } from '../types/store';
import { ShoppingCart, Eye } from 'lucide-react';
import { getCategoryColor } from '../utils/categoryColors';

interface ProductCardProps {
  item: FoodItem;
  config: StoreConfig;
  onViewProductDetails: (item: FoodItem) => void;
  addToCart: (item: FoodItem) => void;
  isOffer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  item,
  config,
  onViewProductDetails,
  addToCart,
  isOffer
}) => {
  const isAgotado = item.stock <= 0;
  const catColor = getCategoryColor(item.categoria);

  const ingredientTags = item.ingredientes
    ? item.ingredientes.slice(0, 4)
    : [];

  const precioBs = (item.precio_usd * 36.5).toFixed(2);

  return (
    <div className="shrink-0 w-[170px] sm:w-[215px] flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)] transition-all duration-300 group relative border border-zinc-100">
      {/* ── Image ── */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={item.imagen_urls[0]}
          alt={item.nombre}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-50' : ''}`}
          referrerPolicy="no-referrer"
        />

        {/* Hover overlay + eye icon */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => onViewProductDetails(item)}
            className="p-3 bg-white/95 rounded-xl text-zinc-800 shadow-xl scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm hover:bg-white"
            aria-label="Ver producto"
          >
            <Eye size={18} />
          </button>
        </div>

        {/* Badges – top left */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {item.es_promo && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md">
              PROMO
            </span>
          )}
          {item.es_nuevo && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md">
              NUEVO
            </span>
          )}
          {item.es_mas_vendido && !item.es_promo && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
              TOP VENTAS
            </span>
          )}
          {isAgotado && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-white shadow-md">
              Agotado
            </span>
          )}
        </div>

        {/* Delivery gratis */}
        {item.delivery_gratis && !isAgotado && (
          <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md">
            Delivery
          </span>
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Category pill */}
        <span
          className="text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 w-fit"
          style={{ backgroundColor: catColor.light, color: catColor.textColor }}
        >
          {item.categoria}
        </span>

        {/* Name */}
        <h4 className="text-[13px] font-extrabold text-zinc-900 line-clamp-2 leading-tight min-h-[2.2rem]">
          {item.nombre}
        </h4>

        {/* Description – 1 line */}
        {item.descripcion && (
          <p className="text-[10px] text-zinc-400 line-clamp-1 leading-tight">
            {item.descripcion}
          </p>
        )}

        {/* Ingredient tags */}
        {ingredientTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ingredientTags.map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 rounded-full text-[7px] font-semibold bg-zinc-100 text-zinc-500 leading-none"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price + Button */}
        <div className="mt-auto flex flex-col gap-2 pt-1">
          {/* Prices */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black leading-none" style={{ color: catColor.primary }}>
              ${item.precio_usd.toFixed(2)}
            </span>
            <span className="text-[9px] text-zinc-300 font-mono">
              Bs {precioBs}
            </span>
          </div>

          {/* Agregar button */}
          <button
            onClick={() => !isAgotado && addToCart(item)}
            disabled={isAgotado}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
              isAgotado
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                : 'text-white hover:brightness-110 active:scale-95 shadow-lg'
            }`}
            style={
              !isAgotado
                ? { background: catColor.gradient, boxShadow: `0 4px 15px ${catColor.primary}33` }
                : undefined
            }
          >
            <ShoppingCart size={13} strokeWidth={2.5} />
            {isAgotado ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};
