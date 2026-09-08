import { describe, expect, it } from 'vitest';
import { afficherSoldeRestant, depuisServeur, estModifieeContreReference } from './prets-lignes';
import type { LignePretLocale } from './prets-lignes';

function ligne(surcharges: Partial<LignePretLocale> = {}): LignePretLocale {
  return {
    id: 'pret-1',
    libelleObjet: 'Avance',
    libelleBulletin: 'PRET',
    montantTotal: '1000.00',
    moisDebut: '2026-01',
    mensualite: '100.00',
    nombreEcheances: 10,
    soldeRestant: '1000.00',
    etat: 'ACTIVE',
    moisEffetFin: null,
    ...surcharges,
  };
}

describe('prets-lignes', () => {
  it('T39 — afficherSoldeRestant vide sur ligne modifiee non enregistree', () => {
    const ref = ligne();
    const modifiee = ligne({ mensualite: '90.00' });
    expect(afficherSoldeRestant(modifiee, ref)).toBe('');
  });

  it('T40 — afficherSoldeRestant affiche la valeur serveur sur ligne inchangee', () => {
    const ref = ligne();
    expect(afficherSoldeRestant(ref, ref)).toBe('1000.00');
  });

  it('T41 — depuisServeur conserve soldeRestant sans recalcul', () => {
    const locale = depuisServeur({
      id: 'pret-1',
      libelleObjet: 'X',
      libelleBulletin: 'PRET',
      montantTotal: '500.00',
      moisDebut: '2026-02',
      mensualite: '50.00',
      nombreEcheances: 10,
      soldeRestant: '500.00',
      moisEffetDebut: '2026-02',
      moisEffetFin: null,
      etat: 'ACTIVE',
    });
    expect(locale.soldeRestant).toBe('500.00');
  });

  it('T60 — estModifieeContreReference detecte une ligne non enregistree', () => {
    const ref = [ligne()];
    const courant = [...ref, ligne({ id: 'local-1', etat: 'NON_ENREGISTREE', soldeRestant: '' })];
    expect(estModifieeContreReference(courant, ref)).toBe(true);
  });
});
