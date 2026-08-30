import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import {
  operationsCompteBancaire,
  operationsListeSocietes,
  operationsSociete,
} from './operations-ressource.js';

const admin: TenantContext = {
  userId: 'u1',
  role: 'ACCOUNT_ADMIN',
  accountId: 'a1',
  companyId: null,
};

const manager: TenantContext = {
  userId: 'u2',
  role: 'MANAGER',
  accountId: 'a1',
  companyId: null,
};

describe('operations-ressource', () => {
  it('expose societe.creer au niveau liste pour ACCOUNT_ADMIN', () => {
    expect(operationsListeSocietes(admin)).toContain('societe.creer');
  });

  it('refuse societe.supprimer au manager', () => {
    expect(operationsSociete(manager, 'c1')).not.toContain('societe.supprimer');
    expect(operationsSociete(admin, 'c1')).toContain('societe.supprimer');
  });

  it('expose les operations compte bancaire', () => {
    expect(operationsCompteBancaire(admin, 'c1')).toContain('compte-bancaire.cloturer');
  });
});
