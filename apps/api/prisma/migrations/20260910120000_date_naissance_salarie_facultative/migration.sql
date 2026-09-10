-- Date de naissance facultative : un dossier ancien peut ne pas l avoir.
-- Absence plutot qu une date inventee. Aucune ligne existante n est touchee.

ALTER TABLE "Salarie" ALTER COLUMN "dateNaissance" DROP NOT NULL;
