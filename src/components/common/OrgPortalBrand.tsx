import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from './Logo';
import { OrgLogoBadge } from './OrgLogoBadge';

type Props = {
  /** Sidebar collapsed: icon only */
  collapsed?: boolean;
  className?: string;
  showTagline?: boolean;
  /** Footer / compact row */
  variant?: 'sidebar' | 'footer';
};

export const OrgPortalBrand: React.FC<Props> = ({
  collapsed = false,
  className = '',
  showTagline = true,
  variant = 'sidebar',
}) => {
  const { currentOrg } = useApp();

  if (!currentOrg) {
    return collapsed ? (
      <Logo variant="mark" size="sm" className={className} />
    ) : (
      <Logo variant="horizontal" size="sm" className={className} />
    );
  }

  const logo = currentOrg.logo;
  const logoDark = currentOrg.settings?.logoDark;

  if (collapsed) {
    return (
      <OrgLogoBadge
        logo={logo}
        logoDark={logoDark}
        name={currentOrg.name}
        size="md"
        className={className}
      />
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
        <OrgLogoBadge logo={logo} logoDark={logoDark} name={currentOrg.name} size="sm" />
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
          {currentOrg.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 min-w-0 max-w-full ${className}`}>
      <OrgLogoBadge
        logo={logo}
        logoDark={logoDark}
        name={currentOrg.name}
        size="md"
        className="shrink-0"
      />
      <div className="min-w-0 text-right leading-tight flex-1">
        <p
          className="text-sm font-bold text-slate-900 dark:text-white truncate"
          title={currentOrg.name}
        >
          {currentOrg.name}
        </p>
        {showTagline && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            سامانه رزرو اتاق جلسه
          </p>
        )}
      </div>
    </div>
  );
};
