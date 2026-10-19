import { ValidateBy, type ValidationOptions } from 'class-validator';

export const CONTRAINTE_DECIMAL_BORNE = 'estDecimalBorne';

/**
 * Chaine destinee a une colonne `Decimal(p, 2)` : non signee, point decimal,
 * au plus deux decimales (une troisieme est refusee, jamais arrondie), sans
 * exposant, partie entiere d au plus `chiffresPartieEntiere` = p - 2 chiffres.
 * La chaine vide est refusee comme non conforme : seul `null` vaut « vide ».
 */
export function EstDecimalBorne(
  chiffresPartieEntiere: number,
  options?: ValidationOptions
): PropertyDecorator {
  const motif = new RegExp(`^\\d{1,${chiffresPartieEntiere}}(\\.\\d{1,2})?$`);
  return ValidateBy(
    {
      name: CONTRAINTE_DECIMAL_BORNE,
      constraints: [chiffresPartieEntiere],
      validator: {
        validate: (valeur: unknown) => typeof valeur === 'string' && motif.test(valeur),
        defaultMessage: () => CONTRAINTE_DECIMAL_BORNE,
      },
    },
    options
  );
}
