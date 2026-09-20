import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { RoleEnum } from '../../../common/enums/role.enum';
import type { Organization } from '../../organizations/entities/organization.entity';
import type { Role } from '../../roles/entities/role.entity';
import type { Reservation } from '../../reservations/entities/reservation.entity';

@Entity('users')
@Index(['organizationId', 'employeeNumber'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne('Organization', 'users', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  @Column({ type: 'varchar', length: 50 })
  employeeNumber!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  /** @deprecated use `password` — kept for service-layer compatibility */
  get passwordHash(): string {
    return this.password;
  }
  set passwordHash(val: string) {
    this.password = val;
  }

  @Column({
    type: 'varchar',
    length: 20,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'uuid' })
  roleId!: string;

  @ManyToOne('Role', 'users', { eager: true, nullable: false })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  get roleName(): RoleEnum {
    return (this.role?.name as RoleEnum) ?? RoleEnum.EMPLOYEE;
  }

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date | null;

  @OneToMany('Reservation', 'user')
  reservations?: Reservation[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
