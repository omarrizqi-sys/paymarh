import type { INestApplication } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Decimal } from 'decimal.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { PermissionsRefuseesContext } from '../src/common/permissions/permissions-refusees.context.js';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service.js';
import { EmploisService } from '../src/modules/salaries/emplois.service.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-controle-remun-emploi-${Date.now()}`;

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

function entetesSansEcritureRemuneration(
  utilisateurId: string,
  companyId: string
): Record<string, string> {
  return entetes(utilisateurId, companyId, {
    [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.ecrire',
  });
}

describe('Controle ecriture remuneration — emploi (2.1.c-3)', () => {
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
    await app.close();
  });

  it('RE1 — PATCH remuneration montant refuse sans salarie.remuneration.ecrire', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE1`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const reponse = await fetch(urlLocale(app, `/emplois/${emploi.id}/remuneration`), {
      method: 'PATCH',
      headers: {
        ...entetesSansEcritureRemuneration(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({ montant: '99999' }),
    });

    expect(reponse.status).toBe(403);
    const version = await prisma.emploiRemunerationVersion.findFirstOrThrow({
      where: { emploiId: emploi.id },
    });
    expect(version.montant.toString()).not.toBe('99999');
  });

  it('RE2 — POST avantage en nature refuse sans salarie.remuneration.ecrire', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE2-CREER`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const reponse = await fetch(urlLocale(app, `/emplois/${emploi.id}/avantages-en-nature`), {
      method: 'POST',
      headers: {
        ...entetesSansEcritureRemuneration(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        natureRef: 'VOITURE',
        montant: '500',
        moisApplication: [1],
      }),
    });

    expect(reponse.status).toBe(403);
    expect(await prisma.avantageEnNature.count({ where: { emploiId: emploi.id } })).toBe(0);
  });

  it('RE3 — PATCH avantage en nature refuse sans salarie.remuneration.ecrire', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE3-MODIF`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);
    const avantage = await prisma.avantageEnNature.create({
      data: {
        emploiId: emploi.id,
        natureRef: 'VOITURE',
        montant: new Decimal('400'),
        moisApplication: [6],
        moisEffetDebut: '2025-01',
        moisEffetFin: null,
      },
    });

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/avantages-en-nature/${avantage.id}`),
      {
        method: 'PATCH',
        headers: {
          ...entetesSansEcritureRemuneration(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ montant: '900' }),
      }
    );

    expect(reponse.status).toBe(403);
    const encore = await prisma.avantageEnNature.findUniqueOrThrow({ where: { id: avantage.id } });
    expect(encore.montant.toString()).toBe('400');
  });

  it('RE4 — DELETE avantage en nature refuse sans salarie.remuneration.ecrire', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE4-SUPPR`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);
    const avantage = await prisma.avantageEnNature.create({
      data: {
        emploiId: emploi.id,
        natureRef: 'VOITURE',
        montant: new Decimal('300'),
        moisApplication: [3],
        moisEffetDebut: '2025-01',
        moisEffetFin: null,
      },
    });

    const reponse = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/avantages-en-nature/${avantage.id}`),
      {
        method: 'DELETE',
        headers: {
          ...entetesSansEcritureRemuneration(utilisateurId, societe.companyId),
          'if-match': '0',
        },
      }
    );

    expect(reponse.status).toBe(403);
    expect(await prisma.avantageEnNature.findUnique({ where: { id: avantage.id } })).not.toBeNull();
  });

  it('RE5 — EmploisService.creer refuse sans salarie.remuneration.ecrire (controle service)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule],
    }).compile();

    const emplois = moduleRef.get(EmploisService);
    const tenantContext = moduleRef.get(TenantContextService);
    const permissionsRefusees = moduleRef.get(PermissionsRefuseesContext);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE5-SERVICE`,
    });

    await expect(
      tenantContext.run(
        {
          userId: utilisateurId,
          role: 'ACCOUNT_ADMIN',
          accountId: societe.accountId,
          companyId: societe.companyId,
        },
        () =>
          permissionsRefusees.run(new Set(['salarie.remuneration.ecrire']), () =>
            emplois.creer(salarie.id, {
              contrat: {
                libellePoste: 'Service',
                dateDebut: '2025-01-01',
                typeContratCode: 'CDI',
              },
              remuneration: {
                modeDeterminationSalaire: 'BRUT_MENSUEL',
                montant: '10000',
              },
              affectation: {
                etablissementId: societe.etablissementPrincipalId,
                baseSaisieDuree: 'HEBDOMADAIRE',
              },
            })
          )
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(await prisma.emploi.count({ where: { salarieId: salarie.id } })).toBe(0);
  });

  it('RE6 — non-debordement : contrat, affectation et statut particulier restent modifiables', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-RE6-NON-DEB`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);
    const sansEcriture = entetesSansEcritureRemuneration(utilisateurId, societe.companyId);

    const contrat = await fetch(urlLocale(app, `/emplois/${emploi.id}/contrat`), {
      method: 'PATCH',
      headers: {
        ...sansEcriture,
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({ libellePoste: 'Poste modifie' }),
    });
    expect(contrat.status).toBe(200);

    const affectation = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/affectation-temps-de-travail`),
      {
        method: 'PATCH',
        headers: {
          ...sansEcriture,
          'content-type': 'application/json',
          'if-match': '1',
        },
        body: JSON.stringify({ teletravailAutorise: true }),
      }
    );
    expect(affectation.status).toBe(200);

    const statut = await fetch(urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`), {
      method: 'POST',
      headers: {
        ...sansEcriture,
        'content-type': 'application/json',
        'if-match': '2',
      },
      body: JSON.stringify({
        statutCode: 'IDMAJ',
        dateDebut: '2025-01-01',
        dateFin: null,
      }),
    });
    expect(statut.status).toBe(201);
  });
});
