import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SsoProvider } from '../../../common/enums/sso-provider.enum';
import type { Organization } from './organization.entity';

@Entity('organization_auth_settings')
export class OrganizationAuthSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid', name: 'organization_id', unique: true })
  organizationId!: string;

  @OneToOne('Organization', 'authSettings', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @Column({
    type: 'varchar',
    length: 50,
    enum: SsoProvider,
    default: SsoProvider.LOCAL,
  })
  provider!: SsoProvider;

  @Column({ type: 'boolean', default: false })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'client_id' })
  clientId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'client_secret', select: false })
  clientSecret?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'issuer_url' })
  issuerUrl?: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
