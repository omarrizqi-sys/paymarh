import { SetMetadata } from '@nestjs/common';
import type { Permission } from './permissions.js';

export const CLE_PERMISSION = 'paymarh:permission';

/** Exige une permission nommee — verifiee uniquement par PermissionGuard. */
export const RequiertPermission = (permission: Permission) =>
  SetMetadata(CLE_PERMISSION, permission);

export const CLE_PERIMETRE_SALARIE = 'paymarh:perimetre-salarie';

/**
 * Charge le salarie identifie par le parametre de route avant la decision de droit,
 * afin qu une ressource hors compte renvoie 404 avant toute verification 403.
 */
export const PerimetreSalarie = (parametreId = 'id') =>
  SetMetadata(CLE_PERIMETRE_SALARIE, parametreId);

export const CLE_PERIMETRE_EMPLOI = 'paymarh:perimetre-emploi';

/** Meme logique que PerimetreSalarie pour un emploi. */
export const PerimetreEmploi = (parametreId = 'id') =>
  SetMetadata(CLE_PERIMETRE_EMPLOI, parametreId);
