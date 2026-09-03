import { describe, expect, it } from 'vitest';
import {
  assertChampObligatoire,
  assertPresent,
  ValidationBloquanteError,
} from './validation-fiche.js';

describe('champs obligatoires — refus des valeurs absentes ou nulles', () => {
  it('refuse matriculeLongueur absent, nul, vide ou zero', () => {
    expect(() => assertChampObligatoire(undefined, 'matriculeLongueur')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire(null, 'matriculeLongueur')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire('', 'matriculeLongueur')).toThrow(ValidationBloquanteError);
    expect(() => assertChampObligatoire(0, 'matriculeLongueur')).toThrow(ValidationBloquanteError);
    expect(() => assertChampObligatoire(5, 'matriculeLongueur')).not.toThrow();
  });

  it('refuse jourReposHebdomadaire absent, nul ou vide', () => {
    expect(() => assertChampObligatoire(undefined, 'jourReposHebdomadaire')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire(null, 'jourReposHebdomadaire')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire('', 'jourReposHebdomadaire')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire('DIMANCHE', 'jourReposHebdomadaire')).not.toThrow();
  });

  it('refuse moisClotureConges absent, nul ou zero', () => {
    expect(() => assertChampObligatoire(undefined, 'moisClotureConges')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire(null, 'moisClotureConges')).toThrow(
      ValidationBloquanteError
    );
    expect(() => assertChampObligatoire(0, 'moisClotureConges')).toThrow(ValidationBloquanteError);
    expect(() => assertChampObligatoire(12, 'moisClotureConges')).not.toThrow();
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
