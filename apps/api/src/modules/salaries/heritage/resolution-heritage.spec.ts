import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { collecterAlerteReposVsGrille } from './alerte-c24.js';
import { assemblerResolutionsEmploi } from './assembler-resolutions.js';
import { premierNonNul } from './resoudre-champ.js';

describe('premierNonNul — cascade SAL > ETB > SOC > NAT', () => {
  it('retient le premier niveau non nul', () => {
    const resolution = premierNonNul([
      { valeur: null, origine: 'SALARIE', libelleEntite: null },
      { valeur: '44', origine: 'ETABLISSEMENT', libelleEntite: 'Casablanca' },
      { valeur: '40', origine: 'NATIONAL', libelleEntite: null },
    ]);
    expect(resolution).toEqual({
      valeur: '44',
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });
  });

  it('false est une valeur propre, pas un heritage', () => {
    const resolution = premierNonNul([
      { valeur: false, origine: 'SALARIE', libelleEntite: null },
      { valeur: true, origine: 'ETABLISSEMENT', libelleEntite: 'Casablanca' },
    ]);
    expect(resolution?.valeur).toBe(false);
    expect(resolution?.origine).toBe('SALARIE');
  });

  it('aucun niveau → absence de valeur (P6)', () => {
    expect(
      premierNonNul([
        { valeur: null, origine: 'SALARIE', libelleEntite: null },
        { valeur: undefined, origine: 'ETABLISSEMENT', libelleEntite: 'X' },
      ])
    ).toBeNull();
  });
});

describe('assemblerResolutionsEmploi', () => {
  const etab = {
    nom: 'Casablanca',
    dureeHebdomadaire: new Decimal('44'),
    jourReposHebdomadaire: 'DIMANCHE',
    teletravailAutorise: true,
    indemniteTeletravailVersee: true,
    montantIndemniteTeletravail: new Decimal('500'),
    horaireDefautLignes: [
      { jourSemaine: 'DIMANCHE', typeHeureId: 'h1', nombreHeures: new Decimal('8') },
    ],
    joursFeriesTravaillesIds: ['jf-1'],
  };

  const salarieVide = {
    dureeContractuelle: null,
    reposHebdomadaire: null,
    teletravailAutorise: null,
    teletravailIndemniteVersee: null,
    teletravailMontant: null,
    repartitionHoraireRef: null,
    suivreJoursFeriesEtablissement: true,
    joursFeriesPropres: [] as const,
  };

  it('un champ vide au niveau emploi rend la valeur etablissement avec son nom', () => {
    const resolutions = assemblerResolutionsEmploi(
      salarieVide,
      etab,
      { dureeLegaleTravail: null },
      '2025-07'
    );
    expect(resolutions.dureeContractuelle).toEqual({
      valeur: '44',
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });
  });

  it('un champ rempli au niveau emploi garde l origine salarie', () => {
    const resolutions = assemblerResolutionsEmploi(
      { ...salarieVide, dureeContractuelle: new Decimal('39') },
      etab,
      { dureeLegaleTravail: null },
      '2025-07'
    );
    expect(resolutions.dureeContractuelle).toEqual({
      valeur: '39',
      origine: 'SALARIE',
      libelleEntite: null,
    });
  });

  it('aucun niveau ne produit aucune valeur', () => {
    const resolutions = assemblerResolutionsEmploi(
      salarieVide,
      null,
      { dureeLegaleTravail: null },
      '2025-07'
    );
    expect(resolutions.dureeContractuelle).toBeNull();
    expect(resolutions.grilleHoraire).toBeNull();
    expect(resolutions.reposHebdomadaire).toBeNull();
  });

  it('jours feries : suivi etab vs grille propre vide (A15)', () => {
    const suivi = assemblerResolutionsEmploi(
      salarieVide,
      etab,
      { dureeLegaleTravail: null },
      '2025-07'
    );
    expect(suivi.joursFeriesTravailles).toEqual({
      valeur: ['jf-1'],
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });

    const propreVide = assemblerResolutionsEmploi(
      { ...salarieVide, suivreJoursFeriesEtablissement: false },
      etab,
      { dureeLegaleTravail: null },
      '2025-07'
    );
    expect(propreVide.joursFeriesTravailles).toEqual({
      valeur: [],
      origine: 'SALARIE',
      libelleEntite: null,
    });
  });
});

describe('C24 — repos vs grille resolue', () => {
  it('alerte si le repos tombe un jour travaille de la grille', () => {
    const alerte = collecterAlerteReposVsGrille('DIMANCHE', [
      { jourSemaine: 'DIMANCHE', typeHeureId: 'h', nombreHeures: '8' },
    ]);
    expect(alerte?.code).toBe('REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE');
  });

  it('aucune alerte sans grille resolue', () => {
    expect(collecterAlerteReposVsGrille('DIMANCHE', null)).toBeNull();
    expect(collecterAlerteReposVsGrille('DIMANCHE', [])).toBeNull();
  });
});
