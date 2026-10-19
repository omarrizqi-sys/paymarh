import type { Permission } from '@paymarh/shared-types';

export function possedePermission(
  operations: readonly Permission[],
  permission: Permission
): boolean {
  return operations.includes(permission);
}

/** Les routes rémunération, primes et avantages exigent aussi `emploi.modifier` côté serveur. */
export function peutEcrireRemunerationEmploi(operations: readonly Permission[]): boolean {
  return (
    possedePermission(operations, 'salarie.remuneration.ecrire') &&
    possedePermission(operations, 'emploi.modifier')
  );
}
