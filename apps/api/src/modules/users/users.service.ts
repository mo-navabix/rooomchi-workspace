import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateOrgAdminDto } from '../organizations/dto/create-org-admin.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import type { JwtPayload } from '../../config/jwt.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Helper to strip sensitive fields like password
   */
  private sanitize(user: User): Omit<User, 'password' | 'passwordHash'> {
    const { password: _p, passwordHash: _ph, ...safeUser } = user;
    return safeUser as Omit<User, 'password' | 'passwordHash'>;
  }

  /**
   * Service-Level Multi-Tenant Isolation Verifier
   */
  private assertTenantAccess(
    targetOrganizationId: string,
    currentUser: JwtPayload,
    actionDescription = 'perform this operation',
  ): void {
    if (currentUser.role === RoleEnum.SUPER_ADMIN) {
      return; // Super Admin has platform-wide oversight
    }

    if (currentUser.organizationId !== targetOrganizationId) {
      throw new ForbiddenException(
        `Cross-tenant isolation violation: You do not have permission to ${actionDescription} for organization '${targetOrganizationId}'`,
      );
    }
  }

  /**
   * Provisions the initial Organization Administrator.
   */
  async createOrganizationAdmin(
    organizationId: string,
    adminDto: CreateOrgAdminDto,
  ): Promise<Omit<User, 'password' | 'passwordHash'>> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID '${organizationId}' not found`);
    }

    const normalizedEmail = adminDto.email.trim().toLowerCase();
    const existingEmail = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `A user with email '${normalizedEmail}' already exists in the platform`,
      );
    }

    const employeeNumber = adminDto.employeeNumber?.trim() || 'ADM-001';

    let role = await this.roleRepository.findOne({
      where: { name: RoleEnum.ORGANIZATION_ADMIN },
    });
    if (!role) {
      role = await this.roleRepository.save(
        this.roleRepository.create({
          name: RoleEnum.ORGANIZATION_ADMIN,
          description: 'Organization Administrator with full tenant management rights',
        }),
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminDto.password, salt);

    const admin = this.userRepository.create({
      organizationId,
      employeeNumber,
      firstName: adminDto.firstName.trim(),
      lastName: adminDto.lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      roleId: role.id,
      role,
      roleName: RoleEnum.ORGANIZATION_ADMIN,
      status: UserStatus.ACTIVE,
    });

    const saved = await this.userRepository.save(admin);
    return this.sanitize(saved);
  }

  /**
   * POST /organizations/:id/users
   * Organization Admin creates an employee for their organization.
   */
  async createEmployee(
    organizationId: string,
    createDto: CreateUserDto,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password' | 'passwordHash'>> {
    // 1. Enforce tenant isolation at service level
    this.assertTenantAccess(organizationId, currentUser, 'create employee');

    // 2. Validate target organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID '${organizationId}' not found`);
    }

    // 3. Check email uniqueness across platform
    const normalizedEmail = createDto.email.trim().toLowerCase();
    const existingEmail = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new ConflictException(
        `User with email '${normalizedEmail}' is already registered in the system`,
      );
    }

    // 4. Check composite uniqueness: employeeNumber must be unique within this organization
    const normalizedEmployeeNumber = createDto.employeeNumber.trim();
    const existingEmployeeNumber = await this.userRepository.findOne({
      where: {
        organizationId,
        employeeNumber: normalizedEmployeeNumber,
      },
    });
    if (existingEmployeeNumber) {
      throw new ConflictException(
        `Employee number '${normalizedEmployeeNumber}' is already in use within this organization`,
      );
    }

    // 5. Resolve role (default: EMPLOYEE)
    const targetRoleName = createDto.role || RoleEnum.EMPLOYEE;

    // Security check: Only SUPER_ADMIN can create another SUPER_ADMIN
    if (
      targetRoleName === RoleEnum.SUPER_ADMIN &&
      currentUser.role !== RoleEnum.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Super Admins can assign the SUPER_ADMIN role');
    }

    let role = await this.roleRepository.findOne({ where: { name: targetRoleName } });
    if (!role) {
      role = await this.roleRepository.save(
        this.roleRepository.create({
          name: targetRoleName,
          description: `${targetRoleName} role`,
        }),
      );
    }

    // 6. Hash password
    const rawPassword = createDto.password || 'DidarTemp@2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // 7. Save user entity strictly linked to organization
    const newUser = this.userRepository.create({
      organizationId,
      employeeNumber: normalizedEmployeeNumber,
      firstName: createDto.firstName.trim(),
      lastName: createDto.lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      status: createDto.status || UserStatus.ACTIVE,
      roleId: role.id,
      role,
      roleName: targetRoleName,
    });

    const saved = await this.userRepository.save(newUser);
    return this.sanitize(saved);
  }

  /**
   * POST /organizations/:id/users/invite
   * Organization Admin invites an employee (status: INVITED).
   */
  async inviteEmployee(
    organizationId: string,
    inviteDto: InviteUserDto,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password' | 'passwordHash'>> {
    this.assertTenantAccess(organizationId, currentUser, 'invite employee');

    return this.createEmployee(
      organizationId,
      {
        ...inviteDto,
        status: UserStatus.INVITED,
        password: `Invited@${Math.random().toString(36).slice(-8)}!`,
      },
      currentUser,
    );
  }

  /**
   * GET /organizations/:id/users
   * Lists employees strictly scoped by organizationId.
   */
  async listEmployees(
    organizationId: string,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password' | 'passwordHash'>[]> {
    this.assertTenantAccess(organizationId, currentUser, 'list employees');

    const users = await this.userRepository.find({
      where: { organizationId },
      relations: { role: true },
      order: { createdAt: 'DESC' },
    });

    return users.map((u) => this.sanitize(u));
  }

  /**
   * PATCH /users/:id/status
   * Enables or disables an employee with cross-tenant check.
   */
  async updateStatus(
    userId: string,
    updateStatusDto: UpdateUserStatusDto,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password' | 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    this.assertTenantAccess(user.organizationId, currentUser, 'change status of this employee');

    if (user.id === currentUser.userId && updateStatusDto.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot suspend or deactivate your own account');
    }

    user.status = updateStatusDto.status;
    const updated = await this.userRepository.save(user);
    return this.sanitize(updated);
  }

  /**
   * PATCH /users/:id/role
   * Assigns role to an employee with cross-tenant check.
   */
  async assignRole(
    userId: string,
    assignRoleDto: AssignRoleDto,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password' | 'passwordHash'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    this.assertTenantAccess(user.organizationId, currentUser, 'assign role to this employee');

    if (
      assignRoleDto.role === RoleEnum.SUPER_ADMIN &&
      currentUser.role !== RoleEnum.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only Super Admins can grant the SUPER_ADMIN role');
    }

    const role = await this.roleRepository.findOne({
      where: { name: assignRoleDto.role },
    });
    if (!role) {
      throw new NotFoundException(`Role '${assignRoleDto.role}' not found`);
    }

    user.roleId = role.id;
    user.role = role;
    user.roleName = assignRoleDto.role;

    const updated = await this.userRepository.save(user);
    return this.sanitize(updated);
  }

  /**
   * Lookup by ID (for Auth / Guards).
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true, organization: true },
    });
  }

  /**
   * Lookup by email with passwordHash (for authentication).
   */
  async findByEmailWithPassword(email: string, organizationId?: string): Promise<User | null> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() });

    if (organizationId) {
      query.andWhere('user.organizationId = :organizationId', { organizationId });
    }

    return query.getOne();
  }

  /**
   * Lookup by employeeNumber and organizationId with passwordHash.
   */
  async findByEmployeeNumberAndOrg(
    employeeNumber: string,
    organizationId: string,
  ): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.employeeNumber = :employeeNumber', { employeeNumber: employeeNumber.trim() })
      .andWhere('user.organizationId = :organizationId', { organizationId })
      .getOne();
  }

  /**
   * Lookup user by ID with password (for password change).
   */
  async findByIdWithPassword(userId: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  /**
   * Updates user's password.
   */
  async updatePassword(userId: string, newHashedPassword: string): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      {
        passwordHash: newHashedPassword,
        status: UserStatus.ACTIVE,
      },
    );
  }

  /**
   * Updates lastLoginAt timestamp.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { lastLoginAt: new Date() });
  }

  /**
   * Counts users.
   */
  async count(organizationId?: string): Promise<number> {
    if (organizationId) {
      return this.userRepository.count({ where: { organizationId } });
    }
    return this.userRepository.count();
  }
}
