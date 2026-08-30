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
    expect(controlerCoherenceGrilleHoraireDefaut(lignes, '14').toString()).toBe('14');
  });

  it('refuse un totalControle qui ne correspond pas aux lignes', () => {
    const lignes = [{ jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '7' }];
    expect(() => controlerCoherenceGrilleHoraireDefaut(lignes, '99')).toThrow(ValidationBloquanteError);
    try {
      controlerCoherenceGrilleHoraireDefaut(lignes, '99');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationBloquanteError);
      expect((e as ValidationBloquanteError).code).toBe('GRILLE_TOTAL_INCOHERENT');
    }
  });

  it('refuse les lignes en double', () => {
    const lignes = [
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '7' },
      { jourSemaine: 'LUNDI', typeHeureId: 'a', nombreHeures: '8' },
    ];
    expect(() => controlerCoherenceGrilleHoraireDefaut(lignes)).toThrow(ValidationBloquanteError);
  });
});
