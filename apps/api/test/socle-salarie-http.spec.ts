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

const PREFIXE = `test-socle-perm-${Date.now()}`;

describe('socle 2.1.b — permissions et masquage HTTP', () => {
  let app: INestApplication;
  let formeId: string;
  let compteAId: string;
  let compteBId: string;
  let utilisateurAId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeBId: string;
  let salarieAId: string;
  let salarieBId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const compteA = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const compteB = await prisma.account.create({
      data: { name: `${PREFIXE}-B`, type: 'CABINET' },
    });
    compteAId = compteA.id;
    compteBId = compteB.id;

    const utilisateurA = await prisma.user.create({
      data: {
        email: `${PREFIXE}-a@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compteAId,
      },
    });
    utilisateurAId = utilisateurA.id;

    societeA = await creerSocieteTest(prisma, formeId, compteAId, `${PREFIXE}-SA`);
    const societeB = await creerSocieteTest(prisma, formeId, compteBId, `${PREFIXE}-SB`);
    societeBId = societeB.companyId;

    const salarieA = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-001`,
    });
    const salarieB = await creerSalarieMin(prisma, societeBId, { matricule: `${PREFIXE}-002` });
    salarieAId = salarieA.id;
    salarieBId = salarieB.id;
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('renvoie 404 (pas 403) pour un salarie d un autre compte', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieBId}`), {
      headers: { 'x-paymarh-user-id': utilisateurAId },
    });

    expect(reponse.status).toBe(404);
    expect(reponse.status).not.toBe(403);
    const corps = (await reponse.json()) as { message?: string };
    expect(corps.message).not.toContain(salarieBId);
  });

  it('renvoie 403 sans permission salarie.lire', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieAId}`), {
      headers: {
        'x-paymarh-user-id': utilisateurAId,
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.lire',
      },
    });

    expect(reponse.status).toBe(403);
  });

  it('masque les rubriques de remuneration sans salarie.remuneration.lire', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieAId}`), {
      headers: {
        'x-paymarh-user-id': utilisateurAId,
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      },
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: Record<string, unknown> };
    expect('remuneration' in corps.donnees).toBe(false);
    expect('paiement' in corps.donnees).toBe(false);
    expect('primesContractuelles' in corps.donnees).toBe(false);
    expect('avantagesEnNature' in corps.donnees).toBe(false);
    expect('comptesBancaires' in corps.donnees).toBe(false);
  });

  it('refuse une ecriture de rubrique remuneration sans salarie.remuneration.ecrire', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieAId}`), {
      method: 'PATCH',
      headers: {
        'x-paymarh-user-id': utilisateurAId,
        'content-type': 'application/json',
        'if-match': '0',
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.ecrire',
      },
      body: JSON.stringify({ remuneration: { montant: '999' } }),
    });

    expect(reponse.status).toBe(403);
  });

  it('expose moisEnCours dans la reponse salarie', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieAId}`), {
      headers: { 'x-paymarh-user-id': utilisateurAId },
    });
    const corps = (await reponse.json()) as { donnees: { moisEnCours?: string } };
    expect(corps.donnees.moisEnCours).toMatch(/^\d{4}-\d{2}$/);
  });

  it('moisEnCours sans bulletin avec emploi actif ancien prend le mois de debut le plus ancien', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-EMP-MOIS`,
    });
    await creerEmploiOuvert(
      prisma,
      salarie.id,
      societeA.etablissementPrincipalId,
      1,
      '2024-04',
      new Date('2024-04-01')
    );

    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarie.id}`), {
      headers: { 'x-paymarh-user-id': utilisateurAId },
    });
    const corps = (await reponse.json()) as { donnees: { moisEnCours: string } };
    expect(corps.donnees.moisEnCours).toBe('2024-04');
  });
});
