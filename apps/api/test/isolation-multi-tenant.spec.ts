import { describe, expect, it, vi } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import type { AuditService } from '../src/common/audit/audit.service.js';
import type { PrismaService } from '../src/common/prisma/prisma.service.js';
import type { TenantContextService } from '../src/common/tenancy/tenant-context.service.js';
import { SocietesService } from '../src/modules/companies/societes.service.js';

const COMPTE_A = '11111111-1111-4111-8111-111111111111';
const SOCIETE_DU_COMPTE_B = '44444444-4444-4444-8444-444444444444';

function creerService(context: TenantContext) {
  const findMany = vi.fn().mockResolvedValue([]);
  const findFirst = vi.fn().mockResolvedValue(null);

  const prisma = { company: { findMany, findFirst } } as unknown as PrismaService;
  const tenantContext = {
    getOrThrow: () => context,
    get: () => context,
  } as unknown as TenantContextService;
  const audit = { record: vi.fn() } as unknown as AuditService;

  return {
    service: new SocietesService(prisma, tenantContext, audit),
    findMany,
    findFirst,
  };
}

const utilisateurDuCompteA: TenantContext = {
  userId: '99999999-9999-4999-8999-999999999999',
  role: 'MANAGER',
  accountId: COMPTE_A,
  companyId: null,
};

describe('SocietesService - aucune fuite entre comptes', () => {
  it('filtre toujours la liste par le compte de l appelant', async () => {
    const { service, findMany } = creerService(utilisateurDuCompteA);

    await service.lister();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]![0].where).toEqual({ accountId: COMPTE_A });
  });

  it('inclut le compte dans la recherche par identifiant', async () => {
    const { service, findFirst } = creerService(utilisateurDuCompteA);

    await expect(service.lire(SOCIETE_DU_COMPTE_B)).rejects.toThrow();

    expect(findFirst.mock.calls[0]![0].where).toEqual({
      accountId: COMPTE_A,
      id: SOCIETE_DU_COMPTE_B,
    });
  });

  it("repond 'introuvable' plutot qu 'interdit' pour la societe d un autre compte", async () => {
    const { service } = creerService(utilisateurDuCompteA);

    await expect(service.lire(SOCIETE_DU_COMPTE_B)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('refuse de lire quoi que ce soit pour un super-admin sur le chemin normal', async () => {
    const superAdmin: TenantContext = {
      userId: '88888888-8888-4888-8888-888888888888',
      role: 'PLATFORM_ADMIN',
      accountId: null,
      companyId: null,
    };
    const { service, findMany } = creerService(superAdmin);

    await expect(service.lister()).rejects.toMatchObject({ status: 403 });
    expect(findMany).not.toHaveBeenCalled();
  });
});
