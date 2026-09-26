import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { getDatabaseSsl, isDatabaseConfigured } from '../../../../src/config/database';
import { Organization } from '../modules/organizations/entities/organization.entity';
import { OrganizationAuthSettings } from '../modules/organizations/entities/organization-auth-settings.entity';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Room } from '../modules/rooms/entities/room.entity';
import { Reservation } from '../modules/reservations/entities/reservation.entity';
import { Team } from '../modules/teams/entities/team.entity';
import { TeamMember } from '../modules/teams/entities/team-member.entity';
import { InitialMultiTenantSchema1700000000000 } from '../database/migrations/1700000000000-InitialMultiTenantSchema';
import { AlignOrganizationSchema1700000000001 } from '../database/migrations/1700000000001-AlignOrganizationSchema';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => {
  const isPostgresConfigured = isDatabaseConfigured();

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.DATABASE_USER || process.env.DB_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || process.env.DB_DATABASE || 'rooomchi_enterprise_db',
    url: process.env.DATABASE_URL,
    ssl: getDatabaseSsl(),
    entities: [
      Organization,
      OrganizationAuthSettings,
      User,
      Role,
      Room,
      Reservation,
      Team,
      TeamMember,
    ],
    migrations: [
      InitialMultiTenantSchema1700000000000,
      AlignOrganizationSchema1700000000001,
    ],
    migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === 'true',
    synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true' || !isPostgresConfigured,
    autoLoadEntities: true,
    logging: process.env.NODE_ENV === 'development',
    retryAttempts: 2,
    retryDelay: 1000,
  };
};
