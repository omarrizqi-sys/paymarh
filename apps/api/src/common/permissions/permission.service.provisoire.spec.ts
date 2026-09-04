import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import { PermissionsRefuseesContext } from './permissions-refusees.context.js';
import { PermissionServiceProvisoire } from './permission.service.provisoire.js';

const contexte: TenantContext = {
  userId: 'u1',
  role: 'ACCOUNT_ADMIN',
  accountId: 'a1',
  companyId: null,
};

describe('PermissionServiceProvisoire', () => {
  const permissionsRefusees = new PermissionsRefuseesContext();
  const service = new PermissionServiceProvisoire(permissionsRefusees);

  it('accorde toutes les permissions par defaut en developpement', () => {
    expect(service.possedePermission(contexte, 'salarie.lire')).toBe(true);
    expect(service.possedePermission(contexte, 'salarie.remuneration.lire')).toBe(true);
  });

  it('refuse les permissions presentes dans le contexte de requete', () => {
    permissionsRefusees.run(new Set(['salarie.remuneration.lire', 'salarie.lire']), () => {
      expect(service.possedePermission(contexte, 'salarie.remuneration.lire')).toBe(false);
      expect(service.possedePermission(contexte, 'salarie.lire')).toBe(false);
      expect(service.possedePermission(contexte, 'salarie.modifier')).toBe(true);
    });
  });

  it('lit les permissions refusees depuis le contexte de requete', () => {
    permissionsRefusees.run(new Set(['salarie.supprimer']), () => {
      expect(service.possedePermission(contexte, 'salarie.supprimer')).toBe(false);
      expect(service.possedePermission(contexte, 'salarie.modifier')).toBe(true);
    });
  });

  it('ignore le contexte de permissions refusees en production', () => {
    const precedent = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      permissionsRefusees.run(new Set(['salarie.remuneration.lire']), () => {
        expect(service.possedePermission(contexte, 'salarie.remuneration.lire')).toBe(true);
      });
    } finally {
      process.env.NODE_ENV = precedent;
    }
  });
});
