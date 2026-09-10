/**
 * Contrat de livraison des valeurs a la creation d un salarie.
 *
 * Distinct de RubriqueEnregistrable : les tableaux repetables ne participent
 * jamais a une creation, et il n y a ici aucun envoi HTTP par rubrique.
 * Quatre implementeurs seulement — les blocs d identite.
 */
export interface RubriqueCreable<T = unknown> {
  readonly id: string;
  readonly libelle: string;
  valeurs(): T;
  reinitialiser(): void;
}
