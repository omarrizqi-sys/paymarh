-- Referentiels provisoires primes et natures d avantage en nature.
-- Ordre des operations : catalogues crees et peuples, reprise des codes demo,
-- puis contraintes de cle etrangere.

CREATE TABLE "PrimeReferentiel" (
    "id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "PrimeReferentiel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NatureAvantageEnNature" (
    "id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "NatureAvantageEnNature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrimeReferentiel_code_key" ON "PrimeReferentiel"("code");
CREATE UNIQUE INDEX "NatureAvantageEnNature_code_key" ON "NatureAvantageEnNature"("code");

INSERT INTO "PrimeReferentiel" ("id", "ordre", "code", "libelle") VALUES
  (gen_random_uuid(), 10, 'A04', 'Prime de panier'),
  (gen_random_uuid(), 20, 'A15', 'Indemnité de transport'),
  (gen_random_uuid(), 30, 'A24', 'Indemnité de représentation'),
  (gen_random_uuid(), 40, 'A36', 'Prime d’ancienneté'),
  (gen_random_uuid(), 50, 'A38', 'Prime d’assiduité'),
  (gen_random_uuid(), 60, 'A39', 'Prime de fin d’année'),
  (gen_random_uuid(), 70, 'A40', 'Prime de 13e mois'),
  (gen_random_uuid(), 80, 'A41', 'Prime de vacances'),
  (gen_random_uuid(), 90, 'A42', 'Prime de polyvalence'),
  (gen_random_uuid(), 100, 'A43', 'Prime de production'),
  (gen_random_uuid(), 110, 'A44', 'Prime de rendement'),
  (gen_random_uuid(), 120, 'A45', 'Prime de responsabilité'),
  (gen_random_uuid(), 130, 'A47', 'Prime de qualité'),
  (gen_random_uuid(), 140, 'A49', 'Prime d’astreinte'),
  (gen_random_uuid(), 150, 'A50', 'Prime de risque');

INSERT INTO "NatureAvantageEnNature" ("id", "ordre", "code", "libelle") VALUES
  (gen_random_uuid(), 10, 'B01', 'Logement de fonction'),
  (gen_random_uuid(), 20, 'B02', 'Voiture de fonction'),
  (gen_random_uuid(), 30, 'B03', 'Nourriture');

UPDATE "PrimeContractuelle" SET "primeRef" = 'A15' WHERE "primeRef" = 'PRIME-TRANSPORT';
UPDATE "AvantageEnNature" SET "natureRef" = 'B02' WHERE "natureRef" = 'VOITURE';
UPDATE "AvantageEnNature" SET "natureRef" = 'B01' WHERE "natureRef" = 'LOGEMENT';
UPDATE "AvantageEnNature" SET "natureRef" = 'B03' WHERE "natureRef" = 'NOURRITURE';

ALTER TABLE "PrimeContractuelle" ADD CONSTRAINT "PrimeContractuelle_primeRef_fkey" FOREIGN KEY ("primeRef") REFERENCES "PrimeReferentiel"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AvantageEnNature" ADD CONSTRAINT "AvantageEnNature_natureRef_fkey" FOREIGN KEY ("natureRef") REFERENCES "NatureAvantageEnNature"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "PrimeContractuelle_primeRef_idx" ON "PrimeContractuelle"("primeRef");
CREATE INDEX "AvantageEnNature_natureRef_idx" ON "AvantageEnNature"("natureRef");
