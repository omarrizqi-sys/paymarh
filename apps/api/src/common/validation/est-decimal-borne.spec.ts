import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CONTRAINTE_DECIMAL_BORNE, EstDecimalBorne } from './est-decimal-borne.js';

class Montant14x2 {
  @EstDecimalBorne(12)
  valeur!: unknown;
}

function refuse(valeur: unknown): boolean {
  const objet = Object.assign(new Montant14x2(), { valeur });
  return validateSync(objet).some(
    (erreur) => erreur.constraints?.[CONTRAINTE_DECIMAL_BORNE] !== undefined
  );
}

describe('EstDecimalBorne', () => {
  it.each(['0', '12000', '12000.5', '12000.50', '999999999999.99'])('accepte %s', (valeur) => {
    expect(refuse(valeur)).toBe(false);
  });

  it.each([
    ['chaine vide', ''],
    ['non numerique', 'abc'],
    ['troisieme decimale', '12000.505'],
    ['partie entiere trop longue', '1000000000000'],
    ['signe moins', '-1'],
    ['signe plus', '+1'],
    ['exposant', '1e3'],
    ['virgule', '12000,5'],
    ['point final', '12.'],
    ['nombre JSON', 12000],
  ])('refuse : %s', (_, valeur) => {
    expect(refuse(valeur)).toBe(true);
  });
});
