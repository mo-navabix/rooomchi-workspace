import type { ActiveTab } from '../../types';

export type AdminRoomsTab =
  | 'admin-rooms'
  | 'admin-rooms-campus'
  | 'admin-rooms-amenities';

export const ADMIN_ROOMS_TABS: AdminRoomsTab[] = [
  'admin-rooms',
  'admin-rooms-campus',
  'admin-rooms-amenities',
];

export function isAdminRoomsTab(tab: ActiveTab): boolean {
  return ADMIN_ROOMS_TABS.includes(tab as AdminRoomsTab);
}

export const ADMIN_ROOMS_NAV: {
  tab: AdminRoomsTab;
  label: string;
  permission: string;
}[] = [
  { tab: 'admin-rooms', label: 'اتاق‌ها و سالن‌ها', permission: 'MANAGE_ROOMS' },
  { tab: 'admin-rooms-campus', label: 'ساختمان‌ها و طبقات', permission: 'MANAGE_ROOMS' },
  { tab: 'admin-rooms-amenities', label: 'امکانات و تجهیزات', permission: 'MANAGE_ROOMS' },
];
