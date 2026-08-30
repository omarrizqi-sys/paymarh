import type {
  Banque,
  FormeJuridique,
  JourFerie,
  ListResponse,
  TypeExoneration,
  TypeHeure,
} from '@paymarh/shared-types';
import { appelerApiGet } from './client';

export async function listerFormesJuridiques() {
  return appelerApiGet<ListResponse<FormeJuridique>>('/referentiels/formes-juridiques');
}

export async function listerBanques() {
  return appelerApiGet<ListResponse<Banque>>('/referentiels/banques');
}

export async function listerJoursFeries() {
  return appelerApiGet<ListResponse<JourFerie>>('/referentiels/jours-feries');
}

export async function listerTypesHeures() {
  return appelerApiGet<ListResponse<TypeHeure>>('/referentiels/types-heures');
}

export async function listerTypesExoneration() {
  return appelerApiGet<ListResponse<TypeExoneration>>('/referentiels/types-exoneration');
}

/** Charge tous les referentiels necessaires aux ecrans fiche societe. */
export async function chargerReferentielsFiche() {
  const [formes, banques, joursFeries, typesHeures, typesExoneration] = await Promise.all([
    listerFormesJuridiques(),
    listerBanques(),
    listerJoursFeries(),
    listerTypesHeures(),
    listerTypesExoneration(),
  ]);
  return {
    formesJuridiques: formes.data.items,
    banques: banques.data.items,
    joursFeries: joursFeries.data.items,
    typesHeures: typesHeures.data.items,
    typesExoneration: typesExoneration.data.items,
  };
}
