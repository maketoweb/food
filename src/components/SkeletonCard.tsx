import React from 'react';

interface SkeletonCardProps {
  width?: string;
  height?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ width = '100%', height = '200px' }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-zinc-100" style={{ width, height }}>
      <div className="animate-pulse flex flex-col h-full">
        <div className="bg-zinc-200 h-[60%] w-full" />
        <div className="p-3 flex flex-col gap-2 flex-1">
          <div className="bg-zinc-200 h-3 w-3/4 rounded" />
          <div className="bg-zinc-100 h-2 w-1/2 rounded" />
          <div className="mt-auto bg-zinc-200 h-4 w-1/3 rounded" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
