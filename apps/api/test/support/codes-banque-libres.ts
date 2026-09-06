import type { PrismaClient } from '../../src/generated/prisma/client.js';

/** Alloue n codes a 3 chiffres encore absents de Banque — independant de l horloge. */
export async function allouerCodesBanqueLibres(prisma: PrismaClient, n: number): Promise<string[]> {
  const occupes = new Set(
    (
      await prisma.banque.findMany({
        where: { codeBanque: { not: null } },
        select: { codeBanque: true },
      })
    )
      .map((ligne) => ligne.codeBanque)
      .filter((code): code is string => code !== null)
  );
  const alloues: string[] = [];
  for (let i = 0; i <= 999 && alloues.length < n; i += 1) {
    const code = String(i).padStart(3, '0');
    if (!occupes.has(code)) {
      occupes.add(code);
      alloues.push(code);
    }
  }
  if (alloues.length < n) {
    throw new Error(`plus assez de codeBanque libres (demande ${n}, obtenus ${alloues.length})`);
  }
  return alloues;
}
