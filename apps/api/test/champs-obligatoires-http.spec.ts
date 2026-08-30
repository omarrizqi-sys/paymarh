import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp } from './support/app-http.js';
import {
  appelerApi,
  creerSocieteHttp,
  extraireCodeErreur,
  nettoyerJournauxAudit,
} from './support/http-client.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-http-oblig-${Date.now()}`;

describe('champs obligatoires — absent vs vide sur les ecritures HTTP', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let adminId: string;
  let societeId: string;
  let etablissementId: string;
  let typeHeureId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const typeHeure = await prisma.typeHeure.findFirstOrThrow();
    typeHeureId = typeHeure.id;

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

    societeId = await creerSocieteHttp(app, adminId, {
      codeDossier: `${PREFIXE}-SOC`,
      raisonSociale: 'Champs obligatoires',
      formeJuridiqueId: formeId,
      etatDossier: 'EN_MONTAGE',
      moisDebutMontage: '2025-01',
      moisDebutProduction: '2025-01',
      etablissementPrincipal: { adresse: '1 rue Test', ville: 'Casablanca' },
    });

    await prisma.company.update({
      where: { id: societeId },
      data: { moisEnCours: '2025-01' },
    });

    const etablissement = await prisma.etablissement.findFirstOrThrow({
      where: { companyId: societeId, estPrincipal: true },
    });
    etablissementId = etablissement.id;

    const initParam = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${etablissementId}/parametrage`,
      utilisateurId: adminId,
      body: {
        dureeHebdomadaire: '44',
        jourReposHebdomadaire: 'DIMANCHE',
      },
    });
    expect(initParam.status).toBe(200);
  });

  afterAll(async () => {
    await nettoyerJournauxAudit(prisma, [adminId]);
    await app?.close();
    await prisma.account.deleteMany({ where: { name: PREFIXE } });
  });

  async function attendreRefus(
    reponse: Response,
    champAttendu: string
  ): Promise<Record<string, unknown>> {
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    const code = extraireCodeErreur(corps);
    if (code === 'CHAMP_OBLIGATOIRE') {
      expect(corps.champ ?? (corps.message as { champ?: string })?.champ).toBe(champAttendu);
    } else {
      expect(JSON.stringify(corps).toLowerCase()).toContain(champAttendu.toLowerCase());
    }
    return corps;
  }

  it('PATCH societe : champ absent accepte, valeurs vides refusees', async () => {
    const ok = await appelerApi(app, {
      method: 'PATCH',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      body: { nomCommercial: 'Nom commercial seul' },
    });
    expect(ok.status).toBe(200);

    await attendreRefus(
      await appelerApi(app, {
        method: 'PATCH',
        chemin: `/societes/${societeId}`,
        utilisateurId: adminId,
        body: { matriculeLongueur: null },
      }),
      'matriculeLongueur'
    );

    await attendreRefus(
      await appelerApi(app, {
        method: 'PATCH',
        chemin: `/societes/${societeId}`,
        utilisateurId: adminId,
        body: { matriculeLongueur: 0 },
      }),
      'matriculeLongueur'
    );

    await attendreRefus(
      await appelerApi(app, {
        method: 'PATCH',
        chemin: `/societes/${societeId}`,
        utilisateurId: adminId,
        body: { calculAutoAbsencesEntreesSorties: null },
      }),
      'calculAutoAbsencesEntreesSorties'
    );

    const okBool = await appelerApi(app, {
      method: 'PATCH',
      chemin: `/societes/${societeId}`,
      utilisateurId: adminId,
      body: { calculAutoAbsencesEntreesSorties: false },
    });
    expect(okBool.status).toBe(200);
  });

  it('PUT parametrage societe : moisClotureConges null ou zero refuse', async () => {
    await attendreRefus(
      await appelerApi(app, {
        method: 'PUT',
        chemin: `/societes/${societeId}/parametrage`,
        utilisateurId: adminId,
        body: { moisClotureConges: null },
      }),
      'moisClotureConges'
    );

    await attendreRefus(
      await appelerApi(app, {
        method: 'PUT',
        chemin: `/societes/${societeId}/parametrage`,
        utilisateurId: adminId,
        body: { moisClotureConges: 0 },
      }),
      'moisClotureConges'
    );
  });

  it('PUT parametrage etablissement : jourReposHebdomadaire null ou vide refuse', async () => {
    await attendreRefus(
      await appelerApi(app, {
        method: 'PUT',
        chemin: `/etablissements/${etablissementId}/parametrage`,
        utilisateurId: adminId,
        body: { jourReposHebdomadaire: null },
      }),
      'jourReposHebdomadaire'
    );

    await attendreRefus(
      await appelerApi(app, {
        method: 'PUT',
        chemin: `/etablissements/${etablissementId}/parametrage`,
        utilisateurId: adminId,
        body: { jourReposHebdomadaire: '' },
      }),
      'jourReposHebdomadaire'
    );
  });

  it('PUT parametrage etablissement : grille incoherente refusee sans dureeHebdomadaire transmise', async () => {
    const reponse = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${etablissementId}/parametrage`,
      utilisateurId: adminId,
      body: {
        horaireDefautLignes: [
          { jourSemaine: 'LUNDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'MARDI', typeHeureId, nombreHeures: '8' },
        ],
      },
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    expect(extraireCodeErreur(corps)).toBe('GRILLE_TOTAL_INCOHERENT');
  });
});
