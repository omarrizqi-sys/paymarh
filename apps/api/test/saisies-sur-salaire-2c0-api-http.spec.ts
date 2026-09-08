import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { creerSalarieMin, creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-saisies-2c0-${Date.now()}`;

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

function corpsPension(surcharges: Record<string, unknown> = {}) {
  return {
    typeSaisieCode: 'PENSION_ALIMENTAIRE',
    referenceDecision: 'JUG-TEST-001',
    creancier: 'Tribunal',
    libelleBulletin: 'Pension',
    montantMensuel: '1500.00',
    moisDebut: '2024-01',
    ...surcharges,
  };
}

function corpsTiers(surcharges: Record<string, unknown> = {}) {
  return {
    typeSaisieCode: 'TIERS_DETENTEUR',
    referenceDecision: 'DEC-TEST-001',
    creancier: 'Creancier',
    libelleBulletin: 'Saisie',
    montantTotal: '8000.00',
    moisDebut: '2024-01',
    ...surcharges,
  };
}

describe('2.c-0 — saisies sur salaire et referentiel types', () => {
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
    await nettoyerCompteTest(prisma, `${PREFIXE}-A`);
    await app?.close();
  });

  it('C1 — GET /referentiels/types-saisie-sur-salaire rend deux entrees dans l ordre', async () => {
    const reponse = await fetch(urlLocale(app, '/referentiels/types-saisie-sur-salaire'), {
      headers: { 'x-paymarh-user-id': utilisateurId },
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      data: { items: { code: string; libelle: string; ordre: number }[]; total: number };
    };
    expect(corps.data.total).toBe(2);
    expect(corps.data.items).toEqual([
      {
        code: 'PENSION_ALIMENTAIRE',
        libelle: 'Pension alimentaire',
        ordre: 1,
        id: expect.any(String),
      },
      {
        code: 'TIERS_DETENTEUR',
        libelle: 'Saisie à tiers détenteur',
        ordre: 2,
        id: expect.any(String),
      },
    ]);
  });

  it('C2 — creer une pension alimentaire avec montant mensuel sans montant total reussit', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PENSION-OK`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(corpsPension()),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: {
        saisiesSurSalaire: {
          typeSaisieCode: string;
          montantMensuel: string | null;
          montantTotal: string | null;
        }[];
      };
    };
    const ligne = corps.donnees.saisiesSurSalaire.find(
      (s) => s.typeSaisieCode === 'PENSION_ALIMENTAIRE'
    );
    expect(ligne?.montantMensuel).toBe('1500.00');
    expect(ligne?.montantTotal).toBeNull();
  });

  it('C3 — creer une pension alimentaire avec montant total echoue CHAMP_INTERDIT', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-PENSION-KO-TOTAL`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(corpsPension({ montantTotal: '5000.00' })),
    });
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string; champ?: string };
    expect(corps.code).toBe('CHAMP_INTERDIT');
    expect(corps.champ).toBe('montantTotal');
  });

  it('C4 — creer une saisie tiers detenteur avec montant total sans mensuel reussit', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-TIERS-OK`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(corpsTiers()),
    });
    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: {
        saisiesSurSalaire: {
          typeSaisieCode: string;
          montantTotal: string | null;
          montantMensuel: string | null;
        }[];
      };
    };
    const ligne = corps.donnees.saisiesSurSalaire.find(
      (s) => s.typeSaisieCode === 'TIERS_DETENTEUR'
    );
    expect(ligne?.montantTotal).toBe('8000.00');
    expect(ligne?.montantMensuel).toBeNull();
  });

  it('C5 — creer une saisie tiers detenteur avec mois de fin echoue CHAMP_INTERDIT', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-TIERS-KO-MOIS-FIN`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(corpsTiers({ moisFin: '2025-12' })),
    });
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string; champ?: string };
    expect(corps.code).toBe('CHAMP_INTERDIT');
    expect(corps.champ).toBe('moisFin');
  });

  it('C6 — creer une saisie sans type echoue CHAMP_OBLIGATOIRE', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-SANS-TYPE`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        referenceDecision: 'DEC-001',
        creancier: 'X',
        libelleBulletin: 'Y',
        montantTotal: '1000.00',
        moisDebut: '2024-01',
      }),
    });
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string; champ?: string };
    expect(corps.code).toBe('CHAMP_OBLIGATOIRE');
    expect(corps.champ).toBe('typeSaisieCode');
  });

  it('C7 — modifier le type applique les obligations du nouveau type', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-CHANGE-TYPE`,
    });

    const creation = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify(corpsTiers()),
    });
    expect(creation.status).toBe(201);
    const { donnees } = (await creation.json()) as {
      donnees: { version: number; saisiesSurSalaire: { id: string }[] };
    };
    const ligneId = donnees.saisiesSurSalaire[0]?.id;
    expect(ligneId).toBeDefined();

    const modification = await fetch(
      urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire/${ligneId}`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(donnees.version),
        },
        body: JSON.stringify({
          typeSaisieCode: 'PENSION_ALIMENTAIRE',
          montantMensuel: '1200.00',
        }),
      }
    );
    expect(modification.status).toBe(200);
    const modCorps = (await modification.json()) as {
      donnees: {
        saisiesSurSalaire: {
          id: string;
          typeSaisieCode: string;
          montantMensuel: string | null;
          montantTotal: string | null;
        }[];
      };
    };
    const ligne = modCorps.donnees.saisiesSurSalaire.find((s) => s.id === ligneId);
    expect(ligne?.typeSaisieCode).toBe('PENSION_ALIMENTAIRE');
    expect(ligne?.montantMensuel).toBe('1200.00');
    expect(ligne?.montantTotal).toBeNull();
  });

  it('C8 — moisEffetDebut envoye est refuse CHAMP_INTERDIT', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-MOIS-EFFET`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/saisies-sur-salaire`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({ ...corpsPension(), moisEffetDebut: '2024-06' }),
    });
    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { code: string; champ?: string };
    expect(corps.code).toBe('CHAMP_INTERDIT');
    expect(corps.champ).toBe('moisEffetDebut');
  });
});
