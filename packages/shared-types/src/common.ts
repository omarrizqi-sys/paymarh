/**
 * Briques de base reutilisees par tous les types partages.
 *
 * Rappel de convention (docs/CONVENTIONS.md) : les identifiants techniques
 * sont en anglais. Le francais est reserve aux termes metier reglementaires
 * marocains (salarie, bulletin, cotisationCNSS, IR...). Les commentaires,
 * eux, sont en francais.
 */

/**
 * Identifiant technique d une ressource (UUID genere par PostgreSQL).
 * On garde un alias nomme plutot que `string` brut : cela rend les signatures
 * de fonction lisibles et permettra, si besoin, de renforcer le typage plus
 * tard sans toucher aux appels existants.
 */
export type Uuid = string;

/**
 * Date-heure serialisee au format ISO 8601 (ex. "2026-01-31T23:59:59.000Z").
 *
 * Regle : l API expose TOUJOURS des dates sous forme de chaine ISO en UTC,
 * jamais d objet `Date`. C est le client (back-office) qui se charge de
 * l affichage dans le fuseau local. Cela evite les decalages de date sur les
 * periodes de paie, ou un jour d ecart change le mois de rattachement.
 */
export type IsoDateTime = string;

/**
 * Champs de tracabilite presents sur toutes les entites persistees.
 */
export interface Timestamps {
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

/**
 * Enveloppe standard des listes renvoyees par l API.
 * Meme au module 0 ou les volumes sont nuls, on fige le format : les ecrans
 * futurs (listes de salaries, de bulletins) s appuieront dessus sans casse.
 */
export interface ListResponse<T> {
  readonly items: readonly T[];
  readonly total: number;
}

/**
 * Avertissement non bloquant accompagne d une reponse de succes.
 */
export interface ApiWarning {
  readonly code: string;
  readonly champ?: string;
  readonly message: string;
}

/**
 * Enveloppe standard : donnees + avertissements.
 * Une reponse peut etre un succes avec des warnings (ex. RIB trop court).
 */
export interface ApiResponse<T> {
  readonly data: T;
  readonly warnings: readonly ApiWarning[];
}

/**
 * Alerte non bloquante dans une reponse d ecriture fiche salarie.
 */
export interface AlerteApi {
  readonly code: string;
  readonly champ?: string;
  readonly message: string;
  /**
   * Position de la ligne concernee DANS LE TABLEAU ENVOYE PAR LE CLIENT,
   * numerotee a partir de 0. Ce n est PAS un identifiant de ligne en base :
   * au moment de la validation, une ligne nouvelle n en a pas encore.
   *
   * Renseignee uniquement par le remplacement global des comptes bancaires
   * (PUT /salaries/:id/comptes-bancaires), seule ecriture qui traite plusieurs
   * lignes en un appel et ou l alerte serait sinon impossible a rattacher.
   * Absente partout ailleurs : sur une route ligne par ligne, la reponse ne
   * peut concerner que la ligne envoyee.
   */
  readonly indexLigne?: number;
  /** Identifiant d un salarie existant (alerte de reembauche). */
  readonly salarieExistantId?: string;
}

/**
 * Enveloppe standard des reponses d ecriture fiche salarie (etape 2.1.b).
 */
export interface ReponseEcriture<T> {
  readonly donnees: T;
  readonly alertes: readonly AlerteApi[];
}
