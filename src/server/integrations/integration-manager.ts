/**
 * Integration provider registry (LDAP, Google, SMTP, Storage).
 * Setup wizard and admin panels resolve providers here — avoid hard-coding in routes.
 */
import type { LdapConfiguration, GoogleConfiguration } from "../auth/types";
import { testLdapConnection } from "../auth/providers/ldap.provider";
import { testGoogleConfiguration, testSmtpConfiguration, type SetupSmtpInput } from "../installation/setup.service";
import { getIntegration, upsertIntegration, type IntegrationProvider } from "../installation/integrations.store";

export type IntegrationTestResult = { ok: boolean; message: string };

export const IntegrationManager = {
  async save(organizationId: string, provider: IntegrationProvider, config: Record<string, unknown>, enabled = true) {
    await upsertIntegration(organizationId, provider, config, enabled);
  },

  async get(organizationId: string, provider: IntegrationProvider) {
    return getIntegration(organizationId, provider);
  },

  async testLdap(config: LdapConfiguration): Promise<IntegrationTestResult> {
    return testLdapConnection(config);
  },

  async testGoogle(config: GoogleConfiguration): Promise<IntegrationTestResult> {
    return testGoogleConfiguration(config);
  },

  async testSmtp(config: SetupSmtpInput): Promise<IntegrationTestResult> {
    return testSmtpConfiguration(config);
  },
};
