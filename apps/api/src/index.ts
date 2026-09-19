// Export NestJS Core & AppModule
export * from './app.module';
export * from './main';

// Common Enums
export * from './common/enums/role.enum';
export * from './common/enums/user-status.enum';
export * from './common/enums/organization-status.enum';

// Decorators
export * from './common/decorators/roles.decorator';
export * from './common/decorators/public.decorator';
export * from './common/decorators/current-user.decorator';
export * from './common/decorators/current-tenant.decorator';

// Guards
export * from './common/guards/jwt-auth.guard';
export * from './common/guards/roles.guard';
export * from './common/guards/tenant.guard';

// Filters
export * from './common/filters/http-exception.filter';

// Config
export * from './config/jwt.config';
export * from './config/typeorm.config';

// Database & Migrations
export * from './database/data-source';
export * from './database/migrations/1700000000000-InitialMultiTenantSchema';

// Entities
export * from './modules/organizations/entities/organization.entity';
export * from './modules/users/entities/user.entity';
export * from './modules/roles/entities/role.entity';
export * from './modules/rooms/entities/room.entity';
export * from './modules/reservations/entities/reservation.entity';

// Organizations Module
export * from './modules/organizations/dto/create-organization.dto';
export * from './modules/organizations/dto/update-organization.dto';
export * from './modules/organizations/organizations.service';
export * from './modules/organizations/organizations.controller';
export * from './modules/organizations/organizations.module';

// Users Module
export * from './modules/users/dto/create-user.dto';
export * from './modules/users/dto/invite-user.dto';
export * from './modules/users/dto/update-user-status.dto';
export * from './modules/users/dto/assign-role.dto';
export * from './modules/users/users.service';
export * from './modules/users/users.controller';
export * from './modules/users/users.module';

// Roles Module
export * from './modules/roles/roles.service';
export * from './modules/roles/roles.module';

// Auth Module
export * from './modules/auth/dto/login.dto';
export * from './modules/auth/dto/change-password.dto';
export * from './modules/auth/strategies/jwt.strategy';
export * from './modules/auth/auth.service';
export * from './modules/auth/auth.controller';
export * from './modules/auth/auth.module';
