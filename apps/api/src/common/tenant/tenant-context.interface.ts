export interface TenantContext {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  domain?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
      organizationId?: string;
    }
  }
}
