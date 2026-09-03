import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { ProbeSansEcritureModule } from '../src/modules/salaries/test/probe-sans-ecriture.module.js';
import { prisma } from './support/prisma-test.js';
import { urlLocale } from './support/app-http.js';

const PREFIXE = `test-sans-ecriture-${Date.now()}`;

function entetes(utilisateurId: string, companyId: string): Record<string, string> {
  return {
    'x-paymarh-user-id': utilisateurId,
    'x-paymarh-company-id': companyId,
  };
}

describe('RouteSansEcriture - garde a l execution', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let companyId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule, ProbeSansEcritureModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
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
    const societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
    companyId = societe.companyId;
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('une route @RouteSansEcriture qui tente une ecriture echoue en nommant la route', async () => {
    const reponse = await fetch(urlLocale(app, '/probe-sans-ecriture/tenter-ecriture'), {
      method: 'POST',
      headers: entetes(utilisateurId, companyId),
    });

    expect(reponse.status).toBe(500);
    const corps = (await reponse.json()) as { message?: string };
    expect(corps.message).toContain('POST /probe-sans-ecriture/tenter-ecriture');
    expect(corps.message).toContain('updateMany');
  });

  it('POST /salaries/verifier fonctionne sous la contrainte sans ecriture', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries/verifier'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ nom: 'Test', prenom: 'Verif', dateNaissance: '1990-01-01' }),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { donnees: null; alertes: unknown[] };
    expect(corps.donnees).toBeNull();
    expect(Array.isArray(corps.alertes)).toBe(true);
  });

  it('POST /salaries/verifier avec matricule vide ne modifie ni le compteur ni AuditLog', async () => {
    const prefixe = 'EMP';
    const compteurAvant = await prisma.compteurMatricule.findUnique({
      where: { companyId_prefixe: { companyId, prefixe } },
    });
    const auditAvant = await prisma.auditLog.count({
      where: { userId: utilisateurId },
    });

    const reponse = await fetch(urlLocale(app, '/salaries/verifier'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Compteur',
        prenom: 'Inchange',
        dateNaissance: '1991-02-02',
        matricule: '',
      }),
    });

    expect(reponse.status).toBe(201);

    const compteurApres = await prisma.compteurMatricule.findUnique({
      where: { companyId_prefixe: { companyId, prefixe } },
    });
    const auditApres = await prisma.auditLog.count({
      where: { userId: utilisateurId },
    });

    expect(compteurApres?.dernierNumero ?? null).toBe(compteurAvant?.dernierNumero ?? null);
    expect(auditApres).toBe(auditAvant);
  });
});
