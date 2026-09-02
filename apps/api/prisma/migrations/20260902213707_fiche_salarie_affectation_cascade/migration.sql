-- DropForeignKey
ALTER TABLE "EmploiAffectationVersion" DROP CONSTRAINT "EmploiAffectationVersion_etablissementId_fkey";

-- AddForeignKey
ALTER TABLE "EmploiAffectationVersion" ADD CONSTRAINT "EmploiAffectationVersion_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
