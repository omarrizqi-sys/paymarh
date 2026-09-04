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
      dateSortie: null,
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
      dateSortie: null,
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
      dateSortie: datePassee,
    });
  });

  it('sans aucun emploi : inactif, poste null, nombreEmploisOuverts 0, etablissement null', () => {
    expect(deduireLigneListeSalarie([])).toEqual({
      etat: 'INACTIF',
      poste: null,
      nombreEmploisOuverts: 0,
      etablissement: null,
      dateSortie: null,
    });
  });

  it('choisit l emploi clos le plus recent (poste et dateSortie) quand plusieurs emplois clos', () => {
    expect(
      deduireLigneListeSalarie([
        emploi({
          libellePoste: 'Premier',
          dateSortie: new Date('2024-03-10'),
          etablissement: { id: 'a', libelle: 'A' },
        }),
        emploi({
          libellePoste: 'Milieu',
          dateSortie: new Date('2025-06-30'),
          etablissement: { id: 'b', libelle: 'B' },
        }),
        emploi({
          libellePoste: 'Troisieme',
          dateSortie: new Date('2023-01-15'),
          etablissement: { id: 'c', libelle: 'C' },
        }),
      ])
    ).toEqual({
      etat: 'INACTIF',
      poste: 'Milieu',
      nombreEmploisOuverts: 0,
      etablissement: { id: 'b', libelle: 'B' },
      dateSortie: new Date('2025-06-30'),
    });
  });
});

describe('emploiEstOuvert', () => {
  it('considere ouvert sans date de sortie', () => {
    expect(emploiEstOuvert(null, new Date('2025-07-01'))).toBe(true);
  });
});
