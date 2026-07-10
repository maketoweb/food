import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  config: any;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'name' | 'fade'>('name');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1200);
    const t2 = setTimeout(() => onComplete(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
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
        @keyframes nameSlideUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      <div className="z-10 flex flex-col items-center">
        <h1
          className="text-white text-3xl font-extrabold tracking-tight"
          style={{ animation: 'nameSlideUp 0.6s ease-out forwards' }}
        >
          {config.site_nombre || 'FoodPop'}
        </h1>
        <p
          className="text-white/60 text-xs uppercase tracking-widest mt-3"
          style={{ animation: 'nameSlideUp 0.6s ease-out 0.3s both' }}
        >
          Delivery Rápido
        </p>
        <div
          className="mt-6 flex gap-1.5"
          style={{ animation: 'pulseGlow 1.2s ease-in-out infinite', animationDelay: '0.6s' }}
        >
          <div className="w-2 h-2 rounded-full bg-white/80" />
          <div className="w-2 h-2 rounded-full bg-white/60" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
};
