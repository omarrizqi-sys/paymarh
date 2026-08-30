import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp } from './support/app-http.js';
import {
  appelerApi,
  creerSocieteHttp,
  nettoyerJournauxAudit,
} from './support/http-client.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-http-mois-${Date.now()}`;

describe('moisEffet — impose par le serveur', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let adminId: string;

  beforeAll(async () => {
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
    await nettoyerJournauxAudit(prisma, [adminId]);
    await app?.close();
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
  });

  it('refuse moisEffet fourni par l appelant sur le parametrage societe', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-SOC`,
      raisonSociale: 'Mois effet societe',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-06',
      moisDebutProduction: '2025-06',
      etablissementPrincipal: { adresse: '1 rue Mois', ville: 'Casablanca' },
    });

    await prisma.company.update({
      where: { id: societeId },
      data: { moisEnCours: '2025-06' },
    });

    const reponseRefus = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societeId}/parametrage`,
      utilisateurId: adminId,
      body: {
        moisEffet: '2020-01',
        moisClotureConges: 3,
      },
    });
    expect(reponseRefus.status).toBe(400);

    const reponseOk = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societeId}/parametrage`,
      utilisateurId: adminId,
      body: { moisClotureConges: 6 },
    });
    expect(reponseOk.status).toBe(200);

    const ligne = await prisma.companyParametrageHistorique.findFirst({
      where: { companyId: societeId, moisEffet: '2025-06' },
    });
    expect(ligne).not.toBeNull();
    expect(ligne!.moisClotureConges).toBe(6);

    const ligneUsurpee = await prisma.companyParametrageHistorique.findFirst({
      where: { companyId: societeId, moisEffet: '2020-01' },
    });
    expect(ligneUsurpee).toBeNull();
  });

  it('refuse moisEffet fourni par l appelant sur le parametrage etablissement', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-ETAB`,
      raisonSociale: 'Mois effet etablissement',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-07',
      moisDebutProduction: '2025-07',
      etablissementPrincipal: { adresse: '2 rue Mois', ville: 'Rabat' },
    });

    await prisma.company.update({
      where: { id: societeId },
      data: { moisEnCours: '2025-07' },
    });

    const etablissement = await prisma.etablissement.findFirstOrThrow({
      where: { companyId: societeId, estPrincipal: true },
    });

    const reponseRefus = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${etablissement.id}/parametrage`,
      utilisateurId: adminId,
      body: {
        moisEffet: '2019-06',
        dureeHebdomadaire: '40',
      },
    });
    expect(reponseRefus.status).toBe(400);

    const reponseOk = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${etablissement.id}/parametrage`,
      utilisateurId: adminId,
      body: { dureeHebdomadaire: '42' },
    });
    expect(reponseOk.status).toBe(200);

    const ligne = await prisma.etablissementParametrageHistorique.findFirst({
      where: { etablissementId: etablissement.id, moisEffet: '2025-07' },
    });
    expect(ligne).not.toBeNull();

    const ligneUsurpee = await prisma.etablissementParametrageHistorique.findFirst({
      where: { etablissementId: etablissement.id, moisEffet: '2019-06' },
    });
    expect(ligneUsurpee).toBeNull();
  });
});
