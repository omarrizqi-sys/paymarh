import { ForbiddenException } from '@nestjs/common';
import type { PlatformAccessReason, TenantContext, Uuid } from '@paymarh/shared-types';

// ---------------------------------------------------------------------------
// PATRON DE FILTRAGE MULTI-TENANT (double isolation)
//
// Hierarchie : Account -> Company -> (Salarie, plus tard).
//
// Ce fichier est le COEUR de l isolation. Il ne contient QUE des fonctions
// pures : pas d acces base, pas d etat, pas de dependance NestJS autre que le
// type d exception. C est ce qui le rend integralement testable, et c est
// pourquoi tout acces aux donnees doit passer par lui.
//
// REGLE ABSOLUE : aucun `findMany`, `findFirst`, `update` ou `delete` du
// projet ne doit construire son `where` a la main. Il part TOUJOURS de l une
// des fonctions ci-dessous.
// ---------------------------------------------------------------------------

/**
 * Renvoie l identifiant du compte du contexte courant.
 *
 * Leve une erreur pour un PLATFORM_ADMIN : le super-admin n appartient a
 * aucun compte, il ne peut donc PAS emprunter le chemin de filtrage normal.
 * Son acces elargi passe par `crossAccountScope`, explicite et journalise.
 * C est la traduction en code du principe "super-admin hors hierarchie".
 */
export function requireAccountId(context: TenantContext): Uuid {
  if (context.accountId === null) {
    throw new ForbiddenException(
      "Cette requete exige un compte de rattachement. Un PLATFORM_ADMIN doit utiliser le chemin d'acces elargi, explicite et journalise."
    );
  }

  return context.accountId;
}

/**
 * Renvoie l identifiant de la societe active du contexte courant.
 * Leve une erreur si la requete ne designe aucune societe.
 */
export function requireCompanyId(context: TenantContext): Uuid {
  if (context.companyId === null) {
    throw new ForbiddenException(
      "Cette requete exige une societe active. Precisez-la (en-tete 'x-paymarh-company-id')."
    );
  }

  return context.companyId;
}

/**
 * FILTRE DE NIVEAU 1 - par compte.
 *
 * A utiliser pour toute ressource qui porte directement un `accountId`
 * (Company, User...). C est le filtre minimal : il n est JAMAIS optionnel.
 */
export function accountScope(context: TenantContext): { accountId: Uuid } {
  return { accountId: requireAccountId(context) };
}

/**
 * FILTRE DE NIVEAU 2 - par compte ET par societe (double isolation).
 *
 * A utiliser pour toute ressource rattachee a une societe (les futurs
 * salaries, bulletins, absences...). On conserve `accountId` en plus de
 * `companyId` : c est redondant en theorie, mais c est exactement cette
 * redondance qui garantit qu un identifiant de societe devine ou fuite ne
 * suffit jamais a lire les donnees d un autre compte.
 */
export function companyScope(context: TenantContext): {
  accountId: Uuid;
  companyId: Uuid;
} {
  return {
    accountId: requireAccountId(context),
    companyId: requireCompanyId(context),
  };
}

/**
 * ACCES ELARGI DU SUPER-ADMIN - exception documentee.
 *
 * Seul un PLATFORM_ADMIN peut l emprunter, et seulement en fournissant un
 * motif. L appelant DOIT, dans le meme flux, consigner l acces via
 * AuditService : sans trace, l exception au filtrage n est pas acceptable.
 *
 * Cette fonction n est appelee nulle part au module 0 (aucune interface
 * d administration n existe) : elle fige le chemin pour la suite.
 */
export function crossAccountScope(
  context: TenantContext,
  access: PlatformAccessReason
): { accountId: Uuid } {
  if (context.role !== 'PLATFORM_ADMIN') {
    throw new ForbiddenException("L'acces inter-comptes est reserve au role PLATFORM_ADMIN.");
  }

  if (access.reason.trim().length === 0) {
    throw new ForbiddenException(
      "Un acces inter-comptes doit etre motive : le motif est consigne dans le journal d'audit."
    );
  }

  return { accountId: access.accountId };
}
