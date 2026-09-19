import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { InitialMultiTenantSchema1700000000000 } from './migrations/1700000000000-InitialMultiTenantSchema';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'didar_db',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Organization, User, Role, Room, Reservation],
  migrations: [InitialMultiTenantSchema1700000000000],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true' || false,
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(dataSourceOptions);
