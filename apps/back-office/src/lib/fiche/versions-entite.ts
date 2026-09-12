export type EntitePorteuse =
  { readonly kind: 'salarie' } | { readonly kind: 'emploi'; readonly emploiId: string };

export interface VersionsParEntite {
  readonly salarie: number;
  readonly emplois: Readonly<Record<string, number>>;
}

export function lireVersionEntite(
  versions: VersionsParEntite,
  entite: EntitePorteuse
): number | undefined {
  if (entite.kind === 'salarie') {
    return versions.salarie;
  }
  return versions.emplois[entite.emploiId];
}

export function mettreAJourVersionEntite(
  versions: VersionsParEntite,
  entite: EntitePorteuse,
  nouvelleVersion: number
): VersionsParEntite {
  if (entite.kind === 'salarie') {
    return { ...versions, salarie: nouvelleVersion };
  }
  return {
    ...versions,
    emplois: { ...versions.emplois, [entite.emploiId]: nouvelleVersion },
  };
}

export function versionsEmploisDepuisListe(
  emplois: readonly { readonly id: string; readonly version: number }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const emploi of emplois) {
    map[emploi.id] = emploi.version;
  }
  return map;
}
