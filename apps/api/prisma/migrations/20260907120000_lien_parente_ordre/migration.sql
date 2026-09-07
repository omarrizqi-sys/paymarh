-- L'ordre d'un referentiel est porte par la donnee, jamais par un tri alphabetique
-- ni par un tri d'affichage. Meme regle que pour les pays, ou le Maroc est en tete
-- par la donnee.

ALTER TABLE "LienParente" ADD COLUMN "ordre" INTEGER;

UPDATE "LienParente" SET "ordre" = 1 WHERE "code" = 'ENFANT';
UPDATE "LienParente" SET "ordre" = 2 WHERE "code" = 'CONJOINT';

ALTER TABLE "LienParente" ALTER COLUMN "ordre" SET NOT NULL;

CREATE UNIQUE INDEX "LienParente_ordre_key" ON "LienParente"("ordre");
