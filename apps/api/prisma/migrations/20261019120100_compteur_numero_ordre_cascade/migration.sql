-- Le compteur de numero d ordre d emploi suit le salarie : la suppression du
-- salarie le supprime dans la meme instruction. Le compteur n est jamais
-- decremente tant que le salarie existe.

ALTER TABLE "CompteurNumeroOrdreEmploi" DROP CONSTRAINT "CompteurNumeroOrdreEmploi_salarieId_fkey";

ALTER TABLE "CompteurNumeroOrdreEmploi" ADD CONSTRAINT "CompteurNumeroOrdreEmploi_salarieId_fkey" FOREIGN KEY ("salarieId") REFERENCES "Salarie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
