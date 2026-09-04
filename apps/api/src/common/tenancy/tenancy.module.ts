import { Global, Module } from '@nestjs/common';
import { PermissionsRefuseesContext } from '../permissions/permissions-refusees.context.js';
import { TenantContextMiddleware } from './tenant-context.middleware.js';
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
  providers: [
    TenantContextService,
    TenantGuard,
    TenantContextMiddleware,
    PermissionsRefuseesContext,
  ],
  exports: [TenantContextService, TenantGuard, TenantContextMiddleware, PermissionsRefuseesContext],
})
export class TenancyModule {}
