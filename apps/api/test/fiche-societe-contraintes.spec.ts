import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from './support/prisma-test.js';

// ---------------------------------------------------------------------------
// Tests d integration : contraintes d unicite et etablissement principal.
// Necessitent PostgreSQL (Docker) et DATABASE_URL.
// ---------------------------------------------------------------------------

const PREFIXE = `test-1-1-a-${Date.now()}`;

describe('contraintes fiche societe (base reelle)', () => {
  let formeJuridiqueId: string;
  let compteAId: string;
  let compteBId: string;

  beforeAll(async () => {
    const forme = await prisma.formeJuridique.findFirst();
    if (!forme) {
      throw new Error(
        'Aucune FormeJuridique en base. Lancez `pnpm db:migrate` puis `pnpm db:seed` avant les tests.'
      );
    }
    formeJuridiqueId = forme.id;

    const compteA = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    const compteB = await prisma.account.create({
      data: { name: `${PREFIXE}-B`, type: 'CABINET' },
    });
    compteAId = compteA.id;
    compteBId = compteB.id;
  });

  afterAll(async () => {
    await prisma.account.deleteMany({ where: { name: { startsWith: PREFIXE } } });
  });

  async function creerSociete(accountId: string, codeDossier: string, identifiantFiscal?: string) {
    return prisma.company.create({
      data: {
        accountId,
        codeDossier,
        raisonSociale: `Raison ${codeDossier}`,
        formeJuridiqueId,
        identifiantFiscal: identifiantFiscal ?? null,
        etatDossier: 'EN_MONTAGE',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        moisEnCours: '2025-01',
      },
    });
  }

  it('refuse un codeDossier en doublon dans le meme compte', async () => {
    await creerSociete(compteAId, `${PREFIXE}-CD-1`);
    await expect(creerSociete(compteAId, `${PREFIXE}-CD-1`)).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('autorise le meme codeDossier sur deux comptes differents', async () => {
    const code = `${PREFIXE}-CD-PARTAGE`;
    const a = await creerSociete(compteAId, code);
    const b = await creerSociete(compteBId, code);
    expect(a.codeDossier).toBe(b.codeDossier);
    expect(a.accountId).not.toBe(b.accountId);
  });

  it('refuse un identifiantFiscal en doublon dans le meme compte', async () => {
    const ifiscal = `${PREFIXE}IF001`;
    await creerSociete(compteAId, `${PREFIXE}-IF-1`, ifiscal);
    await expect(creerSociete(compteAId, `${PREFIXE}-IF-2`, ifiscal)).rejects.toMatchObject({
      code: 'P2002',
    });
  });

  it('autorise le meme identifiantFiscal sur deux comptes differents', async () => {
    const ifiscal = `${PREFIXE}IF-PARTAGE`;
    const a = await creerSociete(compteAId, `${PREFIXE}-IF-A`, ifiscal);
    const b = await creerSociete(compteBId, `${PREFIXE}-IF-B`, ifiscal);
    expect(a.identifiantFiscal).toBe(b.identifiantFiscal);
  });

  it('refuse un ICE en doublon dans le meme compte (tous etablissements)', async () => {
    const ice = `${PREFIXE}ICE000000001`;
    const soc1 = await creerSociete(compteAId, `${PREFIXE}-ICE-1`);
    const soc2 = await creerSociete(compteAId, `${PREFIXE}-ICE-2`);

    await prisma.etablissement.create({
      data: {
        companyId: soc1.id,
        accountId: compteAId,
        nom: 'E1',
        estPrincipal: true,
        adresse: 'Adr 1',
        ville: 'Casablanca',
        ice,
      },
    });

    await expect(
      prisma.etablissement.create({
        data: {
          companyId: soc2.id,
          accountId: compteAId,
          nom: 'E2',
          estPrincipal: true,
          adresse: 'Adr 2',
          ville: 'Rabat',
          ice,
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('autorise le meme ICE sur deux comptes differents', async () => {
    const ice = `${PREFIXE}ICE-PARTAGE01`;
    const socA = await creerSociete(compteAId, `${PREFIXE}-ICE-A`);
    const socB = await creerSociete(compteBId, `${PREFIXE}-ICE-B`);

    const eA = await prisma.etablissement.create({
      data: {
        companyId: socA.id,
        accountId: compteAId,
        nom: 'EA',
        estPrincipal: true,
        adresse: 'A',
        ville: 'Casa',
        ice,
      },
    });
    const eB = await prisma.etablissement.create({
      data: {
        companyId: socB.id,
        accountId: compteBId,
        nom: 'EB',
        estPrincipal: true,
        adresse: 'B',
        ville: 'Rabat',
        ice,
      },
    });
    expect(eA.ice).toBe(eB.ice);
  });

  it('garantit au plus un etablissement principal via l index partiel', async () => {
    const soc = await creerSociete(compteAId, `${PREFIXE}-PRINC`);

    await prisma.etablissement.create({
      data: {
        companyId: soc.id,
        accountId: compteAId,
        nom: 'Principal',
        estPrincipal: true,
        adresse: 'Adr',
        ville: 'Casa',
      },
    });

    await expect(
      prisma.etablissement.create({
        data: {
          companyId: soc.id,
          accountId: compteAId,
          nom: 'Second principal illegal',
          estPrincipal: true,
          adresse: 'Adr 2',
          ville: 'Rabat',
        },
      })
    ).rejects.toMatchObject({ code: 'P2002' });

    // Un secondaire est autorise.
    const secondaire = await prisma.etablissement.create({
      data: {
        companyId: soc.id,
        accountId: compteAId,
        nom: 'Secondaire',
        estPrincipal: false,
        adresse: 'Adr 3',
        ville: 'Fes',
      },
    });
    expect(secondaire.estPrincipal).toBe(false);

    const principaux = await prisma.etablissement.count({
      where: { companyId: soc.id, estPrincipal: true },
    });
    expect(principaux).toBe(1);
  });
});
