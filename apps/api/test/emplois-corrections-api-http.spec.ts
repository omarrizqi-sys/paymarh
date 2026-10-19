import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STATUT_TECHNIQUE_TAHFIZ } from '../prisma/reference-data-fiche-salarie.js';
import { AppModule } from '../src/app.module.js';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service.js';
import { creerPipeValidationGlobale } from '../src/common/validation/pipe-validation-globale.js';
import {
  REFERENTIEL_NATIONAL_PORT,
  type ReferentielNationalPort,
} from '../src/modules/salaries/referentiel-national/referentiel-national.port.js';
import { TableauxEmploiService } from '../src/modules/salaries/tableaux-emploi.service.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { appelerApi } from './support/http-client.js';
import {
  assurerTypesContrat,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-emploi-corr-${Date.now()}`;

const REFUS_INTROUVABLE = 'Ressource introuvable.';

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

function sansBloc(payload: Record<string, unknown>, bloc: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(payload).filter(([cle]) => cle !== bloc));
}

async function creerAppAvecReferentiel(
  referentiel: Partial<ReferentielNationalPort>
): Promise<INestApplication> {
  const compiled = await Test.createTestingModule({
    imports: [AppModule, SocleTestModule],
  })
    .overrideProvider(REFERENTIEL_NATIONAL_PORT)
    .useValue({ lireValeur: async () => null, ...referentiel })
    .compile();
  const app = compiled.createNestApplication();
  app.useGlobalPipes(creerPipeValidationGlobale());
  await app.init();
  await app.listen(0);
  return app;
}

/** Etat complet d un emploi en base : versions, lignes portees et Emploi.version. */
async function etatEmploi(emploiId: string) {
  return prisma.emploi.findUniqueOrThrow({
    where: { id: emploiId },
    include: {
      contratVersions: { orderBy: { moisEffet: 'asc' } },
      remunerationVersions: { orderBy: { moisEffet: 'asc' } },
      affectationVersions: { orderBy: { moisEffet: 'asc' } },
      primesContractuelles: { orderBy: { id: 'asc' } },
      avantagesEnNature: { orderBy: { id: 'asc' } },
      statutsParticuliers: { orderBy: { id: 'asc' } },
    },
  });
}

describe('API emplois — corrections temps 6 (prompt A)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let accountId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeTahfiz: Awaited<ReturnType<typeof creerSocieteTest>>;
  let compteurSalarie = 0;

  async function nouveauSalarie(companyId: string) {
    compteurSalarie += 1;
    return creerSalarieMin(prisma, companyId, { matricule: `${PREFIXE}-${compteurSalarie}` });
  }

  async function posterEmploi(
    companyId: string,
    salarieId: string,
    corps: Record<string, unknown>,
    appCible: INestApplication = app
  ) {
    return fetch(urlLocale(appCible, `/salaries/${salarieId}/emplois`), {
      method: 'POST',
      headers: { ...entetes(utilisateurId, companyId), 'content-type': 'application/json' },
      body: JSON.stringify(corps),
    });
  }

  async function creerEmploi(
    societe: Awaited<ReturnType<typeof creerSocieteTest>>,
    surcharge?: Parameters<typeof payloadEmploi>[1]
  ) {
    const salarie = await nouveauSalarie(societe.companyId);
    const reponse = await posterEmploi(
      societe.companyId,
      salarie.id,
      payloadEmploi(societe.etablissementPrincipalId, surcharge)
    );
    expect(reponse.status).toBe(201);
    const { donnees } = (await reponse.json()) as { donnees: { id: string; version: number } };
    return { salarie, emploi: donnees };
  }

  async function ecrire(
    companyId: string,
    methode: 'POST' | 'PATCH' | 'DELETE',
    chemin: string,
    version: number,
    corps?: Record<string, unknown>,
    extra: Record<string, string> = {}
  ) {
    return fetch(urlLocale(app, chemin), {
      method: methode,
      headers: {
        ...entetes(utilisateurId, companyId, extra),
        'if-match': String(version),
        ...(corps !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  }

  async function jetonImpact(companyId: string, chemin: string): Promise<string> {
    const reponse = await fetch(urlLocale(app, chemin), {
      headers: entetes(utilisateurId, companyId),
    });
    expect(reponse.status).toBe(200);
    const { donnees } = (await reponse.json()) as { donnees: { jetonConfirmation: string } };
    return donnees.jetonConfirmation;
  }

  /** Une autre ecriture est passee entre la lecture et l envoi : la version lue est perimee. */
  async function perimerVersion(emploiId: string): Promise<number> {
    const avant = await prisma.emploi.findUniqueOrThrow({ where: { id: emploiId } });
    await prisma.emploi.update({
      where: { id: emploiId },
      data: { version: { increment: 1 } },
    });
    return avant.version;
  }

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    await assurerTypesContrat(prisma);
    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    accountId = compte.id;
    const utilisateur = await prisma.user.create({
      data: { email: `${PREFIXE}@test.local`, role: 'ACCOUNT_ADMIN', accountId: compte.id },
    });
    utilisateurId = utilisateur.id;
    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
    societeB = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SB`);
    societeTahfiz = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-ST`);

    const typeTahfiz = await prisma.typeExoneration.findUniqueOrThrow({
      where: { code: 'TAHFIZ' },
    });
    const activation = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societeTahfiz.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfiz.id,
        exonerationDateDebut: '2025-01',
        exonerationDateFin: null,
      },
    });
    expect(activation.status).toBe(200);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  describe('blocs obligatoires a la creation', () => {
    it.each([
      ['A01', 'contrat'],
      ['A02', 'remuneration'],
      ['A03', 'affectation'],
    ])('%s — POST sans bloc %s : 400 CHAMP_OBLIGATOIRE, aucun emploi cree', async (_, bloc) => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        sansBloc(payloadEmploi(societeA.etablissementPrincipalId), bloc)
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'CHAMP_OBLIGATOIRE',
        message: 'Ce champ est obligatoire.',
        champ: bloc,
      });
      expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
    });
  });

  describe('montant facultatif', () => {
    it('A04 — POST sans montant : 201, montant null a la relecture, aucune alerte SMIG', async () => {
      const appSmig = await creerAppAvecReferentiel({
        lireValeur: async (cle) => (cle === 'SMIG' ? new Decimal('3000') : null),
      });
      try {
        const salarie = await nouveauSalarie(societeA.companyId);
        const corps = payloadEmploi(societeA.etablissementPrincipalId);
        const remuneration: Record<string, unknown> = { ...corps.remuneration };
        delete remuneration.montant;

        const reponse = await posterEmploi(
          societeA.companyId,
          salarie.id,
          { ...corps, remuneration },
          appSmig
        );

        expect(reponse.status).toBe(201);
        const cree = (await reponse.json()) as {
          donnees: { id: string; remuneration: { montant: string | null } };
          alertes: { code: string }[];
        };
        expect(cree.alertes).toEqual([]);
        expect(cree.donnees.remuneration.montant).toBeNull();

        const relu = await fetch(urlLocale(appSmig, `/emplois/${cree.donnees.id}`), {
          headers: entetes(utilisateurId, societeA.companyId),
        });
        const { donnees } = (await relu.json()) as {
          donnees: { remuneration: Record<string, unknown> };
        };
        expect('montant' in donnees.remuneration).toBe(true);
        expect(donnees.remuneration.montant).toBeNull();
      } finally {
        await appSmig.close();
      }
    });

    it('A05 — PATCH remuneration avec montant null : 200, montant null a la relecture', async () => {
      const { emploi } = await creerEmploi(societeA);

      const reponse = await ecrire(
        societeA.companyId,
        'PATCH',
        `/emplois/${emploi.id}/remuneration`,
        emploi.version,
        { montant: null }
      );
      expect(reponse.status).toBe(200);

      const relu = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
        headers: entetes(utilisateurId, societeA.companyId),
      });
      const { donnees } = (await relu.json()) as {
        donnees: { remuneration: { montant: string | null } };
      };
      expect(donnees.remuneration.montant).toBeNull();
      const version = await prisma.emploiRemunerationVersion.findFirstOrThrow({
        where: { emploiId: emploi.id },
      });
      expect(version.montant).toBeNull();
    });
  });

  describe('montant vide ou non numerique', () => {
    it('A29 — POST avec montant vide : 400 CARACTERE_NON_CONFORME, aucun emploi cree', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        payloadEmploi(societeA.etablissementPrincipalId, { remuneration: { montant: '' } })
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'CARACTERE_NON_CONFORME',
        message: 'Ce champ contient un caractère non conforme à son type.',
        champ: 'remuneration.montant',
      });
      expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
    });

    it('A30 — PATCH remuneration avec montant non numerique : 400 CARACTERE_NON_CONFORME, base inchangee', async () => {
      const { emploi } = await creerEmploi(societeA);
      const avant = await etatEmploi(emploi.id);

      const reponse = await ecrire(
        societeA.companyId,
        'PATCH',
        `/emplois/${emploi.id}/remuneration`,
        emploi.version,
        { montant: 'abc' }
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'CARACTERE_NON_CONFORME',
        message: 'Ce champ contient un caractère non conforme à son type.',
        champ: 'montant',
      });
      expect(await etatEmploi(emploi.id)).toEqual(avant);
    });
  });

  describe('codes inconnus', () => {
    it('A06 — POST avec typeContratCode inconnu : 400 VALEUR_INDISPONIBLE, aucun emploi cree', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        payloadEmploi(societeA.etablissementPrincipalId, {
          contrat: { typeContratCode: 'CODE_INCONNU' },
        })
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'VALEUR_INDISPONIBLE',
        message: 'Cette valeur n’est pas disponible.',
        champ: 'typeContratCode',
      });
      expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
    });

    it('A07 — POST avec motifSortieCode inconnu : 400 VALEUR_INDISPONIBLE, aucun emploi cree', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        payloadEmploi(societeA.etablissementPrincipalId, {
          contrat: { dateSortie: '2025-06-30', motifSortieCode: 'MOTIF_INCONNU' },
        })
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'VALEUR_INDISPONIBLE',
        message: 'Cette valeur n’est pas disponible.',
        champ: 'motifSortieCode',
      });
      expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
    });

    it('A08 — POST avec le compte bancaire d un autre salarie : 400 VALEUR_INDISPONIBLE, aucun emploi cree', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const autre = await nouveauSalarie(societeA.companyId);
      const compteAutre = await prisma.compteBancaireSalarie.create({
        data: { salarieId: autre.id, titulaire: 'Autre salarie' },
      });

      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        payloadEmploi(societeA.etablissementPrincipalId, {
          remuneration: { modePaiement: 'VIREMENT', compteBancaireId: compteAutre.id },
        })
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'VALEUR_INDISPONIBLE',
        message: 'Cette valeur n’est pas disponible.',
        champ: 'compteBancaireId',
      });
      expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
    });

    it('A09 — PATCH contrat avec typeContratCode inconnu : 400 VALEUR_INDISPONIBLE, base inchangee', async () => {
      const { emploi } = await creerEmploi(societeA);
      const avant = await etatEmploi(emploi.id);

      const reponse = await ecrire(
        societeA.companyId,
        'PATCH',
        `/emplois/${emploi.id}/contrat`,
        emploi.version,
        { typeContratCode: 'CODE_INCONNU' }
      );

      expect(reponse.status).toBe(400);
      expect(await reponse.json()).toEqual({
        code: 'VALEUR_INDISPONIBLE',
        message: 'Cette valeur n’est pas disponible.',
        champ: 'typeContratCode',
      });
      expect(await etatEmploi(emploi.id)).toEqual(avant);
    });
  });

  it('A10 — un salarie dont un emploi a ete cree par l API peut etre supprime', async () => {
    const { salarie } = await creerEmploi(societeA);
    expect(await prisma.compteurNumeroOrdreEmploi.count({ where: { salarieId: salarie.id } })).toBe(
      1
    );

    const impact = await fetch(urlLocale(app, `/salaries/${salarie.id}/impact-suppression`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const { donnees } = (await impact.json()) as { donnees: { jetonConfirmation: string } };
    const reponse = await ecrire(
      societeA.companyId,
      'DELETE',
      `/salaries/${salarie.id}?confirmationJeton=${donnees.jetonConfirmation}`,
      salarie.version
    );

    expect(reponse.status).toBe(200);
    expect(await prisma.salarie.findUnique({ where: { id: salarie.id } })).toBeNull();
    expect(await prisma.compteurNumeroOrdreEmploi.count({ where: { salarieId: salarie.id } })).toBe(
      0
    );
  });

  it('A10b — un salarie dont l emploi designe son compte bancaire peut etre supprime', async () => {
    const salarie = await nouveauSalarie(societeA.companyId);
    const compte = await prisma.compteBancaireSalarie.create({
      data: { salarieId: salarie.id, titulaire: 'Titulaire A10b' },
    });
    const cree = await posterEmploi(
      societeA.companyId,
      salarie.id,
      payloadEmploi(societeA.etablissementPrincipalId, {
        remuneration: { modePaiement: 'VIREMENT', compteBancaireId: compte.id },
      })
    );
    expect(cree.status).toBe(201);
    const { donnees: emploi } = (await cree.json()) as { donnees: { id: string } };
    expect(
      await prisma.emploiRemunerationVersion.count({
        where: { emploiId: emploi.id, compteBancaireId: compte.id },
      })
    ).toBe(1);

    try {
      const jeton = await jetonImpact(
        societeA.companyId,
        `/salaries/${salarie.id}/impact-suppression`
      );
      const reponse = await ecrire(
        societeA.companyId,
        'DELETE',
        `/salaries/${salarie.id}?confirmationJeton=${jeton}`,
        salarie.version
      );

      expect(reponse.status).toBe(200);
      expect(await prisma.salarie.findUnique({ where: { id: salarie.id } })).toBeNull();
      expect(await prisma.compteBancaireSalarie.count({ where: { id: compte.id } })).toBe(0);
      expect(await prisma.emploi.count({ where: { id: emploi.id } })).toBe(0);
      expect(await prisma.emploiRemunerationVersion.count({ where: { emploiId: emploi.id } })).toBe(
        0
      );
      expect(
        await prisma.compteurNumeroOrdreEmploi.count({ where: { salarieId: salarie.id } })
      ).toBe(0);
    } finally {
      await prisma.emploi.deleteMany({ where: { salarieId: salarie.id } });
    }
  });

  describe('perimetre par societe : emploi de la societe B lu depuis la societe A', () => {
    it('A11 — GET /emplois/:id : 404', async () => {
      const { emploi } = await creerEmploi(societeB);

      const reponse = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
        headers: entetes(utilisateurId, societeA.companyId),
      });

      expect(reponse.status).toBe(404);
      expect(((await reponse.json()) as { message: string }).message).toBe(REFUS_INTROUVABLE);
    });

    it('A12 — PATCH contrat : 404 (jamais 403), base inchangee', async () => {
      const { emploi } = await creerEmploi(societeB);
      const avant = await etatEmploi(emploi.id);
      const chemin = `/emplois/${emploi.id}/contrat`;

      const reponse = await ecrire(societeA.companyId, 'PATCH', chemin, emploi.version, {
        libellePoste: 'Intrus',
      });
      expect(reponse.status).toBe(404);
      expect(((await reponse.json()) as { message: string }).message).toBe(REFUS_INTROUVABLE);

      const sansDroit = await ecrire(
        societeA.companyId,
        'PATCH',
        chemin,
        emploi.version,
        { libellePoste: 'Intrus' },
        { [HEADER_PERMISSIONS_REFUSEES]: 'emploi.modifier' }
      );
      expect(sansDroit.status).toBe(404);

      expect(await etatEmploi(emploi.id)).toEqual(avant);
    });

    it('A13 — POST prime contractuelle : 404, aussi au niveau du service, base inchangee', async () => {
      const { emploi } = await creerEmploi(societeB);
      const avant = await etatEmploi(emploi.id);
      const corps = { primeRef: 'A15', moisApplication: [12] };

      const reponse = await ecrire(
        societeA.companyId,
        'POST',
        `/emplois/${emploi.id}/primes-contractuelles`,
        emploi.version,
        corps
      );
      expect(reponse.status).toBe(404);
      expect(((await reponse.json()) as { message: string }).message).toBe(REFUS_INTROUVABLE);

      const tenant = app.get(TenantContextService);
      const tableaux = app.get(TableauxEmploiService);
      await expect(
        tenant.run(
          {
            userId: utilisateurId,
            role: 'ACCOUNT_ADMIN',
            accountId,
            companyId: societeA.companyId,
          },
          () => tableaux.creerPrimeContractuelle(emploi.id, corps, emploi.version)
        )
      ).rejects.toMatchObject({ status: 404, message: REFUS_INTROUVABLE });

      expect(await etatEmploi(emploi.id)).toEqual(avant);
    });

    it('A14 — GET impact-suppression : 404', async () => {
      const { emploi } = await creerEmploi(societeB);

      const reponse = await fetch(urlLocale(app, `/emplois/${emploi.id}/impact-suppression`), {
        headers: entetes(utilisateurId, societeA.companyId),
      });

      expect(reponse.status).toBe(404);
      expect(((await reponse.json()) as { message: string }).message).toBe(REFUS_INTROUVABLE);
    });

    it('A15 — DELETE /emplois/:id : 404, l emploi reste en base', async () => {
      const { emploi } = await creerEmploi(societeB);
      const jeton = await jetonImpact(
        societeB.companyId,
        `/emplois/${emploi.id}/impact-suppression`
      );
      const avant = await etatEmploi(emploi.id);

      const reponse = await ecrire(
        societeA.companyId,
        'DELETE',
        `/emplois/${emploi.id}?confirmationJeton=${jeton}`,
        emploi.version
      );

      expect(reponse.status).toBe(404);
      expect(((await reponse.json()) as { message: string }).message).toBe(REFUS_INTROUVABLE);
      expect(await etatEmploi(emploi.id)).toEqual(avant);
    });
  });

  describe('audit des creations', () => {
    it('A16 — POST d un emploi : une entree d audit, societe de l en-tete, id du nouvel emploi', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const reponse = await posterEmploi(
        societeA.companyId,
        salarie.id,
        payloadEmploi(societeA.etablissementPrincipalId)
      );
      expect(reponse.status).toBe(201);
      const { donnees } = (await reponse.json()) as { donnees: { id: string } };

      const journaux = await prisma.auditLog.findMany({
        where: { userId: utilisateurId, action: 'CREER_EMPLOI', targetId: donnees.id },
      });
      expect(journaux).toHaveLength(1);
      expect(journaux[0]).toMatchObject({
        accountId,
        companyId: societeA.companyId,
        targetType: 'Emploi',
        targetId: donnees.id,
      });
    });

    it('A16b — POST /salaries : une entree d audit, societe de l en-tete, id du nouveau salarie', async () => {
      const reponse = await fetch(urlLocale(app, '/salaries'), {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societeA.companyId),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          nom: 'Alami',
          prenom: 'Said',
          sexe: 'HOMME',
          dateNaissance: '1990-05-15',
          dateEntree: '2025-01-01',
          matricule: `${PREFIXE}-AUDIT-SAL`,
        }),
      });
      expect(reponse.status).toBe(201);
      const { donnees } = (await reponse.json()) as { donnees: { id: string } };

      const journaux = await prisma.auditLog.findMany({
        where: { userId: utilisateurId, action: 'CREER_SALARIE', targetId: donnees.id },
      });
      expect(journaux).toHaveLength(1);
      expect(journaux[0]).toMatchObject({
        accountId,
        companyId: societeA.companyId,
        targetType: 'Salarie',
        targetId: donnees.id,
      });
    });
  });

  describe('If-Match perime : 409 CONFLIT_VERSION et base strictement inchangee', () => {
    async function attendreConflitSansEcriture(
      emploiId: string,
      envoyer: (versionPerimee: number) => Promise<Response>
    ) {
      const versionPerimee = await perimerVersion(emploiId);
      const avant = await etatEmploi(emploiId);

      const reponse = await envoyer(versionPerimee);

      expect(reponse.status).toBe(409);
      expect(((await reponse.json()) as { code: string }).code).toBe('CONFLIT_VERSION');
      expect(await etatEmploi(emploiId)).toEqual(avant);
    }

    it('A17 — PATCH contrat CDI vers CDD sous TAHFIZ : rien n est ecrit, lignes TAHFIZ inchangees', async () => {
      const { emploi } = await creerEmploi(societeTahfiz);
      const lignesTahfiz = await prisma.statutParticulierLigne.findMany({
        where: { emploiId: emploi.id, statutCode: 'TAHFIZ', origine: 'PROPAGE_SOCIETE' },
        orderBy: { id: 'asc' },
      });
      expect(lignesTahfiz.length).toBeGreaterThan(0);

      await attendreConflitSansEcriture(emploi.id, (version) =>
        ecrire(societeTahfiz.companyId, 'PATCH', `/emplois/${emploi.id}/contrat`, version, {
          typeContratCode: 'CDD',
          dateFin: '2025-12-31',
        })
      );

      expect(
        await prisma.statutParticulierLigne.findMany({
          where: { emploiId: emploi.id, statutCode: 'TAHFIZ', origine: 'PROPAGE_SOCIETE' },
          orderBy: { id: 'asc' },
        })
      ).toEqual(lignesTahfiz);
    });

    it('A18 — PATCH remuneration', async () => {
      const { emploi } = await creerEmploi(societeA);
      await attendreConflitSansEcriture(emploi.id, (version) =>
        ecrire(societeA.companyId, 'PATCH', `/emplois/${emploi.id}/remuneration`, version, {
          montant: '15000',
        })
      );
    });

    it('A19 — PATCH affectation-temps-de-travail', async () => {
      const { emploi } = await creerEmploi(societeA);
      await attendreConflitSansEcriture(emploi.id, (version) =>
        ecrire(
          societeA.companyId,
          'PATCH',
          `/emplois/${emploi.id}/affectation-temps-de-travail`,
          version,
          { departementRef: 'COMPTABILITE', dureeContractuelle: '40' }
        )
      );
    });

    describe('primes contractuelles et avantages en nature', () => {
      async function emploiAvecLignes() {
        const { emploi } = await creerEmploi(societeA);
        const prime = await prisma.primeContractuelle.create({
          data: { emploiId: emploi.id, primeRef: 'A15', moisApplication: [12] },
        });
        const avantage = await prisma.avantageEnNature.create({
          data: {
            emploiId: emploi.id,
            natureRef: 'B02',
            montant: new Decimal('500'),
            moisApplication: [1, 2, 3],
            moisEffetDebut: '2025-07',
            moisEffetFin: null,
          },
        });
        return { emploiId: emploi.id, primeId: prime.id, avantageId: avantage.id };
      }

      it.each([
        [
          'A20 — POST prime contractuelle',
          (e: { emploiId: string }, v: number) =>
            ecrire(societeA.companyId, 'POST', `/emplois/${e.emploiId}/primes-contractuelles`, v, {
              primeRef: 'A39',
              moisApplication: [12],
            }),
        ],
        [
          'A21 — PATCH prime contractuelle',
          (e: { emploiId: string; primeId: string }, v: number) =>
            ecrire(
              societeA.companyId,
              'PATCH',
              `/emplois/${e.emploiId}/primes-contractuelles/${e.primeId}`,
              v,
              { moisApplication: [6, 12] }
            ),
        ],
        [
          'A22 — DELETE prime contractuelle',
          (e: { emploiId: string; primeId: string }, v: number) =>
            ecrire(
              societeA.companyId,
              'DELETE',
              `/emplois/${e.emploiId}/primes-contractuelles/${e.primeId}`,
              v
            ),
        ],
        [
          'A23 — POST avantage en nature',
          (e: { emploiId: string }, v: number) =>
            ecrire(societeA.companyId, 'POST', `/emplois/${e.emploiId}/avantages-en-nature`, v, {
              natureRef: 'B01',
              montant: '2000',
              moisApplication: [1],
            }),
        ],
        [
          'A24 — PATCH avantage en nature',
          (e: { emploiId: string; avantageId: string }, v: number) =>
            ecrire(
              societeA.companyId,
              'PATCH',
              `/emplois/${e.emploiId}/avantages-en-nature/${e.avantageId}`,
              v,
              { montant: '600' }
            ),
        ],
        [
          'A25 — DELETE avantage en nature',
          async (e: { emploiId: string; avantageId: string }, v: number) => {
            const jeton = await jetonImpact(
              societeA.companyId,
              `/emplois/${e.emploiId}/avantages-en-nature/${e.avantageId}/impact-suppression`
            );
            return ecrire(
              societeA.companyId,
              'DELETE',
              `/emplois/${e.emploiId}/avantages-en-nature/${e.avantageId}?confirmationJeton=${jeton}`,
              v
            );
          },
        ],
      ] as const)('%s', async (_, envoyer) => {
        const lignes = await emploiAvecLignes();
        await attendreConflitSansEcriture(lignes.emploiId, (version) => envoyer(lignes, version));
      });
    });

    describe('statuts particuliers (IDMAJ sur un emploi en contrat d insertion)', () => {
      async function emploiInsertionAvecStatut() {
        const { emploi } = await creerEmploi(societeA, {
          contrat: { typeContratCode: 'INSERTION' },
        });
        const statut = await prisma.statutParticulierLigne.create({
          data: {
            emploiId: emploi.id,
            statutCode: 'IDMAJ',
            dateDebut: new Date('2025-01-01'),
            dateFin: new Date('2025-03-31'),
            origine: 'SAISIE_MANUELLE',
          },
        });
        return { emploiId: emploi.id, statutId: statut.id };
      }

      it.each([
        [
          'A26 — POST statut particulier',
          (e: { emploiId: string }, v: number) =>
            ecrire(societeA.companyId, 'POST', `/emplois/${e.emploiId}/statuts-particuliers`, v, {
              statutCode: 'IDMAJ',
              dateDebut: '2025-05-01',
              dateFin: '2025-06-30',
            }),
        ],
        [
          'A27 — PATCH statut particulier',
          (e: { emploiId: string; statutId: string }, v: number) =>
            ecrire(
              societeA.companyId,
              'PATCH',
              `/emplois/${e.emploiId}/statuts-particuliers/${e.statutId}`,
              v,
              { dateFin: '2025-04-30' }
            ),
        ],
        [
          'A28 — DELETE statut particulier',
          async (e: { emploiId: string; statutId: string }, v: number) => {
            const jeton = await jetonImpact(
              societeA.companyId,
              `/emplois/${e.emploiId}/statuts-particuliers/${e.statutId}/impact-suppression`
            );
            return ecrire(
              societeA.companyId,
              'DELETE',
              `/emplois/${e.emploiId}/statuts-particuliers/${e.statutId}?confirmationJeton=${jeton}`,
              v
            );
          },
        ],
      ] as const)('%s', async (_, envoyer) => {
        const lignes = await emploiInsertionAvecStatut();
        await attendreConflitSansEcriture(lignes.emploiId, (version) => envoyer(lignes, version));
      });
    });
  });
});
