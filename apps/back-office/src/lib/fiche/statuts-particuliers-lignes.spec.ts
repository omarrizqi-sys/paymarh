import { describe, expect, it } from 'vitest';
import type { StatutParticulierFiche } from '@paymarh/shared-types';
import {
  afficherDateStatutParticulier,
  estLigneStatutParticulierVisibleFiche,
  libelleEtatLigne,
} from './statuts-particuliers-lignes';

function statut(surcharges: Partial<StatutParticulierFiche> = {}): StatutParticulierFiche {
  return {
    id: 'st-1',
    statutCode: 'IDMAJ',
    dateDebut: '2021-06-01',
    dateFin: null,
    origine: 'SAISIE_MANUELLE',
    etat: 'ACTIVE',
    ...surcharges,
  };
}

describe('statuts-particuliers-lignes', () => {
  it('SP-L02 — estLigneStatutParticulierVisibleFiche ecarte PROPAGE_SOCIETE et garde SAISIE_MANUELLE', () => {
    expect(
      estLigneStatutParticulierVisibleFiche(
        statut({ origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' })
      )
    ).toBe(false);
    expect(
      estLigneStatutParticulierVisibleFiche(
        statut({ origine: 'PROPAGE_SOCIETE', statutCode: 'IDMAJ' })
      )
    ).toBe(false);
    expect(
      estLigneStatutParticulierVisibleFiche(
        statut({ origine: 'SAISIE_MANUELLE', statutCode: 'TAHFIZ' })
      )
    ).toBe(true);
    expect(estLigneStatutParticulierVisibleFiche(statut({ origine: 'SAISIE_MANUELLE' }))).toBe(
      true
    );
  });

  it('SP-L04 — afficherDateStatutParticulier formate JJ/MM/AAAA et une fin vide reste vide', () => {
    expect(afficherDateStatutParticulier('2021-06-01')).toBe('01/06/2021');
    expect(afficherDateStatutParticulier('2022-12-31')).toBe('31/12/2022');
    expect(afficherDateStatutParticulier('')).toBe('');
  });

  it('SP-L05 — libelleEtatLigne inactive depuis le mois de fin deduit de la date', () => {
    expect(
      libelleEtatLigne({
        id: 'x',
        statutCode: 'IDMAJ',
        dateDebut: '2021-06-01',
        dateFin: '2022-12-31',
        origine: 'SAISIE_MANUELLE',
        etat: 'CLOTUREE',
        moisEffetFin: '2022-12',
      })
    ).toBe('inactive depuis 12/2022');
  });
});
