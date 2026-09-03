import type { TenantContext } from '@paymarh/shared-types';
import type { Permission } from './permissions.js';

/**
 * Port de decision des droits — sera branche au module d authentification.
 * Seul le garde de permissions consomme cette interface.
 */
export interface PermissionService {
  possedePermission(
    context: TenantContext,
    permission: Permission,
    permissionsRefusees?: ReadonlySet<string>
  ): boolean;
}

export const PERMISSION_SERVICE = Symbol('PERMISSION_SERVICE');
