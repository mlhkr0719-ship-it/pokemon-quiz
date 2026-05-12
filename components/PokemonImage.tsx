'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PokemonImageProps {
  imageUrl: string;
  name: string;
  silhouette: boolean;
  revealed: boolean;
  className?: string;
}

export default function PokemonImage({
  imageUrl,
  name,
  silhouette,
  revealed,
  className,
}: PokemonImageProps) {
  const [loaded, setLoaded] = useState(false);

  const isSilhouette = silhouette && !revealed;

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64',
        className
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 pokeball-spin">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="48" fill="#EF4444" stroke="#333" strokeWidth="4" />
              <path d="M2 50 Q50 50 98 50" stroke="#333" strokeWidth="4" fill="none" />
              <rect x="2" y="46" width="96" height="8" fill="white" />
              <circle cx="50" cy="50" r="12" fill="white" stroke="#333" strokeWidth="4" />
              <circle cx="50" cy="50" r="6" fill="#EF4444" stroke="#333" strokeWidth="2" />
              <path d="M50 2 Q50 50 98 50" fill="white" fillOpacity="0.1" />
            </svg>
          </div>
        </div>
      )}

      {imageUrl && (
        <Image
          src={imageUrl}
          alt={isSilhouette ? '???' : name}
          width={256}
          height={256}
          priority
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-contain transition-all duration-500 drop-shadow-xl',
            !loaded && 'opacity-0',
            loaded && !isSilhouette && 'opacity-100',
            isSilhouette && loaded && 'silhouette',
            revealed && 'silhouette-revealed',
          )}
          style={{
            imageRendering: 'auto',
          }}
          unoptimized
        />
      )}
    </div>
  );
}
