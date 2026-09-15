import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import {
  MOTIFS_SORTIE,
  NATURES_AVANTAGE_EN_NATURE,
  PRIMES_REFERENTIEL,
  STATUTS_PARTICULIERS,
  TYPES_CONTRAT,
} from '../prisma/reference-data-fiche-salarie.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-ref-emploi-${Date.now()}`;

describe('GET /referentiels/types-contrat, /motifs-sortie et /statuts-particuliers', () => {
  let app: INestApplication;
  let utilisateurId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'EMPLOYEE',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: PREFIXE } } });
    await prisma.account.deleteMany({ where: { name: { startsWith: PREFIXE } } });
    await app?.close();
  });

  it('E1 — GET /referentiels/types-contrat rend sept entrees dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/types-contrat'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/types-contrat'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(TYPES_CONTRAT.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      TYPES_CONTRAT.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });

  it('E2 — GET /referentiels/motifs-sortie rend treize entrees dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/motifs-sortie'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/motifs-sortie'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(MOTIFS_SORTIE.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      MOTIFS_SORTIE.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });

  it('E4 — GET /referentiels/primes rend quinze entrees dans l ordre du referentiel', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/primes'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/primes'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(PRIMES_REFERENTIEL.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      PRIMES_REFERENTIEL.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
    const libellesOrdreAlpha = [...corps.data.items]
      .map(({ libelle }) => libelle)
      .sort((a, b) => a.localeCompare(b, 'fr'));
    expect(corps.data.items.map(({ libelle }) => libelle)).not.toEqual(libellesOrdreAlpha);
  });

  it('E5 — GET /referentiels/primes refuse sans referentiel.lire', async () => {
    const reponse = await fetch(urlLocale(app, '/referentiels/primes'), {
      headers: {
        'x-paymarh-user-id': utilisateurId,
        [HEADER_PERMISSIONS_REFUSEES]: 'referentiel.lire',
      },
    });
    expect(reponse.status).toBe(403);
  });

  it('E6 — GET /referentiels/natures-avantage-en-nature rend trois entrees dans l ordre du referentiel', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/natures-avantage-en-nature'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/natures-avantage-en-nature'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(NATURES_AVANTAGE_EN_NATURE.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      NATURES_AVANTAGE_EN_NATURE.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
    const libellesOrdreAlpha = [...corps.data.items]
      .map(({ libelle }) => libelle)
      .sort((a, b) => a.localeCompare(b, 'fr'));
    expect(corps.data.items.map(({ libelle }) => libelle)).not.toEqual(libellesOrdreAlpha);
  });

  it('E7 — GET /referentiels/natures-avantage-en-nature refuse sans referentiel.lire', async () => {
    const reponse = await fetch(urlLocale(app, '/referentiels/natures-avantage-en-nature'), {
      headers: {
        'x-paymarh-user-id': utilisateurId,
        [HEADER_PERMISSIONS_REFUSEES]: 'referentiel.lire',
      },
    });
    expect(reponse.status).toBe(403);
  });

  it('E3 — GET /referentiels/statuts-particuliers rend les statuts saisissables dans l ordre et refuse sans tenant', async () => {
    const sansTenant = await fetch(urlLocale(app, '/referentiels/statuts-particuliers'));
    expect(sansTenant.status).toBe(401);

    const reponse = await fetch(urlLocale(app, '/referentiels/statuts-particuliers'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(STATUTS_PARTICULIERS.length);
    expect(corps.data.items.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))).toEqual(
      STATUTS_PARTICULIERS.map(({ code, libelle, ordre }) => ({ code, libelle, ordre }))
    );
  });
});
