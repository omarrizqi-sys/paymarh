import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-refus-forme-${Date.now()}`;
const MOTIF_ANGLAIS_CLASS_VALIDATOR =
  /must be a|should not be empty|should not exist|must be one of the following values|must be a valid ISO/i;

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

function payloadSalarieValide(surcharge: Record<string, unknown> = {}) {
  return {
    nom: 'Alami',
    prenom: 'Said',
    sexe: 'HOMME',
    dateNaissance: '1990-05-15',
    dateEntree: '2025-01-01',
    ...surcharge,
  };
}

function assertRefusForme(
  corps: Record<string, unknown>,
  attendu: { code: string; message: string; champ: string }
): void {
  expect(corps.code).toBe(attendu.code);
  expect(corps.message).toBe(attendu.message);
  expect(corps.champ).toBe(attendu.champ);
  expect(typeof corps.message).toBe('string');
  expect(Array.isArray(corps.message)).toBe(false);
  expect(JSON.stringify(corps)).not.toMatch(MOTIF_ANGLAIS_CLASS_VALIDATOR);
}

describe('API salaries — refus de forme et champs jamais vides', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: PREFIXE, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
    societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SOC`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('9.2 — POST /salaries avec nom vide est refuse (code, message francais, champ nom)', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieValide({ nom: '', matricule: `${PREFIXE}-VIDE` })),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    assertRefusForme(corps, {
      code: 'CHAMP_OBLIGATOIRE',
      message: 'Ce champ est obligatoire.',
      champ: 'nom',
    });
  });

  it('9.2b — POST /salaries avec nom compose d espaces est refuse comme vide', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieValide({ nom: '   ', matricule: `${PREFIXE}-ESP` })),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    assertRefusForme(corps, {
      code: 'CHAMP_OBLIGATOIRE',
      message: 'Ce champ est obligatoire.',
      champ: 'nom',
    });
  });

  it('9.3 — PATCH identite avec nom vide est refuse de la meme facon', async () => {
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieValide({ matricule: `${PREFIXE}-PATCH-VIDE` })),
    });
    expect(creation.status).toBe(201);
    const cree = (await creation.json()) as { donnees: { id: string; version: number } };

    const refus = await fetch(urlLocale(app, `/salaries/${cree.donnees.id}/identite`), {
      method: 'PATCH',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': String(cree.donnees.version),
      },
      body: JSON.stringify({ nom: '' }),
    });

    expect(refus.status).toBe(400);
    const corps = (await refus.json()) as Record<string, unknown>;
    assertRefusForme(corps, {
      code: 'CHAMP_OBLIGATOIRE',
      message: 'Ce champ est obligatoire.',
      champ: 'nom',
    });
  });

  it('9.4 — PATCH identite sans le champ nom (autre champ) reussit', async () => {
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payloadSalarieValide({ matricule: `${PREFIXE}-PATCH-ABSENT` })),
    });
    expect(creation.status).toBe(201);
    const cree = (await creation.json()) as { donnees: { id: string; version: number } };

    const ok = await fetch(urlLocale(app, `/salaries/${cree.donnees.id}/identite`), {
      method: 'PATCH',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': String(cree.donnees.version),
      },
      body: JSON.stringify({ prenom: 'Karim' }),
    });

    expect(ok.status).toBe(200);
    const corps = (await ok.json()) as { donnees: { nom: string; prenom: string } };
    expect(corps.donnees.nom).toBe('Alami');
    expect(corps.donnees.prenom).toBe('Karim');
  });

  it('9.5 — POST /salaries sans dateNaissance reussit', async () => {
    const { dateNaissance: _ignoree, ...sansNaissance } = payloadSalarieValide({
      matricule: `${PREFIXE}-SANS-NAISS`,
    });
    void _ignoree;

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(sansNaissance),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: { id: string; dateNaissance: string | null };
    };
    expect(corps.donnees.dateNaissance).toBeNull();

    const lecture = await fetch(urlLocale(app, `/salaries/${corps.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(lecture.status).toBe(200);
    const lu = (await lecture.json()) as { donnees: { dateNaissance: string | null } };
    expect(lu.donnees.dateNaissance).toBeNull();
  });

  it('9.6 — POST avec un champ inconnu est refuse dans la structure commune, pas en anglais', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieValide({ matricule: `${PREFIXE}-INCONNU`, champInconnu: true })
      ),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    assertRefusForme(corps, {
      code: 'CHAMP_INTERDIT',
      message: 'Ce champ ne peut pas être fourni par le client.',
      champ: 'champInconnu',
    });
  });

  it('9.7 — un refus de forme ne contient aucune chaine anglaise de class-validator', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarieValide({ dateEntree: 'pas-une-date', matricule: `${PREFIXE}-FORMAT` })
      ),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as Record<string, unknown>;
    expect(typeof corps.message).toBe('string');
    expect(typeof corps.code).toBe('string');
    expect(corps.champ).toBe('dateEntree');
    expect(JSON.stringify(corps)).not.toMatch(MOTIF_ANGLAIS_CLASS_VALIDATOR);
    expect(JSON.stringify(corps)).not.toMatch(/isDateString|class-validator/i);
  });
});
