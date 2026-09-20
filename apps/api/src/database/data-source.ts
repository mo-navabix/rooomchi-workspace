import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { getDatabaseSsl, isDatabaseConfigured } from '../../../../src/config/database';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { InitialMultiTenantSchema1700000000000 } from './migrations/1700000000000-InitialMultiTenantSchema';
import { AlignOrganizationSchema1700000000001 } from './migrations/1700000000001-AlignOrganizationSchema';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
  username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'didar_db',
  ssl: getDatabaseSsl(),
  entities: [Organization, User, Role, Room, Reservation],
  migrations: [
    InitialMultiTenantSchema1700000000000,
    AlignOrganizationSchema1700000000001,
  ],
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
  synchronize:
    process.env.TYPEORM_SYNCHRONIZE === 'true' || !isDatabaseConfigured(),
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(dataSourceOptions);
