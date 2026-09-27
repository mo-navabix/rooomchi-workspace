import React, { useState, useEffect } from 'react';
import { getGravatarUrl } from '../../utils/avatar';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UserAvatarProps {
  user?: { name?: string; email?: string; avatar?: string; avatarType?: string } | null;
  name?: string;
  avatar?: string;
  avatarType?: 'custom' | 'gravatar' | 'preset' | 'initials' | 'google';
  email?: string;
  size?: AvatarSize;
  className?: string;
  shape?: 'rounded' | 'circle';
  showBorder?: boolean;
}

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-14 h-14', text: 'text-lg' },
  xl: { container: 'w-20 h-20', text: 'text-2xl' },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name: explicitName,
  avatar: explicitAvatar,
  avatarType: explicitAvatarType,
  email: explicitEmail,
  size = 'md',
  className = '',
  shape = 'rounded',
  showBorder = false,
}) => {
  const name = explicitName || user?.name || 'کاربر';
  const avatar = explicitAvatar !== undefined ? explicitAvatar : user?.avatar;
  const avatarType = explicitAvatarType || (user as any)?.avatarType;
  const email = explicitEmail || user?.email;
  const [hasError, setHasError] = useState(false);

  // Reset error when avatar source changes
  useEffect(() => {
    setHasError(false);
  }, [avatar, email, avatarType]);

  const initial = (name?.trim()?.charAt(0) || 'ک').toUpperCase();
  const { container, text } = sizeMap[size];
  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const borderClass = showBorder ? 'border-2 border-white dark:border-[#1E293B] shadow-xs' : '';

  // Determine effective image source - Default is initials per user requirement
  let src = '';
  if (avatarType === 'initials') {
    src = '';
  } else if (avatarType === 'gravatar') {
    src = avatar?.trim() || (email ? getGravatarUrl(email, 200) : '');
  } else if (avatarType === 'custom' || avatarType === 'preset' || avatarType === 'google') {
    src = avatar?.trim() || '';
  } else if (avatar && avatar.trim()) {
    src = avatar.trim();
  } else {
    // Default is initials
    src = '';
  }

  const showImage = Boolean(src) && !hasError;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none font-bold transition-transform ${container} ${roundedClass} ${borderClass} ${className} bg-gradient-to-tr from-[var(--brand-primary)] to-[var(--brand-primary-light)] text-white shadow-xs`}
      title={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={`${text} font-black drop-shadow-xs`}>{initial}</span>
      )}
    </div>
  );
};
