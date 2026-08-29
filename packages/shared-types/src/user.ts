import type { Timestamps, Uuid } from './common';
import type { Role } from './role';

/**
 * User = un utilisateur du logiciel.
 *
 * `accountId` est NULLABLE, et c est volontaire : le super-admin plateforme
 * (role PLATFORM_ADMIN) n appartient a aucun compte client. Pour tous les
 * autres roles, `accountId` est obligatoirement renseigne.
 */
export interface User extends Timestamps {
  readonly id: Uuid;
  readonly email: string;
  readonly accountId: Uuid | null;
  readonly role: Role;
}
