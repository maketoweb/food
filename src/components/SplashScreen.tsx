import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  config: any;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'show' | 'fade'>('show');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1800);
    const t2 = setTimeout(() => onComplete(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  const themeColor = config.theme_color || '#FF6B35';

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-600"
      style={{
        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
        opacity: phase === 'fade' ? 0 : 1,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        className="flex flex-col items-center gap-3 px-8 text-center"
        style={{ animation: 'fadeInUp 0.7s ease-out forwards' }}
      >
        <h1 className="text-white text-2xl font-bold tracking-tight drop-shadow-lg">
          {config.site_nombre || 'FoodPop'}
        </h1>
        <p className="text-white/90 text-sm leading-relaxed max-w-xs">
          {config.mensaje_bienvenida || 'La mejor comida con delivery express.'}
        </p>
      </div>
    </div>
  );
};
