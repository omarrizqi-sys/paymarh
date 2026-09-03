import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as chargerEnv } from 'dotenv';
import { Decimal } from 'decimal.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { heuresHebdomadairesVersMensuelles } from '../src/modules/companies/heures-mensuelles.js';
import {
  BANQUES,
  FORMES_JURIDIQUES,
  JOURS_FERIES,
  TYPES_EXONERATION,
  TYPES_HEURE,
} from './reference-data.js';
import {
  LIENS_PARENTE,
  MOTIFS_SORTIE,
  PAYS,
  SITUATIONS_FAMILIALES,
  STATUTS_PARTICULIERS,
  STATUT_TECHNIQUE_TAHFIZ,
  TYPES_CONTRAT,
} from './reference-data-fiche-salarie.js';

// ---------------------------------------------------------------------------
// PaymaRH - Donnees de demonstration (module 0 + module 1 etape 1.1.a + module 2 etape 2.1.a)
//
// - tables de reference nationales (formes, banques, feries, types d heure,
//   exoneration, pays, types contrat, motifs sortie, statuts, situations, liens parente) ;
// - un compte CABINET, un super-admin, un admin de compte ;
// - une societe complete : 2 etablissements, 2 comptes bancaires, grille
//   horaire 44 h, feries coches, 2 moisEffet d historique.
//
// Idempotent : on peut relancer sans creer de doublon.
// Lancement : pnpm db:seed
// ---------------------------------------------------------------------------

