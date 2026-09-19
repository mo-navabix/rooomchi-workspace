import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Organization } from '../../organizations/entities/organization.entity';
import type { User } from '../../users/entities/user.entity';
import type { Room } from '../../rooms/entities/room.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne('Organization', 'reservations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne('User', 'reservations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid' })
  roomId!: string;

  @ManyToOne('Room', 'reservations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room?: Room;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  @Column({ type: 'timestamp with time zone' })
  endTime!: Date;

  @Column({ type: 'varchar', length: 30, default: 'CONFIRMED' })
  status!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
