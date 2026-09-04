import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-liste-salarie-${Date.now()}`;

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

describe('API salarié — colonnes liste (2.1.c-1 temps 1.2)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;

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
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('un salarié avec un seul emploi ouvert affiche poste et établissement', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-UN-EMP`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societeA.etablissementPrincipalId,
      1,
      '2025-01',
      new Date('2025-01-01')
    );
    await prisma.emploiContratVersion.updateMany({
      where: { emploiId: emploi.id },
      data: { libellePoste: 'Analyste paie' },
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries?recherche=${encodeURIComponent(`${PREFIXE}-UN-EMP`)}`),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: {
        items: {
          poste: string | null;
          etablissement: string | null;
          dateEntree: string;
        }[];
      };
    };
    const ligne = corps.donnees.items[0];
    expect(ligne?.poste).toBe('Analyste paie');
    expect(ligne?.etablissement).toContain('Siege');
    expect(ligne?.dateEntree).toBe('2025-01-01');
  });

  it('deux emplois ouverts affichent « 2 emplois » sans établissement', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DEUX-EMP`,
    });
    await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementPrincipalId, 1, '2025-01');
    await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementSecondaireId, 2, '2025-02');

    const reponse = await fetch(
      urlLocale(app, `/salaries?recherche=${encodeURIComponent(`${PREFIXE}-DEUX-EMP`)}`),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );
    const corps = (await reponse.json()) as {
      donnees: { items: { poste: string | null; etablissement: string | null }[] };
    };
    const ligne = corps.donnees.items[0];
    expect(ligne?.poste).toBe('2 emplois');
    expect(ligne?.etablissement).toBeNull();
  });

  it('un salarié sorti affiche le poste et l établissement du dernier emploi clos', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SORTI`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societeA.etablissementSecondaireId,
      1,
      '2025-01'
    );
    await prisma.emploiContratVersion.updateMany({
      where: { emploiId: emploi.id },
      data: {
        libellePoste: 'Stagiaire',
        dateSortie: new Date('2024-12-31'),
      },
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries?recherche=${encodeURIComponent(`${PREFIXE}-SORTI`)}`),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );
    const corps = (await reponse.json()) as {
      donnees: {
        items: {
          etat: string;
          poste: string | null;
          etablissement: string | null;
        }[];
      };
    };
    const ligne = corps.donnees.items[0];
    expect(ligne?.etat).toBe('INACTIF');
    expect(ligne?.poste).toBe('Stagiaire');
    expect(ligne?.etablissement).toContain('Atelier');
  });

  it('un salarié sans emploi est inactif sans poste ni établissement', async () => {
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SANS-EMP`,
    });

    const reponse = await fetch(
      urlLocale(app, `/salaries?recherche=${encodeURIComponent(`${PREFIXE}-SANS-EMP`)}`),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );
    const corps = (await reponse.json()) as {
      donnees: {
        items: {
          etat: string;
          poste: string | null;
          etablissement: string | null;
        }[];
      };
    };
    const ligne = corps.donnees.items[0];
    expect(ligne?.etat).toBe('INACTIF');
    expect(ligne?.poste).toBeNull();
    expect(ligne?.etablissement).toBeNull();
  });
});

describe('deduction d etat — unitaire et groupée concordantes', () => {
  it('rendent le même état pour le même salarié', async () => {
    const { deduireEtatSalarie, deduireLignesListeSalaries } =
      await import('../src/modules/salaries/deductions-salarie.js');

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-ETAT`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-ETAT-SA`);
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-ETAT-001`,
    });
    await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const unitaire = await deduireEtatSalarie(prisma, salarie.id);
    const groupe = (await deduireLignesListeSalaries(prisma, [salarie.id])).get(salarie.id)?.etat;

    expect(groupe).toBe(unitaire);

    await nettoyerCompteTest(prisma, `${PREFIXE}-ETAT`);
  });
});
