-- CreateEnum
CREATE TYPE "Sexe" AS ENUM ('HOMME', 'FEMME');

-- CreateEnum
CREATE TYPE "StatutCadre" AS ENUM ('CADRE', 'NON_CADRE');

-- CreateEnum
CREATE TYPE "ModeDeterminationSalaire" AS ENUM ('BRUT_MENSUEL', 'BRUT_HORAIRE', 'NET_CIBLE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('VIREMENT', 'CHEQUE', 'ESPECES');

-- CreateEnum
CREATE TYPE "BaseSaisieDuree" AS ENUM ('HEBDOMADAIRE', 'MENSUELLE');

-- CreateEnum
CREATE TYPE "OrigineStatut" AS ENUM ('SAISIE_MANUELLE', 'PROPAGE_SOCIETE');

-- CreateEnum
CREATE TYPE "BlocHistorise" AS ENUM ('CONTRAT', 'REMUNERATION', 'AFFECTATION_TEMPS_DE_TRAVAIL', 'PERSONNES_A_CHARGE', 'RETENUES');

-- CreateTable
CREATE TABLE "Pays" (
    "id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "codeIso" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "Pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeContrat" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "TypeContrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotifSortie" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "MotifSortie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutParticulier" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "StatutParticulier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SituationFamiliale" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelleMasculin" TEXT NOT NULL,
    "libelleFeminin" TEXT NOT NULL,

    CONSTRAINT "SituationFamiliale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LienParente" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "LienParente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Salarie" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sexe" "Sexe" NOT NULL,
    "dateNaissance" DATE NOT NULL,
    "villeNaissance" TEXT,
    "paysNaissanceId" UUID,
    "nationaliteId" UUID,
    "situationFamilialeCode" TEXT,
    "numeroPiece" TEXT,
    "numeroCnss" TEXT,
    "numeroCimr" TEXT,
    "adresse" TEXT,
    "complementAdresse" TEXT,
    "ville" TEXT,
    "codePostal" TEXT,
    "paysId" UUID,
    "telephonePersonnel" TEXT,
    "telephoneProfessionnel" TEXT,
    "emailPersonnel" TEXT,
    "emailProfessionnel" TEXT,
    "urgencePrenom" TEXT,
    "urgenceNom" TEXT,
    "urgenceTelephone" TEXT,
    "urgenceEmail" TEXT,
    "dateEntree" DATE NOT NULL,
    "dateAnciennete" DATE NOT NULL,

    CONSTRAINT "Salarie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emploi" (
    "id" UUID NOT NULL,
    "salarieId" UUID NOT NULL,
    "numeroOrdre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Emploi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploiContratVersion" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "moisEffet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libellePoste" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "typeContratCode" TEXT NOT NULL,
    "periodeEssaiDateFin" DATE,
    "renouvellementEssaiDateFin" DATE,
    "statutCadre" "StatutCadre",
    "coefficient" TEXT,
    "position" TEXT,
    "indice" TEXT,
    "dateSortie" DATE,
    "motifSortieCode" TEXT,

    CONSTRAINT "EmploiContratVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploiRemunerationVersion" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "moisEffet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "modeDeterminationSalaire" "ModeDeterminationSalaire" NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "masquerNombreHeures" BOOLEAN NOT NULL DEFAULT false,
    "masquerTauxHoraire" BOOLEAN NOT NULL DEFAULT false,
    "bulletinTousLesMois" BOOLEAN NOT NULL DEFAULT true,
    "moisProduction" INTEGER[],
    "modePaiement" "ModePaiement",
    "compteBancaireId" UUID,
    "teletravailIndemniteVersee" BOOLEAN,
    "teletravailMontant" DECIMAL(14,2),

    CONSTRAINT "EmploiRemunerationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploiAffectationVersion" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "moisEffet" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "etablissementId" UUID NOT NULL,
    "departementRef" TEXT,
    "serviceRef" TEXT,
    "baseSaisieDuree" "BaseSaisieDuree" NOT NULL,
    "dureeContractuelle" DECIMAL(8,2),
    "repartitionHoraireRef" TEXT,
    "reposHebdomadaire" "JourSemaine",
    "suivreJoursFeriesEtablissement" BOOLEAN NOT NULL DEFAULT true,
    "teletravailAutorise" BOOLEAN,

    CONSTRAINT "EmploiAffectationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonneACharge" (
    "id" UUID NOT NULL,
    "salarieId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lienParenteCode" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sexe" "Sexe" NOT NULL,
    "dateNaissance" DATE NOT NULL,
    "aCharge" BOOLEAN NOT NULL,
    "situationHandicap" BOOLEAN NOT NULL DEFAULT false,
    "moisEffetDebut" TEXT NOT NULL,
    "moisEffetFin" TEXT,

    CONSTRAINT "PersonneACharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteBancaireSalarie" (
    "id" UUID NOT NULL,
    "salarieId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "banqueId" UUID,
    "banqueLibreSaisie" TEXT,
    "rib" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "titulaire" TEXT,
    "partVirement" DECIMAL(5,2),

    CONSTRAINT "CompteBancaireSalarie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pret" (
    "id" UUID NOT NULL,
    "salarieId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "libelleObjet" TEXT NOT NULL,
    "libelleBulletin" TEXT NOT NULL,
    "montantTotal" DECIMAL(14,2) NOT NULL,
    "moisDebut" TEXT NOT NULL,
    "mensualite" DECIMAL(14,2) NOT NULL,
    "nombreEcheances" INTEGER NOT NULL,
    "moisEffetDebut" TEXT NOT NULL,
    "moisEffetFin" TEXT,

    CONSTRAINT "Pret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaisieSurSalaire" (
    "id" UUID NOT NULL,
    "salarieId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referenceDecision" TEXT NOT NULL,
    "creancier" TEXT NOT NULL,
    "libelleBulletin" TEXT NOT NULL,
    "montantTotal" DECIMAL(14,2) NOT NULL,
    "montantMensuel" DECIMAL(14,2) NOT NULL,
    "moisDebut" TEXT NOT NULL,
    "moisEffetDebut" TEXT NOT NULL,
    "moisEffetFin" TEXT,

    CONSTRAINT "SaisieSurSalaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimeContractuelle" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "primeRef" TEXT NOT NULL,
    "moisApplication" INTEGER[],

    CONSTRAINT "PrimeContractuelle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvantageEnNature" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "natureRef" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "moisApplication" INTEGER[],
    "moisEffetDebut" TEXT NOT NULL,
    "moisEffetFin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvantageEnNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutParticulierLigne" (
    "id" UUID NOT NULL,
    "emploiId" UUID NOT NULL,
    "statutCode" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE,
    "origine" "OrigineStatut" NOT NULL DEFAULT 'SAISIE_MANUELLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutParticulierLigne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploiJourFerieTravaille" (
    "emploiId" UUID NOT NULL,
    "jourFerieId" UUID NOT NULL,
    "moisEffetDebut" TEXT NOT NULL,
    "moisEffetFin" TEXT,

    CONSTRAINT "EmploiJourFerieTravaille_pkey" PRIMARY KEY ("emploiId","jourFerieId","moisEffetDebut")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pays_ordre_key" ON "Pays"("ordre");

-- CreateIndex
CREATE UNIQUE INDEX "Pays_codeIso_key" ON "Pays"("codeIso");

-- CreateIndex
CREATE UNIQUE INDEX "TypeContrat_code_key" ON "TypeContrat"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MotifSortie_code_key" ON "MotifSortie"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StatutParticulier_code_key" ON "StatutParticulier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SituationFamiliale_code_key" ON "SituationFamiliale"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LienParente_code_key" ON "LienParente"("code");

-- CreateIndex
CREATE INDEX "Salarie_companyId_idx" ON "Salarie"("companyId");

-- CreateIndex
CREATE INDEX "Salarie_paysNaissanceId_idx" ON "Salarie"("paysNaissanceId");

-- CreateIndex
CREATE INDEX "Salarie_nationaliteId_idx" ON "Salarie"("nationaliteId");

-- CreateIndex
CREATE INDEX "Salarie_paysId_idx" ON "Salarie"("paysId");

-- CreateIndex
CREATE INDEX "Salarie_situationFamilialeCode_idx" ON "Salarie"("situationFamilialeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Salarie_companyId_matricule_key" ON "Salarie"("companyId", "matricule");

-- CreateIndex
CREATE INDEX "Emploi_salarieId_idx" ON "Emploi"("salarieId");

-- CreateIndex
CREATE UNIQUE INDEX "Emploi_salarieId_numeroOrdre_key" ON "Emploi"("salarieId", "numeroOrdre");

-- CreateIndex
CREATE INDEX "EmploiContratVersion_emploiId_idx" ON "EmploiContratVersion"("emploiId");

-- CreateIndex
CREATE INDEX "EmploiContratVersion_typeContratCode_idx" ON "EmploiContratVersion"("typeContratCode");

-- CreateIndex
CREATE INDEX "EmploiContratVersion_motifSortieCode_idx" ON "EmploiContratVersion"("motifSortieCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmploiContratVersion_emploiId_moisEffet_key" ON "EmploiContratVersion"("emploiId", "moisEffet");

-- CreateIndex
CREATE INDEX "EmploiRemunerationVersion_emploiId_idx" ON "EmploiRemunerationVersion"("emploiId");

-- CreateIndex
CREATE INDEX "EmploiRemunerationVersion_compteBancaireId_idx" ON "EmploiRemunerationVersion"("compteBancaireId");

-- CreateIndex
CREATE UNIQUE INDEX "EmploiRemunerationVersion_emploiId_moisEffet_key" ON "EmploiRemunerationVersion"("emploiId", "moisEffet");

-- CreateIndex
CREATE INDEX "EmploiAffectationVersion_emploiId_idx" ON "EmploiAffectationVersion"("emploiId");

-- CreateIndex
CREATE INDEX "EmploiAffectationVersion_etablissementId_idx" ON "EmploiAffectationVersion"("etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "EmploiAffectationVersion_emploiId_moisEffet_key" ON "EmploiAffectationVersion"("emploiId", "moisEffet");

-- CreateIndex
CREATE INDEX "PersonneACharge_salarieId_idx" ON "PersonneACharge"("salarieId");

-- CreateIndex
CREATE INDEX "PersonneACharge_lienParenteCode_idx" ON "PersonneACharge"("lienParenteCode");

-- CreateIndex
CREATE INDEX "CompteBancaireSalarie_salarieId_idx" ON "CompteBancaireSalarie"("salarieId");

-- CreateIndex
CREATE INDEX "CompteBancaireSalarie_banqueId_idx" ON "CompteBancaireSalarie"("banqueId");

-- CreateIndex
CREATE INDEX "Pret_salarieId_idx" ON "Pret"("salarieId");

-- CreateIndex
CREATE INDEX "SaisieSurSalaire_salarieId_idx" ON "SaisieSurSalaire"("salarieId");

-- CreateIndex
CREATE INDEX "PrimeContractuelle_emploiId_idx" ON "PrimeContractuelle"("emploiId");

-- CreateIndex
CREATE INDEX "AvantageEnNature_emploiId_idx" ON "AvantageEnNature"("emploiId");

-- CreateIndex
CREATE INDEX "StatutParticulierLigne_emploiId_idx" ON "StatutParticulierLigne"("emploiId");

-- CreateIndex
CREATE INDEX "StatutParticulierLigne_statutCode_idx" ON "StatutParticulierLigne"("statutCode");

-- CreateIndex
CREATE INDEX "EmploiJourFerieTravaille_jourFerieId_idx" ON "EmploiJourFerieTravaille"("jourFerieId");

-- AddForeignKey
ALTER TABLE "Salarie" ADD CONSTRAINT "Salarie_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salarie" ADD CONSTRAINT "Salarie_paysNaissanceId_fkey" FOREIGN KEY ("paysNaissanceId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salarie" ADD CONSTRAINT "Salarie_nationaliteId_fkey" FOREIGN KEY ("nationaliteId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salarie" ADD CONSTRAINT "Salarie_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Salarie" ADD CONSTRAINT "Salarie_situationFamilialeCode_fkey" FOREIGN KEY ("situationFamilialeCode") REFERENCES "SituationFamiliale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emploi" ADD CONSTRAINT "Emploi_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiContratVersion" ADD CONSTRAINT "EmploiContratVersion_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiContratVersion" ADD CONSTRAINT "EmploiContratVersion_typeContratCode_fkey" FOREIGN KEY ("typeContratCode") REFERENCES "TypeContrat"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiContratVersion" ADD CONSTRAINT "EmploiContratVersion_motifSortieCode_fkey" FOREIGN KEY ("motifSortieCode") REFERENCES "MotifSortie"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiRemunerationVersion" ADD CONSTRAINT "EmploiRemunerationVersion_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiRemunerationVersion" ADD CONSTRAINT "EmploiRemunerationVersion_compteBancaireId_fkey" FOREIGN KEY ("compteBancaireId") REFERENCES "CompteBancaireSalarie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiAffectationVersion" ADD CONSTRAINT "EmploiAffectationVersion_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiAffectationVersion" ADD CONSTRAINT "EmploiAffectationVersion_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonneACharge" ADD CONSTRAINT "PersonneACharge_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonneACharge" ADD CONSTRAINT "PersonneACharge_lienParenteCode_fkey" FOREIGN KEY ("lienParenteCode") REFERENCES "LienParente"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteBancaireSalarie" ADD CONSTRAINT "CompteBancaireSalarie_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteBancaireSalarie" ADD CONSTRAINT "CompteBancaireSalarie_banqueId_fkey" FOREIGN KEY ("banqueId") REFERENCES "Banque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pret" ADD CONSTRAINT "Pret_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaisieSurSalaire" ADD CONSTRAINT "SaisieSurSalaire_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimeContractuelle" ADD CONSTRAINT "PrimeContractuelle_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvantageEnNature" ADD CONSTRAINT "AvantageEnNature_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatutParticulierLigne" ADD CONSTRAINT "StatutParticulierLigne_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatutParticulierLigne" ADD CONSTRAINT "StatutParticulierLigne_statutCode_fkey" FOREIGN KEY ("statutCode") REFERENCES "StatutParticulier"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiJourFerieTravaille" ADD CONSTRAINT "EmploiJourFerieTravaille_emploiId_fkey" FOREIGN KEY ("emploiId") REFERENCES "Emploi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiJourFerieTravaille" ADD CONSTRAINT "EmploiJourFerieTravaille_jourFerieId_fkey" FOREIGN KEY ("jourFerieId") REFERENCES "JourFerie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Unicite partielle par societe si renseigne (plusieurs NULL autorises).
CREATE UNIQUE INDEX "Salarie_companyId_numeroPiece_key"
ON "Salarie" ("companyId", "numeroPiece")
WHERE "numeroPiece" IS NOT NULL;

CREATE UNIQUE INDEX "Salarie_companyId_numeroCnss_key"
ON "Salarie" ("companyId", "numeroCnss")
WHERE "numeroCnss" IS NOT NULL;
