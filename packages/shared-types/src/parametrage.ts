import type { Uuid } from './common';

export type JourSemaine =
  'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE';

export interface ParametrageSociete {
  readonly id?: Uuid;
  readonly moisEffet?: string;
  readonly moisClotureConges: number;
  readonly typeExonerationId: Uuid | null;
  readonly exonerationDateDebut: string | null;
  readonly exonerationDateFin: string | null;
}

export interface HoraireDefautLigne {
  readonly id?: Uuid;
  readonly jourSemaine: JourSemaine;
  readonly typeHeureId: Uuid;
  readonly nombreHeures: string;
}

export interface HoraireMensuelLigne {
  readonly id?: Uuid;
  readonly typeHeureId: Uuid;
  readonly nombreHeures: string;
}

export interface JourFerieTravailleRef {
  readonly jourFerieId: Uuid;
}

export interface ParametrageEtablissement {
  readonly id?: Uuid;
  readonly moisEffet?: string;
  readonly dureeHebdomadaire: string;
  readonly jourReposHebdomadaire: JourSemaine;
  readonly teletravailAutorise: boolean | null;
  readonly indemniteTeletravailVersee: boolean | null;
  readonly montantIndemniteTeletravail: string | null;
  readonly horaireDefautLignes: readonly HoraireDefautLigne[];
  readonly horaireMensuelLignes: readonly HoraireMensuelLigne[];
  readonly joursFeriesTravailles: readonly JourFerieTravailleRef[];
}
