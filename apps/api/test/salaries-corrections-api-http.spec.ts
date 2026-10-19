import type { INestApplication } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HEADER_PERMISSIONS_REFUSEES } from '../src/common/permissions/permissions-refusees.header.js';
import { TenantContextService } from '../src/common/tenancy/tenant-context.service.js';
import { TableauxSalarieService } from '../src/modules/salaries/tableaux-salarie.service.js';
import { creerAppHttp, urlLocale } from './support/app-http.js';
import { creerSalarieMin, creerSocieteTest } from './support/fiche-salarie-fixtures.js';
import { nettoyerCompteTest } from './support/nettoyage-fiche-salarie.js';
import { prisma } from './support/prisma-test.js';

const PREFIXE = `test-salarie-corr-${Date.now()}`;

const REFUS_INTROUVABLE = 'Ressource introuvable.';

/** Nom porte par les salaries de la societe B : ne doit jamais apparaitre dans une reponse vue de A. */
const NOM_SALARIE_B = 'Confidentielb';

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

const CORPS_PRET = {
  libelleObjet: 'Pret voiture',
  libelleBulletin: 'PRET',
  montantTotal: '1200.00',
  moisDebut: '2025-01',
  mensualite: '100.00',
  nombreEcheances: 12,
};

const CORPS_SAISIE = {
  typeSaisieCode: 'PENSION_ALIMENTAIRE',
  referenceDecision: 'JUG-CORR-002',
  creancier: 'Tribunal',
  libelleBulletin: 'Pension',
  montantMensuel: '800.00',
  moisDebut: '2025-01',
};

interface Lignes {
  readonly salarieId: string;
  readonly personneId: string;
  readonly pretId: string;
  readonly saisieId: string;
  readonly compteIds: readonly [string, string];
}

/** Lignes conformes au schema : lien de parente et type de saisie du referentiel, parts a 100 %. */
async function creerLignes(salarieId: string): Promise<Lignes> {
  const personne = await prisma.personneACharge.create({
    data: {
      salarieId,
      lienParenteCode: 'ENFANT',
      prenom: 'Yasmine',
      nom: NOM_SALARIE_B,
      sexe: 'FEMME',
      dateNaissance: new Date('2015-03-10'),
      aCharge: true,
      moisEffetDebut: '2025-01',
      moisEffetFin: null,
    },
  });
  const pret = await prisma.pret.create({
    data: {
      salarieId,
      libelleObjet: 'Pret logement',
      libelleBulletin: 'PRET',
      montantTotal: new Decimal('1000'),
      moisDebut: '2025-01',
      mensualite: new Decimal('100'),
      nombreEcheances: 10,
      moisEffetDebut: '2025-01',
      moisEffetFin: null,
    },
  });
  const saisie = await prisma.saisieSurSalaire.create({
    data: {
      salarieId,
      typeSaisieCode: 'PENSION_ALIMENTAIRE',
      referenceDecision: 'JUG-CORR-001',
      creancier: 'Tribunal',
      libelleBulletin: 'Pension',
      montantMensuel: new Decimal('1500'),
      moisDebut: '2024-01',
      moisEffetDebut: '2025-01',
      moisEffetFin: null,
    },
  });
  const compte1 = await prisma.compteBancaireSalarie.create({
    data: {
      salarieId,
      titulaire: 'Titulaire un',
      rib: '007780000000000000000011',
      partVirement: new Decimal('50'),
    },
  });
  const compte2 = await prisma.compteBancaireSalarie.create({
    data: {
      salarieId,
      titulaire: 'Titulaire deux',
      rib: '007780000000000000000022',
      partVirement: new Decimal('50'),
    },
  });
  return {
    salarieId,
    personneId: personne.id,
    pretId: pret.id,
    saisieId: saisie.id,
    compteIds: [compte1.id, compte2.id],
  };
}

/** Etat complet d un salarie en base : lignes portees et Salarie.version. */
async function etatSalarie(salarieId: string) {
  return prisma.salarie.findUniqueOrThrow({
    where: { id: salarieId },
    include: {
      personnesACharge: { orderBy: { id: 'asc' } },
      prets: { orderBy: { id: 'asc' } },
      saisiesSurSalaire: { orderBy: { id: 'asc' } },
      comptesBancaires: { orderBy: { id: 'asc' } },
    },
  });
}

