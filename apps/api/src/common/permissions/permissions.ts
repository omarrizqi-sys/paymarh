/**
 * Re-export depuis @paymarh/shared-types — source unique des permissions.
 */
export { PERMISSIONS, type Permission } from '@paymarh/shared-types';

/** Contexte minimal pour une decision de droit. */
export interface ContextePermission {
  /** Societe visee, quand l operation en concerne une. */
  readonly companyId?: string | null;
}
