import { describe, expect, it } from 'vitest';
import { assertPresent, ValidationBloquanteError } from './validation-fiche.js';

describe('champs obligatoires — refus des valeurs absentes ou nulles', () => {
  it('refuse matriculeLongueur absent ou nul', () => {
    expect(() => assertPresent(undefined, 'matriculeLongueur')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent(null, 'matriculeLongueur')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent(5, 'matriculeLongueur')).not.toThrow();
  });

  it('refuse jourReposHebdomadaire absent ou nul', () => {
    expect(() => assertPresent(undefined, 'jourReposHebdomadaire')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent(null, 'jourReposHebdomadaire')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent('DIMANCHE', 'jourReposHebdomadaire')).not.toThrow();
  });

  it('refuse moisClotureConges absent ou nul', () => {
    expect(() => assertPresent(undefined, 'moisClotureConges')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent(null, 'moisClotureConges')).toThrow(ValidationBloquanteError);
    expect(() => assertPresent(12, 'moisClotureConges')).not.toThrow();
  });

  it('refuse calculAutoAbsencesEntreesSorties absent ou nul mais accepte false', () => {
    expect(() => assertPresent(undefined, 'calculAutoAbsencesEntreesSorties')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertPresent(null, 'calculAutoAbsencesEntreesSorties')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertPresent(false, 'calculAutoAbsencesEntreesSorties')).not.toThrow();
    expect(() => assertPresent(true, 'calculAutoAbsencesEntreesSorties')).not.toThrow();
  });
});
