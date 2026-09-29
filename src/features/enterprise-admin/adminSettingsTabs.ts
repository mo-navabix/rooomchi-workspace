import type { ActiveTab } from '../../types';

export type AdminSettingsTab =
  | 'admin-settings-org'
  | 'admin-settings-auth'
  | 'admin-settings-integrations'
  | 'admin-settings-system'
  | 'admin-settings-audit';

export type AdminSettingsSection =
  | 'organization'
  | 'authentication'
  | 'integrations'
  | 'system'
  | 'audit';

export const ADMIN_SETTINGS_TABS: ActiveTab[] = [
  'admin-settings-org',
  'admin-settings-auth',
  'admin-settings-integrations',
  'admin-settings-system',
  'admin-settings-audit',
];

export function isAdminSettingsTab(tab: ActiveTab): boolean {
  return ADMIN_SETTINGS_TABS.includes(tab);
}

export const ADMIN_SETTINGS_NAV: {
  tab: AdminSettingsTab;
  label: string;
  section: AdminSettingsSection;
  permission: string;
}[] = [
  { tab: 'admin-settings-org', label: 'سازمان', section: 'organization', permission: 'MANAGE_ORG_SETTINGS' },
  {
    tab: 'admin-settings-auth',
    label: 'احراز هویت',
    section: 'authentication',
    permission: 'MANAGE_AUTHENTICATION_SETTINGS',
  },
  {
    tab: 'admin-settings-integrations',
    label: 'یکپارچه‌سازی',
    section: 'integrations',
    permission: 'MANAGE_INTEGRATIONS',
  },
  { tab: 'admin-settings-system', label: 'سامانه', section: 'system', permission: 'MANAGE_SYSTEM_SETTINGS' },
  { tab: 'admin-settings-audit', label: 'ممیزی', section: 'audit', permission: 'MANAGE_ORG_SETTINGS' },
];

export function sectionFromAdminSettingsTab(tab: ActiveTab): AdminSettingsSection {
  switch (tab) {
    case 'admin-settings-auth':
      return 'authentication';
    case 'admin-settings-integrations':
      return 'integrations';
    case 'admin-settings-system':
      return 'system';
    case 'admin-settings-audit':
      return 'audit';
    default:
      return 'organization';
  }
}
