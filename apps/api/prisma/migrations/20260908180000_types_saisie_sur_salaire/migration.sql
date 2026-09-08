-- Types de saisie sur salaire (referentiel) et refonte du modele SaisieSurSalaire (2.c-0).

CREATE TABLE "TypeSaisieSurSalaire" (
    "id" UUID NOT NULL,
    "ordre" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,

    CONSTRAINT "TypeSaisieSurSalaire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TypeSaisieSurSalaire_code_key" ON "TypeSaisieSurSalaire"("code");
CREATE UNIQUE INDEX "TypeSaisieSurSalaire_ordre_key" ON "TypeSaisieSurSalaire"("ordre");

INSERT INTO "TypeSaisieSurSalaire" ("id", "ordre", "code", "libelle") VALUES
    (gen_random_uuid(), 1, 'PENSION_ALIMENTAIRE', 'Pension alimentaire'),
    (gen_random_uuid(), 2, 'TIERS_DETENTEUR', 'Saisie à tiers détenteur');

-- Colonnes nouvelles et nullabilite des montants.
ALTER TABLE "SaisieSurSalaire" ADD COLUMN "typeSaisieCode" TEXT;
ALTER TABLE "SaisieSurSalaire" ADD COLUMN "moisFin" TEXT;
ALTER TABLE "SaisieSurSalaire" ALTER COLUMN "montantTotal" DROP NOT NULL;
ALTER TABLE "SaisieSurSalaire" ALTER COLUMN "montantMensuel" DROP NOT NULL;

-- Lignes existantes : rattachement au type tiers detenteur, conservation du montant total,
-- suppression du montant mensuel (desormais calcule au bulletin pour ce type).
UPDATE "SaisieSurSalaire"
SET
    "typeSaisieCode" = 'TIERS_DETENTEUR',
    "montantMensuel" = NULL
WHERE "typeSaisieCode" IS NULL;

ALTER TABLE "SaisieSurSalaire" ALTER COLUMN "typeSaisieCode" SET NOT NULL;

CREATE INDEX "SaisieSurSalaire_typeSaisieCode_idx" ON "SaisieSurSalaire"("typeSaisieCode");

ALTER TABLE "SaisieSurSalaire" ADD CONSTRAINT "SaisieSurSalaire_typeSaisieCode_fkey"
    FOREIGN KEY ("typeSaisieCode") REFERENCES "TypeSaisieSurSalaire"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
