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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateOrgAdminDto } from './dto/create-org-admin.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import type { JwtPayload } from '../../config/jwt.config';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * POST /organizations
   * SaaS Requirement: Super Admin onboards an Organization.
   */
  @Post()
  @Roles(RoleEnum.SUPER_ADMIN)
  async create(@Body() createDto: CreateOrganizationDto) {
    const org = await this.organizationsService.create(createDto);
    return {
      message: 'Organization workspace created successfully',
      organization: org,
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
   * Super Admin lists all enterprise workspaces.
   */
  @Get()
  @Roles(RoleEnum.SUPER_ADMIN)
  async findAll() {
    return this.organizationsService.findAll();
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
