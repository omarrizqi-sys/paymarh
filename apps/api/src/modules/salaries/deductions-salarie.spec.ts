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
    etablissement: { id: 'etab-1', libelle: 'Siege' },
    ...surcharges,
  };
}

describe('deduireLigneListeSalarie', () => {
  it('rend poste, nombreEmploisOuverts 1 et etablissement pour un seul emploi ouvert', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Comptable',
          etablissement: { id: 'etab-casa', libelle: 'Casablanca' },
        }),
      ])
    ).toEqual({
      etat: 'ACTIF',
      poste: 'Comptable',
      nombreEmploisOuverts: 1,
      etablissement: { id: 'etab-casa', libelle: 'Casablanca' },
    });
  });

  it('rend poste null, nombreEmploisOuverts 2 et etablissement null pour deux emplois ouverts', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({ libellePoste: 'Comptable' }),
        emploi({ libellePoste: 'Assistant' }),
      ])
    ).toEqual({
      etat: 'ACTIF',
      poste: null,
      nombreEmploisOuverts: 2,
      etablissement: null,
    });
  });

  it('rend le poste du dernier emploi clos avec nombreEmploisOuverts 0', () => {
    const datePassee = new Date('2020-01-01');
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Ancien poste',
          dateSortie: datePassee,
          etablissement: { id: 'etab-rabat', libelle: 'Rabat' },
        }),
      ])
    ).toEqual({
      etat: 'INACTIF',
      poste: 'Ancien poste',
      nombreEmploisOuverts: 0,
      etablissement: { id: 'etab-rabat', libelle: 'Rabat' },
    });
  });

  it('sans aucun emploi : inactif, poste null, nombreEmploisOuverts 0, etablissement null', () => {
    expect(deduireLigneListeSalarie([])).toEqual({
      etat: 'INACTIF',
      poste: null,
      nombreEmploisOuverts: 0,
      etablissement: null,
    });
  });

  it('choisit le dernier emploi clos quand plusieurs emplois clos', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Premier',
          dateSortie: new Date('2019-06-01'),
          etablissement: { id: 'a', libelle: 'A' },
        }),
        emploi({
          libellePoste: 'Dernier',
          dateSortie: new Date('2021-03-01'),
          etablissement: { id: 'b', libelle: 'B' },
        }),
      ])
    ).toEqual({
      etat: 'INACTIF',
      poste: 'Dernier',
      nombreEmploisOuverts: 0,
      etablissement: { id: 'b', libelle: 'B' },
    });
  });
});

describe('emploiEstOuvert', () => {
  it('considere ouvert sans date de sortie', () => {
    expect(emploiEstOuvert(null, new Date('2025-07-01'))).toBe(true);
  });
});
