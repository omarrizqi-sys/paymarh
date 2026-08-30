import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const RACINE = join(import.meta.dirname, '..');

function fichiersSource(dir: string): string[] {
  const result: string[] = [];
  for (const entree of readdirSync(dir, { withFileTypes: true })) {
    const chemin = join(dir, entree.name);
    if (entree.isDirectory()) result.push(...fichiersSource(chemin));
    else if (/\.(ts|tsx)$/.test(entree.name) && !/\.spec\.(ts|tsx)$/.test(entree.name) && !/-mapper\.(ts|tsx)$/.test(entree.name)) {
      result.push(chemin);
    }
  }
  return result;
}

describe('conformite back-office — pas de flottants interdits', () => {
  it('n utilise ni parseFloat ni Math.round', () => {
    const interdits = [/parseFloat\s*\(/, /Number\.parseFloat\s*\(/, /Math\.round\s*\(/];
    const violations: string[] = [];

    for (const fichier of fichiersSource(RACINE)) {
      const contenu = readFileSync(fichier, 'utf8');
      for (const motif of interdits) {
        if (motif.test(contenu)) {
          violations.push(`${fichier}: ${motif.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});

describe('conformite back-office — pas de regles metier re-jouees', () => {
  const motifsMetier = [
    /VALEUR_INDISPONIBLE/,
    /moisDebutMontage\s*[><=]/,
    /moisDebutProduction\s*[><=]/,
    /dateInactivite\s*[><=]/,
    /exonerationDateFin\s*[><=]/,
    /identifiantFiscal.*deja/i,
    /unicite/i,
  ];

  it('ne contient pas de comparaisons de dates metier ni controle d unicite', () => {
    const violations: string[] = [];

    for (const fichier of fichiersSource(RACINE)) {
      const contenu = readFileSync(fichier, 'utf8');
      for (const motif of motifsMetier) {
        if (motif.test(contenu)) {
          violations.push(`${fichier}: ${motif.source}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
