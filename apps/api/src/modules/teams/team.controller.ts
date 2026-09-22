import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMembersDto } from './dto/add-team-members.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import type { JwtPayload } from '../../config/jwt.config';

@Controller('teams')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER)
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.teamService.createTeam(dto, currentUser);
  }

  @Get()
  async findAll(
    @Query('orgId') queryOrgId: string | undefined,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const orgId = queryOrgId || currentUser?.organizationId;
    return this.teamService.getTeams(orgId, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.teamService.getTeamById(id, currentUser);
  }

  @Patch(':id')
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.teamService.updateTeam(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    await this.teamService.deleteTeam(id, currentUser);
    return { success: true, message: 'تیم با موفقیت حذف شد' };
  }

  @Post(':id/members')
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER)
  async addMembers(
    @Param('id') id: string,
    @Body() dto: AddTeamMembersDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.teamService.addMembers(id, dto, currentUser);
  }

  @Delete(':id/members/:userId')
  @Roles(RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.teamService.removeMember(id, userId, currentUser);
  }
}
