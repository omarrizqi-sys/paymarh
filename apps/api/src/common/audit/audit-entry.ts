import type { AuditEcart, Uuid } from '@paymarh/shared-types';

/** Description d une action a consigner dans le journal. */
export interface AuditEntry {
  readonly userId: Uuid;
  readonly accountId?: Uuid | null;
  readonly companyId?: Uuid | null;
  readonly action: string;
  readonly targetType: string;
  readonly targetId?: string | null;
  readonly ecart?: AuditEcart | null;
}
