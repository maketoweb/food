import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

interface SplashScreenProps {
  config: any;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'logo' | 'name' | 'fade'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('name'), 600);
    const t2 = setTimeout(() => setPhase('fade'), 1600);
    const t3 = setTimeout(() => onComplete(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const themeColor = config.theme_color || '#FF6B35';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        backgroundColor: themeColor,
        opacity: phase === 'fade' ? 0 : 1,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <style>{`
        @keyframes logoZoomIn {
          0% { transform: scale(0.2); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nameSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="z-10 flex flex-col items-center">
        {config.logo_url ? (
          <img
            src={config.logo_url}
            alt={config.site_nombre}
            className="w-24 h-24 object-contain rounded-3xl mb-4"
            style={{ animation: 'logoZoomIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          />
        ) : (
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4 bg-white/15"
            style={{ animation: 'logoZoomIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
          >
            <ShoppingBag size={40} className="text-white" />
          </div>
        )}
        <h1
          className="text-white text-2xl font-extrabold tracking-tight"
          style={{ animation: 'nameSlideUp 0.6s ease-out 0.4s both' }}
        >
          {config.site_nombre || 'FoodPop'}
        </h1>
        <p
          className="text-white/60 text-xs uppercase tracking-widest mt-2"
          style={{ animation: 'nameSlideUp 0.6s ease-out 0.6s both' }}
        >
          Delivery Express
        </p>
      </div>
    </div>
  );
};
