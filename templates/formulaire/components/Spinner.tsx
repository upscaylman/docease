import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4'
};

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = '#a84383',
  className = '' 
}) => {
  return (
    <div 
      className={`${sizeClasses[size]} border-t-transparent rounded-full animate-spin ${className}`}
      style={{ borderColor: `${color} transparent transparent transparent` }}
      role="status"
      aria-label="Chargement en cours"
    />
  );
};

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Chargement en cours...', 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-[scaleIn_0.3s_ease-out]">
        <Spinner size="xl" />
        <p id="loading-message" className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div 
      className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Chargement du contenu"
    />
  );
};

interface InlineLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const InlineLoader: React.FC<InlineLoaderProps> = ({ 
  message = 'Chargement...', 
  size = 'md' 
}) => {
  return (
    <div className="flex items-center gap-3 justify-center py-4" role="status">
      <Spinner size={size} />
      <span className="text-gray-600 font-medium">{message}</span>
    </div>
  );
};

