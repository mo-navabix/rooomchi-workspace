import { User } from './entities/user.entity';
import { RoleEnum } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';

/** Shape expected by the React app (legacy Express mock). */
export function toClientUser(user: User) {
  const roleName = user.roleName || user.role?.name || RoleEnum.EMPLOYEE;
  const role = mapRoleToClient(roleName);

  let status: 'active' | 'suspended' = 'active';
  if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.INACTIVE) {
    status = 'suspended';
  }

  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    email: user.email,
    orgId: user.organizationId,
    organizationId: user.organizationId,
    orgName: user.organization?.name,
    role,
    department: '',
    jobTitle: '',
    phone: '',
    status,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : String(user.createdAt ?? ''),
    lastLogin: user.lastLoginAt
      ? user.lastLoginAt instanceof Date
        ? user.lastLoginAt.toISOString()
        : String(user.lastLoginAt)
      : undefined,
  };
}

function mapRoleToClient(role: RoleEnum | string): string {
  const normalized = String(role).toUpperCase();
  switch (normalized) {
    case RoleEnum.SUPER_ADMIN:
      return 'super_admin';
    case RoleEnum.ORGANIZATION_ADMIN:
      return 'org_admin';
    case RoleEnum.MANAGER:
      return 'room_manager';
    case RoleEnum.SUPERVISOR:
      return 'supervisor';
    case RoleEnum.EMPLOYEE:
    default:
      return 'employee';
  }
}
