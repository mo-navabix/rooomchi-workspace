import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamRepository } from './team.repository';
import { Team } from './entities/team.entity';
import { User } from '../users/entities/user.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMembersDto } from './dto/add-team-members.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import type { JwtPayload } from '../../config/jwt.config';

@Injectable()
export class TeamService {
  constructor(
    private readonly teamRepository: TeamRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private assertTenantAccess(
    targetOrganizationId: string,
    currentUser: JwtPayload,
    action = 'دسترسی به اطلاعات این تیم',
  ): void {
    if (currentUser.role === RoleEnum.SUPER_ADMIN) {
      return;
    }
    if (currentUser.organizationId !== targetOrganizationId) {
      throw new ForbiddenException(`عدم دسترسی: ${action} در سازمان دیگر مجاز نمی‌باشد`);
    }
  }

  private assertManagePermission(currentUser: JwtPayload, action = 'مدیریت تیم‌ها'): void {
    const allowed = [RoleEnum.SUPER_ADMIN, RoleEnum.ORGANIZATION_ADMIN, RoleEnum.MANAGER];
    if (!allowed.includes(currentUser.role as RoleEnum)) {
      throw new ForbiddenException(`عدم دسترسی: نقش ${currentUser.role} مجوز ${action} را ندارد`);
    }
  }

  async getTeams(organizationId: string, currentUser: JwtPayload): Promise<Team[]> {
    this.assertTenantAccess(organizationId, currentUser, 'مشاهده تیم‌ها');
    return this.teamRepository.findByOrganization(organizationId);
  }

  async getTeamById(id: string, currentUser: JwtPayload): Promise<Team> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('تیم مورد نظر یافت نشد');
    }
    this.assertTenantAccess(team.organizationId, currentUser, 'مشاهده جزئیات تیم');
    return team;
  }

  async createTeam(dto: CreateTeamDto, currentUser: JwtPayload): Promise<Team> {
    this.assertManagePermission(currentUser, 'ایجاد تیم');

    const orgId = dto.organizationId || currentUser.organizationId;
    this.assertTenantAccess(orgId, currentUser, 'ایجاد تیم');

    // Verify all requested members belong to the same organization
    if (dto.memberIds && dto.memberIds.length > 0) {
      for (const uid of dto.memberIds) {
        const user = await this.userRepository.findOne({ where: { id: uid } });
        if (!user) {
          throw new BadRequestException(`کاربر با شناسه ${uid} یافت نشد`);
        }
        if (user.organizationId !== orgId) {
          throw new BadRequestException(
            `کاربر ${user.firstName} ${user.lastName} عضو سازمان این تیم نمی‌باشد`,
          );
        }
      }
    }

    const created = await this.teamRepository.create({
      organizationId: orgId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      createdBy: currentUser.userId,
    });

    if (dto.memberIds && dto.memberIds.length > 0) {
      for (const uid of dto.memberIds) {
        await this.teamRepository.addMember(created.id, uid);
      }
    }

    return (await this.teamRepository.findById(created.id)) || created;
  }

  async updateTeam(id: string, dto: UpdateTeamDto, currentUser: JwtPayload): Promise<Team> {
    this.assertManagePermission(currentUser, 'ویرایش تیم');

    const existing = await this.teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('تیم مورد نظر یافت نشد');
    }
    this.assertTenantAccess(existing.organizationId, currentUser, 'ویرایش تیم');

    return this.teamRepository.update(id, {
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
    });
  }

  async deleteTeam(id: string, currentUser: JwtPayload): Promise<void> {
    this.assertManagePermission(currentUser, 'حذف تیم');

    const existing = await this.teamRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('تیم مورد نظر یافت نشد');
    }
    this.assertTenantAccess(existing.organizationId, currentUser, 'حذف تیم');

    await this.teamRepository.delete(id);
  }

  async addMembers(id: string, dto: AddTeamMembersDto, currentUser: JwtPayload): Promise<Team> {
    this.assertManagePermission(currentUser, 'افزودن عضو به تیم');

    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('تیم مورد نظر یافت نشد');
    }
    this.assertTenantAccess(team.organizationId, currentUser, 'تغییر اعضای تیم');

    // Verify all users belong to the same organization
    for (const uid of dto.userIds) {
      const user = await this.userRepository.findOne({ where: { id: uid } });
      if (!user) {
        throw new BadRequestException(`کاربر با شناسه ${uid} یافت نشد`);
      }
      if (user.organizationId !== team.organizationId) {
        throw new BadRequestException(
          `کاربر ${user.firstName} ${user.lastName} متعلق به این سازمان نمی‌باشد`,
        );
      }
      await this.teamRepository.addMember(id, uid);
    }

    return (await this.teamRepository.findById(id)) || team;
  }

  async removeMember(id: string, userId: string, currentUser: JwtPayload): Promise<Team> {
    this.assertManagePermission(currentUser, 'حذف عضو از تیم');

    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('تیم مورد نظر یافت نشد');
    }
    this.assertTenantAccess(team.organizationId, currentUser, 'حذف عضو از تیم');

    await this.teamRepository.removeMember(id, userId);
    return (await this.teamRepository.findById(id)) || team;
  }
}
