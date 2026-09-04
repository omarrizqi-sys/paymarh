import type { AlerteApi } from '@paymarh/shared-types';
import { Alert, AlertDescription } from '@/components/ui/alert';

/** Registre global des alertes non bloquantes fiche salarie. */
export function RegistreAlertesSalarie({ alertes }: { readonly alertes: readonly AlerteApi[] }) {
  const globales = alertes.filter((alerte) => !alerte.champ);
  if (globales.length === 0) return null;

  return (
    <div className="space-y-2">
      {globales.map((alerte) => (
        <Alert key={`${alerte.code}-${alerte.message}`} variant="warning">
          <AlertDescription>{alerte.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

/** Alertes non bloquantes pres d un champ de rubrique salarie. */
export function MessagesAlerteChamp({
  alertes = [],
  champ,
}: {
  readonly alertes?: readonly AlerteApi[];
  readonly champ?: string;
}) {
  const duChamp = alertes.filter((alerte) => !champ || alerte.champ === champ);
  if (duChamp.length === 0) return null;

  return (
    <div className="space-y-1">
      {duChamp.map((alerte) => (
        <Alert
          key={`${alerte.code}-${alerte.champ ?? ''}-${alerte.message}`}
          variant="warning"
          className="py-2"
        >
          <AlertDescription>{alerte.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
