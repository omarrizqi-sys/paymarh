import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import { PermissionServiceProvisoire } from './permission.service.provisoire.js';

const contexte: TenantContext = {
  userId: 'u1',
  role: 'ACCOUNT_ADMIN',
  accountId: 'a1',
  companyId: null,
};

describe('PermissionServiceProvisoire', () => {
  const service = new PermissionServiceProvisoire();

  it('accorde toutes les permissions par defaut en developpement', () => {
    expect(service.possedePermission(contexte, 'salarie.lire')).toBe(true);
    expect(service.possedePermission(contexte, 'salarie.remuneration.lire')).toBe(true);
  });

  it('refuse les permissions listees dans l en-tete de developpement', () => {
    const refusees = new Set(['salarie.remuneration.lire', 'salarie.lire']);
    expect(service.possedePermission(contexte, 'salarie.remuneration.lire', refusees)).toBe(false);
    expect(service.possedePermission(contexte, 'salarie.lire', refusees)).toBe(false);
    expect(service.possedePermission(contexte, 'salarie.modifier', refusees)).toBe(true);
  });

  it('ignore l en-tete de permissions refusees en production', () => {
    const precedent = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const refusees = new Set(['salarie.remuneration.lire']);
      expect(service.possedePermission(contexte, 'salarie.remuneration.lire', refusees)).toBe(true);
    } finally {
      process.env.NODE_ENV = precedent;
    }
  });
});
