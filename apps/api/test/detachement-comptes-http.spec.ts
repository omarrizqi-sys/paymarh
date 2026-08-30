import { resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { creerAppHttp } from './support/app-http.js';
import {
  appelerApi,
  creerSocieteHttp,
  extraireDonnees,
  lireJson,
  nettoyerJournauxAudit,
} from './support/http-client.js';

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;
const prisma = connectionString
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  : null;

const PREFIXE = `test-http-detach-${Date.now()}`;

describe.skipIf(!prisma)('detachement comptes bancaires — suppression etablissement', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let adminId: string;

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
  });

  afterAll(async () => {
    if (!prisma) return;
    await nettoyerJournauxAudit(prisma, [adminId]);
    await app?.close();
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
    await prisma.$disconnect();
  });

  it('detache les comptes bancaires, les enumere dans l impact, et ne les supprime pas', async () => {
    if (!prisma) return;

    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-SOC`,
      raisonSociale: 'Detachement RIB',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '1 rue Siege', ville: 'Casablanca' },
    });

    const secondaire = await appelerApi(app, {
      method: 'POST',
      chemin: `/societes/${societeId}/etablissements`,
      utilisateurId: adminId,
      body: {
        nom: 'Annexe',
        adresse: '2 rue Annexe',
        ville: 'Rabat',
      },
    });
    expect(secondaire.status).toBe(201);
    const etablissementId = extraireDonnees<{ id: string }>(await lireJson(secondaire)).id;

    const compte = await appelerApi(app, {
      method: 'POST',
      chemin: `/societes/${societeId}/comptes-bancaires`,
      utilisateurId: adminId,
      body: {
        libelle: 'Compte rattache annexe',
        etablissementIds: [etablissementId],
      },
    });
    expect(compte.status).toBe(201);
    const compteId = extraireDonnees<{ id: string }>(await lireJson(compte)).id;

    const impact = await appelerApi(app, {
      method: 'GET',
      chemin: `/etablissements/${etablissementId}/impact-suppression`,
      utilisateurId: adminId,
    });
    expect(impact.status).toBe(200);
    const inventaire = extraireDonnees<{
      comptesBancairesRattaches: { id: string; libelle: string | null }[];
      jetonConfirmation: string;
    }>(await lireJson(impact));

    expect(inventaire.comptesBancairesRattaches).toHaveLength(1);
    expect(inventaire.comptesBancairesRattaches[0]).toMatchObject({
      id: compteId,
      libelle: 'Compte rattache annexe',
    });

    const suppression = await appelerApi(app, {
      method: 'DELETE',
      chemin: `/etablissements/${etablissementId}`,
      utilisateurId: adminId,
      query: { confirmationJeton: inventaire.jetonConfirmation },
    });
    expect(suppression.status).toBe(200);
    expect(
      extraireDonnees<{ quantitesSupprimees: Record<string, number> }>(await lireJson(suppression))
        .quantitesSupprimees.liaisonsComptesBancairesDetachees
    ).toBe(1);

    const etablissementReste = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
    });
    expect(etablissementReste).toBeNull();

    const compteReste = await prisma.compteBancaire.findUnique({
      where: { id: compteId },
      include: { etablissements: true },
    });
    expect(compteReste).not.toBeNull();
    expect(compteReste!.libelle).toBe('Compte rattache annexe');
    expect(compteReste!.etablissements).toHaveLength(0);
  });
});
