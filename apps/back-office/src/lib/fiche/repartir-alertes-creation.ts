import type { AlerteApi } from '@paymarh/shared-types';
import type { IdRubriqueCreationSalarie } from './ordre-rubriques-creation-salarie';

const CHAMPS_PAR_BLOC: Record<IdRubriqueCreationSalarie, readonly string[]> = {
  identite: [
    'nom',
    'prenom',
    'sexe',
    'dateNaissance',
    'villeNaissance',
    'paysNaissanceId',
    'nationaliteId',
    'situationFamilialeCode',
  ],
  'identifiants-legaux': ['matricule', 'numeroPiece', 'numeroCnss', 'numeroCimr'],
  coordonnees: [
    'adresse',
    'complementAdresse',
    'ville',
    'codePostal',
    'paysId',
    'telephonePersonnel',
    'telephoneProfessionnel',
    'emailPersonnel',
    'emailProfessionnel',
    'urgencePrenom',
    'urgenceNom',
    'urgenceTelephone',
    'urgenceEmail',
  ],
  dates: ['dateEntree', 'dateAnciennete'],
};

export type AlertesParBlocCreation = Record<IdRubriqueCreationSalarie, readonly AlerteApi[]>;

function blocDuChamp(champ: string): IdRubriqueCreationSalarie {
  for (const [id, champs] of Object.entries(CHAMPS_PAR_BLOC) as [
    IdRubriqueCreationSalarie,
    readonly string[],
  ][]) {
    if (champs.includes(champ)) {
      return id;
    }
  }
  return 'identite';
}

/** Sans nom de champ : tete du bloc Identite, premier de l ecran. */
export function repartirAlertesCreation(alertes: readonly AlerteApi[]): AlertesParBlocCreation {
  const parBloc: Record<IdRubriqueCreationSalarie, AlerteApi[]> = {
    identite: [],
    'identifiants-legaux': [],
    coordonnees: [],
    dates: [],
  };

  for (const alerte of alertes) {
    if (alerte.champ === undefined || alerte.champ.length === 0) {
      parBloc.identite.push(alerte);
      continue;
    }
    parBloc[blocDuChamp(alerte.champ)].push(alerte);
  }

  return parBloc;
}
