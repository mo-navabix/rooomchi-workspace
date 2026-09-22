import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { User } from '../users/entities/user.entity';
import { TeamRepository } from './team.repository';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Team, TeamMember, User])],
  controllers: [TeamController],
  providers: [TeamRepository, TeamService],
  exports: [TeamService, TeamRepository],
})
export class TeamModule {}
