import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { creerAppHttp } from './support/app-http.js';
import {
  appelerApi,
  extraireCodeErreur,
  extraireDonnees,
  lireJson,
  nettoyerJournauxAudit,
} from './support/http-client.js';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;

const PREFIXE = `test-http-suppr-${Date.now()}`;

describe.skipIf(!prisma)('suppression societe — confirmation HTTP', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let adminId: string;
  let societeId: string;

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

    const admin = await prisma.user.create({
      data: {
        email: `${PREFIXE}-admin@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compteId,
      },
    });
    adminId = admin.id;

    const creation = await appelerApi(app, {
      method: 'POST',
      chemin: '/societes',
      utilisateurId: adminId,
      body: {
        codeDossier: `${PREFIXE}-SOC`,
        raisonSociale: 'Societe a supprimer',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        etablissementPrincipal: {
          nom: 'Siege',
          adresse: '1 rue Test',
          ville: 'Casablanca',
        },
      },
    });
    expect(creation.status).toBe(201);
    const json = await lireJson(creation);
    societeId = extraireDonnees<{ id: string }>(json).id;
  });

  afterAll(async () => {
    if (!prisma) return;
    await nettoyerJournauxAudit(prisma, [adminId]);
    await app?.close();
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
    await prisma.$disconnect();
  });

  it('refuse DELETE sans jeton de confirmation', async () => {
    if (!prisma) return;

    const reponse = await appelerApi(app, {
      method: 'DELETE',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
    });

    expect(reponse.status).toBe(400);
    const corps = await lireJson(reponse);
    expect(extraireCodeErreur(corps)).toBe('CONFIRMATION_REQUISE');
  });

  it('refuse DELETE avec un jeton obsolete apres changement d inventaire', async () => {
    if (!prisma) return;

    const impact = await appelerApi(app, {
      method: 'GET',
      chemin: `/societes/${societeId}/impact-suppression`,
      utilisateurId: adminId,
    });
    expect(impact.status).toBe(200);
    const impactJson = await lireJson(impact);
    const jetonObsolete = extraireDonnees<{ jetonConfirmation: string }>(impactJson)
      .jetonConfirmation;

    await prisma.companyParametrageHistorique.create({
      data: {
        companyId: societeId,
        moisEffet: '2025-02',
        moisClotureConges: 11,
      },
    });

    const reponse = await appelerApi(app, {
      method: 'DELETE',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      query: { confirmationJeton: jetonObsolete },
    });

    expect(reponse.status).toBe(409);
    const corps = await lireJson(reponse);
    expect(extraireCodeErreur(corps)).toBe('CONFIRMATION_OBSOLETE');
  });

  it('accepte DELETE avec un jeton valide', async () => {
    if (!prisma) return;

    const impact = await appelerApi(app, {
      method: 'GET',
      chemin: `/societes/${societeId}/impact-suppression`,
      utilisateurId: adminId,
    });
    expect(impact.status).toBe(200);
    const impactJson = await lireJson(impact);
    const jetonValide = extraireDonnees<{ jetonConfirmation: string }>(impactJson)
      .jetonConfirmation;

    const reponse = await appelerApi(app, {
      method: 'DELETE',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      query: { confirmationJeton: jetonValide },
    });

    expect(reponse.status).toBe(200);
    const corps = await lireJson(reponse);
    expect(extraireDonnees<{ id: string }>(corps).id).toBe(societeId);

    const reste = await prisma.company.findUnique({ where: { id: societeId } });
    expect(reste).toBeNull();
  });
});
