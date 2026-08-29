import type { Decimal } from 'decimal.js';
import type { Uuid } from '@paymarh/shared-types';

// ---------------------------------------------------------------------------
// CONTRAT DU MOTEUR DE PAIE
//
// Ce fichier ne contient QUE des types. Il n y a, et il n y aura jamais, de
// lecture ni d ecriture en base ici. Voir README.md de ce dossier.
//
// ETAT AU MODULE 0 : le contrat est volontairement minimal. Il sera enrichi
// module par module (rubriques, cotisations, IR, absences...). Ce qui est
// fige des maintenant, c est la FORME : des donnees en entree, un resultat en
// sortie, rien d autre.
// ---------------------------------------------------------------------------

/**
 * Periode de paie traitee, exprimee en mois civil.
 * Le Maroc raisonne en mois de paie : on ne modelise donc ni semaine ni
 * quinzaine.
 */
export interface PeriodePaie {
  /** Annee sur 4 chiffres, ex. 2026. */
  readonly annee: number;

  /** Mois de 1 (janvier) a 12 (decembre). */
  readonly mois: number;
}

/**
 * TOUT ce dont le moteur a besoin pour calculer.
 *
 * Le moteur ne va rien chercher : ce qui n est pas dans cet objet n existe
 * pas pour lui. C est la condition pour qu il reste pur et reproductible.
 *
 * VIDE DE METIER AU MODULE 0 : les champs de salaire, rubriques, absences et
 * bareme d IR seront ajoutes par les modules correspondants.
 */
export interface EntreeCalculPaie {
  readonly periode: PeriodePaie;

  /** Societe concernee : sert a la tracabilite du resultat, pas au calcul. */
  readonly companyId: Uuid;

  /** Salarie concerne. */
  readonly salarieId: Uuid;
}

/**
 * Ce que le moteur rend.
 *
 * VIDE DE METIER AU MODULE 0 : les lignes de bulletin, le net a payer, les
 * cotisations CNSS/AMO et l IR viendront avec leurs modules.
 */
export interface ResultatCalculPaie {
  readonly periode: PeriodePaie;
  readonly salarieId: Uuid;

  /**
   * Tout montant est un Decimal, JAMAIS un `number`.
   * Voir docs/CONVENTIONS.md, regle du decimal exact.
   */
  readonly montants: Readonly<Record<string, Decimal>>;
}

/**
 * LA signature du moteur de paie.
 *
 * Noter ce qui n y figure pas : aucun client de base de donnees, aucun
 * service, aucune promesse. Le calcul est synchrone et deterministe - deux
 * appels avec la meme entree rendent exactement le meme resultat.
 */
export type MoteurDePaie = (entree: EntreeCalculPaie) => ResultatCalculPaie;
