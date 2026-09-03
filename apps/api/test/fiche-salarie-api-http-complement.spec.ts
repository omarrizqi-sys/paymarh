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

const PREFIXE = `test-salarie-complement-${Date.now()}`;

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

describe('API fiche salarie — complement correctif 2.1.b-2', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;
  let paysMarocId: string;
  let paysFranceId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const maroc = await prisma.pays.findFirstOrThrow({ where: { codeIso: 'MA' } });
    const france = await prisma.pays.findFirstOrThrow({ where: { codeIso: 'FR' } });
    paysMarocId = maroc.id;
    paysFranceId = france.id;

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

    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
    societeB = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SB`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('C10 — numero de piece deja pris dans la societe : blocage sans creation', async () => {
    const numeroPiece = `${PREFIXE}-PIECE-DUP`;
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C10-REF`,
      numeroPiece,
    });

    const avant = await prisma.salarie.count({ where: { companyId: societeA.companyId } });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C10-NEW`,
          numeroPiece,
          nom: 'Dup',
          prenom: 'Piece',
        })
      ),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { message?: string };
    expect(corps.message).toBe("Cette valeur n'est pas disponible.");

    const apres = await prisma.salarie.count({ where: { companyId: societeA.companyId } });
    expect(apres).toBe(avant);
  });

  it('C11 — numero CNSS deja pris dans la societe : blocage sans creation', async () => {
    const numeroCnss = '9876543210001';
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C11-REF`,
      numeroCnss,
    });

    const avant = await prisma.salarie.count({ where: { companyId: societeA.companyId } });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C11-NEW`,
          numeroCnss,
          nom: 'Dup',
          prenom: 'Cnss',
        })
      ),
    });

    expect(reponse.status).toBe(400);
    const corps = (await reponse.json()) as { message?: string };
    expect(corps.message).toBe("Cette valeur n'est pas disponible.");

    const apres = await prisma.salarie.count({ where: { companyId: societeA.companyId } });
    expect(apres).toBe(avant);
  });

  it('C10 — le meme numero de piece est accepte dans une autre societe sans alerte', async () => {
    const numeroPiece = `${PREFIXE}-PIECE-CROSS`;
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C10-CROSS-A`,
      numeroPiece,
    });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeB.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C10-CROSS-B`,
          numeroPiece,
          nom: 'Cross',
          prenom: 'Piece',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('C11 — le meme numero CNSS est accepte dans une autre societe sans alerte', async () => {
    const numeroCnss = '9876543210002';
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C11-CROSS-A`,
      numeroCnss,
    });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeB.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C11-CROSS-B`,
          numeroCnss,
          nom: 'Cross',
          prenom: 'Cnss',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: unknown[] };
    expect(corps.alertes).toHaveLength(0);
  });

  it('C10 — deux salariés avec numero de piece VIDE sont crees sans blocage', async () => {
    const reponse1 = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C10-VIDE-1`,
          numeroPiece: '',
          nom: 'Vide',
          prenom: 'PieceUn',
        })
      ),
    });
    expect(reponse1.status).toBe(201);

    const reponse2 = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C10-VIDE-2`,
          numeroPiece: '',
          nom: 'Vide',
          prenom: 'PieceDeux',
        })
      ),
    });
    expect(reponse2.status).toBe(201);
  });

  it('C11 — deux salariés avec numero CNSS VIDE sont crees sans blocage', async () => {
    const reponse1 = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C11-VIDE-1`,
          numeroCnss: '',
          nom: 'Vide',
          prenom: 'CnssUn',
        })
      ),
    });
    expect(reponse1.status).toBe(201);

    const reponse2 = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C11-VIDE-2`,
          numeroCnss: '',
          nom: 'Vide',
          prenom: 'CnssDeux',
        })
      ),
    });
    expect(reponse2.status).toBe(201);
  });

  it('POST /salaries rend HOMONYME dans alertes avec fiche creee', async () => {
    const actif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-HOMONYME-POST-REF`,
    });
    await creerEmploiOuvert(
      prisma,
      actif.id,
      societeA.etablissementPrincipalId,
      99
    );

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-HOMONYME-POST-NEW`,
          nom: 'Alami',
          prenom: 'Said',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: { id: string };
      alertes: { code: string }[];
    };
    expect(corps.donnees.id).toBeDefined();
    expect(corps.alertes.some((a) => a.code === 'HOMONYME')).toBe(true);
  });

  it('POST /salaries rend REEMBAUCHE avec salarieExistantId et fiche creee', async () => {
    const inactif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-REEMBAUCHE-POST-REF`,
      nom: 'Benjelloun',
      prenom: 'Karim',
      dateNaissance: new Date('1988-03-03'),
    });

    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-REEMBAUCHE-POST-NEW`,
          nom: 'Benjelloun',
          prenom: 'Karim',
          dateNaissance: '1988-03-03',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      donnees: { id: string };
      alertes: { code: string; salarieExistantId?: string }[];
    };
    expect(corps.donnees.id).toBeDefined();
    const alerte = corps.alertes.find((a) => a.code === 'REEMBAUCHE');
    expect(alerte?.salarieExistantId).toBe(inactif.id);
  });

  it('C15 — pays Maroc et code postal invalide : alerte presente', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C15-MA`,
          paysId: paysMarocId,
          codePostal: '123',
          nom: 'Postal',
          prenom: 'Maroc',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'CODE_POSTAL_MAROC_INATTENDU')).toBe(true);
  });

  it('C15 — pays etranger et code postal libre : aucune alerte', async () => {
    const reponse = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societeA.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify(
        payloadSalarie({
          matricule: `${PREFIXE}-C15-FR`,
          paysId: paysFranceId,
          codePostal: '75001-LONGUEUR-LIBRE',
          nom: 'Postal',
          prenom: 'Etranger',
        })
      ),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.some((a) => a.code === 'CODE_POSTAL_MAROC_INATTENDU')).toBe(false);
    expect(corps.alertes).toHaveLength(0);
  });

  it('GET /salaries — pagination par curseur sans doublon ni omission sur trois pages', async () => {
    const idsAttendus = new Set<string>();
    const tokenRecherche = `zzpagcur${Date.now()}`;
    const noms = ['Amrani', 'Berrada', 'Chakir', 'Daoudi', 'El Fassi', 'Filali', 'Ghazi'];
    for (let i = 0; i < noms.length; i++) {
      const salarie = await creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${tokenRecherche}-${i}`,
        nom: noms[i]!,
        prenom: 'Curseur',
      });
      idsAttendus.add(salarie.id);
    }

    const idsRecus = new Set<string>();
    let curseur: string | null = null;

    for (let page = 0; page < 4; page++) {
      const chemin =
        curseur === null
          ? `/salaries?limite=2&recherche=${encodeURIComponent(tokenRecherche)}`
          : `/salaries?limite=2&recherche=${encodeURIComponent(tokenRecherche)}&curseur=${encodeURIComponent(curseur)}`;
      const reponse = await fetch(urlLocale(app, chemin), {
        headers: entetes(utilisateurId, societeA.companyId),
      });
      expect(reponse.status).toBe(200);
      const corps = (await reponse.json()) as {
        donnees: { items: { id: string }[]; prochainCurseur: string | null };
      };
      for (const item of corps.donnees.items) {
        expect(idsRecus.has(item.id)).toBe(false);
        idsRecus.add(item.id);
      }
      curseur = corps.donnees.prochainCurseur;
      if (curseur === null) break;
    }

    expect(idsRecus.size).toBe(idsAttendus.size);
    for (const id of idsAttendus) {
      expect(idsRecus.has(id)).toBe(true);
    }
  });

  it('GET /salaries — filtre etat ACTIF et INACTIF separement', async () => {
    const inactif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ETAT-INACTIF`,
      nom: 'Zerhouni',
      prenom: 'Etat',
    });
    const actif = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ETAT-ACTIF`,
      nom: 'Ziani',
      prenom: 'Etat',
    });
    await creerEmploiOuvert(
      prisma,
      actif.id,
      societeA.etablissementPrincipalId,
      98
    );

    const reponseActifs = await fetch(urlLocale(app, '/salaries?etat=ACTIF&recherche=Etat'), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const actifs = (await reponseActifs.json()) as {
      donnees: { items: { id: string; etat: string }[] };
    };
    expect(actifs.donnees.items.some((i) => i.id === actif.id)).toBe(true);
    expect(actifs.donnees.items.every((i) => i.etat === 'ACTIF')).toBe(true);
    expect(actifs.donnees.items.some((i) => i.id === inactif.id)).toBe(false);

    const reponseInactifs = await fetch(urlLocale(app, '/salaries?etat=INACTIF&recherche=Etat'), {
      headers: entetes(utilisateurId, societeA.companyId),
    });
    const inactifs = (await reponseInactifs.json()) as {
      donnees: { items: { id: string; etat: string }[] };
    };
    expect(inactifs.donnees.items.some((i) => i.id === inactif.id)).toBe(true);
    expect(inactifs.donnees.items.every((i) => i.etat === 'INACTIF')).toBe(true);
    expect(inactifs.donnees.items.some((i) => i.id === actif.id)).toBe(false);
  });

  it('GET /salaries — filtre etablissement ne rend que les salariés affectes', async () => {
    const auSiege = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ETAB-SIEGE`,
      nom: 'Yousfi',
      prenom: 'Siege',
    });
    const aAtelier = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ETAB-ATELIER`,
      nom: 'Yousfi',
      prenom: 'Atelier',
    });
    await creerEmploiOuvert(
      prisma,
      auSiege.id,
      societeA.etablissementPrincipalId,
      97
    );
    await creerEmploiOuvert(
      prisma,
      aAtelier.id,
      societeA.etablissementSecondaireId,
      96
    );

    const reponse = await fetch(
      urlLocale(
        app,
        `/salaries?etablissementId=${societeA.etablissementSecondaireId}&recherche=Yousfi`
      ),
      { headers: entetes(utilisateurId, societeA.companyId) }
    );

    const corps = (await reponse.json()) as { donnees: { items: { id: string }[] } };
    expect(corps.donnees.items.some((i) => i.id === aAtelier.id)).toBe(true);
    expect(corps.donnees.items.some((i) => i.id === auSiege.id)).toBe(false);
  });

  it('GET /salaries — recherche libre par nom, prenom et matricule', async () => {
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-RECH-MAT-XYZ`,
      nom: 'UniqueNomRecherche',
      prenom: 'UniquePrenomRecherche',
    });

    for (const [param, valeur] of [
      ['recherche', 'UniqueNomRecherche'],
      ['recherche', 'UniquePrenomRecherche'],
      ['recherche', `${PREFIXE}-RECH-MAT-XYZ`],
    ] as const) {
      const reponse = await fetch(urlLocale(app, `/salaries?${param}=${valeur}`), {
        headers: entetes(utilisateurId, societeA.companyId),
      });
      const corps = (await reponse.json()) as { donnees: { items: { matricule: string }[] } };
      expect(corps.donnees.items.some((i) => i.matricule === `${PREFIXE}-RECH-MAT-XYZ`)).toBe(
        true
      );
    }
  });

  it('GET /salaries — etancheite : aucun salarié d une autre societe du meme compte', async () => {
    const salarieA = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ISO-A`,
      nom: 'Iso',
      prenom: 'SocieteA',
    });
    const salarieB = await creerSalarieMin(prisma, societeB.companyId, {
      matricule: `${PREFIXE}-ISO-B`,
      nom: 'Iso',
      prenom: 'SocieteB',
    });

    const reponse = await fetch(urlLocale(app, '/salaries?recherche=Iso'), {
      headers: entetes(utilisateurId, societeA.companyId),
    });

    const corps = (await reponse.json()) as { donnees: { items: { id: string }[] } };
    const ids = corps.donnees.items.map((i) => i.id);
    expect(ids).toContain(salarieA.id);
    expect(ids).not.toContain(salarieB.id);
  });
});
