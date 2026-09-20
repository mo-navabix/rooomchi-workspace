import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleEnum } from '../enums/role.enum';
import { getRouteMetadata } from '../utils/metadata.util';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = getRouteMetadata<(RoleEnum | string)[]>(ROLES_KEY, context);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context is not available for authorization');
    }

    const userRole: string = typeof user.role === 'object' ? user.role.name : user.role;

    if (userRole === RoleEnum.SUPER_ADMIN) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => role === userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): [${requiredRoles.join(', ')}]. Your role: ${userRole}`,
      );
    }

    return true;
  }
}
