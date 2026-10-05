import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { STATUT_TECHNIQUE_TAHFIZ, TYPES_CONTRAT } from '../prisma/reference-data-fiche-salarie.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { appelerApi } from './support/http-client.js';
import {
  assurerTypesContrat,
  creerEmploiAvecTypeContrat,
  creerEmploiInsertion,
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-tahfiz-cdi-${Date.now()}`;

const REFUS_IDMAJ = {
  code: 'STATUT_RESERVE_CONTRAT_INSERTION',
  message: 'Le statut IDMAJ ne peut être saisi que sur un emploi en contrat d’insertion.',
  champ: 'statutCode',
};

const REFUS_CHANGEMENT_INSERTION = {
  code: 'CHANGEMENT_TYPE_CONTRAT_INSERTION',
  message: 'Un contrat d’insertion ne peut pas changer de type : créez un nouvel emploi.',
  champ: 'typeContratCode',
};

function entetes(utilisateurId: string, companyId: string): Record<string, string> {
  return { 'x-paymarh-user-id': utilisateurId, 'x-paymarh-company-id': companyId };
}

function enJours(lignes: readonly { dateDebut: Date; dateFin: Date | null }[]) {
  return lignes.map((l) => ({
    dateDebut: l.dateDebut.toISOString().slice(0, 10),
    dateFin: l.dateFin?.toISOString().slice(0, 10) ?? null,
  }));
}

describe('TAHFIZ limite aux periodes CDI, IDMAJ reserve au contrat d insertion (ADR 0033)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let compteId: string;
  let formeId: string;
  let typeTahfizId: string;
  let compteurSociete = 0;

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    await prisma.statutParticulier.upsert({
      where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
      update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
      create: STATUT_TECHNIQUE_TAHFIZ,
    });
    await assurerTypesContrat(prisma);

    formeId = (await prisma.formeJuridique.findFirstOrThrow()).id;
    typeTahfizId = (await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } }))
      .id;
    const compte = await prisma.account.create({ data: { name: `${PREFIXE}-A`, type: 'CABINET' } });
    compteId = compte.id;
    const utilisateur = await prisma.user.create({
      data: { email: `${PREFIXE}@test.local`, role: 'ACCOUNT_ADMIN', accountId: compte.id },
    });
    utilisateurId = utilisateur.id;
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  async function nouvelleSociete(moisEnCours = '2025-07') {
    compteurSociete += 1;
    const societe = await creerSocieteTest(
      prisma,
      formeId,
      compteId,
      `${PREFIXE}-S${compteurSociete}`
    );
    if (moisEnCours !== '2025-07') {
      await prisma.company.update({ where: { id: societe.companyId }, data: { moisEnCours } });
    }
    return societe;
  }

  async function nouveauSalarie(companyId: string, suffixe: string) {
    return creerSalarieMin(prisma, companyId, { matricule: `${PREFIXE}-${suffixe}` });
  }

  async function activerTahfiz(companyId: string, debut: string, fin: string | null = null) {
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

  async function lignesTahfiz(filtre: { emploiId?: string; companyId?: string }) {
    return prisma.statutParticulierLigne.findMany({
      where: {
        statutCode: 'TAHFIZ',
        origine: 'PROPAGE_SOCIETE',
        ...(filtre.emploiId !== undefined ? { emploiId: filtre.emploiId } : {}),
        ...(filtre.companyId !== undefined
          ? { emploi: { salarie: { companyId: filtre.companyId } } }
          : {}),
      },
      orderBy: [{ emploiId: 'asc' }, { dateDebut: 'asc' }],
    });
  }

  async function creerEmploiViaApi(
    companyId: string,
    salarieId: string,
    etablissementId: string,
    contrat: Record<string, unknown>
  ) {
    const reponse = await fetch(urlLocale(app, `/salaries/${salarieId}/emplois`), {
      method: 'POST',
      headers: { ...entetes(utilisateurId, companyId), 'content-type': 'application/json' },
      body: JSON.stringify({
        contrat: { libellePoste: 'Comptable', ...contrat },
        remuneration: { modeDeterminationSalaire: 'BRUT_MENSUEL', montant: '12000.50' },
        affectation: { etablissementId, baseSaisieDuree: 'HEBDOMADAIRE' },
      }),
    });
    expect(reponse.status).toBe(201);
    const { donnees } = (await reponse.json()) as { donnees: { id: string; version: number } };
    return donnees;
  }

  async function patchContrat(
    companyId: string,
    emploiId: string,
    version: number,
    corps: Record<string, unknown>,
    confirmationJeton?: string
  ) {
    const query = confirmationJeton !== undefined ? `?confirmationJeton=${confirmationJeton}` : '';
    return fetch(urlLocale(app, `/emplois/${emploiId}/contrat${query}`), {
      method: 'PATCH',
      headers: {
        ...entetes(utilisateurId, companyId),
        'content-type': 'application/json',
        'if-match': String(version),
      },
      body: JSON.stringify(corps),
    });
  }

  async function patchContratOk(
    companyId: string,
    emploiId: string,
    version: number,
    corps: Record<string, unknown>
  ): Promise<number> {
    const reponse = await patchContrat(companyId, emploiId, version, corps);
    expect(reponse.status).toBe(200);
    const { donnees } = (await reponse.json()) as { donnees: { version: number } };
    return donnees.version;
  }

  it('T2 — activation sur une societe portant un emploi de chaque type : une seule ligne, sur le CDI', async () => {
    expect(TYPES_CONTRAT).toHaveLength(8);
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T2');
    const emploisParType = new Map<string, string>();
    let numeroOrdre = 0;
    for (const type of TYPES_CONTRAT) {
      numeroOrdre += 1;
      const emploi = await creerEmploiAvecTypeContrat(
        prisma,
        salarie.id,
        societe.etablissementPrincipalId,
        numeroOrdre,
        type.code
      );
      emploisParType.set(type.code, emploi.id);
    }

    await activerTahfiz(societe.companyId, '2025-07');

    const lignes = await lignesTahfiz({ companyId: societe.companyId });
    expect(lignes.map((l) => l.emploiId)).toEqual([emploisParType.get('CDI')]);
    expect(enJours(lignes)).toEqual([{ dateDebut: '2025-07-01', dateFin: null }]);
  });

  it('T3 — emploi CDI cree apres l activation : la ligne commence a la date de debut de l emploi', async () => {
    const societe = await nouvelleSociete();
    await activerTahfiz(societe.companyId, '2025-07');
    const salarie = await nouveauSalarie(societe.companyId, 'T3');

    const emploi = await creerEmploiViaApi(
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId,
      { dateDebut: '2025-09-15', typeContratCode: 'CDI' }
    );

    expect(enJours(await lignesTahfiz({ emploiId: emploi.id }))).toEqual([
      { dateDebut: '2025-09-15', dateFin: null },
    ]);
  });

  it('T4 — PATCH contrat d un CDI avec date de sortie : la ligne se termine a cette date', async () => {
    const societe = await nouvelleSociete();
    await activerTahfiz(societe.companyId, '2025-07');
    const salarie = await nouveauSalarie(societe.companyId, 'T4');
    const emploi = await creerEmploiViaApi(
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId,
      { dateDebut: '2025-01-01', typeContratCode: 'CDI' }
    );
    expect(enJours(await lignesTahfiz({ emploiId: emploi.id }))).toEqual([
      { dateDebut: '2025-07-01', dateFin: null },
    ]);

    const sansJeton = await patchContrat(societe.companyId, emploi.id, emploi.version, {
      dateSortie: '2026-03-31',
    });
    expect(sansJeton.status).toBe(409);
    const { jetonConfirmation } = (await sansJeton.json()) as { jetonConfirmation: string };
    const avecJeton = await patchContrat(
      societe.companyId,
      emploi.id,
      emploi.version,
      { dateSortie: '2026-03-31' },
      jetonConfirmation
    );
    expect(avecJeton.status).toBe(200);

    expect(enJours(await lignesTahfiz({ emploiId: emploi.id }))).toEqual([
      { dateDebut: '2025-07-01', dateFin: '2026-03-31' },
    ]);
  });

  it('T5 — PATCH contrat CDD vers CDI sous TAHFIZ : ligne creee ; puis CDI vers CDD : ligne retiree', async () => {
    const societe = await nouvelleSociete();
    await activerTahfiz(societe.companyId, '2025-07');
    const salarie = await nouveauSalarie(societe.companyId, 'T5');
    const emploi = await creerEmploiViaApi(
      societe.companyId,
      salarie.id,
      societe.etablissementPrincipalId,
      { dateDebut: '2025-01-01', typeContratCode: 'CDD' }
    );
    expect(await lignesTahfiz({ emploiId: emploi.id })).toHaveLength(0);

    const version = await patchContratOk(societe.companyId, emploi.id, emploi.version, {
      typeContratCode: 'CDI',
    });
    expect(enJours(await lignesTahfiz({ emploiId: emploi.id }))).toEqual([
      { dateDebut: '2025-07-01', dateFin: null },
    ]);

    await patchContratOk(societe.companyId, emploi.id, version, { typeContratCode: 'CDD' });
    expect(await lignesTahfiz({ emploiId: emploi.id })).toHaveLength(0);
  });

  it('T6 — emploi CDI termine pendant la periode TAHFIZ puis activation retroactive : ligne close a la sortie', async () => {
    const societe = await nouvelleSociete('2025-11');
    const salarie = await nouveauSalarie(societe.companyId, 'T6');
    const emploi = await creerEmploiAvecTypeContrat(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1,
      'CDI',
      { dateSortie: new Date('2025-09-30') }
    );

    await activerTahfiz(societe.companyId, '2025-07');

    expect(enJours(await lignesTahfiz({ emploiId: emploi.id }))).toEqual([
      { dateDebut: '2025-07-01', dateFin: '2025-09-30' },
    ]);
  });

  it('T7 — synchroniser deux fois : aucune ligne en double, dates inchangees', async () => {
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T7');
    const emploi = await creerEmploiOuvert(prisma, salarie.id, societe.etablissementPrincipalId, 1);
    await creerEmploiAvecTypeContrat(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      2,
      'CDI',
      { dateDebut: new Date('2025-09-15'), moisEffet: '2025-09' }
    );

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');
    const premiere = await lignesTahfiz({ companyId: societe.companyId });
    expect(premiere).toHaveLength(2);

    await activerTahfiz(societe.companyId, '2025-07', '2026-06');
    const seconde = await lignesTahfiz({ companyId: societe.companyId });
    expect(seconde).toEqual(premiere);

    await patchContratOk(societe.companyId, emploi.id, 0, { libellePoste: 'Comptable senior' });
    await patchContratOk(societe.companyId, emploi.id, 1, { libellePoste: 'Comptable senior' });
    const apresPatch = await lignesTahfiz({ companyId: societe.companyId });
    expect(apresPatch).toEqual(premiere);
  });

  it('T8a — POST IDMAJ refuse sur un emploi CDI, accepte sur un emploi INSERTION', async () => {
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T8a');
    const emploiCdi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const post = await fetch(urlLocale(app, `/emplois/${emploiCdi.id}/statuts-particuliers`), {
      method: 'POST',
      headers: {
        ...entetes(utilisateurId, societe.companyId),
        'content-type': 'application/json',
        'if-match': '0',
      },
      body: JSON.stringify({ statutCode: 'IDMAJ', dateDebut: '2025-01-01', dateFin: null }),
    });
    expect(post.status).toBe(400);
    expect(await post.json()).toEqual(REFUS_IDMAJ);
    expect(await prisma.statutParticulierLigne.count({ where: { emploiId: emploiCdi.id } })).toBe(
      0
    );

    const emploiInsertion = await creerEmploiInsertion(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      2
    );
    const accepte = await fetch(
      urlLocale(app, `/emplois/${emploiInsertion.id}/statuts-particuliers`),
      {
        method: 'POST',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ statutCode: 'IDMAJ', dateDebut: '2025-01-01', dateFin: null }),
      }
    );
    expect(accepte.status).toBe(201);
  });

  it('T8b — PATCH vers IDMAJ refuse sur un emploi CDI', async () => {
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T8b');
    const emploiCdi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const autreCode = await prisma.statutParticulierLigne.create({
      data: {
        emploiId: emploiCdi.id,
        statutCode: STATUT_TECHNIQUE_TAHFIZ.code,
        dateDebut: new Date('2025-01-01'),
        origine: 'SAISIE_MANUELLE',
      },
    });
    const patch = await fetch(
      urlLocale(app, `/emplois/${emploiCdi.id}/statuts-particuliers/${autreCode.id}`),
      {
        method: 'PATCH',
        headers: {
          ...entetes(utilisateurId, societe.companyId),
          'content-type': 'application/json',
          'if-match': '0',
        },
        body: JSON.stringify({ statutCode: 'IDMAJ' }),
      }
    );
    expect(patch.status).toBe(400);
    expect(await patch.json()).toEqual(REFUS_IDMAJ);
    const inchangee = await prisma.statutParticulierLigne.findUniqueOrThrow({
      where: { id: autreCode.id },
    });
    expect(inchangee.statutCode).toBe(STATUT_TECHNIQUE_TAHFIZ.code);
  });

  it('T9a — changement de type depuis INSERTION refuse', async () => {
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T9a');
    const emploiInsertion = await creerEmploiInsertion(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );

    const depuisInsertion = await patchContrat(societe.companyId, emploiInsertion.id, 0, {
      typeContratCode: 'CDI',
    });
    expect(depuisInsertion.status).toBe(400);
    expect(await depuisInsertion.json()).toEqual(REFUS_CHANGEMENT_INSERTION);

    const types = await prisma.emploiContratVersion.findMany({
      where: { emploiId: emploiInsertion.id },
      select: { typeContratCode: true },
    });
    expect(types).toEqual([{ typeContratCode: 'INSERTION' }]);
  });

  it('T9b — changement de type vers INSERTION refuse ; CDD vers CDI accepte', async () => {
    const societe = await nouvelleSociete();
    const salarie = await nouveauSalarie(societe.companyId, 'T9b');
    const emploiCdi = await creerEmploiOuvert(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      1
    );
    const emploiCdd = await creerEmploiAvecTypeContrat(
      prisma,
      salarie.id,
      societe.etablissementPrincipalId,
      2,
      'CDD'
    );

    const versInsertion = await patchContrat(societe.companyId, emploiCdi.id, 0, {
      typeContratCode: 'INSERTION',
    });
    expect(versInsertion.status).toBe(400);
    expect(await versInsertion.json()).toEqual(REFUS_CHANGEMENT_INSERTION);

    const types = await prisma.emploiContratVersion.findMany({
      where: { emploiId: emploiCdi.id },
      select: { typeContratCode: true },
    });
    expect(types).toEqual([{ typeContratCode: 'CDI' }]);

    await patchContratOk(societe.companyId, emploiCdd.id, 0, { typeContratCode: 'CDI' });
    const cddDevenuCdi = await prisma.emploiContratVersion.findMany({
      where: { emploiId: emploiCdd.id },
      select: { typeContratCode: true },
    });
    expect(cddDevenuCdi).toEqual([{ typeContratCode: 'CDI' }]);
  });
});
