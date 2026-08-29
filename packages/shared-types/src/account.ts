import type { Timestamps, Uuid } from './common';

/**
 * Nature du titulaire de l abonnement.
 * - CABINET    : gere la paie de plusieurs societes clientes.
 * - ENTREPRISE : gere la paie de ses propres salaries.
 *
 * Doit rester aligne sur l enum `AccountType` du schema Prisma.
 */
export type AccountType = 'CABINET' | 'ENTREPRISE';

/**
 * Account = le "tenant", c est-a-dire le titulaire de l abonnement PaymaRH.
 *
 * C est le premier niveau d isolation : Account -> Company -> (Salarie, plus
 * tard). Aucune donnee ne doit jamais traverser la frontiere d un Account.
 */
export interface Account extends Timestamps {
  readonly id: Uuid;
  readonly name: string;
  readonly type: AccountType;
}
