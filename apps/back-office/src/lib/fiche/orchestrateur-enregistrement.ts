import type { AlerteApi } from '@paymarh/shared-types';
import { AppelApiEchoue } from '@/lib/api/client';
import { estConflitVersion } from './codes-conflit';

export type StatutRubriqueEnregistrement = 'succes' | 'echec' | 'conflit' | 'non_tente';

export interface ResultatRubriqueEnregistrement {
  readonly id: string;
  readonly libelle: string;
  readonly statut: StatutRubriqueEnregistrement;
  readonly message?: string;
  readonly alertes?: readonly AlerteApi[];
}

export interface EnvoiRubriqueResultat {
  readonly version: number;
  readonly alertes: readonly AlerteApi[];
}

export interface RubriqueEnregistrable {
  readonly id: string;
  readonly libelle: string;
  estModifiee(): boolean;
  envoyer(version: number): Promise<EnvoiRubriqueResultat>;
  reinitialiser(): void;
}

export interface ResultatEnregistrementGlobal {
  readonly resultats: readonly ResultatRubriqueEnregistrement[];
  readonly conflit: boolean;
  readonly version: number;
}

/**
 * Enregistre les rubriques modifiees dans l ordre de la page.
 * Propage la version apres chaque succes ; continue apres un 400 metier ;
 * s arrete sur conflit de version ou If-Match manquant.
 */
export async function enregistrerRubriquesModifiees(
  rubriques: readonly RubriqueEnregistrable[],
  versionInitiale: number
): Promise<ResultatEnregistrementGlobal> {
  const modifiees = rubriques.filter((rubrique) => rubrique.estModifiee());
  let version = versionInitiale;
  const resultats: ResultatRubriqueEnregistrement[] = [];
  let conflit = false;

  for (const rubrique of modifiees) {
    try {
      const reponse = await rubrique.envoyer(version);
      version = reponse.version;
      resultats.push({
        id: rubrique.id,
        libelle: rubrique.libelle,
        statut: 'succes',
        alertes: reponse.alertes,
      });
    } catch (erreur) {
      if (erreur instanceof AppelApiEchoue && estConflitVersion(erreur.erreur.code)) {
        resultats.push({
          id: rubrique.id,
          libelle: rubrique.libelle,
          statut: 'conflit',
          message: erreur.erreur.message,
        });
        conflit = true;
        break;
      }

      if (erreur instanceof AppelApiEchoue) {
        resultats.push({
          id: rubrique.id,
          libelle: rubrique.libelle,
          statut: 'echec',
          message: erreur.erreur.message,
        });
        continue;
      }

      throw erreur;
    }
  }

  return { resultats, conflit, version };
}

export function compterRubriquesModifiees(rubriques: readonly RubriqueEnregistrable[]): number {
  return rubriques.filter((rubrique) => rubrique.estModifiee()).length;
}

export function libellesRubriquesModifiees(rubriques: readonly RubriqueEnregistrable[]): string[] {
  return rubriques.filter((rubrique) => rubrique.estModifiee()).map((rubrique) => rubrique.libelle);
}
