import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';

@Injectable()
export class TeamRepository {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepo: Repository<TeamMember>,
  ) {}

  async findByOrganization(organizationId: string): Promise<Team[]> {
    return this.teamRepo.find({
      where: { organizationId },
      relations: {
        members: {
          user: true,
        },
        creator: true,
      },
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(id: string, organizationId?: string): Promise<Team | null> {
    const where: any = { id };
    if (organizationId) {
      where.organizationId = organizationId;
    }
    return this.teamRepo.findOne({
      where,
      relations: {
        members: {
          user: true,
        },
        creator: true,
        organization: true,
      },
    });
  }

  async create(data: Partial<Team>): Promise<Team> {
    const team = this.teamRepo.create(data);
    return this.teamRepo.save(team);
  }

  async update(id: string, data: Partial<Team>): Promise<Team> {
    await this.teamRepo.update(id, { ...data, updatedAt: new Date() });
    const updated = await this.findById(id);
    if (!updated) throw new Error('Team not found');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.teamMemberRepo.delete({ teamId: id });
    await this.teamRepo.delete(id);
  }

  async addMember(teamId: string, userId: string): Promise<TeamMember> {
    const existing = await this.teamMemberRepo.findOne({
      where: { teamId, userId },
    });
    if (existing) return existing;

    const member = this.teamMemberRepo.create({ teamId, userId });
    return this.teamMemberRepo.save(member);
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.teamMemberRepo.delete({ teamId, userId });
  }

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.teamMemberRepo.find({
      where: { teamId },
      relations: {
        user: true,
      },
    });
  }
}
