import { IsNotEmpty, IsEnum } from 'class-validator';
import { RoleEnum } from '../../../common/enums/role.enum';

export class AssignRoleDto {
  @IsNotEmpty({ message: 'Role is required' })
  @IsEnum(RoleEnum, {
    message: 'Role must be one of: SUPER_ADMIN, ORGANIZATION_ADMIN, MANAGER, EMPLOYEE',
  })
  role!: RoleEnum;
}
