import { SetMetadata } from '@nestjs/common';

export const CLE_JOURNALISER_ECRITURE = 'paymarh:journaliser-ecriture';

export interface OptionsJournalEcriture {
  /** Type Prisma / metier de l entite (ex. "Salarie"). */
  readonly entite: string;
  /** Verbe d action en MAJUSCULES_AVEC_UNDERSCORES. */
  readonly action: string;
  /** Nom du parametre de route portant l identifiant de l entite. */
  readonly idParam?: string;
  /**
   * Creation : l entite visee n existe pas avant l ecriture. L identifiant
   * consigne est `donnees.id` de la reponse ; aucun etat avant, aucun ecart.
   */
  readonly idDepuisReponse?: boolean;
  /** Chargeur personnalise de l etat avant ecriture. */
  readonly chargerAvant?: (id: string) => Promise<Record<string, unknown> | null>;
}

export const JournaliserEcriture = (options: OptionsJournalEcriture) =>
  SetMetadata(CLE_JOURNALISER_ECRITURE, options);
