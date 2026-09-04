import { describe, expect, it } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import {
  operationsCompteBancaire,
  operationsEmploi,
  operationsListeSalaries,
  operationsListeSocietes,
  operationsSalarie,
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

  it('expose salarie.creer au niveau liste salariés', () => {
    const possede = (permission: string) => permission !== 'salarie.supprimer';
    expect(operationsListeSalaries(possede)).toContain('salarie.creer');
    expect(operationsListeSalaries(possede)).not.toContain('salarie.supprimer');
  });

  it('refuse salarie.supprimer quand non autorise', () => {
    const possede = (permission: string) => permission !== 'salarie.supprimer';
    expect(operationsSalarie(possede)).not.toContain('salarie.supprimer');
    expect(operationsSalarie(() => true)).toContain('salarie.supprimer');
  });

  it('expose les operations emploi avec remuneration', () => {
    const possede = (permission: string) =>
      permission === 'emploi.modifier' || permission === 'salarie.remuneration.lire';
    expect(operationsEmploi(possede)).toEqual(['emploi.modifier', 'salarie.remuneration.lire']);
  });
});
