import type { Prisma } from '../../generated/prisma/client.js';
import {
  deduireEtatSalarie,
  deduireLibelleSituationFamiliale,
  deduireTypePieceIdentite,
} from '../deductions-salarie.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

type SalarieAvecRelations = Prisma.SalarieGetPayload<{
  include: {
    nationalite: { select: { codeIso: true } };
    situationFamiliale: { select: { code: true; libelleMasculin: true; libelleFeminin: true } };
    pays: { select: { codeIso: true } };
  };
}>;

function formaterDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function versFicheSalarie(
  prisma: PrismaService,
  salarie: SalarieAvecRelations,
  moisEnCours: string
) {
  const etat = await deduireEtatSalarie(prisma, salarie.id);
  const typePieceIdentite = deduireTypePieceIdentite(salarie.nationalite?.codeIso ?? null);

  let situationFamiliale: {
    code: string | null;
    libelle: string | null;
  } = { code: null, libelle: null };

  if (salarie.situationFamiliale !== null && salarie.situationFamilialeCode !== null) {
    situationFamiliale = {
      code: salarie.situationFamilialeCode,
      libelle: deduireLibelleSituationFamiliale(
        salarie.sexe,
        salarie.situationFamiliale.libelleMasculin,
        salarie.situationFamiliale.libelleFeminin
      ),
    };
  } else if (salarie.situationFamilialeCode !== null) {
    situationFamiliale = { code: salarie.situationFamilialeCode, libelle: null };
  }

  return {
    id: salarie.id,
    version: salarie.version,
    etat,
    moisEnCours,
    matricule: salarie.matricule,
    nom: salarie.nom,
    prenom: salarie.prenom,
    sexe: salarie.sexe,
    dateNaissance: formaterDate(salarie.dateNaissance),
    villeNaissance: salarie.villeNaissance,
    paysNaissanceId: salarie.paysNaissanceId,
    nationaliteId: salarie.nationaliteId,
    typePieceIdentite,
    situationFamiliale,
    numeroPiece: salarie.numeroPiece,
    numeroCnss: salarie.numeroCnss,
    numeroCimr: salarie.numeroCimr,
    adresse: salarie.adresse,
    complementAdresse: salarie.complementAdresse,
    ville: salarie.ville,
    codePostal: salarie.codePostal,
    paysId: salarie.paysId,
    telephonePersonnel: salarie.telephonePersonnel,
    telephoneProfessionnel: salarie.telephoneProfessionnel,
    emailPersonnel: salarie.emailPersonnel,
    emailProfessionnel: salarie.emailProfessionnel,
    urgencePrenom: salarie.urgencePrenom,
    urgenceNom: salarie.urgenceNom,
    urgenceTelephone: salarie.urgenceTelephone,
    urgenceEmail: salarie.urgenceEmail,
    dateEntree: formaterDate(salarie.dateEntree),
    dateAnciennete: formaterDate(salarie.dateAnciennete),
    emplois: [] as readonly unknown[],
    personnesACharge: [] as readonly unknown[],
    comptesBancaires: [] as readonly unknown[],
    prets: [] as readonly unknown[],
    saisiesSurSalaire: [] as readonly unknown[],
  };
}

export function versLigneListeSalarie(
  salarie: Pick<Prisma.Salarie, 'id' | 'matricule' | 'nom' | 'prenom'>,
  etat: 'ACTIF' | 'INACTIF'
) {
  return {
    id: salarie.id,
    matricule: salarie.matricule,
    nom: salarie.nom,
    prenom: salarie.prenom,
    etat,
  };
}

export const INCLUDE_FICHE_SALARIE = {
  nationalite: { select: { codeIso: true } },
  situationFamiliale: {
    select: { code: true, libelleMasculin: true, libelleFeminin: true },
  },
  pays: { select: { codeIso: true } },
} as const;
