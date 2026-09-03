import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  creerEmploiOuvert,
  creerSalarieMin,
  creerSocieteTest,
} from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-2-1-a-${Date.now()}`;

describe('fiche salarie — contraintes et structure (base reelle)', () => {
  let formeJuridiqueId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;

  beforeAll(async () => {
    const forme = await prisma.formeJuridique.findFirst();
    if (!forme) {
      throw new Error('Lancez pnpm db:migrate puis pnpm db:seed avant les tests.');
    }
    formeJuridiqueId = forme.id;

    const compteA = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const compteB = await prisma.account.create({
      data: { name: `${PREFIXE}-B`, type: 'CABINET' },
    });

    societeA = await creerSocieteTest(prisma, formeJuridiqueId, compteA.id, `${PREFIXE}-SA`);
    societeB = await creerSocieteTest(prisma, formeJuridiqueId, compteB.id, `${PREFIXE}-SB`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
  });

  it('deux salaries de societes differentes peuvent partager le meme matricule', async () => {
    const matricule = `${PREFIXE}-MAT-PARTAGE`;
    const a = await creerSalarieMin(prisma, societeA.companyId, { matricule });
    const b = await creerSalarieMin(prisma, societeB.companyId, { matricule });
    expect(a.matricule).toBe(b.matricule);
    expect(a.companyId).not.toBe(b.companyId);
  });

  it('deux salaries de societes differentes peuvent partager le meme numero de piece', async () => {
    const numeroPiece = `${PREFIXE}PIECE01`;
    const a = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-P1`,
      numeroPiece,
    });
    const b = await creerSalarieMin(prisma, societeB.companyId, {
      matricule: `${PREFIXE}-P2`,
      numeroPiece,
    });
    expect(a.numeroPiece).toBe(b.numeroPiece);
  });

  it('deux salaries de societes differentes peuvent partager le meme numero CNSS', async () => {
    const numeroCnss = `${PREFIXE}CNSS001`;
    const a = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-C1`,
      numeroCnss,
    });
    const b = await creerSalarieMin(prisma, societeB.companyId, {
      matricule: `${PREFIXE}-C2`,
      numeroCnss,
    });
    expect(a.numeroCnss).toBe(b.numeroCnss);
  });

  it('un salarie n est jamais accessible depuis une autre societe', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-ISO`,
    });
    const introuvable = await prisma.salarie.findFirst({
      where: { id: salarie.id, companyId: societeB.companyId },
    });
    expect(introuvable).toBeNull();
  });

  it('matricule en doublon dans la meme societe est rejete', async () => {
    const matricule = `${PREFIXE}-DUP-MAT`;
    await creerSalarieMin(prisma, societeA.companyId, { matricule });
    await expect(creerSalarieMin(prisma, societeA.companyId, { matricule })).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('numero de piece en doublon dans la meme societe est rejete', async () => {
    const numeroPiece = `${PREFIXE}DUP-PIECE`;
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DP1`,
      numeroPiece,
    });
    await expect(
      creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-DP2`,
        numeroPiece,
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('numero CNSS en doublon dans la meme societe est rejete', async () => {
    const numeroCnss = `${PREFIXE}DUP-CNSS`;
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DC1`,
      numeroCnss,
    });
    await expect(
      creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-DC2`,
        numeroCnss,
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('plusieurs salaries d une meme societe peuvent avoir un numero de piece nul', async () => {
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-NP1`,
      numeroPiece: null,
    });
    await expect(
      creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-NP2`,
        numeroPiece: null,
      })
    ).resolves.toBeDefined();
  });

  it('plusieurs salaries d une meme societe peuvent avoir un numero CNSS nul', async () => {
    await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-NC1`,
      numeroCnss: null,
    });
    await expect(
      creerSalarieMin(prisma, societeA.companyId, {
        matricule: `${PREFIXE}-NC2`,
        numeroCnss: null,
      })
    ).resolves.toBeDefined();
  });

  it('les zeros de tete d un matricule survivent a un aller-retour en base', async () => {
    const matricule = 'EMP00007';
    const cree = await creerSalarieMin(prisma, societeA.companyId, { matricule });
    const relu = await prisma.salarie.findUniqueOrThrow({ where: { id: cree.id } });
    expect(relu.matricule).toBe('EMP00007');
  });

  it('un salarie peut etre cree sans aucun emploi', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-SANS-EMPLOI`,
    });
    const emplois = await prisma.emploi.count({ where: { salarieId: salarie.id } });
    expect(emplois).toBe(0);
  });

  it('un salarie peut porter deux emplois aux periodes qui se chevauchent', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DOUBLE`,
    });
    await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementPrincipalId, 1, '2025-01');
    await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementSecondaireId, 2, '2025-01');
    const count = await prisma.emploi.count({ where: { salarieId: salarie.id } });
    expect(count).toBe(2);
  });

  it('deux emplois d un meme salarie peuvent viser deux etablissements differents', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-2ETB`,
    });
    const e1 = await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementPrincipalId, 1);
    const e2 = await creerEmploiOuvert(prisma, salarie.id, societeA.etablissementSecondaireId, 2);
    const [a1, a2] = await Promise.all([
      prisma.emploiAffectationVersion.findFirstOrThrow({ where: { emploiId: e1.id } }),
      prisma.emploiAffectationVersion.findFirstOrThrow({ where: { emploiId: e2.id } }),
    ]);
    expect(a1.etablissementId).not.toBe(a2.etablissementId);
  });

  it('deux versions du bloc contrat ne peuvent pas partager le meme mois d effet', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-H-CONTRAT`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiContratVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        libellePoste: 'A',
        dateDebut: new Date('2025-01-01'),
        typeContratCode: 'CDI',
      },
    });
    await expect(
      prisma.emploiContratVersion.create({
        data: {
          emploiId: emploi.id,
          moisEffet: '2025-01',
          libellePoste: 'B',
          dateDebut: new Date('2025-01-01'),
          typeContratCode: 'CDI',
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('deux versions du bloc remuneration ne peuvent pas partager le meme mois d effet', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-H-REM`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiRemunerationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        modeDeterminationSalaire: 'BRUT_MENSUEL',
        montant: new Decimal('10000'),
      },
    });
    await expect(
      prisma.emploiRemunerationVersion.create({
        data: {
          emploiId: emploi.id,
          moisEffet: '2025-01',
          modeDeterminationSalaire: 'BRUT_HORAIRE',
          montant: new Decimal('50'),
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('deux versions du bloc affectation ne peuvent pas partager le meme mois d effet', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-H-AFF`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiAffectationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        etablissementId: societeA.etablissementPrincipalId,
        baseSaisieDuree: 'HEBDOMADAIRE',
      },
    });
    await expect(
      prisma.emploiAffectationVersion.create({
        data: {
          emploiId: emploi.id,
          moisEffet: '2025-01',
          etablissementId: societeA.etablissementSecondaireId,
          baseSaisieDuree: 'MENSUELLE',
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('un montant conserve ses decimales apres un aller-retour en base', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DEC-MNT`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiRemunerationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        modeDeterminationSalaire: 'BRUT_MENSUEL',
        montant: new Decimal('12345.67'),
      },
    });
    const relu = await prisma.emploiRemunerationVersion.findFirstOrThrow({
      where: { emploiId: emploi.id },
    });
    expect(relu.montant.toString()).toBe('12345.67');
  });

  it('une duree en heures conserve ses decimales apres un aller-retour en base', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-DEC-DUR`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiAffectationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        etablissementId: societeA.etablissementPrincipalId,
        baseSaisieDuree: 'HEBDOMADAIRE',
        dureeContractuelle: new Decimal('39.50'),
      },
    });
    const relu = await prisma.emploiAffectationVersion.findFirstOrThrow({
      where: { emploiId: emploi.id },
    });
    expect(relu.dureeContractuelle?.toString()).toBe('39.5');
  });

  it('un mois d effet est stocke au format AAAA-MM', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-MOIS`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await prisma.emploiContratVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-03',
        libellePoste: 'X',
        dateDebut: new Date('2025-01-01'),
        typeContratCode: 'CDI',
      },
    });
    const relu = await prisma.emploiContratVersion.findFirstOrThrow({
      where: { emploiId: emploi.id },
    });
    expect(relu.moisEffet).toMatch(/^\d{4}-\d{2}$/);
    expect(relu.moisEffet).toBe('2025-03');
  });

  it('les zeros de tete d un RIB survivent a un aller-retour en base', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-RIB`,
    });
    const compte = await prisma.compteBancaireSalarie.create({
      data: {
        salarieId: salarie.id,
        rib: '007780000123456789012345',
      },
    });
    const relu = await prisma.compteBancaireSalarie.findUniqueOrThrow({ where: { id: compte.id } });
    expect(relu.rib).toBe('007780000123456789012345');
  });

  it('les zeros de tete d un code postal survivent a un aller-retour en base', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-CP`,
      codePostal: '01234',
    });
    const relu = await prisma.salarie.findUniqueOrThrow({ where: { id: salarie.id } });
    expect(relu.codePostal).toBe('01234');
  });

  it('un champ heritable accepte la valeur nulle', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-HER-1`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    const affectation = await prisma.emploiAffectationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        etablissementId: societeA.etablissementPrincipalId,
        baseSaisieDuree: 'HEBDOMADAIRE',
        teletravailAutorise: null,
      },
    });
    expect(affectation.teletravailAutorise).toBeNull();
  });

  it('la duree contractuelle nulle est acceptee et signifie l heritage', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-HER-2`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    const affectation = await prisma.emploiAffectationVersion.create({
      data: {
        emploiId: emploi.id,
        moisEffet: '2025-01',
        etablissementId: societeA.etablissementPrincipalId,
        baseSaisieDuree: 'HEBDOMADAIRE',
        dureeContractuelle: null,
      },
    });
    expect(affectation.dureeContractuelle).toBeNull();
  });

  it('le booleen suivreJoursFeriesEtablissement n accepte pas la valeur nulle', async () => {
    const salarie = await creerSalarieMin(prisma, societeA.companyId, {
      matricule: `${PREFIXE}-HER-3`,
    });
    const emploi = await prisma.emploi.create({ data: { salarieId: salarie.id, numeroOrdre: 1 } });
    await expect(
      prisma.$executeRaw`
        INSERT INTO "EmploiAffectationVersion"
          ("id", "emploiId", "moisEffet", "createdAt", "updatedAt", "etablissementId", "baseSaisieDuree", "suivreJoursFeriesEtablissement")
        VALUES
          (gen_random_uuid(), ${emploi.id}::uuid, '2025-01', NOW(), NOW(), ${societeA.etablissementPrincipalId}::uuid, 'HEBDOMADAIRE', NULL)
      `
    ).rejects.toBeDefined();
  });
});
