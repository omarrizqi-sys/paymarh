import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  MOTIFS_SORTIE,
  STATUTS_PARTICULIERS,
  TYPES_CONTRAT,
} from '../prisma/reference-data-fiche-salarie.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-ref-emploi-${Date.now()}`;

describe('GET /referentiels/types-contrat, /motifs-sortie et /statuts-particuliers', () => {
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

  it('E1 — GET /referentiels/types-contrat rend sept entrees dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/types-contrat'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/types-contrat'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(TYPES_CONTRAT.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      TYPES_CONTRAT.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });

  it('E2 — GET /referentiels/motifs-sortie rend treize entrees dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/motifs-sortie'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/motifs-sortie'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(MOTIFS_SORTIE.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      MOTIFS_SORTIE.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });

  it('E3 — GET /referentiels/statuts-particuliers rend les statuts saisissables dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/statuts-particuliers'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/statuts-particuliers'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(STATUTS_PARTICULIERS.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      STATUTS_PARTICULIERS.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });
});
