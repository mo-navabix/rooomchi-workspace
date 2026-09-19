import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleEnum } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(RoleEnum | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context is not available for authorization');
    }

    const userRole: string = typeof user.role === 'object' ? user.role.name : user.role;

    // Super Admin has universal access
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
