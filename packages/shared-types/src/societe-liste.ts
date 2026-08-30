import type { Societe } from './company';

/** Ligne de liste societe — inclut le compteur d etablissements. */
export interface SocieteListe extends Societe {
  readonly nombreEtablissements: number;
}
