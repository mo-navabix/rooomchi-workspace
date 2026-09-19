import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant-context.interface';

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const tenantContext: TenantContext | undefined = request.tenantContext;
    const organizationId = request.user?.organizationId || request.organizationId || tenantContext?.organizationId;

    if (!data) {
      return tenantContext || (organizationId ? { organizationId } : null);
    }

    if (tenantContext && data in tenantContext) {
      return tenantContext[data];
    }

    if (data === 'organizationId') {
      return organizationId || null;
    }

    return null;
  },
);
