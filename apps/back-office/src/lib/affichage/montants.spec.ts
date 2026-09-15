import { describe, expect, it } from 'vitest';
import { afficherMontant } from './montants';

describe('afficherMontant', () => {
  it('formate un montant avec deux decimales', () => {
    expect(afficherMontant('12000')).toBe('12\u202f000,00');
    expect(afficherMontant('12000.5')).toBe('12\u202f000,50');
  });

  it('case vide ou null → case vide', () => {
    expect(afficherMontant(null)).toBe('');
    expect(afficherMontant('')).toBe('');
  });
});
