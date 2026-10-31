import type { Request } from "express";
import type { Organization } from "../types";
import * as store from "../persistence/store";

const RESERVED_SUBDOMAINS = new Set([
  "app",
  "api",
  "admin",
  "www",
  "mail",
  "localhost",
  "127.0.0.1",
  "rooomchi",
]);

export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "";
}

export async function resolveOrganizationFromRequest(
  req: Request,
  body: {
    organizationId?: string;
    organizationSlug?: string;
    organizationCode?: string;
  } = {},
): Promise<Organization | null> {
  if (body.organizationId) {
    return (await store.getOrganizationById(body.organizationId)) ?? null;
  }

  const host =
    (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const cleanHost = host.split(":")[0].trim().toLowerCase();

  if (req.headers["x-organization-slug"]) {
    const slug = String(req.headers["x-organization-slug"]).trim().toLowerCase();
    return (await store.findOrganizationBySlugOrCode(slug)) ?? null;
  }

  if (body.organizationSlug) {
    return (
      (await store.findOrganizationBySlugOrCode(body.organizationSlug.trim())) ??
      null
    );
  }

  if (body.organizationCode) {
    return (
      (await store.findOrganizationBySlugOrCode(body.organizationCode.trim())) ??
      null
    );
  }

  if (cleanHost) {
    const byDomain = await store.findOrganizationByDomain(cleanHost);
    if (byDomain) return byDomain;
  }

  let detectedSlug: string | null = null;
  if (cleanHost.includes(".")) {
    const parts = cleanHost.split(".");
    if (parts.length === 2 && parts[1] === "localhost") {
      detectedSlug = parts[0];
    } else if (parts.length >= 3 && !RESERVED_SUBDOMAINS.has(parts[0])) {
      detectedSlug = parts[0];
    }
  }

  if (detectedSlug) {
    return (await store.findOrganizationBySlugOrCode(detectedSlug)) ?? null;
  }
  return null;
}
