import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RoleEnum } from '../enums/role.enum';
import { TenantContext } from '../tenant/tenant-context.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context is missing for tenant validation');
    }

    const userRole: string = typeof user.role === 'object' ? user.role.name : user.role;

    // Super Admin has multi-tenant platform oversight
    if (userRole === RoleEnum.SUPER_ADMIN) {
      return true;
    }

    // 1. Subdomain tenant isolation check:
    // If request arrived on an organization subdomain, the user must belong to that organization
    const tenantContext: TenantContext | undefined = request.tenantContext;
    if (tenantContext && tenantContext.organizationId !== user.organizationId) {
      throw new ForbiddenException(
        `Cross-tenant violation: Your account belongs to a different organization than '${tenantContext.organizationName}'`,
      );
    }

    // 2. URL route parameter check:
    // Prevent an admin/user from org A from requesting /organizations/:id/users for org B
    const paramOrgId =
      request.params.organizationId ||
      request.params.id ||
      request.query?.organizationId;

    if (paramOrgId && user.organizationId && paramOrgId !== user.organizationId) {
      throw new ForbiddenException(
        'Cross-tenant violation: You cannot access or modify data belonging to another organization',
      );
    }

    // 3. Body tenant parameter check
    if (request.body?.organizationId && request.body.organizationId !== user.organizationId) {
      throw new ForbiddenException(
        'Cross-tenant violation: organizationId in request body does not match authenticated user organization',
      );
    }

    return true;
  }
}
