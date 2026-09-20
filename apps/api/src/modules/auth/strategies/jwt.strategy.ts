import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig, JwtPayload } from '../../../config/jwt.config';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { OrganizationStatus } from '../../../common/enums/organization-status.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  /**
   * Validates every protected incoming request:
   * 1. User exists in database and is not suspended/inactive
   * 2. Organization exists in database and is active
   * 3. User strictly belongs to the claimed organization
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.userId || !payload.organizationId || !payload.role) {
      throw new UnauthorizedException('Invalid token claims structure');
    }

    // 1. Validate user exists
    const user = await this.usersService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account has been suspended by the organization administrator');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is inactive');
    }

    // 2. Validate organization exists
    const organization = await this.organizationsService.findOneById(payload.organizationId);
    if (!organization) {
      throw new UnauthorizedException('Organization workspace not found');
    }

    if (organization.status !== OrganizationStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Organization '${organization.name}' is currently ${organization.status.toLowerCase()}`,
      );
    }

    // 3. Validate user belongs to organization
    if (user.organizationId !== payload.organizationId) {
      throw new UnauthorizedException('Cross-tenant violation: User does not belong to this organization');
    }

    return {
      userId: user.id,
      organizationId: user.organizationId,
      role: payload.role,
      email: user.email,
      employeeNumber: user.employeeNumber,
    };
  }
}
