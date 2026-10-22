'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

export type FocalPointPreset =
  | 'center'
  | 'top'
  | 'top-center'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'face'
  | string;

export interface ResponsiveImageProps {
  src: string;
  alt: string;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  focalPoint?: FocalPointPreset;
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2' | '21/9' | 'auto' | string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  quality?: number;
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const FOCAL_MAP: Record<string, string> = {
  center: '50% 50%',
  top: '50% 0%',
  'top-center': '50% 15%',
  bottom: '50% 100%',
  left: '0% 50%',
  right: '100% 50%',
  'top-left': '0% 0%',
  'top-right': '100% 0%',
  'bottom-left': '0% 100%',
  'bottom-right': '100% 100%',
  face: '50% 25%', // Optimal upper-third framing for portrait/faces
};

const ASPECT_MAP: Record<string, string> = {
  '16/9': 'aspect-[16/9]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '3/2': 'aspect-[3/2]',
  '21/9': 'aspect-[21/9]',
};

export default function ResponsiveImage({
  src,
  alt,
  fit = 'cover',
  focalPoint = 'center',
  aspectRatio = 'auto',
  width,
  height,
  priority = false,
  className = '',
  containerClassName = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality,
  unoptimized,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src) {
    return null;
  }

  // Resolve object position from presets or raw CSS value
  const objectPosition = FOCAL_MAP[focalPoint] || focalPoint || '50% 50%';

  const aspectClass = aspectRatio && aspectRatio !== 'auto' ? ASPECT_MAP[aspectRatio] || '' : '';
  const customAspectStyle =
    aspectRatio && aspectRatio !== 'auto' && !ASPECT_MAP[aspectRatio]
      ? { aspectRatio }
      : undefined;

  const isFillMode = aspectRatio !== 'auto' || (!width && !height);

  return (
    <div
      className={`relative w-full max-w-full overflow-hidden bg-[#F2EFE7] ${aspectClass} ${containerClassName}`}
      style={customAspectStyle}
    >
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-[#F2EFE7] border border-dashed border-[#171514]/40 font-mono text-[10px] text-[#5A5650]">
          <span className="text-[#DF491E] font-bold mb-1">✕ [MEDIA OFFLINE]</span>
          <span className="truncate max-w-[90%]">{alt || 'Asset could not be loaded'}</span>
        </div>
      ) : isFillMode ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          unoptimized={unoptimized}
          style={{
            objectFit: fit,
            objectPosition,
          }}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          onLoad={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            if (onError) onError();
          }}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          quality={quality}
          unoptimized={unoptimized}
          style={{
            maxWidth: '100%',
            height: 'auto',
            objectFit: fit,
            objectPosition,
          }}
          className={`block w-full transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          onLoad={() => {
            setIsLoading(false);
            if (onLoad) onLoad();
          }}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            if (onError) onError();
          }}
        />
      )}
    </div>
  );
}
