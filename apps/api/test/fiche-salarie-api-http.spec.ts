import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { BULLETIN_PORT, EtatBulletin } from '../src/modules/salaries/bulletin/bulletin.port.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-salarie-api-${Date.now()}`;

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

function payloadSalarieMin(surcharge: Record<string, unknown> = {}) {
  return {
    nom: 'Alami',
    prenom: 'Said',
    sexe: 'HOMME',
    dateNaissance: '1990-05-15',
    dateEntree: '2025-01-01',
    ...surcharge,
  };
}

describe('API fiche salarie — endpoints salarie (2.1.b-2)', () => {
  let app: INestApplication;
  let formeId: string;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;
  let paysMarocId: string;
  let paysFranceId: string;
  let situationMarieCode: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const maroc = await prisma.pays.findFirstOrThrow({ where: { codeIso: 'MA' } });
    const france = await prisma.pays.findFirstOrThrow({ where: { codeIso: 'FR' } });
    paysMarocId = maroc.id;
    paysFranceId = france.id;

    const situationMarie = await prisma.situationFamiliale.findFirstOrThrow({
      where: { code: 'MARIE' },
    });
    situationMarieCode = situationMarie.code;

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

    societeA = await creerSocieteTest(prisma, formeId, compte.id, `${PREFIXE}-SA`);
    societeB = await creerSocieteTest(prisma, formeId, compte.id, `${PREFIXE}-SB`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('1 — une fiche peut etre creee sans aucun emploi', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieMin({ matricule: `${PREFIXE}-SANS-EMPLOI` })),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { donnees: { id: string } };
    const emplois = await prisma.emploi.count({ where: { salarieId: corps.donnees.id } });
    expect(emplois).toBe(0);
  });

  it('2a — un matricule laisse vide est attribue automatiquement', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieMin({ nom: 'Benali', prenom: 'Karim' })),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { donnees: { matricule: string } };
    expect(corps.donnees.matricule.length).toBeGreaterThan(0);
    expect(corps.donnees.matricule.startsWith('EMP')).toBe(true);
  });

  it('2b — un matricule saisi est accepte tel quel, quelle que soit sa longueur', async () => {
    const matriculeLong = `${PREFIXE}-MATRICULE-TRES-LONG-POUR-REPRISE`;
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieMin({ matricule: matriculeLong, nom: 'Tazi', prenom: 'Nadia' })),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { donnees: { matricule: string }; alertes: unknown[] };
    expect(corps.donnees.matricule).toBe(matriculeLong);
    expect(corps.alertes).toHaveLength(0);
  });

  it('3 — un matricule deja pris dans la societe est refuse avec un message neutre', async () => {
    const matricule = `${PREFIXE}-DOUBLON`;
    await creerSalarieMin(prisma, societeA.companyId, { matricule });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieMin({ matricule, nom: 'Autre', prenom: 'Personne' })),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { message?: string; code?: string };
    expect(corps.message).toBe("Cette valeur n'est pas disponible.");
    expect(corps.message).not.toMatch(/Alami|Said|doublon|conflict/i);
  });

  it('4 — le meme matricule est accepte dans une autre societe du meme compte', async () => {
    const matricule = `${PREFIXE}-CROSS-SOCIETE`;
    await creerSalarieMin(prisma, societeA.companyId, { matricule });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeB.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieMin({ matricule, nom: 'Idrissi', prenom: 'Hassan' })),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('5a — un salarie sans emploi ouvert est rendu inactif', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-INACTIF`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: { etat: string } };
    expect(corps.donnees.etat).toBe('INACTIF');
  });

  it('5b — un emploi ouvert rend le salarie actif sans champ etat saisi', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ACTIF`,
    });
    await creerEmploiOuvert(
      prisma,
      salarie.id,
      societeA.etablissementPrincipalId,
      1
    );

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });

    const corps = (await reponse.json()) as { donnees: { etat: string } };
    expect(corps.donnees.etat).toBe('ACTIF');
  });

  it('6a — la nationalite marocaine rend le type de piece CIN', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieMin({
          matricule: `${PREFIXE}-NAT-MA`,
          nationaliteId: paysMarocId,
          nom: 'Bennani',
          prenom: 'Leila',
        })
      ),
    });

    const { donnees } = (await reponse.json()) as { donnees: { typePieceIdentite: string } };
    expect(donnees.typePieceIdentite).toBe('CIN');
  });

  it('6b — une nationalite etrangere rend carte de sejour', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieMin({
          matricule: `${PREFIXE}-NAT-FR`,
          nationaliteId: paysFranceId,
          nom: 'Martin',
          prenom: 'Paul',
        })
      ),
    });

    const { donnees } = (await reponse.json()) as { donnees: { typePieceIdentite: string } };
    expect(donnees.typePieceIdentite).toBe('carte de séjour');
  });

  it('7 — une salariee MARIE est rendue avec le libelle Mariee', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieMin({
          matricule: `${PREFIXE}-MARIE`,
          sexe: 'FEMME',
          situationFamilialeCode: situationMarieCode,
          nom: 'Chraibi',
          prenom: 'Amina',
        })
      ),
    });

    const { donnees } = (await reponse.json()) as {
      donnees: { situationFamiliale: { libelle: string } };
    };
    expect(donnees.situationFamiliale.libelle).toBe('Mariée');
  });

  it('8 — une date d anciennete posterieure a la date d entree est enregistree avec alerte', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieMin({
          matricule: `${PREFIXE}-ANCIENNETE`,
          dateEntree: '2025-01-01',
          dateAnciennete: '2025-06-01',
          nom: 'Fassi',
          prenom: 'Omar',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: { dateAnciennete: string };
      alertes: { code: string }[];
    };
    expect(corps.donnees.dateAnciennete).toBe('2025-06-01');
    expect(corps.alertes.some((a) => a.code === 'ANCIENNETE_POSTERIEURE_ENTREE')).toBe(true);
  });

  it('9 — le pre-controle homonyme rend une alerte et n ecrit rien', async () => {
    const salarieActif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-HOMONYME-REF`,
    });
    await creerEmploiOuvert(
      prisma,
      salarieActif.id,
      societeA.etablissementPrincipalId,
      1
    );

    const avant = await prisma.salarie.count({
      where: { companyId: societeA.companyId, nom: 'Alami', prenom: 'Said' },
    });

    const reponse = await fetch(urlLocale(app, '/salaries/verifier'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ nom: 'Alami', prenom: 'Said', dateNaissance: '1990-05-15' }),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'HOMONYME')).toBe(true);

    const apres = await prisma.salarie.count({
      where: { companyId: societeA.companyId, nom: 'Alami', prenom: 'Said' },
    });
    expect(apres).toBe(avant);
  });

  it('10 — le pre-controle reembauche rend l identifiant du salarie inactif existant', async () => {
    const inactif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-REEMBAUCHE-REF`,
      numeroPiece: `${PREFIXE}-CIN-REEMBAUCHE`,
    });

    const reponse = await fetch(urlLocale(app, '/salaries/verifier'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Nouveau',
        prenom: 'Candidat',
        numeroPiece: `${PREFIXE}-CIN-REEMBAUCHE`,
        dateNaissance: '1988-01-01',
      }),
    });

    const corps = (await reponse.json()) as {
      alertes: { code: string; salarieExistantId?: string }[];
    };
    const alerte = corps.alertes.find((a) => a.code === 'REEMBAUCHE');
    expect(alerte?.salarieExistantId).toBe(inactif.id);

    const emplois = await prisma.emploi.count({ where: { salarieId: inactif.id } });
    expect(emplois).toBe(0);
  });

  it('11a — la suppression demande un jeton de confirmation', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SUPPR-JETON`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      method: 'DELETE',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'if-match': '0',
      },
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string };
    expect(corps.code).toBe('CONFIRMATION_REQUISE');
  });

  it('11b — un jeton obsolete est refuse a la suppression', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SUPPR-OBS`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}?confirmationJeton=jeton-invalide`),
      {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'if-match': '0',
        },
      }
    );

    expect(reponse.status).toBe(409);
    const corps = (await reponse.json()) as { code: string };
    expect(corps.code).toBe('CONFIRMATION_OBSOLETE');
  });

  it('12 — un salarie ayant un bulletin ne peut pas etre supprime et sa fiche existe toujours', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule],
    })
      .overrideProvider(BULLETIN_PORT)
      .useValue({
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-01', etat: EtatBulletin.CALCULE }] as const,
      })
      .compile();

    const appBulletin = moduleRef.createNestApplication();
    appBulletin.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await appBulletin.init();
    await appBulletin.listen(0);

    try {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-BULLETIN-BLOC`,
      });

      const impact = await fetch(
        urlLocale(appBulletin, `/salaries/${salarie.id}/impact-suppression`),
        { headers: entetes(utilisateurId, societeA.companyId) }
      );
      const { donnees } = (await impact.json()) as { donnees: { jetonConfirmation: string } };

      const suppression = await fetch(
        urlLocale(
          appBulletin,
          `/salaries/${salarie.id}?confirmationJeton=${donnees.jetonConfirmation}`
        ),
        {
          method: 'DELETE',
          headers: {
            ...entetes(utilisateurId, societeA.companyId),
            'if-match': '0',
          },
        }
      );

      expect(suppression.status).toBe(409);
      const corps = (await suppression.json()) as { code: string };
      expect(corps.code).toBe('SUPPRESSION_INTERDITE');

      const encore = await prisma.salarie.findUnique({ where: { id: salarie.id } });
      expect(encore).not.toBeNull();
    } finally {
      await appBulletin.close();
    }
  });

  it('la lecture expose les collections vides en tableaux', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-COLLECTIONS`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });

    const { donnees } = (await reponse.json()) as { donnees: Record<string, unknown> };
    expect(Array.isArray(donnees.emplois)).toBe(true);
    expect(Array.isArray(donnees.personnesACharge)).toBe(true);
    expect(Array.isArray(donnees.comptesBancaires)).toBe(true);
    expect(Array.isArray(donnees.prets)).toBe(true);
    expect(Array.isArray(donnees.saisiesSurSalaire)).toBe(true);
  });
});
