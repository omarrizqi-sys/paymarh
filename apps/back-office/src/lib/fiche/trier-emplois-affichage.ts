import type { EmploiFiche } from '@paymarh/shared-types';

/** Même ordre que l’API : date de début, puis numeroOrdre. */
export function trierEmploisAffichage(emplois: readonly EmploiFiche[]): EmploiFiche[] {
  return [...emplois].sort((a, b) => {
    const cmp = a.contrat.dateDebut.localeCompare(b.contrat.dateDebut);
    if (cmp !== 0) {
      return cmp;
    }
    return a.numeroOrdre - b.numeroOrdre;
  });
}

export function separerEmploisActifsEtTermines(emplois: readonly EmploiFiche[]): {
  readonly actifs: readonly EmploiFiche[];
  readonly termines: readonly EmploiFiche[];
} {
  const tries = trierEmploisAffichage(emplois);
  return {
    actifs: tries.filter((emploi) => emploi.contrat.estOuvert),
    termines: tries.filter((emploi) => !emploi.contrat.estOuvert),
  };
}
