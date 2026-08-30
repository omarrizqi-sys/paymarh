import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp } from './support/app-http.js';
import {
  appelerApi,
  creerSocieteHttp,
  dernierJournalAudit,
  extraireDonnees,
  lireJson,
  nettoyerJournauxAudit,
} from './support/http-client.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-http-audit-${Date.now()}`;

describe('AuditLog — traces HTTP reelles', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let adminId: string;
  let platformId: string;

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

    const platform = await prisma.user.upsert({
      where: { email: `${PREFIXE}-platform@test.local` },
      update: { role: 'PLATFORM_ADMIN', accountId: null },
      create: {
        email: `${PREFIXE}-platform@test.local`,
        role: 'PLATFORM_ADMIN',
        accountId: null,
      },
    });
    platformId = platform.id;

    await nettoyerJournauxAudit(prisma, [adminId, platformId]);
  });

  afterAll(async () => {
    await nettoyerJournauxAudit(prisma, [adminId, platformId]);
    await app?.close();
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIXE } } });
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
  });

  it('journalise la creation d une societe', async () => {
    const code = `${PREFIXE}-CREER`;
    const reponse = await appelerApi(app, {
      method: 'POST',
      chemin: '/societes',
      utilisateurId: adminId,
      body: {
        codeDossier: code,
        raisonSociale: 'Audit creation',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        matriculeLongueur: 5,
        calculAutoAbsencesEntreesSorties: true,
        etablissementPrincipal: {
          adresse: '1 rue Audit',
          ville: 'Casablanca',
        },
      },
    });
    expect(reponse.status).toBe(201);
    const societeId = extraireDonnees<{ id: string }>(await lireJson(reponse)).id;

    const journal = await dernierJournalAudit(prisma, {
      targetId: societeId,
      action: 'CREER_SOCIETE',
    });
    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(adminId);
    expect(journal!.targetType).toBe('Company');
    expect(journal!.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('journalise la modification d une societe', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-MOD`,
      raisonSociale: 'Avant modification',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '2 rue Audit', ville: 'Rabat' },
    });

    const reponse = await appelerApi(app, {
      method: 'PATCH',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      body: { raisonSociale: 'Apres modification' },
    });
    expect(reponse.status).toBe(200);

    const journal = await dernierJournalAudit(prisma, {
      targetId: societeId,
      action: 'MODIFIER_SOCIETE',
    });
    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(adminId);
    expect(journal!.targetType).toBe('Company');
  });

  it('journalise le changement d etat du dossier', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-ETAT`,
      raisonSociale: 'Changement etat',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '3 rue Audit', ville: 'Fes' },
    });

    const reponse = await appelerApi(app, {
      method: 'PATCH',
      chemin: `/societes/${societeId}/etat`,
      utilisateurId: adminId,
      body: { etatDossier: 'EN_PRODUCTION' },
    });
    expect(reponse.status).toBe(200);

    const journal = await dernierJournalAudit(prisma, {
      targetId: societeId,
      action: 'CHANGER_ETAT_SOCIETE',
    });
    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(adminId);
  });

  it('journalise la designation d un nouvel etablissement principal', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-PRINC`,
      raisonSociale: 'Designation principal',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '4 rue Audit', ville: 'Tanger' },
    });

    const secondaire = await appelerApi(app, {
      method: 'POST',
      chemin: `/societes/${societeId}/etablissements`,
      utilisateurId: adminId,
      body: {
        nom: 'Secondaire',
        adresse: '5 rue Audit',
        ville: 'Agadir',
      },
    });
    expect(secondaire.status).toBe(201);
    const etablissementId = extraireDonnees<{ id: string }>(await lireJson(secondaire)).id;

    const reponse = await appelerApi(app, {
      method: 'POST',
      chemin: `/etablissements/${etablissementId}/designer-principal`,
      utilisateurId: adminId,
    });
    expect(reponse.status).toBe(201);

    const journal = await dernierJournalAudit(prisma, {
      targetId: etablissementId,
      action: 'DESIGNER_ETABLISSEMENT_PRINCIPAL',
    });
    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(adminId);
    expect(journal!.targetType).toBe('Etablissement');
  });

  it('journalise la suppression d une societe', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-SUPPR`,
      raisonSociale: 'Societe supprimee',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '6 rue Audit', ville: 'Oujda' },
    });

    const impact = await appelerApi(app, {
      method: 'GET',
      chemin: `/societes/${societeId}/impact-suppression`,
      utilisateurId: adminId,
    });
    const jeton = extraireDonnees<{ jetonConfirmation: string }>(await lireJson(impact))
      .jetonConfirmation;

    const reponse = await appelerApi(app, {
      method: 'DELETE',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      query: { confirmationJeton: jeton },
    });
    expect(reponse.status).toBe(200);

    const journal = await dernierJournalAudit(prisma, {
      targetId: societeId,
      action: 'SUPPRIMER_SOCIETE',
    });
    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(adminId);
  });

  it('autorise le PLATFORM_ADMIN sur forcer-regime-de-base et journalise qui, quand, ancienne et nouvelle valeur', async () => {
    const societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-REGIME`,
      raisonSociale: 'Regime de base',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '7 rue Audit', ville: 'Meknes' },
    });

    const motif = 'Correction exceptionnelle de test';
    const reponse = await appelerApi(app, {
      method: 'POST',
      chemin: `/admin/societes/${societeId}/forcer-regime-de-base`,
      utilisateurId: platformId,
      body: {
        regimeDeBase: 'NON_AGRICOLE',
        motif,
      },
    });
    expect(reponse.status).toBe(201);

    const journal = await prisma.auditLog.findFirst({
      where: {
        targetId: societeId,
        action: { startsWith: 'FORCER_REGIME_DE_BASE' },
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(platformId);
    expect(journal!.targetType).toBe('Company');
    expect(journal!.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
    expect(journal!.action).toContain('ancienne=NON_AGRICOLE');
    expect(journal!.action).toContain('nouvelle=NON_AGRICOLE');
    expect(journal!.action).toContain(`motif=${motif}`);
  });
});
