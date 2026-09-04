import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-fiche-c2-${Date.now()}`;

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

function rib24(suffixeNumerique: string): string {
  return `0077800000000000${suffixeNumerique}`.padEnd(24, '0').slice(0, 24);
}

async function fermerEmploi(emploiId: string, dateSortie: Date): Promise<void> {
  await prisma.emploiContratVersion.updateMany({
    where: { emploiId },
    data: { dateSortie },
  });
}

describe('API fiche salarie — extensions 2.1.c-2 temps 0', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;
  let paysMarocId: string;
  let situationMarieCode: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const maroc = await prisma.pays.findFirstOrThrow({ where: { codeIso: 'MA' } });
    paysMarocId = maroc.id;
    const situationMarie = await prisma.situationFamiliale.findFirstOrThrow({
      where: { code: 'MARIE' },
    });
    situationMarieCode = situationMarie.code;

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
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('T1 — PUT de trois comptes : RIB mal formes en 2e et 3e position portent indexLigne 1 et 2', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T1`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`), {
      method: 'PUT',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        comptes: [
          { rib: rib24('0101'), partVirement: '40.00' },
          { rib: '0077800000000000', partVirement: '30.00' },
          { rib: '0077800000000001', partVirement: '30.00' },
        ],
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      alertes: { code: string; indexLigne?: number }[];
    };
    const format = corps.alertes.filter((a) => a.code === 'FORMAT_IDENTIFIANT_BANCAIRE');
    expect(format).toHaveLength(2);
    expect(format.map((a) => a.indexLigne).sort()).toEqual([1, 2]);
  });

  it('T2 — PUT de trois comptes : banque incoherente sur le 3e porte indexLigne 2', async () => {
    const n = (Number(PREFIXE.replace(/\D/g, '').slice(-5)) % 800) + 100;
    const codeRib = String(n).padStart(3, '0');
    const codeAutre = String(n + 1).padStart(3, '0');
    const banqueRib = await prisma.banque.create({
      data: {
        nom: `Banque RIB ${PREFIXE}`,
        codeBanque: codeRib,
        couleur: '#112233',
      },
    });
    const banqueAutre = await prisma.banque.create({
      data: {
        nom: `Banque autre ${PREFIXE}`,
        codeBanque: codeAutre,
        couleur: '#223344',
      },
    });
    expect(banqueRib.id).not.toBe(banqueAutre.id);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T2`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`), {
      method: 'PUT',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        comptes: [
          { rib: rib24('0201'), partVirement: '40.00' },
          { rib: rib24('0202'), partVirement: '30.00' },
          {
            rib: `${codeRib}78000000000000000003`.slice(0, 24),
            banqueId: banqueAutre.id,
            partVirement: '30.00',
          },
        ],
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      alertes: { code: string; indexLigne?: number }[];
    };
    const incoherentes = corps.alertes.filter((a) => a.code === 'BANQUE_INCOHERENTE');
    expect(incoherentes).toHaveLength(1);
    expect(incoherentes[0]?.indexLigne).toBe(2);
  });

  it('T2bis — PUT de trois comptes : RIB deja utilise sur le 2e porte indexLigne 1', async () => {
    const ribDejaUtilise = rib24('0210');
    await prisma.compteBancaire.create({
      data: { companyId: societe.companyId, rib: ribDejaUtilise },
    });

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T2BIS`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/comptes-bancaires`), {
      method: 'PUT',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        comptes: [
          { rib: rib24('0211'), partVirement: '40.00' },
          { rib: ribDejaUtilise, partVirement: '30.00' },
          { rib: rib24('0212'), partVirement: '30.00' },
        ],
      }),
    });

    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      alertes: { code: string; indexLigne?: number }[];
    };
    const dejaUtilise = corps.alertes.filter((a) => a.code === 'RIB_DEJA_UTILISE');
    expect(dejaUtilise).toHaveLength(1);
    expect(dejaUtilise[0]?.indexLigne).toBe(1);
  });

  it('T3 — une alerte de pret (route ligne par ligne) ne porte pas indexLigne', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T3`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}/prets`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        libelleObjet: 'Pret incoherent',
        libelleBulletin: 'PRET',
        montantTotal: '1000.00',
        moisDebut: '2024-01',
        mensualite: '90.00',
        nombreEcheances: 12,
      }),
    });

    expect(reponse.status).toBe(201);
    const corps = (await reponse.json()) as {
      alertes: { code: string; indexLigne?: number }[];
    };
    const alerte = corps.alertes.find((a) => a.code === 'MENSUALITE_ECHEANCES_INCOHERENTE');
    expect(alerte).toBeDefined();
    expect('indexLigne' in (alerte ?? {})).toBe(false);
  });

  it('T4 — un emploi ouvert : dateSortie null', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T4`,
    });
    await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { etat: string; dateSortie: string | null };
    };
    expect(corps.donnees.etat).toBe('ACTIF');
    expect(corps.donnees.dateSortie).toBeNull();
  });

  it('T5 — aucun emploi : dateSortie null', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T5`,
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { etat: string; dateSortie: string | null };
    };
    expect(corps.donnees.etat).toBe('INACTIF');
    expect(corps.donnees.dateSortie).toBeNull();
  });

  it('T6 — un emploi clos et un ouvert : dateSortie null', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T6`,
    });
    const clos = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);
    await fermerEmploi(clos.id, new Date('2024-06-30'));
    await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 2);

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { etat: string; dateSortie: string | null };
    };
    expect(corps.donnees.etat).toBe('ACTIF');
    expect(corps.donnees.dateSortie).toBeNull();
  });

  it('T7 — trois emplois clos : la date la plus recente est celle du milieu', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T7`,
    });
    const emploiPremier = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );
    const emploiMilieu = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      2
    );
    const emploiTroisieme = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      3
    );
    await fermerEmploi(emploiPremier.id, new Date('2024-03-10'));
    await fermerEmploi(emploiMilieu.id, new Date('2025-06-30'));
    await fermerEmploi(emploiTroisieme.id, new Date('2023-01-15'));

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: { etat: string; dateSortie: string | null };
    };
    expect(corps.donnees.etat).toBe('INACTIF');
    expect(corps.donnees.dateSortie).toBe('2025-06-30');
  });

  it('T9 — un salarie ACTIF n a jamais de dateSortie', async () => {
    const ouvert = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T9A`,
    });
    await creerEmploiOuvert(prisma, ouvert.id, societe.etablissementPrincipalId, 1);

    const mixte = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T9B`,
    });
    const clos = await creerEmploiOuvert(prisma, mixte.id, societe.etablissementPrincipalId, 1);
    await fermerEmploi(clos.id, new Date('2024-12-31'));
    await creerEmploiOuvert(prisma, mixte.id, societe.etablissementPrincipalId, 2);

    const sansEmploi = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T9C`,
    });

    const tousClos = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T9D`,
    });
    const emploiClos = await creerEmploiOuvert(
      prisma,
      tousClos.id,
      societe.etablissementPrincipalId,
      1
    );
    await fermerEmploi(emploiClos.id, new Date('2022-03-01'));

    const ids = [ouvert.id, mixte.id, sansEmploi.id, tousClos.id];
    const fiches: { etat: string; dateSortie: string | null }[] = [];
    for (const id of ids) {
      const reponse = await fetch(urlLocale(app, `/salaries/${id}`), {
        headers: entetes(utilisateurId, societe.companyId),
      });
      expect(reponse.status).toBe(200);
      const corps = (await reponse.json()) as {
        donnees: { etat: string; dateSortie: string | null };
      };
      fiches.push(corps.donnees);
    }

    const actifs = fiches.filter((f) => f.etat === 'ACTIF');
    expect(actifs.length).toBeGreaterThan(0);
    for (const fiche of actifs) {
      expect(fiche.dateSortie).toBeNull();
    }
  });

  it('T10 — la lecture expose etat, moisEnCours, dateSortie, typePieceIdentite, nombrePersonnesACharge et le libelle accorde', async () => {
    const creation = await fetch(urlLocale(app, '/salaries'), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        nom: 'Chraibi',
        prenom: 'Amina',
        sexe: 'FEMME',
        dateNaissance: '1990-05-15',
        dateEntree: '2025-01-01',
        matricule: `${PREFIXE}-T10`,
        nationaliteId: paysMarocId,
        situationFamilialeCode: situationMarieCode,
      }),
    });
    expect(creation.status).toBe(201);
    const creee = (await creation.json()) as { donnees: { id: string } };

    const reponse = await fetch(urlLocale(app, `/salaries/${creee.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as {
      donnees: {
        etat: string;
        moisEnCours: string;
        dateSortie: string | null;
        typePieceIdentite: string | null;
        nombrePersonnesACharge: number;
        situationFamiliale: { libelle: string | null };
      };
    };
    expect(corps.donnees.etat).toBe('INACTIF');
    expect(corps.donnees.moisEnCours).toMatch(/^\d{4}-\d{2}$/);
    expect(corps.donnees.dateSortie).toBeNull();
    expect(corps.donnees.typePieceIdentite).toBe('CIN');
    expect(corps.donnees.nombrePersonnesACharge).toBe(0);
    expect(corps.donnees.situationFamiliale.libelle).toBe('Mariée');
  });

  it('T11 — sans salarie.remuneration.lire, la cle comptesBancaires est absente', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T11`,
    });
    await prisma.compteBancaireSalarie.create({
      data: { salarieId: salarie.id, rib: rib24('1100') },
    });

    const reponse = await fetch(urlLocale(app, `/salaries/${salarie.id}`), {
      headers: entetes(utilisateurId, societe.companyId, {
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      }),
    });
    expect(reponse.status).toBe(200);
    const corps = (await reponse.json()) as { donnees: Record<string, unknown> };
    expect('comptesBancaires' in corps.donnees).toBe(false);
  });
});
