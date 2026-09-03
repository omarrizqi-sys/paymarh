import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { BULLETIN_PORT, EtatBulletin, type BulletinPort } from '../src/modules/salaries/bulletin/bulletin.port.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from '../src/modules/salaries/referentiel-national/referentiel-national.port.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { ligneLisiblePourMois } from '../src/modules/salaries/historisation-temporelle.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-tableaux-api-${Date.now()}`;

function codesBanqueFixture(): { codeRib: string; codeAutre: string } {
  const n = Number(PREFIXE.replace(/\D/g, '').slice(-5)) % 800 + 100;
  return {
    codeRib: String(n).padStart(3, '0'),
    codeAutre: String(n + 1).padStart(3, '0'),
  };
}

function ribDepuisCode(codeBanque: string, suffixe: string): string {
  return `${codeBanque}7800000000000000${suffixe}`.slice(0, 24);
}

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

async function creerAppAvecPorts(options: {
  bulletins?: Partial<BulletinPort>;
  referentiel?: Partial<ReferentielNationalPort>;
}): Promise<INestApplication> {
  let moduleRef = Test.createTestingModule({
    imports: [AppModule, SocleTestModule],
  });

  moduleRef = moduleRef.overrideProvider(BULLETIN_PORT).useValue({
    listerBulletinsParSalarie: async () => [],
    listerBulletinsParEmploi: async () => [],
    ...options.bulletins,
  });

  moduleRef = moduleRef.overrideProvider(REFERENTIEL_NATIONAL_PORT).useValue({
    lireValeur: async () => null,
    ...options.referentiel,
  });

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

describe('API fiche salarie — tableaux repetables (2.1.b-4)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;

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
    societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('1 — aucune limite sur personnes a charge, prets et comptes bancaires', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-LIMITES`,
    });

    let version = 0;
    for (let i = 0; i < 10; i++) {
      const reponse = await fetch(
        urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`),
        {
          method: 'POST',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'content-type': 'application/json',
            'if-match': String(version),
          },
          body: JSON.stringify({
            lienParenteCode: 'ENFANT',
            prenom: `Enf${String.fromCharCode(65 + i)}`,
            nom: 'Test',
            sexe: 'HOMME',
            dateNaissance: `201${i % 10}-0${(i % 9) + 1}-15`,
            aCharge: true,
          }),
        }
      );
      expect(reponse.status).toBe(201);
      const corps = (await reponse.json()) as { donnees: { version: number } };
      version = corps.donnees.version;
    }

    for (let i = 0; i < 10; i++) {
      const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(version),
        },
        body: JSON.stringify({
          libelleObjet: `Pret ${i}`,
          libelleBulletin: `PRET${i}`,
          montantTotal: '1000.00',
          moisDebut: '2024-01',
          mensualite: '100.00',
          nombreEcheances: 10,
        }),
      });
      expect(reponse.status).toBe(201);
      const corps = (await reponse.json()) as { donnees: { version: number } };
      version = corps.donnees.version;
    }

    const comptes = Array.from({ length: 10 }, (_, i) => ({
      rib: `007780000000000000${String(i).padStart(2, '0')}`,
      partVirement: '10.00',
    }));

    const reponseComptes = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(version),
        },
        body: JSON.stringify({ comptes }),
      }
    );
    expect(reponseComptes.status).toBe(200);
  });

  it('2 — un pret jamais utilise par bulletin disparait a la suppression', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PRET-SUPPR`,
    });

    const creation = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        libelleObjet: 'Pret test',
        libelleBulletin: 'PRET',
        montantTotal: '1200.00',
        moisDebut: '2024-06',
        mensualite: '100.00',
        nombreEcheances: 12,
      }),
    });
    const { donnees } = (await creation.json()) as {
      donnees: { prets: { id: string }[]; version: number };
    };
    const pretId = donnees.prets[0]?.id;
    expect(pretId).toBeDefined();

    const impact = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/prets/${pretId}/impact-suppression`),
      { headers: entetes(utilisateurId, societe.companyId) }
    );
    const impactCorps = (await impact.json()) as { donnees: { jetonConfirmation: string } };

    const suppression = await fetch(
      urlLocale(
        app,
        `/salaries/${salarie.id}/prets/${pretId}?confirmationJeton=${impactCorps.donnees.jetonConfirmation}`
      ),
      {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'if-match': String(donnees.version),
        },
      }
    );
    expect(suppression.status).toBe(200);

    const enBase = await prisma.pret.findUnique({ where: { id: pretId } });
    expect(enBase).toBeNull();
  });

  it('3 — un pret utilise par bulletin devient inactive avec date de fin', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-PRET-INACTIF`,
      });

      const pret = await prisma.pret.create({
        data: {
          salarieId: salarie.id,
          libelleObjet: 'Pret historique',
          libelleBulletin: 'PRET',
          montantTotal: new Decimal('1000'),
          moisDebut: '2025-01',
          mensualite: new Decimal('100'),
          nombreEcheances: 10,
          moisEffetDebut: '2025-01',
          moisEffetFin: null,
        },
      });

      const impact = await fetch(
        urlLocale(appBulletin, `/salaries/${salarie.id}/prets/${pret.id}/impact-suppression`),
        { headers: entetes(utilisateurId, societe.companyId) }
      );
      const { donnees: impactDonnees } = (await impact.json()) as {
        donnees: { jetonConfirmation: string; mode: string };
      };
      expect(impactDonnees.mode).toBe('inactiver');

      const suppression = await fetch(
        urlLocale(
          appBulletin,
          `/salaries/${salarie.id}/prets/${pret.id}?confirmationJeton=${impactDonnees.jetonConfirmation}`
        ),
        {
          method: 'DELETE',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'if-match': '0',
          },
        }
      );
      expect(suppression.status).toBe(200);

      const corps = (await suppression.json()) as {
        donnees: { prets: { id: string; etat: string; moisEffetFin: string | null }[] };
      };
      const ligne = corps.donnees.prets.find((p) => p.id === pret.id);
      expect(ligne).toBeDefined();
      expect(ligne?.etat).toBe('INACTIVE');
      expect(ligne?.moisEffetFin).toBe('2025-07');

      const enBase = await prisma.pret.findUnique({ where: { id: pret.id } });
      expect(enBase).not.toBeNull();
      expect(enBase?.moisEffetFin).toBe('2025-07');
      expect(
        ligneLisiblePourMois(
          { moisEffetDebut: enBase!.moisEffetDebut, moisEffetFin: enBase!.moisEffetFin },
          '2025-03'
        )
      ).toBe(true);
    } finally {
      await appBulletin.close();
    }
  });

  it('4a — un seul compte bancaire sans pourcentage', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CB-UN`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          comptes: [{ rib: '007780000000000000000000' }],
        }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { comptesBancaires: { partVirement: string | null }[] };
    };
    expect(corps.donnees.comptesBancaires[0]?.partVirement).toBeNull();
  });

  it('4b — deux comptes a 90 % sont refuses', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CB-90`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          comptes: [
            { rib: '007780000000000000000001', partVirement: '45.00' },
            { rib: '007780000000000000000002', partVirement: '45.00' },
          ],
        }),
      }
    );
    expect(reponse.status).toBe(400);

    const comptes = await prisma.compteBancaireSalarie.count({
      where: { salarieId: salarie.id },
    });
    expect(comptes).toBe(0);
  });

  it('4c — deux comptes a 100 % passent', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CB-100`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          comptes: [
            { rib: '007780000000000000000011', partVirement: '60.00' },
            { rib: '007780000000000000000012', partVirement: '40.00' },
          ],
        }),
      }
    );
    expect(reponse.status).toBe(200);
  });

  it('5 — deux enfants identiques sont enregistres avec alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-JUMEAUX`,
    });

    const payload = {
      lienParenteCode: 'ENFANT',
      prenom: 'Amine',
      nom: 'Benjelloun',
      sexe: 'HOMME',
      dateNaissance: '2015-03-10',
      aCharge: true,
    };

    await fetch(urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(payload),
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '1',
        },
        body: JSON.stringify(payload),
      }
    );
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'PERSONNE_A_CHARGE_DOUBLON')).toBe(true);
    expect(
      (await prisma.personneACharge.count({ where: { salarieId: salarie.id } }))
    ).toBe(2);
  });

  it('6a — enfant age depasse produit alerte C8 si referentiel fournit le seuil', async () => {
    const appRef = await creerAppAvecPorts({
      referentiel: {
        lireValeur: async (cle) =>
          cle === 'AGE_MAX_ENFANT_CHARGE' ? new Decimal(21) : null,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-C8-ALERTE`,
      });

      const reponse = await fetch(
        urlLocale(appRef, `/salaries/${salarie.id}/personnes-a-charge`),
        {
          method: 'POST',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'content-type': 'application/json',
            'if-match': '0',
          },
          body: JSON.stringify({
            lienParenteCode: 'ENFANT',
            prenom: 'Adulte',
            nom: 'Charge',
            sexe: 'HOMME',
            dateNaissance: '1990-01-01',
            aCharge: true,
          }),
        }
      );
      const corps = (await reponse.json()) as { alertes: { code: string }[] };
      expect(corps.alertes.some((a) => a.code === 'ENFANT_AGE_DEPASSE')).toBe(true);
    } finally {
      await appRef.close();
    }
  });

  it('6b — aucune alerte C8 sans referentiel', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-C8-SANS`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          lienParenteCode: 'ENFANT',
          prenom: 'Adulte',
          nom: 'SansRef',
          sexe: 'HOMME',
          dateNaissance: '1990-01-01',
          aCharge: true,
        }),
      }
    );
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'ENFANT_AGE_DEPASSE')).toBe(false);
  });

  it('6c — aucune alerte C8 si situation de handicap cochee', async () => {
    const appRef = await creerAppAvecPorts({
      referentiel: {
        lireValeur: async (cle) =>
          cle === 'AGE_MAX_ENFANT_CHARGE' ? new Decimal(21) : null,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-C8-HAND`,
      });

      const reponse = await fetch(
        urlLocale(appRef, `/salaries/${salarie.id}/personnes-a-charge`),
        {
          method: 'POST',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'content-type': 'application/json',
            'if-match': '0',
          },
          body: JSON.stringify({
            lienParenteCode: 'ENFANT',
            prenom: 'Handicap',
            nom: 'Enfant',
            sexe: 'HOMME',
            dateNaissance: '1990-01-01',
            aCharge: true,
            situationHandicap: true,
          }),
        }
      );
      const corps = (await reponse.json()) as { alertes: { code: string }[] };
      expect(corps.alertes.some((a) => a.code === 'ENFANT_AGE_DEPASSE')).toBe(false);
    } finally {
      await appRef.close();
    }
  });

  it('7 — un conjoint na pas de champ situationHandicap dans la reponse', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CONJOINT`,
    });

    await fetch(urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        lienParenteCode: 'CONJOINT',
        prenom: 'Fatima',
        nom: 'Alami',
        sexe: 'FEMME',
        dateNaissance: '1992-06-20',
        aCharge: true,
      }),
    });

    const lecture = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: { personnesACharge: Record<string, unknown>[] };
    };
    const conjoint = donnees.personnesACharge.find((p) => p.lienParenteCode === 'CONJOINT');
    expect(conjoint).toBeDefined();
    expect('situationHandicap' in (conjoint ?? {})).toBe(false);
  });

  it('8 — la meme prime rattachee deux fois est acceptee sans alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PRIME-DUP`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const payload = { primeRef: 'PRIME-TRANSPORT', moisApplication: [12] };

    await fetch(urlLocale(app, `/emplois/${emploi.id}/primes-contractuelles`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(payload),
    });

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/primes-contractuelles`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '1',
        },
        body: JSON.stringify(payload),
      }
    );
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('9 — deux statuts particuliers qui se chevauchent sont refuses', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-STATUT-CHEV`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    await fetch(urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        statutCode: 'IDMAJ',
        dateDebut: '2025-01-01',
        dateFin: '2025-12-31',
      }),
    });

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '1',
        },
        body: JSON.stringify({
          statutCode: 'IDMAJ',
          dateDebut: '2025-06-01',
          dateFin: null,
        }),
      }
    );
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string };
    expect(corps.code).toBe('CHEVAUCHEMENT_STATUTS');
  });

  it('10 — une ligne de statut propagee est en lecture seule', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-STATUT-PROP`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const statut = await prisma.statutParticulierLigne.create({
      data: {
        emploiId: emploi.id,
        statutCode: 'IDMAJ',
        dateDebut: new Date('2025-01-01'),
        origine: 'PROPAGE_SOCIETE',
      },
    });

    const modification = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers/${statut.id}`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ dateFin: '2025-12-31' }),
      }
    );
    expect(modification.status).toBe(409);

    const suppression = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers/${statut.id}`),
      {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'if-match': '0',
        },
      }
    );
    expect(suppression.status).toBe(409);
  });

  it('11 — saisie dont montant mensuel depasse total est refusee', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-SAISIE-BLOC`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          referenceDecision: 'DEC-001',
          creancier: 'Banque',
          libelleBulletin: 'SAISIE',
          montantTotal: '1000.00',
          montantMensuel: '1500.00',
          moisDebut: '2024-01',
        }),
      }
    );
    expect(reponse.status).toBe(400);
    expect(
      (await prisma.saisieSurSalaire.count({ where: { salarieId: salarie.id } }))
    ).toBe(0);
  });

  it('12 — pret incoherent mensualite x echeances est enregistre avec alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PRET-ALERTE`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        libelleObjet: 'Pret coherent',
        libelleBulletin: 'PRET',
        montantTotal: '1000.00',
        moisDebut: '2024-01',
        mensualite: '100.00',
        nombreEcheances: 10,
      }),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'MENSUALITE_ECHEANCES_INCOHERENTE')).toBe(
      false
    );

    const reponse2 = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '1',
      },
      body: JSON.stringify({
        libelleObjet: 'Pret incoherent',
        libelleBulletin: 'PRET2',
        montantTotal: '1000.00',
        moisDebut: '2024-01',
        mensualite: '90.00',
        nombreEcheances: 12,
      }),
    });
    const corps2 = (await reponse2.json()) as { alertes: { code: string }[] };
    expect(corps2.alertes.some((a) => a.code === 'MENSUALITE_ECHEANCES_INCOHERENTE')).toBe(
      true
    );
  });

  it('13 — mois de debut de prelevement dans le passe accepte sans alerte', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PRET-PASSE`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        libelleObjet: 'Reprise pret',
        libelleBulletin: 'PRET',
        montantTotal: '5000.00',
        moisDebut: '2020-01',
        mensualite: '200.00',
        nombreEcheances: 25,
      }),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('14 — nombre de personnes a charge calcule depuis les lignes', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-NB-PAC`,
    });

    await fetch(urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        lienParenteCode: 'ENFANT',
        prenom: 'A',
        nom: 'Test',
        sexe: 'HOMME',
        dateNaissance: '2015-01-01',
        aCharge: true,
      }),
    });

    await fetch(urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '1',
      },
      body: JSON.stringify({
        lienParenteCode: 'ENFANT',
        prenom: 'B',
        nom: 'Test',
        sexe: 'FEMME',
        dateNaissance: '2017-01-01',
        aCharge: false,
      }),
    });

    const lecture = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as { donnees: { nombrePersonnesACharge: number } };
    expect(donnees.nombrePersonnesACharge).toBe(1);

    const colonnes = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Salarie'
        AND column_name = 'nombrePersonnesACharge'`;
    expect(colonnes).toHaveLength(0);
  });

  it('15 — sans droit remuneration les comptes primes et avantages sont masques', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-MASQUAGE`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    await prisma.compteBancaireSalarie.create({
      data: { salarieId: salarie.id, rib: '007780000000000000000099' },
    });
    await prisma.primeContractuelle.create({
      data: { emploiId: emploi.id, primeRef: 'P1', moisApplication: [1] },
    });
    await prisma.avantageEnNature.create({
      data: {
        emploiId: emploi.id,
        natureRef: 'VOITURE',
        montant: new Decimal('500'),
        moisApplication: [1],
        moisEffetDebut: '2025-07',
      },
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      },
    });
    const corps = (await reponse.json()) as { donnees: Record<string, unknown> };
    expect('comptesBancaires' in corps.donnees).toBe(false);

    const emploiRep = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      },
    });
    const emploiCorps = (await emploiRep.json()) as { donnees: Record<string, unknown> };
    expect('primesContractuelles' in emploiCorps.donnees).toBe(false);
    expect('avantagesEnNature' in emploiCorps.donnees).toBe(false);
  });

  it('16 — modification personne a charge avec bulletin : deux lignes aux mois exacts', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-PAC-VERS`,
      });

      const pac = await prisma.personneACharge.create({
        data: {
          salarieId: salarie.id,
          lienParenteCode: 'ENFANT',
          prenom: 'Yassine',
          nom: 'Alami',
          sexe: 'HOMME',
          dateNaissance: new Date('2015-06-10'),
          aCharge: true,
          situationHandicap: false,
          moisEffetDebut: '2025-01',
          moisEffetFin: null,
        },
      });

      const modification = await fetch(
        urlLocale(appBulletin, `/salaries/${salarie.id}/personnes-a-charge/${pac.id}`),
        {
          method: 'PATCH',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'content-type': 'application/json',
            'if-match': '0',
          },
          body: JSON.stringify({ prenom: 'Yassin' }),
        }
      );
      expect(modification.status).toBe(200);

      const lignes = await prisma.personneACharge.findMany({
        where: { salarieId: salarie.id },
        orderBy: { moisEffetDebut: 'asc' },
      });
      expect(lignes).toHaveLength(2);

      const ancienne = lignes.find((l) => l.id === pac.id);
      const nouvelle = lignes.find((l) => l.id !== pac.id);
      expect(ancienne?.prenom).toBe('Yassine');
      expect(ancienne?.moisEffetFin).toBe('2025-06');
      expect(nouvelle?.prenom).toBe('Yassin');
      expect(nouvelle?.moisEffetDebut).toBe('2025-07');
      expect(nouvelle?.moisEffetFin).toBeNull();
    } finally {
      await appBulletin.close();
    }
  });

  it('17 — modification personne a charge sans bulletin : une seule ligne ecrasee', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PAC-ECRAS`,
    });
    await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const creation = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          lienParenteCode: 'ENFANT',
          prenom: 'Sara',
          nom: 'Benali',
          sexe: 'FEMME',
          dateNaissance: '2016-04-20',
          aCharge: true,
        }),
      }
    );
    const { donnees: creationDonnees } = (await creation.json()) as {
      donnees: { personnesACharge: { id: string }[]; version: number };
    };
    const pacId = creationDonnees.personnesACharge[0]?.id;
    expect(pacId).toBeDefined();

    const modification = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/personnes-a-charge/${pacId}`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(creationDonnees.version),
        },
        body: JSON.stringify({ prenom: 'Sarah' }),
      }
    );
    expect(modification.status).toBe(200);

    const lignes = await prisma.personneACharge.findMany({ where: { salarieId: salarie.id } });
    expect(lignes).toHaveLength(1);
    expect(lignes[0]?.id).toBe(pacId);
    expect(lignes[0]?.prenom).toBe('Sarah');
    expect(lignes[0]?.moisEffetDebut).toBe('2025-01');
    expect(lignes[0]?.moisEffetFin).toBeNull();
  });

  it('18 — statut particulier hors intervalle emploi est enregistre avec alerte C7', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-STATUT-HORS`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          statutCode: 'IDMAJ',
          dateDebut: '2024-06-01',
          dateFin: '2025-12-31',
        }),
      }
    );
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'STATUT_HORS_INTERVALLE_EMPLOI')).toBe(true);
    expect(
      (await prisma.statutParticulierLigne.count({ where: { emploiId: emploi.id } }))
    ).toBe(1);
  });

  it('19 — RIB deja utilise dans la societe produit alerte C12 sans blocage', async () => {
    const rib = '007780000000000000000777';
    await prisma.compteBancaire.create({
      data: { companyId: societe.companyId, rib },
    });

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RIB-DUP-SA`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ comptes: [{ rib }] }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'RIB_DEJA_UTILISE')).toBe(true);
    expect(
      (await prisma.compteBancaireSalarie.count({ where: { salarieId: salarie.id } }))
    ).toBe(1);
  });

  it('20 — le meme RIB dans une autre societe ne produit aucune alerte C12', async () => {
    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const societeB = await creerSocieteTest(
      prisma,
      forme.id,
      societe.accountId,
      `${PREFIXE}-SB`
    );
    const rib = '007780000000000000000888';

    await prisma.compteBancaire.create({
      data: { companyId: societe.companyId, rib },
    });

    const salarieB = await creerSalarieMin(prisma, societeB.companyId, {
      matricule: `${PREFIXE}-RIB-AUTRE-SA`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarieB.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societeB.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ comptes: [{ rib }] }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'RIB_DEJA_UTILISE')).toBe(false);
  });

  it('21 — RIB de longueur differente de 24 produit alerte C13 et le compte est cree', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RIB-FORMAT`,
    });
    const rib = '0077800000000000';

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ comptes: [{ rib }] }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'FORMAT_IDENTIFIANT_BANCAIRE')).toBe(true);
    expect(
      (await prisma.compteBancaireSalarie.count({ where: { salarieId: salarie.id, rib } }))
    ).toBe(1);
  });

  it('22 — pre-remplissage banque depuis code RIB quand codeBanque renseigne', async () => {
    const { codeRib } = codesBanqueFixture();
    const banque = await prisma.banque.create({
      data: {
        nom: `Banque fixture ${PREFIXE}`,
        codeBanque: codeRib,
        couleur: '#112233',
      },
    });

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-BANQUE-AUTO`,
    });
    const rib = ribDepuisCode(codeRib, '00555');

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ comptes: [{ rib }] }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { comptesBancaires: { banqueId: string | null }[] };
    };
    expect(corps.donnees.comptesBancaires[0]?.banqueId).toBe(banque.id);
  });

  it('23 — banque designee incoherente avec RIB produit alerte T11', async () => {
    const { codeRib, codeAutre } = codesBanqueFixture();
    const banqueRib = await prisma.banque.create({
      data: {
        nom: `Banque RIB ${PREFIXE}`,
        codeBanque: codeRib,
        couleur: '#223344',
      },
    });
    const banqueAutre = await prisma.banque.create({
      data: {
        nom: `Banque autre ${PREFIXE}`,
        codeBanque: codeAutre,
        couleur: '#334455',
      },
    });

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-BANQUE-INCOH`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          comptes: [{ rib: ribDepuisCode(codeRib, '00666'), banqueId: banqueAutre.id }],
        }),
      }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      alertes: { code: string }[];
      donnees: { comptesBancaires: { banqueId: string | null }[] };
    };
    expect(corps.alertes.some((a) => a.code === 'BANQUE_INCOHERENTE')).toBe(true);
    expect(corps.donnees.comptesBancaires[0]?.banqueId).toBe(banqueAutre.id);
    expect(banqueRib.id).not.toBe(banqueAutre.id);
  });

  it('24 — compte bancaire absent du PUT groupé est supprime physiquement', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CB-OMIS`,
    });

    const premier = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          comptes: [
            { rib: '007780000000000000000301', partVirement: '60.00' },
            { rib: '007780000000000000000302', partVirement: '40.00' },
          ],
        }),
      }
    );
    const { donnees: donneesPremier } = (await premier.json()) as {
      donnees: { comptesBancaires: { id: string }[]; version: number };
    };
    const compteConserve = donneesPremier.comptesBancaires[0]?.id;
    const compteOmis = donneesPremier.comptesBancaires[1]?.id;
    expect(compteConserve).toBeDefined();
    expect(compteOmis).toBeDefined();

    const second = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`),
      {
        method: 'PUT',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(donneesPremier.version),
        },
        body: JSON.stringify({
          comptes: [{ id: compteConserve, rib: '007780000000000000000301', partVirement: '100.00' }],
        }),
      }
    );
    expect(second.status).toBe(200);

    expect(await prisma.compteBancaireSalarie.findUnique({ where: { id: compteConserve! } })).not.toBeNull();
    expect(await prisma.compteBancaireSalarie.findUnique({ where: { id: compteOmis! } })).toBeNull();
    expect(
      (await prisma.compteBancaireSalarie.count({ where: { salarieId: salarie.id } }))
    ).toBe(1);
  });

  it('25 — montant interdit sur une prime contractuelle est refuse', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PRIME-MONTANT`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/primes-contractuelles`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({
          primeRef: 'PRIME-TRANSPORT',
          moisApplication: [1],
          montant: '500.00',
        }),
      }
    );
    expect(reponse.status).toBe(400);
    expect(
      (await prisma.primeContractuelle.count({ where: { emploiId: emploi.id } }))
    ).toBe(0);
  });

  it('26 — personne a charge supprimee avec bulletin : inactive mais encore comptee au mois en cours', async () => {
    const appBulletin = await creerAppAvecPorts({
      bulletins: {
        listerBulletinsParSalarie: async () =>
          [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] as const,
      },
    });

    try {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-PAC-COMPTE`,
      });

      const pac = await prisma.personneACharge.create({
        data: {
          salarieId: salarie.id,
          lienParenteCode: 'ENFANT',
          prenom: 'Karim',
          nom: 'Alami',
          sexe: 'HOMME',
          dateNaissance: new Date('2015-01-01'),
          aCharge: true,
          situationHandicap: false,
          moisEffetDebut: '2025-01',
          moisEffetFin: null,
        },
      });

      const impact = await fetch(
        urlLocale(
          appBulletin,
          `/salaries/${salarie.id}/personnes-a-charge/${pac.id}/impact-suppression`
        ),
        { headers: entetes(utilisateurId, societe.companyId) }
      );
      const { donnees: impactDonnees } = (await impact.json()) as {
        donnees: { jetonConfirmation: string; mode: string };
      };
      expect(impactDonnees.mode).toBe('inactiver');

      const suppression = await fetch(
        urlLocale(
          appBulletin,
          `/salaries/${salarie.id}/personnes-a-charge/${pac.id}?confirmationJeton=${impactDonnees.jetonConfirmation}`
        ),
        {
          method: 'DELETE',
          headers: {
            ...entetes(utilisateurId, societe.companyId),
            'if-match': '0',
          },
        }
      );
      expect(suppression.status).toBe(200);

      const corps = (await suppression.json()) as {
        donnees: {
          nombrePersonnesACharge: number;
          personnesACharge: { id: string; etat: string; moisEffetFin: string | null }[];
        };
      };
      const ligne = corps.donnees.personnesACharge.find((p) => p.id === pac.id);
      expect(ligne?.etat).toBe('INACTIVE');
      expect(ligne?.moisEffetFin).toBe('2025-07');
      expect(corps.donnees.nombrePersonnesACharge).toBe(1);
    } finally {
      await appBulletin.close();
    }
  });
});
