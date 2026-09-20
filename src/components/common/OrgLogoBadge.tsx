import React, { useState } from 'react';

export interface OrgLogoBadgeProps {
  logo?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const isImageLogo = (val?: string): boolean => {
  if (!val) return false;
  return (
    val.startsWith('data:image/') ||
    val.startsWith('http://') ||
    val.startsWith('https://') ||
    val.startsWith('/') ||
    /\.(png|jpe?g|svg|webp|gif|ico)(\?.*)?$/i.test(val)
  );
};

export const OrgLogoBadge: React.FC<OrgLogoBadgeProps> = ({
  logo = '🏢',
  name = 'سازمان',
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: {
      container: 'w-6 h-6 rounded-md text-xs',
      img: 'w-full h-full p-0.5 object-contain',
    },
    sm: {
      container: 'w-8 h-8 rounded-lg text-sm',
      img: 'w-full h-full p-1 object-contain',
    },
    md: {
      container: 'w-10 h-10 rounded-xl text-base',
      img: 'w-full h-full p-1.5 object-contain',
    },
    lg: {
      container: 'w-14 h-14 rounded-2xl text-xl',
      img: 'w-full h-full p-2 object-contain',
    },
    xl: {
      container: 'w-20 h-20 rounded-2xl text-2xl',
      img: 'w-full h-full p-2.5 object-contain',
    },
  }[size];

  const isImg = !hasError && isImageLogo(logo);

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden bg-slate-100 dark:bg-[#334155] border border-slate-200/80 dark:border-[#334155] shadow-xs select-none ${sizeClasses.container} ${className}`}
      title={name}
    >
      {isImg ? (
        <img
          src={logo}
          alt={name}
          className={`object-contain max-h-full max-w-full ${sizeClasses.img}`}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="leading-none">{hasError ? '🏢' : logo || '🏢'}</span>
      )}
    </div>
  );
};
