import type { IsoDateTime, Uuid } from './common';

/**
 * Entree du journal d audit.
 *
 * La tracabilite est un principe fondateur : toute action sensible, et en
 * particulier tout acces elargi d un PLATFORM_ADMIN, laisse une trace.
 * Au module 0 la table existe mais n est pas encore alimentee par les
 * fonctionnalites (elles n existent pas).
 */
export interface AuditLog {
  readonly id: Uuid;
  readonly userId: Uuid;
  readonly accountId: Uuid | null;
  readonly companyId: Uuid | null;

  /** Verbe de l action, en majuscules (ex. "READ_ACROSS_ACCOUNTS"). */
  readonly action: string;

  /** Type de la ressource visee (ex. "Company"). */
  readonly targetType: string;

  /** Identifiant de la ressource visee, ou null si l action est globale. */
  readonly targetId: string | null;

  /** Ecart avant/apres : champs modifies avec ancienne et nouvelle valeur. */
  readonly ecart: AuditEcart | null;

  readonly createdAt: IsoDateTime;
}

/** Ecart journalise entre l etat avant et apres une ecriture. */
export interface AuditEcart {
  readonly champs: readonly AuditChampModifie[];
}

export interface AuditChampModifie {
  readonly nom: string;
  readonly ancienne: unknown;
  readonly nouvelle: unknown;
}
