/**
 * Fiche salarie — forme EXACTE renvoyee par la lecture d un salarie
 * (GET /salaries/:id, et les reponses d ecriture qui renvoient la fiche).
 *
 * C est l unique description de cette forme dans le projet. Le mapper de l API
 * annote son type de retour avec `FicheSalarie` : un champ renvoye mais non
 * declare ici, ou declare ici mais non renvoye, casse la compilation.
 *
 * Deux conventions a respecter en la faisant evoluer :
 *
 * 1. Les dates de la fiche sont des chaines de DATE SEULE ("2026-01-31"),
 *    pas des date-heure : ce sont des dates civiles (naissance, entree,
 *    sortie), sans heure ni fuseau. D ou `string` et non `IsoDateTime`.
 *
 * 2. Les montants sont des chaines et jamais des `number` : ils viennent de
 *    colonnes Decimal, ou l arrondi binaire d un flottant fausserait une paie.
 */
import type { Uuid } from './common';

/** Etat deduit du salarie — jamais stocke (voir deductions-salarie.ts). */
export type EtatSalarie = 'ACTIF' | 'INACTIF';

/** Etat deduit d une ligne de tableau repetable au mois en cours. */
export type EtatLigneFiche = 'ACTIVE' | 'INACTIVE';

export type SexePersonne = 'HOMME' | 'FEMME';

/** Situation familiale : le libelle est accorde en genre selon le sexe. */
export interface SituationFamilialeSalarie {
  readonly code: string | null;
  readonly libelle: string | null;
}

export interface PersonneACharge {
  readonly id: Uuid;
  readonly lienParenteCode: string;
  readonly prenom: string;
  readonly nom: string;
  readonly sexe: SexePersonne;
  readonly dateNaissance: string;
  readonly aCharge: boolean;
  readonly moisEffetDebut: string;
  readonly moisEffetFin: string | null;
  readonly etat: EtatLigneFiche;
  /**
   * Seule donnee de sante de la fiche. La cle est ABSENTE des lignes dont le
   * lien de parente n est pas ENFANT : la question ne se pose pas pour un
   * conjoint, elle n a donc pas a etre posee ni repondue.
   */
  readonly situationHandicap?: boolean;
}

export interface CompteBancaireSalarie {
  readonly id: Uuid;
  readonly banqueId: Uuid | null;
  readonly banqueLibreSaisie: string | null;
  readonly rib: string | null;
  readonly iban: string | null;
  readonly bic: string | null;
  readonly titulaire: string | null;
  /** Pourcentage vire sur ce compte ; null quand le salarie n a qu un compte. */
  readonly partVirement: string | null;
}

export interface PretSalarie {
  readonly id: Uuid;
  readonly libelleObjet: string;
  readonly libelleBulletin: string;
  readonly montantTotal: string;
  readonly moisDebut: string;
  readonly mensualite: string;
  readonly nombreEcheances: number;
  /** Deduit des bulletins deja calcules — jamais stocke. */
  readonly soldeRestant: string;
  readonly moisEffetDebut: string;
  readonly moisEffetFin: string | null;
  readonly etat: EtatLigneFiche;
}

export interface SaisieSurSalaire {
  readonly id: Uuid;
  readonly referenceDecision: string;
  readonly creancier: string;
  readonly libelleBulletin: string;
  readonly montantTotal: string;
  readonly montantMensuel: string;
  readonly moisDebut: string;
  readonly moisEffetDebut: string;
  readonly moisEffetFin: string | null;
  readonly etat: EtatLigneFiche;
}

/**
 * ECHAPPATOIRE TEMPORAIRE — A REMPLACER EN 2.1.c-3.
 *
 * La forme d un emploi de la fiche n est decrite nulle part et le back-office
 * ne lit pas encore `fiche.emplois`. La typer aujourd hui produirait un
 * contrat que personne ne consomme ; elle sera ecrite avec l ecran des
 * emplois (2.1.c-3), sur du code qui s en sert.
 *
 * L alias est nomme pour qu une simple recherche le retrouve : ne pas le
 * remplacer par un `Record<string, unknown>` anonyme.
 */
export type EmploiFicheNonType = Record<string, unknown>;

/**
 * ATTENTION AUX CLES OPTIONNELLES CI-DESSOUS.
 *
 * `comptesBancaires` est optionnelle parce que la reponse ne la contient PAS
 * quand l appelant n a pas le droit `salarie.remuneration.lire` : la cle est
 * retiree, pas videe (voir rubriques-remuneration.ts). Une cle a `null` dirait
 * « cette donnee existe et elle est vide » ; une cle absente ne dit rien du
 * tout. C est la difference exacte qu exige l etancheite de l information.
 *
 * Toute cle susceptible d etre retiree par le masquage de remuneration doit
 * donc etre declaree optionnelle, et jamais nullable.
 *
 * La fiche ne porte pas `operations` : ce sont les couches superieures de
 * l API qui l ajoutent, d ou `RessourceAvecOperations<FicheSalarie>` cote
 * client.
 */
export interface FicheSalarie {
  readonly id: Uuid;
  /** Verrouillage optimiste — a renvoyer en en-tete If-Match a l ecriture. */
  readonly version: number;
  readonly etat: EtatSalarie;
  readonly moisEnCours: string;
  /**
   * Sortie DU SALARIE, tous emplois confondus — deduite, jamais stockee.
   * Ne pas confondre avec la sortie d un emploi (emplois[].contrat.dateSortie),
   * qui est saisie et figure au solde de tout compte.
   * Vaut null tant qu un emploi reste ouvert, et quand le salarie n a aucun
   * emploi.
   */
  readonly dateSortie: string | null;
  readonly matricule: string;
  readonly nom: string;
  readonly prenom: string;
  readonly sexe: SexePersonne;
  readonly dateNaissance: string;
  readonly villeNaissance: string | null;
  readonly paysNaissanceId: Uuid | null;
  readonly nationaliteId: Uuid | null;
  /** Deduit de la nationalite : CIN pour le Maroc, carte de sejour sinon. */
  readonly typePieceIdentite: string | null;
  readonly situationFamiliale: SituationFamilialeSalarie;
  readonly numeroPiece: string | null;
  readonly numeroCnss: string | null;
  readonly numeroCimr: string | null;
  readonly adresse: string | null;
  readonly complementAdresse: string | null;
  readonly ville: string | null;
  readonly codePostal: string | null;
  readonly paysId: Uuid | null;
  readonly telephonePersonnel: string | null;
  readonly telephoneProfessionnel: string | null;
  readonly emailPersonnel: string | null;
  readonly emailProfessionnel: string | null;
  readonly urgencePrenom: string | null;
  readonly urgenceNom: string | null;
  readonly urgenceTelephone: string | null;
  readonly urgenceEmail: string | null;
  readonly dateEntree: string;
  readonly dateAnciennete: string;
  readonly emplois: readonly EmploiFicheNonType[];
  /** Personnes a charge au mois en cours — deduit, jamais stocke. */
  readonly nombrePersonnesACharge: number;
  readonly personnesACharge: readonly PersonneACharge[];
  /** Absente sans le droit salarie.remuneration.lire. */
  readonly comptesBancaires?: readonly CompteBancaireSalarie[];
  readonly prets: readonly PretSalarie[];
  readonly saisiesSurSalaire: readonly SaisieSurSalaire[];
}
