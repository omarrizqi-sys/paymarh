import { Transform } from 'class-transformer';

/** Aligne le vide « espaces seuls » sur le trim deja applique au matricule. */
export function TrimSiChaine(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value
  );
}

/** Chaine vide (apres trim) → null, pour un champ facultatif. */
export function VideVersNull(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
  });
}
