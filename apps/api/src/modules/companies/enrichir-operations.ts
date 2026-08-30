import type {
  CompteBancaire,
  Etablissement,
  Permission,
  RessourceAvecOperations,
  Societe,
} from '@paymarh/shared-types';

export function enrichirSociete(
  societe: Societe,
  operations: readonly Permission[]
): RessourceAvecOperations<Societe> {
  return { ...societe, operations };
}

export function enrichirEtablissement(
  etablissement: Etablissement,
  operations: readonly Permission[]
): RessourceAvecOperations<Etablissement> {
  return { ...etablissement, operations };
}

export function enrichirCompteBancaire(
  compte: CompteBancaire,
  operations: readonly Permission[]
): RessourceAvecOperations<CompteBancaire> {
  return { ...compte, operations };
}
