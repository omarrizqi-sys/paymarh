import type { AlerteApi } from '@paymarh/shared-types';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { deduireEtatSalarie } from './deductions-salarie.js';
import { CODES_REPONSE } from './reponses/codes-reponse.js';

export interface SaisieRapprochement {
  readonly companyId: string;
  readonly nom?: string | null;
  readonly prenom?: string | null;
  readonly dateNaissance?: Date | null;
  readonly numeroPiece?: string | null;
  readonly exclureSalarieId?: string;
}

export async function calculerAlertesRapprochement(
  prisma: PrismaClient,
  saisie: SaisieRapprochement
): Promise<AlerteApi[]> {
  const alertes: AlerteApi[] = [];

  if (
    typeof saisie.nom === 'string' &&
    saisie.nom.trim().length > 0 &&
    typeof saisie.prenom === 'string' &&
    saisie.prenom.trim().length > 0
  ) {
    const homonymes = await prisma.salarie.findMany({
      where: {
        companyId: saisie.companyId,
        nom: saisie.nom,
        prenom: saisie.prenom,
        ...(saisie.exclureSalarieId !== undefined ? { id: { not: saisie.exclureSalarieId } } : {}),
      },
      select: { id: true },
    });

    for (const candidat of homonymes) {
      const etat = await deduireEtatSalarie(prisma, candidat.id);
      if (etat === 'ACTIF') {
        alertes.push({
          code: CODES_REPONSE.HOMONYME.code,
          champ: 'nom',
          message: CODES_REPONSE.HOMONYME.message,
        });
        break;
      }
    }
  }

  const candidatsReembauche = await prisma.salarie.findMany({
    where: {
      companyId: saisie.companyId,
      ...(saisie.exclureSalarieId !== undefined ? { id: { not: saisie.exclureSalarieId } } : {}),
      ...(saisie.numeroPiece !== null &&
      saisie.numeroPiece !== undefined &&
      saisie.numeroPiece.trim().length > 0
        ? { numeroPiece: saisie.numeroPiece }
        : {
            nom: saisie.nom ?? undefined,
            prenom: saisie.prenom ?? undefined,
            dateNaissance: saisie.dateNaissance ?? undefined,
          }),
    },
    select: { id: true },
  });

  for (const candidat of candidatsReembauche) {
    const etat = await deduireEtatSalarie(prisma, candidat.id);
    if (etat === 'INACTIF') {
      alertes.push({
        code: CODES_REPONSE.REEMBAUCHE.code,
        message: CODES_REPONSE.REEMBAUCHE.message,
        salarieExistantId: candidat.id,
      });
      break;
    }
  }

  return alertes;
}
