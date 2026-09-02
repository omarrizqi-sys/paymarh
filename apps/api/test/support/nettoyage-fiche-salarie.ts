import type { PrismaClient } from '../../src/generated/prisma/client.js';

/**
 * Nettoie les donnees de test en respectant RESTRICT sur etablissement :
 * salarie (cascade emplois et versions), compteurs numero ordre, etablissements, societe.
 */
export async function nettoyerCompteTest(prisma: PrismaClient, prefixe: string): Promise<void> {
  const comptes = await prisma.account.findMany({
    where: { name: { startsWith: prefixe } },
    select: { id: true },
  });

  for (const compte of comptes) {
    const societes = await prisma.company.findMany({
      where: { accountId: compte.id },
      select: { id: true },
    });

    for (const societe of societes) {
      const salaries = await prisma.salarie.findMany({
        where: { companyId: societe.id },
        select: { id: true },
      });

      for (const salarie of salaries) {
        await prisma.compteurNumeroOrdreEmploi.deleteMany({ where: { salarieId: salarie.id } });
      }

      await prisma.salarie.deleteMany({ where: { companyId: societe.id } });
      await prisma.etablissement.deleteMany({ where: { companyId: societe.id } });
      await prisma.company.delete({ where: { id: societe.id } });
    }

    await prisma.account.delete({ where: { id: compte.id } });
  }
}
