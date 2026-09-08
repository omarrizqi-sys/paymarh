import { describe, expect, it } from 'vitest';
import { collecterAlertePretIncoherent } from './validation-tableaux-salarie.js';
import { Decimal } from 'decimal.js';

describe('validation-tableaux-salarie — alertes pret', () => {
  it('C9 — alerte incoherence pret porte champ mensualite', () => {
    const alerte = collecterAlertePretIncoherent(new Decimal('1000'), new Decimal('90'), 12);
    expect(alerte).not.toBeNull();
    expect(alerte?.champ).toBe('mensualite');
  });
});
