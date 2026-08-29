import { ForbiddenException } from '@nestjs/common';
import type { TenantContext } from '@paymarh/shared-types';
import type { ContextePermission, Permission } from './permissions.js';
import { permissionsProvisoiresDuRole } from './role-permissions.provisoire.js';

/**
 * POINT DE PASSAGE UNIQUE des droits.
 *
 * Aucun controleur ni service ne doit tester un role directement
 * (`if (role === ...)`). Toute verification passe par cette fonction.
 *
 * Regles provisoires (module 0 roles) :
 * - `referentiel.lire` : tout utilisateur authentifie
 * - sinon : table `role-permissions.provisoire.ts`
 * - `PLATFORM_ADMIN` : pas d acces aux donnees compte sur le chemin normal
 *   (ses permissions se limitent a referentiel.gerer et forcer-regime)
 * - pour les operations sur une societe, le filtrage multi-tenant
 *   (`accountScope`) reste la barriere d isolation ; `peutFaire` decide
 *   seulement si le role autorise l operation
 */
export function peutFaire(
  utilisateur: TenantContext,
  permission: Permission,
  _contexte: ContextePermission = {}
): boolean {
  if (permission === 'referentiel.lire') {
    return true;
  }

  const accordes = permissionsProvisoiresDuRole(utilisateur.role);
  return accordes.includes(permission);
}

/**
 * Comme `peutFaire`, mais leve 403 si refuse.
 * Message neutre : ne revele pas de detail metier.
 */
export function assertPeutFaire(
  utilisateur: TenantContext,
  permission: Permission,
  contexte: ContextePermission = {}
): void {
  if (!peutFaire(utilisateur, permission, contexte)) {
    throw new ForbiddenException('Action non autorisee.');
  }
}
