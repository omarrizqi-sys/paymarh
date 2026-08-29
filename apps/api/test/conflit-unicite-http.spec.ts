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

const PREFIXE = `test-http-uniq-${Date.now()}`;

describe.skipIf(!prisma)('conflits d unicite — reponses HTTP neutres', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let utilisateurId: string;
  const codeDossier = `${PREFIXE}-CD`;

  beforeAll(async () => {
    if (!prisma) return;

    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const compte = await prisma.account.create({
      data: { name: PREFIXE, type: 'CABINET' },
    });
    compteId = compte.id;

    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compteId,
      },
    });
    utilisateurId = utilisateur.id;

    await prisma.company.create({
      data: {
        accountId: compteId,
        codeDossier,
        raisonSociale: 'Premiere',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        moisEnCours: '2025-01',
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await app?.close();
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
    await prisma.$disconnect();
  });

  it('ne revele ni table, ni contrainte, ni valeur en conflit sur un doublon HTTP', async () => {
    if (!prisma) return;

    const reponse = await fetch(urlLocale(app, '/societes'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-paymarh-user-id': utilisateurId,
      },
      body: JSON.stringify({
        codeDossier,
        raisonSociale: 'Seconde',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        etablissementPrincipal: {
          nom: 'Siege',
          adresse: '1 rue Test',
          ville: 'Casablanca',
        },
      }),
    });

    expect(reponse.status).toBe(409);
    const corps = (await reponse.json()) as Record<string, unknown>;
    const texte = JSON.stringify(corps).toLowerCase();

    expect(corps).toMatchObject({
      code: 'VALEUR_INDISPONIBLE',
      champ: 'codeDossier',
    });

    expect(texte).not.toContain('company');
    expect(texte).not.toContain('company_accountid_codedossier_key');
    expect(texte).not.toContain(codeDossier.toLowerCase());
    expect(texte).not.toContain('prisma');
    expect(texte).not.toContain('p2002');
  });
});
