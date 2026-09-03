import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { creerSalarieMin, creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-socle-audit-${Date.now()}`;

describe('socle 2.1.b — audit ecriture HTTP', () => {
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
    await prisma.auditLog.deleteMany({ where: { userId: utilisateurId } });
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('produit exactement une entree AuditLog avec ecart avant/apres par ecriture reussie', async () => {
    const avant = await prisma.auditLog.count({ where: { targetId: salarieId } });

    const reponse = await fetch(urlLocale(app, `/socle-test/salaries/${salarieId}`), {
      method: 'PATCH',
      headers: {
        'x-paymarh-user-id': utilisateurId,
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({ nom: 'AuditNom' }),
    });

    expect(reponse.status).toBe(200);

    const corps = (await reponse.json()) as { alertes?: unknown[]; donnees?: unknown };
    expect(corps).toHaveProperty('alertes');
    expect(corps.alertes).toEqual([]);

    const apres = await prisma.auditLog.count({ where: { targetId: salarieId } });
    expect(apres - avant).toBe(1);

    const journal = await prisma.auditLog.findFirst({
      where: { targetId: salarieId, action: 'MODIFIER_SALARIE_TEST' },
      orderBy: { createdAt: 'desc' },
    });

    expect(journal).not.toBeNull();
    expect(journal!.userId).toBe(utilisateurId);
    expect(journal!.accountId).toBe(compteId);
    expect(journal!.targetType).toBe('Salarie');

    const ecart = journal!.ecart as {
      champs: { nom: string; ancienne: unknown; nouvelle: unknown }[];
    };
    expect(ecart.champs.some((c) => c.nom === 'nom' && c.nouvelle === 'AuditNom')).toBe(true);
  });
});
