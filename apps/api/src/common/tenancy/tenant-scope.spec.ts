import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import { accountScope, companyScope, crossAccountScope, requireAccountId } from './tenant-scope.js';

// ---------------------------------------------------------------------------
// Ces tests verifient le principe fondateur "aucune fuite entre comptes".
// Ils sont volontairement exhaustifs : c est le seul endroit du depot ou une
// regression signifierait qu un client peut voir les donnees d un autre.
// ---------------------------------------------------------------------------

const COMPTE_A = '11111111-1111-4111-8111-111111111111';
const COMPTE_B = '22222222-2222-4222-8222-222222222222';
const SOCIETE_A = '33333333-3333-4333-8333-333333333333';

function contexte(partiel: Partial<TenantContext> = {}): TenantContext {
  return {
    userId: '99999999-9999-4999-8999-999999999999',
    role: 'MANAGER',
    accountId: COMPTE_A,
    companyId: null,
    ...partiel,
  };
}

describe('accountScope - filtre de niveau 1', () => {
  it('restreint toujours au compte du contexte', () => {
    expect(accountScope(contexte())).toEqual({ accountId: COMPTE_A });
  });

  it('n emprunte jamais l accountId d un autre compte', () => {
    expect(accountScope(contexte({ accountId: COMPTE_B }))).not.toEqual({
      accountId: COMPTE_A,
    });
  });

  it('refuse un contexte sans compte plutot que de renvoyer un filtre vide', () => {
    // Le scenario le plus dangereux : si cette fonction renvoyait `{}`, la
    // requete Prisma remonterait les donnees de TOUS les comptes.
    expect(() => accountScope(contexte({ accountId: null }))).toThrow();
  });
});

describe('requireAccountId - le super-admin ne passe pas par le chemin normal', () => {
  it('refuse un PLATFORM_ADMIN, qui n a pas de compte de rattachement', () => {
    const superAdmin = contexte({ role: 'PLATFORM_ADMIN', accountId: null });

    expect(() => requireAccountId(superAdmin)).toThrow();
  });

  it('applique le meme filtrage a un ACCOUNT_ADMIN qu a un MANAGER', () => {
    // Le role ne donne AUCUN privilege d evasion du tenant : seul le
    // chemin explicite crossAccountScope le permet.
    const administrateur = contexte({ role: 'ACCOUNT_ADMIN' });
    const gestionnaire = contexte({ role: 'MANAGER' });

    expect(requireAccountId(administrateur)).toBe(requireAccountId(gestionnaire));
  });
});

describe('companyScope - double isolation', () => {
  it('exige a la fois le compte et la societe', () => {
    expect(companyScope(contexte({ companyId: SOCIETE_A }))).toEqual({
      accountId: COMPTE_A,
      companyId: SOCIETE_A,
    });
  });

  it('refuse une societe sans compte : un companyId seul ne suffit jamais', () => {
    expect(() => companyScope(contexte({ accountId: null, companyId: SOCIETE_A }))).toThrow();
  });

  it('refuse un compte sans societe active', () => {
    expect(() => companyScope(contexte({ companyId: null }))).toThrow();
  });
});

describe('crossAccountScope - exception documentee du super-admin', () => {
  const superAdmin = contexte({ role: 'PLATFORM_ADMIN', accountId: null });

  it('autorise un PLATFORM_ADMIN muni d un motif', () => {
    expect(
      crossAccountScope(superAdmin, { reason: 'Support client ticket 42', accountId: COMPTE_B })
    ).toEqual({ accountId: COMPTE_B });
  });

  it('refuse tout autre role, meme administrateur de compte', () => {
    expect(() =>
      crossAccountScope(contexte({ role: 'ACCOUNT_ADMIN' }), {
        reason: 'Curiosite',
        accountId: COMPTE_B,
      })
    ).toThrow();
  });

  it('refuse un acces non motive : sans motif, pas de trace exploitable', () => {
    expect(() => crossAccountScope(superAdmin, { reason: '   ', accountId: COMPTE_B })).toThrow();
  });
});
