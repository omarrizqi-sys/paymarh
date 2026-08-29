/**
 * Point d entree unique du package @paymarh/shared-types.
 *
 * REGLE D OR : un type metier se definit UNE SEULE FOIS ici. Ni l API ni le
 * back-office ne redeclarent la forme d un Account, d une Company ou d un
 * User. Voir README.md.
 */
export type { Uuid, IsoDateTime, Timestamps, ListResponse } from './common';
export type { Role } from './role';
export type { Account, AccountType } from './account';
export type { Company } from './company';
export type { User } from './user';
export type { TenantContext, PlatformAccessReason } from './tenancy';
export type { AuditLog } from './audit';
export type { HealthResponse } from './health';
