import React from 'react';

type BossManImageProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
};

export function BossManImage({ size = 'md', className = '' }: BossManImageProps) {
  const sizeClasses = {
    'xs': 'w-6 h-6',
    'sm': 'w-8 h-8',
    'md': 'w-12 h-12',
    'lg': 'w-16 h-16',
    'xl': 'w-24 h-24',
    '2xl': 'w-32 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} bg-primary rounded-full flex items-center justify-center text-white font-bold`}>
      HB
    </div>
  );
}

export default BossManImage;