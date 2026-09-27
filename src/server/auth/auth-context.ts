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

  let detectedSlug: string | null = null;
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  const cleanHost = host.split(":")[0].trim().toLowerCase();

  if (req.headers["x-organization-slug"]) {
    detectedSlug = String(req.headers["x-organization-slug"]).trim().toLowerCase();
  } else if (body.organizationSlug) {
    detectedSlug = body.organizationSlug.trim().toLowerCase();
  } else if (cleanHost.includes(".")) {
    const parts = cleanHost.split(".");
    if (parts.length >= 2 && !RESERVED_SUBDOMAINS.has(parts[0])) {
      detectedSlug = parts[0];
    }
  } else if (body.organizationCode) {
    return (await store.findOrganizationBySlugOrCode(body.organizationCode.trim())) ?? null;
  }

  if (detectedSlug) {
    return (await store.findOrganizationBySlugOrCode(detectedSlug)) ?? null;
  }
  return null;
}
