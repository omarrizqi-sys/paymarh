import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  controlerEtatDossier,
  controlerExoneration,
  controlerMoisClotureConges,
  estMoisAAAA_MM,
} from './coherence-fiche-societe.js';
import { heuresHebdomadairesVersMensuelles } from './heures-mensuelles.js';
import { resoudreLigneHistorique } from './historisation.js';

describe('coherence etat du dossier', () => {
  it('accepte montage <= production', () => {
    expect(
      controlerEtatDossier({
        etatDossier: 'EN_PRODUCTION',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        dateInactivite: null,
      })
    ).toEqual([]);
  });

  it('accepte montage = production (demarrage sans reprise)', () => {
    expect(
      controlerEtatDossier({
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-07',
        moisDebutProduction: '2025-07',
        dateInactivite: null,
      })
    ).toEqual([]);
  });

  it('refuse moisDebutMontage > moisDebutProduction', () => {
    expect(
      controlerEtatDossier({
        etatDossier: 'EN_PRODUCTION',
        moisDebutMontage: '2025-08',
        moisDebutProduction: '2025-07',
        dateInactivite: null,
      })
    ).toContain('MONTAGE_APRES_PRODUCTION');
  });

  it('exige dateInactivite si etat = INACTIVE', () => {
    expect(
      controlerEtatDossier({
        etatDossier: 'INACTIVE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        dateInactivite: null,
      })
    ).toContain('INACTIVITE_OBLIGATOIRE');
  });

  it('exige dateInactivite > moisDebutProduction', () => {
    expect(
      controlerEtatDossier({
        etatDossier: 'INACTIVE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        dateInactivite: '2025-07',
      })
    ).toContain('INACTIVITE_NON_POSTERIEURE');

    expect(
      controlerEtatDossier({
        etatDossier: 'INACTIVE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        dateInactivite: '2025-08',
      })
    ).toEqual([]);
  });

  it('valide le format AAAA-MM', () => {
    expect(estMoisAAAA_MM('2025-01')).toBe(true);
    expect(estMoisAAAA_MM('2025-13')).toBe(false);
    expect(estMoisAAAA_MM('25-01')).toBe(false);
  });
});

describe('coherence exoneration et cloture conges', () => {
  it('exige une date de debut si une exoneration est choisie', () => {
    expect(
      controlerExoneration({
        typeExonerationId: 'uuid-tahfiz',
        exonerationDateDebut: null,
        exonerationDateFin: null,
      })
    ).toContain('EXONERATION_DEBUT_OBLIGATOIRE');
  });

  it('refuse une fin anterieure au debut', () => {
    expect(
      controlerExoneration({
        typeExonerationId: 'uuid-tahfiz',
        exonerationDateDebut: '2025-07',
        exonerationDateFin: '2025-06',
      })
    ).toContain('EXONERATION_FIN_AVANT_DEBUT');
  });

  it('borne le mois de cloture entre 1 et 12', () => {
    expect(controlerMoisClotureConges(12)).toEqual([]);
    expect(controlerMoisClotureConges(0)).toContain('MOIS_CLOTURE_HORS_PLAGE');
    expect(controlerMoisClotureConges(13)).toContain('MOIS_CLOTURE_HORS_PLAGE');
  });
});

describe('historisation par moisEffet', () => {
  const lignes = [
    { moisEffet: '2025-01', moisClotureConges: 12 },
    { moisEffet: '2025-07', moisClotureConges: 6 },
  ];

  it('retourne la ligne applicable, pas la plus recente', () => {
    expect(resoudreLigneHistorique(lignes, '2025-03')?.moisClotureConges).toBe(12);
    expect(resoudreLigneHistorique(lignes, '2025-07')?.moisClotureConges).toBe(6);
    expect(resoudreLigneHistorique(lignes, '2025-12')?.moisClotureConges).toBe(6);
  });

  it('retourne null si aucune ligne n a encore pris effet', () => {
    expect(resoudreLigneHistorique(lignes, '2024-12')).toBeNull();
  });

  it('ne prend pas une ligne future meme si elle est la seule', () => {
    expect(resoudreLigneHistorique([{ moisEffet: '2026-01', v: 1 }], '2025-06')).toBeNull();
  });
});

describe('conversion hebdomadaire → mensuel', () => {
  it('applique 52/12 avec arrondi superieur via Decimal.ceil', () => {
    // 44 × 52 / 12 = 190.666… → 191
    expect(heuresHebdomadairesVersMensuelles(new Decimal(44)).toString()).toBe('191');
    // 40 × 52 / 12 = 173.333… → 174
    expect(heuresHebdomadairesVersMensuelles(new Decimal(40)).toString()).toBe('174');
    // Exact : 48 × 52 / 12 = 208
    expect(heuresHebdomadairesVersMensuelles(new Decimal(48)).toString()).toBe('208');
  });
});

describe('garde-fou : aucun parseFloat ni Math.round introduit', () => {
  it('ne trouve aucune occurrence interdite dans le code source de l API', () => {
    const racine = join(import.meta.dirname, '..', '..');
    const fichiers = listerFichiersTs(racine).filter(
      (f) => !f.includes(`${join('generated', 'prisma')}`) && !f.endsWith('.spec.ts')
    );

    const interdits = [/\bparseFloat\s*\(/, /\bNumber\.parseFloat\s*\(/, /\bMath\.round\s*\(/];
    const contrevenants: string[] = [];

    for (const fichier of fichiers) {
      const contenu = readFileSync(fichier, 'utf8');
      for (const motif of interdits) {
        if (motif.test(contenu)) {
          contrevenants.push(relative(racine, fichier));
        }
      }
    }

    expect(contrevenants).toEqual([]);
  });
});

function listerFichiersTs(dossier: string): string[] {
  const resultat: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    const info = statSync(chemin);
    if (info.isDirectory()) {
      if (entree === 'node_modules' || entree === 'dist') continue;
      resultat.push(...listerFichiersTs(chemin));
    } else if (entree.endsWith('.ts')) {
      resultat.push(chemin);
    }
  }
  return resultat;
}
