import { describe, expect, it } from 'vitest';
import { valeursStructurellementEgales } from './egalite-valeurs';

describe('valeursStructurellementEgales', () => {
  it('ignore l ordre des cles', () => {
    expect(
      valeursStructurellementEgales({ nom: 'A', prenom: 'B' }, { prenom: 'B', nom: 'A' })
    ).toBe(true);
  });

  it('detecte un changement de contenu', () => {
    expect(valeursStructurellementEgales({ nom: 'A' }, { nom: 'B' })).toBe(false);
  });
});
