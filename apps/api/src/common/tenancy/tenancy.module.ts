import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service.js';
import { TenantGuard } from './tenant.guard.js';

/**
 * Expose le contexte multi-tenant et sa garde a toute l application.
 *
 * Global, comme PrismaModule : l isolation n est pas une option qu un module
 * choisit d importer, c est une propriete de l application entiere.
 */
@Global()
@Module({
  providers: [TenantContextService, TenantGuard],
  exports: [TenantContextService, TenantGuard],
})
export class TenancyModule {}
