import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  creerEmploiNumeroOrdreAuto,
  creerSalarieMatriculeAuto,
  incrementerCompteurMatricule,
  initialiserCompteurMatriculeDepuisExistants,
  marquerMatriculeConsomme,
} from '../src/modules/salaries/compteurs-salarie.js';
import { calculerProchainMatricule } from '../src/modules/salaries/prochain-matricule.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-2-1-a-bis-${Date.now()}`;

function donneesSalarieBase(companyId: string) {
  return {
    companyId,
    nom: 'Alami',
    prenom: 'Said',
    sexe: 'HOMME' as const,
    dateNaissance: new Date('1990-05-15'),
    dateEntree: new Date('2025-01-01'),
    dateAnciennete: new Date('2025-01-01'),
  };
}

describe('compteurs fiche salarie (base reelle)', () => {
  let formeJuridiqueId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;

  beforeAll(async () => {
    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeJuridiqueId = forme.id;

    const compteA = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const compteB = await prisma.account.create({
      data: { name: `${PREFIXE}-B`, type: 'CABINET' },
    });

    societeA = await creerSocieteTest(prisma, formeJuridiqueId, compteA.id, `${PREFIXE}-SA`, 'EMP');
    societeB = await creerSocieteTest(prisma, formeJuridiqueId, compteB.id, `${PREFIXE}-SB`, 'EMP');
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
  });

  it('le compteur de matricule n est pas decremente a la suppression d un salarie', async () => {
    const salarie = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'EMP', longueur: 5 },
      donneesSalarieBase(societeA.companyId)
    );
    const compteurAvant = await prisma.compteurMatricule.findUniqueOrThrow({
      where: { companyId_prefixe: { companyId: societeA.companyId, prefixe: 'EMP' } },
    });
    await prisma.salarie.delete({ where: { id: salarie.id } });
    const compteurApres = await prisma.compteurMatricule.findUniqueOrThrow({
      where: { companyId_prefixe: { companyId: societeA.companyId, prefixe: 'EMP' } },
    });
    expect(compteurApres.dernierNumero).toBe(compteurAvant.dernierNumero);
  });

  it('un matricule consomme puis supprime n est jamais reattribue', async () => {
    const premier = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'EMP', longueur: 5 },
      donneesSalarieBase(societeA.companyId)
    );
    const matriculeConsomme = premier.matricule;
    await prisma.salarie.delete({ where: { id: premier.id } });

    const second = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'EMP', longueur: 5 },
      donneesSalarieBase(societeA.companyId)
    );
    expect(second.matricule).not.toBe(matriculeConsomme);
  });

  it('apres suppression le salarie suivant recoit la valeur suivante jamais la sienne', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-SEQ`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-SEQ`,
      'SEQ'
    );

    const premier = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'SEQ', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );
    expect(premier.matricule).toBe('SEQ00001');
    await prisma.salarie.delete({ where: { id: premier.id } });

    const second = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'SEQ', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );
    expect(second.matricule).toBe('SEQ00002');

    await nettoyerCompteTest(prisma, `${PREFIXE}-SEQ`);
  });

  it('le compteur est propre a chaque societe', async () => {
    await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'EMP', longueur: 5 },
      donneesSalarieBase(societeA.companyId)
    );
    await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'EMP', longueur: 5 },
      donneesSalarieBase(societeB.companyId)
    );

    const compteurA = await prisma.compteurMatricule.findUniqueOrThrow({
      where: { companyId_prefixe: { companyId: societeA.companyId, prefixe: 'EMP' } },
    });
    const compteurB = await prisma.compteurMatricule.findUniqueOrThrow({
      where: { companyId_prefixe: { companyId: societeB.companyId, prefixe: 'EMP' } },
    });

    expect(compteurA.companyId).not.toBe(compteurB.companyId);
    expect(compteurB.dernierNumero).toBe(1);
  });

  it('un changement de prefixe cree un compteur distinct qui repart de 1', async () => {
    await prisma.company.update({
      where: { id: societeA.companyId },
      data: { matriculePrefixe: 'NEW' },
    });

    const salarie = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'NEW', longueur: 5 },
      donneesSalarieBase(societeA.companyId)
    );

    const compteurNew = await prisma.compteurMatricule.findUniqueOrThrow({
      where: { companyId_prefixe: { companyId: societeA.companyId, prefixe: 'NEW' } },
    });
    expect(compteurNew.dernierNumero).toBe(1);
    expect(salarie.matricule).toBe('NEW00001');
  });

  it('le compteur peut etre initialise depuis les matricules existants', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-INIT`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-INIT`,
      'REP'
    );

    await creerSalarieMin(prisma, societe.companyId, { matricule: 'REP00007' });
    await creerSalarieMin(prisma, societe.companyId, { matricule: 'REP00012' });

    const initialise = await initialiserCompteurMatriculeDepuisExistants(
      prisma,
      societe.companyId,
      {
        prefixe: 'REP',
        longueur: 5,
      }
    );
    expect(initialise).toBe(12);

    const suivant = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'REP', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );
    expect(suivant.matricule).toBe('REP00013');

    await nettoyerCompteTest(prisma, `${PREFIXE}-INIT`);
  });

  it('le compteur s initialise depuis les valeurs consommees y compris apres suppression', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-INIT-CONS`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-INIT-CONS`,
      'RCS'
    );

    const premier = await creerSalarieMin(prisma, societe.companyId, { matricule: 'RCS00009' });
    await prisma.salarie.delete({ where: { id: premier.id } });

    const initialise = await initialiserCompteurMatriculeDepuisExistants(
      prisma,
      societe.companyId,
      {
        prefixe: 'RCS',
        longueur: 5,
      }
    );
    expect(initialise).toBe(9);

    const suivant = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'RCS', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );
    expect(suivant.matricule).toBe('RCS00010');

    await nettoyerCompteTest(prisma, `${PREFIXE}-INIT-CONS`);
  });

  it('la creation auto traverse calculerProchainMatricule alimente par les valeurs consommees', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-FN-ATTEINTE`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-FN-ATTEINTE`,
      'ZUM'
    );

    await prisma.matriculeConsomme.create({
      data: { companyId: societe.companyId, valeur: 'ZUM00007' },
    });

    const attendu = calculerProchainMatricule({ prefixe: 'ZUM', longueur: 5 }, ['ZUM00007']);
    expect(attendu).toBe('ZUM00008');
    expect(calculerProchainMatricule({ prefixe: 'ZUM', longueur: 5 }, [])).toBe('ZUM00001');

    const salarie = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'ZUM', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );
    expect(salarie.matricule).toBe(attendu);

    await nettoyerCompteTest(prisma, `${PREFIXE}-FN-ATTEINTE`);
  });

  it('le compteur de numero d ordre n est pas decremente a la suppression d un emploi', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ORD-1`,
    });
    const emploi = await creerEmploiNumeroOrdreAuto(prisma, salarie.id);
    const compteurAvant = await prisma.compteurNumeroOrdreEmploi.findUniqueOrThrow({
      where: { salarieId: salarie.id },
    });

    await prisma.emploi.delete({ where: { id: emploi.id } });

    const compteurApres = await prisma.compteurNumeroOrdreEmploi.findUniqueOrThrow({
      where: { salarieId: salarie.id },
    });
    expect(compteurApres.dernierNumero).toBe(compteurAvant.dernierNumero);
  });

  it('un numero d ordre consomme puis supprime n est jamais reattribue', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ORD-2`,
    });
    const emploi1 = await creerEmploiNumeroOrdreAuto(prisma, salarie.id);
    expect(emploi1.numeroOrdre).toBe(1);
    await prisma.emploi.delete({ where: { id: emploi1.id } });

    const emploi2 = await creerEmploiNumeroOrdreAuto(prisma, salarie.id);
    expect(emploi2.numeroOrdre).toBe(2);
  });

  it('la creation d un salarie et l increment du compteur sont dans la meme transaction', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-TX`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-TX`,
      'TX'
    );

    const compteurInitial = await prisma.compteurMatricule.findUnique({
      where: { companyId_prefixe: { companyId: societe.companyId, prefixe: 'TX' } },
    });
    expect(compteurInitial).toBeNull();

    await expect(
      prisma.$transaction(async (tx) => {
        await incrementerCompteurMatricule(tx, societe.companyId, 'TX', 3);
        throw new Error('annulation volontaire');
      })
    ).rejects.toThrow('annulation volontaire');

    const compteurApresEchec = await prisma.compteurMatricule.findUnique({
      where: { companyId_prefixe: { companyId: societe.companyId, prefixe: 'TX' } },
    });
    expect(compteurApresEchec).toBeNull();

    const consommeApresEchec = await prisma.matriculeConsomme.count({
      where: { companyId: societe.companyId },
    });
    expect(consommeApresEchec).toBe(0);

    await expect(
      prisma.$transaction(async (tx) => {
        const { matricule } = await incrementerCompteurMatricule(tx, societe.companyId, 'TX', 3);
        await marquerMatriculeConsomme(tx, societe.companyId, matricule);
        throw new Error('annulation apres marquage');
      })
    ).rejects.toThrow('annulation apres marquage');

    expect(await prisma.matriculeConsomme.count({ where: { companyId: societe.companyId } })).toBe(
      0
    );
    expect(
      await prisma.compteurMatricule.findUnique({
        where: { companyId_prefixe: { companyId: societe.companyId, prefixe: 'TX' } },
      })
    ).toBeNull();

    const salarie = await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'TX', longueur: 3 },
      donneesSalarieBase(societe.companyId)
    );
    expect(salarie.matricule).toBe('TX001');

    const consomme = await prisma.matriculeConsomme.findUnique({
      where: { companyId_valeur: { companyId: societe.companyId, valeur: 'TX001' } },
    });
    expect(consomme).not.toBeNull();

    await nettoyerCompteTest(prisma, `${PREFIXE}-TX`);
  });

  it('un etablissement rattache a une version d affectation ne peut pas etre supprime', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-RESTRICT-ETB`,
    });
    await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementPrincipalId, 1);

    await expect(
      prisma.etablissement.delete({ where: { id: societeA.etablissementPrincipalId } })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('deux creations simultanees obtiennent deux matricules differents', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-CONC-MAT`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-CONC-MAT`,
      'CON'
    );

    await creerSalarieMatriculeAuto(
      prisma,
      { prefixe: 'CON', longueur: 5 },
      donneesSalarieBase(societe.companyId)
    );

    const [salarieA, salarieB] = await Promise.all([
      creerSalarieMatriculeAuto(
        prisma,
        { prefixe: 'CON', longueur: 5 },
        { ...donneesSalarieBase(societe.companyId), prenom: 'Karim' }
      ),
      creerSalarieMatriculeAuto(
        prisma,
        { prefixe: 'CON', longueur: 5 },
        { ...donneesSalarieBase(societe.companyId), prenom: 'Leila' }
      ),
    ]);

    expect(salarieA.matricule).not.toBe(salarieB.matricule);

    await nettoyerCompteTest(prisma, `${PREFIXE}-CONC-MAT`);
  });

  it('deux creations simultanees sur une societe neuve obtiennent deux matricules differents', async () => {
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-CONC-NEUVE`, type: 'CABINET' },
    });
    const societe = await creerSocieteTest(
      prisma,
      formeJuridiqueId,
      compte.id,
      `${PREFIXE}-CONC-NEUVE`,
      'NEU'
    );

    const compteurAvant = await prisma.compteurMatricule.findUnique({
      where: { companyId_prefixe: { companyId: societe.companyId, prefixe: 'NEU' } },
    });
    expect(compteurAvant).toBeNull();

    const [salarieA, salarieB] = await Promise.all([
      creerSalarieMatriculeAuto(
        prisma,
        { prefixe: 'NEU', longueur: 5 },
        donneesSalarieBase(societe.companyId)
      ),
      creerSalarieMatriculeAuto(
        prisma,
        { prefixe: 'NEU', longueur: 5 },
        { ...donneesSalarieBase(societe.companyId), prenom: 'Nadia' }
      ),
    ]);

    expect(salarieA.matricule).not.toBe(salarieB.matricule);

    await nettoyerCompteTest(prisma, `${PREFIXE}-CONC-NEUVE`);
  });

  it('deux creations simultanees d emplois obtiennent deux numeros d ordre differents', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-CONC-ORD`,
    });

    const [emploiA, emploiB] = await Promise.all([
      creerEmploiNumeroOrdreAuto(prisma, salarie.id),
      creerEmploiNumeroOrdreAuto(prisma, salarie.id),
    ]);

    expect(emploiA.numeroOrdre).not.toBe(emploiB.numeroOrdre);
  });
});
