import { describe, expect, it } from 'vitest';
import {
  composerPhraseHeritage,
  phraseHeritageBoolean,
  phraseHeritageDuree,
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

  it('distingue absent et null pour l indemnite de teletravail', () => {
    const sansDroit = phraseHeritageBoolean(undefined);
    const sansValeur = phraseHeritageBoolean(null);
    expect(sansDroit).toBeNull();
    expect(sansValeur).toBeNull();
    expect(sansDroit === sansValeur).toBe(true);
  });
});
