export type OrganizationAuthSettingsPublic = {
  organizationId: string;
  localEnabled: boolean;
  ldapEnabled: boolean;
  googleEnabled: boolean;
  authPolicies: {
    selfRegistrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  ldap: { label: string } | null;
  google: { clientId: string | null } | null;
};
