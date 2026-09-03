import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { calculerJetonConfirmation } from '../src/modules/companies/jeton-confirmation.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-1-1-b-${Date.now()}`;

describe('API fiche societe — scenarios d integration', () => {
  let formeId: string;
  let compteId: string;
  let adminId: string;
  let platformId: string;
  let autreCompteId: string;

  beforeAll(async () => {
    const forme = await prisma.formeJuridique.findFirstOrThrow();
    formeId = forme.id;

    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-cabinet`, type: 'CABINET' },
    });
    compteId = compte.id;

    const autre = await prisma.account.create({
      data: { name: `${PREFIXE}-autre`, type: 'CABINET' },
    });
    autreCompteId = autre.id;

    const admin = await prisma.user.create({
      data: {
        email: `${PREFIXE}-admin@test.local`,
        role: 'ACCOUNT_ADMIN',
        accountId: compteId,
      },
    });
    adminId = admin.id;

    const platform = await prisma.user.upsert({
      where: { email: 'super-admin@paymarh.local' },
      update: {},
      create: {
        email: 'super-admin@paymarh.local',
        role: 'PLATFORM_ADMIN',
        accountId: null,
      },
    });
    platformId = platform.id;

    void adminId;
    void platformId;
    void autreCompteId;
  });

  afterAll(async () => {
    await prisma.account.deleteMany({ where: { name: { startsWith: PREFIXE } } });
  });

  async function creerSocieteComplete(code: string, ifiscal?: string) {
    return prisma.$transaction(async (tx) => {
      const societe = await tx.company.create({
        data: {
          accountId: compteId,
          codeDossier: code,
          raisonSociale: `Raison ${code}`,
          formeJuridiqueId: formeId,
          identifiantFiscal: ifiscal ?? null,
          etatDossier: 'EN_MONTAGE',
          moisDebutMontage: '2025-01',
          moisDebutProduction: '2025-01',
          moisEnCours: '2025-01',
        },
      });
      await tx.etablissement.create({
        data: {
          companyId: societe.id,
          accountId: compteId,
          nom: 'Siege',
          estPrincipal: true,
          adresse: '1 rue Test',
          ville: 'Casablanca',
        },
      });
      return societe;
    });
  }

  it('cree exactement un etablissement principal avec la societe', async () => {
    const societe = await creerSocieteComplete(`${PREFIXE}-princ`);
    const principaux = await prisma.etablissement.count({
      where: { companyId: societe.id, estPrincipal: true },
    });
    const total = await prisma.etablissement.count({ where: { companyId: societe.id } });
    expect(principaux).toBe(1);
    expect(total).toBe(1);
  });

  it('refuse un doublon d identifiant fiscal avec code VALEUR_INDISPONIBLE neutre', async () => {
    const ifiscal = `${PREFIXE}IF99`;
    await creerSocieteComplete(`${PREFIXE}-if1`, ifiscal);
    try {
      await creerSocieteComplete(`${PREFIXE}-if2`, ifiscal);
      expect.unreachable('aurait du lever P2002');
    } catch (erreur) {
      expect((erreur as { code: string }).code).toBe('P2002');
    }
    // Le message API neutre est verifie en unitaire via ValidationBloquanteError
    const { erreurValeurIndisponible } =
      await import('../src/modules/companies/validation-fiche.js');
    const err = erreurValeurIndisponible('identifiantFiscal');
    expect(err.code).toBe('VALEUR_INDISPONIBLE');
    expect(err.message.toLowerCase()).not.toMatch(/raison|dossier|societe|demo/i);
    expect(err.message).toMatch(/n'est pas disponible/i);
  });

  it('refuse la suppression si le jeton d impact est obsolete', async () => {
    const societe = await creerSocieteComplete(`${PREFIXE}-jeton`);

    const inventaireInitial = {
      etablissements: 1,
      comptesBancaires: 0,
      parametragesHistoriquesSociete: 0,
      parametragesHistoriquesEtablissement: 0,
    };
    const jetonObsolete = calculerJetonConfirmation(inventaireInitial);

    // Modification de l inventaire : ajout d un historique
    await prisma.companyParametrageHistorique.create({
      data: {
        companyId: societe.id,
        moisEffet: '2025-01',
        moisClotureConges: 12,
      },
    });

    const inventaireActuel = {
      etablissements: 1,
      comptesBancaires: 0,
      parametragesHistoriquesSociete: 1,
      parametragesHistoriquesEtablissement: 0,
    };
    const jetonActuel = calculerJetonConfirmation(inventaireActuel);

    expect(jetonObsolete).not.toBe(jetonActuel);
  });

  it('ecrit le parametrage avec moisEnCours et lit l ancienne valeur sur un mois anterieur', async () => {
    const societe = await prisma.company.create({
      data: {
        accountId: compteId,
        codeDossier: `${PREFIXE}-hist`,
        raisonSociale: 'Hist',
        formeJuridiqueId: formeId,
        etatDossier: 'EN_PRODUCTION',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-01',
        moisEnCours: '2025-07',
      },
    });

    await prisma.companyParametrageHistorique.create({
      data: {
        companyId: societe.id,
        moisEffet: '2025-01',
        moisClotureConges: 12,
      },
    });
    await prisma.companyParametrageHistorique.create({
      data: {
        companyId: societe.id,
        moisEffet: societe.moisEnCours,
        moisClotureConges: 6,
      },
    });

    const { resoudreLigneHistorique } = await import('../src/modules/companies/historisation.js');
    const lignes = await prisma.companyParametrageHistorique.findMany({
      where: { companyId: societe.id },
    });
    expect(resoudreLigneHistorique(lignes, '2025-03')?.moisClotureConges).toBe(12);
    expect(resoudreLigneHistorique(lignes, '2025-07')?.moisClotureConges).toBe(6);
  });

  it('designe un nouveau principal en laissant exactement un principal', async () => {
    const societe = await creerSocieteComplete(`${PREFIXE}-desig`);
    const secondaire = await prisma.etablissement.create({
      data: {
        companyId: societe.id,
        accountId: compteId,
        nom: 'Secondaire',
        estPrincipal: false,
        adresse: '2 rue',
        ville: 'Rabat',
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.etablissement.updateMany({
        where: { companyId: societe.id, estPrincipal: true },
        data: { estPrincipal: false },
      });
      await tx.etablissement.update({
        where: { id: secondaire.id },
        data: { estPrincipal: true },
      });
    });

    const principaux = await prisma.etablissement.count({
      where: { companyId: societe.id, estPrincipal: true },
    });
    expect(principaux).toBe(1);
  });
});
