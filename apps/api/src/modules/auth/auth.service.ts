import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import { JwtPayload } from '../../config/jwt.config';
import { UserStatus } from '../../common/enums/user-status.enum';
import { OrganizationStatus } from '../../common/enums/organization-status.enum';
import { User } from '../users/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { TenantContext } from '../../common/tenant/tenant-context.interface';
import { toClientUser } from '../users/user-client.mapper';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Enterprise Multi-Tenant Subdomain Authentication
   *
   * Automatically isolates user lookup by subdomain tenant context:
   * - Host: technova.rooomchi.ir -> TenantContext: { organizationId, organizationSlug: 'technova' }
   * - Options:
   *   1. Corporate email + password
   *   2. Employee number + password (organization detected from subdomain)
   */
  async login(loginDto: LoginDto, tenantContext?: TenantContext | null) {
    let targetOrg: Organization | null = null;

    // 1. Resolve Organization from Subdomain TenantContext or explicit slug
    if (tenantContext) {
      targetOrg = await this.organizationsService.findOneById(tenantContext.organizationId);
    } else if (loginDto.organizationSlug) {
      targetOrg = await this.organizationsService.findBySlug(loginDto.organizationSlug);
      if (!targetOrg) {
        throw new UnauthorizedException(
          `Organization workspace '${loginDto.organizationSlug}' not found`,
        );
      }
    }

    if (targetOrg && targetOrg.status !== OrganizationStatus.ACTIVE) {
      throw new ForbiddenException(
        `Organization workspace '${targetOrg.name}' is currently ${targetOrg.status.toLowerCase()}. Access denied.`,
      );
    }

    let user: User | null = null;

    // 2. Resolve User by Email or Employee Number
    if (loginDto.email) {
      user = await this.usersService.findByEmailWithPassword(
        loginDto.email,
        targetOrg ? targetOrg.id : undefined,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // If user navigated through an organization subdomain, verify tenant match
      if (targetOrg && user.organizationId !== targetOrg.id) {
        throw new UnauthorizedException(
          `User '${loginDto.email}' does not belong to the '${targetOrg.name}' workspace`,
        );
      }
    } else if (loginDto.employeeNumber) {
      // Employee Number login requires organization context from subdomain
      if (!targetOrg) {
        throw new BadRequestException(
          'Employee number login requires accessing via your organization workspace subdomain (e.g. https://company.rooomchi.ir/login) or providing organization slug',
        );
      }

      user = await this.usersService.findByEmployeeNumberAndOrg(
        loginDto.employeeNumber,
        targetOrg.id,
      );

      if (!user) {
        throw new UnauthorizedException(
          'Invalid employee number or credentials for this organization',
        );
      }
    } else {
      throw new BadRequestException(
        'Authentication requires either corporate email or employee number',
      );
    }

    // 3. Ensure User has an Organization (A user without organization is strictly disallowed)
    if (!targetOrg) {
      targetOrg = await this.organizationsService.findOneById(user.organizationId);
      if (!targetOrg) {
        throw new UnauthorizedException('User does not belong to any active organization workspace');
      }
      if (targetOrg.status !== OrganizationStatus.ACTIVE) {
        throw new ForbiddenException(
          `Organization '${targetOrg.name}' is ${targetOrg.status.toLowerCase()}`,
        );
      }
    }

    // 4. Verify Password Hash
    const passwordToCompare = user.passwordHash || user.password;
    const isPasswordValid = await bcrypt.compare(loginDto.password, passwordToCompare);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 5. Verify Account Status
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your user account has been suspended by the organization administrator',
      );
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Your account is inactive. Please contact your administrator');
    }

    // 6. Update lastLoginAt timestamp
    await this.usersService.updateLastLogin(user.id);

    // 7. Generate JWT token with required payload: { userId, organizationId, role }
    const roleName =
      user.roleName ||
      (typeof user.role === 'object' && user.role ? user.role.name : (user.role as any));

    const payload: JwtPayload = {
      userId: user.id,
      organizationId: user.organizationId,
      role: roleName,
      email: user.email,
      employeeNumber: user.employeeNumber,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      token: accessToken,
      tokenType: 'Bearer',
      requiresPasswordChange: user.status === UserStatus.INVITED,
      user: toClientUser(user),
      organization: {
        id: targetOrg.id,
        name: targetOrg.name,
        slug: targetOrg.slug,
        domain: targetOrg.domain,
        logo: targetOrg.logo,
      },
    };
  }

  /**
   * POST /auth/register
   * Org-scoped self-registration for demo / onboarding (not open public SaaS signup).
   */
  async register(registerDto: RegisterDto) {
    const nameParts = registerDto.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'کاربر';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    await this.usersService.registerForOrganization({
      organizationId: registerDto.orgId,
      firstName,
      lastName,
      email: registerDto.email,
      password: registerDto.password,
      requestedRole: this.mapClientRole(registerDto.role),
    });

    return this.login(
      { email: registerDto.email, password: registerDto.password },
      null,
    );
  }

  private mapClientRole(role?: string): RoleEnum | undefined {
    if (!role) return undefined;
    const r = role.toLowerCase();
    if (r === 'super_admin') {
      throw new ForbiddenException('Public registration cannot assign super admin role');
    }
    if (r === 'org_admin' || r === 'organization_admin') {
      return RoleEnum.ORGANIZATION_ADMIN;
    }
    if (r === 'room_manager' || r === 'manager') {
      return RoleEnum.MANAGER;
    }
    return RoleEnum.EMPLOYEE;
  }

  /**
   * POST /auth/change-password
   * Allows employees to change initial temporary passwords securely.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    const currentPasswordHash = user.passwordHash || user.password;
    const isCurrentValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      currentPasswordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, salt);

    await this.usersService.updatePassword(userId, newHashedPassword);

    return {
      message: 'Password successfully updated. You can now use your new password to sign in.',
    };
  }
}
