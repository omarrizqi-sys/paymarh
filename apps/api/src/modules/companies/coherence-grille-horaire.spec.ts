import { describe, expect, it } from 'vitest';
import {
  controlerCoherenceGrilleHoraireDefaut,
  sommerGrilleHoraireDefaut,
} from './coherence-grille-horaire.js';
import { ValidationBloquanteError } from './validation-fiche.js';

describe('coherence grille horaire', () => {
  it('recalcule le total a partir des lignes', () => {
    const total = sommerGrilleHoraireDefaut([
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '8' },
      { jourSemaine: 'MARDI', typeHeureId: 'a', nombreHeures: '8' },
      { jourSemaine: 'MERCREDI', typeHeureId: 'a', nombreHeures: '8' },
    ]);
    expect(total.toString()).toBe('24');
  });

  it('accepte un totalControle coherent avec la somme recalculee', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '7' },
      { jourSemaine: 'MARDI', typeHeureId: 'a', nombreHeures: '7' },
    ];
    expect(
      controlerCoherenceGrilleHoraireDefaut(lignes, { totalControleDeclare: '14' }).toString()
    ).toBe('14');
  });

  it('refuse un totalControle qui ne correspond pas aux lignes', () => {
    const lignes = [{ jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '7' }];
    expect(() =>
      controlerCoherenceGrilleHoraireDefaut(lignes, { totalControleDeclare: '99' })
    ).toThrow(ValidationBloquanteError);
  });

  it('refuse une grille incoherente avec la duree hebdomadaire sans totalControle', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '8' },
      { jourSemaine: 'MARDI', typeHeureId: 'a', nombreHeures: '8' },
    ];
    expect(() =>
      controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '44' })
    ).toThrow(ValidationBloquanteError);
    try {
      controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '44' });
    } catch (e) {
      expect((e as ValidationBloquanteError).code).toBe('GRILLE_TOTAL_INCOHERENT');
    }
  });

  it('accepte une grille dont le total correspond a la duree hebdomadaire', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '22' },
      { jourSemaine: 'MARDI', typeHeureId: 'a', nombreHeures: '22' },
    ];
    expect(
      controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '44' }).toString()
    ).toBe('44');
  });

  it('refuse les lignes en double', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '7' },
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '8' },
    ];
    expect(() => controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '15' })).toThrow(
      ValidationBloquanteError
    );
  });

  it('verifie la coherence avec une duree de reference externe (ex. valeur deja enregistree)', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '8' },
      { jourSemaine: 'MARDI', typeHeureId: 'a', nombreHeures: '8' },
    ];
    expect(() =>
      controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '44' })
    ).toThrow(ValidationBloquanteError);
    expect(
      controlerCoherenceGrilleHoraireDefaut(lignes, { dureeHebdomadaire: '16' }).toString()
    ).toBe('16');
  });
});
