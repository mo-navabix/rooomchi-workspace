import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import type { JwtPayload } from '../../config/jwt.config';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /organizations/:id/users
   * Organization Admin capability: Create employee.
   * Scoped strictly by organization ID.
   */
  @Post('organizations/:id/users')
  @UseGuards(TenantGuard)
  @Roles(RoleEnum.ORGANIZATION_ADMIN, RoleEnum.SUPER_ADMIN)
  async createEmployee(
    @Param('id') organizationId: string,
    @Body() createDto: CreateUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = await this.usersService.createEmployee(
      organizationId,
      createDto,
      currentUser,
    );
    return {
      message: 'Employee created successfully',
      user,
    };
  }

  /**
   * POST /organizations/:id/users/invite
   * Organization Admin capability: Invite employee.
   */
  @Post('organizations/:id/users/invite')
  @UseGuards(TenantGuard)
  @Roles(RoleEnum.ORGANIZATION_ADMIN, RoleEnum.SUPER_ADMIN)
  async inviteEmployee(
    @Param('id') organizationId: string,
    @Body() inviteDto: InviteUserDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const invitedUser = await this.usersService.inviteEmployee(
      organizationId,
      inviteDto,
      currentUser,
    );
    return {
      message: 'Employee invitation sent successfully',
      user: invitedUser,
    };
  }

  /**
   * GET /organizations/:id/users
   * Organization Admin / Manager capability: List employees.
   * Every query is scoped by organization_id.
   */
  @Get('organizations/:id/users')
  @UseGuards(TenantGuard)
  @Roles(RoleEnum.ORGANIZATION_ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER)
  async listEmployees(
    @Param('id') organizationId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.usersService.listEmployees(organizationId, currentUser);
  }

  /**
   * PATCH /users/:id/status
   * Organization Admin capability: Enable/disable employee.
   * Enforces service-level organization isolation.
   */
  @Patch('users/:id/status')
  @Roles(RoleEnum.ORGANIZATION_ADMIN, RoleEnum.SUPER_ADMIN)
  async updateStatus(
    @Param('id') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const updatedUser = await this.usersService.updateStatus(
      userId,
      updateStatusDto,
      currentUser,
    );
    return {
      message: `Employee status successfully updated to ${updateStatusDto.status}`,
      user: updatedUser,
    };
  }

  /**
   * PATCH /users/:id/role
   * Organization Admin capability: Assign role.
   */
  @Patch('users/:id/role')
  @Roles(RoleEnum.ORGANIZATION_ADMIN, RoleEnum.SUPER_ADMIN)
  async assignRole(
    @Param('id') userId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const updatedUser = await this.usersService.assignRole(
      userId,
      assignRoleDto,
      currentUser,
    );
    return {
      message: `Employee role successfully updated to ${assignRoleDto.role}`,
      user: updatedUser,
    };
  }
}
