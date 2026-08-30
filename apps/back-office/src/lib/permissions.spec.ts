import { describe, expect, it } from 'vitest';
import { possedePermission } from './permissions';

describe('permissions affichees par l API', () => {
  it('masque une action si la permission manque', () => {
    expect(possedePermission(['societe.lire'], 'societe.creer')).toBe(false);
    expect(possedePermission(['societe.lire', 'societe.creer'], 'societe.creer')).toBe(true);
  });
});
