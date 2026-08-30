import { describe, expect, it } from 'vitest';
import { inventaireImpactEtablissement, inventaireImpactSociete } from './inventaire';

describe('inventaire d impact', () => {
  it('affiche les quantites pour une societe', () => {
    const lignes = inventaireImpactSociete({
      etablissements: 2,
      comptesBancaires: 1,
      parametragesHistoriquesSociete: 3,
      parametragesHistoriquesEtablissement: 4,
      jetonConfirmation: 'abc',
    });
    expect(lignes.find((l) => l.libelle.includes('Etablissements'))?.quantite).toBe(2);
    expect(lignes.every((l) => typeof l.quantite === 'number')).toBe(true);
  });

  it('enumere les comptes detaches pour un etablissement', () => {
    const lignes = inventaireImpactEtablissement({
      estPrincipal: false,
      comptesBancairesRattaches: [{ id: '1', libelle: 'Compte A' }],
      parametragesHistoriques: 2,
      jetonConfirmation: 'xyz',
    });
    expect(lignes.find((l) => l.libelle.includes('detaches'))?.quantite).toBe(1);
  });
});
