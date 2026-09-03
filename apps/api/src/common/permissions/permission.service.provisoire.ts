import { Injectable } from '@nestjs/common';
import type { TenantContext } from '@paymarh/shared-types';
import type { PermissionService } from './permission.service.js';
import type { Permission } from './permissions.js';

/**
 * PROVISOIRE — accorde toutes les permissions sauf celles passees en parametre
 * (lues depuis l en-tete de developpement par le garde). Sera remplace par
 * le moteur de droits du module auth.
 */
@Injectable()
export class PermissionServiceProvisoire implements PermissionService {
  possedePermission(
    _context: TenantContext,
    permission: Permission,
    permissionsRefusees: ReadonlySet<string> = new Set()
  ): boolean {
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    return !permissionsRefusees.has(permission);
  }
}
