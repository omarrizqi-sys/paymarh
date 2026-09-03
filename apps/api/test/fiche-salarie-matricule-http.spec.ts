import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-matricule-nr-${Date.now()}`;
const MESSAGE_NEUTRE = "Cette valeur n'est pas disponible.";

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

function payloadSalarie(surcharge: Record<string, unknown> = {}) {
  return {
    nom: 'Alami',
    prenom: 'Said',
    sexe: 'HOMME',
    dateNaissance: '1990-05-15',
    dateEntree: '2025-01-01',
    ...surcharge,
  };
}

function assertRefusNeutre(corps: { message?: string; code?: string }) {
  expect(corps.message).toBe(MESSAGE_NEUTRE);
  expect(corps.code).toBe('VALEUR_INDISPONIBLE');
  const texte = JSON.stringify(corps);
  expect(texte).not.toMatch(/supprim|existant|Alami|Said|fiche/i);
}

describe('API fiche salarie — non-reutilisation des matricules', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;

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

    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`, 'NRA');
    societeB = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SB`, 'NRB');
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('un matricule automatique supprime n est pas reattribue au salarie suivant', async () => {
    const premiere = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Karim' })),
    });
    expect(premiere.status).toBe(201);
    const premierCorps = (await premiere.json()) as { donnees: { id: string; matricule: string } };
    const matriculeConsomme = premierCorps.donnees.matricule;

    await prisma.salarie.delete({ where: { id: premierCorps.donnees.id } });

    const seconde = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Leila' })),
    });
    expect(seconde.status).toBe(201);
    const secondCorps = (await seconde.json()) as { donnees: { matricule: string } };
    expect(secondCorps.donnees.matricule).not.toBe(matriculeConsomme);
    expect(secondCorps.donnees.matricule).toBe('NRA00002');
    expect(matriculeConsomme).toBe('NRA00001');
  });

  it('saisir le matricule d un salarie supprime est refuse sans indiquer qu une fiche a existe', async () => {
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Nadia', matricule: `${PREFIXE}-SUPPR-AUTO` })),
    });
    expect(creation.status).toBe(201);
    const cree = (await creation.json()) as { donnees: { id: string } };
    await prisma.salarie.delete({ where: { id: cree.donnees.id } });

    const refus = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({ prenom: 'Omar', matricule: `${PREFIXE}-SUPPR-AUTO` })
      ),
    });
    expect(refus.status).toBe(400);
    assertRefusNeutre((await refus.json()) as { message?: string; code?: string });
  });

  it('un matricule saisi manuellement puis supprime n est pas reattribuable', async () => {
    const matricule = `${PREFIXE}-MANUEL`;
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Hassan', matricule })),
    });
    expect(creation.status).toBe(201);
    const cree = (await creation.json()) as { donnees: { id: string } };
    await prisma.salarie.delete({ where: { id: cree.donnees.id } });

    const refus = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Imane', matricule })),
    });
    expect(refus.status).toBe(400);
    assertRefusNeutre((await refus.json()) as { message?: string; code?: string });
  });

  it('le meme matricule reste attribuable dans une autre societe du meme compte', async () => {
    const matricule = `${PREFIXE}-CROSS`;
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Youssef', matricule })),
    });
    expect(creation.status).toBe(201);
    const cree = (await creation.json()) as { donnees: { id: string } };
    await prisma.salarie.delete({ where: { id: cree.donnees.id } });

    const autreSociete = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeB.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarie({ prenom: 'Fatima', matricule })),
    });
    expect(autreSociete.status).toBe(201);
    const corps = (await autreSociete.json()) as { donnees: { matricule: string } };
    expect(corps.donnees.matricule).toBe(matricule);
  });
});
