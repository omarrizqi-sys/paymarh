import type { INestApplication } from '@nestjs/common';
import { execSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { prisma } from './support/prisma-test.js';

describe('GET /salaries/:id — heritage sur donnees demo (2.1.c-3)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let companyId: string;
  let salarieId: string;

  beforeAll(async () => {
    const racine = new URL('../../..', import.meta.url);
    execSync('pnpm db:seed', { cwd: racine, stdio: 'pipe' });

    app = await creerAppHttp();
    await app.listen(0);

    const admin = await prisma.user.findFirstOrThrow({
      where: { email: 'admin@cabinet-demo.local' },
    });
    utilisateurId = admin.id;

    const societe = await prisma.company.findFirstOrThrow({
      where: { codeDossier: 'DEMO-001' },
    });
    companyId = societe.id;

    const youssef = await prisma.salarie.findFirstOrThrow({
      where: { companyId, nom: 'Bennani', prenom: 'Youssef' },
    });
    salarieId = youssef.id;
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  it('Youssef Bennani — avantage cloture et statut actif via GET /salaries/:id', async () => {
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieId}`), {
      headers: {
        'x-paymarh-user-id': utilisateurId,
        'x-paymarh-company-id': companyId,
      },
    });
    expect(reponse.status).toBe(200);

    const { donnees } = (await reponse.json()) as {
      donnees: {
        emplois: {
          numeroOrdre: number;
          avantagesEnNature: { natureRef: string; etat: string }[];
          statutsParticuliers: { statutCode: string; dateDebut: string; etat: string }[];
        }[];
      };
    };

    const emploiOuvert = donnees.emplois.find((emploi) => emploi.numeroOrdre === 1);
    expect(emploiOuvert).toBeDefined();

    const nourriture = emploiOuvert?.avantagesEnNature.find(
      (avantage) => avantage.natureRef === 'NOURRITURE'
    );
    expect(nourriture?.etat).toBe('CLOTUREE');

    const statutActif = emploiOuvert?.statutsParticuliers.find(
      (statut) => statut.statutCode === 'IDMAJ' && statut.dateDebut === '2021-06-01'
    );
    expect(statutActif?.etat).toBe('ACTIVE');
  });

  it('Youssef Bennani — duree contractuelle heritee via GET /salaries/:id', async () => {
    // Sans bulletin, le mois en cours est 2022-03 (debut de l emploi ouvert « Responsable paie »).
    // Le parametrage siege a un mois d effet 2022-01, anterieur a ce mois : l heritage doit ressortir.
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieId}`), {
      headers: {
        'x-paymarh-user-id': utilisateurId,
        'x-paymarh-company-id': companyId,
      },
    });
    expect(reponse.status).toBe(200);

    const { donnees } = (await reponse.json()) as {
      donnees: {
        emplois: {
          numeroOrdre: number;
          affectation: { dureeContractuelle: string | null };
          resolutions: {
            dureeContractuelle: {
              valeur: string;
              origine: string;
              libelleEntite: string | null;
            } | null;
          };
        }[];
      };
    };

    const emploiOuvert = donnees.emplois.find((emploi) => emploi.numeroOrdre === 1);
    expect(emploiOuvert).toBeDefined();
    expect(emploiOuvert?.affectation.dureeContractuelle).toBeNull();
    expect(emploiOuvert?.resolutions.dureeContractuelle).toEqual({
      valeur: '44',
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Siège Casablanca',
    });
  });
});
