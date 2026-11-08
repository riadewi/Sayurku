import React, { useState, useEffect } from 'react';
import { Package, Leaf, Carrot, Sparkles, Layers, ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  isBundle?: boolean;
  category?: string;
  productName?: string;
  objectFit?: 'contain' | 'cover';
  onClick?: () => void;
  showBadge?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Foto Produk Sayuran',
  className = '',
  containerClassName = '',
  isBundle = false,
  category = '',
  productName = '',
  objectFit = isBundle ? 'cover' : 'contain',
  onClick,
  showBadge = false
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error'
  );

  // When src changes, reset state
  useEffect(() => {
    if (src && src.trim().length > 0) {
      setImageState('loading');
    } else {
      setImageState('error');
    }
  }, [src]);

  // Determine category-specific accent
  const getCategoryTheme = () => {
    if (isBundle) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: <Layers className="w-8 h-8 text-amber-500" />,
        badgeText: 'Paket Bundling'
      };
    }
    const cat = category.toLowerCase();
    if (cat.includes('daun')) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: <Leaf className="w-8 h-8 text-emerald-500" />,
        badgeText: 'Sayuran Daun'
      };
    }
    if (cat.includes('umbi') || cat.includes('buah')) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        icon: <Carrot className="w-8 h-8 text-orange-500" />,
        badgeText: 'Umbi & Buah'
      };
    }
    if (cat.includes('bumbu') || cat.includes('rempah')) {
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        icon: <Sparkles className="w-8 h-8 text-rose-500" />,
        badgeText: 'Bumbu & Rempah'
      };
    }
    return {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      icon: <Package className="w-8 h-8 text-teal-500" />,
      badgeText: 'Sayur Segar'
    };
  };

  const theme = getCategoryTheme();

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer' : ''
      } ${containerClassName}`}
    >
      {/* Loading Skeleton */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 animate-ping opacity-30" />
        </div>
      )}

      {/* Actual Product Image */}
      {src && imageState !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setImageState('loaded')}
          onError={() => setImageState('error')}
          className={`w-full h-full transition-all duration-300 ${
            objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'
          } ${imageState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${className}`}
        />
      )}

      {/* Fallback Neutral Vegetable Illustration */}
      {imageState === 'error' && (
        <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center ${theme.bg}`}>
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center mb-1.5 transition-transform hover:scale-105">
            {theme.icon}
          </div>
          {productName && (
            <span className="text-[11px] font-bold text-gray-700 line-clamp-1 max-w-[90%]">
              {productName}
            </span>
          )}
          <span className={`text-[9px] font-semibold tracking-wider uppercase ${theme.text}`}>
            {theme.badgeText}
          </span>
        </div>
      )}

      {/* Optional Badge */}
      {showBadge && isBundle && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-white font-bold text-[10px] backdrop-blur-xs shadow-xs z-10 flex items-center space-x-1">
          <Layers className="w-3 h-3" />
          <span>Paket</span>
        </div>
      )}
    </div>
  );
};
