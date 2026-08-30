import type { Permission } from '@paymarh/shared-types';

export function possedePermission(
  operations: readonly Permission[],
  permission: Permission
): boolean {
  return operations.includes(permission);
}
