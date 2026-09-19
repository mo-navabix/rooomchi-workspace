import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RoleEnum } from '../../../common/enums/role.enum';
import type { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    enum: RoleEnum,
  })
  name!: RoleEnum;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @OneToMany('User', 'role')
  users?: User[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
