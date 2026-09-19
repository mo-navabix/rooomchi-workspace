import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../modules/organizations/entities/organization.entity';
import { TenantResolverService } from './tenant-resolver.service';
import { TenantResolverMiddleware } from './tenant-resolver.middleware';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [TenantResolverService, TenantResolverMiddleware],
  exports: [TenantResolverService, TenantResolverMiddleware],
})
export class TenantModule {}
