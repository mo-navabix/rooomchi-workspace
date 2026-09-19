import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationAuthSettings } from '../modules/organizations/entities/organization-auth-settings.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { InitialMultiTenantSchema1700000000000 } from '../database/migrations/1700000000000-InitialMultiTenantSchema';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const isPostgresConfigured = !!process.env.DATABASE_URL || !!process.env.DATABASE_HOST;

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'didar_enterprise_db',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [Organization, OrganizationAuthSettings, User, Role, Room, Reservation],
    migrations: [InitialMultiTenantSchema1700000000000],
    migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true' || !isPostgresConfigured,
    autoLoadEntities: true,
    logging: process.env.NODE_ENV === 'development',
    retryAttempts: 2,
    retryDelay: 1000,
  };
};
