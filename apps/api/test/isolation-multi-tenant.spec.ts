import { describe, expect, it, vi } from 'vitest';
import type { TenantContext } from '@paymarh/shared-types';
import type { PrismaService } from '../src/common/prisma/prisma.service.js';
import type { TenantContextService } from '../src/common/tenancy/tenant-context.service.js';
import { CompaniesService } from '../src/modules/companies/companies.service.js';

// ---------------------------------------------------------------------------
// Ce test verifie que le filtrage multi-tenant est reellement APPLIQUE par un
// service, et pas seulement disponible.
//
// On remplace Prisma par un espion : on n a pas besoin d une vraie base pour
// prouver le point essentiel, qui est "quel `where` a ete envoye ?".
// ---------------------------------------------------------------------------

const COMPTE_A = '11111111-1111-4111-8111-111111111111';
const COMPTE_B = '22222222-2222-4222-8222-222222222222';
const SOCIETE_DU_COMPTE_B = '44444444-4444-4444-8444-444444444444';

function creerService(context: TenantContext) {
  const findMany = vi.fn().mockResolvedValue([]);
  const findFirst = vi.fn().mockResolvedValue(null);

  const prisma = { company: { findMany, findFirst } } as unknown as PrismaService;
  const tenantContext = {
    getOrThrow: () => context,
    get: () => context,
  } as unknown as TenantContextService;

  return { service: new CompaniesService(prisma, tenantContext), findMany, findFirst };
}

const utilisateurDuCompteA: TenantContext = {
  userId: '99999999-9999-4999-8999-999999999999',
  role: 'MANAGER',
  accountId: COMPTE_A,
  companyId: null,
};

describe('CompaniesService - aucune fuite entre comptes', () => {
  it('filtre toujours la liste par le compte de l appelant', async () => {
    const { service, findMany } = creerService(utilisateurDuCompteA);

    await service.findAll();

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0]![0].where).toEqual({ accountId: COMPTE_A });
  });

  it('inclut le compte dans la recherche par identifiant, et non apres coup', async () => {
    const { service, findFirst } = creerService(utilisateurDuCompteA);

    // On demande une societe qui appartient a un AUTRE compte.
    await expect(service.findOne(SOCIETE_DU_COMPTE_B)).rejects.toThrow();

    // Le point critique : le compte fait partie du `where` envoye a la base.
    // Si le filtre etait applique apres la lecture, la donnee d autrui aurait
    // deja quitte la base.
    expect(findFirst.mock.calls[0]![0].where).toEqual({
      accountId: COMPTE_A,
      id: SOCIETE_DU_COMPTE_B,
    });
  });

  it("repond 'introuvable' plutot qu 'interdit' pour la societe d un autre compte", async () => {
    const { service } = creerService(utilisateurDuCompteA);

    // Repondre "interdit" revelerait l existence de la ressource chez autrui.
    await expect(service.findOne(SOCIETE_DU_COMPTE_B)).rejects.toMatchObject({
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

    await expect(service.findAll()).rejects.toThrow();

    // Et surtout : aucune requete n a ete envoyee a la base.
    expect(findMany).not.toHaveBeenCalled();
  });

  it('n utilise jamais le compte d un autre utilisateur', async () => {
    const utilisateurDuCompteB: TenantContext = { ...utilisateurDuCompteA, accountId: COMPTE_B };
    const { service, findMany } = creerService(utilisateurDuCompteB);

    await service.findAll();

    expect(findMany.mock.calls[0]![0].where).toEqual({ accountId: COMPTE_B });
  });
});
