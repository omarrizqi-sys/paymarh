import type { AlerteApi } from '@paymarh/shared-types';
import { MessagesChamp } from '@/components/formulaire/messages-champ';
import { MessagesAlerteChamp } from '@/components/salaries/formulaire/messages-alerte-salarie';

/** Erreur de refus et alertes sans nom de champ, en tete du bloc qui les a produites. */
export function TeteRubriqueFiche({
  erreur,
  alertes,
  testidErreur,
  testidAlertes,
}: {
  readonly erreur?: string;
  readonly alertes: readonly AlerteApi[];
  readonly testidErreur?: string;
  readonly testidAlertes?: string;
}) {
  const sansChamp = alertes.filter((alerte) => !alerte.champ);

  return (
    <div className="space-y-2">
      {erreur ? (
        <div data-testid={testidErreur}>
          <MessagesChamp erreur={erreur} />
        </div>
      ) : null}
      {sansChamp.length > 0 ? (
        <div data-testid={testidAlertes}>
          <MessagesAlerteChamp alertes={sansChamp} />
        </div>
      ) : null}
    </div>
  );
}
