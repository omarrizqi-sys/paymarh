import { ValidationError } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CODES_REFUS_FORME } from './codes-refus-forme.js';
import { traduireRefusForme } from './traduire-refus-forme.js';

function noeud(
  property: string,
  constraints: Record<string, string>,
  value?: unknown,
  children: ValidationError[] = []
): ValidationError {
  const erreur = new ValidationError();
  erreur.property = property;
  erreur.constraints = constraints;
  erreur.value = value;
  erreur.children = children;
  return erreur;
}

const MOTIF_ANGLAIS = /must be a|should not be empty|should not exist|isDateString/i;

describe('traduireRefusForme', () => {
  it('champ manquant → CHAMP_OBLIGATOIRE, message francais, champ designe', () => {
    const refus = traduireRefusForme([
      noeud('nom', { isNotEmpty: 'nom should not be empty' }, undefined),
    ]);
    expect(refus).toEqual({
      code: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.code,
      message: CODES_REFUS_FORME.CHAMP_OBLIGATOIRE.message,
      champ: 'nom',
    });
    expect(refus.message).not.toMatch(MOTIF_ANGLAIS);
  });

  it('champ vide → CHAMP_OBLIGATOIRE', () => {
    const refus = traduireRefusForme([
      noeud('prenom', { isNotEmpty: 'prenom should not be empty' }, ''),
    ]);
    expect(refus.code).toBe('CHAMP_OBLIGATOIRE');
    expect(refus.champ).toBe('prenom');
    expect(refus.message).not.toMatch(MOTIF_ANGLAIS);
  });

  it('champ inconnu → CHAMP_INTERDIT', () => {
    const refus = traduireRefusForme([
      noeud(
        'champInconnu',
        { whitelistValidation: 'property champInconnu should not exist' },
        true
      ),
    ]);
    expect(refus).toEqual({
      code: CODES_REFUS_FORME.CHAMP_INTERDIT.code,
      message: CODES_REFUS_FORME.CHAMP_INTERDIT.message,
      champ: 'champInconnu',
    });
    expect(refus.message).not.toMatch(MOTIF_ANGLAIS);
  });

  it('format invalide d une valeur presente → CARACTERE_NON_CONFORME', () => {
    const refus = traduireRefusForme([
      noeud(
        'dateEntree',
        { isDateString: 'dateEntree must be a valid ISO 8601 date string' },
        'pas-une-date'
      ),
    ]);
    expect(refus.code).toBe('CARACTERE_NON_CONFORME');
    expect(refus.champ).toBe('dateEntree');
    expect(refus.message).toBe(CODES_REFUS_FORME.CARACTERE_NON_CONFORME.message);
    expect(refus.message).not.toMatch(MOTIF_ANGLAIS);
  });

  it('date ISO vide → CHAMP_OBLIGATOIRE (valeur absente, pas un format)', () => {
    const refus = traduireRefusForme([
      noeud(
        'dateNaissance',
        { isDateString: 'dateNaissance must be a valid ISO 8601 date string' },
        ''
      ),
    ]);
    expect(refus.code).toBe('CHAMP_OBLIGATOIRE');
    expect(refus.champ).toBe('dateNaissance');
  });

  it('un seul champ designe : le premier du tableau, enfants d abord', () => {
    const refus = traduireRefusForme([
      noeud('nom', { isNotEmpty: 'nom should not be empty' }, ''),
      noeud('prenom', { isNotEmpty: 'prenom should not be empty' }, ''),
    ]);
    expect(refus.champ).toBe('nom');
  });

  it('noeud imbrique : designe le chemin du premier enfant en erreur', () => {
    const refus = traduireRefusForme([
      noeud('etablissementPrincipal', { nestedValidation: 'nested validation failed' }, {}, [
        noeud('ville', { isNotEmpty: 'ville should not be empty' }, ''),
      ]),
    ]);
    expect(refus.champ).toBe('etablissementPrincipal.ville');
    expect(refus.code).toBe('CHAMP_OBLIGATOIRE');
  });

  it('aucune chaine anglaise de class-validator ne figure dans le refus', () => {
    const cas: ValidationError[][] = [
      [noeud('a', { isString: 'a must be a string' }, 1)],
      [noeud('b', { isUuid: 'b must be a UUID' }, 'x')],
      [noeud('c', { isEnum: 'c must be one of the following values: A, B' }, 'Z')],
      [
        noeud(
          'd',
          { maxLength: 'd must be shorter than or equal to 200 characters' },
          'x'.repeat(201)
        ),
      ],
      [noeud('e', { whitelistValidation: 'property e should not exist' }, 1)],
    ];
    for (const erreurs of cas) {
      const refus = traduireRefusForme(erreurs);
      expect(JSON.stringify(refus)).not.toMatch(MOTIF_ANGLAIS);
    }
  });
});
