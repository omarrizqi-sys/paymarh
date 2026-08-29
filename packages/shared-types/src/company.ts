import type { Timestamps, Uuid } from './common';

/**
 * Company = la societe dont on produira la paie.
 *
 * Deuxieme niveau d isolation. Toute Company appartient obligatoirement a un
 * Account : `accountId` n est jamais nul.
 */
export interface Company extends Timestamps {
  readonly id: Uuid;
  readonly accountId: Uuid;
  readonly name: string;
}
