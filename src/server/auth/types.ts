export type AuthProviderId = "local" | "ldap" | "google";

export type OrganizationAuthSettings = {
  organizationId: string;
  localEnabled: boolean;
  ldapEnabled: boolean;
  googleEnabled: boolean;
  ldapConfiguration: LdapConfiguration;
  googleConfiguration: GoogleConfiguration;
  authPolicies: AuthPolicies;
};

export type LdapConfiguration = {
  url?: string;
  bindDn?: string;
  bindPassword?: string;
  baseDn?: string;
  userFilter?: string;
  emailAttribute?: string;
  nameAttribute?: string;
  defaultRole?: string;
  useTls?: boolean;
};

export type GoogleConfiguration = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  allowedDomains?: string[];
  autoProvision?: boolean;
  defaultRole?: string;
};

export type AuthPolicies = {
  selfRegistrationEnabled?: boolean;
  emailVerificationRequired?: boolean;
  defaultLocalRole?: string;
};

export type AuthLoginResult = {
  accessToken: string;
  token: string;
  tokenType: "Bearer";
  user: Record<string, unknown>;
  message: string;
  requiresPasswordChange?: boolean;
  isProfileComplete?: boolean;
  isNewUser?: boolean;
};

export type ResolvedOrganization = {
  id: string;
  name: string;
  slug?: string;
  status: string;
};
