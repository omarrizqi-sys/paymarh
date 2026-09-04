import { describe, expect, it } from 'vitest';
import {
  deduireLigneListeSalarie,
  emploiEstOuvert,
  type EmploiPourDeductionListe,
} from './deductions-salarie.js';

function emploi(
  surcharges: Partial<EmploiPourDeductionListe> & Pick<EmploiPourDeductionListe, 'libellePoste'>
): EmploiPourDeductionListe {
  return {
    dateSortie: null,
    etablissementNom: 'Siege',
    ...surcharges,
  };
}

describe('deduireLigneListeSalarie', () => {
  it('affiche le poste et l etablissement d un seul emploi ouvert', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({ libellePoste: 'Comptable', etablissementNom: 'Casablanca' }),
      ])
    ).toEqual({
      etat: 'ACTIF',
      poste: 'Comptable',
      etablissement: 'Casablanca',
    });
  });

  it('affiche N emplois sans etablissement quand plusieurs emplois ouverts', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({ libellePoste: 'Comptable' }),
        emploi({ libellePoste: 'Assistant' }),
      ])
    ).toEqual({
      etat: 'ACTIF',
      poste: '2 emplois',
      etablissement: null,
    });
  });

  it('affiche le poste du dernier emploi clos quand aucun emploi ouvert', () => {
    const datePassee = new Date('2020-01-01');
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Ancien poste',
          dateSortie: datePassee,
          etablissementNom: 'Rabat',
        }),
      ])
    ).toEqual({
      etat: 'INACTIF',
      poste: 'Ancien poste',
      etablissement: 'Rabat',
    });
  });

  it('sans aucun emploi : inactif, ni poste ni etablissement', () => {
    expect(deduireLigneListeSalarie([])).toEqual({
      etat: 'INACTIF',
      poste: null,
      etablissement: null,
    });
  });

  it('choisit le dernier emploi clos quand plusieurs emplois clos', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Premier',
          dateSortie: new Date('2019-06-01'),
          etablissementNom: 'A',
        }),
        emploi({
          libellePoste: 'Dernier',
          dateSortie: new Date('2021-03-01'),
          etablissementNom: 'B',
        }),
      ])
    ).toEqual({
      etat: 'INACTIF',
      poste: 'Dernier',
      etablissement: 'B',
    });
  });
});

describe('emploiEstOuvert', () => {
  it('considere ouvert sans date de sortie', () => {
    expect(emploiEstOuvert(null, new Date('2025-07-01'))).toBe(true);
  });
});
