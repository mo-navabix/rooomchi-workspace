import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { Organization } from '../../organizations/entities/organization.entity';
import type { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne('Organization', 'rooms', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'int', default: 10 })
  capacity!: number;

  @Column({ type: 'int', default: 1 })
  floor!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  building?: string;

  @Column({ type: 'varchar', length: 30, default: 'AVAILABLE' })
  status!: string;

  @OneToMany('Reservation', 'room')
  reservations?: Reservation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
