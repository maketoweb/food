import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  config: any;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'message' | 'logo' | 'fade'>('message');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 600);
    const t2 = setTimeout(() => setPhase('fade'), 2200);
    const t3 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const themeColor = config.theme_color || '#FF6B35';
  const logoUrl = config.splash_logo_url || config.pwa_icon_url || config.logo_url || '/pwa-192x192.png';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: themeColor,
        opacity: phase === 'fade' ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <style>{`
        @keyframes messageIn {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes logoZoom {
          0% { transform: scale(0.2); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Mensaje de bienvenida */}
      <div
        className="flex flex-col items-center gap-3 px-8 text-center"
        style={{
          animation: 'messageIn 0.6s ease-out forwards',
          opacity: 0,
        }}
      >
        <h1 className="text-white text-3xl font-extrabold tracking-tight drop-shadow-md"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {config.site_nombre || 'FoodPop'}
        </h1>
        <p className="text-white/85 text-sm leading-relaxed max-w-xs">
          {config.mensaje_bienvenida || 'La mejor comida con delivery express.'}
        </p>
      </div>

      {/* Logo con zoom - aparece encima del mensaje */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: phase === 'message' ? 0 : 1,
        }}
      >
        <img
          src={logoUrl}
          alt={config.site_nombre || 'FoodPop'}
          className="w-36 h-36 object-contain drop-shadow-2xl"
          style={{
            animation: phase === 'logo' ? 'logoZoom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
            opacity: 0,
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/pwa-192x192.png';
          }}
        />
      </div>
    </div>
  );
};
