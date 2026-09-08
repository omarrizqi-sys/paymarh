import type {
  Banque,
  FormeJuridique,
  JourFerie,
  LienParente,
  ListResponse,
  Pays,
  SituationFamiliale,
  TypeExoneration,
  TypeHeure,
  TypeSaisieSurSalaire,
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

export async function listerPays() {
  return appelerApiGet<ListResponse<Pays>>('/referentiels/pays');
}

export async function listerSituationsFamiliales() {
  return appelerApiGet<ListResponse<SituationFamiliale>>('/referentiels/situations-familiales');
}

export async function listerLiensParente() {
  return appelerApiGet<ListResponse<LienParente>>('/referentiels/liens-parente');
}

export async function listerTypesSaisieSurSalaire() {
  return appelerApiGet<ListResponse<TypeSaisieSurSalaire>>(
    '/referentiels/types-saisie-sur-salaire'
  );
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
