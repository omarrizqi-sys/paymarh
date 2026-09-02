-- DropForeignKey
ALTER TABLE "EmploiAffectationVersion" DROP CONSTRAINT "EmploiAffectationVersion_etablissementId_fkey";

-- CreateTable
CREATE TABLE "CompteurMatricule" (
    "companyId" UUID NOT NULL,
    "prefixe" TEXT NOT NULL DEFAULT '',
    "dernierNumero" INTEGER NOT NULL,

    CONSTRAINT "CompteurMatricule_pkey" PRIMARY KEY ("companyId","prefixe")
);

-- CreateTable
CREATE TABLE "CompteurNumeroOrdreEmploi" (
    "salarieId" UUID NOT NULL,
    "dernierNumero" INTEGER NOT NULL,

    CONSTRAINT "CompteurNumeroOrdreEmploi_pkey" PRIMARY KEY ("salarieId")
);

-- AddForeignKey
ALTER TABLE "CompteurMatricule" ADD CONSTRAINT "CompteurMatricule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteurNumeroOrdreEmploi" ADD CONSTRAINT "CompteurNumeroOrdreEmploi_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploiAffectationVersion" ADD CONSTRAINT "EmploiAffectationVersion_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
