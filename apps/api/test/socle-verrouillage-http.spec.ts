import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-socle-verrou-${Date.now()}`;

describe('socle 2.1.b — verrouillage optimiste HTTP', () => {
  let app: INestApplication;
  let formeId: string;
  let compteId: string;
  let utilisateurId: string;
  let salarieId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const compte = await prisma.account.create({
      data: { name: PREFIXE, type: 'CABINET' },
    });
    compteId = compte.id;

    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compteId,
      },
    });
    utilisateurId = utilisateur.id;

    const societe = await creerSocieteTest(prisma, formeId, compteId, PREFIXE);
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-001`,
    });
    salarieId = salarie.id;
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('refuse une ecriture sans en-tete If-Match en 428', async () => {
    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieId}`), {
      method: 'PATCH',
      headers: {
        'x-paymarh-user-id': utilisateurId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ nom: 'Benjelloun' }),
    });

    expect(reponse.status).toBe(428);
    const corps = (await reponse.json()) as { code?: string };
    expect(corps.code).toBe('EN_TETE_IF_MATCH_REQUIS');
  });

  it('refuse une ecriture avec version obsolete en 409 sans modifier la donnee', async () => {
    const avant = await prisma.salarie.findUniqueOrThrow({ where: { id: salarieId } });

    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieId}`), {
      method: 'PATCH',
      headers: {
        'x-paymarh-user-id': utilisateurId,
        'content-type': 'application/json',
        'if-match': '999',
      },
      body: JSON.stringify({ nom: 'Echec' }),
    });

    expect(reponse.status).toBe(409);
    const corps = (await reponse.json()) as { code?: string };
    expect(corps.code).toBe('CONFLIT_VERSION');

    const apres = await prisma.salarie.findUniqueOrThrow({ where: { id: salarieId } });
    expect(apres.nom).toBe(avant.nom);
    expect(apres.version).toBe(avant.version);
  });

  it('refuse une ecriture concurrente : une seule reussit, l autre en 409', async () => {
    await prisma.salarie.update({
      where: { id: salarieId },
      data: { version: 0, nom: 'Initial' },
    });

    const url = urlLocale(app, `/socle-test/salaries/${salarieId}`);
    const entetes = {
      'x-paymarh-user-id': utilisateurId,
      'content-type': 'application/json',
      'if-match': '0',
    };

    const [reponseA, reponseB] = await Promise.all([
      fetch(url, {
        method: 'PATCH',
        headers: entetes,
        body: JSON.stringify({ nom: 'ConcurrentA' }),
      }),
      fetch(url, {
        method: 'PATCH',
        headers: entetes,
        body: JSON.stringify({ nom: 'ConcurrentB' }),
      }),
    ]);

    const statuts = [reponseA.status, reponseB.status].sort();
    expect(statuts).toEqual([200, 409]);

    const salarie = await prisma.salarie.findUniqueOrThrow({ where: { id: salarieId } });
    expect(['ConcurrentA', 'ConcurrentB']).toContain(salarie.nom);
    expect(salarie.version).toBe(1);
  });
});
