import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  config: any;
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ config, onComplete }) => {
  const [phase, setPhase] = useState<'show' | 'fade'>('show');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), 1400);
    const t2 = setTimeout(() => onComplete(), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: 'transparent',
        opacity: phase === 'fade' ? 0 : 1,
        pointerEvents: phase === 'fade' ? 'none' : 'auto'
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          0% { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        className="flex flex-col items-center gap-1"
        style={{ animation: 'fadeInUp 0.6s ease-out forwards' }}
      >
        <h1 className="text-zinc-800 text-xl font-bold tracking-tight">
          {config.site_nombre || 'FoodPop'}
        </h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest">
          Bienvenido
        </p>
      </div>
    </div>
  );
};
