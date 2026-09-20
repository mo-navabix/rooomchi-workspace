import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantResolverService } from './tenant-resolver.service';

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    @Inject(TenantResolverService)
    private readonly tenantResolverService: TenantResolverService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const host = (req.headers['x-forwarded-host'] as string) || req.headers['host'];
    const headerSlug =
      (req.headers['x-organization-slug'] as string) ||
      (req.headers['x-tenant-slug'] as string) ||
      null;
    const headerOrgId =
      (req.headers['x-organization-id'] as string) ||
      (req.headers['x-tenant-id'] as string) ||
      null;

    const tenantContext = await this.tenantResolverService.resolveTenant(
      host,
      headerSlug,
      headerOrgId,
    );

    if (tenantContext) {
      req.tenantContext = tenantContext;
      req.organizationId = tenantContext.organizationId;
    }

    next();
  }
}
