import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import {
  BULLETIN_PORT,
  EtatBulletin,
  type BulletinPort,
} from '../src/modules/salaries/bulletin/bulletin.port.js';
import { SocleTestModule } from '../src/modules/salaries/test/socle-test.module.js';
import { STATUT_TECHNIQUE_TAHFIZ } from '../prisma/reference-data-fiche-salarie.js';
import { PropagationTahfizService } from '../src/modules/salaries/tahfiz/propagation-tahfiz.service.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { appelerApi } from './support/http-client.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-heritage-prop-${Date.now()}`;

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

async function creerEmploiViaApi(
  app: INestApplication,
  utilisateurId: string,
  companyId: string,
  salarieId: string,
  etablissementId: string,
  affectation: Record<string, unknown> = {}
) {
  const reponse = await fetch(urlLocale(app, `/salaries/${salarieId}/emplois`), {
    method: 'POST',
    headers: {
      ...entetes(utilisateurId, companyId),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      contrat: { libellePoste: 'Comptable', dateDebut: '2025-01-01', typeContratCode: 'CDI' },
      remuneration: { modeDeterminationSalaire: 'BRUT_MENSUEL', montant: '12000.50' },
      affectation: { etablissementId, baseSaisieDuree: 'HEBDOMADAIRE', ...affectation },
    }),
  });
  expect(reponse.status).toBe(201);
  return (await reponse.json()) as {
    donnees: { id: string; version: number };
    alertes: { code: string }[];
  };
}

describe('heritage, C24 et propagation TAHFIZ (2.1.b-5)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;
  let typeHeureId: string;
  let typeTahfizId: string;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    typeHeureId = (await prisma.typeHeure.findFirstOrThrow()).id;
    typeTahfizId = (await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } }))
      .id;

    const compte = await prisma.account.create({ data: { name: `${PREFIXE}-A`, type: 'CABINET' } });
    const utilisateur = await prisma.user.create({
      data: { email: `${PREFIXE}@test.local`, role: 'ACCOUNT_ADMIN', accountId: compte.id },
    });
    utilisateurId = utilisateur.id;
    societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
    await prisma.company.update({
      where: { id: societe.companyId },
      data: { moisEnCours: '2025-01' },
    });
    await prisma.etablissement.update({
      where: { id: societe.etablissementPrincipalId },
      data: { nom: 'Casablanca' },
    });
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  it('1 — champ vide au niveau emploi : valeur etablissement, origine et nom', async () => {
    const param = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${societe.etablissementPrincipalId}/parametrage`,
      utilisateurId,
      body: { dureeHebdomadaire: '44', jourReposHebdomadaire: 'SAMEDI' },
    });
    expect(param.status).toBe(200);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-H1`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId
    );

    const lecture = await fetch(urlLocale(app, `/emplois/${cree.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: {
        affectation: { dureeContractuelle: string | null };
        resolutions: {
          dureeContractuelle: { valeur: string; origine: string; libelleEntite: string | null };
        };
      };
    };

    expect(donnees.affectation.dureeContractuelle).toBeNull();
    expect(donnees.resolutions.dureeContractuelle).toEqual({
      valeur: '44',
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });
  });

  it('2 — champ rempli au niveau emploi : valeur propre et origine salarie', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-H2`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId,
      { dureeContractuelle: '39' }
    );

    const lecture = await fetch(urlLocale(app, `/emplois/${cree.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: {
        affectation: { dureeContractuelle: string | null };
        resolutions: { dureeContractuelle: { valeur: string; origine: string } };
      };
    };

    expect(donnees.affectation.dureeContractuelle).toBe('39');
    expect(donnees.resolutions.dureeContractuelle.origine).toBe('SALARIE');
    expect(donnees.resolutions.dureeContractuelle.valeur).toBe('39');
  });

  it('3 — champ vide a tous les niveaux : aucune valeur, aucun defaut', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-H3`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementSecondaireId
    );

    const lecture = await fetch(urlLocale(app, `/emplois/${cree.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: {
        affectation: { dureeContractuelle: string | null };
        resolutions: { dureeContractuelle: unknown; grilleHoraire: unknown };
      };
    };

    expect(donnees.affectation.dureeContractuelle).toBeNull();
    expect(donnees.resolutions.dureeContractuelle).toBeNull();
    expect(donnees.resolutions.grilleHoraire).toBeNull();
  });

  it('5 — jours feries : suivi etab puis grille propre vide sans heritage', async () => {
    const jf = await prisma.jourFerie.findFirstOrThrow();
    const param = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${societe.etablissementPrincipalId}/parametrage`,
      utilisateurId,
      body: {
        dureeHebdomadaire: '44',
        jourReposHebdomadaire: 'SAMEDI',
        joursFeriesTravaillesIds: [jf.id],
      },
    });
    expect(param.status).toBe(200);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-JF`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId
    );

    const suivi = await fetch(urlLocale(app, `/emplois/${cree.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const corpsSuivi = (await suivi.json()) as {
      donnees: {
        affectation: { suivreJoursFeriesEtablissement: boolean };
        resolutions: { joursFeriesTravailles: { origine: string; valeur: string[] } };
      };
    };
    expect(corpsSuivi.donnees.affectation.suivreJoursFeriesEtablissement).toBe(true);
    expect(corpsSuivi.donnees.resolutions.joursFeriesTravailles.origine).toBe('ETABLISSEMENT');
    expect(corpsSuivi.donnees.resolutions.joursFeriesTravailles.valeur).toEqual([jf.id]);

    const patch = await fetch(
      urlLocale(app, `/emplois/${cree.donnees.id}/affectation-temps-de-travail`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(cree.donnees.version),
        },
        body: JSON.stringify({ suivreJoursFeriesEtablissement: false }),
      }
    );
    expect(patch.status).toBe(200);
    const corpsPropre = (await patch.json()) as {
      donnees: {
        affectation: { suivreJoursFeriesEtablissement: boolean };
        resolutions: { joursFeriesTravailles: { origine: string; valeur: string[] } };
      };
    };
    expect(corpsPropre.donnees.affectation.suivreJoursFeriesEtablissement).toBe(false);
    expect(corpsPropre.donnees.resolutions.joursFeriesTravailles).toEqual({
      valeur: [],
      origine: 'SALARIE',
      libelleEntite: null,
    });
  });

  it('C24 — repos le dimanche alors que la grille etablissement y porte des heures : alerte, ecriture', async () => {
    const param = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${societe.etablissementPrincipalId}/parametrage`,
      utilisateurId,
      body: {
        dureeHebdomadaire: '48',
        jourReposHebdomadaire: 'SAMEDI',
        horaireDefautLignes: [
          { jourSemaine: 'LUNDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'MARDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'MERCREDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'JEUDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'VENDREDI', typeHeureId, nombreHeures: '8' },
          { jourSemaine: 'SAMEDI', typeHeureId, nombreHeures: '0' },
          { jourSemaine: 'DIMANCHE', typeHeureId, nombreHeures: '8' },
        ],
      },
    });
    expect(param.status).toBe(200);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-C24`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId
    );

    const patch = await fetch(
      urlLocale(app, `/emplois/${cree.donnees.id}/affectation-temps-de-travail`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(cree.donnees.version),
        },
        body: JSON.stringify({ reposHebdomadaire: 'DIMANCHE' }),
      }
    );
    expect(patch.status).toBe(200);
    const corps = (await patch.json()) as {
      donnees: { affectation: { reposHebdomadaire: string } };
      alertes: { code: string }[];
    };
    expect(corps.donnees.affectation.reposHebdomadaire).toBe('DIMANCHE');
    expect(corps.alertes.map((a) => a.code)).toContain('REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE');
  });

  it('7 — sans grille horaire resolue, C24 n est pas emise', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-C24-ABS`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementSecondaireId
    );

    const patch = await fetch(
      urlLocale(app, `/emplois/${cree.donnees.id}/affectation-temps-de-travail`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(cree.donnees.version),
        },
        body: JSON.stringify({ reposHebdomadaire: 'DIMANCHE' }),
      }
    );
    expect(patch.status).toBe(200);
    const corps = (await patch.json()) as { alertes: { code: string }[] };
    expect(corps.alertes.map((a) => a.code)).not.toContain('REPOS_HEBDOMADAIRE_JOUR_TRAVAILLE');
  });

  it('8 et 10 — TAHFIZ : ligne chez les emplois ouverts seulement', async () => {
    const ouvert = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T-OUV`,
    });
    const emploiOuvert = await creerEmploiOuvert(
      prisma,
      ouvert.id,
      societe.etablissementPrincipalId,
      1
    );

    const clos = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T-CLOS`,
    });
    const emploiClos = await creerEmploiOuvert(
      prisma,
      clos.id,
      societe.etablissementPrincipalId,
      1
    );
    await prisma.emploiContratVersion.updateMany({
      where: { emploiId: emploiClos.id },
      data: { dateSortie: new Date('2025-03-01') },
    });

    const activation = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: '2025-07',
        exonerationDateFin: '2026-06',
      },
    });
    expect(activation.status).toBe(200);

    const lignesOuvert = await prisma.statutParticulierLigne.findMany({
      where: { emploiId: emploiOuvert.id, origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' },
    });
    const lignesClos = await prisma.statutParticulierLigne.findMany({
      where: { emploiId: emploiClos.id, origine: 'PROPAGE_SOCIETE' },
    });
    expect(lignesOuvert).toHaveLength(1);
    expect(lignesClos).toHaveLength(0);
  });

  it('9 — un salarie cree apres activation recoit la ligne a la creation de l emploi', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-T-APRES`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId
    );

    const lignes = await prisma.statutParticulierLigne.findMany({
      where: { emploiId: cree.donnees.id, origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' },
    });
    expect(lignes).toHaveLength(1);
  });

  it('11 — une ligne propagee est en lecture seule depuis la fiche salarie', async () => {
    const ligne = await prisma.statutParticulierLigne.findFirstOrThrow({
      where: {
        origine: 'PROPAGE_SOCIETE',
        statutCode: 'TAHFIZ',
        emploi: { salarie: { companyId: societe.companyId, matricule: `${PREFIXE}-T-OUV` } },
      },
    });
    const emploi = await prisma.emploi.findUniqueOrThrow({ where: { id: ligne.emploiId } });

    const patch = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers/${ligne.id}`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': String(emploi.version),
        },
        body: JSON.stringify({ dateFin: '2026-12-31' }),
      }
    );
    expect(patch.status).toBe(409);

    const del = await fetch(
      urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers/${ligne.id}`),
      {
        method: 'DELETE',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'if-match': String(emploi.version),
        },
      }
    );
    expect(del.status).toBe(409);
  });

  it('12 — changer les dates societe met a jour les lignes propagees', async () => {
    const maj = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: '2025-08',
        exonerationDateFin: '2026-07',
      },
    });
    expect(maj.status).toBe(200);

    const ligne = await prisma.statutParticulierLigne.findFirstOrThrow({
      where: {
        origine: 'PROPAGE_SOCIETE',
        statutCode: 'TAHFIZ',
        emploi: { salarie: { companyId: societe.companyId, matricule: `${PREFIXE}-T-OUV` } },
      },
    });
    expect(ligne.dateDebut.toISOString().slice(0, 10)).toBe('2025-08-01');
    expect(ligne.dateFin?.toISOString().slice(0, 10)).toBe('2026-07-31');
  });

  it('13 — retirer TAHFIZ supprime les lignes jamais utilisees par un bulletin', async () => {
    const retrait = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: { moisClotureConges: 12, typeExonerationId: null },
    });
    expect(retrait.status).toBe(200);

    const restantes = await prisma.statutParticulierLigne.count({
      where: {
        origine: 'PROPAGE_SOCIETE',
        statutCode: 'TAHFIZ',
        emploi: { salarie: { companyId: societe.companyId } },
      },
    });
    expect(restantes).toBe(0);
  });

  it('15 — sans droit de lecture remuneration, le teletravail reste visible et la remuneration disparait', async () => {
    const param = await appelerApi(app, {
      method: 'PUT',
      chemin: `/etablissements/${societe.etablissementPrincipalId}/parametrage`,
      utilisateurId,
      body: {
        dureeHebdomadaire: '44',
        jourReposHebdomadaire: 'SAMEDI',
        indemniteTeletravailVersee: true,
        montantIndemniteTeletravail: '400.00',
      },
    });
    expect(param.status).toBe(200);

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-MASK`,
    });
    const cree = await creerEmploiViaApi(
      app,
      utilisateurId,
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId
    );

    const lecture = await fetch(urlLocale(app, `/emplois/${cree.donnees.id}`), {
      headers: entetes(utilisateurId, societe.companyId, {
        [HEADER_PERMISSIONS_REFUSEES]: 'salarie.remuneration.lire',
      }),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: {
        remuneration?: unknown;
        resolutions: Record<string, { valeur: unknown; origine: string } | undefined>;
      };
    };
    expect(donnees.resolutions.teletravailIndemniteVersee).toEqual({
      valeur: true,
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });
    expect(donnees.resolutions.teletravailMontant).toEqual({
      valeur: '400',
      origine: 'ETABLISSEMENT',
      libelleEntite: 'Casablanca',
    });
    expect(donnees.resolutions.dureeContractuelle).toBeDefined();
    expect('remuneration' in donnees).toBe(false);
  });

  it('ligne de statut dont la date de fin est depassee : etat INACTIVE', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-ETAT-INACT`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const creation = await fetch(urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        statutCode: 'IDMAJ',
        dateDebut: '2024-06-01',
        dateFin: '2024-12-31',
      }),
    });
    expect(creation.status).toBe(201);

    const lecture = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: { statutsParticuliers: { statutCode: string; etat: string }[] };
    };
    const ligne = donnees.statutsParticuliers.find((s) => s.statutCode === 'IDMAJ');
    expect(ligne?.etat).toBe('INACTIVE');
  });

  it('ligne de statut courante : etat ACTIVE', async () => {
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-ETAT-ACT`,
    });
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);

    const creation = await fetch(urlLocale(app, `/emplois/${emploi.id}/statuts-particuliers`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({
        statutCode: 'IDMAJ',
        dateDebut: '2025-01-01',
        dateFin: null,
      }),
    });
    expect(creation.status).toBe(201);

    const lecture = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: { statutsParticuliers: { statutCode: string; etat: string }[] };
    };
    const ligne = donnees.statutsParticuliers.find((s) => s.statutCode === 'IDMAJ');
    expect(ligne?.etat).toBe('ACTIVE');
  });
});

