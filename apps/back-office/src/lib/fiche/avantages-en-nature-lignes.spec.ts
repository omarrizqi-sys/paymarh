import { describe, expect, it } from 'vitest';
import {
  afficherMoisApplication,
  creerLigneVide,
  estModifieeContreReference,
  libelleEtatLigne,
  reinitialiserCompteurIdLocal,
  trierAffichage,
  type LigneAvantageEnNatureLocale,
} from './avantages-en-nature-lignes';

function ref(
  id: string,
  surcharges: Partial<LigneAvantageEnNatureLocale> = {}
): LigneAvantageEnNatureLocale {
  return {
    id,
    natureRef: 'B02',
    montant: '5000.00',
    moisApplication: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    moisEffetDebut: '2022-03',
    etat: 'ACTIVE',
    moisEffetFin: null,
    ...surcharges,
  };
}

describe('avantages-en-nature — lignes', () => {
  it('AN-L01 — estModifiee faux au chargement, vrai apres modification', () => {
    const initial = [ref('l1')];
    expect(estModifieeContreReference(initial, initial)).toBe(false);
    const modifie = [ref('l1', { montant: '6000.00' })];
    expect(estModifieeContreReference(modifie, initial)).toBe(true);
  });

  it('AN-L05 — estModifiee vrai apres changement de mois d application', () => {
    const initial = [ref('l1')];
    const modifie = [ref('l1', { moisApplication: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12] })];
    expect(estModifieeContreReference(modifie, initial)).toBe(true);
  });

  it('AN-L02 — trierAffichage place les non enregistrees en dernier sans trier les enregistrees', () => {
    reinitialiserCompteurIdLocal();
    const lignes = [ref('l2'), creerLigneVide('B01'), ref('l1')];
    const ordre = trierAffichage(lignes).map((l) => l.id);
    expect(ordre.slice(0, 2)).toEqual(['l2', 'l1']);
    expect(ordre[ordre.length - 1]).toMatch(/^local-/);
  });

  it('AN-L03 — afficherMoisApplication : tous les mois, liste abregee, vide', () => {
    expect(afficherMoisApplication([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe('Tous les mois');
    expect(afficherMoisApplication([1, 6, 12])).toBe('Janv., Juin, Déc.');
    expect(afficherMoisApplication([])).toBe('');
  });

  it('AN-L04 — libelleEtatLigne formate une ligne inactive avec mois de fin', () => {
    const cloturee = ref('l1', { etat: 'CLOTUREE', moisEffetFin: '2022-02' });
    expect(libelleEtatLigne(cloturee)).toBe('inactive depuis 02/2022');
  });
});