chargerEnv({ path: resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL est absente. Copiez .env.example en .env a la racine du depot avant de lancer le seed.'
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NOM_COMPTE_DEMO = 'Cabinet de demonstration PaymaRH';
const CODE_DOSSIER_DEMO = 'DEMO-001';
const RAISON_SOCIALE_DEMO = 'Société de démonstration';
const EMAIL_SUPER_ADMIN = 'super-admin@paymarh.local';
const EMAIL_ADMIN_COMPTE = 'admin@cabinet-demo.local';

async function seedReferences(): Promise<{
  formeSarlId: string;
  banqueAttijariId: string;
  banqueBpId: string;
  typeHeureNormaleId: string;
  typeExonerationTahfizId: string;
  jourFerieTravailId: string;
  jourFerieTroneId: string;
  jourFerieAidFitrId: string;
}> {
  for (const forme of FORMES_JURIDIQUES) {
    await prisma.formeJuridique.upsert({
      where: { code: forme.code },
      update: { libelle: forme.libelle },
      create: { code: forme.code, libelle: forme.libelle },
    });
  }

  for (const banque of BANQUES) {
    const existante = await prisma.banque.findFirst({ where: { nom: banque.nom } });
    if (existante) {
      await prisma.banque.update({
        where: { id: existante.id },
        data: {
          ancienNom: banque.ancienNom,
          couleur: banque.couleur,
          // codeBanque laisse volontairement vide (spec X3).
          codeBanque: null,
        },
      });
    } else {
      await prisma.banque.create({
        data: {
          nom: banque.nom,
          ancienNom: banque.ancienNom,
          codeBanque: null,
          couleur: banque.couleur,
        },
      });
    }
  }

  for (const jour of JOURS_FERIES) {
    await prisma.jourFerie.upsert({
      where: { code: jour.code },
      update: {
        libelle: jour.libelle,
        referenceDate: jour.referenceDate,
        type: jour.type,
      },
      create: {
        code: jour.code,
        libelle: jour.libelle,
        referenceDate: jour.referenceDate,
        type: jour.type,
      },
    });
  }

  for (const type of TYPES_HEURE) {
    await prisma.typeHeure.upsert({
      where: { code: type.code },
      update: { libelle: type.libelle, ordre: type.ordre },
      create: { code: type.code, libelle: type.libelle, ordre: type.ordre },
    });
  }

  for (const type of TYPES_EXONERATION) {
    await prisma.typeExoneration.upsert({
      where: { code: type.code },
      update: { libelle: type.libelle },
      create: { code: type.code, libelle: type.libelle },
    });
  }

  for (const pays of PAYS) {
    await prisma.pays.upsert({
      where: { codeIso: pays.codeIso },
      update: { ordre: pays.ordre, libelle: pays.libelle },
      create: { ordre: pays.ordre, codeIso: pays.codeIso, libelle: pays.libelle },
    });
  }

  for (const type of TYPES_CONTRAT) {
    await prisma.typeContrat.upsert({
      where: { code: type.code },
      update: { libelle: type.libelle },
      create: { code: type.code, libelle: type.libelle },
    });
  }

  for (const motif of MOTIFS_SORTIE) {
    await prisma.motifSortie.upsert({
      where: { code: motif.code },
      update: { libelle: motif.libelle },
      create: { code: motif.code, libelle: motif.libelle },
    });
  }

  for (const statut of STATUTS_PARTICULIERS) {
    await prisma.statutParticulier.upsert({
      where: { code: statut.code },
      update: { libelle: statut.libelle },
      create: { code: statut.code, libelle: statut.libelle },
    });
  }

  await prisma.statutParticulier.upsert({
    where: { code: STATUT_TECHNIQUE_TAHFIZ.code },
    update: { libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
    create: { code: STATUT_TECHNIQUE_TAHFIZ.code, libelle: STATUT_TECHNIQUE_TAHFIZ.libelle },
  });

  for (const situation of SITUATIONS_FAMILIALES) {
    await prisma.situationFamiliale.upsert({
      where: { code: situation.code },
      update: {
        libelleMasculin: situation.libelleMasculin,
        libelleFeminin: situation.libelleFeminin,
      },
      create: {
        code: situation.code,
        libelleMasculin: situation.libelleMasculin,
        libelleFeminin: situation.libelleFeminin,
      },
    });
  }

  for (const lien of LIENS_PARENTE) {
    await prisma.lienParente.upsert({
      where: { code: lien.code },
      update: { libelle: lien.libelle },
      create: { code: lien.code, libelle: lien.libelle },
    });
  }

  const formeSarl = await prisma.formeJuridique.findUniqueOrThrow({ where: { code: 'SARL' } });
  const banqueAttijari = await prisma.banque.findFirstOrThrow({
    where: { nom: 'Attijariwafa Bank' },
  });
  const banqueBp = await prisma.banque.findFirstOrThrow({
    where: { nom: 'Banque Populaire' },
  });
  const typeHeureNormale = await prisma.typeHeure.findUniqueOrThrow({
    where: { code: 'NORMALE' },
  });
  const tahfiz = await prisma.typeExoneration.findUniqueOrThrow({ where: { code: 'TAHFIZ' } });
  const jfTravail = await prisma.jourFerie.findUniqueOrThrow({
    where: { code: 'JF_FETE_TRAVAIL' },
  });
  const jfTrone = await prisma.jourFerie.findUniqueOrThrow({ where: { code: 'JF_FETE_TRONE' } });
  const jfAid = await prisma.jourFerie.findUniqueOrThrow({
    where: { code: 'JF_AID_FITR_J1' },
  });

  console.log(
    `References : ${FORMES_JURIDIQUES.length} formes, ${BANQUES.length} banques, ${JOURS_FERIES.length} jours feries, ${TYPES_HEURE.length} types d heure, ${TYPES_EXONERATION.length} exoneration(s), ${PAYS.length} pays, ${TYPES_CONTRAT.length} types contrat, ${MOTIFS_SORTIE.length} motifs sortie, ${STATUTS_PARTICULIERS.length} statut(s) particulier(s), ${SITUATIONS_FAMILIALES.length} situations familiales, ${LIENS_PARENTE.length} liens parente.`
  );

  return {
    formeSarlId: formeSarl.id,
    banqueAttijariId: banqueAttijari.id,
    banqueBpId: banqueBp.id,
    typeHeureNormaleId: typeHeureNormale.id,
    typeExonerationTahfizId: tahfiz.id,
    jourFerieTravailId: jfTravail.id,
    jourFerieTroneId: jfTrone.id,
    jourFerieAidFitrId: jfAid.id,
  };
}

async function seedSocieteDemo(refs: Awaited<ReturnType<typeof seedReferences>>): Promise<void> {
  const compteExistant = await prisma.account.findFirst({
    where: { name: NOM_COMPTE_DEMO },
  });

  const compte =
    compteExistant ??
    (await prisma.account.create({
      data: { name: NOM_COMPTE_DEMO, type: 'CABINET' },
    }));

  console.log(`Compte de demonstration : ${compte.name} (${compte.id})`);

  let societe = await prisma.company.findFirst({
    where: { accountId: compte.id, codeDossier: CODE_DOSSIER_DEMO },
  });

  if (!societe) {
    societe = await prisma.company.create({
      data: {
        accountId: compte.id,
        codeDossier: CODE_DOSSIER_DEMO,
        raisonSociale: RAISON_SOCIALE_DEMO,
        nomCommercial: 'Demo PaymaRH',
        formeJuridiqueId: refs.formeSarlId,
        activiteExercee: 'Conseil en gestion de la paie',
        identifiantFiscal: '123456789',
        registreCommerce: '12345',
        tribunalRegistreCommerce: 'Casablanca',
        dateCreation: new Date('2019-03-15'),
        siteWeb: 'https://demo.paymarh.local',
        regimeDeBase: 'NON_AGRICOLE',
        periodicitePaie: 'MENSUEL',
        etatDossier: 'EN_PRODUCTION',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        moisEnCours: '2025-07',
        signataireCivilite: 'M.',
        signatairePrenom: 'Karim',
        signataireNom: 'Benali',
        signataireQualite: 'Gérant',
        matriculePrefixe: 'EMP',
        matriculeLongueur: 5,
        matriculeGenerationAuto: true,
        calculAutoAbsencesEntreesSorties: true,
      },
    });
  } else {
    societe = await prisma.company.update({
      where: { id: societe.id },
      data: {
        raisonSociale: RAISON_SOCIALE_DEMO,
        formeJuridiqueId: refs.formeSarlId,
        etatDossier: 'EN_PRODUCTION',
        moisDebutMontage: '2025-01',
        moisDebutProduction: '2025-07',
        moisEnCours: '2025-07',
      },
    });
  }

  console.log(`Societe de demonstration : ${societe.raisonSociale} (${societe.id})`);

  // --- Etablissements (exactement un principal) ---
  let siege = await prisma.etablissement.findFirst({
    where: { companyId: societe.id, estPrincipal: true },
  });

  if (!siege) {
    siege = await prisma.etablissement.create({
      data: {
        companyId: societe.id,
        accountId: compte.id,
        nom: 'Siège Casablanca',
        estPrincipal: true,
        adresse: '12 Boulevard Zerktouni',
        complementAdresse: '3e étage',
        codePostal: '20000',
        ville: 'Casablanca',
        pays: 'MA',
        ice: '001234567000012',
        taxeProfessionnelle: 'TP-CASA-001',
        telephone: '+212522000001',
        email: 'siege@demo.paymarh.local',
      },
    });
  }

  let atelier = await prisma.etablissement.findFirst({
    where: { companyId: societe.id, nom: 'Atelier Rabat' },
  });

  if (!atelier) {
    atelier = await prisma.etablissement.create({
      data: {
        companyId: societe.id,
        accountId: compte.id,
        nom: 'Atelier Rabat',
        estPrincipal: false,
        adresse: '45 Avenue Mohammed V',
        codePostal: '10000',
        ville: 'Rabat',
        pays: 'MA',
        ice: '001234567000099',
        taxeProfessionnelle: 'TP-RABAT-002',
        telephone: '+212537000002',
        email: 'atelier@demo.paymarh.local',
      },
    });
  }

  console.log(
    `Etablissements : ${siege.nom} (principal), ${atelier.nom} (secondaire)`
  );

  // --- Historique societe (2 moisEffet) ---
  await prisma.companyParametrageHistorique.upsert({
    where: {
      companyId_moisEffet: { companyId: societe.id, moisEffet: '2025-01' },
    },
    update: {
      moisClotureConges: 12,
      typeExonerationId: null,
      exonerationDateDebut: null,
      exonerationDateFin: null,
    },
    create: {
      companyId: societe.id,
      moisEffet: '2025-01',
      moisClotureConges: 12,
    },
  });

  await prisma.companyParametrageHistorique.upsert({
    where: {
      companyId_moisEffet: { companyId: societe.id, moisEffet: '2025-07' },
    },
    update: {
      moisClotureConges: 6,
      typeExonerationId: refs.typeExonerationTahfizId,
      exonerationDateDebut: '2025-07',
      exonerationDateFin: null,
    },
    create: {
      companyId: societe.id,
      moisEffet: '2025-07',
      moisClotureConges: 6,
      typeExonerationId: refs.typeExonerationTahfizId,
      exonerationDateDebut: '2025-07',
    },
  });

  // --- Historique etablissement principal (2 moisEffet) + grille + feries ---
  const heuresHebdo = new Decimal(44);
  const heuresMensuelles = heuresHebdomadairesVersMensuelles(heuresHebdo);

  const paramJanvier = await upsertParamEtablissement(siege.id, '2025-01', {
    dureeHebdomadaire: heuresHebdo,
    jourReposHebdomadaire: 'DIMANCHE',
    teletravailAutorise: false,
    indemniteTeletravailVersee: null,
    montantIndemniteTeletravail: null,
  });

  const paramJuillet = await upsertParamEtablissement(siege.id, '2025-07', {
    dureeHebdomadaire: heuresHebdo,
    jourReposHebdomadaire: 'DIMANCHE',
    teletravailAutorise: true,
    indemniteTeletravailVersee: true,
    montantIndemniteTeletravail: new Decimal('500.00'),
  });

  await seedGrilleHoraire(paramJanvier.id, refs.typeHeureNormaleId, heuresHebdo, heuresMensuelles);
  await seedGrilleHoraire(paramJuillet.id, refs.typeHeureNormaleId, heuresHebdo, heuresMensuelles);

  // Feries travailles sur le parametrage de juillet (preuve de liaison).
  for (const jourFerieId of [
    refs.jourFerieTravailId,
    refs.jourFerieTroneId,
    refs.jourFerieAidFitrId,
  ]) {
    await prisma.jourFerieTravaille.upsert({
      where: {
        etablissementParametrageHistoriqueId_jourFerieId: {
          etablissementParametrageHistoriqueId: paramJuillet.id,
          jourFerieId,
        },
      },
      update: {},
      create: {
        etablissementParametrageHistoriqueId: paramJuillet.id,
        jourFerieId,
      },
    });
  }

  // Un parametrage minimal sur l atelier (un seul moisEffet).
  await upsertParamEtablissement(atelier.id, '2025-07', {
    dureeHebdomadaire: heuresHebdo,
    jourReposHebdomadaire: 'DIMANCHE',
    teletravailAutorise: null,
    indemniteTeletravailVersee: null,
    montantIndemniteTeletravail: null,
  });

  console.log(
    `Historique : 2 moisEffet societe (2025-01, 2025-07), 2 moisEffet siege, heures mensuelles deduites = ${heuresMensuelles.toString()}`
  );

  // --- Comptes bancaires (usages differents) ---
  let compteSalaires = await prisma.compteBancaire.findFirst({
    where: { companyId: societe.id, libelle: 'Compte salaires' },
  });

  if (!compteSalaires) {
    compteSalaires = await prisma.compteBancaire.create({
      data: {
        companyId: societe.id,
        libelle: 'Compte salaires',
        banqueId: refs.banqueAttijariId,
        rib: '007780000123456789012345',
        iban: 'MA64007780000123456789012345',
        bic: 'BCMAMAMC',
        nomPayeur: RAISON_SOCIALE_DEMO,
        usageSalaires: true,
        usageCotisationsSociales: false,
        usageIR: false,
        etat: 'ACTIF',
      },
    });
  }

  let compteCharges = await prisma.compteBancaire.findFirst({
    where: { companyId: societe.id, libelle: 'Compte cotisations et IR' },
  });

  if (!compteCharges) {
    compteCharges = await prisma.compteBancaire.create({
      data: {
        companyId: societe.id,
        libelle: 'Compte cotisations et IR',
        banqueId: refs.banqueBpId,
        rib: '011780000987654321098765',
        iban: 'MA64011780000987654321098765',
        bic: 'BCPOMAMC',
        nomPayeur: RAISON_SOCIALE_DEMO,
        usageSalaires: false,
        usageCotisationsSociales: true,
        usageIR: true,
        etat: 'ACTIF',
      },
    });
  }

  // Rattachements etablissements (E6 : pas d auto-attachement massif).
  await prisma.compteBancaireEtablissement.upsert({
    where: {
      compteBancaireId_etablissementId: {
        compteBancaireId: compteSalaires.id,
        etablissementId: siege.id,
      },
    },
    update: {},
    create: { compteBancaireId: compteSalaires.id, etablissementId: siege.id },
  });
  await prisma.compteBancaireEtablissement.upsert({
    where: {
      compteBancaireId_etablissementId: {
        compteBancaireId: compteSalaires.id,
        etablissementId: atelier.id,
      },
    },
    update: {},
    create: { compteBancaireId: compteSalaires.id, etablissementId: atelier.id },
  });
  await prisma.compteBancaireEtablissement.upsert({
    where: {
      compteBancaireId_etablissementId: {
        compteBancaireId: compteCharges.id,
        etablissementId: siege.id,
      },
    },
    update: {},
    create: { compteBancaireId: compteCharges.id, etablissementId: siege.id },
  });

  console.log(
    `Comptes bancaires : ${compteSalaires.libelle} (salaires), ${compteCharges.libelle} (cotisations + IR)`
  );
}

async function upsertParamEtablissement(
  etablissementId: string,
  moisEffet: string,
  data: {
    dureeHebdomadaire: Decimal;
    jourReposHebdomadaire: 'DIMANCHE';
    teletravailAutorise: boolean | null;
    indemniteTeletravailVersee: boolean | null;
    montantIndemniteTeletravail: Decimal | null;
  }
) {
  return prisma.etablissementParametrageHistorique.upsert({
    where: {
      etablissementId_moisEffet: { etablissementId, moisEffet },
    },
    update: {
      dureeHebdomadaire: data.dureeHebdomadaire,
      jourReposHebdomadaire: data.jourReposHebdomadaire,
      teletravailAutorise: data.teletravailAutorise,
      indemniteTeletravailVersee: data.indemniteTeletravailVersee,
      montantIndemniteTeletravail: data.montantIndemniteTeletravail,
    },
    create: {
      etablissementId,
      moisEffet,
      dureeHebdomadaire: data.dureeHebdomadaire,
      jourReposHebdomadaire: data.jourReposHebdomadaire,
      teletravailAutorise: data.teletravailAutorise,
      indemniteTeletravailVersee: data.indemniteTeletravailVersee,
      montantIndemniteTeletravail: data.montantIndemniteTeletravail,
    },
  });
}

/**
 * Grille simple : 8 h normales du lundi au vendredi, 4 h le samedi, 0 le dimanche.
 * Total = 44 h. Heures mensuelles deduites via 52/12 ceil.
 */
async function seedGrilleHoraire(
  parametrageId: string,
  typeHeureNormaleId: string,
  heuresHebdo: Decimal,
  heuresMensuelles: Decimal
): Promise<void> {
  const repartition: { jour: 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI' | 'DIMANCHE'; heures: string }[] =
    [
      { jour: 'LUNDI', heures: '8' },
      { jour: 'MARDI', heures: '8' },
      { jour: 'MERCREDI', heures: '8' },
      { jour: 'JEUDI', heures: '8' },
      { jour: 'VENDREDI', heures: '8' },
      { jour: 'SAMEDI', heures: '4' },
      { jour: 'DIMANCHE', heures: '0' },
    ];

  for (const ligne of repartition) {
    await prisma.horaireDefautLigne.upsert({
      where: {
        etablissementParametrageHistoriqueId_jourSemaine_typeHeureId: {
          etablissementParametrageHistoriqueId: parametrageId,
          jourSemaine: ligne.jour,
          typeHeureId: typeHeureNormaleId,
        },
      },
      update: { nombreHeures: new Decimal(ligne.heures) },
      create: {
        etablissementParametrageHistoriqueId: parametrageId,
        jourSemaine: ligne.jour,
        typeHeureId: typeHeureNormaleId,
        nombreHeures: new Decimal(ligne.heures),
      },
    });
  }

  await prisma.horaireMensuelLigne.upsert({
    where: {
      etablissementParametrageHistoriqueId_typeHeureId: {
        etablissementParametrageHistoriqueId: parametrageId,
        typeHeureId: typeHeureNormaleId,
      },
    },
    update: { nombreHeures: heuresMensuelles },
    create: {
      etablissementParametrageHistoriqueId: parametrageId,
      typeHeureId: typeHeureNormaleId,
      nombreHeures: heuresMensuelles,
    },
  });

  // Controle interne du seed : la somme hebdo doit coller a dureeHebdomadaire.
  const somme = repartition.reduce(
    (acc, l) => acc.plus(l.heures),
    new Decimal(0)
  );
  if (!somme.equals(heuresHebdo)) {
    throw new Error(
      `Incoherence seed grille : somme=${somme.toString()} vs duree=${heuresHebdo.toString()}`
    );
  }
}

async function seedUtilisateurs(compteId: string): Promise<void> {
  const superAdmin = await prisma.user.upsert({
    where: { email: EMAIL_SUPER_ADMIN },
    update: { role: 'PLATFORM_ADMIN', accountId: null },
    create: { email: EMAIL_SUPER_ADMIN, role: 'PLATFORM_ADMIN', accountId: null },
  });

  console.log(`Super-admin plateforme : ${superAdmin.email} (${superAdmin.id}) - accountId=null`);

  const adminCompte = await prisma.user.upsert({
    where: { email: EMAIL_ADMIN_COMPTE },
    update: { role: 'ACCOUNT_ADMIN', accountId: compteId },
    create: { email: EMAIL_ADMIN_COMPTE, role: 'ACCOUNT_ADMIN', accountId: compteId },
  });

  console.log(`Administrateur de compte : ${adminCompte.email} (${adminCompte.id})`);
  console.log("Pour interroger l'API en developpement, utilisez l'en-tete :");
  console.log(`  x-paymarh-user-id: ${adminCompte.id}`);
  console.log('Back-office : definissez NEXT_PUBLIC_PAYMARH_USER_ID avec la meme valeur.');
  console.log('(Béquilles de developpement — pas une authentification. Bloquent toute mise en production.)');
}

async function main(): Promise<void> {
  const refs = await seedReferences();

  const compteExistant = await prisma.account.findFirst({
    where: { name: NOM_COMPTE_DEMO },
  });
  const compte =
    compteExistant ??
    (await prisma.account.create({
      data: { name: NOM_COMPTE_DEMO, type: 'CABINET' },
    }));

  await seedSocieteDemo(refs);
  await seedUtilisateurs(compte.id);

  console.log('\nSeed termine (module 0 + fiche societe 1.1.a + referentiels fiche salarie 2.1.a).');
}

main()
  .catch((erreur: unknown) => {
    console.error('Echec du seed :', erreur);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
