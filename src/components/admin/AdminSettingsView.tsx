import React from 'react';
import { EnterpriseAdminSettingsView } from '../../features/enterprise-admin/EnterpriseAdminSettingsView';
import type { AdminSettingsSection } from '../../features/enterprise-admin/adminSettingsTabs';

/** Enterprise administration — one section per sidebar page. */
export const AdminSettingsView: React.FC<{ section: AdminSettingsSection }> = (props) => (
  <EnterpriseAdminSettingsView {...props} />
);
