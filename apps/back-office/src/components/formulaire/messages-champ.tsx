import type { ApiWarning } from '@paymarh/shared-types';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  readonly erreur?: string;
  readonly avertissements?: readonly ApiWarning[];
  readonly champ?: string;
}

/** Affiche erreur bloquante et avertissements non bloquants pres d un champ. */
export function MessagesChamp({ erreur, avertissements = [], champ }: Props) {
  const warningsDuChamp = avertissements.filter((w) => !champ || w.champ === champ);

  return (
    <div className="space-y-1">
      {erreur ? (
        <p className="text-destructive text-sm" role="alert">
          {erreur}
        </p>
      ) : null}
      {warningsDuChamp.map((w) => (
        <Alert key={`${w.code}-${w.champ ?? ''}-${w.message}`} variant="warning" className="py-2">
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

/** Registre global des avertissements sans champ associe. */
export function RegistreAvertissements({
  avertissements,
}: {
  readonly avertissements: readonly ApiWarning[];
}) {
  const globaux = avertissements.filter((w) => !w.champ);
  if (globaux.length === 0) return null;

  return (
    <div className="space-y-2">
      {globaux.map((w) => (
        <Alert key={`${w.code}-${w.message}`} variant="warning">
          <AlertDescription>{w.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
