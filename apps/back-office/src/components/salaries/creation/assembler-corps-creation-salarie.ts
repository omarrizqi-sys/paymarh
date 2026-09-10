import type { ValeursIdentite } from '@/components/salaries/fiche/rubrique-identite';
import type { ValeursIdentifiantsLegaux } from '@/components/salaries/fiche/rubrique-identifiants-legaux';
import type { ValeursCoordonnees } from '@/components/salaries/fiche/rubrique-coordonnees';
import type { ValeursDates } from '@/components/salaries/fiche/rubrique-dates';
import type { CorpsCreationSalarie } from '@/lib/api/salaries';

/**
 * Champ facultatif du DTO : une chaine vide (apres trim) est omise.
 *
 * @IsOptional n ignore que null/undefined. Une chaine vide ferait echouer
 * @IsUUID ; dateNaissance vide est omise (facultative, jamais envoyee vide).
 */
function facultatif(valeur: string): string | undefined {
  const trim = valeur.trim();
  return trim.length === 0 ? undefined : trim;
}

function sansClesIndefinies(corps: CorpsCreationSalarie): CorpsCreationSalarie {
  return Object.fromEntries(
    Object.entries(corps).filter(([, valeur]) => valeur !== undefined)
  ) as CorpsCreationSalarie;
}

export function assemblerCorpsCreationSalarie(
  identite: ValeursIdentite,
  identifiants: ValeursIdentifiantsLegaux,
  coordonnees: ValeursCoordonnees,
  dates: ValeursDates
): CorpsCreationSalarie {
  return sansClesIndefinies({
    nom: identite.nom,
    prenom: identite.prenom,
    sexe: identite.sexe,
    dateNaissance: facultatif(identite.dateNaissance),
    dateEntree: dates.dateEntree,
    matricule: facultatif(identifiants.matricule),
    villeNaissance: facultatif(identite.villeNaissance),
    paysNaissanceId: facultatif(identite.paysNaissanceId),
    nationaliteId: facultatif(identite.nationaliteId),
    situationFamilialeCode: facultatif(identite.situationFamilialeCode),
    numeroPiece: facultatif(identifiants.numeroPiece),
    numeroCnss: facultatif(identifiants.numeroCnss),
    numeroCimr: facultatif(identifiants.numeroCimr),
    adresse: facultatif(coordonnees.adresse),
    complementAdresse: facultatif(coordonnees.complementAdresse),
    ville: facultatif(coordonnees.ville),
    codePostal: facultatif(coordonnees.codePostal),
    paysId: facultatif(coordonnees.paysId),
    telephonePersonnel: facultatif(coordonnees.telephonePersonnel),
    telephoneProfessionnel: facultatif(coordonnees.telephoneProfessionnel),
    emailPersonnel: facultatif(coordonnees.emailPersonnel),
    emailProfessionnel: facultatif(coordonnees.emailProfessionnel),
    urgencePrenom: facultatif(coordonnees.urgencePrenom),
    urgenceNom: facultatif(coordonnees.urgenceNom),
    urgenceTelephone: facultatif(coordonnees.urgenceTelephone),
    urgenceEmail: facultatif(coordonnees.urgenceEmail),
    dateAnciennete: facultatif(dates.dateAnciennete),
  });
}
