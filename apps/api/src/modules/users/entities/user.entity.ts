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

  /**
   * Multi-Tenant Foreign Key:
   * A user without an organization is strictly disallowed.
   */
  @Index()
  @Column({ type: 'uuid', name: 'organization_id', nullable: false })
  organizationId!: string;

  @ManyToOne('Organization', 'users', { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({ type: 'varchar', length: 50, name: 'employee_number' })
  employeeNumber!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash', select: false })
  passwordHash!: string;

  /**
   * Compatibility accessor for password
   */
  get password(): string {
    return this.passwordHash;
  }
  set password(val: string) {
    this.passwordHash = val;
  }

  @Column({
    type: 'varchar',
    length: 20,
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'uuid', name: 'role_id', nullable: true })
  roleId?: string;

  @ManyToOne('Role', 'users', { eager: true, nullable: true })
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @Column({
    type: 'varchar',
    length: 32,
    enum: RoleEnum,
    default: RoleEnum.EMPLOYEE,
    name: 'role_name',
  })
  roleName!: RoleEnum;

  @Column({ type: 'timestamp with time zone', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date | null;

  @OneToMany('Reservation', 'user')
  reservations?: Reservation[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