describe('API salaries — corrections temps 6 (prompt A-bis)', () => {
  let app: INestApplication;
  let utilisateurId: string;
  let accountId: string;
  let societeA: Awaited<ReturnType<typeof creerSocieteTest>>;
  let societeB: Awaited<ReturnType<typeof creerSocieteTest>>;
  let compteurSalarie = 0;

  async function nouveauSalarie(companyId: string, nom?: string) {
    compteurSalarie += 1;
    return creerSalarieMin(prisma, companyId, {
      matricule: `${PREFIXE}-${compteurSalarie}`,
      nom,
    });
  }

  async function salarieAvecLignes(companyId: string, nom?: string) {
    const salarie = await nouveauSalarie(companyId, nom);
    return { salarie, lignes: await creerLignes(salarie.id) };
  }

  async function ecrire(
    companyId: string,
    methode: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    chemin: string,
    version: number,
    corps?: Record<string, unknown>,
    extra: Record<string, string> = {}
  ) {
    return fetch(urlLocale(app, chemin), {
      method: methode,
      headers: {
        ...entetes(utilisateurId, companyId, extra),
        'if-match': String(version),
        ...(corps !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
    });
  }

  async function lire(companyId: string, chemin: string) {
    return fetch(urlLocale(app, chemin), { headers: entetes(utilisateurId, companyId) });
  }

  async function jetonImpact(companyId: string, chemin: string): Promise<string> {
    const reponse = await lire(companyId, chemin);
    expect(reponse.status).toBe(200);
    const { donnees } = (await reponse.json()) as { donnees: { jetonConfirmation: string } };
    return donnees.jetonConfirmation;
  }

  /** Une autre ecriture est passee entre la lecture et l envoi : la version lue est perimee. */
  async function perimerVersion(salarieId: string): Promise<number> {
    const avant = await prisma.salarie.findUniqueOrThrow({ where: { id: salarieId } });
    await prisma.salarie.update({
      where: { id: salarieId },
      data: { version: { increment: 1 } },
    });
    return avant.version;
  }

  beforeAll(async () => {
    app = await creerAppHttp();
    await app.listen(0);

    const forme = await prisma.formeJuridique.findFirstOrThrow();
    const compte = await prisma.account.create({
      data: { name: `${PREFIXE}-A`, type: 'CABINET' },
    });
    accountId = compte.id;
    const utilisateur = await prisma.user.create({
      data: { email: `${PREFIXE}@test.local`, role: 'ACCOUNT_ADMIN', accountId: compte.id },
    });
    utilisateurId = utilisateur.id;
    societeA = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SA`);
    societeB = await creerSocieteTest(prisma, forme.id, compte.id, `${PREFIXE}-SB`);
  });

  afterAll(async () => {
    await nettoyerCompteTest(prisma, PREFIXE);
    await app?.close();
  });

  describe('perimetre par societe : salarie de la societe B vise depuis la societe A', () => {
    async function attendreIntrouvableSansFuite(
      salarie: { id: string; matricule: string },
      lignes: Lignes,
      reponse: Response
    ) {
      expect(reponse.status).toBe(404);
      const texte = await reponse.text();
      expect((JSON.parse(texte) as { message: string }).message).toBe(REFUS_INTROUVABLE);
      for (const donnee of [
        salarie.id,
        salarie.matricule,
        NOM_SALARIE_B,
        lignes.personneId,
        lignes.pretId,
        lignes.saisieId,
        ...lignes.compteIds,
      ]) {
        expect(texte).not.toContain(donnee);
      }
    }

    it.each([
      [
        'B01 — PATCH personne a charge',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'PATCH',
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}`,
            v,
            { prenom: 'Intrus' }
          ),
      ],
      [
        'B02 — GET impact-suppression personne a charge',
        (l: Lignes) =>
          lire(
            societeA.companyId,
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}/impact-suppression`
          ),
      ],
      [
        'B03 — DELETE personne a charge',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeB.companyId,
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
      [
        'B04 — POST pret',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'POST', `/salaries/${l.salarieId}/prets`, v, CORPS_PRET),
      ],
      [
        'B05 — PATCH pret',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'PATCH', `/salaries/${l.salarieId}/prets/${l.pretId}`, v, {
            libelleObjet: 'Intrus',
          }),
      ],
      [
        'B06 — GET impact-suppression pret',
        (l: Lignes) =>
          lire(societeA.companyId, `/salaries/${l.salarieId}/prets/${l.pretId}/impact-suppression`),
      ],
      [
        'B07 — DELETE pret',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeB.companyId,
            `/salaries/${l.salarieId}/prets/${l.pretId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/prets/${l.pretId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
      [
        'B08 — POST saisie sur salaire',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'POST',
            `/salaries/${l.salarieId}/saisies-sur-salaire`,
            v,
            CORPS_SAISIE
          ),
      ],
      [
        'B09 — PATCH saisie sur salaire',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'PATCH',
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}`,
            v,
            { creancier: 'Intrus' }
          ),
      ],
      [
        'B10 — GET impact-suppression saisie sur salaire',
        (l: Lignes) =>
          lire(
            societeA.companyId,
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}/impact-suppression`
          ),
      ],
      [
        'B11 — DELETE saisie sur salaire',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeB.companyId,
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
    ] as const)('%s : 404, base inchangee, aucune donnee de B', async (_, envoyer) => {
      const { salarie, lignes } = await salarieAvecLignes(societeB.companyId, NOM_SALARIE_B);
      const avant = await etatSalarie(salarie.id);

      const reponse = await envoyer(lignes, avant.version);

      await attendreIntrouvableSansFuite(salarie, lignes, reponse);
      expect(await etatSalarie(salarie.id)).toEqual(avant);
    });

    it('B12 — POST pret au niveau du service seul (garde contournee) : 404, base inchangee', async () => {
      const { salarie } = await salarieAvecLignes(societeB.companyId, NOM_SALARIE_B);
      const avant = await etatSalarie(salarie.id);

      const tenant = app.get(TenantContextService);
      const tableaux = app.get(TableauxSalarieService);
      await expect(
        tenant.run(
          {
            userId: utilisateurId,
            role: 'ACCOUNT_ADMIN',
            accountId,
            companyId: societeA.companyId,
          },
          () => tableaux.creerPret(salarie.id, CORPS_PRET, avant.version)
        )
      ).rejects.toMatchObject({ status: 404, message: REFUS_INTROUVABLE });

      expect(await etatSalarie(salarie.id)).toEqual(avant);
    });

    it('B13 — POST pret au niveau de la garde seule (sans droit d ecriture) : 404, jamais 403, base inchangee', async () => {
      const { salarie, lignes } = await salarieAvecLignes(societeB.companyId, NOM_SALARIE_B);
      const avant = await etatSalarie(salarie.id);

      const reponse = await ecrire(
        societeA.companyId,
        'POST',
        `/salaries/${salarie.id}/prets`,
        avant.version,
        CORPS_PRET,
        { [HEADER_PERMISSIONS_REFUSEES]: 'salarie.modifier' }
      );

      await attendreIntrouvableSansFuite(salarie, lignes, reponse);
      expect(await etatSalarie(salarie.id)).toEqual(avant);
    });
  });

  describe('If-Match perime : 409 CONFLIT_VERSION et base strictement inchangee', () => {
    it.each([
      [
        'B14 — POST personne a charge',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'POST', `/salaries/${l.salarieId}/personnes-a-charge`, v, {
            lienParenteCode: 'ENFANT',
            prenom: 'Nouveau',
            nom: 'Test',
            sexe: 'HOMME',
            dateNaissance: '2018-04-12',
            aCharge: true,
          }),
      ],
      [
        'B15 — PATCH personne a charge',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'PATCH',
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}`,
            v,
            { prenom: 'Modifie' }
          ),
      ],
      [
        'B16 — DELETE personne a charge',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeA.companyId,
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/personnes-a-charge/${l.personneId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
      [
        'B17 — PUT comptes bancaires (un modifie, un retire, un ajoute)',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'PUT', `/salaries/${l.salarieId}/comptes-bancaires`, v, {
            comptes: [
              {
                id: l.compteIds[0],
                titulaire: 'Titulaire modifie',
                rib: '007780000000000000000011',
                partVirement: '60.00',
              },
              { titulaire: 'Nouveau', rib: '007780000000000000000033', partVirement: '40.00' },
            ],
          }),
      ],
      [
        'B18 — POST pret',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'POST', `/salaries/${l.salarieId}/prets`, v, CORPS_PRET),
      ],
      [
        'B19 — PATCH pret',
        (l: Lignes, v: number) =>
          ecrire(societeA.companyId, 'PATCH', `/salaries/${l.salarieId}/prets/${l.pretId}`, v, {
            libelleObjet: 'Modifie',
          }),
      ],
      [
        'B20 — DELETE pret',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeA.companyId,
            `/salaries/${l.salarieId}/prets/${l.pretId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/prets/${l.pretId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
      [
        'B21 — POST saisie sur salaire',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'POST',
            `/salaries/${l.salarieId}/saisies-sur-salaire`,
            v,
            CORPS_SAISIE
          ),
      ],
      [
        'B22 — PATCH saisie sur salaire',
        (l: Lignes, v: number) =>
          ecrire(
            societeA.companyId,
            'PATCH',
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}`,
            v,
            { creancier: 'Autre tribunal' }
          ),
      ],
      [
        'B23 — DELETE saisie sur salaire',
        async (l: Lignes, v: number) => {
          const jeton = await jetonImpact(
            societeA.companyId,
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}/impact-suppression`
          );
          return ecrire(
            societeA.companyId,
            'DELETE',
            `/salaries/${l.salarieId}/saisies-sur-salaire/${l.saisieId}?confirmationJeton=${jeton}`,
            v
          );
        },
      ],
    ] as const)('%s', async (_, envoyer) => {
      const { lignes } = await salarieAvecLignes(societeA.companyId);
      const versionPerimee = await perimerVersion(lignes.salarieId);
      const avant = await etatSalarie(lignes.salarieId);

      const reponse = await envoyer(lignes, versionPerimee);

      expect(reponse.status).toBe(409);
      expect(((await reponse.json()) as { code: string }).code).toBe('CONFLIT_VERSION');
      expect(await etatSalarie(lignes.salarieId)).toEqual(avant);
    });
  });

  describe('PATCH identite sans changement', () => {
    it('B24 — If-Match perime : 409 CONFLIT_VERSION, base inchangee', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const versionPerimee = await perimerVersion(salarie.id);
      const avant = await etatSalarie(salarie.id);

      const reponse = await ecrire(
        societeA.companyId,
        'PATCH',
        `/salaries/${salarie.id}/identite`,
        versionPerimee,
        {}
      );

      expect(reponse.status).toBe(409);
      expect(((await reponse.json()) as { code: string }).code).toBe('CONFLIT_VERSION');
      expect(await etatSalarie(salarie.id)).toEqual(avant);
    });

    it('B25 — If-Match a jour : 200, version inchangee a la relecture', async () => {
      const salarie = await nouveauSalarie(societeA.companyId);
      const avant = await etatSalarie(salarie.id);

      const reponse = await ecrire(
        societeA.companyId,
        'PATCH',
        `/salaries/${salarie.id}/identite`,
        avant.version,
        {}
      );

      expect(reponse.status).toBe(200);
      const { donnees } = (await reponse.json()) as { donnees: { version: number } };
      expect(donnees.version).toBe(avant.version);

      const relu = await lire(societeA.companyId, `/salaries/${salarie.id}`);
      expect(((await relu.json()) as { donnees: { version: number } }).donnees.version).toBe(
        avant.version
      );
      expect(await etatSalarie(salarie.id)).toEqual(avant);
    });
  });

  it('B26 — PUT comptes bancaires avec l identifiant du compte d un salarie de B : 400 VALEUR_INDISPONIBLE, rien n est ecrit', async () => {
    const { lignes: lignesA } = await salarieAvecLignes(societeA.companyId);
    const { lignes: lignesB } = await salarieAvecLignes(societeB.companyId, NOM_SALARIE_B);
    const avantA = await etatSalarie(lignesA.salarieId);
    const avantB = await etatSalarie(lignesB.salarieId);

    const reponse = await ecrire(
      societeA.companyId,
      'PUT',
      `/salaries/${lignesA.salarieId}/comptes-bancaires`,
      avantA.version,
      {
        comptes: [
          { id: lignesB.compteIds[0], titulaire: 'Intrus', rib: '007780000000000000000044' },
        ],
      }
    );

    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({
      code: 'VALEUR_INDISPONIBLE',
      message: 'Cette valeur n’est pas disponible.',
      champ: 'id',
      indexLigne: 0,
    });
    expect(await etatSalarie(lignesA.salarieId)).toEqual(avantA);
    expect(await etatSalarie(lignesB.salarieId)).toEqual(avantB);
  });
});
