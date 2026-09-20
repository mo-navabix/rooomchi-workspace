import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationAuthSettings } from './entities/organization-auth-settings.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { ProvisionOrganizationDto } from './dto/provision-organization.dto';
import { CreateOrgAdminDto } from './dto/create-org-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationStatus } from '../../common/enums/organization-status.enum';
import { RoleEnum } from '../../common/enums/role.enum';
import { SsoProvider } from '../../common/enums/sso-provider.enum';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../../config/jwt.config';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationAuthSettings)
    private readonly authSettingsRepository: Repository<OrganizationAuthSettings>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /organizations
   * Super Admin creates a new Organization workspace.
   * Enforces slug uniqueness and initializes SSO architecture settings.
   */
  private slugifyName(name: string): string {
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    return slug.length >= 2 ? slug : `org-${Date.now()}`;
  }

  async create(
    createDto: CreateOrganizationDto | ProvisionOrganizationDto,
  ): Promise<Organization> {
    const normalizedSlug = (
      createDto.slug?.trim() || this.slugifyName(createDto.name)
    ).toLowerCase();

    // 1. Verify slug uniqueness
    const existingSlug = await this.organizationRepository.findOne({
      where: { slug: normalizedSlug },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Organization with subdomain slug '${normalizedSlug}' already exists. Please choose a unique subdomain slug.`,
      );
    }

    // 2. Prepare domain (defaults to [slug].didarhub.ir if not specified)
    const domain = createDto.domain?.trim().toLowerCase() || `${normalizedSlug}.didarhub.ir`;

    // 3. Create organization entity
    const organization = this.organizationRepository.create({
      name: createDto.name.trim(),
      slug: normalizedSlug,
      code: createDto.code?.trim().toUpperCase() || normalizedSlug.toUpperCase(),
      domain,
      logo: createDto.logo?.trim() || null,
      status: createDto.status || OrganizationStatus.ACTIVE,
    });

    const savedOrg = await this.organizationRepository.save(organization);

    // 4. Initialize default SSO architecture record (Future SSO Ready)
    const defaultAuthSettings = this.authSettingsRepository.create({
      organizationId: savedOrg.id,
      provider: SsoProvider.LOCAL,
      enabled: false,
    });
    await this.authSettingsRepository.save(defaultAuthSettings);

    return savedOrg;
  }

  /**
   * POST /organizations/:id/admin
   * Provisions the initial Organization Administrator.
   */
  async createInitialAdmin(organizationId: string, adminDto: CreateOrgAdminDto) {
    const organization = await this.findOneById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with ID '${organizationId}' not found`);
    }

    return this.usersService.createOrganizationAdmin(organizationId, adminDto);
  }

  /**
   * Lists all organizations (Super Admin capability).
   */
  async findAll(): Promise<Organization[]> {
    return this.organizationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves single organization with tenant isolation check.
   */
  async findOne(id: string, currentUser?: JwtPayload): Promise<Organization> {
    if (
      currentUser &&
      currentUser.role !== RoleEnum.SUPER_ADMIN &&
      currentUser.organizationId !== id
    ) {
      throw new ForbiddenException('Cross-tenant violation: Access denied to another organization');
    }

    const org = await this.organizationRepository.findOne({
      where: { id },
      relations: { users: true, rooms: true, authSettings: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }

    return org;
  }

  /**
   * Direct ID lookup for system validations & guards.
   */
  async findOneById(id: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { id },
    });
  }

  /**
   * Slug lookup (for Subdomain Tenant Resolution).
   */
  async findBySlug(slug: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { slug: slug.trim().toLowerCase() },
      relations: { authSettings: true },
    });
  }

  /**
   * Code lookup (compatibility).
   */
  async findByCode(code: string): Promise<Organization | null> {
    return this.organizationRepository.findOne({
      where: { code: code.trim().toUpperCase() },
    });
  }

  /**
   * Updates organization details with tenant isolation check.
   */
  async update(
    id: string,
    updateDto: UpdateOrganizationDto,
    currentUser: JwtPayload,
  ): Promise<Organization> {
    if (
      currentUser.role !== RoleEnum.SUPER_ADMIN &&
      currentUser.organizationId !== id
    ) {
      throw new ForbiddenException('You can only update your own organization settings');
    }

    const org = await this.organizationRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException(`Organization with ID '${id}' not found`);
    }

    if (updateDto.name !== undefined) org.name = updateDto.name.trim();
    if (updateDto.domain !== undefined) org.domain = updateDto.domain.trim().toLowerCase();
    if (updateDto.logo !== undefined) org.logo = updateDto.logo?.trim() || null;
    if (updateDto.status !== undefined) {
      // Only Super Admin can alter organization status
      if (currentUser.role !== RoleEnum.SUPER_ADMIN) {
        throw new ForbiddenException('Only Super Admins can alter organization status');
      }
      org.status = updateDto.status;
    }

    return this.organizationRepository.save(org);
  }
}
