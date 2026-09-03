/**
 * Rubriques soumises au masquage de remuneration (regles A12, E2, T9, T10).
 * Les prompts suivants declarent l appartenance d un champ a une rubrique ici.
 */
export const RUBRIQUES_REMUNERATION = {
  REMUNERATION: 'remuneration',
  PAIEMENT: 'paiement',
  PRIMES_CONTRACTUELLES: 'primesContractuelles',
  AVANTAGES_EN_NATURE: 'avantagesEnNature',
  COMPTES_BANCAIRES: 'comptesBancaires',
} as const;

export type RubriqueRemuneration =
  (typeof RUBRIQUES_REMUNERATION)[keyof typeof RUBRIQUES_REMUNERATION];

/** Cle de premier niveau dans un objet JSON → rubrique. */
export const REGISTRE_CLE_RUBRIQUE: Readonly<Record<string, RubriqueRemuneration>> = {
  remuneration: RUBRIQUES_REMUNERATION.REMUNERATION,
  paiement: RUBRIQUES_REMUNERATION.PAIEMENT,
  primesContractuelles: RUBRIQUES_REMUNERATION.PRIMES_CONTRACTUELLES,
  avantagesEnNature: RUBRIQUES_REMUNERATION.AVANTAGES_EN_NATURE,
  comptesBancaires: RUBRIQUES_REMUNERATION.COMPTES_BANCAIRES,
};

/** Toutes les rubriques masquees sans salarie.remuneration.lire. */
export const TOUTES_RUBRIQUES_REMUNERATION: readonly RubriqueRemuneration[] =
  Object.values(RUBRIQUES_REMUNERATION);

/**
 * Enregistre l appartenance d une cle a une rubrique (pour les prompts suivants).
 */
export function declarerCleRubrique(cle: string, rubrique: RubriqueRemuneration): void {
  (REGISTRE_CLE_RUBRIQUE as Record<string, RubriqueRemuneration>)[cle] = rubrique;
}

export function rubriqueDeCle(cle: string): RubriqueRemuneration | undefined {
  return REGISTRE_CLE_RUBRIQUE[cle];
}

export function contientRubriqueMasquee(
  valeur: unknown,
  rubriquesMasquees: ReadonlySet<RubriqueRemuneration>
): boolean {
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    return false;
  }

  for (const [cle, contenu] of Object.entries(valeur as Record<string, unknown>)) {
    const rubrique = rubriqueDeCle(cle);
    if (rubrique !== undefined && rubriquesMasquees.has(rubrique)) {
      return true;
    }
    if (contientRubriqueMasquee(contenu, rubriquesMasquees)) {
      return true;
    }
  }

  return false;
}

export function retirerRubriquesMasquees<T>(
  valeur: T,
  rubriquesMasquees: ReadonlySet<RubriqueRemuneration>
): T {
  if (Array.isArray(valeur)) {
    return valeur.map((element) => retirerRubriquesMasquees(element, rubriquesMasquees)) as T;
  }

  if (typeof valeur !== 'object' || valeur === null) {
    return valeur;
  }

  const resultat: Record<string, unknown> = {};
  for (const [cle, contenu] of Object.entries(valeur as Record<string, unknown>)) {
    const rubrique = rubriqueDeCle(cle);
    if (rubrique !== undefined && rubriquesMasquees.has(rubrique)) {
      continue;
    }
    resultat[cle] = retirerRubriquesMasquees(contenu, rubriquesMasquees);
  }

  return resultat as T;
}
