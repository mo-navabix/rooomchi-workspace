import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantResolverMiddleware } from './tenant-resolver.middleware';
import { TenantGuard } from '../guards/tenant.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [TenantResolverService, TenantResolverMiddleware, TenantGuard],
  exports: [TenantResolverService, TenantResolverMiddleware, TenantGuard],
})
export class TenantModule {}
