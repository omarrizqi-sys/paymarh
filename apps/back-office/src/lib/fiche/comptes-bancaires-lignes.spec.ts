import { describe, expect, it, beforeEach } from 'vitest';
import {
  reinitialiserCompteurIdLocalCompte,
  versCorpsLigneEnvoi,
  type LigneCompteBancaireLocale,
} from './comptes-bancaires-lignes';

function ligne(surcharges: Partial<LigneCompteBancaireLocale> = {}): LigneCompteBancaireLocale {
  return {
    id: 'cpt-1',
    banqueId: null,
    banqueLibreSaisie: null,
    rib: '',
    iban: '',
    bic: '',
    titulaire: '',
    partVirement: '',
    nonEnregistree: false,
    ...surcharges,
  };
}

describe('comptes-bancaires-lignes — envoi', () => {
  beforeEach(() => {
    reinitialiserCompteurIdLocalCompte();
  });

  it('TB31 — banqueId et banqueLibreSaisie sont exclusifs a l envoi (banqueId prioritaire)', () => {
    const avecId = versCorpsLigneEnvoi(
      ligne({ banqueId: 'bnq-1', banqueLibreSaisie: 'Texte parasite' })
    );
    expect(avecId.banqueId).toBe('bnq-1');
    expect(avecId.banqueLibreSaisie).toBeNull();
  });

  it('TB31 — banqueId et banqueLibreSaisie sont exclusifs a l envoi (libre saisie seule)', () => {
    const avecLibre = versCorpsLigneEnvoi(
      ligne({ banqueId: null, banqueLibreSaisie: '  Banque locale  ' })
    );
    expect(avecLibre.banqueId).toBeNull();
    expect(avecLibre.banqueLibreSaisie).toBe('Banque locale');
  });

  it('TB31 — banqueId et banqueLibreSaisie sont exclusifs a l envoi (aucune banque)', () => {
    const vide = versCorpsLigneEnvoi(ligne({ banqueId: null, banqueLibreSaisie: null }));
    expect(vide.banqueId).toBeNull();
    expect(vide.banqueLibreSaisie).toBeNull();
  });

  it('TB34 — partVirement part exactement tel que tape', () => {
    const corps = versCorpsLigneEnvoi(ligne({ partVirement: '  33,333  ' }));
    expect(corps.partVirement).toBe('  33,333  ');
  });

  it('TB34 — partVirement vide devient null sans conversion ni arrondi', () => {
    const corps = versCorpsLigneEnvoi(ligne({ partVirement: '' }));
    expect(corps.partVirement).toBeNull();
  });
});
