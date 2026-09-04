import { describe, expect, it } from 'vitest';
import { afficherPosteListe } from './poste-liste-salarie';

describe('afficherPosteListe', () => {
  it('affiche le libelle quand un seul emploi ouvert', () => {
    expect(afficherPosteListe({ poste: 'Analyste paie', nombreEmploisOuverts: 1 })).toBe(
      'Analyste paie'
    );
  });

  it('affiche N emplois quand deux emplois ouverts ou plus', () => {
    expect(afficherPosteListe({ poste: 'Analyste paie', nombreEmploisOuverts: 2 })).toBe(
      '2 emplois'
    );
    expect(afficherPosteListe({ poste: null, nombreEmploisOuverts: 3 })).toBe('3 emplois');
  });

  it('affiche une chaine vide pour un salarie sans aucun emploi', () => {
    expect(afficherPosteListe({ poste: null, nombreEmploisOuverts: 0 })).toBe('');
  });

  it('un salarie sorti affiche le poste de son dernier emploi clos', () => {
    expect(afficherPosteListe({ poste: 'Analyste paie', nombreEmploisOuverts: 0 })).toBe(
      'Analyste paie'
    );
  });
});
