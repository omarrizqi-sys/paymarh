import type { Uuid } from './common';
import type { Role } from './role';

/**
 * Contexte multi-tenant attache a CHAQUE requete entrante de l API.
 *
 * C est l objet qui repond a la question : "au nom de qui, et dans quel
 * perimetre, cette requete est-elle executee ?". Tout acces aux donnees doit
 * en decouler (voir apps/api/src/common/tenancy/).
 */
export interface TenantContext {
  /** Utilisateur a l origine de la requete. */
  readonly userId: Uuid;

  /** Son role. */
  readonly role: Role;

  /**
   * Compte auquel il appartient. NUL uniquement pour un PLATFORM_ADMIN.
   * Pour tous les autres roles, c est le premier filtre applique en base.
   */
  readonly accountId: Uuid | null;

  /**
   * Societe active, quand la requete cible une societe precise. C est le
   * second filtre. Nul lorsque la requete porte sur l ensemble du compte
   * (ex. lister les societes du compte).
   */
  readonly companyId: Uuid | null;
}

/**
 * Motif d un acces elargi du super-admin plateforme.
 *
 * L acces d un PLATFORM_ADMIN aux donnees d un compte client est une
 * EXCEPTION documentee au filtrage normal : il doit toujours etre motive et
 * journalise dans AuditLog. Ce type oblige l appelant a expliciter son
 * intention plutot que de contourner silencieusement l isolation.
 */
export interface PlatformAccessReason {
  /** Motif lisible par un humain, consigne tel quel dans le journal. */
  readonly reason: string;

  /** Compte cible de l acces elargi. */
  readonly accountId: Uuid;
}
