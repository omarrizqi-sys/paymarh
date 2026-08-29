/**
 * Roles utilisateurs de PaymaRH.
 *
 * Ce type doit rester STRICTEMENT aligne sur l enum `Role` du schema Prisma
 * (apps/api/prisma/schema.prisma). Toute valeur ajoutee ici doit l etre aussi
 * la-bas, et inversement, avec une migration.
 */
export type Role =
  /**
   * Super-admin de la plateforme PaymaRH.
   *
   * HORS HIERARCHIE : ce role n est pas "au-dessus" des comptes clients, il
   * est a cote. Son `accountId` est NUL par construction. Son acces elargi
   * passe par un chemin explicite et journalise (AuditLog), jamais par le
   * filtrage multi-tenant normal.
   */
  | 'PLATFORM_ADMIN'
  /** Administrateur d un compte client (cabinet ou entreprise). */
  | 'ACCOUNT_ADMIN'
  /** Gestionnaire de paie travaillant sur une ou plusieurs societes du compte. */
  | 'MANAGER'
  /**
   * Salarie. Prevu pour le futur portail salarie : AUCUN usage au module 0.
   */
  | 'EMPLOYEE';
