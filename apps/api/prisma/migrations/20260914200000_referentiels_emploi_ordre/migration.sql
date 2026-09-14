-- L ordre d un referentiel est porte par la donnee, jamais par un tri alphabetique.
-- Pas de contrainte d unicite sur ordre : la liste reste extensible sans reecriture.

ALTER TABLE "TypeContrat" ADD COLUMN "ordre" INTEGER;

UPDATE "TypeContrat" SET "ordre" = 1 WHERE "code" = 'CDI';
UPDATE "TypeContrat" SET "ordre" = 2 WHERE "code" = 'CDD';
UPDATE "TypeContrat" SET "ordre" = 3 WHERE "code" = 'CTT';
UPDATE "TypeContrat" SET "ordre" = 4 WHERE "code" = 'INT_CDI';
UPDATE "TypeContrat" SET "ordre" = 5 WHERE "code" = 'OBJ';
UPDATE "TypeContrat" SET "ordre" = 6 WHERE "code" = 'STAGE';
UPDATE "TypeContrat" SET "ordre" = 7 WHERE "code" = 'MANDAT';

ALTER TABLE "TypeContrat" ALTER COLUMN "ordre" SET NOT NULL;

ALTER TABLE "MotifSortie" ADD COLUMN "ordre" INTEGER;

UPDATE "MotifSortie" SET "ordre" = 1 WHERE "code" = 'DEMISSION';
UPDATE "MotifSortie" SET "ordre" = 2 WHERE "code" = 'LIC_FAUTE_SIMPLE';
UPDATE "MotifSortie" SET "ordre" = 3 WHERE "code" = 'LIC_FAUTE_GRAVE';
UPDATE "MotifSortie" SET "ordre" = 4 WHERE "code" = 'LIC_FAUTE_LOURDE';
UPDATE "MotifSortie" SET "ordre" = 5 WHERE "code" = 'LIC_ECONOMIQUE';
UPDATE "MotifSortie" SET "ordre" = 6 WHERE "code" = 'FIN_CDD';
UPDATE "MotifSortie" SET "ordre" = 7 WHERE "code" = 'COMMUN_ACCORD';
UPDATE "MotifSortie" SET "ordre" = 8 WHERE "code" = 'RUPTURE_ESSAI';
UPDATE "MotifSortie" SET "ordre" = 9 WHERE "code" = 'RETRAITE_VOLONTAIRE';
UPDATE "MotifSortie" SET "ordre" = 10 WHERE "code" = 'RETRAITE_OFFICE';
UPDATE "MotifSortie" SET "ordre" = 11 WHERE "code" = 'FORCE_MAJEURE';
UPDATE "MotifSortie" SET "ordre" = 12 WHERE "code" = 'DETACHEMENT';
UPDATE "MotifSortie" SET "ordre" = 13 WHERE "code" = 'DECES';

ALTER TABLE "MotifSortie" ALTER COLUMN "ordre" SET NOT NULL;

ALTER TABLE "StatutParticulier" ADD COLUMN "ordre" INTEGER;

UPDATE "StatutParticulier" SET "ordre" = 1 WHERE "code" = 'IDMAJ';
UPDATE "StatutParticulier" SET "ordre" = 2 WHERE "code" = 'TAHFIZ';

ALTER TABLE "StatutParticulier" ALTER COLUMN "ordre" SET NOT NULL;
