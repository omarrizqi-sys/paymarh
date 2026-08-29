import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;

const PREFIXE = `test-http-iso-${Date.now()}`;

describe.skipIf(!prisma)('isolation multi-tenant — appels HTTP reels', () => {
  let app: INestApplication;
  let formeId: string;
  let compteAId: string;
  let compteBId: string;
  let utilisateurAId: string;
  let societeBId: string;

  beforeAll(async () => {
    if (!prisma) return;

    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const compteA = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const compteB = await prisma.account.create({
      data: { name: `${PREFIXE}-B`, type: 'CABINET' },
    });
    compteAId = compteA.id;
    compteBId = compteB.id;

    const utilisateurA = await prisma.user.create({
      data: {
        email: `${PREFIXE}-a@test.local`,
        role: 'MANAGER',
        accountId: compteAId,
      },
    });
    utilisateurAId = utilisateurA.id;

    const societeB = await prisma.company.create({
      data: {
        accountId: compteBId,
        codeDossier: `${PREFIXE}-B`,
        raisonSociale: 'Societe du compte B',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        moisEnCours: '2025-01',
      },
    });
    societeBId = societeB.id;

    await prisma.etablissement.create({
      data: {
        companyId: societeBId,
        accountId: compteBId,
        nom: 'Siege B',
        estPrincipal: true,
        adresse: '1 rue B',
        ville: 'Casablanca',
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await app?.close();
    await prisma.account.deleteMany({ where: { name: { startsWith: PREFIXE } } });
    await prisma.$disconnect();
  });

  it('renvoie 404 (pas 403) quand le compte A lit une societe du compte B', async () => {
    if (!prisma) return;

    const reponse = await fetch(urlLocale(app, `/societes/${societeBId}`), {
      headers: { 'x-paymarh-user-id': utilisateurAId },
    });

    expect(reponse.status).toBe(404);
    expect(reponse.status).not.toBe(403);
  });
});
