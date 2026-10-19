-- Montant de remuneration facultatif : un emploi peut etre cree avant que le
-- salaire ne soit connu. Absence plutot qu un montant invente. Aucune ligne
-- existante n est touchee.

ALTER TABLE "EmploiRemunerationVersion" ALTER COLUMN "montant" DROP NOT NULL;
