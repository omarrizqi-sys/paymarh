import { ForbiddenException } from '@nestjs/common';
import type { PermissionService } from '../permissions/permission.service.js';
import type { TenantContextService } from '../tenancy/tenant-context.service.js';

const MESSAGE_INTERDIT = 'Action non autorisée.';

/**
 * Point de controle unique pour toute ecriture de remuneration salarie.
 * Voyage avec la donnee : tout appelant passant par le service la rencontre.
 */
export function assertEcritureRemunerationSalarie(
  tenantContext: TenantContextService,
  permissions: PermissionService
): void {
  const ctx = tenantContext.getOrThrow();
  if (!permissions.possedePermission(ctx, 'salarie.remuneration.ecrire')) {
    throw new ForbiddenException(MESSAGE_INTERDIT);
  }
}
