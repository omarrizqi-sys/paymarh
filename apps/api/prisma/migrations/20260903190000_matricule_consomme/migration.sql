-- CreateTable
CREATE TABLE "MatriculeConsomme" (
    "companyId" UUID NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "MatriculeConsomme_pkey" PRIMARY KEY ("companyId","valeur")
);

-- AddForeignKey
ALTER TABLE "MatriculeConsomme" ADD CONSTRAINT "MatriculeConsomme_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill : les matricules encore portes par un salarie sont marques consommes.
-- Les valeurs des salaries deja supprimes avant cette migration sont perdues
-- (aucun historique n existe plus) — meme limite que la reprise de dossier.
INSERT INTO "MatriculeConsomme" ("companyId", "valeur")
SELECT "companyId", "matricule" FROM "Salarie"
ON CONFLICT DO NOTHING;
