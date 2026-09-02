import { describe, expect, it } from 'vitest';
import { resoudreLigneHistorique } from '../companies/historisation.js';
import {
  ligneCloseAvantMois,
  ligneLisiblePourMois,
  resoudreLigneTemporelle,
} from './historisation-temporelle.js';
import { calculerProchainMatricule, calculerProchainNumeroOrdre } from './prochain-matricule.js';

describe('matricule salarie (fonction pure)', () => {
  it('le prochain matricule retient le plus grand commencant par le prefixe de la societe', () => {
    expect(
      calculerProchainMatricule(
        { prefixe: 'EMP', longueur: 5 },
        ['EMP00001', 'EMP00005', 'EMP00003', 'AUT00099']
      )
    ).toBe('EMP00006');
  });

  it('le prochain matricule ignore les matricules d une autre societe', () => {
    expect(
      calculerProchainMatricule({ prefixe: 'EMP', longueur: 5 }, ['XYZ00099'])
    ).toBe('EMP00001');
  });

  it('un matricule de salarie supprime n est jamais reutilise', () => {
    const supprime = 'EMP00001';
    expect(
      calculerProchainMatricule({ prefixe: 'EMP', longueur: 5 }, [supprime])
    ).toBe('EMP00002');
  });

  it('un matricule de salarie sorti n est jamais reutilise', () => {
    expect(
      calculerProchainMatricule({ prefixe: 'EMP', longueur: 5 }, ['EMP00012'])
    ).toBe('EMP00013');
  });

  it('la longueur parametree s applique a la generation automatique', () => {
    expect(
      calculerProchainMatricule({ prefixe: 'E', longueur: 3 }, [])
    ).toBe('E001');
  });

  it('la saisie manuelle accepte une longueur differente de la longueur parametree', () => {
    const manuel = 'EMP123456789';
    expect(manuel.length).toBeGreaterThan(5);
    expect(
      calculerProchainMatricule({ prefixe: 'EMP', longueur: 5 }, [manuel])
    ).toBe('EMP123456790');
  });
});

describe('numero d ordre emploi (fonction pure)', () => {
  it('le numero d ordre d un emploi n est jamais reutilise apres suppression', () => {
    expect(calculerProchainNumeroOrdre([1])).toBe(2);
  });
});

describe('historisation par moisEffet (blocs emploi)', () => {
  const versions = [
    { moisEffet: '2025-01', libellePoste: 'Junior' },
    { moisEffet: '2025-07', libellePoste: 'Senior' },
  ];

  it('la version applicable a un mois donne est la plus recente dont le mois d effet lui est anterieur ou egal', () => {
    expect(resoudreLigneHistorique(versions, '2025-03')?.libellePoste).toBe('Junior');
    expect(resoudreLigneHistorique(versions, '2025-07')?.libellePoste).toBe('Senior');
    expect(resoudreLigneHistorique(versions, '2025-12')?.libellePoste).toBe('Senior');
  });
});

describe('historisation temporelle (lignes repetables)', () => {
  const personne = {
    moisEffetDebut: '2025-01',
    moisEffetFin: '2025-06' as string | null,
    prenom: 'Leila',
  };

  it('une ligne de personne a charge close par un mois de fin n est plus applicable ensuite', () => {
    expect(ligneCloseAvantMois(personne, '2025-07')).toBe(true);
    expect(resoudreLigneTemporelle([personne], '2025-07')).toBeNull();
  });

  const pret = {
    moisEffetDebut: '2025-01',
    moisEffetFin: '2025-06' as string | null,
    libelleObjet: 'Pret logement',
  };

  it('une ligne de pret close par un mois de fin reste lisible pour un mois anterieur', () => {
    expect(ligneLisiblePourMois(pret, '2025-03')).toBe(true);
    expect(ligneLisiblePourMois(pret, '2025-07')).toBe(false);
  });
});
