import { describe, expect, it } from 'vitest';
import {
  contientRubriqueMasquee,
  retirerRubriquesMasquees,
  RUBRIQUES_REMUNERATION,
} from './rubriques-remuneration.js';

describe('masquage remuneration — rubriques declaratives', () => {
  const masquees = new Set(Object.values(RUBRIQUES_REMUNERATION));

  it('retire les cles de rubriques masquees sans les mettre a null', () => {
    const entree = {
      nom: 'Alami',
      remuneration: { montant: '10000' },
      paiement: { mode: 'VIREMENT' },
      comptesBancaires: [{ rib: '007' }],
    };

    const sortie = retirerRubriquesMasquees(entree, masquees);
    expect(sortie).toEqual({ nom: 'Alami' });
    expect('remuneration' in sortie).toBe(false);
    expect('paiement' in sortie).toBe(false);
    expect('comptesBancaires' in sortie).toBe(false);
  });

  it('detecte une rubrique masquee dans le corps d ecriture', () => {
    expect(contientRubriqueMasquee({ remuneration: { x: 1 } }, masquees)).toBe(true);
    expect(contientRubriqueMasquee({ nom: 'Test' }, masquees)).toBe(false);
  });
});
