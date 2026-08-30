import { describe, expect, it } from 'vitest';
import {
  afficherDateInactivite,
  afficherDatesExoneration,
  afficherFormatCodePostalMaroc,
  afficherIndemniteTeletravailVersee,
  afficherMontantIndemniteTeletravail,
  afficherUtiliseParCompte,
} from './conditions';

describe('conditions d affichage fiche societe', () => {
  it('affiche la date d inactivite seulement si inactive', () => {
    expect(afficherDateInactivite('INACTIVE')).toBe(true);
    expect(afficherDateInactivite('EN_PRODUCTION')).toBe(false);
  });

  it('affiche les dates d exoneration si un type est choisi', () => {
    expect(afficherDatesExoneration('uuid')).toBe(true);
    expect(afficherDatesExoneration(null)).toBe(false);
    expect(afficherDatesExoneration('')).toBe(false);
  });

  it('conserve les dates quand l exoneration est retiree (champs caches, pas effaces)', () => {
    expect(afficherDatesExoneration(null)).toBe(false);
    expect(afficherDatesExoneration(undefined)).toBe(false);
  });

  it('masque Utilise par avec un seul etablissement', () => {
    expect(afficherUtiliseParCompte(1)).toBe(false);
    expect(afficherUtiliseParCompte(2)).toBe(true);
  });

  it('affiche le format code postal marocain seulement pour MA', () => {
    expect(afficherFormatCodePostalMaroc('MA')).toBe(true);
    expect(afficherFormatCodePostalMaroc('FR')).toBe(false);
  });

  it('enchaine teletravail → indemnite → montant', () => {
    expect(afficherIndemniteTeletravailVersee(true)).toBe(true);
    expect(afficherIndemniteTeletravailVersee(false)).toBe(false);
    expect(afficherMontantIndemniteTeletravail(true, true)).toBe(true);
    expect(afficherMontantIndemniteTeletravail(true, false)).toBe(false);
  });
});
