import React from 'react';
import { Truck, Check } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface FreeDeliveryBarProps {
  currentTotal: number;
  threshold: number;
  themeColor: string;
}

export const FreeDeliveryBar: React.FC<FreeDeliveryBarProps> = ({
  currentTotal,
  threshold,
  themeColor,
}) => {
  if (!threshold || threshold <= 0) return null;

  const isFree = currentTotal >= threshold;
  const remaining = Math.max(0, threshold - currentTotal);
  const progress = Math.min(100, (currentTotal / threshold) * 100);

  return (
    <div className={`px-4 py-2.5 transition-all duration-300 ${
      isFree ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-white border-b border-zinc-100'
    }`}>
      <div className="flex items-center gap-2">
        {isFree ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check size={12} className="text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${themeColor}15` }}>
            <Truck size={12} style={{ color: themeColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {isFree ? (
            <p className="text-[11px] font-bold text-emerald-700">
              ¡Tienes delivery gratis! 🎉
            </p>
          ) : (
            <p className="text-[11px] font-semibold text-zinc-600">
              Te faltan <span className="font-black" style={{ color: themeColor }}>${remaining.toFixed(2)}</span> para delivery gratis
            </p>
          )}
        </div>
        {!isFree && (
          <span className="text-[10px] font-bold text-zinc-400">
            <AnimatedCounter target={Math.round(progress)} suffix="%" duration={800} />
          </span>
        )}
      </div>
      {!isFree && (
        <div className="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${themeColor}, ${themeColor}cc)`,
            }}
          />
        </div>
      )}
    </div>
  );
};
