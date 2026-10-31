import type { Organization } from "../types";

const RESERVED_TENANT_SUBDOMAINS = new Set([
  "app",
  "api",
  "admin",
  "www",
  "mail",
  "status",
  "billing",
  "auth",
  "rooomchi",
  "static",
  "assets",
]);

/** Hosts that show the public Rooomchi marketing landing at `/`. */
const PLATFORM_LANDING_HOSTS = new Set(["rooomchi.ir", "www.rooomchi.ir"]);

export type OrgWithDomain = Organization & { domain?: string };

export function normalizeBrowserHostname(host?: string): string {
  const raw =
    host ?? (typeof window !== "undefined" ? window.location.hostname : "");
  return raw.split(":")[0].trim().toLowerCase();
}

export function isPlatformLandingHost(hostname?: string): boolean {
  const clean = normalizeBrowserHostname(hostname);
  if (!clean || clean === "localhost" || clean === "127.0.0.1") return true;
  return PLATFORM_LANDING_HOSTS.has(clean);
}

export function extractTenantSlugFromHostname(hostname?: string): string | null {
  const clean = normalizeBrowserHostname(hostname);
  if (!clean || isPlatformLandingHost(clean)) return null;

  const parts = clean.split(".");
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (!RESERVED_TENANT_SUBDOMAINS.has(subdomain)) {
      return subdomain;
    }
  }
  return null;
}

/** Match org by full custom domain first, then tenant subdomain slug. */
export function findOrganizationByHostname(
  organizations: OrgWithDomain[],
  hostname?: string,
): OrgWithDomain | null {
  const clean = normalizeBrowserHostname(hostname);
  if (!clean || isPlatformLandingHost(clean)) return null;

  const byDomain = organizations.find(
    (o) => o.domain?.trim().toLowerCase() === clean,
  );
  if (byDomain) return byDomain;

  const slug = extractTenantSlugFromHostname(clean);
  if (!slug) return null;

  return (
    organizations.find(
      (o) =>
        o.slug?.toLowerCase() === slug || o.id.toLowerCase() === slug,
    ) ?? null
  );
}

export function isOrgPortalHost(
  organizations: OrgWithDomain[],
  hostname?: string,
): boolean {
  return findOrganizationByHostname(organizations, hostname) != null;
}
