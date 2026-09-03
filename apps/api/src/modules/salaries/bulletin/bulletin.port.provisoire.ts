import { Injectable } from '@nestjs/common';
import type { BulletinPort, MoisBulletin } from './bulletin.port.js';

/**
 * PROVISOIRE — rend une liste vide en attendant le module 2 (traitement du mois).
 * A remplacer par une implementation lisant la table des bulletins.
 */
@Injectable()
export class BulletinPortProvisoire implements BulletinPort {
  async listerBulletinsParSalarie(_salarieId: string): Promise<readonly MoisBulletin[]> {
    return [];
  }

  async listerBulletinsParEmploi(_emploiId: string): Promise<readonly MoisBulletin[]> {
    return [];
  }
}