describe('TAHFIZ — inactivation d une ligne deja utilisee par un bulletin', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;
  let salarieIdUtilise: string;

  beforeAll(async () => {
    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-BULL`, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}-bull@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
    societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-BULL-SA`);
    await prisma.company.update({
      where: { id: societe.companyId },
      data: { moisEnCours: '2025-07' },
    });

    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-BULL-SAL`,
    });
    salarieIdUtilise = salarie.id;
    await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1,
      '2025-07',
      new Date('2025-07-01')
    );

    const port: BulletinPort = {
      listerBulletinsParSalarie: async (id) =>
        id === salarieIdUtilise ? [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] : [],
      listerBulletinsParEmploi: async () => [],
      listerBulletinsParSalaries: async (ids) => {
        const hors: Record<string, readonly { mois: string; etat: EtatBulletin }[]> = {};
        for (const id of ids) {
          hors[id] =
            id === salarieIdUtilise ? [{ mois: '2025-07', etat: EtatBulletin.CALCULE }] : [];
        }
        return hors;
      },
    };

    const compiled = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule],
    })
      .overrideProvider(BULLETIN_PORT)
      .useValue(port)
      .compile();
    app = compiled.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
    await nettoyerCompteTest(prisma, `${PREFIXE}-BULL`);
  });

  it('14 — retrait TAHFIZ : ligne utilisee par un bulletin devient inactive avec un mois de fin', async () => {
    const typeTahfizId = (
      await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } })
    ).id;

    const activation = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: '2025-07',
      },
    });
    expect(activation.status).toBe(200);

    const retrait = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: { moisClotureConges: 12, typeExonerationId: null },
    });
    expect(retrait.status).toBe(200);

    const ligne = await prisma.statutParticulierLigne.findFirst({
      where: {
        origine: 'PROPAGE_SOCIETE',
        statutCode: 'TAHFIZ',
        emploi: { salarieId: salarieIdUtilise },
      },
    });
    expect(ligne).not.toBeNull();
    expect(ligne?.dateFin?.toISOString().slice(0, 10)).toBe('2025-07-31');
  });

  it('ligne propagee inactivee au retrait : etat INACTIVE', async () => {
    const typeTahfizId = (
      await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } })
    ).id;

    const activation = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: '2025-07',
      },
    });
    expect(activation.status).toBe(200);

    const retrait = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: { moisClotureConges: 12, typeExonerationId: null },
    });
    expect(retrait.status).toBe(200);

    const emploi = await prisma.emploi.findFirstOrThrow({
      where: { salarieId: salarieIdUtilise },
    });
    const lecture = await fetch(urlLocale(app, `/emplois/${emploi.id}`), {
      headers: entetes(utilisateurId, societe.companyId),
    });
    const { donnees } = (await lecture.json()) as {
      donnees: { statutsParticuliers: { statutCode: string; etat: string }[] };
    };
    const ligne = donnees.statutsParticuliers.find((s) => s.statutCode === 'TAHFIZ');
    expect(ligne?.etat).toBe('INACTIVE');
  });
});

describe('TAHFIZ — retrecissement des dates et lecture par lot', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let typeTahfizId: string;
  let formeId: string;
  let compteId: string;
  const bulletinsParSalarie = new Map<string, readonly { mois: string; etat: EtatBulletin }[]>();
  let appelsLot = 0;

  beforeAll(async () => {
    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });

    formeId = (await prisma.formeJuridique.findFirstOrThrow()).id;
    typeTahfizId = (await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } }))
      .id;
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-DATES`, type: 'CABINET' },
    });
    compteId = compte.id;
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}-dates@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;

    const port: BulletinPort = {
      listerBulletinsParSalarie: async (id) => bulletinsParSalarie.get(id) ?? [],
      listerBulletinsParEmploi: async () => [],
      listerBulletinsParSalaries: async (ids) => {
        appelsLot += 1;
        const hors: Record<string, readonly { mois: string; etat: EtatBulletin }[]> = {};
        for (const id of ids) {
          hors[id] = bulletinsParSalarie.get(id) ?? [];
        }
        return hors;
      },
    };

    const compiled = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule],
    })
      .overrideProvider(BULLETIN_PORT)
      .useValue(port)
      .compile();
    app = compiled.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
    await nettoyerCompteTest(prisma, `${PREFIXE}-DATES`);
  });

  async function societeAvecEmploiOuvert(suffixe: string) {
    const societe = await creerSocieteTest(
      prisma,
      formeId,
      compteId,
      `${PREFIXE}-DATES-${suffixe}`
    );
    await prisma.company.update({
      where: { id: societe.companyId },
      data: { moisEnCours: '2025-07' },
    });
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-DATES-${suffixe}`,
    });
    const emploi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1,
      '2025-07',
      new Date('2025-07-01')
    );
    return { societe, salarie, emploi };
  }

  async function activerTahfiz(
    companyId: string,
    debut: string,
    fin: string | null
  ): Promise<void> {
    const reponse = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: debut,
        exonerationDateFin: fin,
      },
    });
    expect(reponse.status).toBe(200);
  }

  it('debut recule avec bulletin sur le mois retire : la ligne conserve son debut', async () => {
    const { societe, salarie, emploi } = await societeAvecEmploiOuvert('debut');
    bulletinsParSalarie.set(salarie.id, [{ mois: '2025-07', etat: EtatBulletin.CALCULE }]);

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');
    await activerTahfiz(societe.companyId, '2025-08', '2026-06');

    const ligne = await prisma.statutParticulierLigne.findFirstOrThrow({
      where: { emploiId: emploi.id, origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' },
    });
    expect(ligne.dateDebut.toISOString().slice(0, 10)).toBe('2025-07-01');
    expect(ligne.dateFin?.toISOString().slice(0, 10)).toBe('2026-06-30');

    const parametrage = await prisma.companyParametrageHistorique.findFirstOrThrow({
      where: { companyId: societe.companyId, moisEffet: '2025-07' },
    });
    expect(parametrage.exonerationDateDebut).toBe('2025-08');
  });

  it('fin avancee avec bulletin sur le mois retire : la ligne conserve sa fin', async () => {
    const { societe, salarie, emploi } = await societeAvecEmploiOuvert('fin');
    bulletinsParSalarie.set(salarie.id, [{ mois: '2026-06', etat: EtatBulletin.CALCULE }]);

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');
    await activerTahfiz(societe.companyId, '2025-07', '2026-05');

    const ligne = await prisma.statutParticulierLigne.findFirstOrThrow({
      where: { emploiId: emploi.id, origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' },
    });
    expect(ligne.dateDebut.toISOString().slice(0, 10)).toBe('2025-07-01');
    expect(ligne.dateFin?.toISOString().slice(0, 10)).toBe('2026-06-30');

    const parametrage = await prisma.companyParametrageHistorique.findFirstOrThrow({
      where: { companyId: societe.companyId, moisEffet: '2025-07' },
    });
    expect(parametrage.exonerationDateFin).toBe('2026-05');
  });

  it('meme retrecissement sans bulletin : les nouvelles dates s appliquent', async () => {
    const { societe, emploi } = await societeAvecEmploiOuvert('sans');

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');
    await activerTahfiz(societe.companyId, '2025-08', '2026-05');

    const ligne = await prisma.statutParticulierLigne.findFirstOrThrow({
      where: { emploiId: emploi.id, origine: 'PROPAGE_SOCIETE', statutCode: 'TAHFIZ' },
    });
    expect(ligne.dateDebut.toISOString().slice(0, 10)).toBe('2025-08-01');
    expect(ligne.dateFin?.toISOString().slice(0, 10)).toBe('2026-05-31');
  });

  it('retrait TAHFIZ sur plusieurs dizaines de salaries : un seul appel au BulletinPort', async () => {
    const societe = await creerSocieteTest(prisma, formeId, compteId, `${PREFIXE}-DATES-LOT`);
    await prisma.company.update({
      where: { id: societe.companyId },
      data: { moisEnCours: '2025-07' },
    });

    for (let i = 0; i < 30; i += 1) {
      const salarie = await creerSalarieMin(prisma, societe.companyId, {
        matricule: `${PREFIXE}-LOT-${String(i).padStart(2, '0')}`,
      });
      await creerEmploiOuvert(
        prisma,
        salarie.id,
        societe.etablissementPrincipalId,
        1,
        '2025-07',
        new Date('2025-07-01')
      );
    }

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');

    appelsLot = 0;
    const retrait = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: { moisClotureConges: 12, typeExonerationId: null },
    });
    expect(retrait.status).toBe(200);
    expect(appelsLot).toBe(1);
  });
});

describe('TAHFIZ — transaction unique avec le parametrage societe', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let typeTahfizId: string;
  let societe: Awaited<ReturnType<typeof creerSocieteTest>>;

  beforeAll(async () => {
    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    typeTahfizId = (await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } }))
      .id;
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-TX`, type: 'CABINET' },
    });
    const utilisateur = await prisma.user.create({
      data: {
        email: `${PREFIXE}-tx@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compte.id,
      },
    });
    utilisateurId = utilisateur.id;
    societe = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-TX-SA`);
    await prisma.company.update({
      where: { id: societe.companyId },
      data: { moisEnCours: '2025-07' },
    });
    const salarie = await creerSalarieMin(prisma, societe.companyId, {
      matricule: `${PREFIXE}-TX-SAL`,
    });
    await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1,
      '2025-07',
      new Date('2025-07-01')
    );

    const portVide: BulletinPort = {
      listerBulletinsParSalarie: async () => [],
      listerBulletinsParEmploi: async () => [],
      listerBulletinsParSalaries: async () => ({}),
    };
    const inner = new PropagationTahfizService(portVide);

    const compiled = await Test.createTestingModule({
      imports: [AppModule, SocleTestModule],
    })
      .overrideProvider(PropagationTahfizService)
      .useValue({
        synchroniserDansTransaction: async (
          tx: Parameters<PropagationTahfizService['synchroniserDansTransaction']>[0],
          companyId: string,
          saisie: Parameters<PropagationTahfizService['synchroniserDansTransaction']>[2],
          moisEnCoursSociete: string
        ) => {
          await inner.synchroniserDansTransaction(tx, companyId, saisie, moisEnCoursSociete);
          throw new Error('echec volontaire milieu de propagation');
        },
        poserSurNouvelEmploi: inner.poserSurNouvelEmploi.bind(inner),
      })
      .compile();
    app = compiled.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.init();
    await app.listen(0);
  });

  afterAll(async () => {
    await app?.close();
    await nettoyerCompteTest(prisma, `${PREFIXE}-TX`);
  });

  it('echec au milieu de la propagation : aucune ligne ni parametrage', async () => {
    const reponse = await appelerApi(app, {
      method: 'PUT',
      chemin: `/societes/${societe.companyId}/parametrage`,
      utilisateurId,
      body: {
        moisClotureConges: 12,
        typeExonerationId: typeTahfizId,
        exonerationDateDebut: '2025-07',
        exonerationDateFin: '2026-06',
      },
    });
    expect(reponse.status).toBe(500);

    const lignes = await prisma.statutParticulierLigne.count({
      where: {
        origine: 'PROPAGE_SOCIETE',
        statutCode: 'TAHFIZ',
        emploi: { salarie: { companyId: societe.companyId } },
      },
    });
    expect(lignes).toBe(0);

    const parametrage = await prisma.companyParametrageHistorique.findMany({
      where: { companyId: societe.companyId },
    });
    expect(parametrage).toHaveLength(0);
  });
});
