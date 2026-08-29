-- ---------------------------------------------------------------------------
-- Module 1 / etape 1.1.b — Corrections de schema avant l API
-- 1. Recopie name -> raisonSociale, puis suppression de name
-- 2. Ajout de moisEnCours (init = moisDebutMontage)
-- 3. FK composite Etablissement(companyId, accountId) -> Company(id, accountId)
-- ---------------------------------------------------------------------------

-- 1. Aligner raisonSociale sur name (source de verite historique module 0)
UPDATE "Company" SET "raisonSociale" = "name";

-- 2. moisEnCours : mois de paie en cours, initialise au debut de montage
ALTER TABLE "Company" ADD COLUMN "moisEnCours" TEXT;
UPDATE "Company" SET "moisEnCours" = "moisDebutMontage";
ALTER TABLE "Company" ALTER COLUMN "moisEnCours" SET NOT NULL;

-- 3. Retirer name
ALTER TABLE "Company" DROP COLUMN "name";

-- 4. Cible de la FK composite (id, accountId) est unique
CREATE UNIQUE INDEX "Company_id_accountId_key" ON "Company"("id", "accountId");

-- 5. Remplacer la FK simple Etablissement -> Company par une FK composite
ALTER TABLE "Etablissement" DROP CONSTRAINT "Etablissement_companyId_fkey";

ALTER TABLE "Etablissement"
ADD CONSTRAINT "Etablissement_companyId_accountId_fkey"
FOREIGN KEY ("companyId", "accountId") REFERENCES "Company"("id", "accountId")
ON DELETE CASCADE ON UPDATE CASCADE;
