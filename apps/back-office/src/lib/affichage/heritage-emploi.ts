import type { NiveauHeritage, ResolutionChamp } from '@paymarh/shared-types';
import { libelleJourSemaine } from '@/lib/affichage/libelles';
import { afficherBoolean } from '@/lib/affichage/libelles-emploi';

export function libelleOrigineHeritage(
  origine: NiveauHeritage,
  libelleEntite: string | null
): string {
  switch (origine) {
    case 'SALARIE':
      return 'salarié';
    case 'ETABLISSEMENT':
      return libelleEntite !== null && libelleEntite.length > 0
        ? `établissement ${libelleEntite}`
        : 'établissement';
    case 'SOCIETE':
      return 'société';
    case 'NATIONAL':
      return 'référentiel national';
  }
}

export function composerPhraseHeritage(
  valeurAffichee: string,
  origine: NiveauHeritage,
  libelleEntite: string | null
): string {
  return `${valeurAffichee} — ${libelleOrigineHeritage(origine, libelleEntite)}`;
}

/** Clé absente = masquée ; clé présente à null = aucune valeur héritée. */
export function phraseHeritageChamp<T>(
  resolution: ResolutionChamp<T> | null | undefined,
  formaterValeur: (valeur: T) => string
): string | null {
  if (resolution === undefined || resolution === null) {
    return null;
  }
  return composerPhraseHeritage(
    formaterValeur(resolution.valeur),
    resolution.origine,
    resolution.libelleEntite
  );
}

export function phraseHeritageDuree(
  resolution: ResolutionChamp<string> | null | undefined
): string | null {
  return phraseHeritageChamp(resolution, (valeur) => `${valeur} h`);
}

export function phraseHeritageJourSemaine(
  resolution: ResolutionChamp<string> | null | undefined
): string | null {
  return phraseHeritageChamp(resolution, libelleJourSemaine);
}

export function phraseHeritageBoolean(
  resolution: ResolutionChamp<boolean> | null | undefined
): string | null {
  return phraseHeritageChamp(resolution, afficherBoolean);
}

export function phraseHeritageMontant(
  resolution: ResolutionChamp<string> | null | undefined
): string | null {
  return phraseHeritageChamp(resolution, (valeur) => valeur);
}
