import React from 'react';
import { Producto, StoreConfig } from '../types/store';
import { ShoppingCart, Eye, Flame, Sparkles } from 'lucide-react';
import { getCategoryColor } from '../utils/categoryColors';

interface ProductCardProps {
  part: Producto;
  config: StoreConfig;
  onViewProductDetails: (part: Producto) => void;
  addToCart: (part: Producto) => void;
  isOffer?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  part, 
  config, 
  onViewProductDetails, 
  addToCart,
  isOffer 
}) => {
  const disponibilidad = (part as any).disponibilidad || 'Disponible';
  const isAgotado = disponibilidad === 'Agotado';
  const isEnReposicion = disponibilidad === 'En Reposición';
  const isDisponible = disponibilidad === 'Disponible';
  const hasOptions = part.option_groups && part.option_groups.length > 0;
  const catColor = getCategoryColor(part.categoria);

  return (
    <div className="shrink-0 snap-start w-[170px] sm:w-[215px] flex flex-col bg-white rounded-3xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300 group relative border border-orange-50">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {part.es_promo && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-md flex items-center gap-0.5">
            <Flame size={8} /> Promo
          </span>
        )}
        {part.es_nuevo && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md flex items-center gap-0.5">
            <Sparkles size={8} /> Nuevo
          </span>
        )}
        {isAgotado && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-zinc-800 text-white shadow-md">
            Agotado
          </span>
        )}
        {part.es_mas_vendido && !part.es_promo && (
          <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md flex items-center gap-0.5">
            🔥 Top
          </span>
        )}
      </div>

      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
        <img 
          src={part.imagen_urls[0]} 
          alt={part.nombre} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isAgotado ? 'grayscale opacity-50' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={() => onViewProductDetails(part)}
            className="p-3 bg-white/95 rounded-2xl text-zinc-800 shadow-xl hover:scale-110 transition-transform cursor-pointer backdrop-blur-sm"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex flex-col gap-0.5">
          <span 
            className="text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 w-fit"
            style={{ backgroundColor: catColor.light, color: catColor.textColor }}
          >
            {part.categoria}
          </span>
          <h4 className="text-[13px] font-extrabold text-zinc-900 line-clamp-2 leading-tight min-h-[2.5rem]">
            {part.nombre}
          </h4>
        </div>

        {part.detalle_adicional && (
          <p className="text-[10px] text-zinc-400 line-clamp-1 leading-tight">
            {part.detalle_adicional}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black" style={{ color: catColor.primary }}>
              ${part.precio_usd.toFixed(2)}
            </span>
            <span className="text-[10px] text-zinc-300 font-mono line-through">
              {(part.precio_usd * 1.15).toFixed(2)}
            </span>
          </div>
          
          {hasOptions && (
            <span className="text-[9px] font-semibold text-zinc-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Personalizable
            </span>
          )}
          
          <button
            onClick={() => !isAgotado && addToCart(part)}
            disabled={isAgotado}
            className={`w-full py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200 ${
              isAgotado 
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' 
                : 'text-white active:scale-95 cursor-pointer hover:opacity-90 shadow-lg'
            }`}
            style={!isAgotado ? { background: catColor.gradient, boxShadow: `0 4px 15px ${catColor.primary}33` } : undefined}
          >
            <ShoppingCart size={13} strokeWidth={2.5} />
            {isAgotado ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
};
