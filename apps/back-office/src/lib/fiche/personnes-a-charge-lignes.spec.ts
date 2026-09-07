import { describe, expect, it } from 'vitest';
import {
  creerLigneVide,
  estModifieeContreReference,
  libelleEtatLigne,
  reinitialiserCompteurIdLocal,
  trierAffichage,
  type LignePersonneAChargeLocale,
} from './personnes-a-charge-lignes';

function ref(
  id: string,
  surcharges: Partial<LignePersonneAChargeLocale> = {}
): LignePersonneAChargeLocale {
  return {
    id,
    lienParenteCode: 'ENFANT',
    prenom: 'Sara',
    nom: 'Benali',
    sexe: 'FEMME',
    dateNaissance: '2015-01-01',
    situationHandicap: false,
    aCharge: true,
    etat: 'ACTIVE',
    moisEffetFin: null,
    ...surcharges,
  };
}

describe('personnes-a-charge — registre et envoi', () => {
  it('T12 — estModifiee faux au chargement, vrai apres modification, faux apres reinit', () => {
    const initial = [ref('l1')];
    expect(estModifieeContreReference(initial, initial)).toBe(false);
    const modifie = [ref('l1', { prenom: 'Lina' })];
    expect(estModifieeContreReference(modifie, initial)).toBe(true);
    expect(estModifieeContreReference(initial, initial)).toBe(false);
  });

  it('trierAffichage place les non enregistrees en dernier', () => {
    reinitialiserCompteurIdLocal();
    const lignes = [
      ref('l2', { dateNaissance: '2020-01-01' }),
      creerLigneVide(),
      ref('l1', { dateNaissance: '2010-01-01' }),
    ];
    const ordre = trierAffichage(lignes).map((l) => l.id);
    expect(ordre[ordre.length - 1]).toMatch(/^local-/);
    expect(ordre[0]).toBe('l1');
  });

  it('T17 — reinitialiser ramene aux valeurs du dernier enregistrement reussi', () => {
    const dernierEnregistrement = [ref('l1', { prenom: 'Enregistre' })];
    const courantApresSaisie = [ref('l1', { prenom: 'Brouillon' })];
    expect(estModifieeContreReference(courantApresSaisie, dernierEnregistrement)).toBe(true);
    expect(estModifieeContreReference(dernierEnregistrement, dernierEnregistrement)).toBe(false);
  });

  it('libelleEtatLigne formate une ligne inactive avec mois de fin', () => {
    const inactive = ref('l1', { etat: 'INACTIVE', moisEffetFin: '2026-08' });
    expect(libelleEtatLigne(inactive)).toBe('inactive depuis 08/2026');
  });
});
