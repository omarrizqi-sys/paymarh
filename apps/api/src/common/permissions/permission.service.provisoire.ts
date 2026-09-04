import { Injectable } from '@nestjs/common';
import type { TenantContext } from '@paymarh/shared-types';
import type { PermissionService } from './permission.service.js';
import type { Permission } from './permissions.js';
import { PermissionsRefuseesContext } from './permissions-refusees.context.js';

/**
 * PROVISOIRE — accorde toutes les permissions sauf celles passees en parametre
 * (lues depuis l en-tete de developpement par le middleware). Sera remplace par
 * le moteur de droits du module auth.
 */
@Injectable()
export class PermissionServiceProvisoire implements PermissionService {
  constructor(private readonly permissionsRefusees: PermissionsRefuseesContext) {}

  possedePermission(
    _context: TenantContext,
    permission: Permission,
    permissionsRefusees?: ReadonlySet<string>
  ): boolean {
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    const refusees = permissionsRefusees ?? this.permissionsRefusees.lire();
    return !refusees.has(permission);
  }
}
