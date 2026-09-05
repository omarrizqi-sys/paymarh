import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-ref-fiche-${Date.now()}`;

describe('GET /referentiels/pays et /situations-familiales', () => {
  let app: INestApplication;
  let utilisateurId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'EMPLOYEE',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIXE } } });
    await prisma.account.deleteMany({ where: { name: { startsWith: PREFIXE } } });
    await app?.close();
  });

  it('R1 — GET /referentiels/pays rend 195 entrees, la premiere est le Maroc', async () => {
    const reponse = await fetch(urlLocale(app, '/referentiels/pays'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { codeIso: string; libelle: string }[]; total: number };
    };
    expect(corps.data.total).toBe(195);
    expect(corps.data.items).toHaveLength(195);
    expect(corps.data.items[0]?.codeIso).toBe('MA');
    expect(corps.data.items[0]?.libelle).toBe('Maroc');
  });

  it('R2 — GET /referentiels/situations-familiales rend 4 entrees, chacune avec code et deux libelles', async () => {
    const reponse = await fetch(urlLocale(app, '/referentiels/situations-familiales'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: {
        items: { code: string; libelleMasculin: string; libelleFeminin: string }[];
        total: number;
      };
    };
    expect(corps.data.total).toBe(4);
    expect(corps.data.items).toHaveLength(4);
    for (const item of corps.data.items) {
      expect(item.code.length).toBeGreaterThan(0);
      expect(item.libelleMasculin.length).toBeGreaterThan(0);
      expect(item.libelleFeminin.length).toBeGreaterThan(0);
    }
  });

  it('R3 — les deux routes refusent sans tenant et acceptent un utilisateur authentifie, comme les cinq referentiels existants', async () => {
    const routes = [
      '/referentiels/banques',
      '/referentiels/pays',
      '/referentiels/situations-familiales',
    ];

    for (const chemin of routes) {
      const sansTenant = await fetch(urlLocale(app, chemin));
      expect(sansTenant.status).toBe(401);

      const avecUtilisateur = await fetch(urlLocale(app, chemin), {
        headers: { 'x-paymarh-user-id': utilisateurId },
      });
      expect(avecUtilisateur.status).toBe(200);
    }
  });
});
