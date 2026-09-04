import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-operations-salarie-${Date.now()}`;

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

describe('API salarié — operations autorisées (2.1.c-1 temps 1.1)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let salarieAId: string;
  let emploiId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();

    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });

    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}-a@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;

    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);

    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-001`,
    });
    salarieAId = salarie.id;

    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societeA.etablissementPrincipalId,
      1
    );
    emploiId = emploi.id;
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('GET /salaries/:id — operations ne contient pas salarie.supprimer si refusée', async () => {
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieAId}`), {
      headers: entetes(utilisateurId, societeA.companyId, {
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.supprimer',
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: { operations: string[] } };
    expect(corps.donnees.operations).not.toContain('salarie.supprimer');
    expect(corps.donnees.operations).toContain('salarie.modifier');
  });

  it('GET /salaries — operations de collection ne contient pas salarie.creer si refusée', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      headers: entetes(utilisateurId, societeA.companyId, {
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.creer',
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: { operations: string[] } };
    expect(corps.donnees.operations).not.toContain('salarie.creer');
    expect(corps.donnees.operations).toContain('salarie.lire');
  });

  it('GET /salaries/:id — sans salarie.remuneration.lire : operations ne le contient pas et rubriques masquées absentes', async () => {
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieAId}`), {
      headers: entetes(utilisateurId, societeA.companyId, {
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: Record<string, unknown> & {
        operations: string[];
        emplois: { operations: string[] }[];
      };
    };
    expect(corps.donnees.operations).not.toContain('salarie.remuneration.lire');
    expect('comptesBancaires' in corps.donnees).toBe(false);
    expect(corps.donnees.emplois[0]?.operations).not.toContain('salarie.remuneration.lire');
    expect('remuneration' in (corps.donnees.emplois[0] ?? {})).toBe(false);
  });

  it('GET /salaries/:id — emplois[].operations expose emploi.modifier', async () => {
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieAId}`), {
      headers: entetes(utilisateurId, societeA.companyId),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { emplois: { id: string; operations: string[] }[] };
    };
    const emploi = corps.donnees.emplois.find((e) => e.id === emploiId);
    expect(emploi?.operations).toContain('emploi.modifier');
    expect(emploi?.operations).toContain('emploi.supprimer');
  });
});
