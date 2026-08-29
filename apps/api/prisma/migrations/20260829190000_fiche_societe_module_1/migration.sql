-- ---------------------------------------------------------------------------
-- Module 1 / etape 1.1.a — Fiche societe, etablissements, historisation,
-- comptes bancaires, tables de reference.
--
-- Les societes du module 0 (libelle seul) sont retirees puis recrees par le
-- seed enrichi : leurs colonnes obligatoires n avaient pas de valeur.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "RegimeDeBase" AS ENUM ('NON_AGRICOLE');

-- CreateEnum
CREATE TYPE "PeriodicitePaie" AS ENUM ('MENSUEL');

-- CreateEnum
CREATE TYPE "EtatDossier" AS ENUM ('EN_MONTAGE', 'EN_PRODUCTION', 'INACTIVE');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "EtatCompteBancaire" AS ENUM ('ACTIF', 'CLOTURE');

-- CreateEnum
CREATE TYPE "TypeJourFerie" AS ENUM ('CIVIL', 'RELIGIEUX');

-- CreateTable (references d abord : Company en depend)
CREATE TABLE "FormeJuridique" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "FormeJuridique_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FormeJuridique_code_key" ON "FormeJuridique"("code");

CREATE TABLE "Banque" (
    "id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "ancienNom" TEXT,
    "codeBanque" TEXT,
    "couleur" TEXT NOT NULL,

    CONSTRAINT "Banque_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JourFerie" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "referenceDate" TEXT NOT NULL,
    "type" "TypeJourFerie" NOT NULL,

    CONSTRAINT "JourFerie_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JourFerie_code_key" ON "JourFerie"("code");

CREATE TABLE "TypeHeure" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,

    CONSTRAINT "TypeHeure_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TypeHeure_code_key" ON "TypeHeure"("code");

CREATE TABLE "TypeExoneration" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "TypeExoneration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TypeExoneration_code_key" ON "TypeExoneration"("code");

-- Les societes module 0 n ont pas les champs obligatoires : on les retire.
-- Le seed recree la societe de demonstration complete.
DELETE FROM "Company";

-- AlterTable Company
ALTER TABLE "Company"
ADD COLUMN "activiteExercee" TEXT,
ADD COLUMN "calculAutoAbsencesEntreesSorties" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "codeDossier" TEXT NOT NULL,
ADD COLUMN "dateCessationActivite" DATE,
ADD COLUMN "dateCreation" DATE,
ADD COLUMN "dateInactivite" TEXT,
ADD COLUMN "etatDossier" "EtatDossier" NOT NULL,
ADD COLUMN "formeJuridiqueId" UUID NOT NULL,
ADD COLUMN "identifiantFiscal" TEXT,
ADD COLUMN "matriculeGenerationAuto" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "matriculeLongueur" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN "matriculePrefixe" TEXT,
ADD COLUMN "moisDebutMontage" TEXT NOT NULL,
ADD COLUMN "moisDebutProduction" TEXT NOT NULL,
ADD COLUMN "nomCommercial" TEXT,
ADD COLUMN "periodicitePaie" "PeriodicitePaie" NOT NULL DEFAULT 'MENSUEL',
ADD COLUMN "raisonSociale" TEXT NOT NULL,
ADD COLUMN "regimeDeBase" "RegimeDeBase" NOT NULL DEFAULT 'NON_AGRICOLE',
ADD COLUMN "registreCommerce" TEXT,
ADD COLUMN "signataireCivilite" TEXT,
ADD COLUMN "signataireNom" TEXT,
ADD COLUMN "signatairePrenom" TEXT,
ADD COLUMN "signataireQualite" TEXT,
ADD COLUMN "siteWeb" TEXT,
ADD COLUMN "tribunalRegistreCommerce" TEXT;

CREATE INDEX "Company_formeJuridiqueId_idx" ON "Company"("formeJuridiqueId");
CREATE UNIQUE INDEX "Company_accountId_codeDossier_key" ON "Company"("accountId", "codeDossier");
CREATE UNIQUE INDEX "Company_accountId_identifiantFiscal_key" ON "Company"("accountId", "identifiantFiscal");

ALTER TABLE "Company" ADD CONSTRAINT "Company_formeJuridiqueId_fkey" FOREIGN KEY ("formeJuridiqueId") REFERENCES "FormeJuridique"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Etablissement
CREATE TABLE "Etablissement" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nom" TEXT NOT NULL,
    "estPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "adresse" TEXT NOT NULL,
    "complementAdresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'MA',
    "ice" TEXT,
    "taxeProfessionnelle" TEXT,
    "telephone" TEXT,
    "email" TEXT,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Etablissement_companyId_idx" ON "Etablissement"("companyId");
CREATE INDEX "Etablissement_accountId_idx" ON "Etablissement"("accountId");
CREATE UNIQUE INDEX "Etablissement_accountId_ice_key" ON "Etablissement"("accountId", "ice");

-- Exactement un etablissement principal par societe (index unique partiel).
CREATE UNIQUE INDEX "Etablissement_un_seul_principal_par_societe"
ON "Etablissement" ("companyId")
WHERE "estPrincipal" = true;

ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Historisation societe
CREATE TABLE "CompanyParametrageHistorique" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "moisEffet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moisClotureConges" INTEGER NOT NULL DEFAULT 12,
    "typeExonerationId" UUID,
    "exonerationDateDebut" TEXT,
    "exonerationDateFin" TEXT,

    CONSTRAINT "CompanyParametrageHistorique_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompanyParametrageHistorique_companyId_idx" ON "CompanyParametrageHistorique"("companyId");
CREATE INDEX "CompanyParametrageHistorique_typeExonerationId_idx" ON "CompanyParametrageHistorique"("typeExonerationId");
CREATE UNIQUE INDEX "CompanyParametrageHistorique_companyId_moisEffet_key" ON "CompanyParametrageHistorique"("companyId", "moisEffet");

ALTER TABLE "CompanyParametrageHistorique" ADD CONSTRAINT "CompanyParametrageHistorique_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyParametrageHistorique" ADD CONSTRAINT "CompanyParametrageHistorique_typeExonerationId_fkey" FOREIGN KEY ("typeExonerationId") REFERENCES "TypeExoneration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Historisation etablissement
CREATE TABLE "EtablissementParametrageHistorique" (
    "id" UUID NOT NULL,
    "etablissementId" UUID NOT NULL,
    "moisEffet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dureeHebdomadaire" DECIMAL(8,2) NOT NULL DEFAULT 44,
    "jourReposHebdomadaire" "JourSemaine" NOT NULL DEFAULT 'DIMANCHE',
    "teletravailAutorise" BOOLEAN,
    "indemniteTeletravailVersee" BOOLEAN,
    "montantIndemniteTeletravail" DECIMAL(14,2),

    CONSTRAINT "EtablissementParametrageHistorique_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EtablissementParametrageHistorique_etablissementId_idx" ON "EtablissementParametrageHistorique"("etablissementId");
CREATE UNIQUE INDEX "EtablissementParametrageHistorique_etablissementId_moisEffe_key" ON "EtablissementParametrageHistorique"("etablissementId", "moisEffet");

ALTER TABLE "EtablissementParametrageHistorique" ADD CONSTRAINT "EtablissementParametrageHistorique_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grille horaire
CREATE TABLE "HoraireDefautLigne" (
    "id" UUID NOT NULL,
    "etablissementParametrageHistoriqueId" UUID NOT NULL,
    "jourSemaine" "JourSemaine" NOT NULL,
    "typeHeureId" UUID NOT NULL,
    "nombreHeures" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "HoraireDefautLigne_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HoraireDefautLigne_typeHeureId_idx" ON "HoraireDefautLigne"("typeHeureId");
CREATE UNIQUE INDEX "HoraireDefautLigne_etablissementParametrageHistoriqueId_jou_key" ON "HoraireDefautLigne"("etablissementParametrageHistoriqueId", "jourSemaine", "typeHeureId");

ALTER TABLE "HoraireDefautLigne" ADD CONSTRAINT "HoraireDefautLigne_etablissementParametrageHistoriqueId_fkey" FOREIGN KEY ("etablissementParametrageHistoriqueId") REFERENCES "EtablissementParametrageHistorique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HoraireDefautLigne" ADD CONSTRAINT "HoraireDefautLigne_typeHeureId_fkey" FOREIGN KEY ("typeHeureId") REFERENCES "TypeHeure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "HoraireMensuelLigne" (
    "id" UUID NOT NULL,
    "etablissementParametrageHistoriqueId" UUID NOT NULL,
    "typeHeureId" UUID NOT NULL,
    "nombreHeures" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "HoraireMensuelLigne_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HoraireMensuelLigne_typeHeureId_idx" ON "HoraireMensuelLigne"("typeHeureId");
CREATE UNIQUE INDEX "HoraireMensuelLigne_etablissementParametrageHistoriqueId_ty_key" ON "HoraireMensuelLigne"("etablissementParametrageHistoriqueId", "typeHeureId");

ALTER TABLE "HoraireMensuelLigne" ADD CONSTRAINT "HoraireMensuelLigne_etablissementParametrageHistoriqueId_fkey" FOREIGN KEY ("etablissementParametrageHistoriqueId") REFERENCES "EtablissementParametrageHistorique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HoraireMensuelLigne" ADD CONSTRAINT "HoraireMensuelLigne_typeHeureId_fkey" FOREIGN KEY ("typeHeureId") REFERENCES "TypeHeure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Jours feries travailles
CREATE TABLE "JourFerieTravaille" (
    "etablissementParametrageHistoriqueId" UUID NOT NULL,
    "jourFerieId" UUID NOT NULL,

    CONSTRAINT "JourFerieTravaille_pkey" PRIMARY KEY ("etablissementParametrageHistoriqueId","jourFerieId")
);

CREATE INDEX "JourFerieTravaille_jourFerieId_idx" ON "JourFerieTravaille"("jourFerieId");

ALTER TABLE "JourFerieTravaille" ADD CONSTRAINT "JourFerieTravaille_etablissementParametrageHistoriqueId_fkey" FOREIGN KEY ("etablissementParametrageHistoriqueId") REFERENCES "EtablissementParametrageHistorique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourFerieTravaille" ADD CONSTRAINT "JourFerieTravaille_jourFerieId_fkey" FOREIGN KEY ("jourFerieId") REFERENCES "JourFerie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comptes bancaires
CREATE TABLE "CompteBancaire" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT,
    "banqueId" UUID,
    "banqueSaisieLibre" TEXT,
    "rib" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "nomPayeur" TEXT,
    "usageSalaires" BOOLEAN NOT NULL DEFAULT false,
    "usageCotisationsSociales" BOOLEAN NOT NULL DEFAULT false,
    "usageIR" BOOLEAN NOT NULL DEFAULT false,
    "etat" "EtatCompteBancaire" NOT NULL DEFAULT 'ACTIF',

    CONSTRAINT "CompteBancaire_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CompteBancaire_companyId_idx" ON "CompteBancaire"("companyId");
CREATE INDEX "CompteBancaire_banqueId_idx" ON "CompteBancaire"("banqueId");

ALTER TABLE "CompteBancaire" ADD CONSTRAINT "CompteBancaire_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompteBancaire" ADD CONSTRAINT "CompteBancaire_banqueId_fkey" FOREIGN KEY ("banqueId") REFERENCES "Banque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CompteBancaireEtablissement" (
    "compteBancaireId" UUID NOT NULL,
    "etablissementId" UUID NOT NULL,

    CONSTRAINT "CompteBancaireEtablissement_pkey" PRIMARY KEY ("compteBancaireId","etablissementId")
);

CREATE INDEX "CompteBancaireEtablissement_etablissementId_idx" ON "CompteBancaireEtablissement"("etablissementId");

ALTER TABLE "CompteBancaireEtablissement" ADD CONSTRAINT "CompteBancaireEtablissement_compteBancaireId_fkey" FOREIGN KEY ("compteBancaireId") REFERENCES "CompteBancaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompteBancaireEtablissement" ADD CONSTRAINT "CompteBancaireEtablissement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
