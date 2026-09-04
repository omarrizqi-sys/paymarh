import { describe, expect, it, vi } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import type { PermissionService } from '../../common/permissions/permission.service.js';
import { TenantContextService } from '../../common/tenancy/tenant-context.service.js';
import { SalariesService } from './salaries.service.js';

const contexte: TenantContext = {
  userId: 'u1',
  role: 'ACCOUNT_ADMIN',
  accountId: 'a1',
  companyId: 'c1',
};

function creerLigneSalarie(index: number) {
  return {
    id: `s${index}`,
    matricule: `M${index}`,
    nom: `Nom${index}`,
    prenom: 'Test',
    dateEntree: new Date('2025-01-01'),
  };
}

function creerService(prisma: {
  salarie: { findMany: ReturnType<typeof vi.fn> };
  emploi: { findMany: ReturnType<typeof vi.fn> };
}) {
  const tenantContext = new TenantContextService();
  const permissionService: PermissionService = {
    possedePermission: () => true,
  };

  const service = new SalariesService(
    prisma as never,
    tenantContext,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    permissionService
  );

  return { service, tenantContext };
}

describe('SalariesService.lister — nombre de requêtes SQL', () => {
  it.each([
    { taille: 1, libelle: '1 salarié' },
    { taille: 50, libelle: '50 salariés' },
  ])('declenche exactement 2 requêtes Prisma pour une page de $libelle', async ({ taille }) => {
    const salaries = Array.from({ length: taille }, (_, index) => creerLigneSalarie(index));

    const salarieFindMany = vi.fn().mockResolvedValue(salaries);
    const emploiFindMany = vi.fn().mockResolvedValue([]);

    const { service, tenantContext } = creerService({
      salarie: { findMany: salarieFindMany },
      emploi: { findMany: emploiFindMany },
    });

    await tenantContext.run(contexte, () => service.lister({ limite: taille }));

    expect(salarieFindMany).toHaveBeenCalledTimes(1);
    expect(emploiFindMany).toHaveBeenCalledTimes(1);
  });
});
