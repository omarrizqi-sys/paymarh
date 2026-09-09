import { describe, expect, it } from 'vitest';
import {
  estModifieeContreReferenceTableau,
  type LigneTableauHistoriseBase,
} from './lignes-tableau-historise-commun';

interface LigneTest extends LigneTableauHistoriseBase {
  readonly valeur: string;
}

function ligne(id: string, surcharges: Partial<LigneTest> = {}): LigneTest {
  return {
    id,
    etat: 'ACTIVE',
    moisEffetFin: null,
    valeur: 'identique',
    ...surcharges,
  };
}

function lignesEgales(a: LigneTest, b: LigneTest): boolean {
  return a.valeur === b.valeur;
}

describe('estModifieeContreReferenceTableau', () => {
  it('une ligne non enregistree dans le courant compte comme modification', () => {
    const reference = [ligne('a')];
    const courant = [...reference, ligne('local-1', { etat: 'NON_ENREGISTREE' })];
    expect(estModifieeContreReferenceTableau(courant, reference, lignesEgales)).toBe(true);
  });

  it('une ligne ACTIVE de la reference absente du courant compte comme modification', () => {
    const reference = [ligne('a'), ligne('b')];
    const courant = [ligne('a')];
    expect(estModifieeContreReferenceTableau(courant, reference, lignesEgales)).toBe(true);
  });

  it('une ligne enregistree dont les valeurs different de sa reference compte comme modification', () => {
    const reference = [ligne('a', { valeur: 'origine' })];
    const courant = [ligne('a', { valeur: 'saisie' })];
    expect(estModifieeContreReferenceTableau(courant, reference, lignesEgales)).toBe(true);
  });

  it('deux listes identiques ne comptent pas comme modification', () => {
    const lignes = [ligne('a'), ligne('b')];
    expect(estModifieeContreReferenceTableau(lignes, lignes, lignesEgales)).toBe(false);
  });

  it('une ligne PAS_ENCORE_EFFECTIVE de la reference absente du courant ne compte pas', () => {
    const reference = [ligne('a'), ligne('b', { etat: 'PAS_ENCORE_EFFECTIVE' })];
    const courant = [ligne('a')];
    expect(estModifieeContreReferenceTableau(courant, reference, lignesEgales)).toBe(false);
  });
});
