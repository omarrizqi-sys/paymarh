import { Inject, Injectable } from '@nestjs/common';
import { BULLETIN_PORT, EtatBulletin, type BulletinPort } from './bulletin/bulletin.port.js';
import { ligneUtiliseeParBulletin } from './deductions-tableaux.js';
import { moisPrecedent } from './mois-en-cours/mois-en-cours.service.js';

export type ModeSuppressionLigne = 'supprimer' | 'inactiver';

export type ModeModificationLigne = 'ecraser' | 'versionner';

function bulletinExistePourMois(
  bulletins: readonly { mois: string; etat: EtatBulletin }[],
  mois: string
): boolean {
  return bulletins.some((b) => b.mois === mois && b.etat >= EtatBulletin.CALCULE);
}

@Injectable()
export class HistorisationLigneTemporelleService {
  constructor(@Inject(BULLETIN_PORT) private readonly bulletins: BulletinPort) {}

  async deciderModification(
    salarieId: string,
    moisEnCours: string
  ): Promise<ModeModificationLigne> {
    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarieId);
    if (bulletinExistePourMois(bulletins, moisEnCours)) {
      return 'versionner';
    }
    return 'ecraser';
  }

  async deciderSuppression(
    salarieId: string,
    ligne: { moisEffetDebut: string; moisEffetFin: string | null }
  ): Promise<ModeSuppressionLigne> {
    const bulletins = await this.bulletins.listerBulletinsParSalarie(salarieId);
    if (ligneUtiliseeParBulletin(bulletins, ligne)) {
      return 'inactiver';
    }
    return 'supprimer';
  }

  /** Suppression d'une ligne deja utilisee par un bulletin : fin au mois en cours inclus. */
  moisFinSuppressionLigneUtilisee(moisEnCours: string): string {
    return moisEnCours;
  }

  /** Modification avec bulletin : cloture de l'ancienne ligne au mois precedent. */
  moisFinClotureLigneRemplacee(moisEnCours: string): string {
    return moisPrecedent(moisEnCours);
  }
}
