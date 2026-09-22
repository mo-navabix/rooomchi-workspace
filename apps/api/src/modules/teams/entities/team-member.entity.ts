import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import type { Team } from './team.entity';
import type { User } from '../../users/entities/user.entity';

@Entity('team_members')
@Unique('uq_team_user', ['teamId', 'userId'])
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 64, name: 'team_id' })
  teamId!: string;

  @ManyToOne('Team', 'members', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'team_id' })
  team?: Team;

  @Index()
  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId!: string;

  @ManyToOne('User', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;
}
