import { describe, expect, it } from 'vitest';
import { afficherDate } from './dates';

describe('afficherDate', () => {
  it('DT03 — date valide en JJ/MM/AAAA, date vide ou null en case vide', () => {
    expect(afficherDate('2022-03-01')).toBe('01/03/2022');
    expect(afficherDate('2024-12-31T00:00:00.000Z')).toBe('31/12/2024');
    expect(afficherDate('')).toBe('');
    expect(afficherDate(null)).toBe('');
    expect(afficherDate(undefined)).toBe('');
  });
});
