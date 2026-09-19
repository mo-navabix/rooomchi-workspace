import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantResolverMiddleware } from './common/tenant/tenant-resolver.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    TenantModule,
    OrganizationsModule,
    UsersModule,
    RolesModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
