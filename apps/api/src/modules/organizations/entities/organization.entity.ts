import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { OrganizationStatus } from '../../../common/enums/organization-status.enum';
import type { User } from '../../users/entities/user.entity';
import type { Room } from '../../rooms/entities/room.entity';
import type { Reservation } from '../../reservations/entities/reservation.entity';
import type { OrganizationAuthSettings } from './organization-auth-settings.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo?: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status!: OrganizationStatus;

  @OneToOne('OrganizationAuthSettings', 'organization', { cascade: true })
  authSettings?: OrganizationAuthSettings;

  @OneToMany('User', 'organization')
  users?: User[];

  @OneToMany('Room', 'organization')
  rooms?: Room[];

  @OneToMany('Reservation', 'organization')
  reservations?: Reservation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
