import { describe, expect, it } from 'vitest';
import {
  composerPhraseHeritage,
  phraseHeritageBoolean,
  phraseHeritageDuree,
  phraseHeritageGrilleHoraire,
  phraseHeritageMontant,
} from './heritage-emploi';

describe('heritage emploi', () => {
  it('compose la phrase avec le niveau et le libelle d entite', () => {
    expect(composerPhraseHeritage('44 h', 'ETABLISSEMENT', 'Casablanca')).toBe(
      '44 h — établissement Casablanca'
    );
  });

  it('aucune valeur heritee : cle presente a null', () => {
    expect(phraseHeritageDuree(null)).toBeNull();
    expect(phraseHeritageMontant(null)).toBeNull();
    expect(phraseHeritageBoolean(null)).toBeNull();
  });

  it('resolution masquee : cle absente', () => {
    expect(phraseHeritageMontant(undefined)).toBeNull();
    expect(phraseHeritageBoolean(undefined)).toBeNull();
  });

  it('formate un montant herite', () => {
    expect(
      phraseHeritageMontant({
        valeur: '1500.5',
        origine: 'ETABLISSEMENT',
        libelleEntite: 'Casablanca',
      })
    ).toBe('1\u202f500,50 — établissement Casablanca');
  });

  it('formate une grille horaire heritee', () => {
    expect(
      phraseHeritageGrilleHoraire({
        valeur: [{ jourSemaine: 'LUNDI', typeHeureId: 'n', nombreHeures: '8' }],
        origine: 'ETABLISSEMENT',
        libelleEntite: 'Siège',
      })
    ).toBe('1 ligne de grille horaire — établissement Siège');
  });

  it('distingue absent et null pour l indemnite de teletravail', () => {
    const sansDroit = phraseHeritageBoolean(undefined);
    const sansValeur = phraseHeritageBoolean(null);
    expect(sansDroit).toBeNull();
    expect(sansValeur).toBeNull();
    expect(sansDroit === sansValeur).toBe(true);
  });
});
