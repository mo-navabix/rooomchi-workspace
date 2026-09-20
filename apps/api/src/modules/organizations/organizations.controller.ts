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
  Inject,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { ProvisionOrganizationDto } from './dto/provision-organization.dto';
import {
  toClientOrganization,
  toClientOrganizationFromEntity,
} from './organization-response.util';
import { CreateOrgAdminDto } from './dto/create-org-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../config/jwt.config';

@Controller('organizations')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  }),
)
export class OrganizationsController {
  constructor(
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
  ) {}

  /**
   * POST /organizations
   * Public SaaS onboarding (matches legacy Express provisioning wizard).
   */
  @Public()
  @Post()
  async create(@Body() createDto: ProvisionOrganizationDto) {
    const org = await this.organizationsService.create(createDto);
    const clientOrg = toClientOrganization(org, createDto);
    return {
      message: 'Organization created successfully',
      organization: clientOrg,
      ...clientOrg,
    };
  }

  /**
   * POST /organizations/:id/admin
   * SaaS Requirement: Create initial Organization Administrator.
   * Super Admin provisions the root tenant administrator.
   */
  @Post(':id/admin')
  @Roles(RoleEnum.SUPER_ADMIN)
  async createInitialAdmin(
    @Param('id') organizationId: string,
    @Body() adminDto: CreateOrgAdminDto,
  ) {
    const admin = await this.organizationsService.createInitialAdmin(
      organizationId,
      adminDto,
    );
    return {
      message: 'Initial organization administrator created successfully',
      admin,
    };
  }

  /**
   * GET /organizations
   * Public list for org switcher / landing (matches legacy Express API).
   */
  @Public()
  @Get()
  async findAll() {
    const orgs = await this.organizationsService.findAll();
    return orgs.map((org) => toClientOrganizationFromEntity(org));
  }

  /**
   * GET /organizations/:id
   * Organization details with strict tenant isolation.
   */
  @Get(':id')
  @UseGuards(TenantGuard)
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: JwtPayload) {
    return this.organizationsService.findOne(id, currentUser);
  }

  /**
   * PATCH /organizations/:id
   * Updates organization settings.
   */
  @Patch(':id')
  @UseGuards(TenantGuard)
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const updated = await this.organizationsService.update(id, updateDto, currentUser);
    return {
      message: 'Organization updated successfully',
      organization: updated,
    };
  }
}
