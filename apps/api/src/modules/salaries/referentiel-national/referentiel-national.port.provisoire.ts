import { Injectable } from '@nestjs/common';
import type { Decimal } from 'decimal.js';
import type {
  CleReferentielNational,
  ReferentielNationalPort,
} from './referentiel-national.port.js';

/**
 * PROVISOIRE — ne rend aucune valeur en attendant les modules 4 et 5.
 * Les alertes C19, C20 et toute alerte dependante du referentiel sont donc absentes.
 */
@Injectable()
export class ReferentielNationalPortProvisoire implements ReferentielNationalPort {
  async lireValeur(
    _cle: CleReferentielNational,
    _mois: string
  ): Promise<Decimal | null> {
    return null;
  }
}
