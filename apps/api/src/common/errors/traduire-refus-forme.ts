import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { CODES_REFUS_FORME } from './codes-refus-forme.js';

export interface RefusForme {
  readonly code: string;
  readonly message: string;
  readonly champ: string;
}

const CONTRAINTES_OBLIGATOIRES = new Set([
  'isNotEmpty',
  'isDefined',
  'isNotEmptyObject',
  'arrayNotEmpty',
]);

function estValeurAbsente(valeur: unknown): boolean {
  if (valeur === undefined || valeur === null) return true;
  if (typeof valeur === 'string' && valeur.trim() === '') return true;
  if (Array.isArray(valeur) && valeur.length === 0) return true;
  return false;
}

function contraintesDuNoeud(erreur: ValidationError): string[] {
  return Object.keys(erreur.constraints ?? {});
}

/**
 * Un seul champ designe par refus. Ordre : parcours en profondeur du tableau
 * renvoye par class-validator (enfants d un noeud avant ses propres
 * contraintes, puis noeud suivant). Cet ordre suit, pour un DTO plat, l ordre
 * de declaration des proprietes — c est la regle retenue (ADR 0029).
 *
 * Priorite des contraintes d un meme champ : hors liste, puis absence/vide,
 * puis le reste (type, format, bornes).
 */
function traduireContraintes(champ: string, erreur: ValidationError): RefusForme {
  const contraintes = contraintesDuNoeud(erreur);
  if (contraintes.includes('whitelistValidation')) {
    return {
      code: CODES_REFUS_FORME.CHAMP_INTERDIT.code,
      message: CODES_REFUS_FORME.CHAMP_INTERDIT.message,
      champ,
    };
  }
  if (contraintes.some((c) => CONTRAINTES_OBLIGATOIRES.has(c)) || estValeurAbsente(erreur.value)) {
    return {
      code: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.code,
      message: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.message,
      champ,
    };
  }
  return {
    code: CODES_REFUS_FORME.CARACTERE_NON_CONFORME.code,
    message: CODES_REFUS_FORME.CARACTERE_NON_CONFORME.message,
    champ,
  };
}

function premierNoeud(erreurs: ValidationError[], prefixe = ''): RefusForme | undefined {
  for (const erreur of erreurs) {
    const champ = prefixe.length > 0 ? `${prefixe}.${erreur.property}` : erreur.property;
    const enfants = erreur.children ?? [];
    if (enfants.length > 0) {
      const depuisEnfant = premierNoeud(enfants, champ);
      if (depuisEnfant !== undefined) return depuisEnfant;
    }
    if (contraintesDuNoeud(erreur).length > 0) {
      return traduireContraintes(champ, erreur);
    }
  }
  return undefined;
}

export function traduireRefusForme(erreurs: ValidationError[]): RefusForme {
  const refus = premierNoeud(erreurs);
  if (refus === undefined) {
    return {
      code: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.code,
      message: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.message,
      champ: 'body',
    };
  }
  return refus;
}

export function exceptionRefusForme(erreurs: ValidationError[]): BadRequestException {
  return new BadRequestException(traduireRefusForme(erreurs));
}
