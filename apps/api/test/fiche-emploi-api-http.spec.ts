import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COEFFICIENT_HEBDO_VERS_MENSUEL } from '../src/modules/companies/heures-mensuelles.js';
import { AppModule } from '../src/app.module.js';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { BULLETIN_PORT, EtatBulletin, type BulletinPort } from '../src/modules/salaries/bulletin/bulletin.port.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from '../src/modules/salaries/referentiel-national/referentiel-national.port.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-emploi-api-${Date.now()}`;

function entetes(
  utilisateurId: string,
  companyId: string,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    'x-paymarh-user-id': utilisateurId,
    'x-paymarh-company-id': companyId,
    ...extra,
  };
}

function payloadEmploi(
  etablissementId: string,
  surcharge: {
    contrat?: Record<string, unknown>;
    remuneration?: Record<string, unknown>;
    affectation?: Record<string, unknown>;
  } = {}
) {
  return {
    contrat: {
      libellePoste: 'Comptable',
      dateDebut: '2025-01-01',
      typeContratCode: 'CDI',
      ...surcharge.contrat,
    },
    remuneration: {
      modeDeterminationSalaire: 'BRUT_MENSUEL',
      montant: '12000.50',
      ...surcharge.remuneration,
    },
    affectation: {
      etablissementId,
      baseSaisieDuree: 'HEBDOMADAIRE',
      ...surcharge.affectation,
    },
  };
}

async function creerAppAvecPorts(options: {
  bulletins?: Partial<BulletinPort>;
  referentiel?: Partial<ReferentielNationalPort>;
}): Promise<INestApplication> {
  let moduleRef = Test.createTestingModule({
    imports: [AppModule, SocleTestModule],
  });

  if (options.bulletins !== undefined) {
    moduleRef = moduleRef.overrideProvider(BULLETIN_PORT).useValue({
      listerBulletinsParSalarie: async () => [],
      listerBulletinsParEmploi: async () => [],
      ...options.bulletins,
    });
  }

  if (options.referentiel !== undefined) {
    moduleRef = moduleRef.overrideProvider(REFERENTIEL_NATIONAL_PORT).useValue({
      lireValeur: async () => null,
      ...options.referentiel,
    });
  }

  const compiled = await moduleRef.compile();
  const app = compiled.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  await app.init();
  await app.listen(0);
  return app;
}

async function creerEmploiViaApi(
  app: INestApplication,
  utilisateurId: string,
  companyId: string,
  salarieId: string,
  etablissementId: string,
  surcharge?: Parameters<typeof payloadEmploi>[1]
) {
  const reponse = await fetch(urlLocale(app, `/salaries/${salarieId}/emplois`), {
    method: 'POST',
    headers: {
      ...entetes(utilisateurId, companyId),
      'content-type': 'application/json',
    },
    body: JSON.stringify(payloadEmploi(etablissementId, surcharge)),
  });
  expect(reponse.status).toBe(201);
  return (await reponse.json()) as {
    donnees: { id: string; version: number };
    alertes: unknown[];
  };
}

async function patchContrat(
  app: INestApplication,
  utilisateurId: string,
  companyId: string,
  emploiId: string,
  version: number,
  corps: Record<string, unknown>,
  confirmationJeton?: string
) {
  const query = confirmationJeton !== undefined ? `?confirmationJeton=${confirmationJeton}` : '';
  return fetch(urlLocale(app, `/emplois/${emploiId}/contrat${query}`), {
    method: 'PATCH',
    headers: {
      ...entetes(utilisateurId, companyId),
      'content-type': 'application/json',
      'if-match': String(version),
    },
    body: JSON.stringify(corps),
  });
}

async function patchRemuneration(
  app: INestApplication,
  utilisateurId: string,
  companyId: string,
  emploiId: string,
  version: number,
  corps: Record<string, unknown>
) {
  return fetch(urlLocale(app, `/emplois/${emploiId}/remuneration`), {
    method: 'PATCH',
    headers: {
      ...entetes(utilisateurId, companyId),
      'content-type': 'application/json',
      'if-match': String(version),
    },
    body: JSON.stringify(corps),
  });
}

describe('API fiche emploi — endpoints emplois (2.1.b-3)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('1 — un salarie peut avoir deux emplois simultanes dans deux etablissements differents', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DEUX-ETAB`,
    });

    const emploi1 = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );
    const emploi2 = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementSecondaireId,
      { contrat: { libellePoste: 'Magasinier', dateDebut: '2025-02-01' } }
    );

    expect(emploi1.donnees.id).not.toBe(emploi2.donnees.id);

    const fiche = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const { donnees } = (await fiche.json()) as {
      donnees: {
        emplois: { affectation: { etablissementId: string } }[];
      };
    };
    expect(donnees.emplois).toHaveLength(2);
    const etabs = donnees.emplois.map((e) => e.affectation.etablissementId);
    expect(etabs).toContain(societeA.etablissementPrincipalId);
    expect(etabs).toContain(societeA.etablissementSecondaireId);
  });

  it('2 — un CDD passe en CDI reste le meme emploi', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-CDD-CDI`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      { contrat: { typeContratCode: 'CDD', dateFin: '2025-12-31' } }
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { typeContratCode: 'CDI', dateFin: null }
    );
    expect(reponse.status).toBe(200);

    const count = await prisma.emploi.count({ where: { salarieId: salarie.id } });
    expect(count).toBe(1);
    const lu = await fetch(urlLocale(app, `/emplois/${cree.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const { donnees } = (await lu.json()) as {
      donnees: { contrat: { typeContratCode: string; dateFin: string | null } };
    };
    expect(donnees.contrat.typeContratCode).toBe('CDI');
    expect(donnees.contrat.dateFin).toBeNull();
  });

  it('3 — sans bulletin, deux modifications de salaire ne laissent qu une seule version', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ECRASE-REM`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    let version = cree.version;
    const emploiId = cree.id;

    for (const montant of ['13000', '14000']) {
      const reponse = await patchRemuneration(
        app,
        utilisateurId,
        societeA.companyId,
        emploiId,
        version,
        { montant }
      );
      expect(reponse.status).toBe(200);
      const corps = (await reponse.json()) as { donnees: { version: number; remuneration: { montant: string } } };
      version = corps.donnees.version;
      expect(corps.donnees.remuneration.montant).toBe(montant);
    }

    const versions = await prisma.emploiRemunerationVersion.count({
      where: { emploiId },
    });
    expect(versions).toBe(1);

    const derniere = await prisma.emploiRemunerationVersion.findFirstOrThrow({
      where: { emploiId },
    });
    expect(derniere.montant.toString()).toBe('14000');
  });

  it('4 — avec bulletin sur le mois concerne, modifier le salaire cree une seconde version intacte', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-VERSION-REM`,
      });
      const { donnees: cree } = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId
      );

      const reponse = await patchRemuneration(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        cree.id,
        cree.version,
        { montant: '15000' }
      );
      expect(reponse.status).toBe(200);

      const versions = await prisma.emploiRemunerationVersion.findMany({
        where: { emploiId: cree.id },
        orderBy: { moisEffet: 'asc' },
      });
      expect(versions).toHaveLength(2);
      expect(versions[0]?.moisEffet).toBe('2025-01');
      expect(versions[0]?.montant.toString()).toBe('12000.5');
      expect(versions[1]?.moisEffet).toBe('2025-07');
      expect(versions[1]?.montant.toString()).toBe('15000');

      const historique = await fetch(
        urlLocale(appBulletin, `/emplois/${cree.id}/versions/remuneration`),
        { headers: entetes(utilisateurId, societeA.companyId) }
      );
      const { donnees } = (await historique.json()) as {
        donnees: { moisEffet: string; remuneration: { montant: string } }[];
      };
      expect(donnees).toHaveLength(2);
      const versionInitiale = donnees.find((v) => v.moisEffet === '2025-01');
      const versionCourante = donnees.find((v) => v.moisEffet === '2025-07');
      expect(versionInitiale).toBeDefined();
      expect(versionCourante).toBeDefined();
      expect(versionInitiale!.remuneration.montant.startsWith('12000.5')).toBe(true);
      expect(versionCourante!.remuneration.montant).toBe('15000');
    } finally {
      await appBulletin.close();
    }
  });

  it('5 — la premiere version d un bloc porte le mois de la date de debut de l emploi', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-MOIS-EFFET`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      { contrat: { dateDebut: '2025-03-15' } }
    );

    const contrat = await prisma.emploiContratVersion.findFirstOrThrow({
      where: { emploiId: cree.id },
    });
    const remuneration = await prisma.emploiRemunerationVersion.findFirstOrThrow({
      where: { emploiId: cree.id },
    });
    const affectation = await prisma.emploiAffectationVersion.findFirstOrThrow({
      where: { emploiId: cree.id },
    });

    expect(contrat.moisEffet).toBe('2025-03');
    expect(remuneration.moisEffet).toBe('2025-03');
    expect(affectation.moisEffet).toBe('2025-03');
  });

  it('6 — modifier un salaire avec bulletin valide est accepte sans blocage ni alerte', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-01', etat: EtatBulletin.VALIDE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-BULLETIN-VALIDE`,
      });
      const { donnees: cree } = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId
      );

      const reponse = await patchRemuneration(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        cree.id,
        cree.version,
        { montant: '16000' }
      );
      expect(reponse.status).toBe(200);
      const corps = (await reponse.json()) as { alertes: unknown[] };
      expect(corps.alertes).toHaveLength(0);
    } finally {
      await appBulletin.close();
    }
  });

  it('7 — une date de fin anterieure a la date de debut est refusee et rien n est ecrit', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DATE-FIN`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateFin: '2024-12-31' }
    );
    expect(reponse.status).toBe(400);

    const version = await prisma.emploiContratVersion.findFirstOrThrow({
      where: { emploiId: cree.id },
    });
    expect(version.dateFin).toBeNull();
  });

  it('8 — un CDD sans date de fin est enregistre sans aucune alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-CDD-SANS-FIN`,
    });
    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/emplois`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadEmploi(societeA.etablissementPrincipalId, {
          contrat: { typeContratCode: 'CDD' },
        })
      ),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('9a — une date de sortie qui apparait demande une confirmation', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SORTIE-CONF`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2025-06-30' }
    );
    expect(reponse.status).toBe(409);
    const corps = (await reponse.json()) as { code: string; jetonConfirmation?: string };
    expect(corps.code).toBe('CONFIRMATION_REQUISE');
    expect(corps.jetonConfirmation).toBeDefined();
  });

  it('9b — la meme operation avec le jeton passe', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SORTIE-JETON`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const sansJeton = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2025-06-30' }
    );
    const { jetonConfirmation } = (await sansJeton.json()) as { jetonConfirmation: string };

    const avecJeton = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2025-06-30' },
      jetonConfirmation
    );
    expect(avecJeton.status).toBe(200);
  });

  it('9c — modifier ensuite la date de sortie ne redemande aucune confirmation', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SORTIE-SUITE`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const premiere = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2025-06-30' }
    );
    const { jetonConfirmation } = (await premiere.json()) as { jetonConfirmation: string };

    const confirmee = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2025-06-30' },
      jetonConfirmation
    );
    const { donnees: apresConfirm } = (await confirmee.json()) as {
      donnees: { version: number };
    };

    const modification = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      apresConfirm.version,
      { dateSortie: '2025-07-15' }
    );
    expect(modification.status).toBe(200);
  });

  it('modifier le poste seul, dans un emploi sans date de sortie, ne demande aucune confirmation', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-POSTE-SEUL`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { libellePoste: 'Chef comptable' }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: { contrat: { libellePoste: string } } };
    expect(corps.donnees.contrat.libellePoste).toBe('Chef comptable');
  });

  it('modifier le poste ET faire apparaitre une date de sortie dans le meme appel demande la confirmation', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-POSTE-SORTIE`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { libellePoste: 'Adjoint', dateSortie: '2025-08-01' }
    );
    expect(reponse.status).toBe(409);
    const corps = (await reponse.json()) as { code: string };
    expect(corps.code).toBe('CONFIRMATION_REQUISE');
  });

  it('10 — cloturer le dernier emploi ouvert rend le salarie inactif', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-INACTIF`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const sansJeton = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2020-01-01' }
    );
    const { jetonConfirmation } = (await sansJeton.json()) as { jetonConfirmation: string };

    await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2020-01-01' },
      jetonConfirmation
    );

    const fiche = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const { donnees } = (await fiche.json()) as { donnees: { etat: string } };
    expect(donnees.etat).toBe('INACTIF');
  });

  it('11 — un emploi sans bulletin est supprimable alors qu un autre emploi du meme salarie en a', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParEmploi: async (emploiId: string) => {
          const emploi = await prisma.emploi.findUnique({ where: { id: emploiId } });
          if (emploi?.numeroOrdre === 1) {
            return [{ mois: '2025-01', etat: EtatBulletin.CALCULE }] as const;
          }
          return [];
        },
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-SUPPR-EMPLOI`,
      });
      const emploi1 = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId
      );
      const emploi2 = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementSecondaireId,
        { contrat: { libellePoste: 'Second', dateDebut: '2025-02-01' } }
      );

      const reponse = await fetch(urlLocale(appBulletin, `/emplois/${emploi2.donnees.id}`), {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'if-match': String(emploi2.donnees.version),
        },
      });
      expect(reponse.status).toBe(200);

      const encore = await prisma.emploi.findUnique({ where: { id: emploi1.donnees.id } });
      expect(encore).not.toBeNull();
      const supprime = await prisma.emploi.findUnique({ where: { id: emploi2.donnees.id } });
      expect(supprime).toBeNull();
    } finally {
      await appBulletin.close();
    }
  });

  it('12a — sans SMIG au referentiel, un salaire tres bas ne produit aucune alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SMIG-ABSENT`,
    });
    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/emplois`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadEmploi(societeA.etablissementPrincipalId, {
          remuneration: { montant: '100' },
        })
      ),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('12b — avec SMIG fourni au port, l alerte C19 apparait', async () => {
    const appRef = await creerAppAvecPorts({
      referentiel: {
        lireValeur: async (cle) => (cle === 'SMIG' ? new Decimal('3000') : null),
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-SMIG-ALERTE`,
      });
      const reponse = await fetch(urlLocale(appRef, `/salaries/${salarie.id}/emplois`), {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'content-type': 'application/json',
        },
        body: JSON.stringify(
          payloadEmploi(societeA.etablissementPrincipalId, {
            remuneration: { montant: '1000' },
          })
        ),
      });
      expect(reponse.status).toBe(201);
      const corps = (await reponse.json()) as { alertes: { code: string }[] };
      expect(corps.alertes.some((a) => a.code === 'SALAIRE_INFERIEUR_SMIG')).toBe(true);
    } finally {
      await appRef.close();
    }
  });

  it('13 — une duree hebdomadaire de 44 h rend une duree mensuelle exacte sans flottant', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DUREE-44H`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      {
        affectation: {
          baseSaisieDuree: 'HEBDOMADAIRE',
          dureeContractuelle: '44',
        },
      }
    );

    const attendu = new Decimal('44').times(COEFFICIENT_HEBDO_VERS_MENSUEL).toString();
    const lu = await fetch(urlLocale(app, `/emplois/${cree.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const { donnees } = (await lu.json()) as {
      donnees: { affectation: { dureeDansAutreBase: string } };
    };
    expect(donnees.affectation.dureeDansAutreBase).toBe(attendu);
    expect(donnees.affectation.dureeDansAutreBase).not.toMatch(/e/i);
  });

  it('14 — sans droit remuneration, emploi et versions historiques masquent remuneration et paiement', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-MASQUAGE`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    await patchRemuneration(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { montant: '9999' }
    );

    const entetesMasque = entetes(utilisateurId, societeA.companyId, {
      [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
    });

    const emploi = await fetch(urlLocale(app, `/emplois/${cree.id}`), {
      headers: entetesMasque,
    });
    const corpsEmploi = (await emploi.json()) as { donnees: Record<string, unknown> };
    expect('remuneration' in corpsEmploi.donnees).toBe(false);
    expect('paiement' in corpsEmploi.donnees).toBe(false);

    const versions = await fetch(
      urlLocale(app, `/emplois/${cree.id}/versions/remuneration`),
      { headers: entetesMasque }
    );
    const corpsVersions = (await versions.json()) as {
      donnees: Record<string, unknown>[];
    };
    expect(corpsVersions.donnees.length).toBeGreaterThan(0);
    for (const ligne of corpsVersions.donnees) {
      expect('remuneration' in ligne).toBe(false);
      expect('paiement' in ligne).toBe(false);
    }
  });

  it('repli futur — un emploi a date de debut posterieure au mois en cours est lisible avec sa premiere version', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-REPLI-FUTUR`,
    });
    await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );
    const { donnees: futur } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementSecondaireId,
      {
        contrat: { libellePoste: 'Poste futur', dateDebut: '2025-08-01' },
        remuneration: { montant: '8500' },
      }
    );

    const reponse = await fetch(urlLocale(app, `/emplois/${futur.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    expect(reponse.status).toBe(200);
    const { donnees } = (await reponse.json()) as {
      donnees: {
        contrat: { libellePoste: string; dateDebut: string };
        remuneration: { montant: string };
      };
    };
    expect(donnees.contrat.libellePoste).toBe('Poste futur');
    expect(donnees.contrat.dateDebut).toBe('2025-08-01');
    expect(donnees.remuneration.montant).toBe('8500');
  });

  it('repli futur — une fois le mois de debut atteint, la version applicable est rendue et non le repli', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-08', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-REPLI-ATTEINT`,
      });
      const { donnees: cree } = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId,
        {
          contrat: { libellePoste: 'Avant patch', dateDebut: '2025-08-01' },
          remuneration: { montant: '9000' },
        }
      );

      const patch = await patchRemuneration(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        cree.id,
        cree.version,
        { montant: '9500' }
      );
      expect(patch.status).toBe(200);

      const lu = await fetch(urlLocale(appBulletin, `/emplois/${cree.id}`), {
        headers: entetes(utilisateurId, societeA.companyId),
      });
      const { donnees } = (await lu.json()) as {
        donnees: { remuneration: { montant: string } };
      };
      expect(donnees.remuneration.montant).toBe('9500');
    } finally {
      await appBulletin.close();
    }
  });

  it('repli futur — GET versions/remuneration rend toutes les versions sans repli de lecture', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-VERSIONS-SANS-REPLI`,
    });
    await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );
    const { donnees: futur } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementSecondaireId,
      {
        contrat: { dateDebut: '2025-09-01' },
        remuneration: { montant: '7700' },
      }
    );

    const reponse = await fetch(
      urlLocale(app, `/emplois/${futur.id}/versions/remuneration`),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );
    expect(reponse.status).toBe(200);
    const { donnees } = (await reponse.json()) as {
      donnees: { moisEffet: string; remuneration: { montant: string } }[];
    };
    expect(donnees).toHaveLength(1);
    expect(donnees[0]?.moisEffet).toBe('2025-09');
    expect(donnees[0]?.remuneration.montant).toBe('7700');
  });

  it('C4 — une date de sortie hors intervalle est enregistree avec alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C4-SORTIE`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      {
        contrat: {
          dateDebut: '2025-06-01',
          dateFin: '2025-12-31',
          dateSortie: '2025-08-01',
        },
      }
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2026-02-01' }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      alertes: { code: string }[];
      donnees: { contrat: { dateSortie: string | null } };
    };
    expect(corps.alertes.some((a) => a.code === 'DATE_SORTIE_HORS_INTERVALLE')).toBe(true);
    expect(corps.donnees.contrat.dateSortie).toBe('2026-02-01');
  });

  it('C5 — une fin de periode d essai hors intervalle est enregistree avec alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C5-ESSAI`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      { contrat: { dateDebut: '2025-01-01', dateFin: '2025-06-30' } }
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { periodeEssaiDateFin: '2025-09-01' }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'FIN_ESSAI_HORS_INTERVALLE')).toBe(true);
  });

  it('C6 — un renouvellement anterieur a la fin de l essai initial est enregistre avec alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C6-RENOUV`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const reponse = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      {
        periodeEssaiDateFin: '2025-03-01',
        renouvellementEssaiDateFin: '2025-02-01',
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'RENOUVELLEMENT_ESSAI_ANTERIEUR')).toBe(true);
  });

  it('C20 — deux emplois actifs depassant le seuil legal produisent une alerte', async () => {
    const appRef = await creerAppAvecPorts({
      referentiel: {
        lireValeur: async (cle) =>
          cle === 'DUREE_LEGALE_TRAVAIL' ? new Decimal('40') : null,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-C20-ALERTE`,
      });
      await creerEmploiViaApi(
        appRef,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId,
        { affectation: { dureeContractuelle: '25' } }
      );

      const reponse = await fetch(urlLocale(appRef, `/salaries/${salarie.id}/emplois`), {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'content-type': 'application/json',
        },
        body: JSON.stringify(
          payloadEmploi(societeA.etablissementSecondaireId, {
            contrat: { libellePoste: 'Second', dateDebut: '2025-02-01' },
            affectation: { dureeContractuelle: '25' },
          })
        ),
      });
      expect(reponse.status).toBe(201);
      const corps = (await reponse.json()) as { alertes: { code: string }[] };
      expect(
        corps.alertes.some((a) => a.code === 'DUREE_CONTRACTUELLE_TOTALE_EXCESSIVE')
      ).toBe(true);
    } finally {
      await appRef.close();
    }
  });

  it('C20 — sans seuil au referentiel, la meme configuration ne produit aucune alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C20-ABSENT`,
    });
    await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId,
      { affectation: { dureeContractuelle: '25' } }
    );

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/emplois`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadEmploi(societeA.etablissementSecondaireId, {
          contrat: { libellePoste: 'Second', dateDebut: '2025-02-01' },
          affectation: { dureeContractuelle: '25' },
        })
      ),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('D3 — effacer la date de sortie rouvre l emploi sans confirmation et reactive le salarie', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-D3-REOUV`,
    });
    const { donnees: cree } = await creerEmploiViaApi(
      app,
      utilisateurId,
      societeA.companyId,
      salarie.id,
      societeA.etablissementPrincipalId
    );

    const sansJeton = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2020-01-01' }
    );
    const { jetonConfirmation } = (await sansJeton.json()) as { jetonConfirmation: string };

    const clos = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      cree.version,
      { dateSortie: '2020-01-01' },
      jetonConfirmation
    );
    const { donnees: apresCloture } = (await clos.json()) as {
      donnees: { version: number; contrat: { estOuvert: boolean } };
    };
    expect(apresCloture.contrat.estOuvert).toBe(false);

    const ficheInactive = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    expect(((await ficheInactive.json()) as { donnees: { etat: string } }).donnees.etat).toBe(
      'INACTIF'
    );

    const reouverture = await patchContrat(
      app,
      utilisateurId,
      societeA.companyId,
      cree.id,
      apresCloture.version,
      { dateSortie: null }
    );
    expect(reouverture.status).toBe(200);
    const corpsReouverture = (await reouverture.json()) as {
      donnees: { contrat: { dateSortie: string | null; estOuvert: boolean } };
    };
    expect(corpsReouverture.donnees.contrat.dateSortie).toBeNull();
    expect(corpsReouverture.donnees.contrat.estOuvert).toBe(true);

    const ficheActive = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    expect(((await ficheActive.json()) as { donnees: { etat: string } }).donnees.etat).toBe(
      'ACTIF'
    );
  });

  it('B5 — la suppression d un emploi ayant un bulletin est refusee et l emploi reste en base', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParEmploi: async () =>
          [{ mois: '2025-01', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-SUPPR-REFUS`,
      });
      const { donnees: cree } = await creerEmploiViaApi(
        appBulletin,
        utilisateurId,
        societeA.companyId,
        salarie.id,
        societeA.etablissementPrincipalId
      );

      const suppression = await fetch(urlLocale(appBulletin, `/emplois/${cree.id}`), {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'if-match': String(cree.version),
        },
      });
      expect(suppression.status).toBe(409);
      expect(((await suppression.json()) as { code: string }).code).toBe('SUPPRESSION_INTERDITE');

      const encore = await prisma.emploi.findUnique({ where: { id: cree.id } });
      expect(encore).not.toBeNull();
    } finally {
      await appBulletin.close();
    }
  });
});
